import React, { useState, useEffect, useRef } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';

const TextCard = ({ rect, scaleRef, offsetRef, onUpdate, onResize, canvasWrapperRef }) => {
    const { selectedTool, selectedElements, toggleSelectedElement } = useCanvas();
    const frameRef = useRef(null);
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const [position, setPosition] = useState({ x: rect.x, y: rect.y });
    const [size, setSize] = useState({ width: rect.width, height: rect.height });
    const [onDragging, setOnDragging] = useState(false);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const alreadySelected = useRef(false);
    const resizeHandle = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });


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
      };
  
      const handleMouseUp = (e) => {
          StopResizing(e);
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
        // Überprüfe, ob Shift oder Strg gedrückt wurde (Multi-Select)
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
  
        // Umschalten der Auswahl
        toggleSelectedElement({ ...rect, isResizing: isResizing.current }, isMultiSelect);
      }

      if(isSelected) {
        alreadySelected.current = true;
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
      StopDragging(e);
      StopResizing(e);
    };
  
  
  
    const StopResizing = (e) => {
      if (isResizing.current) {
          setIsSelected(false);
          isResizing.current = false;
          resizeHandle.current = null;

          if (selectedTool === "Pointer") {
            // Überprüfe, ob Shift oder Strg gedrückt wurde (Multi-Select)
            const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

            // Umschalten der Auswahl
            toggleSelectedElement({ ...rect, isResizing: isResizing.current }, isMultiSelect);
          }

          
          if (onResize) {
            onResize(rect.id, size.width, size.height);
          }
        }
    }
  
    const StopDragging = (e) => {
      isDragging.current = false; 
      setOnDragging(false);
      if(alreadySelected.current) {
        alreadySelected.current = false;
        setIsSelected(false);
      }
    }
  
    const HandleResizing = (e) => {
      if (isResizing.current) {
        if (selectedTool === "Pointer") {
          // Überprüfe, ob Shift oder Strg gedrückt wurde (Multi-Select)
          const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

          // Umschalten der Auswahl
          toggleSelectedElement({ ...rect, isResizing: isResizing.current }, isMultiSelect);
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
      if (isDragging.current) {
          setOnDragging(true);

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
        : selectedElements.some(el => el.isResizing) // Wenn irgendein Element geresized wird
        ? selectedElements.find(el => el.id === rect.id)?.isResizing // Überprüfe, ob dieses Element geresized wird
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
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "25px",
          padding: "12px",
          boxSizing: "border-box",
          cursor: "grab",
          zIndex: 6,
          pointerEvents,
        }}
        onClick={() => setIsEditing(true)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setIsEditing(false)}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              backgroundColor: "transparent",
              color: "black",
              fontFamily: "inherit",
              fontSize: "inherit",
              cursor: "text",
            }}
          />
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
        )}
        {(isSelected && !onDragging && selectedElements.length === 1) && (
        <>
          <div
            style={{
              position: "absolute",
              top: "-5px",
              left: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "blue",
              borderRadius: "50%",
              cursor: "nwse-resize",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, "top-left")}
          />
          <div
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "blue",
              borderRadius: "50%",
              cursor: "nesw-resize",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, "top-right")}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "blue",
              borderRadius: "50%",
              cursor: "nesw-resize",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "-5px",
              width: "10px",
              height: "10px",
              backgroundColor: "blue",
              borderRadius: "50%",
              cursor: "nwse-resize",
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")}
          />
        </>
        )}
      </div>
    );
};

export default TextCard;