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
router.post("/users", async (req, res) => {
  const { nickname, email, password, confirmPassword } = req.body;

  //패스워드와 패스워드 확인 값이 일치하는지 확인
  if (password !== confirmPassword) {
    res.status(400).send({
      errorMessage: "패스워드가 패스워드 확인란과 다릅니다.",
    });
    //코드 실행을 멈춰준다
    return;
  }

  //닉네임이나 이메일이 동일한게 이미 있는지 확인하기 위해 가져온다
  const existsUsers = await User.findOne({
    $or: [{ nickname }, { email }],
  });
  if (existsUsers) {
    res.status(400).send({
      errorMessage: "닉네임 또는 이메일이 이미 사용중입니다.",
    });
    return;
  }

  const user = new User({ nickname, email, password });
  await user.save();

  res.status(201).send({});
});


//로그인 API
router.post("/auth", async (req, res) => {
  const { email, password } = req.body;
  
  //해당하는 사용자의 이메일이 존재하는지 찾기
  const user = await User.findOne({ email });

  //해당 사용자가 존재하지 않거나 이메일,패스워드가 틀렸을 경우
  if (!user || password !== user.password) {
    res.status(400).send({
      errorMessage: "사용자가 존재하지 않거나, 이메일 또는 패스워드가 틀렸습니다."
    });
    return;
  }

  //사용자가 일치하는 경우 토큰을 만들어 준다
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