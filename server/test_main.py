from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_config_returns_brand_config():
    res = client.get("/config", params={"brand": "a"})
    assert res.status_code == 200
    assert "version" in res.json()


def test_config_unknown_brand_returns_404():
    res = client.get("/config", params={"brand": "nope"})
    assert res.status_code == 404


def test_config_sets_etag_and_cache_headers():
    res = client.get("/config", params={"brand": "a"})
    assert res.headers["etag"].startswith('"')
    assert "max-age" in res.headers["cache-control"]


def test_config_returns_304_when_etag_matches():
    etag = client.get("/config", params={"brand": "a"}).headers["etag"]
    res = client.get("/config", params={"brand": "a"}, headers={"If-None-Match": etag})
    assert res.status_code == 304
    assert res.content == b""


def test_config_accepts_weak_etag_from_cdn():
    etag = client.get("/config", params={"brand": "a"}).headers["etag"]
    res = client.get("/config", params={"brand": "a"}, headers={"If-None-Match": f"W/{etag}"})
    assert res.status_code == 304


def test_config_returns_200_when_etag_is_stale():
    res = client.get("/config", params={"brand": "a"}, headers={"If-None-Match": '"stale"'})
    assert res.status_code == 200
    assert "version" in res.json()
