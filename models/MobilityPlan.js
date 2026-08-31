// MongoDB에 어떤 형태의 데이터를 저장할 지" 정의하는 파일
// Express가 요청 데이터 받음
// -> MobilityPlan 모델이 데이터를 저장하려고 함
// -> mobilityPlanSchema가 데이터 형식을 검사함
// -> MongoDB에 저장

// 1. Node.js의 CommonJS 문법입니다.
// "mongoose" 패키지를 가져와 mongoose라는 변수에 저장합니다.
const mongoose = require("mongoose");
// Mongoose의 Schema를 사용하면 "제목 필수", "예산은 숫자" 등과 같은 규칙을 서버에 적용할 수 있음
const mobilityPlanSchema = new mongoose.Schema(
    {
        // 사용자가 저장하는 선택 계획 이름
        // 예: "서울 출퇴근용 첫 차 선택 계획"
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // 차량이 필요한 이유
        // 예: "출퇴근 및 주말 근거리 이동"
        purpose: {
            type: String,
            required: true,
            trim: true,
        },

        // 예산 상한선: 만 원 단위
        // 숫자만 저장하며, 이 서비스에서는 만 원 단위로 사용합니다.
        budget: {
            type: Number,
            required: true,
            min: 0,
        },

        // 평소 탑승 인원
        // 예: 1, 2, 4
        passengers: {
            type: Number,
            min: 1,
        },

        // 평소 주행 패턴
        // 예: "평일 왕복 30km 출퇴근, 월 1회 장거리 여행"
        drivingPattern: {
            type: String,
            trim: true,
        },

        // 주차 환경
        // 예: "아파트 지하주차장", "기계식 주차장"
        parkingEnvironment: {
            type: String,
            trim: true,
        },

        // 주차 환경
        // 예: "아파트 지하주차장", "기계식 주차장"
        chargingEnvironment: {
            type: String,
            trim: true,
        },

        // 선호하는 차량 이용 방식
        // 예: "신차", "인증중고차", "리스", "렌트", "구독"
        preferredUsageType: {
            type: String,
            trim: true,
        },

        // 중요하게 생각하는 조건을 여러 개 저장하는 배열
        // [String]은 "문자열 여러 개를 담는 배열"이라는 Mongoose 문법입니다.
        // 예: ["연비", "주차 편의성", "적재공간"]
        priorities: {
            type: [String],
            default: [],
        },

        // 위 항목에 담기지 않는 추가 메모
        notes: {
            type: String,
            trim: true,
        },

        // 이 선택 계획을 만든 사용자의 MongoDB _id
        // ownerId는 우리가 정한 필드 이름입니다.
        ownerId: {
            // mongoose.Schema.Types.ObjectId는 Mongoose가 제공하는 ID 타입
            type: mongoose.Schema.Types.ObjectId,
            // "User" 모델의 데이터를 참조한다는 뜻
            // User.js의 mongoose.model("User", userSchema)와 이름이 같아야 함
            ref: "User",
            required: true,
        },

        // 상세 화면 조회 수
        views: {
            type: Number,
            default: 0,
        },
    },

    // 3. Schema의 두 번째 설정 객체입니다.
    {
        // createdAt, updatedAt을 Mongoose가 자동 생성·관리
        timestamps: true,
        // MongoDB의 __v 필드는 이번 프로젝트에서 사용하지 않으므로 숨김
        versionKey: false,
    },
);

// 4. mongoose.model()은 Schema를 실제로 MongoDB에 저장·조회할 수 있는 "모델"로 바꿈
module.exports = mongoose.model("MobilityPlan", mobilityPlanSchema);