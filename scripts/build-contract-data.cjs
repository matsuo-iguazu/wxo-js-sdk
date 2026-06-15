#!/usr/bin/env node
/**
 * Wraps contract JSON files into JS files for Garoon customization.
 * Output: data/contracts/contract-data-{name}.js
 *   → window.wxoContractData = { ... };
 *
 * Usage: node scripts/build-contract-data.js
 */

const fs = require('fs');
const path = require('path');

const targets = [
  { input: 'customer.json', output: 'garoon-contract-data-customer.js', varName: 'wxoContractDataCustomer' },
  { input: 'supplier.json', output: 'garoon-contract-data-supplier.js', varName: 'wxoContractDataSupplier' },
];

const dataDir = path.join(__dirname, '../data/contracts');

targets.forEach(({ input, output, varName }) => {
  const inputPath = path.join(dataDir, input);
  const outputPath = path.join(dataDir, output);

  if (!fs.existsSync(inputPath)) {
    console.warn(`skip: ${input} not found`);
    return;
  }

  const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const js = `window.${varName} = ${JSON.stringify(json, null, 2)};\n`;
  fs.writeFileSync(outputPath, js, 'utf8');
  console.log(`created: ${output} (window.${varName})`);
});
