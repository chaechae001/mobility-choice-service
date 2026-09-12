# FastAPI 클래스 가져옴
from fastapi import FastAPI

# FastAPI 서버 애플리케이션 생성
# title : Swagger문서 화면에 표시됨
app = FastAPI(title="Mobility Choice AI API")

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Mobility Choice AI API is running",
    }