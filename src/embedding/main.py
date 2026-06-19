import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException

from config import settings
from embedder import Embedder
from schemas import (
    EmbedRequest,
    EmbedResponse,
    IndexRequest,
    ProductFeedItem,
    ReindexResponse,
    SearchRequest,
    SearchResponse,
    SearchHit,
    StatusResponse,
)
from store import EmbeddingStore

logger = logging.getLogger("embedding")
logging.basicConfig(level=logging.INFO)

embedder: Embedder
store: EmbeddingStore


def _fetch_feed() -> list[ProductFeedItem]:
    headers = {"X-Internal-Key": settings.internal_key} if settings.internal_key else {}
    resp = httpx.get(settings.backend_feed_url, headers=headers, timeout=60.0)
    resp.raise_for_status()
    return [ProductFeedItem(**item) for item in resp.json()]


def _reindex_from_feed() -> int:
    items = _fetch_feed()
    if not items:
        store.replace_all([])
        return 0
    vectors = embedder.embed_many([i.text for i in items])
    store.replace_all([(items[i].productId, vectors[i]) for i in range(len(items))])
    return len(items)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedder, store
    embedder = Embedder(settings.model_name, settings.query_instruction)
    store = EmbeddingStore(settings.data_dir, settings.index_file)

    if settings.reindex_on_startup and store.count == 0:
        try:
            count = _reindex_from_feed()
            logger.info("Startup reindex complete: %d products indexed", count)
        except Exception as exc:  # backend may not be ready; index lazily later
            logger.warning("Startup reindex skipped: %s", exc)

    yield


app = FastAPI(title="ReUse Embedding Service", lifespan=lifespan)


@app.get("/health", response_model=StatusResponse)
def health() -> StatusResponse:
    return StatusResponse(status="ok", count=store.count)


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    vector = embedder.embed(request.text)
    return EmbedResponse(vector=vector.tolist())


@app.post("/index", status_code=204)
def index_product(request: IndexRequest) -> None:
    vector = embedder.embed(request.text)
    store.upsert(request.productId, vector)


@app.delete("/index/{product_id}", status_code=204)
def delete_product(product_id: str) -> None:
    store.delete(product_id)


@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    query_vector = embedder.embed_query(request.query)
    results = store.search(query_vector, request.topN, request.minScore)
    return SearchResponse(
        hits=[SearchHit(productId=pid, score=score) for pid, score in results]
    )


@app.post("/reindex", response_model=ReindexResponse)
def reindex() -> ReindexResponse:
    try:
        count = _reindex_from_feed()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Feed fetch failed: {exc}")
    return ReindexResponse(indexed=count)
