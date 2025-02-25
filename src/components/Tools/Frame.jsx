import { useState, useEffect, useRef } from "react";

const Frame = ({ rect, scaleRef, offsetRef, onUpdate, onResize, canvasWrapperRef }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const clickTimeout = useRef(null);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (frameRef.current && !frameRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };

    const handleMouseMove = (e) => {
        HandleResizing(e);
    };

    const handleMouseUp = () => {
        StopResizing();
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

    clickTimeout.current = setTimeout(() => {
      setIsSelected((prev) => !prev);
    }, 150);

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

  const handleMouseUp = () => {
    StopDragging();
    StopResizing();
  };




  const StopResizing = () => {
    if (isResizing.current) {
        setIsSelected(false);
        isResizing.current = false;
        resizeHandle.current = null;
        if (onResize) {
          onResize(rect.id, size.width, size.height);
        }
      }
  }

  const StopDragging = () => {
    if (isDragging.current) {
        setIsSelected(false);
        isDragging.current = false;
      }
  }

  const HandleResizing = (e) => {
    if (isResizing.current) {
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
        clearTimeout(clickTimeout.current);
        setIsSelected(true);
  
        const newX = (e.clientX - startPos.current.x) / scaleRef.current;
        const newY = (e.clientY - startPos.current.y) / scaleRef.current;
  
        setPosition({ x: newX, y: newY });
  
        if (onUpdate) {
          onUpdate(rect.id, newX, newY);
        }
      }
  }




  return (
    <div
      ref={frameRef}
      style={{
        position: "absolute",
        top: position.y * scaleRef.current + offsetRef.current.y,
        left: position.x * scaleRef.current + offsetRef.current.x,
        width: `${size.width * scaleRef.current}px`,
        height: `${size.height * scaleRef.current}px`,
        backgroundColor: isSelected ? "rgba(0, 123, 255, 0.3)" : "rgba(143, 143, 143, 0.5)",
        border: isSelected ? "2px solid blue" : "1px solid black",
        cursor: "grab",
        zIndex: isSelected ? 10 : 5,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {isSelected && (
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

export default Frame;
