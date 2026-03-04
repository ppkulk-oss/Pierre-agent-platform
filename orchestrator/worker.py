import os
import time
import requests
from datetime import datetime, timezone
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_next_job():
    response = supabase.rpc("pop_next_job", {}).execute()
    if response.data:
        return response.data[0]
    return None

def get_agent_config(agent_name):
    """Fetch agent config from Supabase agents table."""
    response = supabase.table("agents").select("*").eq("name", agent_name).execute()
    if response.data:
        return response.data[0]
    return None

def call_openrouter(model, system_prompt, user_message):
    """Call OpenRouter API."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pierre-orchestrator.railway.app",
        "X-Title": "Pierre Orchestrator"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 2000
    }
    
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()

def process_job(job):
    """Process a job using the appropriate agent."""
    job_type = job['job_type']
    query = job['payload'].get('query', '')
    
    # Get agent config from database
    agent_config = get_agent_config(job_type)
    if not agent_config:
        return {
            "error": f"No agent config found for {job_type}",
            "response": None
        }
    
    config = agent_config.get('config', {})
    model = config.get('model', 'anthropic/claude-3.5-sonnet')
    system_prompt = config.get('system_prompt', 'You are a helpful assistant.')
    
    try:
        # Call OpenRouter
        result = call_openrouter(model, system_prompt, query)
        response_text = result['choices'][0]['message']['content']
        
        return {
            "response": response_text,
            "model_used": model,
            "tokens_used": result.get('usage', {}).get('total_tokens', 0)
        }
    except Exception as e:
        return {
            "error": str(e),
            "response": f"Error processing job: {str(e)}"
        }

def run_worker():
    print("🍷 Pierre Worker Starting...")
    while True:
        try:
            job = fetch_next_job()
            if job:
                print(f"📦 Processing Job {job['id']}: {job['job_type']}")
                print(f"   Query: {job['payload'].get('query', '')[:50]}...")
                
                # Process with LLM
                result = process_job(job)
                
                # Write result back
                supabase.table("job_queue").update({
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "result": result
                }).eq("id", job['id']).execute()
                
                print(f"✅ Job {job['id']} completed. Model: {result.get('model_used', 'unknown')}")
            else:
                time.sleep(2)
        except Exception as e:
            print(f"🔥 Worker Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker()
