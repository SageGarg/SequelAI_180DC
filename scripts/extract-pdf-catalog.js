#!/usr/bin/env node
/**
 * extract-pdf-catalog.js
 *
 * Bulk-extracts the actual Sequel 2024 catalog (107 pages, 11 sections)
 * from the structured item number tables in the PDF.
 *
 * Output: data/source/products.csv (replaces existing — old 88 SKUs had
 * fictitious item numbers that did not match the real PDF).
 *
 * Run:   node scripts/extract-pdf-catalog.js
 * Then:  npm run build
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'source');

// CSV header — keep in sync with build-data.js
const CSV_HEADER = [
  'item_number','name','section','catalog_page_id','pdf_page','hole_style',
  'diameter_in','thickness_in','material','finish','max_load_lbs','length_in',
  'cross_section','max_discs','spine_capacity','width_in','height_in',
  'jaw_opening_in','hook_type','fastener_size','fastener_type','compatible_with',
  'quantity_note','spacing_in','needs_verification','notes'
];

const HOLE_STYLES = ['DS1','DS2','DS3','DS4','DS5','DS6','DS7','DS8','DS9','DS10','DS11'];
const THICKNESSES = [0.063, 0.080];

/**
 * Build a disc family. Each entry in `items` is [DS1_063, DS1_080, DS2_063, DS2_080, ...]
 * but in the catalog tables it's presented as 11 rows × 2 cols. We pass the table
 * as an object mapping hole style to [.063 item, .080 item].
 */
function expandDiscFamily(family) {
  const rows = [];
  for (const hs of HOLE_STYLES) {
    const pair = family.items[hs];
    if (!pair) continue;
    THICKNESSES.forEach((thick, idx) => {
      const itemNum = pair[idx];
      if (!itemNum) return;
      rows.push({
        item_number: itemNum,
        name: `${family.model} ${family.description} ${hs}, ${thick}" aluminum`,
        section: 'Discs',
        catalog_page_id: family.pageId,
        pdf_page: family.pdfPage,
        hole_style: hs,
        diameter_in: family.diameter || '',
        thickness_in: thick,
        material: '6061-T6 Aluminum',
        finish: '',
        notes: family.notes || `${family.model} disc series`
      });
    });
  }
  return rows;
}

// ── SECTION B: DISCS ──────────────────────────────────────────────────────────
//
// Data captured directly from PDF pages B3-B9 (PDF pages 8-14).
// Format: items[holeStyle] = [.063" item#, .080" item#]
//
// Notes on disc series:
// - DS1-DS11 hole styles described on page B2 (PDF p7)
// - "Flat" discs are unformed; A/B/C/E suffixes indicate formed shapes
// - 30-finger design, .37" wide fingers, 9" flat diameter (most series)

const DISC_FAMILIES = [
  // 82 Series — V-Notched (PDF page 8 / B3)
  {
    model: '82',
    description: 'V-Notched Flat Disc 9" dia',
    pageId: 'B3',
    pdfPage: 8,
    diameter: 9.0,
    notes: '30-finger V-notched flat disc, 9" flat diameter',
    items: {
      DS1:['900000','900035'], DS2:['900005','900040'], DS3:['900010','900045'],
      DS4:['900015','900050'], DS5:['900020','900055'], DS6:['900025','900060'],
      DS7:['900030','900065'], DS8:['900032','900067'], DS9:['900033','900068'],
      DS10:['900034','900069'], DS11:['900001','900070']
    }
  },
  {
    model: '82A',
    description: 'V-Notched Formed Disc 8.75" dia, .5" deep',
    pageId: 'B3', pdfPage: 8, diameter: 8.75,
    notes: 'Formed disc, slight bend at tip',
    items: {
      DS1:['900490','900525'], DS2:['900495','900530'], DS3:['900500','900535'],
      DS4:['900505','900540'], DS5:['900510','900545'], DS6:['900515','900550'],
      DS7:['900520','900555'], DS8:['900522','900557'], DS9:['900523','900558'],
      DS10:['900524','900559'], DS11:['900491','900560']
    }
  },
  {
    model: '82B',
    description: 'V-Notched Formed Disc 8.5" dia, 1.18" deep',
    pageId: 'B3', pdfPage: 8, diameter: 8.5,
    notes: 'Formed disc, slight bend at tip',
    items: {
      DS1:['901470','901505'], DS2:['901475','901510'], DS3:['901480','901515'],
      DS4:['901485','901520'], DS5:['901490','901525'], DS6:['901495','901530'],
      DS7:['901500','901535'], DS8:['901502','901537'], DS9:['901503','901538'],
      DS10:['901504','901539'], DS11:['901471','901540']
    }
  },
  {
    model: '82C',
    description: 'V-Notched Formed Disc 8.0" dia, 1.25" deep',
    pageId: 'B3', pdfPage: 8, diameter: 8.0,
    notes: 'For 3-point contact use a 166 Disc with a 82C Disc',
    items: {
      DS1:['902450','902485'], DS2:['902455','902490'], DS3:['902460','902495'],
      DS4:['902465','902500'], DS5:['902470','902505'], DS6:['902475','902510'],
      DS7:['902480','902515'], DS8:['902482','902517'], DS9:['902483','902519'],
      DS10:['902484','902520'], DS11:['902451','902521']
    }
  },
  {
    model: '82E',
    description: 'V-Notched Formed Disc 8.125" dia, .75" deep, 70° bends',
    pageId: 'B3', pdfPage: 8, diameter: 8.125,
    items: {
      DS1:['902600','902640'], DS2:['902605','902645'], DS3:['902610','902650'],
      DS4:['902615','902655'], DS5:['902620','902660'], DS6:['902625','902665'],
      DS7:['902630','902670'], DS8:['902635','902675'], DS9:['902636','902676'],
      DS10:['902637','902677'], DS11:['902638','902678']
    }
  },
  {
    model: '166',
    description: 'V-Notched Insert Disc 4.75" dia',
    pageId: 'B3', pdfPage: 8, diameter: 4.75,
    notes: '30-finger insert disc, used with 82A or 82C disc for 3-point contact',
    items: {
      DS1:['905335','905390'], DS2:['905340','905395'], DS3:['905345','905400'],
      DS4:['905350','905405'], DS5:['905355','905410'], DS6:['905360','905415'],
      DS7:['905365','905420'], DS8:['905370','905422'], DS9:['905375','905424'],
      DS10:['905380','905426'], DS11:['905381','905427']
    }
  },

  // 82-1 Series — Dimpled Discs (PDF page 9 / B4)
  {
    model: '82-1',
    description: 'Dimpled Flat Disc 9" dia, .12" dimples',
    pageId: 'B4', pdfPage: 9, diameter: 9.0,
    notes: '30-finger dimpled flat disc',
    items: {
      DS1:['903120','903155'], DS2:['903125','903160'], DS3:['903130','903165'],
      DS4:['903135','903170'], DS5:['903140','903175'], DS6:['903145','903180'],
      DS7:['903150','903185'], DS8:['903152','903187'], DS9:['903153','903188'],
      DS10:['903154','903189'], DS11:['903121','903190']
    }
  },
  {
    model: '82-1B',
    description: 'Dimpled Formed Disc 8.5" dia, 1.18" deep',
    pageId: 'B4', pdfPage: 9, diameter: 8.5,
    items: {
      DS1:['903275','903291'], DS2:['903277','903293'], DS3:['903279','903295'],
      DS4:['903281','903297'], DS5:['903283','903299'], DS6:['903285','903301'],
      DS7:['903287','903303'], DS8:['903288','903305'], DS9:['903289','903306'],
      DS10:['903290','903307'], DS11:['903276','903308']
    }
  },
  {
    model: '82-1D',
    description: 'Dimpled Formed Disc 8.93" dia, .25" deep',
    pageId: 'B4', pdfPage: 9, diameter: 8.93,
    items: {
      DS1:['903430','903465'], DS2:['903435','903470'], DS3:['903440','903475'],
      DS4:['903445','903480'], DS5:['903450','903485'], DS6:['903455','903490'],
      DS7:['903460','903495'], DS8:['903462','903497'], DS9:['903463','903498'],
      DS10:['903464','903499'], DS11:['903431','903466']
    }
  },

  // 82-2 Series — Slotted 1" Discs (PDF page 9 / B4)
  {
    model: '82-2',
    description: 'Slotted Flat Disc 9" dia, 1" x .17" slot',
    pageId: 'B4', pdfPage: 9, diameter: 9.0,
    notes: 'For smaller slot see 82-8 Series',
    items: {
      DS1:['903920','903955'], DS2:['903925','903960'], DS3:['903930','903965'],
      DS4:['903935','903970'], DS5:['903940','903975'], DS6:['903945','903980'],
      DS7:['903950','903985'], DS8:['903952','903987'], DS9:['903953','903988'],
      DS10:['903954','903989'], DS11:['903921','903990']
    }
  },
  {
    model: '82-2F',
    description: 'Slotted Formed Disc 8.87" dia, .18" deep, 1" x .17" slot',
    pageId: 'B4', pdfPage: 9, diameter: 8.87,
    items: {
      DS1:['904410','904445'], DS2:['904415','904450'], DS3:['904420','904455'],
      DS4:['904425','904460'], DS5:['904430','904465'], DS6:['904435','904470'],
      DS7:['904440','904475'], DS8:['904442','904477'], DS9:['904443','904478'],
      DS10:['904444','904479'], DS11:['904411','904480']
    }
  },

  // 82-3 Grooved Disc (PDF page 10 / B5)
  {
    model: '82-3',
    description: 'Grooved Flat Disc 9" dia, .03" wide groove',
    pageId: 'B5', pdfPage: 10, diameter: 9.0,
    items: {
      DS1:['904900','904935'], DS2:['904905','904940'], DS3:['904910','904945'],
      DS4:['904915','904950'], DS5:['904920','904955'], DS6:['904925','904960'],
      DS7:['904930','904965'], DS8:['904932','904967'], DS9:['904933','904968'],
      DS10:['904934','904969'], DS11:['904901','904970']
    }
  },

  // 82-4 Series — Short Pointed Discs (PDF page 10 / B5)
  {
    model: '82-4',
    description: 'Short Pointed Flat Disc 9" dia, V-shaped points',
    pageId: 'B5', pdfPage: 10, diameter: 9.0,
    notes: 'For longer point see 82-7 Series',
    items: {
      DS1:['900175','900210'], DS2:['900180','900215'], DS3:['900185','900220'],
      DS4:['900190','900225'], DS5:['900195','900230'], DS6:['900200','900235'],
      DS7:['900205','900240'], DS8:['900207','900242'], DS9:['900208','900243'],
      DS10:['900209','900244'], DS11:['900176','900245']
    }
  },
  {
    model: '82-4A',
    description: 'Short Pointed Formed Disc 8.75" dia, .5" deep',
    pageId: 'B5', pdfPage: 10, diameter: 8.75,
    items: {
      DS1:['900980','901015'], DS2:['900985','901020'], DS3:['900990','901025'],
      DS4:['900995','901030'], DS5:['901000','901035'], DS6:['901005','901040'],
      DS7:['901010','901045'], DS8:['901012','901047'], DS9:['901013','901048'],
      DS10:['901014','901049'], DS11:['901981','901050']
    }
  },
  {
    model: '82-4B',
    description: 'Short Pointed Formed Disc 8.5" dia, 1.18" deep',
    pageId: 'B5', pdfPage: 10, diameter: 8.5,
    items: {
      DS1:['901960','901995'], DS2:['901965','902000'], DS3:['901970','902005'],
      DS4:['901975','902010'], DS5:['901980','902015'], DS6:['901985','902020'],
      DS7:['901990','902025'], DS8:['901992','902027'], DS9:['901993','902028'],
      DS10:['901994','902029'], DS11:['901961','902030']
    }
  },
  {
    model: '82-4C',
    description: 'Short Pointed Formed Disc 8.0" dia, 1.25" deep',
    pageId: 'B5', pdfPage: 10, diameter: 8.0,
    notes: 'Ideal for racking small tubes or other parts with holes',
    items: {
      DS1:['902940','902975'], DS2:['902945','902980'], DS3:['902950','902985'],
      DS4:['902955','902990'], DS5:['902960','902995'], DS6:['902965','903000'],
      DS7:['902970','903005'], DS8:['902972','903007'], DS9:['902973','903008'],
      DS10:['902974','903009'], DS11:['902941','903010']
    }
  },
  {
    model: '82-4E',
    description: 'Short Pointed Formed Disc 8.12" dia, .75" deep, 70° bends',
    pageId: 'B5', pdfPage: 10, diameter: 8.12,
    items: {
      DS1:['903500','903535'], DS2:['903505','903540'], DS3:['903510','903545'],
      DS4:['903515','903550'], DS5:['903520','903555'], DS6:['903525','903560'],
      DS7:['903530','903565'], DS8:['903532','903567'], DS9:['903533','903568'],
      DS10:['903534','903569'], DS11:['903501','903570']
    }
  },

  // 82-5 Series — Pierced .14" Discs (PDF page 11 / B6)
  {
    model: '82-5',
    description: 'Pierced Flat Disc 9" dia, .14" dia holes',
    pageId: 'B6', pdfPage: 11, diameter: 9.0,
    notes: 'For larger hole see 82-9 Series',
    items: {
      DS1:['906000','906035'], DS2:['906005','906040'], DS3:['906010','906045'],
      DS4:['906015','906050'], DS5:['906020','906055'], DS6:['906025','906060'],
      DS7:['906030','906065'], DS8:['906032','906067'], DS9:['906033','906068'],
      DS10:['906034','906069'], DS11:['906001','906070']
    }
  },
  {
    model: '82-5A',
    description: 'Pierced Formed Disc 8.75" dia, .62" deep, .14" dia holes',
    pageId: 'B6', pdfPage: 11, diameter: 8.75,
    items: {
      DS1:['906200','906235'], DS2:['906205','906240'], DS3:['906210','906245'],
      DS4:['906215','906250'], DS5:['906220','906255'], DS6:['906225','906260'],
      DS7:['906230','906265'], DS8:['906232','906267'], DS9:['906233','906268'],
      DS10:['906234','906269'], DS11:['906201','906270']
    }
  },

  // 82-6 Series — Square Notched Discs (PDF page 11 / B6)
  {
    model: '82-6',
    description: 'Square Notched Flat Disc 9" dia, .09"w x .02"dp notch',
    pageId: 'B6', pdfPage: 11, diameter: 9.0,
    items: {
      DS1:['906400','906440'], DS2:['906405','906445'], DS3:['906410','906450'],
      DS4:['906415','906455'], DS5:['906420','906460'], DS6:['906425','906465'],
      DS7:['906430','906470'], DS8:['906435','906475'], DS9:['906436','906476'],
      DS10:['906437','906477'], DS11:['906438','906478']
    }
  },
  {
    model: '82-6A',
    description: 'Square Notched Formed Disc 8.75" dia, .5" deep',
    pageId: 'B6', pdfPage: 11, diameter: 8.75,
    items: {
      DS1:['906600','906640'], DS2:['906605','906645'], DS3:['906610','906650'],
      DS4:['906615','906655'], DS5:['906620','906660'], DS6:['906625','906665'],
      DS7:['906630','906670'], DS8:['906635','906675'], DS9:['906636','906676'],
      DS10:['906637','906677'], DS11:['906638','906678']
    }
  },
  {
    model: '82-6B',
    description: 'Square Notched Formed Disc 8.5" dia, 1.18" deep',
    pageId: 'B6', pdfPage: 11, diameter: 8.5,
    items: {
      DS1:['906800','906840'], DS2:['906805','906845'], DS3:['906810','906850'],
      DS4:['906815','906855'], DS5:['906820','906860'], DS6:['906825','906865'],
      DS7:['906830','906870'], DS8:['906835','906875'], DS9:['906836','906876'],
      DS10:['906837','906877'], DS11:['906838','906878']
    }
  },
  {
    model: '82-6C',
    description: 'Square Notched Formed Disc 8.0" dia, 1.25" deep',
    pageId: 'B6', pdfPage: 11, diameter: 8.0,
    items: {
      DS1:['907100','907140'], DS2:['907105','907145'], DS3:['907110','907150'],
      DS4:['907115','907155'], DS5:['907120','907160'], DS6:['907125','907165'],
      DS7:['907130','907170'], DS8:['907135','907175'], DS9:['907136','907176'],
      DS10:['907137','907177'], DS11:['907138','907178']
    }
  },
  {
    model: '82-6E',
    description: 'Square Notched Formed Disc 8.12" dia, .75" deep, 70° bends',
    pageId: 'B6', pdfPage: 11, diameter: 8.12,
    items: {
      DS1:['907180','907220'], DS2:['907185','907225'], DS3:['907190','907230'],
      DS4:['907195','907235'], DS5:['907200','907240'], DS6:['907205','907245'],
      DS7:['907210','907250'], DS8:['907215','907255'], DS9:['907216','907256'],
      DS10:['907217','907257'], DS11:['907218','907258']
    }
  },

  // 82-7 Series — Long Pointed Discs (PDF page 12 / B7)
  {
    model: '82-7',
    description: 'Long Pointed Flat Disc 9" dia, long V-shaped points',
    pageId: 'B7', pdfPage: 12, diameter: 9.0,
    notes: 'For shorter point see 82-4 Series',
    items: {
      DS1:['907400','907440'], DS2:['907405','907445'], DS3:['907410','907450'],
      DS4:['907415','907455'], DS5:['907420','907460'], DS6:['907425','907465'],
      DS7:['907430','907470'], DS8:['907435','907475'], DS9:['907436','907476'],
      DS10:['907437','907477'], DS11:['907438','907478']
    }
  },
  {
    model: '82-7A',
    description: 'Long Pointed Formed Disc 8.75" dia, .5" deep',
    pageId: 'B7', pdfPage: 12, diameter: 8.75,
    items: {
      DS1:['907600','907640'], DS2:['907605','907645'], DS3:['907610','907650'],
      DS4:['907615','907655'], DS5:['907620','907660'], DS6:['907625','907665'],
      DS7:['907630','907670'], DS8:['907635','907675'], DS9:['907636','907676'],
      DS10:['907637','907677'], DS11:['907638','907678']
    }
  },
  {
    model: '82-7B',
    description: 'Long Pointed Formed Disc 8.5" dia, 1.18" deep',
    pageId: 'B7', pdfPage: 12, diameter: 8.5,
    items: {
      DS1:['907800','907840'], DS2:['907805','907845'], DS3:['907810','907850'],
      DS4:['907815','907855'], DS5:['907820','907860'], DS6:['907825','907865'],
      DS7:['907830','907870'], DS8:['907835','907875'], DS9:['907836','907876'],
      DS10:['907837','907877'], DS11:['907838','907878']
    }
  },
  {
    model: '82-7C',
    description: 'Long Pointed Formed Disc 8.0" dia, 1.25" deep',
    pageId: 'B7', pdfPage: 12, diameter: 8.0,
    items: {
      DS1:['908100','908140'], DS2:['908105','908145'], DS3:['908110','908150'],
      DS4:['908115','908155'], DS5:['908120','908160'], DS6:['908125','908165'],
      DS7:['908130','908170'], DS8:['908135','908175'], DS9:['908136','908176'],
      DS10:['908137','908177'], DS11:['908138','908178']
    }
  },
  {
    model: '82-7E',
    description: 'Long Pointed Formed Disc 8.125" dia, .75" deep, 70° bends',
    pageId: 'B7', pdfPage: 12, diameter: 8.125,
    notes: 'Ideal for racking small tubes or parts with holes',
    items: {
      DS1:['908200','908240'], DS2:['908205','908245'], DS3:['908210','908250'],
      DS4:['908215','908255'], DS5:['908220','908260'], DS6:['908225','908265'],
      DS7:['908230','908270'], DS8:['908235','908275'], DS9:['908236','908276'],
      DS10:['908237','908277'], DS11:['908238','908278']
    }
  },

  // 82-8 Series — Slotted .50" Discs (PDF page 12 / B7)
  {
    model: '82-8',
    description: 'Slotted Flat Disc 9" dia, .50" x .17" slot',
    pageId: 'B7', pdfPage: 12, diameter: 9.0,
    notes: 'For larger slot see 82-2 Series',
    items: {
      DS1:['908520','908555'], DS2:['908525','908560'], DS3:['908530','908565'],
      DS4:['908535','908570'], DS5:['908540','908575'], DS6:['908545','908580'],
      DS7:['908550','908585'], DS8:['908552','908587'], DS9:['908553','908588'],
      DS10:['908554','908589'], DS11:['908521','908590']
    }
  },
  {
    model: '82-8F',
    description: 'Slotted Formed Disc 8.87" dia, .18" deep, .50" x .17" slot',
    pageId: 'B7', pdfPage: 12, diameter: 8.87,
    items: {
      DS1:['908610','908645'], DS2:['908615','908650'], DS3:['908620','908655'],
      DS4:['908625','908660'], DS5:['908630','908665'], DS6:['908635','908670'],
      DS7:['908640','908675'], DS8:['908642','908677'], DS9:['908643','908678'],
      DS10:['908644','908679'], DS11:['908611','908680']
    }
  },

  // 82-9 Series — Pierced .18" Discs (PDF page 13 / B8)
  {
    model: '82-9',
    description: 'Pierced Flat Disc 9" dia, .185" dia holes',
    pageId: 'B8', pdfPage: 13, diameter: 9.0,
    notes: 'For smaller hole see 82-5 Series',
    items: {
      DS1:['909120','909155'], DS2:['909125','909160'], DS3:['909130','909165'],
      DS4:['909135','909170'], DS5:['909140','909175'], DS6:['909145','909180'],
      DS7:['909150','909185'], DS8:['909152','909187'], DS9:['909153','909188'],
      DS10:['909154','909189'], DS11:['909121','909190']
    }
  },
  {
    model: '82-9A',
    description: 'Pierced Formed Disc 8.75" dia, .5" deep, .185" dia holes',
    pageId: 'B8', pdfPage: 13, diameter: 8.75,
    items: {
      DS1:['909220','909255'], DS2:['909225','909260'], DS3:['909230','909265'],
      DS4:['909235','909270'], DS5:['909240','909275'], DS6:['909245','909280'],
      DS7:['909250','909285'], DS8:['909252','909287'], DS9:['909253','909288'],
      DS10:['909254','909289'], DS11:['909221','909290']
    }
  },

  // 82-10 Oval Pierced Disc (PDF page 13 / B8)
  {
    model: '82-10',
    description: 'Oval Pierced Flat Disc 9" dia, .17" x .25" ovals',
    pageId: 'B8', pdfPage: 13, diameter: 9.0,
    items: {
      DS1:['909320','909360'], DS2:['909325','909365'], DS3:['909330','909370'],
      DS4:['909335','909375'], DS5:['909340','909380'], DS6:['909345','909385'],
      DS7:['909350','909390'], DS8:['909352','909392'], DS9:['909353','909393'],
      DS10:['909354','909394'], DS11:['909355','909395']
    }
  },

  // 82-11 Series — Square End Discs (PDF page 13 / B8)
  {
    model: '82-11',
    description: 'Square-End Flat Disc 9" dia',
    pageId: 'B8', pdfPage: 13, diameter: 9.0,
    items: {
      DS1:['909420','909460'], DS2:['909425','909465'], DS3:['909430','909470'],
      DS4:['909435','909475'], DS5:['909440','909480'], DS6:['909445','909485'],
      DS7:['909450','909490'], DS8:['909452','909492'], DS9:['909453','909493'],
      DS10:['909454','909494'], DS11:['909455','909495']
    }
  },
  {
    model: '82-11E',
    description: 'Square-End Formed Disc 8.12" dia, .75" deep, 70° bends',
    pageId: 'B8', pdfPage: 13, diameter: 8.12,
    items: {
      DS1:['909520','909560'], DS2:['909525','909565'], DS3:['909530','909570'],
      DS4:['909535','909575'], DS5:['909540','909580'], DS6:['909545','909585'],
      DS7:['909550','909590'], DS8:['909552','909592'], DS9:['909553','909593'],
      DS10:['909554','909594'], DS11:['909555','909595']
    }
  }
];

// Disc Collars (191 series) and Disc Brackets (192) — PDF page 14 / B9
const DISC_COLLARS_BRACKETS = [
  { item_number:'998071-DS1', name:'191-DS1 Disc Collar for 1/4" x 3/4" Spine',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6061-T6 Aluminum',
    compatible_with:'474 Spine', notes:'Use 1/4-20 bolts (not included)' },
  { item_number:'998071-DS3', name:'191-DS3 Disc Collar for 3/4" Dia Spine',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6061-T6 Aluminum',
    notes:'For DS3/DS4 disc hole styles, round spine' },
  { item_number:'998071-DS4', name:'191-DS4 Disc Collar for 7/8" Dia Spine',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6061-T6 Aluminum',
    notes:'Will also fit Model 474 (5/8" x 5/8") Plain Spine' },
  { item_number:'998071-DS8', name:'191-DS8 Disc Collar for 3/8" x 1" Spine',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6061-T6 Aluminum',
    compatible_with:'486B Spine' },
  { item_number:'998071-DS11', name:'191-DS11 Disc Collar for 1/4" x 1" Spine',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6061-T6 Aluminum',
    compatible_with:'485B Spine' },
  { item_number:'998070', name:'192 Disc Bracket .187" thick',
    section:'Discs', catalog_page_id:'B9', pdf_page:14, material:'6063 Aluminum',
    notes:'Used in pairs to attach disc to spine. Compatible with DS1, DS2, DS5, DS8, DS9, DS11 hole styles' }
];

// ── SECTION D: PIN RACKS ──────────────────────────────────────────────────────
//
// Pin Racks use config-encoded item numbers (e.g., 4W-60-2-75-1 = 4-Way, 60 pins,
// .156 dia, .75" pin space, 1" group space). PDF pages D4-D7 (PDF pages 51-54).
// Pin diameters: 1=.125, 2=.156, 3=.187, 4=.250, 6=.144

const PIN_DIA = {1:.125, 2:.156, 3:.187, 4:.250, 6:.144};

// 2-Way Single Pin-Group (PDF page 51 / D4)
const PIN_RACKS_2W = [
  ['2W-4-3-3-11', 4, 7, 3, 11.25, 32, ''],
  ['2W-4-3-3-11T', 4, 7, 3, 11.25, 32, '90° Twist Hook'],
  ['2W-8-2-37-9.12', 8, 7, 2, 9.12, 43, ''],
  ['2W-8-3-37-9.12', 8, 7, 3, 9.12, 43, ''],
  ['2W-8-3-6-3.6', 8, 7, 3, 3.62, 50, ''],
  ['2W-8-4-5-1', 8, 7, 4, 1.00, 37, ''],
  ['2W-10-2-4.31-1', 10, 7, 2, 1.00, 40, ''],
  ['2W-10-3-4.31-1', 10, 7, 3, 1.00, 40, ''],
  ['2W-12-2-37-512-75', 12, 7, 2, 5.12, 39, 'Addl .75" Spc'],
  ['2W-15-3-1.5-1', 15, 7, 3, 1.00, 32, ''],
  ['2W-15-4-1.5-1', 15, 7, 4, 1.00, 32, ''],
  ['2W-16-3-62-162-4SX', 16, 12, 3, 1.62, 38, ''],
  ['2W-16-3-62-162-4SXT', 16, 12, 3, 1.62, 38, '90° Twist Hook'],
  ['2W-18-2-1.5', 18, 7, 2, 0, 40, ''],
  ['2W-18-2-1.5S', 18, 9, 2, 0, 40, ''],
  ['2W-18-2-1.5ST', 18, 9, 2, 0, 40, '90° Twist Hook'],
  ['2W-18-2-2', 18, 7, 2, 0, 48, ''],
  ['2W-18-3-1.5', 18, 7, 3, 0, 40, ''],
  ['2W-18-3-1.5S', 18, 9, 3, 0, 40, ''],
  ['2W-18-3-1.5SN', 18, 9, 3, 0, 40, 'Notched Pins'],
  ['2W-18-3-1.5T', 18, 7, 3, 0, 40, '90° Twist Hook'],
  ['2W-18-3-2', 18, 7, 3, 0, 48, ''],
  ['2W-18-4-1.5', 18, 7, 4, 0, 40, ''],
  ['2W-18-4-1.5S', 18, 9, 4, 0, 40, ''],
  ['2W-18-4-1.5SN', 18, 9, 4, 0, 40, 'Notched Pins'],
  ['2W-18-4-15SNT', 18, 9, 4, 0, 40, 'Notched, 90° Hook'],
  ['2W-18-4-1.5ST', 18, 9, 4, 0, 40, '90° Twist Hook'],
  ['2W-20-1-2-50', 20, 7, 1, 0.50, 39, ''],
  ['2W-20-2-2-50', 20, 7, 2, 0.50, 39, ''],
  ['2W-20-3-2-50', 20, 7, 3, 0.50, 39, ''],
  ['2W-20-3-50-3SX', 20, 12, 3, 3.00, 46, ''],
  ['2W-21-3-1', 21, 7, 3, 0, 34, ''],
  ['2W-21-3-1N', 21, 7, 3, 0, 34, 'Notched Pins'],
  ['2W-22-3-75-225', 22, 7, 3, 2.25, 45, ''],
  ['2W-24-2-1', 24, 7, 2, 0, 37, ''],
  ['2W-24-2-75', 24, 7, 2, 0, 32, ''],
  ['2W-24-3-1', 24, 7, 3, 0, 37, ''],
  ['2W-24-3-75', 24, 7, 3, 0, 32, ''],
  ['2W-24-3-62-162SX', 24, 12, 3, 1.62, 40, ''],
  ['2W-24-3-62-175SX', 24, 11, 3, 1.75, 41, ''],
  ['2W-24-3-62-175SXT', 24, 11, 3, 1.75, 41, '90° Twist Hook'],
  ['2W-27-2-1', 27, 7, 2, 0, 40, ''],
  ['2W-27-3-1', 27, 7, 3, 0, 40, ''],
  ['2W-27-4-1', 27, 7, 4, 0, 40, ''],
  ['2W-30-2-75-1', 30, 7, 2, 1.00, 40, ''],
  ['2W-30-3-75-1', 30, 7, 3, 1.00, 40, ''],
  ['2W-30-3-75-1N', 30, 7, 3, 1.00, 40, 'Notched Pins'],
  ['2W-32-2-75', 32, 7, 2, 0, 38, ''],
  ['2W-32-3-75', 32, 7, 3, 0, 38, ''],
  ['2W-32-2-1', 32, 7, 2, 0, 45, ''],
  ['2W-32-3-1', 32, 7, 3, 0, 45, ''],
  ['2W-34-1-37-112', 34, 7, 1, 1.12, 39, ''],
  ['2W-40-2-75', 40, 7, 2, 0, 44, ''],
  ['2W-40-3-75', 40, 7, 3, 0, 44, ''],
  ['2W-52-3-75-1', 52, 7, 3, 1.00, 59, ''],
  ['2W-52-3-75-N', 52, 7, 3, 1.00, 59, 'Notched Pins']
];

// 4-Way Single Pin-Group (PDF pages 51-52 / D4-D5)
const PIN_RACKS_4W = [
  ['4W-8-2-6-5.5', 8, 7, 2, 5.50, 37, ''],
  ['4W-8-2-7-5', 8, 7, 2, 5.00, 38, ''],
  ['4W-8-3-6-525', 8, 7, 3, 5.25, 39, ''],
  ['4W-8-3-6.4', 8, 7, 3, 0, 34, ''],
  ['4W-8-3-6.5', 8, 7, 3, 0, 34, ''],
  ['4W-8-3-6.87-525', 8, 7, 3, 5.25, 38, ''],
  ['4W-8-3-7-3', 8, 7, 3, 3.00, 34, ''],
  ['4W-9-2-3', 9, 7, 2, 0, 25, ''],
  ['4W-12-2-2', 12, 7, 2, 0, 25, ''],
  ['4W-12-2-4', 12, 7, 2, 0, 35, ''],
  ['4W-12-2-7-2', 12, 7, 2, 2.00, 41, ''],
  ['4W-12-3-4', 12, 7, 3, 0, 35, ''],
  ['4W-16-3-4.5', 16, 7, 3, 0, 46, ''],
  ['4W-18-3-3', 18, 7, 3, 0, 39, ''],
  ['4W-18-3-3N', 18, 7, 3, 0, 39, 'Notched Pins'],
  ['4W-20-2-3', 20, 7, 2, 0, 42, ''],
  ['4W-20-3-3', 20, 7, 3, 0, 42, ''],
  ['4W-24-1-2.5', 24, 7, 1, 0, 42, ''],
  ['4W-24-3-3', 24, 7, 3, 0, 48, ''],
  ['4W-24-3-3-1', 24, 7, 3, 1.00, 38, ''],
  ['4W-24-3-62-4S', 24, 9, 3, 4.00, 39, ''],
  ['4W-24-3-62-4SX', 24, 12, 3, 4.00, 39, ''],
  ['4W-26-2-3', 26, 7, 2, 0, 51, ''],
  ['4W-26-3-3', 26, 7, 3, 0, 51, ''],
  ['4W-28-4-1-2', 28, 7, 4, 2.00, 35, ''],
  ['4W-32-4-1.18', 32, 7, 4, 0, 33, ''],
  ['4W-34-2-2', 34, 7, 2, 0, 47, ''],
  ['4W-34-3-2', 34, 7, 3, 0, 47, ''],
  ['4W-36-1-37-262', 36, 7, 1, 2.62, 41, ''],
  ['4W-36-1-1.5', 36, 7, 1, 0, 40, ''],
  ['4W-36-1-1.5S', 36, 9, 1, 0, 40, ''],
  ['4W-36-2-1.5', 36, 7, 2, 0, 40, ''],
  ['4W-36-2-1.5S', 36, 9, 2, 0, 40, ''],
  ['4W-36-3-1.5', 36, 7, 3, 0, 40, ''],
  ['4W-36-3-1.5N', 36, 7, 3, 0, 40, 'Notched Pins'],
  ['4W-36-3-1.5S', 36, 9, 3, 0, 40, ''],
  ['4W-36-3-1.5SN', 36, 9, 3, 0, 40, 'Notched Pins'],
  ['4W-36-4-1.5', 36, 7, 4, 0, 40, ''],
  ['4W-36-4-1.5S', 36, 9, 4, 0, 40, ''],
  ['4W-36-4-1.5SN', 36, 9, 4, 0, 40, 'Notched Pins'],
  ['4W-40-1-1.25', 40, 7, 1, 0, 39, ''],
  ['4W-44-3-1.5-75', 44, 7, 3, 0.75, 39, ''],
  ['4W-46-3-1.5', 46, 7, 3, 0, 48, ''],
  ['4W-48-2-1.5', 48, 7, 2, 0, 49, ''],
  ['4W-48-3-1.5', 48, 7, 3, 0, 49, ''],
  ['4W-60-1-75-1', 60, 7, 1, 1.00, 49, ''],
  ['4W-60-2-75-1', 60, 7, 2, 1.00, 40, ''],
  ['4W-60-2-75-1N', 60, 7, 2, 1.00, 40, 'Notched Pins'],
  ['4W-60-2-75-1S', 60, 9, 2, 1.00, 40, ''],
  ['4W-60-3-75-1', 60, 7, 3, 1.00, 40, ''],
  ['4W-64-1-50-150', 64, 7, 1, 1.50, 46, ''],
  ['4W-64-2-50-150', 64, 7, 2, 1.50, 46, ''],
  ['4W-64-3-50-150', 64, 7, 3, 1.50, 46, ''],
  ['4W-64-3-75', 64, 7, 3, 0, 38, ''],
  ['4W-66-1-50-1', 66, 7, 1, 1.00, 39, ''],
  ['4W-68-1-37-112', 68, 7, 1, 1.12, 39, ''],
  ['4W-68-2-37-112', 68, 7, 2, 1.12, 39, ''],
  ['4W-68-2-37-112S', 68, 9, 2, 1.12, 39, ''],
  ['4W-68-2-1', 68, 7, 2, 0, 48, ''],
  ['4W-68-3-1', 68, 7, 3, 0, 48, ''],
  ['4W-70-2-75', 70, 7, 2, 0, 40, ''],
  ['4W-70-3-75', 70, 7, 3, 0, 40, ''],
  ['4W-70-3-75N', 70, 7, 3, 0, 40, 'Notched Pins'],
  ['4W-80-2-75', 80, 7, 2, 1.00, 44, ''],
  ['4W-80-3-75', 80, 7, 3, 1.00, 44, ''],
  ['4W-84-2-75-1', 84, 7, 2, 1.00, 51, ''],
  ['4W-84-3-75-1', 84, 7, 3, 1.00, 51, ''],
  ['4W-100-1-50', 100, 7, 1, 0, 39, ''],
  ['4W-100-2-50', 100, 7, 2, 0, 39, ''],
  ['4W-100-3-50', 100, 7, 3, 0, 39, ''],
  ['4W-132-2-50', 132, 7, 2, 0, 47, ''],
  ['4W-132-3-50', 132, 7, 3, 0, 47, ''],
  ['4W-144-6-50', 144, 7, 6, 0, 50, ''],
  ['4W-150-1-50', 150, 7, 1, 0, 52, ''],
  ['4W-150-2-50', 150, 7, 2, 0, 52, ''],
  ['4W-150-3-50', 150, 7, 3, 0, 52, '']
];

// 6-Way Single Pin-Group (PDF page 52 / D5)
const PIN_RACKS_6W = [
  ['6W-18-4-6-4', 18, 7, 4, 4.00, 41, ''],
  ['6W-24-3-4-2', 24, 7, 3, 2.00, 37, ''],
  ['6W-36-3-1.5', 36, 7, 3, 0, 31, ''],
  ['6W-36-3-1.5S', 36, 9, 3, 0, 31, ''],
  ['6W-36-3-2', 36, 7, 3, 0, 37, ''],
  ['6W-39-1-275', 39, 7, 1, 0, 48, ''],
  ['6W-51-2-2', 51, 7, 2, 0, 47, ''],
  ['6W-51-3-2', 51, 7, 3, 0, 47, ''],
  ['6W-54-2-1.5', 54, 7, 2, 0, 54, ''],
  ['6W-54-2-1.5S', 54, 9, 2, 0, 54, ''],
  ['6W-54-3-1.5', 54, 7, 3, 0, 54, ''],
  ['6W-72-2-1.5', 72, 7, 2, 0, 49, ''],
  ['6W-72-3-1.5', 72, 7, 3, 0, 49, ''],
  ['6W-75-2-1', 75, 7, 2, 0, 39, ''],
  ['6W-75-2-1N', 75, 7, 2, 0, 39, 'Notched Pins'],
  ['6W-75-3-1', 75, 7, 3, 0, 39, ''],
  ['6W-78-2-1', 78, 7, 2, 0, 40, ''],
  ['6W-78-3-1', 78, 7, 3, 0, 40, ''],
  ['6W-90-1-75-1', 90, 7, 1, 1.00, 39, ''],
  ['6W-90-2-75-1', 90, 7, 2, 1.00, 40, ''],
  ['6W-90-3-75-1', 90, 7, 3, 1.00, 40, ''],
  ['6W-90-3-75-1S', 90, 9, 3, 1.00, 40, ''],
  ['6W-90-3-75-1.5S', 90, 9, 3, 1.50, 47, ''],
  ['6W-96-1-75', 96, 7, 1, 0, 38, ''],
  ['6W-96-2-75', 96, 7, 2, 0, 38, ''],
  ['6W-96-3-75', 96, 7, 3, 0, 38, ''],
  ['6W-99-2-1', 99, 7, 2, 0, 47, ''],
  ['6W-99-3-1', 99, 7, 3, 0, 47, ''],
  ['6W-102-2-75', 102, 7, 2, 0, 40, ''],
  ['6W-102-3-75', 102, 7, 3, 0, 40, ''],
  ['6W-102-3-75N', 102, 7, 3, 0, 40, 'Notched Pins'],
  ['6W-120-2-75-1', 120, 7, 2, 1.00, 49, ''],
  ['6W-120-3-75-1', 120, 7, 3, 1.00, 49, ''],
  ['6W-126-2-75-1', 126, 7, 2, 1.00, 51, ''],
  ['6W-126-3-75-1', 126, 7, 3, 1.00, 51, ''],
  ['6W-150-1-75', 150, 7, 1, 0, 52, ''],
  ['6W-150-2-75', 150, 7, 2, 0, 52, ''],
  ['6W-150-3-75', 150, 7, 3, 0, 52, ''],
  ['6W-150-6-75', 150, 7, 6, 0, 52, ''],
  ['6W-150-2-1-75', 150, 7, 2, 0.75, 58, ''],
  ['6W-150-3-1-75', 150, 7, 3, 0.75, 58, '']
];

// Multi Pin-Group racks (PDF pages 52-53 / D5-D6)
const PIN_RACKS_MULTI = [
  // 2W3P
  ['2W3P-21-6-275-1', '2W3P', 21, 6.5, 6, 'V1=2.75 V2=1.00', 40, ''],
  ['2W3P-27-3-2-1N', '2W3P', 27, 6.5, 3, 'V1=2.00 V2=1.00', 40, 'Notched'],
  ['2W3P-36-6-50-2.5', '2W3P', 36, 6.5, 6, 'V1=.50 V2=2.50', 48, ''],
  ['2W3P-42-3-1-1N', '2W3P', 42, 6.5, 3, 'V1=1.00 V2=1.00', 40, 'Notched'],
  // 4W2P
  ['4W2P-48-6-2', '4W2P', 48, 6.5, 6, 'V1=2.00 V2=2.00', 37, ''],
  ['4W2P-76-6-2', '4W2P', 76, 6.5, 6, 'V1=2.00 V2=2.00', 51, ''],
  ['4W2P-100-1-1', '4W2P', 100, 6.5, 1, 'V1=1.00 V2=1.00', 39, ''],
  ['4W2P-100-6-1', '4W2P', 100, 6.5, 6, 'V1=1.00 V2=1.00', 39, ''],
  ['4W2P-148-6-1', '4W2P', 148, 6.5, 6, 'V1=1.00 V2=1.00', 51, ''],
  ['4W2P-200-1-50', '4W2P', 200, 6.5, 1, 'V1=.50 V2=.50', 39, ''],
  ['4W2P-264-1-50', '4W2P', 264, 6.5, 1, 'V1=.50 V2=.50', 47, ''],
  // 4W3P
  ['4W3P-48-6-50-2.5', '4W3P', 48, 6.5, 6, 'V1=.50 V2=2.50', 36, ''],
  ['4W3P-54-3-1-2', '4W3P', 54, 6.5, 3, 'V1=1.00 V2=2.00', 40, '3/4" Sq Spine'],
  ['4W3P-72-1-50-1.5', '4W3P', 72, 6.5, 1, 'V1=.50 V2=1.50', 37, ''],
  ['4W3P-72-6-50-1.5', '4W3P', 72, 6.5, 6, 'V1=.50 V2=1.50', 37, ''],
  ['4W3P-72-6-50-2.5', '4W3P', 72, 6.5, 6, 'V1=.50 V2=2.50', 48, ''],
  ['4W3PX-72-2-50-1.5', '4W3PX', 72, 6.5, 2, 'V1=.50 V2=1.50', 37, '3/4" Sq Spine'],
  ['4W3P-84-1-50-75', '4W3P', 84, 6.5, 1, 'V1=.50 V2=1.50', 46, ''],
  ['4W3P-90-6-50-1.5', '4W3P', 90, 6.5, 6, 'V1=.50 V2=1.50', 43, ''],
  ['4W3P-108-1-50-1.5', '4W3P', 108, 6.5, 1, 'V1=.50 V2=1.50', 49, ''],
  ['4W3P-108-6-50-1.5', '4W3P', 108, 6.5, 6, 'V1=.50 V2=1.50', 49, ''],
  ['4W3P-150-6-50-50', '4W3P', 150, 6.5, 6, 'V1=.50 V2=1.50', 39, ''],
  // 4W4P
  ['4W4P-16-6-225-2', '4W4P', 16, 6.5, 6, 'V1=2.25 V2=2.00', 27, ''],
  ['4W4P-104-1-37-112', '4W4P', 104, 6.5, 1, 'V1=.37 V2=1.12', 34, ''],
  // 8W2P
  ['8W2P-104-1-37-112', '8W2P', 104, 6.5, 1, 'V1=.37 V2=1.12', 34, '']
];

// Horizontal Multi-Station Bars + Utility Rack Holders (PDF page 53-54 / D6-D7)
const PIN_RACKS_HORIZ_URH = [
  // Single Spine, Single-Pin Group
  ['2W1P-2-3-4', 2, 7, 3, 4.00, 5, 'Single Spine'],
  ['2W1P-2-4-4', 2, 7, 4, 4.00, 5, 'Single Spine'],
  ['2W1P-2-3-5.2', 2, 7, 3, 5.20, 6.25, 'Single Spine'],
  ['2W1P-2-4-5.2', 2, 7, 4, 5.20, 6.25, 'Single Spine'],
  ['2W1P-6-1-3', 6, 6.5, 1, 3.00, 15.5, 'Single Spine'],
  ['2W1P-6-1-4', 6, 6.5, 1, 4.00, 20.5, 'Single Spine'],
  ['2W1P-6-2-4', 6, 6.5, 2, 4.00, 20.5, 'Single Spine'],
  ['2W1P-8-1-2', 8, 6.5, 1, 2.00, 14.5, 'Single Spine'],
  ['2W1P-10-1-1', 10, 6.5, 1, 1.00, 10, 'Single Spine'],
  // Single Spine, Multi-Pin Group
  ['2W2P-8-1-2', 8, 6.5, 1, 2.00, 7, 'Single Spine 2-Pin'],
  ['2W2P-20-1-875', 20, 6.5, 1, 0.87, 9, 'Single Spine 2-Pin'],
  // Double Spine, Single-Pin Group
  ['2W1P-17-1-2', 17, 6.5, 1, 2.00, 36, 'Double Spine'],
  ['2W1P-24-1-1', 24, 6.5, 1, 1.00, 27, 'Double Spine'],
  ['2W1P-28-4-1X', 28, 8.0, 4, 1.00, 30, 'Double Spine'],
  ['2W1P-28-4-1XL', 28, 17.0, 4, 1.00, 30, 'Double Spine'],
  ['2W1P-30-4-1.5N', 30, 7, 4, 1.50, 48, 'Double Spine Notched'],
  ['2W1P-33-3-1S', 33, 9, 3, 1.00, 36, 'Double Spine'],
  ['2W1P-33-4-1S', 33, 9, 4, 1.00, 36, 'Double Spine'],
  ['2W1P-45-4-1N', 45, 7, 4, 1.00, 48, 'Double Spine Notched'],
  // Double Spine, Multi-Pin Group
  ['2W2P-34-1-150', 34, 6.5, 1, 1.50, 26.25, 'Double Spine 2-Pin'],
  ['2W2P-46-1-1.25', 46, 6.5, 1, 1.25, 30, 'Double Spine 2-Pin'],
  ['2W2P-56-1-1.25', 56, 6.5, 1, 1.25, 36, 'Double Spine 2-Pin'],
  ['2W2P-60-1-.625', 60, 6.5, 1, 0.62, 21.12, 'Double Spine 2-Pin'],
  ['2W2P-60-1-.625T', 60, 6.5, 1, 0.62, 21.12, 'Double Spine 2-Pin Twist'],
  // Utility Rack Holder Components
  ['2W1P-6-1-2', 6, 7, 1, 2.00, 11, 'URH Component'],
  ['2W1P-6-4-2N', 6, 7, 4, 2.00, 11, 'URH Component'],
  ['2W1P-6-4-3N', 6, 7, 4, 3.00, 16, 'URH Component']
];

// URH Complete Assemblies
const URH_ASSEMBLIES = [
  { item_number:'6W URH-24', name:'Utility Rack Holder, 6-Way for 24" Racks (assembled)',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54,
    notes:'Holds 6 Sequel utility racks. Use with 169-011, 169-012, 170-022, 171-022' },
  { item_number:'6W URH-36', name:'Utility Rack Holder, 6-Way for 36" Racks (assembled)',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'2W1P-6-1-2X36', name:'12-Way URH Complete Assembly .125 Pins (Not for Util Racks)',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'2W1P-6-4-2X24', name:'12-Way URH Complete Assembly for 24" Utility Racks',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'2W1P-6-4-2X36', name:'12-Way URH Complete Assembly for 36" Utility Racks',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'2W1P-6-4-3X36', name:'12-Way URH Complete Assembly for 36" Utility Racks (3" pin space)',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'486B-24URH', name:'486B Pierced Spine, SP2 Hook Style, 42" for Utility Rack Holder',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 },
  { item_number:'486B-36URH', name:'486B Pierced Spine, SP2 Hook Style, 52" for Utility Rack Holder',
    section:'Pin Racks', catalog_page_id:'D1', pdf_page:54 }
];

function buildPinRackRow(arr, pageId, pdfPage) {
  const [itemNum, pins, pinLen, pinDiaCode, spc, spineLen, notes] = arr;
  const dia = PIN_DIA[pinDiaCode] || pinDiaCode;
  // Parse parts from item number (e.g., "4W-60-2-75-1")
  const parts = itemNum.split('-');
  const config = parts[0]; // 2W, 4W, 6W, 2W3P, etc.
  return {
    item_number: itemNum,
    name: `${config} Pin Rack ${pins} pins ${dia}" dia${spc ? ', ' + spc + '" spacing' : ''}${notes ? ' (' + notes + ')' : ''}`,
    section: 'Pin Racks',
    catalog_page_id: pageId,
    pdf_page: pdfPage,
    length_in: pinLen,
    spacing_in: spc || '',
    material: '6061-T6 Aluminum',
    notes: notes || `${config} pin rack, ${pins} pins on ${spineLen}" spine`
  };
}

function buildMultiPinRow(arr, pageId, pdfPage) {
  const [itemNum, config, pins, pinLen, pinDiaCode, spacing, spineLen, notes] = arr;
  const dia = PIN_DIA[pinDiaCode] || pinDiaCode;
  return {
    item_number: itemNum,
    name: `${config} Multi Pin-Group Rack, ${pins} pins ${dia}" dia, ${spacing}`,
    section: 'Pin Racks',
    catalog_page_id: pageId,
    pdf_page: pdfPage,
    length_in: pinLen,
    material: '6061-T6 Aluminum',
    notes: notes || `${config} multi pin-group rack on ${spineLen}" spine`
  };
}

function buildHorizPinRow(arr, pageId, pdfPage) {
  const [itemNum, pins, pinLen, pinDiaCode, spc, spineLen, notes] = arr;
  const dia = PIN_DIA[pinDiaCode] || pinDiaCode;
  return {
    item_number: itemNum,
    name: `Horizontal Multi-Station Bar, ${pins} pins ${dia}" dia (${notes})`,
    section: 'Pin Racks',
    catalog_page_id: 'D1',
    pdf_page: pdfPage,
    length_in: pinLen,
    spacing_in: spc || '',
    material: '6061-T6 Aluminum',
    notes: notes
  };
}

// ── SECTION G: CLAMPS ─────────────────────────────────────────────────────────
//
// PDF pages G2-G6 (PDF pages 97-101). Mounting clamps, chem clamp, duraclamps,
// Quick-Set Clamp, Q2 Clamp, and Hexies floats.

const CLAMPS = [
  // Mounting Clamps (G2)
  { item_number:'998045', name:'154-1 Mounting Clamp 1.5"',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, material:'6063 Aluminum',
    notes:'For 1.5" wide spines, 1/4-20 tapped holes (bolts not included)' },
  { item_number:'998035', name:'154-2 Mounting Clamp 2"',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, material:'6063 Aluminum',
    notes:'For 2" wide spines, 1/4-20 tapped holes (bolts not included)' },
  // Chem Clamp 155 (G2)
  { item_number:'998036RED', name:'155 Chem Clamp Stainless Steel 35lb (red handles)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, material:'Stainless Steel 300 Series',
    jaw_opening_in:'0-2.25', max_load_lbs:35,
    notes:'1.25" wide x 6" long, vinyl handles, 35# (red) holding force for tough corrosive applications' },
  { item_number:'998036GRN', name:'155 Chem Clamp Stainless Steel 45lb (green handles)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, material:'Stainless Steel 300 Series',
    jaw_opening_in:'0-2.25', max_load_lbs:45,
    notes:'1.25" wide x 6" long, vinyl handles, 45# (green) holding force for tough corrosive applications' },
  // Quick-Grip Clamps (G2)
  { item_number:'QGCLAMP', name:'Quick-Grip Clamp Standard Nose',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97,
    jaw_opening_in:'.75-2.6', notes:'Chemically-resistant material, stainless steel spring, 5/8" wide nose' },
  { item_number:'QGCLAMP-NN', name:'Quick-Grip Clamp Needle Nose',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97,
    jaw_opening_in:'.75-2.6', notes:'Chemically-resistant material, 7/16" wide needle nose' },
  // Duraclamps (G2)
  { item_number:'DC318', name:'Duraclamp 1-1/4" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.25',
    notes:'Chemically-resistant material, no alumina oxide tips' },
  { item_number:'DC318T', name:'Duraclamp 1-1/4" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.25' },
  { item_number:'DC318-2T', name:'Duraclamp 1-1/4" with Alumina Oxide Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.25' },
  { item_number:'DC318SC', name:'Duraclamp Screw for DC318 (no tip)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC318TSC', name:'Duraclamp Screw with Tip for DC318T',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC390', name:'Duraclamp 1-1/2" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.5' },
  { item_number:'DC390T', name:'Duraclamp 1-1/2" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.5' },
  { item_number:'DC390-2T', name:'Duraclamp 1-1/2" with Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.5' },
  { item_number:'DC390SC', name:'Duraclamp Screw for DC390', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC390TSC', name:'Duraclamp Screw with Tip for DC390T', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC476', name:'Duraclamp 1-7/8" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.875' },
  { item_number:'DC476T', name:'Duraclamp 1-7/8" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.875' },
  { item_number:'DC476-2T', name:'Duraclamp 1-7/8" with Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-1.875' },
  { item_number:'DC476SC', name:'Duraclamp Screw for DC476', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC476TSC', name:'Duraclamp Screw with Tip for DC476T', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC508', name:'Duraclamp 2" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.0' },
  { item_number:'DC508T', name:'Duraclamp 2" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.0' },
  { item_number:'DC508-2T', name:'Duraclamp 2" with Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.0' },
  { item_number:'DC508SC', name:'Duraclamp Screw for DC508', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC508TSC', name:'Duraclamp Screw with Tip for DC508T', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC635', name:'Duraclamp 2-1/2" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.5' },
  { item_number:'DC635T', name:'Duraclamp 2-1/2" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.5' },
  { item_number:'DC635-2T', name:'Duraclamp 2-1/2" with Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-2.5' },
  { item_number:'DC635SC', name:'Duraclamp Screw for DC635', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC635TSC', name:'Duraclamp Screw with Tip for DC635T', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC1016', name:'Duraclamp 4" (no tips)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-4.0' },
  { item_number:'DC1016T', name:'Duraclamp 4" with Alumina Oxide Screw Tip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-4.0' },
  { item_number:'DC1016-2T', name:'Duraclamp 4" with Tips on Screw and Body',
    section:'Clamps', catalog_page_id:'G1', pdf_page:97, jaw_opening_in:'0-4.0' },
  { item_number:'DC1016SC', name:'Duraclamp Screw for DC1016', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  { item_number:'DC1016TSC', name:'Duraclamp Screw with Tip for DC1016T', section:'Clamps', catalog_page_id:'G1', pdf_page:97 },
  // Duralok Fastening Tools (G3)
  { item_number:'DCHT1', name:'Duralok Ratchet for tightening only',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98,
    notes:'Torque-limited tool for Duraclamp/Quick-Set Clamp screws' },
  { item_number:'DCHT2', name:'Duralok Tool for tightening/loosening',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  { item_number:'DCHT3', name:'Duralok Ratchet with slide collar (tighten/loosen)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  { item_number:'DCSK-318', name:'Duralok Socket for DC318 Duraclamp',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  { item_number:'DCSK-476', name:'Duralok Socket for DC476 Duraclamp',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  { item_number:'DCSK-MULTI', name:'Duralok Socket for DC390, DC508, DC635',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  { item_number:'DCSK-1016', name:'Duralok Socket for DC1016 Duraclamp',
    section:'Clamps', catalog_page_id:'G1', pdf_page:98 },
  // Quick-Set Clamp Components (G4)
  { item_number:'QSASM', name:'Quick-Set Clamp Assembly w/Aluminum Std Notch Clip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99,
    notes:'Includes 1 Cube, 1 Screw, 1 Std Notch Aluminum Clip. Use with 475 (3/4"x3/4") Spine' },
  { item_number:'QSASM-TI', name:'Quick-Set Clamp Assembly w/Titanium Clip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99, material:'Titanium' },
  { item_number:'QSASM-W', name:'Quick-Set Clamp Assembly w/Wide Notch Aluminum Clip',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLAMP', name:'Quick-Set Cube & Screw Only',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSSCRW', name:'Quick-Set Screw',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP', name:'Quick-Set Clip Aluminum 4" Legs',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99, material:'Aluminum' },
  { item_number:'QSCLIP-TI', name:'Quick-Set Clip Titanium 4" Legs',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99, material:'Titanium' },
  { item_number:'QSCLIP-D1', name:'Quick-Set Clip Aluminum 4" Legs Double Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP-D2', name:'Quick-Set Clip Aluminum 6" Legs Double Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP135', name:'Quick-Set Clip Aluminum 5-1/2" Legs',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP135W3', name:'Quick-Set Clip Aluminum 5-1/2" Legs 3" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP135-W', name:'Quick-Set Clip Aluminum 5-1/2" Legs 1-1/2" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP165', name:'Quick-Set Clip Aluminum 7" Legs',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP165-W', name:'Quick-Set Clip Aluminum 7" Legs 1-1/2" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP165-DW', name:'Quick-Set Clip Aluminum 7" Legs Double 1-1/2" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP-W', name:'Quick-Set Clip Aluminum 4" Legs 1-1/2" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP-DW', name:'Quick-Set Clip Aluminum 4" Legs Double 1-1/2" Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  { item_number:'QSCLIP-W2', name:'Quick-Set Clip Aluminum 4" Legs 2" Wide Notch',
    section:'Clamps', catalog_page_id:'G1', pdf_page:99 },
  // Q2 Clamps (G5)
  { item_number:'Q2ASM-ALBOLT', name:'Q2 All-Aluminum HD Clamp with 3/8-16 x 3/4" Aluminum Bolt',
    section:'Clamps', catalog_page_id:'G1', pdf_page:100, material:'6063 Aluminum',
    notes:'Fast way to rack large panels. Use with Model 475 (3/4" x 3/4") Spine' },
  { item_number:'Q2ASM-TIBOLT', name:'Q2 All-Aluminum HD Clamp with 3/8-16 x 3/4" Titanium Bolt',
    section:'Clamps', catalog_page_id:'G1', pdf_page:100, material:'6063 Aluminum' },
  { item_number:'Q2ASM-NOBOLT', name:'Q2 All-Aluminum HD Clamp Body Only (no bolt)',
    section:'Clamps', catalog_page_id:'G1', pdf_page:100, material:'6063 Aluminum' },
  // Hexies (G6)
  { item_number:'HEXFL50', name:'Hexie 50mm Polypropylene Hexagonal Float',
    section:'Clamps', catalog_page_id:'G1', pdf_page:101, material:'Polypropylene',
    quantity_note:'40 per sq ft / 400 per sq meter',
    notes:'Hexagonal float for anodizing tanks. Reduces evaporation 90%, heat loss 80%. Use up to 212°F. Resistant to all metal finishing chemicals except chromic acid.' },
  { item_number:'HEXFL100', name:'Hexie 100mm Polypropylene Hexagonal Float',
    section:'Clamps', catalog_page_id:'G1', pdf_page:101, material:'Polypropylene',
    quantity_note:'13 per sq ft / 130 per sq meter',
    notes:'Hexagonal float for anodizing tanks. Reduces evaporation 90%, heat loss 80%. Use up to 212°F.' }
];

// ── SECTION F: HARDWARE ───────────────────────────────────────────────────────
//
// PDF pages F2-F9 (PDF pages 88-95). Spines (plain/pierced/slotted, aluminum & titanium),
// cross members, mounting angles, hooks, contact bar, disc collars, fasteners.

// Spine hook variants: SP1=No Hook, SP2=Standard Hook, SP3=Hook with Twist
const SPINE_HOOK_LABELS = { SP1:'No Hook', SP2:'Standard Hook', SP3:'Hook with Twist' };

// Plain Aluminum Spines (F2-F3)
// Format: [model, length, SP1 item, SP2 item, SP3 item, cross-section description]
const PLAIN_SPINES = [
  ['474', 36, '953100', '953105', null, '.62" x .62" 6063 Aluminum'],
  ['474', 42, '953115', '953120', null, '.62" x .62" 6063 Aluminum'],
  ['474', 48, '953130', '953135', null, '.62" x .62" 6063 Aluminum'],
  ['474', 54, '953140', '953145', null, '.62" x .62" 6063 Aluminum'],
  ['475', 36, '953300', '953305', null, '.75" x .75" 6063 Aluminum'],
  ['475', 42, '953315', '953320', null, '.75" x .75" 6063 Aluminum'],
  ['475', 48, '953330', '953335', null, '.75" x .75" 6063 Aluminum'],
  ['475', 60, '953345', '953350', null, '.75" x .75" 6063 Aluminum'],
  ['475', 64, '953353', '953355', null, '.75" x .75" 6063 Aluminum'],
  ['478', 36, '950000', '950005', '950010', '.75" x .25" 6063 Aluminum'],
  ['478', 42, '950015', '950020', '950025', '.75" x .25" 6063 Aluminum'],
  ['478', 48, '950030', '950035', '950040', '.75" x .25" 6063 Aluminum'],
  ['478', 54, '950045', '950050', '950055', '.75" x .25" 6063 Aluminum'],
  ['478', 60, '950056', '950057', '950058', '.75" x .25" 6063 Aluminum'],
  ['485B', 36, '950750', '950755', '950760', '1" x .25" 6063 Aluminum'],
  ['485B', 42, '950765', '950770', '950775', '1" x .25" 6063 Aluminum'],
  ['485B', 48, '950780', '950785', '950790', '1" x .25" 6063 Aluminum'],
  ['485B', 54, '950795', '950800', '950805', '1" x .25" 6063 Aluminum'],
  ['485B', 60, '950810', '950812', '950813', '1" x .25" 6063 Aluminum'],
  ['485B', 63, '950815', '950817', '950816', '1" x .25" 6063 Aluminum'],
  ['486B', 36, '950900', '950905', '950910', '1" x .37" 6063 Aluminum'],
  ['486B', 42, '950915', '950920', '950925', '1" x .37" 6063 Aluminum'],
  ['486B', 48, '950930', '950935', '950940', '1" x .37" 6063 Aluminum'],
  ['486B', 54, '950945', '950950', '950955', '1" x .37" 6063 Aluminum'],
  ['486B', 60, '950956', '950957', '950958', '1" x .37" 6063 Aluminum'],
  ['486B', 63, '950959', '950960', '950961', '1" x .37" 6063 Aluminum'],
  ['488B', 36, '951200', '951205', '951210', '1.25" x .25" 6063 Aluminum'],
  ['488B', 42, '951215', '951220', '951225', '1.25" x .25" 6063 Aluminum'],
  ['488B', 48, '951230', '951235', '951240', '1.25" x .25" 6063 Aluminum'],
  ['488B', 54, '951245', '951250', '951255', '1.25" x .25" 6063 Aluminum'],
  ['490B', 36, '951500', '951505', '951510', '1.5" x .25" 6063 Aluminum'],
  ['490B', 42, '951515', '951520', '951525', '1.5" x .25" 6063 Aluminum'],
  ['490B', 48, '951530', '951535', '951540', '1.5" x .25" 6063 Aluminum'],
  ['490B', 54, '951545', '951550', '951555', '1.5" x .25" 6063 Aluminum'],
  ['490B', 63, '951560', '951562', '951565', '1.5" x .25" 6063 Aluminum']
];

// Pierced Aluminum Spines (F3-F4) — same format
const PIERCED_SPINES = [
  ['474A', 36, '953200', '953205', null, '.62" x .62" pierced both sides 6063 Aluminum'],
  ['474A', 42, '953215', '953220', null, '.62" x .62" pierced both sides 6063 Aluminum'],
  ['474A', 48, '953230', '953235', null, '.62" x .62" pierced both sides 6063 Aluminum'],
  ['474A1', 36, '953201', '953206', null, '.62" x .62" pierced one side 6063 Aluminum'],
  ['474A1', 42, '953216', '953221', null, '.62" x .62" pierced one side 6063 Aluminum'],
  ['474A1', 48, '953231', '953236', null, '.62" x .62" pierced one side 6063 Aluminum'],
  ['475A', 36, '953400', '953405', null, '.75" x .75" pierced both sides 6063 Aluminum'],
  ['475A', 42, '953415', '953420', null, '.75" x .75" pierced both sides 6063 Aluminum'],
  ['475A', 48, '953430', '953435', null, '.75" x .75" pierced both sides 6063 Aluminum'],
  ['475A', 54, '953445', '953450', null, '.75" x .75" pierced both sides 6063 Aluminum'],
  ['475A', 64, '953455', '953456', null, '.75" x .75" pierced both sides 6063 Aluminum'],
  ['475A1', 36, '953401', '953406', null, '.75" x .75" pierced one side 6063 Aluminum'],
  ['475A1', 42, '953418', '953421', null, '.75" x .75" pierced one side 6063 Aluminum'],
  ['475A1', 48, '953431', '953436', null, '.75" x .75" pierced one side 6063 Aluminum'],
  ['475A1', 54, '953448', '953451', null, '.75" x .75" pierced one side 6063 Aluminum'],
  ['475A1', 64, '953462', '953463', null, '.75" x .75" pierced one side 6063 Aluminum'],
  ['478A', 36, '950060', '950065', '950070', '.75" x .25" pierced 6063 Aluminum'],
  ['478A', 42, '950075', '950080', '950085', '.75" x .25" pierced 6063 Aluminum'],
  ['478A', 48, '950090', '950095', '950100', '.75" x .25" pierced 6063 Aluminum'],
  ['478A', 54, '950105', '950110', '950115', '.75" x .25" pierced 6063 Aluminum'],
  ['485A', 36, '950600', '950605', '950610', '1" x .25" pierced 6063 Aluminum'],
  ['485A', 42, '950615', '950620', '950625', '1" x .25" pierced 6063 Aluminum'],
  ['485A', 48, '950630', '950635', '950640', '1" x .25" pierced 6063 Aluminum'],
  ['485A', 54, '950645', '950650', '950655', '1" x .25" pierced 6063 Aluminum'],
  ['485A', 60, '950658', '950659', '950660', '1" x .25" pierced 6063 Aluminum'],
  ['485A', 63, '950665', '950669', '950670', '1" x .25" pierced 6063 Aluminum'],
  ['486A', 36, '949900', '949905', '949910', '1" x .37" pierced 6063 Aluminum'],
  ['486A', 42, '949915', '949920', '949925', '1" x .37" pierced 6063 Aluminum'],
  ['486A', 48, '949930', '949935', '949940', '1" x .37" pierced 6063 Aluminum'],
  ['486A', 54, '949945', '949950', '949955', '1" x .37" pierced 6063 Aluminum'],
  ['486A', 63, '949963', '949965', '949967', '1" x .37" pierced 6063 Aluminum'],
  ['488A', 36, '951050', '951055', '951060', '1.25" x .25" pierced 6063 Aluminum'],
  ['488A', 42, '951065', '951070', '951075', '1.25" x .25" pierced 6063 Aluminum'],
  ['488A', 48, '951080', '951085', '951090', '1.25" x .25" pierced 6063 Aluminum'],
  ['488A', 54, '951095', '951100', '951105', '1.25" x .25" pierced 6063 Aluminum'],
  ['488A', 60, '951110', '951112', '951113', '1.25" x .25" pierced 6063 Aluminum'],
  ['488A', 63, '951115', '951117', '951118', '1.25" x .25" pierced 6063 Aluminum'],
  ['490A', 36, '951450', '951452', '951455', '1.5" x .25" pierced 6063 Aluminum'],
  ['490A', 42, '951460', '951462', '951465', '1.5" x .25" pierced 6063 Aluminum'],
  ['490A', 48, '951470', '951472', '951475', '1.5" x .25" pierced 6063 Aluminum'],
  ['490A', 54, '951480', '951482', '951485', '1.5" x .25" pierced 6063 Aluminum'],
  ['490A', 63, '951490', '951492', '951495', '1.5" x .25" pierced 6063 Aluminum']
];

// Pierced Titanium Spines (F4) — no hooks pre-bent, single item per length
const TI_PIERCED_SPINES = [
  ['589', 24, '955260', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 26.5, '955266', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 30, '955280', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 36, '955300', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 42, '955320', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 48, '955340', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 54, '955360', '1.18" x .12" C.P. Titanium pierced spine'],
  ['589', 60, '955380', '1.18" x .12" C.P. Titanium pierced spine']
];

// Slotted Aluminum Spines (F5)
const SLOTTED_SPINES = [
  ['484', 36, '950300', '950305', '950310', '1" x .25" 6063 Aluminum, .26" x 3.5" slots .50" apart'],
  ['484', 42, '950315', '950320', '950325', '1" x .25" 6063 Aluminum'],
  ['484', 48, '950330', '950335', '950340', '1" x .25" 6063 Aluminum'],
  ['484', 54, '950345', '950350', '950355', '1" x .25" 6063 Aluminum'],
  ['484', 60, '950356', '950358', '950359', '1" x .25" 6063 Aluminum'],
  ['484', 63, '950361', '950362', '950363', '1" x .25" 6063 Aluminum'],
  ['486C', 36, '949800', '949805', '949810', '1" x .37" 6063 Aluminum slotted'],
  ['486C', 42, '949815', '949820', '949825', '1" x .37" 6063 Aluminum slotted'],
  ['486C', 48, '949830', '949835', '949840', '1" x .37" 6063 Aluminum slotted'],
  ['486C', 54, '949845', '949850', '949855', '1" x .37" 6063 Aluminum slotted'],
  ['486C', 60, '949857', '949858', '949859', '1" x .37" 6063 Aluminum slotted'],
  ['488C', 36, '951350', '951355', '951360', '1.25" x .25" 6063 Aluminum slotted'],
  ['488C', 42, '951365', '951370', '951375', '1.25" x .25" 6063 Aluminum slotted'],
  ['488C', 48, '951380', '951385', '951390', '1.25" x .25" 6063 Aluminum slotted'],
  ['488C', 54, '951395', '951400', '951405', '1.25" x .25" 6063 Aluminum slotted'],
  ['488C', 60, '951406', '951411', '951416', '1.25" x .25" 6063 Aluminum slotted'],
  ['490C', 36, '951650', '951655', '951660', '1.5" x .25" 6063 Aluminum slotted'],
  ['490C', 42, '951665', '951670', '951675', '1.5" x .25" 6063 Aluminum slotted'],
  ['490C', 48, '951680', '951685', '951690', '1.5" x .25" 6063 Aluminum slotted'],
  ['490C', 54, '951695', '951700', '951705', '1.5" x .25" 6063 Aluminum slotted'],
  ['490C', 60, '951706', '951707', '951708', '1.5" x .25" 6063 Aluminum slotted'],
  ['490C', 63, '951710', '951715', '951720', '1.5" x .25" 6063 Aluminum slotted']
];

// Slotted Titanium Spine 586 (F5)
const TI_SLOTTED_SPINES = [
  ['586', 24, '952280', '1" x .37" C.P. Titanium slotted (use with 485H/485HT Aluminum Hook)'],
  ['586', 30, '952290', '1" x .37" C.P. Titanium slotted'],
  ['586', 36, '952300', '1" x .37" C.P. Titanium slotted'],
  ['586', 42, '952320', '1" x .37" C.P. Titanium slotted'],
  ['586', 48, '952340', '1" x .37" C.P. Titanium slotted'],
  ['586', 54, '952350', '1" x .37" C.P. Titanium slotted'],
  ['586', 60, '952360', '1" x .37" C.P. Titanium slotted']
];

// Cross Members (F6)
const CROSS_MEMBERS = [
  // 485 Aluminum
  ['485', 12, '998040'], ['485', 15, '998039'], ['485', 18, '998041'],
  ['485', 21, '998043'], ['485', 24, '998042'], ['485', 26, '998044'],
  ['485', 28, '998048'], ['485', 30, '998051'], ['485', 34, '998049'],
  ['485', 36, '998047'], ['485', 38, '998052'], ['485', 40, '998037'],
  ['485', 42, '998028'], ['485', 48, '998053'], ['485', 52, '998068'],
  ['485', 56, '998032'], ['485', 57, '998033'], ['485', 60, '998031']
];

// 485TI Titanium Cross Members
const TI_CROSS_MEMBERS = [
  [12,'998040T'],[15,'998039T'],[18,'998041T'],[21,'998043T'],
  [24,'998042T'],[26,'998044T'],[27,'998046T'],[28,'998048T'],
  [30,'998051T'],[34,'998049T'],[36,'998047T'],[38,'998052T'],
  [40,'998037T'],[42,'998028T'],[48,'998053T'],[52,'998068T']
];

// 485C Slotted Aluminum Cross Member
const SLOTTED_CROSS_MEMBERS = [
  [16.5,'998034C'],[24.5,'998042C'],[28.5,'998048C'],
  [36.5,'998047C'],[40.5,'998037C'],[48.5,'998053C']
];

// 176 Mounting Angle (F6-F7)
const MOUNTING_ANGLES_176 = [
  [12,15,'998050'], [18,21,'998055'], [24,27,'998060'],
  [30,33,'998063'], [36,39,'998065'], [48,51,'998067']
];

// 176C Slotted Mounting Angle for Clips (F7)
const MOUNTING_ANGLES_176C = [
  [12,15,'998050C'], [24,27,'998060C'], [30,33,'998063C'],
  [36,39,'998065C'], [48,51,'998067C']
];

// 177 Titanium Horizontal Mounting Bar (F7)
const TI_MOUNTING_BARS_177 = [
  [18,'954520'], [24,'954540'], [30,'954560'], [36,'954580']
];

// Hooks (F7) — 14" overall length, varies by hook style suffix N/H/HT
const HOOKS = [
  ['475N', '998240', 'No Bend hook for .75" x .75" spine'],
  ['475H', '998250', 'Standard Hook for .75" x .75" spine'],
  ['478N', '998074', 'No Bend hook for .25" x .75" spine'],
  ['478H', '998075', 'Standard Hook for .25" x .75" spine'],
  ['478HT', '998090', 'Hook with Twist for .25" x .75" spine'],
  ['485N', '998079', 'No Bend hook for .25" x 1" spine'],
  ['485H', '998080', 'Standard Hook for .25" x 1" spine'],
  ['485HT', '998095', 'Hook with Twist for .25" x 1" spine'],
  ['486N', '998120', 'No Bend hook for .375" x 1" spine'],
  ['486H', '998130', 'Standard Hook for .375" x 1" spine'],
  ['486HT', '998140', 'Hook with Twist for .375" x 1" spine'],
  ['488N', '998084', 'No Bend hook for .25" x 1.25" spine'],
  ['488H', '998085', 'Standard Hook for .25" x 1.25" spine'],
  ['488HT', '998100', 'Hook with Twist for .25" x 1.25" spine'],
  ['490N', '998115', 'No Bend hook for .25" x 1.5" spine'],
  ['490H', '998111', 'Standard Hook for .25" x 1.5" spine'],
  ['490HT', '998113', 'Hook with Twist for .25" x 1.5" spine']
];

// Aluminum Contact Bar (H-Rail) (F8)
const CONTACT_BARS = [
  ['HN12', 11.625], ['HN15', 14.625], ['HN18', 17.625], ['HN23', 22.625],
  ['HN24', 23.625], ['HN30', 29.625], ['HN38', 37.625], ['HN48', 47.625]
];

// Fasteners (F9)
const FASTENERS = [
  // 1/4-20 Hex Head Bolts: aluminum, case 5000, titanium variants
  ['999000', '1/4-20 Hex Head Bolt 1/2" Aluminum 6061-T6', '1/4-20 x 1/2"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999000CS', '1/4-20 Hex Head Bolt 1/2" Aluminum Case 5000', '1/4-20 x 1/2"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999060', '1/4-20 Hex Head Bolt 1/2" Titanium Gr 2', '1/4-20 x 1/2"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  ['999005', '1/4-20 Hex Head Bolt 3/4" Aluminum', '1/4-20 x 3/4"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999005CS', '1/4-20 Hex Head Bolt 3/4" Aluminum Case 5000', '1/4-20 x 3/4"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999065', '1/4-20 Hex Head Bolt 3/4" Titanium', '1/4-20 x 3/4"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  ['999010', '1/4-20 Hex Head Bolt 1" Aluminum', '1/4-20 x 1"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999010CS', '1/4-20 Hex Head Bolt 1" Aluminum Case 5000', '1/4-20 x 1"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999070', '1/4-20 Hex Head Bolt 1" Titanium', '1/4-20 x 1"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  ['999012', '1/4-20 Hex Head Bolt 1-1/4" Aluminum', '1/4-20 x 1-1/4"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999012CS', '1/4-20 Hex Head Bolt 1-1/4" Aluminum Case 5000', '1/4-20 x 1-1/4"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999075', '1/4-20 Hex Head Bolt 1-1/4" Titanium', '1/4-20 x 1-1/4"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  ['999015', '1/4-20 Hex Head Bolt 1-1/2" Aluminum', '1/4-20 x 1-1/2"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999015CS', '1/4-20 Hex Head Bolt 1-1/2" Aluminum Case 5000', '1/4-20 x 1-1/2"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999080', '1/4-20 Hex Head Bolt 1-1/2" Titanium', '1/4-20 x 1-1/2"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  ['999020', '1/4-20 Hex Head Bolt 2" Aluminum', '1/4-20 x 2"', 'Hex Head Bolt', '6061-T6 Aluminum'],
  ['999020CS', '1/4-20 Hex Head Bolt 2" Aluminum Case 5000', '1/4-20 x 2"', 'Hex Head Bolt', '6061-T6 Aluminum', 'Case of 5000'],
  ['999085', '1/4-20 Hex Head Bolt 2" Titanium', '1/4-20 x 2"', 'Hex Head Bolt', 'C.P. Grade 2 Titanium'],
  // Nuts
  ['999030', '1/4-20 Hex Head Nut Aluminum', '1/4-20', 'Hex Head Nut', '6061-T6 Aluminum'],
  ['999030CS', '1/4-20 Hex Head Nut Aluminum Case 5000', '1/4-20', 'Hex Head Nut', '6061-T6 Aluminum', 'Case of 5000'],
  ['999090', '1/4-20 Hex Head Nut Titanium', '1/4-20', 'Hex Head Nut', 'C.P. Titanium'],
  // Tapered Hex Head Nut
  ['999030TP', '1/4-20 Tapered Hex Head Nut Aluminum', '1/4-20', 'Tapered Hex Head Nut', '6061-T6 Aluminum'],
  // Flat Washers
  ['999055', 'Flat Washer 5/8" Aluminum', '1/4-20 hole, 5/8" OD', 'Flat Washer', '6061-T6 Aluminum'],
  ['999055CS', 'Flat Washer 5/8" Aluminum Case 10000', '1/4-20 hole, 5/8" OD', 'Flat Washer', '6061-T6 Aluminum', 'Case of 10000'],
  ['999095', 'Flat Washer 5/8" Titanium', '1/4-20 hole, 5/8" OD', 'Flat Washer', 'C.P. Titanium'],
  ['999057', 'Flat Washer 1" Aluminum', '1/4-20 hole, 1" OD', 'Flat Washer', '6061-T6 Aluminum'],
  ['999057CS', 'Flat Washer 1" Aluminum Case 10000', '1/4-20 hole, 1" OD', 'Flat Washer', '6061-T6 Aluminum', 'Case of 10000'],
  ['999257', 'Flat Washer 1" Titanium', '1/4-20 hole, 1" OD', 'Flat Washer', 'C.P. Titanium'],
  // Conical Washers
  ['999055CW', 'Conical Washer 5/8" Aluminum', '1/4-20 hole, 5/8" OD', 'Conical Washer', '6061-T6 Aluminum'],
  ['999095CW', 'Conical Washer 5/8" Titanium', '1/4-20 hole, 5/8" OD', 'Conical Washer', 'C.P. Titanium'],
  ['999057CW', 'Conical Washer 1" Aluminum', '1/4-20 hole, 1" OD', 'Conical Washer', '6061-T6 Aluminum'],
  ['999257CW', 'Conical Washer 1" Titanium', '1/4-20 hole, 1" OD', 'Conical Washer', 'C.P. Titanium'],
  // Solid Rivets
  ['999050', 'Solid Rivet 1/4" x 3/4" 1100F Aluminum', '1/4" x 3/4"', 'Solid Rivet', '1100F Aluminum'],
  ['999050CS', 'Solid Rivet 1/4" x 3/4" Aluminum Case 5000', '1/4" x 3/4"', 'Solid Rivet', '1100F Aluminum', 'Case of 5000 (~29 lbs)'],
  ['999040', 'Solid Rivet 3/16" x 3/4" 1100F Aluminum', '3/16" x 3/4"', 'Solid Rivet', '1100F Aluminum'],
  ['999040CS', 'Solid Rivet 3/16" x 3/4" Aluminum Case 5000', '3/16" x 3/4"', 'Solid Rivet', '1100F Aluminum', 'Case of 5000 (~13 lbs)'],
  ['999045', 'Solid Rivet 3/16" x 1" 1100F Aluminum', '3/16" x 1"', 'Solid Rivet', '1100F Aluminum'],
  ['999045CS', 'Solid Rivet 3/16" x 1" Aluminum Case 5000', '3/16" x 1"', 'Solid Rivet', '1100F Aluminum', 'Case of 5000 (~17 lbs)']
];

function buildSpineRow(arr, type) {
  const [model, length, sp1, sp2, sp3, crossSection] = arr;
  const rows = [];
  if (sp1) rows.push({
    item_number: sp1,
    name: `${model} ${type} Spine ${length}" No Hook`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 88,
    length_in: length, cross_section: crossSection,
    material: '6063 Aluminum', hook_type: 'No Hook',
    notes: `${type} spine for racks/discs`
  });
  if (sp2) rows.push({
    item_number: sp2,
    name: `${model} ${type} Spine ${length}" Standard Hook`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 88,
    length_in: length, cross_section: crossSection,
    material: '6063 Aluminum', hook_type: 'Standard Hook'
  });
  if (sp3) rows.push({
    item_number: sp3,
    name: `${model} ${type} Spine ${length}" Hook with Twist`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 88,
    length_in: length, cross_section: crossSection,
    material: '6063 Aluminum', hook_type: 'Hook with Twist'
  });
  return rows;
}

function buildTiSpineRow(arr, type) {
  const [model, length, item, crossSection] = arr;
  return {
    item_number: item,
    name: `${model} ${type} Titanium Spine ${length}"`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 88,
    length_in: length, cross_section: crossSection,
    material: 'C.P. Titanium',
    notes: 'Supplied without hook - use aluminum 485H/485HT Hook'
  };
}

// ── SECTION E: CLIPS ──────────────────────────────────────────────────────────
//
// PDF pages E4-E32 (PDF pages 58-86). Each clip family has multiple hole-style
// variants (CL2/CL3/CL5 most common). Format below:
//   { model, description, pageId, pdfPage, items: { CL2: [.063, .080], CL3:[...], ... } }

const CLIP_FAMILIES = [
  // ── 30 Series Notched Clips (E4-E6 / PDF 58-60) ─────────────────────────────
  { model:'30', description:'Notched Clip 6" x 1" with .12" wide notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800350','800360'], CL5:['800355','800365'] } },
  { model:'30A', description:'Notched Clip 2.5" x 1" formed with .12" wide notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800525','800535'], CL5:['800530','800540'] } },
  { model:'30AM', description:'Notched Clip 2.5" x 1" formed mirror with .25" wide notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800531','800541'], CL5:['800533','800543'] } },
  { model:'30AMW', description:'Notched Clip 2.5" x 1" formed mirror wide .50" notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800532','800542'], CL5:['800534','800545'] } },
  { model:'30B', description:'Notched Clip 6" x 1" formed with .12" wide notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800595','800605'], CL5:['800600','800610'] } },
  { model:'30BM', description:'Notched Clip 6" x 1" formed mirror .25" notches',
    pageId:'E1', pdfPage:58,
    items:{ CL3:['800596','800606'], CL5:['800601','800611'] } },
  { model:'30BMW', description:'Notched Clip 6" x 1" formed wide .50" notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800596W','800606W'], CL5:['800601W','800611W'] } },
  { model:'30C', description:'Notched Clip 2.5" x 1" formed with .12" notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800770','800780'], CL5:['800775','800785'] } },
  { model:'30CM', description:'Notched Clip 2.5" x 1" formed with .25" notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800771','800781'], CL5:['800776','800786'] } },
  { model:'30CMW', description:'Notched Clip 2.5" x 1" formed wide .50" notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800772','800782'], CL5:['800777','800787'] } },
  { model:'30M', description:'Notched Clip 2.5" x 1" formed with .25" wide notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800356','800367'], CL5:['800358','800369'] } },
  { model:'30MW', description:'Notched Clip 2.5" x 1" formed wide .50" notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800356W','800367W'], CL5:['800358W','800369W'] } },
  { model:'30R', description:'Notched Clip Reversed 2.5" x 1" with .12" wide notches',
    pageId:'E1', pdfPage:59,
    items:{ CL3:['800700','800710'], CL5:['800705','800715'] } },
  { model:'30RM', description:'Notched Clip Reversed mirror .25" notches',
    pageId:'E1', pdfPage:60,
    items:{ CL3:['800706','800717'], CL5:['800709','800719'] } },
  { model:'30RMW', description:'Notched Clip Reversed wide .50" notches',
    pageId:'E1', pdfPage:60,
    items:{ CL3:['800706W','800717W'], CL5:['800709W','800719W'] } },

  // ── 33 Series V-Notched Flat Clips (E6-E7 / PDF 60-61) ──────────────────────
  { model:'33A', description:'V-Notched Flat Clip 9" x 1", .06" tips, 35° notches',
    pageId:'E1', pdfPage:60,
    items:{ CL2:['800875','800890'], CL3:['800880','800895'], CL5:['800885','800900'] } },
  { model:'33B', description:'V-Notched Flat Clip 9" x 1.5", .06" tips, 35° notches',
    pageId:'E1', pdfPage:60,
    items:{ CL2:['801085','801100'], CL3:['801090','801105'], CL5:['801095','801110'] } },
  { model:'33C', description:'V-Notched Flat Clip 9" x 2", .06" tips, 35° notches',
    pageId:'E1', pdfPage:60,
    items:{ CL2:['801295','801310'], CL3:['801300','801315'], CL5:['801305','801320'] } },
  { model:'33D', description:'V-Notched Flat Clip 9" x .75", .06" tips, 35° notches',
    pageId:'E1', pdfPage:60,
    items:{ CL2:['801505','801520'], CL3:['801510','801525'], CL5:['801515','801530'] } },
  { model:'33E', description:'V-Notched Flat Clip 9" x .50", sharp tips, 90° notches',
    pageId:'E1', pdfPage:60,
    items:{ CL2:['801815','801825'], CL3:['801820','801830'] } },
  { model:'33EF', description:'V-Notched Formed Clip 4" x 1.5", sharp tips, 90° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL3:['801820F','801830F'] } },
  { model:'33F', description:'V-Notched Flat Clip 8" x 2", sharp tips, 90° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL2:['801990','802005'], CL3:['801995','802010'], CL5:['802000','802015'] } },
  { model:'33G', description:'V-Notched Flat Clip 9" x .875", .06" tips, 35° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL2:['802100','802115'], CL3:['802105','802120'], CL5:['802110','802125'] } },
  { model:'33H', description:'V-Notched Flat Clip 6" x .75", .06" tips, 35° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL2:['802127','802130'], CL3:['802128','802135'], CL5:['802129','802140'] } },
  { model:'33J', description:'V-Notched Flat Clip 7" x 1", .06" tips, 35° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL2:['802145','802160'], CL3:['802150','802165'], CL5:['802155','802170'] } },
  { model:'33K', description:'V-Notched Flat Clip 8" x 1.5", sharp tips, 90° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL3:['802175','802185'], CL5:['802180','802190'] } },

  // ── 35 Series V-Notched Formed Clips (E7-E9 / PDF 61-63) ────────────────────
  { model:'35', description:'V-Notched Formed Clip 4" x 1", .06" tips, 35° notches',
    pageId:'E1', pdfPage:61,
    items:{ CL3:['802725','802735'], CL5:['802730','802740'] } },
  { model:'35A', description:'V-Notched Formed Clip 4" x 1" with 1.5" extension',
    pageId:'E1', pdfPage:61,
    items:{ CL3:['802900','802910'], CL5:['802905','802915'] } },
  { model:'35AP', description:'V-Notched Formed Clip 3.875" x 1", .06" tips, 35° notches',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803005','803015'], CL5:['803010','803020'] } },
  { model:'35B', description:'V-Notched Formed Clip 4" x 1" with 1.5" depth',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803075','803085'], CL5:['803080','803090'] } },
  { model:'35BAP', description:'V-Notched Formed Clip 3.875" x 1" with 1.5" depth',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803091','803093'], CL5:['803092','803094'] } },
  { model:'35BM', description:'V-Notched Formed Clip 3.875" x 1" with 1.5" depth mirror',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803095','803115'], CL5:['803105','803125'] } },
  { model:'35BMCHT', description:'V-Notched Formed Clip 3.75" x 1.5" with 90° notch bend',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803190','803194'], CL5:['803192','803196'] },
    extraThickness:{ CL3:'803198', CL5:'803200' }, extraThicknessVal:0.125 },
  { model:'35BMR', description:'V-Notched Formed Clip 3.87" x 1" with .87" lower depth',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803100','803120'], CL5:['803110','803130'] } },
  { model:'35BTO', description:'V-Notched Formed Clip 4" x 1" with 2" depth',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803075M','803085M'], CL5:['803080M','803090M'] } },
  { model:'35BTOM', description:'V-Notched Formed Clip 3.875" x 1" with 2" mirror depth',
    pageId:'E1', pdfPage:62,
    items:{ CL3:['803096','803116'], CL5:['803106','803126'] } },
  { model:'35BTOMR', description:'V-Notched Formed Clip 3.87" x 1" with 2" depth mirror reversed',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['803097','803117'], CL5:['803107','803127'] } },
  { model:'35M', description:'V-Notched Formed Clip 3.87" x 1" mirror 2" extension',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802726','802736'], CL5:['802731','802741'] } },
  { model:'35MR', description:'V-Notched Formed Clip 3.87" x 1" mirror reversed .75" extension',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802727','802737'], CL5:['802732','802742'] } },
  { model:'35S', description:'V-Notched Formed Clip 2.5" x 1" with 1.25" depth',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802724','802734'], CL5:['802729','802739'] } },
  { model:'35SM', description:'V-Notched Formed Clip 2.37" x 1" mirror, 1.75" depth',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802724M','802734M'], CL5:['802729M','802739M'] } },
  { model:'35SX', description:'V-Notched Formed Clip 2.5" x 1" with 1.50" depth wide',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802630','802640'], CL5:['802635','802645'] } },
  { model:'35SXM', description:'V-Notched Formed Clip 2.37" x 1" mirror 1.50" depth wide',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802655','802665'], CL5:['802660','802670'] } },
  { model:'35SXMR', description:'V-Notched Formed Clip 2.37" x 1" mirror reversed 1.50" depth',
    pageId:'E1', pdfPage:63,
    items:{ CL3:['802680','802690'], CL5:['802685','802695'] } },

  // ── 39, 45, 46 V-Notched Formed Clips (E10-E11 / PDF 64-65) ────────────────
  { model:'39', description:'V-Notched Formed Clip 4" x 1" with .62" lower lip',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815050','815070'], CL5:['815055','815075'] } },
  { model:'39M', description:'V-Notched Formed Clip 3.87" x 1" with 2" depth (.31" tip bend)',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815200','815220'], CL5:['815205','815225'] } },
  { model:'39M5', description:'V-Notched Formed Clip 3.87" x 1" with 2" depth (.50" tip bend)',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815201','815221'], CL5:['815206','815226'] } },
  { model:'39MR', description:'V-Notched Formed Clip 3.87" x 1" with .75" depth (.31" tip bend)',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815100','815120'], CL5:['815105','815125'] } },
  { model:'39MR5', description:'V-Notched Formed Clip 3.87" x 1" with .75" depth (.50" tip bend)',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815101','815121'], CL5:['815106','815126'] } },
  { model:'39SM', description:'V-Notched Formed Clip 2.87" x 1" with 2" depth mirror',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['815230','815240'], CL5:['815235','815245'] } },
  { model:'45', description:'V-Notched Formed Clip 4" x 1", sharp tips, 90° notches',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['814050','814070'], CL5:['814055','814075'] } },
  { model:'45M', description:'V-Notched Formed Clip 3.75" x 1" mirror 2.37" depth, sharp tips 90°',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['814200','814220'], CL5:['814205','814225'] } },
  { model:'45MCHT', description:'V-Notched Formed Clip 3.75" x 1" with 1" wide notch 90°',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['814600','814620'], CL5:['814680','814700'] },
    extraThickness:{ CL3:'814640', CL5:'814720' }, extraThicknessVal:0.125 },
  { model:'45MCHTL', description:'V-Notched Formed Clip 3.75" x 1" with .25" wide notch 90°',
    pageId:'E1', pdfPage:64,
    items:{ CL3:['814600L','814620L'], CL5:['814680L','814700L'] },
    extraThickness:{ CL3:'814640L', CL5:'814720L' }, extraThicknessVal:0.125 },
  { model:'45MCHTS', description:'V-Notched Formed Clip 3.125" x 1" with 90° notch near 90° bend each end',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['814600S','814620S'], CL5:['814680S','814700S'] },
    extraThickness:{ CL3:'814640S', CL5:'814720S' }, extraThicknessVal:0.125 },
  { model:'45MR', description:'V-Notched Formed Clip 3.75" x 1" mirror reversed 1.25" depth',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['814100','814120'], CL5:['814105','814125'] } },
  { model:'46', description:'V-Notched Formed Clip 4" x 1" with 1.5" depth, sharp tips 90°',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['816050','816070'], CL5:['816055','816075'] } },
  { model:'46M', description:'V-Notched Formed Clip 3.75" x 1" mirror 2.37" depth, sharp tips 90°',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['816200','816220'], CL5:['816205','816225'] } },
  { model:'46MR', description:'V-Notched Formed Clip 3.75" x 1" mirror reversed 1.25" depth, sharp tips 90°',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['816100','816120'], CL5:['816105','816125'] } },
  { model:'46SM', description:'V-Notched Formed Clip 2.37" x 1" symmetric 2.37" depth, sharp tips 90°',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['816300','816320'], CL5:['816305','816325'] } },

  // ── 90, 97 V-Notched Clips (E11-E13 / PDF 65-67) ────────────────────────────
  { model:'90', description:'V-Notched Flat Clip 7" x .625", .06" tips, 30° notches',
    pageId:'E1', pdfPage:65,
    items:{ CL2:['803740','803755'], CL3:['803745','803760'], CL5:['803750','803765'] } },
  { model:'97', description:'V-Notched Formed Clip 4" x 1" with 2.75" depth, .06" tips 35°',
    pageId:'E1', pdfPage:65,
    items:{ CL3:['805000','805010'], CL5:['805005','805015'] } },
  { model:'97-2', description:'V-Notched Formed Clip 4.25" x 1" with 3.75" depth, .06" tips 35°',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805001','805011'], CL5:['805006','805016'] } },
  { model:'97-6', description:'V-Notched Formed Clip 6.62" x 1" with 2.8" depth, .06" tips 35°',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805021','805031'], CL5:['805026','805036'] } },
  { model:'97B', description:'V-Notched Formed Clip 4" x 1" with 1.5" angle and 2.75" depth',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805175','805185'], CL5:['805180','805190'] } },
  { model:'97BM', description:'V-Notched Formed Clip 4.12" x 1" with 1.5" angle and 3.75" depth',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805175M','805185M'], CL5:['805180M','805190M'] } },
  { model:'97BMR', description:'V-Notched Formed Clip 4.125" x 1" with 1.5" angle and 2.25" depth',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805175MR','805185MR'], CL5:['805180MR','805190MR'] } },
  { model:'97B-2', description:'V-Notched Formed Clip 4.25" x 1" with 1.5" angle and 3.75" depth',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805176','805186'], CL5:['805181','805191'] } },
  { model:'97B-2M', description:'V-Notched Formed Clip 3.62" x 1" with 1.5" angle and 4.5" depth',
    pageId:'E1', pdfPage:66,
    items:{ CL3:['805176M','805186M'], CL5:['805181M','805191M'] } },
  { model:'97B-2M1', description:'V-Notched Formed Clip 2.75" x 1.5" with .87" small lip',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805176M1','805186M1'], CL5:['805181M1','805191M1'] } },
  { model:'97B-2MR', description:'V-Notched Formed Clip 3.5" x 1" with 1.5" angle and 3.75" depth',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805176MR','805186MR'], CL5:['805181MR','805191MR'] } },
  { model:'97B-2MR1', description:'V-Notched Formed Clip 2.12" x 1.5" with .87" small lip',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805176MR1','805186MR1'], CL5:['805181MR1','805191MR1'] } },
  { model:'97B-6', description:'V-Notched Formed Clip 6.62" x 1.50" with 2.8" depth',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805194','805196'], CL5:['805195','805197'] } },

  // ── 121, 125, 130 V-Notched Clips (E13-E15 / PDF 67-69) ─────────────────────
  { model:'121', description:'V-Notched Flat Clip 6" x .75" with .12" wide notches',
    pageId:'E1', pdfPage:67,
    items:{ CL2:['805770','805785'], CL3:['805775','805790'], CL5:['805780','805795'] } },
  { model:'121A', description:'V-Notched Flat Clip 5.25" x .75" with .12" wide notches',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805775A','805790A'], CL5:['805780A','805795A'] } },
  { model:'121M', description:'V-Notched Formed Clip 3.12" x 1" with 2" depth',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805775M','805790M'], CL5:['805780M','805795M'] } },
  { model:'121MR', description:'V-Notched Formed Clip 2.37" x 1" with 1" lip',
    pageId:'E1', pdfPage:67,
    items:{ CL3:['805775MR','805790MR'], CL5:['805780MR','805795MR'] } },
  { model:'121XL', description:'V-Notched Flat Clip 9" x .75" with .12" wide notches',
    pageId:'E1', pdfPage:68,
    items:{ CL2:['805800','805815'], CL3:['805805','805820'], CL5:['805810','805825'] } },
  { model:'125', description:'V-Notched Flat Clip 6" x .25", .06" tips, 60° notches',
    pageId:'E1', pdfPage:68,
    items:{ CL3:['806405','806420'] } },
  { model:'125-02', description:'V-Notched Formed Clip 3" x .25" with 2.12" depth',
    pageId:'E1', pdfPage:68,
    items:{ CL3:['806435','806450'] } },
  { model:'130', description:'V-Notched Flat Clip 6" x 1.50", .18" tips, 35° notches',
    pageId:'E1', pdfPage:68,
    items:{ CL4:['806650','806660'], CL6:['806655','806665'] } },
  { model:'130A', description:'V-Notched Formed Clip 4" x 1.50" with 2" depth, 95° angle',
    pageId:'E1', pdfPage:68,
    items:{ CL4:['806820','806830'], CL6:['806825','806835'] } },
  { model:'130AP', description:'V-Notched Formed Clip 3.87" x 1.50" with .50" lower lip',
    pageId:'E1', pdfPage:68,
    items:{ CL4:['806837','806840'], CL6:['806839','806842'] } },
  { model:'130B', description:'V-Notched Formed Clip 3.50" x 1.50" with .50" lip, 135° angle',
    pageId:'E1', pdfPage:68,
    items:{ CL4:['806995','807005'], CL6:['807000','807010'] },
    extraThickness:{ CL10:'807012' }, extraThicknessVal:0.080, extraHoleStyle:'CL10' },
  { model:'130C', description:'V-Notched Formed Clip 3.50" x 1.50" with .50" lip, 135° angle reversed',
    pageId:'E1', pdfPage:69,
    items:{ CL4:['807170','807180'], CL6:['807175','807185'] } },

  // ── 159C, 164 V-Notched Clips (E15 / PDF 69) ────────────────────────────────
  { model:'159C', description:'V-Notched Flat Clip 7" x .62" with .18" wide notches',
    pageId:'E1', pdfPage:69,
    items:{ CL2:['807480','807500'], CL3:['807485','807505'], CL5:['807490','807510'] } },
  { model:'164', description:'V-Notched Flat Clip 6" x .62", sharp tips, 90° notches',
    pageId:'E1', pdfPage:69,
    items:{ CL2:['807975','807990'], CL3:['807980','807995'], CL5:['807985','808000'] } },
  { model:'164A', description:'V-Notched Flat Clip with tips bent 5.87" x .62"',
    pageId:'E1', pdfPage:69,
    items:{ CL3:['808100','808110'], CL5:['808105','808115'] } },
  { model:'164M', description:'V-Notched Formed Clip 3.12" x 1" with 2" depth, sharp 90°',
    pageId:'E1', pdfPage:69,
    items:{ CL3:['808005','808015'], CL5:['808010','808020'] } },
  { model:'164MR', description:'V-Notched Formed Clip 2.37" x 1" mirror reversed, sharp 90°',
    pageId:'E1', pdfPage:69,
    items:{ CL3:['808050','808060'], CL5:['808055','808065'] } },
  { model:'164X', description:'V-Notched Formed Clip 5" x .62" with 2.5" depth, sharp 90°',
    pageId:'E1', pdfPage:69,
    items:{ CL3:['808075','808090'], CL5:['808080','808095'] } },

  // ── 501, 504, 506, 508A V-Notched Clips (E15-E17 / PDF 69-71) ───────────────
  { model:'501', description:'V-Notched Flat Clip 6" x .37", .06" tips, 40° notches',
    pageId:'E1', pdfPage:69,
    items:{ CL2:['812705','812715'], CL3:['812710','812720'], CL5:['812712','812722'] } },
  { model:'501EL', description:'V-Notched Formed Clip 2.37" x 1" with .87" depth, 40° notches',
    pageId:'E1', pdfPage:70,
    items:{ CL2:['812724','812734'], CL3:['812729','812739'], CL5:['812731','812741'] } },
  { model:'501ELM', description:'V-Notched Formed Clip 2.25" x 1" mirror, 40° notches',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['812729M','812739M'], CL5:['812731M','812741M'] } },
  { model:'504', description:'V-Notched Flat Clip 6" x .87", .06" tips, 90° notches',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['813270','813285'], CL5:['813275','813290'] } },
  { model:'504A', description:'V-Notched Flat Clip with curve 4.87" x .87", .06" tips, 90°',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['813271','813286'], CL5:['813276','813291'] } },
  { model:'504M', description:'V-Notched Formed Clip 2.37" x 1" with .87" lip, sharp tips 90°',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['813400','813415'], CL5:['813405','813420'] } },
  { model:'504MR', description:'V-Notched Formed Clip 2.37" x 1" mirror reversed .87" lip, 90°',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['813500','813515'], CL5:['813505','813520'] } },
  { model:'506', description:'V-Notched Flat Clip 8" x .62", sharp tips, 90° notches',
    pageId:'E1', pdfPage:70,
    items:{ CL2:['813650','813665'], CL3:['813655','813670'], CL5:['813660','813675'] } },
  { model:'508A', description:'V-Notched Formed Clip 2.50" x 1.25" with 90° .56" wide notch',
    pageId:'E1', pdfPage:70,
    items:{ CL3:['813992','813996'], CL5:['813994','813998'] } },
  { model:'508AIH', description:'V-Notched Flat Clip 1.62" x 1", sharp tips, 90° notch',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['814000','814010'], CL5:['814005','814015'] } },

  // ── 97-2VP V-Notched/Pointed Hybrid (E17 / PDF 71) ──────────────────────────
  { model:'97-2VP', description:'V-Notched/Pointed Hybrid Clip 4.25" x 1" with 3.75" depth',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['805001VP','805011VP'], CL5:['805006VP','805016VP'] } },

  // ── 123BCN Series Channel Notched (E17 / PDF 71) ────────────────────────────
  { model:'123BCN', description:'Channel Notched Clip for 1" dia hole, 4" x 1.25" x 1"',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['806235CN','806250CN'], CL5:['806237CN','806252CN'] } },
  { model:'123BCNN', description:'Channel Notched Clip for .75" dia hole, 4" x 1.25" x 1"',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['806235CNN','806250CNN'], CL5:['806237CNN','806252CNN'] } },
  { model:'123BCNW', description:'Channel Notched Clip for 1.25" dia hole, 4" x 1.25" x 1"',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['806235CNW','806250CNW'], CL5:['806237CNW','806252CNW'] } },
  { model:'123BCXN', description:'Channel Notched Clip for .50" dia hole, 3" x 1.25" x 1"',
    pageId:'E1', pdfPage:71,
    items:{ CL3:['806235CXN','806250CXN'], CL5:['806237CXN','806252CXN'] } },

  // ── 159A, 159B Round Notched Clips (E17-E18 / PDF 71-72) ────────────────────
  { model:'159A', description:'Round Notched Flat Clip 7" x .62" with .12" dia notches',
    pageId:'E1', pdfPage:71,
    items:{ CL2:['807345','807360'], CL3:['807350','807365'], CL5:['807355','807370'] } },
  { model:'159B', description:'Round Notched Flat Clip 7" x .62" with .31" dia notches',
    pageId:'E1', pdfPage:72,
    items:{ CL2:['807450','807465'], CL3:['807455','807470'], CL5:['807460','807475'] } },

  // ── 120, 140, 162, 163, 167C, 168, 174, 502, 503 Pointed Clips (E18-E21) ────
  { model:'120', description:'Pointed Flat Clip 8" x .75", .06" tips',
    pageId:'E1', pdfPage:72,
    items:{ CL2:['805560','805575'], CL3:['805565','805580'], CL5:['805570','805585'] } },
  { model:'140', description:'Pointed Flat Clip 6" x 1.5", .12" tip',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807190','807194'], CL6:['807192','807196'] } },
  { model:'140A', description:'Pointed Formed Clip 4" x 1.50" with 2" depth, 95° angle',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807200','807204'], CL6:['807202','807206'] } },
  { model:'140AP', description:'Pointed Formed Clip 3.87" x 1.50" with .50" lip, 95° angle (.12" tip)',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807220','807240'], CL6:['807225','807245'] } },
  { model:'140APR', description:'Pointed Formed Clip 3.87" x 1.50" reversed (.12" tip)',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807220R','807240R'], CL6:['807225R','807245R'] } },
  { model:'140APN', description:'Pointed Formed Clip 3.87" x 1.50" (.06" tip)',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807220N','807240N'], CL6:['807225N','807245N'] } },
  { model:'140APNR', description:'Pointed Formed Clip 3.87" x 1.50" reversed (.06" tip)',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807220NR','807240NR'], CL6:['807225NR','807245NR'] } },
  { model:'140B', description:'Pointed Formed Clip 3.50" x 1.50" with .50" lip, 135° angle',
    pageId:'E1', pdfPage:72,
    items:{ CL4:['807260','807264'], CL6:['807262','807266'] } },
  { model:'140C', description:'Pointed Formed Clip 3.50" x 1.50" with .50" lip, 135° reversed',
    pageId:'E1', pdfPage:73,
    items:{ CL4:['807280','807284'], CL6:['807282','807286'] } },
  { model:'162', description:'Pointed Formed Clip 6" x .50" with 3.12" extension, .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL3:['807560','807575'] } },
  { model:'163', description:'Pointed Flat Clip 7" x .50", .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL2:['807765','807780'], CL3:['807770','807785'] } },
  { model:'163A', description:'Pointed Flat Clip 9" x 1", .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL2:['807771','807786'], CL3:['807772','807787'] } },
  { model:'163AL', description:'Pointed Flat Clip 9" x 1.5" Long, .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL3:['807773','807788'] } },
  { model:'163AXL', description:'Pointed Flat Clip 12" x 1.5" Extra Long, .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL3:['807774','807789'] } },
  { model:'167C', description:'Pointed Flat Clip 2.87" x .62", .06" tips',
    pageId:'E1', pdfPage:73,
    items:{ CL3:['808185','808190'] } },
  { model:'168', description:'Pointed Flat Clip 6" x .62", 44° points',
    pageId:'E1', pdfPage:73,
    items:{ CL3:['808200','808210'], CL5:['808205','808215'] } },
  { model:'168A', description:'Pointed Flat Clip 5.87" x .62" with .31" detail, 44° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808220','808230'], CL5:['808225','808235'] } },
  { model:'168M', description:'Pointed Formed Clip 3.50" x .62" with 2" depth, 44° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808240','808250'], CL5:['808245','808255'] } },
  { model:'168MR', description:'Pointed Formed Clip 2.25" x .62" mirror, 44° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808260','808270'], CL5:['808265','808275'] } },
  { model:'168U', description:'Pointed Formed Clip 2.5" x .62" with 1.3" lip, 44° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808300','808305'], CL5:['808302','808307'] } },
  { model:'168X', description:'Pointed Formed Clip 5" x .62" with 2.50" depth, 44° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808280','808290'], CL5:['808285','808295'] } },
  { model:'174', description:'Pointed Formed Clip 3.35" x 1" with 1" depth, 90° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808410','808425'], CL5:['808415','808427'] },
    extraThickness:{ CL3:'808430', CL5:'808431' }, extraThicknessVal:0.125 },
  { model:'174L', description:'Pointed Formed Clip 4" x 1" with 1" depth Long, 90° points',
    pageId:'E1', pdfPage:74,
    items:{ CL3:['808432','808435'], CL5:['808434','880437'] },
    extraThickness:{ CL3:'808440', CL5:'808441' }, extraThicknessVal:0.125 },
  { model:'502', description:'Pointed Flat Clip 7" x .37", sharp points',
    pageId:'E1', pdfPage:74,
    items:{ CL2:['812880','812890'], CL3:['812885','812895'], CL5:['812887','812897'] } },
  { model:'503', description:'Pointed Flat Clip 7" x .62", sharp points',
    pageId:'E1', pdfPage:75,
    items:{ CL2:['813055','813070'], CL3:['813060','813075'], CL5:['813065','813080'] } },

  // ── Tapered Clips: 93, 94, 95, 96, 126, 173 (E21-E24 / PDF 75-78) ───────────
  { model:'93', description:'Tapered Flat Clip 6" with .25" tip',
    pageId:'E1', pdfPage:75,
    items:{ CL3:['804375','804390'], CL5:['804376','804391'] } },
  { model:'93A', description:'Tapered Clip 5.87" x .25" with tips bent',
    pageId:'E1', pdfPage:75,
    items:{ CL3:['804405','804415'], CL5:['804410','804420'] } },
  { model:'93B', description:'Tapered Formed Clip 2.50" x .25" with .75" depth, 2.62" lip',
    pageId:'E1', pdfPage:75,
    items:{ CL3:['804465','804475'], CL5:['804470','804480'] } },
  { model:'93M', description:'Tapered Formed Clip 2.12" x .25" with 3.12" depth',
    pageId:'E1', pdfPage:75,
    items:{ CL3:['804425','804435'], CL5:['804430','804440'] } },
  { model:'93MR', description:'Tapered Formed Clip 2.37" x .25" mirror reversed 1" lip',
    pageId:'E1', pdfPage:75,
    items:{ CL3:['804445','804455'], CL5:['804450','804460'] } },
  { model:'94', description:'Tapered Flat Clip 6" with .06" tip',
    pageId:'E1', pdfPage:75,
    items:{ CL2:['804580','804595'], CL3:['804585','804600'], CL5:['804603','804605'] } },
  { model:'94A', description:'Tapered Flat Clip 5.87" with .06" tip and tips bent',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804610','804620'], CL5:['804615','804625'] } },
  { model:'94B', description:'Tapered Formed Clip 2.50" x .06" with .62" lip',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804626','804628'], CL5:['804627','804629'] } },
  { model:'94HY', description:'Tapered Formed Clip 2.75" with .06" tip, .62" lip',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804585HY','804600HY'], CL5:['804603HY','804605HY'] } },
  { model:'94M', description:'Tapered Formed Clip 2.12" x .06" with 3.12" depth',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804586','804601'], CL5:['804587','804604'] } },
  { model:'94MR', description:'Tapered Formed Clip 2.37" x .06" mirror reversed',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804588','804602'], CL5:['804589','804606'] } },
  { model:'95', description:'Tapered Flat Clip 6" with .12" tip',
    pageId:'E1', pdfPage:76,
    items:{ CL2:['804790','804805'], CL3:['804795','804810'], CL5:['804800','804815'] } },
  { model:'95A', description:'Tapered Flat Clip 5.87" with .12" tip',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804820','804830'], CL5:['804825','804835'] } },
  { model:'95B', description:'Tapered Formed Clip 2.50" x .12" with .62" lip',
    pageId:'E1', pdfPage:76,
    items:{ CL3:['804630','804640'], CL5:['804635','804645'] } },
  { model:'95HY', description:'Tapered Formed Clip 2.75" with .12" tip',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['804795HY','804810HY'], CL5:['804800HY','804815HY'] } },
  { model:'95M', description:'Tapered Formed Clip 2.12" x .12" with 3.12" depth',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['804798','804813'], CL5:['804799','804814'] } },
  { model:'95MR', description:'Tapered Formed Clip 2.37" x .12" mirror reversed',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['804796','804811'], CL5:['804797','804812'] } },
  { model:'96A', description:'Tapered Flat Clip 5" x .37" tip',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['804980','804985'], CL5:['804982','804984'] } },
  { model:'96B', description:'Tapered Flat Clip 5" x .62" tip',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['804987','804986'], CL5:['804988','804989'] } },
  { model:'126', description:'Tapered Flat Clip 6" with .18" tip',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['806615','806630'], CL5:['806620','806635'] } },
  { model:'126A', description:'Tapered Flat Clip 5.87" with .18" tip and tips bent',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['806600','806608'], CL5:['806604','806612'] } },
  { model:'126B', description:'Tapered Formed Clip 2.50" x .18" with .62" lip',
    pageId:'E1', pdfPage:77,
    items:{ CL3:['806578','806586'], CL5:['806582','806590'] } },
  { model:'126HY', description:'Tapered Formed Clip 2.75" with .18" tip',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['806615HY','806630HY'], CL5:['806620HY','806635HY'] } },
  { model:'126M', description:'Tapered Formed Clip 2.12" x .18" with 3.12" depth',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['806616','806617'], CL5:['806637','806640'] } },
  { model:'126MR', description:'Tapered Formed Clip 2.37" x .18" mirror reversed',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['806618','806619'], CL5:['806643','806645'] } },
  { model:'173', description:'Tapered Flat Clip with bent tips 5.62" x 1"',
    pageId:'E1', pdfPage:78,
    items:{ CL2:['808325','808340'], CL3:['808330','808345'], CL5:['808335','808350'] } },
  { model:'173A', description:'Tapered Formed Clip 2.75" x 1" with 1.87" lip, tips bent out',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['808460','808470'], CL5:['808465','808475'] } },

  // ── Square Clips: 29, 34, 86, 91, 122B, 123, 124, 507, 508 (E24-E27) ────────
  { model:'29', description:'Square Formed Clip 2.50" x 1" with 1.25" lip',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['800000','800010'], CL5:['800005','800015'] } },
  { model:'29B', description:'Square Formed Clip 2.5" x 1" with 1.50" lip',
    pageId:'E1', pdfPage:78,
    items:{ CL3:['800175','800185'], CL5:['800180','800190'] } },
  { model:'34A', description:'Square Formed Clip 3" x 1" with 2.50" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802200','802210'], CL5:['802205','802215'] } },
  { model:'34B', description:'Square Formed Clip 2.62" x 1" with 2.25" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802375','802385'], CL5:['802380','802390'] } },
  { model:'34BM', description:'Square Formed Clip 2" x 1" mirror 1.75" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802475','802485'], CL5:['802480','802490'] } },
  { model:'34C', description:'Square Formed Clip 2.75" x 1" with 2.25" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802500','802510'] } },
  { model:'34D', description:'Square Formed Clip 2.87" x 1" with 2.31" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802550','802560'], CL5:['802555','802565'] } },
  { model:'34D-4', description:'Square Formed Clip 3.75" x 1" with 3.62" depth',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802567','802570'], CL5:['802569','802575'] } },
  { model:'34D-4M', description:'Square Formed Clip 4.50" x 1" with 3.62" depth mirror',
    pageId:'E1', pdfPage:79,
    items:{ CL3:['802566','802571'], CL5:['802568','802572'] } },
  { model:'86', description:'Square Formed Clip 1.75" x 1" x 4" with .25" lip',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['803430','803445'], CL5:['803435','803450'] },
    extraThickness:{ CL3:'803485', CL5:'803490' }, extraThicknessVal:0.125 },
  { model:'86D', description:'Square Formed Clip 3" x 1" with .22" tips',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['819330','819345'], CL5:['819335','819350'] } },
  { model:'86DW2', description:'Square Formed Clip 4" x 1" x 2" with .21" detail',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['819430','819445'], CL5:['819435','819450'] } },
  { model:'91', description:'Square Flat Clip 7" x .62"',
    pageId:'E1', pdfPage:80,
    items:{ CL2:['803950','803965'], CL3:['803955','803970'], CL5:['803960','803975'] } },
  { model:'122B', description:'Square Formed Clip 2.50" x 1" with 1.5" lip',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['805895','805900'] } },
  { model:'122BM', description:'Square Formed Clip 2.37" x 1" mirror 1.75" lip',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['805905','805915'] } },
  { model:'123', description:'Square Formed Clip 4.75" x 1" with 4" depth',
    pageId:'E1', pdfPage:80,
    items:{ CL2:['805980','805995'], CL3:['805985','806000'], CL5:['805990','806005'] } },
  { model:'123B', description:'Square Formed Clip 4" x 1" x 1.50" with .75" lip',
    pageId:'E1', pdfPage:80,
    items:{ CL3:['806235','806250'], CL5:['806237','806252'] } },
  { model:'123BM', description:'Square Formed Clip 3.87" x 1" x 1.75" with .75" lip',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806260','806265'], CL5:['806262','806266'] } },
  { model:'123BWM', description:'Square Formed Clip 3.87" x 1" x 1.75" with double .75" lips',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806261','806268'], CL5:['806263','806269'] } },
  { model:'123BWMR', description:'Square Formed Clip 3.87" x 1" x .75" with double lips reversed',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806261R','806268R'], CL5:['806263R','806269R'] } },
  { model:'123BWMS', description:'Square Formed Clip 3" x 1" x 1.87" with .50" lip',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806270','806275'], CL5:['806272','806276'] } },
  { model:'124', description:'Square Formed Clip 2.5" x 1.43" x .75" x 1.87"',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806335','806345'], CL12:['806340','806350'] } },
  { model:'124H', description:'Square Formed Clip 2.25" x 1.87" x .50" x .75"',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['806355','806365'], CL12:['806360','806370'] } },
  { model:'507', description:'Square Flat Clip 3.5" x .87"',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['813865','813880'], CL5:['813875','813890'] } },
  { model:'508', description:'Square Formed Clip 2.5" x 1.25" with .87" lip, 38° angle',
    pageId:'E1', pdfPage:81,
    items:{ CL3:['813965','813980'], CL5:['813975','813990'] } },

  // ── Split Finger Clips (E29 / PDF 83) ───────────────────────────────────────
  { model:'87', description:'Split Finger Formed Square Clip 4" x 1" with 1.75" lip, .25" tips',
    pageId:'E1', pdfPage:83,
    items:{ CL3:['803492','803494'], CL5:['803493','803495'] } },
  { model:'89', description:'Split Finger Notched Flat Clip 7" x .62" with .12" slots',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['803530','803545'], CL3:['803535','803550'], CL5:['803540','803555'] } },
  { model:'89M', description:'Split Finger Notched Formed Clip 2.50" x 1" with 2.62" depth',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['803560','803575'], CL3:['803565','803580'], CL5:['803570','803585'] } },
  { model:'89MR', description:'Split Finger Notched Formed Clip 2.62" x 1" mirror reversed',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['803590','803605'], CL3:['803595','803610'], CL5:['803600','803615'] } },
  { model:'92', description:'Split Finger Square Flat Clip 7" x .62" with .12" slots, .25" tips',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['804160','804175'], CL3:['804165','804180'], CL5:['804170','804185'] } },
  { model:'92M', description:'Split Finger Square Formed Clip 2.62" x 1" with 2.50" depth',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['804220','804235'], CL3:['804225','804240'], CL5:['804230','804245'] } },
  { model:'92MR', description:'Split Finger Square Formed Clip 2.62" x 1" mirror reversed',
    pageId:'E1', pdfPage:83,
    items:{ CL2:['804190','804205'], CL3:['804195','804210'], CL5:['804200','804215'] } },
  { model:'123AM', description:'Split Finger Formed Clip 5.25" x 1" with 3.75" depth',
    pageId:'E1', pdfPage:83,
    items:{ CL3:['806160','806170'], CL5:['806165','806175'] } },

  // ── End Slot Clips (E30 / PDF 84) ───────────────────────────────────────────
  { model:'119', description:'End Slot Flat Clip 9" x 1" with .12" x .75" long slots',
    pageId:'E1', pdfPage:84,
    items:{ CL2:['805455','805470'], CL3:['805460','805475'], CL5:['805465','805480'] } },
  { model:'123A', description:'End Slot Formed Clip 4.75" x 1" x 4" x 1" with .125" x .75" slots',
    pageId:'E1', pdfPage:84,
    items:{ CL2:['806190','806205'], CL3:['806195','806210'], CL5:['806200','806215'] } }
];

// ── Square Clips by width (E28 / PDF 82) — large matrix ──────────────────────
// Each clip is "6x_", "7x_", "8x_", "9x_" with different heights and CL2/CL3/CL5 hole styles
const SQUARE_CLIPS_BY_WIDTH = [
  // 6" x H Square Clips
  ['6 x 3/8', 6, 0.375, { 'No Hole':['808535','808537'] }, 'E1', 82],
  ['6 x 1/2', 6, 0.50, { CL2:['808710','808720'], CL3:['808715','808725'] }, 'E1', 82],
  ['6 x 5/8', 6, 0.625, { CL2:['808730','808745'], CL3:['808735','808750'], CL5:['808740','808755'] }, 'E1', 82],
  ['6 x 3/4', 6, 0.75, { CL2:['808905','808920'], CL3:['808910','808925'], CL5:['808915','808930'] }, 'E1', 82],
  ['6 x 1', 6, 1.0, { CL2:['809115','809130'], CL3:['809120','809135'], CL5:['809125','809140'] }, 'E1', 82],
  ['6 x 1-1/2', 6, 1.5, { CL2:['809325','809340'], CL3:['809330','809345'], CL5:['809335','809350'] }, 'E1', 82],
  // 7" x H
  ['7 x 3/8', 7, 0.375, { 'No Hole':['809535','809545'] }, 'E1', 82],
  ['7 x 1/2', 7, 0.50, { CL2:['809710','809720'], CL3:['809715','809725'] }, 'E1', 82],
  ['7 x 5/8', 7, 0.625, { CL2:['809780','809795'], CL3:['809785','809800'], CL5:['809790','809805'] }, 'E1', 82],
  ['7 x 3/4', 7, 0.75, { CL2:['809885','809900'], CL3:['809890','809905'], CL5:['809895','809910'] }, 'E1', 82],
  ['7 x 1', 7, 1.0, { CL2:['810095','810110'], CL3:['810100','810115'], CL5:['810105','810120'] }, 'E1', 82],
  ['7 x 1-1/2', 7, 1.5, { CL2:['810305','810320'], CL3:['810310','810325'], CL5:['810315','810330'] }, 'E1', 82],
  // 8" x H
  ['8 x 3/8', 8, 0.375, { 'No Hole':['810515','810525'] }, 'E1', 82],
  ['8 x 1/2', 8, 0.50, { CL2:['810690','810700'], CL3:['810695','810705'] }, 'E1', 82],
  ['8 x 5/8', 8, 0.625, { CL2:['810785','810800'], CL3:['810790','810805'], CL5:['810795','810810'] }, 'E1', 82],
  ['8 x 3/4', 8, 0.75, { CL2:['810885','810900'], CL3:['810890','810905'], CL5:['810895','810910'] }, 'E1', 82],
  ['8 x 1', 8, 1.0, { CL2:['811095','811110'], CL3:['811100','811115'], CL5:['811105','811120'] }, 'E1', 82],
  ['8 x 1-1/2', 8, 1.5, { CL2:['811305','811320'], CL3:['811310','811325'], CL5:['811315','811330'] }, 'E1', 82],
  ['8 x 2', 8, 2.0, { CL3:['811405','811420'], CL5:['811410','811425'] }, 'E1', 82],
  // 9" x H
  ['9 x 3/8', 9, 0.375, { 'No Hole':['811515','811525'] }, 'E1', 82],
  ['9 x 1/2', 9, 0.50, { CL2:['811690','811700'], CL3:['811695','811705'] }, 'E1', 82],
  ['9 x 5/8', 9, 0.625, { CL2:['811765','811780'], CL3:['811770','811785'], CL5:['811775','811790'] }, 'E1', 82],
  ['9 x 3/4', 9, 0.75, { CL2:['811865','811880'], CL3:['811870','811885'], CL5:['811875','811890'] }, 'E1', 82],
  ['9 x 1', 9, 1.0, { CL2:['812075','812090'], CL3:['812080','812095'], CL5:['812085','812100'] }, 'E1', 82],
  ['9 x 1-1/2', 9, 1.5, { CL2:['812285','812300'], CL3:['812290','812305'], CL5:['812295','812310'] }, 'E1', 82],
  ['9 x 2', 9, 2.0, { CL2:['812495','812510'], CL3:['812500','812515'], CL5:['812505','812520'] }, 'E1', 82],
  ['9 x 2-1/2', 9, 2.5, { CL2:['812350','812365'], CL3:['812355','812370'], CL5:['812360','812375'] }, 'E1', 82],
  ['9 x 3', 9, 3.0, { CL2:['812380','812395'], CL3:['812385','812400'], CL5:['812390','812405'] }, 'E1', 82]
];

// ── Tube Clips (E31 / PDF 85) — single and double style + assemblies ─────────
// Format: [tubeID, item_063, item_080, style]
const TUBE_CLIPS = [
  // Single style
  [0.75, 'TCS0756', 'TCS0758', 'Single', 0.37],
  [1.00, 'TCS1006', 'TCS1008', 'Single', 0.50],
  [1.25, 'TCS1256', 'TCS1258', 'Single', 0.62],
  [1.50, 'TCS1506', 'TCS1508', 'Single', 0.75],
  [1.75, 'TCS1756', 'TCS1758', 'Single', 0.75],
  [2.00, 'TCS2006', 'TCS2008', 'Single', 1.00],
  // Double style
  [0.75, 'TCD0756', 'TCD0758', 'Double', 0.37],
  [1.00, 'TCD1006', 'TCD1008', 'Double', 0.50],
  [1.25, 'TCD1256', 'TCD1258', 'Double', 0.62],
  [1.50, 'TCD1506', 'TCD1508', 'Double', 0.75],
  [1.75, 'TCD1756', 'TCD1758', 'Double', 0.75],
  [2.00, 'TCD2006', 'TCD2008', 'Double', 1.00]
];

// Tube Clip Assemblies (36" and 48" spines)
const TUBE_CLIP_ASMS = [
  // 36" Spine
  [0.75, 32, 'TCA075636', 'TCA075836'],
  [1.00, 32, 'TCA100636', 'TCA100836'],
  [1.25, 24, 'TCA125636', 'TCA125836'],
  [1.50, 20, 'TCA150636', 'TCA150836'],
  [1.75, 20, 'TCA175636', 'TCA175836'],
  [2.00, 16, 'TCA200636', 'TCA200836'],
  // 48" Spine
  [0.75, 48, 'TCA075648', 'TCA075848'],
  [1.00, 48, 'TCA100648', 'TCA100848'],
  [1.25, 32, 'TCA125648', 'TCA125848'],
  [1.50, 30, 'TCA150648', 'TCA150848'],
  [1.75, 30, 'TCA175648', 'TCA175848'],
  [2.00, 22, 'TCA200648', 'TCA200848']
];

// A-Clips (E32 / PDF 86)
const A_CLIPS = [
  { item_number:'820010', name:'A-1 A-Clip Standard Notch 5" x 1" .50" deep mid-position',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125, notes:'For A-Clip Anodizing Rack System with Model 486B spine' },
  { item_number:'820010B', name:'A-1B A-Clip Standard Notch Tapped 1/4-20 mid-position',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125, notes:'Tapped threads for 1/4-20 x 1/2" bolt - racking on both sides' },
  { item_number:'820015', name:'A-1V A-Clip Shallow V-Notch 5" x 1" .50" deep mid',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820015B', name:'A-1VB A-Clip Shallow V-Notch Tapped mid',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820016', name:'A-1D A-Clip Both Style Notches mid',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125, notes:'Standard Notch + Shallow V-Notch on same clip' },
  { item_number:'820016B', name:'A-1DB A-Clip Both Style Notches Tapped mid',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820020', name:'A-1X A-Clip Standard Notch 5" x 1" top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820020B', name:'A-1XB A-Clip Standard Notch Tapped top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820030', name:'A-1XV A-Clip Shallow V-Notch top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820030B', name:'A-1XVB A-Clip Shallow V-Notch Tapped top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820031', name:'A-1XD A-Clip Both Style Notches top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 },
  { item_number:'820031B', name:'A-1XDB A-Clip Both Style Notches Tapped top/bottom',
    section:'Clips', catalog_page_id:'E1', pdf_page:86, material:'6061-T6 Aluminum',
    thickness_in:0.125 }
];

function expandClipFamily(family) {
  const rows = [];
  for (const holeStyle of Object.keys(family.items)) {
    const pair = family.items[holeStyle];
    THICKNESSES.forEach((thick, idx) => {
      const itemNum = pair[idx];
      if (!itemNum) return;
      rows.push({
        item_number: itemNum,
        name: `${family.model} ${family.description} ${holeStyle}, ${thick}" aluminum`,
        section: 'Clips',
        catalog_page_id: family.pageId,
        pdf_page: family.pdfPage,
        hole_style: holeStyle,
        thickness_in: thick,
        material: '6061-T6 Aluminum'
      });
    });
  }
  // Add extra thickness variant (e.g., .125" for some clips)
  if (family.extraThickness) {
    for (const holeStyle of Object.keys(family.extraThickness)) {
      const itemNum = family.extraThickness[holeStyle];
      rows.push({
        item_number: itemNum,
        name: `${family.model} ${family.description} ${holeStyle}, ${family.extraThicknessVal}" aluminum`,
        section: 'Clips',
        catalog_page_id: family.pageId,
        pdf_page: family.pdfPage,
        hole_style: holeStyle,
        thickness_in: family.extraThicknessVal,
        material: '6061-T6 Aluminum'
      });
    }
  }
  return rows;
}

function buildSquareClipsByWidth(rows) {
  const result = [];
  for (const [name, width, height, items, pageId, pdfPage] of rows) {
    for (const holeStyle of Object.keys(items)) {
      const pair = items[holeStyle];
      THICKNESSES.forEach((thick, idx) => {
        const itemNum = pair[idx];
        if (!itemNum) return;
        result.push({
          item_number: itemNum,
          name: `${name}" Square Flat Clip${holeStyle !== 'No Hole' ? ' ' + holeStyle : ' (no hole)'}, ${thick}" aluminum`,
          section: 'Clips', catalog_page_id: pageId, pdf_page: pdfPage,
          hole_style: holeStyle === 'No Hole' ? '' : holeStyle,
          thickness_in: thick, width_in: width, height_in: height,
          material: '6061-T6 Aluminum'
        });
      });
    }
  }
  return result;
}

function buildTubeClipRow(arr) {
  const [tubeID, item063, item080, style, stripWidth] = arr;
  return [
    { item_number: item063, name: `Tube Clip ${style} ${tubeID}" ID .063" aluminum`,
      section:'Clips', catalog_page_id:'E1', pdf_page:85, material:'6061-T6 Aluminum',
      thickness_in:0.063, width_in:stripWidth, notes:`${style}-sided tube clip for ${tubeID}" I.D. tubes` },
    { item_number: item080, name: `Tube Clip ${style} ${tubeID}" ID .080" aluminum`,
      section:'Clips', catalog_page_id:'E1', pdf_page:85, material:'6061-T6 Aluminum',
      thickness_in:0.080, width_in:stripWidth }
  ];
}

function buildTubeClipAsmRow(arr) {
  const [tubeID, numTubes, item063, item080] = arr;
  const lengthMatch = item063.match(/(\d+)$/);
  const spineLen = parseInt(lengthMatch[1].slice(-2));
  return [
    { item_number: item063, name: `Tube Clip Assembly ${tubeID}" ID Double-Style ${spineLen}" Spine .063" (${numTubes} tubes)`,
      section:'Clips', catalog_page_id:'E1', pdf_page:85, material:'6061-T6 Aluminum',
      thickness_in:0.063, length_in:spineLen,
      notes:`Tube Clip Assembly: ${numTubes} tubes on ${spineLen}" spine` },
    { item_number: item080, name: `Tube Clip Assembly ${tubeID}" ID Double-Style ${spineLen}" Spine .080" (${numTubes} tubes)`,
      section:'Clips', catalog_page_id:'E1', pdf_page:85, material:'6061-T6 Aluminum',
      thickness_in:0.080, length_in:spineLen }
  ];
}

// ── SECTION C: RACKS ──────────────────────────────────────────────────────────
//
// PDF pages C3-C33 (PDF pages 17-47). Most common rack families.
// Each entry has a [holeStyle, length, .063_item, .080_item] structure.
// Format: { model, description, pageId, pdfPage, items: [[hs, len, i063, i080], ...] }

const RACK_FAMILIES = [
  // ── 21 V-Notched Rack Series (C3 / PDF 17) ──────────────────────────────────
  { model:'21', description:'V-Notched Flat Rack 7" finger width, .06" tips, 28° notches',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'101600','101840'],['RK1',36,'101680','101920'],['RK1',48,'101760','102000'],
      ['RK3',24,'101640','101880'],['RK3',36,'101720','101960'],['RK3',48,'101800','102040']
    ]
  },
  { model:'21-09', description:'V-Notched Formed Rack 7" Form 09 (6.37" x .62")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'104800','104920'],['RK1',36,'104840','104960'],['RK1',48,'104880','105000'],
      ['RK3',24,'104820','104940'],['RK3',36,'104860','104980'],['RK3',48,'104900','105020']
    ]
  },
  { model:'21-025', description:'V-Notched Formed Rack 7" Form 025 (6.75" x .62")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'107200','107320'],['RK1',36,'107240','107360'],['RK1',48,'107280','107400'],
      ['RK3',24,'107220','107340'],['RK3',36,'107260','107380'],['RK3',48,'107300','107420']
    ]
  },
  { model:'21-030', description:'V-Notched Formed Rack 7" Form 030 (5.75" x .75")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'107500','107620'],['RK1',36,'107540','107660'],['RK1',48,'107580','107700'],
      ['RK3',24,'107520','107640'],['RK3',36,'107560','107680'],['RK3',48,'107600','107720']
    ]
  },

  // ── 25A V-Notched Series (C3-C4 / PDF 17-18) ────────────────────────────────
  { model:'25A', description:'V-Notched Flat Rack 6" finger width, .06" tips, 60° notches',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',12,'162300','162610'],['RK1',24,'162400','162640'],['RK1',36,'162480','162720'],['RK1',48,'162560','162800'],
      ['RK3',12,'162340','162630'],['RK3',24,'162440','162680'],['RK3',36,'162520','162760'],['RK3',48,'162600','162840']
    ]
  },
  { model:'25A-01', description:'V-Notched Formed Rack 6" Form 01 (3.5" x 4.5")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'165600','165720'],['RK1',36,'165640','165760'],['RK1',48,'165680','165800'],
      ['RK3',24,'165620','165740'],['RK3',36,'165660','165780'],['RK3',48,'165700','165820'],
      ['RK5',24,'165630','165745'],['RK5',36,'165665','165785'],['RK5',48,'165705','165825']
    ]
  },
  { model:'25A-02', description:'V-Notched Formed Rack 6" Form 02 (3.5" x 4")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'168000','168120'],['RK1',36,'168040','168160'],['RK1',48,'168080','168200'],
      ['RK3',24,'168020','168140'],['RK3',36,'168060','168180'],['RK3',48,'168100','168220'],
      ['RK5',24,'168025','168150'],['RK5',36,'168065','168190'],['RK5',48,'168105','168230']
    ]
  },
  { model:'25A-06', description:'V-Notched Formed Rack 6" Form 06 (5.75" x 1.5")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',24,'170400','170520'],['RK1',36,'170440','170560'],['RK1',48,'170480','170600'],
      ['RK3',24,'170420','170540'],['RK3',36,'170460','170580'],['RK3',48,'170500','170620']
    ]
  },
  { model:'25A-07', description:'V-Notched Formed Rack 6" Form 07 (5.87" x .50")',
    pageId:'C1', pdfPage:17,
    items:[
      ['RK1',12,'170940','171140'],['RK1',18,'170980','171180'],['RK1',24,'171020','171220'],['RK1',36,'171060','171260'],['RK1',48,'171100','171300'],
      ['RK3',12,'170960','171160'],['RK3',18,'171000','171200'],['RK3',24,'171040','171240'],['RK3',36,'171080','171280'],['RK3',48,'171120','171320']
    ]
  },

  // ── 28 V-Notched Series (C4 / PDF 18) ───────────────────────────────────────
  { model:'28', description:'V-Notched Flat Rack 7" finger width, sharp tips, 90° notches',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'507280','507520'],['RK1',36,'507360','507600'],['RK1',48,'507440','507680'],
      ['RK3',24,'507320','507560'],['RK3',36,'507400','507640'],['RK3',48,'507480','507720']
    ]
  },
  { model:'28-02', description:'V-Notched Formed Rack 7" Form 02 (4.37" x 4.5")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'508760','508960'],['RK1',36,'508800','509000'],['RK1',48,'508840','509040'],
      ['RK3',24,'508780','508980'],['RK3',36,'508820','509020'],['RK3',48,'508860','509060']
    ]
  },
  { model:'28-09', description:'V-Notched Formed Rack 7" Form 09 (6.37" x .62")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',18,'509720','509920'],['RK1',24,'509760','509960'],['RK1',36,'509800','510000'],['RK1',48,'509840','510040'],
      ['RK3',18,'509740','509940'],['RK3',24,'509780','509980'],['RK3',36,'509820','510020'],['RK3',48,'509860','510060']
    ]
  },
  { model:'28-010', description:'V-Notched Formed Rack 7" Form 010 (6.12" x 1.25")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',18,'519640','519840'],['RK1',24,'519680','519880'],['RK1',36,'519720','519920'],['RK1',42,'519730','519930'],['RK1',48,'519760','519960'],
      ['RK3',18,'519660','519860'],['RK3',24,'519700','519900'],['RK3',36,'519740','519940'],['RK3',42,'519750','519950'],['RK3',48,'519780','519980']
    ]
  },
  { model:'28-025', description:'V-Notched Formed Rack 7" Form 025 (6.75" x .62")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'520000','520120'],['RK1',36,'520040','520160'],['RK1',48,'520080','520200'],
      ['RK3',24,'520020','520140'],['RK3',36,'520060','520180'],['RK3',48,'520100','520220']
    ]
  },
  { model:'28-030', description:'V-Notched Formed Rack 7" Form 030 (5.75" x .75")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'518000','518120'],['RK1',36,'518040','518160'],['RK1',48,'518080','518200'],
      ['RK3',24,'518020','518140'],['RK3',36,'518060','518180'],['RK3',48,'518100','518220']
    ]
  },

  // ── 156 V-Notched Series (C4 / PDF 18) ──────────────────────────────────────
  { model:'156', description:'V-Notched Flat Rack 7" finger width, 30° notches',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'247600','247720'],['RK1',36,'247640','247760'],['RK1',48,'247680','247800'],
      ['RK3',24,'247620','247740'],['RK3',36,'247660','247780'],['RK3',48,'247700','247820']
    ]
  },
  { model:'156-09', description:'V-Notched Formed Rack 7" Form 09 (6.37" x .62")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',12,'248020','248220'],['RK1',18,'248060','248260'],['RK1',24,'248100','248300'],['RK1',36,'248140','248340'],['RK1',48,'248180','248380'],
      ['RK3',12,'248040','248240'],['RK3',18,'248080','248280'],['RK3',24,'248120','248320'],['RK3',36,'248160','248360'],['RK3',48,'248200','248400']
    ]
  },
  { model:'156-010', description:'V-Notched Formed Rack 7" Form 010 (6.25" x 1.37")',
    pageId:'C1', pdfPage:18,
    items:[
      ['RK1',24,'248610','248670'],['RK1',36,'248630','248690'],['RK1',48,'248650','248730'],
      ['RK3',24,'248620','248680'],['RK3',36,'248640','248700'],['RK3',48,'248660','248735']
    ]
  },

  // ── 161 V-Notched Series (C5 / PDF 19) — most popular rack ──────────────────
  { model:'161', description:'V-Notched Flat Rack 6" finger width, 40° notches',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',24,'265880','266120'],['RK1',36,'265960','266200'],['RK1',48,'266040','266280'],
      ['RK3',24,'265920','266160'],['RK3',36,'266000','266240'],['RK3',48,'266080','266320']
    ]
  },
  { model:'161-01', description:'V-Notched Formed Rack 6" Form 01 (3.5" x 4.5")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',24,'269080','269200'],['RK1',36,'269120','269240'],['RK1',48,'269160','269280'],
      ['RK3',24,'269100','269220'],['RK3',36,'269140','269260'],['RK3',48,'269180','269300'],
      ['RK5',24,'269105','269225'],['RK5',36,'269145','269265'],['RK5',48,'269185','269305']
    ]
  },
  { model:'161-02', description:'V-Notched Formed Rack 6" Form 02 (3.5" x 4")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',24,'271480','271600'],['RK1',36,'271520','271640'],['RK1',48,'271560','271680'],
      ['RK3',24,'271500','271620'],['RK3',36,'271540','271660'],['RK3',48,'271580','271700'],
      ['RK5',24,'271502','271622'],['RK5',36,'271542','271662'],['RK5',48,'271582','271702']
    ]
  },
  { model:'161-09', description:'V-Notched Formed Rack 6" Form 09 (5.37" x .62")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',18,'272360','272560'],['RK1',24,'272400','272600'],['RK1',36,'272440','272640'],['RK1',48,'272480','272680'],
      ['RK3',18,'272380','272580'],['RK3',24,'272420','272620'],['RK3',36,'272460','272660'],['RK3',48,'272500','272700']
    ]
  },
  { model:'161-010', description:'V-Notched Formed Rack 6" Form 010 (4.87" x 1.37")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',18,'273920','274120'],['RK1',24,'273960','274160'],['RK1',36,'274000','274200'],['RK1',48,'274040','274240'],
      ['RK3',18,'273940','274140'],['RK3',24,'273980','274180'],['RK3',36,'274020','274220'],['RK3',48,'274060','274260']
    ]
  },
  { model:'161-014', description:'V-Notched Formed Rack 6" Form 014 (5.87" x .62")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',24,'274460','274580'],['RK1',36,'274500','274620'],['RK1',48,'274540','274660'],
      ['RK3',24,'274480','274600'],['RK3',36,'274520','274640'],['RK3',48,'274560','274680']
    ]
  },
  { model:'161-015', description:'V-Notched Formed Rack 6" Form 015 (5.25" x .75")',
    pageId:'C1', pdfPage:19,
    items:[
      ['RK1',24,'274960','275160'],['RK1',36,'275000','275200'],['RK1',48,'275040','275240'],
      ['RK3',24,'274980','275180'],['RK3',36,'275020','275220'],['RK3',48,'275060','275260']
    ]
  },

  // ── 196 V-Notched Series (C6 / PDF 20) — for Box Racks ──────────────────────
  { model:'196', description:'V-Notched Flat Rack 6" finger width, .06" tips, 90° notches',
    pageId:'C1', pdfPage:20,
    items:[
      ['RK1',24,'398240','398480'],['RK1',36,'398320','398560'],['RK1',48,'398400','398640'],
      ['RK3',24,'398280','398520'],['RK3',36,'398360','398600'],['RK3',48,'398440','398680']
    ]
  },
  { model:'196-01', description:'V-Notched Formed Rack 6" Form 01 (3.5" x 4.5")',
    pageId:'C1', pdfPage:20,
    items:[
      ['RK1',24,'510480','510600'],['RK1',36,'510520','510640'],['RK1',48,'510560','510680'],
      ['RK3',24,'510500','510620'],['RK3',36,'510540','510660'],['RK3',48,'510580','510700']
    ]
  },
  { model:'196-02', description:'V-Notched Formed Rack 6" Form 02 (3.5" x 4")',
    pageId:'C1', pdfPage:20,
    items:[
      ['RK1',24,'511280','511400'],['RK1',36,'511320','511440'],['RK1',48,'511360','511480'],
      ['RK3',24,'511300','511420'],['RK3',36,'511340','511460'],['RK3',48,'511380','511500']
    ]
  },
  { model:'196-010', description:'V-Notched Formed Rack 6" Form 010 (4.87" x 1.37")',
    pageId:'C1', pdfPage:20,
    items:[
      ['RK1',12,'401440','401640'],['RK1',18,'401480','401680'],['RK1',24,'401520','401720'],['RK1',36,'401560','401760'],['RK1',48,'401600','401800'],
      ['RK3',12,'401460','401660'],['RK3',18,'401500','401700'],['RK3',24,'401540','401740'],['RK3',36,'401580','401780'],['RK3',48,'401620','401820']
    ]
  },
  { model:'196-015', description:'V-Notched Formed Rack 6" Form 015 (5.25" x .75")',
    pageId:'C1', pdfPage:20,
    items:[
      ['RK1',12,'404400','404600'],['RK1',18,'404440','404640'],['RK1',24,'404480','404680'],['RK1',36,'404520','404720'],['RK1',48,'404560','404760'],
      ['RK3',12,'404420','404620'],['RK3',18,'404460','404660'],['RK3',24,'404500','404700'],['RK3',36,'404540','404740'],['RK3',48,'404580','404780']
    ]
  },

  // ── 198, 200 V-Notched (C7-C8 / PDF 21-22) ──────────────────────────────────
  { model:'198', description:'V-Notched Flat Rack 6" finger width, .06" tips, 90° notches',
    pageId:'C1', pdfPage:21,
    items:[
      ['RK1',24,'407360','407600'],['RK1',36,'407440','407680'],['RK1',48,'407520','407760'],
      ['RK3',24,'407400','407640'],['RK3',36,'407480','407720'],['RK3',48,'407560','407800']
    ]
  },
  { model:'198-015', description:'V-Notched Formed Rack 6" Form 015 (5.25" x .75")',
    pageId:'C1', pdfPage:21,
    items:[
      ['RK1',12,'413520','413720'],['RK1',18,'413560','413760'],['RK1',24,'413600','413800'],['RK1',36,'413640','413840'],['RK1',48,'413680','413880'],
      ['RK3',12,'413540','413740'],['RK3',18,'413580','413780'],['RK3',24,'413620','413820'],['RK3',36,'413660','413860'],['RK3',48,'413700','413900']
    ]
  },
  { model:'200', description:'V-Notched Flat Rack 6" finger width, .06" tips, 90° notches',
    pageId:'C1', pdfPage:22,
    items:[
      ['RK1',24,'422640','422880'],['RK1',36,'422720','422960'],['RK1',48,'422800','423040'],
      ['RK3',24,'422680','422920'],['RK3',36,'422760','423000'],['RK3',48,'422840','423080']
    ]
  },
  { model:'200-015', description:'V-Notched Formed Rack 6" Form 015 (5.25" x .75")',
    pageId:'C1', pdfPage:22,
    items:[
      ['RK1',12,'425840','426040'],['RK1',18,'425880','426080'],['RK1',24,'425920','426120'],['RK1',36,'425960','426160'],['RK1',48,'426000','426200'],
      ['RK3',12,'425860','426060'],['RK3',18,'425900','426100'],['RK3',24,'425940','426140'],['RK3',36,'425980','426180'],['RK3',48,'426020','426220']
    ]
  },

  // ── 300 V-Notched + 300P Pointed (C8 / PDF 22) ──────────────────────────────
  { model:'300', description:'V-Notched Flat Rack 6" finger width, .06" tips, 90° notches',
    pageId:'C1', pdfPage:22,
    items:[
      ['RK1',24,'457640','457880'],['RK1',36,'457720','457960'],['RK1',48,'457800','458040'],
      ['RK3',24,'457680','457920'],['RK3',36,'457760','458000'],['RK3',48,'457840','458080']
    ]
  },
  { model:'300-010', description:'V-Notched Formed Rack 6" Form 010 (4.87" x 1.37")',
    pageId:'C1', pdfPage:22,
    items:[
      ['RK1',24,'458180','458420'],['RK1',36,'458260','458500'],['RK1',48,'458340','458580'],
      ['RK3',24,'458220','458460'],['RK3',36,'458300','458540'],['RK3',48,'458380','458620']
    ]
  },
  { model:'300-015', description:'V-Notched Formed Rack 6" Form 015 (5.25" x .75")',
    pageId:'C1', pdfPage:22,
    items:[
      ['RK1',24,'458720','458960'],['RK1',36,'458800','459040'],['RK1',48,'458880','459120'],
      ['RK3',24,'458760','459000'],['RK3',36,'458840','459080'],['RK3',48,'458920','459160']
    ]
  },

  // ── 308, 314 V-Notched (C9 / PDF 23) ────────────────────────────────────────
  { model:'308', description:'V-Notched Flat Rack 8" finger width, sharp tips, 90° notches',
    pageId:'C1', pdfPage:23,
    items:[
      ['RK1',18,'448360','448700'],['RK1',24,'448480','448720'],['RK1',36,'448560','448800'],['RK1',48,'448640','448880'],
      ['RK3',18,'448400','448710'],['RK3',24,'448520','448760'],['RK3',36,'448600','448840'],['RK3',48,'448680','448920']
    ]
  },
  { model:'314', description:'V-Notched Flat Rack 10" finger width, sharp tips, 90° notches',
    pageId:'C1', pdfPage:23,
    items:[
      ['RK1',18,'483680','483963'],['RK1',24,'483760','484000'],['RK1',36,'483840','484080'],['RK1',48,'483920','484160'],
      ['RK3',18,'483720','483965'],['RK3',24,'483800','484040'],['RK3',36,'483880','484120'],['RK3',48,'483960','484200']
    ]
  },

  // ── Round Notched: 158A, 158B (C10-C11 / PDF 24-25) ─────────────────────────
  { model:'158A', description:'Round Notched Flat Rack 7" finger width, .12" diameter notches',
    pageId:'C1', pdfPage:24,
    items:[
      ['RK1',24,'248760','249000'],['RK1',36,'248840','249080'],['RK1',48,'248920','249160'],
      ['RK3',24,'248800','249040'],['RK3',36,'248880','249120'],['RK3',48,'248960','249200']
    ]
  },
  { model:'158B', description:'Round Notched Flat Rack 7" finger width, .31" diameter notches',
    pageId:'C1', pdfPage:25,
    items:[
      ['RK1',24,'257320','257560'],['RK1',36,'257400','257640'],['RK1',48,'257480','257720'],
      ['RK3',24,'257360','257600'],['RK3',36,'257440','257680'],['RK3',48,'257520','257760']
    ]
  },

  // ── 157 Bevel Notched (C11 / PDF 25) ────────────────────────────────────────
  { model:'157', description:'Bevel Notched Flat Rack 7" finger width, bevel-sided notches',
    pageId:'C1', pdfPage:25,
    items:[
      ['RK1',24,'246200','246320'],['RK1',36,'246240','246360'],['RK1',48,'246280','246400'],
      ['RK3',24,'246220','246340'],['RK3',36,'246260','246380'],['RK3',48,'246300','246420']
    ]
  },

  // ── 132, 132X, 132M Side Notched (C12 / PDF 26) ─────────────────────────────
  { model:'132', description:'Square Side-Notched Rack 6", .125"+ wide notches',
    pageId:'C1', pdfPage:26,
    items:[
      ['RK1',24,'263800','263920'],['RK1',36,'263840','263960'],['RK1',48,'263880','264000'],
      ['RK3',24,'263820','263940'],['RK3',36,'263860','263980'],['RK3',48,'263900','264020']
    ]
  },
  { model:'132X', description:'Square Side-Notched Rack 6" x 2.47", .125"+ wide notches',
    pageId:'C1', pdfPage:26,
    items:[
      ['RK1',24,'263800X','263920X'],['RK1',36,'263840X','263960X'],['RK1',48,'263880X','264000X'],
      ['RK3',24,'263820X','263940X'],['RK3',36,'263860X','263980X'],['RK3',48,'263900X','264020X']
    ]
  },
  { model:'132M', description:'Round Side-Notched Rack 6", .15" dia round notches',
    pageId:'C1', pdfPage:26,
    items:[
      ['RK1',24,'117000','117240'],['RK1',36,'117080','117320'],['RK1',48,'117160','117400'],
      ['RK3',24,'117040','117280'],['RK3',36,'117120','117360'],['RK3',48,'117200','117440']
    ]
  },

  // ── 133 Side V-Notched (C12 / PDF 26) ───────────────────────────────────────
  { model:'133', description:'Side V-Notched Rack 8" with .25" and .12" features',
    pageId:'C1', pdfPage:26,
    items:[
      ['RK1',24,'264100','264200'],['RK1',30,'264106','264206'],['RK1',36,'264110','264210'],['RK1',48,'264120','264220'],
      ['RK3',24,'264105','264205'],['RK3',30,'264108','264208'],['RK3',36,'264115','264215'],['RK3',48,'264125','264225']
    ]
  },

  // ── Pierced racks: 105P, 110P (C13 / PDF 27) ────────────────────────────────
  { model:'105P (1/8)', description:'Pierced Flat Rack 6" with .14" dia holes',
    pageId:'C1', pdfPage:27,
    items:[
      ['RK1',24,'223400','223500'],['RK1',36,'223420','223520'],['RK1',48,'223440','223540'],
      ['RK3',24,'223401','223501'],['RK3',36,'223421','223521'],['RK3',48,'223441','223541']
    ]
  },
  { model:'105P (3/16)', description:'Pierced Flat Rack 6" with .20" dia holes',
    pageId:'C1', pdfPage:27,
    items:[
      ['RK1',24,'223404','223504'],['RK1',36,'223424','223524'],['RK1',48,'223444','223544'],
      ['RK3',24,'223405','223505'],['RK3',36,'223425','223525'],['RK3',48,'223445','223545']
    ]
  },
  { model:'105D', description:'Dimpled Flat Rack 6" with .12" diameter dimples',
    pageId:'C1', pdfPage:27,
    items:[
      ['RK1',24,'228500','228600'],['RK1',36,'228501','228601'],['RK1',48,'228502','228602'],
      ['RK3',24,'228503','228603'],['RK3',36,'228504','228604'],['RK3',48,'228505','228605']
    ]
  },
  { model:'109DP', description:'Dimpled & Pierced Rack 6" with .44" dimples + .25" holes',
    pageId:'C1', pdfPage:27,
    items:[
      ['RK1',24,'229480','229720'],['RK1',36,'229560','229800'],['RK1',48,'229640','229880'],
      ['RK3',24,'229520','229760'],['RK3',36,'229600','229840'],['RK3',48,'229680','229920']
    ]
  },

  // ── Pointed racks: 169, 170, 171 (C14-C15 / PDF 28-29) ──────────────────────
  { model:'169', description:'Pointed Flat Rack 4" finger width, .03" tips',
    pageId:'C1', pdfPage:28,
    items:[
      ['RK1',24,'281720',null],['RK1',36,'281840',null],
      ['RK3',24,'281740',null],['RK3',36,'281860',null],
      ['RK5',24,'281760',null],['RK5',36,'281880',null],
      ['RK8',24,'281820',null],['RK8',36,'281940',null]
    ]
  },
  { model:'169-011', description:'Pointed Formed Rack (Small Utility Rack) 2.50" x 2.75"',
    pageId:'C1', pdfPage:28,
    items:[
      ['RK1',24,'284160',null],['RK1',36,'284280',null],
      ['RK3',24,'284180',null],['RK3',36,'284300',null],
      ['RK5',24,'284200',null],['RK5',36,'284320',null],
      ['RK7',24,'284240',null],['RK7',36,'284360',null],
      ['RK8',24,'284260',null],['RK8',36,'284380',null]
    ]
  },
  { model:'170', description:'Pointed Flat Rack 4" finger width, .06" tips',
    pageId:'C1', pdfPage:29,
    items:[
      ['RK1',24,'289040',null],['RK1',36,'289160',null],
      ['RK3',24,'289060',null],['RK3',36,'289180',null]
    ]
  },
  { model:'171', description:'Pointed Flat Rack 4" finger width, .06" tips',
    pageId:'C1', pdfPage:29,
    items:[
      ['RK1',24,'294640',null],['RK1',30,'294700',null],['RK1',36,'294760',null],['RK1',48,'294820',null],
      ['RK3',24,'294660',null],['RK3',30,'294720',null],['RK3',36,'294780',null],['RK3',48,'294840',null],
      ['RK9',24,'294680',null],['RK9',30,'294740',null],['RK9',36,'294800',null],['RK9',48,'294860',null]
    ]
  },

  // ── Square racks: 23018, 23025, 23050, 23062, 23075 (C21-C22 / PDF 35-36) ───
  { model:'23018', description:'Square Flat Rack 7" with .18" tips, 102 fingers',
    pageId:'C1', pdfPage:35,
    items:[
      ['RK1',24,'112000','112240'],['RK1',36,'112080','112320'],['RK1',48,'112160','112400'],
      ['RK3',24,'112040','112280'],['RK3',36,'112120','112360'],['RK3',48,'112200','112440']
    ]
  },
  { model:'23025', description:'Square Flat Rack 7" with .25" tips, 96 fingers',
    pageId:'C1', pdfPage:35,
    items:[
      ['RK1',24,'112800','113040'],['RK1',36,'112880','113120'],['RK1',48,'112960','113200'],
      ['RK3',24,'112840','113080'],['RK3',36,'112920','113160'],['RK3',48,'113000','113240']
    ]
  },
  { model:'23037', description:'Square Flat Rack 7" with .37" tips, 86 fingers',
    pageId:'C1', pdfPage:36,
    items:[
      ['RK1',24,'116000','116240'],['RK1',36,'116080','116320'],['RK1',48,'116160','116400'],
      ['RK3',24,'116040','116280'],['RK3',36,'116120','116360'],['RK3',48,'116200','116440']
    ]
  },
  { model:'23050', description:'Square Flat Rack 7" with .50" tips, 76 fingers',
    pageId:'C1', pdfPage:36,
    items:[
      ['RK1',24,'119200','119440'],['RK1',36,'119280','119520'],['RK1',48,'119360','119600'],
      ['RK3',24,'119240','119480'],['RK3',36,'119320','119560'],['RK3',48,'119400','119640']
    ]
  },
  { model:'23062', description:'Square Flat Rack 7" with .62" tips, 70 fingers',
    pageId:'C1', pdfPage:36,
    items:[
      ['RK1',24,'122400','122640'],['RK1',36,'122480','122720'],['RK1',48,'122560','122800'],
      ['RK3',24,'122440','122680'],['RK3',36,'122520','122760'],['RK3',48,'122600','122840']
    ]
  },
  { model:'23075', description:'Square Flat Rack 7" with .75" tips, 64 fingers',
    pageId:'C1', pdfPage:36,
    items:[
      ['RK1',24,'125600','125840'],['RK1',36,'125680','125920'],['RK1',48,'125760','126000'],
      ['RK3',24,'125640','125880'],['RK3',36,'125720','125960'],['RK3',48,'125800','126040']
    ]
  },
  { model:'23100', description:'Square Flat Rack 7" with 1.00" tips, 54 fingers',
    pageId:'C1', pdfPage:37,
    items:[
      ['RK1',24,'132000','132240'],['RK1',36,'132080','132320'],['RK1',48,'132160','132400'],
      ['RK3',24,'132040','132280'],['RK3',36,'132120','132360'],['RK3',48,'132200','132440']
    ]
  },
  { model:'23125', description:'Square Flat Rack 7" with 1.25" tips, 48 fingers',
    pageId:'C1', pdfPage:37,
    items:[
      ['RK1',24,'138400','138640'],['RK1',36,'138480','138720'],['RK1',48,'138560','138800'],
      ['RK3',24,'138440','138680'],['RK3',36,'138520','138760'],['RK3',48,'138600','138840']
    ]
  },

  // ── Square racks: 101, 102, 103, 105, 110, 113 (C19-C20 / PDF 33-34) ────────
  { model:'101', description:'Square Flat Rack 6" with .25" finger spacing, 384 fingers',
    pageId:'C1', pdfPage:33,
    items:[
      ['RK1',24,'208080','208320'],['RK1',36,'208160','208400'],['RK1',48,'208240','208480'],
      ['RK3',24,'208120','208360'],['RK3',36,'208200','208440'],['RK3',48,'208280','208520']
    ]
  },
  { model:'102', description:'Square Flat Rack 6" with .31" finger spacing, 306 fingers',
    pageId:'C1', pdfPage:33,
    items:[
      ['RK1',24,'211280','211520'],['RK1',36,'211360','211600'],['RK1',48,'211440','211680'],
      ['RK3',24,'211320','211560'],['RK3',36,'211400','211640'],['RK3',48,'211480','211720']
    ]
  },
  { model:'103', description:'Square Flat Rack 6" with .37" finger spacing, 262 fingers',
    pageId:'C1', pdfPage:33,
    items:[
      ['RK1',24,'214480','214720'],['RK1',36,'214560','214800'],['RK1',48,'214640','214880'],
      ['RK3',24,'214520','214760'],['RK3',36,'214600','214840'],['RK3',48,'214680','214920']
    ]
  },
  { model:'105', description:'Square Flat Rack 6" with .50" finger spacing, 192 fingers',
    pageId:'C1', pdfPage:33,
    items:[
      ['RK1',24,'222480','222720'],['RK1',36,'222560','222800'],['RK1',48,'222640','222880'],
      ['RK3',24,'222520','222760'],['RK3',36,'222600','222840'],['RK3',48,'222680','222920']
    ]
  },
  { model:'110', description:'Square Flat Rack 6" with .75" finger spacing, 128 fingers',
    pageId:'C1', pdfPage:34,
    items:[
      ['RK1',24,'230480','230720'],['RK1',36,'230560','230800'],['RK1',48,'230640','230880'],
      ['RK3',24,'230520','230760'],['RK3',36,'230600','230840'],['RK3',48,'230680','230920']
    ]
  },
  { model:'113', description:'Square Flat Rack 9" with .75" finger spacing, 126 fingers',
    pageId:'C1', pdfPage:34,
    items:[
      ['RK1',24,'239840','240080'],['RK1',36,'239920','240160'],['RK1',48,'240000','240240'],
      ['RK3',24,'239880','240120'],['RK3',36,'239960','240200'],['RK3',48,'240040','240280']
    ]
  },

  // ── Tapered racks: 25, 26, 27, 99 (C26-C28 / PDF 40-42) ─────────────────────
  { model:'25', description:'Tapered Flat Rack 6" with .25" tips, 128 fingers',
    pageId:'C1', pdfPage:40,
    items:[
      ['RK1',24,'144800','145040'],['RK1',36,'144880','145120'],['RK1',48,'144960','145200'],
      ['RK3',24,'144840','145080'],['RK3',36,'144920','145160'],['RK3',48,'145000','145240']
    ]
  },
  { model:'26', description:'Tapered Flat Rack 6" with .06" tips, 172 fingers',
    pageId:'C1', pdfPage:41,
    items:[
      ['RK1',24,'181680','181920'],['RK1',36,'181760','182000'],['RK1',48,'181840','182080'],
      ['RK3',24,'181720','181960'],['RK3',36,'181800','182040'],['RK3',48,'181880','182120']
    ]
  },
  { model:'27', description:'Tapered Flat Rack 6" with .12" tips, 154 fingers',
    pageId:'C1', pdfPage:42,
    items:[
      ['RK1',24,'192080','192320'],['RK1',36,'192160','192400'],['RK1',48,'192240','192480'],
      ['RK3',24,'192120','192360'],['RK3',36,'192200','192440'],['RK3',48,'192280','192520']
    ]
  },
  { model:'99', description:'Tapered Flat Rack 6" with .18" tips, 140 fingers',
    pageId:'C1', pdfPage:42,
    items:[
      ['RK1',24,'200080','200320'],['RK1',36,'200160','200400'],['RK1',48,'200240','200480'],
      ['RK3',24,'200120','200360'],['RK3',36,'200200','200440'],['RK3',48,'200280','200520']
    ]
  },

  // ── Split Finger: 22, 24, 306SFN, 311SFN (C30-C31 / PDF 44-45) ──────────────
  { model:'22', description:'Split Finger Notched Flat Rack 7" with .06" tips, 28° notches, .12" slots',
    pageId:'C1', pdfPage:44,
    items:[
      ['RK1',18,'109520','109810'],['RK1',24,'109600','109840'],['RK1',36,'109680','109920'],['RK1',48,'109760','110000'],
      ['RK3',18,'109560','109820'],['RK3',24,'109640','109880'],['RK3',36,'109720','109960'],['RK3',48,'109800','110040']
    ]
  },
  { model:'24', description:'Split Finger Square Flat Rack 7" with .25" tips, .12" slots',
    pageId:'C1', pdfPage:44,
    items:[
      ['RK1',24,'141600','141840'],['RK1',36,'141680','141920'],['RK1',48,'141760','142000'],
      ['RK3',24,'141640','141880'],['RK3',36,'141720','141960'],['RK3',48,'141800','142040']
    ]
  },
  { model:'306SFN', description:'Split Finger Notched Flat Rack 8" with .06" tips, 45° notches',
    pageId:'C1', pdfPage:45,
    items:[
      ['RK1',18,'463020','463180'],['RK1',24,'463060','463220'],['RK1',36,'463100','463260'],['RK1',48,'463140','463300'],
      ['RK3',18,'463040','463200'],['RK3',24,'463080','463240'],['RK3',36,'463120','463280'],['RK3',48,'463160','463320']
    ]
  },
  { model:'306SFN-015', description:'Split Finger Notched Formed Rack 8" Form 015 (7" x .87")',
    pageId:'C1', pdfPage:45,
    items:[
      ['RK1',18,'463340','463500'],['RK1',24,'463380','463540'],['RK1',36,'463420','463580'],['RK1',48,'463460','463620'],
      ['RK3',18,'463360','463520'],['RK3',24,'463400','463560'],['RK3',36,'463440','463600'],['RK3',48,'463480','463640']
    ]
  },
  { model:'311SFN', description:'Split Finger Notched Flat Rack 8" with .063" tips, 30° notches',
    pageId:'C1', pdfPage:45,
    items:[
      ['RK1',18,'462340','462500'],['RK1',24,'462380','462540'],['RK1',36,'462420','462580'],['RK1',48,'462460','462620'],
      ['RK3',18,'462360','462520'],['RK3',24,'462400','462560'],['RK3',36,'462440','462600'],['RK3',48,'462480','462640']
    ]
  },
  { model:'311SFN-015', description:'Split Finger Notched Formed Rack 8" Form 015 (7" x .87")',
    pageId:'C1', pdfPage:45,
    items:[
      ['RK1',18,'462660','462820'],['RK1',24,'462700','462860'],['RK1',36,'462740','462900'],['RK1',48,'462780','462940'],
      ['RK3',18,'462680','462840'],['RK3',24,'462720','462880'],['RK3',36,'462760','462920'],['RK3',48,'462800','462960']
    ]
  }
];

// HD Box Rack components (C32-C33 / PDF 46-47)
const HD_BOX_RACKS = [
  // HD Plate, Bracket, Spring Fingers
  { item_number:'600010', name:'180 HD Plate 8" x 8" x .125", notches spaced .50" CTC',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'High Density Box Rack base plate' },
  { item_number:'600020', name:'181 HD Bracket 2" x 2.75" x .125"',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'Used on old style HD Assemblies with 192 Angle Brackets' },
  { item_number:'600030-60', name:'182 HD Spring Fingers 7.87" x 2.50" .063" aluminum',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'6061-T6 Aluminum', thickness_in:0.063 },
  { item_number:'600030', name:'182 HD Spring Fingers 7.87" x 2.50" .080" aluminum',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'6061-T6 Aluminum', thickness_in:0.080 },
  { item_number:'600035-60', name:'182W HD Wide Spring Fingers 7.87" x 3.50" .063" aluminum',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'6061-T6 Aluminum', thickness_in:0.063,
    notes:'For 3-point contact applications' },
  { item_number:'600035', name:'182W HD Wide Spring Fingers 7.87" x 3.50" .080" aluminum',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'6061-T6 Aluminum', thickness_in:0.080 },
  // HD assemblies (top, middle, lower plate)
  { item_number:'600140', name:'184 HD Top Plate Assembly (Standard)',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'Includes 180 HD Plate, 191 HD Collar, 2x 182 HD Spring Fingers, fasteners' },
  { item_number:'600145', name:'184W HD Top Plate Assembly with Wide Fingers',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'Adds 2x 182W Wide Spring Fingers for 3-point contact' },
  { item_number:'600180', name:'185 HD Middle Plate Assembly (Standard)',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'Includes 180 HD Plate, 191 HD Collar, 4x 182 HD Spring Fingers, fasteners' },
  { item_number:'600185', name:'185W HD Middle Plate Assembly with Wide Fingers',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum' },
  { item_number:'600220', name:'186 HD Lower Plate Assembly (Standard)',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum',
    notes:'Includes 180 HD Plate, 191 HD Collar, 2x 182 HD Spring Fingers, fasteners' },
  { item_number:'600225', name:'186W HD Lower Plate Assembly with Wide Fingers',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum' },
  // 183 HD Rack Complete Assemblies
  { item_number:'600040', name:'183 HD Box Rack Complete Assembly 36" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:36,
    notes:'16 racking positions per side. Includes 184 top, 185 middle, 186 lower, spine with hook' },
  { item_number:'600060', name:'183 HD Box Rack Complete Assembly 42" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:42 },
  { item_number:'600080', name:'183 HD Box Rack Complete Assembly 48" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:48 },
  { item_number:'600100', name:'183 HD Box Rack Complete Assembly 54" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:54 },
  { item_number:'600045', name:'183W HD Box Rack with Wide Spring Fingers 36" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:36 },
  { item_number:'600065', name:'183W HD Box Rack with Wide Spring Fingers 42" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:42 },
  { item_number:'600085', name:'183W HD Box Rack with Wide Spring Fingers 48" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:48 },
  { item_number:'600105', name:'183W HD Box Rack with Wide Spring Fingers 54" Spine',
    section:'Racks', catalog_page_id:'C1', pdf_page:46, material:'Aluminum', length_in:54 }
];

function expandRackFamily(family) {
  const rows = [];
  for (const item of family.items) {
    const [holeStyle, length, item063, item080] = item;
    if (item063) {
      rows.push({
        item_number: item063,
        name: `${family.model} ${family.description} ${holeStyle}, ${length}" length, .063" aluminum`,
        section: 'Racks',
        catalog_page_id: family.pageId,
        pdf_page: family.pdfPage,
        hole_style: holeStyle,
        length_in: length,
        thickness_in: 0.063,
        material: '6061-T6 Aluminum'
      });
    }
    if (item080) {
      rows.push({
        item_number: item080,
        name: `${family.model} ${family.description} ${holeStyle}, ${length}" length, .080" aluminum`,
        section: 'Racks',
        catalog_page_id: family.pageId,
        pdf_page: family.pdfPage,
        hole_style: holeStyle,
        length_in: length,
        thickness_in: 0.080,
        material: '6061-T6 Aluminum'
      });
    }
  }
  return rows;
}

// ── BUILD CSV ─────────────────────────────────────────────────────────────────

function rowToCSV(row) {
  return CSV_HEADER.map(col => {
    const val = row[col];
    if (val === undefined || val === null || val === '') return '';
    const str = String(val);
    // Quote if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }).join(',');
}

console.log('Sequel PDF Catalog Extraction\n' + '─'.repeat(50));

const allRows = [];

// Expand disc families
console.log('\nSection B (Discs):');
let discCount = 0;
for (const family of DISC_FAMILIES) {
  const rows = expandDiscFamily(family);
  console.log(`  ${family.model.padEnd(8)} ${family.description.padEnd(50)} ${rows.length} SKUs`);
  allRows.push(...rows);
  discCount += rows.length;
}

// Add disc collars and brackets
for (const item of DISC_COLLARS_BRACKETS) {
  allRows.push(item);
  discCount++;
}
console.log(`  ${'Collars/Brackets'.padEnd(8)} ${'191/192 Series'.padEnd(50)} ${DISC_COLLARS_BRACKETS.length} SKUs`);
console.log(`Total Section B SKUs: ${discCount}`);

// ── Section D: Pin Racks ────────────────────────────────────────────────────
console.log('\nSection D (Pin Racks):');
let pinCount = 0;
for (const arr of PIN_RACKS_2W) { allRows.push(buildPinRackRow(arr, 'D1', 51)); pinCount++; }
for (const arr of PIN_RACKS_4W) { allRows.push(buildPinRackRow(arr, 'D1', 51)); pinCount++; }
for (const arr of PIN_RACKS_6W) { allRows.push(buildPinRackRow(arr, 'D1', 52)); pinCount++; }
for (const arr of PIN_RACKS_MULTI) { allRows.push(buildMultiPinRow(arr, 'D1', 53)); pinCount++; }
for (const arr of PIN_RACKS_HORIZ_URH) { allRows.push(buildHorizPinRow(arr, 'D1', 54)); pinCount++; }
for (const item of URH_ASSEMBLIES) { allRows.push(item); pinCount++; }
console.log(`  2-Way Single Pin-Group:    ${PIN_RACKS_2W.length} SKUs`);
console.log(`  4-Way Single Pin-Group:    ${PIN_RACKS_4W.length} SKUs`);
console.log(`  6-Way Single Pin-Group:    ${PIN_RACKS_6W.length} SKUs`);
console.log(`  Multi Pin-Group (2W3P-8W2P): ${PIN_RACKS_MULTI.length} SKUs`);
console.log(`  Horizontal Multi-Station + URH: ${PIN_RACKS_HORIZ_URH.length} SKUs`);
console.log(`  URH Complete Assemblies:   ${URH_ASSEMBLIES.length} SKUs`);
console.log(`Total Section D SKUs: ${pinCount}`);

// ── Section G: Clamps ───────────────────────────────────────────────────────
console.log('\nSection G (Clamps):');
for (const item of CLAMPS) allRows.push(item);
console.log(`Total Section G SKUs: ${CLAMPS.length}`);

// ── Section F: Hardware ─────────────────────────────────────────────────────
console.log('\nSection F (Hardware):');
let hwCount = 0;
for (const arr of PLAIN_SPINES) { const rows = buildSpineRow(arr, 'Plain Aluminum'); allRows.push(...rows); hwCount += rows.length; }
for (const arr of PIERCED_SPINES) { const rows = buildSpineRow(arr, 'Pierced Aluminum'); allRows.push(...rows); hwCount += rows.length; }
for (const arr of SLOTTED_SPINES) { const rows = buildSpineRow(arr, 'Slotted Aluminum'); allRows.push(...rows); hwCount += rows.length; }
for (const arr of TI_PIERCED_SPINES) { allRows.push(buildTiSpineRow(arr, 'Pierced')); hwCount++; }
for (const arr of TI_SLOTTED_SPINES) { allRows.push(buildTiSpineRow(arr, 'Slotted')); hwCount++; }
// Cross members
for (const [model, length, itemNum] of CROSS_MEMBERS) {
  allRows.push({
    item_number: itemNum,
    name: `${model} Aluminum Cross Member ${length}"`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 92,
    length_in: length, material: '6063 Aluminum',
    cross_section: '1" x .25"',
    notes: 'Pierced cross member with 1/4-20 holes on 1" centers'
  });
  hwCount++;
}
for (const [length, itemNum] of TI_CROSS_MEMBERS) {
  allRows.push({
    item_number: itemNum,
    name: `485TI Titanium Cross Member ${length}"`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 92,
    length_in: length, material: 'C.P. Titanium',
    cross_section: '1.18" x .12"',
    notes: 'Pierced titanium cross member'
  });
  hwCount++;
}
for (const [length, itemNum] of SLOTTED_CROSS_MEMBERS) {
  allRows.push({
    item_number: itemNum,
    name: `485C Slotted Aluminum Cross Member ${length}"`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 92,
    length_in: length, material: '6063 Aluminum',
    cross_section: '1" x .25"',
    notes: 'Slotted cross member, .25" x 3.5" slots .50" apart'
  });
  hwCount++;
}
// Mounting angles
for (const [racklen, totalLen, itemNum] of MOUNTING_ANGLES_176) {
  allRows.push({
    item_number: itemNum,
    name: `176 Mounting Angle for ${racklen}" Racks (${totalLen}" total)`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 92,
    length_in: totalLen, material: '6063 Aluminum',
    notes: 'Attaches Sequel Racks to Spine for Box Rack assemblies'
  });
  hwCount++;
}
for (const [racklen, totalLen, itemNum] of MOUNTING_ANGLES_176C) {
  allRows.push({
    item_number: itemNum,
    name: `176C Slotted Mounting Angle for Clips ${racklen}" (${totalLen}" total)`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 93,
    length_in: totalLen, material: '6063 Aluminum',
    notes: 'Slotted mounting angle for flexibility when bolting Clips'
  });
  hwCount++;
}
for (const [length, itemNum] of TI_MOUNTING_BARS_177) {
  allRows.push({
    item_number: itemNum,
    name: `177 Titanium Horizontal Mounting Bar for ${length}" Racks`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 93,
    length_in: length, material: 'C.P. Titanium',
    cross_section: '1" x .37"',
    notes: 'Use with 586 Slotted Titanium Spine and 485HT Aluminum Hook'
  });
  hwCount++;
}
// Hooks
for (const [model, itemNum, desc] of HOOKS) {
  allRows.push({
    item_number: itemNum,
    name: `${model} Aluminum Hook (14" before bending)`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 93,
    length_in: 14, material: '6063 Aluminum',
    hook_type: model.endsWith('HT') ? 'Hook with Twist' : (model.endsWith('H') ? 'Standard Hook' : 'No Bend'),
    notes: desc
  });
  hwCount++;
}
// Contact bars
for (const [model, length] of CONTACT_BARS) {
  allRows.push({
    item_number: model,
    name: `${model} Aluminum Contact Bar ${length}"`,
    section: 'Hardware', catalog_page_id: 'F1', pdf_page: 94,
    length_in: length, material: '6063 Aluminum',
    notes: 'H-Rail contact bar, snaps over rigid frame titanium box rack rail'
  });
  hwCount++;
}
// Fasteners
for (const f of FASTENERS) {
  const [itemNum, name, size, type, mat, qtyNote] = f;
  allRows.push({
    item_number: itemNum,
    name: name,
    section: 'Fasteners', catalog_page_id: 'F1', pdf_page: 95,
    fastener_size: size, fastener_type: type, material: mat,
    quantity_note: qtyNote || ''
  });
  hwCount++;
}
console.log(`Total Section F (Hardware + Fasteners) SKUs: ${hwCount}`);

// ── Section E: Clips ────────────────────────────────────────────────────────
console.log('\nSection E (Clips):');
let clipCount = 0;
for (const family of CLIP_FAMILIES) {
  const rows = expandClipFamily(family);
  allRows.push(...rows);
  clipCount += rows.length;
}
console.log(`  Clip families (Notched, V-Notched, Pointed, Tapered, Square, Split Finger, End Slot): ${clipCount} SKUs`);
const sqClipRows = buildSquareClipsByWidth(SQUARE_CLIPS_BY_WIDTH);
allRows.push(...sqClipRows);
clipCount += sqClipRows.length;
console.log(`  Square Clips by Width (6"x_, 7"x_, 8"x_, 9"x_): ${sqClipRows.length} SKUs`);
for (const arr of TUBE_CLIPS) {
  const rows = buildTubeClipRow(arr);
  allRows.push(...rows);
  clipCount += rows.length;
}
console.log(`  Tube Clips Single/Double: ${TUBE_CLIPS.length * 2} SKUs`);
for (const arr of TUBE_CLIP_ASMS) {
  const rows = buildTubeClipAsmRow(arr);
  allRows.push(...rows);
  clipCount += rows.length;
}
console.log(`  Tube Clip Assemblies: ${TUBE_CLIP_ASMS.length * 2} SKUs`);
for (const item of A_CLIPS) { allRows.push(item); clipCount++; }
console.log(`  A-Clips (A-1, A-1X variants): ${A_CLIPS.length} SKUs`);
console.log(`Total Section E SKUs: ${clipCount}`);

// ── Section C: Racks ────────────────────────────────────────────────────────
console.log('\nSection C (Racks):');
let rackCount = 0;
for (const family of RACK_FAMILIES) {
  const rows = expandRackFamily(family);
  allRows.push(...rows);
  rackCount += rows.length;
}
console.log(`  Rack families (V-Notched, Round Notched, Bevel, Pierced, Square, Tapered, Split Finger): ${rackCount} SKUs`);
for (const item of HD_BOX_RACKS) { allRows.push(item); rackCount++; }
console.log(`  HD Box Rack components and assemblies: ${HD_BOX_RACKS.length} SKUs`);
console.log(`Total Section C SKUs: ${rackCount}`);

console.log(`\n${'─'.repeat(50)}`);
console.log(`GRAND TOTAL: ${allRows.length} SKUs across 7 sections`);
console.log(`${'─'.repeat(50)}`);

// Write CSV
const csvLines = [CSV_HEADER.join(',')];
for (const row of allRows) csvLines.push(rowToCSV(row));

const outPath = path.join(SRC, 'products.csv');
fs.writeFileSync(outPath, csvLines.join('\n') + '\n');
console.log(`\n✓ Wrote ${outPath}`);
console.log(`  ${allRows.length} products, ${csvLines.length} lines\n`);
console.log('Next: npm run build');
