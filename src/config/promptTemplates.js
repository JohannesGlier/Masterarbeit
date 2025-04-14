export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText }) => 
      `Generate 10 connecting points between the concepts "${startText}" and "${endText}".
      The list should represent a conceptual gradient from the first to the second term.
      Return only short headlines, keywords, or phrases.
      Return the result as a JSON array with each item as a string.`, 
  
    RELATIONSHIP_ARROW: ({ textFromTextcard }) => 
      `**Task Description:**
        Generate exactly 10 thematically related terms or short texts based on the provided input term. 
        These items should represent a conceptual gradient, moving from very close to distantly related.

        **Input:**
        Input Term: ${textFromTextcard}

        **Requirements:**
        1.  **Conceptual Gradient:**
            * The first item (Item 1) in the list must be thematically very close (e.g., synonym, direct association, hypernym/hyponym) to the Input Term (but not the input term itself).
            * The last item (Item 10) must be thematically distant from the Input Term but still possess a recognizable conceptual link or abstract connection. The connection might be indirect or metaphorical.
            * Items 2 through 9 must create a smooth, gradual thematic transition bridging the conceptual gap between the first and the last item. Each step should logically follow the previous one while subtly shifting the theme.
        2.  **Length Consistency:** Each of the 10 generated items should ideally have a character count that is approximately similar to the character count of the Input Term. Aim for within ±20% deviation, but prioritize the quality and coherence of the conceptual gradient if exact length matching conflicts with finding suitable terms.
        3.  **Quantity:** Ensure exactly 10 items are generated in the list.

        **Output Structure:**
        You MUST return the result **exclusively** as a single, valid JSON object.
        * This JSON object must contain exactly one top-level key named: "conceptual_gradient".
        * The value associated with the "conceptual_gradient" key must be a JSON array.
        * This JSON array must contain exactly 10 elements.
        * Each element within the array must be a string representing one of the generated terms or short texts, ordered according to the conceptual gradient (Item 1 = closest, Item 10 = most distant).

        **Example of the Required Output Format (Structure Only):**
        {
          "conceptual_gradient": [
            "string_representing_item_1",
            "string_representing_item_2",
            "string_representing_item_3",
            "string_representing_item_4",
            "string_representing_item_5",
            "string_representing_item_6",
            "string_representing_item_7",
            "string_representing_item_8",
            "string_representing_item_9",
            "string_representing_item_10"
          ]
        }`, 
    
    PROMPT_ARROW_TEXTCARD_INPUT: ({ inputText, promptText }) => 
      `Kontext: "${inputText}".
       User Prompt: "${promptText}". 
       Wende den User Prompt auf den Kontext an.
       Gib die Ergebnisse als reinen Text zurück und nicht in einem Json-Objekt!
       Die Antwort darf ausschließlich den generierten Text enthalten.`,

    PROMPT_ARROW_TEXTCARD: ({ promptText }) => 
      `User Prompt: "${promptText}". 
       Gib die Ergebnisse als reinen Text zurück.
       Die Antwort darf ausschließlich den generierten Text enthalten.`,

    PROMPT_ARROW_INPUT: ({ inputText, promptText }) => 
      `Kontext: "${inputText}".
       User Prompt: "${promptText}". 
       Wende den User Prompt auf den Kontext an.
       Gib die Ergebnisse als JSON zurück.
       Die Antwort darf ausschließlich das JSON-Objekt enthalten.`,

    PROMPT_ARROW: ({ promptText }) => 
      `User Prompt: "${promptText}". 
       Gib die Ergebnisse als JSON zurück.
       Die Antwort darf ausschließlich das JSON-Objekt enthalten.`,

    COMBINE_TEXTCARDS: ({ text1, text2 }) => 
    `Gegeben sind:
      Textkarte 1 (T1): "${text1 || "No context"}"
      Textkarte 2 (T2): "${text2 || "No context"}"

      Erstelle eine originelle Idee, ein Wortspiel, eine Metapher oder ein innovatives Konzept, das beide Begriffe, Phrasen oder Texte (T1 & T2) vereint.

      Beispiel:
      T1 = "Brettspiel"
      T2 = "Fussball"
      Ergebnis = "Kicker"

      Die Länge der Antwort soll sich an der Länge von T1 und T2 orientieren:  
      - Sind T1 und T2 nur einzelne Wörter, soll die Antwort ebenfalls nur ein Wort sein.  
      - Sind T1 und T2 ein kurzer Satz, soll die Antwort ebenfalls ein kurzer Satz sein.  
      - Sind T1 und T2 ein längerer Absatz, soll die Antwort eine vergleichbare Länge haben.
      
      Gib das Ergebnis als reinen Text zurück.
      Die Antwort darf ausschließlich den generierten Text enthalten ohne Anführungszeichen.`,

    SUMMARIZE: ({ text }) => 
      `Eingabetext: "${text}"`,

    SPLIT: ({ text }) => 
      `Split the following text into distinct thematic sections. 
      Format the output strictly as a JSON array where each object has an "id" (sequential, starting from 1) and a "text" field containing the content of that section. 
      If no meaningful split into multiple sections is possible, return an empty array ([]).

      Text to split:
      ${text}`,

    NEIGHBOR_BASED_TEXTCARD: ({ text }) => 
    `Based on the following text:
    ${text || "No input text provided."}

    Generate a concise and thematically related text snippet designed to spark further reflection, inspire new ideas, or offer a thought-provoking angle connected to the input text.

    *Adapt the output format based on the input:*
    - If the input consists only of keywords, single words, or very short bullet points, your output should be a *single relevant keyword or a very short phrase*.
    - Otherwise, your output should be a maximum of 2 sentences.

    Your response should contain *only* the generated text snippet/keyword itself, without any introductory phrases, labels, or quotation marks.`,

    AUTO_LAYOUT: ({ text }) => 
    `Bitte analysiere die folgenden JSON-Daten, die Elemente (jeweils mit einer id) auf einem Canvas repräsentieren. Basierend auf dem Inhalt der 'Textkarte'-Elemente, ordne alle Elemente logisch und übersichtlich an.

    **Aufgaben:**
    1.  Gruppiere thematisch zusammengehörige Textkarten.
    2.  Erstelle bei Bedarf **neue** 'Bereich'-Elemente mit passenden Überschriften ('heading'), um diese Gruppen visuell zu umschließen.
    3.  Weise neu erstellten Bereichen fortlaufende ids zu, beginnend bei 1 (1, 2, ...).
    4.  Aktualisiere die 'position' (und optional 'size') aller Elemente für eine klare räumliche Strukturierung.
    5.  **WICHTIG:** Der 'text' von bestehenden 'Textkarte'-Elementen darf unter keinen Umständen verändert werden.
    6.  **WICHTIG:** Die id von bestehenden Elementen muss exakt beibehalten werden.

    Gib das Ergebnis als valides JSON-Array im exakt gleichen Format wie die Eingabe (inklusive id) zurück. 
    Das Array soll alle ursprünglichen Elemente (mit unveränderter id und aktualisierten Werten) und alle neu erstellten Bereiche (mit neuen ids) enthalten.

    Hier sind die aktuellen Elementdaten: "${text}"`,

    DEFAULT: (message) => message
};
  
// Optional: Weitere Template-Sets
export const TECHNICAL_PROMPTS = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Generate technical term between ${startText} and ${endText} at ${position}`
};