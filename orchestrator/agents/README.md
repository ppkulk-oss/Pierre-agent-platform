# Pierre Orchestrator - Agent System

## Current Agents

| Agent | Model | Purpose | Keywords |
|-------|-------|---------|----------|
| `wine_hunter` | Claude Sonnet 4 | Wine allocations, deals, recommendations | wine, cornas, syrah, bottle, allocation, burgundy, rhone |
| `travel_planner` | Gemini 2.5 Pro | Travel planning, flights, hotels | flight, hotel, trip, travel, itinerary, vacation, booking |
| `finance_tracker` | Claude Haiku | Budget tracking, cost analysis | budget, spend, cost, finance, expense, money, price, deal |

## Creating a New Agent

### 1. Create the Agent File

```python
# agents/my_agent.py
from base_agent import BaseAgent
import os

class MyAgent(BaseAgent):
    def __init__(self):
        super().__init__("my_agent_name")  # Must match database
        # Initialize your AI client here
    
    def process_job(self, job):
        query = job['payload']['query']
        
        # Your AI logic here
        response = f"Processed: {query}"
        
        return {
            "response": response,
            "model_used": "my-model",
            "metadata": {}
        }

if __name__ == "__main__":
    agent = MyAgent()
    agent.poll_and_process()
```

### 2. Add Routing Keywords

Edit `pierre_api.py` and add your keywords to `ROUTE_MAP`:

```python
ROUTE_MAP = {
    # ... existing routes ...
    r"\b(your|keywords|here)\b": "my_agent_name",
}
```

### 3. Register in Supabase

```sql
INSERT INTO agents (name, role, config) VALUES (
    'my_agent_name',
    'my_role',
    '{"model": "claude-sonnet-4", "system_prompt": "You are..."}'
);
```

### 4. Deploy

**Option A: Separate Railway Service (Recommended)**
- Create new Railway service from same repo
- Set `AGENT_TYPE=my_agent_name` env var
- Use different start command: `python agents/my_agent.py`

**Option B: Run Locally**
```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export ANTHROPIC_API_KEY=...
python agents/my_agent.py
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│  API Layer  │────▶│   Supabase  │
│   (User)    │     │  (Railway)  │     │  (Postgres) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          │                     │                     │
                          ▼                     ▼                     ▼
                   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                   │Wine Hunter  │      │Travel Agent │      │Finance Agent│
                   │(Claude)     │      │(Gemini)     │      │(Haiku)      │
                   └─────────────┘      └─────────────┘      └─────────────┘
```

## Scaling

- Each agent is **stateless** - scale horizontally by running multiple instances
- `SKIP LOCKED` ensures no duplicate job processing
- Add agents without redeploying the API

## Testing

```bash
# Test wine agent
curl -X POST https://your-app.up.railway.app/submit-task \
  -H "x-api-key: YOUR_KEY" \
  -d '{"query": "Find Allemand Cornas deals"}'

# Test travel agent  
curl -X POST https://your-app.up.railway.app/submit-task \
  -H "x-api-key: YOUR_KEY" \
  -d '{"query": "Plan a trip to Japan"}'

# Test finance agent
curl -X POST https://your-app.up.railway.app/submit-task \
  -H "x-api-key: YOUR_KEY" \
  -d '{"query": "Track wine spending"}'
```
