npm init -y
npm i express cors jsonwebtoken bcrypt cookie-parser dotenv morgan helmet pg axios xss cloudinary multer nodemon
npm install express-validator
npm i resend
npm install ejs
npm i express-rate-limit


# Prisma ORM (สำหรับ PostgreSQL)
npm install prisma --save-dev
npx prisma init

npx prisma migrate dev --name init //สร้าง migrate

npx prisma migrate reset
npx prisma generate

***npx prisma introspect***
ใช้งาน Prisma Introspection: ใช้คำสั่ง prisma introspect เพื่อดึงโครงสร้างฐานข้อมูลที่มีอยู่แล้วมาเป็น Prisma schema:
คำสั่งนี้จะทำการดึงข้อมูลจากฐานข้อมูลและสร้าง Prisma schema ที่แสดงโครงสร้างตารางทั้งหมดในฐานข้อมูลนั้น เช่น ตาราง, ความสัมพันธ์ระหว่างตาราง, คีย์หลัก, คีย์ต่างประเทศ เป็นต้น

npx prisma migrate dev --name "soi"
npx prisma migrate deploy

1.prisma migrate dev
ใช้สำหรับการพัฒนา (development) และสร้าง migration ใหม่โดยอัตโนมัติ
คำสั่งนี้จะใช้เมื่อมีการเปลี่ยนแปลง schema แล้วต้องการให้ฐานข้อมูลของคุณอัปเดตตาม schema นั้น
ตัวอย่างคำสั่ง:
npx prisma migrate dev --name "soi"


2.prisma migrate deploy
ใช้สำหรับการ deploy migration ที่สร้างในโปรเจกต์ (ใช้ใน production)
ตัวอย่างคำสั่ง:
npx prisma migrate deploy

3.prisma migrate reset
ใช้สำหรับการรีเซ็ตฐานข้อมูลทั้งหมดและทำการ migrate ใหม่
ตัวอย่างคำสั่ง:
npx prisma migrate reset
= คำสั่งนี้จะทำการลบข้อมูลในฐานข้อมูลและรีเซ็ตทั้งหมดกลับมาใหม่ตาม schema ปัจจุบัน
ใช้สำหรับการทดสอบหรือการพัฒนาใหม่

4.prisma generate
npx prisma generate
= คำสั่งนี้จะสร้าง Prisma Client ใหม่ที่สามารถใช้ในโค้ดของคุณเพื่อทำการ query ข้อมูลจากฐานข้อมูลได้

5.prisma db push
npx prisma db push
= คำสั่งนี้จะอัปเดตฐานข้อมูลโดยตรงตาม schema ที่คุณมีใน prisma/schema.prisma โดยไม่ต้องสร้าง migration
คำสั่งนี้เหมาะสำหรับการพัฒนา แต่ไม่แนะนำให้ใช้ใน production เพราะมันไม่เก็บประวัติของการเปลี่ยนแปลง

6.prisma migrate status
npx prisma migrate status
= คำสั่งนี้จะแสดงสถานะของ migration ว่ามี migration ที่ไม่ได้ใช้งานหรือไม่




#🔍 CORS คืออะไร
CORS ย่อมาจาก Cross-Origin Resource Sharing
มันคือ ระบบความปลอดภัย ของเว็บเบราว์เซอร์ ที่ป้องกันไม่ให้เว็บหนึ่ง (origin หนึ่ง) เรียกใช้ resource (API, รูปภาพ ฯลฯ) จากอีก origin หนึ่ง โดยไม่ได้รับอนุญาต

อนุญาต
📌 ตัวอย่างสถานการณ์ CORS:
Backend รันที่ http://localhost:5000

Frontend (React) รันที่ http://localhost:3000

ตอน React เรียก API ไปที่ backend (localhost:5000)
เบราว์เซอร์จะถือว่านี่เป็น "cross-origin" request
ถ้า backend ไม่อนุญาต → เบราว์เซอร์จะบล็อค request ทันที 🚫

🔑 ความหมายแต่ละบรรทัด:
origin: process.env.FRONTEND_URL
✅ อนุญาตให้เฉพาะ origin นี้เรียก API ได้
(ดีกว่าใช้ "*" ที่เปิดให้ทุกเว็บเรียกได้ ซึ่งไม่ปลอดภัย)

credentials: true
✅ อนุญาตให้ frontend ส่ง credentials เช่น cookie, authorization header มาได้
(สำคัญถ้าคุณใช้ระบบ auth หรือ JWT)





📦 app.use(express.json()) คืออะไร?
คำสั่งนี้คือการบอก Express ให้ แปลง (parse) request ที่มี Content-Type: application/json
ให้กลายเป็น JavaScript object แล้วเก็บไว้ใน req.body
body

📌 ตัวอย่าง:
🔴 โดยปกติ ถ้าไม่ใส่ express.json()
app.post('/api/user', (req, res) => {
  console.log(req.body) // ❌ จะได้ undefined
})

✅ ถ้าใส่ app.use(express.json())
app.use(express.json())

app.post('/api/user', (req, res) => {
  console.log(req.body) 
  // ถ้าส่ง JSON payload มาแบบนี้:
  // { "name": "John", "email": "john@example.com" }
  // จะได้ object นี้ใน req.body เลย
})

ถ้า backend ไม่มี express.json() → อ่านข้อมูลใน req.body ไม่ได้





📦 app.use(express.urlencoded({ extended: true })) คืออะไร?
คำสั่งนี้ใช้สำหรับ แปลงข้อมูลจากฟอร์ม HTML (แบบ application/x-www-form-urlencoded)
ให้อยู่ในรูปของ JavaScript object แล้วเก็บไว้ใน req.body

✅ สรุปสั้น ๆ:
express.urlencoded() 👉 แปลงข้อมูลจากฟอร์ม HTML → object ใน req.body

extended: true 👉 รองรับ nested object ได้

ใช้คู่กับ form <form> หรือเวลาส่ง request แบบ application/x-www-form-urlencoded

ถ้าคุณใช้ทั้งฟอร์ม HTML และ fetch/axios → ใช้ทั้ง express.json() และ express.urlencoded() เลยก็ได้ครับ
👉 แล้วตอนนี้โปรเจกต์ backend มี form login แบบ HTML หรือใช้ React login ดึง API เอา?





🍪 app.use(cookieParser()) คืออะไร?
✅ สรุปสั้น ๆ:
cookieParser() 👉 แปลง cookie จาก header ให้อยู่ใน req.cookies

ถ้าใส่ secret 👉 จะอ่าน signed cookie ได้ที่ req.signedCookies

จำเป็นถ้าคุณจะใช้ auth แบบ JWT ใน cookie หรือเก็บ session ด้วย cookie
import cookieParser from 'cookie-parser';
app.use(cookieParser())




📋 app.use(morgan('dev')) คืออะไร?
morgan คือ HTTP request logger middleware สำหรับ Express
มันจะพิมพ์ log ของ request ที่เข้ามาใน console ให้เราเห็นชัด ๆ ว่า:
มี request มาตอนไหน

ใช้ method อะไร (GET, POST, ฯลฯ)
เข้า route ไหน
status code เท่าไหร่
ใช้เวลากี่มิลลิวินาที

import morgan from 'morgan';
app.use(morgan('dev'))





🔐🛡️ helmet คืออะไร?
helmet คือ middleware ที่ช่วยตั้ง HTTP headers ด้านความปลอดภัย ให้อัตโนมัติ
มันคือชุด "เกราะป้องกัน" พื้นฐานสำหรับ Express app ที่ควรใส่ทุกโปรเจกต์

import helmet from 'helmet';
***app.use(helmet()) // เปิดทั้งหมดที่จำเป็น***

📦 แล้ว helmet.frameguard({ action: 'deny' }) คืออะไร?
นี่คือหนึ่งใน middleware ย่อยของ helmet
มันจะเพิ่ม header ที่ชื่อว่า X-Frame-Options ลงใน response เพื่อป้องกัน Clickjacking

📌 Clickjacking คืออะไร?
คือเทคนิคที่โจรสร้าง <iframe> เว็บของคุณไว้ในเว็บหลอก แล้วหลอกให้ผู้ใช้คลิก →
เกิดผลลัพธ์ที่อันตราย เช่น "ลบโพสต์", "โอนเงิน", "เปลี่ยนรหัสผ่าน" โดยไม่รู้ตัว

app.use(helmet.frameguard({ action: 'deny' }))
