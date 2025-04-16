import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { texts } = req.body;

    // Validierung: Stelle sicher, dass 'texts' ein Array ist und nicht leer ist
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Invalid input: Expected a non-empty array of texts.' });
    }

    // --- OpenAI Embedding API Aufruf ---
    console.log(`[API Route] Requesting embeddings for ${texts.length} texts...`);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });
    console.log(`[API Route] Received embeddings from OpenAI.`);

    // --- Verarbeitung der Antwort ---
    const embeddingsData = response.data; // Array von { object, index, embedding }

    // Erstelle das Ergebnis-Array
    const results = texts.map((text, index) => {
      const embeddingObj = embeddingsData.find(emb => emb.index === index);
      return {
        text: text, // Der ursprüngliche Text
        embedding: embeddingObj ? embeddingObj.embedding : null, // Der Vektor
      };
    });

    // Filtere vorsichtshalber Einträge ohne Embedding heraus
    const validResults = results.filter(result => result.embedding !== null);

    if (validResults.length !== texts.length) {
        console.warn("[API Route] Warning: Some texts might not have received embeddings.");
    }

    res.status(200).json(validResults);
  } catch (error) {
    // --- Fehlerbehandlung ---
    console.error('[API Route] Error calling OpenAI Embeddings API:', error);

    res.status(500).json({
        error: 'Failed to get embeddings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}