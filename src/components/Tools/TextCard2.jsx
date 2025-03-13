import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import ResizeHandle from "@/components/Helper/ResizeHandle";
import TextCardActionBar from "@/components/Tools/ActionBars/TextCardActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";

const TextCard2 = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
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
    textAlign: "left",
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

  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [isDragging, setIsDragging] = useState(false);

  const isMouseDownElement = mouseDownElement?.id === rect.id;
  const isHoveredElement = hoveredElement?.id === rect.id;

  // Drag & Resize Hooks
  const { startDragging } = useDrag(
    position,
    scaleRef,
    (newPos) => {
      setPosition(newPos);
      onUpdate(rect.id, newPos.x, newPos.y);
    },
    setIsDragging
  );

  const { startResizing, isResizing } = useResize(
    size,
    position,
    scaleRef,
    offsetRef,
    (newSize, newPosition) => {
      setSize(newSize);
      setPosition(newPosition);
      onResize(rect.id, newSize, newPosition);
    }
  );



  useEffect(() => {
    setIsSelected(selectedElements.some((el) => el.id === rect.id));
  }, [selectedElements, rect.id]);



  const handleDrag = (e) => {
    if(isEditing) return;
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing, isDragging }, isMultiSelect);
    }
    startDragging(e);
  };

  const handleResize = (e, handle) => {
    e.stopPropagation();
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing, isDragging }, isMultiSelect);
    }
    startResizing(e, handle);
  };

  const handleEditing = () => {
    setIsEditing(true);
  }

  const handleArrowCreation = (e, handle) => {
    e.stopPropagation();
    onStartArrowFromFrame({
      elementId: rect.id,
      anchor: position,
      x: position.x,
      y: position.y,
    });
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
        onMouseDown={handleDrag}
        onDoubleClick={handleEditing}
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
              textAlign: properties.textAlign,
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
              textAlign: properties.textAlign,
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
        {isSelected && !isDragging && !isEditing && selectedElements.length === 1 && (
          <>
            <ResizeHandle
              position="top-left"
              cursor="nwse-resize"
              onMouseDown={(e) => handleResize(e, "top-left")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="top-right"
              cursor="nesw-resize"
              onMouseDown={(e) => handleResize(e, "top-right")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="bottom-left"
              cursor="nesw-resize"
              onMouseDown={(e) => handleResize(e, "bottom-left")}
              color="rgb(252, 252, 252)"
            />
            <ResizeHandle
              position="bottom-right"
              cursor="nwse-resize"
              onMouseDown={(e) => handleResize(e, "bottom-right")}
              color="rgb(252, 252, 252)"
            />

            {/* Arrow Handles */}
            {["top", "bottom", "left", "right"].map((pos) => (
              <ResizeHandle
                key={pos}
                position={pos}
                cursor="grab"
                onMouseDown={(e) => handleArrowCreation(e, pos)}
                color="rgb(23, 104, 255)"
              />
            ))}
          </>
        )}
      </div>

      {/* Aktionsbar */}
      {isSelected && !isDragging && selectedElements.length === 1 && (
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
            textAlign: properties.textAlign,
          }}
          updateTextcardStyle={updateTextcardStyle}
        />
      )}
    </>
  );
};

export default TextCard2;