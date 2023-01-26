const express = require('express');
var cookieParser = require('cookie-parser')
const path = require('path');
const CourseFile = require('./mongodb/courseFile');
const User = require('./mongodb/user');
const connectDB = require('./mongodb/db.js');
require('dotenv').config();
const cors = require('cors');

process.on("unhandledRejection", error => {
   console.error(error)
});

(async () => {
   await connectDB();
})();

const port = process.env.PORT || 5000;

var app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web-app/public/')));
app.use(cookieParser())
app.use(cors())
app.use(function (req, res, next) {
   console.log(`${req.method} ${req.url}`)
   next()
});


const isAuth = async (req, passwordToBeVerified = "", type = "") => {
   let token = "";
   if (type == "verify") token = passwordToBeVerified;
   else token = req.cookies["token"];
   let user = await User.findOne({ "username": process.env.LOG_USERNAME }).select(["password", "-_id"]);
   if (user) password = user["password"]

   if (!token || token != user["password"]) return false;
   if (token == user["password"]) return true
};

app.get('/', (req, res) => {
   res.redirect('login')
});

app.get('/login', async (req, res) => {
   const isUserAuth = await isAuth(req)
   if (!isUserAuth) res.sendFile(path.join(__dirname, '/web-app/public/login.html'))
   if (isUserAuth) res.redirect('upload-courses-file.html')
});

app.get('/change-password', async (req, res) => {
   const isUserAuth = await isAuth(req);
   if (!isUserAuth) res.status(403).sendFile(path.join(__dirname, '/web-app/403-forbidden.html'))
   if (isUserAuth) res.sendFile(path.join(__dirname, '/web-app/change-password.html'))
});

app.post('/change-password', async (req, res) => {
   const isUserAuth = await isAuth(req);
   if (!isUserAuth) res.status(403).send({ "error": "ليس مصرح لك إجراء هذا التغيير، برجاء تسجيل الدخول" });

   const { currentPassword, newPassword, confirmPassword } = req.body;
   const isCurrentPasswordVerified = await isAuth(req, currentPassword, "verify");
   if (currentPassword == newPassword) res.status(403).send({ "error": "كلمتا السر الحالية والجديدة متطابقتان" })
   if (!isCurrentPasswordVerified) res.status(403).send({ "error": "كلمة السر الحالية خاطئة" })
   if (newPassword != confirmPassword) res.status(403).send({ "error": "كلمة السر الجديدة غير متطابقة" });

   const { nModified, ok } = await User.updateOne({ "username": process.env.LOG_USERNAME }, { "password": newPassword });
   if (nModified == 1 && ok == 1) res.cookie('token', newPassword).send({ "message": 'تم تغيير كلمة السر بنجاح' })
});

app.post("/upload-courses-file.html", async (req, res) => {
   const { password } = req.body;
   const isCurrentPasswordVerified = await isAuth(req, password, "verify");
   if (!isCurrentPasswordVerified) res.status(403).send({ "error": `كلمة سر خاطئة` });
   if (isCurrentPasswordVerified) res.cookie('token', password).redirect('upload-courses-file.html')
});

app.get("/upload-courses-file.html", async (req, res) => {
   const isUserAuth = await isAuth(req)
   if (!isUserAuth) res.status(403).sendFile(path.join(__dirname, '/web-app/403-forbidden.html'))
   if (isUserAuth) res.sendFile(path.join(__dirname, '/web-app/upload-courses-file.html'))
});

app.get('/courses-files', async (req, res) => {
   const courseFiles = await CourseFile.find({}).select(["name", "description", "content", "department", "term", "createdAt", "-_id"]);
   res.send(JSON.stringify(courseFiles))
});

app.get('/latest-courses-file', async (req, res) => {
   const depFilterNames = {
      "cs": "علوم حاسب",
      "new-cs-1": "علوم حاسب لائحة جديدة سنة أولى"
   };
   let { filter } = req.query;
   if (!filter) filter = "cs"
   const coursesFiles = await CourseFile.find({ department: depFilterNames[filter] }).select(["name", "description", "content", "department", "term", "createdAt", "-_id"]);
   if (coursesFiles.length) res.send(JSON.stringify(coursesFiles[coursesFiles.length - 1]))
   if (!coursesFiles.length) res.send(JSON.stringify({ "content": "" }))
});

app.post('/courses-files', async (req, res) => {
   const { name, content, description, department, term } = req.body;
   const isNameDup = await CourseFile.findOne({ "name": name });
   let errors = [];
   if (isNameDup) errors.push({ "error": `اسم ملف مكرر : ${name}` })

   if (!name || !content || !description || !department || !term) {
      errors.push({ "error": `البيانات ليست كاملة` })
   };

   if (errors.length) res.status(400).send({ errors })

   if (!isNameDup) {
      try {
         const isCreated = await CourseFile.create({ "name": name.trim(), "content": content.trim(), description, department, term });
         if (isCreated) res.send({ "message": `تمت إضافة ملف  #${name} بنجاح` });

      } catch (error) {
         errors = []
         if (error.message.includes("courseFile validation failed")) {
            errors.push({ "error": `تأكد من اختيار قيم صحيحة للفصل الدراسي` })
         }
         res.status(400).send({ errors })
      }
   }
});

app.delete('/courses-files', async (req, res) => {
   const { name } = req.body;
   const { deletedCount } = await CourseFile.deleteOne({ "name": name });

   if (deletedCount == 0) res.status(400).send({ "error": `${name}  لا يوجد ملف باسم ` });
   if (deletedCount == 1) res.send({ "message": `تم حذف ملف  #${name} بنجاح` })
});

app.listen(port, () => {
   console.log(`upload-courses-file is listening at http://localhost:${port}`)
});