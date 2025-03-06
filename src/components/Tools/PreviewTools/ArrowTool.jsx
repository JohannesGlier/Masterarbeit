import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';


const ArrowTool = ({ canvasRef, canvasWrapperRef, addArrow, elements }) => {
  const { offsetRef, scaleRef, setSelectedTool, setMouseDownElement, setHoveredElement } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

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

  useEffect(() => {
    document.body.style.cursor = "crosshair";

    const handleMouseDown = (event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        
        setIsDrawing(true);
      
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
        const mouseY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;
      
        const element = getElementAtPosition(mouseX, mouseY);

        if (element) {
          const centerX = element.position.x + element.size.width / 2;
          const centerY = element.position.y + element.size.height / 2;
      
          setStartPoint({ elementId: element.id, x: centerX, y: centerY });
          setEndPoint({ x: centerX, y: centerY });
          setMouseDownElement(element);
        } else {
          setStartPoint({ x: mouseX, y: mouseY });
          setEndPoint({ x: mouseX, y: mouseY });
          setMouseDownElement(null);        
        }
      };

    const handleMouseMove = (event) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
        const mouseY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

        // Überprüfen, ob die Maus über einem Element ist
        const element = getElementAtPosition(mouseX, mouseY);
        setHoveredElement(element);

        if (isDrawing) {
          setEndPoint({ x: mouseX, y: mouseY });
        }
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const mouseY = (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Überprüfen, ob die Maus über einem Element ist
      const endElement = getElementAtPosition(mouseX, mouseY);

      // Startpunkt: Entweder das geklickte Element oder die Mausposition
      const start = startPoint.elementId
      ? { elementId: startPoint.elementId } // Gekoppelt an ein Element
      : { x: startPoint.x, y: startPoint.y }; // Freie Position

      // Endpunkt: Entweder das geklickte Element oder die Mausposition
      const end = endElement
      ? { elementId: endElement.id } // Gekoppelt an ein Element
      : { x: mouseX, y: mouseY }; // Freie Position

      if (startPoint) {
        addArrow({ start, end });
        //addArrow({ start: startPoint, end: finalEndPoint });
        setSelectedTool('Pointer');
      }

      setStartPoint(null);
      setEndPoint(null);
      setIsDrawing(false);
      setMouseDownElement(null);
      setHoveredElement(null);
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
  }, [canvasRef, canvasWrapperRef, isDrawing, scaleRef, offsetRef, addArrow, startPoint, elements]);

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
            zIndex: 4,
          }}
        />
      )}
    </div>
  );
};

export default ArrowTool;