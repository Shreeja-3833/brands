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
