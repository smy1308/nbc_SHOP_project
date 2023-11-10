const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const jwt = require("jsonwebtoken");

mongoose.connect("mongodb://localhost:27017/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=> {
  console.log("몽고디비 연결에 성공했습니다");
})
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();


//회원가입 API
const { Op } = require("sequelize");
const { User } = require("./models");

router.post("/users", async (req, res) => {
  const { email, nickname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).send({
      errorMessage: "패스워드가 패스워드 확인란과 다릅니다.",
    });
    return;
  }

  // email or nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
  const existsUsers = await User.findAll({
    where: {
      [Op.or]: [{ email }, { nickname }],
    },
  });
  if (existsUsers.length) {
    res.status(400).send({
      errorMessage: "이메일 또는 닉네임이 이미 사용중입니다.",
    });
    return;
  }

  await User.create({ email, nickname, password });
  res.status(201).send({});
});


//로그인 API
router.post("/auth", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user || password !== user.password) {
    res.status(400).send({
      errorMessage: "이메일 또는 패스워드가 틀렸습니다.",
    });
    return;
  }

  res.send({
    token: jwt.sign({ userId: user.userId }, "sparta-secret-key"),
  });
});


//내 정보 조회 API
const authMiddleware = require("./middlewares/auth-middleware.js");
router.get("/users/me", authMiddleware, async (req, res) => {
  res.json({ user: res.locals.user });
});


app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});