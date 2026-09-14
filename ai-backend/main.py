# FastAPI 클래스 가져옴
from fastapi import FastAPI, Header, HTTPException
from ranking_service import rank_vehicles

from vehicle_client import get_vehicles
# schemas.py에 만든 요청 형식을 가져옴
from schemas import PreferenceRequest
from advisor_service import create_advice, stream_advice
from starlette.concurrency import run_in_threadpool

from fastapi.middleware.cors import CORSMiddleware
import json
from fastapi.responses import StreamingResponse

# FastAPI 서버 애플리케이션 생성
# title : Swagger문서 화면에 표시됨
app = FastAPI(title="Mobility Choice AI API")

# Phase 08:
# Next.js 프론트엔드(3000번 포트)가 FastAPI(8000번 포트)를 호출하도록 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "advice": "선택한 필수 조건을 모두 만족하는 차량이 현재 데이터에 없습니다. "
                    "차종, 동력 방식, 국산·수입 또는 필수 기능 조건을 하나씩 완화해 다시 선택해 주세요.",
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

# 서버에서 브라우저로 보내는 SSE 형식 문자열 만듬
# event: 이벤트 이름, data: JSON 데이터
def create_sse_message(event_name, data):
    return (
        f"event: {event_name}\n"
        f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    )

# Phase 09:
# 추천 차량은 먼저 보내고, Ollama 설명은 생성되는 대로 조각 단위로 보냄
@app.post("/api/recommendations/stream")
async def stream_recommendations(
    preference: PreferenceRequest,
    authorization: str | None = Header(default=None)
):
    # 스트리밍을 시작하기 전에 JWT 존재 여부를 먼저 검사
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail= "Authorization 헤더가 필요합니다."
        )

    async def event_generator():
        try:
            # 1. Express에서 JWT 인증 차량 데이터를 가져옴
            vehicles= await get_vehicles(authorization)

            # 2. Pydantic 객체 -> 일반 딕셔너리로 바꿈
            preference_data = preference.model_dump()

            # 3. 규칙 기반 추천 점수를 계산
            ranked_vehicles = rank_vehicles(vehicles, preference_data)
            recommendations = ranked_vehicles[:3]

            # 4. 차량 추천 결과를 먼저 브라우저로 보냄
            # 사용자는 Ollama 설명을 기다리는 동안 추천 차량 카드를 먼저 볼 수 있음
            yield create_sse_message(
                "recommendations",
                {
                    "totalCandidates": len(ranked_vehicles),
                    "recommendations": recommendations
                }
            )

            # 추천 차량이 없으면 Ollama 호출 없이 종료
            if not recommendations:
                yield create_sse_message(
                    "advice",
                    {
                        "text": (
                            "선택한 필수 조건을 모두 만족하는 차량이 현재 데이터에 없습니다. "
                            "차종, 동력 방식, 국산·수입 또는 필수 기능 조건을 하나씩 완화해 다시 선택해 주세요."
                        )
                    }
                )
                yield create_sse_message("done", {})
                return 

            # 5. Ollama가 생성하는 텍스트 조각을 바로바로 브라우저로 전달
            async for chunk in stream_advice(
                preference_data,
                recommendations
            ):
                yield create_sse_message(
                    "advice",
                    {"text": chunk}
                )

            # 6. 모든 생성이 끝났다는 이벤트를 보냄
            yield create_sse_message("done", {})

        except Exception as error:
            # 스트리밍 도중 발생한 오류는 이벤트로 브라우저에 전달
            print("추천 스트리밍 오류:", error)

            yield create_sse_message(
                "error",
                {
                    "detail": (
                        "추천 설명을 생성하는 중 오류가 발생했습니다."
                        "Ollama 서버 상태를 확인해주세요."
                    )
                }
            )

    # text/event-stream: 서버가 응답을 한 번에 끝내지 않고 계속 전송하는 방식
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Contrl": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )