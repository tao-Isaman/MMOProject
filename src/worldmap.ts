// The world map (M twice): the continent painted from code like a Ragnarok map, with the towns
// of the town kits (src/world3d/kits) where their regions say they lie. Eden sits in the
// central plains on the inner sea, Iceberg in the snowy north, Trunrada on the cold north-east
// steppe, Kradia on the eastern frontier facing the demon lands, Bahamas in the desert south of
// the capital, Yodia on the southern coast by the jungle and Osaki on its island out east. Only
// the places that have a map in the game are open.
//
// Coordinates are the map's own: 1000 x 640, north up. paintWorld() makes the land, sea and
// scenery once; the window draws the places, names and "you are here" over it every frame.

export const WORLD_W = 1000;
export const WORLD_H = 640;

export interface Place {
  id: string; // the game map's id where there is one
  name: string;
  region: string;
  desc: string;
  x: number;
  y: number;
  kind: "capital" | "town" | "field" | "castle";
  open: boolean;
  side?: "left"; // the name beside the mark instead of under it
}

export const PLACES: Place[] = [
  { id: "eden", name: "อีเดน", region: "ที่ราบภาคกลาง ริมทะเลใน", kind: "capital", open: true, x: 515, y: 332,
    desc: "เมืองหลวงของอาณาจักรและเมืองเริ่มต้น มหาวิหาร ตลาด ลานน้ำพุ และท่าเรือที่เรือจากทุกทิศมาจอด" },
  { id: "field", name: "ทุ่งหญ้าตะวันตก", region: "นอกประตูตะวันตกของอีเดน", kind: "field", open: true, x: 458, y: 344, side: "left",
    desc: "ทุ่งหญ้ากับลานบ้านไร่ มีสไลม์หลายสี ที่ฝึกฝีมือของนักผจญภัยหน้าใหม่" },
  { id: "castle", name: "ปราสาทหลวง", region: "เหนือเมืองอีเดน", kind: "castle", open: false, x: 503, y: 236,
    desc: "ปราสาทของกษัตริย์ ขึ้นไปทางประตูเหนือของอีเดน ซึ่งยังปิดซ่อมอยู่" },
  { id: "iceberg", name: "ไอซ์เบิร์ก", region: "แดนเหนือ", kind: "town", open: false, x: 425, y: 80,
    desc: "เมืองท่าแห่งหิมะที่หนาวตลอดปี บ้านไม้ซุงหลังคาชันหิมะหนา โถงใหญ่หัวมังกร และท่าเรือที่มีน้ำแข็งลอย" },
  { id: "trunrada", name: "ทรุนราดา", region: "ทุ่งหญ้าสเตปป์ตะวันออกเฉียงเหนือ", kind: "town", open: false, x: 715, y: 152,
    desc: "เมืองชายแดนของชนเผ่า กระโจมสักหลาดกับบ้านยาวหลังคาหญ้า กังหันลมบนเนิน หินตั้งโบราณ และวัฒนธรรมม้า" },
  { id: "kradia", name: "คราเดีย", region: "ชายแดนตะวันออก", kind: "town", open: false, x: 790, y: 318,
    desc: "นครแห่งเวทมนตร์และป้อมปราการที่คอยกันอสูรจากฝั่งตะวันออก หอคอยจอมเวท ผลึกเรืองแสง ธงสีม่วงทอง" },
  { id: "bahamas", name: "บาฮามัส", region: "กลางทะเลทราย ทางแยกสู่ภาคใต้", kind: "town", open: false, x: 445, y: 458,
    desc: "เมืองคาราวานกลางผืนทราย บ้านดินโดมสีฟ้าคราม ตลาดบาซาร์ และโอเอซิสร่มรื่นด้วยต้นปาล์ม" },
  { id: "yodia", name: "โยเดีย", region: "เมืองท่าแดนใต้ ชายป่า", kind: "town", open: false, x: 505, y: 584,
    desc: "เมืองท่าค้าขายใหญ่อันดับสอง โกดังไม้และด่านศุลกากรเรียงริมท่า บ้านใต้ถุนสูงหลังคามุงจากชิดชายป่า" },
  { id: "osaki", name: "โอซากิ", region: "เกาะทางตะวันออก ไปได้ทางเรือเท่านั้น", kind: "town", open: false, x: 872, y: 549,
    desc: "เมืองเกาะแบบญี่ปุ่น หลังคากระเบื้องปลายงอน เสาแดงชาด ซากุระ เจดีย์ห้าชั้น" },
];

// names over the land and sea
export const REGIONS: { x: number; y: number; text: string; sea?: boolean }[] = [
  { x: 300, y: 112, text: "แดนเหนือ" },
  { x: 790, y: 108, text: "ทุ่งสเตปป์" },
  { x: 885, y: 300, text: "ดินแดนอสูร" },
  { x: 770, y: 420, text: "ชายแดนตะวันออก" },
  { x: 300, y: 290, text: "ที่ราบภาคกลาง" },
  { x: 360, y: 505, text: "ทะเลทราย" },
  { x: 410, y: 572, text: "ป่าแดนใต้" },
  { x: 618, y: 360, text: "ทะเลใน", sea: true },
  { x: 700, y: 22, text: "ทะเลเหนือ", sea: true },
  { x: 770, y: 600, text: "มหาสมุทรใต้", sea: true },
  { x: 58, y: 430, text: "ทะเลตะวันตก", sea: true },
];

type Pt = [number, number];

// the main continent, a horseshoe round the inner sea (open to the south-east), clockwise
const MAIN: Pt[] = [
  [92, 190], [96, 150], [62, 118], [84, 98], [130, 112], [175, 95], [240, 72], [310, 58], [370, 52], [400, 50], [425, 68], [452, 47], [520, 44],
  [590, 52], [650, 66], [720, 58], [790, 62], [860, 88], [915, 130], [948, 190], [955, 255], [940, 320], [918, 385],
  [905, 410], [932, 432], [915, 452], [872, 440], [835, 462], [795, 476], [758, 462], [728, 430], [708, 388], [700, 340], [690, 292], [668, 258],
  [628, 236], [590, 238], [560, 252], [538, 292], [530, 335], [538, 380], [560, 425], [600, 462], [632, 500],
  [640, 538], [618, 570], [578, 592], [540, 600], [505, 598], [470, 607], [420, 604], [360, 590], [300, 566],
  [282, 530], [262, 528], [252, 548], [240, 532], [186, 488], [146, 432], [112, 392], [72, 388], [48, 362], [66, 336], [96, 328], [90, 300], [84, 240],
];
const ISLANDS: Pt[][] = [
  [[842, 545], [858, 530], [884, 527], [903, 538], [899, 560], [877, 573], [852, 568]], // Osaki
  [[56, 470], [72, 461], [84, 474], [70, 485]],
  [[930, 598], [946, 590], [956, 604], [940, 613]],
  [[968, 470], [980, 462], [990, 478], [975, 486]],
  [[600, 18], [622, 12], [632, 24], [610, 30]],
];

function seeded(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// A rough coast: each edge cut into short steps pushed in and out by a smooth wobble.
function coast(poly: Pt[], amp: number): Pt[] {
  const n = (x: number, y: number) => Math.sin(x * 0.09 + y * 0.05) * 0.5 + Math.sin(x * 0.031 - y * 0.12 + 1.7) * 0.4
    + Math.sin(x * 0.23 + y * 0.19 + 4) * 0.22 + Math.sin(x * 0.61 - y * 0.47 + 2) * 0.1;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const L = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.round(L / 5));
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let k = 0; k < steps; k++) {
      const x = ax + ((bx - ax) * k) / steps, y = ay + ((by - ay) * k) / steps;
      const d = n(x, y) * amp;
      out.push([x + nx * d, y + ny * d]);
    }
  }
  return out;
}

function trace(g: CanvasRenderingContext2D, pts: Pt[]): void {
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
}

// The land, sea and scenery at `k` pixels per map unit.
export function paintWorld(k: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = WORLD_W * k;
  c.height = WORLD_H * k;
  const g = c.getContext("2d")!;
  g.scale(k, k);
  const rnd = seeded(20251021);
  const lands = [coast(MAIN, 8), ...ISLANDS.map((p) => coast(p, 2))];
  const landPath = () => {
    g.beginPath();
    for (const p of lands) trace(g, p);
  };

  // ---- the sea: deep blue, lighter shallows along the coast, little wave marks ----
  const sea = g.createLinearGradient(0, 0, WORLD_W, WORLD_H);
  sea.addColorStop(0, "#2f7697");
  sea.addColorStop(1, "#1d5375");
  g.fillStyle = sea;
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.strokeStyle = "rgba(220, 240, 255, 0.22)";
  g.lineWidth = 0.9;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * WORLD_W, y = rnd() * WORLD_H;
    g.beginPath();
    g.arc(x, y, 3.2, Math.PI * 1.15, Math.PI * 1.85);
    g.arc(x + 5.6, y, 3.2, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }
  g.lineJoin = "round";
  for (const [w, a] of [[30, 0.12], [18, 0.16], [9, 0.22]]) {
    landPath();
    g.strokeStyle = `rgba(160, 228, 236, ${a})`;
    g.lineWidth = w;
    g.stroke();
  }

  // ---- the land: plains, then the regions' colours blended over it ----
  g.save();
  landPath();
  g.clip();
  g.fillStyle = "#9cbf6e";
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  const blob = (x: number, y: number, r: number, color: string, a = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, color);
    gr.addColorStop(0.55, color);
    gr.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
    g.globalAlpha = a;
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  };
  blob(450, 320, 130, "rgba(170, 204, 118, 1)");    // central plains, a little lighter
  blob(200, 300, 120, "rgba(110, 160, 86, 1)");     // western woods
  blob(440, 480, 120, "rgba(230, 206, 146, 1)");    // desert
  blob(370, 460, 90, "rgba(226, 198, 132, 1)");
  blob(520, 470, 70, "rgba(226, 204, 140, 1)");
  blob(470, 590, 110, "rgba(78, 139, 74, 1)");      // southern jungle
  blob(370, 575, 90, "rgba(84, 140, 76, 1)");
  blob(590, 560, 70, "rgba(86, 146, 80, 1)");
  blob(740, 150, 150, "rgba(196, 192, 124, 1)");    // steppe
  blob(835, 140, 110, "rgba(190, 186, 120, 1)");
  blob(780, 340, 90, "rgba(132, 150, 118, 1)");     // the frontier
  blob(895, 320, 100, "rgba(92, 74, 102, 1)");      // demon lands
  blob(900, 400, 70, "rgba(98, 76, 104, 1)");
  for (const [x, y, r] of [[300, 80, 170], [440, 60, 150], [180, 120, 110], [580, 70, 110]]) blob(x, y, r, "rgba(238, 243, 246, 1)"); // snow
  blob(872, 550, 40, "rgba(166, 200, 120, 1)");     // Osaki's green island
  // a painterly grain
  for (let i = 0; i < 5000; i++) {
    const x = rnd() * WORLD_W, y = rnd() * WORLD_H;
    g.fillStyle = rnd() < 0.5 ? "rgba(255, 255, 240, 0.07)" : "rgba(40, 50, 20, 0.07)";
    g.fillRect(x, y, 1.6, 1.6);
  }
  // demon land scars
  g.strokeStyle = "rgba(170, 60, 90, 0.35)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const x = 860 + rnd() * 80, y = 250 + rnd() * 170;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 6 + rnd() * 8, y + 3 - rnd() * 6);
    g.lineTo(x + 10 + rnd() * 10, y + 6 + rnd() * 4);
    g.stroke();
  }
  // dunes
  g.strokeStyle = "rgba(170, 130, 70, 0.45)";
  g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * 85;
    const x = 430 + Math.cos(a) * r * 1.2, y = 475 + Math.sin(a) * r * 0.6;
    g.beginPath();
    g.arc(x, y + 4, 5, Math.PI * 1.2, Math.PI * 1.8);
    g.stroke();
  }
  // the oasis
  g.fillStyle = "#4f9cc4";
  g.beginPath();
  g.ellipse(432, 470, 7, 4, 0.3, 0, Math.PI * 2);
  g.fill();

  // ---- rivers ----
  const river = (pts: Pt[]) => {
    for (const [w, col] of [[3, "#3d7fa3"], [1.4, "#7cc0df"]] as [number, string][]) {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      g.strokeStyle = col;
      g.lineWidth = w;
      g.lineCap = "round";
      g.stroke();
    }
  };
  river([[430, 165], [450, 220], [475, 270], [505, 300], [536, 312]]);
  river([[300, 150], [255, 205], [190, 245], [140, 268], [88, 272]]);
  river([[845, 255], [800, 262], [745, 290], [700, 318]]);
  river([[640, 120], [610, 160], [600, 200], [612, 238]]);
  g.restore();

  // the coast line
  landPath();
  g.strokeStyle = "rgba(70, 52, 30, 0.85)";
  g.lineWidth = 1.5;
  g.stroke();

  // ---- forests and mountains, back to front ----
  type Glyph = { x: number; y: number; draw: () => void };
  const glyphs: Glyph[] = [];
  const tree = (x: number, y: number, dark: string, light: string, s = 1) => glyphs.push({ x, y, draw: () => {
    g.fillStyle = "rgba(30, 40, 20, 0.35)";
    g.beginPath();
    g.ellipse(x + 1, y + 1, 4.2 * s, 2 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = dark;
    g.beginPath();
    g.arc(x, y - 3 * s, 4.2 * s, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = light;
    g.beginPath();
    g.arc(x - 1.3 * s, y - 4.3 * s, 2.2 * s, 0, Math.PI * 2);
    g.fill();
  } });
  const pine = (x: number, y: number) => glyphs.push({ x, y, draw: () => {
    g.fillStyle = "#2f5a3c";
    g.beginPath();
    g.moveTo(x, y - 11);
    g.lineTo(x + 4.5, y);
    g.lineTo(x - 4.5, y);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(240, 248, 255, 0.85)";
    g.beginPath();
    g.moveTo(x, y - 11);
    g.lineTo(x + 1.8, y - 6.5);
    g.lineTo(x - 1.8, y - 6.5);
    g.closePath();
    g.fill();
  } });
  const forest = (cx: number, cy: number, rx: number, ry: number, n: number, kind: "wood" | "jungle" | "pine") => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = cx + Math.cos(a) * r * rx, y = cy + Math.sin(a) * r * ry;
      if (kind === "pine") pine(x, y);
      else if (kind === "jungle") tree(x, y, "#2f6b34", "#5ea05a", 1.1);
      else tree(x, y, "#3f7a3c", "#79b062");
    }
  };
  forest(200, 300, 62, 50, 46, "wood");
  forest(150, 400, 30, 30, 14, "wood");
  forest(420, 220, 34, 22, 16, "wood");
  forest(470, 575, 70, 22, 44, "jungle");
  forest(370, 560, 40, 20, 22, "jungle");
  forest(585, 545, 30, 20, 16, "jungle");
  forest(590, 112, 40, 22, 22, "pine");
  forest(250, 130, 40, 18, 16, "pine");
  forest(760, 380, 26, 18, 12, "wood");
  forest(878, 548, 14, 8, 8, "wood");
  const mountain = (x: number, y: number, h: number, rock: [string, string], snow: boolean) => glyphs.push({ x, y, draw: () => {
    const w = h * 1.05;
    g.fillStyle = rock[0];
    g.beginPath();
    g.moveTo(x - w, y);
    g.lineTo(x, y - h);
    g.lineTo(x, y);
    g.closePath();
    g.fill();
    g.fillStyle = rock[1];
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + w, y);
    g.lineTo(x, y);
    g.closePath();
    g.fill();
    if (snow) {
      g.fillStyle = "#f4f8fb";
      g.beginPath();
      g.moveTo(x - w * 0.36, y - h * 0.64);
      g.lineTo(x, y - h);
      g.lineTo(x + w * 0.36, y - h * 0.64);
      g.lineTo(x + w * 0.12, y - h * 0.56);
      g.lineTo(x - w * 0.08, y - h * 0.68);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = "rgba(50, 40, 30, 0.75)";
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(x - w, y);
    g.lineTo(x, y - h);
    g.lineTo(x + w, y);
    g.stroke();
  } });
  const range = (pts: Pt[], step: number, h: [number, number], rock: [string, string], snow: boolean) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
      for (let t = 0; t < L; t += step) {
        const f = t / L;
        const ox = -(by - ay) / L, oy = (bx - ax) / L, off = (rnd() - 0.5) * 30; // across the range
        mountain(ax + (bx - ax) * f + ox * off, ay + (by - ay) * f + oy * off + (rnd() - 0.5) * 6, h[0] + rnd() * (h[1] - h[0]), rock, snow);
      }
    }
  };
  range([[190, 160], [300, 145], [390, 158], [470, 172], [560, 160], [640, 175]], 15, [14, 24], ["#b9ab8f", "#887a63"], true);
  range([[870, 190], [858, 260], [848, 330], [830, 400]], 12, [12, 21], ["#8a7d8c", "#5f5463"], false);
  range([[150, 230], [138, 290], [128, 340]], 18, [9, 14], ["#a69a7e", "#7d715b"], false);
  range([[680, 520], [700, 470]], 14, [7, 10], ["#a69a7e", "#7d715b"], false);
  glyphs.sort((a, b) => a.y - b.y);
  for (const gl of glyphs) gl.draw();

  // ---- roads (dotted) and sea routes (dashed) ----
  const path = (pts: Pt[], dash: number[], under: string, over: string, w: number) => {
    for (const [col, lw] of [[under, w + 1.6], [over, w]] as [string, number][]) {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      g.setLineDash(dash);
      g.strokeStyle = col;
      g.lineWidth = lw;
      g.lineCap = "round";
      g.stroke();
    }
    g.setLineDash([]);
  };
  const road = (pts: Pt[]) => path(pts, [2.5, 3.5], "rgba(80, 60, 30, 0.55)", "#f1e2b4", 1.6);
  const sail = (pts: Pt[]) => path(pts, [5, 5], "rgba(20, 50, 70, 0.0)", "rgba(240, 250, 255, 0.55)", 1.2);
  road([[503, 236], [470, 170], [440, 120], [425, 80]]);
  road([[503, 236], [560, 215], [640, 185], [715, 152]]);
  road([[715, 152], [760, 220], [790, 318]]);
  road([[515, 332], [505, 290], [503, 236]]);
  road([[515, 332], [480, 395], [445, 458], [470, 520], [505, 584]]);
  sail([[540, 340], [600, 420], [690, 495], [790, 525], [842, 545]]);
  sail([[540, 340], [610, 430], [680, 510], [665, 600], [570, 622], [510, 610]]);
  // the open way: Eden to its western field
  path([[515, 332], [490, 334], [462, 340]], [3, 3], "rgba(80, 60, 30, 0.7)", "#ffe28a", 2.2);

  // ---- a compass rose and the frame ----
  const cx = 80, cy = 560;
  g.save();
  g.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    const long = i % 2 === 0, r = long ? 34 : 20;
    g.rotate(Math.PI / 4);
    for (const [side, col] of [[1, "#f4e6c0"], [-1, "#b8955a"]] as [number, string][]) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, -r);
      g.lineTo(5 * side, -5);
      g.lineTo(0, 0);
      g.closePath();
      g.fill();
    }
  }
  g.strokeStyle = "rgba(244, 230, 192, 0.8)";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, 0, 24, 0, Math.PI * 2);
  g.stroke();
  g.restore();
  g.font = "600 13px Kanit, sans-serif";
  g.textAlign = "center";
  g.fillStyle = "#f4e6c0";
  g.fillText("N", cx, cy - 39);

  // a soft vignette and a gold rule round the edge
  const v = g.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.45, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.62);
  v.addColorStop(0, "rgba(0, 0, 0, 0)");
  v.addColorStop(1, "rgba(10, 20, 30, 0.45)");
  g.fillStyle = v;
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  g.strokeStyle = "rgba(244, 210, 122, 0.75)";
  g.lineWidth = 2;
  g.strokeRect(5, 5, WORLD_W - 10, WORLD_H - 10);
  g.lineWidth = 0.8;
  g.strokeRect(10, 10, WORLD_W - 20, WORLD_H - 20);
  return c;
}

// A place's mark, `s` pixels per map unit, centred on (x, y) in pixels.
export function drawPlace(g: CanvasRenderingContext2D, p: Place, x: number, y: number, s: number): void {
  const k = Math.max(0.75, s);
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  g.lineWidth = 1.2;
  g.strokeStyle = "#3a2c1a";
  const wall = p.open ? "#f3e3bb" : "#c4bdb0", roof = p.open ? "#c6553c" : "#867d72";
  if (p.kind === "capital" || p.kind === "castle") {
    // a keep with two towers and a flag
    g.fillStyle = wall;
    g.beginPath();
    g.rect(-9, -7, 18, 10);
    g.rect(-12, -13, 6, 16);
    g.rect(6, -13, 6, 16);
    g.rect(-3.5, -17, 7, 10);
    g.fill();
    g.stroke();
    g.fillStyle = roof;
    for (const [tx, ty, tw] of [[-12, -13, 6], [6, -13, 6], [-3.5, -17, 7]] as Pt3[]) {
      g.beginPath();
      g.moveTo(tx - 1, ty);
      g.lineTo(tx + tw / 2, ty - 6);
      g.lineTo(tx + tw + 1, ty);
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.fillStyle = "#3a2c1a";
    g.fillRect(-2, -2, 4, 5);
    if (p.kind === "capital") {
      g.beginPath();
      g.moveTo(0, -23);
      g.lineTo(0, -31);
      g.stroke();
      g.fillStyle = "#f4d27a";
      g.beginPath();
      g.moveTo(0, -31);
      g.lineTo(7, -28.5);
      g.lineTo(0, -26);
      g.closePath();
      g.fill();
    }
  } else if (p.kind === "field") {
    // a slime in the grass
    g.fillStyle = "#79d6c9";
    g.beginPath();
    g.moveTo(-7, 3);
    g.quadraticCurveTo(-8, -6, 0, -9);
    g.quadraticCurveTo(8, -6, 7, 3);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#1c2416";
    g.fillRect(-3, -3, 1.6, 2.4);
    g.fillRect(1.6, -3, 1.6, 2.4);
  } else {
    // two houses
    for (const [hx, hy, hw] of [[-8, -2, 9], [0, 1, 10]] as Pt3[]) {
      g.fillStyle = wall;
      g.fillRect(hx, hy - 7, hw, 8);
      g.strokeRect(hx, hy - 7, hw, 8);
      g.fillStyle = roof;
      g.beginPath();
      g.moveTo(hx - 1.5, hy - 7);
      g.lineTo(hx + hw / 2, hy - 13);
      g.lineTo(hx + hw + 1.5, hy - 7);
      g.closePath();
      g.fill();
      g.stroke();
    }
  }
  g.restore();
}
type Pt3 = [number, number, number];
