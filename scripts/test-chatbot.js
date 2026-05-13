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
//
// Tests rebuilt 2026-05-07 against the actual Sequel 2024 catalog
// (~3617 SKUs across 7 sections, replacing the original 88 AI-generated SKUs).

const TESTS_OLD_REMOVED = [

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

// ── New test suite for the real 2024 Sequel catalog (3617 SKUs) ──────────────

const TESTS = [
  // ── Disc Hole Styles (DS1-DS11) ────────────────────────────────────────────
  { category:'Disc — Hole Style', q:'What is a DS1 hole style disc?',
    pass:(c)=>c.includes('DS1') && c.includes('B2') ? 'PASS' : 'FAIL',
    desc:'DS1 (1/4" x 3/4" rect) should surface page B2 (Disc Hole Styles)' },
  { category:'Disc — Hole Style', q:'Tell me about DS7 hole style',
    pass:(c)=>c.includes('DS7') && c.includes('B2') ? 'PASS' : 'FAIL',
    desc:'DS7 (.75" x 2" rectangular) — must reach B2' },
  { category:'Disc — Hole Style', q:'I need DS11 discs for my 1/4 x 1 inch spine',
    pass:(c)=>c.includes('DS11') && (c.includes('B2') || c.includes('B3')) ? 'PASS' : 'FAIL',
    desc:'DS11 hole style — used with 485B spine' },
  { category:'Disc — Hole Style', q:'What is a DS8 disc and what spine does it fit?',
    pass:(c)=>c.includes('DS8') && c.includes('486B') ? 'PASS' :
              c.includes('DS8') ? 'PARTIAL' : 'FAIL',
    desc:'DS8 (.375" x 1") — use with 486B spine' },

  // ── Disc Series by Type ────────────────────────────────────────────────────
  { category:'Disc — Type', q:'What is an 82C disc?',
    pass:(c)=>c.includes('82C') && c.includes('B3') ? 'PASS' : 'FAIL',
    desc:'82C V-Notched Formed Disc 8.0" dia — B3 page' },
  { category:'Disc — Type', q:'Do you have dimpled discs?',
    pass:(c)=>c.includes('Dimple') && c.includes('B4') ? 'PASS' : 'FAIL',
    desc:'82-1, 82-1B, 82-1D dimpled discs on B4' },
  { category:'Disc — Type', q:'Show me pointed disc options',
    pass:(c)=>(c.includes('Pointed') || c.includes('82-4') || c.includes('82-7')) ? 'PASS' : 'FAIL',
    desc:'Should surface 82-4 short pointed or 82-7 long pointed disc series' },
  { category:'Disc — Type', q:'Slotted discs for racking small tubes',
    pass:(c)=>(c.includes('82-8') || c.includes('Slotted')) ? 'PASS' : 'FAIL',
    desc:'82-8 .50" slotted or 82-2 1" slotted should appear' },

  // ── Specific Item Numbers (Disc) ───────────────────────────────────────────
  { category:'Disc — Item Lookup', q:'Item number 900000',
    pass:(c)=>c.includes('900000') && c.includes('EXACT PRODUCT MATCH') ? 'PASS' : 'FAIL',
    desc:'82 Flat Disc DS1 .063" — should exact-match' },
  { category:'Disc — Item Lookup', q:'What is item 902450?',
    pass:(c)=>c.includes('902450') && c.includes('82C') ? 'PASS' :
              c.includes('902450') ? 'PARTIAL' : 'FAIL',
    desc:'82C Formed Disc DS1 .063" — exact match' },
  { category:'Disc — Item Lookup', q:'Item 905335',
    pass:(c)=>c.includes('905335') && c.includes('166') ? 'PASS' :
              c.includes('905335') ? 'PARTIAL' : 'FAIL',
    desc:'166 V-Notched Insert Disc DS1 .063" — exact match' },

  // ── Disc Collars / Brackets ────────────────────────────────────────────────
  { category:'Disc Collars', q:'I need a disc collar for a 7/8 inch round spine',
    pass:(c)=>c.includes('191-DS4') || c.includes('998071-DS4') ? 'PASS' : 'FAIL',
    desc:'191-DS4 fits 7/8" round spine (also fits 5/8" 474 spine)' },
  { category:'Disc Collars', q:'What disc brackets do you sell?',
    pass:(c)=>c.includes('192') && c.includes('Bracket') ? 'PASS' : 'FAIL',
    desc:'192 Disc Bracket for DS1/DS2/DS5/DS8/DS9/DS11 hole styles' },

  // ── Pin Racks (D section) ──────────────────────────────────────────────────
  { category:'Pin Racks', q:'What pin racks do you carry?',
    pass:(c)=>c.includes('Pin Rack') && c.includes('D1') ? 'PASS' : 'FAIL',
    desc:'Should surface D1 Pin Racks page' },
  { category:'Pin Racks', q:'I need a 4-way pin rack with 60 pins',
    pass:(c)=>(c.includes('4W-60') || c.includes('4-Way')) ? 'PASS' : 'FAIL',
    desc:'4W-60 pin rack family' },
  { category:'Pin Racks', q:'Item number 4W-60-2-75-1',
    pass:(c)=>c.includes('4W-60-2-75-1') && c.includes('EXACT') ? 'PASS' :
              c.includes('4W-60-2-75-1') ? 'PARTIAL' : 'FAIL',
    desc:'4W-60-2-75-1 (4-Way, 60 pins, .156 dia, .75 spacing, 1" group)' },
  { category:'Pin Racks', q:'What is a 6-way pin rack?',
    pass:(c)=>c.includes('6-Way') || c.includes('6W') ? 'PASS' : 'FAIL',
    desc:'6-Way Pin Rack family' },
  { category:'Pin Racks', q:'utility rack holder for 24 inch racks',
    pass:(c)=>(c.includes('URH-24') || c.includes('Utility Rack Holder')) ? 'PASS' : 'FAIL',
    desc:'6W URH-24 utility rack holder' },

  // ── Clamps (G section) ─────────────────────────────────────────────────────
  { category:'Clamps', q:'I need a Duraclamp 2 inch',
    pass:(c)=>c.includes('DC508') && c.includes('G1') ? 'PASS' :
              c.includes('Duraclamp') ? 'PARTIAL' : 'FAIL',
    desc:'DC508 = Duraclamp 2"' },
  { category:'Clamps', q:'What is the largest Duraclamp?',
    pass:(c)=>(c.includes('DC1016') || c.includes('4"')) ? 'PASS' : 'FAIL',
    desc:'DC1016 = Duraclamp 4"' },
  { category:'Clamps', q:'Tell me about your Chem Clamp',
    pass:(c)=>c.includes('155') && (c.includes('Stainless') || c.includes('Chem')) ? 'PASS' : 'FAIL',
    desc:'155 Chem Clamp Stainless Steel' },
  { category:'Clamps', q:'Quick-Set Clamp components',
    pass:(c)=>c.includes('QSASM') || c.includes('Quick-Set') ? 'PASS' : 'FAIL',
    desc:'Quick-Set Clamp family' },
  { category:'Clamps', q:'What are Hexies?',
    pass:(c)=>c.includes('Hexie') || c.includes('HEXFL') ? 'PASS' : 'FAIL',
    desc:'HEXFL50/HEXFL100 polypropylene tank floats' },

  // ── Hardware: Spines ───────────────────────────────────────────────────────
  { category:'Hardware — Spines', q:'I need a 36 inch slotted spine',
    pass:(c)=>(c.includes('484') || c.includes('486C') || c.includes('488C') || c.includes('490C')) && c.includes('Slotted') ? 'PASS' :
              c.includes('Slotted') ? 'PARTIAL' : 'FAIL',
    desc:'484/486C/488C/490C slotted spines available 36-63"' },
  { category:'Hardware — Spines', q:'What is item 950935?',
    pass:(c)=>c.includes('950935') && c.includes('486B') ? 'PASS' :
              c.includes('950935') ? 'PARTIAL' : 'FAIL',
    desc:'486B 48" Plain Spine Standard Hook' },
  { category:'Hardware — Spines', q:'titanium spines',
    pass:(c)=>c.includes('Titanium') && (c.includes('586') || c.includes('589')) ? 'PASS' :
              c.includes('Titanium') ? 'PARTIAL' : 'FAIL',
    desc:'586 slotted titanium or 589 pierced titanium spine' },
  { category:'Hardware — Spines', q:'I need a 48 inch spine for hanging discs',
    pass:(c)=>(c.includes('48') && (c.includes('486B') || c.includes('485B') || c.includes('Spine'))) ? 'PASS' :
              c.includes('Spine') ? 'PARTIAL' : 'FAIL',
    desc:'Several 48" plain spine options' },

  // ── Hardware: Hooks, Cross Members, Mounting Angles ───────────────────────
  { category:'Hardware — Other', q:'I need a hook for a 486B spine',
    pass:(c)=>c.includes('486') && c.includes('Hook') ? 'PASS' :
              c.includes('Hook') ? 'PARTIAL' : 'FAIL',
    desc:'486N/486H/486HT hooks' },
  { category:'Hardware — Other', q:'mounting angle for racks',
    pass:(c)=>c.includes('176') && c.includes('Mounting Angle') ? 'PASS' : 'FAIL',
    desc:'176 Mounting Angle, sizes 12-48"' },
  { category:'Hardware — Other', q:'cross member 24 inch',
    pass:(c)=>c.includes('485') && c.includes('Cross Member') ? 'PASS' :
              c.includes('Cross Member') ? 'PARTIAL' : 'FAIL',
    desc:'485 24" aluminum cross member' },

  // ── Fasteners ──────────────────────────────────────────────────────────────
  { category:'Fasteners', q:'1/4-20 bolt 1 inch aluminum',
    pass:(c)=>c.includes('999010') && c.includes('1/4-20') ? 'PASS' :
              c.includes('1/4-20') ? 'PARTIAL' : 'FAIL',
    desc:'999010 = 1/4-20 hex head bolt 1" aluminum' },
  { category:'Fasteners', q:'titanium bolts',
    pass:(c)=>c.includes('Titanium') && c.includes('Bolt') ? 'PASS' : 'FAIL',
    desc:'C.P. Grade 2 titanium bolts 999060-999085' },
  { category:'Fasteners', q:'conical washers',
    pass:(c)=>c.includes('Conical') && c.includes('Washer') ? 'PASS' : 'FAIL',
    desc:'5/8" or 1" conical washers in aluminum or titanium' },
  { category:'Fasteners', q:'aluminum rivets',
    pass:(c)=>c.includes('Rivet') && c.includes('Aluminum') ? 'PASS' :
              c.includes('Rivet') ? 'PARTIAL' : 'FAIL',
    desc:'1100F aluminum solid rivets 3/16 or 1/4 dia' },

  // ── Clips (E section) ──────────────────────────────────────────────────────
  { category:'Clips', q:'V-notched clips for thin parts',
    pass:(c)=>c.includes('V-Notched') && c.includes('E1') ? 'PASS' : 'FAIL',
    desc:'Many V-Notched clip families on E1' },
  { category:'Clips', q:'tapered clip with .06 inch tips',
    pass:(c)=>c.includes('94') || c.includes('Tapered') ? 'PASS' : 'FAIL',
    desc:'94 series tapered clips with .06" tip' },
  { category:'Clips', q:'square clips 6 x 1 inch',
    pass:(c)=>(c.includes('Square') && c.includes('6')) || c.includes('E1') ? 'PASS' : 'FAIL',
    desc:'6"x1" square clip series' },
  { category:'Clips', q:'A-clip for the A-Clip rack system',
    pass:(c)=>c.includes('A-Clip') || c.includes('A-1') ? 'PASS' : 'FAIL',
    desc:'A-1, A-1X A-Clip series — no bolts/rivets needed' },
  { category:'Clips', q:'tube clip for 1 inch diameter tubes',
    pass:(c)=>(c.includes('TCS1') || c.includes('TCD1') || c.includes('Tube Clip')) ? 'PASS' : 'FAIL',
    desc:'TCS1006/TCS1008 (single) or TCD1006/TCD1008 (double)' },

  // ── Racks (C section) ──────────────────────────────────────────────────────
  { category:'Racks', q:'V-notched rack 48 inch',
    pass:(c)=>(c.includes('V-Notched') && c.includes('C1')) ? 'PASS' : 'FAIL',
    desc:'Many V-Notched rack families on C1' },
  { category:'Racks', q:'21 series rack',
    pass:(c)=>c.includes('21') && c.includes('V-Notched') ? 'PASS' : 'FAIL',
    desc:'21 V-Notched Rack with .06" tips, 28° notches' },
  { category:'Racks', q:'I need a 161 rack form 015',
    pass:(c)=>c.includes('161') && c.includes('Rack') ? 'PASS' : 'FAIL',
    desc:'161-015 V-Notched Formed Rack' },
  { category:'Racks', q:'high density box rack',
    pass:(c)=>(c.includes('HD') || c.includes('183') || c.includes('184')) && c.includes('Rack') ? 'PASS' :
              c.includes('Rack') ? 'PARTIAL' : 'FAIL',
    desc:'183/183W HD Box Rack assemblies, 36-54" spines' },
  { category:'Racks', q:'pointed rack with sharp tips',
    pass:(c)=>(c.includes('Pointed') && c.includes('Rack')) ? 'PASS' : 'FAIL',
    desc:'169, 170, 171, 300P, 307, 313 pointed racks' },
  { category:'Racks', q:'square rack 6 inch with .75 inch tips',
    pass:(c)=>(c.includes('23075') || c.includes('Square')) && c.includes('Rack') ? 'PASS' : 'FAIL',
    desc:'23075 Square Rack with .75" tips' },
  { category:'Racks', q:'split finger rack 7 inch',
    pass:(c)=>(c.includes('Split Finger') || c.includes('22') || c.includes('24')) && c.includes('Rack') ? 'PASS' : 'FAIL',
    desc:'22, 24, 306SFN, 311SFN split finger racks' },
  { category:'Racks', q:'tapered rack 6 inch',
    pass:(c)=>c.includes('Tapered') && c.includes('Rack') ? 'PASS' : 'FAIL',
    desc:'25, 26, 27, 99 tapered rack series' },

  // ── Item Number Lookups (Racks) ────────────────────────────────────────────
  { category:'Racks — Item Lookup', q:'Item 101600',
    pass:(c)=>c.includes('101600') && (c.includes('EXACT') || c.includes('21')) ? 'PASS' : 'FAIL',
    desc:'21 V-Notched Rack 24" RK1 .063" — exact match' },
  { category:'Racks — Item Lookup', q:'What is item 600040?',
    pass:(c)=>c.includes('600040') && (c.includes('183') || c.includes('HD')) ? 'PASS' :
              c.includes('600040') ? 'PARTIAL' : 'FAIL',
    desc:'183 HD Box Rack Complete Assembly 36" Spine' },

  // ── Edge Cases ─────────────────────────────────────────────────────────────
  { category:'Edge Cases', q:'Item number 999999999',
    pass:(c)=>!c.includes('EXACT PRODUCT MATCH') ? 'PASS' : 'FAIL',
    desc:'Unknown item should NOT exact-match' },
  { category:'Edge Cases', q:'Do you sell anodizing chemicals or tanks?',
    pass:(c)=>c.length > 100 ? 'PARTIAL' : 'FAIL',
    desc:'Out-of-catalog — model will say it cannot help' },
  { category:'Edge Cases', q:'What is your phone number?',
    pass:(c)=>c.includes('800-553-8273') ? 'PASS' : 'PARTIAL',
    desc:'Phone embedded in page descriptions' },
  { category:'Edge Cases', q:'Do you sell discs?',
    pass:(c)=>c.includes('Disc') && c.includes('B') ? 'PASS' : 'FAIL',
    desc:'Generic disc question should reach disc pages' }
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
