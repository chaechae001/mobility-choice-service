import json
from time import perf_counter

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama


# Ollama에서 실행할 모델 설정
llm = ChatOllama(
    model="exaone3.5:2.4b",
    temperature=0.3,
    num_predict=180,
    keep_alive="10m",
    client_kwargs={"timeout": 120}
)

# system: 서비스의 역할과 답변 규칙
# human: 실행할 때마다 바뀌는 사용자 조건과 추천 결과
prompt = ChatPromptTemplate.from_messages([
    ("system",
     """
     당신은 차량 추천 결과를 설명하는 도우미입니다.

     반드시 제공된 사용자 조건과 추천 차량 데이터만 사용하세요.
     순위, 점수, 가격, 차량 정보를 새로 만들거나 바꾸지 마세요.

     한국어로 3문장 이내로 작성하세요.
     1. 사용자의 핵심 조건 요약
     2. 1위 차량을 추천하는 이유
     3. 추가로 확인하면 좋은 조건 1개
     출력 형식 규칙:
        - Markdown 기호(**, #, -, *)와 번호 목록을 사용하지 마세요.
        - recommendations에 포함된 차량과 reasons에 있는 근거만 사용하세요.
        - reasons에 없는 조건이 일치한다고 말하지 마세요.
        - 예산, 차량 가격, 조건의 숫자를 새로 계산하거나 바꾸지 마세요.
        - 비교 대상이 없는 경우 다른 차량과 비교하지 마세요.
        - 반드시 아래 세 줄만 출력하세요.
        - 각 줄은 줄바꿈으로 구분하고, 한 줄은 완결된 한 문장으로 작성하세요.
        - 추천 차량의 relaxedConditions가 비어 있지 않다면, 
        해당 조건은 일치하지 않는 대안이라는 점을 반드시 한 문장으로 안내하세요.
        - relaxedConditions에 없는 조건이 완화되었다고 말하지 마세요.

        조건 요약: 입력 화면에 표시된 선택 조건을 기준으로 차량을 검토했습니다.
        추천 이유: 1위 차량의 reasons에 포함된 실제 일치 근거만 설명하세요.
        확인할 점: 트림, 옵션, 시승에서 확인할 한 가지 사항을 안내하세요.
    """),
     ("human", 
    """
        사용자 조건:
        {preference}

        규칙 기반 추천 결과:
        {recommendations}
    """)
])

# prompt -> Ollama 모델 -> 문자열 출력 순서로 연결
chain = prompt | llm | StrOutputParser()

def make_advice_vehicles(recommendations: list[dict]) -> list[dict]:
    """LLM에 전달할 차량 정보를 필요한 항목으로만 줄임"""
    return [
        {
            "name": vehicle.get("name"),
            "reasons": vehicle.get("reasons", []),
            "relaxedConditions": vehicle.get("relaxedConditions", []),
        }
        for vehicle in recommendations[:3]
    ]

def create_advice(preference, recommendations):
    # 딕셔너리와 리스트를 프롬프트에 넣을 JSON 문자열로 반환
    preference_json = json.dumps(
        preference,
        ensure_ascii=False,
        indent=2,
    )
    # 전체 차량 데이터 대신, AI 설명에 필요한 정보만 추림
    advice_vehicles = make_advice_vehicles(recommendations)

    recommendations_json = json.dumps(
        advice_vehicles,
        ensure_ascii=False,
        indent=2,
    )

    # 이전에 정상 동작을 확인한 동기 호출 방식
    # FastAPI 연결 단계에서 별도 스레드로 실행할 예정
    return chain.invoke(
        {
            "preference": preference_json,
            "recommendations": recommendations_json,
        }
    )

async def stream_advice(preference, recommendations):
    # 기존 create_advice()와 동일하게 Python 딕셔너리 -> JSON 문자열로 반환
    preference_json = json.dumps(
        preference,
        ensure_ascii=False,
        indent=2,
    )

    # 스트리밍에서도 필요한 차량 정보만 AI에 전달
    advice_vehicles = make_advice_vehicles(recommendations)

    recommendations_json= json.dumps(
        recommendations,
        ensure_ascii=False,
        indent=2,
    )

    # prompt.format_messages()는 프롬프트 템플릿을 실제 메시지 목록으로 완성
    messages = prompt.format_messages(
        preference=preference_json,
        recommendations= recommendations_json
    )

    started_at = perf_counter()

    # chain.astream() 대신 ChatOllama의 astream()을 직접 사용
    # Ollama가 보내는 AIMessageChunk를 바로 받으므로 스트리밍 여부 확인하기 좋음
    # astream()은 Ollama가 생성하는 문자열 조각을 순서대로 전달
    async for chunk in llm.astream(messages):
        # chunk.content에는 이번에 생성된 문자열 조각이 들어있음
        text = chunk.content
        # 빈 조각은 브라우저로 보내지 않음
        if not text:
            continue

        # FastAPI 터미널에서 실제 조각 전송 시간을 확인하는 로그
        elapsed = perf_counter() - started_at
        print(f"[{elapsed:.2f}s] stream chunk: {text!r}", flush=True)

        # yield로 FastAPI -> Next.js에 조각을 바로 전달
        yield text

