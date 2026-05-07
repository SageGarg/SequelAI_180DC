# Sequel RAG Chatbot — Retrieval Test Report
**Date:** 2026-05-06  
**Total questions:** 42  
**Tested layer:** RAG context retrieval (buildContext) — no LLM call needed

---

## Summary

| Result | Count | % |
|---|---|---|
| ✓ PASS    | 37    | 88% |
| ⚠ PARTIAL | 5 | 12% |
| ✗ FAIL    | 0    | 0% |

### By Category

| Category | PASS | PARTIAL | FAIL |
|---|---|---|---|
| Disc — Hole Style | 6 | 0 | 0 |
| Disc — Size | 4 | 0 | 0 |
| Previously Missing Items | 4 | 0 | 0 |
| Racks | 4 | 0 | 0 |
| Pin Racks | 0 | 3 | 0 |
| Clips | 4 | 0 | 0 |
| Clamps | 3 | 0 | 0 |
| Hardware | 3 | 0 | 0 |
| Assembly / BOM | 4 | 0 | 0 |
| Fasteners | 4 | 0 | 0 |
| Edge Cases | 1 | 2 | 0 |

---

## Question-by-Question Results


### Disc — Hole Style

**✓ PASS** — "What is a DS1 hole style disc?"  
Pages used: `B1, B2, B3, C1, E2`  
Check: DS1 must surface B1 page  

**✓ PASS** — "Tell me about DS2 discs for double contact points"  
Pages used: `B1, B2, F1, B3, F2`  
Check: DS2 must surface B1 page  

**✓ PASS** — "I need DS3 discs with triple offset holes"  
Pages used: `B1, B2, E2, B3, C1`  
Check: DS3 must surface B1 page  

**✓ PASS** — "What DS4 discs do you have for square parts?"  
Pages used: `B2, B1, B3, E2, F2`  
Check: DS4 must surface B2 page  

**✓ PASS** — "DS5 six-point radial pattern disc for flat panels"  
Pages used: `B2, B1, B3, E2, C2`  
Check: DS5 must surface disc pages  

**✓ PASS** — "DS6 adjustable slot disc for variable width parts"  
Pages used: `B2, E2, B1, B3, F2`  
Check: DS6 must surface B2 page  


### Disc — Size

**✓ PASS** — "What is the largest disc you make?"  
Pages used: `B1, B3, B2, C1, F1`  
Check: 12" HD disc must appear in context  

**✓ PASS** — "Do you have 2 inch discs?"  
Pages used: `B1, B2, B3, C1`  
Check: 2" standard disc must be in context  

**✓ PASS** — "I need a heavy duty 10 inch disc"  
Pages used: `B3, B1, B2, F1, C1`  
Check: HD 10" must surface B3 page  

**✓ PASS** — "What is the difference between standard and heavy duty discs?"  
Pages used: `B3, B1, C1, B2, G1`  
Check: Must surface both standard and HD disc pages  


### Previously Missing Items

**✓ PASS** — "Item number 900032"  
Pages used: `B1, D1`  
Check: 900032 (4" DS3) was missing — must now be found  

**✓ PASS** — "Item number 900034"  
Pages used: `B1, D1`  
Check: 900034 (6" DS3) was missing — must now be found  

**✓ PASS** — "Item 900103"  
Pages used: `B3, D1`  
Check: 900103 (12" HD DS1) was missing — must now be found  

**✓ PASS** — "Item 900123"  
Pages used: `B3, D1`  
Check: 900123 (12" HD DS5) was missing — must now be found  


### Racks

**✓ PASS** — "What rack spine lengths do you offer?"  
Pages used: `C1, G1, C2, F1, F2`  
Check: Must surface C1 page with all spine lengths  

**✓ PASS** — "I need a 24 inch spine for my anodizing rack"  
Pages used: `G1, C1, C2, F2, B2`  
Check: 24" spine item must appear  

**✓ PASS** — "What frame sizes do you have? I need to hold 4 spines."  
Pages used: `C2, C1, G1, D1, E1`  
Check: 4-spine frame FR4 must appear  

**✓ PASS** — "Tell me about crossbars for rack frames"  
Pages used: `C2, G1, F2, C1, D1`  
Check: Crossbar items must appear  


### Pin Racks

**⚠ PARTIAL** — "What pin racks do you carry?"  
Pages used: `D1, F1, G1, C1, C2`  
Check: Pin Racks section exists but is placeholder only — expect PARTIAL  

**⚠ PARTIAL** — "I need a pin rack for my anodizing tank"  
Pages used: `F2, G1, C2, C1, B2, D1`  
Check: Pin Racks placeholder should be surfaced  

**⚠ PARTIAL** — "pin-rack item numbers"  
Pages used: `D1`  
Check: Should route to D1 — data entry from PDF still required  


### Clips

**✓ PASS** — "What spring clips do you sell?"  
Pages used: `E1, E2`  
Check: CL1 spring clip must appear on E1 (not old D1)  

**✓ PASS** — "I need a clip for a part that is 1.5 inches thick"  
Pages used: `E2, E1, B2, B3, F2`  
Check: CL2/CL3 wide-jaw clips must appear for thick parts  

**✓ PASS** — "Do you have hooks for hanging parts with existing holes?"  
Pages used: `E2, B2, F2, C2, G1, E1`  
Check: S-hook HK1 on E2 must appear  

**✓ PASS** — "What is the micro clip for very small parts?"  
Pages used: `E2, E1, B2, F2, C2`  
Check: CL4 micro clip must appear with jaw spec  


### Clamps

**✓ PASS** — "How do I attach a spine to a frame?"  
Pages used: `C2, C1, F1, G1, B1`  
Check: RC1 spine-to-frame clamp must appear on G1 (not old E1)  

**✓ PASS** — "I need to gang two rack frames together"  
Pages used: `C2, G1, F2, C1, D1`  
Check: RC3 frame-to-frame connector must appear  

**✓ PASS** — "What quick release clamp options do you have?"  
Pages used: `G1`  
Check: RC2 quick-release clamp must appear  


### Hardware

**✓ PASS** — "I need titanium contact wire for my rack"  
Pages used: `F1, F2, C1, E2, G1, C2`  
Check: Contact wire items must appear on F1  

**✓ PASS** — "What spine spacers do you sell?"  
Pages used: `F1, C1, C2, G1, B1`  
Check: Spine spacer SS1 must appear  

**✓ PASS** — "Do you have rack identification tags?"  
Pages used: `F2, G1, C1, D1, C2`  
Check: RIT rack tag from F2 — was previously missing, now in data  


### Assembly / BOM

**✓ PASS** — "What parts do I need to build a small anodizing rack?"  
Pages used: `F2, B2, C1, C2, B1`  
Check: Assembly data must be surfaced for build questions  

**✓ PASS** — "How do I assemble a 4 spine rack for production volume?"  
Pages used: `G1, C2, F2, C1, F1`  
Check: ASM-002 medium 4-spine assembly must be surfaced  

**✓ PASS** — "I need to anodize heavy parts up to 5 lbs, what configuration do I use?"  
Pages used: `B3, B1, B2, E2, E1`  
Check: ASM-004 heavy-duty assembly must be surfaced  

**✓ PASS** — "List all parts needed for a clip rack assembly"  
Pages used: `E2, F2, G1, E1, C2, C1`  
Check: ASM-005 clip rack assembly must be surfaced  


### Fasteners

**✓ PASS** — "What bolts do I need to mount standard discs to a spine?"  
Pages used: `B1, C1, B2, B3, C2`  
Check: Standard spine bolt 999010 must be identified  

**✓ PASS** — "What fasteners do HD discs require?"  
Pages used: `B3, B1, B2, G1, C1`  
Check: HD spine bolt 999020 must be identified  

**✓ PASS** — "What size are the frame bolts?"  
Pages used: `C1, C2, G1, F1, B1`  
Check: Frame bolt 999030 (5/16-18) must appear  

**✓ PASS** — "Item number 999052"  
Pages used: `G1, D1`  
Check: Connector bolt 999052 must be found by exact number  


### Edge Cases

**✓ PASS** — "Item number 999999"  
Pages used: `D1`  
Check: Unknown item — should NOT return an exact match  

**⚠ PARTIAL** — "Do you sell anodizing chemicals or tanks?"  
Pages used: `B1, B2, B3, E1, C1`  
Check: Out-of-catalog question — model will need to say it cannot help  

**⚠ PARTIAL** — "What is your phone number?"  
Pages used: `D1`  
Check: Phone number is embedded in multiple page descriptions  

---

## Gap Analysis

The following 5 question(s) did not fully pass. These represent either **missing catalog data** or **known placeholders**:

- **⚠ Pin Racks:** "What pin racks do you carry?"  
  _Pin Racks section exists but is placeholder only — expect PARTIAL_

- **⚠ Pin Racks:** "I need a pin rack for my anodizing tank"  
  _Pin Racks placeholder should be surfaced_

- **⚠ Pin Racks:** "pin-rack item numbers"  
  _Should route to D1 — data entry from PDF still required_

- **⚠ Edge Cases:** "Do you sell anodizing chemicals or tanks?"  
  _Out-of-catalog question — model will need to say it cannot help_

- **⚠ Edge Cases:** "What is your phone number?"  
  _Phone number is embedded in multiple page descriptions_

---

## Recommendations

### Must Fix (FAIL items)

None — all critical data is present.

### Known Data Gaps (PARTIAL items — require PDF entry)

- **"What pin racks do you carry?"** — Pin Racks section exists but is placeholder only — expect PARTIAL
- **"I need a pin rack for my anodizing tank"** — Pin Racks placeholder should be surfaced
- **"pin-rack item numbers"** — Should route to D1 — data entry from PDF still required
- **"Do you sell anodizing chemicals or tanks?"** — Out-of-catalog question — model will need to say it cannot help
- **"What is your phone number?"** — Phone number is embedded in multiple page descriptions

### What the Model Cannot Answer

The following question types will result in the bot saying "I don't have that information" or directing to the phone number:

- **Pin Rack specifications** — Section D from PDF not yet entered. Open `data/source/products.csv`, replace the `191-PR-PLACEHOLDER` row with real item numbers from PDF Section D, then run `npm run build`.
- **Anodizing chemicals, tanks, power supplies** — out of catalog scope
- **Custom rack configurations** — bot correctly routes to phone (800-553-8273)
- **Pricing and lead times** — not in catalog data
- **F2 accessory specs** (191-HH1, 191-TBA, 191-DSH, 191-RIT) — items added but no detailed specs; verify against PDF page 19

---

_Generated by `scripts/test-chatbot.js`_
