from pydantic import BaseModel


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]


class IndexRequest(BaseModel):
    productId: str
    text: str


class SearchRequest(BaseModel):
    query: str
    topN: int = 10
    minScore: float = 0.3


class SearchHit(BaseModel):
    productId: str
    score: float


class SearchResponse(BaseModel):
    hits: list[SearchHit]


class ProductFeedItem(BaseModel):
    productId: str
    text: str


class ReindexResponse(BaseModel):
    indexed: int


class StatusResponse(BaseModel):
    status: str
    count: int
