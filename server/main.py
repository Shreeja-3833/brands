import hashlib
import hmac
import json
import os
import re
import time
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, Header, HTTPException, Query, Response
from fastapi.responses import FileResponse, JSONResponse

CONFIG_DIR = Path(__file__).parent / "configs"
IMAGE_DIR = Path(__file__).parent / "images"
CACHE_CONTROL = "public, max-age=5, stale-while-revalidate=30"
IMAGE_CACHE_CONTROL = "private, max-age=300"
IMAGE_NAME = r"^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$"
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

@app.get("/images/{name}")
def get_image(
    name: str,
    x_image_key: Optional[str] = Header(default=None),
):
    # The key lives only in the environment; with none set, refuse rather than serve openly.
    expected = os.environ.get("IMAGE_KEY")
    if not expected:
        raise HTTPException(503, "image key not configured")
    if x_image_key is None:
        raise HTTPException(401, "missing X-Image-Key")
    if not hmac.compare_digest(x_image_key.encode(), expected.encode()):
        raise HTTPException(403, "invalid X-Image-Key")
    # The name pattern rules out path separators, so this can't escape IMAGE_DIR.
    if not re.fullmatch(IMAGE_NAME, name) or not (IMAGE_DIR / name).is_file():
        raise HTTPException(404, f"unknown image '{name}'")
    # Dev-only knob to make the app's loading placeholder visible.
    delay_ms = int(os.environ.get("IMAGE_DELAY_MS", "0") or 0)
    if delay_ms > 0:
        time.sleep(delay_ms / 1000)
    return FileResponse(IMAGE_DIR / name, headers={"Cache-Control": IMAGE_CACHE_CONTROL})
