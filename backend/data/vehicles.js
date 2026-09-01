const sourceCheckedAt = new Date("2026-08-31");

/*
 * 제조사 공식 웹사이트에서 제공하는 차량 이미지 주소입니다.
 *
 * imageUrl
 * → 프론트엔드의 차량 목록·상세 페이지에서 <img> 태그로 바로 불러옵니다.
 *
 * sourceUrl
 * → 각 차량 객체에 이미 있는 공식 정보 페이지 주소입니다.
 * → 이미지 주소와 정보 출처를 분리해서 관리합니다.
 */
const vehicleImages = {
    "hyundai-avante-hybrid": "/vehicles/hyundai-avante-hybrid.png",
    "hyundai-tucson-hybrid": "/vehicles/hyundai-tucson-hybrid.png",
    "kia-ev3": "/vehicles/kia-ev3.png",
    "kia-sorento": "/vehicles/kia-sorento.png",
    "tesla-model-3": "/vehicles/tesla-model-3.jpg",
    "toyota-camry": "/vehicles/toyota-camry.webp",
    "volvo-xc60": "/vehicles/volvo-xc60.png",
    "bmw-520i": "/vehicles/bmw-520i.webp",
    "mercedes-e200-exclusive": "/vehicles/mercedes-e200-exclusive.jpg",
};

module.exports = [
    {
        slug: "hyundai-avante-hybrid",
        brand: "현대",
        model: "디 올 뉴 아반떼 Hybrid",
        origin: "국산",
        bodyType: "세단",
        powertrain: "하이브리드",
        seats: 5,
        priceFrom: 30420000,
        priceTo: null,
        priceNote: "하이브리드 익스클루시브 기준",
        specifications: [
            { label: "차종", value: "준중형 세단" },
            { label: "파워트레인", value: "하이브리드" },
            { label: "탑승 인원", value: "5인승" },
        ],
        sourceUrl:
            "https://www.hyundai.com/kr/ko/e/vehicles/the-all-new-avante-hybrid/price",
        features: [],
        sourceCheckedAt,
    },
    {
        slug: "hyundai-tucson-hybrid",
        brand: "현대",
        model: "투싼 Hybrid",
        origin: "국산",
        bodyType: "SUV",
        powertrain: "하이브리드",
        seats: 5,
        priceFrom: 33180000,
        priceTo: null,
        priceNote: "하이브리드 2WD 모던 기준",
        specifications: [
            { label: "차종", value: "중형 SUV" },
            { label: "파워트레인", value: "하이브리드" },
            { label: "탑승 인원", value: "5인승" },
        ],
        sourceUrl:
            "https://www.hyundai.com/kr/ko/e/vehicles/tucson-hybrid/price",
        features: [],
        sourceCheckedAt,
    },
    {
        slug: "kia-ev3",
        brand: "기아",
        model: "The 2026 EV3",
        origin: "국산",
        bodyType: "SUV",
        powertrain: "전기",
        seats: 5,
        priceFrom: 39950000,
        priceTo: null,
        priceNote: "에어 스탠다드, 세제혜택 후 기준",
        specifications: [
            { label: "차종", value: "소형 전기 SUV" },
            { label: "주행 가능 거리", value: "최대 501km" },
            { label: "탑승 인원", value: "5인승" },
        ],
        imageUrl:
            "https://www.kia.com/content/dam/kwp/kr/ko/vehicles/sorento/27my/sorento_feature_bg_pc.jpg",
        sourceUrl: "https://www.kia.com/kr/vehicles/ev3/price",
        features: [
            "서라운드 뷰",
            "주차 보조",
            "주행 보조",
            "헤드업 디스플레이",
            "통풍 시트",
            "파노라마 선루프",
            "무선 충전",
            "V2L",
        ],
        featureNote:
            "EV3의 트림 및 선택 사양에 따라 적용 여부가 달라집니다.",
        sourceCheckedAt,
    },
    {
        slug: "kia-sorento",
        brand: "기아",
        model: "The 2027 Sorento",
        origin: "국산",
        bodyType: "SUV",
        powertrain: "가솔린",
        seats: 5,
        priceFrom: 36410000,
        priceTo: null,
        priceNote: "2.5 가솔린 터보 프레스티지 5인승 기준",
        specifications: [
            { label: "차종", value: "중형 SUV" },
            { label: "파워트레인", value: "2.5 가솔린 터보" },
            { label: "탑승 인원", value: "5·6·7인승 선택 가능" },
        ],
        imageUrl:
            "https://www.kia.com/content/dam/kwp/kr/ko/vehicles/sorento/27my/sorento_feature_bg_pc.jpg",
        sourceUrl: "https://www.kia.com/kr/vehicles/sorento/price",
        features: [
            "서라운드 뷰",
            "주차 보조",
            "주행 보조",
            "통풍 시트",
            "파노라마 선루프",
            "무선 충전",
        ],
        sourceCheckedAt,
    },
    {
        slug: "tesla-model-3",
        brand: "Tesla",
        model: "Model 3",
        origin: "수입",
        bodyType: "세단",
        powertrain: "전기",
        seats: 5,
        priceFrom: 46990000,
        priceTo: 69990000,
        priceNote: "RWD~AWD 트림 기준",
        specifications: [
            { label: "차종", value: "중형 전기 세단" },
            { label: "구동 방식", value: "후륜 또는 AWD" },
            { label: "탑승 인원", value: "5인승" },
        ],
        sourceUrl: "https://www.tesla.com/ko_KR/model3/design",
        features: [
            "주행 보조",
            "무선 충전",
            "파노라마 선루프",
        ],
        sourceCheckedAt,
    },
    {
        slug: "toyota-camry",
        brand: "Toyota",
        model: "Camry XLE",
        origin: "수입",
        bodyType: "세단",
        powertrain: "하이브리드",
        seats: 5,
        priceFrom: 48430000,
        priceTo: 54030000,
        priceNote: "XLE~XLE Premium 기준",
        specifications: [
            { label: "복합 연비", value: "17.1km/ℓ" },
            { label: "시스템 총 출력", value: "227PS" },
            { label: "전장", value: "4,920mm" },
        ],
        imageUrl:
            "https://toyota.co.kr/assets/img/model/camry/models-camry-kv.webp",
        sourceUrl: "https://toyota.co.kr/models/camry/",
        features: [
            "서라운드 뷰",
            "헤드업 디스플레이",
            "파노라마 선루프",
        ],
        sourceCheckedAt,
    },
    {
        slug: "volvo-xc60",
        brand: "Volvo",
        model: "XC60 Plus",
        origin: "수입",
        bodyType: "SUV",
        powertrain: "마일드 하이브리드",
        seats: 5,
        priceFrom: 65700000,
        priceTo: 73300000,
        priceNote: "2026년형 Plus~Ultra 기준",
        specifications: [
            { label: "최대 출력", value: "250ps" },
            { label: "트렁크 용량", value: "483ℓ" },
            { label: "탑승 인원", value: "5인승" },
        ],
        imageUrl:
            "https://wizz.volvocars.com/images/2026/246/exterior/studio/threeQuartersFrontLeft/transparent_exterior-studio-threeQuartersFrontLeft_7A2F227900263179ACEEE5BD15FA9848FD7B557C.png?bg=fafafa&client=pdps&w=3840",
        sourceUrl: "https://www.volvocars.com/kr/cars/xc60/",
        features: [
            "주행 보조",
            "파노라마 선루프",
        ],
        sourceCheckedAt,
    },
    {
        slug: "bmw-520i",
        brand: "BMW",
        model: "520i",
        origin: "수입",
        bodyType: "세단",
        powertrain: "가솔린",
        seats: 5,
        priceFrom: 70700000,
        priceTo: null,
        priceNote: "2026년 8월 프로모션 페이지 차량가격 기준",
        specifications: [
            { label: "최고 출력", value: "190마력" },
            { label: "최대 토크", value: "31.6kg·m" },
            { label: "파워트레인", value: "48V 마일드 하이브리드 기술 적용" },
        ],
        sourceUrl:
            "https://www.bmw.co.kr/ko/finance/special-offer/financial-promotion/5-series-promotion.html",
        features: [],
        sourceCheckedAt,
    },
    {
        slug: "mercedes-e200-exclusive",
        brand: "Mercedes-Benz",
        model: "E 200 Exclusive",
        origin: "수입",
        bodyType: "세단",
        powertrain: "가솔린 하이브리드",
        seats: 5,
        priceFrom: 76600000,
        priceTo: null,
        priceNote: "2026년 4월 출시 가격 기준",
        specifications: [
            { label: "출력", value: "204ps" },
            { label: "전장", value: "4,955mm" },
            { label: "전폭", value: "1,880mm" },
        ],
        sourceUrl:
            "https://www.mercedes-benz.co.kr/passengercars/brand/news-events/news-story/2026/news-20260424.html",
        features: [],
        sourceCheckedAt,
    },
].map((vehicle) => ({
    ...vehicle,
    imageUrl: vehicleImages[vehicle.slug] || "",
}));