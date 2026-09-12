# 다른 서버에 HTTP 요청을 보내기 위해 가져옴
import httpx

# 기존 Express 차량 목록 API 주소
EXPRESS_VEHICLES_URL = "http://127.0.0.1:4000/api/vehicles"

async def get_vehicles(authorization: str):
    # Express API가 JWT 인증을 요구하므로
    # FastAPI가 받은 Authorization 헤더를 그대로 전달
    headers = {"Authorization": authorization}

    # async with가 끝나면 HTTP 연결을 자동으로 정리
    async with httpx.AsyncClient(timeout=10.0) as client:
        # await는 Express 서버의 응답이 올 때까지 비동기로 기다림
        response = await client.get(
            EXPRESS_VEHICLES_URL,
            headers=headers
        )
    # Express가 401, 404, 500 등을 반환하면 오류로 처리
    response.raise_for_status()

    # Express 응답 JSON을 Python 리스트, 딕셔너리로 변환해 반환
    return response.json()