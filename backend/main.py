from fastapi import FastAPI
from api.routes import router

app = FastAPI(
    title="Route Optimizer API",
    version="1.0.0"
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "status": "backend running"
    }