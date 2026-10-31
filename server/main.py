import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

CONFIG_DIR = Path(__file__).parent / "configs"
app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/config")
def get_config(brand: str = Query(..., pattern=r"^[a-z0-9_-]+$")):
    path = CONFIG_DIR / f"{brand}.json"
    if not path.exists():
        raise HTTPException(404, f"unknown brand '{brand}'")
    return JSONResponse(json.loads(path.read_text()), headers={"Cache-Control": "no-cache"})