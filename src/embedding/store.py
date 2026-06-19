import os
import threading

import numpy as np


class EmbeddingStore:
    """In-memory product embedding index, persisted to a single .npz file.

    Stores only product ids and their normalized embedding vectors; product
    text composition lives in the .NET backend, so this service stays
    schema-agnostic. Vectors are L2-normalized at insert time so cosine
    similarity reduces to a dot product.
    """

    def __init__(self, data_dir: str, index_file: str):
        self._path = os.path.join(data_dir, index_file)
        self._lock = threading.Lock()
        self._ids: list[str] = []
        self._id_to_idx: dict[str, int] = {}
        self._vectors: np.ndarray | None = None  # shape (n, dim), float32
        os.makedirs(data_dir, exist_ok=True)
        self._load()

    @property
    def count(self) -> int:
        return len(self._ids)

    def _load(self) -> None:
        if not os.path.exists(self._path):
            return
        data = np.load(self._path, allow_pickle=True)
        self._ids = list(data["ids"])
        self._id_to_idx = {pid: i for i, pid in enumerate(self._ids)}
        self._vectors = data["vectors"]

    def _persist(self) -> None:
        vectors = (
            self._vectors
            if self._vectors is not None
            else np.empty((0, 0), dtype=np.float32)
        )
        tmp = self._path + ".tmp.npz"
        with open(tmp, "wb") as f:
            np.savez(f, ids=np.array(self._ids, dtype=object), vectors=vectors)
        os.replace(tmp, self._path)

    @staticmethod
    def _normalize(vec: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def upsert(self, product_id: str, vector: np.ndarray) -> None:
        vector = self._normalize(vector.astype(np.float32))
        with self._lock:
            if product_id in self._id_to_idx:
                idx = self._id_to_idx[product_id]
                self._vectors[idx] = vector
            else:
                self._ids.append(product_id)
                self._id_to_idx[product_id] = len(self._ids) - 1
                if self._vectors is None or self._vectors.size == 0:
                    self._vectors = vector.reshape(1, -1)
                else:
                    self._vectors = np.vstack([self._vectors, vector])
            self._persist()

    def upsert_many(self, items: list[tuple[str, np.ndarray]]) -> None:
        with self._lock:
            for product_id, vector in items:
                vector = self._normalize(vector.astype(np.float32))
                if product_id in self._id_to_idx:
                    idx = self._id_to_idx[product_id]
                    self._vectors[idx] = vector
                else:
                    self._ids.append(product_id)
                    self._id_to_idx[product_id] = len(self._ids) - 1
                    if self._vectors is None or self._vectors.size == 0:
                        self._vectors = vector.reshape(1, -1)
                    else:
                        self._vectors = np.vstack([self._vectors, vector])
            self._persist()

    def delete(self, product_id: str) -> bool:
        with self._lock:
            if product_id not in self._id_to_idx:
                return False
            idx = self._id_to_idx.pop(product_id)
            del self._ids[idx]
            self._vectors = np.delete(self._vectors, idx, axis=0)
            self._id_to_idx = {pid: i for i, pid in enumerate(self._ids)}
            self._persist()
            return True

    def replace_all(self, items: list[tuple[str, np.ndarray]]) -> None:
        with self._lock:
            if not items:
                self._ids = []
                self._id_to_idx = {}
                self._vectors = None
                self._persist()
                return
            ids, vecs = [], []
            for pid, vec in items:
                ids.append(pid)
                vecs.append(self._normalize(vec.astype(np.float32)))
            self._ids = ids
            self._id_to_idx = {pid: i for i, pid in enumerate(ids)}
            self._vectors = np.array(vecs, dtype=np.float32)
            self._persist()

    def search(
        self, query_vector: np.ndarray, top_n: int, min_score: float = 0.0
    ) -> list[tuple[str, float]]:
        with self._lock:
            if self._vectors is None or self._vectors.size == 0:
                return []
            query = self._normalize(query_vector.astype(np.float32))
            scores = self._vectors @ query
            top_n = min(top_n, len(self._ids))
            top_idx = np.argpartition(-scores, top_n - 1)[:top_n]
            ranked = sorted(top_idx, key=lambda i: scores[i], reverse=True)
            return [
                (self._ids[i], float(scores[i]))
                for i in ranked
                if scores[i] >= min_score
            ]
