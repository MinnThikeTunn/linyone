# build_index.py
import argparse, json, os, sys, time
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------- CLI ----------
parser = argparse.ArgumentParser(description="Build FAISS index from local mental datasets.")
parser.add_argument(
    "--datasets",
    nargs="*",
    default=[
        str(Path("../public/therapy_sessions.json").resolve()),
        str(Path("../public/mental_qa.json").resolve()),  # optional, if you have it
    ],
    help="Paths to JSON files (arrays) to index.",
)
parser.add_argument(
    "--out",
    default=str(Path("./vectors").resolve()),
    help="Output folder for faiss.index and meta.jsonl",
)
parser.add_argument(
    "--model",
    default="paraphrase-multilingual-MiniLM-L12-v2",
    help="Sentence-Transformers model (multilingual works with Burmese).",
)
args = parser.parse_args()

print("🔧 Settings")
print("  datasets:", args.datasets)
print("  out     :", args.out)
print("  model   :", args.model)
print()

# ---------- load datasets ----------
docs = []
def add_doc(text: str, source: str, meta: dict):
    text = (text or "").strip()
    if not text:
        return
    docs.append({"text": text, "source": source, "meta": meta})

def load_json_array(p: str):
    p = Path(p)
    if not p.exists():
        print(f"⚠️  Not found: {p}")
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, list):
            print(f"✅ Loaded {len(data):,} items from {p}")
            return data
        else:
            print(f"⚠️  {p} is not a JSON array, skipping.")
            return []
    except Exception as e:
        print(f"❌ Failed to parse {p}: {e}")
        return []

for path in args.datasets:
    items = load_json_array(path)
    name = Path(path).name

    # Heuristics for your therapy_sessions sample structure
    for it in items:
        # long conversation
        if "full_conversation" in it:
            convo = "\n".join(it.get("full_conversation", []))
            topic = it.get("session_topic") or it.get("trauma_type") or "session"
            add_doc(
                f"{topic}\n{convo}",
                source=name,
                meta={"type": "therapy_session", "topic": topic, "session_id": it.get("subject_id")},
            )
        # 3-turn sequences (if present)
        for triple in it.get("three_turn_sequences", []):
            snippet = "\n".join(triple)
            add_doc(
                snippet,
                source=name,
                meta={"type": "triple", "session_id": it.get("subject_id")},
            )
        # simple Q/A lists (for a mental_qa.json shape like [{"q":..., "a":...}])
        if "q" in it and "a" in it:
            add_doc(
                f"Q: {it['q']}\nA: {it['a']}",
                source=name,
                meta={"type": "qa"},
            )

print(f"\n📄 Total docs collected: {len(docs):,}")
if not docs:
    print("Nothing to index. Make sure your JSON files are under /public and try again.")
    sys.exit(0)

# ---------- embeddings ----------
print("\n⬇️  Loading embedding model (this may take a minute the first time)…")
t0 = time.time()
model = SentenceTransformer(args.model)
print(f"✅ Model loaded in {time.time()-t0:.1f}s")

print("🧠 Encoding documents…")
texts = [d["text"] for d in docs]
emb = model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
emb = np.asarray(emb, dtype="float32")
print("✅ Embeddings shape:", emb.shape)

# ---------- FAISS index ----------
print("\n📦 Building FAISS index…")
index = faiss.IndexFlatIP(emb.shape[1])  # inner product (cosine because normalized)
index.add(emb)
print("✅ Index size:", index.ntotal)

# ---------- save ----------
out_dir = Path(args.out)
out_dir.mkdir(parents=True, exist_ok=True)
faiss.write_index(index, str(out_dir / "faiss.index"))
with open(out_dir / "meta.jsonl", "w", encoding="utf-8") as f:
    for i, d in enumerate(docs):
        f.write(json.dumps({"id": i, **d}, ensure_ascii=False) + "\n")

with open(out_dir / "model.json", "w", encoding="utf-8") as f:
    json.dump({"model": args.model}, f)

print("\n🎉 Done!")
print("  →", out_dir / "faiss.index")
print("  →", out_dir / "meta.jsonl")
print("  →", out_dir / "model.json")
