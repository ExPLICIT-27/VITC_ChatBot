from pydantic import BaseModel
from typing import Optional, List

# class Query(BaseModel):
#     query : str

# class PDFMetaData(BaseModel):
#     collection : str
#     title : Optional[str]
#     description : Optional[str]


class RetrieveRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None

class RetrieveResponse(BaseModel):
    answer: str
    sources: List[dict]
    conversation_id: int

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    # created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    # created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True