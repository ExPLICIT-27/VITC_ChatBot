from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from .. import schemas, models, database
from .user import get_current_user
from app.utils.rag_adaptor import query_rag

router = APIRouter(prefix="/retrieve", tags=['Retrieve'])


@router.post("/", response_model=schemas.RetrieveResponse)
async def retrieve(req: schemas.RetrieveRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    try:
        # Determine or create conversation
        if req.conversation_id:
            conv = db.query(models.Conversation).filter(
                models.Conversation.id == req.conversation_id,
                models.Conversation.user_id == current_user.id
            ).first()
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
            # If the title is still the default 'New Chat', update it to the first query
            if conv.title == "New Chat":
                conv.title = req.query[:30] + "..." if len(req.query) > 30 else req.query
                db.commit()
        else:
            title = req.query[:30] + "..." if len(req.query) > 30 else req.query
            conv = models.Conversation(user_id=current_user.id, title=title)
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # Save user message
        user_msg = models.Message(conversation_id=conv.id, role="user", content=req.query)
        db.add(user_msg)
        db.commit()

        # Generate bot response
        result = query_rag(req.query)
        bot_answer = result["answer"]

        # Save bot message
        bot_msg = models.Message(conversation_id=conv.id, role="bot", content=bot_answer)
        db.add(bot_msg)
        db.commit()

        return schemas.RetrieveResponse(
            answer=bot_answer, 
            sources=result.get("sources", []),
            conversation_id=conv.id
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"RAG query failed: {e}")