import { useState, useCallback, useMemo } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import FrameActionBar from "@/components/Tools/ActionBars/FrameActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";
import Handles from "@/components/Helper/Handles";
import FrameHeader from "@/components/Helper/FrameHeader";
import { FRAME_DEFAULTS } from "@/utils/frameDefaultProperties";
import { getFrameStyles } from "@/utils/frameStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";

const Frame2 = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  onStartArrowFromFrame,
}) => {
  const [properties, setProperties] = useState(() => ({
    ...FRAME_DEFAULTS,
    ...rect,
  }));
  const [heading, setHeading] = useState("");
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [isDragging, setIsDragging] = useState(false);

  const {
    selectedTool,
    selectedElements,
    toggleSelectedElement,
    isDrawing,
    mouseDownElement,
    hoveredElement,
    isArrowDragging,
  } = useCanvas();

  const isSelected = useMemo(
    () => selectedElements.some((el) => el.id === rect.id),
    [selectedElements, rect.id]
  );

  const showActionBar = useMemo(
    () => isSelected && !isDragging && selectedElements.length === 1,
    [isSelected, isDragging, selectedElements.length]
  );

  const updateFrameStyle = useCallback((newProps) => {
    setProperties((prev) => ({ ...prev, ...newProps }));
  }, []);

  const frameActionBarProps = useMemo(
    () => ({
      rect: {
        ...properties,
        id: rect.id,
        top: position.y * scaleRef.current + offsetRef.current.y,
        left: position.x * scaleRef.current + offsetRef.current.x,
        width: size.width * scaleRef.current,
      },
      updateFrameStyle,
    }),
    [properties, position, size, scaleRef.current, offsetRef.current, rect.id]
  );

  const handleSelection = useCallback(
    (e) => {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleSelectedElement({ ...rect, isResizing, isDragging }, isMultiSelect);
    },
    [toggleSelectedElement, rect, isResizing, isDragging]
  );

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

  const handleDrag = (e) => {
    handleSelection(e);
    startDragging(e);
  };

  const handleResize = (e, handle) => {
    e.stopPropagation();
    handleSelection(e);
    startResizing(e, handle);
  };

  const handleArrowCreation = (e, handle) => {
    e.stopPropagation();
    onStartArrowFromFrame({
      elementId: rect.id,
      anchor: position,
      x: position.x,
      y: position.y,
    });
  };

  const pointerEvents = useCallback(
    () => getPointerEvents({
      selectedTool,
      isDrawing,
      selectedElements,
      isArrowDragging,
      elementId: rect.id
    }),
    [selectedTool, isDrawing, selectedElements, isArrowDragging, rect.id]
  );

  const frameStyles = useMemo(
    () =>
      getFrameStyles(
        position,
        size,
        scaleRef.current,
        offsetRef.current,
        properties,
        isSelected,
        hoveredElement?.id === rect.id,
        mouseDownElement?.id === rect.id,
        pointerEvents()
      ),
    [
      position,
      size,
      scaleRef.current,
      offsetRef.current,
      properties,
      isSelected,
      rect.id,
      hoveredElement,
      mouseDownElement,
      pointerEvents(),
    ]
  );

  return (
    <>
      <div style={frameStyles} onMouseDown={handleDrag}>
        {showActionBar && (
          <Handles
            onResize={handleResize}
            onCreateArrow={handleArrowCreation}
          />
        )}
      </div>

      <FrameHeader
        position={position}
        size={size}
        scale={scaleRef.current}
        offset={offsetRef.current}
        heading={heading}
        textStyles={properties}
        onHeadingChange={setHeading}
      />

      {showActionBar && <FrameActionBar {...frameActionBarProps} />}
    </>
  );
};

export default Frame2;
