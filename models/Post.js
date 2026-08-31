const mongoose = require("mongoose");

// MongoDB에 저장할 게시글 데이터의 형식
const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        // 이글을 실제로 작성한 사용자의 MongoDB 고유 ID
        // 나중에 수정, 삭제 권한 확인 할 때 사용
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt을 자동으로 생성
        versionKey: false, // __v 필드 숨김
    },
);

module.exports = mongoose.model("Post", postSchema);
