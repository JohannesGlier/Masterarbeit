export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText }) => 
      `Generate 10 connecting points between the concepts "${startText}" and "${endText}".
      The list should represent a conceptual gradient from the first to the second term.
      Return only short headlines, keywords, or phrases.
      Return the result as a JSON array with each item as a string.`, 
  
    RELATIONSHIP_ARROW: ({ textFromTextcard }) => 
      `Input term: ${textFromTextcard}
      Generate 10 thematically related terms or texts based on the input term, where:
      - The first item is thematically very close to the input term.
      - The last item is thematically distant but still has a conceptual connection.
      - Items 2 to 9 create a smooth conceptual gradient from the first to the last.
      - Each item should be approximately the same length as the input term (±20% character count).
      - Return the result as a JSON array with each item as a string.`, 
    
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
      `Inputtext: "${text}"`,

    NEIGHBOR_BASED_TEXTCARD: ({ text, mousePosX, mousePosY }) => 
    `Gegeben sind:
    Kontext (Textkarten mit Positionen): ${text || "No context"}
    Position der neuen Textkarte (E): x: ${mousePosX}, y: ${mousePosY}

    Generiere eine neue Textkarte an der Position (${mousePosX}, ${mousePosY}).
    Der Textinhalt der neuen Karte soll thematisch zu den bestehenden Textkarten passen.
    Die Position der neuen Karte beeinflusst den Inhalt:
    - Nah an einer bestehenden Karte → direkte Ergänzung oder Vertiefung des Themas.
    - Zwischen zwei Karten → eine Verbindung zwischen den Themen herstellen.
    - Weit entfernt von anderen Karten → neuer Gedanke innerhalb des Kontexts.
    - Falls eine benachbarte Karte keinen Text hat, kann die neue Karte eine Hypothese oder eine sinnvolle Fortsetzung sein.
    
    Gib die Ergebnisse als reinen Text zurück und nicht in einem Json-Objekt!
    Die Antwort darf ausschließlich den generierten Text enthalten ohne Anführungszeichen.`,

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