import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { ChatGPTService } from "@/services/ChatGPTService";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";
import {
  getElementAtPosition,
  getElementsInCircle,
  getTextFromElement,
  getTextFromAllElement,
  findTopVisibleNearbyElements,
  getTextFromAllElements
} from "@/utils/elementUtils";
import { useCursor } from '@/components/Canvas/CursorContext';
import { useLanguage } from "@/components/Canvas/LanguageContext";
import CircularSelector from "@/components/Helper/Textcard/CircularSelector";


const DEFAULT_CIRCLE_RADIUS = 200;
const MIN_CIRCLE_RADIUS = 50;
const MAX_CIRCLE_RADIUS = 350;
const CIRCLE_SCROLL_SENSITIVITY = 0.15;
const BLINK_DURATION_MS = 400;
const CIRCLE_VISIBILITY_DELAY_MS = 250;
const DRAG_THRESHOLD_TO_HIDE_CIRCLE = 20;
const MIN_DRAG_DIMENSION_FOR_TEXTCARD = 40;

const TextCardTool = ({
  canvasRef,
  canvasWrapperRef,
  addTextcard,
  elements,
}) => {
  const { offsetRef, scaleRef, setSelectedTool, setSelectedElements, selectedElements } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRectangle, setTempRectangle] = useState(null);
  const { language } = useLanguage();
  const chatGPTService = useMemo(() => {
    console.log(`Initializing ChatGPTService with language: ${language}`);
    return new ChatGPTService(language);
  }, [language]);
  const [preview, setPreview] = useState([]);
  const { setCursorStyle } = useCursor();

  const circleVisibilityTimerRef = useRef(null);
  const hasDraggedSignificantlyToHideCircleRef = useRef(false);

  const [circleSelector, setCircleSelector] = useState({
    isActive: false,      // Maustaste ist für Kreisinteraktion gedrückt
    isInitiated: false,   // Zeigt an, dass diese mousedown-Aktion eine Kreisaktion sein könnte/war
    x: 0,                 // Weltkoordinaten des Mittelpunkts
    y: 0,
    radius: DEFAULT_CIRCLE_RADIUS,
    isVisible: false,     // Steuert die Sichtbarkeit des Kreises
    isBlinking: false,    // Steuert die Blink-Animation
  });

  const resetAllInteractionStates = useCallback(() => {
    setIsDrawing(false);
    setTempRectangle(null);
    setCircleSelector({
      isActive: false,
      isInitiated: false,
      x: 0,
      y: 0,
      radius: DEFAULT_CIRCLE_RADIUS,
      isVisible: false,
      isBlinking: false,
    });
    setPreview([]);
    setSelectedElements([]);
    setCursorStyle("default");
    setSelectedTool("Pointer");
  }, [setCursorStyle]);

  useEffect(() => {
    if (preview.length === 0 && !circleSelector.isVisible && !isDrawing) {
      setCursorStyle("crosshair");
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      const hoveredElement = getElementAtPosition(elements, mousePos.x, mousePos.y);
      const isOverFrame = hoveredElement && hoveredElement.type === "rectangle";

      hasDraggedSignificantlyToHideCircleRef.current = false;
      setIsDrawing(true);
      setTempRectangle({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });

      setCircleSelector({
        isActive: true,
        isInitiated: true,
        x: mousePos.x,
        y: mousePos.y,
        radius: DEFAULT_CIRCLE_RADIUS,
        isVisible: false,
        isBlinking: false,
      });

      if (circleVisibilityTimerRef.current) {
        clearTimeout(circleVisibilityTimerRef.current);
      }

      if (!isOverFrame) {
        circleVisibilityTimerRef.current = setTimeout(() => {
          setCircleSelector(prev => {
            if (prev.isActive && !hasDraggedSignificantlyToHideCircleRef.current) {
              return { ...prev, isVisible: true };
            }
            return prev;
          });
        }, CIRCLE_VISIBILITY_DELAY_MS);
      }

      const affectedElements = getElementsInCircle(
          elements,
          { x: mousePos.x, y: mousePos.y },
          circleSelector.radius
      );
      setSelectedElements(affectedElements);
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      const dX = mousePos.x - tempRectangle.x;
      const dY = mousePos.y - tempRectangle.y;

      setTempRectangle((prevRect) => ({
        ...prevRect,
        width: dX,
        height: dY,
      }));

      // Logik zum Ausblenden des Kreises bei signifikantem Drag
      if (circleSelector.isActive && !hasDraggedSignificantlyToHideCircleRef.current) {
        const dragDistance = Math.sqrt(dX * dX + dY * dY);
        if (dragDistance > DRAG_THRESHOLD_TO_HIDE_CIRCLE) {
          hasDraggedSignificantlyToHideCircleRef.current = true;
          setSelectedElements([]);
          if (circleVisibilityTimerRef.current) {
            clearTimeout(circleVisibilityTimerRef.current);
            circleVisibilityTimerRef.current = null;
          }
          setCircleSelector(prev => ({ ...prev, isVisible: false }));
        }
      }
    };

    const handleMouseUp = async (event) => {
      if (event.button !== 0) return;

      if (circleVisibilityTimerRef.current) { // Timer aufräumen
        clearTimeout(circleVisibilityTimerRef.current);
        circleVisibilityTimerRef.current = null;
      }

      const wasDrawingRectangleMode = isDrawing; // isDrawing war der Indikator für Rechteckmodus
      const initialTempRectangle = tempRectangle;
      const initialCircleSelector = { ...circleSelector }; // Kopie des Kreis-Zustands
      const dragOccurredToHideCircle = hasDraggedSignificantlyToHideCircleRef.current;

      // Interaktionszustände früh zurücksetzen
      setIsDrawing(false);
      setCircleSelector(prev => ({ ...prev, isActive: false, isInitiated: false })); // Kreis-Mausinteraktion beendet

      let significantDragForRect = false;
      let normalizedRect = null;

      if (wasDrawingRectangleMode && initialTempRectangle) {
        normalizedRect = {
          x: initialTempRectangle.width < 0 ? initialTempRectangle.x + initialTempRectangle.width : initialTempRectangle.x,
          y: initialTempRectangle.height < 0 ? initialTempRectangle.y + initialTempRectangle.height : initialTempRectangle.y,
          width: Math.abs(initialTempRectangle.width),
          height: Math.abs(initialTempRectangle.height),
        };
        if (normalizedRect.width > MIN_DRAG_DIMENSION_FOR_TEXTCARD || normalizedRect.height > MIN_DRAG_DIMENSION_FOR_TEXTCARD) {
          significantDragForRect = true;
        }
      }

      if (significantDragForRect && normalizedRect) {
        // Fall 1: Nutzer hat ein signifikantes Rechteck gezogen -> Standard Textkarte erstellen
        addTextcard({
          x: normalizedRect.x,
          y: normalizedRect.y,
          width: normalizedRect.width,
          height: normalizedRect.height,
          text: "",
          aiGenerated: false,
        });
        setTempRectangle(null);
        setCircleSelector(prev => ({ ...prev, isVisible: false, isBlinking: false }));
        setSelectedTool("Pointer");
        setCursorStyle("default");
        setSelectedElements([]);
      } else if (!dragOccurredToHideCircle) {
        // Fall 2: Kreis-Logik für AI Textkarte
        const affectedElements = getElementsInCircle(
            elements,
            { x: initialCircleSelector.x, y: initialCircleSelector.y },
            initialCircleSelector.radius
        );
        setSelectedElements(affectedElements);

        setCursorStyle("wait");

        if(initialCircleSelector.isVisible){
          setCircleSelector(prev => ({ ...prev, isVisible: true, isBlinking: true })); // Blinken auslösen
          await new Promise(resolve => setTimeout(resolve, BLINK_DURATION_MS));
          setCircleSelector(prev => ({ ...prev, isVisible: false, isBlinking: false })); // Nach Blinken ausblenden
        }

        const clickMousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
        createPreviewTextcard(clickMousePos);

        let textContent = "";
        try {
          const promptText = getTextFromAllElements(affectedElements);
          console.log("TextCardTool: Context for AI from circle:", promptText, "Affected Elements:", affectedElements.length);
          if (affectedElements.length > 0 && promptText && promptText !== "Keine Elemente übergeben." && promptText !== "Fehler: Ungültige Eingabe." && promptText !== "[]" && !checkPromptTextStrict(promptText)) {
            const response = await chatGPTService.neighborbasedTextcard2(promptText);
            textContent = response.content;
          } else {
            const response = await chatGPTService.generateFirstTextcard("");
            textContent = response.content;
          }
        } catch (error) {
          console.error("TextCardTool: Fehler beim Erstellen der Textkarte mit Kreis-Kontext:", error);
          textContent = "Fehler bei der Textgenerierung.";
        } finally {
          createTextcard(clickMousePos, textContent);
          setPreview([]);
          setSelectedTool("Pointer");
          setCursorStyle("default");
          setTempRectangle(null);
          setSelectedElements([]);
        }
      } else {
        // Fall 3: Andere Fälle (Klick auf Bereich, Drag hat Kreis versteckt aber kein Rechteck erzeugt, etc.)
        resetAllInteractionStates(); // Setzt alles zurück inkl. Tool und Cursor
      }
      hasDraggedSignificantlyToHideCircleRef.current = false; // Sicherstellen, dass für die nächste Interaktion zurückgesetzt
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (circleVisibilityTimerRef.current) {
          clearTimeout(circleVisibilityTimerRef.current);
          circleVisibilityTimerRef.current = null;
        }
        resetAllInteractionStates();
      }
    };

    const handleWheel = (event) => {
      if (circleSelector.isActive) {
        event.stopPropagation();

        let newRadius = circleSelector.radius - event.deltaY * CIRCLE_SCROLL_SENSITIVITY;
        newRadius = Math.max(MIN_CIRCLE_RADIUS, Math.min(MAX_CIRCLE_RADIUS, newRadius));

        const newAffectedElements = getElementsInCircle(
          elements,
          { x: circleSelector.x, y: circleSelector.y },
          newRadius
        );

        setCircleSelector(prev => {
          if (!prev.isActive) return prev;
          const shouldBeVisible = !hasDraggedSignificantlyToHideCircleRef.current;
          return {
            ...prev,
            radius: newRadius,
            isVisible: shouldBeVisible,
          };
        });

        setSelectedElements(newAffectedElements);
      }
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    canvasWrapper.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
      canvasWrapper.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    tempRectangle,
    scaleRef,
    offsetRef,
    setPreview,
    resetAllInteractionStates,
    circleSelector,
    setCircleSelector,
    setCursorStyle
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
      <CircularSelector
        centerX={circleSelector.x}
        centerY={circleSelector.y}
        radius={circleSelector.radius}
        scale={scaleRef.current}
        offset={offsetRef.current}
        isVisible={circleSelector.isVisible}
        isBlinking={circleSelector.isBlinking}
      />
    </div>
  );
};

export default TextCardTool;
