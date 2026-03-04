#!/usr/bin/env python3
"""
Wine Hunter Agent Worker
Polls job_queue for 'wine_hunter' jobs, processes with Claude/Gemini, writes results back.
Run this as a separate Railway service or cron job.
"""

import os
import time
import json
from supabase import create_client, Client
import anthropic

def process_wine_job(job: dict) -> dict:
    """Process a wine-related query with Claude."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    query = job['payload']['query']
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system="""You are Pierre, a chaotic but knowledgeable wine assistant. 
        You help find wine allocations, track prices, and provide recommendations.
        Be witty, opinionated, and helpful.""",
        messages=[{"role": "user", "content": query}]
    )
    
    return {
        "response": response.content[0].text,
        "model_used": "claude-sonnet-4",
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens
    }

def poll_and_process():
    """Main polling loop with SKIP LOCKED for safe concurrency."""
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    
    while True:
        try:
            # Atomically claim next job using SKIP LOCKED
            # Note: This requires raw SQL via RPC or PostgREST
            result = supabase.rpc('claim_next_job', {
                'p_job_type': 'wine_hunter'
            }).execute()
            
            if not result.data:
                time.sleep(5)  # No jobs, wait
                continue
            
            job = result.data
            job_id = job['id']
            
            print(f"🍷 Processing wine job {job_id}: {job['payload']['query'][:50]}...")
            
            # Process with AI
            result_data = process_wine_job(job)
            
            # Update job as completed
            supabase.table('job_queue').update({
                'status': 'completed',
                'result': result_data,
                'processed_at': 'now()'
            }).eq('id', job_id).execute()
            
            print(f"✅ Completed job {job_id}")
            
        except Exception as e:
            print(f"🔥 Error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    poll_and_process()
