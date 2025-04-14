import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/components/Canvas/CanvasContext';
import {
  getElementsInRectangle,
} from "@/utils/elementUtils";

const FrameTool = ({ canvasRef, canvasWrapperRef, addRectangle, elements }) => {
  const { offsetRef, scaleRef, setSelectedTool, setHeadingGeneration } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRectangle, setTempRectangle] = useState(null);

  // Mouse event handling for drawing
  useEffect(() => {
    document.body.style.cursor = "crosshair";

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setIsDrawing(true);

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
      if (tempRectangle && tempRectangle.width > 50 && tempRectangle.height > 50) {
        // Benutzerdefiniertes Rechteck durch Ziehen
        const rectId = addRectangle(tempRectangle);

        // Check, ob der Bereich über anderen Element ist, wenn ja, generiere eine passende Überschrift
        const text = getTextInsideFrame(elements, tempRectangle);
        if(text) {
          setHeadingGeneration({
            rectId,
            generateHeading: true,
            text: text,
          });
        }

        setSelectedTool('Pointer');
      }
      else {
        // Vordefiniertes Rechteck durch Click
        const defaultWidth = 250;
        const defaultHeight = 150;  
        const finalRectangle = {
          x: tempRectangle.x - defaultWidth / 2,
          y: tempRectangle.y - defaultHeight / 2,
          width: defaultWidth,
          height: defaultHeight,
        };

        const rectId = addRectangle(finalRectangle);

        // Check, ob der Bereich über anderen Element ist, wenn ja, generiere eine passende Überschrift
        const text = getTextInsideFrame(elements, finalRectangle);
        if(text) {
          setHeadingGeneration({
            rectId,
            generateHeading: true,
            text: text,
          });
        }
        setSelectedTool('Pointer');
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
  }, [canvasRef, canvasWrapperRef, isDrawing, tempRectangle, scaleRef, offsetRef]);

  const getTextInsideFrame = (elements, finalRectangle) => {
    const elementsInFrame = getElementsInRectangle(elements, finalRectangle);
    if(elementsInFrame.length > 0){
      const textFromElements = elementsInFrame
        .map((el) => {
          if (el.type === "textcard") {
            return el.text;
          } else if (el.type === "rectangle") {
            return el.heading;
          }
          return null;
        })
        .filter((item) => item !== null);

      return JSON.stringify(textFromElements, null, 2);
    }
    return null;
}

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
            pointerEvents: "none",
            zIndex: 1999,
          }}
        />
      )}
    </div>
  );
};

export default FrameTool;
