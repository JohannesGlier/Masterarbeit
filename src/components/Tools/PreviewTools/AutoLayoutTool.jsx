import React, { useRef, useEffect, useCallback } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { ChatGPTService } from "@/services/ChatGPTService";

const AutoLayoutTool = ({
  elements,
  setIsAutoLayoutRunning,
  isAutoLayoutRunning,
  applyAILayout
}) => {
  const { setSelectedTool } = useCanvas();
  const chatGPTService = new ChatGPTService();
  const hasRunForThisMount = useRef(false);

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = "none";
  };

  const performAutoLayout = useCallback(async () => {
    setIsAutoLayoutRunning(true);
    const loadingCursor = "wait";
    const defaultCursor = "auto";

    try {
      const allElementData = elements.map((el) => ({
        id: el.id,
        type: el.type === "textcard" ? "Textkarte" : "Bereich",
        position: { ...el.position },
        size: { ...el.size },
        ...(el.type === "textcard" && { text: el.text }),
        // Sicherstellen, dass der Typ 'rectangle' korrekt ist für deine Bereiche
        ...(el.type === "rectangle" && { heading: el.heading }),
      }));
      const promptText = JSON.stringify(allElementData, null, 2);
      console.log("Starte AutoLayout - Eingabe für Prompt:\n", promptText);

      forceCursor(loadingCursor);

      const apiResponse = await chatGPTService.autoLayout(promptText);
      console.log("ChatGPT Raw Response Object:", apiResponse);

      if (apiResponse && apiResponse.content) {
        const contentString = apiResponse.content;
        console.log("Type of content to parse:", typeof contentString)
        console.log("Content to parse (trimmed):", `'${contentString.trim()}'`);

        try {
          const cleanedString = contentString.replace(/\u00A0/g, ' ').trim(); // \u00A0 ist der Unicode für non-breaking space
          console.log("Cleaned Content to parse:", `'${cleanedString}'`); 

          const parsedResponse = JSON.parse(cleanedString);
          console.log("Parsed ChatGPT Response:", parsedResponse);
          if (parsedResponse && Array.isArray(parsedResponse)) {
            console.log("Calling applyAILayout...");
            applyAILayout(parsedResponse);
          } else {
            console.error("Parsed response is not a valid array:", parsedResponse);
            alert("Fehler: Ungültiges Datenformat vom Server erhalten.");
          }
        } catch (parseError) {
          console.error("Fehler beim Parsen:", parseError);
          console.error("Original Content Type:", typeof contentString);
          console.error("Original Content Value for Parse Error:", contentString);
          alert("Fehler: Ungültige Antwort vom Server.");
        }
      } else {
        console.warn("Keine gültige Antwortstruktur.", apiResponse);
        alert("Fehler: Ungültige Antwortstruktur vom Server.");
      }
    } catch (error) {
      console.error("Fehler während des Auto-Layouts:", error);
      alert(`Fehler beim Anordnen: ${error.message || error}`);
    } finally {
      console.log("AutoLayout beendet.");
      forceCursor(defaultCursor);
      setSelectedTool("Pointer");
      setIsAutoLayoutRunning(false);
    }
  }, [
    elements,
    setIsAutoLayoutRunning,
    setSelectedTool,
    chatGPTService,
    forceCursor,
    applyAILayout,
  ]);

  useEffect(() => {
    console.log("AutoLayoutTool Effect triggered.");

    if (isAutoLayoutRunning) {
      console.log("Effect skipped: AutoLayout is already running globally.");
      return;
    }

    if (hasRunForThisMount.current) {
      console.log("Effect skipped: Already ran for this specific mount instance.");
      return;
    }

    console.log("Effect condition met: Starting performAutoLayout.");
    hasRunForThisMount.current = true;
    performAutoLayout();

    return () => {
      console.log("AutoLayoutTool Cleanup (Unmount)");
      forceCursor("auto");
    };
  }, []);

  return null;
};

export default AutoLayoutTool;
