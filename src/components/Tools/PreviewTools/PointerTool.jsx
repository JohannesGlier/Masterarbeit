import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';

const PointerTool = ({ canvasRef, canvasWrapperRef }) => {
  const { offsetRef, scaleRef, isDrawing, setIsDrawing, setSelectedElements } = useCanvas();
  const [tempRectangle, setTempRectangle] = useState(null);

  // Mouse event handling for drawing
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (event.button !== 0) return;  
      document.body.style.cursor = "crosshair";
      setIsDrawing(true);

      setSelectedElements([]);

      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const startY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      setTempRectangle({ x: startX, y: startY, width: 0, height: 0 });
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const endY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      setTempRectangle({
        x: tempRectangle.x,
        y: tempRectangle.y,
        width: endX - tempRectangle.x,
        height: endY - tempRectangle.y,
      });
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      /**
      if (tempRectangle && tempRectangle.width > 0 && tempRectangle.height > 0) {
        // Benutzerdefiniertes Rechteck durch Ziehen
        addTextcard(tempRectangle);
      }
      else {
        // Vordefiniertes Rechteck durch Click
        const defaultWidth = 100;
        const defaultHeight = 100;  
        const finalRectangle = {x: tempRectangle.x, y: tempRectangle.y, width: defaultWidth, height: defaultHeight};
        addTextcard(finalRectangle);
      }
      */

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
  }, [canvasRef, canvasWrapperRef, isDrawing, tempRectangle, scaleRef, offsetRef]);

  return (
    <div>
      {tempRectangle && (
        <div
          style={{
            position: "absolute",
            top: tempRectangle.y * scaleRef.current + offsetRef.current.y,
            left: tempRectangle.x * scaleRef.current + offsetRef.current.x,
            width: `${tempRectangle.width * scaleRef.current}px`,
            height: `${tempRectangle.height * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.3)",
            border: "1px dashed blue",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />
      )}
    </div>
  );
};

export default PointerTool;