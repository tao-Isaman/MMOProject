// The world map (M, then its tab): the world as a grid of squares, one for each map of the
// game, each square that map's own picture from straight above, north up, laid side by side the
// way their ways out meet, as Ragnarok draws its world. Two maps that only touch at a corner (the
// royal road and the snow foothills, round the palace; the plains south of Noa and Venezia) meet
// there, their ways out at that corner. The squares no map fills are the sea or land nobody has
// charted (GROUND), and every map's edges fit what lies next to them: a shore where the next
// square is sea, the same country where it is land, linked ways out at the same place along their
// shared edge (tools/world_fit.cjs checks it).
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
  kind: "capital" | "town" | "field";
  open: boolean;
  col: number; // its square: columns east, rows south of Eden
  row: number;
}

export const PLACES: Place[] = [
  { id: "eden", name: "อีเดน", region: "ที่ราบภาคกลาง ริมทะเลใน", kind: "capital", open: true, col: 0, row: 0,
    desc: "เมืองหลวงของอาณาจักรและเมืองเริ่มต้น มหาวิหาร ตลาด ลานน้ำพุ และท่าเรือที่เรือจากทุกทิศมาจอด" },
  { id: "field", name: "ทุ่งหญ้าตะวันตก", region: "นอกประตูตะวันตกของอีเดน", kind: "field", open: true, col: -1, row: 0,
    desc: "ทุ่งหญ้ากับลานบ้านไร่ มีสไลม์หลายสี ที่ฝึกฝีมือของนักผจญภัยหน้าใหม่" },
  { id: "palace", name: "พระราชวังหลวง", region: "เหนือเมืองอีเดน", kind: "town", open: true, col: 0, row: -2,
    desc: "พระราชวังของกษัตริย์ ท้องพระโรง โบสถ์หลวง หอสมุดหลวง และอุทยานหลวง" },
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
  // the rest of the land (docs/v04_lands.md)
  { id: "flower_fields", name: "ทุ่งดอกไม้หลวง", region: "ตะวันตกของถนนหลวง · Lv 24-32", kind: "field", open: true, col: -1, row: -1,
    desc: "ทุ่งทานตะวันและดอกไม้ส่งวัง สวนผึ้งหลวง และโบสถ์น้อยกลางทุ่ง" },
  { id: "windmill_fields", name: "ทุ่งกังหันลม", region: "ใต้ทุ่งหญ้าตะวันตก · Lv 20-28", kind: "field", open: true, col: -1, row: 1,
    desc: "ทุ่งข้าวสาลีกับกังหันลม ยุ้งฉางหิน และคอกแกะ" },
  { id: "royal_hunt", name: "ป่าล่าสัตว์หลวง", region: "ตะวันออกของพระราชวัง · Lv 28-36", kind: "field", open: true, col: 1, row: -2,
    desc: "เนินสนหิมะที่กษัตริย์ใช้ล่าสัตว์ กระท่อมล่าสัตว์และหอดูสัตว์" },
  { id: "frozen_falls", name: "หุบน้ำตกเยือกแข็ง", region: "เหนือสเตปป์ตะวันตก · Lv 46-56", kind: "field", open: true, col: 2, row: -2,
    desc: "น้ำตกใหญ่ที่แข็งเป็นเสาน้ำแข็ง ทะเลสาบแข็ง และบ่อน้ำพุร้อน" },
  { id: "old_royal_mine", name: "เหมืองหลวงเก่า", region: "หลังพระราชวัง · Lv 62-72", kind: "field", open: true, col: 0, row: -3,
    desc: "เหมืองเงินที่ทำมงกุฎของราชวงศ์ ถูกทิ้งไว้หลังอุโมงค์ถล่ม" },
  { id: "royal_peaks", name: "สันเขาหลวง", region: "เหนือป่าล่าสัตว์หลวง · Lv 114-124", kind: "field", open: true, col: 1, row: -3,
    desc: "สันเขาคมลมแรง สะพานหินข้ามเหว และรังนกยักษ์บนชะง่อนผา" },
  { id: "dragon_summit", name: "ยอดเขามังกรฟ้า", region: "ยอดสุดของเทือกเขาหลวง · Lv 124-134", kind: "field", open: true, col: 2, row: -3,
    desc: "ยอดเขาเหนือเมฆที่มังกรฟ้าสวมมงกุฎให้กษัตริย์องค์แรก" },
  { id: "west_glacier", name: "ธารน้ำแข็งตะวันตก", region: "ตะวันตกของไอซ์เบิร์ก · Lv 66-76", kind: "field", open: true, col: -2, row: -4,
    desc: "ลิ้นธารน้ำแข็งไหลลงทะเล รอยแยกลึก และค่ายนักล่าวาฬที่ติดค้าง" },
  { id: "ice_queen_hollow", name: "หุบวังน้ำแข็ง", region: "เหนือธารน้ำแข็งตะวันตก · Lv 130-140", kind: "field", open: true, col: -2, row: -5,
    desc: "ซากวังของราชินีหิมะ ผลึกสีคราม และนักรบที่ถูกแช่แข็ง" },
  { id: "aurora_field", name: "ทุ่งแสงเหนือ", region: "ตะวันออกของทุ่งน้ำแข็งเหนือ · Lv 78-88", kind: "field", open: true, col: 0, row: -5,
    desc: "ทุ่งหิมะสุดเหนือที่แสงเหนือส่องลงพื้น และหอดูดาวร้าง" },
  { id: "frostfang_ridge", name: "สันเขาเขี้ยวน้ำแข็ง", region: "เหนือเนินเขาวงกต · Lv 160-170", kind: "field", open: true, col: -2, row: -3,
    desc: "ยอดหินแหลมเหมือนเขี้ยว สนามรบเก่าของยักษ์ และหอเฝ้าระวังร้าง" },
  { id: "humming_stones", name: "หุบหินร้องเพลง", region: "เหนือที่ราบเนินเขา · Lv 148-158", kind: "field", open: true, col: -4, row: -3,
    desc: "เสาหินกลวงที่ฮัมเพลงเมื่อลมทะเลพัด และอาศรมของกวีเฒ่า" },
  { id: "snow_abbey", name: "ผาอารามหิมะ", region: "ตะวันตกของที่ราบเนินเขา · Lv 136-146", kind: "field", open: true, col: -5, row: -2,
    desc: "อารามร้างบนหน้าผาหิมะเหนือทะเลตะวันตก" },
  { id: "primeval_forest", name: "ป่าดึกดำบรรพ์", region: "ตะวันตกของภูผาหินปูน · Lv 120-130", kind: "field", open: true, col: -5, row: -1,
    desc: "ป่าเฟิร์นยักษ์ที่ไม่มีใครแตะต้อง และสัตว์ยักษ์ยุคก่อนมีคน" },
  { id: "sunken_temple_woods", name: "ป่าวิหารจม", region: "ใต้บึงลากูน · Lv 170-180", kind: "field", open: true, col: -4, row: 2,
    desc: "ป่าไทรรัดริมทะเลที่กลืนวิหารเก่าลงไปครึ่งหลัง" },
  { id: "lavender_hills", name: "ทุ่งลาเวนเดอร์", region: "เหนือเวนิชเซีย · Lv 34-44", kind: "field", open: true, col: -2, row: 1,
    desc: "เนินลาเวนเดอร์สีม่วง แนวไซเปรส และโรงกลั่นน้ำหอม" },
  { id: "salt_dunes", name: "เนินทรายริมทะเลใน", region: "ตะวันออกของขอบทะเลทราย · Lv 30-40", kind: "field", open: true, col: 1, row: 2,
    desc: "เนินทรายแดงลงทะเลใน ลานเกลือ และซากเรือใบเกยตื้น" },
  { id: "glass_desert", name: "ทะเลทรายแก้ว", region: "ตะวันออกของทะเลทรายใหญ่ · Lv 74-84", kind: "field", open: true, col: 2, row: 3,
    desc: "ทรายที่ฟ้าผ่าและอุกกาบาตหลอมเป็นแก้ว กับหลุมอุกกาบาตใหญ่" },
  { id: "waterfall_gorge", name: "หุบผาน้ำตก", region: "ใต้ทะเลทรายใหญ่ · Lv 42-52", kind: "field", open: true, col: 1, row: 4,
    desc: "หุบป่าดิบลึกกับน้ำตกหลายชั้น สะพานเชือก และพีระมิดในเถาวัลย์" },
  { id: "sacred_banyan", name: "ป่าไทรศักดิ์สิทธิ์", region: "ตะวันตกของโยเดีย · Lv 180-190", kind: "field", open: true, col: -1, row: 5,
    desc: "ป่าพิธีศพของกษัตริย์ยุคแรก ไทรยักษ์ เจดีย์ในราก และแม่น้ำลอยโคม" },
  { id: "first_tree", name: "ป่าต้นไม้แรก", region: "ตะวันตกของสุสานหลวงโบราณ · Lv 190-200", kind: "field", open: true, col: -2, row: 4,
    desc: "ต้นไม้ต้นแรกของโลกที่รากยึดแผ่นดินไว้ เรืองแสงสีทอง" },
  { id: "inner_sea_cliffs", name: "ทุ่งผาริมทะเลใน", region: "ใต้สเตปป์ตะวันตก · Lv 38-48", kind: "field", open: true, col: 2, row: 0,
    desc: "ทุ่งหญ้าบนผาริมทะเลใน หมู่บ้านชาวประมงบ้านเสาสูง และประภาคารเล็ก" },
  { id: "caravan_road", name: "ถนนคาราวานตะวันออก", region: "ระหว่างทรุนราดากับคราเดีย · Lv 52-62", kind: "field", open: true, col: 3, row: 0,
    desc: "ถนนเก่าผ่านทุ่งหญ้า โรงเตี๊ยมร้าง เกวียนพัง และสะพานเก็บค่าผ่านทาง" },
  { id: "golden_maples", name: "ป่าเมเปิลทอง", region: "ตะวันตกของป่าชายแดน · Lv 68-78", kind: "field", open: true, col: 3, row: 1,
    desc: "ป่าเมเปิลใบทองริมทะเล วงเห็ดภูต และค่ายคนตัดไม้" },
  { id: "witch_cape", name: "แหลมแม่มด", region: "ใต้ป่าชายแดน · Lv 84-94", kind: "field", open: true, col: 4, row: 2,
    desc: "แหลมป่าต้นไม้บิดเบี้ยว กระท่อมแม่มด และวงหินริมทะเล" },
  { id: "windswept_heights", name: "ที่ราบสูงลมแรง", region: "ตะวันออกของทุ่งเลี้ยงม้า · Lv 56-66", kind: "field", open: true, col: 4, row: -2,
    desc: "ทุ่งหญ้าสูงที่ลมพัดไม่หยุด เนินสุสานโบราณ และหินสลักหน้านักรบ" },
  { id: "storm_cape", name: "แหลมพายุ", region: "มุมตะวันออกเฉียงเหนือของแผ่นดิน · Lv 92-102", kind: "field", open: true, col: 5, row: -2,
    desc: "แหลมที่พายุไม่เคยหยุด หอส่งสัญญาณพัง และเสาล่อฟ้า" },
  { id: "floating_rocks", name: "ทุ่งหินลอย", region: "เหนือแนวป้องกันชายแดน · Lv 88-98", kind: "field", open: true, col: 5, row: -1,
    desc: "ก้อนหินและเกาะดินลอยค้างกลางอากาศด้วยเวทจากประตูอสูร" },
  { id: "thornland", name: "ทุ่งหนามอสูร", region: "เหนือดินแดนอสูร · Lv 104-114", kind: "field", open: true, col: 6, row: -1,
    desc: "แผ่นดินที่พลังอสูรกัดกิน เถาหนามดำ และผลึกสีม่วง" },
  { id: "burnt_villages", name: "หมู่บ้านร้างชายแดน", region: "ใต้แนวป้องกันชายแดน · Lv 98-108", kind: "field", open: true, col: 5, row: 1,
    desc: "หมู่บ้านที่อสูรบุกเผา บ้านไหม้ดำ และโบสถ์หลังคาพัง" },
  { id: "demon_camp", name: "ค่ายทัพอสูร", region: "ใต้ดินแดนอสูร · Lv 110-120", kind: "field", open: true, col: 6, row: 1,
    desc: "ค่ายทัพอสูรที่เตรียมบุกอาณาจักร รั้วกระดูก กระโจมดำ และกลองศึก" },
];

// The grid's extent and what lies in the squares no map fills, a row a line from the north
// (columns -6 to 6, rows -5 to 5): ~ sea, ^ snowy mountains, # grassland, % forest, : sand
// (M marks a map's own square).
export const GRID = { col0: -6, row0: -5, cols: 13, rows: 11 };
const GROUND = [
  "~~~~MMM~~~~~~", // -5
  "~~~~MM~~~~~~~", // -4
  "~~MMMMMMM~~~~", // -3
  "~MMMMMMMMMMM~", // -2
  "~MMMMMMMMMMMM", // -1
  "MMMMMMM~MMMMM", // 0
  "~MMMMMM~~MMMM", // 1
  "~MM~MMMM~~M~~", // 2
  "~~~~~MMMM~~~~", // 3
  "~~~~MMMM~~M~~", // 4
  "~~~~~MMM~MM~~", // 5
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
