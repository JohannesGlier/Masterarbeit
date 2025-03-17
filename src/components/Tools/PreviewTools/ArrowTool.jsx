import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { getAnchorFromPosition, getClosestAnchor } from "@/utils/Arrow/anchorUtils";
import { getElementAtPosition } from "@/utils/Arrow/elementUtils";

const ArrowTool = ({ canvasRef, canvasWrapperRef, addArrow, elements, initialStart, onEndArrowFromFrame }) => {
  const {
    offsetRef,
    scaleRef,
    setSelectedTool,
    setMouseDownElement,
    setHoveredElement,
    zIndexArrows,
  } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    if (initialStart) {
      // Setze den Startpunkt automatisch
      const element = elements.find(el => el.id === initialStart.elementId);
      if (element) {
        const pos = getAnchorFromPosition(initialStart.anchor, element);
        setStartPoint({
          elementId: element.id,
          anchor: initialStart.anchor,
          x: pos.x,
          y: pos.y
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

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX =
        (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const mouseY =
        (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      const element = getElementAtPosition(elements, mouseX, mouseY);

      if (element) {
        const { anchor, x, y } = getClosestAnchor(element, mouseX, mouseY);
        setStartPoint({
          elementId: element.id,
          anchor,
          x,
          y,
        });
        setEndPoint({ x, y });
        setMouseDownElement(element);
      } else {
        setStartPoint({ x: mouseX, y: mouseY });
        setEndPoint({ x: mouseX, y: mouseY });
        setMouseDownElement(null);
      }
    };

    const handleMouseMove = (event) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX =
        (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const mouseY =
        (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Überprüfen, ob die Maus über einem Element ist
      const element = getElementAtPosition(elements, mouseX, mouseY);
      setHoveredElement(element);

      if (isDrawing) {
        let newStart = startPoint;
        let newEnd = { x: mouseX, y: mouseY };
    
        // Update Start-Anchor wenn Startpunkt an einem Element ist
        if (startPoint.elementId) {
          const startElement = elements.find(el => el.id === startPoint.elementId);
          if (startElement) {
            // Bestimme den nächstgelegenen Anchor zur aktuellen Mausposition
            const anchorData = getClosestAnchor(startElement, mouseX, mouseY);
            
            newStart = {
              ...startPoint,
              x: anchorData.x,
              y: anchorData.y,
              anchor: anchorData.anchor
            };
          }
        }
    
        // Update End-Anchor relativ zum (potentiell aktualisierten) Startpunkt
        if (element) {
          const anchorData = getClosestAnchor(
            element,
            newStart.x, // Verwende den aktualisierten Startpunkt
            newStart.y
          );
    
          newEnd = {
            x: anchorData.x,
            y: anchorData.y,
            elementId: element.id,
            anchor: anchorData.anchor
          };
        }
    
        setStartPoint(newStart);
        setEndPoint(newEnd);
      }
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX =
        (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const mouseY =
        (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Überprüfen, ob die Maus über einem Element ist
      const endElement = getElementAtPosition(elements, mouseX, mouseY);
      let finalEnd = { x: mouseX, y: mouseY };

      // Startpunkt-Daten aufbereiten
      const start = startPoint.elementId
        ? {
            elementId: startPoint.elementId,
            anchor: startPoint.anchor,
            x: startPoint.x,
            y: startPoint.y,
          }
        : { x: startPoint.x, y: startPoint.y };

      // Endpunkt anpassen wenn über Element
      if (endElement) {
        const referenceX = startPoint.elementId ? startPoint.x : startPoint.x;
        const referenceY = startPoint.elementId ? startPoint.y : startPoint.y;

        const anchorData = getClosestAnchor(endElement, referenceX, referenceY);
        finalEnd = {
          elementId: endElement.id,
          anchor: anchorData.anchor,
          x: anchorData.x,
          y: anchorData.y,
        };
      }

      if (startPoint) {
        addArrow({
          start: start,
          end: finalEnd,
        });
        setSelectedTool("Pointer");
      }

      // States zurücksetzen
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

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
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
    </div>
  );
};

export default ArrowTool;
