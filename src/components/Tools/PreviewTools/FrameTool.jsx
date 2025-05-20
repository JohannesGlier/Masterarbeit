import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/components/Canvas/CanvasContext';
import {
  getElementsInRectangle,
} from "@/utils/elementUtils";
import { useCursor } from '@/components/Canvas/CursorContext';
import { getCanvasMousePosition } from "@/utils/canvasUtils";

const FrameTool = ({ canvasRef, canvasWrapperRef, addRectangle, elements }) => {
  const { offsetRef, scaleRef, setSelectedTool, setHeadingGeneration } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRectangle, setTempRectangle] = useState(null);
  const { setCursorStyle } = useCursor();

  useEffect(() => {
    setCursorStyle("crosshair");

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setIsDrawing(true);
      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle(prevRect => ({
        x: prevRect.x,
        y: prevRect.y,
        width: mousePos.x - prevRect.x,
        height: mousePos.y - prevRect.y,
      }));
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      if (!isDrawing || !tempRectangle) {
        setIsDrawing(false);
        setTempRectangle(null);
        return;
      }

      const normalizedRect = {
        x: tempRectangle.width < 0 ? tempRectangle.x + tempRectangle.width : tempRectangle.x,
        y: tempRectangle.height < 0 ? tempRectangle.y + tempRectangle.height : tempRectangle.y,
        width: Math.abs(tempRectangle.width),
        height: Math.abs(tempRectangle.height),
      };
      const MIN_DRAG_DIMENSION = 10;

      if (normalizedRect.width > MIN_DRAG_DIMENSION && normalizedRect.height > MIN_DRAG_DIMENSION) {
        // User-defined rectangle by dragging
        const rectToAdd = {
          x: normalizedRect.x,
          y: normalizedRect.y,
          width: normalizedRect.width,
          height: normalizedRect.height,
        };
        const rectId = addRectangle(rectToAdd);

        const text = getTextInsideFrame(elements, rectToAdd);
        if (text && rectId) {
          setHeadingGeneration(prev => ({
            ...prev,
            [rectId]: {
              generateHeading: true,
              text: text,
            },
          }));
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
        if(text && rectId) {
          setHeadingGeneration(prev => ({
            ...prev,
            [rectId]: {
              generateHeading: true,
              text: text,
            },
          }));
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
            top: (tempRectangle.height < 0 ? tempRectangle.y + tempRectangle.height : tempRectangle.y) * scaleRef.current + offsetRef.current.y,
            left: (tempRectangle.width < 0 ? tempRectangle.x + tempRectangle.width : tempRectangle.x) * scaleRef.current + offsetRef.current.x,
            width: `${Math.abs(tempRectangle.width) * scaleRef.current}px`,
            height: `${Math.abs(tempRectangle.height) * scaleRef.current}px`,
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
