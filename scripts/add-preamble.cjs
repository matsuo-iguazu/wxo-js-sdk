#!/usr/bin/env node
/**
 * Extracts 前文 text from each .docx and prepends it to the contract JSON files.
 * Run once: node scripts/add-preamble.cjs
 */

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data/contracts');

// Which docx files contribute to which JSON key
const mapping = [
  { docx: 'BP-IGUAZUビジネスパートナー契約書.docx',  jsonFile: 'customer.json', contractKey: 'IGUAZUビジネスパートナー契約書（BP）' },
  { docx: 'BB-売買取引基本契約書.docx',              jsonFile: 'customer.json', contractKey: '売買取引基本契約書（BB）' },
  { docx: 'KBKF-購買基本契約書.docx',               jsonFile: 'supplier.json', contractKey: '購買基本契約書(業務委託条項含む)（KB/KF）' },
  { docx: 'KFKM-業務委託基本契約書.docx',           jsonFile: 'supplier.json', contractKey: '業務委託基本契約書（KF/KM）' },
];

async function extractPreamble(docxPath) {
  const r = await mammoth.extractRawText({ path: docxPath });
  const paras = r.value.split('\n').filter(l => l.trim());

  // Find the paragraph(s) that form the preamble:
  // starts with "次に記名" and ends just before the signature block
  const startIdx = paras.findIndex(p => p.startsWith('次に記名'));
  if (startIdx === -1) return '';

  const sigPattern = /^[（(]/;           // any line starting with ( or （ = signature block
  const datePattern = /^(?:年|契約締結日)/;

  const lines = [];
  for (let i = startIdx; i < paras.length; i++) {
    const p = paras[i];
    if (sigPattern.test(p) || datePattern.test(p)) break;
    lines.push(p);
  }
  return lines.join('\n');
}

(async () => {
  const jsons = {};

  for (const { docx, jsonFile, contractKey } of mapping) {
    const docxPath = path.join(dataDir, docx);
    const preamble = await extractPreamble(docxPath);
    console.log(`[${docx}] 前文 (${preamble.length}文字): ${preamble.substring(0, 60)}...`);

    if (!jsons[jsonFile]) {
      jsons[jsonFile] = JSON.parse(fs.readFileSync(path.join(dataDir, jsonFile), 'utf8'));
    }

    const contract = jsons[jsonFile][contractKey];
    if (!contract) {
      console.warn(`  ⚠ contractKey not found: ${contractKey}`);
      continue;
    }

    // Prepend 前文 as first key (overwrite if already exists)
    const updated = { '前文': { title: '前文', content: preamble, clauses: {} }, ...contract };
    jsons[jsonFile][contractKey] = updated;
    console.log(`  → added 前文 to ${contractKey}`);
  }

  // Write updated JSONs
  for (const [file, data] of Object.entries(jsons)) {
    const outPath = path.join(dataDir, file);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`saved: ${file}`);
  }
})();
