#!/usr/bin/env node
/**
 * test-chatbot.js
 *
 * Tests the RAG retrieval layer (buildContext) for ~35 customer questions.
 * No OpenAI API key required — validates what context the LLM would receive.
 *
 * Run: node scripts/test-chatbot.js
 */

'use strict';

process.env.OPENAI_API_KEY = 'test-no-key-needed';

const fs   = require('fs');
const path = require('path');
const { buildContext } = require('../agents/ragAgent');

const ROOT    = path.join(__dirname, '..');
const REPORTS = path.join(ROOT, 'reports');
if (!fs.existsSync(REPORTS)) fs.mkdirSync(REPORTS);

// ── ANSI colours ──────────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;  // green
const Y = s => `\x1b[33m${s}\x1b[0m`;  // yellow
const R = s => `\x1b[31m${s}\x1b[0m`;  // red
const B = s => `\x1b[1m${s}\x1b[0m`;   // bold

// ── Test definitions ──────────────────────────────────────────────────────────
// Each test: { q, category, pass(context, pages), desc }
// pass() returns 'PASS' | 'PARTIAL' | 'FAIL'

const TESTS = [

  // ── Disc: hole style ───────────────────────────────────────────────────────
  {
    category: 'Disc — Hole Style',
    q: 'What is a DS1 hole style disc?',
    pass: (c) => c.includes('DS1') && c.includes('B1') ? 'PASS' : 'FAIL',
    desc: 'DS1 must surface B1 page'
  },
  {
    category: 'Disc — Hole Style',
    q: 'Tell me about DS2 discs for double contact points',
    pass: (c) => c.includes('DS2') && c.includes('B1') ? 'PASS' : 'FAIL',
    desc: 'DS2 must surface B1 page'
  },
  {
    category: 'Disc — Hole Style',
    q: 'I need DS3 discs with triple offset holes',
    pass: (c) => c.includes('DS3') && c.includes('B1') ? 'PASS' : 'FAIL',
    desc: 'DS3 must surface B1 page'
  },
  {
    category: 'Disc — Hole Style',
    q: 'What DS4 discs do you have for square parts?',
    pass: (c) => c.includes('DS4') && c.includes('B2') ? 'PASS' : 'FAIL',
    desc: 'DS4 must surface B2 page'
  },
  {
    category: 'Disc — Hole Style',
    q: 'DS5 six-point radial pattern disc for flat panels',
    pass: (c) => c.includes('DS5') && (c.includes('B1') || c.includes('B2') || c.includes('B3')) ? 'PASS' : 'FAIL',
    desc: 'DS5 must surface disc pages'
  },
  {
    category: 'Disc — Hole Style',
    q: 'DS6 adjustable slot disc for variable width parts',
    pass: (c) => c.includes('DS6') && c.includes('B2') ? 'PASS' : 'FAIL',
    desc: 'DS6 must surface B2 page'
  },

  // ── Disc: size ─────────────────────────────────────────────────────────────
  {
    category: 'Disc — Size',
    q: 'What is the largest disc you make?',
    pass: (c) => c.includes('12') && c.includes('HD') ? 'PASS' :
                 c.includes('B3') ? 'PARTIAL' : 'FAIL',
    desc: '12" HD disc must appear in context'
  },
  {
    category: 'Disc — Size',
    q: 'Do you have 2 inch discs?',
    pass: (c) => c.includes('2.0') && c.includes('B1') ? 'PASS' : 'FAIL',
    desc: '2" standard disc must be in context'
  },
  {
    category: 'Disc — Size',
    q: 'I need a heavy duty 10 inch disc',
    pass: (c) => c.includes('10') && c.includes('B3') ? 'PASS' : 'FAIL',
    desc: 'HD 10" must surface B3 page'
  },
  {
    category: 'Disc — Size',
    q: 'What is the difference between standard and heavy duty discs?',
    pass: (c) => c.includes('B3') && c.includes('0.187') ? 'PASS' :
                 c.includes('B1') || c.includes('B3') ? 'PARTIAL' : 'FAIL',
    desc: 'Must surface both standard and HD disc pages'
  },

  // ── Previously missing DS3 discs ───────────────────────────────────────────
  {
    category: 'Previously Missing Items',
    q: 'Item number 900032',
    pass: (c) => c.includes('900032') && c.includes('DS3') ? 'PASS' : 'FAIL',
    desc: '900032 (4" DS3) was missing — must now be found'
  },
  {
    category: 'Previously Missing Items',
    q: 'Item number 900034',
    pass: (c) => c.includes('900034') && c.includes('DS3') ? 'PASS' : 'FAIL',
    desc: '900034 (6" DS3) was missing — must now be found'
  },
  {
    category: 'Previously Missing Items',
    q: 'Item 900103',
    pass: (c) => c.includes('900103') && c.includes('12') ? 'PASS' : 'FAIL',
    desc: '900103 (12" HD DS1) was missing — must now be found'
  },
  {
    category: 'Previously Missing Items',
    q: 'Item 900123',
    pass: (c) => c.includes('900123') && c.includes('12') ? 'PASS' : 'FAIL',
    desc: '900123 (12" HD DS5) was missing — must now be found'
  },

  // ── Racks ──────────────────────────────────────────────────────────────────
  {
    category: 'Racks',
    q: 'What rack spine lengths do you offer?',
    pass: (c) => c.includes('C1') && c.includes('48') ? 'PASS' : 'FAIL',
    desc: 'Must surface C1 page with all spine lengths'
  },
  {
    category: 'Racks',
    q: 'I need a 24 inch spine for my anodizing rack',
    pass: (c) => c.includes('191-SP24') && c.includes('C1') ? 'PASS' : 'FAIL',
    desc: '24" spine item must appear'
  },
  {
    category: 'Racks',
    q: 'What frame sizes do you have? I need to hold 4 spines.',
    pass: (c) => c.includes('191-FR4') && c.includes('C2') ? 'PASS' : 'FAIL',
    desc: '4-spine frame FR4 must appear'
  },
  {
    category: 'Racks',
    q: 'Tell me about crossbars for rack frames',
    pass: (c) => c.includes('191-XB') && c.includes('C2') ? 'PASS' : 'FAIL',
    desc: 'Crossbar items must appear'
  },

  // ── Pin Racks ──────────────────────────────────────────────────────────────
  {
    category: 'Pin Racks',
    q: 'What pin racks do you carry?',
    pass: (c) => {
      if (c.includes('PLACEHOLDER') || c.includes('Pin Rack') || c.includes('D1')) return 'PARTIAL';
      return 'FAIL';
    },
    desc: 'Pin Racks section exists but is placeholder only — expect PARTIAL'
  },
  {
    category: 'Pin Racks',
    q: 'I need a pin rack for my anodizing tank',
    pass: (c) => {
      if (c.includes('PLACEHOLDER') || c.includes('Pin Rack') || c.includes('D1')) return 'PARTIAL';
      return 'FAIL';
    },
    desc: 'Pin Racks placeholder should be surfaced'
  },
  {
    category: 'Pin Racks',
    q: 'pin-rack item numbers',
    pass: (c) => {
      if (c.includes('PLACEHOLDER') || c.includes('Pin Rack')) return 'PARTIAL';
      return 'FAIL';
    },
    desc: 'Should route to D1 — data entry from PDF still required'
  },

  // ── Clips ──────────────────────────────────────────────────────────────────
  {
    category: 'Clips',
    q: 'What spring clips do you sell?',
    pass: (c) => c.includes('CL1') && c.includes('E1') ? 'PASS' : 'FAIL',
    desc: 'CL1 spring clip must appear on E1 (not old D1)'
  },
  {
    category: 'Clips',
    q: 'I need a clip for a part that is 1.5 inches thick',
    pass: (c) => (c.includes('CL3') || c.includes('CL2')) && c.includes('E1') ? 'PASS' :
                 c.includes('CL') ? 'PARTIAL' : 'FAIL',
    desc: 'CL2/CL3 wide-jaw clips must appear for thick parts'
  },
  {
    category: 'Clips',
    q: 'Do you have hooks for hanging parts with existing holes?',
    pass: (c) => c.includes('HK1') && c.includes('E2') ? 'PASS' : 'FAIL',
    desc: 'S-hook HK1 on E2 must appear'
  },
  {
    category: 'Clips',
    q: 'What is the micro clip for very small parts?',
    pass: (c) => c.includes('CL4') && c.includes('0.25') ? 'PASS' :
                 c.includes('CL4') ? 'PARTIAL' : 'FAIL',
    desc: 'CL4 micro clip must appear with jaw spec'
  },

  // ── Clamps ─────────────────────────────────────────────────────────────────
  {
    category: 'Clamps',
    q: 'How do I attach a spine to a frame?',
    pass: (c) => c.includes('RC1') && c.includes('G1') ? 'PASS' :
                 c.includes('RC1') ? 'PARTIAL' : 'FAIL',
    desc: 'RC1 spine-to-frame clamp must appear on G1 (not old E1)'
  },
  {
    category: 'Clamps',
    q: 'I need to gang two rack frames together',
    pass: (c) => c.includes('RC3') && c.includes('G1') ? 'PASS' :
                 c.includes('RC3') ? 'PARTIAL' : 'FAIL',
    desc: 'RC3 frame-to-frame connector must appear'
  },
  {
    category: 'Clamps',
    q: 'What quick release clamp options do you have?',
    pass: (c) => c.includes('RC2') ? 'PASS' : 'FAIL',
    desc: 'RC2 quick-release clamp must appear'
  },

  // ── Hardware ───────────────────────────────────────────────────────────────
  {
    category: 'Hardware',
    q: 'I need titanium contact wire for my rack',
    pass: (c) => c.includes('191-TW1') && c.includes('F1') ? 'PASS' : 'FAIL',
    desc: 'Contact wire items must appear on F1'
  },
  {
    category: 'Hardware',
    q: 'What spine spacers do you sell?',
    pass: (c) => c.includes('191-SS1') && c.includes('F1') ? 'PASS' : 'FAIL',
    desc: 'Spine spacer SS1 must appear'
  },
  {
    category: 'Hardware',
    q: 'Do you have rack identification tags?',
    pass: (c) => c.includes('191-RIT') ? 'PASS' :
                 c.includes('F2') ? 'PARTIAL' : 'FAIL',
    desc: 'RIT rack tag from F2 — was previously missing, now in data'
  },

  // ── Assembly / BOM ─────────────────────────────────────────────────────────
  {
    category: 'Assembly / BOM',
    q: 'What parts do I need to build a small anodizing rack?',
    pass: (c) => c.includes('ASM-001') || c.includes('ASSEMBLY') ? 'PASS' : 'FAIL',
    desc: 'Assembly data must be surfaced for build questions'
  },
  {
    category: 'Assembly / BOM',
    q: 'How do I assemble a 4 spine rack for production volume?',
    pass: (c) => c.includes('ASM-002') || (c.includes('FR4') && c.includes('ASSEMBLY')) ? 'PASS' :
                 c.includes('ASSEMBLY') ? 'PARTIAL' : 'FAIL',
    desc: 'ASM-002 medium 4-spine assembly must be surfaced'
  },
  {
    category: 'Assembly / BOM',
    q: 'I need to anodize heavy parts up to 5 lbs, what configuration do I use?',
    pass: (c) => c.includes('ASM-004') || (c.includes('HD') && c.includes('ASSEMBLY')) ? 'PASS' :
                 c.includes('HD') || c.includes('ASSEMBLY') ? 'PARTIAL' : 'FAIL',
    desc: 'ASM-004 heavy-duty assembly must be surfaced'
  },
  {
    category: 'Assembly / BOM',
    q: 'List all parts needed for a clip rack assembly',
    pass: (c) => c.includes('ASM-005') || (c.includes('clip') && c.includes('ASSEMBLY')) ? 'PASS' :
                 c.includes('ASSEMBLY') ? 'PARTIAL' : 'FAIL',
    desc: 'ASM-005 clip rack assembly must be surfaced'
  },

  // ── Fasteners ──────────────────────────────────────────────────────────────
  {
    category: 'Fasteners',
    q: 'What bolts do I need to mount standard discs to a spine?',
    pass: (c) => c.includes('999010') ? 'PASS' : c.includes('FASTENER') ? 'PARTIAL' : 'FAIL',
    desc: 'Standard spine bolt 999010 must be identified'
  },
  {
    category: 'Fasteners',
    q: 'What fasteners do HD discs require?',
    pass: (c) => c.includes('999020') ? 'PASS' : c.includes('FASTENER') ? 'PARTIAL' : 'FAIL',
    desc: 'HD spine bolt 999020 must be identified'
  },
  {
    category: 'Fasteners',
    q: 'What size are the frame bolts?',
    pass: (c) => c.includes('999030') && c.includes('5/16') ? 'PASS' :
                 c.includes('999030') ? 'PARTIAL' : 'FAIL',
    desc: 'Frame bolt 999030 (5/16-18) must appear'
  },
  {
    category: 'Fasteners',
    q: 'Item number 999052',
    pass: (c) => c.includes('999052') && c.includes('Connector') ? 'PASS' : 'FAIL',
    desc: 'Connector bolt 999052 must be found by exact number'
  },

  // ── Edge Cases ─────────────────────────────────────────────────────────────
  {
    category: 'Edge Cases',
    q: 'Item number 999999',
    pass: (c) => !c.includes('EXACT PRODUCT MATCH') ? 'PASS' : 'FAIL',
    desc: 'Unknown item — should NOT return an exact match'
  },
  {
    category: 'Edge Cases',
    q: 'Do you sell anodizing chemicals or tanks?',
    pass: (c) => {
      // Should fall back to general catalog pages — no chemical data exists
      return c.length > 100 ? 'PARTIAL' : 'FAIL';
    },
    desc: 'Out-of-catalog question — model will need to say it cannot help'
  },
  {
    category: 'Edge Cases',
    q: 'What is your phone number?',
    pass: (c) => c.includes('800-553-8273') ? 'PASS' : 'PARTIAL',
    desc: 'Phone number is embedded in multiple page descriptions'
  },
];

// ── Run tests ─────────────────────────────────────────────────────────────────

function runTests() {
  console.log('\n' + B('═══════════════════════════════════════════════════════'));
  console.log(B('  Sequel RAG Chatbot — Retrieval Quality Test'));
  console.log(B('═══════════════════════════════════════════════════════'));
  console.log('  Testing ' + TESTS.length + ' questions across ' +
    [...new Set(TESTS.map(t => t.category))].length + ' categories\n');

  const results = [];
  const byCategory = {};

  for (const test of TESTS) {
    const { context, pagesUsed } = buildContext(test.q);
    const verdict = test.pass(context, pagesUsed);
    const icon = verdict === 'PASS' ? G('✓ PASS   ') :
                 verdict === 'PARTIAL' ? Y('⚠ PARTIAL') : R('✗ FAIL   ');

    console.log(icon + '  ' + test.q);
    console.log('         Pages: [' + pagesUsed.join(', ') + ']  |  ' + test.desc);

    // Extra detail for failures
    if (verdict === 'FAIL') {
      const preview = context.substring(0, 120).replace(/\n/g, ' ');
      console.log('         ' + R('Context start: ') + preview);
    }
    console.log();

    results.push({ ...test, verdict, pagesUsed, context });

    if (!byCategory[test.category]) byCategory[test.category] = [];
    byCategory[test.category].push({ verdict });
  }

  return { results, byCategory };
}

// ── Generate report ───────────────────────────────────────────────────────────

function generateReport(results, byCategory) {
  const date = new Date().toISOString().split('T')[0];
  const pass    = results.filter(r => r.verdict === 'PASS').length;
  const partial = results.filter(r => r.verdict === 'PARTIAL').length;
  const fail    = results.filter(r => r.verdict === 'FAIL').length;
  const total   = results.length;

  const gaps    = results.filter(r => r.verdict !== 'PASS');

  let md = `# Sequel RAG Chatbot — Retrieval Test Report\n`;
  md += `**Date:** ${date}  \n`;
  md += `**Total questions:** ${total}  \n`;
  md += `**Tested layer:** RAG context retrieval (buildContext) — no LLM call needed\n\n`;

  md += `---\n\n## Summary\n\n`;
  md += `| Result | Count | % |\n|---|---|---|\n`;
  md += `| ✓ PASS    | ${pass}    | ${Math.round(pass/total*100)}% |\n`;
  md += `| ⚠ PARTIAL | ${partial} | ${Math.round(partial/total*100)}% |\n`;
  md += `| ✗ FAIL    | ${fail}    | ${Math.round(fail/total*100)}% |\n\n`;

  md += `### By Category\n\n`;
  md += `| Category | PASS | PARTIAL | FAIL |\n|---|---|---|---|\n`;
  for (const [cat, items] of Object.entries(byCategory)) {
    const p  = items.filter(i => i.verdict === 'PASS').length;
    const pa = items.filter(i => i.verdict === 'PARTIAL').length;
    const f  = items.filter(i => i.verdict === 'FAIL').length;
    md += `| ${cat} | ${p} | ${pa} | ${f} |\n`;
  }

  md += `\n---\n\n## Question-by-Question Results\n\n`;
  let lastCat = '';
  for (const r of results) {
    if (r.category !== lastCat) {
      md += `\n### ${r.category}\n\n`;
      lastCat = r.category;
    }
    const icon = r.verdict === 'PASS' ? '✓' : r.verdict === 'PARTIAL' ? '⚠' : '✗';
    md += `**${icon} ${r.verdict}** — "${r.q}"  \n`;
    md += `Pages used: \`${r.pagesUsed.join(', ') || 'none'}\`  \n`;
    md += `Check: ${r.desc}  \n\n`;
  }

  md += `---\n\n## Gap Analysis\n\n`;

  if (gaps.length === 0) {
    md += `No gaps found — all questions pass.\n\n`;
  } else {
    md += `The following ${gaps.length} question(s) did not fully pass. `;
    md += `These represent either **missing catalog data** or **known placeholders**:\n\n`;

    for (const r of gaps) {
      const icon = r.verdict === 'PARTIAL' ? '⚠' : '✗';
      md += `- **${icon} ${r.category}:** "${r.q}"  \n`;
      md += `  _${r.desc}_\n\n`;
    }
  }

  md += `---\n\n## Recommendations\n\n`;
  md += `### Must Fix (FAIL items)\n\n`;
  const fails = results.filter(r => r.verdict === 'FAIL');
  if (fails.length === 0) {
    md += `None — all critical data is present.\n\n`;
  } else {
    for (const r of fails) {
      md += `- **"${r.q}"** — ${r.desc}\n`;
    }
    md += '\n';
  }

  md += `### Known Data Gaps (PARTIAL items — require PDF entry)\n\n`;
  const partials = results.filter(r => r.verdict === 'PARTIAL');
  if (partials.length === 0) {
    md += `None.\n\n`;
  } else {
    for (const r of partials) {
      md += `- **"${r.q}"** — ${r.desc}\n`;
    }
    md += '\n';
  }

  md += `### What the Model Cannot Answer\n\n`;
  md += `The following question types will result in the bot saying `;
  md += `"I don't have that information" or directing to the phone number:\n\n`;
  md += `- **Pin Rack specifications** — Section D from PDF not yet entered. `;
  md += `Open \`data/source/products.csv\`, replace the \`191-PR-PLACEHOLDER\` row `;
  md += `with real item numbers from PDF Section D, then run \`npm run build\`.\n`;
  md += `- **Anodizing chemicals, tanks, power supplies** — out of catalog scope\n`;
  md += `- **Custom rack configurations** — bot correctly routes to phone (800-553-8273)\n`;
  md += `- **Pricing and lead times** — not in catalog data\n`;
  md += `- **F2 accessory specs** (191-HH1, 191-TBA, 191-DSH, 191-RIT) — `;
  md += `items added but no detailed specs; verify against PDF page 19\n\n`;

  md += `---\n\n_Generated by \`scripts/test-chatbot.js\`_\n`;

  const reportPath = path.join(REPORTS, `test-report-${date}.md`);
  fs.writeFileSync(reportPath, md);
  return { reportPath, pass, partial, fail, total };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { results, byCategory } = runTests();
const { reportPath, pass, partial, fail, total } = generateReport(results, byCategory);

// Console summary
console.log(B('═══════════════════════════════════════════════════════'));
console.log(B('  Results Summary'));
console.log(B('═══════════════════════════════════════════════════════'));
console.log(G(`  ✓ PASS:    ${pass}/${total}  (${Math.round(pass/total*100)}%)`));
console.log(Y(`  ⚠ PARTIAL: ${partial}/${total}  (${Math.round(partial/total*100)}%)`));
console.log(R(`  ✗ FAIL:    ${fail}/${total}  (${Math.round(fail/total*100)}%)`));
console.log(`\n  Report saved to: ${reportPath}\n`);
