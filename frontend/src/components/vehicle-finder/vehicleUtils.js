import {
    BUDGET_MAX,
    BUDGET_MIN,
    formatBudget,
} from "./filterData";

const DOMESTIC_BRANDS = [
    "현대",
    "기아",
    "제네시스",
    "르노코리아",
    "KGM",
    "KG모빌리티",
    "쉐보레",
];

export function readArray(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string" && value.trim()) {
        return [value];
    }

    return [];
}

export function extractVehicles(responseBody) {
    if (Array.isArray(responseBody)) return responseBody;
    if (Array.isArray(responseBody?.vehicles)) return responseBody.vehicles;
    if (Array.isArray(responseBody?.data)) return responseBody.data;
    if (Array.isArray(responseBody?.data?.vehicles)) {
        return responseBody.data.vehicles;
    }

    return [];
}

export function textIncludes(source, keyword) {
    return String(source ?? "")
        .toLowerCase()
        .includes(String(keyword).toLowerCase());
}

export function getVehicleId(vehicle) {
    return vehicle.slug ?? vehicle._id;
}

export function getVehicleName(vehicle) {
    return vehicle.model ?? vehicle.modelName ?? vehicle.name ?? "차량명 확인 중";
}

export function getVehiclePrice(vehicle) {
    const value =
        vehicle.startingPrice ??
        vehicle.price ??
        vehicle.priceFrom ??
        vehicle.basePrice;

    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
}

export function getVehicleOrigin(vehicle) {
    if (vehicle.origin) return vehicle.origin;

    return DOMESTIC_BRANDS.includes(vehicle.brand) ? "국산" : "수입";
}

export function formatPrice(price) {
    if (price === null) return "가격 정보 확인 중";

    return `${(price / 10000).toLocaleString("ko-KR")}만 원부터`;
}

function getBudgetRange(filters) {
    const minBudget = Number(filters.minBudget);
    const maxBudget = Number(filters.maxBudget);

    return {
        min: Number.isFinite(minBudget) ? minBudget * 10000 : BUDGET_MIN * 10000,
        max: Number.isFinite(maxBudget) ? maxBudget * 10000 : BUDGET_MAX * 10000,
    };
}

export function isWithinBudget(vehicle, filters) {
    const price = getVehiclePrice(vehicle);
    const budget = getBudgetRange(filters);

    return price === null || (price >= budget.min && price <= budget.max);
}

function hasDrivingAssist(features) {
    return features.some((feature) => textIncludes(feature, "주행 보조"));
}

function getLifestyleReason(vehicle, lifestyle) {
    const bodyType = vehicle.bodyType ?? "";
    const powertrain = vehicle.powertrain ?? "";
    const seats = Number(vehicle.seats ?? 0);

    if (
        lifestyle === "출퇴근" &&
        (bodyType === "세단" ||
            textIncludes(powertrain, "전기") ||
            textIncludes(powertrain, "하이브리드"))
    ) {
        return "출퇴근 적합";
    }

    if (lifestyle === "가족 이동" && bodyType === "SUV" && seats >= 5) {
        return "가족 이동 적합";
    }

    if (
        lifestyle === "장거리" &&
        (bodyType === "SUV" || textIncludes(powertrain, "하이브리드"))
    ) {
        return "장거리 이동 적합";
    }

    if (
        lifestyle === "도심 주행" &&
        (bodyType === "세단" ||
            textIncludes(powertrain, "전기") ||
            textIncludes(powertrain, "하이브리드"))
    ) {
        return "도심 주행 적합";
    }

    if (lifestyle === "여행·레저" && bodyType === "SUV") {
        return "여행·레저 적합";
    }

    if (lifestyle === "반려동물" && bodyType === "SUV" && seats >= 5) {
        return "반려동물 동반 적합";
    }

    return null;
}

export function getRecommendationReasons(vehicle, filters) {
    const reasons = [];
    const bodyType = vehicle.bodyType ?? vehicle.category ?? "";
    const powertrain =
        vehicle.powertrain ?? vehicle.fuelType ?? vehicle.engineType ?? "";
    const features = readArray(
        vehicle.features ?? vehicle.options ?? vehicle.mainFeatures
    );
    const seats = Number(vehicle.seats ?? 0);

    if (isWithinBudget(vehicle, filters)) {
        reasons.push("예산 적합");
    }

    for (const lifestyle of filters.lifestyles) {
        const reason = getLifestyleReason(vehicle, lifestyle);

        if (reason) {
            reasons.push(reason);
            break;
        }
    }

    if (filters.bodyTypes.some((item) => textIncludes(bodyType, item))) {
        reasons.push("선호 차종 일치");
    }

    if (filters.powertrains.some((item) => textIncludes(powertrain, item))) {
        reasons.push("동력 방식 일치");
    }

    if (
        filters.features.some((selectedFeature) => {
            if (
                selectedFeature === "어댑티브 크루즈 컨트롤" ||
                selectedFeature === "차로 유지 보조"
            ) {
                return hasDrivingAssist(features);
            }

            return features.some((feature) =>
                textIncludes(feature, selectedFeature)
            );
        })
    ) {
        reasons.push("희망 옵션 포함");
    }

    if (filters.origins.includes(getVehicleOrigin(vehicle))) {
        reasons.push(`${getVehicleOrigin(vehicle)}차 선택`);
    }

    if (filters.priorities.includes("가격") && isWithinBudget(vehicle, filters)) {
        reasons.push("가격 우선 반영");
    }

    if (
        filters.priorities.includes("공간") &&
        (bodyType === "SUV" || seats >= 5)
    ) {
        reasons.push("공간 우선 반영");
    }

    if (filters.priorities.includes("안전") && hasDrivingAssist(features)) {
        reasons.push("주행 보조 기능");
    }

    if (
        filters.priorities.includes("주차 편의") &&
        features.some((feature) => textIncludes(feature, "주차 보조"))
    ) {
        reasons.push("주차 편의 기능");
    }

    return [...new Set(reasons)];
}

export function getSelectedConditionChips(filters, filterGroups) {
    const chips = [];

    if (
        filters.minBudget !== BUDGET_MIN ||
        filters.maxBudget !== BUDGET_MAX
    ) {
        chips.push(
            `${formatBudget(filters.minBudget)} ~ ${formatBudget(filters.maxBudget)}`
        );
    }

    filterGroups.forEach((group) => {
        filters[group.key].forEach((item) => chips.push(item));
    });

    return chips;
}