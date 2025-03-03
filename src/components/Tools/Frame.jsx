import { useState, useEffect, useRef } from "react";
import { useCanvas } from '@/components/CanvasContext/CanvasContext';
import ResizePoint from '@/components/Helper/ResizePoint';

const Frame = ({ rect, scaleRef, offsetRef, onUpdate, onResize, canvasWrapperRef }) => {
  const { selectedTool, selectedElements, toggleSelectedElement, isDrawing, mouseDownElement, hoveredElement } = useCanvas();
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [onDragging, setOnDragging] = useState(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  const isMouseDownElement = mouseDownElement?.id === rect.id;
  const isHoveredElement = hoveredElement?.id === rect.id;


  useEffect(() => {
    setIsSelected(selectedElements.some(el => el.id === rect.id));
  }, [selectedElements, rect.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (frameRef.current && !frameRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };

    const handleMouseMove = (e) => {
      HandleResizing(e);
      HandleDragging(e)
    };

    const handleMouseUp = (e) => {
      StopResizing(e);
      StopDragging(e);
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    canvasWrapper.addEventListener("mousedown", handleClickOutside);
  
    return () => {
        canvasWrapper.removeEventListener("mousemove", handleMouseMove);
        canvasWrapper.removeEventListener("mouseup", handleMouseUp);
        canvasWrapper.removeEventListener("mousedown", handleClickOutside);
    };
  }, [canvasWrapperRef, isDragging, isResizing, scaleRef, offsetRef, onUpdate, onResize, rect.id, size, position]);



  const handleMouseDown = (e) => {
    e.stopPropagation();
  
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing: isResizing.current, isDragging: isDragging.current }, isMultiSelect);
    }

    setIsSelected(true);

    isDragging.current = true;
    startPos.current = {
      x: e.clientX - position.x * scaleRef.current,
      y: e.clientY - position.y * scaleRef.current,
    };
  };

  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeHandle.current = handle;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleMouseMove = (e) => {
    HandleDragging(e); 
    HandleResizing(e);
  };

  const handleMouseUp = (e) => {
    StopResizing(e);
    StopDragging(e);
  };



  const StopResizing = (e) => {
    if (isResizing.current) {
        isResizing.current = false;
        resizeHandle.current = null;

        if (selectedTool === "Pointer") {
          const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
          toggleSelectedElement({ ...rect, isResizing: isResizing.current, isDragging: isDragging.current }, isMultiSelect);
        }
        
        if (onResize) {
          onResize(rect.id, size.width, size.height);
        }
      }
  }

  const StopDragging = (e) => {
    isDragging.current = false; 
    setOnDragging(false);

    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing: isResizing.current, isDragging: isDragging.current }, isMultiSelect);
    }
  }

  const HandleResizing = (e) => {
    if (isResizing.current && e.buttons === 1) {
        if (selectedTool === "Pointer") {
          const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
          toggleSelectedElement({ ...rect, isResizing: isResizing.current, isDragging: isDragging.current }, isMultiSelect);
        }

        // Größenänderung des Frames
        const mouseX = e.clientX;
        const mouseY = e.clientY;
      
        // Berechne die Mausposition relativ zum Canvas unter Berücksichtigung von Zoom und Offset
        const mouseCanvasX = (mouseX - offsetRef.current.x) / scaleRef.current;
        const mouseCanvasY = (mouseY - offsetRef.current.y) / scaleRef.current;
      
        switch (resizeHandle.current) {
          case "top-left":
            setPosition({
              x: mouseCanvasX, // Neue Position basierend auf der Mausposition
              y: mouseCanvasY,
            });
            setSize({
              width: position.x + size.width - mouseCanvasX, // Neue Breite
              height: position.y + size.height - mouseCanvasY, // Neue Höhe
            });
            break;
          case "top-right":
            setPosition((prev) => ({
              ...prev,
              y: mouseCanvasY, // Neue Y-Position basierend auf der Mausposition
            }));
            setSize({
              width: mouseCanvasX - position.x, // Neue Breite
              height: position.y + size.height - mouseCanvasY, // Neue Höhe
            });
            break;
          case "bottom-left":
            setPosition((prev) => ({
              ...prev,
              x: mouseCanvasX, // Neue X-Position basierend auf der Mausposition
            }));
            setSize({
              width: position.x + size.width - mouseCanvasX, // Neue Breite
              height: mouseCanvasY - position.y, // Neue Höhe
            });
            break;
          case "bottom-right":
            setSize({
              width: mouseCanvasX - position.x, // Neue Breite
              height: mouseCanvasY - position.y, // Neue Höhe
            });
            break;
          default:
            break;
        }
    }
  }

  const HandleDragging = (e) => {  
    if (isDragging.current && e.buttons === 1) {
      setOnDragging(true);

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement({ ...rect, isResizing: isResizing.current, isDragging: isDragging.current }, isMultiSelect);
      }

      const newX = (e.clientX - startPos.current.x) / scaleRef.current;
      const newY = (e.clientY - startPos.current.y) / scaleRef.current;

      setPosition({ x: newX, y: newY });

      if (onUpdate) {
        onUpdate(rect.id, newX, newY);
      }
    }
  }



  const pointerEvents =
    selectedTool !== "Pointer" // Wenn nicht "Pointer" ausgewählt ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : isDrawing && selectedTool === "Pointer" // Wenn isDrawing true ist UND der Tool "Pointer" ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : selectedElements.some(el => el.isResizing || el.isDragging)
      ? selectedElements.find(el => el.id === rect.id)?.isResizing || selectedElements.find(el => el.id === rect.id)?.isDragging
        ? "auto" // Aktiviere pointer-events nur für das Element, das geresized wird
        : "none" // Deaktiviere pointer-events für alle anderen Elemente
      : "auto";

  return (
    <div
      ref={frameRef}
      style={{
        position: "absolute",
        top: position.y * scaleRef.current + offsetRef.current.y,
        left: position.x * scaleRef.current + offsetRef.current.x,
        width: `${size.width * scaleRef.current}px`,
        height: `${size.height * scaleRef.current}px`,
        backgroundColor: "rgba(143, 143, 143, 1.0)",
        border: isSelected
          ? "3px solid rgb(23, 104, 255)"
          : isMouseDownElement || isHoveredElement
          ? "3px solid orange" // Highlighting-Stil
          : "1px solid black",
        cursor: "grab",
        zIndex: 5,
        pointerEvents,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {(isSelected && !onDragging && selectedElements.length === 1) && (
        <>
          <ResizePoint
            position="top-left"
            cursor="nwse-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "top-left")}
          />
          <ResizePoint
            position="top-right"
            cursor="nesw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "top-right")}
          />
          <ResizePoint
            position="bottom-left"
            cursor="nesw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")}
          />
          <ResizePoint
            position="bottom-right"
            cursor="nwse-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")}
          />
        </>
      )}
    </div>
  );
};

export default Frame;
