import json

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama


# Ollama에서 실행할 모델 설정
llm = ChatOllama(
    model="exaone3.5:2.4b",
    temperature=0.3,
    num_predict=120,
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
        - Markdown 기호(**, #, -, *)를 사용하지 마세요.
        - 반드시 아래 세 줄 형식으로만 답변하세요.
        - 각 줄은 한 문장으로 작성하고, 전체는 250자 이내로 작성하세요.

        조건 요약: 사용자의 예산과 선택 조건을 짧게 요약
        추천 이유: 1위 차량이 조건에 적합한 이유
        확인할 점: 구매 전에 추가로 확인할 점
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

def create_advice(preference, recommendations):
    # 딕셔너리와 리스트를 프롬프트에 넣을 JSON 문자열로 반환
    preference_json = json.dumps(
        preference,
        ensure_ascii=False,
        indent=2,
    )
    recommendations_json = json.dumps(
        recommendations,
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