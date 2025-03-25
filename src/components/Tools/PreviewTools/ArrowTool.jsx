import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import {
  getAnchorFromPosition,
  getAnchorData,
} from "@/utils/Arrow/anchorUtils";
import {
  getElementAtPosition,
  attachTextcardToArrow,
} from "@/utils/elementUtils";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import { ChatGPTService } from "@/services/ChatGPTService";

const ArrowTool = ({
  canvasRef,
  canvasWrapperRef,
  addArrow,
  elements,
  initialStart,
  onEndArrowFromFrame,
  addTextcard,
  updateArrowPosition,
  updateTextcardText,
}) => {
  const {
    offsetRef,
    scaleRef,
    setSelectedTool,
    setMouseDownElement,
    setHoveredElement,
    showContextMenu,
  } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const MAX_LENGTH = 500;
  const chatGPTService = new ChatGPTService();

  useEffect(() => {
    if (initialStart) {
      // Setze den Startpunkt automatisch
      const element = elements.find((el) => el.id === initialStart.elementId);
      if (element) {
        const pos = getAnchorFromPosition(initialStart.anchor, element);
        setStartPoint({
          elementId: element.id,
          anchor: initialStart.anchor,
          x: pos.x,
          y: pos.y,
        });
        setIsDrawing(true);
      }
    }
  }, [initialStart]);

  useEffect(() => {
    document.body.style.cursor = "crosshair";

    const handleMouseDown = (event) => {
      if (event.button !== 0 || initialStart) return;
      event.stopPropagation();
      
      setIsDrawing(true);
      const { x: mouseX, y: mouseY } = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      const element = getElementAtPosition(elements, mouseX, mouseY);
    
      if (element) {
        const { anchor, x, y } = getAnchorData(element, mouseX, mouseY);
        setStartPoint({ elementId: element.id, anchor, x, y });
        setMouseDownElement(element);
      } else {
        setStartPoint({ x: mouseX, y: mouseY });
        setMouseDownElement(null);
      }
      setEndPoint({ x: mouseX, y: mouseY });
    };

    const handleMouseMove = (event) => {
      const { x: mouseX, y: mouseY } = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      const element = getElementAtPosition(elements, mouseX, mouseY);
      setHoveredElement(element);

      if (!isDrawing) return;

      let newEnd = { x: mouseX, y: mouseY };
      let newStart = startPoint;

      // Start Anchor aktualisieren
      if (startPoint.elementId) {
        const startElement = elements.find(el => el.id === startPoint.elementId);
        if (startElement) {
          const anchorData = getAnchorData(startElement, mouseX, mouseY);
          newStart = { ...startPoint, ...anchorData };
        }
      }

      // Längenbegrenzung
      if (initialStart) {
        newEnd = calculateLimitedPosition(startPoint, newEnd, MAX_LENGTH);
      }

      // End Anchor setzen
      if (element) {
        const anchorData = getAnchorData(element, newStart.x, newStart.y);
        newEnd = { ...anchorData, elementId: element.id };
      }

      setStartPoint(newStart);
      setEndPoint(newEnd);
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      const { x: mouseX, y: mouseY } = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      const endElement = getElementAtPosition(elements, mouseX, mouseY);

      // Startpunkt vorbereiten
      const start = startPoint.elementId
      ? { 
          elementId: startPoint.elementId, 
          anchor: startPoint.anchor, 
          x: startPoint.x, 
          y: startPoint.y 
        }
      : { x: startPoint.x, y: startPoint.y };

      // Endpunkt vorbereiten
      let end = { x: mouseX, y: mouseY };
      if (endElement) {
        const referenceX = startPoint.elementId ? startPoint.x : startPoint.x;
        const referenceY = startPoint.elementId ? startPoint.y : startPoint.y;
        const anchorData = getAnchorData(endElement, referenceX, referenceY);
        end = { ...anchorData, elementId: endElement.id };
      }

      // Shortcut-Pfeil
      if (initialStart) {
        end = calculateLimitedPosition(start, end, MAX_LENGTH);
        addTextcardToShortcutArrow(start, end);
      } else {
        // Normaler Pfeil
        addArrow({ start, end });
      }

      // States zurücksetzen
      resetDrawingState();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        resetDrawingState();
      }
    };

    const resetDrawingState = () => {
      setSelectedTool("Pointer");
      setStartPoint(null);
      setEndPoint(null);
      setIsDrawing(false);
      setMouseDownElement(null);
      setHoveredElement(null);
      onEndArrowFromFrame(null);
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    scaleRef,
    offsetRef,
    addArrow,
    startPoint,
    elements,
  ]);

  const addTextcardToShortcutArrow = async (start, end) => {
    const arrow = addArrow({ start, end });
    const newTextcard = attachTextcardToArrow(arrow, start.anchor);

    // 2. Füge die Textkarte mit einem Platzhaltertext hinzu
    const newTextcardId = addTextcard({
      x: newTextcard.x,
      y: newTextcard.y,
      width: newTextcard.width,
      height: newTextcard.height,
      text: "Inhalt wird generiert..."
    });

    // 3. Aktualisiere die Pfeilposition
    updateArrowPosition( arrow.id, { elementId: newTextcardId, anchor: newTextcard.anchor }, "end" );

    // 4. Hole die ChatGPT-Antwort im Hintergrund
    try {
        const length = (Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) * scaleRef.current) / MAX_LENGTH;
        const startElement = elements.find((e) => e.id === start.elementId);
        const startText = startElement?.type === "textcard" 
            ? startElement.text 
            : startElement?.type === "rectangle" 
            ? startElement.heading 
            : null;

        if (!startText) {
          updateTextcardText(newTextcardId, "Fehler: Kein Eingabetext");  
          return;
        }

        // 5. Warte auf die Antwort und aktualisiere dann die Textkarte
        const response = await chatGPTService.relationshipArrow(startText, length);
        updateTextcardText(newTextcardId, response.content);     
    } catch (error) {
        console.error("Fehler bei ChatGPT-Anfrage:", error);
        updateTextcardText(newTextcardId, "Fehler beim Laden");     
    }
  }

  const calculateLimitedPosition = (start, end, maxLength) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy) * scaleRef.current;
    
    if (currentLength <= maxLength) return end;
    
    const angle = Math.atan2(dy, dx);
    const limitedLength = maxLength / scaleRef.current;
    return {
      x: start.x + limitedLength * Math.cos(angle),
      y: start.y + limitedLength * Math.sin(angle),
      ...(end.elementId ? {
        elementId: end.elementId,
        anchor: end.anchor
      } : {})
    };
  };

  const renderLengthIndicator = () => {
    if (!isDrawing || !initialStart || !startPoint || !endPoint) return null;

    const endElement = getElementAtPosition(elements, endPoint.x, endPoint.y);
    if (endElement) return null;

    return (
      <div
        style={{
          position: "absolute",
          top:
            ((startPoint.y + endPoint.y) / 2) * scaleRef.current +
            offsetRef.current.y -
            10,
          left:
            ((startPoint.x + endPoint.x) / 2) * scaleRef.current +
            offsetRef.current.x -
            20,
          color: "black",
          fontSize: "12px",
          pointerEvents: "none",
          zIndex: 3000,
          backgroundColor: "white",
          padding: "2px 4px",
          borderRadius: "3px",
        }}
      >
        {(
          (Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          ) *
            scaleRef.current) /
          MAX_LENGTH
        ).toFixed(2)}
      </div>
    );
  };

  return (
    <div>
      {isDrawing && startPoint && endPoint && (
        <div
          style={{
            position: "absolute",
            top: startPoint.y * scaleRef.current + offsetRef.current.y,
            left: startPoint.x * scaleRef.current + offsetRef.current.x,
            width: `${
              Math.sqrt(
                Math.pow(endPoint.x - startPoint.x, 2) +
                  Math.pow(endPoint.y - startPoint.y, 2)
              ) * scaleRef.current
            }px`,
            height: "2px",
            backgroundColor: "blue",
            transform: `rotate(${Math.atan2(
              endPoint.y - startPoint.y,
              endPoint.x - startPoint.x
            )}rad)`,
            transformOrigin: "0 0",
            pointerEvents: "none",
            zIndex: 2999,
          }}
        />
      )}
      {renderLengthIndicator()}
    </div>
  );
};

export default ArrowTool;
