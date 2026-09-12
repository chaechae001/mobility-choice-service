# FastAPI 요청 데이터의 형식과 검증 규칙을 만들기 위해 가져옴
from pydantic import BaseModel, Field, model_validator

# 필드이름: 타입 = Field(pydantic 옵션)
# Field : Pydantic이 제공하는 검증 도구, ge : 이상 / le : 이하
class PreferenceRequest(BaseModel):
    # 예산 단위 : '만 원'
    minBudget: int = Field(ge=2000, le=15000)
    maxBudget: int = Field(ge=2000, le=15000)

    # 여러 항목을 선택할 수 있는 조건
    # default_factory=list는 기본값으로 새 빈 리스트 만듬
    # lifestyles: list[str] = [] <- 기본값으로 리스트 객체를 직접 둠 (여러 객체가 같은 리스트를 공유하는 문제 생길 수 있음)
    lifestyles: list[str] = Field(default_factory=list)
    bodyTypes: list[str] = Field(default_factory=list)
    powertrains: list[str] = Field(default_factory=list)
    priorities: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    usageTypes: list[str] = Field(default_factory=list)
    origins: list[str] = Field(default_factory=list)

    # 자유 입력은 아직 프론트 화면에 연결하지 않지만,
    # AI 추천 설명 단계에서 사용할 수 있도록 미리 준비
    # userNote : JSON에서 받을 키 이름
    # str | None : 문자열 또는 None을 받을 수 있음
    # None : 보내지 않았을 때 기본값은 None
    userNote: str | None = None

    # 최소 예산이 최대 예산보다 클 수 없도록 검증
    @model_validator(mode="after")
    def validate_budget_range(self):
        if self.minBudget > self.maxBudget:
            raise ValueError("minBudget은 maxBudget보다 클 수 없습니다.")
        return self