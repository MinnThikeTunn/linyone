# backend/serve.py
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
import faiss, json
from pathlib import Path

app = FastAPI()

VECTOR_DIR = Path(__file__).resolve().parent / "vectors"
INDEX_PATH = VECTOR_DIR / "faiss.index"
META_PATH = VECTOR_DIR / "meta.jsonl"
MODEL_PATH = VECTOR_DIR / "model.json"

# Load everything once
print("🔹 Loading FAISS index...")
model_info = json.loads(MODEL_PATH.read_text())
model = SentenceTransformer(model_info["model"])
index = faiss.read_index(str(INDEX_PATH))

meta = []
with open(META_PATH, "r", encoding="utf-8") as f:
    for line in f:
        meta.append(json.loads(line))

@app.get("/ready")
def ready():
    return {"ok": True, "count": len(meta), "dim": index.d}

@app.post("/query")
async def query(q: str, top_k: int = 5):
    emb = model.encode([q])
    D, I = index.search(emb, top_k)
    results = [meta[i] for i in I[0]]
    return {"query": q, "matches": results}
