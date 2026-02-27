from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import retrieve, user, chat
from . import models
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def test_server():
    return {"status": "ok"}

app.include_router(retrieve.router)
app.include_router(user.router)
app.include_router(chat.router)
# Trigger script reload
