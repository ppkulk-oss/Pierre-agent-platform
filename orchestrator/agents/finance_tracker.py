#!/usr/bin/env python3
"""
Finance Tracker Agent Worker (Claude Haiku - Fast & Cheap)
Polls job_queue for 'finance_tracker' jobs, processes with Claude, writes results back.
"""

import os
import time
import json
from supabase import create_client, Client
import anthropic

def process_finance_job(job: dict) -> dict:
    """Process a finance/budget query with Claude Haiku."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    query = job['payload']['query']
    
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=500,
        system="""You are a budget tracking and finance assistant.
        Help track spending, analyze costs, and provide budget insights.
        Be concise and data-driven.""",
        messages=[{"role": "user", "content": query}]
    )
    
    return {
        "response": response.content[0].text,
        "model_used": "claude-3-haiku",
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens
    }

def poll_and_process():
    """Main polling loop."""
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    
    while True:
        try:
            result = supabase.rpc('claim_next_job', {
                'p_job_type': 'finance_tracker'
            }).execute()
            
            if not result.data:
                time.sleep(5)
                continue
            
            job = result.data
            job_id = job['id']
            
            print(f"💰 Processing finance job {job_id}: {job['payload']['query'][:50]}...")
            
            result_data = process_finance_job(job)
            
            supabase.table('job_queue').update({
                'status': 'completed',
                'result': result_data,
                'processed_at': 'now()'
            }).eq('id', job_id).execute()
            
            print(f"✅ Completed finance job {job_id}")
            
        except Exception as e:
            print(f"🔥 Finance agent error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    poll_and_process()
