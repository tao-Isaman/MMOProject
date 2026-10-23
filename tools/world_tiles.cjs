// Photographs every map from straight above for the world map's squares (src/worldmap.ts): each
// map loaded in the running game (dev server on 127.0.0.1:8766, or PORT), the square tileArea()
// gives rendered SIZE pixels across and saved as public/assets/worldmap/<id>.webp. Run it again
// after a map changes; name maps to take only those.
//
//   node tools/world_tiles.cjs [map id ...]      (SIZE=<px>, default 384)
const { chromium } = require(process.env.PLAYWRIGHT ?? "/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const SIZE = +(process.env.SIZE || 384);
const OUT = path.join(__dirname, "..", "public", "assets", "worldmap");
const PER_BROWSER = 6; // a fresh browser now and then: every map loaded stays in memory

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let ids = process.argv.slice(2);
  for (let i = 0; i < (ids.length || 1); i += PER_BROWSER) {
    const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    const page = await (await browser.newContext({ viewport: { width: 960, height: 600 } })).newPage();
    page.setDefaultTimeout(600000);
    // no hot reloads mid-run, and no web fonts to wait for
    await page.route("**/@vite/client", (r) => r.fulfill({ contentType: "application/javascript", body: "export function updateStyle(){} export function removeStyle(){} export function createHotContext(){ return { accept(){}, dispose(){}, prune(){}, invalidate(){}, on(){}, off(){}, send(){}, data: {} }; } export function injectQuery(u){ return u; }" }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const ready = () => page.waitForFunction(() => window.__game && window.__game.map && document.getElementById("loading").classList.contains("done"), null, { timeout: 600000 });
    await page.goto(`http://127.0.0.1:${process.env.PORT || 8766}/`);
    await page.waitForSelector(".title-create", { timeout: 120000 });
    await page.fill(".title-name", "ถ่ายแผนที่");
    await page.click(".title-btn.primary");
    await ready();
    if (!ids.length) ids = await page.evaluate(async () => Object.keys((await import("/src/maps.ts")).MAP_NAMES));
    for (const id of ids.slice(i, i + PER_BROWSER)) {
      if (id !== (await page.evaluate(() => window.__game.map.id))) {
        await page.evaluate((m) => window.__game.enterMap(m), id);
        await page.waitForFunction((m) => window.__game.map.id === m, id, { timeout: 600000 });
        await ready();
      }
      const url = await page.evaluate(async (size) => {
        const { tileArea } = await import("/src/worldmap.ts");
        const g = window.__game;
        return g.world.snapshot(tileArea(g.map.bounds), size).toDataURL("image/webp", 0.82);
      }, SIZE);
      fs.writeFileSync(path.join(OUT, `${id}.webp`), Buffer.from(url.split(",")[1], "base64"));
      console.log(id);
    }
    await browser.close();
  }
})();
