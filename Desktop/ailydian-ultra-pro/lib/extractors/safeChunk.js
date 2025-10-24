/**
 * Safe Semantic Chunker - Token Governor Phase B
 * Respects semantic boundaries: sentence, paragraph, JSON, code, DICOM metadata
 * Target: 6000 tokens/chunk + 350 token overlap
 */

const CHUNK_TARGET = 6000;
const OVERLAP_TOKENS = 350;

// Approximate token count (1 token ≈ 4 characters for English, varies by language)
function estimateTokens(text) {
    const chars = text.length;
    // Medical/scientific text averages ~3.5 chars/token
    return Math.ceil(chars / 3.5);
}

// Detect content type for boundary-aware chunking
function detectContentType(text) {
    const trimmed = text.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            JSON.parse(text);
            return 'json';
        } catch {
            return 'text';
        }
    }

    if (trimmed.includes('DICOM') || trimmed.match(/\(0[0-9A-F]{3},[0-9A-F]{4}\)/)) {
        return 'dicom';
    }

    if (trimmed.match(/^(function|class|const|let|var|import|export)/m)) {
        return 'code';
    }

    if (trimmed.includes('```') || trimmed.match(/^#{1,6}\s/m)) {
        return 'markdown';
    }

    return 'text';
}

// Find semantic boundaries in text
function findSentenceBoundaries(text) {
    const boundaries = [];

    // Sentence endings: . ! ? followed by space or newline
    const sentenceRegex = /[.!?]+[\s\n]+/g;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
        boundaries.push(match.index + match[0].length);
    }

    return boundaries;
}

function findParagraphBoundaries(text) {
    const boundaries = [];

    // Double newline or section markers
    const paragraphRegex = /\n\s*\n/g;
    let match;

    while ((match = paragraphRegex.exec(text)) !== null) {
        boundaries.push(match.index + match[0].length);
    }

    return boundaries;
}

function findJSONObjectBoundaries(text) {
    const boundaries = [];
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === '{' || char === '[') {
            depth++;
        } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
                boundaries.push(i + 1);
            }
        }
    }

    return boundaries;
}

function findCodeBlockBoundaries(text) {
    const boundaries = [];

    // Markdown code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        boundaries.push(match.index + match[0].length);
    }

    // Function/class boundaries
    const funcRegex = /\n\s*(function|class|const|let|var)\s+/g;
    while ((match = funcRegex.exec(text)) !== null) {
        boundaries.push(match.index);
    }

    return boundaries;
}

// Find best split point near target position
function findBestSplitPoint(text, targetPos, contentType) {
    let boundaries = [];

    switch (contentType) {
        case 'json':
            boundaries = findJSONObjectBoundaries(text);
            break;
        case 'code':
            boundaries = findCodeBlockBoundaries(text);
            break;
        case 'markdown':
            boundaries = findParagraphBoundaries(text);
            if (boundaries.length === 0) {
                boundaries = findSentenceBoundaries(text);
            }
            break;
        case 'dicom':
        case 'text':
        default:
            boundaries = findParagraphBoundaries(text);
            if (boundaries.length === 0) {
                boundaries = findSentenceBoundaries(text);
            }
            break;
    }

    // Find closest boundary to target position
    if (boundaries.length === 0) {
        return targetPos;
    }

    let closestBoundary = boundaries[0];
    let minDistance = Math.abs(boundaries[0] - targetPos);

    for (const boundary of boundaries) {
        const distance = Math.abs(boundary - targetPos);
        if (distance < minDistance && boundary <= targetPos + 1000) {
            minDistance = distance;
            closestBoundary = boundary;
        }
    }

    return closestBoundary;
}

// Main chunking function
function safeChunk(text, options = {}) {
    const targetTokens = options.targetTokens || CHUNK_TARGET;
    const overlapTokens = options.overlapTokens || OVERLAP_TOKENS;
    const contentType = options.contentType || detectContentType(text);

    const chunks = [];
    const totalTokens = estimateTokens(text);

    // If text fits in one chunk, return as-is
    if (totalTokens <= targetTokens) {
        return [{
            id: 0,
            text: text,
            tokens: totalTokens,
            start: 0,
            end: text.length,
            type: contentType,
            overlap: false
        }];
    }

    let chunkId = 0;
    let currentPos = 0;

    while (currentPos < text.length) {
        // Estimate character position for target tokens
        const targetChars = Math.floor(targetTokens * 3.5);
        let endPos = Math.min(currentPos + targetChars, text.length);

        // Find best semantic split point
        if (endPos < text.length) {
            endPos = findBestSplitPoint(text.substring(0, endPos), endPos, contentType);
        }

        const chunkText = text.substring(currentPos, endPos);
        const chunkTokens = estimateTokens(chunkText);

        chunks.push({
            id: chunkId++,
            text: chunkText,
            tokens: chunkTokens,
            start: currentPos,
            end: endPos,
            type: contentType,
            overlap: chunkId > 0
        });

        // Calculate overlap for next chunk (sliding window)
        const overlapChars = Math.floor(overlapTokens * 3.5);
        currentPos = Math.max(currentPos + 1, endPos - overlapChars);

        // Prevent infinite loop
        if (endPos === currentPos) {
            currentPos = endPos;
        }
    }

    return chunks;
}

// Multilingual chunking with language detection
function multilingualChunk(text, options = {}) {
    // Detect language (simple heuristic)
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;

    let language = 'en';
    let charsPerToken = 3.5;

    if (cyrillicPattern.test(text)) {
        language = 'ru';
        charsPerToken = 3.0;
    } else if (arabicPattern.test(text)) {
        language = 'ar';
        charsPerToken = 2.8;
    } else if (cjkPattern.test(text)) {
        language = 'zh';
        charsPerToken = 1.5; // CJK uses more tokens
    }

    return safeChunk(text, { ...options, charsPerToken, language });
}

// Chunk statistics for monitoring
function getChunkStats(chunks) {
    if (chunks.length === 0) {
        return { count: 0, avgTokens: 0, minTokens: 0, maxTokens: 0, variance: 0 };
    }

    const tokens = chunks.map(c => c.tokens);
    const sum = tokens.reduce((a, b) => a + b, 0);
    const avg = sum / tokens.length;
    const min = Math.min(...tokens);
    const max = Math.max(...tokens);

    const variance = tokens.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / tokens.length;
    const stdDev = Math.sqrt(variance);

    return {
        count: chunks.length,
        avgTokens: Math.round(avg),
        minTokens: min,
        maxTokens: max,
        variance: Math.round(variance),
        stdDev: Math.round(stdDev),
        totalTokens: sum
    };
}

module.exports = {
    safeChunk,
    multilingualChunk,
    getChunkStats,
    estimateTokens,
    detectContentType,
    CHUNK_TARGET,
    OVERLAP_TOKENS
};
