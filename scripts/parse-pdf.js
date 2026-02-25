const fs = require('fs');
const pdf = require('/data/workspace/skills/fastmail-reader/node_modules/pdf-parse');

const pdfPath = '/data/workspace/downloads/RMC - BMC 09_2025 to 03_2026 .pdf';

async function main() {
    console.log('📄 Parsing PDF schedule...\n');
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log('Pages:', data.numpages);
    console.log('\n📋 EXTRACTED TEXT:\n');
    console.log(data.text.substring(0, 3000));
    
    // Save full text
    fs.writeFileSync('/data/workspace/downloads/schedule-pdf-text.txt', data.text);
    console.log('\n✅ Full text saved to: schedule-pdf-text.txt');
}

main().catch(console.error);
