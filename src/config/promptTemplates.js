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
    
    DEFAULT: (message) => message
};
  
// Optional: Weitere Template-Sets
export const TECHNICAL_PROMPTS = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Generate technical term between ${startText} and ${endText} at ${position}`
};