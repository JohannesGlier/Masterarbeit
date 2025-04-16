// Definiere den Endpunkt für die Embeddings-API-Route
const EMBEDDINGS_API_ENDPOINT = '/api/get-embeddings';

class OpenAIService {
  /**
   * Ruft die Backend API Route auf, um Embeddings für eine Liste von Textkarten zu erhalten.
   * @param {Array<Object>} textcards - Das Array der Textkarten-Objekte (wie in deiner Frage gezeigt).
   * @returns {Promise<Array<{text: string, embedding: Array<number>}>>} - Ein Promise, das ein Array von Objekten mit Text und Embedding auflöst.
   * @throws {Error} - Wirft einen Fehler bei Netzwerkproblemen oder wenn die API einen Fehler zurückgibt.
   */
  async getEmbeddingsForCards(textcards) {
    console.log("[Frontend Service] Preparing to get embeddings...");

    // 1. Extrahiere die Texte aus den Karten-Objekten
    const texts = textcards
      .map(card => card.text)
      .filter(text => typeof text === 'string' && text.trim() !== '');

    // Prüfe, ob überhaupt Texte vorhanden sind
    if (texts.length === 0) {
      console.warn("[Frontend Service] No valid texts found in cards. Skipping API call.");
      return []; // Leeres Array zurückgeben, da nichts zu tun ist
    }

    console.log(`[Frontend Service] Sending ${texts.length} texts to ${EMBEDDINGS_API_ENDPOINT}`);

    try {
      // 2. Mache den POST-Request an die API Route
      const response = await fetch(EMBEDDINGS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Sende die Texte im Body, verpackt in einem Objekt mit dem Schlüssel 'texts'
        body: JSON.stringify({ texts: texts }),
      });

      // 3. Prüfe, ob die Anfrage erfolgreich war (Status-Code 2xx)
      if (!response.ok) {
        // Versuche, die Fehlerdetails aus der Antwort zu lesen
        let errorDetails = `HTTP error! Status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetails += errorData.error ? `: ${errorData.error}` : '';
            if (errorData.details) errorDetails += ` (${errorData.details})`;
        } catch (jsonError) {
            // Ignoriere Fehler beim Parsen der Fehler-JSON
        }
        throw new Error(errorDetails);
      }

      // 4. Parse die JSON-Antwort vom Backend
      const results = await response.json();
      return results; // Gib das Array mit {text, embedding} Objekten zurück

    } catch (error) {
      console.error('[Frontend Service] Error getting embeddings:', error);
      // Wirf den Fehler weiter, damit die aufrufende Komponente ihn behandeln kann
      throw error;
    }
  }
}

const openAIService = new OpenAIService();
export default openAIService;