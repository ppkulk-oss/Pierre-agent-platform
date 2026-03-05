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

def call_openrouter_chat(model, system_prompt, user_message):
    """Call OpenRouter chat completions API."""
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

def call_openrouter_embedding(content):
    """Generate embedding via OpenRouter."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pierre-orchestrator.railway.app",
        "X-Title": "Pierre Orchestrator"
    }
    
    data = {
        "model": "openai/text-embedding-3-small",
        "input": content
    }
    
    response = requests.post(
        "https://openrouter.ai/api/v1/embeddings",
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()

def search_memory(query_embedding, match_threshold=0.7, match_count=5):
    """Search memory_vectors for relevant context using match_memory RPC."""
    try:
        response = supabase.rpc("match_memory", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count
        }).execute()
        
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"⚠️ Memory search error: {e}")
        return []

def store_memory_vector(content, metadata=None):
    """Store content with embedding in memory_vectors table."""
    result = call_openrouter_embedding(content)
    embedding = result['data'][0]['embedding']
    
    data = {
        "content": content,
        "embedding": embedding,
        "metadata": metadata or {
            "source": "worker_embed_memory",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }
    
    supabase.table("memory_vectors").insert(data).execute()
    return {"stored": True, "dimensions": len(embedding)}

def process_job(job):
    """Process a job using the appropriate agent."""
    job_type = job['job_type']
    
    # Special handling for embed_memory jobs
    if job_type == "embed_memory":
        content = job['payload'].get('content', '')
        if not content:
            return {"error": "No content provided for embedding", "stored": False}
        
        try:
            metadata = job['payload'].get('metadata', {})
            result = store_memory_vector(content, metadata)
            return {
                "response": f"Memory stored: {content[:100]}...",
                "stored": True,
                "dimensions": result["dimensions"]
            }
        except Exception as e:
            return {
                "error": str(e),
                "response": f"Error storing memory: {str(e)}",
                "stored": False
            }
    
    # Standard chat agent jobs
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
    system_prompt = agent_config.get('system_prompt', 'You are a helpful assistant.')
    
    try:
        # STEP 1: Generate embedding of the query
        embedding_result = call_openrouter_embedding(query)
        query_embedding = embedding_result['data'][0]['embedding']
        
        # STEP 2: Search memory for relevant context
        memories = search_memory(query_embedding)
        
        # STEP 3: Build context-enhanced prompt
        if memories:
            memory_context = "\n\n--- RELEVANT CONTEXT FROM MEMORY ---\n"
            for i, mem in enumerate(memories, 1):
                memory_context += f"\n[{i}] {mem.get('content', '')}\n"
            memory_context += "\n--- END CONTEXT ---\n"
            
            enhanced_prompt = system_prompt + memory_context + "\n\nUse the above context to provide a personalized, accurate response. If the context doesn't contain relevant information, proceed with your general knowledge."
            print(f"   📚 Found {len(memories)} relevant memories")
        else:
            enhanced_prompt = system_prompt
            print(f"   📭 No relevant memories found")
        
        # STEP 4: Call OpenRouter chat with enhanced context
        result = call_openrouter_chat(model, enhanced_prompt, query)
        response_text = result['choices'][0]['message']['content']
        
        return {
            "response": response_text,
            "model_used": model,
            "tokens_used": result.get('usage', {}).get('total_tokens', 0),
            "memories_used": len(memories)
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
                if job['job_type'] == 'embed_memory':
                    print(f"   Content: {job['payload'].get('content', '')[:50]}...")
                else:
                    print(f"   Query: {job['payload'].get('query', '')[:50]}...")
                
                # Process job (chat or embedding)
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
