from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.agent.graph import app as agent_workflow
from langchain_core.messages import HumanMessage

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    file_paths: Optional[List[str]] = []
    data_schemas: Optional[List[Dict[str, Any]]] = []

@router.post("/")
async def chat_endpoint(req: ChatRequest):
    """Processes user queries via the Agent workflow."""
    
    # Construct initial state, mapped directly to AgentState
    state = {
        "messages": [HumanMessage(content=req.message)],
        "file_paths": req.file_paths,
        "data_schemas": req.data_schemas,
        "execution_error": None,
        "retry_count": 0
    }
    
    # Execution options. Using thread_id as the session_id allows graphs to track memory internally, 
    # though persistence requires a checkpointer which is not yet installed.
    config = {"configurable": {"thread_id": req.session_id}}
    
    try:
        # Run graph
        result = agent_workflow.invoke(state, config=config)
        messages = result["messages"]
        last_message = messages[-1].content
        return {"response": last_message}
        
    except Exception as e:
        import traceback
        with open("/tmp/chat_error.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """Retrieves chat history from checkpointer."""
    config = {"configurable": {"thread_id": session_id}}
    state_snapshot = agent_workflow.get_state(config)
    
    if not state_snapshot.values:
        return {"messages": []}
        
    messages = state_snapshot.values.get("messages", [])
    formatted_msgs = []
    for m in messages:
        if m.type == "human":
            formatted_msgs.append({"role": "user", "text": m.content})
        elif m.type == "ai":
            # Only display AI messages containing text string
            if m.content:
                formatted_msgs.append({"role": "bot", "text": m.content})
                
    return {"messages": formatted_msgs}
