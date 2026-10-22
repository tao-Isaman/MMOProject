// The monsters of the fields (the first field keeps its slimes, src/monsters.ts): who lives
// where, their levels, element, defences in each element, temper, size and ways of fighting.
// Their numbers come from their kind on the same curve as the slimes grow by (statsFor), so a
// tank has more HP and defence than a normal one of its level, a fast one hits harder on less
// HP, a caster resists magic, a rare one is a little boss, a boss a big one.
//
// behave: what it does besides biting (src/monsters.ts):
//   charge        rushes in from a distance and hits harder
//   pack          others of its kind nearby join in when one is hit
//   ranged:<what> attacks from a distance with a shot (water, snow, frost, fire, rock, arrow...)
//   fly           floats above the ground
//   heal          heals itself when hurt
//   flee          runs off when nearly beaten
//   reflect       sends part of the damage it takes back
//   slow, burn, petrify   its bite may slow, set alight or turn to stone for a moment
//   slam          now and then strikes the ground all round it
//   explode       bursts when it dies, hurting whoever stands close
//   steal         its bite may take some gold
//   dodge         slips out of the way of more blows
//   slowwalk      shambles slowly
//   summon:<id>   calls others to its side (bosses)
//   human         a person: dressed from the wardrobe instead of a sprite
//   boss          one of a field's bosses: one at a time, back an hour after it falls

import type { ElementId } from "./progression";
import type { MapId } from "./maps";
import type { WeaponId } from "./items";

export type MonsterKind = "normal" | "tank" | "fast" | "caster" | "rare" | "boss";

export interface MonsterDef {
  id: string;
  name: string;
  field: MapId;
  levels: [number, number];
  kind: MonsterKind;
  element?: ElementId;
  eleDef: Partial<Record<ElementId, number>>;
  aggro: boolean; // attacks first
  size: number;   // how tall it stands, cm
  behave: string[];
  look: string;
}

export const MONSTERS: MonsterDef[] = [
  { id: "spore_mushroom", name: "เห็ดสปอร์", field: "west_woods", levels: [8, 10], kind: "normal", element: "plant", eleDef: { plant: 30, earth: 15 },
    aggro: false, size: 70, behave: ["slow"],
    look: "เห็ดหมวกแดงจุดขาว ตัวป้อม เดินต้วมเตี้ยม" },
  { id: "fang_squirrel", name: "กระรอกเขี้ยวดาบ", field: "west_woods", levels: [10, 12], kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: true, size: 60, behave: [],
    look: "กระรอกขนน้ำตาลหางฟู เขี้ยวยาวโผล่พ้นปาก" },
  { id: "oak_boar", name: "หมูป่าโอ๊ก", field: "west_woods", levels: [12, 14], kind: "tank", element: "earth", eleDef: { earth: 30, plant: 15 },
    aggro: false, size: 110, behave: ["charge"],
    look: "หมูป่าขนดำ งาโค้ง ใบโอ๊กติดหลัง" },
  { id: "oak_sprite", name: "ภูตต้นโอ๊กน้อย", field: "west_woods", levels: [15, 15], kind: "rare", element: "plant", eleDef: { plant: 40, water: 20 },
    aggro: false, size: 120, behave: ["heal"],
    look: "ต้นไม้เตี้ยมีหน้าบนลำต้น เดินด้วยราก" },
  { id: "wheat_locust", name: "ตั๊กแตนทุ่งข้าว", field: "royal_road", levels: [10, 12], kind: "fast", element: "wind", eleDef: { wind: 20, plant: 10 },
    aggro: false, size: 60, behave: ["pack"],
    look: "ตั๊กแตนสีทองตัวเท่าแมว ปีกใส" },
  { id: "mill_rat", name: "หนูโรงสี", field: "royal_road", levels: [12, 15], kind: "normal", element: "earth", eleDef: { earth: 20 },
    aggro: true, size: 60, behave: [],
    look: "หนูอ้วนขนเทา คาบรวงข้าว แป้งติดหนวด" },
  { id: "haunted_scarecrow", name: "หุ่นไล่กาผีสิง", field: "royal_road", levels: [14, 17], kind: "caster", element: "dark", eleDef: { dark: 30, fire: -20 },
    aggro: false, size: 150, behave: ["fly"],
    look: "หุ่นฟางหมวกปีกกว้าง ตาเป็นแสงม่วง ลอยได้" },
  { id: "highway_bandit", name: "โจรดักปล้น", field: "royal_road", levels: [16, 18], kind: "rare", element: undefined, eleDef: {  },
    aggro: true, size: 160, behave: ["human"],
    look: "โจรผ้าปิดหน้า ถือดาบสั้น" },
  { id: "swift_ostrich", name: "นกกระจอกเทศขาไว", field: "south_savanna", levels: [12, 15], kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: false, size: 150, behave: ["flee"],
    look: "นกคอยาวขนดำขาว ขาแข็งแรง" },
  { id: "grass_hyena", name: "ไฮยีน่าหญ้าสูง", field: "south_savanna", levels: [15, 18], kind: "normal", element: "earth", eleDef: { earth: 20 },
    aggro: true, size: 90, behave: ["pack"],
    look: "หมาลายจุด แผงคอตั้ง หัวเราะเสียงแหลม" },
  { id: "dung_beetle", name: "ด้วงกลิ้งมูล", field: "south_savanna", levels: [17, 20], kind: "tank", element: "mud", eleDef: { mud: 35, earth: 20 },
    aggro: false, size: 90, behave: [],
    look: "ด้วงเปลือกเขียวเหลือบ ดันก้อนโคลนกลม" },
  { id: "saw_beaver", name: "บีเวอร์ฟันเลื่อย", field: "pine_river", levels: [20, 23], kind: "tank", element: "water", eleDef: { water: 30, plant: 10 },
    aggro: false, size: 70, behave: [],
    look: "บีเวอร์ฟันใหญ่ หางแบน คาบท่อนไม้" },
  { id: "pine_wolf", name: "หมาป่าสน", field: "pine_river", levels: [23, 27], kind: "normal", element: "wind", eleDef: { wind: 20, ice: 15 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนเทาเข้ม ตาเหลือง" },
  { id: "brook_spirit", name: "ภูตลำธาร", field: "pine_river", levels: [26, 30], kind: "caster", element: "water", eleDef: { water: 40, fire: 20 },
    aggro: true, size: 120, behave: ["ranged:water", "fly"],
    look: "ร่างน้ำใสรูปเด็กผู้หญิง ผมเป็นสายน้ำ" },
  { id: "pine_bear", name: "หมีป่าสน", field: "pine_river", levels: [30, 30], kind: "rare", element: "earth", eleDef: { earth: 30 },
    aggro: false, size: 190, behave: [],
    look: "หมีน้ำตาลตัวโต คาบปลา ยืนสองขาเมื่อโกรธ" },
  { id: "ram_goat", name: "แพะภูเขาเขาวง", field: "snow_foothills", levels: [35, 38], kind: "normal", element: "earth", eleDef: { earth: 25, ice: 15 },
    aggro: false, size: 110, behave: ["charge"],
    look: "แพะขาวเคราแหลม เขาม้วนเป็นวง" },
  { id: "snow_wolf", name: "หมาป่าหิมะ", field: "snow_foothills", levels: [38, 42], kind: "fast", element: "ice", eleDef: { ice: 35 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนขาว ลมหายใจเป็นไอเย็น" },
  { id: "snowman", name: "มนุษย์หิมะน้อย", field: "snow_foothills", levels: [42, 45], kind: "tank", element: "ice", eleDef: { ice: 40, fire: -15 },
    aggro: false, size: 130, behave: ["ranged:snow"],
    look: "ก้อนหิมะสามชั้น แขนกิ่งไม้ จมูกแครอท" },
  { id: "ice_bat", name: "ค้างคาวน้ำแข็ง", field: "ice_pass", levels: [45, 48], kind: "fast", element: "ice", eleDef: { ice: 30, wind: 20 },
    aggro: true, size: 70, behave: ["fly"],
    look: "ค้างคาวปีกใสเหมือนแผ่นน้ำแข็ง" },
  { id: "ice_golem", name: "โกเลมน้ำแข็ง", field: "ice_pass", levels: [50, 54], kind: "tank", element: "ice", eleDef: { ice: 45, stone: 30 },
    aggro: false, size: 220, behave: [],
    look: "ร่างก้อนน้ำแข็งสีฟ้า ผลึกงอกบนไหล่" },
  { id: "yeti", name: "เยติ", field: "ice_pass", levels: [53, 55], kind: "rare", element: "ice", eleDef: { ice: 40, earth: 20 },
    aggro: true, size: 240, behave: ["slam"],
    look: "ลิงยักษ์ขนขาวฟู หน้าสีฟ้า เขี้ยวโง้ง" },
  { id: "war_penguin", name: "เพนกวินนักรบ", field: "north_icefield", levels: [55, 59], kind: "normal", element: "water", eleDef: { water: 30, ice: 30 },
    aggro: false, size: 90, behave: ["pack"],
    look: "เพนกวินสวมหมวกเหล็ก ถือหอกน้ำแข็ง" },
  { id: "sabre_seal", name: "แมวน้ำเขี้ยวดาบ", field: "north_icefield", levels: [59, 63], kind: "normal", element: "ice", eleDef: { ice: 35, water: 25 },
    aggro: true, size: 110, behave: [],
    look: "แมวน้ำอ้วน เขี้ยวยาวลงมาถึงอก" },
  { id: "polar_bear", name: "หมีขั้วโลก", field: "north_icefield", levels: [63, 67], kind: "tank", element: "ice", eleDef: { ice: 45 },
    aggro: true, size: 210, behave: [],
    look: "หมีขาวตัวโต น้ำแข็งเกาะขน" },
  { id: "frozen_explorer", name: "วิญญาณนักสำรวจ", field: "north_icefield", levels: [67, 70], kind: "rare", element: "dark", eleDef: { dark: 40, ice: 30 },
    aggro: true, size: 160, behave: ["ranged:frost", "fly"],
    look: "ผีชายชุดขนสัตว์ขาดวิ่น ถือตะเกียงเย็นเยียบ" },
  { id: "horned_hare", name: "กระต่ายเขาเดียว", field: "west_steppe", levels: [30, 33], kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: false, size: 60, behave: [],
    look: "กระต่ายขนน้ำตาลอ่อน เขาเดียวกลางหน้าผาก" },
  { id: "shaggy_bison", name: "ควายป่าขนยาว", field: "west_steppe", levels: [33, 37], kind: "tank", element: "earth", eleDef: { earth: 35 },
    aggro: false, size: 170, behave: ["charge"],
    look: "ควายขนยาวสีน้ำตาลเข้ม เขากว้าง" },
  { id: "steppe_eagle", name: "นกอินทรีทุ่ง", field: "west_steppe", levels: [36, 40], kind: "fast", element: "wind", eleDef: { wind: 30 },
    aggro: true, size: 110, behave: ["fly"],
    look: "อินทรีขนน้ำตาลทอง กรงเล็บใหญ่" },
  { id: "nomad_raider", name: "โจรม้าเร่ร่อน", field: "west_steppe", levels: [38, 40], kind: "rare", element: undefined, eleDef: {  },
    aggro: true, size: 160, behave: ["human", "ranged:arrow"],
    look: "นักรบเผ่าหมวกขนสัตว์ ถือคันธนู" },
  { id: "flame_mane", name: "ม้าป่าแผงคอไฟ", field: "horse_meadow", levels: [40, 44], kind: "normal", element: "fire", eleDef: { fire: 30, wind: 15 },
    aggro: false, size: 170, behave: [],
    look: "ม้าขนแดงก่ำ แผงคอเป็นเปลวไฟอ่อน" },
  { id: "giant_gull", name: "นกนางนวลยักษ์", field: "horse_meadow", levels: [44, 47], kind: "fast", element: "wind", eleDef: { wind: 25, water: 20 },
    aggro: true, size: 100, behave: ["fly"],
    look: "นางนวลปีกกว้าง ปากเหลืองงอ" },
  { id: "ghost_rancher", name: "ผีคนเลี้ยงม้า", field: "horse_meadow", levels: [47, 50], kind: "caster", element: "dark", eleDef: { dark: 35 },
    aggro: false, size: 160, behave: ["fly"],
    look: "วิญญาณชายหมวกปีกกว้าง ถือแส้เรืองแสง" },
  { id: "canyon_wolf", name: "หมาป่าหุบผา", field: "stone_plain", levels: [50, 54], kind: "fast", element: "earth", eleDef: { earth: 25, stone: 15 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนสีหิน ตัวผอม หูยาว" },
  { id: "menhir_warden", name: "ผู้พิทักษ์หินตั้ง", field: "stone_plain", levels: [55, 59], kind: "tank", element: "stone", eleDef: { stone: 50, earth: 30 },
    aggro: false, size: 230, behave: ["petrify"],
    look: "หินตั้งสลักหน้า แขนหินลอยข้างตัว" },
  { id: "druid_shade", name: "วิญญาณดรูอิด", field: "stone_plain", levels: [56, 60], kind: "caster", element: "plant", eleDef: { plant: 40, light: 30 },
    aggro: true, size: 160, behave: ["ranged:vine", "heal"],
    look: "ชายชราผมขาวเสื้อคลุมเขียว เรืองแสงจาง ๆ" },
  { id: "crimson_stag", name: "กวางเขาแดง", field: "border_woods", levels: [60, 63], kind: "normal", element: "plant", eleDef: { plant: 30, fire: 15 },
    aggro: false, size: 170, behave: ["charge"],
    look: "กวางขนแดง เขาแตกกิ่งเหมือนใบเมเปิล" },
  { id: "shadow_imp", name: "อิมป์เงา", field: "border_woods", levels: [63, 67], kind: "fast", element: "dark", eleDef: { dark: 40, light: -20 },
    aggro: true, size: 80, behave: ["fly"],
    look: "ปีศาจตัวเล็กสีม่วงดำ ปีกค้างคาว หางแหลม" },
  { id: "cursed_deserter", name: "ทหารหนีทัพต้องสาป", field: "border_woods", levels: [67, 70], kind: "rare", element: "dark", eleDef: { dark: 30, metal: 30 },
    aggro: true, size: 160, behave: ["human"],
    look: "ทหารเกราะผุ ตาแดง ดาบบิ่น" },
  { id: "skeleton_soldier", name: "ทหารโครงกระดูก", field: "border_line", levels: [70, 75], kind: "normal", element: "dark", eleDef: { dark: 35, metal: 25, light: -25 },
    aggro: true, size: 160, behave: [],
    look: "โครงกระดูกหมวกเหล็กสนิม ถือโล่แตก" },
  { id: "goat_demon", name: "อสูรหัวแพะ", field: "border_line", levels: [75, 80], kind: "caster", element: "fire", eleDef: { fire: 40, dark: 30 },
    aggro: true, size: 200, behave: ["ranged:fire"],
    look: "อสูรร่างคนหัวแพะ เขาโค้ง ขนดำ" },
  { id: "siege_golem", name: "โกเลมเครื่องยิงหิน", field: "border_line", levels: [80, 85], kind: "tank", element: "metal", eleDef: { metal: 50, stone: 30, lightning: -20 },
    aggro: true, size: 260, behave: ["ranged:rock", "reflect"],
    look: "ซากเครื่องยิงหินลุกขึ้นเดินด้วยไม้และเหล็ก" },
  { id: "dark_crystal_fiend", name: "อสูรผลึกมืด", field: "demon_land", levels: [85, 90], kind: "tank", element: "dark", eleDef: { dark: 45, stone: 35 },
    aggro: false, size: 200, behave: ["explode"],
    look: "ร่างผลึกม่วงดำ เรืองแสงจากข้างใน" },
  { id: "hellhound", name: "สุนัขนรก", field: "demon_land", levels: [88, 94], kind: "fast", element: "fire", eleDef: { fire: 45, dark: 30 },
    aggro: true, size: 120, behave: ["pack", "burn"],
    look: "หมาดำตาแดง ไฟลุกตามหลังและหาง" },
  { id: "demon_knight", name: "อัศวินอสูร", field: "demon_land", levels: [94, 100], kind: "rare", element: "dark", eleDef: { dark: 45, metal: 40 },
    aggro: true, size: 220, behave: [],
    look: "อัศวินเกราะดำมีเขา ดาบใหญ่เรืองม่วง" },
  { id: "red_scorpion", name: "แมงป่องทรายแดง", field: "desert_edge", levels: [20, 24], kind: "normal", element: "earth", eleDef: { earth: 25, fire: 15 },
    aggro: true, size: 80, behave: [],
    look: "แมงป่องสีแดงอิฐ เหล็กไนวาว" },
  { id: "walking_cactus", name: "กระบองเพชรเดินได้", field: "desert_edge", levels: [23, 27], kind: "tank", element: "plant", eleDef: { plant: 35, earth: 15 },
    aggro: false, size: 110, behave: ["reflect"],
    look: "กระบองเพชรกลมมีขา ดอกชมพูบนหัว" },
  { id: "desert_vulture", name: "นกแร้งทะเลทราย", field: "desert_edge", levels: [27, 30], kind: "fast", element: "wind", eleDef: { wind: 30 },
    aggro: true, size: 110, behave: ["fly"],
    look: "แร้งหัวโล้น ปีกขาดรุ่งริ่ง" },
  { id: "mummy_slave", name: "มัมมี่ทาส", field: "great_desert", levels: [30, 34], kind: "tank", element: "dark", eleDef: { dark: 30, fire: -20 },
    aggro: false, size: 160, behave: ["slowwalk"],
    look: "ร่างพันผ้าเหลืองหม่น แขนยื่นไปข้างหน้า" },
  { id: "sand_cobra", name: "งูเห่าทราย", field: "great_desert", levels: [35, 39], kind: "fast", element: "earth", eleDef: { earth: 30 },
    aggro: true, size: 90, behave: [],
    look: "งูเห่าสีทราย แม่เบี้ยลายเหมือนตา" },
  { id: "sandstone_golem", name: "โกเลมหินทราย", field: "great_desert", levels: [40, 45], kind: "tank", element: "stone", eleDef: { stone: 45, earth: 30 },
    aggro: false, size: 230, behave: ["petrify"],
    look: "รูปปั้นเฝ้าวิหาร อักษรโบราณเรืองแสง" },
  { id: "pharaoh_shade", name: "วิญญาณฟาโรห์", field: "great_desert", levels: [45, 45], kind: "rare", element: "dark", eleDef: { dark: 40, light: 20 },
    aggro: true, size: 170, behave: ["ranged:curse", "fly"],
    look: "ร่างโปร่งใสสวมหน้ากากทองคำ ลอยเหนือพื้น" },
  { id: "tiger_frog", name: "กบพิษลายเสือ", field: "south_jungle", levels: [25, 28], kind: "fast", element: "plant", eleDef: { plant: 25, water: 25 },
    aggro: false, size: 70, behave: ["ranged:tongue"],
    look: "กบตัวเท่าหมา ลายส้มดำ ตาโปน" },
  { id: "vine_monkey", name: "ลิงเถาวัลย์", field: "south_jungle", levels: [28, 31], kind: "normal", element: "wind", eleDef: { wind: 25, plant: 15 },
    aggro: true, size: 90, behave: ["steal"],
    look: "ลิงหางยาวพันเถาวัลย์ หน้าเจ้าเล่ห์" },
  { id: "mud_crocodile", name: "จระเข้บ่อโคลน", field: "south_jungle", levels: [32, 35], kind: "tank", element: "mud", eleDef: { mud: 40, water: 30 },
    aggro: false, size: 120, behave: [],
    look: "จระเข้ผิวเปื้อนโคลน หลังมีตะไคร่" },
  { id: "iron_crab", name: "ปูก้ามเหล็ก", field: "mangrove_coast", levels: [35, 38], kind: "tank", element: "metal", eleDef: { metal: 35, water: 30, lightning: -15 },
    aggro: false, size: 110, behave: ["reflect"],
    look: "ปูยักษ์กระดองแดง ก้ามเหล็กวาว" },
  { id: "mudskipper", name: "ปลาตีนกระโดด", field: "mangrove_coast", levels: [37, 40], kind: "fast", element: "water", eleDef: { water: 30, mud: 20 },
    aggro: true, size: 60, behave: [],
    look: "ปลาตาโปนเดินด้วยครีบ ตัวลื่นมัน" },
  { id: "ghost_pirate", name: "โจรสลัดผี", field: "mangrove_coast", levels: [41, 45], kind: "rare", element: "dark", eleDef: { dark: 35, water: 30 },
    aggro: true, size: 160, behave: ["ranged:musket", "fly"],
    look: "ผีโจรสลัดโปร่งเขียว หมวกสามเหลี่ยม ขาไม้" },
  { id: "tanuki", name: "ทานุกิแปลงกาย", field: "sakura_hills", levels: [45, 49], kind: "normal", element: "earth", eleDef: { earth: 25, plant: 20 },
    aggro: false, size: 80, behave: ["dodge"],
    look: "ทานุกิพุงกลม ใบไม้บนหัว" },
  { id: "bamboo_ninja", name: "นินจาไผ่", field: "sakura_hills", levels: [50, 55], kind: "fast", element: "wind", eleDef: { wind: 35 },
    aggro: true, size: 160, behave: ["human", "ranged:shuriken"],
    look: "นินจาชุดเขียวไผ่ ผ้าปิดหน้า" },
  { id: "paper_lantern", name: "วิญญาณโคมกระดาษ", field: "sakura_hills", levels: [54, 58], kind: "caster", element: "fire", eleDef: { fire: 35, dark: 25 },
    aggro: false, size: 110, behave: ["fly", "burn"],
    look: "โคมกระดาษเก่ามีตาเดียวกับลิ้นยาว" },
  { id: "nine_tail_fox", name: "จิ้งจอกเก้าหาง", field: "sakura_hills", levels: [60, 60], kind: "rare", element: "light", eleDef: { light: 45, fire: 30 },
    aggro: true, size: 140, behave: ["ranged:foxfire"],
    look: "จิ้งจอกขาวเก้าหาง ปลายหางเรืองฟ้า" },
  { id: "lava_salamander", name: "ซาลาแมนเดอร์ลาวา", field: "volcano", levels: [60, 64], kind: "fast", element: "lava", eleDef: { lava: 40, fire: 30 },
    aggro: true, size: 100, behave: ["burn"],
    look: "จิ้งจกยักษ์ผิวดำร้าว ลาวาไหลตามรอยแตก" },
  { id: "basalt_golem", name: "โกเลมหินภูเขาไฟ", field: "volcano", levels: [66, 70], kind: "tank", element: "lava", eleDef: { lava: 45, stone: 35, water: -20 },
    aggro: false, size: 250, behave: ["slam"],
    look: "ร่างหินบะซอลต์ดำ ลาวาเรืองในอก" },
  { id: "sulfur_wisp", name: "ภูตกำมะถัน", field: "volcano", levels: [70, 75], kind: "caster", element: "fire", eleDef: { fire: 45, wind: 20 },
    aggro: true, size: 110, behave: ["ranged:fire", "fly"],
    look: "เปลวไฟเหลืองมีหน้า ควันกำมะถันลอยรอบ" },
  { id: "grove_guardian", name: "ผู้พิทักษ์ศาลป่า", field: "west_woods", levels: [20, 20], kind: "boss", element: "plant", eleDef: { plant: 50, earth: 30 },
    aggro: true, size: 340, behave: ["boss", "summon:oak_sprite", "heal"],
    look: "ต้นโอ๊กโบราณเดินได้ เกิดบนผาศาลเจ้า ป่าใหญ่ตะวันตก" },
  { id: "risen_pharaoh", name: "ฟาโรห์คืนชีพ", field: "great_desert", levels: [48, 48], kind: "boss", element: "dark", eleDef: { dark: 50, light: 30 },
    aggro: true, size: 260, behave: ["boss", "summon:mummy_slave", "ranged:curse"],
    look: "ฟาโรห์หน้ากากทอง ในวิหาร ทะเลทรายใหญ่" },
  { id: "ghost_captain", name: "กัปตันโจรสลัดผี", field: "mangrove_coast", levels: [48, 48], kind: "boss", element: "water", eleDef: { water: 45, dark: 40 },
    aggro: true, size: 240, behave: ["boss", "ranged:cannon"],
    look: "ผีกัปตันเสื้อคลุมแดง ข้างซากเรือ ชายฝั่งป่าชายเลน" },
  { id: "thunder_steed", name: "ม้าศึกสายฟ้า", field: "stone_plain", levels: [60, 60], kind: "boss", element: "lightning", eleDef: { lightning: 50, wind: 30 },
    aggro: true, size: 300, behave: ["boss", "charge", "slam"],
    look: "ม้ายักษ์สีน้ำเงินแผงคอสายฟ้า ในวงหิน ที่ราบหินโบราณ" },
  { id: "frost_dragon", name: "มังกรน้ำแข็งเหนือ", field: "north_icefield", levels: [72, 72], kind: "boss", element: "ice", eleDef: { ice: 55, water: 30 },
    aggro: true, size: 420, behave: ["boss", "ranged:frost", "fly"],
    look: "มังกรเกล็ดฟ้าใส บนทะเลสาบน้ำแข็ง ทุ่งน้ำแข็งเหนือ" },
  { id: "lava_lord", name: "เจ้าแห่งลาวา", field: "volcano", levels: [78, 78], kind: "boss", element: "lava", eleDef: { lava: 55, fire: 40 },
    aggro: true, size: 420, behave: ["boss", "slam", "burn"],
    look: "ยักษ์ลาวาครึ่งตัวโผล่จากปล่อง ยอดภูเขาไฟ" },
  { id: "demon_king", name: "ราชาอสูรแห่งประตูดำ", field: "demon_land", levels: [105, 105], kind: "boss", element: "dark", eleDef: { dark: 60, fire: 40, metal: 40 },
    aggro: true, size: 380, behave: ["boss", "summon:hellhound", "slam", "ranged:fire"],
    look: "ราชาอสูรปีกดำสวมมงกุฎหนาม หน้าประตูอสูร ดินแดนอสูร" },
];

// Its numbers at a level: the violet slime's (level 9) grown along the slimes' curve, times its
// kind's share. hp, atk, def, mdef, xp.
const KIND: Record<MonsterKind, [number, number, number, number, number]> = {
  normal: [1, 1, 1, 1, 1],
  tank: [1.6, 0.8, 1.6, 1, 1.2],
  fast: [0.7, 1.15, 0.7, 0.8, 0.9],
  caster: [0.8, 1.1, 0.7, 1.6, 1],
  rare: [2.6, 1.3, 1.3, 1.3, 3],
  boss: [18, 1.8, 1.7, 1.7, 40],
};
export function statsFor(level: number, kind: MonsterKind): { hp: number; atk: number; def: number; mdef: number; xp: number } {
  const r = (level + 4) / 13, [h, a, d, m, x] = KIND[kind];
  return {
    hp: Math.round(320 * r ** 1.6 * h), atk: Math.round(28 * r ** 1.1 * a),
    def: Math.round(12 * r * d), mdef: Math.round(12 * r * m), xp: Math.round(48 * r ** 1.65 * x),
  };
}

// A behaviour's value ("ranged:fire" -> "fire"), or null when it hasn't that behaviour.
export function behaviour(def: { behave: string[] }, name: string): string | null {
  for (const b of def.behave) {
    if (b === name) return "";
    if (b.startsWith(name + ":")) return b.slice(name.length + 1);
  }
  return null;
}

// The people among them, dressed through the wardrobe (src/look.ts): their look, the weapon
// they hold and the motion they strike with.
export const PEOPLE: Record<string, { look: { gender: string; hair: string; hairColor: string; eyes: string; top: string; bottom: string }; weapon: WeaponId; motion: string }> = {
  highway_bandit: { look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "crimson", top: "top_adventurer_plum", bottom: "bottom_adventurer_black" }, weapon: "dagger", motion: "thrust" },
  nomad_raider: { look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" }, weapon: "bow", motion: "shoot" },
  cursed_deserter: { look: { gender: "male", hair: "", hairColor: "ink", eyes: "crimson", top: "top_warrior_navy", bottom: "bottom_warrior_black" }, weapon: "sword_1h", motion: "swing" },
  bamboo_ninja: { look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_black" }, weapon: "dagger", motion: "thrust" },
};

export const MONSTER_BY_ID: Record<string, MonsterDef> = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
