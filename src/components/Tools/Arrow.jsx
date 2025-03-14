import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import ArrowHandles from "@/components/Helper/Arrow/ArrowHandles";
import ArrowLabel from "@/components/Helper/Arrow/ArrowLabel";
import ArrowActionBar from "@/components/Tools/ActionBars/ArrowActionBar";
import { getAnchorPosition, getClosestAnchor } from "@/utils/Arrow/anchorUtils";
import { getElementAtPosition } from "@/utils/Arrow/elementUtils";
import ArrowHeads from "@/components/Helper/Arrow/ArrowHeads";
import { ARROW_DEFAULTS } from "@/utils/Arrow/arrowDefaultProperties";
import { getArrowStyles } from "@/utils/Arrow/arrowStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";

const Arrow = ({
  arrow,
  scaleRef,
  offsetRef,
  elements,
  updateArrowPosition,
  canvasWrapperRef,
  canvasRef,
}) => {
  const [properties, setProperties] = useState(() => ({
    ...ARROW_DEFAULTS,
    ...arrow,
  }));

  const [isSelected, setIsSelected] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [text, setText] = useState("");
  const frameRef = useRef(null);
  const isDragging = useRef(false);

  const {
    selectedTool,
    selectedElements,
    toggleSelectedElement,
    isDrawing,
    setHoveredElement,
    setIsArrowDragging,
  } = useCanvas();

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

  const lineAngle = Math.atan2(endY - startY, endX - startX);

  const updateArrowStyle = useCallback((newProps) => {
    setProperties((prev) => ({ ...prev, ...newProps }));
  }, []);

  const arrowActionBarProps = useMemo(
    () => ({
      arrow: {
        ...properties,
        id: arrow.id,
        endY: endY * scaleRef.current + offsetRef.current.y,
        startY: startY * scaleRef.current + offsetRef.current.y,
        middleX: middleX * scaleRef.current + offsetRef.current.x,
      },
      updateArrowStyle,
    }),
    [
      properties,
      startY,
      endY,
      middleX,
      scaleRef.current,
      offsetRef.current,
      arrow.id,
    ]
  );

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

  const pointerEvents = getPointerEvents({
    selectedTool,
    isDrawing,
    selectedElements,
    elementId: arrow.id,
  });

  const arrowStyles = useMemo(
    () =>
      getArrowStyles(
        startX,
        startY,
        endX,
        endY,
        scaleRef.current,
        offsetRef.current,
        properties,
        isSelected,
        pointerEvents
      ),
    [
      startX,
      startY,
      endX,
      endY,
      scaleRef.current,
      offsetRef.current,
      properties,
      isSelected,
      pointerEvents,
    ]
  );

  return (
    <>
      <div ref={frameRef} style={arrowStyles} onClick={SelectArrow} />

      <ArrowHeads
        start={properties.arrowHeadStart}
        end={properties.arrowHeadEnd}
        startX={startX}
        startY={startY}
        endX={endX}
        endY={endY}
        scale={scaleRef.current}
        offset={offsetRef.current}
        lineAngle={lineAngle}
        color={properties.lineColor}
      />

      <ArrowLabel
        middleX={middleX}
        middleY={middleY}
        scale={scaleRef.current}
        offset={offsetRef.current}
        textAlignment={properties.textAlignment}
        text={text}
        onChange={setText}
        start={{ x: startX, y: startY }}
        end={{ x: endX, y: endY }}
        textSize={properties.textSize}
        textColor={properties.textColor}
      />

      {isSelected && (
        <>
          <ArrowHandles
            start={{ x: startX, y: startY }}
            middle={{ x: middleX, y: middleY }}
            end={{ x: endX, y: endY }}
            scale={scaleRef.current}
            offset={offsetRef.current}
            lineWidth={properties.lineWidth}
            onDragStart={StartDragging}
            onDragEnd={StopDragging}
          />

          <ArrowActionBar {...arrowActionBarProps} />
        </>
      )}
    </>
  );
};

export default Arrow;
