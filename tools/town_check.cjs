// Check a town in the running game (dev server on 127.0.0.1:8766): load it, report its solids,
// whether the spawn and every townsperson stand clear and can be walked to from the spawn,
// save the map picture (the scenery from straight above) and a game view at each point asked.
//
//   node tools/town_check.cjs <map id> <out dir> ["x,y" ...]   (points in world cm; default: the spawn)
const { chromium } = require(process.env.PLAYWRIGHT ?? "/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const [id, out, ...pts] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await (await browser.newContext({ viewport: { width: 960, height: 600 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const ready = () => page.waitForFunction(() => window.__game && window.__game.map && document.getElementById("loading").classList.contains("done"), null, { timeout: 400000 });
  await page.goto("http://127.0.0.1:8766/");
  await page.waitForSelector(".title-create", { timeout: 120000 });
  await page.fill(".title-name", "ตรวจเมือง");
  await page.click(".title-btn.primary");
  await ready();
  if (id !== "eden") {
    await page.evaluate((i) => window.__game.enterMap(i), id);
    await ready();
  }
  const report = await page.evaluate(() => {
    const g = window.__game, m = g.map, R = 18;
    const r = (v) => Math.round(v);
    const near = (n) => {
      // the nearest open spot within 1.2 m of someone (they are solid themselves)
      for (let d = 60; d <= 120; d += 20) for (let a = 0; a < 8; a++) {
        const p = { x: n.x + Math.cos((a * Math.PI) / 4) * d, y: n.y + Math.sin((a * Math.PI) / 4) * d };
        if (!g.nav.blocked(p, R)) return p;
      }
      return null;
    };
    const npcs = g.npcs.map((n) => {
      const spot = near(n);
      const path = spot ? g.nav.findPath(m.spawn, spot, R) : null;
      return { name: n.spec.name, role: n.spec.role, at: [r(n.x), r(n.y)], approachable: !!spot, reachable: !!path };
    });
    const labels = m.labels.map((l) => ({ text: l.text, at: [r(l.x), r(l.y)], reachable: !!g.nav.findPath(m.spawn, l, R) }));
    return {
      map: m.id, name: m.name, bounds: m.bounds, solids: m.solids.length,
      spawn: [r(m.spawn.x), r(m.spawn.y)], spawnBlocked: g.nav.blocked(m.spawn, R),
      warps: m.warps.length, closed: m.closed.map((c) => c.text), npcs, labels,
      instanced: (() => { let n = 0; g.world.level.traverse((o) => { if (o.isInstancedMesh) n++; }); return n; })(),
    };
  });
  console.log(JSON.stringify(report, null, 1));
  // the map picture, as the map window shows it
  const pic = await page.evaluate(() => window.__game.mapUI.pic && window.__game.mapUI.pic.toDataURL("image/png"));
  if (pic) fs.writeFileSync(`${out}/${id}_map.png`, Buffer.from(pic.split(",")[1], "base64"));
  const spots = pts.length ? pts.map((p) => p.split(",").map(Number)) : [[report.spawn[0], report.spawn[1]]];
  for (const [i, [x, y]] of spots.entries()) {
    await page.evaluate(([x, y]) => { const p = window.__game.player; p.x = x; p.y = y; }, [x, y]);
    const t = await page.evaluate(() => window.__game.fx.time);
    await page.waitForFunction((t) => window.__game.fx.time > t + 0.2, t, { timeout: 300000 });
    await page.screenshot({ path: `${out}/${id}_view${i}.png` });
  }
  console.log("saved", fs.readdirSync(out).filter((f) => f.startsWith(id)).join(" "));
  console.log("errors", JSON.stringify(errors));
  await browser.close();
})();
