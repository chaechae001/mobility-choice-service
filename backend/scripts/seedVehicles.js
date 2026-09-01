// path
// → 파일 경로를 안전하게 조합하는 Node.js 기본 모듈입니다.
const path = require("path");

// mongoose
// → MongoDB 연결과 Vehicle 모델 사용을 위한 라이브러리입니다.
const mongoose = require("mongoose");

// backend/.env에 있는 환경변수를 읽습니다.
require("dotenv").config({
    path: path.join(__dirname, "../.env"),
});

// MongoDB의 vehicles 컬렉션과 연결되는 모델입니다.
const Vehicle = require("../models/Vehicle");

// backend/data/vehicles.js에 작성한 차량 배열을 불러옵니다.
const vehicleDataModule = require("../data/vehicles");

/*
 * vehicles.js의 export 방식이 아래 둘 중 어느 것이어도 처리합니다.
 *
 * 1. module.exports = vehicles;
 * 2. module.exports = { vehicles };
 */
const vehicles = Array.isArray(vehicleDataModule)
    ? vehicleDataModule
    : vehicleDataModule.vehicles || vehicleDataModule.default;

// .env에서 MongoDB 연결 주소를 가져옵니다.
// 기존 프로젝트에 MONGO_URI를 사용한 경우도 함께 처리합니다.
const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

// 차량 데이터를 MongoDB에 저장하는 함수입니다.
async function seedVehicles() {
    try {
        // .env에 연결 주소가 없으면 중단합니다.
        if (!mongoUri) {
            throw new Error(
                ".env에서 MONGODB_URI 또는 MONGO_URI를 찾을 수 없습니다."
            );
        }

        // vehicles.js에 차량 데이터가 없으면 중단합니다.
        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            throw new Error(
                "backend/data/vehicles.js에서 차량 배열을 찾을 수 없습니다."
            );
        }

        console.log("MongoDB에 연결 중입니다...");

        // MongoDB 연결은 이 위치에서 한 번만 실행합니다.
        await mongoose.connect(mongoUri);

        console.log("MongoDB 연결 성공");
        console.log("차량을 저장할 DB:", mongoose.connection.name);
        console.log(`등록할 차량 수: ${vehicles.length}대`);

        /*
         * bulkWrite()
         * → 여러 차량을 한 번에 저장합니다.
         *
         * upsert: true
         * → 같은 slug 차량이 있으면 수정하고,
         * → 없으면 새 차량으로 추가합니다.
         */
        const operations = vehicles.map((vehicle, index) => {
            const vehicleName = vehicle.modelName || vehicle.name;

            // 차량을 구분할 slug 또는 브랜드·차량명이 필요합니다.
            if (!vehicle.slug && (!vehicle.brand || !vehicleName)) {
                throw new Error(
                    `${index + 1}번째 차량에 slug 또는 브랜드·차량명이 없습니다.`
                );
            }

            // slug가 있으면 slug를 기준으로 같은 차량인지 찾습니다.
            const filter = vehicle.slug
                ? { slug: vehicle.slug }
                : {
                    brand: vehicle.brand,
                    $or: [
                        { modelName: vehicleName },
                        { name: vehicleName },
                    ],
                };

            return {
                updateOne: {
                    filter,
                    update: {
                        $set: vehicle,
                    },
                    upsert: true,
                },
            };
        });

        const result = await Vehicle.bulkWrite(operations);

        // 저장 후 실제 vehicles 컬렉션의 전체 문서 수를 확인합니다.
        const totalCount = await Vehicle.countDocuments();

        console.log("차량 데이터 저장 완료");
        console.log(`새로 추가된 차량: ${result.upsertedCount}대`);
        console.log(`수정된 차량: ${result.modifiedCount}대`);
        console.log(`현재 vehicles 전체 차량: ${totalCount}대`);
    } catch (error) {
        console.error("차량 데이터 등록 실패");
        console.error(error);
        process.exitCode = 1;
    } finally {
        // 작업 완료 후 MongoDB 연결을 종료합니다.
        await mongoose.disconnect();
        console.log("MongoDB 연결 종료");
    }
}

// 함수 실행
seedVehicles();