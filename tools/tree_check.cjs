// Checks the skill trees (src/progression.ts with src/trees/*): compiles them with tsc into a
// temporary folder, loads them in node and reports what would break or read wrong in the game:
//   - a class tree without TREE_SKILLS[1] skills, a job branch without TREE_SKILLS[2]
//   - a tree that isn't laid out on the 4 x 4 grid (columns 0-3, rows 0-3), two nodes on one
//     spot, a prerequisite outside the tree or not on a higher row, a rank asked for that the
//     prerequisite can't reach, a max other than 1, 5 or 10
//   - a glyph src/icons.ts can't draw, an unknown weapon, element or kind of monster
//   - an active without a skill, a passive without stats, a desc or number that comes out as
//     NaN, undefined or not a number at some rank, a skill type skills.ts doesn't know
//   - a job branch or book the jobs table (JOBS) and the trees disagree about
// Usage: node tools/tree_check.cjs [tree id ...]   (no ids: every tree)
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "treecheck-"));
try {
  execSync(`npx tsc src/progression.ts --ignoreConfig --outDir ${out} --module commonjs --target es2022 --skipLibCheck --lib es2022,dom --noCheck`, { cwd: root, stdio: "pipe" });
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
const icons = fs.readFileSync(path.join(root, "src/icons.ts"), "utf8");
const glyphs = new Set([...icons.slice(icons.indexOf("const GLYPHS")).matchAll(/^  ([a-z_]+): \(g/gm)].map((m) => m[1]));
const TYPES = new Set(["bolt", "fan", "blast", "nova", "storm", "cone", "beam", "dash", "heal", "shield", "buff", "flower", "trap", "falcon"]);
const statKeys = new Set([
  "maxHp", "maxMp", "atk", "matk", "def", "mdef", "hit", "flee", "crit", "critDmg", "aspd", "move", "hpRegen", "mpRegen", "cdr", "dmgRed", "castRed",
  "dmg", "reach", "stunHit", "xpPct", "drop", "pierce", "potion", "healPct", "multiShot", "poisonHit", "huntDmg", "buffTime", "reflect",
  "atkPct", "matkPct", "defPct", "mdefPct", "maxHpPct", "maxMpPct", "mpRegenPct", "lifesteal", "lowHpDmg", "falconChance", "falconPower", "poisonPct",
  "buyDisc", "sellBonus", "bagSlots", "goldPct", "fareDisc",
  ...P.ELEMENT_IDS.flatMap((e) => [`${e}Atk`, `${e}Def`]), ...P.RACES.map((r) => `${r}Dmg`),
]);
const weapons = new Set(Object.keys(items.WEAPON_TYPES));
const only = process.argv.slice(2);
let problems = 0;
const bad = (tree, msg) => {
  problems++;
  console.log(`${tree}: ${msg}`);
};
const badText = (v) => typeof v !== "string" || /NaN|undefined|Infinity|\[object/.test(v);
const badNum = (v) => typeof v !== "number" || !Number.isFinite(v);

for (const [id, t] of Object.entries(P.TREES)) {
  if (only.length && !only.includes(id)) continue;
  if (!glyphs.has(t.glyph)) bad(id, `tree glyph "${t.glyph}" unknown`);
  if (!t.name || !t.note || !/^#[0-9a-f]{6}$/i.test(t.color || "")) bad(id, "tree needs name, note and a #rrggbb color");
  const spots = new Set(), byId = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
  // a class tree has TREE_SKILLS[1] skills, a job branch TREE_SKILLS[2]; a book tree 6-16
  const want = t.cls ? P.TREE_SKILLS[1] : t.job ? P.TREE_SKILLS[2] : null;
  if (want && t.nodes.length !== want) bad(id, `${t.nodes.length} nodes (a ${t.cls ? "class tree" : "job branch"} has ${want})`);
  if (!want && (t.nodes.length < 6 || t.nodes.length > 16)) bad(id, `${t.nodes.length} nodes (6-16 fit the window)`);
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
        if (!n.stats) { bad(where, "passive without stats"); break; }
        for (const [key, v] of Object.entries(n.stats(k))) {
          if (!statKeys.has(key)) bad(where, `unknown stat ${key}`);
          if (badNum(v)) bad(where, `stat ${key} at rank ${k}: ${v}`);
        }
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
      for (const key of ["mult", "stun", "slow", "freeze", "heal", "base", "poison", "weaken", "expose", "blind", "drain", "detonate"]) {
        if (s[key] === undefined) continue;
        if (typeof s[key] !== "function") { bad(where, `${key} must be a function of rank`); continue; }
        for (let k = 1; k <= n.max; k++) if (badNum(s[key](k))) bad(where, `${key}(${k}) = ${s[key](k)}`);
      }
      if (s.buff) for (let k = 1; k <= n.max; k++) for (const [key, v] of Object.entries(s.buff(k))) {
        if (!statKeys.has(key)) bad(where, `unknown buff stat ${key}`);
        if (badNum(v)) bad(where, `buff ${key} at rank ${k}: ${v}`);
      }
      const damaging = !["heal", "shield", "buff"].includes(s.type) && !(s.type === "dash" && !s.mult);
      if (damaging && !s.mult) bad(where, `${s.type} skill without mult`);
      if (["heal", "buff", "shield"].includes(s.type) && s.cast) bad(where, "support skills have no cast time");
    }
  }
  if (t.job && !P.JOBS[t.job]?.branches.includes(id)) bad(id, `job ${t.job} doesn't list this branch`);
}
for (const [jid, j] of Object.entries(P.JOBS)) for (const b of j.branches) {
  if (only.length && !only.includes(b)) continue;
  if (!P.TREES[b]) bad(jid, `branch ${b} has no tree yet`);
  else if (P.TREES[b].job !== jid) bad(b, `tree must say job: "${jid}"`);
}
fs.rmSync(out, { recursive: true, force: true });
console.log(problems ? `${problems} problem(s)` : `ok: ${Object.keys(P.TREES).length} trees, ${Object.keys(P.NODES).length} skills`);
process.exit(problems ? 1 : 0);
