// The world map (M twice): the continent painted from code like a Ragnarok map, with the towns
// of the town kits (src/world3d/kits) where their regions say they lie. Eden sits in the
// central plains on the inner sea, Iceberg in the snowy north, Trunrada on the cold north-east
// steppe, Kradia on the eastern frontier facing the demon lands, Bahamas in the desert south of
// the capital, Yodia on the southern coast by the jungle and Osaki on its island out east; west
// of Eden the west lands (docs/west_lands.md): the old capital Noa at their crossroads, Highland
// Hill under the snowy mountains, the port of Suzhou at the far west and Venezia on its lagoon.
// The fields lie along the roads between them (src/maps.ts). Only the places that have a map in
// the game are open.
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
  { id: "iceberg", name: "ไอซ์เบิร์ก", region: "แดนเหนือ", kind: "town", open: true, x: 425, y: 80,
    desc: "เมืองท่าแห่งหิมะที่หนาวตลอดปี บ้านไม้ซุงหลังคาชันหิมะหนา โถงใหญ่หัวมังกร และท่าเรือที่มีน้ำแข็งลอย" },
  { id: "trunrada", name: "ทรุนราดา", region: "ทุ่งหญ้าสเตปป์ตะวันออกเฉียงเหนือ", kind: "town", open: true, x: 715, y: 152,
    desc: "เมืองชายแดนของชนเผ่า กระโจมสักหลาดกับบ้านยาวหลังคาหญ้า กังหันลมบนเนิน หินตั้งโบราณ และวัฒนธรรมม้า" },
  { id: "kradia", name: "คราเดีย", region: "ชายแดนตะวันออก", kind: "town", open: true, x: 790, y: 318,
    desc: "นครแห่งเวทมนตร์และป้อมปราการที่คอยกันอสูรจากฝั่งตะวันออก หอคอยจอมเวท ผลึกเรืองแสง ธงสีม่วงทอง" },
  { id: "bahamas", name: "บาฮามัส", region: "กลางทะเลทราย ทางแยกสู่ภาคใต้", kind: "town", open: true, x: 445, y: 458,
    desc: "เมืองคาราวานกลางผืนทราย บ้านดินโดมสีฟ้าคราม ตลาดบาซาร์ และโอเอซิสร่มรื่นด้วยต้นปาล์ม" },
  { id: "yodia", name: "โยเดีย", region: "เมืองท่าแดนใต้ ชายป่า", kind: "town", open: true, x: 505, y: 584,
    desc: "เมืองท่าค้าขายใหญ่อันดับสอง โกดังไม้และด่านศุลกากรเรียงริมท่า บ้านใต้ถุนสูงหลังคามุงจากชิดชายป่า" },
  { id: "osaki", name: "โอซากิ", region: "เกาะทางตะวันออก ไปได้ทางเรือเท่านั้น", kind: "town", open: true, x: 856, y: 558, side: "left",
    desc: "เมืองเกาะแบบญี่ปุ่น หลังคากระเบื้องปลายงอน เสาแดงชาด ซากุระ เจดีย์ห้าชั้น" },
  { id: "noa", name: "โนอา", region: "เมืองหลวงเก่า ชุมทางแดนตะวันตก", kind: "town", open: true, x: 330, y: 300,
    desc: "เมืองหลวงแรกของอาณาจักร ตึกหินเก่าแก่แบบอีเดน ซากวังเก่า ท่อส่งน้ำโบราณ ถนนจากทุกทิศของแดนตะวันตกมาบรรจบที่นี่" },
  { id: "suzhou", name: "ซูโจว", region: "เมืองท่าตะวันตกสุดของทวีป", kind: "town", open: true, x: 104, y: 318,
    desc: "เมืองท่าแบบจีน หลังคาโค้งปลายงอน เสาแดง คลอง สะพานโค้ง เจดีย์ริมท่า และเรือสำเภาจากทะเลตะวันตก" },
  { id: "highland", name: "ไฮแลนด์ ฮิล", region: "เชิงเขาหิมะ ถิ่นกำเนิดบรรพบุรุษ", kind: "town", open: true, x: 262, y: 158,
    desc: "เมืองโบราณเชิงเขาที่หิมะคลุม ตึกหินหลังคาชัน เรือนกระจกปลูกผัก และหินบรรพบุรุษกลางเมือง" },
  { id: "venezia", name: "เวนิชเซีย", region: "เมืองท่าบนลากูน ชายฝั่งตะวันตกเฉียงใต้", kind: "town", open: true, x: 218, y: 494,
    desc: "เมืองแห่งสายน้ำ คลองแทนถนน กอนโดลา สะพานโค้ง ตึกสีพาสเทล จัตุรัสมหาวิหาร และท่าเรือใหญ่" },
  // ---- the fields along the roads ----
  { id: "west_woods", name: "ป่าใหญ่ตะวันตก", region: "ตะวันตกของทุ่งหญ้าตะวันตก · Lv 8-15", kind: "field", open: true, x: 418, y: 352, side: "left",
    desc: "ป่าโอ๊กทึบ ลำธารกับสะพานไม้ ลึกเข้าไปมีของดีซ่อนอยู่" },
  { id: "royal_road", name: "ถนนหลวง", region: "จากประตูเหนืออีเดนถึงปราสาท · Lv 10-18", kind: "field", open: true, x: 524, y: 286,
    desc: "ถนนหินตัดทุ่งข้าวสาลี ด่านทหาร กังหันน้ำริมแม่น้ำ ปลายทางคือประตูปราสาทหลวง" },
  { id: "snow_foothills", name: "เชิงเขาหิมะ", region: "เหนือปราสาท ทางขึ้นเขา · Lv 35-45", kind: "field", open: true, x: 466, y: 182, side: "left",
    desc: "เนินสนที่หิมะเริ่มปกคลุม ไต่ระดับขึ้นสู่เทือกเขา" },
  { id: "ice_pass", name: "ช่องเขาน้ำแข็ง", region: "ทางลงใต้ของไอซ์เบิร์ก · Lv 45-55", kind: "field", open: true, x: 446, y: 126, side: "left",
    desc: "ทางแคบระหว่างหน้าผาน้ำแข็ง สะพานเชือกข้ามหุบเหว" },
  { id: "north_icefield", name: "ทุ่งน้ำแข็งเหนือ", region: "เหนือไอซ์เบิร์ก ริมทะเลเหนือ · Lv 55-70", kind: "field", open: true, x: 470, y: 66,
    desc: "ทุ่งหิมะกว้าง ทะเลสาบน้ำแข็ง และชายฝั่งทะเลเหนือ" },
  { id: "pine_river", name: "ป่าสนริมแม่น้ำ", region: "ตะวันออกของปราสาท · Lv 20-30", kind: "field", open: true, x: 568, y: 214,
    desc: "ป่าสน แม่น้ำไหลลงจากเขา และค่ายคนตัดไม้" },
  { id: "west_steppe", name: "สเตปป์ตะวันตก", region: "ตะวันตกของทรุนราดา · Lv 30-40", kind: "field", open: true, x: 640, y: 186,
    desc: "ทุ่งหญ้าแห้งสุดสายตา หินตั้ง กองฟาง และค่ายคนเลี้ยงสัตว์" },
  { id: "horse_meadow", name: "ทุ่งเลี้ยงม้า", region: "เหนือทรุนราดา ริมทะเลเหนือ · Lv 40-50", kind: "field", open: true, x: 716, y: 100,
    desc: "เนินหญ้าริมทะเล คอกม้าร้างของชนเผ่า" },
  { id: "stone_plain", name: "ที่ราบหินโบราณ", region: "ระหว่างทรุนราดากับคราเดีย · Lv 50-60", kind: "field", open: true, x: 764, y: 234,
    desc: "วงหินโบราณบนที่ราบสูง หุบผา และแม่น้ำ" },
  { id: "border_woods", name: "ป่าชายแดน", region: "ใต้คราเดีย · Lv 60-70", kind: "field", open: true, x: 792, y: 392,
    desc: "ป่าใบแดงกับฐานลาดตระเวนของทหารคราเดีย" },
  { id: "border_line", name: "แนวป้องกันชายแดน", region: "ตะวันออกของคราเดีย · Lv 70-85", kind: "field", open: true, x: 846, y: 318,
    desc: "สนามรบเก่า เครื่องยิงหินพัง สิ่งกีดขวาง และสนามเพลาะ" },
  { id: "demon_land", name: "ดินแดนอสูร", region: "สุดชายแดนตะวันออก · Lv 85-100", kind: "field", open: true, x: 902, y: 300,
    desc: "แผ่นดินสีม่วงดำ ผลึกมืด และรอยแยกของพื้นดิน" },
  { id: "south_savanna", name: "ทุ่งสะวันนาใต้", region: "ใต้ประตูใต้ของอีเดน · Lv 12-20", kind: "field", open: true, x: 494, y: 376,
    desc: "หญ้าสูงสีทอง ต้นไม้ยืนต้นเดี่ยว และทางเกวียน" },
  { id: "desert_edge", name: "ขอบทะเลทราย", region: "เหนือบาฮามัส · Lv 20-30", kind: "field", open: true, x: 464, y: 418, side: "left",
    desc: "ทรายปนหิน กระบองเพชร และซุ้มหินโค้งธรรมชาติ" },
  { id: "great_desert", name: "ทะเลทรายใหญ่", region: "ตะวันออกของบาฮามัส · Lv 30-45", kind: "field", open: true, x: 512, y: 462,
    desc: "เนินทรายสุดตา ซากวิหารโบราณครึ่งจมทราย และโอเอซิสเล็ก" },
  { id: "south_jungle", name: "ป่าดิบแดนใต้", region: "ระหว่างบาฮามัสกับโยเดีย · Lv 25-35", kind: "field", open: true, x: 470, y: 524, side: "left",
    desc: "ป่าทึบ เถาวัลย์ บ่อโคลน และซากโบราณที่ถูกป่ากลืน" },
  { id: "mangrove_coast", name: "ชายฝั่งป่าชายเลน", region: "ตะวันออกของโยเดีย · Lv 35-45", kind: "field", open: true, x: 566, y: 584,
    desc: "ป่าชายเลน หาดทราย และซากเรือเกยฝั่ง" },
  { id: "sakura_hills", name: "เนินซากุระ", region: "ประตูภูเขาของโอซากิ · Lv 45-60", kind: "field", open: true, x: 884, y: 546,
    desc: "ป่าไผ่ ทุ่งซากุระ และศาลเจ้าร้างบนเนิน" },
  { id: "volcano", name: "ยอดภูเขาไฟ", region: "กลางเกาะโอซากิ · Lv 60-75", kind: "field", open: true, x: 898, y: 528,
    desc: "หินลาวาดำ บ่อน้ำร้อน ควันกำมะถัน และปล่องภูเขาไฟเรืองแดง" },
  // ---- the west lands (docs/west_lands.md) ----
  { id: "noa_meadow", name: "ทุ่งหญ้าโนอา", region: "ตะวันออกเฉียงเหนือของโนอา · Lv 30-40", kind: "field", open: true, x: 385, y: 262,
    desc: "ทุ่งหญ้ากว้างลมแรง ดอกไม้ป่า กำแพงหินเตี้ย กังหันลม และฝูงแกะ" },
  { id: "noa_plains", name: "ที่ราบใต้โนอา", region: "ระหว่างโนอากับเวนิชเซีย · Lv 40-50", kind: "field", open: true, x: 280, y: 395,
    desc: "ไร่องุ่นกับทุ่งข้าวสาลี ถนนหินโบราณ หลักไมล์ และซากท่อส่งน้ำ" },
  { id: "dry_plains", name: "ที่ราบแห้งแล้ง", region: "ระหว่างเวนิชเซียกับบาฮามัส · Lv 50-62", kind: "field", open: true, x: 330, y: 455,
    desc: "ทุ่งหญ้าแห้งติดทะเลทราย พุ่มไม้แห้ง เนินหินยอดตัด และเส้นทางคาราวาน" },
  { id: "elder_forest", name: "ป่าโบราณ", region: "ตะวันตกของโนอา · Lv 62-74", kind: "field", open: true, x: 215, y: 300,
    desc: "ต้นไม้ยักษ์อายุพันปี มอสหนา เห็ดเรืองแสง และศาลหินยุคโนอา" },
  { id: "rice_terraces", name: "นาขั้นบันได", region: "ใต้ซูโจว · Lv 74-86", kind: "field", open: true, x: 138, y: 385,
    desc: "นาขั้นบันไดมีน้ำขัง กระท่อมชาวนา ควาย และกังหันน้ำ" },
  { id: "highland_downs", name: "ที่ราบเนินเขา", region: "ตะวันตกของไฮแลนด์ ฮิล · Lv 86-98", kind: "field", open: true, x: 178, y: 172, side: "left",
    desc: "เนินลอนคลื่นหิมะบาง กองหินบอกทาง กำแพงหินแห้ง และวงหินโบราณ" },
  { id: "karst_peaks", name: "ภูผาหินปูน", region: "ระหว่างที่ราบเนินเขากับช่องเขาตะวันตก · Lv 98-110", kind: "field", open: true, x: 118, y: 228,
    desc: "ยอดเขาหินปูนเป็นแท่ง หมอกลอย ลำธาร และศาลาบนผา" },
  { id: "ancient_plain", name: "ที่ราบโบราณ", region: "ตะวันออกเฉียงใต้ของเวนิชเซีย · Lv 110-122", kind: "field", open: true, x: 300, y: 522,
    desc: "ซากเมืองยุคก่อน รูปปั้นยักษ์ล้ม แนวเสา และประตูชัยพัง" },
  { id: "frozen_river", name: "แม่น้ำเยือกแข็ง", region: "ระหว่างโนอากับไฮแลนด์ ฮิล · Lv 122-134", kind: "field", open: true, x: 300, y: 222,
    desc: "แม่น้ำกว้างที่แข็งเป็นน้ำแข็ง สะพานหินเก่าครึ่งพัง ฝั่งเหนือหิมะเริ่มตก" },
  { id: "west_pass", name: "ช่องเขาตะวันตก", region: "ระหว่างป่าโบราณกับซูโจว · Lv 134-146", kind: "field", open: true, x: 140, y: 285,
    desc: "ทางคดเคี้ยวผ่านหน้าผา ด่านเก่า และสะพานเชือก" },
  { id: "tangled_hills", name: "เนินเขาวงกต", region: "ตะวันออกของไฮแลนด์ ฮิล · Lv 146-158", kind: "field", open: true, x: 350, y: 140,
    desc: "เนินและหุบแคบซ้อนกันเหมือนเขาวงกต ไต่ขึ้นลงหลายชั้น" },
  { id: "lagoon_marsh", name: "บึงลากูน", region: "ระหว่างนาขั้นบันไดกับที่ราบใต้โนอา · Lv 158-170", kind: "field", open: true, x: 200, y: 425,
    desc: "บึงกว้าง กกสูง ทางเดินไม้ ซากบ้านใต้ถุนสูง และหมอกพิษ" },
  { id: "royal_necropolis", name: "สุสานหลวงโบราณ", region: "ระหว่างที่ราบโบราณกับป่าดิบแดนใต้ · Lv 170-182", kind: "field", open: true, x: 375, y: 548,
    desc: "สุสานกษัตริย์ยุคแรก หลุมศพหิน รูปปั้นเฝ้าสุสาน ที่ป่าแดนใต้เริ่มกลืน" },
  { id: "north_cliffs", name: "หน้าผาทะเลเหนือ", region: "เหนือไฮแลนด์ ฮิล · Lv 182-192", kind: "field", open: true, x: 232, y: 92,
    desc: "หน้าผาริมทะเลน้ำแข็ง แท่งหินกลางทะเล และประภาคารร้าง" },
  { id: "west_cape", name: "แหลมทะเลตะวันตก", region: "ตะวันตกสุดของทวีป · Lv 188-200", kind: "field", open: true, x: 58, y: 360,
    desc: "แหลมสุดทวีป ทะเลคลั่ง ซากเรือ และศาลมังกรทะเล" },
];

// names over the land and sea
export const REGIONS: { x: number; y: number; text: string; sea?: boolean }[] = [
  { x: 372, y: 104, text: "แดนเหนือ" },
  { x: 200, y: 350, text: "แดนตะวันตก" },
  { x: 160, y: 132, text: "ที่ราบสูง" },
  { x: 790, y: 108, text: "ทุ่งสเตปป์" },
  { x: 885, y: 300, text: "ดินแดนอสูร" },
  { x: 770, y: 420, text: "ชายแดนตะวันออก" },
  { x: 446, y: 298, text: "ที่ราบภาคกลาง" },
  { x: 392, y: 494, text: "ทะเลทราย" },
  { x: 432, y: 580, text: "ป่าแดนใต้" },
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
  [[834, 552], [848, 530], [878, 514], [906, 516], [920, 536], [908, 566], [878, 580], [848, 576]], // Osaki
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
  blob(320, 400, 60, "rgba(176, 196, 112, 1)");     // Noa's farmland
  blob(330, 450, 55, "rgba(204, 188, 128, 1)");     // the dry plains
  blob(200, 430, 45, "rgba(96, 140, 104, 1)");      // the lagoon marsh
  blob(140, 385, 40, "rgba(150, 196, 104, 1)");     // rice terraces
  blob(310, 535, 50, "rgba(184, 178, 136, 1)");     // the ancient plain
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
  for (const [x, y, r] of [[300, 80, 170], [440, 60, 150], [180, 120, 110], [580, 70, 110], [300, 200, 50]]) blob(x, y, r, "rgba(238, 243, 246, 1)"); // snow
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

  // Venezia's lagoon
  g.fillStyle = "#4f9cc4";
  g.beginPath();
  g.ellipse(214, 470, 16, 9, 0.6, 0, Math.PI * 2);
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
  river([[345, 170], [318, 205], [285, 222], [235, 236], [180, 250], [135, 266], [88, 272]]);
  river([[322, 318], [296, 365], [262, 420], [230, 462]]);
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
  forest(200, 300, 42, 34, 34, "wood");
  forest(372, 548, 26, 14, 12, "jungle");
  forest(120, 225, 20, 16, 8, "pine");
  forest(150, 400, 30, 30, 14, "wood");
  forest(420, 220, 34, 22, 16, "wood");
  forest(470, 575, 70, 22, 44, "jungle");
  forest(370, 560, 40, 20, 22, "jungle");
  forest(585, 545, 30, 20, 16, "jungle");
  forest(590, 112, 40, 22, 22, "pine");
  forest(224, 204, 24, 10, 9, "pine");
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
  range([[300, 128], [390, 158], [470, 172], [560, 160], [640, 175]], 15, [14, 24], ["#b9ab8f", "#887a63"], true);
  // the karst towers west of the highlands
  for (const [x, y] of [[104, 214], [116, 236], [128, 218], [110, 246], [132, 240], [98, 230]]) mountain(x, y, 11 + rnd() * 5, ["#9fae8c", "#748463"], false);
  range([[870, 190], [858, 260], [848, 330], [830, 400]], 12, [12, 21], ["#8a7d8c", "#5f5463"], false);
  range([[160, 262], [150, 300], [140, 340]], 14, [9, 14], ["#a69a7e", "#7d715b"], false);
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
  // the ways out of the towns to the fields off the main roads
  road([[515, 332], [490, 334], [462, 340], [418, 352]]);
  road([[425, 80], [470, 66]]);
  road([[715, 152], [716, 100]]);
  road([[790, 318], [846, 318], [902, 300]]);
  road([[790, 318], [792, 392]]);
  road([[445, 458], [512, 462]]);
  road([[505, 584], [566, 584]]);
  road([[856, 558], [884, 546], [898, 528]]);
  // the west lands: Noa at the crossroads
  road([[418, 352], [380, 328], [330, 300]]);
  road([[330, 300], [385, 262]]);
  road([[330, 300], [300, 222], [262, 158]]);
  road([[262, 158], [232, 92]]);
  road([[262, 158], [178, 172], [118, 228], [140, 285]]);
  road([[262, 158], [350, 140], [410, 165], [466, 182]]);
  road([[330, 300], [215, 300], [140, 285], [104, 318]]);
  road([[104, 318], [58, 360]]);
  road([[104, 318], [138, 385], [200, 425], [280, 395]]);
  road([[330, 300], [280, 395], [218, 494]]);
  road([[218, 494], [330, 455], [445, 458]]);
  road([[218, 494], [300, 522], [375, 548], [470, 524]]);
  // the ships out of Eden's harbour
  sail([[540, 340], [600, 420], [690, 495], [790, 525], [836, 552]]);
  sail([[540, 340], [610, 430], [680, 510], [665, 600], [570, 622], [510, 610]]);
  // on west along the south coast to Venezia, and up the west coast to Suzhou
  sail([[510, 612], [420, 630], [320, 616], [262, 590], [226, 556], [206, 516]]);
  sail([[206, 516], [160, 482], [120, 444], [80, 418], [40, 392], [30, 350], [60, 322], [92, 318]]);

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
