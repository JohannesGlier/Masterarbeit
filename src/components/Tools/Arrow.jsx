import React, { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import ArrowHandle from "@/components/Helper/ArrowHandle";
import TextInput from "@/components/Helper/TextInput";
import ArrowActionBar from "@/components/Tools/ActionBars/ArrowActionBar";
import { getAnchorPosition, getClosestAnchor } from "@/utils/anchorUtils";
import { getElementAtPosition } from "@/utils/elementUtils";

const Arrow = ({
  arrow,
  scaleRef,
  offsetRef,
  elements,
  updateArrowPosition,
  canvasWrapperRef,
  canvasRef,
}) => {
  const defaultArrowProperties = {
    lineColor: "#000000",
    lineStyle: "solid",
    lineWidth: 2,
    arrowHeadStart: false,
    arrowHeadEnd: false,
    textSize: 14,
    textColor: "#000000",
    textAlignment: "horizontal",
  };
  const arrowProperties = { ...defaultArrowProperties, ...arrow };
  const [properties, setProperties] = useState(arrowProperties);

  const updateArrowStyle = (newProperties) => {
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
    setHoveredElement,
    setIsArrowDragging,
  } = useCanvas();
  const [isSelected, setIsSelected] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [text, setText] = useState("");
  const frameRef = useRef(null);
  const isDragging = useRef(false);

  const start = arrow.start.elementId
    ? elements.find((element) => element.id === arrow.start.elementId)
    : null;

  const end = arrow.end.elementId
    ? elements.find((element) => element.id === arrow.end.elementId)
    : null;

  const startPos = start
    ? getAnchorPosition(start, arrow.start.anchor)
    : { x: arrow.start.x, y: arrow.start.y };

  const endPos = end
    ? getAnchorPosition(end, arrow.end.anchor)
    : { x: arrow.end.x, y: arrow.end.y };

  const startX = startPos.x;
  const startY = startPos.y;
  const endX = endPos.x;
  const endY = endPos.y;

  // Mittelpunkt berechnen
  const middleX = (startX + endX) / 2;
  const middleY = (startY + endY) / 2;

  useEffect(() => {
    setIsSelected(selectedElements.some((el) => el.id === arrow.id));
  }, [selectedElements, arrow.id]);

  useEffect(() => {
    const handleMouseUp = (e) => {
      if (draggingPoint) {
        StopDragging(e);
      }
    };

    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper.addEventListener("mousemove", HandleDragging);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvasWrapper.removeEventListener("mousemove", HandleDragging);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canvasWrapperRef, arrow, updateArrowPosition, draggingPoint]);

  const StartDragging = (point, e) => {
    e.preventDefault();
    if (e.buttons === 1) {
      console.log("Start Dragging Arrow");

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          { ...arrow, isDragging: isDragging.current },
          isMultiSelect
        );
      }

      setDraggingPoint(point);
      isDragging.current = true;
      setIsArrowDragging(true);
    }
  };

  const HandleDragging = (e) => {
    if (draggingPoint && e.buttons === 1) {
      isDragging.current = true;

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          { ...arrow, isDragging: isDragging.current },
          isMultiSelect
        );
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX =
        (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const offsetY =
        (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      const element = getElementAtPosition(elements, offsetX, offsetY);
      setHoveredElement(element);

      let newPosition = {
        x: offsetX, // Standardmäßig Mausposition
        y: offsetY,
      };

      // Nur snappen wenn über Element
      if (element) {
        const referencePoint =
          draggingPoint === "start"
            ? { x: endX, y: endY }
            : { x: startX, y: startY };

        const anchorData = getClosestAnchor(
          element,
          referencePoint.x,
          referencePoint.y
        );

        newPosition = {
          elementId: element.id,
          anchor: anchorData.anchor,
          x: anchorData.x,
          y: anchorData.y,
        };
      }

      updateArrowPosition(arrow.id, newPosition, draggingPoint);
    }
  };

  const StopDragging = (e) => {
    if (draggingPoint) {
      console.log("Stop Dragging Arrow");
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX =
        (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const offsetY =
        (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      const element = getElementAtPosition(elements, offsetX, offsetY);
      let newPosition = { x: offsetX, y: offsetY };

      // Nur beim Loslassen über einem Element snappen
      if (element) {
        const referencePoint =
          draggingPoint === "start"
            ? { x: endX, y: endY }
            : { x: startX, y: startY };

        const anchorData = getClosestAnchor(
          element,
          referencePoint.x,
          referencePoint.y
        );

        newPosition = {
          elementId: element.id,
          anchor: anchorData.anchor,
          x: anchorData.x,
          y: anchorData.y,
        };
      }

      // Entkoppeln wenn nicht über Element
      updateArrowPosition(arrow.id, newPosition, draggingPoint);

      console.log("Stop Dragging Arrow");
      setDraggingPoint(null);
      setHoveredElement(null);
      isDragging.current = false;
      setIsArrowDragging(false);

      if (selectedTool === "Pointer") {
        const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        toggleSelectedElement(
          { ...arrow, isDragging: isDragging.current },
          isMultiSelect
        );
      }
    }
  };

  const SelectArrow = (e) => {
    e.stopPropagation();
    console.log("Select Arrow");
    if (selectedTool === "Pointer") {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...arrow, isDragging: false }, isMultiSelect);
    }
  };

  const pointerEvents =
    selectedTool !== "Pointer" // Wenn nicht "Pointer" ausgewählt ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : isDrawing && selectedTool === "Pointer" // Wenn isDrawing true ist UND der Tool "Pointer" ist
      ? "none" // Deaktiviere pointer-events für alle Elemente
      : selectedElements.some((el) => el.isResizing || el.isDragging)
      ? selectedElements.find((el) => el.id === arrow.id)?.isResizing ||
        selectedElements.find((el) => el.id === arrow.id)?.isDragging
        ? "none" // Aktiviere pointer-events nur für das Element, das geresized wird
        : "none" // Deaktiviere pointer-events für alle anderen Elemente
      : "auto";

  return (
    <>
      <div
        ref={frameRef}
        style={{
          position: "absolute",
          top: startY * scaleRef.current + offsetRef.current.y,
          left: startX * scaleRef.current + offsetRef.current.x,
          width: `${
            Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) *
            scaleRef.current
          }px`,
          height: "2px",
          color: isSelected ? "blue" : properties.lineColor,
          borderStyle: properties.lineStyle,
          borderWidth: properties.lineWidth,
          transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
          transformOrigin: "0 0",
          pointerEvents,
          zIndex: 4,
          cursor: "pointer",
        }}
        onClick={(e) => SelectArrow(e)}
      />
      <div
        style={{
          position: "absolute",
          top: middleY * scaleRef.current + offsetRef.current.y - 25,
          left: middleX * scaleRef.current + offsetRef.current.x,
          transform:
            properties.textAlignment === "horizontal"
              ? `translate(-50%, -50%) rotate(${Math.atan2(
                  endY - startY,
                  endX - startX
                )}rad)`
              : "translate(-50%, -50%)",
          zIndex: 5,
        }}
      >
        <TextInput
          placeholder="Enter Prompt.."
          value={text}
          onChange={(e) => setText(e.target.value)}
          minWidth={150}
          maxWidth={250}
          textAlign={"center"}
          fontSize={properties.textSize}
          textColor={properties.textColor}
          fontStyles={{ bold: false, italic: false, underline: false }}
          font={"Arial"}
        />
      </div>

      {isSelected && (
        <>
          {/* Startpunkt */}
          <ArrowHandle
            top={
              startY * scaleRef.current +
              offsetRef.current.y +
              properties.lineWidth
            }
            left={startX * scaleRef.current + offsetRef.current.x}
            size={20 + properties.lineWidth}
            onMouseDown={(e) => StartDragging("start", e)}
            onMouseUp={(e) => StopDragging(e)}
          />
          {/* Mittelpunkt */}
          <ArrowHandle
            top={
              middleY * scaleRef.current +
              offsetRef.current.y +
              properties.lineWidth
            }
            left={middleX * scaleRef.current + offsetRef.current.x}
            cursor="default"
            size={15 + properties.lineWidth}
          />
          {/* Endpunkt */}
          <ArrowHandle
            top={
              endY * scaleRef.current +
              offsetRef.current.y +
              properties.lineWidth
            }
            left={endX * scaleRef.current + offsetRef.current.x}
            onMouseDown={(e) => StartDragging("end", e)}
            onMouseUp={(e) => StopDragging(e)}
            size={20 + properties.lineWidth}
          />

          {/* Aktionsbar */}
          <ArrowActionBar
            arrow={{
              id: arrow.id,
              endY: endY * scaleRef.current + offsetRef.current.y,
              startY: startY * scaleRef.current + offsetRef.current.y,
              middleX: middleX * scaleRef.current + offsetRef.current.x,
              middleY: middleY * scaleRef.current + offsetRef.current.y,
              lineStyle: properties.lineStyle,
              arrowHeadStart: properties.arrowHeadStart,
              arrowHeadEnd: properties.arrowHeadEnd,
              lineColor: properties.lineColor,
              lineWidth: properties.lineWidth,
              textSize: properties.textSize,
              textColor: properties.textColor,
              textAlignment: properties.textAlignment,
            }}
            updateArrowStyle={updateArrowStyle}
          />
        </>
      )}
    </>
  );
};

export default Arrow;
