const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// ── Load catalog data once at startup ──
const dataDir = path.join(__dirname, '..', 'data');

const catalogPages = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_catalog_rag.json'), 'utf-8'));
const productsFlat = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_catalog_rag_products_flat.json'), 'utf-8'));
const assemblies = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_assemblies.json'), 'utf-8'));
const fasteners = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_fasteners.json'), 'utf-8'));
const selectionGuides = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_selection_guides.json'), 'utf-8'));

let assemblyGaps = [];
try {
  assemblyGaps = JSON.parse(fs.readFileSync(path.join(dataDir, 'sequel_assembly_gaps.json'), 'utf-8'));
} catch (e) { /* optional file */ }

console.log(`[RAGAgent] Loaded catalog: ${catalogPages.length} pages, ${Object.keys(productsFlat).length} products, ${assemblies.length} assemblies, ${fasteners.length} fasteners, ${selectionGuides.length} guides`);

// ── OpenAI client ──
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

// ── System prompt ──
const SYSTEM_PROMPT = `You are a helpful product specialist for Sequel Anodizing Racks, a manufacturer of anodizing rack systems. Your job is to help customers identify the exact parts they need for their anodizing application.

You have access to the complete Sequel product catalog including:
- All disc, rack, clip, hardware, and clamp product specifications
- Assembly configurations showing which parts work together
- Fastener specifications (bolts, nuts, washers, rivets)
- Part selection guides explaining which products suit which applications

RESPONSE RULES:
1. Always identify the specific model number and item number when recommending a part
2. Always include the catalog page reference (e.g., "Catalog page B3, PDF page 8")
3. When a customer needs multiple parts for an assembly, list ALL required parts including fasteners
4. If the customer's question is unclear, ask one clarifying question before recommending
5. If you cannot find the answer in the catalog data provided, say so clearly and suggest they call Sequel at 800-553-8273
6. Never guess at specifications — only state what is documented in the catalog
7. Keep answers clear and structured. Use bullet points for part lists.
8. When listing assembly parts, always include the fasteners required (bolts, nuts, washers)

After your answer, you MUST include a structured log block wrapped in exactly this format:
<!--LOG:
{
  "__log__": {
    "intent": "<one of: part_identification, assembly_configuration, compatibility_check, spec_lookup, fastener_request, troubleshooting, alternative_request, out_of_catalog, general_inquiry>",
    "was_answered": <true or false>,
    "answer_confidence": "<high, medium, low, or none>",
    "fallback_triggered": <true or false>,
    "unanswered_reason": <null or string explaining why>,
    "catalog_pages_used": [<list of page IDs like "B1", "C2">],
    "items_surfaced": [<list of item numbers like "900020", "191-DS1">]
  }
}
:LOG-->

This log block will be stripped server-side and never shown to the customer. You must ALWAYS include it.`;

// ── Search / Context Building ──

/**
 * Normalize a query string for matching
 */
function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s\-]/g, '').trim();
}

/**
 * Extract potential 6-digit item numbers from query
 */
function extractItemNumbers(query) {
  const matches = query.match(/\b\d{6}\b/g) || [];
  const codeMatches = query.match(/\b\d{3}-[A-Z]{1,4}\d{0,3}(?:-\d{1,3})?\b/gi) || [];
  return [...new Set([...matches, ...codeMatches])];
}

/**
 * Detect section keywords to prioritize search
 */
function detectSection(query) {
  const normalized = normalize(query);
  const sectionMap = {
    'disc': 'Discs', 'disk': 'Discs', 'hole style': 'Discs',
    'ds1': 'Discs', 'ds2': 'Discs', 'ds3': 'Discs',
    'ds4': 'Discs', 'ds5': 'Discs', 'ds6': 'Discs',
    'rack': 'Racks', 'spine': 'Racks', 'frame': 'Racks', 'crossbar': 'Racks',
    'clip': 'Clips', 'hook': 'Clips',
    'clamp': 'Clamps', 'connector': 'Clamps',
    'bolt': 'Fasteners', 'fastener': 'Fasteners', 'screw': 'Fasteners',
    'nut': 'Fasteners', 'washer': 'Fasteners',
    'hardware': 'Hardware', 'wire': 'Hardware', 'contact wire': 'Hardware',
    'spacer': 'Hardware', 'end cap': 'Hardware'
  };

  for (const [keyword, section] of Object.entries(sectionMap)) {
    if (normalized.includes(keyword)) return section;
  }
  return null;
}

/**
 * Score a catalog page by keyword overlap with query
 */
function scorePage(page, queryWords) {
  const pageText = normalize(page.raw_text || '');
  const pageTitle = normalize(page.title || '');
  let score = 0;

  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (pageTitle.includes(word)) score += 3;
    if (pageText.includes(word)) score += 1;
    const regex = new RegExp(word, 'gi');
    const matches = (pageText.match(regex) || []).length;
    score += Math.min(matches, 5);
  }

  return score;
}

/**
 * Build context from catalog data based on query
 * Three-layer search: exact match → section filtering → keyword scoring
 */
function buildContext(query) {
  const normalized = normalize(query);
  const queryWords = normalized.split(/\s+/).filter(w => w.length >= 2);
  const contextParts = [];
  const pagesUsed = new Set();

  // ── Layer 1: Exact item number match ──
  const itemNumbers = extractItemNumbers(query);
  for (const itemNum of itemNumbers) {
    const product = productsFlat[itemNum] || productsFlat[itemNum.toUpperCase()];
    if (product) {
      contextParts.push(`EXACT PRODUCT MATCH:\n${JSON.stringify(product, null, 2)}`);
      if (product.catalog_page) pagesUsed.add(product.catalog_page);
    }
  }

  // ── Layer 2: Section filtering ──
  const detectedSection = detectSection(query);
  let filteredPages = catalogPages;
  if (detectedSection && detectedSection !== 'Fasteners') {
    const sectionPages = catalogPages.filter(p => p.section === detectedSection);
    const otherPages = catalogPages.filter(p => p.section !== detectedSection);
    filteredPages = [...sectionPages, ...otherPages];
  }

  // ── Layer 3: Keyword scoring across catalog pages ──
  const scoredPages = filteredPages.map(page => ({
    page,
    score: scorePage(page, queryWords)
  })).sort((a, b) => b.score - a.score);

  const topPages = scoredPages.filter(sp => sp.score > 0).slice(0, 5);
  for (const { page } of topPages) {
    contextParts.push(`CATALOG PAGE ${page.page_id} (${page.title}, PDF page ${page.pdf_page}):\n${page.raw_text}`);
    pagesUsed.add(page.page_id);
  }

  // ── Check assemblies ──
  const assemblyKeywords = ['assembly', 'assemble', 'build', 'parts needed', 'put together', 'configuration', 'setup', 'set up', 'what do i need'];
  const isAssemblyQuery = assemblyKeywords.some(kw => normalized.includes(kw));

  if (isAssemblyQuery || detectedSection === 'Racks') {
    for (const asm of assemblies) {
      const asmText = normalize(`${asm.name} ${asm.description} ${asm.application}`);
      const relevance = queryWords.filter(w => asmText.includes(w)).length;
      if (relevance > 0 || isAssemblyQuery) {
        contextParts.push(`ASSEMBLY: ${asm.name}\n${JSON.stringify(asm, null, 2)}`);
      }
    }
  }

  // ── Check fasteners ──
  const fastenerKeywords = ['bolt', 'nut', 'washer', 'screw', 'fastener', 'rivet', 'hardware'];
  const isFastenerQuery = fastenerKeywords.some(kw => normalized.includes(kw));
  if (isFastenerQuery) {
    contextParts.push(`FASTENER SPECIFICATIONS:\n${JSON.stringify(fasteners, null, 2)}`);
  }

  // ── Check selection guides ──
  const guideKeywords = ['which', 'what type', 'what kind', 'choose', 'choosing', 'select', 'selecting', 'recommend', 'best', 'right', 'should i use', 'do i need', 'what do i need'];
  const isGuideQuery = guideKeywords.some(kw => normalized.includes(kw));

  if (isGuideQuery) {
    for (const guide of selectionGuides) {
      const guideText = normalize(`${guide.title} ${guide.description}`);
      const relevance = queryWords.filter(w => guideText.includes(w)).length;
      if (relevance > 0) {
        contextParts.push(`SELECTION GUIDE: ${guide.title}\n${JSON.stringify(guide, null, 2)}`);
      }
    }
    if (contextParts.filter(p => p.startsWith('SELECTION GUIDE')).length === 0) {
      for (const guide of selectionGuides) {
        contextParts.push(`SELECTION GUIDE: ${guide.title}\n${JSON.stringify(guide, null, 2)}`);
      }
    }
  }

  // Fallback: include top catalog pages
  if (contextParts.length === 0) {
    for (const page of catalogPages.slice(0, 5)) {
      contextParts.push(`CATALOG PAGE ${page.page_id} (${page.title}):\n${page.raw_text}`);
      pagesUsed.add(page.page_id);
    }
    for (const guide of selectionGuides.slice(0, 2)) {
      contextParts.push(`SELECTION GUIDE: ${guide.title}\n${JSON.stringify(guide, null, 2)}`);
    }
  }

  // Cap context length (~6000 tokens ≈ ~24000 chars)
  let context = contextParts.join('\n\n---\n\n');
  if (context.length > 24000) {
    context = context.substring(0, 24000) + '\n\n[Context truncated for length]';
  }

  return { context, pagesUsed: Array.from(pagesUsed) };
}

/**
 * Parse the __log__ block from the model response
 */
function parseLogBlock(response) {
  const logMatch = response.match(/<!--LOG:\s*([\s\S]*?)\s*:LOG-->/);
  if (!logMatch) {
    return {
      cleanResponse: response,
      logData: {
        intent: 'unknown', was_answered: true, answer_confidence: 'medium',
        fallback_triggered: false, unanswered_reason: null,
        catalog_pages_used: [], items_surfaced: []
      }
    };
  }

  let logData;
  try {
    const parsed = JSON.parse(logMatch[1]);
    logData = parsed.__log__ || parsed;
  } catch (e) {
    console.error('[RAGAgent] Failed to parse log block:', e.message);
    logData = {
      intent: 'unknown', was_answered: true, answer_confidence: 'medium',
      fallback_triggered: false, unanswered_reason: null,
      catalog_pages_used: [], items_surfaced: []
    };
  }

  const cleanResponse = response.replace(/<!--LOG:[\s\S]*?:LOG-->/g, '').trim();
  return { cleanResponse, logData };
}

/**
 * Main chat handler — called by the chat route
 */
async function handleChat(message, conversationHistory = []) {
  const { context, pagesUsed } = buildContext(message);

  // Build OpenAI messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // Add conversation history (last 10 exchanges)
  const recentHistory = conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current message with context
  messages.push({
    role: 'user',
    content: `CATALOG CONTEXT (use this data to answer the question):\n\n${context}\n\n---\n\nCUSTOMER QUESTION: ${message}`
  });

  // Call OpenAI API
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 2048,
    temperature: 0.3
  });

  const rawResponse = response.choices[0].message.content;

  // Parse log block and clean response
  const { cleanResponse, logData } = parseLogBlock(rawResponse);

  // Merge pagesUsed
  const allPages = [...new Set([...pagesUsed, ...(logData.catalog_pages_used || [])])];
  logData.catalog_pages_used = allPages;

  return {
    response: cleanResponse,
    logData
  };
}

module.exports = { handleChat, buildContext };
