const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

require("dotenv").config();

const User = require("./models/User");
const {JWT_SECRET } =  require("./config/auth");
const requireAuth = require("./middlewares/requireAuth");
const Vehicle = require("./models/Vehicle");

// JWT 토큰을 만들 때 사용할 임시 비밀키
// 나중에 dotenv로 .env 파일로 옮길 예정
// const JWT_SECRET = "my-board-project-secret-key";

const app = express();

const PORT = process.env.PORT || 4000;

// 이 설정이 있어야 localhost:3000의 Next.js가 localhost:4000의 Express API를 호출할 수 있음
app.use(cors());
// JSON 형식으로 보낸 데이터를 req.body에서 읽도록 함
app.use(express.json());

// 서버가 정상 실행 중인지 확인하는 API
app.get("/api/health", (req, res)=> {
    res.status(200).json({
        status: "ok",
        msg : "Board API server is running",
    });
});

async function startServer(){
    try{
        // await mongoose.connect("mongodb://127.0.0.1:27017/my_board_db");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB 연결 성공");
        console.log("현재 데이터베이스:", mongoose.connection.name);

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

// 로그인한 사용자가 차량 목록을 조건별로 조회하는 API입니다.
app.get("/api/vehicles", requireAuth, async (req, res) => {
    try {
        const { budgetMax, bodyType, powertrain, seats, origin } = req.query;

        const query = {};

        // 예산 이하의 시작 가격을 가진 차량만 보여줍니다.
        if (budgetMax) {
            query.priceFrom = { $lte: Number(budgetMax) };
        }

        if (bodyType && bodyType !== "전체") {
            query.bodyType = bodyType;
        }

        if (powertrain && powertrain !== "전체") {
            query.powertrain = powertrain;
        }

        if (seats && seats !== "전체") {
            query.seats = { $gte: Number(seats) };
        }

        if (origin && origin !== "전체") {
            query.origin = origin;
        }

        const vehicles = await Vehicle.find(query).sort({
            priceFrom: 1,
            brand: 1,
        });

        return res.status(200).json(vehicles);
    } catch (error) {
        return res.status(500).json({
            message: "차량 목록을 불러오는 중 오류가 발생했습니다.",
        });
    }
});

// 차량 한 대의 상세 정보를 조회하는 API입니다.
app.get("/api/vehicles/:slug", requireAuth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            slug: req.params.slug,
        });

        if (!vehicle) {
            return res.status(404).json({
                message: "차량 정보를 찾을 수 없습니다.",
            });
        }

        return res.status(200).json(vehicle);
    } catch (error) {
        return res.status(500).json({
            message: "차량 상세 정보를 불러오는 중 오류가 발생했습니다.",
        });
    }
});

startServer();