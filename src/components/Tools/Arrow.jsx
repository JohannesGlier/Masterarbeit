import React, { useState, useEffect, useRef } from "react";
import { useCanvas } from '@/components/CanvasContext/CanvasContext';

const Arrow = ({ arrow, scaleRef, offsetRef, elements, updateArrowPosition, canvasWrapperRef, canvasRef }) => {
  const { selectedTool, selectedElements, toggleSelectedElement, isDrawing, setHoveredElement } = useCanvas();
  const [isSelected, setIsSelected] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const frameRef = useRef(null);
  const isDragging = useRef(false);

  // Startpunkt berechnen
  const start = arrow.start.elementId
    ? elements.find(element => element.id === arrow.start.elementId) || null
    : { position: { x: arrow.start.x, y: arrow.start.y }, size: { width: 0, height: 0 } };

  // Endpunkt berechnen
  const end = arrow.end.elementId
    ? elements.find(element => element.id === arrow.end.elementId) || null
    : { position: { x: arrow.end.x, y: arrow.end.y }, size: { width: 0, height: 0 } };

  // Startpunkt: Mitte des Elements oder freie Position
  const startX = start ? start.position.x + start.size.width / 2 : arrow.start.x;
  const startY = start ? start.position.y + start.size.height / 2 : arrow.start.y;

  // Endpunkt: Mitte des Elements oder freie Position
  const endX = end ? end.position.x + end.size.width / 2 : arrow.end.x;
  const endY = end ? end.position.y + end.size.height / 2 : arrow.end.y;

  // Mittelpunkt berechnen
  const middleX = (startX + endX) / 2;
  const middleY = (startY + endY) / 2;


  useEffect(() => {
    setIsSelected(selectedElements.some(el => el.id === arrow.id));
  }, [selectedElements, arrow.id]);

  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper.addEventListener("mousemove", HandleDragging);
    return () => {
      canvasWrapper.removeEventListener("mousemove", HandleDragging);
    };
  }, [canvasWrapperRef, arrow, updateArrowPosition]);


  const StartDragging = (point, e) => {
    e.preventDefault();
    if(e.buttons === 1){
      console.log("Start Dragging Arrow");

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement({ ...arrow, isDragging: isDragging.current }, isMultiSelect);
      }

      setDraggingPoint(point);
      isDragging.current = true;
    }
  };

  const HandleDragging = (e) => {  
    if (draggingPoint && e.buttons === 1) {
      isDragging.current = true;

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement({ ...arrow, isDragging: isDragging.current }, isMultiSelect);
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const offsetY = (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Überprüfen, ob die Maus über einem Element ist
      const element = getElementAtPosition(offsetX, offsetY);
      setHoveredElement(element);

      // Aktualisiere die Position des gezogenen Punkts
      updateArrowPosition(arrow.id, { x: offsetX, y: offsetY }, draggingPoint);
    }
  }

  const StopDragging = (e) => {
    if (draggingPoint) {
      console.log("Stop Dragging Arrow");
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const offsetY = (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Überprüfen, ob die Maus über einem Element ist
      const element = getElementAtPosition(offsetX, offsetY);

      // Wenn die Maus über einem Element losgelassen wird, kopple den Punkt an das Element
      if (element) {
        updateArrowPosition(arrow.id, { elementId: element.id }, draggingPoint);
      } else {
        updateArrowPosition(arrow.id, { x: offsetX, y: offsetY }, draggingPoint);
      }

      setDraggingPoint(null);
      setHoveredElement(null);
      isDragging.current = false;

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement({ ...arrow, isDragging: isDragging.current }, isMultiSelect);
      }
    }
  };

  const SelectArrow = (e) => {
    e.stopPropagation();
    console.log("Select Arrow");
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...arrow, isDragging: false }, isMultiSelect);
    }
  };


  const getElementAtPosition = (x, y) => {
    return elements.find((element) => {
      const elementX = element.position.x;
      const elementY = element.position.y;
      const elementWidth = element.size.width;
      const elementHeight = element.size.height;

      return (
        x >= elementX &&
        x <= elementX + elementWidth &&
        y >= elementY &&
        y <= elementY + elementHeight
      );
    });
  };

  const pointerEvents =
      selectedTool !== "Pointer" // Wenn nicht "Pointer" ausgewählt ist
        ? "none" // Deaktiviere pointer-events für alle Elemente
        : isDrawing && selectedTool === "Pointer" // Wenn isDrawing true ist UND der Tool "Pointer" ist
        ? "none" // Deaktiviere pointer-events für alle Elemente
        : selectedElements.some(el => el.isResizing || el.isDragging)
        ? selectedElements.find(el => el.id === arrow.id)?.isResizing || selectedElements.find(el => el.id === arrow.id)?.isDragging
          ? "none" // Aktiviere pointer-events nur für das Element, das geresized wird
          : "none" // Deaktiviere pointer-events für alle anderen Elemente
        : "auto";

  return (
    <>
      <div
        ref={frameRef}
        style={{
          position: "absolute",
          top: startY * scaleRef.current + offsetRef.current.y,
          left: startX * scaleRef.current + offsetRef.current.x,
          width: `${Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) * scaleRef.current}px`,
          height: "2px",
          backgroundColor: isSelected ? "blue" : "black",
          transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
          transformOrigin: "0 0",
          pointerEvents,
          zIndex: 4,
          cursor: "pointer",
        }}
        onClick={(e) => SelectArrow(e)}
      />
      {isSelected && (
        <>
          {/* Startpunkt */}
          <div
            style={{
              position: "absolute",
              top: startY * scaleRef.current + offsetRef.current.y - 5,
              left: startX * scaleRef.current + offsetRef.current.x - 5,
              width: "20px",
              height: "20px",
              backgroundColor: "red",
              borderRadius: "50%",
              cursor: "pointer",
              zIndex: 10,
            }}
            onMouseDown={(e) => StartDragging('start', e)}
            onMouseUp={(e) => StopDragging(e)}
          />
          {/* Mittelpunkt */}
          <div
            style={{
              position: "absolute",
              top: middleY * scaleRef.current + offsetRef.current.y - 5,
              left: middleX * scaleRef.current + offsetRef.current.x - 5,
              width: "10px",
              height: "10px",
              backgroundColor: "green",
              borderRadius: "50%",
              zIndex: 10,
            }}
          />
          {/* Endpunkt */}
          <div
            style={{
              position: "absolute",
              top: endY * scaleRef.current + offsetRef.current.y - 5,
              left: endX * scaleRef.current + offsetRef.current.x - 5,
              width: "20px",
              height: "20px",
              backgroundColor: "red",
              borderRadius: "50%",
              cursor: "pointer",
              zIndex: 10,
            }}
            onMouseDown={(e) => StartDragging('end', e)}
            onMouseUp={(e) => StopDragging(e)}
          />
        </>
      )}
    </>
  );
};

export default Arrow;