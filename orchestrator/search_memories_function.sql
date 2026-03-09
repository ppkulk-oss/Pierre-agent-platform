-- Add this to your Supabase SQL Editor

-- Similarity search function for memory_vectors
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  similarity FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.content,
    1 - (mv.embedding <=> query_embedding) AS similarity,
    mv.metadata
  FROM memory_vectors mv
  WHERE 1 - (mv.embedding <=> query_embedding) > match_threshold
  ORDER BY mv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
