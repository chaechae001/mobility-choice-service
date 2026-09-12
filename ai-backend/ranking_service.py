# 차량 한 대와 사용자 조건을 입력하면, 점수와 추천 이유를 계산하는 함수

def is_within_budget(vehicle, preference):
    # MongoDB의 priceFrom은 원 단위
    vehicle_price = vehicle.get("priceFrom")

    # 가격 정보가 없으면 이번 단계에서는 추천 후보에서 제외
    if vehicle_price is None:
        return False

    # 프론트엔드 예산은 만 원 단위이므로 원 단위로 변환
    min_price = preference["minBudget"] * 10000
    max_price = preference["maxBudget"] * 10000

    # 차량 시작 가격이 사용자 예산 범위 안에 있는지 반환
    return min_price <= vehicle_price <= max_price


def score_vehicle(vehicle, preference):
    # 차량 한 대의 추천 점수와 추천 이유를 계산
    score = 0
    reasons = []

    # 예산을 통과한 차량만 이 함수로 들어옴
    score += 3
    reasons.append("예산 적합")

    # 사용자가 선호 차종을 선택한 경우에만 점수를 추가
    selected_body_types = preference.get("bodyTypes", [])
    if selected_body_types and vehicle.get("bodyType") in selected_body_types:
        score += 2
        reasons.append("선호 차종 일치")

    # 동력 방식은 '마일드 하이브리드'처럼 추가 단어가 있을 수 있으므로
    # 완전 일치 대신 포함 여부를 확인
    selected_powertrains = preference.get("powertrains", [])
    vehicle_powertrain = vehicle.get("powertrain", "")

    if selected_powertrains and any(
        selected in vehicle_powertrain
        for selected in selected_powertrains
    ):
        score += 2
        reasons.append("동력 방식 일치")

    # 국산·수입 선호를 확인
    selected_origins = preference.get("origins", [])
    if selected_origins and vehicle.get("origin") in selected_origins:
        score += 1
        reasons.append("국산·수입 선택 일치")

    # 원본 vehicle 딕셔너리를 직접 수정하지 않도록 복사
    result = vehicle.copy()

    # 계산 결과를 복사본에 추가
    result["score"] = score
    result["reasons"] = reasons

    return result


def rank_vehicles(vehicles, preference):
    # 1. 예산에 맞는 차량만 남김
    budget_vehicles = [
        vehicle
        for vehicle in vehicles
        if is_within_budget(vehicle, preference)
    ]

    # 2. 각 차량의 점수와 이유를 계산
    scored_vehicles = [
        score_vehicle(vehicle, preference)
        for vehicle in budget_vehicles
    ]

    # 3. score가 큰 차량이 앞에 오도록 정렬
    return sorted(
        scored_vehicles,
        key=lambda vehicle: vehicle["score"],
        reverse=True,
    )