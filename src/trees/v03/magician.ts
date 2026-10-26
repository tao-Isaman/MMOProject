// The magician's branches (third job, from any second job): the gambler (a coin flipped on every
// hit, heads far harder and tails far softer, giant dice that each roll for every monster, and
// the luck that tips both), the copycat (a monster's own attack taken and turned on it, a dash
// and a blink, a mirror that sends blows back) and the illusionist (a body double that fights, a
// stand-in the monsters go for, a vanishing act and a smoke curtain that hides her again after
// every blow, a card from the sleeve). Nine or ten skills a branch, four of them passives. Coming
// from any second job, the
// magician fights with whatever she holds: her blows are on attack and magic attack together
// (stat "both"; a copied attack on whichever the monster used) and no skill asks for a weapon.
// The jester's trees are the cousins to stay apart from: its gambler rolls one die a hit, its
// trickster dodges and weakens; the coin, dice by the handful, copied attacks and hiding are the
// magician's own.
import type { Tree } from "../../progression";
import { pct, lin } from "../util";

// the die, in words: what a roll does to a hit
const DIE = "คูณแต้มที่ทอยได้ ÷ 3.5 (แต้ม 1: ×0.29 ถึง 6: ×1.71)";

export const MAGICIAN_TREES: Record<string, Tree> = {
  // ---- the gambler: heads or tails, dice by the handful, luck to tip them ----
  magician_gambler: {
    name: "นักเสี่ยงดวง", cls: null, job3: "magician", color: "#ffe08a", glyph: "coin",
    note: "ใช้ทั้งพลังโจมตีและพลังเวทกับอาวุธอะไรก็ได้ ดีดเหรียญเสี่ยงหัวก้อย ออกหัวแรงขึ้นมาก ออกก้อยเบาลง โยนลูกเต๋ายักษ์ทีละหลายลูกที่ทอยแยกกันทุกตัว ตีปกติแล้วเหรียญดีดออกไปเองได้ และเสริมโชคดีให้ออกหัวและทอยได้แต้มสูงบ่อยขึ้น เดิมพันต่อกันแรงขึ้น: เหรียญเสี่ยงทายหรือเต๋ายักษ์ถล่ม → ทบเดิมพัน → เดิมพันฟ้าลิขิต",
    nodes: [
      { id: "magician_gambler_coin", name: "เหรียญเสี่ยงทาย", kind: "active", max: 10, pos: [1, 0], glyph: "coin",
        skill: { type: "bolt", stat: "both", mult: lin(2.0, 0.2), coin: () => 0.5, mp: 14, cd: 4, motion: "cast", speed: 1000, range: 650, radius: 30, color: "#ffd86a" },
        desc: (r) => `ดีดเหรียญทองใส่ตัวที่ล็อกไว้ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท แล้วเสี่ยงหัวก้อย: ออกหัวแรงขึ้น 50% ออกก้อยเบาลง 50% (โชคดีช่วยให้ออกหัว)` },
      { id: "magician_gambler_hot_hand", name: "มือขึ้น", kind: "passive", max: 10, pos: [0, 0], glyph: "up",
        stats: (r) => ({ luck: 2 * r, atkPct: 0.01 * r, matkPct: 0.01 * r }),
        desc: (r) => `โชคดี +${2 * r} พลังโจมตีและพลังเวท +${pct(0.01 * r)}` },
      { id: "magician_gambler_dice", name: "เต๋ายักษ์ถล่ม", kind: "active", max: 10, pos: [3, 0], glyph: "slam",
        skill: { type: "blast", stat: "both", mult: lin(1.0, 0.1), hits: 3, every: 0.3, dice: true, mp: 20, cd: 8, motion: "cast", range: 500, radius: 190, delay: 0.3, color: "#fff2c0" },
        desc: (r) => `ลูกเต๋ายักษ์ 3 ลูกหล่นใส่จุดที่เล็ง รัศมี 1.9 ม. ลูกละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตีและพลังเวท ทุกลูกทอยแยกกันทุกตัว ${DIE}` },
      // the coin flips by itself now and then on a normal hit (autocast), at its learned rank
      { id: "magician_gambler_streak", name: "ดวงดีติดมือ", kind: "passive", max: 5, pos: [0, 1], req: [["magician_gambler_hot_hand", 3], ["magician_gambler_coin", 1]], glyph: "swirl",
        stats: (r) => ({ autocast_magician_gambler_coin: 0.02 * r, luck: r }),
        desc: (r) => `ตีปกติโดนแล้วมีโอกาส ${pct(0.02 * r)} ดีดเหรียญเสี่ยงทายออกไปเองฟรี (ไม่เสีย MP ไม่ติดคูลดาวน์ โชคดีช่วย) โชคดี +${r}` },
      { id: "magician_gambler_double", name: "ทบเดิมพัน", kind: "active", max: 10, pos: [1, 1], req: [["magician_gambler_coin", 4]], glyph: "beam",
        skill: { type: "beam", stat: "both", mult: lin(2.1, 0.21), coin: () => 0.8, mp: 18, cd: 6, motion: "cast", length: 520, width: 80,
          combo: { after: ["magician_gambler_coin", "magician_gambler_dice"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffe9a0" },
        desc: (r) => `สาดเหรียญทองเป็นแนวยาว 5.2 ม. ทุกตัวในแนว ${pct(lin(2.1, 0.21)(r))} ของพลังโจมตีและพลังเวท แต่ละตัวเสี่ยงหัวก้อย: ออกหัวแรงขึ้น 80% ออกก้อยเบาลง 80% ใช้ต่อจากเหรียญเสี่ยงทายหรือเต๋ายักษ์ถล่มภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "magician_gambler_fate", name: "ชะตาหกหน้า", kind: "active", max: 5, pos: [3, 1], req: [["magician_gambler_dice", 3]], glyph: "star",
        skill: { type: "buff", mp: 26, cd: 35, motion: "cast", duration: 30, dice: true, buff: (r) => ({ luck: 10 + 4 * r }),
          roll: (r) => ({ atkPct: 0.1 + 0.025 * r, matkPct: 0.1 + 0.025 * r, cdr: 0.04 + 0.012 * r }), color: "#ffe28a" },
        desc: (r) => `30 วิ: โชคดี +${10 + 4 * r} แล้วทอยเต๋า พลังโจมตีและพลังเวทเปลี่ยนตามแต้ม (แต้ม 1: −${pct((0.1 + 0.025 * r) * 2 / 3)} · 3: ไม่เปลี่ยน · 6: +${pct(0.1 + 0.025 * r)}) ลดคูลดาวน์ก็เช่นกัน (แต้ม 1: −${pct((0.04 + 0.012 * r) * 2 / 3)} · 6: +${pct(0.04 + 0.012 * r)})` },
      { id: "magician_gambler_poker", name: "หน้านิ่งนักพนัน", kind: "passive", max: 10, pos: [2, 0], glyph: "target",
        stats: (r) => ({ crit: 0.004 * r, critDmg: 0.02 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.004 * r)} แรงคริติคอล +${pct(0.02 * r)}` },
      { id: "magician_gambler_jackpot", name: "แจ็กพอต", kind: "passive", max: 5, pos: [3, 2], req: [["magician_gambler_fate", 1]], glyph: "bag",
        stats: (r) => ({ goldPct: 0.04 * r, drop: 0.02 * r, luck: r }),
        desc: (r) => `เงินจากมอนสเตอร์ +${pct(0.04 * r)} โอกาสได้ของ +${pct(0.02 * r)} โชคดี +${r}` },
      { id: "magician_gambler_destiny", name: "เดิมพันฟ้าลิขิต", kind: "active", max: 5, pos: [2, 2], req: [["magician_gambler_double", 5], ["magician_gambler_fate", 1]], glyph: "burst",
        skill: { type: "bolt", stat: "both", mult: lin(5.0, 0.62), dice: true, coin: () => 0.5, mp: 45, cd: 16, motion: "cast", speed: 900, range: 650, radius: 44,
          combo: { after: ["magician_gambler_double"], within: 4, more: () => 0.35 }, color: "#fff4c8" },
        desc: (r) => `ปาลูกเต๋าทองกับเหรียญทองยักษ์ใส่ตัวที่ล็อกไว้ ${pct(lin(5.0, 0.62)(r))} ของพลังโจมตีและพลังเวท ${DIE} แล้วเสี่ยงหัวก้อยซ้ำอีกชั้น (หัว +50% ก้อย −50%) ใช้ต่อจากทบเดิมพันภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
  // ---- the copycat: a monster's own attack, a dash and a blink, a mirror ----
  magician_copycat: {
    name: "นักก๊อปปี้", cls: null, job3: "magician", color: "#ffa8e0", glyph: "eye",
    note: "ใช้ทั้งพลังโจมตีและพลังเวทกับอาวุธอะไรก็ได้ จำท่าโจมตีของมอนสเตอร์ตัวที่ล็อกไว้แล้วใช้ท่านั้นเองหลายครั้ง (ยิงแบบที่มันยิงหรือกัดแบบที่มันกัด ธาตุเดียวกับมัน) พุ่งทะลุศัตรูและหายวับไปโผล่ที่อื่น ส่องกระจกสะท้อนการโจมตีกลับ แล้วปล่อยท่าที่จำมาต่อกัน: ลอกเลียนท่าหรือทะยานเลียนลม → ผสมท่า → พันท่าลอกแบบ",
    nodes: [
      { id: "magician_copycat_mimic", name: "ลอกเลียนท่า", kind: "active", max: 10, pos: [1, 0], glyph: "eye",
        skill: { type: "mimic", mult: lin(1.8, 0.18), uses: 5, duration: 20, range: 600, every: 0.7, mp: 22, cd: 20, motion: "cast", color: "#ffa8e0" },
        desc: (r) => `จำท่าโจมตีของตัวที่ล็อกไว้ (ระยะ 6 ม.) แล้วช่องนี้ใช้ท่านั้นได้ 5 ครั้งใน 20 วิ: ยิงแบบที่มันยิง หรือกัดแบบที่มันกัด ธาตุเดียวกับมัน ครั้งละ ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี (ของพลังเวทถ้ามันใช้เวท) ไม่เสีย MP ห่างกัน 0.7 วิ ครบแล้วเริ่มคูลดาวน์` },
      { id: "magician_copycat_dash", name: "ทะยานเลียนลม", kind: "active", max: 10, pos: [2, 0], glyph: "dash",
        skill: { type: "dash", stat: "both", mult: lin(1.9, 0.19), mp: 14, cd: 6, motion: "thrust", distance: 320, width: 80, color: "#ffc0e8" },
        desc: (r) => `พุ่งทะลุไปทางที่เล็ง 3.2 ม. ทุกตัวที่ผ่าน ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตีและพลังเวท` },
      { id: "magician_copycat_eye", name: "ตาจำท่า", kind: "passive", max: 10, pos: [0, 1], req: [["magician_copycat_mimic", 1]], glyph: "target",
        stats: (r) => ({ cdr: 0.008 * r, move: 0.008 * r }),
        desc: (r) => `ลดคูลดาวน์ +${pct(0.008 * r)} ความเร็วเดิน +${pct(0.008 * r)}` },
      { id: "magician_copycat_remix", name: "ผสมท่า", kind: "active", max: 10, pos: [1, 1], req: [["magician_copycat_mimic", 4]], glyph: "spin",
        skill: { type: "nova", stat: "both", mult: lin(1.15, 0.115), hits: 2, mp: 20, cd: 6, motion: "cast", radius: 230,
          combo: { after: ["magician_copycat_mimic", "magician_copycat_dash"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#ffb0e0" },
        desc: (r) => `ปล่อยท่าที่จำมาผสมกันรอบตัว 2.3 ม. 2 รอบ รอบละ ${pct(lin(1.15, 0.115)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากลอกเลียนท่าหรือทะยานเลียนลมภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      // a teleport: a dash without a multiplier hits nothing
      { id: "magician_copycat_blink", name: "หายวับ", kind: "active", max: 1, pos: [3, 1], req: [["magician_copycat_dash", 3]], glyph: "wing",
        skill: { type: "dash", mp: 10, cd: 6, motion: "cast", distance: 380, color: "#ffd8f0" },
        desc: () => "หายตัวไปโผล่ทางที่เล็ง 3.8 ม. ผ่านศัตรูได้" },
      { id: "magician_copycat_mirror", name: "กระจกลอกแบบ", kind: "active", max: 5, pos: [0, 2], req: [["magician_copycat_eye", 3]], glyph: "shield",
        skill: { type: "buff", mp: 24, cd: 30, motion: "cast", duration: 18, buff: (r) => ({ reflect: 0.1 + 0.03 * r, magicDodge: 0.04 + 0.02 * r }), color: "#ffd0ec" },
        desc: (r) => `18 วิ: สะท้อนความเสียหาย ${pct(0.1 + 0.03 * r)} กลับไปที่ตัวที่ตีเรา หลบเวท +${pct(0.04 + 0.02 * r)}` },
      { id: "magician_copycat_study", name: "ศึกษาท่วงท่า", kind: "passive", max: 10, pos: [0, 0], glyph: "scroll",
        stats: (r) => ({ hit: 2 * r, atkPct: 0.006 * r, matkPct: 0.006 * r }),
        desc: (r) => `ความแม่นยำ +${2 * r} พลังโจมตีและพลังเวท +${pct(0.006 * r)}` },
      { id: "magician_copycat_footwork", name: "ฝีเท้าลอกลาย", kind: "passive", max: 10, pos: [2, 1], req: [["magician_copycat_dash", 3]], glyph: "shoes",
        stats: (r) => ({ flee: 2 * r, aspd: 0.008 * r }),
        desc: (r) => `หลบหลีก +${2 * r} ความเร็วโจมตี +${pct(0.008 * r)}` },
      { id: "magician_copycat_reflex", name: "เงาในกระจก", kind: "passive", max: 5, pos: [0, 3], req: [["magician_copycat_mirror", 1]], glyph: "shield",
        stats: (r) => ({ reflect: 0.02 * r, dmgRed: 0.01 * r }),
        desc: (r) => `สะท้อนความเสียหาย ${pct(0.02 * r)} กลับไปที่ตัวที่ตีเรา ลดความเสียหาย ${pct(0.01 * r)}` },
      { id: "magician_copycat_thousand", name: "พันท่าลอกแบบ", kind: "active", max: 5, pos: [2, 2], req: [["magician_copycat_remix", 5], ["magician_copycat_blink", 1]], glyph: "storm",
        skill: { type: "dash", stat: "both", mult: lin(1.3, 0.165), hits: 4, mp: 45, cd: 15, motion: "thrust", distance: 360, width: 90,
          combo: { after: ["magician_copycat_remix"], within: 4, more: () => 0.35 }, color: "#ffe0f4" },
        desc: (r) => `พุ่งไปทางที่เล็ง 3.6 ม. ทุกตัวที่ผ่านโดนท่าที่ลอกมา 4 ท่ารวด ท่าละ ${pct(lin(1.3, 0.165)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากผสมท่าภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
  // ---- the illusionist: a body double, a stand-in, a vanishing act, a smoke curtain ----
  magician_illusion: {
    name: "นักหลอกล่อ", cls: null, job3: "magician", color: "#c8a8ff", glyph: "cloud",
    note: "ใช้ทั้งพลังโจมตีและพลังเวทกับอาวุธอะไรก็ได้ เสกร่างมายาที่ตีตามเรา ทิ้งหุ่นตัวตายตัวแทนให้มอนสเตอร์รุมตี หายตัวกลางเวที หรือซ่อนในม่านควันที่ซ่อนให้อีกทุกครั้งที่ตีออกไป แล้วลอบโจมตีจากที่ซ่อนให้แรงกว่าเดิม: ม่านควันมายา หายตัวกลางเวที หรือร่างมายา → ไพ่ซ่อนแขนเสื้อ → ดาบทะลุหีบ",
    nodes: [
      // her look, fighting her target with her weapon (`mult` of her normal hit); the monsters
      // still see it while she hides
      { id: "magician_illusion_double", name: "ร่างมายา", kind: "active", max: 10, pos: [0, 0], glyph: "person",
        skill: { type: "summon", ally: "clone", mult: lin(0.35, 0.035), base: lin(0.35, 0.035), count: 2, duration: 15, mp: 24, cd: 14, motion: "cast", color: "#c8a8ff" },
        desc: (r) => `เสกร่างมายาของตัวเองข้างหน้า อยู่ 15 วิ (มีได้ 2 ร่าง) ตีตัวที่เราตีด้วยอาวุธที่ถืออยู่ แรง ${pct(lin(0.35, 0.035)(r))} ของการตีปกติ HP ${pct(lin(0.35, 0.035)(r))} ของ HP สูงสุด ตอนเราซ่อนตัวมอนสเตอร์ยังเห็นร่างมายา` },
      { id: "magician_illusion_sleight", name: "มือไวกว่าตา", kind: "passive", max: 10, pos: [1, 0], glyph: "star",
        stats: (r) => ({ flee: 2 * r, ambush: 0.03 * r }),
        desc: (r) => `หลบหลีก +${2 * r} การโจมตีจากที่ซ่อนแรงขึ้น ${pct(0.03 * r)}` },
      { id: "magician_illusion_smoke", name: "ม่านควันมายา", kind: "active", max: 5, pos: [3, 0], glyph: "cloud",
        skill: { type: "smoke", radius: 280, duration: 12, range: 450, buff: (r) => ({ flee: 6 * r, ambush: 0.06 * r }), mp: 22, cd: 22, motion: "cast", color: "#d0c0ff" },
        desc: (r) => `ม่านควันรัศมี 2.8 ม. ตรงจุดที่เล็ง (ไกลสุด 4.5 ม.) อยู่ 12 วิ ยืนในควันคือซ่อนตัว มอนสเตอร์มองไม่เห็น หลบหลีก +${6 * r} การโจมตีจากที่ซ่อนแรงขึ้น ${pct(0.06 * r)} ตีออกไปแล้วโผล่ให้เห็นครู่หนึ่ง แล้วควันซ่อนให้อีก` },
      { id: "magician_illusion_standin", name: "หุ่นตัวตายตัวแทน", kind: "active", max: 5, pos: [0, 1], req: [["magician_illusion_double", 3]], glyph: "hat",
        skill: { type: "decoy", mp: 20, cd: 20, motion: "cast", duration: 12, base: lin(0.5, 0.1), color: "#e0d0ff" },
        desc: (r) => `ทิ้งหุ่นหน้าตาเหมือนเราไว้ข้างหน้า 12 วิ HP ${pct(lin(0.5, 0.1)(r))} ของ HP สูงสุด มอนสเตอร์ทุกตัวหันไปรุมตีหุ่นก่อน` },
      { id: "magician_illusion_card", name: "ไพ่ซ่อนแขนเสื้อ", kind: "active", max: 10, pos: [2, 1], req: [["magician_illusion_sleight", 3]], glyph: "letter",
        skill: { type: "bolt", stat: "both", mult: lin(2.3, 0.23), mp: 16, cd: 5, motion: "cast", speed: 1300, range: 650, radius: 28,
          combo: { after: ["magician_illusion_smoke", "magician_illusion_vanish", "magician_illusion_double"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#f0e8ff" },
        desc: (r) => `สะบัดไพ่ที่ซ่อนไว้ใส่ตัวที่ล็อกไว้ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากม่านควันมายา หายตัวกลางเวที หรือร่างมายาภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} (ปาจากที่ซ่อนได้โบนัสซ่อนตัวด้วย)` },
      { id: "magician_illusion_vanish", name: "หายตัวกลางเวที", kind: "active", max: 5, pos: [3, 1], req: [["magician_illusion_smoke", 1]], glyph: "wing",
        skill: { type: "buff", mp: 18, cd: 18, motion: "cast", duration: 15, buff: (r) => ({ stealth: 1, ambush: 0.3 + 0.1 * r, move: 0.1 }), color: "#b8a0f0" },
        desc: (r) => `หายตัว 15 วิ: มอนสเตอร์มองไม่เห็นและเลิกไล่ เดินเร็วขึ้น 10% การโจมตีครั้งแรกขณะซ่อนตัวแรงขึ้น ${pct(0.3 + 0.1 * r)} แล้วออกจากที่ซ่อน` },
      { id: "magician_illusion_curtain", name: "หลังม่านการแสดง", kind: "passive", max: 5, pos: [2, 0], glyph: "hat",
        stats: (r) => ({ move: 0.012 * r, statusRes: 0.02 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.012 * r)} ต้านสถานะ +${pct(0.02 * r)}` },
      { id: "magician_illusion_mirage", name: "ภาพลวงเหมือนจริง", kind: "passive", max: 10, pos: [1, 1], req: [["magician_illusion_double", 3]], glyph: "person",
        stats: (r) => ({ allyPct: 0.015 * r, maxHpPct: 0.006 * r }),
        desc: (r) => `ร่างมายาและหุ่นตัวตายตัวแทน (ผู้ช่วยทุกแบบ) HP และแรงตี +${pct(0.015 * r)} HP สูงสุด +${pct(0.006 * r)}` },
      { id: "magician_illusion_reveal", name: "เฉลยกลเด็ด", kind: "passive", max: 5, pos: [2, 2], req: [["magician_illusion_card", 3]], glyph: "target",
        stats: (r) => ({ critDmg: 0.04 * r, crit: 0.004 * r }),
        desc: (r) => `แรงคริติคอล +${pct(0.04 * r)} โอกาสคริติคอล +${pct(0.004 * r)}` },
      { id: "magician_illusion_swordbox", name: "ดาบทะลุหีบ", kind: "active", max: 5, pos: [1, 2], req: [["magician_illusion_standin", 1], ["magician_illusion_card", 5]], glyph: "sword",
        skill: { type: "blast", stat: "both", mult: lin(1.3, 0.165), hits: 4, every: 0.25, mp: 46, cd: 16, motion: "cast", range: 500, radius: 200, delay: 0.3,
          combo: { after: ["magician_illusion_card"], within: 4, more: () => 0.35 }, color: "#e8d8ff" },
        desc: (r) => `ครอบหีบมายากลลงจุดที่เล็ง รัศมี 2 ม. แล้วแทงดาบทะลุหีบ 4 ครั้ง ครั้งละ ${pct(lin(1.3, 0.165)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากไพ่ซ่อนแขนเสื้อภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
};
