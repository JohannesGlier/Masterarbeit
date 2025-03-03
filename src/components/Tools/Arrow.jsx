import React from 'react';

const Arrow = ({ arrow, scaleRef, offsetRef, elements }) => {
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

  return (
    <div
      style={{
        position: "absolute",
        top: startY * scaleRef.current + offsetRef.current.y,
        left: startX * scaleRef.current + offsetRef.current.x,
        width: `${Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) * scaleRef.current}px`,
        height: "2px",
        backgroundColor: "black",
        transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
        transformOrigin: "0 0",
        pointerEvents: "none", // Pfeile blockieren keine Pointer-Events
        zIndex: 4,
      }}
    />
  );
};

export default Arrow;