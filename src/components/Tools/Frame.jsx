import { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import ResizeHandle from "@/components/Helper/ResizeHandle";
import TextInput from "@/components/Helper/TextInput";
import FrameActionBar from "@/components/Tools/ActionBars/FrameActionBar";

const Frame = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  canvasWrapperRef,
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
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [onDragging, setOnDragging] = useState(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const [heading, setHeading] = useState("");

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
    //e.preventDefault();

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
    if (isResizing.current && e.buttons === 1) {
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
    if (isDragging.current && e.buttons === 1) {
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Eingabefeld für Text (Überschrift) */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "0",
            zIndex: 5,
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

export default Frame;
