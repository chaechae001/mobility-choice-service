const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const Post = require("./models/Post");
const User = require("./models/User");
const {JWT_SECRET } =  require("./config/auth");
const requireAuth = require("./middlewares/requireAuth");

// JWT 토큰을 만들 때 사용할 임시 비밀키
// 나중에 dotenv로 .env 파일로 옮길 예정
// const JWT_SECRET = "my-board-project-secret-key";

const app = express();

const PORT = process.env.PORT || 4000;

// React 개발 서버(5173번 포트)가 이 API를 호출하도록 허용
app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);

// JSON 형식으로 보낸 데이터를 req.body에서 읽도록 함
app.use(express.json());

// 서버가 정상 실행 중인지 확인하는 API
app.get("/api/health", (req, res)=> {
    res.status(200).json({
        status: "ok",
        msg : "Board API server is running",
    });
});


// 게시글 목록을 MongoDB에서 조회하는 API
app.get('/api/posts', async(req, res)=>{
    try{
        const posts = await Post.find().sort({createdAt: -1});
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({
            msg: "게시글 목록을 불러오지 못했습니다.",
        });
    }
});

// 새 게시글을 MongoDB에 저장하는 API
// requireAuth가 먼저 토큰 확인
// 토큰이 없거나 만료되면 게시글 작성 코드는 실행 x
app.post("/api/posts", requireAuth, async (req, res)=>{
    try {
        const { title, content} = req.body;

        // 제목과 내용이 없으면 작성할 수 없습니다.
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "제목과 내용을 모두 입력해주세요.",
            });
        }
        // 토큰에서 확인한 로그인 사용자 정보를 게시글에 함께 저장
        const newPost = await Post.create({
            title,
            content,
            author: req.user.loginId,
            authorId: req.user.userId,
        });

        return res.status(201).json(newPost);
    } catch (error) {
        return res.status(500).json({
            msg: "게시글을 저장하지 못했습니다."
        });
    }
});

// MongoDB에서 게시글 상세 조회 및 조회수 증가
app.get("/api/posts/:id", async (req, res) => {
    try {
        // URL의 /api/posts/:id에서 게시글 ID를 가져옵니다.
        const { id } = req.params;

        // MongoDB ObjectId 형식인지 확인합니다.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 게시글 ID입니다.",
            });
        }

        // 게시글을 찾고 조회수를 1 증가시킵니다.
        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true },
        );

        // 해당 ID의 게시글이 없을 때입니다.
        if (!post) {
            return res.status(404).json({
                msg: "게시글을 찾을 수 없습니다.",
            });
        }

        // 증가한 조회수를 포함한 게시글 데이터를 반환합니다.
        return res.status(200).json(post);
    } catch (error) {
        return res.status(500).json({
            msg: "게시글을 불러오지 못했습니다.",
        });
    }
});

// MongoDB에서 게시글 제목과 내용을 수정하는 API
app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
        // URL의 /api/posts/:id에서 게시글 ID를 가져옵니다.
        const { id } = req.params;

        // 수정할 제목과 내용을 Body에서 가져옵니다.
        const { title, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 게시글 ID입니다.",
            });
        }

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                msg: "제목과 내용을 모두 입력해주세요.",
            });
        }

        // 수정할 게시글을 찾습니다.
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                msg: "게시글을 찾을 수 없습니다.",
            });
        }

        // 로그인한 사용자가 작성자인지 확인합니다.
        if (
            !post.authorId ||
            post.authorId.toString() !== String(req.user.userId)
        ) {
            return res.status(403).json({
                msg: "작성자만 게시글을 수정할 수 있습니다.",
            });
        }

        // 작성자일 때만 제목과 내용을 수정합니다.
        post.title = title;
        post.content = content;

        await post.save();

        return res.status(200).json(post);
    } catch (error) {
        return res.status(500).json({
            msg: "게시글을 수정하지 못했습니다.",
        });
    }
});

// MongoDB에서 게시글 하나를 삭제하는 API
// 로그인한 작성자만 자신의 게시글을 삭제하는 API
app.delete("/api/posts/:id", requireAuth, async (req, res)=>{
    try {
        const {id} = req.params;

        // URL의 게시글 ID가 MongoDB 형식인지 확인
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                msg: "올바르지 않은 게시글 ID입니다.",
            });
        }

        // 삭제하려는 게시글을 MongoDB에서 찾음
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                msg: "게시글을 찾을 수 없습니다.",
            });
        }

        // 게시글 작성자와 현재 로그인 사용자가 같은 사람인 지 확인
        if (
            !post.authorId ||
            post.authorId.toString() !== String(req.user.userId)
        ) {
            return res.status(403).json({
                msg: "작성자만 게시글을 삭제할 수 있습니다.",
            });
        }

        // 작성자 확인을 통과한 경우에만 MongoDB에서 삭제
        await post.deleteOne();

        return res.status(200).json({
            msg: "게시글이 삭제되었습니다.",
        });
    } catch {
        return res.status(500).json({
            msg: "게시글을 삭제하지 못했습니다.",
        });
    }
});

async function startServer(){
    try{
        // await mongoose.connect("mongodb://127.0.0.1:27017/my_board_db");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB 연결 성공");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB 연결 실패:", error.message);
        process.exit(1);
    }
}

// 회원가입 API
app.post("/api/auth/register", async (req, res)=>{
    try {
        // Thunder가 Body로 보낸 아이디와 비밀번호를 받음
        const { userId, password} = req.body;
        // 아이디 또는 비밀번호가 비어있는 지 먼저 확인
        if (!userId?.trim() || !password.trim()) {
            return res.status(400).json({
                msg: "아이디와 비밀번호를 모두 입력해주세요.",
            });
        }

        // 비밀번호 길이를 확인
        if(password.length < 8){
            return res.status(400).json({
                msg: "비밀번호는 8자 이상 입력해주세요.",
            });
        }

        // 같은 아이디가 있는 지 MongoDB에서 찾기
        const existingUser = await User.findOne({userId});
        if (existingUser) {
            return res.status(400).json({
                msg: "이미 사용 중인 아이디입니다.",
            });
        }

        // 비밀번호를 암호화
        // 숫자 10은 암호화의 강도를 뜻함
        const hashedPassword = await bcrypt.hash(password, 10);
        // 암호화한 비밀번호를 MongoDB에 저장
        const newUser = await User.create({
            userId,
            password: hashedPassword,
        });

        // 비밀번호는 응답으로 보내지 않음
        return res.status(201).json({
            msg: "회원가입이 완료되었습니다.",
            user: {
                id: newUser._id,
                userId: newUser.userId,
                createdAt: newUser.createdAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            msg: "회원가입 처리 중 오류가 발생했습니다.",
        });
    }
});

// 로그인 API
app.post("/api/auth/login", async (req, res)=>{
    try {
        // Thunder가 보낸 아이디와 비밀번호 받기
        const {userId, password} = req.body;
        // 아이디 또는 비밀번호가 비어있는 지 확인
        if(!userId?.trim() || !password?.trim()) {
            return res.status(400).json({
                msg: "아이디와 비밀번호를 모두 입력해주세요.",
            });
        }

        // 입력한 아이디와 일치하는 사용자를 MongoDB에서 찾기
        const user = await User.findOne({userId});

        // 가입하지 않은 아이디이거나 비밀번호가 틀린 경우
        if (!user) {
            return res.status(400).json({
                msg: "아이디 또는 비밀번호가 올바르지 않습니다.",
            })
        }

        // 사용자가 입력한 비밀번호와 DB의 암호화된 비밀번호를 비교
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if(!isPasswordMatched){
            return res.status(401).json({
                msg: "아이디 또는 비밀번호가 올바르지 않습니다.",
            });
        }

        // 로그인 성공 정보를 담은 토큰 만들기
        const token = jwt.sign(
            {
                userId: user._id,
                loginId: user.userId,
            },
            JWT_SECRET,
            {
                expiresIn: "1h", // 토큰은 발급 후 1시간 동안만 유효
            },
        );

        return res.status(200).json({
            msg: "로그인에 성공했습니다.",
            token,
            user: {
                id: user._id,
                userId: user.userId,
            },
        });
    } catch (error) {
        return res.status(500).json({
            msg: "로그인 처리 중 오류가 발생했습니다.",
        });
    }
});

// 로그인한 사용자만 자신의 토큰 정보를 확인할 수 있는 API
app.get("/api/auth/me", requireAuth, (req, res) =>{
    return res.status(200).json({
        msg: "로그인한 사용자입니다.",
        user : req.user,
    });
});



startServer();