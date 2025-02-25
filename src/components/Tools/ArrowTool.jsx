import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';

const ArrowTool = ({ canvasRef, canvasWrapperRef, addArrow }) => {
  const { offsetRef, scaleRef, setSelectedTool } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    document.body.style.cursor = "crosshair";

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setIsDrawing(true);

      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const startY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      setStartPoint({ x: startX, y: startY });
      setEndPoint({ x: startX, y: startY }); // Setze den Endpunkt gleich dem Startpunkt
    };

    const handleMouseMove = (event) => {
      if (!isDrawing) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const endY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      setEndPoint({ x: endX, y: endY });
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      if (startPoint && endPoint) {
        addArrow({ start: startPoint, end: endPoint });
        setSelectedTool('Pointer');
      }

      setStartPoint(null);
      setEndPoint(null);
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
  }, [canvasRef, canvasWrapperRef, isDrawing, scaleRef, offsetRef, addArrow, startPoint, endPoint]);

  return (
    <div>
      {isDrawing && startPoint && endPoint && (
        <div
          style={{
            position: "absolute",
            top: startPoint.y * scaleRef.current + offsetRef.current.y,
            left: startPoint.x * scaleRef.current + offsetRef.current.x,
            width: `${Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)) * scaleRef.current}px`,
            height: "2px",
            backgroundColor: "blue",
            transform: `rotate(${Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)}rad)`,
            transformOrigin: "0 0",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default ArrowTool;