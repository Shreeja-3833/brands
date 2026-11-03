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


# Dummy key for tests only; the real key lives in server/.env (gitignored).
TEST_KEY = "test-key"


def test_image_requires_key_header(monkeypatch):
    monkeypatch.setenv("IMAGE_KEY", TEST_KEY)
    res = client.get("/images/seasonal.jpg")
    assert res.status_code == 401


def test_image_rejects_wrong_key(monkeypatch):
    monkeypatch.setenv("IMAGE_KEY", TEST_KEY)
    res = client.get("/images/seasonal.jpg", headers={"X-Image-Key": "wrong"})
    assert res.status_code == 403


def test_image_served_with_correct_key(monkeypatch):
    monkeypatch.setenv("IMAGE_KEY", TEST_KEY)
    res = client.get("/images/seasonal.jpg", headers={"X-Image-Key": TEST_KEY})
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/jpeg"
    assert res.headers["cache-control"].startswith("private")
    assert len(res.content) > 0


def test_image_unknown_name_returns_404(monkeypatch):
    monkeypatch.setenv("IMAGE_KEY", TEST_KEY)
    res = client.get("/images/missing.jpg", headers={"X-Image-Key": TEST_KEY})
    assert res.status_code == 404


def test_image_rejects_names_outside_pattern(monkeypatch):
    monkeypatch.setenv("IMAGE_KEY", TEST_KEY)
    for name in ["..%2Fmain.py", "main.py", "SEASONAL.JPG", ".env"]:
        res = client.get(f"/images/{name}", headers={"X-Image-Key": TEST_KEY})
        assert res.status_code == 404, name


def test_image_refuses_when_server_key_unset(monkeypatch):
    monkeypatch.delenv("IMAGE_KEY", raising=False)
    res = client.get("/images/seasonal.jpg", headers={"X-Image-Key": "anything"})
    assert res.status_code == 503
