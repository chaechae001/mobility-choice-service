export const BUDGET_MIN = 2000;
export const BUDGET_MAX = 15000;
export const BUDGET_STEP = 500;

export const FILTER_GROUPS = [
    {
        key: "lifestyles",
        title: "주로 어떻게 이용하나요?",
        description: "여러 항목을 선택할 수 있어요.",
        options: [
            { label: "출퇴근", icon: "🚇" },
            { label: "가족 이동", icon: "👨‍👩‍👧" },
            { label: "장거리", icon: "🛣️" },
            { label: "도심 주행", icon: "🌆" },
            { label: "여행·레저", icon: "🏕️" },
            { label: "반려동물", icon: "🐾" },
        ],
    },
    {
        key: "bodyTypes",
        title: "선호하는 차종이 있나요?",
        description: "정해지지 않았다면 선택하지 않아도 됩니다.",
        options: [
            { label: "세단", icon: "🚘" },
            { label: "SUV", icon: "🚙" },
            { label: "해치백", icon: "🚗" },
            { label: "MPV", icon: "🚐" },
            { label: "쿠페", icon: "🏎️" },
        ],
    },
    {
        key: "powertrains",
        title: "어떤 동력 방식을 원하나요?",
        description: "비교하고 싶은 방식을 모두 선택하세요.",
        options: [
            { label: "가솔린", icon: "⛽" },
            { label: "디젤", icon: "🚚" },
            { label: "하이브리드", icon: "🌿" },
            { label: "전기", icon: "⚡" },
        ],
    },
    {
        key: "priorities",
        title: "차를 고를 때 우선순위는 무엇인가요?",
        description: "중요한 기준을 모두 선택하세요.",
        options: [
            { label: "가격", icon: "💳" },
            { label: "연비", icon: "🌱" },
            { label: "안전", icon: "🛡️" },
            { label: "공간", icon: "🧳" },
            { label: "주차 편의", icon: "🅿️" },
            { label: "디자인", icon: "✨" },
            { label: "주행 성능", icon: "🏁" },
        ],
    },
    {
        key: "features",
        title: "원하는 기능이 있나요?",
        description: "실제로 자주 사용할 기능을 선택해보세요.",
        options: [
            { label: "어댑티브 크루즈 컨트롤", icon: "🛰️" },
            { label: "차로 유지 보조", icon: "🛣️" },
            { label: "헤드업 디스플레이", icon: "🪞" },
            { label: "서라운드 뷰", icon: "👀" },
            { label: "통풍 시트", icon: "💨" },
            { label: "3열 시트", icon: "👨‍👩‍👧" },
        ],
    },
    {
        key: "usageTypes",
        title: "어떤 방식으로 이용할 계획인가요?",
        description: "구매뿐 아니라 리스와 렌트도 함께 비교할 수 있어요.",
        options: [
            { label: "구매", icon: "🛒" },
            { label: "리스", icon: "📄" },
            { label: "렌트", icon: "🔑" },
        ],
    },
    {
        key: "origins",
        title: "브랜드 범위를 선택해주세요.",
        description: "국산차와 수입차를 함께 선택할 수 있어요.",
        options: [
            { label: "국산", icon: "🇰🇷" },
            { label: "수입", icon: "🌍" },
        ],
    },
];

export function createInitialFilters() {
    return {
        lifestyles: [],
        bodyTypes: [],
        powertrains: [],
        priorities: [],
        features: [],
        usageTypes: [],
        origins: [],
        minBudget: BUDGET_MIN,
        maxBudget: BUDGET_MAX,
    };
}

export function formatBudget(value) {
    const budget = Number(value);

    if (budget >= 10000) {
        const remainder = budget % 10000;

        return remainder
            ? `1억 ${remainder.toLocaleString("ko-KR")}만 원`
            : "1억 원";
    }

    return `${budget.toLocaleString("ko-KR")}만 원`;
}