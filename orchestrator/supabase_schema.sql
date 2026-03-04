-- Job Queue Table (Transactional)
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'wine_hunter', 'travel_planner', etc.
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'processing', 'completed', 'failed'
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Index for queue polling
CREATE INDEX idx_job_queue_status_created ON job_queue(status, created_at) 
WHERE status = 'new';

-- Memory Vectors Table (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding size
    metadata JSONB, -- source, timestamp, agent, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX idx_memory_vectors_embedding ON memory_vectors 
USING hnsw (embedding vector_cosine_ops);

-- Agent Registry
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    config JSONB, -- model settings, prompts, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert your agents
INSERT INTO agents (name, role, config) VALUES
('wine_hunter', 'wine_allocation', '{"model": "claude-sonnet-4", "system_prompt": "You are a wine allocation hunter..."}'),
('travel_planner', 'travel_assistant', '{"model": "gemini-2.5-pro", "system_prompt": "You are a travel planning assistant..."}'),
('finance_tracker', 'budget_analyst', '{"model": "claude-haiku", "system_prompt": "You are a budget tracking assistant..."}');

-- Trigger for job completion webhook
CREATE OR REPLACE FUNCTION notify_job_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM pg_notify('job_completed', json_build_object(
            'id', NEW.id,
            'job_type', NEW.job_type,
            'result', NEW.result
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_completed_trigger
    AFTER UPDATE ON job_queue
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_completed();

-- RPC Function: Atomically claim next job (SKIP LOCKED for concurrency safety)
CREATE OR REPLACE FUNCTION claim_next_job(p_job_type VARCHAR)
RETURNS TABLE (
    id UUID,
    job_type VARCHAR,
    payload JSONB,
    status VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    UPDATE job_queue
    SET status = 'processing', updated_at = NOW()
    WHERE id = (
        SELECT jq.id 
        FROM job_queue jq
        WHERE jq.job_type = p_job_type 
          AND jq.status = 'new'
        ORDER BY jq.created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    RETURNING job_queue.id, job_queue.job_type, job_queue.payload, 
              job_queue.status, job_queue.created_at, job_queue.updated_at;
END;
$$ LANGUAGE plpgsql;
