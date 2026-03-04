#!/usr/bin/env node
/**
 * Memory Vacuum - Inserts embed jobs directly to job_queue for worker to process
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qqlakdjvopsqpdnrqnga.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Knowledge chunks about Prashant
const facts = [
  // Family
  "Prashant Kulkarni has two daughters: Lara (age 12) and Riya (age 14)",
  "Riya Kulkarni is mostly vegetarian but eats chicken",
  "Lara Kulkarni is a picky eater who likes bland foods like mac & cheese and plain pasta",
  "Prashant's wife is Tejal Kulkarni, who eats seafood and chicken but no beef",
  "Both daughters are intermediate skiers at Level 5, can handle blue runs comfortably",
  
  // Location
  "Prashant lives in Holmdel, New Jersey 07733",
  "Prashant's timezone is US Eastern Standard Time (EST/ET)",
  "Prashant's home airport is EWR (Newark Liberty International)",
  
  // Wine - General Preferences
  "Prashant is a Burgundy enthusiast who loves Bonnes-Mares Grand Cru",
  "Prashant prefers terroir-driven, structured wines - absolutely no fruit bombs",
  "Prashant has no wine cellar, drinks by the bottle, prefers young-drinking wines",
  "Prashant is a deal hunter looking for exceptional value buys like 2006 Haut-Brion at $450",
  "Prashant buys wine from Flemington source",
  "Prashant owns Dugat-Py La Petite Levrière in his collection",
  
  // Wine - The "Dead Fruit" Rule
  "Prashant's palate profile is 'Necromancer' - prefers wines where primary fruit has died, revealing earth/rock/skeleton",
  "Levet 2022 Côte-Rôtie failed for Prashant because solar vintage = baby fat fruit covering the meat",
  "Las Cases 2012 hit for Prashant because 14 years = fruit is dead, only graphite/cedar remains",
  "Prashant targets wines 10+ years of age (2016 or older)",
  "Prashant avoids solar/hot vintages 2018-2022 for young wines",
  "Prashant's safe zones: Cornas, Bordeaux (aged), Bandol (aged), Dunn Napa",
  "Prashant removed Côte-Rôtie from his list - too floral/aromatic, including Jamet",
  "Balthazar 2019 is solar vintage - needs 3-4 hour decant OR wait 5 years",
  "Prashant's rule: If wine describes 'lush fruit', DELETE it",
  
  // Wine - Kill List Targets
  "Prashant is hunting Clape Cornas 2013-2014 (cool vintages) at $250 target price",
  "Prashant is hunting Léoville Barton 2009-2010 at $200 target price",
  "Prashant is hunting Montrose 2005, 2008 at $250 target price",
  "Prashant is hunting Tempier Bandol 2011, 2013 at $180 target price",
  "Prashant is hunting Dunn Howell Mountain 2011, 2013 at $220 target price",
  "Prashant is hunting Paolo Bea Pagliaro 2012, 2015 at $145 target price",
  "Prashant is hunting Sorrel Le Gréal 2013-2014 at $210 target price",
  "Prashant is hunting Pape Clément 1998, 2004 at $150-200 target price",
  "Prashant is hunting Cappellano Barolo 2010, 2013 at $300 target price",
  "Prashant is hunting Allemand Chaillot 2011, 2014 at $375 target price",
  "Thierry Allemand Cornas Reynard is on hold until fall 2026",
  
  // Travel - Japan Trip April 2026
  "Prashant's Japan trip is April 1-10, 2026 with family of 4",
  "Prashant's United Airlines confirmation: JWT23D",
  "Prashant's outbound flight UA79 departs EWR March 31 at 11:25 AM, arrives Tokyo NRT April 1 at 2:30 PM",
  "Prashant's return flight UA78 departs Tokyo NRT April 10 at 5:15 PM, arrives EWR same day at 5:00 PM",
  "Prashant paid $4,369.72 + 216K miles for Japan flights, total cost $5,881.72",
  "Prashant's Japan trip seats: 50K/50L/50F/50J outbound, 51K/51L/51F/51J return",
  "Prashant's Japan trip eTickets: 0162343149791 through 0162343149794",
  
  // Hotels - Japan
  "Tokyo hotel: Royal Park Hotel Iconic Shiodome, Apr 1-4, confirmation 6210444904 PIN 5140",
  "Hakone hotel: Kowakien Mikawaya Ryokan, Apr 4-5, Expedia 72068424131155",
  "Kyoto hotel: Cross Hotel Kyoto, Apr 5-7, Expedia 72068669603342",
  "Osaka hotel: Hotel Hankyu RESPIRE, Apr 7-9, Expedia 72068670183986",
  "Narita hotel: Hotel Nikko Narita, Apr 9-10, Expedia 72068692164929",
  
  // Travel Style
  "Prashant prefers family ski trips for family of 4",
  "Prashant is budget-conscious but willing to splurge selectively on unique experiences",
  "Prashant prefers unique experiences like snowcat dinner over generic luxury",
  "Prashant wants to visit Appenzell, Switzerland (noted Feb 2026)",
  
  // Previous Travel
  "Prashant's Beaver Creek ski trip Feb 7-11, 2026 was a great success",
  "Beaver Creek ski school was worth it - girls reached Level 5",
  "Beano's Cabin dinner was cancelled due to insufficient snow for snowcat",
  "Prashant would return to Beaver Creek - bookmark for future",
  
  // Movies
  "Prashant's all-time favorite movies: Rounders (1998), Boiler Room (2000)",
  "Prashant rates Heat (1995), The Departed (2006), The Town (2010) as amazing",
  "Prashant loves all John Wick movies (1-4), rates them 5 stars",
  "Prashant's watched list includes: Blade Runner 2049, The Menu, The Killer, Incendies, Arrival, The Call",
  "Prashant's movie backlog: The Rover, Atomic Blonde, The Raid 1 & 2, Kill Bill 1 & 2",
  "Prashant tracks Denis Villeneuve, Michael Mann, David Fincher, Chad Stahelski, Charlize Theron",
  
  // Books
  "Prashant finished Recursion by Blake Crouch - mind-bending sci-fi",
  "Prashant finished The Silent Patient by Alex Michaelides - dark thriller",
  "Prashant's to-read list: Dark Matter by Blake Crouch, The Maidens by Alex Michaelides",
  
  // Technical Preferences
  "Prashant learned: Streamlit is not Flask - use Flask + Jinja2 for custom CSS UIs",
  "Prashant uses Railway for web dashboard deployment",
  "Prashant's Audi key battery replacement video: https://youtu.be/CurWSFtxRl4",
  "Prashant's Audi key trick: angle of flathead screwdriver matters",
  
  // Pierre Lessons
  "Pierre lesson: Never claim to make phone calls without VoIP enabled",
  "Pierre lesson: Always verify attachments BEFORE answering",
  "Pierre lesson: Set actual reminders when promising to ping about meds",
  "Pierre lesson: Say 'I don't know' instead of hallucinating confirmation numbers"
];

async function queueEmbedJob(content) {
  const { error } = await supabase
    .from('job_queue')
    .insert({
      job_type: 'embed_memory',
      payload: {
        content: content,
        metadata: {
          source: 'memory_vacuum',
          type: 'user_fact',
          about: 'prashant'
        }
      },
      status: 'new'
    });
  
  if (error) throw error;
}

async function main() {
  console.log('🧠 Memory Vacuum - Queueing embed jobs');
  console.log(`Processing ${facts.length} facts about Prashant...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < facts.length; i++) {
    const fact = facts[i];
    console.log(`[${i + 1}/${facts.length}] ${fact.substring(0, 60)}...`);
    
    try {
      await queueEmbedJob(fact);
      console.log(`   ✅ Queued`);
      success++;
      
      // Small delay to be nice to the DB
      await new Promise(r => setTimeout(r, 50));
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Done! ${success} facts queued, ${failed} failed.`);
  console.log('Worker will process embeddings and store in memory_vectors.');
  console.log('Run: SELECT content FROM memory_vectors; to verify.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
