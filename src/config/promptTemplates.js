export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Gegeben sind:
       Startkonzept (S): "${startText || "No context"}"
       Endkonzept (E): "${endText || "No context"}"
       Positionswert (P): ${position.toFixed(2)} auf einer Skala von 0 (starke Nähe zu S) bis 1 (starke Nähe zu E).

       Erzeuge ein einzelnes Wort oder eine kurze Phrase auf deutsch, die thematisch zwischen S und E vermittelt.
       Wenn P nahe bei 0 liegt, soll der Begriff stärker mit S verbunden sein, aber noch eine Beziehung zu E haben.
       Wenn P nahe bei 1 liegt, soll der Begriff stärker mit E verbunden sein, aber noch eine Beziehung zu S haben.
       Werte dazwischen repräsentieren fließende Übergänge zwischen S und E.

       Beispiel:
       S = "Ernährung", E = "Fußball", P = 0.5 → Ergebnis: "Leistungssteigerung"
       S = "Ernährung", E = "Fußball", P = 0.25 → Ergebnis: "Gewichtsmanagement"
       S = "Ernährung", E = "Fußball", P = 0.75 → Ergebnis: "Spielvorbereitung"

       Wichtig: Gebe nur das Ergebnis zurück als reinen Text ohne Anführungszeichen und ohne "Ergebnis:".

       Die Länge der Antwort soll sich an der Länge von S und E orientieren:  
       - Sind S und E nur ein einzelnes Wort, soll die Antwort ebenfalls nur ein Wort sein.  
       - Sind S und E ein kurzer Satz, soll die Antwort ebenfalls ein kurzer Satz sein.  
       - Sind S und E ein längerer Absatz, soll die Antwort eine vergleichbare Länge haben.`,
  
    RELATIONSHIP_ARROW: ({ textFromTextcard, mappedArrowLength }) => 
      `Eingabetext: "${textFromTextcard}"  
       Verwandtschaftswert: ${mappedArrowLength} (0 = sehr nah verwandt, 1 = weit entfernt verwandt)  
       
       Erstelle ausschließlich einen neuen Text auf Deutsch, der den Eingabetext fortführt und weiterdenkt.  
       Je niedriger der Verwandtschaftswert, desto enger soll der neue Text thematisch mit dem Eingabetext verknüpft sein.  
       Je höher der Verwandtschaftswert, desto weiter darf der neue Text thematisch vom Eingabetext abweichen.  
       
       Die Antwort darf ausschließlich den generierten Text enthalten – keine Einleitungen, Überschriften oder Erklärungen.  
       
       Die Länge der Antwort soll sich an der Länge des Eingabetexts orientieren:  
       - Ist der Eingabetext ein einzelnes Wort, soll die Antwort ebenfalls nur ein Wort sein.  
       - Ist der Eingabetext ein kurzer Satz, soll die Antwort ebenfalls ein kurzer Satz sein.  
       - Ist der Eingabetext ein längerer Absatz, soll die Antwort eine vergleichbare Länge haben.`, 
    
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
      `Eingabetext: "${text}"`,

    DEFAULT: (message) => message
};
  
// Optional: Weitere Template-Sets
export const TECHNICAL_PROMPTS = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Generate technical term between ${startText} and ${endText} at ${position}`
};