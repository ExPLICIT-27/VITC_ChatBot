from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from .user import get_current_user

router = APIRouter(prefix="/chat", tags=['Chat History'])

@router.get("/sessions", response_model=List[schemas.ConversationResponse])
def get_sessions(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Retrieve all conversations for the current user."""
    conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == current_user.id
    ).order_by(models.Conversation.created_at.desc()).all()
    return conversations

@router.post("/sessions", response_model=schemas.ConversationResponse)
def create_session(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Create a new empty conversation."""
    new_conv = models.Conversation(user_id=current_user.id, title="New Chat")
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

@router.get("/sessions/{session_id}/messages", response_model=List[schemas.MessageResponse])
def get_session_messages(session_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Retrieve all messages for a specific conversation belonging to the user."""
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == session_id,
        models.Conversation.user_id == current_user.id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")
        
    messages = db.query(models.Message).filter(
        models.Message.conversation_id == session_id
    ).order_by(models.Message.created_at.asc()).all()
    
    return messages
