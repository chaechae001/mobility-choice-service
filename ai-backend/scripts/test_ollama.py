# 사람이 작성한 메시지 형식을 사용하기 위해 가져옴
from langchain_core.messages import HumanMessage
# Ollama 모델을 Langchain에서 호출하기 위해 가져옴
from langchain_ollama import ChatOllama

# 모델을 바꾸기 쉽게 이름을 변수로분리
MODEL_NAME = "exaone3.5:2.4b"

# Ollama에 설치된 모델과 연결
llm = ChatOllama(
    model=MODEL_NAME,
    temperature=0.3,
)

# 사용자 질문은 LangChain 메시지 객체로 만듬
message = HumanMessage(
    content= "자동차를 선택할 때 예산 외에 확인할 조건을 한국어로 두 가지 알려줘."
)

# Ollama 모델에 메시지를 전달하고 응답을 받음
response = llm.invoke([message])

# response는 AIMessage 객체
# 실제 답변 문자열은 content에 들어있음
print(response.content)