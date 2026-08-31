const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET이 설정되지 않았습니다.");
}

module.exports = {JWT_SECRET};