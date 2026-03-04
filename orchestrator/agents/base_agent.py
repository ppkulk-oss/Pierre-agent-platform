#!/usr/bin/env python3
"""
Generic Agent Worker Template
Copy this to create new agents. Just implement process_job() and set AGENT_TYPE.
"""

import os
import time
import json
from supabase import create_client, Client
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAgent(ABC):
    """Base class for all agents. Extend this to create new agent types."""
    
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
    
    @abstractmethod
    def process_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement this method with your agent's logic.
        Must return a dict with at least a 'response' key.
        """
        pass
    
    def poll_and_process(self):
        """Main polling loop - don't override this."""
        print(f"🤖 {self.agent_type} agent started. Polling for jobs...")
        
        while True:
            try:
                # Claim next job atomically
                result = self.supabase.rpc('claim_next_job', {
                    'p_job_type': self.agent_type
                }).execute()
                
                if not result.data:
                    time.sleep(5)
                    continue
                
                job = result.data
                job_id = job['id']
                
                print(f"📦 {self.agent_type} processing job {job_id}")
                
                # Process the job
                result_data = self.process_job(job)
                
                # Mark complete
                self.supabase.table('job_queue').update({
                    'status': 'completed',
                    'result': result_data,
                    'processed_at': 'now()'
                }).eq('id', job_id).execute()
                
                print(f"✅ {self.agent_type} completed job {job_id}")
                
            except Exception as e:
                print(f"🔥 {self.agent_type} error: {e}")
                time.sleep(10)


# ============================================================
# EXAMPLE: Create a new agent by extending BaseAgent
# ============================================================

class CodeReviewerAgent(BaseAgent):
    """Example: An agent that reviews code using Claude."""
    
    def __init__(self):
        super().__init__("code_reviewer")
        import anthropic
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    def process_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        query = job['payload']['query']
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system="You are a senior software engineer. Review code for bugs, security issues, and best practices.",
            messages=[{"role": "user", "content": query}]
        )
        
        return {
            "response": response.content[0].text,
            "model_used": "claude-sonnet-4",
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens
        }


class ResearchAgent(BaseAgent):
    """Example: An agent that does web research using Gemini."""
    
    def __init__(self):
        super().__init__("research")
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel("gemini-2.5-pro-exp-03-25")
    
    def process_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        query = job['payload']['query']
        
        response = self.model.generate_content(
            f"Research this topic thoroughly and provide a summary with sources: {query}"
        )
        
        return {
            "response": response.text,
            "model_used": "gemini-2.5-pro"
        }


# ============================================================
# HOW TO ADD A NEW AGENT:
# ============================================================
#
# 1. Create a new file: agents/my_new_agent.py
# 2. Extend BaseAgent and implement process_job()
# 3. Add to pierre_api.py ROUTE_MAP with keywords
# 4. Insert into Supabase agents table
# 5. Deploy as new Railway service or run locally
#
# Example:
#
#   class MovieAgent(BaseAgent):
#       def __init__(self):
#           super().__init__("movie_recommender")
#       
#       def process_job(self, job):
#           # Your logic here
#           return {"response": "Movie recs!"}
#
#   if __name__ == "__main__":
#       agent = MovieAgent()
#       agent.poll_and_process()
#

if __name__ == "__main__":
    # Example: Run the code reviewer
    agent = CodeReviewerAgent()
    agent.poll_and_process()
