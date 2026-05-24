from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="Route Optimizer API",
    version="1.0.0"
)

# Configuración de CORS para permitir peticiones desde tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # El puerto de tu entorno de Vite
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permite todos los headers (incluyendo tu token de Firebase)
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "status": "backend running"
    }