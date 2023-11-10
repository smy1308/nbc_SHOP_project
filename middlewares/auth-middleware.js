const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

module.exports = (req, res, next) => {
    //헤더에 저장된 jwt토큰을 가져온다
  const { authorization } = req.headers;
    //받아온 authorization를 authType:bearer와 authToken으로 나눠준다
  const [authType, authToken] = (authorization || "").split(" ");

    //authType이 bearer가 아니거나 authToken이 없는 경우
  if (!authToken || authType !== "Bearer") {
    res.status(401).send({
      errorMessage: "로그인 후 이용이 가능합니다.",
    });
    return;
  }

  //복호화 및 에러확인
  try {
    const { userId } = jwt.verify(authToken, "sparta-secret-key");
    //사용자가 확인되면 사용자 정보를 로컬에 넣어준다
    User.findById(userId).then((user) => {
      res.locals.user = user;
      //완료되면 다음 미들웨어로 진행
      next();
    });
  } catch (err) {
    res.status(401).send({
      errorMessage: "로그인 후 이용이 가능합니다.",
    });
  }
};