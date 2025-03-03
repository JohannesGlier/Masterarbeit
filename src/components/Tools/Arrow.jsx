import React, { useState, useEffect } from "react";
import { useCanvas } from '@/components/CanvasContext/CanvasContext';

const Arrow = ({ arrow, scaleRef, offsetRef, elements }) => {
  const { selectedTool, selectedElements, isDrawing, toggleSelectedElement } = useCanvas();
  const [isSelected, setIsSelected] = useState(false);

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

  // Überprüfe, ob der Pfeil ausgewählt ist
  useEffect(() => {
    setIsSelected(selectedElements.some(el => el.id === arrow.id));
  }, [selectedElements, arrow.id]);

  // Klick-Handler für die Auswahl des Pfeils
  const handleClick = (e) => {
    e.stopPropagation(); // Verhindere das Bubbling des Events

    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey; // Überprüfe, ob Multi-Select aktiv ist
      toggleSelectedElement(arrow, isMultiSelect); // Füge den Pfeil zur Auswahl hinzu oder entferne ihn
    }
  };

  // Pointer-Events-Logik
  const pointerEvents =
    selectedTool !== "Pointer" // Wenn nicht "Pointer" ausgewählt ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : isDrawing && selectedTool === "Pointer" // Wenn isDrawing true ist UND der Tool "Pointer" ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : "auto"; // Aktiviere pointer-events für den Pfeil

  return (
    <div
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
      onClick={handleClick}
    />
  );
};

export default Arrow;