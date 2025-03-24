import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import {
  getAnchorFromPosition,
  getClosestAnchor,
} from "@/utils/Arrow/anchorUtils";
import { getElementAtPosition } from "@/utils/elementUtils";

const ArrowTool = ({
  canvasRef,
  canvasWrapperRef,
  addArrow,
  elements,
  initialStart,
  onEndArrowFromFrame,
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

        // Berechne die aktuelle Pfeillänge
        const dx = mouseX - startPoint.x;
        const dy = mouseY - startPoint.y;
        const currentLength = Math.sqrt(dx * dx + dy * dy) * scaleRef.current;

        if (initialStart && currentLength > MAX_LENGTH) {
          // Berechne den Punkt auf maxLength Entfernung
          const angle = Math.atan2(dy, dx);
          const limitedLength = MAX_LENGTH / scaleRef.current;
          newEnd = {
            x: startPoint.x + limitedLength * Math.cos(angle),
            y: startPoint.y + limitedLength * Math.sin(angle),
          };

          // Wenn über einem Element, aber außerhalb der maxLength
          if (element) {
            const elementDistance =
              Math.sqrt(
                Math.pow(element.position.x - startPoint.x, 2) +
                  Math.pow(element.position.y - startPoint.y, 2)
              ) * scaleRef.current;

            if (elementDistance > MAX_LENGTH) {
              element = null; // Element wird ignoriert, da zu weit entfernt
            }
          }
        }

        // Update Start-Anchor wenn Startpunkt an einem Element ist
        if (startPoint.elementId) {
          const startElement = elements.find(
            (el) => el.id === startPoint.elementId
          );
          if (startElement) {
            // Bestimme den nächstgelegenen Anchor zur aktuellen Mausposition
            const anchorData = getClosestAnchor(startElement, mouseX, mouseY);

            newStart = {
              ...startPoint,
              x: anchorData.x,
              y: anchorData.y,
              anchor: anchorData.anchor,
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
            anchor: anchorData.anchor,
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
        const dx = finalEnd.x - start.x;
        const dy = finalEnd.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy) * scaleRef.current;

        if (!endElement) {
          showContextMenu({ x: mouseX, y: mouseY }, "end");
        }

        if (initialStart && length > MAX_LENGTH) {
          const angle = Math.atan2(dy, dx);
          const limitedLength = MAX_LENGTH / scaleRef.current;

          finalEnd = {
            x: start.x + limitedLength * Math.cos(angle),
            y: start.y + limitedLength * Math.sin(angle),
            // Behalte die Element-Referenz bei, falls vorhanden
            ...(endElement
              ? {
                  elementId: endElement.id,
                  anchor: finalEnd.anchor,
                }
              : {}),
          };
          addArrow({
            start: start,
            end: finalEnd,
          });
        } else {
          addArrow({
            start: start,
            end: finalEnd,
          });
        }

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

  const renderLengthIndicator = () => {
    if (!isDrawing || !initialStart || !startPoint || !endPoint) return null;
    
    const endElement = getElementAtPosition(elements, endPoint.x, endPoint.y);
    if (endElement) return null;
  
    return (
      <div style={{
        position: 'absolute',
        top: ((startPoint.y + endPoint.y) / 2 * scaleRef.current + offsetRef.current.y) - 10,
        left: ((startPoint.x + endPoint.x) / 2 * scaleRef.current + offsetRef.current.x) - 20,
        color: 'black',
        fontSize: '12px',
        pointerEvents: 'none',
        zIndex: 3000,
        backgroundColor: 'white',
        padding: '2px 4px',
        borderRadius: '3px',
        transform: `rotate(${Math.atan2(
          endPoint.y - startPoint.y,
          endPoint.x - startPoint.x
        )}rad)`
      }}>
        {((Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        ) * scaleRef.current / MAX_LENGTH).toFixed(2))}
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
