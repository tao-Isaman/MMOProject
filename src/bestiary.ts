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

import type { ElementId, Race } from "./progression";
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
  race?: Race;    // what it is (RACE_OF below)
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

  // The west lands (docs/west_lands.md; their concepts and sprite prompts in
  // docs/monsters_west.md). Each field has two of its own that come and go, some a rare one, and
  // the three landmarks at the top (the kings' tombs and the two dead ends by the sea, the north
  // cliffs and the cape) a boss that calls up one of its field's own. Fields next door to each
  // other share no family and as few races and elements as can be, and their levels jump about
  // the map as the fields' do. Element defences grow with the level, and each has a weakness.
  // noa_meadow (30–40): the windy grassland's flock and what hides in it
  { id: "cloud_sheep", name: "แกะขนเมฆ", field: "noa_meadow", levels: [30, 35], kind: "normal", element: "wind", eleDef: { wind: 25, fire: -20 },
    aggro: false, size: 90, behave: ["pack"],
    look: "แกะตัวกลมขนฟูขาวเหมือนก้อนเมฆ ขนปลิวไปตามลม" },
  { id: "furrow_mole", name: "ตุ่นยักษ์ไถทุ่ง", field: "noa_meadow", levels: [34, 39], kind: "tank", element: "earth", eleDef: { earth: 30, plant: 10, water: -20 },
    aggro: false, size: 80, behave: ["slow"],
    look: "ตุ่นขนดำมันวาว จมูกชมพูแฉก อุ้งมือใหญ่เหมือนพลั่ว" },
  { id: "sheepskin_wolf", name: "หมาป่าในคราบแกะ", field: "noa_meadow", levels: [40, 40], kind: "rare", element: "wind", eleDef: { wind: 30, earth: 15, fire: -20 },
    aggro: true, size: 130, behave: ["charge", "dodge"],
    look: "หมาป่าเทาคลุมหนังแกะขนฟู ปากยาวกับตาเหลืองโผล่ใต้ขนแกะ" },
  // noa_plains (40–50): the vineyards' pests
  { id: "vine_snail", name: "หอยทากเถาองุ่น", field: "noa_plains", levels: [40, 45], kind: "tank", element: "plant", eleDef: { plant: 30, water: 20, fire: -20 },
    aggro: false, size: 90, behave: ["slow"],
    look: "หอยทากตัวโต เปลือกพันเถาองุ่น พวงองุ่นม่วงห้อยข้างเปลือก" },
  { id: "tipsy_wasp", name: "ต่อเมาองุ่น", field: "noa_plains", levels: [45, 50], kind: "fast", element: "wind", eleDef: { wind: 30, poison: 15, ice: -20 },
    aggro: true, size: 70, behave: ["fly", "pack"],
    look: "ตัวต่อตัวเท่าแมว ท้องลายเหลืองม่วง บินเซไปมาเพราะเมาองุ่นหมัก" },
  // dry_plains (50–62): dry-land creatures and the caravans' bane
  { id: "dust_devil", name: "ภูตลมหมุนฝุ่น", field: "dry_plains", levels: [50, 55], kind: "fast", element: "smoke", eleDef: { smoke: 30, wind: 20, water: -25 },
    aggro: true, size: 150, behave: ["dodge", "slow"],
    look: "ลมหมุนหอบฝุ่นสีน้ำตาลส้ม ตาสองดวงวาวในม่านฝุ่น หญ้าแห้งปลิววนรอบตัว" },
  { id: "mesa_armadillo", name: "ตัวนิ่มหลังผา", field: "dry_plains", levels: [55, 60], kind: "tank", element: "stone", eleDef: { stone: 40, earth: 25, water: -20 },
    aggro: false, size: 120, behave: ["reflect"],
    look: "ตัวนิ่มตัวโต เกราะหลังเป็นชั้นหินสีส้มแดงยอดตัดเหมือนเนินผา" },
  { id: "caravan_raider", name: "โจรปล้นคาราวาน", field: "dry_plains", levels: [60, 62], kind: "rare", element: "fire", eleDef: { fire: 25, earth: 20, water: -15 },
    aggro: true, size: 160, behave: ["human", "charge", "steal"],
    look: "โจรสาวผ้าพันหน้าสีฝุ่น ถือดาบ ถุงทองห้อยเอว" },
  // elder_forest (62–74): the old forest's spirits
  { id: "shrine_mask", name: "หน้ากากเทพป่า", field: "elder_forest", levels: [62, 67], kind: "fast", element: "light", eleDef: { light: 35, wind: 20, dark: -20 },
    aggro: true, size: 110, behave: ["fly", "dodge"],
    look: "หน้ากากไม้สลักหน้าเทพจากศาลยุคโนอา ลอยได้ แผงขนเป็นใบไม้กับมอส ตาเรืองทอง" },
  { id: "moss_dryad", name: "นางไม้มอส", field: "elder_forest", levels: [66, 71], kind: "caster", element: "plant", eleDef: { plant: 40, water: 25, fire: -25 },
    aggro: false, size: 160, behave: ["ranged:vine", "slow"],
    look: "หญิงสาวผิวเปลือกไม้ ผมเป็นมอสกับเถาวัลย์ เห็ดเรืองแสงขึ้นบนไหล่" },
  { id: "forest_turtle", name: "เต่าป่าพันปี", field: "elder_forest", levels: [72, 74], kind: "rare", element: "earth", eleDef: { earth: 40, plant: 30, lightning: -20 },
    aggro: false, size: 200, behave: ["heal", "slam"],
    look: "เต่ายักษ์กระดองคลุมมอส มีต้นไม้เล็กกับศาลหินบนหลัง" },
  // rice_terraces (74–86): what lives in the flooded paddies
  { id: "paddy_waterbug", name: "แมงดานายักษ์", field: "rice_terraces", levels: [74, 80], kind: "tank", element: "water", eleDef: { water: 40, mud: 25, lightning: -20 },
    aggro: false, size: 100, behave: ["slow"],
    look: "แมงดานาตัวเท่าหมู ตัวแบนสีน้ำตาลเขียว ขาหน้าเป็นตะขอหนีบ" },
  { id: "thunder_eel", name: "ปลาไหลอัสนี", field: "rice_terraces", levels: [80, 86], kind: "caster", element: "lightning", eleDef: { lightning: 40, water: 30, earth: -20 },
    aggro: true, size: 150, behave: ["ranged:spark", "slow"],
    look: "ปลาไหลยาวสีน้ำเงินเข้ม ประกายไฟฟ้าแลบตามครีบหลัง" },
  // highland_downs (86–98): the herds and the walking cairns of the snowy downs
  { id: "woolly_mammoth", name: "แมมมอธขนยาว", field: "highland_downs", levels: [86, 92], kind: "normal", element: "ice", eleDef: { ice: 40, earth: 20, fire: -20 },
    aggro: false, size: 240, behave: ["charge", "pack"],
    look: "แมมมอธขนน้ำตาลแดงยาวรุงรัง งาโค้งยาว หิมะเกาะหลัง" },
  { id: "cairn_walker", name: "กองหินเดินทาง", field: "highland_downs", levels: [92, 98], kind: "tank", element: "stone", eleDef: { stone: 50, ice: 25, plant: -20 },
    aggro: false, size: 210, behave: ["slam", "reflect"],
    look: "กองหินบอกทางซ้อนเป็นร่างคน หินก้อนบนสุดสลักตาเรืองฟ้า" },
  // karst_peaks (98–110): the misty peaks' beasts of Suzhou's tales
  { id: "mist_crane", name: "กระเรียนหมอก", field: "karst_peaks", levels: [98, 103], kind: "fast", element: "wind", eleDef: { wind: 40, smoke: 25, lightning: -20 },
    aggro: true, size: 150, behave: ["fly", "charge"],
    look: "กระเรียนขาวคอยาว หงอนแดง ปลายปีกจางเป็นหมอก" },
  { id: "money_toad", name: "คางคกสามขา", field: "karst_peaks", levels: [103, 108], kind: "caster", element: "water", eleDef: { water: 40, metal: 25, earth: -20 },
    aggro: false, size: 110, behave: ["ranged:water", "steal"],
    look: "คางคกทองสามขา คาบเหรียญรูสี่เหลี่ยมไว้ในปาก นั่งบนกองเหรียญ" },
  { id: "cloud_qilin", name: "กิเลนเมฆ", field: "karst_peaks", levels: [109, 110], kind: "rare", element: "lightning", eleDef: { lightning: 45, light: 30, earth: -20 },
    aggro: true, size: 220, behave: ["fly", "charge", "heal"],
    look: "กิเลนเกล็ดทอง แผงคอกับหางเป็นเมฆครึ้ม เขาเดียวมีสายฟ้าแลบ เหยียบเมฆเดิน" },
  // ancient_plain (110–122): the ghosts and the broken giants of the city before Noa
  { id: "phantom_hoplite", name: "ทหารหมอกยุคก่อน", field: "ancient_plain", levels: [110, 115], kind: "normal", element: "smoke", eleDef: { smoke: 40, dark: 30, light: -25 },
    aggro: true, size: 170, behave: ["pack", "dodge"],
    look: "วิญญาณทหารโปร่งแสงหมวกหงอนสูง ถือหอกกับโล่กลม ท่อนล่างเป็นหมอก" },
  { id: "statue_hand", name: "หัตถ์รูปปั้นยักษ์", field: "ancient_plain", levels: [115, 120], kind: "tank", element: "stone", eleDef: { stone: 50, earth: 30, lightning: -20 },
    aggro: false, size: 200, behave: ["slam", "petrify"],
    look: "มือหินยักษ์จากรูปปั้นที่ล้ม คลานด้วยห้านิ้ว สวมแหวนตราโบราณ" },
  { id: "ghost_charioteer", name: "สารถีรถศึกวิญญาณ", field: "ancient_plain", levels: [121, 122], kind: "rare", element: "wind", eleDef: { wind: 45, smoke: 30, light: -25 },
    aggro: true, size: 230, behave: ["fly", "charge", "slow"],
    look: "วิญญาณสารถีเกราะอกสำริด ขับรถศึกโปร่งแสงที่ม้าหมอกสองตัวลาก" },
  // frozen_river (122–134): under the ice and under the old bridge
  { id: "ice_pike", name: "ปลาไพค์เกล็ดน้ำแข็ง", field: "frozen_river", levels: [122, 128], kind: "fast", element: "ice", eleDef: { ice: 45, water: 35, lightning: -25 },
    aggro: true, size: 130, behave: ["charge", "slow"],
    look: "ปลาปากยาวฟันแหลม เกล็ดเป็นน้ำแข็งใส พุ่งออกจากรูน้ำแข็ง" },
  { id: "bridge_troll", name: "โทรลล์ใต้สะพาน", field: "frozen_river", levels: [128, 134], kind: "tank", element: "earth", eleDef: { earth: 45, ice: 30, fire: -25 },
    aggro: true, size: 260, behave: ["slam", "heal"],
    look: "ยักษ์ผิวเทาอมเขียว จมูกโต คิ้วมีน้ำแข็งเกาะ ถือเสาสะพานหักเป็นกระบอง" },
  // west_pass (134–146): the cliff road, its rope bridges and its old checkpoint
  { id: "rope_spider", name: "แมงมุมสะพานเชือก", field: "west_pass", levels: [134, 139], kind: "normal", element: "poison", eleDef: { poison: 45, earth: 20, fire: -25 },
    aggro: true, size: 120, behave: ["ranged:web", "slow"],
    look: "แมงมุมขายาวลายเหมือนเชือกป่าน ชักใยเหนียวระหว่างเสาสะพาน" },
  { id: "pass_gargoyle", name: "การ์กอยล์ด่านร้าง", field: "west_pass", levels: [139, 144], kind: "normal", element: "stone", eleDef: { stone: 50, dark: 25, light: -20 },
    aggro: true, size: 170, behave: ["fly", "petrify"],
    look: "รูปปั้นอสูรหินมีปีกจากหลังคาด่านเก่า ตะไคร่เกาะ ตาแดงก่ำ" },
  { id: "toll_keeper", name: "นายด่านเถื่อน", field: "west_pass", levels: [145, 146], kind: "rare", element: "metal", eleDef: { metal: 40, earth: 25, lightning: -20 },
    aggro: true, size: 170, behave: ["human", "slam", "steal"],
    look: "ชายร่างใหญ่ในชุดทหารด่านเก่า แบกดาบใหญ่ ขู่เก็บค่าผ่านทาง" },
  // tangled_hills (146–158): what waits in the maze of hills
  { id: "lost_wisp", name: "ดวงไฟหลงทาง", field: "tangled_hills", levels: [146, 152], kind: "caster", element: "dark", eleDef: { dark: 50, smoke: 30, light: -25 },
    aggro: true, size: 100, behave: ["fly", "ranged:curse", "dodge"],
    look: "ดวงไฟสีม่วงฟ้าลอยเรี่ยพื้น หน้ายิ้มเลือนราง หางเป็นควัน" },
  { id: "maze_minotaur", name: "มิโนทอร์เนินวงกต", field: "tangled_hills", levels: [152, 158], kind: "tank", element: "metal", eleDef: { metal: 45, earth: 35, lightning: -20 },
    aggro: true, size: 280, behave: ["charge", "slam"],
    look: "มนุษย์หัววัวขนดำ เขาหุ้มทองแดง ห่วงที่จมูก ถือขวานสองคม" },
  // lagoon_marsh (158–170): the poisoned marsh
  { id: "bog_hulk", name: "ยักษ์โคลนบึง", field: "lagoon_marsh", levels: [158, 164], kind: "tank", element: "mud", eleDef: { mud: 55, water: 35, wind: -20 },
    aggro: false, size: 260, behave: ["slam", "slow"],
    look: "ร่างโคลนดำเหนียวสูงท่วมหัว ต้นกกงอกตามตัว ตาเป็นฟองก๊าซเรืองเขียว" },
  { id: "marsh_hydra", name: "ไฮดราบึงพิษ", field: "lagoon_marsh", levels: [163, 168], kind: "normal", element: "poison", eleDef: { poison: 55, water: 30, fire: -25 },
    aggro: true, size: 230, behave: ["ranged:venom", "heal"],
    look: "งูยักษ์สามหัวเกล็ดเขียวคล้ำ น้ำลายพิษหยดเป็นควันเขียว" },
  { id: "bog_witch", name: "แม่มดบึงพิษ", field: "lagoon_marsh", levels: [169, 170], kind: "rare", element: "poison", eleDef: { poison: 50, mud: 30, light: -20 },
    aggro: true, size: 160, behave: ["human", "ranged:curse", "slow"],
    look: "แม่มดชุดคลุมสีตะไคร่ ผมเขียวหม่น ถือไม้เท้าแขวนขวดยาพิษ" },
  // royal_necropolis (170–182): the first kings' tombs, the jungle creeping in
  { id: "bone_royal_guard", name: "ราชองครักษ์กระดูก", field: "royal_necropolis", levels: [170, 176], kind: "normal", element: "metal", eleDef: { metal: 50, dark: 35, light: -30 },
    aggro: true, size: 180, behave: ["pack", "reflect"],
    look: "โครงกระดูกในเกราะทองหมอง ถือหอกยาวกับโล่ตรากษัตริย์องค์แรก" },
  { id: "corpse_bloom", name: "บุปผากินศพ", field: "royal_necropolis", levels: [175, 181], kind: "caster", element: "poison", eleDef: { poison: 55, plant: 40, fire: -30 },
    aggro: true, size: 180, behave: ["ranged:vine", "explode"],
    look: "ดอกไม้ยักษ์กลีบแดงจุดขาว กลิ่นเหมือนศพ เถารากเลื้อยแทนขา" },
  { id: "first_king", name: "ปฐมกษัตริย์ผู้ไม่หลับ", field: "royal_necropolis", levels: [182, 182], kind: "boss", element: "dark", eleDef: { dark: 65, metal: 45, light: -25 },
    aggro: true, size: 300, behave: ["boss", "summon:bone_royal_guard", "slam", "ranged:curse"],
    look: "กษัตริย์โครงกระดูกสวมมงกุฎทองกับผ้าคลุมแดงขาด ในห้องพระศพชั้นใน สุสานหลวงโบราณ" },
  // north_cliffs (182–192): the icy sea's fliers and the lamp that wrecks ships
  { id: "frost_harpy", name: "ฮาร์ปีลมเหมันต์", field: "north_cliffs", levels: [182, 187], kind: "fast", element: "wind", eleDef: { wind: 50, ice: 35, lightning: -25 },
    aggro: true, size: 150, behave: ["fly", "pack", "dodge"],
    look: "ปีศาจหน้าหญิงตัวนก ปีกขนเทาขาว กรงเล็บน้ำแข็ง ผมปลิวเป็นเกล็ดหิมะ" },
  { id: "rime_wyvern", name: "ไวเวิร์นน้ำค้างแข็ง", field: "north_cliffs", levels: [186, 191], kind: "normal", element: "ice", eleDef: { ice: 55, water: 35, fire: -25 },
    aggro: true, size: 280, behave: ["fly", "charge", "slow"],
    look: "มังกรสองขาปีกพังผืดฟ้าซีด เกล็ดมีน้ำค้างแข็งเกาะ หางเป็นหนามน้ำแข็ง" },
  { id: "lighthouse_fiend", name: "อสูรตะเกียงประภาคาร", field: "north_cliffs", levels: [192, 192], kind: "boss", element: "fire", eleDef: { fire: 65, dark: 45, water: -25 },
    aggro: true, size: 340, behave: ["boss", "summon:frost_harpy", "ranged:fire", "burn"],
    look: "อสูรเขาโค้งถือตะเกียงประภาคารที่ลุกโชน ที่ประภาคารร้าง หน้าผาทะเลเหนือ" },
  // west_cape (188–200): the sea dragon, its cult and the storm's beasts
  { id: "sea_cultist", name: "สาวกมังกรทะเล", field: "west_cape", levels: [188, 192], kind: "caster", element: "water", eleDef: { water: 50, dark: 20, lightning: -25 },
    aggro: true, size: 160, behave: ["human", "ranged:water", "heal"],
    look: "นักบวชชุดดำปักลายเกล็ดมังกร ถือไม้เท้า สวดเรียกพายุ" },
  { id: "storm_griffin", name: "กริฟฟินพายุ", field: "west_cape", levels: [191, 194], kind: "fast", element: "lightning", eleDef: { lightning: 55, wind: 40, earth: -25 },
    aggro: true, size: 240, behave: ["fly", "charge", "slam"],
    look: "กริฟฟินหัวอินทรีตัวสิงโต ขนเทาฟ้า สายฟ้าแลบตามปีก" },
  { id: "sea_dragon", name: "มังกรทะเลคลั่ง", field: "west_cape", levels: [195, 195], kind: "boss", element: "water", eleDef: { water: 70, lightning: 45, earth: -20 },
    aggro: true, size: 460, behave: ["boss", "summon:sea_cultist", "ranged:water", "slam"],
    look: "มังกรทะเลตัวยาวเกล็ดน้ำเงินเขียว ครีบหลังเป็นคลื่น ที่ศาลมังกรทะเล แหลมทะเลตะวันตก" },
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
  // the west lands
  caravan_raider: { look: { gender: "female", hair: "hime", hairColor: "crimson", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" }, weapon: "sword_1h", motion: "swing" },
  toll_keeper: { look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" }, weapon: "sword_2h", motion: "swing" },
  bog_witch: { look: { gender: "female", hair: "twintail", hairColor: "mint", eyes: "violet", top: "top_priestess_forest", bottom: "bottom_priestess_forest" }, weapon: "staff", motion: "thrust" },
  sea_cultist: { look: { gender: "female", hair: "hime", hairColor: "blue", eyes: "teal", top: "top_priestess_black", bottom: "bottom_priestess_black" }, weapon: "staff", motion: "thrust" },
};

// What each monster is, for the skills that hit a kind harder (holy light on the undead...).
// The undead and the formless shrug off some poison.
const RACE_OF: Record<string, Race> = {
  spore_mushroom: "plant", fang_squirrel: "brute", oak_boar: "brute", oak_sprite: "plant", grove_guardian: "plant",
  wheat_locust: "insect", mill_rat: "brute", haunted_scarecrow: "undead", highway_bandit: "human",
  swift_ostrich: "brute", grass_hyena: "brute", dung_beetle: "insect",
  saw_beaver: "brute", pine_wolf: "brute", brook_spirit: "formless", pine_bear: "brute",
  ram_goat: "brute", snow_wolf: "brute", snowman: "formless",
  ice_bat: "brute", ice_golem: "formless", yeti: "brute",
  war_penguin: "brute", sabre_seal: "fish", polar_bear: "brute", frozen_explorer: "undead", frost_dragon: "dragon",
  horned_hare: "brute", shaggy_bison: "brute", steppe_eagle: "brute", nomad_raider: "human",
  flame_mane: "brute", giant_gull: "brute", ghost_rancher: "undead",
  canyon_wolf: "brute", menhir_warden: "formless", druid_shade: "undead", thunder_steed: "brute",
  crimson_stag: "brute", shadow_imp: "demon", cursed_deserter: "undead",
  skeleton_soldier: "undead", goat_demon: "demon", siege_golem: "formless",
  dark_crystal_fiend: "demon", hellhound: "demon", demon_knight: "demon", demon_king: "demon",
  red_scorpion: "insect", walking_cactus: "plant", desert_vulture: "brute",
  mummy_slave: "undead", sand_cobra: "brute", sandstone_golem: "formless", pharaoh_shade: "undead", risen_pharaoh: "undead",
  tiger_frog: "fish", vine_monkey: "brute", mud_crocodile: "brute",
  iron_crab: "fish", mudskipper: "fish", ghost_pirate: "undead", ghost_captain: "undead",
  tanuki: "brute", bamboo_ninja: "human", paper_lantern: "demon", nine_tail_fox: "angel",
  lava_salamander: "dragon", basalt_golem: "formless", sulfur_wisp: "formless", lava_lord: "demon",
  // the west lands
  cloud_sheep: "brute", furrow_mole: "brute", sheepskin_wolf: "brute",
  vine_snail: "insect", tipsy_wasp: "insect",
  dust_devil: "formless", mesa_armadillo: "brute", caravan_raider: "human",
  shrine_mask: "formless", moss_dryad: "plant", forest_turtle: "brute",
  paddy_waterbug: "insect", thunder_eel: "fish",
  woolly_mammoth: "brute", cairn_walker: "formless",
  mist_crane: "brute", money_toad: "fish", cloud_qilin: "angel",
  phantom_hoplite: "undead", statue_hand: "formless", ghost_charioteer: "undead",
  ice_pike: "fish", bridge_troll: "brute",
  rope_spider: "insect", pass_gargoyle: "demon", toll_keeper: "human",
  lost_wisp: "undead", maze_minotaur: "demon",
  bog_hulk: "formless", marsh_hydra: "dragon", bog_witch: "human",
  bone_royal_guard: "undead", corpse_bloom: "plant", first_king: "undead",
  frost_harpy: "demon", rime_wyvern: "dragon", lighthouse_fiend: "demon",
  sea_cultist: "human", storm_griffin: "brute", sea_dragon: "dragon",
};
for (const m of MONSTERS) {
  m.race = RACE_OF[m.id] ?? "brute";
  if (m.race === "undead") m.eleDef.poison ??= 40;
  if (m.race === "formless") m.eleDef.poison ??= 25;
}

export const MONSTER_BY_ID: Record<string, MonsterDef> = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
