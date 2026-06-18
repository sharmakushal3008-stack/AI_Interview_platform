const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Split text into chunks of `size` characters, with `overlap` character overlaps.
 * Preserves word boundaries.
 */
function chunkText(text, size = 800, overlap = 100) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentChunk.push(word);
    currentLength += word.length + 1; // including space

    if (currentLength >= size) {
      chunks.push(currentChunk.join(' '));
      
      // Determine overlap words
      let overlapWords = [];
      let overlapLength = 0;
      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const w = currentChunk[j];
        if (overlapLength + w.length + 1 > overlap) break;
        overlapWords.unshift(w);
        overlapLength += w.length + 1;
      }
      
      currentChunk = overlapWords;
      currentLength = overlapLength;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks.filter(c => c.trim().length > 10);
}

/**
 * Generate 768-dimension vector embedding using Gemini text-embedding-004.
 */
async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) {
    // Return dummy 768-dim embedding for zero-setup offline/local development
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  try {
    const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await embedModel.embedContent(text);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error('No embedding values returned from Gemini API');
  } catch (err) {
    console.error('Gemini embedding API failed:', err.message);
    // Return mock vector in case of failure to maintain system execution
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Compute cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search across a set of knowledge chunks for the top K matching blocks.
 */
async function queryKnowledgeChunks(chunks, queryText, topK = 3) {
  if (!chunks || chunks.length === 0 || !queryText) return [];

  try {
    const queryVec = await generateEmbedding(queryText);
    const scoredChunks = chunks.map(chunk => {
      // Handles mongoose docs or pure JSON
      const chunkData = typeof chunk.toObject === 'function' ? chunk.toObject() : chunk;
      const similarity = cosineSimilarity(queryVec, chunkData.embedding);
      return { ...chunkData, similarity };
    });

    // Sort descending
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks.slice(0, topK);
  } catch (err) {
    console.error('Error querying knowledge chunks:', err.message);
    
    // Fallback: Term frequency matching if vector search encounters errors
    const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const scoredChunks = chunks.map(chunk => {
      const chunkData = typeof chunk.toObject === 'function' ? chunk.toObject() : chunk;
      let matches = 0;
      const textLower = (chunkData.text || '').toLowerCase();
      queryTerms.forEach(term => {
        if (textLower.includes(term)) matches++;
      });
      return { ...chunkData, similarity: matches / (queryTerms.length || 1) };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks.slice(0, topK);
  }
}

module.exports = {
  chunkText,
  generateEmbedding,
  cosineSimilarity,
  queryKnowledgeChunks
};
