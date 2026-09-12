# 실제 서버를 부르지 않고, 작은 예시 데이터로 점수 계산만 검증

# ranking_service.py의 정렬 함수를 가져옴
from ranking_service import rank_vehicles


# 테스트를 위한 사용자 조건
PREFERENCE = {
    "minBudget": 3000,
    "maxBudget": 5000,
    "bodyTypes": ["SUV"],
    "powertrains": ["하이브리드"],
    "origins": ["국산"],
}


# 테스트를 위한 차량 데이터 3대
# 실제 MongoDB 차량 데이터와 같은 필드 이름을 사용
VEHICLES = [
    {
        "brand": "현대",
        "model": "투싼 하이브리드",
        "origin": "국산",
        "bodyType": "SUV",
        "powertrain": "하이브리드",
        "priceFrom": 32000000,
    },
    {
        "brand": "현대",
        "model": "아반떼 하이브리드",
        "origin": "국산",
        "bodyType": "세단",
        "powertrain": "하이브리드",
        "priceFrom": 28000000,
    },
    {
        "brand": "수입 브랜드",
        "model": "전기 SUV",
        "origin": "수입",
        "bodyType": "SUV",
        "powertrain": "전기",
        "priceFrom": 55000000,
    },
]


# 점수를 계산하고 높은 점수 순서로 정렬
ranked_vehicles = rank_vehicles(VEHICLES, PREFERENCE)


# 결과를 한 줄씩 출력
for vehicle in ranked_vehicles:
    print(
        f"{vehicle['model']} | "
        f"{vehicle['score']}점 | "
        f"{', '.join(vehicle['reasons'])}"
    )