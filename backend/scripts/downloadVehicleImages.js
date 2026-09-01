/*
 * 제조사 공식 이미지 주소에서 차량 이미지를 받아
 * frontend/public/vehicles 폴더에 저장하는 스크립트입니다.
 *
 * 한 번 저장된 이미지는 이후 제조사 서버에 다시 요청하지 않고
 * 내 프로젝트의 localhost:3000/vehicles/... 경로에서 사용합니다.
 */

const fs = require("fs/promises");
const path = require("path");

/*
 * slug
 * → vehicles.js와 MongoDB에서 사용하는 차량의 고유 이름입니다.
 *
 * fileName
 * → frontend/public/vehicles 안에 저장될 파일명입니다.
 *
 * url
 * → 제조사 공식 이미지 서버의 실제 차량 이미지 주소입니다.
 */
const imageSources = [
    {
        slug: "hyundai-avante-hybrid",
        fileName: "hyundai-avante-hybrid.png",
        url:
            "https://www.hyundai.com/contents/repn-car/side-45/avante-hybrid-27fc-45side.png",
    },
    {
        slug: "hyundai-tucson-hybrid",
        fileName: "hyundai-tucson-hybrid.png",
        url:
            "https://www.hyundai.com/contents/repn-car/side-45/tucson-hybrid-26my-45side.png",
    },
    {
        slug: "kia-ev3",
        fileName: "kia-ev3.png",
        url:
            "https://www.kia.com/content/dam/kwp/kr/ko/vehicles/represent/krsv292/ev3_s_ag3.png",
    },
    {
        slug: "kia-sorento",
        fileName: "kia-sorento.png",
        url:
            "https://www.kia.com/content/dam/kwp/kr/ko/vehicles/represent/krmq326/sorento_s_bn4.png",
    },
    {
        slug: "tesla-model-3",
        fileName: "tesla-model-3.jpg",
        url:
            "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Premium-Hero-Localized-Desktop-KR.jpg",
    },
    {
        slug: "toyota-camry",
        fileName: "toyota-camry.webp",
        url:
            "https://toyota.co.kr/assets/img/model/camry/models-camry-kv.webp",
    },
    {
        slug: "volvo-xc60",
        fileName: "volvo-xc60.png",
        url:
            "https://wizz.volvocars.com/images/2026/246/exterior/studio/threeQuartersFrontLeft/transparent_exterior-studio-threeQuartersFrontLeft_7A2F227900263179ACEEE5BD15FA9848FD7B557C.png?bg=fafafa&client=pdps&w=3840",
    },
    {
        slug: "bmw-520i",
        fileName: "bmw-520i.webp",
        url:
            "https://bmw.scene7.com/is/image/BMW/g60_ice_stage_ext-loop-alternative_dsk_sl_de?qlt=80&wid=1024&fmt=webp",
    },
    {
        slug: "mercedes-e200-exclusive",
        fileName: "mercedes-e200-exclusive.jpg",
        url:
            "https://www.mercedes-benz.co.kr/content/dam/hq/passengercars/cars/e-class/e-class-saloon-w214-pi/modeloverview/02-2023/images/mercedes-benz-e-class-w214-modeloverview-696x392-02-2023.jpg",
    },
];

/*
 * backend/scripts 폴더에서 두 단계 위로 올라가면 프로젝트 루트입니다.
 *
 * __dirname
 * → 현재 실행 중인 파일이 있는 폴더 경로입니다.
 */
const outputDirectory = path.join(
    __dirname,
    "../../frontend/public/vehicles"
);

async function downloadImage(image) {
    const response = await fetch(image.url, {
        headers: {
            /*
             * 일부 제조사 서버는 브라우저 요청이 아닌 접근을 제한합니다.
             * 일반 브라우저와 비슷한 User-Agent를 함께 보냅니다.
             */
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        },
    });

    if (!response.ok) {
        throw new Error(
            `${image.slug}: 이미지 요청 실패 (${response.status})`
        );
    }

    // 응답으로 받은 이미지 데이터를 Node.js Buffer 형태로 변환합니다.
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // 저장할 최종 파일 경로입니다.
    const outputPath = path.join(outputDirectory, image.fileName);

    await fs.writeFile(outputPath, imageBuffer);

    console.log(`저장 완료: ${image.fileName}`);
}

async function downloadVehicleImages() {
    try {
        // vehicles 폴더가 없어도 자동으로 생성합니다.
        await fs.mkdir(outputDirectory, {
            recursive: true,
        });

        console.log("공식 차량 이미지 다운로드를 시작합니다.");

        for (const image of imageSources) {
            try {
                await downloadImage(image);
            } catch (error) {
                /*
                 * 한 차량이 실패해도 나머지 차량은 계속 시도합니다.
                 */
                console.error(`다운로드 실패: ${error.message}`);
            }
        }

        console.log("차량 이미지 다운로드가 끝났습니다.");
    } catch (error) {
        console.error("차량 이미지 저장 중 오류가 발생했습니다.");
        console.error(error);
        process.exitCode = 1;
    }
}

downloadVehicleImages();