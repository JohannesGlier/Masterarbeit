export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Das Wort oder der Text soll sich auf einer Skala zwischen ${startText || "No context"} und ${endText || "No context"} befinden. 
      Eine Zahl von 0 bedeutet genau ${startText || "No context"}, eine Zahl von 1 bedeutet genau ${endText || "No context"}. 
      Eine Zahl von "0.7" bedeutet, dass das Wort oder der Text eher in Richtung ${endText || "No context"} tendiert, 
      aber noch in Verbindung mit dem Wort oder Text ${startText || "No context"} steht.
      Eine Zahl von "0.2" bedeutet, dass das Wort oder der Text eher in Richtung ${startText || "No context"} tendiert, 
      ber noch in Verbindung mit dem Wort oder Text ${endText || "No context"} steht.
      Gib mir genau ein passendes Wort oder einen passenden Text zurück für die Zahl ${position.toFixed(2)}`,
  
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