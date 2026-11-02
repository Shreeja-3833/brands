import hashlib
import json
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, Header, HTTPException, Query, Response
from fastapi.responses import JSONResponse

CONFIG_DIR = Path(__file__).parent / "configs"
# Short TTL so edits propagate within seconds; a CDN in front serves everyone else from cache.
CACHE_CONTROL = "public, max-age=5, stale-while-revalidate=30"
app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/config")
def get_config(
    brand: str = Query(..., pattern=r"^[a-z0-9_-]+$"),
    if_none_match: Optional[str] = Header(default=None),
):
    path = CONFIG_DIR / f"{brand}.json"
    if not path.exists():
        raise HTTPException(404, f"unknown brand '{brand}'")
    raw = path.read_bytes()
    etag = f'"{hashlib.sha256(raw).hexdigest()[:16]}"'
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}
    # CDNs may weaken the tag to W/"..." and clients may send several.
    sent = {t.strip().removeprefix("W/") for t in (if_none_match or "").split(",")}
    if etag in sent or "*" in sent:
        return Response(status_code=304, headers=headers)
    return JSONResponse(json.loads(raw), headers=headers)
