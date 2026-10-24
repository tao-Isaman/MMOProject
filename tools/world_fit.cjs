// Checks that the maps fit the world map (src/worldmap.ts): loads every map in the running game
// (dev server on 127.0.0.1:8766, or PORT) for its bounds and ways out, reads what lies along each
// edge from its world-map picture (public/assets/worldmap/<id>.webp, made by world_tiles.cjs), and
// reports
//   - a way out on an edge that doesn't face the map it leads to (two maps that only touch at a
//     corner should meet there: the way out near that corner on both sides),
//   - an edge facing the sea on the grid that shows no water, and one showing water that faces
//     land (edges facing past the grid's edge are left alone: nothing is drawn there),
//   - two linked ways out that leave their shared edge at different places (more than 15% of the
//     edge apart), so their roads don't meet on the world map.
// What an edge shows is read from the picture's pixels in a strip just inside the map's walkable
// bounds: water, snow, sand, green, forest, stone, earth or dark.
//
//   node tools/world_fit.cjs [--all]      (--all: every edge, not only the problems)
const { chromium } = require(process.env.PLAYWRIGHT ?? "/opt/node22/lib/node_modules/playwright");
const all = process.argv.includes("--all");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(900000);
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8766}/`);
  await page.waitForSelector(".title-create, .title-chars", { timeout: 120000 });
  const res = await page.evaluate(async () => {
    const M = await import("/src/maps.ts");
    const W = await import("/src/worldmap.ts");
    const kind = (r, g, b) => {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0;
      let h = 0;
      if (mx !== mn) h = (mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn)) / 6;
      if (h < 0) h += 1;
      if (v > 0.82 && s < 0.12) return "snow";
      if (h > 0.42 && h < 0.72 && s > 0.25 && (h > 0.5 ? b > g * 0.9 : s > 0.3)) return "water";
      if (h > 0.08 && h < 0.17 && s > 0.2 && v > 0.6) return "sand";
      if (h >= 0.17 && h < 0.45 && s > 0.2) return v > 0.38 ? "green" : "forest";
      if (v < 0.28) return "dark";
      return s < 0.18 ? "stone" : "earth";
    };
    const out = {};
    for (const p of W.PLACES) {
      if (!(p.id in M.MAP_NAMES)) continue;
      const map = await M.loadMap(p.id, { flowers: 0 });
      const B = map.bounds, w = B.maxX - B.minX, h = B.maxY - B.minY;
      const T = W.tileArea(B), L = T.maxX - T.minX;
      const img = new Image();
      img.src = `/assets/worldmap/${p.id}.webp`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = c.height = img.width;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const P = img.width, px = g.getImageData(0, 0, P, P).data;
      // the walkable box in the picture: north up (x from maxX down), west left (y from maxY down)
      const top = ((T.maxX - B.maxX) / L) * P, left = ((T.maxY - B.maxY) / L) * P, H = (w / L) * P, Wd = (h / L) * P, d = 0.07;
      const strip = { N: [left, top, Wd, H * d], S: [left, top + H * (1 - d), Wd, H * d], W: [left, top, Wd * d, H], E: [left + Wd * (1 - d), top, Wd * d, H] };
      const edges = {};
      for (const [side, [x0, y0, sw, sh]] of Object.entries(strip)) {
        const n = {};
        let total = 0;
        for (let y = Math.floor(y0); y < y0 + sh; y++) for (let x = Math.floor(x0); x < x0 + sw; x++) {
          const i = (y * P + x) * 4, k = kind(px[i], px[i + 1], px[i + 2]);
          n[k] = (n[k] ?? 0) + 1;
          total++;
        }
        edges[side] = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / total]).filter(([, v]) => v >= 0.08).sort((a, b) => b[1] - a[1]));
      }
      const warps = map.warps.map((wp) => ({ to: wp.to, n: (wp.x - B.minX) / w, e: (B.maxY - wp.y) / h }));
      out[p.id] = { col: p.col, row: p.row, edges, warps };
    }
    const ground = {};
    for (let r = W.GRID.row0; r < W.GRID.row0 + W.GRID.rows; r++) for (let c = W.GRID.col0; c < W.GRID.col0 + W.GRID.cols; c++) ground[`${c},${r}`] = W.groundAt(c, r);
    return { out, ground };
  });
  await browser.close();
  const { out, ground } = res;
  const at = {};
  for (const [id, m] of Object.entries(out)) at[`${m.col},${m.row}`] = id;
  const DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, OPP = { N: "S", S: "N", E: "W", W: "E" };
  // (null past the grid's edge: nothing is drawn there, so nothing to meet)
  const next = (c, r) => at[`${c},${r}`] ?? ground[`${c},${r}`] ?? null;
  const show = (e) => Object.entries(e).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(", ");
  // the side a way out is on: the nearest edge, or a corner when it is near two
  const sideOf = (wp) => {
    const d = Object.entries({ N: 1 - wp.n, S: wp.n, E: 1 - wp.e, W: wp.e }).sort((a, b) => a[1] - b[1]);
    return d[1][1] < 0.15 ? [d[0][0], d[1][0]] : [d[0][0]];
  };
  let problems = 0;
  const say = (s) => { problems++; console.log(s); };
  for (const [id, m] of Object.entries(out).sort((a, b) => a[1].row - b[1].row || a[1].col - b[1].col)) {
    if (all) console.log(`== ${id} (${m.col},${m.row})`);
    for (const side of ["N", "E", "S", "W"]) {
      const [dc, dr] = DIR[side], nb = next(m.col + dc, m.row + dr), e = m.edges[side], water = e.water ?? 0;
      if (nb === null) continue;
      if (all) console.log(`  ${side}: ${show(e)}  | next: ${nb}${out[nb] ? ` (${show(out[nb].edges[OPP[side]])})` : ""}`);
      if (nb === "~" && water < 0.3) say(`${id} ${side}: faces the sea but shows land (${show(e)})`);
      if (nb !== "~" && water > 0.4) say(`${id} ${side}: faces land (${nb}) but shows water (${show(e)})`);
    }
    for (const wp of m.warps) {
      const o = out[wp.to];
      if (!o) continue;
      const dc = o.col - m.col, dr = o.row - m.row, sides = sideOf(wp);
      const want = [dr < 0 ? "N" : dr > 0 ? "S" : null, dc > 0 ? "E" : dc < 0 ? "W" : null].filter(Boolean);
      if (Math.abs(dc) > 1 || Math.abs(dr) > 1) say(`${id} → ${wp.to}: not next to each other on the grid`);
      else if (!want.every((s) => sides.includes(s))) say(`${id} → ${wp.to}: way out on ${sides.join("")} but ${wp.to} lies ${want.join("")}`);
      const back = o.warps.find((x) => x.to === id);
      if (!back) { say(`${id} → ${wp.to}: no way back`); continue; }
      if (id < wp.to && want.length === 1) {
        const off = want[0] === "E" || want[0] === "W" ? wp.n - back.n : wp.e - back.e;
        if (Math.abs(off) > 0.15) say(`${id} ↔ ${wp.to}: the two ways out are ${Math.round(Math.abs(off) * 100)}% of the edge apart (${id} ${(want[0] === "E" || want[0] === "W" ? wp.n : wp.e).toFixed(2)}, ${wp.to} ${(want[0] === "E" || want[0] === "W" ? back.n : back.e).toFixed(2)})`);
      }
    }
  }
  console.log(problems ? `${problems} problem(s)` : "ok: every map fits the world map");
  process.exit(problems ? 1 : 0);
})();
