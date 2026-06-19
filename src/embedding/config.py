from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EMBEDDING_", env_file=".env")

    model_name: str = "BAAI/bge-small-en-v1.5"

    # bge-small-en-v1.5 expects this instruction prefixed to the query (not to
    # indexed passages) for retrieval. Applied only on the search path.
    query_instruction: str = "Represent this sentence for searching relevant passages: "

    # Where the persisted index lives (mounted Docker volume).
    data_dir: str = "/data"
    index_file: str = "index.npz"

    # Backfill source: the .NET backend internal feed that returns all
    # Active products as {id, text} pairs for initial indexing.
    backend_feed_url: str = "http://backend:5000/api/internal/assistant/product-feed"

    # Shared secret sent as the X-Internal-Key header when calling the feed.
    internal_key: str = ""

    # Reindex from the backend feed on startup when the index is empty.
    reindex_on_startup: bool = True


settings = Settings()
