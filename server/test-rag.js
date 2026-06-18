require('dotenv').config();
const { chunkText, generateEmbedding, cosineSimilarity, queryKnowledgeChunks } = require('./services/ragService');

async function test() {
  console.log('Testing RAG and GenAI pipeline elements...');
  
  // 1. Test Text Chunking
  const sampleText = 'This is a long text detailing internal code rules. All functions must have docstrings. We use error-first callbacks. We also write unit tests for each utility. All variables must be declared using const. Double quotes are preferred for strings.';
  const chunks = chunkText(sampleText, 60, 10);
  console.log('\n--- Text Chunking Output ---');
  console.log(`Generated ${chunks.length} chunks:`);
  chunks.forEach((c, idx) => console.log(`Chunk ${idx + 1}: "${c}"`));
  
  // 2. Test Embedding Generation
  console.log('\n--- Embedding Generation ---');
  const embed = await generateEmbedding('We use error-first callbacks.');
  console.log(`Embedding generated successfully. Dimensions: ${embed.length}`);
  if (embed.length !== 768) {
    console.warn(`Warning: expected 768 dimensions, got ${embed.length}. (Check if Gemini or local fallback vector was returned).`);
  }
  
  // 3. Test Cosine Similarity
  console.log('\n--- Cosine Similarity ---');
  const vecA = [1, 0, 1];
  const vecB = [1, 0, 1];
  const vecC = [0, 1, 0];
  const simIdentical = cosineSimilarity(vecA, vecB);
  const simOrthogonal = cosineSimilarity(vecA, vecC);
  console.log(`Similarity (Identical): ${simIdentical} (Expected: 1)`);
  console.log(`Similarity (Orthogonal): ${simOrthogonal} (Expected: 0)`);
  
  // 4. Test RAG Vector Search Query
  console.log('\n--- Vector Search Query ---');
  // Create a mock dataset of embedded chunks
  const knowledgeBase = [
    { text: 'All functions must have docstrings.', source: 'standards.txt' },
    { text: 'We use error-first callbacks.', source: 'standards.txt' },
    { text: 'All variables must be declared using const.', source: 'standards.txt' }
  ];
  
  // Generate embeddings for the mock dataset
  const embeddedKB = await Promise.all(
    knowledgeBase.map(async (item) => {
      const embedding = await generateEmbedding(item.text);
      return { ...item, embedding };
    })
  );
  
  // Query
  const query = 'What rules apply to function declarations and code descriptions?';
  console.log(`Query: "${query}"`);
  const matches = await queryKnowledgeChunks(embeddedKB, query, 2);
  console.log('\nSearch Results:');
  matches.forEach((m, idx) => {
    console.log(`Match ${idx + 1}: "${m.text}" (Source: ${m.source}, Score: ${m.similarity.toFixed(4)})`);
  });
  
  console.log('\nAll RAG engine tests completed successfully!');
}

test().catch(err => {
  console.error('Test failed:', err);
});
