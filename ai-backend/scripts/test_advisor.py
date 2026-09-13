from advisor_service import create_advice

# FastAPI, Express 없이 모델 설명 생성만 확인하는 샘플 데이터
sample_preference = {
    "minBudget": 3000,
    "maxBudget": 5000,
    "lifestyles": ["출퇴근", "가족 이동"],
    "bodyTypes": ["SUV"],
    "powertrains": ["하이브리드"],
    "priorities": ["가격", "공간"],
}

sample_recommendations = [
    {
        "name": "기아 쏘렌토 하이브리드",
        "score": 92,
        "reasons": ["예산 범위 충족", "SUV", "하이브리드", "가족 이동"],
    },
    {
        "name": "현대 싼타페 하이브리드",
        "score": 88,
        "reasons": ["SUV", "하이브리드", "넓은 실내 공간"],
    },
]

# create_advice()가 문자열을 반환하는지 확인합니다.
advice = create_advice(
    sample_preference,
    sample_recommendations,
)

print(advice)