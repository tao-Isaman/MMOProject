// Checks the skill trees (src/progression.ts with src/trees/*): compiles them with tsc into a
// temporary folder, loads them in node and reports what would break or read wrong in the game:
//   - a class tree without TREE_SKILLS[1] skills, a job branch without TREE_SKILLS[2], a third
//     job's branch without TREE_SKILLS[3], a fourth job's without TREE_SKILLS[4] (a job's branch
//     may be a stub, `stub: true`, with none yet: its job isn't offered until it is written)
//   - a tree that isn't laid out on the 4 x 4 grid (columns 0-3, rows 0-3), two nodes on one
//     spot, a prerequisite outside the tree or not on a higher row, a rank asked for that the
//     prerequisite can't reach, a max other than 1, 5 or 10
//   - a glyph src/icons.ts can't draw, an unknown weapon, element or kind of monster
//   - an active without a skill, a passive without stats, a desc or number that comes out as
//     NaN, undefined or not a number at some rank, a skill type skills.ts doesn't know
//   - a job branch or book the jobs tables (JOBS, JOBS3, JOBS4) and the trees disagree about
//   - the third jobs' riders: an ally kind, a combo after a skill that doesn't exist, an autocast
//     of one that doesn't, a terrain kind or a made item that isn't there
// and, run without ids, the masteries and the elements:
//   - a weapon without a mastery or without its in-hand picture (public/assets/weapons/<id>.png),
//     a mastery for an unknown weapon, an unknown glyph or stat, a reward skill that's broken
//   - an element missing from ELEMENT_IDS or ELEMENTS, an unknown glyph or stat, milestones out
//     of order, and the balance: every element's line weighed in points (ELEMENT_WORTH, README
//     "ธาตุ") must come to within 8% of the others' at 50 and at 100, with at least a quarter of
//     its every-level stats on its lesser side (attack or defence)
// Usage: node tools/tree_check.cjs [tree id ...]   (no ids: every tree, mastery and element)
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "treecheck-"));
try {
  execSync(`npx tsc src/progression.ts src/poisons.ts --ignoreConfig --outDir ${out} --module commonjs --target es2022 --skipLibCheck --lib es2022,dom --noCheck`, { cwd: root, stdio: "pipe" });
} catch (e) {
  // tsc still writes the files with --noCheck; only stop if nothing came out
  if (!fs.existsSync(path.join(out, "progression.js"))) {
    console.log(String(e.stdout || e));
    process.exit(1);
  }
}
global.localStorage = { getItem: () => null, setItem: () => {} };
const P = require(path.join(out, "progression.js"));
const items = require(path.join(out, "items.js"));
require(path.join(out, "poisons.js")); // the poison vials join ITEMS
const icons = fs.readFileSync(path.join(root, "src/icons.ts"), "utf8");
const glyphs = new Set([...icons.slice(icons.indexOf("const GLYPHS")).matchAll(/^  ([a-z_]+): \(g/gm)].map((m) => m[1]));
const TYPES = new Set(["bolt", "fan", "blast", "nova", "storm", "cone", "beam", "dash", "heal", "shield", "buff", "flower", "trap", "falcon", "decoy", "workshop",
  "summon", "mimic", "smoke", "make"]);
const statKeys = new Set([
  "maxHp", "maxMp", "atk", "matk", "def", "mdef", "hit", "flee", "crit", "critDmg", "aspd", "move", "hpRegen", "mpRegen", "cdr", "dmgRed", "castRed",
  "dmg", "reach", "stunHit", "xpPct", "drop", "pierce", "potion", "healPct", "multiShot", "poisonHit", "huntDmg", "buffTime", "reflect",
  "atkPct", "matkPct", "defPct", "mdefPct", "maxHpPct", "maxMpPct", "mpRegenPct", "lifesteal", "lowHpDmg", "falconChance", "falconPower", "poisonPct",
  "buyDisc", "sellBonus", "bagSlots", "goldPct", "fareDisc", "luck", "magicDodge", "statusRes", "doubleHit", "stealth", "ambush",
  "stallSlots", "stallRate", "stallMarkup",
  ...P.ELEMENT_IDS.flatMap((e) => [`${e}Atk`, `${e}Def`]), ...P.RACES.map((r) => `${r}Dmg`),
]);
// a stat that casts a skill by itself: autocast_<an active skill's id>
const knownStat = (key) => statKeys.has(key) || (key.startsWith(P.AUTOCAST) && !!P.ACTIVES[key.slice(P.AUTOCAST.length)]);
const weapons = new Set(Object.keys(items.WEAPON_TYPES));
const only = process.argv.slice(2);
let problems = 0;
const bad = (tree, msg) => {
  problems++;
  console.log(`${tree}: ${msg}`);
};
const badText = (v) => typeof v !== "string" || /NaN|undefined|Infinity|\[object/.test(v);
const badNum = (v) => typeof v !== "number" || !Number.isFinite(v);
// terrain stats: a bag of known stats for each kind of map named
const checkTerrain = (where, by, k) => {
  for (const [kind, bag] of Object.entries(by || {})) {
    if (!P.TERRAIN_KINDS.includes(kind)) bad(where, `terrain kind ${kind} (${P.TERRAIN_KINDS.join(", ")})`);
    for (const [key, v] of Object.entries(bag || {})) if (!knownStat(key) || badNum(v)) bad(where, `terrain ${kind} ${key} at rank ${k}: ${v}`);
  }
};

for (const [id, t] of Object.entries(P.TREES)) {
  if (only.length && !only.includes(id)) continue;
  if (!glyphs.has(t.glyph)) bad(id, `tree glyph "${t.glyph}" unknown`);
  if (!t.name || !t.note || !/^#[0-9a-f]{6}$/i.test(t.color || "")) bad(id, "tree needs name, note and a #rrggbb color");
  const spots = new Set(), byId = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
  // a class tree has TREE_SKILLS[1] skills, a job branch TREE_SKILLS[2], a third job's
  // TREE_SKILLS[3], a fourth's TREE_SKILLS[4]; a book tree 6-16; a stub what it has so far (only
  // a job's branch may be one)
  const want = t.cls ? P.TREE_SKILLS[1] : t.job ? P.TREE_SKILLS[2] : t.job3 ? P.TREE_SKILLS[3] : t.job4 ? P.TREE_SKILLS[4] : null;
  if (t.stub && !t.job && !t.job3 && !t.job4) bad(id, "only a job's branch can be a stub");
  if (t.stub && (t.job ? P.jobOpen(t.job) : t.job3 ? P.job3Open(t.job3) : t.job4 && P.job4Open(t.job4))) bad(id, "a stub, but its job is open");
  if (t.stub) { if (t.nodes.length > (want || 16)) bad(id, `${t.nodes.length} nodes`); }
  else if (want && t.nodes.length !== want) bad(id, `${t.nodes.length} nodes (a ${t.cls ? "class tree" : t.job ? "job branch" : t.job3 ? "third job's branch" : "fourth job's branch"} has ${want})`);
  else if (!want && (t.nodes.length < 6 || t.nodes.length > 16)) bad(id, `${t.nodes.length} nodes (6-16 fit the window)`);
  for (const n of t.nodes) {
    const where = `${id}.${n.id}`;
    const [c, r] = n.pos || [];
    if (!(c >= 0 && c <= 3 && r >= 0 && r <= 3)) bad(where, `pos ${JSON.stringify(n.pos)} off the 4 x 4 grid`);
    if (spots.has(`${c},${r}`)) bad(where, `two nodes at ${c},${r}`);
    spots.add(`${c},${r}`);
    if (![1, 5, 10].includes(n.max)) bad(where, `max ${n.max} (1, 5 or 10)`);
    if (!glyphs.has(n.glyph)) bad(where, `glyph "${n.glyph}" unknown`);
    for (const [rid, rank] of n.req || []) {
      const q = byId[rid];
      if (!q) bad(where, `needs ${rid}, not in this tree`);
      else {
        if (q.pos[1] >= r) bad(where, `needs ${rid}, which isn't on a higher row`);
        if (rank > q.max) bad(where, `needs ${rid} at ${rank}, its max is ${q.max}`);
      }
    }
    for (const w of [...(n.need?.weapons || []), ...(Array.isArray(n.need?.dual) ? n.need.dual : [])]) if (!weapons.has(w)) bad(where, `unknown weapon ${w}`);
    for (let k = 1; k <= n.max; k++) {
      const d = typeof n.desc === "function" ? n.desc(k) : n.desc;
      if (badText(d)) bad(where, `desc at rank ${k}: ${d}`);
      if (n.kind === "passive") {
        if (!n.stats && !n.terrain) { bad(where, "passive without stats"); break; }
        for (const [key, v] of Object.entries(n.stats ? n.stats(k) : {})) {
          if (!knownStat(key)) bad(where, `unknown stat ${key}`);
          if (badNum(v)) bad(where, `stat ${key} at rank ${k}: ${v}`);
        }
        if (n.terrain) checkTerrain(where, n.terrain(k), k);
      }
    }
    if (n.kind === "active") {
      const s = n.skill;
      if (!s) { bad(where, "active without skill"); continue; }
      if (!TYPES.has(s.type)) bad(where, `skill type ${s.type}`);
      if (badNum(s.mp) || badNum(s.cd)) bad(where, "mp and cd must be numbers");
      if (!/^#[0-9a-f]{6}$/i.test(s.color || "")) bad(where, "skill color must be #rrggbb");
      if (s.element && !P.ELEMENT_IDS.includes(s.element)) bad(where, `element ${s.element}`);
      if (s.enchant && !P.ELEMENT_IDS.includes(s.enchant)) bad(where, `enchant ${s.enchant}`);
      for (const r of Object.keys(s.vs || {})) if (!P.RACES.includes(r)) bad(where, `race ${r}`);
      for (const key of ["mult", "stun", "slow", "freeze", "heal", "base", "poison", "weaken", "expose", "blind", "drain", "detonate", "stealChance", "coin", "gold", "bag"]) {
        if (s[key] === undefined) continue;
        if (typeof s[key] !== "function") { bad(where, `${key} must be a function of rank`); continue; }
        for (let k = 1; k <= n.max; k++) if (badNum(s[key](k))) bad(where, `${key}(${k}) = ${s[key](k)}`);
      }
      if (s.roll) for (let k = 1; k <= n.max; k++) for (const [key, v] of Object.entries(s.roll(k))) {
        if (!knownStat(key) || badNum(v)) bad(where, `roll ${key} at rank ${k}: ${v}`);
      }
      if (s.steal && !s.stealChance) bad(where, "steal without stealChance");
      if (s.buff) for (let k = 1; k <= n.max; k++) for (const [key, v] of Object.entries(s.buff(k))) {
        if (!knownStat(key)) bad(where, `unknown buff stat ${key}`);
        if (badNum(v)) bad(where, `buff ${key} at rank ${k}: ${v}`);
      }
      // the third jobs' types and riders
      if (s.type === "summon" && !P.ALLY_KINDS.includes(s.ally)) bad(where, `summon of ally "${s.ally}" (${P.ALLY_KINDS.join(", ")})`);
      if (s.type === "summon" && ["wolf", "clone", "golem"].includes(s.ally) && !s.mult) bad(where, `a ${s.ally} without mult does no damage`);
      if (s.type === "summon" && s.ally === "statue" && !s.buff) bad(where, "a statue without buff gives nothing");
      if (s.type === "make") {
        if (!s.make || !items.ITEMS[s.make.item]) bad(where, `make: unknown item ${s.make?.item}`);
        else {
          for (const [it, c] of s.make.from) if (!items.ITEMS[it] || badNum(c)) bad(where, `make from ${it} x ${c}`);
          for (let k = 1; k <= n.max; k++) if (badNum(s.make.count(k))) bad(where, `make count(${k}) = ${s.make.count(k)}`);
        }
      }
      if (s.combo) {
        for (const a of s.combo.after || []) if (!P.ACTIVES[a]) bad(where, `combo after unknown skill ${a}`);
        if (!s.combo.after?.length) bad(where, "combo after nothing");
        for (let k = 1; k <= n.max; k++) if (badNum(s.combo.more(k))) bad(where, `combo more(${k}) = ${s.combo.more(k)}`);
      }
      if (s.manaBurn) for (let k = 1; k <= n.max; k++) if (badNum(s.manaBurn(k))) bad(where, `manaBurn(${k})`);
      if (s.terrain) for (let k = 1; k <= n.max; k++) checkTerrain(where, s.terrain(k), k);
      if (s.terrain && s.type !== "buff") bad(where, "terrain only works on a buff");
      const damaging = !["heal", "shield", "buff", "decoy", "workshop", "summon", "smoke", "make"].includes(s.type) && !(s.type === "dash" && !s.mult);
      if (damaging && !s.mult) bad(where, `${s.type} skill without mult`);
      if (["heal", "buff", "shield"].includes(s.type) && s.cast) bad(where, "support skills have no cast time");
    }
  }
  if (t.job && !P.JOBS[t.job]?.branches.includes(id)) bad(id, `job ${t.job} doesn't list this branch`);
  if (t.job3 && !P.JOBS3[t.job3]?.branches.includes(id)) bad(id, `third job ${t.job3} doesn't list this branch`);
  if (t.job4 && !P.JOBS4[t.job4]?.branches.includes(id)) bad(id, `fourth job ${t.job4} doesn't list this branch`);
}
for (const [jid, j] of Object.entries(P.JOBS)) for (const b of j.branches) {
  if (only.length && !only.includes(b)) continue;
  if (!P.TREES[b]) bad(jid, `branch ${b} has no tree yet`);
  else if (P.TREES[b].job !== jid) bad(b, `tree must say job: "${jid}"`);
}
for (const [jid, j] of Object.entries(P.JOBS3)) {
  if (!glyphs.has(j.glyph)) bad(jid, `job glyph "${j.glyph}" unknown`);
  for (const f of j.from || []) if (!P.JOBS[f]) bad(jid, `from unknown second job ${f}`);
  for (const b of j.branches) {
    if (only.length && !only.includes(b)) continue;
    if (!P.TREES[b]) bad(jid, `branch ${b} has no tree yet`);
    else if (P.TREES[b].job3 !== jid) bad(b, `tree must say job3: "${jid}"`);
  }
}
for (const [jid, j] of Object.entries(P.JOBS4)) {
  if (!glyphs.has(j.glyph)) bad(jid, `job glyph "${j.glyph}" unknown`);
  for (const f of j.from || []) if (!P.JOBS3[f]) bad(jid, `from unknown third job ${f}`);
  for (const b of j.branches) {
    if (only.length && !only.includes(b)) continue;
    if (!P.TREES[b]) bad(jid, `branch ${b} has no tree yet`);
    else if (P.TREES[b].job4 !== jid) bad(b, `tree must say job4: "${jid}"`);
  }
}

// ---- masteries ----
const checkSkill = (where, s) => {
  if (!TYPES.has(s.type)) bad(where, `skill type ${s.type}`);
  if (badNum(s.mp) || badNum(s.cd)) bad(where, "mp and cd must be numbers");
  if (!/^#[0-9a-f]{6}$/i.test(s.color || "")) bad(where, "skill color must be #rrggbb");
  for (const key of ["mult", "stun", "slow", "freeze", "poison"]) if (s[key] !== undefined && badNum(s[key](1))) bad(where, `${key}(1) = ${s[key](1)}`);
};
const checkBag = (where, bag) => {
  for (const [key, v] of Object.entries(bag || {})) {
    if (!statKeys.has(key)) bad(where, `unknown stat ${key}`);
    if (badNum(v)) bad(where, `stat ${key}: ${v}`);
  }
};
if (!only.length) {
  for (const [id, m] of Object.entries(P.MASTERIES)) {
    // (a weapon mastery shows its weapon's picture; its glyph only marks its books)
    if (m.kind !== "weapon" && !glyphs.has(m.glyph)) bad(`mastery ${id}`, `glyph "${m.glyph}" unknown`);
    for (const w of m.weapons || []) if (!weapons.has(w)) bad(`mastery ${id}`, `unknown weapon ${w}`);
    checkBag(`mastery ${id}`, m.per);
    for (const r of m.rewards) {
      const where = `mastery ${id} at ${r.at}`;
      if (r.glyph && !glyphs.has(r.glyph)) bad(where, `glyph "${r.glyph}" unknown`);
      if (badText(r.desc) || !r.name) bad(where, "needs a name and a desc");
      checkBag(where, r.stats);
      if (r.kind === "active") {
        if (!r.id || !r.skill) bad(where, "an active needs an id and a skill");
        else if (P.NODES[r.id]) bad(where, `skill id ${r.id} is a tree skill's too`);
        else checkSkill(where, r.skill);
      }
    }
  }
  for (const w of weapons) {
    if (!Object.values(P.MASTERIES).some((m) => m.weapons?.includes(w))) bad(`weapon ${w}`, "no mastery covers it");
    if (!fs.existsSync(path.join(root, "public/assets/weapons", `${w}.png`))) bad(`weapon ${w}`, "no in-hand picture (tools/draw_items.py)");
  }
}

// ---- elements ----
// What a point of each stat is (the README's table): 1 attack, 10 HP, 0.4% attack... Attack and
// magic attack given together count the larger in full and half the smaller (a character fights
// with one of them), and so do their percents; another element's defence (metal's) counts a
// share for each element. The elements' own attack and defence (the same for all) don't count.
const ELEMENT_WORTH = {
  atk: 1, matk: 1, def: 1, mdef: 1, maxHp: 10, maxMp: 6, hit: 1.5, flee: 1.5, hpRegen: 0.25, mpRegen: 0.15,
  crit: 0.004, critDmg: 0.015, aspd: 0.004, move: 0.005, cdr: 0.0035, castRed: 0.004, atkPct: 0.004, matkPct: 0.004,
  defPct: 0.004, mdefPct: 0.004, maxHpPct: 0.004, maxMpPct: 0.004, mpRegenPct: 0.01, healPct: 0.008, dmgRed: 0.003, dmg: 0.003,
  reflect: 0.006, magicDodge: 0.004, statusRes: 0.006, huntDmg: 0.006, poisonPct: 0.01, pierce: 0.004,
};
const ATTACK_STATS = new Set(["atk", "matk", "hit", "crit", "critDmg", "aspd", "cdr", "castRed", "atkPct", "matkPct", "dmg", "huntDmg", "poisonPct", "pierce"]);
// What each element's effect (its skill line and the milestones without stats) is worth a level:
// on every skill 1.2 (wind's own share is its cooldown stat), on its own element's hits 0.6; the
// four whose speciality is a stat have it in their numbers. Their own stats, not weighed for the
// attack/defence split: wind's cooldown, metal's reflect, smoke's spell dodge, gold's magic
// defence and statusRes, poison's poison.
const EFFECT_WORTH = { earth: 1.2, water: 1.2, wind: 0.4, fire: 1.2, lightning: 1.2, plant: 1.2, ice: 0.6, light: 0.6, dark: 0.6, stone: 0.6, mud: 0.6, lava: 0.6, poison: 0.6 };
const SIDE_STATS = { wind: ["cdr"], metal: ["reflect"], smoke: ["magicDodge"], gold: ["mdef", "statusRes"], poison: ["poisonPct"] };
function elementWorth(id, bag, side = []) {
  const b = { ...bag }, w = { atk: 0, def: 0, side: 0 };
  const put = (key, v) => (side.includes(key) ? (w.side += v) : ATTACK_STATS.has(key) ? (w.atk += v) : (w.def += v));
  const pair = (x, y) => Math.max(x, y) + 0.5 * Math.min(x, y);
  if (b.atk || b.matk) put("atk", pair(b.atk ?? 0, b.matk ?? 0));
  if (b.atkPct || b.matkPct) put("atkPct", pair(b.atkPct ?? 0, b.matkPct ?? 0) / ELEMENT_WORTH.atkPct);
  for (const k of ["atk", "matk", "atkPct", "matkPct"]) delete b[k];
  for (const [k, v] of Object.entries(b)) {
    if (k === `${id}Atk` || k === `${id}Def`) continue;
    if (/(Atk|Def)$/.test(k)) put(k.endsWith("Atk") ? "atk" : "def", v / P.ELEMENT_IDS.length);
    else if (ELEMENT_WORTH[k]) put(k, v / ELEMENT_WORTH[k]);
    else bad(`element ${id}`, `no worth for ${k} (tools/tree_check.cjs ELEMENT_WORTH)`);
  }
  return w;
}
if (!only.length) {
  for (const id of P.ELEMENT_IDS) if (!P.ELEMENTS[id]) bad(`element ${id}`, "in ELEMENT_IDS but not in ELEMENTS");
  const lines = [];
  for (const [id, e] of Object.entries(P.ELEMENTS)) {
    const where = `element ${id}`;
    if (!P.ELEMENT_IDS.includes(id)) bad(where, "not in ELEMENT_IDS");
    if (!glyphs.has(e.glyph)) bad(where, `glyph "${e.glyph}" unknown`);
    if (!e.name || !e.side || badText(e.skill) || !/^#[0-9a-f]{6}$/i.test(e.color || "")) bad(where, "needs a name, side, skill line and a #rrggbb color");
    checkBag(where, e.per);
    e.marks.forEach((m, i) => {
      checkBag(`${where} at ${m.at}`, m.stats);
      if (badText(m.desc) || !m.name) bad(`${where} at ${m.at}`, "needs a name and a desc");
      if (i && m.at <= e.marks[i - 1].at) bad(where, `milestone ${m.at} out of order`);
    });
    const side = SIDE_STATS[id] ?? [];
    const per = elementWorth(id, e.per, side), effect = EFFECT_WORTH[id] ?? 0;
    const lesser = Math.min(per.atk, per.def) / (per.atk + per.def);
    if (lesser < 0.25) bad(where, `${(lesser * 100).toFixed(0)}% of a level's stats on its lesser side (attack ${per.atk.toFixed(2)}, defence ${per.def.toFixed(2)})`);
    const upTo = (lv) => lv * (per.atk + per.def + per.side + effect) + e.marks.filter((m) => m.at <= lv && m.stats)
      .reduce((a, m) => { const w = elementWorth(id, m.stats); return a + w.atk + w.def + w.side; }, 0);
    lines.push({ id, at50: upTo(50), at100: upTo(100) });
  }
  for (const lv of ["at50", "at100"]) {
    const mean = lines.reduce((a, l) => a + l[lv], 0) / lines.length;
    for (const l of lines) if (Math.abs(l[lv] / mean - 1) > 0.08) bad(`element ${l.id}`, `worth ${l[lv].toFixed(0)} ${lv.replace("at", "at level ")}, ${((l[lv] / mean - 1) * 100).toFixed(0)}% off the elements' ${mean.toFixed(0)}`);
  }
}

fs.rmSync(out, { recursive: true, force: true });
console.log(problems ? `${problems} problem(s)` : `ok: ${Object.keys(P.TREES).length} trees, ${Object.keys(P.NODES).length} skills`
  + (only.length ? "" : `, ${Object.keys(P.MASTERIES).length} masteries, ${Object.keys(P.ELEMENTS).length} elements`));
process.exit(problems ? 1 : 0);
