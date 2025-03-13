import { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import ResizeHandle from "@/components/Helper/ResizeHandle";
import TextInput from "@/components/Helper/TextInput";
import FrameActionBar from "@/components/Tools/ActionBars/FrameActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";

const Frame2 = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  onStartArrowFromFrame,
}) => {
  const defaultFrameProperties = {
    frameColor: "rgb(205, 205, 205)",
    frameBorderColor: "#000000",
    borderWidth: 2,
    font: "Arial",
    fontStyles: { bold: false, italic: false, underline: false },
    textSize: 18,
    textColor: "#000000",
    textAlignment: "left",
    layer: 5,
  };

  const frameProperties = { ...defaultFrameProperties, ...rect };
  const [properties, setProperties] = useState(frameProperties);

  const updateFrameStyle = (newProperties) => {
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

  const [heading, setHeading] = useState("");
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

  const handleMouseDown = (e) => {
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing, isDragging }, isMultiSelect);
    }
    startDragging(e);
  };

  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation();
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing, isDragging }, isMultiSelect);
    }
    startResizing(e, handle);
  };

  const shortcutArrowCreation = (e, handle) => {
    e.stopPropagation();
    onStartArrowFromFrame({
      elementId: rect.id,
      anchor: position,
      x: position.x,
      y: position.y,
    });
  };

  // Pointer Events Logik bleibt gleich
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
          backgroundColor: properties.frameColor,
          border:
            isSelected || isMouseDownElement || isHoveredElement
              ? "3px solid rgb(23, 104, 255)"
              : `${properties.borderWidth}px solid ${properties.frameBorderColor}`,
          cursor: "grab",
          zIndex: 5,
          pointerEvents,
        }}
        onMouseDown={handleMouseDown}
      >
        {isSelected && !isDragging && selectedElements.length === 1 && (
          <>
            {/* Resize Handles */}
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

            {/* Arrow Handles */}
            {["top", "bottom", "left", "right"].map((pos) => (
              <ResizeHandle
                key={pos}
                position={pos}
                cursor="grab"
                onMouseDown={(e) => shortcutArrowCreation(e, pos)}
                color="rgb(23, 104, 255)"
              />
            ))}
          </>
        )}
      </div>

      {/* Eingabefeld für Text (Überschrift) */}
      <div
        style={{
          position: "absolute",
          top: position.y * scaleRef.current + offsetRef.current.y - 40,
          left: position.x * scaleRef.current + offsetRef.current.x,
          zIndex: 4,
        }}
      >
        <TextInput
          placeholder="Überschrift"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          minWidth={`${size.width * scaleRef.current}px`}
          maxWidth={`${size.width * scaleRef.current}px`}
          textAlign={properties.textAlignment}
          fontSize={properties.textSize}
          textColor={properties.textColor}
          fontStyles={properties.fontStyles}
          font={properties.font}
        />
      </div>

      {isSelected && !isDragging && selectedElements.length === 1 && (
        <FrameActionBar
          rect={{
            id: rect.id,

            top: position.y * scaleRef.current + offsetRef.current.y,
            left: position.x * scaleRef.current + offsetRef.current.x,
            width: size.width * scaleRef.current,

            frameColor: properties.frameColor,
            frameBorderColor: properties.frameBorderColor,
            borderWidth: properties.borderWidth,

            font: properties.font,
            fontStyles: properties.fontStyles,
            textSize: properties.textSize,
            textColor: properties.textColor,
            textAlignment: properties.textAlignment,

            layer: properties.layer,
          }}
          updateFrameStyle={updateFrameStyle}
        />
      )}
    </>
  );
};

export default Frame2;
