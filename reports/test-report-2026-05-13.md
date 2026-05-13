# Sequel RAG Chatbot — Retrieval Test Report
**Date:** 2026-05-13  
**Total questions:** 53  
**Tested layer:** RAG context retrieval (buildContext) — no LLM call needed

---

## Summary

| Result | Count | % |
|---|---|---|
| ✓ PASS    | 50    | 94% |
| ⚠ PARTIAL | 3 | 6% |
| ✗ FAIL    | 0    | 0% |

### By Category

| Category | PASS | PARTIAL | FAIL |
|---|---|---|---|
| Disc — Hole Style | 4 | 0 | 0 |
| Disc — Type | 4 | 0 | 0 |
| Disc — Item Lookup | 3 | 0 | 0 |
| Disc Collars | 2 | 0 | 0 |
| Pin Racks | 4 | 1 | 0 |
| Clamps | 5 | 0 | 0 |
| Hardware — Spines | 4 | 0 | 0 |
| Hardware — Other | 3 | 0 | 0 |
| Fasteners | 4 | 0 | 0 |
| Clips | 5 | 0 | 0 |
| Racks | 8 | 0 | 0 |
| Racks — Item Lookup | 2 | 0 | 0 |
| Edge Cases | 2 | 2 | 0 |

---

## Question-by-Question Results


### Disc — Hole Style

**✓ PASS** — "What is a DS1 hole style disc?"  
Pages used: `B2, B9, B1, B3, B4, B8, B5, B6, B7`  
Check: DS1 (1/4" x 3/4" rect) should surface page B2 (Disc Hole Styles)  

**✓ PASS** — "Tell me about DS7 hole style"  
Pages used: `B2, E1, B9, C1, B1, B3, B4, B8, B6, B5, B7`  
Check: DS7 (.75" x 2" rectangular) — must reach B2  

**✓ PASS** — "I need DS11 discs for my 1/4 x 1 inch spine"  
Pages used: `B9, B2, F1, B1, B3, B6, B7, B4, B5, B8`  
Check: DS11 hole style — used with 485B spine  

**✓ PASS** — "What is a DS8 disc and what spine does it fit?"  
Pages used: `B9, B2, F1, B1, B3, B4, B8, B5, B6, B7`  
Check: DS8 (.375" x 1") — use with 486B spine  


### Disc — Type

**✓ PASS** — "What is an 82C disc?"  
Pages used: `B3, B1, B2, B4, B5, B8, B9, B6, B7`  
Check: 82C V-Notched Formed Disc 8.0" dia — B3 page  

**✓ PASS** — "Do you have dimpled discs?"  
Pages used: `B1, B4, B2, B8, B6, B7, B3, B5, B9`  
Check: 82-1, 82-1B, 82-1D dimpled discs on B4  

**✓ PASS** — "Show me pointed disc options"  
Pages used: `B5, B7, B1, B2, B3, B4, B8, B9, B6`  
Check: Should surface 82-4 short pointed or 82-7 long pointed disc series  

**✓ PASS** — "Slotted discs for racking small tubes"  
Pages used: `B7, B4, B5, F1, B8, B1, B6, B2, B3, B9`  
Check: 82-8 .50" slotted or 82-2 1" slotted should appear  


### Disc — Item Lookup

**✓ PASS** — "Item number 900000"  
Pages used: `B3, D1, B9`  
Check: 82 Flat Disc DS1 .063" — should exact-match  

**✓ PASS** — "What is item 902450?"  
Pages used: `B3, B9, D1`  
Check: 82C Formed Disc DS1 .063" — exact match  

**✓ PASS** — "Item 905335"  
Pages used: `B3, B9, D1`  
Check: 166 V-Notched Insert Disc DS1 .063" — exact match  


### Disc Collars

**✓ PASS** — "I need a disc collar for a 7/8 inch round spine"  
Pages used: `B2, B9, F1, B4, C1, B3, B5, B8, B6, B7, B1`  
Check: 191-DS4 fits 7/8" round spine (also fits 5/8" 474 spine)  

**✓ PASS** — "What disc brackets do you sell?"  
Pages used: `B2, B1, B3, B4, B5, B8, B9, B6, B7`  
Check: 192 Disc Bracket for DS1/DS2/DS5/DS8/DS9/DS11 hole styles  


### Pin Racks

**✓ PASS** — "What pin racks do you carry?"  
Pages used: `D1, C1, F1, B2, B9`  
Check: Should surface D1 Pin Racks page  

**✓ PASS** — "I need a 4-way pin rack with 60 pins"  
Pages used: `D1, B2, C1, F1, B9`  
Check: 4W-60 pin rack family  

**⚠ PARTIAL** — "Item number 4W-60-2-75-1"  
Pages used: `D1, B9`  
Check: 4W-60-2-75-1 (4-Way, 60 pins, .156 dia, .75 spacing, 1" group)  

**✓ PASS** — "What is a 6-way pin rack?"  
Pages used: `D1, B2, C1, F1, B9`  
Check: 6-Way Pin Rack family  

**✓ PASS** — "utility rack holder for 24 inch racks"  
Pages used: `D1, C1, B2, B9, F1`  
Check: 6W URH-24 utility rack holder  


### Clamps

**✓ PASS** — "I need a Duraclamp 2 inch"  
Pages used: `G1, C1`  
Check: DC508 = Duraclamp 2"  

**✓ PASS** — "What is the largest Duraclamp?"  
Pages used: `G1, B9, C1, E1`  
Check: DC1016 = Duraclamp 4"  

**✓ PASS** — "Tell me about your Chem Clamp"  
Pages used: `G1`  
Check: 155 Chem Clamp Stainless Steel  

**✓ PASS** — "Quick-Set Clamp components"  
Pages used: `G1`  
Check: Quick-Set Clamp family  

**✓ PASS** — "What are Hexies?"  
Pages used: `C1, G1, B6, B8, E1`  
Check: HEXFL50/HEXFL100 polypropylene tank floats  


### Hardware — Spines

**✓ PASS** — "I need a 36 inch slotted spine"  
Pages used: `F1, B2, B9, B4, B7`  
Check: 484/486C/488C/490C slotted spines available 36-63"  

**✓ PASS** — "What is item 950935?"  
Pages used: `F1, B9, D1`  
Check: 486B 48" Plain Spine Standard Hook  

**✓ PASS** — "titanium spines"  
Pages used: `F1, G1, B9, C1, E1`  
Check: 586 slotted titanium or 589 pierced titanium spine  

**✓ PASS** — "I need a 48 inch spine for hanging discs"  
Pages used: `B2, B9, F1, C1, D1, B6, B7, B1, B3, B4, B5, B8`  
Check: Several 48" plain spine options  


### Hardware — Other

**✓ PASS** — "I need a hook for a 486B spine"  
Pages used: `F1, B2, B9, C1, D1`  
Check: 486N/486H/486HT hooks  

**✓ PASS** — "mounting angle for racks"  
Pages used: `F1, C1, D1, G1, B9`  
Check: 176 Mounting Angle, sizes 12-48"  

**✓ PASS** — "cross member 24 inch"  
Pages used: `F1, C1`  
Check: 485 24" aluminum cross member  


### Fasteners

**✓ PASS** — "1/4-20 bolt 1 inch aluminum"  
Pages used: `B9, E1, G1, F1, B2`  
Check: 999010 = 1/4-20 hex head bolt 1" aluminum  

**✓ PASS** — "titanium bolts"  
Pages used: `F1, E1, B2, B9, G1`  
Check: C.P. Grade 2 titanium bolts 999060-999085  

**✓ PASS** — "conical washers"  
Pages used: `F1`  
Check: 5/8" or 1" conical washers in aluminum or titanium  

**✓ PASS** — "aluminum rivets"  
Pages used: `F1, E1, G1, B9, C1`  
Check: 1100F aluminum solid rivets 3/16 or 1/4 dia  


### Clips

**✓ PASS** — "V-notched clips for thin parts"  
Pages used: `E1, B3, C1, B4, B5`  
Check: Many V-Notched clip families on E1  

**✓ PASS** — "tapered clip with .06 inch tips"  
Pages used: `E1, C1, G1, B2, F1`  
Check: 94 series tapered clips with .06" tip  

**✓ PASS** — "square clips 6 x 1 inch"  
Pages used: `E1, C1, B6, B8, B2`  
Check: 6"x1" square clip series  

**✓ PASS** — "A-clip for the A-Clip rack system"  
Pages used: `E1, C1, B9, D1, B2`  
Check: A-1, A-1X A-Clip series — no bolts/rivets needed  

**✓ PASS** — "tube clip for 1 inch diameter tubes"  
Pages used: `E1, B5, B7, C1, B4`  
Check: TCS1006/TCS1008 (single) or TCD1006/TCD1008 (double)  


### Racks

**✓ PASS** — "V-notched rack 48 inch"  
Pages used: `C1, B2, D1, E1, B3`  
Check: Many V-Notched rack families on C1  

**✓ PASS** — "21 series rack"  
Pages used: `C1, B7, B2, B4, B5`  
Check: 21 V-Notched Rack with .06" tips, 28° notches  

**✓ PASS** — "I need a 161 rack form 015"  
Pages used: `C1, D1, B2, B5, B6`  
Check: 161-015 V-Notched Formed Rack  

**✓ PASS** — "high density box rack"  
Pages used: `C1, B2, D1, B9, B5`  
Check: 183/183W HD Box Rack assemblies, 36-54" spines  

**✓ PASS** — "pointed rack with sharp tips"  
Pages used: `C1, B2, B7, E1, B5`  
Check: 169, 170, 171, 300P, 307, 313 pointed racks  

**✓ PASS** — "square rack 6 inch with .75 inch tips"  
Pages used: `C1, B2, E1, D1, B6`  
Check: 23075 Square Rack with .75" tips  

**✓ PASS** — "split finger rack 7 inch"  
Pages used: `C1, E1, B2, D1, B5`  
Check: 22, 24, 306SFN, 311SFN split finger racks  

**✓ PASS** — "tapered rack 6 inch"  
Pages used: `C1, B2, D1, E1, B9`  
Check: 25, 26, 27, 99 tapered rack series  


### Racks — Item Lookup

**✓ PASS** — "Item 101600"  
Pages used: `C1, B9, D1`  
Check: 21 V-Notched Rack 24" RK1 .063" — exact match  

**✓ PASS** — "What is item 600040?"  
Pages used: `C1, B9, D1`  
Check: 183 HD Box Rack Complete Assembly 36" Spine  


### Edge Cases

**✓ PASS** — "Item number 999999999"  
Pages used: `D1, B9`  
Check: Unknown item should NOT exact-match  

**⚠ PARTIAL** — "Do you sell anodizing chemicals or tanks?"  
Pages used: `C1, E1, G1`  
Check: Out-of-catalog — model will say it cannot help  

**⚠ PARTIAL** — "What is your phone number?"  
Pages used: `D1`  
Check: Phone embedded in page descriptions  

**✓ PASS** — "Do you sell discs?"  
Pages used: `B1, B2, B8, B6, B7, B3, B4, B5, B9`  
Check: Generic disc question should reach disc pages  

---

## Gap Analysis

The following 3 question(s) did not fully pass. These represent either **missing catalog data** or **known placeholders**:

- **⚠ Pin Racks:** "Item number 4W-60-2-75-1"  
  _4W-60-2-75-1 (4-Way, 60 pins, .156 dia, .75 spacing, 1" group)_

- **⚠ Edge Cases:** "Do you sell anodizing chemicals or tanks?"  
  _Out-of-catalog — model will say it cannot help_

- **⚠ Edge Cases:** "What is your phone number?"  
  _Phone embedded in page descriptions_

---

## Recommendations

### Must Fix (FAIL items)

None — all critical data is present.

### Known Data Gaps (PARTIAL items — require PDF entry)

- **"Item number 4W-60-2-75-1"** — 4W-60-2-75-1 (4-Way, 60 pins, .156 dia, .75 spacing, 1" group)
- **"Do you sell anodizing chemicals or tanks?"** — Out-of-catalog — model will say it cannot help
- **"What is your phone number?"** — Phone embedded in page descriptions

### What the Model Cannot Answer

The following question types will result in the bot saying "I don't have that information" or directing to the phone number:

- **Pin Rack specifications** — Section D from PDF not yet entered. Open `data/source/products.csv`, replace the `191-PR-PLACEHOLDER` row with real item numbers from PDF Section D, then run `npm run build`.
- **Anodizing chemicals, tanks, power supplies** — out of catalog scope
- **Custom rack configurations** — bot correctly routes to phone (800-553-8273)
- **Pricing and lead times** — not in catalog data
- **F2 accessory specs** (191-HH1, 191-TBA, 191-DSH, 191-RIT) — items added but no detailed specs; verify against PDF page 19

---

_Generated by `scripts/test-chatbot.js`_
