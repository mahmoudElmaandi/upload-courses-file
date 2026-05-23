const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const CourseFile = require('./mongodb/courseFile');
const User = require('./mongodb/user');
const connectDB = require('./mongodb/db.js');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

process.on("unhandledRejection", error => {
   console.error(error);
});

(async () => {
   await connectDB();
})();

const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web-app/public/')));
app.use(cookieParser());
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
   origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
   },
   credentials: true
}));
app.use(function (req, res, next) {
   console.log(`${req.method} ${req.url}`);
   next();
});

const isAuth = (req) => {
   const token = req.cookies["token"];
   if (!token) return false;
   try {
      jwt.verify(token, JWT_SECRET);
      return true;
   } catch {
      return false;
   }
};

app.get('/', (req, res) => {
   res.redirect('login');
});

app.get('/login', (req, res) => {
   if (!isAuth(req)) return res.sendFile(path.join(__dirname, '/web-app/public/login.html'));
   res.redirect('upload-courses-file.html');
});

app.get('/change-password', (req, res) => {
   if (!isAuth(req)) return res.status(403).sendFile(path.join(__dirname, '/web-app/403-forbidden.html'));
   res.sendFile(path.join(__dirname, '/web-app/change-password.html'));
});

app.post('/change-password', async (req, res) => {
   if (!isAuth(req)) return res.status(403).send({ "error": "ليس مصرح لك إجراء هذا التغيير، برجاء تسجيل الدخول" });

   const { currentPassword, newPassword, confirmPassword } = req.body;

   const user = await User.findOne({ "username": process.env.LOG_USERNAME });
   if (!user) return res.status(403).send({ "error": "المستخدم غير موجود" });

   const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
   if (!isCurrentPasswordValid) return res.status(403).send({ "error": "كلمة السر الحالية خاطئة" });
   if (currentPassword === newPassword) return res.status(403).send({ "error": "كلمتا السر الحالية والجديدة متطابقتان" });
   if (newPassword !== confirmPassword) return res.status(403).send({ "error": "كلمة السر الجديدة غير متطابقة" });

   const hashedPassword = await bcrypt.hash(newPassword, 10);
   const { nModified, ok } = await User.updateOne({ "username": process.env.LOG_USERNAME }, { "password": hashedPassword });
   if (nModified === 1 && ok === 1) {
      const token = jwt.sign({ username: process.env.LOG_USERNAME }, JWT_SECRET, { expiresIn: '7d' });
      return res.cookie('token', token, { httpOnly: true }).send({ "message": 'تم تغيير كلمة السر بنجاح' });
   }
   res.status(500).send({ "error": "فشل تحديث كلمة السر" });
});

app.post("/upload-courses-file.html", async (req, res) => {
   const { password } = req.body;
   const user = await User.findOne({ "username": process.env.LOG_USERNAME });
   if (!user) return res.status(403).send({ "error": "المستخدم غير موجود" });

   const isPasswordValid = await bcrypt.compare(password, user.password);
   if (!isPasswordValid) return res.status(403).send({ "error": "كلمة سر خاطئة" });

   const token = jwt.sign({ username: process.env.LOG_USERNAME }, JWT_SECRET, { expiresIn: '7d' });
   res.cookie('token', token, { httpOnly: true }).redirect('upload-courses-file.html');
});

app.get("/upload-courses-file.html", (req, res) => {
   if (!isAuth(req)) return res.status(403).sendFile(path.join(__dirname, '/web-app/403-forbidden.html'));
   res.sendFile(path.join(__dirname, '/web-app/upload-courses-file.html'));
});

app.get('/courses-files', async (req, res) => {
   const courseFiles = await CourseFile.find({}).select(["name", "description", "content", "department", "term", "createdAt", "-_id"]);
   res.send(JSON.stringify(courseFiles));
});

app.get('/latest-courses-file', async (req, res) => {
   const depFilterNames = {
      "cs": "علوم حاسب",
      "new-cs": "علوم حاسب لائحة جديدة"
   };
   let { filter } = req.query;
   if (!filter) filter = "cs";

   const latestFile = await CourseFile.findOne({ department: depFilterNames[filter] })
      .sort({ createdAt: -1 })
      .select(["name", "description", "content", "department", "term", "createdAt", "-_id"]);

   if (latestFile) return res.send(JSON.stringify({ filter, ...latestFile["_doc"] }));
   res.send(JSON.stringify({ "content": "" }));
});

app.post('/courses-files', async (req, res) => {
   if (!isAuth(req)) return res.status(403).send({ "error": "غير مصرح" });

   const { name, content, description, department, term } = req.body;
   const isNameDup = await CourseFile.findOne({ "name": name });
   let errors = [];
   if (isNameDup) errors.push({ "error": `اسم ملف مكرر : ${name}` });
   if (!name || !content || !department || !term) errors.push({ "error": `البيانات ليست كاملة` });
   if (errors.length) return res.status(400).send({ errors });

   try {
      const isCreated = await CourseFile.create({ "name": name.trim(), "content": content.trim(), description, department, term });
      if (isCreated) res.send({ "message": `تمت إضافة ملف  #${name} بنجاح` });
   } catch (error) {
      errors = [];
      if (error.message.includes("courseFile validation failed")) {
         errors.push({ "error": `تأكد من اختيار قيم صحيحة للفصل الدراسي` });
      }
      res.status(400).send({ errors });
   }
});

app.post('/logout', (_req, res) => {
   res.clearCookie('token').send({ "message": "تم تسجيل الخروج" });
});

app.delete('/courses-files', async (req, res) => {
   if (!isAuth(req)) return res.status(403).send({ "error": "غير مصرح" });

   const { name } = req.body;
   const { deletedCount } = await CourseFile.deleteOne({ "name": name });

   if (deletedCount === 0) return res.status(400).send({ "error": `${name}  لا يوجد ملف باسم ` });
   res.send({ "message": `تم حذف ملف  #${name} بنجاح` });
});

app.listen(port, () => {
   console.log(`upload-courses-file is listening at http://localhost:${port}`);
});
