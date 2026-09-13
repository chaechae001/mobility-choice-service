# FastAPI 클래스 가져옴
from fastapi import FastAPI, Header, HTTPException
from ranking_service import rank_vehicles

from vehicle_client import get_vehicles
# schemas.py에 만든 요청 형식을 가져옴
from schemas import PreferenceRequest
from advisor_service import create_advice
from starlette.concurrency import run_in_threadpool

# FastAPI 서버 애플리케이션 생성
# title : Swagger문서 화면에 표시됨
app = FastAPI(title="Mobility Choice AI API")


# def 함수이름(매개변수이름: 자료형):
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Mobility Choice AI API is running",
    }

# 사용자가 선택한 차량 조건을 검증하는 임시 API
# 아직 차량 추천 점수 계산 안함
@app.post("/api/preferences/preview")
# preference: 검증이 끝난 사용자 조건을 담는 변수 이름
# PreferenceRequest : 이 변수는 PreferenceRequest 형식이어함
def preview_preference(preference: PreferenceRequest):
    # model_dump()는 Pydantic 객체를 일반 딕셔너리로 바꿈
    # return preference
    return {
        "message" : "차량 조건 검증이 완료되었습니다.",
        "preference" : preference.model_dump()
    }

# FastAPI가 받은 JWT로 Express 차량 목록을 요청하는 확인용 API
@app.get("/api/vehicles/preview")
async def preview_vehicles(authorization: str | None = Header(default=None)):
    # Authorization 헤더가 없다면, Express에 요청하지 않음
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail= "Authorization 헤더가 필요합니다."
        )

    # 실제 Express 차량 API를 호출
    vehicles = await get_vehicles(authorization)

    # 추천 전 단계이므로, 차량 개수와 원본 데이터를 그대로 반환
    return {
        "count": len(vehicles),
        "vehicles": vehicles
    }

# 실제 차량 데이터와 사용자 조건을 비교해 상위 3대를 반환
@app.post("/api/recommendations/preview")
async def preview_recommendations(
        preference: PreferenceRequest,
        authorization: str | None = Header(default=None)
):
    # Express 차량 API는 JWT 인증이 필요
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization 헤더가 필요합니다."
        )

    # 1. Express와 MongoDB에서 실제 차량 목록을 가져옴
    vehicles = await get_vehicles(authorization)

    # 2. Pydantic 객체 -> 일반 딕셔너리로 변환
    # ranking_service는 preference["minBudget"]처럼 딕셔너리 문법을 사용
    preference_data = preference.model_dump()

    # 3. 예산 필터와 조건별 점수를 계산해 높은 점수 순으로 정렬
    ranked_vehicles = rank_vehicles(
        vehicles, 
        preference_data
    )

    # 4. 상위 3대만 추천 결과로 반환
    recommendations = ranked_vehicles[:3]
    # 조건에 맞는 차량이 없으면 모델 호출 없이 안내 메시지를 반환
    if not recommendations:
        return {
            "totalCandidates": 0,
            "recommendations": [],
            "advice": "현재 조건에 맞는 차량을 찾지 못했습니다. 예산, 차종 또는 동력원을 조금 넓혀 다시 선택해 주세요.",
        }

    # 5. 동기 invoke() 호출을 별도 스레드에서 실행
    # 모델이 답변을 만드는 동안 FastAPI 이벤트 루프가 오래 막히지 않음
    advice = await run_in_threadpool(
        create_advice,
        preference_data,
        recommendations,
    )

    # 6. 규칙 기반 결과와 설명을 함께 반환
    return {
        "totalCandidates": len(ranked_vehicles),
        "recommendations": recommendations,
        "advice": advice,
    }

