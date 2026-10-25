const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const bestiaryPath = path.join(root, "src", "bestiary.ts");
const monsterDir = path.join(root, "public", "assets", "monsters");
const source = fs.readFileSync(bestiaryPath, "utf8");
const section = source.match(/export const MONSTERS: MonsterDef\[\] = \[([\s\S]*?)\n\];/);

if (!section) {
  throw new Error(`Could not find MONSTERS in ${bestiaryPath}`);
}

const monsterIds = [...section[1].matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
const sheets = JSON.parse(fs.readFileSync(path.join(monsterDir, "index.json"), "utf8"));
const failures = [];
const invalidIds = new Set();
const fail = (id, message) => {
  invalidIds.add(id);
  failures.push(`${id}: ${message}`);
};

for (const id of monsterIds) {
  const meta = sheets[id];
  const imagePath = path.join(monsterDir, `${id}.png`);
  if (!meta) {
    fail(id, "missing index entry");
    continue;
  }
  if (!fs.existsSync(imagePath)) {
    fail(id, "missing PNG");
    continue;
  }

  const image = fs.readFileSync(imagePath);
  if (image.length < 24 || image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(id, "invalid PNG");
    continue;
  }

  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  const colorType = image[25];
  const hasAlpha = colorType === 4 || colorType === 6 || (colorType === 3 && image.includes(Buffer.from("tRNS")));
  const expectedCell = meta.cell;
  if (![96, 128].includes(expectedCell)) fail(id, `unsupported cell size ${expectedCell}`);
  if (width !== expectedCell * 9 || height !== expectedCell * 4) {
    fail(id, `expected ${expectedCell * 9}x${expectedCell * 4}, got ${width}x${height}`);
  }
  if (!hasAlpha) fail(id, "PNG has no transparency channel");
  if (meta.walk !== 4 || meta.attack !== 4) fail(id, "expected 4 walk and 4 attack frames");
  if (!(meta.top > 0 && meta.top <= expectedCell)) fail(id, `invalid top height ${meta.top}`);
}

const unreferenced = Object.keys(sheets).filter((id) => !monsterIds.includes(id));
for (const id of unreferenced) fail(id, "index entry is not in MONSTERS");

const complete = monsterIds.filter((id) => !invalidIds.has(id)).length;
console.log(`Monster sprites: ${complete}/${monsterIds.length} indexed and dimension-checked`);
console.log(`Index entries outside bestiary: ${unreferenced.length}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
