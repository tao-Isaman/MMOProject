# มอนสเตอร์แดนตะวันตก (v0.3)

มอนสเตอร์ 40 ชนิดของ 15 ฟิลด์ใน[แดนตะวันตก](west_lands.md) เลเวล 30–195 ตัวเลขทั้งหมดอยู่ใน `src/bestiary.ts`
(ส่วน "The west lands" ท้าย `MONSTERS`) ค่าพลังมาจากประเภท (`statsFor`) ของดรอปมาจากเผ่าและเลเวล (`src/drops.ts`)

- **ฟิลด์ละ 2–3 ชนิด**: ทุกฟิลด์มีตัวที่เกิดประจำ 2 ชนิด บางฟิลด์มีตัวหายาก (7 ตัว) และฟิลด์ระดับสูงที่เป็นจุดสำคัญ 3 แห่ง
  (สุสานหลวงโบราณ กับทางตันริมทะเลสองแห่ง หน้าผาทะเลเหนือและแหลมทะเลตะวันตก) มีบอส ซึ่งเรียกลูกน้องจากฟิลด์ของตัวเองมาช่วย
- **เลเวลกระจายทั่วช่วงของฟิลด์** แบบฟิลด์เดิม: ตัวแรกช่วงล่าง ตัวที่สองช่วงบน ตัวหายากหรือบอสอยู่ปลายบนสุด
- **ฟิลด์ที่เชื่อมกันไม่มีวงศ์เดียวกัน** และพยายามให้เผ่ากับธาตุต่างกันด้วย (เช่น บึงลากูนเป็นโคลนและพิษ
  ส่วนนาขั้นบันไดข้าง ๆ เป็นน้ำและสายฟ้า ที่ราบใต้โนอาเป็นพืชและลม) รวมถึงฟิลด์เดิมที่ต่อกัน
  (ขอบทะเลทราย ป่าดิบแดนใต้ เชิงเขาหิมะ)
- **ทุกตัวมีจุดอ่อน** (ค่าป้องกันธาตุติดลบ) และค่าป้องกันธาตุโตตามเลเวล ตัวเลข 20–30 ที่เลเวล 30 ไปจนถึง 50–70 ที่เลเวล 190
- **มนุษย์ 4 ตัว** (`behave: "human"`) แต่งตัวจากตู้เสื้อผ้าผ่าน `PEOPLE` จึงไม่ต้องมีสไปรต์

**หน้าตาตอนนี้**: ตัวที่ยังไม่มีสไปรต์จะใช้สไลม์สีตามธาตุแทนไปก่อนโดยอัตโนมัติ (`MonsterLooks.of`)
เมื่อจะสร้างสไปรต์ ใช้คำสั่งข้างล่างของแต่ละตัว คลิป Walk และ Attack อย่างละ 4 เฟรม สี่ทิศ
ด้วยสไตล์เดียวกับชุดเดิม (*crisp retro pixel art, clean dark outlines, RO-style chibi proportions*)
แล้วต่อเป็นชีตด้วย `python3 tools/monster_atlas.py <id> <cell> south.png west.png north.png east.png`
ขนาดเซลล์ตามชุดเดิม: ตัวสูงต่ำกว่า 150 ซม. ใช้ 96 ตั้งแต่ 150 ซม. ขึ้นไปใช้ 128

## ตารางรวม

| id | ชื่อ | ฟิลด์ | Lv | ประเภท | เผ่า | ธาตุ |
|---|---|---|---|---|---|---|
| `cloud_sheep` | แกะขนเมฆ | `noa_meadow` | 30–35 | ธรรมดา | สัตว์ | ลม |
| `furrow_mole` | ตุ่นยักษ์ไถทุ่ง | `noa_meadow` | 34–39 | ถึก | สัตว์ | ดิน |
| `sheepskin_wolf` | หมาป่าในคราบแกะ | `noa_meadow` | 40 | หายาก | สัตว์ | ลม |
| `vine_snail` | หอยทากเถาองุ่น | `noa_plains` | 40–45 | ถึก | แมลง | พืช |
| `tipsy_wasp` | ต่อเมาองุ่น | `noa_plains` | 45–50 | ว่องไว | แมลง | ลม |
| `dust_devil` | ภูตลมหมุนฝุ่น | `dry_plains` | 50–55 | ว่องไว | ไร้รูป | ควัน |
| `mesa_armadillo` | ตัวนิ่มหลังผา | `dry_plains` | 55–60 | ถึก | สัตว์ | หิน |
| `caravan_raider` | โจรปล้นคาราวาน | `dry_plains` | 60–62 | หายาก | มนุษย์ | ไฟ |
| `shrine_mask` | หน้ากากเทพป่า | `elder_forest` | 62–67 | ว่องไว | ไร้รูป | แสง |
| `moss_dryad` | นางไม้มอส | `elder_forest` | 66–71 | ร่ายเวท | พืช | พืช |
| `forest_turtle` | เต่าป่าพันปี | `elder_forest` | 72–74 | หายาก | สัตว์ | ดิน |
| `paddy_waterbug` | แมงดานายักษ์ | `rice_terraces` | 74–80 | ถึก | แมลง | น้ำ |
| `thunder_eel` | ปลาไหลอัสนี | `rice_terraces` | 80–86 | ร่ายเวท | สัตว์น้ำ | สายฟ้า |
| `woolly_mammoth` | แมมมอธขนยาว | `highland_downs` | 86–92 | ธรรมดา | สัตว์ | น้ำแข็ง |
| `cairn_walker` | กองหินเดินทาง | `highland_downs` | 92–98 | ถึก | ไร้รูป | หิน |
| `mist_crane` | กระเรียนหมอก | `karst_peaks` | 98–103 | ว่องไว | สัตว์ | ลม |
| `money_toad` | คางคกสามขา | `karst_peaks` | 103–108 | ร่ายเวท | สัตว์น้ำ | น้ำ |
| `cloud_qilin` | กิเลนเมฆ | `karst_peaks` | 109–110 | หายาก | เทวะ | สายฟ้า |
| `phantom_hoplite` | ทหารหมอกยุคก่อน | `ancient_plain` | 110–115 | ธรรมดา | อันเดด | ควัน |
| `statue_hand` | หัตถ์รูปปั้นยักษ์ | `ancient_plain` | 115–120 | ถึก | ไร้รูป | หิน |
| `ghost_charioteer` | สารถีรถศึกวิญญาณ | `ancient_plain` | 121–122 | หายาก | อันเดด | ลม |
| `ice_pike` | ปลาไพค์เกล็ดน้ำแข็ง | `frozen_river` | 122–128 | ว่องไว | สัตว์น้ำ | น้ำแข็ง |
| `bridge_troll` | โทรลล์ใต้สะพาน | `frozen_river` | 128–134 | ถึก | สัตว์ | ดิน |
| `rope_spider` | แมงมุมสะพานเชือก | `west_pass` | 134–139 | ธรรมดา | แมลง | พิษ |
| `pass_gargoyle` | การ์กอยล์ด่านร้าง | `west_pass` | 139–144 | ธรรมดา | ปีศาจ | หิน |
| `toll_keeper` | นายด่านเถื่อน | `west_pass` | 145–146 | หายาก | มนุษย์ | โลหะ |
| `lost_wisp` | ดวงไฟหลงทาง | `tangled_hills` | 146–152 | ร่ายเวท | อันเดด | ความมืด |
| `maze_minotaur` | มิโนทอร์เนินวงกต | `tangled_hills` | 152–158 | ถึก | ปีศาจ | โลหะ |
| `bog_hulk` | ยักษ์โคลนบึง | `lagoon_marsh` | 158–164 | ถึก | ไร้รูป | โคลน |
| `marsh_hydra` | ไฮดราบึงพิษ | `lagoon_marsh` | 163–168 | ธรรมดา | มังกร | พิษ |
| `bog_witch` | แม่มดบึงพิษ | `lagoon_marsh` | 169–170 | หายาก | มนุษย์ | พิษ |
| `bone_royal_guard` | ราชองครักษ์กระดูก | `royal_necropolis` | 170–176 | ธรรมดา | อันเดด | โลหะ |
| `corpse_bloom` | บุปผากินศพ | `royal_necropolis` | 175–181 | ร่ายเวท | พืช | พิษ |
| `first_king` | ปฐมกษัตริย์ผู้ไม่หลับ | `royal_necropolis` | 182 | บอส | อันเดด | ความมืด |
| `frost_harpy` | ฮาร์ปีลมเหมันต์ | `north_cliffs` | 182–187 | ว่องไว | ปีศาจ | ลม |
| `rime_wyvern` | ไวเวิร์นน้ำค้างแข็ง | `north_cliffs` | 186–191 | ธรรมดา | มังกร | น้ำแข็ง |
| `lighthouse_fiend` | อสูรตะเกียงประภาคาร | `north_cliffs` | 192 | บอส | ปีศาจ | ไฟ |
| `sea_cultist` | สาวกมังกรทะเล | `west_cape` | 188–192 | ร่ายเวท | มนุษย์ | น้ำ |
| `storm_griffin` | กริฟฟินพายุ | `west_cape` | 191–194 | ว่องไว | สัตว์ | สายฟ้า |
| `sea_dragon` | มังกรทะเลคลั่ง | `west_cape` | 195 | บอส | มังกร | น้ำ |

รวม: ธรรมดา 8 · ถึก 9 · ว่องไว 7 · ร่ายเวท 6 · หายาก 7 · บอส 3

---

## ทุ่งหญ้าโนอา (`noa_meadow`, Lv 30–40)

ทุ่งหญ้าลมแรงหน้าประตูตะวันออกของโนอา ฝูงแกะ กำแพงหินเตี้ย และกังหันลม

### แกะขนเมฆ (`cloud_sheep`)
Lv 30–35 · ธรรมดา · สัตว์ · ธาตุลม แพ้ไฟ · ไม่โจมตีก่อน · พวกเดียวกันรุมช่วย · สูง 90 ซม. (เซลล์ 96)

แกะพันธุ์พื้นเมืองของทุ่งหญ้าโนอา ขนฟูเบาจนเมื่อลมเหนือพัดแรง ทั้งฝูงลอยเหย่ง ๆ ข้ามกำแพงหินเตี้ยไปได้
คนเลี้ยงแกะจึงต้องผูกกระดิ่งทองเหลืองหนัก ๆ ไว้ที่คอ ชาวโนอาเอาขนของมันไปทอ "ผ้าเมฆ" ที่เบาที่สุดในแผ่นดิน
ปกติมันเล็มหญ้าอย่างสงบ แต่ถ้าตัวหนึ่งโดนตี ตัวข้าง ๆ จะวิ่งเข้ามาขวิดช่วยทันที ขนแห้งติดไฟง่ายจึงแพ้ไฟ

- `prompt`: "Cute chubby cloud sheep monster for a chibi fantasy MMORPG: a round sheep whose huge fluffy white wool looks exactly like a puffy cumulus cloud, a small dark grey face with sleepy friendly eyes, little curled horns, a brass bell on a leather collar, four short dark legs peeking out under the wool. No clothes, no weapon."
- `walk_prompt`: "Trot cycle in place: short bouncy steps on four little legs, the cloud wool wobbling and puffing, the bell swinging."
- `attack_prompt`: "Lowers its head and springs forward to butt with its curled horns, the wool puffing up behind it."

### ตุ่นยักษ์ไถทุ่ง (`furrow_mole`)
Lv 34–39 · ถึก · สัตว์ · ธาตุดิน แพ้น้ำ · ไม่โจมตีก่อน · กัดให้ช้าลง · สูง 80 ซม. (เซลล์ 96)

ตุ่นตัวเท่าหมาที่ขุดอุโมงค์ใต้ทุ่งจนเป็นร่องยาวเหมือนรอยไถ ชาวไร่เกลียดมันเพราะทำกำแพงหินทรุดและกัดรากกังหันลม
ตาของมันแทบมองไม่เห็นแต่จมูกรูปดาวไวมาก มันไม่โจมตีก่อน ถ้าโดนตีจะตะปบด้วยอุ้งมือพลั่วแล้วเหวี่ยงดินใส่จนเท้าจมดิน
หนังหนาเหมือนกระสอบดินรับดาบได้ดี แต่น้ำที่ไหลท่วมอุโมงค์คือฝันร้ายของมัน

- `prompt`: "Cute chubby giant mole monster for a chibi fantasy MMORPG: a plump velvety black mole the size of a dog with a pink star-shaped nose, tiny squinting eyes almost hidden in fur, huge pink shovel-like front paws with blunt claws, a short stubby tail, clumps of soil and grass on its back. No clothes, no weapon."
- `walk_prompt`: "Waddle cycle in place: shuffles forward on its big shovel paws, body rocking side to side, nose wiggling."
- `attack_prompt`: "Rears up and swipes both shovel paws down, flinging a spray of dirt forward."

### หมาป่าในคราบแกะ (`sheepskin_wolf`) — หายาก
Lv 40 · หายาก · สัตว์ · ธาตุลม แพ้ไฟ · โจมตีก่อน · พุ่งชน · หลบเก่ง · สูง 130 ซม. (เซลล์ 96)

หมาป่าเจ้าเล่ห์ที่คลุมหนังแกะขนเมฆแล้วปะปนอยู่ในฝูง คนเลี้ยงแกะเล่าว่ามันคือตัวเดียวกับในนิทานที่คนแก่ใช้สอนเด็ก
แต่ไม่เคยมีใครจับมันได้ มันยืนนิ่งท่ามกลางฝูงจนผู้เล่นเข้าใกล้ แล้วจึงสะบัดหนังแกะพุ่งเข้าใส่
และกระโดดหลบคมดาบอย่างคล่องแคล่ว หนังแกะที่คลุมอยู่ติดไฟง่ายเหมือนแกะจริง

- `prompt`: "Sly wolf in sheep's clothing monster for a chibi fantasy MMORPG: a lean grey wolf wearing a fluffy white cloud-sheep fleece draped over its back and head like a hooded cloak, its long snout, sharp grin and narrow yellow eyes poking out from under the wool, grey legs and a bushy grey tail showing below the fleece, standing on four legs. No clothes besides the fleece, no weapon."
- `walk_prompt`: "Sneaking walk cycle in place: low careful steps on four legs, head down, the fleece swaying, tail swishing."
- `attack_prompt`: "Throws the fleece back and lunges forward with jaws wide open, snapping its fangs."

## ที่ราบใต้โนอา (`noa_plains`, Lv 40–50)

ไร่องุ่นกับทุ่งข้าวสาลีระหว่างโนอากับเวนิชเซีย ศัตรูพืชของไร่องุ่น

### หอยทากเถาองุ่น (`vine_snail`)
Lv 40–45 · ถึก · แมลง · ธาตุพืช แพ้ไฟ · ไม่โจมตีก่อน · กัดให้ช้าลง · สูง 90 ซม. (เซลล์ 96)

หอยทากยักษ์ที่กินใบองุ่นจนเถางอกพันเปลือก พวงองุ่นห้อยระย้า ชาวไร่ว่าองุ่นบนเปลือกมันหวานที่สุดในไร่
แต่ต้องรอให้มันหลับก่อนถึงจะเก็บได้ มันเดินช้าและเงียบ ไม่โจมตีก่อน เปลือกแข็งรับดาบได้ดี
และเมือกเหนียวที่พ่นใส่ทำให้คนที่โดนช้าลง ชาวไร่ไล่มันด้วยคบไฟ

- `prompt`: "Cute chubby giant snail monster for a chibi fantasy MMORPG: a big glossy pale-green snail with a spiral shell overgrown with grapevines, leaves and a few bunches of purple grapes hanging from the shell, a soft body, two long eye stalks with round sleepy eyes, a little smile. No clothes, no weapon."
- `walk_prompt`: "Slow glide cycle in place: the soft body ripples forward, eye stalks bobbing, grapes swaying on the shell."
- `attack_prompt`: "Pulls back, then thrusts its head forward and spits a blob of sticky slime."

### ต่อเมาองุ่น (`tipsy_wasp`)
Lv 45–50 · ว่องไว · แมลง · ธาตุลม แพ้น้ำแข็ง · โจมตีก่อน · ลอยตัว · พวกเดียวกันรุมช่วย · สูง 70 ซม. (เซลล์ 96)

ตัวต่อตัวเท่าแมวที่ดูดน้ำองุ่นหมักจากผลที่ร่วงในไร่จนเมาตลอดฤดูเก็บเกี่ยว บินเซไปมา หัวโงนเงน
แต่ยิ่งเมายิ่งหงุดหงิด เห็นใครเข้าใกล้ก็พุ่งต่อย และเมื่อตัวหนึ่งถูกตี ทั้งรังจะบินมารุม
อากาศเย็นทำให้มันเชื่องช้าจนร่วงจากฟ้า จึงแพ้ธาตุน้ำแข็ง

- `prompt`: "Cute chubby drunk wasp monster for a chibi fantasy MMORPG: a fuzzy round wasp the size of a cat with yellow and grape-purple stripes, big glossy eyes half-closed and dizzy, rosy cheeks, a little hiccup bubble, buzzing translucent wings and a small sharp stinger, hugging a single grape, hovering above the ground."
- `walk_prompt`: "Flying in place: wings buzzing in a blur, body wobbling and tilting drunkenly from side to side."
- `attack_prompt`: "Swoops forward and jabs with its stinger, then wobbles back."

## ที่ราบแห้งแล้ง (`dry_plains`, Lv 50–62)

ทุ่งหญ้าแห้งติดทะเลทราย พุ่มไม้แห้ง เนินผายอดตัด และเส้นทางคาราวานจากเวนิชเซียไปขอบทะเลทราย
(ฟิลด์ข้าง ๆ คือขอบทะเลทรายที่มีแมงป่อง กระบองเพชร และแร้ง จึงไม่มีพืชเดินได้ แมลง หรือธาตุดินและลมที่นี่)

### ภูตลมหมุนฝุ่น (`dust_devil`)
Lv 50–55 · ว่องไว · ไร้รูป · ธาตุควัน แพ้น้ำ · โจมตีก่อน · หลบเก่ง · กัดให้ช้าลง · สูง 150 ซม. (เซลล์ 128)

ลมหมุนที่หอบฝุ่นขึ้นสูงกลางที่ราบในบ่ายที่ร้อนที่สุด คนคาราวานเชื่อว่ามันคือภูตที่หลงมาจากทะเลทราย
และวนตามขบวนอูฐเพื่อหาทางกลับบ้าน มันพัดเข้าหาผู้เล่นแล้วซัดฝุ่นเข้าตาจนเคลื่อนไหวช้าลง
ร่างที่เป็นแค่ฝุ่นกับลมทำให้ดาบฟันผ่านไปบ่อย ๆ แต่ฝนหรือน้ำที่สาดใส่ทำให้ฝุ่นของมันตกลงพื้นหมด

- `prompt`: "Dust devil spirit monster for a chibi fantasy MMORPG: a small whirlwind of swirling orange-brown dust shaped like a spinning funnel, wider at the top, two bright mischievous yellow eyes glinting inside the dust cloud, bits of dry grass, twigs and pebbles circling around it, a faint shadow on the ground beneath the narrow tip. No arms, no legs, no clothes, no weapon."
- `walk_prompt`: "Spinning in place: the funnel whirls and sways from side to side, dust streaming around it, grass bits orbiting."
- `attack_prompt`: "Spins faster and lurches forward, blasting a gust of dust and pebbles in front of it."

### ตัวนิ่มหลังผา (`mesa_armadillo`)
Lv 55–60 · ถึก · สัตว์ · ธาตุหิน แพ้น้ำ · ไม่โจมตีก่อน · สะท้อนดาเมจ · สูง 120 ซม. (เซลล์ 96)

ตัวนิ่มยักษ์ที่เกราะหลังเป็นชั้นหินสีส้มแดงเหมือนเนินผายอดตัดของที่ราบนี้ เวลามันนอนนิ่ง
นักเดินทางมักคิดว่าเป็นก้อนหินแล้วนั่งพักบนหลัง มันไม่โจมตีก่อน ถ้าถูกตีจะขดตัวจนอาวุธกระเด็นสะท้อนกลับ
และกลิ้งเข้ากระแทก เกราะหินแข็งมาก แต่หินทรายชั้นนี้กร่อนด้วยน้ำ

- `prompt`: "Cute chubby armadillo monster for a chibi fantasy MMORPG: a big armadillo whose banded back armour is made of layered red-orange sandstone shaped like a flat-topped desert mesa, a small pointed face with long ears and friendly beady eyes, a ringed scaly tail, short clawed legs, a tuft of dry grass growing on the mesa top. No clothes, no weapon."
- `walk_prompt`: "Walk cycle in place: plodding steps on short legs, the stone shell rocking, ears twitching."
- `attack_prompt`: "Curls into a stone ball, rolls forward and slams, then uncurls."

### โจรปล้นคาราวาน (`caravan_raider`) — หายาก, มนุษย์
Lv 60–62 · หายาก · มนุษย์ · ธาตุไฟ แพ้น้ำ · โจมตีก่อน · พุ่งชน · ขโมยทอง · สูง 160 ซม.

หัวหน้าโจรสาวที่ดักปล้นคาราวานระหว่างเวนิชเซียกับทะเลทราย ผ้าพันหน้าสีฝุ่นทำให้ไม่มีใครเคยเห็นหน้า
ขบวนไหนไม่ยอมจ่าย เธอจะเผาเกวียนทิ้งกลางทุ่งหญ้าแห้ง เธอพุ่งออกมาจากม่านฝุ่น ฟันด้วยดาบ
ฉกถุงทองไปจากผู้เล่น แล้วหายเข้าไปในพุ่มไม้แห้ง พ่อค้าเวนิชเซียตั้งค่าหัวเธอไว้สูงที่สุดในแดนใต้

ไม่ต้องมีสไปรต์: แต่งตัวจากตู้เสื้อผ้า (`PEOPLE`: ผมยาวแดง ตาอำพัน เสื้อนักผจญภัยเหลืองมัสตาร์ด กางเกงสีทราย ดาบมือเดียว)

## ป่าโบราณ (`elder_forest`, Lv 62–74)

ต้นไม้ยักษ์อายุพันปี มอส เห็ดเรืองแสง และศาลหินยุคโนอา ภูตแห่งป่าเก่า

### หน้ากากเทพป่า (`shrine_mask`)
Lv 62–67 · ว่องไว · ไร้รูป · ธาตุแสง แพ้ความมืด · โจมตีก่อน · ลอยตัว · หลบเก่ง · สูง 110 ซม. (เซลล์ 96)

ในยุคโนอา ชาวบ้านสวมหน้ากากไม้สลักหน้าเทพป่าเต้นรำในงานบวงสรวง แล้ววางหน้ากากทิ้งไว้ที่ศาลหินหลังงาน
ผ่านไปหลายร้อยปี วิญญาณของป่าเข้าสิงหน้ากากเหล่านั้น พวกมันลอยวนเฝ้าศาล แผงขนเป็นใบไม้กับมอส
ตาเรืองแสงสีทอง พุ่งเข้าโขกผู้บุกรุก และวูบหลบคมดาบได้ไวเหมือนเงาใบไม้ ธาตุมืดทำให้แสงในดวงตามันดับ

- `prompt`: "Floating forest-god mask spirit monster for a chibi fantasy MMORPG: a large carved wooden mask of a stern but cute forest deity, weathered dark-brown wood with faded red and white paint, glowing golden eyes, a mane of green leaves, moss and trailing vines around its edge, a small sacred straw rope with white paper streamers tied above the brow, hovering above the ground with no body. No clothes, no weapon."
- `walk_prompt`: "Floating in place: bobbing and slowly tilting, the leaf mane rustling, the paper streamers fluttering."
- `attack_prompt`: "Lunges forward face-first and headbutts, its eyes flashing gold."

### นางไม้มอส (`moss_dryad`)
Lv 66–71 · ร่ายเวท · พืช · ธาตุพืช แพ้ไฟ · ไม่โจมตีก่อน · โจมตีจากระยะไกล (เถาวัลย์) · กัดให้ช้าลง · สูง 160 ซม. (เซลล์ 128)

นางไม้ที่เกิดจากมอสบนต้นไม้พันปี ผิวเป็นเปลือกไม้ ผมเป็นมอสกับเถาวัลย์ มีเห็ดเรืองแสงขึ้นบนไหล่
เธอไม่โจมตีก่อน แต่ถ้าใครทำร้ายป่า เธอจะซัดเถาวัลย์จากระยะไกลจนพันขาเหยื่อให้เดินช้าลง
ชาวโนอาวางดอกไม้ไว้ที่ศาลหินเพื่อขอทางผ่าน ไฟคือสิ่งที่เธอกลัวที่สุด

- `prompt`: "Graceful dryad spirit monster for a chibi fantasy MMORPG: a small forest maiden with smooth light-brown bark skin, long hair made of green moss and trailing vines, small glowing blue mushrooms growing on her shoulders, leaf-shaped ears, calm glowing green eyes, a dress of layered leaves and moss, bare root-like feet. No weapon."
- `walk_prompt`: "Walk cycle in place: light gliding steps, the moss hair and vines swaying, leaves fluttering."
- `attack_prompt`: "Sweeps one arm forward and a whipping vine lashes out from her palm."

### เต่าป่าพันปี (`forest_turtle`) — หายาก
Lv 72–74 · หายาก · สัตว์ · ธาตุดิน แพ้สายฟ้า · ไม่โจมตีก่อน · ฟื้นตัวเองตอนบาดเจ็บ · ทุบพื้นรอบตัว · สูง 200 ซม. (เซลล์ 128)

เต่ายักษ์อายุนับพันปีที่เดินช้า ๆ ในป่าโบราณ บนกระดองคลุมมอสมีต้นไม้เล็กกับศาลหินยุคโนอาตั้งอยู่
ตำนานเล่าว่าศาลบนหลังมันคือศาลแห่งแรกที่ชาวโนอาสร้าง แล้วเต่าก็พาศาลเดินหายไปในป่า
มันไม่โจมตีก่อน แต่ถ้าโดนรังแกจะกระทืบพื้นจนสะเทือน และพักฟื้นตัวเองได้ สายฟ้าทำให้มอสบนกระดองไหม้

- `prompt`: "Majestic ancient forest turtle monster for a chibi fantasy MMORPG: a huge old tortoise with a domed shell covered in thick green moss, ferns and small glowing mushrooms, a little gnarled tree and a tiny weathered stone shrine with a straw rope standing on top of the shell, a wise wrinkled grey-green face with a beard of pale moss, heavy elephant-like legs. No clothes, no weapon."
- `walk_prompt`: "Slow heavy walk cycle in place: one massive leg after another, the shell swaying gently, the little tree's leaves trembling."
- `attack_prompt`: "Rears up on its hind legs and stamps both front feet down, shaking the ground."

## นาขั้นบันได (`rice_terraces`, Lv 74–86)

นาขั้นบันไดมีน้ำขังใต้ซูโจว กระท่อมชาวนา ควาย หุ่นไล่กา กังหันน้ำ สัตว์ในนาข้าว

### แมงดานายักษ์ (`paddy_waterbug`)
Lv 74–80 · ถึก · แมลง · ธาตุน้ำ แพ้สายฟ้า · ไม่โจมตีก่อน · กัดให้ช้าลง · สูง 100 ซม. (เซลล์ 96)

แมงดานาตัวเท่าหมูที่ซุ่มอยู่ใต้น้ำในนาขั้นบันได ตัวแบนสีน้ำตาลเขียวกลืนไปกับโคลน
เมื่อมีใครมาเหยียบใกล้ มันจะหนีบด้วยขาหน้าที่เป็นตะขอแล้วฉีดน้ำลายชาจนเหยื่อเคลื่อนไหวช้าลง
ชาวนาซูโจวจับตัวเล็กไปตำน้ำพริก แต่ตัวยักษ์ต้องหนีอย่างเดียว ไฟฟ้าในน้ำทำร้ายมันได้มาก

- `prompt`: "Cute giant water bug monster for a chibi fantasy MMORPG: a big flat oval water bug the size of a pig with a shiny olive-brown shell, two thick hooked grasping front legs, four oar-like hind legs, a short pointed beak, big round dark eyes, water droplets dripping off it. No clothes, no weapon."
- `walk_prompt`: "Crawl cycle in place: the oar legs paddle and step, the flat body bobbing, front hooks held up ready."
- `attack_prompt`: "Lunges forward and snaps both hooked front legs shut like pincers."

### ปลาไหลอัสนี (`thunder_eel`)
Lv 80–86 · ร่ายเวท · สัตว์น้ำ · ธาตุสายฟ้า แพ้ดิน · โจมตีก่อน · โจมตีจากระยะไกล (ประกายไฟฟ้า) · กัดให้ช้าลง · สูง 150 ซม. (เซลล์ 128)

ปลาไหลยักษ์ในคูน้ำระหว่างขั้นนา มันชูหัวขึ้นจากน้ำแล้วยิงประกายไฟฟ้าใส่ทุกคนที่เข้าใกล้ คนที่โดนจะชาไปทั้งตัว
ชาวนาเชื่อว่าฟ้าผ่าลงนาเพราะปลาไหลพวกนี้ดึงดูด จึงตั้งศาลเล็ก ๆ ไว้ที่หัวคันนา
ร่างลื่นไหลทนน้ำได้ดี แต่ถ้าถูกดินกลบ ไฟฟ้าของมันก็ไหลลงดินหมด

- `prompt`: "Electric eel monster for a chibi fantasy MMORPG: a long sleek dark-blue eel rising up in an S-curve, a glowing yellow lightning-stripe pattern along its sides, a fin along its back crackling with small sparks, round glaring yellow eyes and a wide grumpy mouth, a small splash of muddy paddy water around its tail. No clothes, no weapon."
- `walk_prompt`: "Slither cycle in place: the body waves in S-curves, head held up, sparks flickering along the fin."
- `attack_prompt`: "Coils back, then snaps its head forward and spits a crackling ball of lightning."

## ที่ราบเนินเขา (`highland_downs`, Lv 86–98)

เนินลอนคลื่นหิมะบางทางตะวันตกของไฮแลนด์ กองหินบอกทาง กำแพงหินแห้ง วงหิน

### แมมมอธขนยาว (`woolly_mammoth`)
Lv 86–92 · ธรรมดา · สัตว์ · ธาตุน้ำแข็ง แพ้ไฟ · ไม่โจมตีก่อน · พุ่งชน · พวกเดียวกันรุมช่วย · สูง 240 ซม. (เซลล์ 128)

ฝูงแมมมอธที่เล็มหญ้าใต้หิมะบางบนเนินเขา ผู้เฒ่าไฮแลนด์เล่าว่าบรรพบุรุษเคยใช้พวกมันลากหินก้อนใหญ่มาตั้งวงหิน
มันไม่โจมตีก่อน แต่ถ้าตัวหนึ่งถูกตี ทั้งฝูงจะช่วยกันและวิ่งพุ่งชนด้วยงาโค้ง
ขนหนาทนหนาวได้ดี แต่ติดไฟง่าย

- `prompt`: "Cute chubby woolly mammoth monster for a chibi fantasy MMORPG: a big round mammoth with long shaggy reddish-brown fur, a high domed head, small ears, long curved ivory tusks, a curling trunk, patches of snow on its back, sturdy pillar legs. No clothes, no weapon."
- `walk_prompt`: "Heavy walk cycle in place: slow lumbering steps, shaggy fur swaying, trunk swinging, snow puffs at its feet."
- `attack_prompt`: "Lowers its head and thrusts its tusks forward in a heavy charge, trunk raised."

### กองหินเดินทาง (`cairn_walker`)
Lv 92–98 · ถึก · ไร้รูป · ธาตุหิน แพ้พืช · ไม่โจมตีก่อน · ทุบพื้นรอบตัว · สะท้อนดาเมจ · สูง 210 ซม. (เซลล์ 128)

กองหินบอกทางที่ชาวไฮแลนด์ซ้อนไว้นำทางข้ามเนินเขามาตั้งแต่ยุคบรรพบุรุษ ธรรมเนียมคือผู้ผ่านทางต้องวางหินเพิ่มหนึ่งก้อน
กองที่ถูกลืมนานเกินไปจะตื่นขึ้นแล้วออกเดินตามหาทางของตัวเอง หินก้อนบนสุดสลักดวงตาเรืองแสงฟ้า
มันไม่โจมตีก่อน แต่ถ้าถูกตีจะทุบพื้นจนหินกระจายรอบตัว และหินที่ฟันใส่จะกระเด็นกลับ รากไม้ที่แทรกซอกหินทำให้มันพังได้

- `prompt`: "Living cairn monster for a chibi fantasy MMORPG: a humanoid figure built from a stack of rounded grey stones, a flat slab for shoulders, two short stone-pile arms, the top stone carved with a simple face and two glowing pale-blue eyes, lichen and a dusting of snow on the stones. No clothes, no weapon."
- `walk_prompt`: "Lumbering walk cycle in place: stiff heavy steps, the stacked stones wobbling and clacking."
- `attack_prompt`: "Raises both stone arms high and smashes them down onto the ground."

## ภูผาหินปูน (`karst_peaks`, Lv 98–110)

ยอดเขาหินปูนแท่ง ๆ แบบกุ้ยหลิน หมอก ลำธาร ศาลาบนผา สัตว์ในนิทานของซูโจว
(ฟิลด์ข้าง ๆ คือป่าโบราณและที่ราบเนินเขา จึงไม่มีธาตุแสง พืช ดิน น้ำแข็ง หรือหินที่นี่)

### กระเรียนหมอก (`mist_crane`)
Lv 98–103 · ว่องไว · สัตว์ · ธาตุลม แพ้สายฟ้า · โจมตีก่อน · ลอยตัว · พุ่งชน · สูง 150 ซม. (เซลล์ 128)

กระเรียนที่อาศัยบนยอดเขาหินปูนท่ามกลางหมอก ชาวซูโจววาดมันบนเครื่องเคลือบเป็นสัญลักษณ์ของอายุยืน
ปลายปีกจางเป็นหมอกจนดูเหมือนบินออกมาจากเมฆ มันบินโฉบแล้วพุ่งแทงด้วยจะงอยปากยาวเหมือนหอก
สายฟ้าที่ผ่ากลางหมอกทำให้มันร่วง

- `prompt`: "Elegant mist crane monster for a chibi fantasy MMORPG: a white crane with a long neck, a red crown patch, black-tipped tail feathers, a long sharp beak, wings whose tips dissolve into soft drifting white mist, long thin legs tucked under as it flies a little above the ground. No clothes, no weapon."
- `walk_prompt`: "Flying in place: long graceful wing beats trailing mist, neck stretched, body gently rising and falling."
- `attack_prompt`: "Pulls its neck back, then stabs its long beak straight forward like a spear."

### คางคกสามขา (`money_toad`)
Lv 103–108 · ร่ายเวท · สัตว์น้ำ · ธาตุน้ำ แพ้ดิน · ไม่โจมตีก่อน · โจมตีจากระยะไกล (น้ำ) · ขโมยทอง · สูง 110 ซม. (เซลล์ 96)

คางคกทองสามขาจากตำนานของพ่อค้าซูโจว ใครได้เลี้ยงจะร่ำรวย มันนั่งบนกองเหรียญริมลำธาร คาบเหรียญรูสี่เหลี่ยมไว้ในปาก
มันไม่โจมตีก่อน แต่ถ้าถูกรบกวนจะพ่นน้ำใส่จากระยะไกล และถ้าเข้าใกล้มันจะเลียเอาทองไปจากกระเป๋า
พ่อค้าร่ำลือกันว่าคนที่ปราบมันได้จะได้ทองคืนสองเท่า ดินแห้งทำให้ผิวมันแตก

- `prompt`: "Cute chubby three-legged money toad monster for a chibi fantasy MMORPG: a fat golden toad with only three legs (two in front, one at the back), warty skin with shiny gold coin patterns, bulging red eyes, a square-holed bronze coin held in its wide mouth, sitting on a small pile of coins. No clothes, no weapon."
- `walk_prompt`: "Hop cycle in place: small heavy hops on its three legs, belly wobbling, coins jingling."
- `attack_prompt`: "Puffs up its cheeks and spits a jet of water forward, the coin staying in its mouth."

### กิเลนเมฆ (`cloud_qilin`) — หายาก
Lv 109–110 · หายาก · เทวะ · ธาตุสายฟ้า แพ้ดิน · โจมตีก่อน · ลอยตัว · พุ่งชน · ฟื้นตัวเองตอนบาดเจ็บ · สูง 220 ซม. (เซลล์ 128)

สัตว์มงคลที่ปรากฏบนภูผาหินปูนเฉพาะยามเมฆฝนครึ้มที่สุด เกล็ดทอง แผงคอกับหางเป็นเมฆครึ้ม เขาเดียวมีสายฟ้าแลบ
กีบเหยียบเมฆจึงไม่เคยแตะพื้น ชาวซูโจวว่าเสียงฟ้าร้องบนยอดเขาคือเสียงกีบของมัน ตามตำนาน กิเลนไม่ทำร้ายผู้บริสุทธิ์
แต่จะทดสอบผู้กล้าที่ปีนมาถึงยอดเขา มันพุ่งชนด้วยเขาเดียวและฟื้นพลังจากเมฆฝน
ถ้าถูกดึงลงมาแตะดิน สายฟ้าของมันก็ไหลลงดินหมด

- `prompt`: "Majestic qilin monster for a chibi fantasy MMORPG: a deer-like Chinese qilin with shimmering golden scales, a flowing mane and tail made of dark grey-blue storm clouds, a single horn crackling with small lightning bolts, a gentle dragon-like face with long whiskers, cloven hooves standing on small swirling clouds above the ground. No clothes, no weapon."
- `walk_prompt`: "Prancing walk cycle in place: light graceful steps on the clouds, the cloud mane and tail rippling, sparks flickering on the horn."
- `attack_prompt`: "Rears back, then lowers its crackling horn and charges forward in a flash of lightning."

## ที่ราบโบราณ (`ancient_plain`, Lv 110–122)

ซากเมืองของอาณาจักรที่ล่มก่อนจะมีโนอา รูปปั้นยักษ์ล้ม แนวเสา ประตูชัยพัง วิญญาณและเศษซากของยุคก่อน

### ทหารหมอกยุคก่อน (`phantom_hoplite`)
Lv 110–115 · ธรรมดา · อันเดด · ธาตุควัน แพ้แสง · โจมตีก่อน · พวกเดียวกันรุมช่วย · หลบเก่ง · สูง 170 ซม. (เซลล์ 128)

วิญญาณทหารของอาณาจักรยุคก่อนที่ยังเดินลาดตระเวนตามแนวเสาพังทุกเช้าที่มีหมอก ร่างโปร่งแสง หมวกหงอนสูง
ถือหอกและโล่กลม ท่อนล่างจางเป็นหมอก พวกมันเดินเป็นแถว เมื่อตัวหนึ่งถูกตี ตัวอื่นจะเข้ามาช่วยทันที
และร่างหมอกทำให้ดาบฟันผ่านไปบ่อย ๆ แสงสว่างสลายพวกมันได้

- `prompt`: "Ghostly ancient soldier monster for a chibi fantasy MMORPG: a translucent pale-teal phantom warrior wearing a bronze crested helmet with a tall horsehair plume and a bronze breastplate, holding a long spear and a round shield with a faded emblem, glowing white eyes under the helmet, the lower body fading into swirling mist instead of legs, floating just above the ground."
- `walk_prompt`: "Floating march cycle in place: drifting forward in a steady rhythm, spear upright, mist trailing and swirling below."
- `attack_prompt`: "Braces behind its round shield and thrusts the spear straight forward."

### หัตถ์รูปปั้นยักษ์ (`statue_hand`)
Lv 115–120 · ถึก · ไร้รูป · ธาตุหิน แพ้สายฟ้า · ไม่โจมตีก่อน · ทุบพื้นรอบตัว · กัดให้กลายเป็นหิน · สูง 200 ซม. (เซลล์ 128)

มือขวาของรูปปั้นยักษ์ที่ล้มลงกลางที่ราบ ตัวรูปปั้นยังนอนอยู่ แต่มือหักออกมาแล้วคลานไปทั่วด้วยห้านิ้ว
นิ้วนางยังสวมแหวนตราของกษัตริย์ยุคก่อน นักปราชญ์โนอาเชื่อว่ามือนี้กำลังตามหาร่างของตัวเอง
มันไม่โจมตีก่อน แต่ถ้าถูกตีจะตบพื้นจนสะเทือน และสัมผัสของมันทำให้ร่างกลายเป็นหินชั่วครู่ ฟ้าผ่าทำให้หินร้าว

- `prompt`: "Giant stone hand monster for a chibi fantasy MMORPG: a huge broken marble hand from a fallen colossal statue, cracked and weathered pale stone, walking on its five fingertips like a spider, a jagged broken wrist, a large gold signet ring on one finger, moss in the cracks, a faint golden glow seeping from the cracks. No clothes, no weapon."
- `walk_prompt`: "Crawl cycle in place: the five fingers step one after another like legs, the hand rocking, dust falling from the cracks."
- `attack_prompt`: "Rises up on its fingertips, then slaps down flat with its palm, cracking the ground."

### สารถีรถศึกวิญญาณ (`ghost_charioteer`) — หายาก
Lv 121–122 · หายาก · อันเดด · ธาตุลม แพ้แสง · โจมตีก่อน · ลอยตัว · พุ่งชน · กัดให้ช้าลง · สูง 230 ซม. (เซลล์ 128)

สารถีผู้ชนะการแข่งรถศึกครั้งสุดท้ายก่อนที่เมืองยุคก่อนจะล่ม เขายังขับรถศึกโปร่งแสงที่ม้าหมอกสองตัวลาก
วนรอบประตูชัยที่พังเหมือนการแข่งยังไม่จบ รถลอยเหนือพื้น พุ่งเข้าชนผู้เล่น และล้อรถทิ้งลมหมุนที่ทำให้ขาช้าลง
แสงอาทิตย์แรกยามเช้าทำให้เขาจางหาย

- `prompt`: "Ghost charioteer monster for a chibi fantasy MMORPG: a translucent pale-blue phantom charioteer in a bronze breastplate and a crested helmet holding the reins, riding a small two-wheeled ancient war chariot with spiked wheels, pulled by two misty ghost horses with glowing eyes and manes of drifting fog, the whole group floating a little above the ground."
- `walk_prompt`: "Galloping in place: the ghost horses gallop, wheels spinning, mist streaming behind, the charioteer leaning forward."
- `attack_prompt`: "Snaps the reins and the whole chariot lunges forward in a rushing charge, the horses rearing."

## แม่น้ำเยือกแข็ง (`frozen_river`, Lv 122–134)

แม่น้ำกว้างระหว่างโนอากับไฮแลนด์ที่แข็งเป็นน้ำแข็งบางส่วน สะพานหินเก่าครึ่งพัง ฝั่งเหนือหิมะเริ่มตก

### ปลาไพค์เกล็ดน้ำแข็ง (`ice_pike`)
Lv 122–128 · ว่องไว · สัตว์น้ำ · ธาตุน้ำแข็ง แพ้สายฟ้า · โจมตีก่อน · พุ่งชน · กัดให้ช้าลง · สูง 130 ซม. (เซลล์ 96)

ปลานักล่าปากยาวฟันแหลมของแม่น้ำเยือกแข็ง เกล็ดกลายเป็นน้ำแข็งใสเพื่อพรางตัวใต้ผิวน้ำแข็ง
มันพุ่งทะลุรูน้ำแข็งขึ้นมางับ แล้วไถลบนน้ำแข็งด้วยท้อง ความเย็นจากฟันทำให้ผู้ถูกกัดเคลื่อนไหวช้าลง
ชาวประมงไฮแลนด์ไม่เจาะรูน้ำแข็งในช่วงที่มันหิว สายฟ้าแล่นผ่านน้ำทำให้มันช็อก

- `prompt`: "Fierce ice pike monster for a chibi fantasy MMORPG: a long sleek predatory fish with a long duck-like snout full of needle teeth, scales made of clear pale-blue ice, frosty white fins, a mean glare, propped up on its fins and tail as if hopping on ice, small ice shards around it. No clothes, no weapon."
- `walk_prompt`: "Flop-hop cycle in place: springs forward on its tail and fins, body flexing, ice shards sparkling."
- `attack_prompt`: "Launches itself forward in a straight leap with jaws wide open and snaps."

### โทรลล์ใต้สะพาน (`bridge_troll`)
Lv 128–134 · ถึก · สัตว์ · ธาตุดิน แพ้ไฟ · โจมตีก่อน · ทุบพื้นรอบตัว · ฟื้นตัวเองตอนบาดเจ็บ · สูง 260 ซม. (เซลล์ 128)

โทรลล์ที่อาศัยใต้สะพานหินเก่า คนเล่าว่าสะพานพังไปครึ่งหนึ่งก็เพราะมันถอนเสาไปทำกระบอง
ทุกวันนี้ทั้งชาวโนอาและชาวไฮแลนด์ต้องเดินอ้อมข้ามน้ำแข็งแทน มันโจมตีทุกคนที่ผ่านมา ทุบพื้นจนน้ำแข็งแตก
และบาดแผลหายเองได้เหมือนโทรลล์ทั่วไป ไฟเท่านั้นที่หยุดการฟื้นตัวของมัน

- `prompt`: "Big brutish bridge troll monster for a chibi fantasy MMORPG: a hulking hunched troll with grey-green warty skin, a huge bulbous nose, small eyes under bushy frosted eyebrows, long arms, a scraggly beard with icicles, a ragged fur loincloth, carrying a broken stone bridge pillar as a club over its shoulder."
- `walk_prompt`: "Heavy stomping walk cycle in place: hunched lumbering steps, long arms swinging, the stone club dragging."
- `attack_prompt`: "Lifts the broken pillar overhead with both hands and smashes it down."

## ช่องเขาตะวันตก (`west_pass`, Lv 134–146)

ทางคดเคี้ยวผ่านหน้าผาเหนือซูโจว ด่านเก่า สะพานเชือก

### แมงมุมสะพานเชือก (`rope_spider`)
Lv 134–139 · ธรรมดา · แมลง · ธาตุพิษ แพ้ไฟ · โจมตีก่อน · โจมตีจากระยะไกล (ใย) · กัดให้ช้าลง · สูง 120 ซม. (เซลล์ 96)

แมงมุมขายาวที่ชักใยข้ามหุบเหวในช่องเขา ลายบนตัวเหมือนเชือกป่านจนพ่อค้าซูโจวเล่าว่า
สะพานเชือกครึ่งหนึ่งในช่องเขาที่จริงเป็นใยของมัน มันพ่นใยเหนียวจากระยะไกลให้เหยื่อติดและเดินช้าลง
แล้วจึงคลานมากัดด้วยเขี้ยวพิษ ไฟเผาทั้งใยและตัวมัน

- `prompt`: "Creepy-cute long-legged spider monster for a chibi fantasy MMORPG: a big spider with eight long jointed legs, a round abdomen with a twisted hemp-rope braid pattern in tan and brown, six shiny black eyes, small fangs dripping green venom, a few strands of sticky web trailing from it. No clothes, no weapon."
- `walk_prompt`: "Skitter cycle in place: the eight long legs step in quick waves, body bobbing, web strands swaying."
- `attack_prompt`: "Rears up on its back legs and shoots a sticky glob of web forward."

### การ์กอยล์ด่านร้าง (`pass_gargoyle`)
Lv 139–144 · ธรรมดา · ปีศาจ · ธาตุหิน แพ้แสง · โจมตีก่อน · ลอยตัว · กัดให้กลายเป็นหิน · สูง 170 ซม. (เซลล์ 128)

รูปปั้นอสูรหินที่ประดับหลังคาด่านเก่า สร้างไว้ไล่ภูตผีจากทางผ่าน แต่เมื่อด่านถูกทิ้ง อสูรในรูปปั้นก็ตื่นขึ้นแทน
มันบินโฉบลงจากหน้าผา และดวงตาแดงก่ำทำให้คนที่สบตากลายเป็นหินชั่วครู่
แสงศักดิ์สิทธิ์ทำให้มันกลับไปเป็นรูปปั้น

- `prompt`: "Stone gargoyle monster for a chibi fantasy MMORPG: a crouching winged demon made of weathered grey stone with patches of green moss, bat-like stone wings, small curved horns, a wide fanged grin, glowing deep-red eyes, clawed hands and feet, a short spiked tail, hovering a little above the ground."
- `walk_prompt`: "Flying in place: heavy stone wings flapping slowly, body bobbing, pebbles crumbling off."
- `attack_prompt`: "Dives forward with both stone claws outstretched and rakes, its eyes flashing red."

### นายด่านเถื่อน (`toll_keeper`) — หายาก, มนุษย์
Lv 145–146 · หายาก · มนุษย์ · ธาตุโลหะ แพ้สายฟ้า · โจมตีก่อน · ทุบพื้นรอบตัว · ขโมยทอง · สูง 170 ซม.

อดีตทหารเฝ้าด่านเก่าในช่องเขา เมื่อด่านถูกยุบเขาไม่ยอมกลับบ้าน ยังเฝ้าอยู่คนเดียว
และ "เก็บค่าผ่านทาง" จากทุกคนด้วยกำลัง เขาฟาดดาบใหญ่กวาดรอบตัว และกระชากเงินไปจากผู้เล่น
ชุดเกราะเก่ากันอาวุธโลหะได้ดี แต่นำไฟฟ้า

ไม่ต้องมีสไปรต์: แต่งตัวจากตู้เสื้อผ้า (`PEOPLE`: ชาย ผมเงิน ตาเขียวน้ำทะเล เสื้อนักรบเขียวป่า กางเกงนักรบน้ำตาล ดาบสองมือ)

## เนินเขาวงกต (`tangled_hills`, Lv 146–158)

เนินและหุบแคบซ้อนกันเหมือนเขาวงกตระหว่างไฮแลนด์กับเชิงเขาหิมะ ที่ราบสูงหลายชั้น

### ดวงไฟหลงทาง (`lost_wisp`)
Lv 146–152 · ร่ายเวท · อันเดด · ธาตุความมืด แพ้แสง · โจมตีก่อน · ลอยตัว · โจมตีจากระยะไกล (คำสาป) · หลบเก่ง · สูง 100 ซม. (เซลล์ 96)

ดวงไฟผีที่ลอยอยู่ในหุบแคบของเนินเขาวงกต ชาวไฮแลนด์เชื่อว่าเป็นวิญญาณของนักเดินทางที่หลงทางจนตาย
และยังพยายามล่อคนอื่นให้หลงตามไปลึกขึ้น มันลอยเรี่ยพื้น ยิงคำสาปจากระยะไกล และวูบหายจากคมดาบ
แสงสว่างทำให้มันสลาย

- `prompt`: "Eerie will-o'-the-wisp monster for a chibi fantasy MMORPG: a floating ball of violet and pale-blue ghost fire with a faint mischievous smiling face inside, a wispy smoky tail trailing behind like a comet, a few tiny sparks orbiting it, hovering above the ground."
- `walk_prompt`: "Floating in place: bobbing and swaying, the flame flickering, the smoky tail curling."
- `attack_prompt`: "Flares up brightly, then flings a small violet curse-flame forward."

### มิโนทอร์เนินวงกต (`maze_minotaur`)
Lv 152–158 · ถึก · ปีศาจ · ธาตุโลหะ แพ้สายฟ้า · โจมตีก่อน · พุ่งชน · ทุบพื้นรอบตัว · สูง 280 ซม. (เซลล์ 128)

มนุษย์หัววัวที่ถูกสาปให้วนอยู่ในเนินเขาวงกตชั่วกาล เขาหุ้มทองแดง มีห่วงที่จมูก ถือขวานสองคม
มันได้ยินเสียงฝีเท้าจากหุบข้าง ๆ แล้วพุ่งชนก่อนฟาดขวานลงพื้น ชาวไฮแลนด์เล่าว่ามันกำลังหาทางออก
แต่ไม่มีใครกล้าบอกทาง ทองแดงที่หุ้มเขานำไฟฟ้า

- `prompt`: "Fearsome minotaur monster for a chibi fantasy MMORPG: a muscular bull-headed giant with shaggy black fur, long horns capped with green-tarnished copper, a heavy brass ring through its snorting nose, glowing red eyes, a leather kilt with copper studs, hooves, holding a big double-headed axe."
- `walk_prompt`: "Heavy walk cycle in place: stomping hoofed steps, shoulders rolling, the double axe swinging low, snorting steam."
- `attack_prompt`: "Raises the double axe overhead and brings it crashing down in front of it."

## บึงลากูน (`lagoon_marsh`, Lv 158–170)

บึงกว้างระหว่างนาขั้นบันไดกับที่ราบใต้โนอา กกสูง ทางเดินไม้ ซากบ้านใต้ถุนสูง หมอกพิษ

### ยักษ์โคลนบึง (`bog_hulk`)
Lv 158–164 · ถึก · ไร้รูป · ธาตุโคลน แพ้ลม · ไม่โจมตีก่อน · ทุบพื้นรอบตัว · กัดให้ช้าลง · สูง 260 ซม. (เซลล์ 128)

ร่างโคลนดำเหนียวที่ลุกขึ้นจากก้นบึง ว่ากันว่าเกิดจากหมู่บ้านใต้ถุนสูงที่จมลงทั้งหมู่บ้าน
ต้นกกและรากบัวงอกตามตัว ตาเป็นฟองก๊าซพิษเรืองเขียว มันไม่โจมตีก่อน แต่ถ้าถูกตีจะทุบพื้นจนโคลนกระเซ็น
และโคลนที่โดนทำให้เท้าจม ลมแรงทำให้ผิวโคลนแห้งแตก

- `prompt`: "Hulking swamp mud monster for a chibi fantasy MMORPG: a huge shambling figure of thick glossy black-brown mud, reeds, cattails and lotus roots sprouting from its shoulders and back, two glowing green bubble eyes, a wide drooping mouth, thick dripping arms, mud constantly dripping off it. No clothes, no weapon."
- `walk_prompt`: "Slow shambling walk cycle in place: heavy dragging steps, mud oozing and dripping, reeds swaying."
- `attack_prompt`: "Raises both dripping arms and slams them down, splashing mud everywhere."

### ไฮดราบึงพิษ (`marsh_hydra`)
Lv 163–168 · ธรรมดา · มังกร · ธาตุพิษ แพ้ไฟ · โจมตีก่อน · โจมตีจากระยะไกล (พิษ) · ฟื้นตัวเองตอนบาดเจ็บ · สูง 230 ซม. (เซลล์ 128)

งูยักษ์สามหัวที่ซ่อนอยู่ในกกสูงของบึงลากูน หมอกพิษทั่วบึงว่ากันว่ามาจากลมหายใจของพวกมัน
มันพ่นน้ำลายพิษจากระยะไกล และเมื่อบาดเจ็บ หัวที่ถูกฟันจะงอกขึ้นใหม่
ตำนานเวนิชเซียสอนว่าต้องใช้ไฟเผาตอคอ มันถึงจะไม่งอกอีก

- `prompt`: "Three-headed swamp hydra monster for a chibi fantasy MMORPG: a big serpentine reptile with dark murky-green scales and a pale yellow belly, three snake-like heads on long necks each with a frilled crest, yellow slit eyes and fangs dripping smoking green venom, a thick coiled tail, short clawed legs half sunk in marsh water."
- `walk_prompt`: "Slither-crawl cycle in place: the body undulates, the three necks weave and sway on their own, the tail coiling."
- `attack_prompt`: "All three heads rear back, then the middle one spits a glob of green venom forward."

### แม่มดบึงพิษ (`bog_witch`) — หายาก, มนุษย์
Lv 169–170 · หายาก · มนุษย์ · ธาตุพิษ แพ้แสง · โจมตีก่อน · โจมตีจากระยะไกล (คำสาป) · กัดให้ช้าลง · สูง 160 ซม.

แม่มดที่อาศัยในซากบ้านใต้ถุนสูงกลางบึง ต้มยาพิษจากกกและเห็ดพิษ แล้วส่งขายให้ใครบางคนในเวนิชเซีย
ไม่มีใครรู้ว่าเป็นใคร เธอสาปจากระยะไกล และคำสาปทำให้ขาหนักเหมือนจมโคลน แสงศักดิ์สิทธิ์ทำลายคาถาของเธอ

ไม่ต้องมีสไปรต์: แต่งตัวจากตู้เสื้อผ้า (`PEOPLE`: ผมแกละสีเขียวมินต์ ตาม่วง ชุดนักบวชเขียวป่า ไม้เท้า)

## สุสานหลวงโบราณ (`royal_necropolis`, Lv 170–182)

สุสานของกษัตริย์ยุคแรก หลุมศพหิน รูปปั้นเฝ้าสุสาน และป่าแดนใต้ที่เริ่มกลืนเข้ามา

### ราชองครักษ์กระดูก (`bone_royal_guard`)
Lv 170–176 · ธรรมดา · อันเดด · ธาตุโลหะ แพ้แสง · โจมตีก่อน · พวกเดียวกันรุมช่วย · สะท้อนดาเมจ · สูง 180 ซม. (เซลล์ 128)

องครักษ์ของปฐมกษัตริย์ที่ถูกฝังพร้อมนายเพื่อเฝ้าพระองค์ชั่วนิรันดร์ สวมเกราะทองที่หมองไปตามกาล
ถือหอกยาวกับโล่ตรากษัตริย์องค์แรก ตราเดียวกับที่ฐานรูปปั้นในโนอา พวกมันเดินเวรเป็นคู่
เมื่อตัวหนึ่งถูกตี อีกตัวจะเข้ามาช่วย และโล่ทองสะท้อนความเสียหายกลับ แสงศักดิ์สิทธิ์ทำลายพวกมันได้มาก

- `prompt`: "Skeleton royal guard monster for a chibi fantasy MMORPG: a tall skeleton warrior wearing tarnished ornate gold armour with a crested royal helmet, a tattered faded purple cape, holding a long ceremonial spear and a round gold shield bearing a crowned sun emblem, small blue ghost-flames glowing in its eye sockets."
- `walk_prompt`: "Marching walk cycle in place: stiff rattling steps, spear held upright, cape swaying."
- `attack_prompt`: "Steps forward behind its shield and thrusts the long spear straight ahead."

### บุปผากินศพ (`corpse_bloom`)
Lv 175–181 · ร่ายเวท · พืช · ธาตุพิษ แพ้ไฟ · โจมตีก่อน · โจมตีจากระยะไกล (เถาวัลย์) · ระเบิดตอนตาย · สูง 180 ซม. (เซลล์ 128)

ดอกไม้ยักษ์จากป่าดิบแดนใต้ที่ค่อย ๆ รุกเข้ามาในสุสาน รากชอนไชลงไปในหลุมศพเพื่อดูดกินสิ่งที่อยู่ข้างใน
กลีบแดงจุดขาวส่งกลิ่นเหมือนศพเพื่อล่อเหยื่อ มันฟาดเถาวัลย์หนามจากระยะไกล
และเมื่อตายจะระเบิดเป็นละอองสปอร์พิษใส่คนที่ยืนใกล้ ไฟเผามันได้ง่าย

- `prompt`: "Giant corpse flower monster for a chibi fantasy MMORPG: a huge rafflesia-like flower with five thick fleshy crimson petals covered in white spots, a dark gaping hole in the centre ringed with tiny teeth, sickly green fumes rising from it, thick gnarled roots that it uses as legs, a few whipping thorny vines. No clothes, no weapon."
- `walk_prompt`: "Creeping walk cycle in place: the root legs step and drag one by one, the petals flexing, fumes puffing."
- `attack_prompt`: "The petals flare open and a thorny vine whips out and lashes forward."

### ปฐมกษัตริย์ผู้ไม่หลับ (`first_king`) — บอส
Lv 182 · บอส · อันเดด · ธาตุความมืด แพ้แสง · โจมตีก่อน · เรียกลูกน้อง (ราชองครักษ์กระดูก) · ทุบพื้นรอบตัว · โจมตีจากระยะไกล (คำสาป) · สูง 300 ซม. (เซลล์ 128)

กษัตริย์องค์แรกของแผ่นดิน ผู้สร้างโนอา รูปปั้นของพระองค์ยังตั้งอยู่กลางเมือง บันทึกในหอจดหมายเหตุโนอาเล่าว่า
พระองค์ขอให้ฝังไว้โดยไม่ต้องหลับ เพื่อจะได้เฝ้าอาณาจักรตลอดไป เมื่อราชสำนักย้ายไปอีเดนที่ติดทะเล
พระองค์จึงตื่นขึ้นด้วยความโกรธที่ถูกทิ้ง ประทับอยู่ในห้องพระศพชั้นในสุด ทุบพื้นสุสานจนสะเทือน
สาปผู้บุกรุกจากระยะไกล และเมื่อบาดเจ็บจะเรียกราชองครักษ์กระดูกมาช่วยทีละคู่ แสงศักดิ์สิทธิ์คือจุดอ่อน

- `prompt`: "Undead first king boss monster for a chibi fantasy MMORPG: a towering regal skeleton king in ornate tarnished gold armour, a tall golden crown with dull red gems, a long tattered crimson royal cape with gold trim, blue ghost-fire burning in its eye sockets and between its ribs, a gold chain of office across its chest, holding a heavy golden sceptre-mace topped with a crowned sun."
- `walk_prompt`: "Slow regal walk cycle in place: heavy measured steps, the cape billowing, the sceptre held upright, ghost-fire flickering."
- `attack_prompt`: "Raises the golden sceptre high in both hands and slams it into the ground, sending out a ring of blue ghost-fire."

## หน้าผาทะเลเหนือ (`north_cliffs`, Lv 182–192)

หน้าผาริมทะเลน้ำแข็งทางเหนือของไฮแลนด์ แท่งหินกลางทะเล ประภาคารร้าง

### ฮาร์ปีลมเหมันต์ (`frost_harpy`)
Lv 182–187 · ว่องไว · ปีศาจ · ธาตุลม แพ้สายฟ้า · โจมตีก่อน · ลอยตัว · พวกเดียวกันรุมช่วย · หลบเก่ง · สูง 150 ซม. (เซลล์ 128)

ปีศาจหน้าหญิงตัวนกที่ทำรังบนแท่งหินกลางทะเลน้ำแข็ง เสียงกรีดร้องของพวกมันปนไปกับลมหนาวจนชาวเรือแยกไม่ออก
พวกมันบินเป็นฝูง โฉบจิกด้วยกรงเล็บน้ำแข็ง และหลบกลางลมได้คล่อง อสูรในประภาคารเลี้ยงพวกมันไว้เป็นสุนัขล่าเนื้อ
สายฟ้าจากพายุทำให้พวกมันร่วง

- `prompt`: "Frost harpy monster for a chibi fantasy MMORPG: a harpy with a pale bluish-white woman's face and fierce icy-blue eyes, long wild white hair blowing like snowflakes, large grey-and-white feathered wings instead of arms, a feathered bird body, sharp ice-crystal talons, flying a little above the ground."
- `walk_prompt`: "Flying in place: strong wing beats, hair streaming, body bobbing, a few snowflakes swirling around."
- `attack_prompt`: "Dives forward with talons outstretched and slashes, wings swept back."

### ไวเวิร์นน้ำค้างแข็ง (`rime_wyvern`)
Lv 186–191 · ธรรมดา · มังกร · ธาตุน้ำแข็ง แพ้ไฟ · โจมตีก่อน · ลอยตัว · พุ่งชน · กัดให้ช้าลง · สูง 280 ซม. (เซลล์ 128)

มังกรสองขาที่ทำรังในถ้ำน้ำแข็งใต้หน้าผา ญาติห่าง ๆ ของมังกรน้ำแข็งเหนือ ตัวเล็กกว่าแต่ดุกว่า
เกล็ดมีน้ำค้างแข็งเกาะ หางเป็นหนามน้ำแข็ง มันบินวนแล้วพุ่งลงมาจากที่สูง กัดด้วยฟันเย็นเฉียบจนเหยื่อช้าลง
ไฟละลายเกล็ดน้ำแข็งของมัน

- `prompt`: "Rime wyvern monster for a chibi fantasy MMORPG: a sleek two-legged dragon with pale icy-blue scales coated in white frost, large pale-blue leathery membrane wings, a long neck with a row of icicle spines, sharp horns, glowing cyan eyes, a long tail ending in a cluster of ice spikes, frosty breath, flying a little above the ground."
- `walk_prompt`: "Flying in place: big wing beats, neck curved, tail swaying, frost mist drifting off its scales."
- `attack_prompt`: "Pulls its wings back and dives forward jaws first, biting with frost bursting from its mouth."

### อสูรตะเกียงประภาคาร (`lighthouse_fiend`) — บอส
Lv 192 · บอส · ปีศาจ · ธาตุไฟ แพ้น้ำ · โจมตีก่อน · เรียกลูกน้อง (ฮาร์ปีลมเหมันต์) · โจมตีจากระยะไกล (ไฟ) · กัดติดไฟ · สูง 340 ซม. (เซลล์ 128)

ประภาคารบนหน้าผาถูกทิ้งร้างหลังเรือนับสิบลำชนแท่งหินจม ชาวไฮแลนด์เล่าว่าคนเฝ้าประภาคารคนสุดท้าย
ทำสัญญากับอสูรเพื่อให้ไฟไม่มีวันดับ แต่อสูรกลับกินคนเฝ้า แล้วใช้ตะเกียงล่อเรือให้มาชนหิน
มันยิงลูกไฟจากตะเกียง เผาผู้เล่นให้ติดไฟ และเรียกฮาร์ปีลมเหมันต์มาช่วยเมื่อบาดเจ็บ น้ำทะเลดับไฟของมันได้

- `prompt`: "Lighthouse fiend boss monster for a chibi fantasy MMORPG: a tall gaunt demon with charcoal-black skin cracked with glowing orange embers, large curved ram horns, burning orange eyes, a tattered dark sea-captain's coat, bat-like wings folded behind, one clawed hand holding up a large iron lighthouse lantern blazing with bright fire, a broken rusted chain hanging from its wrist."
- `walk_prompt`: "Menacing walk cycle in place: slow prowling steps, the lantern swinging and casting light, coat tails flapping."
- `attack_prompt`: "Thrusts the blazing lantern forward and a fireball bursts out of it."

## แหลมทะเลตะวันตก (`west_cape`, Lv 188–200)

แหลมสุดทวีปทางตะวันตกของซูโจว ทะเลคลั่ง ซากเรือ ศาลมังกรทะเล ลัทธิมังกรทะเลและสัตว์ร้ายแห่งพายุ

### สาวกมังกรทะเล (`sea_cultist`) — มนุษย์
Lv 188–192 · ร่ายเวท · มนุษย์ · ธาตุน้ำ แพ้สายฟ้า · โจมตีก่อน · โจมตีจากระยะไกล (น้ำ) · ฟื้นตัวเองตอนบาดเจ็บ · สูง 160 ซม.

สาวกลัทธิที่บูชามังกรทะเลคลั่งที่ศาลบนแหลม เชื่อว่าเมื่อมังกรตื่นเต็มที่ ทะเลจะกลืนแผ่นดินและเหลือไว้แต่ผู้ศรัทธา
พวกเธอเคยเป็นชาวเรือซูโจวที่รอดจากซากเรือ ชุดดำปักลายเกล็ดมังกร ถือไม้เท้า ยิงน้ำทะเลจากระยะไกล
และรักษาตัวเองด้วยบทสวด สายฟ้าทำลายพิธีของพวกเธอ

ไม่ต้องมีสไปรต์: แต่งตัวจากตู้เสื้อผ้า (`PEOPLE`: ผมยาวสีน้ำเงิน ตาเขียวน้ำทะเล ชุดนักบวชดำ ไม้เท้า)

### กริฟฟินพายุ (`storm_griffin`)
Lv 191–194 · ว่องไว · สัตว์ · ธาตุสายฟ้า แพ้ดิน · โจมตีก่อน · ลอยตัว · พุ่งชน · ทุบพื้นรอบตัว · สูง 240 ซม. (เซลล์ 128)

สัตว์ร้ายที่เกิดจากพายุซึ่งไม่เคยสงบเหนือแหลมตะวันตก หัวอินทรีตัวสิงโต ขนสีเทาฟ้าเหมือนเมฆพายุ
สายฟ้าแลบตามปีก ชาวซูโจวเชื่อว่ามันเป็นพาหนะของมังกรทะเล มันบินวนแล้วพุ่งลงมา กระแทกพื้นจนสายฟ้ากระจาย
ดินดูดสายฟ้าของมันลงไปหมด

- `prompt`: "Storm griffin monster for a chibi fantasy MMORPG: a griffin with the head, wings and front talons of a fierce eagle and the body and tail of a lion, feathers and fur in stormy blue-grey, a crest of feathers crackling with little lightning bolts, sparks running along its wing edges, a sharp golden beak and glowing yellow eyes, flying a little above the ground."
- `walk_prompt`: "Flying in place: powerful wing beats, the lion tail lashing, lightning flickering along the feathers."
- `attack_prompt`: "Rears up in the air and dives forward talons first, a lightning flash bursting on impact."

### มังกรทะเลคลั่ง (`sea_dragon`) — บอส
Lv 195 · บอส · มังกร · ธาตุน้ำ แพ้ดิน · โจมตีก่อน · เรียกลูกน้อง (สาวกมังกรทะเล) · โจมตีจากระยะไกล (น้ำ) · ทุบพื้นรอบตัว · สูง 460 ซม. (เซลล์ 128)

มังกรทะเลที่หลับอยู่ใต้แหลมตะวันตกมาตั้งแต่ก่อนมีซูโจว ศาลมังกรทะเลถูกสร้างไว้เพื่อกล่อมให้มันหลับ
แต่สาวกลัทธิปลุกมันขึ้นมา ทะเลรอบแหลมจึงคลั่งไม่หยุด และเรือสำเภาจากซูโจวต้องอ้อมไกลออกไป
มันพ่นน้ำทะเลแรงสูง ฟาดหางลงพื้นจนคลื่นซัดรอบตัว และเรียกสาวกมาช่วยเมื่อบาดเจ็บ แผ่นดินและหินกันแรงคลื่นของมันได้

- `prompt`: "Raging sea dragon boss monster for a chibi fantasy MMORPG: a huge serpentine Eastern-style sea dragon with deep blue-green scales and a pale belly, a crest and dorsal fins shaped like curling ocean waves with white foam tips, long flowing whiskers, branching coral-like horns, fierce glowing teal eyes, small clawed arms, its long body coiled upright, seawater dripping and spraying off it."
- `walk_prompt`: "Coiling in place: the long body undulates like a wave, head swaying, fins rippling, spray flying."
- `attack_prompt`: "Rears its head back and blasts a powerful jet of seawater straight forward."
