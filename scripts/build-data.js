#!/usr/bin/env node
/**
 * build-data.js
 *
 * Single source of truth: data/source/products.csv + data/source/page_info.json
 *
 * Generates:
 *   data/sequel_catalog_rag.json
 *   data/sequel_catalog_rag_products_flat.json
 *   data/sequel_fasteners.json
 *
 * Also copies (unchanged) from data/source/:
 *   sequel_assemblies.json
 *   sequel_selection_guides.json
 *   sequel_assembly_gaps.json
 *
 * Run:  node scripts/build-data.js
 * Or:   npm run build
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'data', 'source');
const OUT  = path.join(ROOT, 'data');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(relPath) {
  const full = path.join(SRC, relPath);
  if (!fs.existsSync(full)) throw new Error(`Source file not found: ${full}`);
  return fs.readFileSync(full, 'utf-8');
}

function writeJSON(filename, data) {
  const full = path.join(OUT, filename);
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ Wrote ${filename} (${Array.isArray(data) ? data.length + ' items' : Object.keys(data).length + ' keys'})`);
}

/** Parse a CSV file into an array of objects. Handles quoted fields. */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      const v = values[idx] !== undefined ? values[idx].trim() : '';
      if (v !== '') row[h.trim()] = v;
    });
    if (Object.keys(row).length > 0) rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { result.push(''); break; }
    if (line[i] === '"') {
      // RFC 4180: quoted field — only starts when " is at field start
      let current = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') { current += '"'; i += 2; } // escaped quote
          else { i++; break; } // closing quote
        } else {
          current += line[i++];
        }
      }
      result.push(current);
      if (line[i] === ',') i++;
    } else {
      // Unquoted field — read until comma (any " inside is treated literally)
      let current = '';
      while (i < line.length && line[i] !== ',') current += line[i++];
      result.push(current);
      if (i < line.length && line[i] === ',') i++;
    }
  }
  return result;
}

/** Build a clean product object from a CSV row, dropping empty/irrelevant fields. */
function buildProduct(row) {
  const product = { item_number: row.item_number, name: row.name, section: row.section };

  const maybeNum = (field) => row[field] ? parseFloat(row[field]) : undefined;
  const maybeInt = (field) => row[field] ? parseInt(row[field], 10) : undefined;
  const maybeStr = (field) => row[field] || undefined;

  if (row.catalog_page_id) product.catalog_page = row.catalog_page_id;
  if (row.pdf_page)        product.pdf_page      = parseInt(row.pdf_page, 10);
  if (row.hole_style)      product.hole_style     = row.hole_style;
  if (row.diameter_in)     product.diameter       = maybeNum('diameter_in') + '"';
  if (row.thickness_in)    product.thickness      = maybeNum('thickness_in') + '"';
  if (row.material)        product.material       = row.material;
  if (row.finish)          product.finish         = row.finish;
  if (row.max_load_lbs)    product.max_load       = maybeNum('max_load_lbs') + ' lbs';
  if (row.length_in)       product.length         = maybeNum('length_in') + '"';
  if (row.cross_section)   product.cross_section  = row.cross_section;
  if (row.max_discs)       product.max_discs      = maybeInt('max_discs');
  if (row.spine_capacity)  product.spine_capacity = maybeInt('spine_capacity');
  if (row.width_in)        product.width          = maybeNum('width_in') + '"';
  if (row.height_in)       product.height         = maybeNum('height_in') + '"';
  if (row.jaw_opening_in)  product.jaw_opening    = row.jaw_opening_in + '"';
  if (row.hook_type)       product.hook_type      = row.hook_type;
  if (row.fastener_size)   product.size           = row.fastener_size;
  if (row.fastener_type)   product.type           = row.fastener_type;
  if (row.compatible_with) product.compatible_with = row.compatible_with;
  if (row.quantity_note)   product.quantity_note  = row.quantity_note;
  if (row.spacing_in)      product.spacing        = maybeNum('spacing_in') + '"';
  if (row.notes)           product.notes          = row.notes;
  if (row.needs_verification === 'TRUE') product.needs_verification = true;

  return product;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('\nSequel RAG — Data Build\n' + '─'.repeat(40));

// 1. Load source files
const products   = parseCSV(readFile('products.csv'));
const pageInfos  = JSON.parse(readFile('page_info.json'));

console.log(`\nLoaded: ${products.length} products, ${pageInfos.length} catalog pages`);

// 2. Validate: catch duplicates
const seenItems = new Map();
let errors = 0;
for (const row of products) {
  if (!row.item_number) { console.warn(`  ⚠ Row missing item_number: ${JSON.stringify(row)}`); errors++; continue; }
  if (seenItems.has(row.item_number)) {
    console.warn(`  ⚠ Duplicate item_number: ${row.item_number}`);
    errors++;
  }
  seenItems.set(row.item_number, true);
}

// 3. Validate: items_on_page references match page_info
const pageMap = new Map(pageInfos.map(p => [p.page_id, p]));
const productsByPage = new Map();
for (const row of products) {
  const pg = row.catalog_page_id;
  if (!pg) continue;
  if (!pageMap.has(pg)) {
    console.warn(`  ⚠ Product ${row.item_number} references unknown page_id "${pg}"`);
    errors++;
  }
  if (!productsByPage.has(pg)) productsByPage.set(pg, []);
  productsByPage.get(pg).push(row.item_number);
}

// 4. Report needs_verification items
const unverified = products.filter(r => r.needs_verification === 'TRUE');
if (unverified.length > 0) {
  console.log(`\n  ⚠ ${unverified.length} items flagged needs_verification (confirm against PDF):`);
  for (const r of unverified) console.log(`    • ${r.item_number} — ${r.notes || r.name}`);
}

if (errors > 0) {
  console.error(`\n✗ Build aborted: ${errors} error(s) found. Fix products.csv before continuing.\n`);
  process.exit(1);
}

console.log('\nGenerating output files...');

// 5. Build sequel_catalog_rag_products_flat.json
const productsFlat = {};
for (const row of products) {
  productsFlat[row.item_number] = buildProduct(row);
}
writeJSON('sequel_catalog_rag_products_flat.json', productsFlat);

// 6. Build sequel_catalog_rag.json (catalog pages with item lists)
const catalogPages = pageInfos.map(page => {
  const itemsOnPage = (productsByPage.get(page.page_id) || []);
  const entry = {
    page_id: page.page_id,
    pdf_page: page.pdf_page,
    section: page.section,
    title: page.title,
    raw_text: page.description,
    items_on_page: itemsOnPage
  };
  if (itemsOnPage.length === 0) entry.items_on_page = [];
  return entry;
});
writeJSON('sequel_catalog_rag.json', catalogPages);

// 7. Build sequel_fasteners.json (rich fastener objects for the fastener lookup)
const fasteners = products
  .filter(r => r.section === 'Fasteners')
  .map(row => ({
    item_number: row.item_number,
    name: row.name,
    type: row.fastener_type || '',
    size: row.fastener_size || '',
    material: row.material || '',
    finish: 'None (bare titanium)',
    use: `${row.name} for ${row.compatible_with || 'see catalog'}`,
    compatible_with: row.compatible_with ? [row.compatible_with] : [],
    quantity_note: row.quantity_note || ''
  }));
writeJSON('sequel_fasteners.json', fasteners);

// 8. Copy unchanged source files
const passthroughs = [
  'sequel_assemblies.json',
  'sequel_selection_guides.json',
  'sequel_assembly_gaps.json'
];
for (const filename of passthroughs) {
  const srcPath = path.join(SRC, filename);
  const outPath = path.join(OUT, filename);
  if (fs.existsSync(srcPath)) {
    const parsed = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n');
    console.log(`  ✓ Copied ${filename}`);
  } else {
    console.warn(`  ⚠ Source not found, skipping: ${filename}`);
  }
}

// 9. Summary
const sections = [...new Set(products.map(r => r.section).filter(Boolean))];
console.log('\nProduct counts by section:');
for (const sec of sections) {
  const count = products.filter(r => r.section === sec).length;
  const unverifiedCount = products.filter(r => r.section === sec && r.needs_verification === 'TRUE').length;
  const flag = unverifiedCount > 0 ? ` (${unverifiedCount} need verification)` : '';
  console.log(`  ${sec.padEnd(12)} ${String(count).padStart(3)} items${flag}`);
}
console.log(`\n  Total: ${products.length} products across ${sections.length} sections`);
console.log('\nBuild complete.\n');
