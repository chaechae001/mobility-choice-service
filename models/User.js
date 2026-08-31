const mongoose = require("mongoose");

// 회원 한 명의 데이터 형식을 정합니다.
const userSchema = new mongoose.Schema(
    {
        // 로그인할 때 사용할 아이디
        userId: {
            type: String,
            required: true, // 아이디는 반드시 입력
            unique: true, // 같은 아이디로 가입 불가
            trim: true, // 앞뒤 공백을 자동으로 제거
        },

        // 실제 비번이 아니라 bcrypt로 암호화한 값을 저장
        password: {
            type: String,
            required: true,
            minlength: 8, // 비밀번호는 8자 이상
        },
    },
    {
        // 가입시간 (createdAt)과 수정시간 (updatedAt)을 자동으로 기록
        timestamps: true,
        // MongoDB가 만드는 __v 값은 이번 프로젝트에서 숨김
        versionKey: false,
    },
);

// User 모델을 만들면 MongoDB에는 users 컬렉션이 연결됨
module.exports = mongoose.model("User", userSchema);