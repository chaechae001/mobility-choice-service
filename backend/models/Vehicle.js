const mongoose = require("mongoose");

// Vehicle
// → 서비스에 보여줄 실제 차량의 기본 정보를 저장하는 MongoDB 모델입니다.
const vehicleSchema = new mongoose.Schema(
    {
        // URL에 사용하는 고유한 차량 이름입니다.
        // 예: /vehicles/kia-ev3
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        brand: {
            type: String,
            required: true,
            trim: true,
        },

        model: {
            type: String,
            required: true,
            trim: true,
        },

        // 국산 / 수입
        origin: {
            type: String,
            required: true,
            enum: ["국산", "수입"],
        },

        // 세단 / SUV
        bodyType: {
            type: String,
            required: true,
            enum: ["세단", "SUV"],
        },

        // 가솔린 / 하이브리드 / 전기 / 마일드 하이브리드
        powertrain: {
            type: String,
            required: true,
        },

        seats: {
            type: Number,
            required: true,
        },

        // 가격은 원 단위로 저장합니다.
        priceFrom: {
            type: Number,
            required: true,
        },

        priceTo: {
            type: Number,
            default: null,
        },

        // 예: “2026년형 Plus 기준”
        priceNote: {
            type: String,
            trim: true,
        },

        // 제조사 공식 페이지에서 확인한 제원입니다.
        specifications: [
            {
                label: String,
                value: String,
            },
        ],

        // 공식 이미지 URL이 확인된 차량만 넣습니다.
        // 이미지가 없는 차량에는 가짜 이미지를 넣지 않습니다.
        imageUrl: {
            type: String,
            default: "",
        },

        sourceUrl: {
            type: String,
            required: true,
        },

        sourceCheckedAt: {
            type: Date,
            required: true,
        },
        // 제조사가 제공하는 기능을 서비스의 공통 분류로 저장합니다.
        // 실제 적용 여부는 트림과 선택 옵션에 따라 달라질 수 있습니다.
        features: {
            type: [String],
            default: [],
        },

        featureNote: {
            type: String,
            default: "트림과 선택 사양에 따라 적용 여부가 달라질 수 있습니다.",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);