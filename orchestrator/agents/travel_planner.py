#!/usr/bin/env python3
"""
Travel Planner Agent Worker (Google Gemini)
Polls job_queue for 'travel_planner' jobs, processes with Gemini, writes results back.
"""

import os
import time
import json
from supabase import create_client, Client
import google.generativeai as genai

def process_travel_job(job: dict) -> dict:
    """Process a travel-related query with Gemini."""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-pro-exp-03-25",
        system_instruction="""You are a meticulous travel planning assistant. 
        You help with flight bookings, hotel research, itinerary planning, and travel logistics.
        Be thorough, organized, and provide actionable recommendations with links and prices when possible."""
    )
    
    query = job['payload']['query']
    
    response = model.generate_content(query)
    
    return {
        "response": response.text,
        "model_used": "gemini-2.5-pro",
        "tokens_used": None  # Gemini doesn't always return token counts
    }

def poll_and_process():
    """Main polling loop with SKIP LOCKED for safe concurrency."""
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    
    while True:
        try:
            result = supabase.rpc('claim_next_job', {
                'p_job_type': 'travel_planner'
            }).execute()
            
            if not result.data:
                time.sleep(5)
                continue
            
            job = result.data
            job_id = job['id']
            
            print(f"✈️ Processing travel job {job_id}: {job['payload']['query'][:50]}...")
            
            result_data = process_travel_job(job)
            
            supabase.table('job_queue').update({
                'status': 'completed',
                'result': result_data,
                'processed_at': 'now()'
            }).eq('id', job_id).execute()
            
            print(f"✅ Completed travel job {job_id}")
            
        except Exception as e:
            print(f"🔥 Travel agent error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    poll_and_process()
