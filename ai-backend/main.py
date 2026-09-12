# FastAPI 클래스 가져옴
from fastapi import FastAPI
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

"""
사용자가 JSON을 보냈다면, 
{
  "minBudget": 3000,
  "maxBudget": 5000,
  "lifestyles": ["출퇴근"]
}
함수 안에서는 preference가 이런 객체가 됨
preference.minBudget      # 3000
preference.maxBudget      # 5000
preference.lifestyles     # ["출퇴근"]

PreferenceRequest는 일반 딕셔너리가 아니라 Pydantic이 만든 검증 기능이 있는 객체라
model_dump()로 그 객체를 일반 Python 딕셔너리로 바꿈
FastAPI는 Pydantic 객체를 자동으로 JSON으로 변환해줌 -> return preference라 해도 됨
"""