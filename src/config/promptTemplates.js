export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Das Wort oder der Text soll sich auf einer Skala zwischen ${startText || "No context"} und ${endText || "No context"} befinden. 
      Eine Zahl von 0 bedeutet genau ${startText || "No context"}, eine Zahl von 1 bedeutet genau ${endText || "No context"}. 
      Eine Zahl von "0.7" bedeutet, dass das Wort oder der Text eher in Richtung ${endText || "No context"} tendiert, 
      aber noch in Verbindung mit dem Wort oder Text ${startText || "No context"} steht.
      Eine Zahl von "0.2" bedeutet, dass das Wort oder der Text eher in Richtung ${startText || "No context"} tendiert, 
      ber noch in Verbindung mit dem Wort oder Text ${endText || "No context"} steht.
      Gib mir genau ein passendes Wort oder einen passenden Text zurück für die Zahl ${position.toFixed(2)}`,
  
    TEXT_SUMMARY: (text) => 
      `Summarize this text in 3 bullet points:\n"${text}"`,
    
    DEFAULT: (message) => message
};
  
// Optional: Weitere Template-Sets
export const TECHNICAL_PROMPTS = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Generate technical term between ${startText} and ${endText} at ${position}`
};