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
  mat: string;    // the name of its own material, which only it drops (drops.ts mat_<id>)
  field: MapId;
  level: number;  // its one level: every one of its kind is this level, at home and where it visits
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
  { id: "spore_mushroom", name: "เห็ดสปอร์", mat: "ผงสปอร์เห็ดแดง", field: "west_woods", level: 9, kind: "normal", element: "plant", eleDef: { plant: 30, earth: 15 },
    aggro: false, size: 70, behave: ["slow"],
    look: "เห็ดหมวกแดงจุดขาว ตัวป้อม เดินต้วมเตี้ยม" },
  { id: "fang_squirrel", name: "กระรอกเขี้ยวดาบ", mat: "เขี้ยวดาบกระรอก", field: "west_woods", level: 11, kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: true, size: 60, behave: [],
    look: "กระรอกขนน้ำตาลหางฟู เขี้ยวยาวโผล่พ้นปาก" },
  { id: "oak_boar", name: "หมูป่าโอ๊ก", mat: "ขนหลังหมูป่าโอ๊ก", field: "west_woods", level: 13, kind: "tank", element: "earth", eleDef: { earth: 30, plant: 15 },
    aggro: false, size: 110, behave: ["charge"],
    look: "หมูป่าขนดำ งาโค้ง ใบโอ๊กติดหลัง" },
  { id: "oak_sprite", name: "ภูตต้นโอ๊กน้อย", mat: "รากอ่อนภูตโอ๊ก", field: "west_woods", level: 15, kind: "rare", element: "plant", eleDef: { plant: 40, water: 20 },
    aggro: false, size: 120, behave: ["heal"],
    look: "ต้นไม้เตี้ยมีหน้าบนลำต้น เดินด้วยราก" },
  { id: "wheat_locust", name: "ตั๊กแตนทุ่งข้าว", mat: "ปีกใสตั๊กแตนทอง", field: "royal_road", level: 11, kind: "fast", element: "wind", eleDef: { wind: 20, plant: 10 },
    aggro: false, size: 60, behave: ["pack"],
    look: "ตั๊กแตนสีทองตัวเท่าแมว ปีกใส" },
  { id: "mill_rat", name: "หนูโรงสี", mat: "หนวดหนูเปื้อนแป้ง", field: "royal_road", level: 14, kind: "normal", element: "earth", eleDef: { earth: 20 },
    aggro: true, size: 60, behave: [],
    look: "หนูอ้วนขนเทา คาบรวงข้าว แป้งติดหนวด" },
  { id: "haunted_scarecrow", name: "หุ่นไล่กาผีสิง", mat: "ฟางหุ่นไล่กาผีสิง", field: "royal_road", level: 16, kind: "caster", element: "dark", eleDef: { dark: 30, fire: -20 },
    aggro: false, size: 150, behave: ["fly"],
    look: "หุ่นฟางหมวกปีกกว้าง ตาเป็นแสงม่วง ลอยได้" },
  { id: "highway_bandit", name: "โจรดักปล้น", mat: "ผ้าปิดหน้าโจรดักปล้น", field: "royal_road", level: 17, kind: "rare", element: undefined, eleDef: {  },
    aggro: true, size: 160, behave: ["human"],
    look: "โจรผ้าปิดหน้า ถือดาบสั้น" },
  { id: "swift_ostrich", name: "นกกระจอกเทศขาไว", mat: "ขนหางนกกระจอกเทศ", field: "south_savanna", level: 14, kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: false, size: 150, behave: ["flee"],
    look: "นกคอยาวขนดำขาว ขาแข็งแรง" },
  { id: "grass_hyena", name: "ไฮยีน่าหญ้าสูง", mat: "แผงคอไฮยีน่า", field: "south_savanna", level: 17, kind: "normal", element: "earth", eleDef: { earth: 20 },
    aggro: true, size: 90, behave: ["pack"],
    look: "หมาลายจุด แผงคอตั้ง หัวเราะเสียงแหลม" },
  { id: "dung_beetle", name: "ด้วงกลิ้งมูล", mat: "เปลือกด้วงเขียวเหลือบ", field: "south_savanna", level: 19, kind: "tank", element: "mud", eleDef: { mud: 35, earth: 20 },
    aggro: false, size: 90, behave: [],
    look: "ด้วงเปลือกเขียวเหลือบ ดันก้อนโคลนกลม" },
  { id: "saw_beaver", name: "บีเวอร์ฟันเลื่อย", mat: "ฟันเลื่อยบีเวอร์", field: "pine_river", level: 22, kind: "tank", element: "water", eleDef: { water: 30, plant: 10 },
    aggro: false, size: 70, behave: [],
    look: "บีเวอร์ฟันใหญ่ หางแบน คาบท่อนไม้" },
  { id: "pine_wolf", name: "หมาป่าสน", mat: "ขนหมาป่าสน", field: "pine_river", level: 25, kind: "normal", element: "wind", eleDef: { wind: 20, ice: 15 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนเทาเข้ม ตาเหลือง" },
  { id: "brook_spirit", name: "ภูตลำธาร", mat: "หยดน้ำใสภูตลำธาร", field: "pine_river", level: 28, kind: "caster", element: "water", eleDef: { water: 40, fire: 20 },
    aggro: true, size: 120, behave: ["ranged:water", "fly"],
    look: "ร่างน้ำใสรูปเด็กผู้หญิง ผมเป็นสายน้ำ" },
  { id: "pine_bear", name: "หมีป่าสน", mat: "อุ้งตีนหมีป่าสน", field: "pine_river", level: 30, kind: "rare", element: "earth", eleDef: { earth: 30 },
    aggro: false, size: 190, behave: [],
    look: "หมีน้ำตาลตัวโต คาบปลา ยืนสองขาเมื่อโกรธ" },
  { id: "ram_goat", name: "แพะภูเขาเขาวง", mat: "เขาวงแพะภูเขา", field: "snow_foothills", level: 37, kind: "normal", element: "earth", eleDef: { earth: 25, ice: 15 },
    aggro: false, size: 110, behave: ["charge"],
    look: "แพะขาวเคราแหลม เขาม้วนเป็นวง" },
  { id: "snow_wolf", name: "หมาป่าหิมะ", mat: "ขนขาวหมาป่าหิมะ", field: "snow_foothills", level: 40, kind: "fast", element: "ice", eleDef: { ice: 35 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนขาว ลมหายใจเป็นไอเย็น" },
  { id: "snowman", name: "มนุษย์หิมะน้อย", mat: "จมูกแครอทมนุษย์หิมะ", field: "snow_foothills", level: 44, kind: "tank", element: "ice", eleDef: { ice: 40, fire: -15 },
    aggro: false, size: 130, behave: ["ranged:snow"],
    look: "ก้อนหิมะสามชั้น แขนกิ่งไม้ จมูกแครอท" },
  { id: "ice_bat", name: "ค้างคาวน้ำแข็ง", mat: "ปีกน้ำแข็งค้างคาว", field: "ice_pass", level: 47, kind: "fast", element: "ice", eleDef: { ice: 30, wind: 20 },
    aggro: true, size: 70, behave: ["fly"],
    look: "ค้างคาวปีกใสเหมือนแผ่นน้ำแข็ง" },
  { id: "ice_golem", name: "โกเลมน้ำแข็ง", mat: "ผลึกไหล่โกเลมน้ำแข็ง", field: "ice_pass", level: 52, kind: "tank", element: "ice", eleDef: { ice: 45, stone: 30 },
    aggro: false, size: 220, behave: [],
    look: "ร่างก้อนน้ำแข็งสีฟ้า ผลึกงอกบนไหล่" },
  { id: "yeti", name: "เยติ", mat: "ขนฟูเยติ", field: "ice_pass", level: 54, kind: "rare", element: "ice", eleDef: { ice: 40, earth: 20 },
    aggro: true, size: 240, behave: ["slam"],
    look: "ลิงยักษ์ขนขาวฟู หน้าสีฟ้า เขี้ยวโง้ง" },
  { id: "war_penguin", name: "เพนกวินนักรบ", mat: "หมวกเหล็กเพนกวิน", field: "north_icefield", level: 57, kind: "normal", element: "water", eleDef: { water: 30, ice: 30 },
    aggro: false, size: 90, behave: ["pack"],
    look: "เพนกวินสวมหมวกเหล็ก ถือหอกน้ำแข็ง" },
  { id: "sabre_seal", name: "แมวน้ำเขี้ยวดาบ", mat: "เขี้ยวดาบแมวน้ำ", field: "north_icefield", level: 61, kind: "normal", element: "ice", eleDef: { ice: 35, water: 25 },
    aggro: true, size: 110, behave: [],
    look: "แมวน้ำอ้วน เขี้ยวยาวลงมาถึงอก" },
  { id: "polar_bear", name: "หมีขั้วโลก", mat: "กรงเล็บหมีขั้วโลก", field: "north_icefield", level: 65, kind: "tank", element: "ice", eleDef: { ice: 45 },
    aggro: true, size: 210, behave: [],
    look: "หมีขาวตัวโต น้ำแข็งเกาะขน" },
  { id: "frozen_explorer", name: "วิญญาณนักสำรวจ", mat: "ตะเกียงเย็นนักสำรวจ", field: "north_icefield", level: 69, kind: "rare", element: "dark", eleDef: { dark: 40, ice: 30 },
    aggro: true, size: 160, behave: ["ranged:frost", "fly"],
    look: "ผีชายชุดขนสัตว์ขาดวิ่น ถือตะเกียงเย็นเยียบ" },
  { id: "horned_hare", name: "กระต่ายเขาเดียว", mat: "เขาเดียวกระต่าย", field: "west_steppe", level: 32, kind: "fast", element: "wind", eleDef: { wind: 25 },
    aggro: false, size: 60, behave: [],
    look: "กระต่ายขนน้ำตาลอ่อน เขาเดียวกลางหน้าผาก" },
  { id: "shaggy_bison", name: "ควายป่าขนยาว", mat: "เขากว้างควายป่า", field: "west_steppe", level: 35, kind: "tank", element: "earth", eleDef: { earth: 35 },
    aggro: false, size: 170, behave: ["charge"],
    look: "ควายขนยาวสีน้ำตาลเข้ม เขากว้าง" },
  { id: "steppe_eagle", name: "นกอินทรีทุ่ง", mat: "ขนปีกอินทรีทอง", field: "west_steppe", level: 38, kind: "fast", element: "wind", eleDef: { wind: 30 },
    aggro: true, size: 110, behave: ["fly"],
    look: "อินทรีขนน้ำตาลทอง กรงเล็บใหญ่" },
  { id: "nomad_raider", name: "โจรม้าเร่ร่อน", mat: "หมวกขนสัตว์โจรม้า", field: "west_steppe", level: 39, kind: "rare", element: undefined, eleDef: {  },
    aggro: true, size: 160, behave: ["human", "ranged:arrow"],
    look: "นักรบเผ่าหมวกขนสัตว์ ถือคันธนู" },
  { id: "flame_mane", name: "ม้าป่าแผงคอไฟ", mat: "ขนแผงคอไฟ", field: "horse_meadow", level: 42, kind: "normal", element: "fire", eleDef: { fire: 30, wind: 15 },
    aggro: false, size: 170, behave: [],
    look: "ม้าขนแดงก่ำ แผงคอเป็นเปลวไฟอ่อน" },
  { id: "giant_gull", name: "นกนางนวลยักษ์", mat: "ปากงอนางนวลยักษ์", field: "horse_meadow", level: 46, kind: "fast", element: "wind", eleDef: { wind: 25, water: 20 },
    aggro: true, size: 100, behave: ["fly"],
    look: "นางนวลปีกกว้าง ปากเหลืองงอ" },
  { id: "ghost_rancher", name: "ผีคนเลี้ยงม้า", mat: "แส้เรืองแสงผีคนเลี้ยงม้า", field: "horse_meadow", level: 49, kind: "caster", element: "dark", eleDef: { dark: 35 },
    aggro: false, size: 160, behave: ["fly"],
    look: "วิญญาณชายหมวกปีกกว้าง ถือแส้เรืองแสง" },
  { id: "canyon_wolf", name: "หมาป่าหุบผา", mat: "ขนสีหินหมาป่าหุบผา", field: "stone_plain", level: 52, kind: "fast", element: "earth", eleDef: { earth: 25, stone: 15 },
    aggro: true, size: 100, behave: ["pack"],
    look: "หมาป่าขนสีหิน ตัวผอม หูยาว" },
  { id: "menhir_warden", name: "ผู้พิทักษ์หินตั้ง", mat: "เศษหินสลักผู้พิทักษ์", field: "stone_plain", level: 57, kind: "tank", element: "stone", eleDef: { stone: 50, earth: 30 },
    aggro: false, size: 230, behave: ["petrify"],
    look: "หินตั้งสลักหน้า แขนหินลอยข้างตัว" },
  { id: "druid_shade", name: "วิญญาณดรูอิด", mat: "ผ้าคลุมเขียวดรูอิด", field: "stone_plain", level: 58, kind: "caster", element: "plant", eleDef: { plant: 40, light: 30 },
    aggro: true, size: 160, behave: ["ranged:vine", "heal"],
    look: "ชายชราผมขาวเสื้อคลุมเขียว เรืองแสงจาง ๆ" },
  { id: "crimson_stag", name: "กวางเขาแดง", mat: "เขาเมเปิลกวางแดง", field: "border_woods", level: 62, kind: "normal", element: "plant", eleDef: { plant: 30, fire: 15 },
    aggro: false, size: 170, behave: ["charge"],
    look: "กวางขนแดง เขาแตกกิ่งเหมือนใบเมเปิล" },
  { id: "shadow_imp", name: "อิมป์เงา", mat: "หางแหลมอิมป์เงา", field: "border_woods", level: 65, kind: "fast", element: "shadow", eleDef: { shadow: 40, dark: 25, light: -20 },
    aggro: true, size: 80, behave: ["fly"],
    look: "ปีศาจตัวเล็กสีม่วงดำ ปีกค้างคาว หางแหลม" },
  { id: "cursed_deserter", name: "ทหารหนีทัพต้องสาป", mat: "ดาบบิ่นทหารต้องสาป", field: "border_woods", level: 69, kind: "rare", element: "dark", eleDef: { dark: 30, metal: 30 },
    aggro: true, size: 160, behave: ["human"],
    look: "ทหารเกราะผุ ตาแดง ดาบบิ่น" },
  { id: "skeleton_soldier", name: "ทหารโครงกระดูก", mat: "โล่แตกทหารโครงกระดูก", field: "border_line", level: 73, kind: "normal", element: "dark", eleDef: { dark: 35, metal: 25, light: -25 },
    aggro: true, size: 160, behave: [],
    look: "โครงกระดูกหมวกเหล็กสนิม ถือโล่แตก" },
  { id: "goat_demon", name: "อสูรหัวแพะ", mat: "เขาโค้งอสูรหัวแพะ", field: "border_line", level: 78, kind: "caster", element: "fire", eleDef: { fire: 40, dark: 30 },
    aggro: true, size: 200, behave: ["ranged:fire"],
    look: "อสูรร่างคนหัวแพะ เขาโค้ง ขนดำ" },
  { id: "siege_golem", name: "โกเลมเครื่องยิงหิน", mat: "เฟืองไม้เครื่องยิงหิน", field: "border_line", level: 83, kind: "tank", element: "metal", eleDef: { metal: 50, stone: 30, lightning: -20 },
    aggro: true, size: 260, behave: ["ranged:rock", "reflect"],
    look: "ซากเครื่องยิงหินลุกขึ้นเดินด้วยไม้และเหล็ก" },
  { id: "dark_crystal_fiend", name: "อสูรผลึกมืด", mat: "แกนผลึกม่วงดำ", field: "demon_land", level: 88, kind: "tank", element: "dark", eleDef: { dark: 45, stone: 35 },
    aggro: false, size: 200, behave: ["explode"],
    look: "ร่างผลึกม่วงดำ เรืองแสงจากข้างใน" },
  { id: "hellhound", name: "สุนัขนรก", mat: "เขี้ยวไฟสุนัขนรก", field: "demon_land", level: 91, kind: "fast", element: "fire", eleDef: { fire: 45, dark: 30 },
    aggro: true, size: 120, behave: ["pack", "burn"],
    look: "หมาดำตาแดง ไฟลุกตามหลังและหาง" },
  { id: "demon_knight", name: "อัศวินอสูร", mat: "เขาเกราะอัศวินอสูร", field: "demon_land", level: 97, kind: "rare", element: "dark", eleDef: { dark: 45, metal: 40 },
    aggro: true, size: 220, behave: [],
    look: "อัศวินเกราะดำมีเขา ดาบใหญ่เรืองม่วง" },
  { id: "red_scorpion", name: "แมงป่องทรายแดง", mat: "เหล็กไนแมงป่องแดง", field: "desert_edge", level: 22, kind: "normal", element: "earth", eleDef: { earth: 25, fire: 15 },
    aggro: true, size: 80, behave: [],
    look: "แมงป่องสีแดงอิฐ เหล็กไนวาว" },
  { id: "walking_cactus", name: "กระบองเพชรเดินได้", mat: "ดอกชมพูกระบองเพชร", field: "desert_edge", level: 25, kind: "tank", element: "plant", eleDef: { plant: 35, earth: 15 },
    aggro: false, size: 110, behave: ["reflect"],
    look: "กระบองเพชรกลมมีขา ดอกชมพูบนหัว" },
  { id: "desert_vulture", name: "นกแร้งทะเลทราย", mat: "ขนปีกแร้งทะเลทราย", field: "desert_edge", level: 29, kind: "fast", element: "wind", eleDef: { wind: 30 },
    aggro: true, size: 110, behave: ["fly"],
    look: "แร้งหัวโล้น ปีกขาดรุ่งริ่ง" },
  { id: "mummy_slave", name: "มัมมี่ทาส", mat: "ยางไม้อาบศพมัมมี่", field: "great_desert", level: 32, kind: "tank", element: "dark", eleDef: { dark: 30, fire: -20 },
    aggro: false, size: 160, behave: ["slowwalk"],
    look: "ร่างพันผ้าเหลืองหม่น แขนยื่นไปข้างหน้า" },
  { id: "sand_cobra", name: "งูเห่าทราย", mat: "หนังแม่เบี้ยงูเห่าทราย", field: "great_desert", level: 37, kind: "fast", element: "earth", eleDef: { earth: 30 },
    aggro: true, size: 90, behave: [],
    look: "งูเห่าสีทราย แม่เบี้ยลายเหมือนตา" },
  { id: "sandstone_golem", name: "โกเลมหินทราย", mat: "หินทรายสลักอักษร", field: "great_desert", level: 43, kind: "tank", element: "stone", eleDef: { stone: 45, earth: 30 },
    aggro: false, size: 230, behave: ["petrify"],
    look: "รูปปั้นเฝ้าวิหาร อักษรโบราณเรืองแสง" },
  { id: "pharaoh_shade", name: "วิญญาณฟาโรห์", mat: "เศษหน้ากากทองวิญญาณฟาโรห์", field: "great_desert", level: 45, kind: "rare", element: "dark", eleDef: { dark: 40, light: 20, shadow: 20 },
    aggro: true, size: 170, behave: ["ranged:curse", "fly"],
    look: "ร่างโปร่งใสสวมหน้ากากทองคำ ลอยเหนือพื้น" },
  { id: "tiger_frog", name: "กบพิษลายเสือ", mat: "เมือกพิษกบลายเสือ", field: "south_jungle", level: 27, kind: "fast", element: "plant", eleDef: { plant: 25, water: 25 },
    aggro: false, size: 70, behave: ["ranged:tongue"],
    look: "กบตัวเท่าหมา ลายส้มดำ ตาโปน" },
  { id: "vine_monkey", name: "ลิงเถาวัลย์", mat: "เถาวัลย์หางลิง", field: "south_jungle", level: 30, kind: "normal", element: "wind", eleDef: { wind: 25, plant: 15 },
    aggro: true, size: 90, behave: ["steal"],
    look: "ลิงหางยาวพันเถาวัลย์ หน้าเจ้าเล่ห์" },
  { id: "mud_crocodile", name: "จระเข้บ่อโคลน", mat: "เกล็ดตะไคร่จระเข้", field: "south_jungle", level: 34, kind: "tank", element: "mud", eleDef: { mud: 40, water: 30 },
    aggro: false, size: 120, behave: [],
    look: "จระเข้ผิวเปื้อนโคลน หลังมีตะไคร่" },
  { id: "iron_crab", name: "ปูก้ามเหล็ก", mat: "ก้ามเหล็กของปู", field: "mangrove_coast", level: 37, kind: "tank", element: "metal", eleDef: { metal: 35, water: 30, lightning: -15 },
    aggro: false, size: 110, behave: ["reflect"],
    look: "ปูยักษ์กระดองแดง ก้ามเหล็กวาว" },
  { id: "mudskipper", name: "ปลาตีนกระโดด", mat: "ครีบลื่นปลาตีน", field: "mangrove_coast", level: 39, kind: "fast", element: "water", eleDef: { water: 30, mud: 20 },
    aggro: true, size: 60, behave: [],
    look: "ปลาตาโปนเดินด้วยครีบ ตัวลื่นมัน" },
  { id: "ghost_pirate", name: "โจรสลัดผี", mat: "ผ้าโพกหัวผีโจรสลัด", field: "mangrove_coast", level: 43, kind: "rare", element: "dark", eleDef: { dark: 35, water: 30 },
    aggro: true, size: 160, behave: ["ranged:musket", "fly"],
    look: "ผีโจรสลัดโปร่งเขียว หมวกสามเหลี่ยม ขาไม้" },
  { id: "tanuki", name: "ทานุกิแปลงกาย", mat: "ใบไม้แปลงกายทานุกิ", field: "sakura_hills", level: 47, kind: "normal", element: "earth", eleDef: { earth: 25, plant: 20 },
    aggro: false, size: 80, behave: ["dodge"],
    look: "ทานุกิพุงกลม ใบไม้บนหัว" },
  { id: "bamboo_ninja", name: "นินจาไผ่", mat: "ดาวกระจายนินจาไผ่", field: "sakura_hills", level: 53, kind: "fast", element: "wind", eleDef: { wind: 35, shadow: 25 },
    aggro: true, size: 160, behave: ["human", "ranged:shuriken"],
    look: "นินจาชุดเขียวไผ่ ผ้าปิดหน้า" },
  { id: "paper_lantern", name: "วิญญาณโคมกระดาษ", mat: "กระดาษโคมวิญญาณ", field: "sakura_hills", level: 56, kind: "caster", element: "fire", eleDef: { fire: 35, dark: 25 },
    aggro: false, size: 110, behave: ["fly", "burn"],
    look: "โคมกระดาษเก่ามีตาเดียวกับลิ้นยาว" },
  { id: "nine_tail_fox", name: "จิ้งจอกเก้าหาง", mat: "ขนเรืองฟ้าจิ้งจอกเก้าหาง", field: "sakura_hills", level: 60, kind: "rare", element: "light", eleDef: { light: 45, fire: 30 },
    aggro: true, size: 140, behave: ["ranged:foxfire"],
    look: "จิ้งจอกขาวเก้าหาง ปลายหางเรืองฟ้า" },
  { id: "lava_salamander", name: "ซาลาแมนเดอร์ลาวา", mat: "เกล็ดร้าวซาลาแมนเดอร์", field: "volcano", level: 62, kind: "fast", element: "lava", eleDef: { lava: 40, fire: 30 },
    aggro: true, size: 100, behave: ["burn"],
    look: "จิ้งจกยักษ์ผิวดำร้าว ลาวาไหลตามรอยแตก" },
  { id: "basalt_golem", name: "โกเลมหินภูเขาไฟ", mat: "แกนลาวาโกเลมบะซอลต์", field: "volcano", level: 68, kind: "tank", element: "lava", eleDef: { lava: 45, stone: 35, water: -20 },
    aggro: false, size: 250, behave: ["slam"],
    look: "ร่างหินบะซอลต์ดำ ลาวาเรืองในอก" },
  { id: "sulfur_wisp", name: "ภูตกำมะถัน", mat: "ผลึกกำมะถัน", field: "volcano", level: 73, kind: "caster", element: "fire", eleDef: { fire: 45, wind: 20 },
    aggro: true, size: 110, behave: ["ranged:fire", "fly"],
    look: "เปลวไฟเหลืองมีหน้า ควันกำมะถันลอยรอบ" },
  { id: "grove_guardian", name: "ผู้พิทักษ์ศาลป่า", mat: "แก่นไม้ผู้พิทักษ์", field: "west_woods", level: 20, kind: "boss", element: "plant", eleDef: { plant: 50, earth: 30 },
    aggro: true, size: 340, behave: ["boss", "summon:oak_sprite", "heal"],
    look: "ต้นโอ๊กโบราณเดินได้ เกิดบนผาศาลเจ้า ป่าใหญ่ตะวันตก" },
  { id: "risen_pharaoh", name: "ฟาโรห์คืนชีพ", mat: "คทาทองฟาโรห์", field: "great_desert", level: 48, kind: "boss", element: "dark", eleDef: { dark: 50, light: 30, gold: 30 },
    aggro: true, size: 260, behave: ["boss", "summon:mummy_slave", "ranged:curse"],
    look: "ฟาโรห์หน้ากากทอง ในวิหาร ทะเลทรายใหญ่" },
  { id: "ghost_captain", name: "กัปตันโจรสลัดผี", mat: "เข็มทิศกัปตันผี", field: "mangrove_coast", level: 48, kind: "boss", element: "water", eleDef: { water: 45, dark: 40 },
    aggro: true, size: 240, behave: ["boss", "ranged:cannon"],
    look: "ผีกัปตันเสื้อคลุมแดง ข้างซากเรือ ชายฝั่งป่าชายเลน" },
  { id: "thunder_steed", name: "ม้าศึกสายฟ้า", mat: "แผงคอสายฟ้า", field: "stone_plain", level: 60, kind: "boss", element: "lightning", eleDef: { lightning: 50, wind: 30 },
    aggro: true, size: 300, behave: ["boss", "charge", "slam"],
    look: "ม้ายักษ์สีน้ำเงินแผงคอสายฟ้า ในวงหิน ที่ราบหินโบราณ" },
  { id: "frost_dragon", name: "มังกรน้ำแข็งเหนือ", mat: "เกล็ดมังกรน้ำแข็ง", field: "north_icefield", level: 72, kind: "boss", element: "ice", eleDef: { ice: 55, water: 30 },
    aggro: true, size: 420, behave: ["boss", "ranged:frost", "fly"],
    look: "มังกรเกล็ดฟ้าใส บนทะเลสาบน้ำแข็ง ทุ่งน้ำแข็งเหนือ" },
  { id: "lava_lord", name: "เจ้าแห่งลาวา", mat: "หินหลอมเจ้าแห่งลาวา", field: "volcano", level: 78, kind: "boss", element: "lava", eleDef: { lava: 55, fire: 40 },
    aggro: true, size: 420, behave: ["boss", "slam", "burn"],
    look: "ยักษ์ลาวาครึ่งตัวโผล่จากปล่อง ยอดภูเขาไฟ" },
  { id: "demon_king", name: "ราชาอสูรแห่งประตูดำ", mat: "หนามมงกุฎราชาอสูร", field: "demon_land", level: 105, kind: "boss", element: "dark", eleDef: { dark: 60, fire: 40, metal: 40 },
    aggro: true, size: 380, behave: ["boss", "summon:hellhound", "slam", "ranged:fire"],
    look: "ราชาอสูรปีกดำสวมมงกุฎหนาม หน้าประตูอสูร ดินแดนอสูร" },

  // The west lands (docs/west_lands.md; their concepts and sprite prompts in
  // docs/monsters_west.md). Each field has two of its own that come and go, some a rare one, and
  // the three landmarks at the top (the kings' tombs and the two dead ends by the sea, the north
  // cliffs and the cape) a boss that calls up one of its field's own. Fields next door to each
  // other share no family and as few races and elements as can be, and their levels jump about
  // the map as the fields' do. Element defences grow with the level, and each has a weakness.
  // noa_meadow (30–40): the windy grassland's flock and what hides in it
  { id: "cloud_sheep", name: "แกะขนเมฆ", mat: "ปุยเมฆจากแกะ", field: "noa_meadow", level: 33, kind: "normal", element: "wind", eleDef: { wind: 25, fire: -20 },
    aggro: false, size: 90, behave: ["pack"],
    look: "แกะตัวกลมขนฟูขาวเหมือนก้อนเมฆ ขนปลิวไปตามลม" },
  { id: "furrow_mole", name: "ตุ่นยักษ์ไถทุ่ง", mat: "อุ้งมือพลั่วตุ่นยักษ์", field: "noa_meadow", level: 37, kind: "tank", element: "earth", eleDef: { earth: 30, plant: 10, water: -20 },
    aggro: false, size: 80, behave: ["slow"],
    look: "ตุ่นขนดำมันวาว จมูกชมพูแฉก อุ้งมือใหญ่เหมือนพลั่ว" },
  { id: "sheepskin_wolf", name: "หมาป่าในคราบแกะ", mat: "หนังแกะคลุมหมาป่า", field: "noa_meadow", level: 40, kind: "rare", element: "wind", eleDef: { wind: 30, earth: 15, fire: -20 },
    aggro: true, size: 130, behave: ["charge", "dodge"],
    look: "หมาป่าเทาคลุมหนังแกะขนฟู ปากยาวกับตาเหลืองโผล่ใต้ขนแกะ" },
  // noa_plains (40–50): the vineyards' pests
  { id: "vine_snail", name: "หอยทากเถาองุ่น", mat: "เปลือกพันเถาหอยทาก", field: "noa_plains", level: 43, kind: "tank", element: "plant", eleDef: { plant: 30, water: 20, fire: -20 },
    aggro: false, size: 90, behave: ["slow"],
    look: "หอยทากตัวโต เปลือกพันเถาองุ่น พวงองุ่นม่วงห้อยข้างเปลือก" },
  { id: "tipsy_wasp", name: "ต่อเมาองุ่น", mat: "เหล็กในต่อเมา", field: "noa_plains", level: 48, kind: "fast", element: "wind", eleDef: { wind: 30, poison: 15, ice: -20 },
    aggro: true, size: 70, behave: ["fly", "pack"],
    look: "ตัวต่อตัวเท่าแมว ท้องลายเหลืองม่วง บินเซไปมาเพราะเมาองุ่นหมัก" },
  // dry_plains (50–62): dry-land creatures and the caravans' bane
  { id: "dust_devil", name: "ภูตลมหมุนฝุ่น", mat: "ฝุ่นวนภูตลม", field: "dry_plains", level: 53, kind: "fast", element: "smoke", eleDef: { smoke: 30, wind: 20, water: -25 },
    aggro: true, size: 150, behave: ["dodge", "slow"],
    look: "ลมหมุนหอบฝุ่นสีน้ำตาลส้ม ตาสองดวงวาวในม่านฝุ่น หญ้าแห้งปลิววนรอบตัว" },
  { id: "mesa_armadillo", name: "ตัวนิ่มหลังผา", mat: "เกราะหินตัวนิ่ม", field: "dry_plains", level: 58, kind: "tank", element: "stone", eleDef: { stone: 40, earth: 25, water: -20 },
    aggro: false, size: 120, behave: ["reflect"],
    look: "ตัวนิ่มตัวโต เกราะหลังเป็นชั้นหินสีส้มแดงยอดตัดเหมือนเนินผา" },
  { id: "caravan_raider", name: "โจรปล้นคาราวาน", mat: "ถุงทองโจรคาราวาน", field: "dry_plains", level: 61, kind: "rare", element: "fire", eleDef: { fire: 25, earth: 20, water: -15 },
    aggro: true, size: 160, behave: ["human", "charge", "steal"],
    look: "โจรสาวผ้าพันหน้าสีฝุ่น ถือดาบ ถุงทองห้อยเอว" },
  // elder_forest (62–74): the old forest's spirits
  { id: "shrine_mask", name: "หน้ากากเทพป่า", mat: "ไม้สลักหน้ากากเทพ", field: "elder_forest", level: 65, kind: "fast", element: "light", eleDef: { light: 35, wind: 20, dark: -20 },
    aggro: true, size: 110, behave: ["fly", "dodge"],
    look: "หน้ากากไม้สลักหน้าเทพจากศาลยุคโนอา ลอยได้ แผงขนเป็นใบไม้กับมอส ตาเรืองทอง" },
  { id: "moss_dryad", name: "นางไม้มอส", mat: "เห็ดเรืองแสงนางไม้", field: "elder_forest", level: 69, kind: "caster", element: "plant", eleDef: { plant: 40, water: 25, fire: -25 },
    aggro: false, size: 160, behave: ["ranged:vine", "slow"],
    look: "หญิงสาวผิวเปลือกไม้ ผมเป็นมอสกับเถาวัลย์ เห็ดเรืองแสงขึ้นบนไหล่" },
  { id: "forest_turtle", name: "เต่าป่าพันปี", mat: "กระดองมอสเต่าพันปี", field: "elder_forest", level: 73, kind: "rare", element: "earth", eleDef: { earth: 40, plant: 30, lightning: -20 },
    aggro: false, size: 200, behave: ["heal", "slam"],
    look: "เต่ายักษ์กระดองคลุมมอส มีต้นไม้เล็กกับศาลหินบนหลัง" },
  // rice_terraces (74–86): what lives in the flooded paddies
  { id: "paddy_waterbug", name: "แมงดานายักษ์", mat: "ขาตะขอแมงดานา", field: "rice_terraces", level: 77, kind: "tank", element: "water", eleDef: { water: 40, mud: 25, lightning: -20 },
    aggro: false, size: 100, behave: ["slow"],
    look: "แมงดานาตัวเท่าหมู ตัวแบนสีน้ำตาลเขียว ขาหน้าเป็นตะขอหนีบ" },
  { id: "thunder_eel", name: "ปลาไหลอัสนี", mat: "ครีบอัสนีปลาไหล", field: "rice_terraces", level: 83, kind: "caster", element: "lightning", eleDef: { lightning: 40, water: 30, earth: -20 },
    aggro: true, size: 150, behave: ["ranged:spark", "slow"],
    look: "ปลาไหลยาวสีน้ำเงินเข้ม ประกายไฟฟ้าแลบตามครีบหลัง" },
  // highland_downs (86–98): the herds and the walking cairns of the snowy downs
  { id: "woolly_mammoth", name: "แมมมอธขนยาว", mat: "งาโค้งแมมมอธ", field: "highland_downs", level: 89, kind: "normal", element: "ice", eleDef: { ice: 40, earth: 20, fire: -20 },
    aggro: false, size: 240, behave: ["charge", "pack"],
    look: "แมมมอธขนน้ำตาลแดงยาวรุงรัง งาโค้งยาว หิมะเกาะหลัง" },
  { id: "cairn_walker", name: "กองหินเดินทาง", mat: "หินตาเรืองกองหิน", field: "highland_downs", level: 95, kind: "tank", element: "stone", eleDef: { stone: 50, ice: 25, plant: -20 },
    aggro: false, size: 210, behave: ["slam", "reflect"],
    look: "กองหินบอกทางซ้อนเป็นร่างคน หินก้อนบนสุดสลักตาเรืองฟ้า" },
  // karst_peaks (98–110): the misty peaks' beasts of Suzhou's tales
  { id: "mist_crane", name: "กระเรียนหมอก", mat: "ขนหงอนแดงกระเรียน", field: "karst_peaks", level: 101, kind: "fast", element: "wind", eleDef: { wind: 40, smoke: 25, lightning: -20 },
    aggro: true, size: 150, behave: ["fly", "charge"],
    look: "กระเรียนขาวคอยาว หงอนแดง ปลายปีกจางเป็นหมอก" },
  { id: "money_toad", name: "คางคกสามขา", mat: "เหรียญรูสี่เหลี่ยม", field: "karst_peaks", level: 106, kind: "caster", element: "water", eleDef: { water: 40, metal: 25, gold: 35, earth: -20 },
    aggro: false, size: 110, behave: ["ranged:water", "steal"],
    look: "คางคกทองสามขา คาบเหรียญรูสี่เหลี่ยมไว้ในปาก นั่งบนกองเหรียญ" },
  { id: "cloud_qilin", name: "กิเลนเมฆ", mat: "เกล็ดทองกิเลน", field: "karst_peaks", level: 110, kind: "rare", element: "lightning", eleDef: { lightning: 45, light: 30, gold: 25, earth: -20 },
    aggro: true, size: 220, behave: ["fly", "charge", "heal"],
    look: "กิเลนเกล็ดทอง แผงคอกับหางเป็นเมฆครึ้ม เขาเดียวมีสายฟ้าแลบ เหยียบเมฆเดิน" },
  // ancient_plain (110–122): the ghosts and the broken giants of the city before Noa
  { id: "phantom_hoplite", name: "ทหารหมอกยุคก่อน", mat: "หงอนหมวกทหารหมอก", field: "ancient_plain", level: 113, kind: "normal", element: "smoke", eleDef: { smoke: 40, dark: 30, light: -25 },
    aggro: true, size: 170, behave: ["pack", "dodge"],
    look: "วิญญาณทหารโปร่งแสงหมวกหงอนสูง ถือหอกกับโล่กลม ท่อนล่างเป็นหมอก" },
  { id: "statue_hand", name: "หัตถ์รูปปั้นยักษ์", mat: "แหวนตราหัตถ์ยักษ์", field: "ancient_plain", level: 118, kind: "tank", element: "stone", eleDef: { stone: 50, earth: 30, lightning: -20 },
    aggro: false, size: 200, behave: ["slam", "petrify"],
    look: "มือหินยักษ์จากรูปปั้นที่ล้ม คลานด้วยห้านิ้ว สวมแหวนตราโบราณ" },
  { id: "ghost_charioteer", name: "สารถีรถศึกวิญญาณ", mat: "เกราะอกสำริดสารถี", field: "ancient_plain", level: 122, kind: "rare", element: "wind", eleDef: { wind: 45, smoke: 30, light: -25 },
    aggro: true, size: 230, behave: ["fly", "charge", "slow"],
    look: "วิญญาณสารถีเกราะอกสำริด ขับรถศึกโปร่งแสงที่ม้าหมอกสองตัวลาก" },
  // frozen_river (122–134): under the ice and under the old bridge
  { id: "ice_pike", name: "ปลาไพค์เกล็ดน้ำแข็ง", mat: "เกล็ดน้ำแข็งปลาไพค์", field: "frozen_river", level: 125, kind: "fast", element: "ice", eleDef: { ice: 45, water: 35, lightning: -25 },
    aggro: true, size: 130, behave: ["charge", "slow"],
    look: "ปลาปากยาวฟันแหลม เกล็ดเป็นน้ำแข็งใส พุ่งออกจากรูน้ำแข็ง" },
  { id: "bridge_troll", name: "โทรลล์ใต้สะพาน", mat: "เสาสะพานหักของโทรลล์", field: "frozen_river", level: 131, kind: "tank", element: "earth", eleDef: { earth: 45, ice: 30, fire: -25 },
    aggro: true, size: 260, behave: ["slam", "heal"],
    look: "ยักษ์ผิวเทาอมเขียว จมูกโต คิ้วมีน้ำแข็งเกาะ ถือเสาสะพานหักเป็นกระบอง" },
  // west_pass (134–146): the cliff road, its rope bridges and its old checkpoint
  { id: "rope_spider", name: "แมงมุมสะพานเชือก", mat: "ใยเหนียวแมงมุมเชือก", field: "west_pass", level: 137, kind: "normal", element: "poison", eleDef: { poison: 45, earth: 20, fire: -25 },
    aggro: true, size: 120, behave: ["ranged:web", "slow"],
    look: "แมงมุมขายาวลายเหมือนเชือกป่าน ชักใยเหนียวระหว่างเสาสะพาน" },
  { id: "pass_gargoyle", name: "การ์กอยล์ด่านร้าง", mat: "ปีกหินการ์กอยล์", field: "west_pass", level: 142, kind: "normal", element: "stone", eleDef: { stone: 50, dark: 25, light: -20 },
    aggro: true, size: 170, behave: ["fly", "petrify"],
    look: "รูปปั้นอสูรหินมีปีกจากหลังคาด่านเก่า ตะไคร่เกาะ ตาแดงก่ำ" },
  { id: "toll_keeper", name: "นายด่านเถื่อน", mat: "ตราด่านเถื่อน", field: "west_pass", level: 146, kind: "rare", element: "metal", eleDef: { metal: 40, earth: 25, lightning: -20 },
    aggro: true, size: 170, behave: ["human", "slam", "steal"],
    look: "ชายร่างใหญ่ในชุดทหารด่านเก่า แบกดาบใหญ่ ขู่เก็บค่าผ่านทาง" },
  // tangled_hills (146–158): what waits in the maze of hills
  { id: "lost_wisp", name: "ดวงไฟหลงทาง", mat: "ควันม่วงดวงไฟหลงทาง", field: "tangled_hills", level: 149, kind: "caster", element: "dark", eleDef: { dark: 50, smoke: 30, shadow: 25, light: -25 },
    aggro: true, size: 100, behave: ["fly", "ranged:curse", "dodge"],
    look: "ดวงไฟสีม่วงฟ้าลอยเรี่ยพื้น หน้ายิ้มเลือนราง หางเป็นควัน" },
  { id: "maze_minotaur", name: "มิโนทอร์เนินวงกต", mat: "ห่วงจมูกมิโนทอร์", field: "tangled_hills", level: 155, kind: "tank", element: "metal", eleDef: { metal: 45, earth: 35, lightning: -20 },
    aggro: true, size: 280, behave: ["charge", "slam"],
    look: "มนุษย์หัววัวขนดำ เขาหุ้มทองแดง ห่วงที่จมูก ถือขวานสองคม" },
  // lagoon_marsh (158–170): the poisoned marsh
  { id: "bog_hulk", name: "ยักษ์โคลนบึง", mat: "ฟองก๊าซเรืองเขียว", field: "lagoon_marsh", level: 161, kind: "tank", element: "mud", eleDef: { mud: 55, water: 35, wind: -20 },
    aggro: false, size: 260, behave: ["slam", "slow"],
    look: "ร่างโคลนดำเหนียวสูงท่วมหัว ต้นกกงอกตามตัว ตาเป็นฟองก๊าซเรืองเขียว" },
  { id: "marsh_hydra", name: "ไฮดราบึงพิษ", mat: "เกล็ดพิษไฮดรา", field: "lagoon_marsh", level: 166, kind: "normal", element: "poison", eleDef: { poison: 55, water: 30, fire: -25 },
    aggro: true, size: 230, behave: ["ranged:venom", "heal"],
    look: "งูยักษ์สามหัวเกล็ดเขียวคล้ำ น้ำลายพิษหยดเป็นควันเขียว" },
  { id: "bog_witch", name: "แม่มดบึงพิษ", mat: "ขวดยาพิษแม่มดบึง", field: "lagoon_marsh", level: 170, kind: "rare", element: "poison", eleDef: { poison: 50, mud: 30, light: -20 },
    aggro: true, size: 160, behave: ["human", "ranged:curse", "slow"],
    look: "แม่มดชุดคลุมสีตะไคร่ ผมเขียวหม่น ถือไม้เท้าแขวนขวดยาพิษ" },
  // royal_necropolis (170–182): the first kings' tombs, the jungle creeping in
  { id: "bone_royal_guard", name: "ราชองครักษ์กระดูก", mat: "โล่ตราราชองครักษ์", field: "royal_necropolis", level: 173, kind: "normal", element: "metal", eleDef: { metal: 50, dark: 35, light: -30 },
    aggro: true, size: 180, behave: ["pack", "reflect"],
    look: "โครงกระดูกในเกราะทองหมอง ถือหอกยาวกับโล่ตรากษัตริย์องค์แรก" },
  { id: "corpse_bloom", name: "บุปผากินศพ", mat: "กลีบแดงบุปผากินศพ", field: "royal_necropolis", level: 178, kind: "caster", element: "poison", eleDef: { poison: 55, plant: 40, fire: -30 },
    aggro: true, size: 180, behave: ["ranged:vine", "explode"],
    look: "ดอกไม้ยักษ์กลีบแดงจุดขาว กลิ่นเหมือนศพ เถารากเลื้อยแทนขา" },
  { id: "first_king", name: "ปฐมกษัตริย์ผู้ไม่หลับ", mat: "มงกุฎทองปฐมกษัตริย์", field: "royal_necropolis", level: 182, kind: "boss", element: "dark", eleDef: { dark: 65, metal: 45, gold: 35, light: -25 },
    aggro: true, size: 300, behave: ["boss", "summon:bone_royal_guard", "slam", "ranged:curse"],
    look: "กษัตริย์โครงกระดูกสวมมงกุฎทองกับผ้าคลุมแดงขาด ในห้องพระศพชั้นใน สุสานหลวงโบราณ" },
  // north_cliffs (182–192): the icy sea's fliers and the lamp that wrecks ships
  { id: "frost_harpy", name: "ฮาร์ปีลมเหมันต์", mat: "ขนปีกฮาร์ปี", field: "north_cliffs", level: 185, kind: "fast", element: "wind", eleDef: { wind: 50, ice: 35, lightning: -25 },
    aggro: true, size: 150, behave: ["fly", "pack", "dodge"],
    look: "ปีศาจหน้าหญิงตัวนก ปีกขนเทาขาว กรงเล็บน้ำแข็ง ผมปลิวเป็นเกล็ดหิมะ" },
  { id: "rime_wyvern", name: "ไวเวิร์นน้ำค้างแข็ง", mat: "หนามหางไวเวิร์น", field: "north_cliffs", level: 189, kind: "normal", element: "ice", eleDef: { ice: 55, water: 35, fire: -25 },
    aggro: true, size: 280, behave: ["fly", "charge", "slow"],
    look: "มังกรสองขาปีกพังผืดฟ้าซีด เกล็ดมีน้ำค้างแข็งเกาะ หางเป็นหนามน้ำแข็ง" },
  { id: "lighthouse_fiend", name: "อสูรตะเกียงประภาคาร", mat: "ไส้ตะเกียงประภาคาร", field: "north_cliffs", level: 192, kind: "boss", element: "fire", eleDef: { fire: 65, dark: 45, water: -25 },
    aggro: true, size: 340, behave: ["boss", "summon:frost_harpy", "ranged:fire", "burn"],
    look: "อสูรเขาโค้งถือตะเกียงประภาคารที่ลุกโชน ที่ประภาคารร้าง หน้าผาทะเลเหนือ" },
  // west_cape (188–200): the sea dragon, its cult and the storm's beasts
  { id: "sea_cultist", name: "สาวกมังกรทะเล", mat: "ผ้าปักเกล็ดมังกร", field: "west_cape", level: 190, kind: "caster", element: "water", eleDef: { water: 50, dark: 20, lightning: -25 },
    aggro: true, size: 160, behave: ["human", "ranged:water", "heal"],
    look: "นักบวชชุดดำปักลายเกล็ดมังกร ถือไม้เท้า สวดเรียกพายุ" },
  { id: "storm_griffin", name: "กริฟฟินพายุ", mat: "ขนสายฟ้ากริฟฟิน", field: "west_cape", level: 193, kind: "fast", element: "lightning", eleDef: { lightning: 55, wind: 40, earth: -25 },
    aggro: true, size: 240, behave: ["fly", "charge", "slam"],
    look: "กริฟฟินหัวอินทรีตัวสิงโต ขนเทาฟ้า สายฟ้าแลบตามปีก" },
  { id: "sea_dragon", name: "มังกรทะเลคลั่ง", mat: "ครีบคลื่นมังกรทะเล", field: "west_cape", level: 195, kind: "boss", element: "water", eleDef: { water: 70, lightning: 45, earth: -20 },
    aggro: true, size: 460, behave: ["boss", "summon:sea_cultist", "ranged:water", "slam"],
    look: "มังกรทะเลตัวยาวเกล็ดน้ำเงินเขียว ครีบหลังเป็นคลื่น ที่ศาลมังกรทะเล แหลมทะเลตะวันตก" },
  // the rest of the land (docs/v04_lands.md): no sprites yet, so they show as slimes in their
  // element's colour
  { id: "royal_bee", name: "ผึ้งหลวงยักษ์", mat: "นมผึ้งหลวง", field: "flower_fields", level: 26, kind: "fast", element: "wind", eleDef: { wind: 25, plant: 15, fire: -20 },
    aggro: true, size: 70, behave: ["fly", "pack"],
    look: "ผึ้งตัวเท่าแมว ลายทองดำ สวมมงกุฎดอกไม้เล็ก ๆ บนหัว" },
  { id: "sunflower_sentinel", name: "ทานตะวันพลซุ่มยิง", mat: "เมล็ดทานตะวันยักษ์", field: "flower_fields", level: 30, kind: "caster", element: "light", eleDef: { light: 30, plant: 20, fire: -25 },
    aggro: false, size: 170, behave: ["ranged:seed"],
    look: "ทานตะวันสูงเท่าคน หน้าดอกมีตาสองดวงหันตามเป้า ใบเป็นแขน" },
  { id: "fighting_rooster", name: "ไก่ชนป่า", mat: "เดือยไก่ชน", field: "windmill_fields", level: 25, kind: "fast", element: "fire", eleDef: { fire: 25, wind: 10, water: -20 },
    aggro: true, size: 70, behave: ["charge"],
    look: "ไก่ชนหงอนแดงเพลิง ขนหางยาวสีทองเขียว เดือยแหลม" },
  { id: "silver_stag", name: "กวางเขาเงิน", mat: "เขาเงินกวาง", field: "royal_hunt", level: 33, kind: "normal", element: "ice", eleDef: { ice: 30, wind: 15, fire: -20 },
    aggro: false, size: 170, behave: ["charge", "flee"],
    look: "กวางขนขาวเขาเงินแตกกิ่ง ลมหายใจเป็นไอเย็น" },
  { id: "skull_crab", name: "ปูเสฉวนหัวกะโหลก", mat: "กะโหลกเปลือกปูเสฉวน", field: "salt_dunes", level: 37, kind: "tank", element: "water", eleDef: { water: 30, earth: 20, lightning: -20 },
    aggro: false, size: 90, behave: ["reflect"],
    look: "ปูเสฉวนตัวโตที่ใช้กะโหลกวัวฟอกขาวเป็นเปลือก ก้ามแดงข้างหนึ่งใหญ่" },
  { id: "lavender_moth", name: "ผีเสื้อราตรีลาเวนเดอร์", mat: "ผงหลับผีเสื้อลาเวนเดอร์", field: "lavender_hills", level: 41, kind: "caster", element: "wind", eleDef: { wind: 30, plant: 15, fire: -25 },
    aggro: false, size: 110, behave: ["fly", "slow", "ranged:dust"],
    look: "ผีเสื้อกลางคืนปีกม่วงลายตาวงขาว ขนตัวฟู โปรยผงหลับสีม่วง" },
  { id: "sea_krait", name: "งูสมิงทะเล", mat: "หางพายงูสมิง", field: "inner_sea_cliffs", level: 45, kind: "fast", element: "poison", eleDef: { poison: 30, water: 20, lightning: -20 },
    aggro: true, size: 120, behave: ["burn"],
    look: "งูทะเลลายปล้องฟ้าสลับดำ หางแบนเหมือนพาย เลื้อยขึ้นมาบนหาด" },
  { id: "rafflesia", name: "ดอกบัวผุดยักษ์", mat: "กลีบหนาบัวผุด", field: "waterfall_gorge", level: 45, kind: "caster", element: "poison", eleDef: { poison: 30, plant: 25, fire: -25 },
    aggro: false, size: 160, behave: ["ranged:spore"],
    look: "ดอกไม้แดงจุดขาวยักษ์ กลีบหนาห้ากลีบ กลางดอกเป็นปากกลมมีควันเขียว" },
  { id: "black_panther", name: "เสือดำเงาไพร", mat: "หนังเสือดำเงาไพร", field: "waterfall_gorge", level: 50, kind: "fast", element: "shadow", eleDef: { shadow: 35, plant: 15, light: -25 },
    aggro: true, size: 120, behave: ["dodge"],
    look: "เสือดำตาเหลืองอำพัน ลายจุดดำจาง ๆ เห็นเมื่อโดนแสง" },
  { id: "snow_otter", name: "นากหิมะ", mat: "หนวดนากหิมะ", field: "frozen_falls", level: 48, kind: "fast", element: "water", eleDef: { water: 30, ice: 20, lightning: -20 },
    aggro: false, size: 80, behave: ["pack"],
    look: "นากขนขาวฟู หนวดยาว ไถลท้องบนน้ำแข็ง" },
  { id: "falls_nymph", name: "นางไม้น้ำตกเยือกแข็ง", mat: "น้ำแข็งย้อยนางไม้", field: "frozen_falls", level: 53, kind: "caster", element: "ice", eleDef: { ice: 35, water: 25, fire: -25 },
    aggro: true, size: 160, behave: ["ranged:frost", "slow", "fly"],
    look: "หญิงสาวร่างโปร่งใสสีฟ้า ผมเป็นน้ำแข็งย้อยยาวถึงพื้น" },
  { id: "armored_rhino", name: "แรดเกราะเหล็ก", mat: "นอเงินแรดเกราะ", field: "caravan_road", level: 59, kind: "tank", element: "metal", eleDef: { metal: 35, earth: 25, lightning: -25 },
    aggro: false, size: 200, behave: ["charge"],
    look: "แรดผิวเป็นแผ่นเกราะตอกหมุดเหล็ก นอสองนอสีเงิน" },
  { id: "wild_yak", name: "จามรีขนยาว", mat: "พู่แดงเขาจามรี", field: "windswept_heights", level: 63, kind: "tank", element: "ice", eleDef: { ice: 35, earth: 25, fire: -25 },
    aggro: false, size: 190, behave: ["charge", "slam"],
    look: "จามรีขนดำยาวลากพื้น เขาโค้งใหญ่ มีพู่สีแดงผูกเขาของคนเร่ร่อน" },
  { id: "haunted_minecart", name: "รถเหมืองผีสิง", mat: "ล้อสนิมรถเหมือง", field: "old_royal_mine", level: 65, kind: "fast", element: "metal", eleDef: { metal: 35, dark: 20, lightning: -25 },
    aggro: true, size: 130, behave: ["charge"],
    look: "รถเหมืองเหล็กสนิมเขรอะ มีดวงไฟผีสีเขียวลอยอยู่ข้างใน วิ่งเองได้" },
  { id: "silver_golem", name: "โกเลมแร่เงิน", mat: "สายแร่เงินโกเลม", field: "old_royal_mine", level: 70, kind: "tank", element: "gold", eleDef: { gold: 35, stone: 30, water: -25 },
    aggro: false, size: 240, behave: ["slam", "reflect"],
    look: "โกเลมหินเทาที่มีสายแร่เงินแวววาวพาดทั้งตัว ตาเป็นผลึกฟ้า" },
  { id: "ice_worm", name: "หนอนยักษ์ธารน้ำแข็ง", mat: "ฟันวงหนอนน้ำแข็ง", field: "west_glacier", level: 73, kind: "normal", element: "ice", eleDef: { ice: 40, water: 25, fire: -25 },
    aggro: true, size: 200, behave: ["ranged:frost"],
    look: "หนอนขาวปล้องใหญ่ ปากกลมมีฟันเรียงเป็นวง โผล่จากหิมะครึ่งตัว" },
  { id: "maple_bear", name: "หมีใบเมเปิล", mat: "ใบเมเปิลทองหลังหมี", field: "golden_maples", level: 75, kind: "tank", element: "earth", eleDef: { earth: 40, plant: 25, fire: -25 },
    aggro: false, size: 200, behave: ["slam"],
    look: "หมีขนน้ำตาลทอง มีใบเมเปิลแดงทองติดเต็มหลัง" },
  { id: "glass_scorpion", name: "แมงป่องแก้ว", mat: "หางผลึกแมงป่องแก้ว", field: "glass_desert", level: 77, kind: "tank", element: "light", eleDef: { light: 40, stone: 25, earth: -25 },
    aggro: true, size: 140, behave: ["reflect"],
    look: "แมงป่องใสเหมือนแก้ว เห็นแสงหักเหในตัว หางเป็นผลึกแหลม" },
  { id: "meteor_imp", name: "ภูตเศษอุกกาบาต", mat: "เศษดาวตกลุกไฟ", field: "glass_desert", level: 82, kind: "fast", element: "fire", eleDef: { fire: 40, stone: 25, water: -25 },
    aggro: true, size: 90, behave: ["explode", "burn"],
    look: "ก้อนหินดาวตกลุกไฟ มีตาสองดวงกับปากยิ้ม ลอยกระดอนไปมา" },
  { id: "snow_fox", name: "จิ้งจอกหิมะสามหาง", mat: "ปลายหางแสงเหนือ", field: "aurora_field", level: 81, kind: "fast", element: "ice", eleDef: { ice: 40, wind: 20, fire: -25 },
    aggro: false, size: 100, behave: ["dodge"],
    look: "จิ้งจอกขาวสามหาง ปลายหางเป็นสีฟ้าเรืองเหมือนแสงเหนือ" },
  { id: "aurora_wisp", name: "ภูตแสงเหนือ", mat: "แกนเรืองภูตแสงเหนือ", field: "aurora_field", level: 85, kind: "caster", element: "light", eleDef: { light: 40, ice: 25, dark: -25 },
    aggro: true, size: 150, behave: ["fly", "ranged:light"],
    look: "ริ้วแสงสีเขียวม่วงพลิ้วเหมือนผ้า มีแกนเรืองสว่างอยู่กลาง" },
  { id: "three_eyed_crow", name: "อีกาสามตา", mat: "ตาที่สามอีกา", field: "witch_cape", level: 87, kind: "fast", element: "dark", eleDef: { dark: 40, wind: 20, light: -25 },
    aggro: true, size: 80, behave: ["fly", "steal"],
    look: "อีกาดำขนมัน มีตาแดงดวงที่สามกลางหน้าผาก" },
  { id: "cursed_doll", name: "ตุ๊กตาสาปแม่มด", mat: "กระดุมตาตุ๊กตาสาป", field: "witch_cape", level: 92, kind: "caster", element: "dark", eleDef: { dark: 45, plant: 20, fire: -25 },
    aggro: true, size: 90, behave: ["ranged:curse", "slow"],
    look: "ตุ๊กตาผ้าเย็บปะ ปักเข็มเต็มตัว ตาเป็นกระดุมสองเม็ด ปากเย็บไขว้" },
  { id: "floating_eye", name: "ตาหินลอยฟ้า", mat: "ลูกตาหินลอยฟ้า", field: "floating_rocks", level: 95, kind: "caster", element: "stone", eleDef: { stone: 45, earth: 25, wind: -25 },
    aggro: true, size: 140, behave: ["fly", "ranged:rock"],
    look: "ก้อนหินลอยมีตาเดียวขนาดใหญ่ตรงกลาง เศษหินเล็ก ๆ หมุนรอบ" },
  { id: "storm_elemental", name: "ภูตพายุหมุน", mat: "แกนพายุหมุน", field: "storm_cape", level: 99, kind: "caster", element: "lightning", eleDef: { lightning: 45, wind: 30, earth: -25 },
    aggro: true, size: 200, behave: ["ranged:lightning", "fly"],
    look: "ลมหมุนเป็นกรวยสีเทาเข้ม มีฟ้าแลบวิ่งอยู่ข้างใน" },
  { id: "village_ghoul", name: "ชาวบ้านซากศพ", mat: "เคียวสนิมชาวบ้านศพ", field: "burnt_villages", level: 105, kind: "normal", element: "dark", eleDef: { dark: 45, poison: 40, light: -30 },
    aggro: true, size: 160, behave: ["slowwalk", "pack"],
    look: "ศพชาวนาตาโหลถือเคียวสนิม เสื้อผ้าไหม้เกรียม" },
  { id: "thorn_crawler", name: "หนอนหนามอสูร", mat: "หนามเรืองม่วงหนอนอสูร", field: "thornland", level: 111, kind: "tank", element: "poison", eleDef: { poison: 45, plant: 30, fire: -25 },
    aggro: true, size: 220, behave: ["burn", "slam"],
    look: "หนอนยักษ์ที่ตัวเป็นเถาหนามดำพันกัน ปลายหนามเรืองม่วง" },
  { id: "demon_soldier", name: "ทหารราบอสูร", mat: "หอกง่ามทหารอสูร", field: "demon_camp", level: 113, kind: "normal", element: "fire", eleDef: { fire: 45, dark: 25, water: -25 },
    aggro: true, size: 190, behave: ["pack"],
    look: "อสูรผิวแดงเขาสั้น สวมเกราะเหล็กดำ ถือหอกง่าม" },
  { id: "blood_mage", name: "จอมเวทเลือดอสูร", mat: "ลูกแก้วเลือดอสูร", field: "demon_camp", level: 118, kind: "caster", element: "dark", eleDef: { dark: 50, fire: 25, light: -25 },
    aggro: true, size: 200, behave: ["ranged:blood", "heal"],
    look: "อสูรผอมสูงคลุมผ้าแดงเข้ม มีลูกแก้วเลือดลอยวนรอบตัว" },
  { id: "demon_general", name: "แม่ทัพอสูรเขาเหล็ก", mat: "เขาเหล็กแม่ทัพอสูร", field: "demon_camp", level: 122, kind: "boss", element: "metal", eleDef: { metal: 55, fire: 40, dark: 30, lightning: -25 },
    aggro: true, size: 380, behave: ["boss", "summon:demon_soldier", "slam", "charge"],
    look: "อสูรร่างยักษ์เขาเหล็กโค้ง เกราะหนามดำ ถือดาบใหญ่ ยืนกลางลานกลองศึกของค่ายทัพอสูร" },
  { id: "crag_roc", name: "นกรอคหน้าผา", mat: "กรงเล็บนกรอค", field: "royal_peaks", level: 117, kind: "fast", element: "wind", eleDef: { wind: 50, ice: 25, lightning: -25 },
    aggro: true, size: 240, behave: ["fly", "charge"],
    look: "นกอินทรียักษ์ขนน้ำตาลเทา กรงเล็บใหญ่พอจับวัว" },
  { id: "frost_giant", name: "ยักษ์น้ำแข็งเชิงผา", mat: "เคราน้ำแข็งยักษ์", field: "royal_peaks", level: 122, kind: "tank", element: "ice", eleDef: { ice: 50, stone: 30, fire: -25 },
    aggro: true, size: 300, behave: ["slam"],
    look: "ยักษ์ผิวฟ้าซีด เคราเป็นน้ำแข็งย้อย ถือกระบองหินก้อนใหญ่" },
  { id: "sky_whelp", name: "ลูกมังกรฟ้า", mat: "เกล็ดอ่อนลูกมังกรฟ้า", field: "dragon_summit", level: 129, kind: "fast", element: "lightning", eleDef: { lightning: 50, wind: 30, earth: -25 },
    aggro: true, size: 140, behave: ["fly", "ranged:lightning"],
    look: "มังกรน้อยเกล็ดฟ้าขาว ปีกบาง ประกายไฟฟ้าแลบรอบตัว" },
  { id: "sky_dragon", name: "มังกรฟ้าเฝ้ายอดเขา", mat: "เขาสายฟ้ามังกรฟ้า", field: "dragon_summit", level: 136, kind: "boss", element: "lightning", eleDef: { lightning: 60, wind: 45, ice: 30, earth: -25 },
    aggro: true, size: 480, behave: ["boss", "summon:sky_whelp", "ranged:lightning", "slam"],
    look: "มังกรใหญ่เกล็ดฟ้าขาว ปีกกว้าง เขาเป็นสายฟ้า บนแท่นพิธีราชาภิเษก ยอดเขามังกรฟ้า" },
  { id: "feathered_raptor", name: "แรปเตอร์ขนนก", mat: "กรงเล็บเคียวแรปเตอร์", field: "primeval_forest", level: 123, kind: "fast", element: "earth", eleDef: { earth: 45, plant: 30, ice: -25 },
    aggro: true, size: 170, behave: ["pack", "dodge"],
    look: "ไดโนเสาร์สองขาขนนกสีเขียวลายน้ำตาล กรงเล็บเท้าโค้งเป็นเคียว" },
  { id: "three_horn", name: "ไดโนสามเขา", mat: "แผงคอไดโนสามเขา", field: "primeval_forest", level: 128, kind: "tank", element: "plant", eleDef: { plant: 50, earth: 35, fire: -25 },
    aggro: false, size: 260, behave: ["charge"],
    look: "ไดโนสี่ขาตัวใหญ่ แผงคอแข็งกับเขาสามเขา มอสกับเฟิร์นขึ้นบนหลัง" },
  { id: "frozen_knight", name: "อัศวินน้ำแข็งต้องมนตร์", mat: "เกราะหุ้มน้ำแข็งอัศวิน", field: "ice_queen_hollow", level: 135, kind: "normal", element: "ice", eleDef: { ice: 55, metal: 30, poison: 40, fire: -25 },
    aggro: true, size: 190, behave: ["slow"],
    look: "อัศวินในเกราะที่ถูกน้ำแข็งหุ้มทั้งตัว ตาในหมวกเป็นแสงฟ้า" },
  { id: "snow_queen", name: "ราชินีหิมะ", mat: "ผลึกมงกุฎราชินีหิมะ", field: "ice_queen_hollow", level: 142, kind: "boss", element: "ice", eleDef: { ice: 65, water: 40, light: 30, fire: -25 },
    aggro: true, size: 280, behave: ["boss", "summon:frozen_knight", "ranged:frost", "slow"],
    look: "หญิงสูงในชุดผลึกน้ำแข็ง มงกุฎแหลม ผมขาวปลิว บนบัลลังก์น้ำแข็งของหุบวังน้ำแข็ง" },
  { id: "snow_leopard", name: "เสือดาวหิมะ", mat: "หางฟูเสือดาวหิมะ", field: "snow_abbey", level: 139, kind: "fast", element: "ice", eleDef: { ice: 50, wind: 30, fire: -25 },
    aggro: true, size: 130, behave: ["dodge"],
    look: "เสือดาวขนขาวลายจุดเทา หางยาวฟูหนา" },
  { id: "cliff_ascetic", name: "นักพรตผาหิมะ", mat: "ลูกประคำนักพรต", field: "snow_abbey", level: 144, kind: "caster", element: "wind", eleDef: { wind: 50, ice: 30, lightning: -25 },
    aggro: true, size: 165, behave: ["human", "ranged:wind"],
    look: "นักพรตผมยาวขาว นุ่งผ้าบาง ถือไม้เท้า เดินเท้าเปล่าบนหิมะ" },
  { id: "echo_bat", name: "ค้างคาวเสียงสะท้อน", mat: "เยื่อปีกค้างคาวเสียง", field: "humming_stones", level: 155, kind: "fast", element: "wind", eleDef: { wind: 55, stone: 30, light: -25 },
    aggro: true, size: 120, behave: ["fly", "ranged:sound"],
    look: "ค้างคาวหูใหญ่สีหินเทา ปีกเป็นเยื่อบาง ร้องเป็นคลื่นเสียง" },
  { id: "giant_revenant", name: "วิญญาณนักรบยักษ์", mat: "ดาบหักนักรบยักษ์", field: "frostfang_ridge", level: 163, kind: "normal", element: "metal", eleDef: { metal: 55, ice: 35, poison: 40, light: -30 },
    aggro: true, size: 300, behave: ["slam"],
    look: "ร่างโปร่งของยักษ์ในเกราะเก่าขึ้นสนิม ถือดาบใหญ่ที่หักครึ่ง" },
  { id: "frost_titan", name: "ไททันน้ำแข็ง", mat: "ยอดน้ำแข็งไหล่ไททัน", field: "frostfang_ridge", level: 168, kind: "tank", element: "ice", eleDef: { ice: 60, stone: 35, fire: -25 },
    aggro: false, size: 360, behave: ["slam", "slow"],
    look: "ยักษ์น้ำแข็งสูงเท่าบ้าน ไหล่เป็นยอดน้ำแข็งแหลม เดินแล้วพื้นสั่น" },
  { id: "banyan_wraith", name: "นางพรายรากไทร", mat: "รากไทรนางพราย", field: "sunken_temple_woods", level: 173, kind: "caster", element: "plant", eleDef: { plant: 60, dark: 35, poison: 40, fire: -25 },
    aggro: true, size: 180, behave: ["fly", "ranged:thorn"],
    look: "หญิงผมยาวสยายที่ครึ่งล่างกลายเป็นรากไทร ลอยต่ำเหนือน้ำ" },
  { id: "land_octopus", name: "หมึกยักษ์ขึ้นบก", mat: "หนวดหมึกยักษ์", field: "sunken_temple_woods", level: 178, kind: "tank", element: "water", eleDef: { water: 60, dark: 30, lightning: -25 },
    aggro: false, size: 220, behave: ["slow", "slam"],
    look: "หมึกแดงตัวใหญ่ หนวดแปดเส้นยาวคลานไปบนรากไม้" },
  { id: "spirit_elephant", name: "ช้างเผือกวิญญาณ", mat: "พู่ทองช้างเผือก", field: "sacred_banyan", level: 183, kind: "tank", element: "light", eleDef: { light: 65, earth: 35, dark: -25 },
    aggro: false, size: 300, behave: ["charge", "slam"],
    look: "ช้างเผือกร่างโปร่งแสง สวมเครื่องทรงทองและพู่ห้อย" },
  { id: "temple_guardian", name: "ทวารบาลศิลา", mat: "เขี้ยวงอนทวารบาล", field: "sacred_banyan", level: 188, kind: "normal", element: "stone", eleDef: { stone: 65, earth: 35, lightning: -25 },
    aggro: true, size: 280, behave: ["slam"],
    look: "ยักษ์หินเขียวคล้ำแบบทวารบาลวัด ถือกระบอง เขี้ยวงอน" },
  { id: "ancient_treant", name: "ต้นไม้เฒ่าเดินได้", mat: "เคราตะไคร่ต้นไม้เฒ่า", field: "first_tree", level: 193, kind: "tank", element: "plant", eleDef: { plant: 65, earth: 40, fire: -25 },
    aggro: false, size: 340, behave: ["heal", "slam"],
    look: "ต้นไม้ใหญ่มีหน้าเฒ่าบนลำต้น เดินด้วยราก มอสห้อยเป็นเครา" },
  { id: "golden_firefly", name: "ฝูงหิ่งห้อยทอง", mat: "แสงทองหิ่งห้อย", field: "first_tree", level: 197, kind: "caster", element: "gold", eleDef: { gold: 65, light: 40, wind: -25 },
    aggro: true, size: 120, behave: ["fly", "ranged:light"],
    look: "ฝูงหิ่งห้อยนับร้อยเรืองแสงทอง รวมกันเป็นก้อนรูปผีเสื้อ" },
  { id: "first_tree_warden", name: "เทพพิทักษ์ต้นไม้แรก", mat: "ใบไม้ทองเทพพิทักษ์", field: "first_tree", level: 200, kind: "boss", element: "light", eleDef: { light: 70, plant: 50, gold: 35, dark: -25 },
    aggro: true, size: 400, behave: ["boss", "summon:ancient_treant", "ranged:light", "heal", "slam"],
    look: "ร่างเทพสูงที่ตัวเป็นไม้สีทอง มีปีกเป็นใบไม้ ยืนใต้ต้นไม้แรกของโลก" },
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
  const r = (level + 4) / 13, [h, a, d, m, x] = KIND[kind], k = monsterMight(level);
  return {
    hp: Math.round(320 * r ** 1.6 * h * k), atk: Math.round(28 * r ** 1.1 * a * k),
    def: Math.round(12 * r * d * k), mdef: Math.round(12 * r * m * k), xp: Math.round(48 * r ** 1.65 * x),
  };
}

// Monsters hit harder and last longer than the curve alone, more the higher their level, so a
// player leans on items, skills and (later) a party: HP, attack, defence and magic defence times
// 1.2 up to level 30, 1.4 to 70, 1.6 to 100, 1.8 to 150 and 2 to 200 (experience stays as it is).
// Each step is spread over the four levels round its edge (+0.04 a level: level 30 is 1.28, 31
// 1.32), so no monster is suddenly a fifth stronger than one a level below it.
export const MIGHT_BANDS: [number, number][] = [[30, 1.2], [70, 1.4], [100, 1.6], [150, 1.8], [Infinity, 2]];
export function monsterMight(level: number): number {
  let k = MIGHT_BANDS[0][1];
  for (let i = 1; i < MIGHT_BANDS.length; i++) {
    const edge = MIGHT_BANDS[i - 1][0], step = MIGHT_BANDS[i][1] - MIGHT_BANDS[i - 1][1];
    k += step * Math.min(1, Math.max(0, (level - edge + 2) / 5));
  }
  return +k.toFixed(3);
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
  // the rest of the land
  cliff_ascetic: { look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "@warrior/white", bottom: "@warrior/sand" }, weapon: "staff", motion: "thrust" },
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
  // the rest of the land
  royal_bee: "insect", sunflower_sentinel: "plant", fighting_rooster: "brute", silver_stag: "brute",
  skull_crab: "fish", lavender_moth: "insect", sea_krait: "fish", rafflesia: "plant",
  black_panther: "brute", snow_otter: "fish", falls_nymph: "angel", armored_rhino: "brute",
  wild_yak: "brute", haunted_minecart: "formless", silver_golem: "formless", ice_worm: "insect",
  maple_bear: "brute", glass_scorpion: "insect", meteor_imp: "formless", snow_fox: "brute",
  aurora_wisp: "formless", three_eyed_crow: "brute", cursed_doll: "formless", floating_eye: "formless",
  storm_elemental: "formless", village_ghoul: "undead", thorn_crawler: "demon", demon_soldier: "demon",
  blood_mage: "demon", demon_general: "demon", crag_roc: "brute", frost_giant: "brute",
  sky_whelp: "dragon", sky_dragon: "dragon", feathered_raptor: "dragon", three_horn: "dragon",
  frozen_knight: "undead", snow_queen: "angel", snow_leopard: "brute", cliff_ascetic: "human",
  echo_bat: "brute", giant_revenant: "undead", frost_titan: "brute", banyan_wraith: "undead",
  land_octopus: "fish", spirit_elephant: "angel", temple_guardian: "formless", ancient_treant: "plant",
  golden_firefly: "insect", first_tree_warden: "angel",
};
for (const m of MONSTERS) {
  m.race = RACE_OF[m.id] ?? "brute";
  if (m.race === "undead") m.eleDef.poison ??= 40;
  if (m.race === "formless") m.eleDef.poison ??= 25;
}

export const MONSTER_BY_ID: Record<string, MonsterDef> = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));

// Monsters that live in a second field as well (docs/v04_lands.md): the same kind, look and
// level, met further from home. A field's monsters (its own, its visitors and its boss) span at
// most 20 levels, so a visit that would stretch it further is left out (the steppe eagle on the
// windswept heights, the frost harpy at the storm cape, the skeleton soldiers in the burnt
// villages).
export const VISITORS: { id: string; field: MapId }[] = [
  { id: "mill_rat", field: "windmill_fields" },
  { id: "pine_wolf", field: "royal_hunt" },
  { id: "sabre_seal", field: "west_glacier" },
  { id: "pass_gargoyle", field: "humming_stones" },
  { id: "tipsy_wasp", field: "lavender_hills" },
  { id: "red_scorpion", field: "salt_dunes" },
  { id: "giant_gull", field: "inner_sea_cliffs" },
  { id: "canyon_wolf", field: "caravan_road" },
  { id: "crimson_stag", field: "golden_maples" },
  { id: "goat_demon", field: "floating_rocks" },
  { id: "hellhound", field: "thornland" },
];

// The monsters of a field: its own, and the visitors from other fields (at their own level).
export function fieldMonsters(field: string): MonsterDef[] {
  return [
    ...MONSTERS.filter((m) => m.field === field),
    ...VISITORS.filter((v) => v.field === field).map((v) => ({ ...MONSTER_BY_ID[v.id], field: v.field })),
  ];
}

// A field's levels: the lowest and highest of the monsters living there (its own and its
// visitors); none for a map without bestiary monsters.
// The level a field is shown as (map, world map, codex): FIELD_BAND either side of the average
// level of the monsters met there (its boss left out, one big one would pull it up), never under 1.
export const FIELD_BAND = 5;
export function fieldLevels(field: string): [number, number] | null {
  const here = fieldMonsters(field), plain = here.filter((m) => m.kind !== "boss");
  const lv = (plain.length ? plain : here).map((m) => m.level);
  if (!lv.length) return null;
  const avg = Math.round(lv.reduce((a, b) => a + b, 0) / lv.length);
  return [Math.max(1, avg - FIELD_BAND), avg + FIELD_BAND];
}
// "8–15", or "15" when they are all one level
export const levelText = ([lo, hi]: [number, number], dash = "–") => (lo === hi ? `${lo}` : `${lo}${dash}${hi}`);
