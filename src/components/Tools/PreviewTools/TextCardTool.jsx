import React, { useState, useEffect, useMemo } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { ChatGPTService } from "@/services/ChatGPTService";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";
import {
  getElementAtPosition,
  getTextFromElement,
  getTextFromAllElement,
  findTopVisibleNearbyElements,
  getTextFromAllElements
} from "@/utils/elementUtils";
import { useCursor } from '@/components/Canvas/CursorContext';
import { useLanguage } from "@/components/Canvas/LanguageContext";

const TextCardTool = ({
  canvasRef,
  canvasWrapperRef,
  addTextcard,
  elements,
}) => {
  const { offsetRef, scaleRef, setSelectedTool } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRectangle, setTempRectangle] = useState(null);
  const { language } = useLanguage();
  const chatGPTService = useMemo(() => {
    console.log(`Initializing ChatGPTService with language: ${language}`);
    return new ChatGPTService(language);
  }, [language]);
  const [preview, setPreview] = useState([]);
  const { setCursorStyle } = useCursor();

  useEffect(() => {
    if (preview.length === 0) {
      setCursorStyle("crosshair");
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setIsDrawing(true);
      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle((prevRect) => ({
        x: prevRect.x,
        y: prevRect.y,
        width: mousePos.x - prevRect.x,
        height: mousePos.y - prevRect.y,
      }));
    };

    const handleMouseUp = async (event) => {
      if (event.button !== 0) return;

      let significantDrag = false;
      let normalizedRect = null;

      if (tempRectangle) {
        normalizedRect = {
          x: tempRectangle.width < 0 ? tempRectangle.x + tempRectangle.width : tempRectangle.x,
          y: tempRectangle.height < 0 ? tempRectangle.y + tempRectangle.height : tempRectangle.y,
          width: Math.abs(tempRectangle.width),
          height: Math.abs(tempRectangle.height),
        };

        const MIN_DRAG_DIMENSION = 5; // Mindestgröße in Weltkoordinaten

        if (normalizedRect.width > MIN_DRAG_DIMENSION || normalizedRect.height > MIN_DRAG_DIMENSION) {
          significantDrag = true;
        }
      }

      if (significantDrag && normalizedRect) {
        // Benutzerdefiniertes Rechteck durch Ziehen
        addTextcard({
          x: normalizedRect.x,
          y: normalizedRect.y,
          width: normalizedRect.width,
          height: normalizedRect.height,
          text: "",
          aiGenerated: false,
        });
        setSelectedTool("Pointer");
      } else {
        const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
        const elementUnderMouse = getElementAtPosition(elements, mousePos.x, mousePos.y);

        createPreviewTextcard(mousePos);
        setIsDrawing(false);
        setTempRectangle(null);
        setCursorStyle("wait");

        let textContent = "";
        try {
          textContent = await getTextcardContent(elementUnderMouse, mousePos);
        } catch (error) {
          console.error("Fehler beim Erstellen der Textkarte:", error);
        } finally {
          console.log("Erstellen der Textkarte abgeschlossen, resetting state...");
          setCursorStyle("default");
          setSelectedTool("Pointer");
          setPreview([]);
          createTextcard(mousePos, textContent);
        }
      }

      setTempRectangle(null);
      setIsDrawing(false);
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    tempRectangle,
    scaleRef,
    offsetRef,
    setPreview,
  ]);

  const createPreviewTextcard = (mousePos) => {
    const defaultWidth = 200;
    const defaultHeight = 75;
    const previewsData = [];

    previewsData.push({
      key: `preview-${defaultWidth}`,
      x: mousePos.x - defaultWidth / 2,
      y: mousePos.y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      text: "",
      isLoading: true,
    });

    setPreview(previewsData);
  }

  const createTextcard = (mousePos, text) => {
    const defaultWidth = 200;
    const defaultHeight = 75;
    const finalTextcard = {
      x: mousePos.x - defaultWidth / 2,
      y: mousePos.y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      text: text,
      aiGenerated: true,
    };
    addTextcard(finalTextcard);
  };

  const getTextcardContent = async (hoveredElement, mousePos) => {
    let promptText = "";
    
    if(hoveredElement) {
      // Ich bin über einer Textkarte oder einem Bereich
      promptText = getTextFromElement(hoveredElement, elements);

      try {
        console.log("Eingabe für Prompt:\n", promptText);
        const response = await chatGPTService.neighborbasedTextcard(promptText);
        console.log("ChatGPT Response:", response.content);
        return response.content;
      } catch (error) {
        throw error;
      }
    }
    else {
      // Ich bin auf dem Canvas
      promptText = getTextFromAllElement(elements);

      if(elements.length === 0 || promptText === "[]" || checkPromptTextStrict(promptText)) {
        try {
          // Wenn kein Element auf dem Canvas
          const response = await chatGPTService.generateFirstTextcard(promptText);
          console.log("ChatGPT Response:", response.content);
          return response.content;
        } catch (error) {
          throw error;
        }
      } else {
        const nearestElements = findTopVisibleNearbyElements(mousePos, elements, 4, 0.85);
        promptText = getTextFromAllElements(nearestElements);

        try {
          console.log("Eingabe für Prompt:\n", promptText);
          const response = await chatGPTService.neighborbasedTextcard2(promptText);
          console.log("ChatGPT Response:", response.content);
          return response.content;
        } catch (error) {
          throw error;
        }       
      }
    }
  };

  function checkPromptTextStrict(promptText) {
    if (typeof promptText !== 'string') {
      console.warn("checkPromptTextStrict: Input ist kein String!");
      return false;
    }
    const trimmedText = promptText.trim();
    if (trimmedText === "[]") {
      return true;
    }
    try {
      const parsedData = JSON.parse(trimmedText);
      if (!Array.isArray(parsedData)) {
        console.warn("checkPromptTextStrict: Geparsed, aber kein Array:", parsedData);
        return false;
      }
      if (parsedData.length === 0) {
          return false;
      }
      return parsedData.every(element => {
        return (
          element &&                     
          typeof element === 'object' &&
          Object.keys(element).length === 1 &&
          element.hasOwnProperty('text') &&
          element.text === ""
        );
      });
  
    } catch (e) {
      console.warn("checkPromptTextStrict: Fehler beim Parsen oder Prüfen:", e.message);
      return false;
    }
  }

  return (
    <div>
      {preview.map(preview => (
        <PreviewTextcard
          key={preview.key}
          finalTop={preview.y * scaleRef.current + offsetRef.current.y}
          finalLeft={preview.x * scaleRef.current + offsetRef.current.x}
          scaledWidth={preview.width * scaleRef.current}
          scaledHeight={preview.height * scaleRef.current}
          isLoading={preview.isLoading}
        />
      ))}
      {tempRectangle && (
        <div
          style={{
            position: "absolute",
            top: (tempRectangle.height < 0 ? tempRectangle.y + tempRectangle.height : tempRectangle.y) * scaleRef.current + offsetRef.current.y,
            left: (tempRectangle.width < 0 ? tempRectangle.x + tempRectangle.width : tempRectangle.x) * scaleRef.current + offsetRef.current.x,
            width: `${Math.abs(tempRectangle.width) * scaleRef.current}px`,
            height: `${Math.abs(tempRectangle.height) * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.3)",
            border: "1px dashed blue",
            borderRadius: "25px",
            pointerEvents: "none",
            zIndex: 3999,
          }}
        />
      )}
    </div>
  );
};

export default TextCardTool;
