# MMOProject: ลานหมู่บ้าน + เวททุ่งดอกไม้

ต้นแบบเกมบนเว็บ เดินในลานหมู่บ้านที่สร้างใน Oriverse ด้วย WASD และร่ายเวท "ทุ่งดอกไม้" จากช่องสกิล 1 (ช่อง 2–0 ยังว่าง)
ไม่มี build step: HTML + Canvas 2D + ES modules

## เล่น

ES modules ต้องเปิดผ่าน http (ไม่ใช่ `file://`) ใช้ static server ตัวไหนก็ได้ เช่น

```sh
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```

| ปุ่ม | ทำอะไร |
| --- | --- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> หรือปุ่มลูกศร | เดิน 8 ทิศ (กดสองปุ่มพร้อมกันเดินเฉียง) |
| <kbd>Space</kbd> หรือคลิกที่พื้น | ฟาดไม้เท้า (คลิกแล้วหันไปทางจุดที่คลิก) |
| <kbd>1</kbd> หรือคลิกช่อง 1 | ทุ่งดอกไม้: ร่าย 1.5 วินาที, คูลดาวน์ 9 วินาที |
| <kbd>2</kbd>–<kbd>0</kbd> | ช่องว่าง |
| <kbd>`</kbd> หรือเปิดด้วย `?debug` | แสดงกรอบชนและ fps |

## ฉากจาก Oriverse

ฉากต้นฉบับอยู่ใน repo the-hero-fighter ที่ `oriverse/frieren/courtyard.weave`
การเชื่อมต่อ Oriverse ที่ใช้ทำงานนี้ export ฉากเป็นไฟล์ 3D ไม่ได้ (export ได้แค่ไฟล์ `.oripak` ของ Oriverse เองกับเกมสำหรับ Windows) เว็บนี้จึงใช้ภาพฉากที่ render จาก Oriverse เป็นพื้น แล้ววาดตัวละคร เวท และ HUD เอง

`assets/map.jpg` ทำแบบนี้ (ถ้าแก้ฉากใน Oriverse ให้ทำซ้ำ):

1. โหลด `courtyard_capture.weave` (ฉากล้วน ไม่มีเวท ไม่มีตัวละคร) เข้า Oriverse
2. ถ่ายภาพ orthographic 6 ภาพตามมุมกล้องใน `tools/capture_tiles.json` (กล้องก้ม 45° หันไปทาง +X, 1 px = 1 cm)
   ถ่ายทีละมุม (playtest ละ 1 view) ภาพจะได้ขนาดเต็ม 2048×1024 ถ้าถ่ายหลายมุมพร้อมกันภาพจะถูกย่อ
3. ต่อภาพเป็นแผนที่ (สคริปต์ลบคำบรรยาย "0s sky full" ที่ playtest ใส่ไว้มุมซ้ายบนของแต่ละภาพให้ด้วย):
   ```sh
   python3 tools/stitch_map.py r0c0.jpg r0c1.jpg r1c0.jpg r1c1.jpg r2c0.jpg r2c1.jpg -o assets/map.jpg
   ```

สูตรแปลงพิกัดโลก (ซม. ของ Oriverse) เป็นพิกเซลบนแผนที่อยู่ที่ `src/projection.js` กรอบชนใน `src/world.js` ใช้ตำแหน่งวัตถุจาก world ชุดเดียวกัน
ตอนนี้ฉากเป็นภาพแผ่นเดียว ตัวละครจึงยังเดินลอดหลังต้นไม้หรือหลังคาบ้านไม่ได้ (จะถูกวาดทับด้านบน)

## ตัวละคร

- `assets/mage_idle.png` คือ 8 ทิศของสไปรต์ Oriverse `Ori.sprite.@taoisaman.elf_mage_rest#1`
  สร้างจากภาพอ้างอิงท่ายืนแขนแนบลำตัว (`oriverse/frieren/elf_mage_relaxed.png` ใน the-hero-fighter ซึ่งวาดแขนใหม่จาก character sheet ที่เป็นท่า T-pose)
  ดึงเฟรมออกจากภาพ preview ของ Oriverse ด้วย
  ```sh
  python3 tools/sprite_cells.py assets/mage_idle.png south.png south-west.png west.png north-west.png north.png north-east.png east.png south-east.png
  ```
- ภาพหน้าตรงที่ได้มาแขนเป็นกล่องแยกจากตัว แก้ไหล่ให้ต่อกับแขนด้วย `python3 tools/touchup_front.py assets/mage_idle.png`
- ท่าเดินกับท่าโจมตีสร้างจาก 8 ทิศนั้นด้วย `python3 tools/animate_sprite.py assets/mage_idle.png assets`
  (สั่งให้ Oriverse สร้างแอนิเมชันเดิน/โจมตีแล้วล้มเหลวทุกงานด้วย "Animation first frame differs from its retained input" และได้เครดิตคืน)
- ทุกชีตมี 1 แถวต่อทิศ (ลำดับของ Oriverse: หน้า แล้ววนตามเข็มนาฬิกามองจากด้านบน) และ 1 คอลัมน์ 128 px ต่อเฟรม

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/main.js` | โหลด asset, game loop, กล้อง, รับปุ่ม, ลำดับการวาด |
| `src/projection.js` | แปลงพิกัดโลก ↔ แผนที่ |
| `src/world.js` | ขอบเขตเดินได้, กรอบชนของบ้าน/บ่อน้ำ/รถเข็น/ต้นไม้/พุ่มไม้ |
| `src/player.js` | ตัวละคร: แอนิเมชัน 8 ทิศ (ยืน/เดิน/โจมตี), ลอยตัวตอนร่าย, cast bar |
| `src/spell.js` | timeline ของเวททุ่งดอกไม้ (ย้ายมาจาก Weave เป็นวินาที) |
| `src/particles.js` | ระบบ particle บนพิกัดโลก |
| `src/motes.js` | ละอองเรืองแสงลอยทั่วลาน |
| `src/hud.js` | แถบสกิล 10 ช่อง, คูลดาวน์ |
| `assets/` | `map.jpg` ภาพฉากจาก Oriverse, `mage_*.png` ชีตตัวละคร 8 ทิศ, texture ดอกไม้/กลีบ/วงเวท (bake จากสูตร `#texture` เดียวกับใน Weave) |
| `tools/` | ต่อภาพฉาก (`stitch_map.py`), ดึงเฟรมสไปรต์ (`sprite_cells.py`), แก้ไหล่ภาพหน้าตรง (`touchup_front.py`), สร้างท่าเดิน/โจมตี (`animate_sprite.py`) |
