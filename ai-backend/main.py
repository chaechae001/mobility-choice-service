# FastAPI 클래스 가져옴
from fastapi import FastAPI, Header, HTTPException
from starlette import status

from vehicle_client import get_vehicles
# schemas.py에 만든 요청 형식을 가져옴
from schemas import PreferenceRequest

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