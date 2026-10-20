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
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> หรือปุ่มลูกศร | เดิน |
| <kbd>1</kbd> หรือคลิกช่อง 1 | ทุ่งดอกไม้: ร่าย 1.5 วินาที, คูลดาวน์ 9 วินาที |
| <kbd>2</kbd>–<kbd>0</kbd> | ช่องว่าง |
| <kbd>`</kbd> หรือเปิดด้วย `?debug` | แสดงกรอบชนและ fps |

## ฉากจาก Oriverse

ฉากต้นฉบับอยู่ใน repo the-hero-fighter ที่ `oriverse/frieren/courtyard.weave`
Oriverse ไม่มีการ export เป็นโมเดล 3D เว็บนี้จึงใช้ภาพฉากที่ render จาก Oriverse เป็นพื้น แล้ววาดตัวละคร เวท และ HUD เอง

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

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/main.js` | โหลด asset, game loop, กล้อง, รับปุ่ม, ลำดับการวาด |
| `src/projection.js` | แปลงพิกัดโลก ↔ แผนที่ |
| `src/world.js` | ขอบเขตเดินได้, กรอบชนของบ้าน/บ่อน้ำ/รถเข็น/ต้นไม้/พุ่มไม้ |
| `src/player.js` | ตัวละคร: เดิน 4 ทิศ, ลอยตัวตอนร่าย, cast bar |
| `src/spell.js` | timeline ของเวททุ่งดอกไม้ (ย้ายมาจาก Weave เป็นวินาที) |
| `src/particles.js` | ระบบ particle บนพิกัดโลก |
| `src/motes.js` | ละอองเรืองแสงลอยทั่วลาน |
| `src/hud.js` | แถบสกิล 10 ช่อง, คูลดาวน์ |
| `assets/` | `map.jpg` ภาพฉากจาก Oriverse, texture ดอกไม้/กลีบ/วงเวท (bake จากสูตร `#texture` เดียวกับใน Weave), สไปรต์ตัวละครจาก character sheet |
