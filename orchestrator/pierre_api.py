import os
import re
from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
from supabase import create_client, Client

# --- CONFIG ---
app = FastAPI(title="Pierre Orchestrator API")

# Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
WEBHOOK_SECRET = os.getenv("SUPABASE_WEBHOOK_SECRET")
API_KEY = os.getenv("PIERRE_API_KEY")

# Safety Checks
if not WEBHOOK_SECRET:
    print("⚠️ WARNING: SUPABASE_WEBHOOK_SECRET is missing.")
if not API_KEY:
    print("⚠️ WARNING: PIERRE_API_KEY is missing. /submit-task is insecure.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- ROUTING LOGIC ---
# Add new agent keywords here to expand the system
ROUTE_MAP = {
    # Wine & Beverage
    r"\b(wine|cornas|syrah|bottle|vintner|allocation|burgundy|rhone|cote-rotie|champagne)\b": "wine_hunter",
    
    # Travel & Logistics  
    r"\b(flight|hotel|japan|trip|travel|itinerary|nrt|ewr|vacation|booking|airbnb)\b": "travel_planner",
    
    # Finance & Budget
    r"\b(budget|spend|cost|finance|expense|money|price|deal|save|invest)\b": "finance_tracker",
    
    # Coding & Tech (examples for future agents)
    # r"\b(code|review|python|bug|fix|refactor|pull.?request)\b": "code_reviewer",
    # r"\b(research|search|find|look.?up|investigate)\b": "research",
}

def determine_agent(query: str) -> str:
    """Regex-based routing. Returns 'general' if no match."""
    query_lower = query.lower()
    for pattern, agent_role in ROUTE_MAP.items():
        if re.search(pattern, query_lower):
            return agent_role
    return "general"

# --- API MODELS ---
class TaskRequest(BaseModel):
    query: str
    source: str = "telegram"

# --- ENDPOINTS ---
@app.get("/")
def health_check():
    return {"status": "running", "mode": "orchestrator_only"}

@app.post("/submit-task")
async def submit_task(task: TaskRequest, x_api_key: str = Header(None)):
    """
    Ingest task -> Route -> Queue in Supabase.
    Requires PIERRE_API_KEY header.
    """
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    
    agent_role = determine_agent(task.query)
    print(f"📍 Routing '{task.query}' to agent: {agent_role}")
    
    data = {
        "job_type": agent_role,
        "payload": {"query": task.query, "source": task.source},
        "status": "new"
    }
    
    try:
        response = supabase.table("job_queue").insert(data).execute()
        # Handle potential empty response list safely
        if response.data:
            job_id = response.data[0]['id']
            return {"status": "queued", "job_id": job_id, "routed_to": agent_role}
        return {"status": "queued", "note": "No data returned, check RLS policies."}
    except Exception as e:
        print(f"🔥 Error queuing job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhooks/job-completed")
async def job_completed_webhook(request: Request, x_webhook_secret: str = Header(None)):
    """
    Triggered by Supabase when job is done.
    Requires SUPABASE_WEBHOOK_SECRET header.
    """
    if x_webhook_secret != WEBHOOK_SECRET:
        print(f"⛔ Unauthorized Webhook Attempt. Received: {x_webhook_secret}")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    payload = await request.json()
    record = payload.get("record", {})
    
    if record.get("status") != "completed":
        return {"status": "ignored", "reason": "not_completed"}
    
    result = record.get("result", {})
    job_id = record.get("id")
    
    print(f"✅ JOB COMPLETE [ID: {job_id}]")
    print(f"📝 Result: {result}")
    
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    # Local dev fallback
    uvicorn.run(app, host="0.0.0.0", port=8000)
