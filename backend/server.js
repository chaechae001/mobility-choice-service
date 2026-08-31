const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const MobilityPlan = require("./models/MobilityPlan");
const User = require("./models/User");
const {JWT_SECRET } =  require("./config/auth");
const requireAuth = require("./middlewares/requireAuth");

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

// ==================================================
// 모빌리티 선택 계획 목록 조회
// 로그인한 사용자가 만든 계획만 조회합니다.
// ==================================================
app.get("/api/plans", requireAuth, async (req, res) => {
    try {
        const plans = await MobilityPlan.find({
            ownerId: req.user.userId,
        }).sort({ createdAt: -1 });

        return res.status(200).json(plans);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획 목록을 불러오지 못했습니다.",
        });
    }
});

// ==================================================
// 모빌리티 선택 계획 목록 조회 API
// GET /api/plans
//
// 로그인한 사용자가 직접 만든 선택 계획만 조회합니다.
// ==================================================
app.get("/api/plans", requireAuth, async (req, res) => {
    try {
        // req.user는 requireAuth가 JWT를 검증한 뒤 넣어준 로그인 정보입니다.
        const loginUserId = req.user.userId;

        // find() 안의 {}는 MongoDB 검색 조건을 적는 객체입니다.
        //
        // ownerId가 현재 로그인한 사용자의 ID와 같은 계획만 찾습니다.
        // 따라서 다른 사용자의 선택 계획은 목록에 보이지 않습니다.
        const plans = await MobilityPlan.find({
            ownerId: loginUserId,
        })

            // sort()는 조회 결과의 순서를 정합니다.
            // createdAt: -1은 최신 작성 계획부터 보여준다는 뜻입니다.
            .sort({
                createdAt: -1,
            });

        // plans는 여러 계획을 담은 배열 [] 형태로 응답됩니다.
        return res.status(200).json(plans);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획 목록을 불러오지 못했습니다.",
        });
    }
});

// ==================================================
// 모빌리티 선택 계획 상세 조회 API
// GET /api/plans/:id
//
// :id 자리에 MongoDB 선택 계획 ID가 들어갑니다.
// 예: /api/plans/6a951787f297206dbe235e6a
// ==================================================
app.get("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        // req.params는 URL 경로의 :id 값을 담은 객체입니다.
        // const id = req.params.id;와 같은 뜻입니다.
        const { id } = req.params;

        // MongoDB ObjectId 형식인지 먼저 확인합니다.
        // 잘못된 문자열로 DB를 조회하는 것을 막습니다.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        // findById()는 _id가 id와 같은 계획 한 개를 찾습니다.
        const plan = await MobilityPlan.findById(id);

        // 해당 _id의 계획이 MongoDB에 없을 때입니다.
        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        // 상세 조회하려는 계획의 소유자와
        // 현재 JWT로 로그인한 사용자가 같은지 확인합니다.
        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 조회할 수 있습니다.",
            });
        }

        // 상세 페이지를 열 때마다 조회수를 1 증가시킵니다.
        plan.views += 1;

        // 변경된 views 값을 MongoDB에 저장합니다.
        await plan.save();

        // 계획 한 개는 객체 {} 형태로 반환합니다.
        return res.status(200).json(plan);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 불러오지 못했습니다.",
        });
    }
});

// ==================================================
// 모빌리티 선택 계획 수정 API
// PATCH /api/plans/:id
//
// 사용자가 전달한 항목만 수정합니다.
// ==================================================
app.patch("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        // URL의 :id 값을 가져옵니다.
        const { id } = req.params;

        // MongoDB ID 형식인지 확인합니다.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        // 수정할 선택 계획 한 개를 찾습니다.
        const plan = await MobilityPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        // JWT의 로그인 사용자와 계획의 소유자가 같은지 확인합니다.
        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 수정할 수 있습니다.",
            });
        }

        // 사용자가 수정할 수 있는 필드 목록입니다.
        // 배열 []인 이유는 여러 필드명을 순서대로 관리하기 위해서입니다.
        const allowedFields = [
            "title",
            "purpose",
            "budget",
            "passengers",
            "drivingPattern",
            "parkingEnvironment",
            "chargingEnvironment",
            "preferredUsageType",
            "priorities",
            "notes",
        ];

        // 실제 수정할 데이터만 담을 빈 객체입니다.
        const updates = {};

        // 허용된 필드만 req.body에서 꺼내 updates에 담습니다.
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // 수정할 값이 하나도 없으면 요청을 거절합니다.
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                msg: "수정할 선택 계획 정보를 입력해주세요.",
            });
        }

        // 수정 요청에 title이 포함됐다면 빈 제목은 허용하지 않습니다.
        if (updates.title !== undefined && !updates.title?.trim()) {
            return res.status(400).json({
                msg: "선택 계획 제목은 비워둘 수 없습니다.",
            });
        }

        // 수정 요청에 purpose가 포함됐다면 빈 값은 허용하지 않습니다.
        if (updates.purpose !== undefined && !updates.purpose?.trim()) {
            return res.status(400).json({
                msg: "차량 이용 목적은 비워둘 수 없습니다.",
            });
        }

        // 수정 요청에 budget이 포함됐다면 숫자·0 이상인지 확인합니다.
        if (
            updates.budget !== undefined &&
            (typeof updates.budget !== "number" || updates.budget < 0)
        ) {
            return res.status(400).json({
                msg: "예산은 0 이상의 숫자로 입력해주세요.",
            });
        }

        // priorities가 포함됐다면 배열인지 확인합니다.
        if (
            updates.priorities !== undefined &&
            !Array.isArray(updates.priorities)
        ) {
            return res.status(400).json({
                msg: "중요 조건은 배열 형태로 입력해주세요.",
            });
        }

        // 기존 plan 객체에 허용된 수정값만 덮어씁니다.
        Object.assign(plan, updates);

        // MongoDB에 저장합니다.
        // timestamps: true 때문에 updatedAt도 자동 변경됩니다.
        await plan.save();

        return res.status(200).json(plan);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 수정하지 못했습니다.",
        });
    }
});

// ==================================================
// 모빌리티 선택 계획 삭제 API
// DELETE /api/plans/:id
//
// 로그인한 사용자 본인이 만든 계획만 삭제할 수 있습니다.
// ==================================================
app.delete("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        // URL의 :id 값을 가져옵니다.
        const { id } = req.params;

        // MongoDB ObjectId 형식인지 확인합니다.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        // 삭제할 선택 계획 한 개를 찾습니다.
        const plan = await MobilityPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        // 로그인한 사용자와 계획 소유자가 같은지 확인합니다.
        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 삭제할 수 있습니다.",
            });
        }

        // 현재 plan 문서 하나를 MongoDB에서 삭제합니다.
        await plan.deleteOne();

        return res.status(200).json({
            msg: "선택 계획이 삭제되었습니다.",
        });
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 삭제하지 못했습니다.",
        });
    }
});

// ==================================================
// 모빌리티 선택 계획 작성
// JWT 토큰이 있는 로그인 사용자만 작성할 수 있습니다.
// 로그인한 사용자가 자신의 차량 선택 조건을 저장합니다.
// ==================================================
app.post("/api/plans", requireAuth, async (req, res) => {
    try {
        // 프론트엔드가 보낸 선택 계획 정보를 가져옵니다.
        const {
            title,
            purpose,
            budget,
            passengers,
            drivingPattern,
            parkingEnvironment,
            chargingEnvironment,
            preferredUsageType,
            priorities,
            notes,
        } = req.body;

        // title과 purpose는 이 서비스에서 반드시 받아야 하는 값
        if (!title?.trim() || !purpose?.trim()) {
            return res.status(400).json({
                msg: "선택 계획 제목과 차량 이용 목적을 입력해주세요.",
            });
        }

        // 예산은 0 이상의 숫자여야 합니다.
        // JSON에서는 3000처럼 따옴표 없이 보내야 Number로 인식됩니다.
        if (typeof budget !== "number" || budget < 0) {
            return res.status(400).json({
                msg: "예산은 0 이상의 숫자로 입력해주세요.",
            });
        }

        // priorities는 여러 우선순위를 담는 배열입니다.
        // 예: ["연비", "주차 편의성"]
        if (priorities !== undefined && !Array.isArray(priorities)) {
            return res.status(400).json({
                msg: "중요 조건은 배열 형태로 입력해주세요.",
            });
        }

        // create()는 Schema 규칙을 확인한 뒤 MongoDB에 새 문서를 저장합니다.
        // req.user는 requireAuth가 JWT에서 꺼내 넣어준 로그인 정보입니다.
        const newPlan = await MobilityPlan.create({
            title,
            purpose,
            budget,
            passengers,
            drivingPattern,
            parkingEnvironment,
            chargingEnvironment,
            preferredUsageType,
            priorities: priorities || [],  // // priorities가 요청에 없으면 빈 배열 []을 저장합니다.
            notes,

            // req.user는 requireAuth가 JWT에서 꺼내 넣은 로그인 사용자 정보입니다.
            // 사용자가 ownerId를 임의로 바꾸지 못하도록 Body가 아닌 JWT를 사용합니다.
            ownerId: req.user.userId,
        });

        return res.status(201).json(newPlan);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 저장하지 못했습니다.",
        });
    }
});


// ==================================================
// 모빌리티 선택 계획 상세 조회
// 본인 계획만 열 수 있으며, 조회수는 1 증가합니다.
// ==================================================
app.get("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        const plan = await MobilityPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        // 로그인한 사용자가 이 계획의 소유자인지 확인합니다.
        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 조회할 수 있습니다.",
            });
        }

        // 상세 페이지를 열 때마다 조회수를 증가시킵니다.
        plan.views += 1;
        await plan.save();

        return res.status(200).json(plan);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 불러오지 못했습니다.",
        });
    }
});


// ==================================================
// 모빌리티 선택 계획 수정
// 전달한 항목만 수정하는 실제 PATCH 방식입니다.
// ==================================================
app.patch("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        const plan = await MobilityPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 수정할 수 있습니다.",
            });
        }

        // 수정할 수 있는 필드만 허용합니다.
        // ownerId와 views는 요청 Body로 수정할 수 없게 막습니다.
        const allowedFields = [
            "title",
            "purpose",
            "budget",
            "passengers",
            "drivingPattern",
            "parkingEnvironment",
            "chargingEnvironment",
            "preferredUsageType",
            "priorities",
            "notes",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                msg: "수정할 선택 계획 정보를 입력해주세요.",
            });
        }

        if (updates.title !== undefined && !updates.title?.trim()) {
            return res.status(400).json({
                msg: "선택 계획 제목은 비워둘 수 없습니다.",
            });
        }

        if (updates.purpose !== undefined && !updates.purpose?.trim()) {
            return res.status(400).json({
                msg: "차량 이용 목적은 비워둘 수 없습니다.",
            });
        }

        if (
            updates.budget !== undefined &&
            (typeof updates.budget !== "number" || updates.budget < 0)
        ) {
            return res.status(400).json({
                msg: "예산은 0 이상의 숫자로 입력해주세요.",
            });
        }

        if (
            updates.priorities !== undefined &&
            !Array.isArray(updates.priorities)
        ) {
            return res.status(400).json({
                msg: "중요 조건은 배열 형태로 입력해주세요.",
            });
        }

        // 허용된 수정 값만 기존 선택 계획에 반영합니다.
        Object.assign(plan, updates);

        // timestamps: true 설정으로 updatedAt도 자동 변경됩니다.
        await plan.save();

        return res.status(200).json(plan);
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 수정하지 못했습니다.",
        });
    }
});


// ==================================================
// 모빌리티 선택 계획 삭제
// 로그인한 소유자 본인만 삭제할 수 있습니다.
// ==================================================
app.delete("/api/plans/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: "올바르지 않은 선택 계획 ID입니다.",
            });
        }

        const plan = await MobilityPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                msg: "선택 계획을 찾을 수 없습니다.",
            });
        }

        if (plan.ownerId.toString() !== String(req.user.userId)) {
            return res.status(403).json({
                msg: "본인의 선택 계획만 삭제할 수 있습니다.",
            });
        }

        await plan.deleteOne();

        return res.status(200).json({
            msg: "선택 계획이 삭제되었습니다.",
        });
    } catch (error) {
        return res.status(500).json({
            msg: "선택 계획을 삭제하지 못했습니다.",
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