# chat_api.py
from __future__ import annotations
import os, io, json, time
from typing import List, Optional, Literal

import faiss, numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import requests

from pypdf import PdfReader
from docx import Document as DocxDocument
from PIL import Image
import pytesseract

load_dotenv()

# ---------- ENV ----------
# Groq (optional)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODELS = [
    os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
]

# Gemini via Supabase Edge Function
SUPABASE_GEMINI_URL = os.getenv("SUPABASE_GEMINI_URL", "").strip()
GEMINI_MODEL        = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
SUPABASE_ANON_KEY   = os.getenv("SUPABASE_ANON_KEY", "").strip()

# Ollama (local)
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL_EMERGENCY = os.getenv("OLLAMA_MODEL_EMERGENCY", "llama3.2:3b")
OLLAMA_MODEL_MENTAL    = os.getenv("OLLAMA_MODEL_MENTAL",    "llama3.2:3b")

# Retrieval (FAISS)
VECTORS_DIR = os.getenv("VECTORS_DIR", os.path.join(os.path.dirname(__file__), "vectors"))
FAISS_PATH  = os.path.join(VECTORS_DIR, "faiss.index")
META_PATH   = os.path.join(VECTORS_DIR, "meta.jsonl")
MODEL_META  = os.path.join(VECTORS_DIR, "model.json")
DEFAULT_EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Optional Tesseract path (Windows)
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

PROMPTS = {
    "emergency": {
        "en": ("You are an AI assistant helping with earthquake & emergency safety. "
               "Be concise, practical, and safety-first. If this is a real emergency, remind the user to call 199."),
        "my": ("သင်သည် ငလျင်နှင့် အရေးပေါ် လုံခြုံရေးအကြံပြုမှုအတွက် ကူညီပေးသော AI ဖြစ်သည်။ "
               "တိုတောင်းသော်လည်း အသုံးဝင်အောင်ဖြေပါ။ တကယ်အရေးပေါ်ဖြစ်ပါက 199 ကို ခေါ်ရန် အမြဲသတိပေးပါ။"),
    },
    "mental": {
        "en": ("You are a warm, supportive mental-health companion (not a clinician). "
               "Respond with empathy and calming language. Offer grounding such as box breathing (4-4-4-4). "
               "If the user indicates crisis or self-harm risk, suggest contacting a trusted person or calling 199."),
        "my": ("သင်သည် နူးညံ့သိမ်မွေ့သော စိတ်ကျန်းမာရေး အကူအညီပေးသူ (ဆေးဘက်ဝင်မဟုတ်) ဖြစ်သည်။ "
               "နူးညံ့သိမ်မွေ့သောစကားဖြင့် အားပေးပါ။ အကွက်အသက်ရှူ ၄-၄-၄-၄ ကဲ့သို့သော ဂရောင်ဒင်းကို ပြောပြပါ။ "
               "အရေးကြီးစိုးရိမ်မှု/ကိုယ်ပိုင်အန္တရာယ်ရှိပါက ယုံကြည်ရသောသူ သို့မဟုတ် 199 ကို ဆက်သွယ်ရန် အကြံပြုပါ။"),
    },
}

app = FastAPI(title="LinYone Chat API", version="1.5")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

faiss_index = None
meta: List[dict] = []
encoder: SentenceTransformer | None = None

# ---------- Vectors / Index ----------
def _load_vectors():
    global faiss_index, meta, encoder
    if not os.path.exists(FAISS_PATH):
        print(f"⚠️  FAISS index not found: {FAISS_PATH}. Retrieval disabled.")
        return
    print("• Loading FAISS index...")
    faiss_index = faiss.read_index(FAISS_PATH)

    print("• Loading metadata…")
    meta.clear()
    if os.path.exists(META_PATH):
        with open(META_PATH, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    meta.append(json.loads(line))
                except Exception:
                    pass

    emb_name = DEFAULT_EMBED_MODEL
    if os.path.exists(MODEL_META):
        try:
            with open(MODEL_META, "r", encoding="utf-8") as f:
                info = json.load(f)
            emb_name = info.get("model", emb_name)
        except Exception:
            pass

    print("• Loading embedding model:", emb_name)
    encoder = SentenceTransformer(emb_name)
    print("✓ Embedding model ready.")

@app.on_event("startup")
def _startup():
    _load_vectors()

# ---------- Helpers ----------
def is_burmese(text: str) -> bool:
    return any("\u1000" <= ch <= "\u109F" for ch in text)

def embed(texts: List[str]) -> np.ndarray:
    if encoder is None:
        arr = np.zeros((len(texts), 384), dtype="float32")  # 384 is MiniLM size
        return arr
    vecs = encoder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-12
    return vecs / norms

def retrieve(query: str, top_k: int = 6) -> List[dict]:
    if faiss_index is None or encoder is None:
        return []
    vec = embed([query]).astype("float32")
    scores, idx = faiss_index.search(vec, top_k)
    out = []
    for rank, (i, s) in enumerate(zip(idx[0], scores[0]), 1):
        if 0 <= i < len(meta):
            m = dict(meta[i])
            m["_rank"] = int(rank)
            m["_score"] = float(s)
            m["_id"] = int(i)
            out.append(m)
    return out

def make_context_snippets(docs: List[dict], limit_chars: int = 1500) -> str:
    parts = []
    total = 0
    for d in docs:
        label = d.get("label") or d.get("title") or d.get("phase_name") or "snippet"
        text  = d.get("text")  or d.get("excerpt") or d.get("content") or d.get("full_conversation") or ""
        if isinstance(text, list):
            text = " ".join(map(str, text))
        cleaned = str(text).strip().replace("\n", " ")
        line = f"[{d.get('_rank')}] {label}: {cleaned}"
        parts.append(line)
        total += len(line)
        if total > limit_chars:
            break
    return "\n".join(parts)

def system_prompt(kind: str, lang: str) -> str:
    return PROMPTS[kind]["my" if lang == "my" else "en"]

def pick_ollama_model(kind: str) -> str:
    return OLLAMA_MODEL_MENTAL if kind == "mental" else OLLAMA_MODEL_EMERGENCY

# ---------- Providers ----------
def call_groq(messages, temperature, max_tokens) -> tuple[str,str]:
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    url = "https://api.groq.com/openai/v1/chat/completions"
    last = None
    for m in GROQ_MODELS:
        try:
            r = requests.post(
                url,
                headers=headers,
                json={"model": m, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
                timeout=60
            )
            if r.ok:
                j = r.json()
                content = j["choices"][0]["message"]["content"]
                if content:
                    return content, m
            last = r.text
        except Exception as e:
            last = str(e)
    raise RuntimeError(f"Groq failed: {last}")

GPU_ERR = ("more system memory", "unable to load full model on gpu", "out of memory", "no supported gpu")

def call_ollama(model, messages, temperature, max_tokens) -> str:
    # try OpenAI-compatible endpoint
    try:
        r = requests.post(
            f"{OLLAMA_BASE}/v1/chat/completions",
            json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
            timeout=60
        )
        r.raise_for_status()
        j = r.json()
        return j["choices"][0]["message"]["content"]
    except Exception as e1:
        msg = str(e1)
    # native Ollama endpoint (maybe force CPU)
    try:
        force_cpu = any(x in msg.lower() for x in GPU_ERR)
        payload = {
            "model": model,
            "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
            "options": {"temperature": temperature, "num_predict": max_tokens, **({"num_gpu": 0} if force_cpu else {})},
            "stream": False,
        }
        r = requests.post(f"{OLLAMA_BASE}/api/chat", json=payload, timeout=60)
        r.raise_for_status()
        j = r.json()
        return j["message"]["content"]
    except Exception as e2:
        if "num_gpu" not in payload["options"]:
            try:
                payload["options"]["num_gpu"] = 0
                r = requests.post(f"{OLLAMA_BASE}/api/chat", json=payload, timeout=60)
                r.raise_for_status()
                return r.json()["message"]["content"]
            except Exception:
                pass
        raise e2

def call_gemini_via_supabase(messages, temperature, max_tokens, model) -> str:
    """
    Calls your Supabase Edge Function (functions/gemini-chat/index.ts).
    Expects JSON: { content: string, model: string }.
    If Gemini returns empty content, we log and return a gentle fallback message.
    """
    if not SUPABASE_GEMINI_URL:
        raise RuntimeError("SUPABASE_GEMINI_URL not configured")

    headers = {"Content-Type": "application/json"}
    if SUPABASE_ANON_KEY:
        headers["Authorization"] = f"Bearer {SUPABASE_ANON_KEY}"
        headers["apikey"] = SUPABASE_ANON_KEY

    payload = {
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "model": model,
    }
    r = requests.post(SUPABASE_GEMINI_URL, headers=headers, json=payload, timeout=60)
    if not r.ok:
        raise RuntimeError(f"Gemini edge error {r.status_code}: {r.text[:500]}")
    j = r.json()
    text = (j.get("content") or "").strip()

    if not text:
        # Log everything so you can inspect the raw payload in the console
        print("⚠️ Empty Gemini content, raw edge payload:", j)
        # If the edge function sent an error field, bubble that up to trigger fallback
        if j.get("error"):
            raise RuntimeError(f"Gemini edge error payload: {j['error']}")
        # Otherwise, treat as a soft refusal and send a friendly explanation
        text = (
            "မင်းမေးခဲ့တဲ့အကြောင်းအရာကို လုံခြုံရေးနဲ့ ကိုယ်ရေးအချက်အလက် ထိခိုက်နိုင်လို့ "
            "အတိအကျဖြေပါမယ်လို့ မမြင်လို့ပါ။ အခြားပုံစံနဲ့ သို့မဟုတ် အခြားမေးခွန်းနဲ့ စမ်းမေးကြည့်ပါမလား။"
        )
    return text

def local_fallback(lang: str, kind: str) -> str:
    if kind == "mental":
        return ("အေးချမ်းသက်သာစေရန် အသက်ရှူ ၄-၄-၄-၄ လေ့ကျင့်ပါ။ သင်တစ်ယောက်တည်းမဟုတ်ပါ။ အရေးပေါ်ဖြစ်ပါက 199 ကို ခေါ်ပါ။"
                if lang == "my"
                else "Let's try box breathing (4-4-4-4). You're not alone. If this is an emergency, please call 199.")
    return ("အရေးပေါ်အခြေအနေတွင် 'ခေါင်းပု၊ ဖုံး၊ ကိုင်' လုပ်ပါ။ အရေးပေါ်ဖြစ်ပါက 199 ကို ခေါ်ပါ။"
            if lang == "my"
            else "Stay safe: Drop, Cover, Hold On. For real emergencies, call 199.")

def build_messages(kind: str, lang: str, user_text: str, ctx: str, file_text: str) -> list[dict]:
    sys = system_prompt(kind, lang)
    msgs: list[dict] = [{"role": "system", "content": sys}]
    if kind == "mental" and ctx:
        msgs.append({"role": "system", "content": "[Curated therapy context] " + ctx})
    if file_text:
        msgs.append({"role": "system", "content": "[User-attached content extracted] " + file_text[:2000]})
    msgs.append({"role": "user", "content": user_text})
    return msgs

# ---------- File Extraction ----------
def extract_text_from_upload(file: UploadFile) -> str:
    ct = (file.content_type or "").lower()
    name = file.filename or ""
    data = file.file.read()

    # Images → OCR
    if ct.startswith("image/") or any(name.lower().endswith(ext) for ext in [".png",".jpg",".jpeg",".webp",".bmp",".tiff"]):
        try:
            img = Image.open(io.BytesIO(data))
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as e:
            return f"[could not OCR image: {e}]"

    # PDF
    if ct == "application/pdf" or name.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(data))
            pages = []
            for p in reader.pages[:20]:
                pages.append(p.extract_text() or "")
            return "\n".join(pages).strip()
        except Exception as e:
            return f"[could not read PDF: {e}]"

    # DOCX
    if ct in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword") \
       or name.lower().endswith(".docx"):
        try:
            buf = io.BytesIO(data)
            buf.seek(0)
            doc = DocxDocument(buf)
            return "\n".join([p.text for p in doc.paragraphs]).strip()
        except Exception as e:
            return f"[could not read DOCX: {e}]"

    # Plain text
    if ct.startswith("text/") or name.lower().endswith(".txt"):
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception as e:
            return f"[could not read text: {e}]"

    return f"[unsupported file type: {ct or name}]"

# ---------- Health ----------
@app.get("/health")
def health():
    return {
        "ok": True,
        "faiss": faiss_index is not None,
        "meta": len(meta),
        "groq": bool(GROQ_API_KEY),
        "gemini_configured": bool(SUPABASE_GEMINI_URL),
        "gemini_auth_header": bool(SUPABASE_ANON_KEY),
    }

# ---------- Chat ----------
@app.post("/chat")
async def chat(
    request: Request,
    message: Optional[str] = Form(None),
    language: Optional[Literal["en","my"]] = Form(None),
    assistant: Optional[Literal["emergency","mental"]] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
):
    try:
        # JSON body support
        if message is None:
            if "application/json" in (request.headers.get("content-type") or ""):
                body = await request.json()
                message   = body.get("message")
                language  = body.get("language")
                assistant = body.get("assistant") or "emergency"
                files = None
            else:
                raise HTTPException(status_code=400, detail="Bad request: 'message' is required")

        if not message:
            raise HTTPException(status_code=400, detail="Bad request: 'message' is required")

        lang = language or ("my" if is_burmese(message) else "en")
        kind = assistant or "emergency"

        # Retrieval (mental only)
        retrieved = retrieve(message, top_k=6) if kind == "mental" else []
        ctx = make_context_snippets(retrieved) if retrieved else ""

        # File text
        attached_texts: list[str] = []
        if files:
            for f in files:
                try:
                    t = extract_text_from_upload(f)
                    attached_texts.append(t)
                finally:
                    await f.close()
        file_text = "\n\n".join([t for t in attached_texts if t])[:4000] if attached_texts else ""

        # Build prompt
        msgs = build_messages(kind, lang, message, ctx, file_text)
        temperature = 0.5 if kind == "mental" else 0.7
        max_tokens  = 512

        result: Optional[str] = None
        model_used: Optional[str] = None
        errors: list[tuple[str,str]] = []

        # 1) Gemini via Supabase
        if SUPABASE_GEMINI_URL:
            try:
                result = call_gemini_via_supabase(msgs, temperature, max_tokens, GEMINI_MODEL)
                model_used = f"gemini:{GEMINI_MODEL}"
            except Exception as e:
                errors.append(("gemini", str(e)))
                print("⚠️ Gemini call failed:", e)

        # 2) Groq
        if result is None and GROQ_API_KEY:
            try:
                result, gm = call_groq(msgs, temperature, max_tokens)
                model_used = f"groq:{gm}"
            except Exception as e:
                errors.append(("groq", str(e)))

        # 3) Ollama
        if result is None:
            try:
                om = pick_ollama_model(kind)
                result = call_ollama(om, msgs, temperature, max_tokens)
                model_used = f"ollama:{om}"
            except Exception as e:
                errors.append(("ollama", str(e)))

        # 4) Local fallback
        if result is None:
            result = local_fallback(lang, kind)
            model_used = "local:fallback"

        refs = None
        if retrieved:
            refs = [
                {
                    "id": int(r.get("_id", 0)),
                    "rank": int(r.get("_rank", 0)),
                    "score": float(r.get("_score", 0.0)),
                    "label": r.get("label") or r.get("title") or r.get("phase_name") or "snippet",
                }
                for r in retrieved[:5]
            ]

        category = "mental" if kind == "mental" else "general"

        return {
            "response": result,
            "category": category,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model": model_used,
            "dataset_refs": refs,
            # "errors": errors,  # uncomment to see provider errors in JSON
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "response": local_fallback("en", "emergency"),
                "category": "general",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "model": "local:fallback",
                "error": True,
                "detail": str(e),
            },
        )
