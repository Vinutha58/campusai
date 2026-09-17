from pydantic import BaseModel


class SearchResult(BaseModel):
    id: str
    category: str
    title: str
    subtitle: str
    link: str | None
