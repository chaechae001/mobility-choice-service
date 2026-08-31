const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("../config/auth");

// 로그인 토큰을 검사하느 미들웨어
function requireAuth(req, res, next) {
    // 요청 Header의 Authorization 값을 가져옴
    const authorization = req.headers.authorization;

    // 토큰이 없거나 Bearer 형식이 아니면 접근 막음
    if (!authorization || !authorization.startsWith("Bearer ")){
        return res.status(401).json({
            msg: "로그인이 필요합니다.",
        });
    }

    // "Bearer 토큰 값"에서 실제 토큰값만 분리
    const token = authorization.split(" ")[1];

    try {
        // 토큰이 서버가 만든 토큰인지, 유효 시간이 지나지 않았는 지 확인
        // 이후 API에서 로그인 사용자 정보를 사용할 수 있도록 req.user에 저장
        req.user = jwt.verify(token, JWT_SECRET);

        // 토큰 검사를 통과했으므로 다음 API 코드로 이동
        next();
    } catch (error) {
        return res.status(401).json({
            msg: "유효하지 않거나 만료된 토큰입니다."
        });
    }
}

module.exports = requireAuth;