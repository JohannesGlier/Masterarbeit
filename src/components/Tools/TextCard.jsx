import React, { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import ResizeHandle from "@/components/Helper/ResizeHandle";
import TextCardActionBar from "@/components/Tools/ActionBars/TextCardActionBar";

const TextCard = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  canvasWrapperRef,
  onStartArrowFromFrame,
}) => {
  const defaultTextcardProperties = {
    textcardColor: " #E6E6E6",
    textcardBorderColor: "#000000",
    borderWidth: 0,

    font: "Arial",
    fontStyles: { bold: false, italic: false, underline: false },
    textSize: 20,
    textColor: "#000000",
    textAlignment: "left",
  };
  const textcardProperties = { ...defaultTextcardProperties, ...rect };
  const [properties, setProperties] = useState(textcardProperties);

  const updateTextcardStyle = (newProperties) => {
    setProperties((prevProperties) => ({
      ...prevProperties,
      ...newProperties,
    }));
  };

  const {
    selectedTool,
    selectedElements,
    toggleSelectedElement,
    isDrawing,
    mouseDownElement,
    hoveredElement,
    isArrowDragging,
  } = useCanvas();
  const frameRef = useRef(null);
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [onDragging, setOnDragging] = useState(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const isMouseDownElement = mouseDownElement?.id === rect.id;
  const isHoveredElement = hoveredElement?.id === rect.id;

  useEffect(() => {
    setIsSelected(selectedElements.some((el) => el.id === rect.id));
  }, [selectedElements, rect.id]);

  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    return () => {
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    canvasWrapperRef,
    isDragging,
    isResizing,
    scaleRef,
    offsetRef,
    onUpdate,
    onResize,
    rect.id,
    size,
    position,
  ]);

  const handleMouseDown = (e) => {
    e.stopPropagation();

    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement(
        {
          ...rect,
          isResizing: isResizing.current,
          isDragging: isDragging.current,
        },
        isMultiSelect
      );
    }

    setIsSelected(true);

    isDragging.current = true;
    startPos.current = {
      x: e.clientX - position.x * scaleRef.current,
      y: e.clientY - position.y * scaleRef.current,
    };
  };

  const shortcutArrowCreation = (e, handle) => {
    e.stopPropagation();
    const anchor = position;
    onStartArrowFromFrame({
      elementId: rect.id,
      anchor: anchor,
      x: anchor.x,
      y: anchor.y,
    });
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

  const handleClick = (e) => {
    e.stopPropagation();

    // Wenn die Textkarte bereits ausgewählt ist, aktiviere den Bearbeitungsmodus
    if (isSelected && isEditingEnabled) {
      setIsEditing(true);
    } else {
      // Andernfalls aktiviere die Auswahl
      setIsEditingEnabled(true);
    }
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
      isResizing.current = false;
      resizeHandle.current = null;

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          {
            ...rect,
            isResizing: isResizing.current,
            isDragging: isDragging.current,
          },
          isMultiSelect
        );
      }

      if (onResize) {
        onResize(rect.id, size.width, size.height);
      }
    }
  };

  const StopDragging = (e) => {
    isDragging.current = false;
    setOnDragging(false);

    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement(
        {
          ...rect,
          isResizing: isResizing.current,
          isDragging: isDragging.current,
        },
        isMultiSelect
      );
    }
  };

  const HandleResizing = (e) => {
    if (isResizing.current) {
      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          {
            ...rect,
            isResizing: isResizing.current,
            isDragging: isDragging.current,
          },
          isMultiSelect
        );
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
  };

  const HandleDragging = (e) => {
    if (isDragging.current && !isEditing) {
      setOnDragging(true);

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          {
            ...rect,
            isResizing: isResizing.current,
            isDragging: isDragging.current,
          },
          isMultiSelect
        );
      }

      const newX = (e.clientX - startPos.current.x) / scaleRef.current;
      const newY = (e.clientY - startPos.current.y) / scaleRef.current;

      setPosition({ x: newX, y: newY });

      if (onUpdate) {
        onUpdate(rect.id, newX, newY);
      }
    }
  };

  const pointerEvents =
    selectedTool !== "Pointer" // Wenn nicht "Pointer" ausgewählt ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : isDrawing && selectedTool === "Pointer" // Wenn isDrawing true ist UND der Tool "Pointer" ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : selectedElements.some((el) => el.isResizing || el.isDragging) ||
        isArrowDragging
      ? selectedElements.find((el) => el.id === rect.id)?.isResizing ||
        selectedElements.find((el) => el.id === rect.id)?.isDragging
        ? "auto" // Aktiviere pointer-events nur für das Element, das geresized wird
        : "none" // Deaktiviere pointer-events für alle anderen Elemente
      : "auto";

  return (
    <>
      <div
        ref={frameRef}
        style={{
          position: "absolute",
          top: position.y * scaleRef.current + offsetRef.current.y,
          left: position.x * scaleRef.current + offsetRef.current.x,
          width: `${size.width * scaleRef.current}px`,
          height: `${size.height * scaleRef.current}px`,
          backgroundColor: properties.textcardColor,
          border:
            isSelected || isMouseDownElement || isHoveredElement
              ? "3px solid rgb(23, 104, 255)"
              : `${properties.borderWidth}px solid ${properties.textcardBorderColor}`,
          borderRadius: "25px",
          boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
          padding: "12px",
          boxSizing: "border-box",
          cursor: isEditing ? "text" : "grab",
          zIndex: 6,
          pointerEvents,
        }}
        onClick={handleClick}
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
              textAlign: properties.textAlignment,
              color: properties.textColor,
              fontFamily: properties.font,
              fontSize: properties.textSize,
              fontWeight: properties.fontStyles.bold ? "bold" : "normal",
              fontStyle: properties.fontStyles.italic ? "italic" : "normal",
              textDecoration: properties.fontStyles.underline
                ? "underline"
                : "none",
              cursor: "text",
              wordWrap: "break-word",
            }}
          />
        ) : (
          <div
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              textAlign: properties.textAlignment,
              color: properties.textColor,
              fontFamily: properties.font,
              fontSize: properties.textSize,
              fontWeight: properties.fontStyles.bold ? "bold" : "normal",
              fontStyle: properties.fontStyles.italic ? "italic" : "normal",
              textDecoration: properties.fontStyles.underline
                ? "underline"
                : "none",
            }}
          >
            {text}
          </div>
        )}
        {isSelected && !onDragging && selectedElements.length === 1 && (
          <>
            <ResizeHandle
              position="top-left"
              cursor="nwse-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "top-left")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="top-right"
              cursor="nesw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "top-right")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="bottom-left"
              cursor="nesw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="bottom-right"
              cursor="nwse-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")}
              color="rgb(252, 252, 252)"
            />

            {/* New middle handles */}
            <ResizeHandle
              position="top"
              cursor="grab"
              onMouseDown={(e) => shortcutArrowCreation(e, "top")}
              color="rgb(23, 104, 255)"
            />
            <ResizeHandle
              position="bottom"
              cursor="grab"
              onMouseDown={(e) => shortcutArrowCreation(e, "bottom")}
              color="rgb(23, 104, 255)"
            />
            <ResizeHandle
              position="left"
              cursor="grab"
              onMouseDown={(e) => shortcutArrowCreation(e, "left")}
              color="rgb(23, 104, 255)"
            />
            <ResizeHandle
              position="right"
              cursor="grab"
              onMouseDown={(e) => shortcutArrowCreation(e, "right")}
              color="rgb(23, 104, 255)"
            />
          </>
        )}
      </div>

      {/* Aktionsbar */}
      {isSelected && !onDragging && selectedElements.length === 1 && (
        <TextCardActionBar
          rect={{
            id: rect.id,

            top: position.y * scaleRef.current + offsetRef.current.y,
            left: position.x * scaleRef.current + offsetRef.current.x,
            width: size.width * scaleRef.current,

            textcardColor: properties.textcardColor,
            textcardBorderColor: properties.textcardBorderColor,
            borderWidth: properties.borderWidth,

            font: properties.font,
            fontStyles: properties.fontStyles,
            textSize: properties.textSize,
            textColor: properties.textColor,
            textAlignment: properties.textAlignment,
          }}
          updateTextcardStyle={updateTextcardStyle}
        />
      )}
    </>
  );
};

export default TextCard;
