// The world map (M, then its tab): the world as a grid of squares, one for each map of the
// game, each square that map's own picture from straight above, north up, laid side by side the
// way their ways out meet, as Ragnarok draws its world. A map with two ways out on one side
// (Noa's east wall, Venezia's) or one at a corner meets that neighbour at the corner. The squares
// no map fills are the sea or land nobody has charted (GROUND).
//
// The pictures are made ahead of time by tools/world_tiles.cjs (every map loaded in the game and
// photographed from above, the square tileArea() gives) and kept in
// public/assets/worldmap/<id>.webp. Eden is the square at column 0, row 0; columns run east,
// rows south.

export interface Place {
  id: string; // the game map's id where there is one
  name: string;
  region: string;
  desc: string;
  kind: "capital" | "town" | "field" | "castle";
  open: boolean;
  col: number; // its square: columns east, rows south of Eden
  row: number;
}

export const PLACES: Place[] = [
  { id: "eden", name: "อีเดน", region: "ที่ราบภาคกลาง ริมทะเลใน", kind: "capital", open: true, col: 0, row: 0,
    desc: "เมืองหลวงของอาณาจักรและเมืองเริ่มต้น มหาวิหาร ตลาด ลานน้ำพุ และท่าเรือที่เรือจากทุกทิศมาจอด" },
  { id: "field", name: "ทุ่งหญ้าตะวันตก", region: "นอกประตูตะวันตกของอีเดน", kind: "field", open: true, col: -1, row: 0,
    desc: "ทุ่งหญ้ากับลานบ้านไร่ มีสไลม์หลายสี ที่ฝึกฝีมือของนักผจญภัยหน้าใหม่" },
  { id: "castle", name: "ปราสาทหลวง", region: "เหนือเมืองอีเดน", kind: "castle", open: false, col: 0, row: -2,
    desc: "ปราสาทของกษัตริย์ ขึ้นไปทางประตูเหนือของอีเดน ซึ่งยังปิดซ่อมอยู่" },
  { id: "iceberg", name: "ไอซ์เบิร์ก", region: "แดนเหนือ", kind: "town", open: true, col: -1, row: -4,
    desc: "เมืองท่าแห่งหิมะที่หนาวตลอดปี บ้านไม้ซุงหลังคาชันหิมะหนา โถงใหญ่หัวมังกร และท่าเรือที่มีน้ำแข็งลอย" },
  { id: "trunrada", name: "ทรุนราดา", region: "ทุ่งหญ้าสเตปป์ตะวันออกเฉียงเหนือ", kind: "town", open: true, col: 3, row: -1,
    desc: "เมืองชายแดนของชนเผ่า กระโจมสักหลาดกับบ้านยาวหลังคาหญ้า กังหันลมบนเนิน หินตั้งโบราณ และวัฒนธรรมม้า" },
  { id: "kradia", name: "คราเดีย", region: "ชายแดนตะวันออก", kind: "town", open: true, col: 4, row: 0,
    desc: "นครแห่งเวทมนตร์และป้อมปราการที่คอยกันอสูรจากฝั่งตะวันออก หอคอยจอมเวท ผลึกเรืองแสง ธงสีม่วงทอง" },
  { id: "bahamas", name: "บาฮามัส", region: "กลางทะเลทราย ทางแยกสู่ภาคใต้", kind: "town", open: true, col: 0, row: 3,
    desc: "เมืองคาราวานกลางผืนทราย บ้านดินโดมสีฟ้าคราม ตลาดบาซาร์ และโอเอซิสร่มรื่นด้วยต้นปาล์ม" },
  { id: "yodia", name: "โยเดีย", region: "เมืองท่าแดนใต้ ชายป่า", kind: "town", open: true, col: 0, row: 5,
    desc: "เมืองท่าค้าขายใหญ่อันดับสอง โกดังไม้และด่านศุลกากรเรียงริมท่า บ้านใต้ถุนสูงหลังคามุงจากชิดชายป่า" },
  { id: "osaki", name: "โอซากิ", region: "เกาะทางตะวันออก ไปได้ทางเรือเท่านั้น", kind: "town", open: true, col: 3, row: 5,
    desc: "เมืองเกาะแบบญี่ปุ่น หลังคากระเบื้องปลายงอน เสาแดงชาด ซากุระ เจดีย์ห้าชั้น" },
  { id: "noa", name: "โนอา", region: "เมืองหลวงเก่า ชุมทางแดนตะวันตก", kind: "town", open: true, col: -3, row: 0,
    desc: "เมืองหลวงแรกของอาณาจักร ตึกหินเก่าแก่แบบอีเดน ซากวังเก่า ท่อส่งน้ำโบราณ ถนนจากทุกทิศของแดนตะวันตกมาบรรจบที่นี่" },
  { id: "suzhou", name: "ซูโจว", region: "เมืองท่าตะวันตกสุดของทวีป", kind: "town", open: true, col: -5, row: 1,
    desc: "เมืองท่าแบบจีน หลังคาโค้งปลายงอน เสาแดง คลอง สะพานโค้ง เจดีย์ริมท่า และเรือสำเภาจากทะเลตะวันตก" },
  { id: "highland", name: "ไฮแลนด์ ฮิล", region: "เชิงเขาหิมะ ถิ่นกำเนิดบรรพบุรุษ", kind: "town", open: true, col: -3, row: -2,
    desc: "เมืองโบราณเชิงเขาที่หิมะคลุม ตึกหินหลังคาชัน เรือนกระจกปลูกผัก และหินบรรพบุรุษกลางเมือง" },
  { id: "venezia", name: "เวนิชเซีย", region: "เมืองท่าบนลากูน ชายฝั่งตะวันตกเฉียงใต้", kind: "town", open: true, col: -2, row: 2,
    desc: "เมืองแห่งสายน้ำ คลองแทนถนน กอนโดลา สะพานโค้ง ตึกสีพาสเทล จัตุรัสมหาวิหาร และท่าเรือใหญ่" },
  // ---- the fields along the roads ----
  { id: "west_woods", name: "ป่าใหญ่ตะวันตก", region: "ตะวันตกของทุ่งหญ้าตะวันตก · Lv 8-15", kind: "field", open: true, col: -2, row: 0,
    desc: "ป่าโอ๊กทึบ ลำธารกับสะพานไม้ ลึกเข้าไปมีของดีซ่อนอยู่" },
  { id: "royal_road", name: "ถนนหลวง", region: "จากประตูเหนืออีเดนถึงปราสาท · Lv 10-18", kind: "field", open: true, col: 0, row: -1,
    desc: "ถนนหินตัดทุ่งข้าวสาลี ด่านทหาร กังหันน้ำริมแม่น้ำ ปลายทางคือประตูปราสาทหลวง" },
  { id: "snow_foothills", name: "เชิงเขาหิมะ", region: "เหนือปราสาท ทางขึ้นเขา · Lv 35-45", kind: "field", open: true, col: -1, row: -2,
    desc: "เนินสนที่หิมะเริ่มปกคลุม ไต่ระดับขึ้นสู่เทือกเขา" },
  { id: "ice_pass", name: "ช่องเขาน้ำแข็ง", region: "ทางลงใต้ของไอซ์เบิร์ก · Lv 45-55", kind: "field", open: true, col: -1, row: -3,
    desc: "ทางแคบระหว่างหน้าผาน้ำแข็ง สะพานเชือกข้ามหุบเหว" },
  { id: "north_icefield", name: "ทุ่งน้ำแข็งเหนือ", region: "เหนือไอซ์เบิร์ก ริมทะเลเหนือ · Lv 55-70", kind: "field", open: true, col: -1, row: -5,
    desc: "ทุ่งหิมะกว้าง ทะเลสาบน้ำแข็ง และชายฝั่งทะเลเหนือ" },
  { id: "pine_river", name: "ป่าสนริมแม่น้ำ", region: "ตะวันออกของปราสาท · Lv 20-30", kind: "field", open: true, col: 1, row: -1,
    desc: "ป่าสน แม่น้ำไหลลงจากเขา และค่ายคนตัดไม้" },
  { id: "west_steppe", name: "สเตปป์ตะวันตก", region: "ตะวันตกของทรุนราดา · Lv 30-40", kind: "field", open: true, col: 2, row: -1,
    desc: "ทุ่งหญ้าแห้งสุดสายตา หินตั้ง กองฟาง และค่ายคนเลี้ยงสัตว์" },
  { id: "horse_meadow", name: "ทุ่งเลี้ยงม้า", region: "เหนือทรุนราดา ริมทะเลเหนือ · Lv 40-50", kind: "field", open: true, col: 3, row: -2,
    desc: "เนินหญ้าริมทะเล คอกม้าร้างของชนเผ่า" },
  { id: "stone_plain", name: "ที่ราบหินโบราณ", region: "ระหว่างทรุนราดากับคราเดีย · Lv 50-60", kind: "field", open: true, col: 4, row: -1,
    desc: "วงหินโบราณบนที่ราบสูง หุบผา และแม่น้ำ" },
  { id: "border_woods", name: "ป่าชายแดน", region: "ใต้คราเดีย · Lv 60-70", kind: "field", open: true, col: 4, row: 1,
    desc: "ป่าใบแดงกับฐานลาดตระเวนของทหารคราเดีย" },
  { id: "border_line", name: "แนวป้องกันชายแดน", region: "ตะวันออกของคราเดีย · Lv 70-85", kind: "field", open: true, col: 5, row: 0,
    desc: "สนามรบเก่า เครื่องยิงหินพัง สิ่งกีดขวาง และสนามเพลาะ" },
  { id: "demon_land", name: "ดินแดนอสูร", region: "สุดชายแดนตะวันออก · Lv 85-100", kind: "field", open: true, col: 6, row: 0,
    desc: "แผ่นดินสีม่วงดำ ผลึกมืด และรอยแยกของพื้นดิน" },
  { id: "south_savanna", name: "ทุ่งสะวันนาใต้", region: "ใต้ประตูใต้ของอีเดน · Lv 12-20", kind: "field", open: true, col: 0, row: 1,
    desc: "หญ้าสูงสีทอง ต้นไม้ยืนต้นเดี่ยว และทางเกวียน" },
  { id: "desert_edge", name: "ขอบทะเลทราย", region: "เหนือบาฮามัส · Lv 20-30", kind: "field", open: true, col: 0, row: 2,
    desc: "ทรายปนหิน กระบองเพชร และซุ้มหินโค้งธรรมชาติ" },
  { id: "great_desert", name: "ทะเลทรายใหญ่", region: "ตะวันออกของบาฮามัส · Lv 30-45", kind: "field", open: true, col: 1, row: 3,
    desc: "เนินทรายสุดตา ซากวิหารโบราณครึ่งจมทราย และโอเอซิสเล็ก" },
  { id: "south_jungle", name: "ป่าดิบแดนใต้", region: "ระหว่างบาฮามัสกับโยเดีย · Lv 25-35", kind: "field", open: true, col: 0, row: 4,
    desc: "ป่าทึบ เถาวัลย์ บ่อโคลน และซากโบราณที่ถูกป่ากลืน" },
  { id: "mangrove_coast", name: "ชายฝั่งป่าชายเลน", region: "ตะวันออกของโยเดีย · Lv 35-45", kind: "field", open: true, col: 1, row: 5,
    desc: "ป่าชายเลน หาดทราย และซากเรือเกยฝั่ง" },
  { id: "sakura_hills", name: "เนินซากุระ", region: "ประตูภูเขาของโอซากิ · Lv 45-60", kind: "field", open: true, col: 4, row: 5,
    desc: "ป่าไผ่ ทุ่งซากุระ และศาลเจ้าร้างบนเนิน" },
  { id: "volcano", name: "ยอดภูเขาไฟ", region: "กลางเกาะโอซากิ · Lv 60-75", kind: "field", open: true, col: 4, row: 4,
    desc: "หินลาวาดำ บ่อน้ำร้อน ควันกำมะถัน และปล่องภูเขาไฟเรืองแดง" },
  // ---- the west lands (docs/west_lands.md) ----
  { id: "noa_meadow", name: "ทุ่งหญ้าโนอา", region: "เหนือป่าใหญ่ตะวันตก · Lv 30-40", kind: "field", open: true, col: -2, row: -1,
    desc: "ทุ่งหญ้ากว้างลมแรง ดอกไม้ป่า กำแพงหินเตี้ย กังหันลม และฝูงแกะ" },
  { id: "noa_plains", name: "ที่ราบใต้โนอา", region: "ระหว่างโนอากับเวนิชเซีย · Lv 40-50", kind: "field", open: true, col: -3, row: 1,
    desc: "ไร่องุ่นกับทุ่งข้าวสาลี ถนนหินโบราณ หลักไมล์ และซากท่อส่งน้ำ" },
  { id: "dry_plains", name: "ที่ราบแห้งแล้ง", region: "ระหว่างเวนิชเซียกับขอบทะเลทราย · Lv 50-62", kind: "field", open: true, col: -1, row: 2,
    desc: "ทุ่งหญ้าแห้งติดทะเลทราย พุ่มไม้แห้ง เนินหินยอดตัด และเส้นทางคาราวาน" },
  { id: "elder_forest", name: "ป่าโบราณ", region: "ตะวันตกของโนอา · Lv 62-74", kind: "field", open: true, col: -4, row: 0,
    desc: "ต้นไม้ยักษ์อายุพันปี มอสหนา เห็ดเรืองแสง และศาลหินยุคโนอา" },
  { id: "rice_terraces", name: "นาขั้นบันได", region: "ใต้ซูโจว · Lv 74-86", kind: "field", open: true, col: -5, row: 2,
    desc: "นาขั้นบันไดมีน้ำขัง กระท่อมชาวนา ควาย และกังหันน้ำ" },
  { id: "highland_downs", name: "ที่ราบเนินเขา", region: "ตะวันตกของไฮแลนด์ ฮิล · Lv 86-98", kind: "field", open: true, col: -4, row: -2,
    desc: "เนินลอนคลื่นหิมะบาง กองหินบอกทาง กำแพงหินแห้ง และวงหินโบราณ" },
  { id: "karst_peaks", name: "ภูผาหินปูน", region: "ระหว่างที่ราบเนินเขากับป่าโบราณ · Lv 98-110", kind: "field", open: true, col: -4, row: -1,
    desc: "ยอดเขาหินปูนเป็นแท่ง หมอกลอย ลำธาร และศาลาบนผา" },
  { id: "ancient_plain", name: "ที่ราบโบราณ", region: "ระหว่างที่ราบแห้งแล้งกับบาฮามัส · Lv 110-122", kind: "field", open: true, col: -1, row: 3,
    desc: "ซากเมืองยุคก่อน รูปปั้นยักษ์ล้ม แนวเสา และประตูชัยพัง" },
  { id: "frozen_river", name: "แม่น้ำเยือกแข็ง", region: "ระหว่างโนอากับไฮแลนด์ ฮิล · Lv 122-134", kind: "field", open: true, col: -3, row: -1,
    desc: "แม่น้ำกว้างที่แข็งเป็นน้ำแข็ง สะพานหินเก่าครึ่งพัง ฝั่งเหนือหิมะเริ่มตก" },
  { id: "west_pass", name: "ช่องเขาตะวันตก", region: "ระหว่างป่าโบราณกับซูโจว · Lv 134-146", kind: "field", open: true, col: -5, row: 0,
    desc: "ทางคดเคี้ยวผ่านหน้าผา ด่านเก่า และสะพานเชือก" },
  { id: "tangled_hills", name: "เนินเขาวงกต", region: "ตะวันออกของไฮแลนด์ ฮิล · Lv 146-158", kind: "field", open: true, col: -2, row: -2,
    desc: "เนินและหุบแคบซ้อนกันเหมือนเขาวงกต ไต่ขึ้นลงหลายชั้น" },
  { id: "lagoon_marsh", name: "บึงลากูน", region: "ระหว่างซูโจวกับที่ราบใต้โนอา · Lv 158-170", kind: "field", open: true, col: -4, row: 1,
    desc: "บึงกว้าง กกสูง ทางเดินไม้ ซากบ้านใต้ถุนสูง และหมอกพิษ" },
  { id: "royal_necropolis", name: "สุสานหลวงโบราณ", region: "ระหว่างที่ราบโบราณกับป่าดิบแดนใต้ · Lv 170-182", kind: "field", open: true, col: -1, row: 4,
    desc: "สุสานกษัตริย์ยุคแรก หลุมศพหิน รูปปั้นเฝ้าสุสาน ที่ป่าแดนใต้เริ่มกลืน" },
  { id: "north_cliffs", name: "หน้าผาทะเลเหนือ", region: "เหนือไฮแลนด์ ฮิล · Lv 182-192", kind: "field", open: true, col: -3, row: -3,
    desc: "หน้าผาริมทะเลน้ำแข็ง แท่งหินกลางทะเล และประภาคารร้าง" },
  { id: "west_cape", name: "แหลมทะเลตะวันตก", region: "ตะวันตกสุดของทวีป ปลายช่องเขาตะวันตก · Lv 188-200", kind: "field", open: true, col: -6, row: 0,
    desc: "แหลมสุดทวีป ทะเลคลั่ง ซากเรือ และศาลมังกรทะเล" },
];

// The grid's extent and what lies in the squares no map fills, a row a line from the north
// (columns -6 to 6, rows -5 to 5): ~ sea, ^ snowy mountains, # grassland, % forest, : sand
// (M marks a map's own square).
export const GRID = { col0: -6, row0: -5, cols: 13, rows: 11 };
const GROUND = [
  "~~~~^M^~~~~~~", // -5
  "~~~~^M~~~~~~~", // -4
  "~~^M^M^^^~~~~", // -3
  "~^MMMM^^^M##~", // -2
  "~%MMM#MMMMM##", // -1
  "MMMMMMM~##MMM", // 0
  "~MMM##M~~%M##", // 1
  "~M%~MMM:~~%~~", // 2
  "~~~~~MMM:~~~~", // 3
  "~~~~%MM%~~M~~", // 4
  "~~~~~%MM~MM~~", // 5
];
export type Ground = "~" | "^" | "#" | "%" | ":" | "M";
export function groundAt(col: number, row: number): Ground {
  return (GROUND[row - GRID.row0]?.[col - GRID.col0] ?? "~") as Ground;
}

// the names of the seas, over their squares (in squares: the middle of the square at col, row is
// col + 0.5, row + 0.5)
export const SEAS: { x: number; y: number; text: string }[] = [
  { x: 2.5, y: -3.6, text: "ทะเลเหนือ" },
  { x: 1.8, y: 1.4, text: "ทะเลใน" },
  { x: -4, y: 3.6, text: "ทะเลตะวันตก" },
  { x: 3, y: 4, text: "มหาสมุทรใต้" },
];

// What a map's square shows of it (game cm, after the towns' scale): a square round the middle
// of its walkable bounds, as wide as their longer side and 10 m more all round.
export function tileArea(b: { minX: number; maxX: number; minY: number; maxY: number }): { minX: number; maxX: number; minY: number; maxY: number } {
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
  const half = Math.max(b.maxX - b.minX, b.maxY - b.minY) / 2 + 1000;
  return { minX: cx - half, maxX: cx + half, minY: cy - half, maxY: cy + half };
}
