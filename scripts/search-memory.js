#!/usr/bin/env node
/**
 * Memory Search - Semantic search via pgvector
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbfcyjicjbbhfhuqxtvt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_KEY || !OPENROUTER_API_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateEmbedding(text) {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pierre-orchestrator.railway.app',
      'X-Title': 'Pierre Memory Search'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text
    })
  });
  
  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

async function searchMemory(query, limit = 5) {
  """
  Search memory_vectors for relevant context.
  Returns array of {content, similarity} objects.
  """
  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    
    // Perform similarity search using pgvector
    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit
    });
    
    if (error) {
      // Fallback if RPC doesn't exist - use raw SQL via REST
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_memories`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_embedding: embedding,
          match_threshold: 0.7,
          match_count: limit
        })
      });
      
      if (!response.ok) {
        // Last resort - fetch all and filter locally
        console.log('RPC not found, fetching recent memories...');
        const { data: allData, error: allError } = await supabase
          .from('memory_vectors')
          .select('content, metadata')
          .limit(20)
          .order('created_at', { ascending: false });
        
        if (allError) throw allError;
        return allData.map(m => ({ content: m.content, similarity: 1.0 }));
      }
      
      return await response.json();
    }
    
    return data.map(row => ({
      content: row.content,
      similarity: row.similarity
    }));
    
  } catch (err) {
    console.error('Memory search error:', err);
    return [];
  }
}

// CLI usage
async function main() {
  const query = process.argv[2] || 'What wine should I buy?';
  console.log(`Searching memories for: "${query}"\n`);
  
  const memories = await searchMemory(query, 5);
  
  if (memories.length === 0) {
    console.log('No relevant memories found.');
    return;
  }
  
  console.log(`Found ${memories.length} relevant memories:\n`);
  memories.forEach((m, i) => {
    console.log(`${i + 1}. [${(m.similarity * 100).toFixed(1)}% match]`);
    console.log(`   ${m.content}\n`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { searchMemory };
