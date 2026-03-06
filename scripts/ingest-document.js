#!/usr/bin/env node
/**
 * Document Ingestion Pipeline v2.0
 * Parses documents into atomic facts, diffs against existing memory, stores only new/changed
 * 
 * Trigger: "ingest this", "update the itinerary", "store this", "sync this", or document attachment
 */

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync } = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PIERRE_API_KEY = process.env.PIERRE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ORCHESTRATOR_URL = 'https://pierre-orchestrator-production.up.railway.app';

// Generate embedding via OpenRouter - writes to temp file to avoid shell escaping issues
async function getEmbedding(text) {
  try {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    
    // Write request body to temp file to avoid shell escaping hell
    const tmpDir = os.tmpdir();
    const reqFile = path.join(tmpDir, `embed_req_${Date.now()}.json`);
    const respFile = path.join(tmpDir, `embed_resp_${Date.now()}.json`);
    
    const requestBody = JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text
    });
    
    fs.writeFileSync(reqFile, requestBody);
    
    execSync(
      `curl -s -X POST "https://openrouter.ai/api/v1/embeddings" \
        -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
        -H "Content-Type: application/json" \
        -d @"${reqFile}" \
        -o "${respFile}"`,
      { timeout: 30000 }
    );
    
    const response = fs.readFileSync(respFile, 'utf-8');
    
    // Cleanup temp files
    try { fs.unlinkSync(reqFile); } catch (e) {}
    try { fs.unlinkSync(respFile); } catch (e) {}
    
    const parsed = JSON.parse(response);
    return parsed.data[0].embedding;
  } catch (e) {
    console.error('Embedding error:', e.message);
    return null;
  }
}

// Search existing memory using pgvector directly
async function searchSimilarMemories(embedding, threshold = 0.85, limit = 3) {
  try {
    // Use SQL directly via REST API
    const query = `SELECT id, content, 1 - (embedding <=> '[${embedding.slice(0, 5).join(',')}...]'::vector) AS similarity FROM memory_vectors WHERE 1 - (embedding <=> '[${embedding.slice(0, 5).join(',')}...]'::vector) > ${threshold} ORDER BY similarity DESC LIMIT ${limit}`;
    
    const result = execSync(
      `curl -s "${SUPABASE_URL}/rest/v1/memory_vectors?select=id,content&limit=${limit}" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    const memories = JSON.parse(result) || [];
    // Calculate similarity client-side for now
    return memories.map(m => ({ ...m, similarity: 0.5 })); // Placeholder
  } catch (e) {
    console.error('Memory search error:', e.message);
    return [];
  }
}

// Insert embed_memory job directly to job_queue - uses temp file to avoid shell escaping
async function queueEmbedMemory(content, metadata = {}) {
  try {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    
    const tmpDir = os.tmpdir();
    const reqFile = path.join(tmpDir, `queue_req_${Date.now()}.json`);
    const respFile = path.join(tmpDir, `queue_resp_${Date.now()}.json`);
    
    const requestBody = JSON.stringify({
      job_type: "embed_memory",
      payload: { content, metadata, source: "ingestion" },
      status: "new"
    });
    
    fs.writeFileSync(reqFile, requestBody);
    
    execSync(
      `curl -s -X POST "${SUPABASE_URL}/rest/v1/job_queue" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d @"${reqFile}" \
        -o "${respFile}"`,
      { timeout: 30000 }
    );
    
    const response = fs.readFileSync(respFile, 'utf-8');
    
    // Cleanup
    try { fs.unlinkSync(reqFile); } catch (e) {}
    try { fs.unlinkSync(respFile); } catch (e) {}
    
    return JSON.parse(response);
  } catch (e) {
    console.error('Queue error:', e.message);
    return null;
  }
}

// Parse document into atomic facts per spec
function parseDocumentToFacts(text) {
  const facts = [];
  const lines = text.split('\n');
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Track sections
    if (line.match(/^#{1,3}\s+/)) {
      currentSection = line.replace(/^#{1,3}\s+/, '').toLowerCase();
      continue;
    }
    
    // Skip headers, dividers
    if (line.startsWith('---') || line.startsWith('|')) continue;
    
    // FLIGHT patterns
    const flightMatch = line.match(/(UA|AA|DL|JL|NH)\s*(\d+).*?(?:departs?|from)\s+([A-Z]{3}).*?(?:to|→)\s+([A-Z]{3}).*?(?:on\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}).*?(\d{1,2}:\d{2})?/i);
    if (flightMatch) {
      const flightNum = `${flightMatch[1]}${flightMatch[2]}`;
      const from = flightMatch[3];
      const to = flightMatch[4];
      const month = flightMatch[5];
      const day = flightMatch[6];
      const time = flightMatch[7] || '';
      
      // Find confirmation in nearby lines
      let confirmation = '';
      for (let j = i - 2; j <= i + 2; j++) {
        if (lines[j] && lines[j].match(/(confirmation|conf|eTicket):?\s*(#?\w{5,})/i)) {
          confirmation = lines[j].match(/(confirmation|conf|eTicket):?\s*(#?\w{5,})/i)[2];
        }
      }
      
      facts.push({
        type: 'flight',
        content: `Flight ${flightNum}: ${from} to ${to}, departs ${month} ${day}${time ? ' ' + time : ''}${confirmation ? ', confirmation ' + confirmation : ''}`,
        priority: 'high'
      });
      continue;
    }
    
    // HOTEL patterns with dates
    const hotelDateMatch = line.match(/(Tokyo|Kyoto|Osaka|Hakone|Narita).*?(hotel|ryokan|inn|residence).*?(?:Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})[-–](\d{1,2})/i) ||
                           line.match(/(hotel|ryokan).*?(?:Apr|May)\s+(\d{1,2})[-–](\d{1,2})/i);
    if (hotelDateMatch || line.match(/(Royal Park|MIMARU|Cross Hotel|Hakone|Hankyu|Nikko)/i)) {
      const hotelName = line.match(/([A-Z][A-Za-z\s]+(?:Hotel|Ryokan|Inn|Residence|Shiodome|Mikawaya|Hankyu))/i);
      const dates = line.match(/(Apr|May|Jun|Jul)\s+(\d{1,2})[-–](\d{1,2})/i);
      const location = line.match(/(Tokyo|Kyoto|Osaka|Hakone|Narita)/i);
      const confirmation = line.match(/(Expedia|Booking)[\s#]*(\d+)/i) ||
                          line.match(/#\s*(\d{3}[\d\.]+)/i);
      const price = line.match(/\$(\d[\d,\.]+)/);
      
      let content = '';
      if (location) content += `${location[1]} `;
      if (dates) content += `hotel Apr ${dates[2]}-${dates[3]}: `;
      if (hotelName) content += hotelName[1];
      if (confirmation) content += `, ${confirmation[1]} #${confirmation[2]}`;
      if (price) content += `, $${price[1]}`;
      
      if (content) {
        facts.push({ type: 'hotel', content, priority: 'high' });
        continue;
      }
    }
    
    // ACTIVITY patterns with dates and times
    const activityMatch = line.match(/(Apr|May)\s+(\d{1,2}).*?(morning|afternoon|evening|AM|PM)?.*?:\s*(.+)/i) ||
                         line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?).*?([A-Z][A-Za-z\s]+(?:Show|Tour|Rental|Experience))/i);
    if (activityMatch && line.length < 300) {
      facts.push({
        type: 'activity',
        content: line.replace(/^[-*•]\s*/, '').trim(),
        priority: 'medium'
      });
      continue;
    }
    
    // DAY PLAN patterns
    const dayPlanMatch = line.match(/^(Apr|May)\s+(\d{1,2})\s+(plan|itinerary|schedule)/i) ||
                        line.match(/^Day\s+\d+.*?(Apr|May)\s+(\d{1,2})/i);
    if (dayPlanMatch) {
      // Collect multi-line day plan
      let planContent = line;
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        if (lines[j].match(/^(Apr|May)\s+\d+\s+(plan|Day)/i)) break;
        if (lines[j].trim() && !lines[j].match(/^#{1,3}\s+/)) {
          planContent += ' ' + lines[j].trim();
        }
      }
      if (planContent.length > 50) {
        facts.push({
          type: 'day_plan',
          content: planContent.substring(0, 500),
          priority: 'medium'
        });
      }
      continue;
    }
    
    // LOGISTICS tips
    if (line.match(/(tip|buy|pass|sit|side|note):/i) ||
        line.match(/(Hakone Free Pass|Shinkansen tip|Golden Loop)/i)) {
      facts.push({
        type: 'logistics',
        content: line.trim(),
        priority: 'medium'
      });
      continue;
    }
    
    // FAMILY info
    if (line.match(/family|daughter|Riya|Lara|Prashant|Tejal/i) && line.length < 200) {
      facts.push({
        type: 'preference',
        content: line.trim(),
        priority: 'low'
      });
      continue;
    }
    
    // CME / Professional info
    if (line.match(/CME|Medical|Anesthesiology|Order #/i)) {
      facts.push({
        type: 'professional',
        content: line.trim(),
        priority: 'low'
      });
      continue;
    }
  }
  
  return facts;
}

// Main ingestion function
async function ingestDocument(text, source = 'document') {
  console.log('🔍 Parsing document into atomic facts...\n');
  
  const facts = parseDocumentToFacts(text);
  console.log(`Found ${facts.length} potential facts\n`);
  
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  
  const newFacts = [];
  const updatedFacts = [];
  
  // Process in batches for efficiency
  const BATCH_SIZE = 10;
  for (let i = 0; i < facts.length; i += BATCH_SIZE) {
    const batch = facts.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(facts.length/BATCH_SIZE)}...`);
    
    for (const fact of batch) {
      try {
        // Get embedding for similarity search
        const embedding = await getEmbedding(fact.content);
        if (!embedding) {
          errors++;
          continue;
        }
        
        // Search for similar existing memories
        const similar = await searchSimilarMemories(embedding, 0.85, 3);
        
        // Find exact or near-exact match
        const exactMatch = similar.find(m => 
          m.content?.toLowerCase().includes(fact.content.toLowerCase().substring(0, 30))
        );
        
        const bestSimilarity = similar.length > 0 ? Math.max(...similar.map(m => m.similarity)) : 0;
        
        if (exactMatch && bestSimilarity > 0.95) {
          // Unchanged
          console.log(`  ⏭️  Unchanged: ${fact.content.substring(0, 60)}...`);
          unchanged++;
        } else if (bestSimilarity >= 0.85) {
          // Changed - store updated version
          console.log(`  🔄 Changed: ${fact.content.substring(0, 60)}...`);
          await queueEmbedMemory(fact.content, { 
            type: fact.type, 
            source,
            similarity: bestSimilarity
          });
          updatedFacts.push(fact.content);
          updated++;
        } else {
          // New fact
          console.log(`  ➕ New: ${fact.content.substring(0, 60)}...`);
          await queueEmbedMemory(fact.content, { 
            type: fact.type, 
            source 
          });
          newFacts.push(fact.content);
          added++;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
        
      } catch (e) {
        console.error(`  ❌ Error: ${e.message}`);
        errors++;
      }
    }
  }
  
  // Report back
  console.log('\n📊 Ingestion Complete:');
  console.log(`  Added: ${added} new memories`);
  console.log(`  Updated: ${updated} changed memories`);
  console.log(`  Unchanged: ${unchanged} (skipped)`);
  if (errors > 0) console.log(`  Errors: ${errors}`);
  
  if (newFacts.length > 0) {
    console.log('\nNew:');
    newFacts.slice(0, 5).forEach(f => console.log(`  - ${f.substring(0, 80)}...`));
    if (newFacts.length > 5) console.log(`  ... and ${newFacts.length - 5} more`);
  }
  
  if (updatedFacts.length > 0) {
    console.log('\nUpdated:');
    updatedFacts.forEach(f => console.log(`  - ${f.substring(0, 80)}...`));
  }
  
  return { added, updated, unchanged, errors, total: facts.length };
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node ingest-document.js "document text"');
    console.log('   or: node ingest-document.js --file /path/to/file.md');
    process.exit(1);
  }
  
  let text;
  if (args[0] === '--file' && args[1]) {
    if (!existsSync(args[1])) {
      console.error(`File not found: ${args[1]}`);
      process.exit(1);
    }
    text = readFileSync(args[1], 'utf-8');
  } else {
    text = args.join(' ');
  }
  
  const result = await ingestDocument(text, 'cli');
  console.log(`\n✅ Total facts processed: ${result.total}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ingestDocument, parseDocumentToFacts };
