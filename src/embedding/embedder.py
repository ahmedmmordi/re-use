import numpy as np
from sentence_transformers import SentenceTransformer


class Embedder:
    def __init__(self, model_name: str, query_instruction: str = ""):
        self._model = SentenceTransformer(model_name)
        self._query_instruction = query_instruction

    def embed(self, text: str) -> np.ndarray:
        return self._model.encode(text, convert_to_numpy=True)

    def embed_query(self, text: str) -> np.ndarray:
        return self._model.encode(self._query_instruction + text, convert_to_numpy=True)

    def embed_many(self, texts: list[str]) -> list[np.ndarray]:
        vectors = self._model.encode(texts, convert_to_numpy=True)
        return [v for v in vectors]
