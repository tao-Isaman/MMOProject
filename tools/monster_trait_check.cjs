// Checks the monsters' own builds (src/bestiary.ts: each MonsterDef's stats, docs/monster_traits_plan.md): compiles
// the bestiary, stats and progression with tsc into a temporary folder, loads them in node and
// reports:
//   - what stands out in each build (bestiary.ts standouts) and how often each strength is used:
//     every one at least MIN_USES times, every monster at least one, a rare one two, a boss three
//   - each field's spread: a field with 5 or more monsters shows at least 3 different strengths,
//     and no two of one kind in a field are built alike
//   - each monster's power against a plain one of its level and kind (its rating: the damage it
//     deals a reference player times how long it lasts against her), which must stay between
//     0.8 and 1.3 (0.9-1.15 is the aim; outside that is only noted)
//   - the limits: multipliers within bestiary.ts CLAMP, walking speed chased at CHASE_PACE under
//     330 cm/s, a bite no quicker than 1 s, a crit chance within MAX_CRIT
//   - hit chances: the player's against an evasive build never down at the 5% floor (she keeps
//     at least MIN_HIT), an accurate build's against a player with decent evasion never 100%
// The reference players come from the game's own tables (progression.ts CLASSES, JOBS; items.ts):
//   attacker: a warrior with no gear (hit), half her damage physical and half spells
//   plain:    a warrior with no gear (flee, def, mdef)
//   evasive:  an archer turned thief (from level 35) in the feather hat and the swift shoes
// Usage: node tools/monster_trait_check.cjs   (exits 1 when a rule is broken)
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "monstercheck-"));
try {
  execSync(`npx tsc src/bestiary.ts src/stats.ts src/progression.ts --ignoreConfig --outDir ${out} --module commonjs --target es2022 --skipLibCheck --lib es2022,dom --noCheck`, { cwd: root, stdio: "pipe" });
} catch (e) {
  // tsc still writes the files with --noCheck; only stop if nothing came out
  if (!fs.existsSync(path.join(out, "bestiary.js"))) {
    console.log(String(e.stdout || e));
    process.exit(1);
  }
}
global.localStorage = { getItem: () => null, setItem: () => {} };
const B = require(path.join(out, "bestiary.js"));
const S = require(path.join(out, "stats.js"));
const P = require(path.join(out, "progression.js"));
const { ITEMS } = require(path.join(out, "items.js"));
fs.rmSync(out, { recursive: true, force: true });

// monsters.ts can't load in node (it draws): read its walking speeds, chase pace, bite time and
// the shots that aren't spells from its source
const msrc = fs.readFileSync(path.join(root, "src/monsters.ts"), "utf8");
const KIND_SPEED = Object.fromEntries([...msrc.matchAll(/^\s+(\w+): \{ weight: [\d.]+, speed: (\d+)/gm)].map((m) => [m[1], +m[2]]));
const CHASE_PACE = +msrc.match(/const CHASE_PACE = ([\d.]+)/)[1];
const BITE_TIME = +msrc.match(/const BITE_TIME = ([\d.]+)/)[1];
const PHYSICAL_SHOTS = new Set(JSON.parse(msrc.match(/const PHYSICAL_SHOTS = new Set\((\[[^\]]*\])/)[1]));

const MIN_USES = 8;
const MIN_HIT = 0.15;
const RATING_OK = [0.8, 1.3], RATING_AIM = [0.9, 1.15];
const errors = [], notes = [];

// ---- the reference players ----
const grow = (c, key, L) => (c.base[key] ?? 0) + (c.growth[key] ?? 0) * (L - 1);
const job = (j, key, L) => (L >= P.JOB_LEVEL ? (j.bonus[key] ?? 0) + (j.growth[key] ?? 0) * (L - P.JOB_LEVEL) : 0);
const W = P.CLASSES.warrior, A = P.CLASSES.archer, T = P.JOBS.thief;
const attackerHit = (L) => grow(W, "hit", L);
const plain = (L) => ({ flee: grow(W, "flee", L), def: grow(W, "def", L), mdef: grow(W, "mdef", L) });
const evasive = (L) => ({
  flee: grow(A, "flee", L) + job(T, "flee", L) + (ITEMS.hat_feather.stats.flee ?? 0) + (ITEMS.shoes_swift.stats.flee ?? 0),
  def: grow(A, "def", L), mdef: grow(A, "mdef", L),
});

// ---- a monster's rating ----
const dodgeFlee = (m, L) => (B.behaviour(m, "dodge") !== null ? (2 + 1.5 * L) * 1.6 : 0);
const baseMagic = (m) => {
  const r = B.behaviour(m, "ranged");
  return m.kind === "caster" || (r !== null && !PHYSICAL_SHOTS.has(r));
};
function numbers(m, profile) {
  const s = B.statsFor(m.level, m.kind, profile);
  return { ...s, flee: Math.max(dodgeFlee(m, m.level), s.flee), magical: baseMagic(m) || s.magical };
}
function dealt(s, d) {
  const c = s.crit, hc = S.hitChance(s.accuracy, d.flee), D = s.magical ? d.mdef : d.def;
  return ((1 - c) * hc * S.mitigate(s.atk, D) + c * (1 + s.critDmg) * S.mitigate(s.atk, D, S.CRIT_PIERCE)) / s.biteTime;
}
function rating(m) {
  const L = m.level;
  const power = (s) => {
    const offence = (dealt(s, plain(L)) + dealt(s, evasive(L))) / 2;
    const taken = 0.5 * S.hitChance(attackerHit(L), s.flee) * S.mitigate(1, s.def) + 0.5 * S.mitigate(1, s.mdef);
    return offence * (s.hp / taken);
  };
  return power(numbers(m, m.stats ?? {})) / power(numbers(m, {}));
}

// --try <level> <kind> '<profile json>' [...]: weigh builds without touching the bestiary
const at = process.argv.indexOf("--try");
if (at > 0) {
  const a = process.argv.slice(at + 1);
  for (let i = 0; i + 2 < a.length; i += 3) {
    const m = { id: "try", level: +a[i], kind: a[i + 1], behave: [], stats: JSON.parse(a[i + 2]) };
    console.log(`L${m.level} ${m.kind} ${a[i + 2]}: ${rating(m).toFixed(3)}`);
  }
  process.exit(0);
}

// ---- go through them ----
const uses = Object.fromEntries(["strong", "fast", "tough", "magic", "evasive", "accurate", "crit"].map((k) => [k, 0]));
const rows = [];
for (const m of B.MONSTERS) {
  const p = m.stats ?? {}, dodge = B.behaviour(m, "dodge") !== null;
  const so = B.standouts(p, dodge);
  for (const k of so) uses[k]++;
  if (!Object.keys(p).length) errors.push(`${m.id}: no stats (its build) in bestiary.ts`);
  if (!so.length) errors.push(`${m.id}: nothing stands out in its build`);
  const need = m.kind === "boss" ? 3 : m.kind === "rare" ? 2 : 1;
  if (so.length < need) errors.push(`${m.id} (${m.kind}): ${so.length} strengths, wants ${need}`);
  for (const [k, cap] of Object.entries(B.CLAMP)) if ((p[k] ?? 1) > cap) errors.push(`${m.id}: ${k} x${p[k]} over the clamp ${cap}`);
  if ((p.crit ?? 0) > B.MAX_CRIT) errors.push(`${m.id}: crit ${p.crit} over ${B.MAX_CRIT}`);
  const walk = KIND_SPEED[m.kind] * Math.min(B.CLAMP.speed, p.speed ?? 1);
  if (walk * CHASE_PACE > 330) errors.push(`${m.id}: chases at ${Math.round(walk * CHASE_PACE)} cm/s (over 330)`);
  if (BITE_TIME * (p.biteTime ?? 1) < 1) errors.push(`${m.id}: bites every ${(BITE_TIME * p.biteTime).toFixed(2)} s (under 1 s)`);
  const s = numbers(m, p);
  if ((p.flee ?? 0) > 0 && S.hitChance(attackerHit(m.level), s.flee) < MIN_HIT && !dodge)
    errors.push(`${m.id}: the player hits it ${pct(S.hitChance(attackerHit(m.level), s.flee))} of the time (under ${pct(MIN_HIT)})`);
  if ((p.accuracy ?? 0) > 0 && S.hitChance(s.accuracy, evasive(m.level).flee) >= 1)
    errors.push(`${m.id}: never misses even an evasive player (accuracy ${s.accuracy} vs ${Math.round(evasive(m.level).flee)})`);
  const r = rating(m);
  if (r < RATING_OK[0] || r > RATING_OK[1]) errors.push(`${m.id}: rating ${r.toFixed(2)} outside ${RATING_OK.join("-")}`);
  else if (r < RATING_AIM[0] || r > RATING_AIM[1]) notes.push(`${m.id}: rating ${r.toFixed(2)} (aim ${RATING_AIM.join("-")})`);
  rows.push({ m, so, r });
}
for (const [k, n] of Object.entries(uses)) if (n < MIN_USES) errors.push(`strength "${k}" used ${n} times (wants ${MIN_USES})`);

// fields: their own monsters and their visitors
const fields = [...new Set([...B.MONSTERS.map((m) => m.field), ...B.VISITORS.map((v) => v.field)])];
const spread = [];
for (const f of fields) {
  const here = B.fieldMonsters(f);
  const sets = here.map((m) => ({ m, key: B.standouts(m.stats ?? {}, B.behaviour(m, "dodge") !== null).sort().join("+") }));
  const kinds = new Set(sets.flatMap((x) => x.key.split("+")));
  if (here.length >= 5 && kinds.size < 3) errors.push(`${f}: only ${kinds.size} strengths among ${here.length} monsters`);
  for (let i = 0; i < sets.length; i++)
    for (let j = i + 1; j < sets.length; j++)
      if (sets[i].key === sets[j].key && sets[i].m.kind === sets[j].m.kind)
        errors.push(`${f}: ${sets[i].m.id} and ${sets[j].m.id} are both ${sets[i].m.kind} and ${sets[i].key}`);
  if (here.length >= 5) spread.push(`${f} (${here.length}): ${[...kinds].join(", ")}`);
}

// ---- report ----
function pct(x) {
  return `${Math.round(x * 100)}%`;
}
console.log(`Monsters: ${B.MONSTERS.length}`);
console.log(`Strengths used: ${Object.entries(uses).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
console.log(`Fields of 5+: ${spread.join(" | ")}`);
const rs = rows.map((x) => x.r).sort((a, b) => a - b);
const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
console.log(`Rating: min ${rs[0].toFixed(2)} · median ${rs[rs.length >> 1].toFixed(2)} · mean ${mean.toFixed(3)} · max ${rs[rs.length - 1].toFixed(2)} · in aim ${rs.filter((r) => r >= RATING_AIM[0] && r <= RATING_AIM[1]).length}/${rs.length}`);
const byStrength = {};
for (const { so, r } of rows) for (const k of so) (byStrength[k] ??= []).push(r);
console.log(`Rating by strength: ${Object.entries(byStrength).map(([k, v]) => `${k} ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)}`).join(" · ")}`);
if (process.argv.includes("--all")) for (const { m, so, r } of rows) console.log(`  ${m.id.padEnd(20)} L${String(m.level).padEnd(4)} ${m.kind.padEnd(7)} ${r.toFixed(2)}  ${so.join("+")}`);

// hit chances at levels 10/50/100/200, with the biggest evasion and accuracy bonus used near each
console.log("\nHit chances (player = warrior, no gear; evasive player = archer/thief, feather hat, swift shoes):");
console.log("  level | player vs plain | vs evasive build (bonus) | vs dodger | monster vs plain | vs evasive player | accurate vs evasive (bonus)");
for (const L of [10, 50, 100, 200]) {
  const near = B.MONSTERS.filter((m) => Math.abs(m.level - L) <= 30);
  const fb = Math.max(0, ...near.map((m) => m.stats?.flee ?? 0)), ab = Math.max(0, ...near.map((m) => m.stats?.accuracy ?? 0));
  const aim = B.baseAim(L), h = attackerHit(L);
  const c = [S.hitChance(h, aim.flee), S.hitChance(h, aim.flee + fb), S.hitChance(h, aim.flee * 1.6),
    S.hitChance(aim.accuracy, plain(L).flee), S.hitChance(aim.accuracy, evasive(L).flee), S.hitChance(aim.accuracy + ab, evasive(L).flee)];
  console.log(`  ${String(L).padStart(5)} | ${pct(c[0]).padStart(15)} | ${`${pct(c[1])} (+${fb})`.padStart(24)} | ${pct(c[2]).padStart(9)} | ${pct(c[3]).padStart(16)} | ${pct(c[4]).padStart(17)} | ${`${pct(c[5])} (+${ab})`.padStart(27)}`);
  if (fb && c[1] < MIN_HIT) errors.push(`level ${L}: an evasive build (+${fb}) leaves the player ${pct(c[1])}`);
  if (ab && c[5] >= 1) errors.push(`level ${L}: an accurate build (+${ab}) never misses an evasive player`);
}
console.log("  (a dodger, behave \"dodge\", was already this hard to hit before the builds; not counted against them)");

if (notes.length) console.log(`\nNotes (outside the aim, inside the limits):\n  ${notes.join("\n  ")}`);
if (errors.length) {
  console.log(`\n${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log("\nAll monster builds OK.");
