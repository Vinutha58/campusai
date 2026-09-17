from pydantic import BaseModel


class ReadinessFactor(BaseModel):
    label: str
    score: float
    detail: str


class ReadinessPublic(BaseModel):
    overall_score: float
    factors: list[ReadinessFactor]
    suggestions: list[str]
