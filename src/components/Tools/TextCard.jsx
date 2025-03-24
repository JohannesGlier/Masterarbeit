import React, { useState, useCallback, useMemo } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import Handles from "@/components/Helper/Handles";
import TextCardActionBar from "@/components/Tools/ActionBars/TextCardActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";
import { TEXTCARD_DEFAULTS } from "@/utils/Textcard/textcardDefaultProperties";
import { getTextcardStyles } from "@/utils/Textcard/textcardStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";
import TextCardContent from "@/components/Helper/Textcard/TextCardContent";

const TextCard = ({
  rect,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  onStartArrowFromFrame,
  onTextChange,
}) => {
  const [properties, setProperties] = useState(() => ({
    ...TEXTCARD_DEFAULTS,
    ...rect,
  }));
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
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

  const updateTextcardStyle = useCallback((newProps) => {
    setProperties((prev) => ({ ...prev, ...newProps }));
  }, []);

  const textcardActionBarProps = useMemo(
    () => ({
      rect: {
        ...properties,
        id: rect.id,
        top: position.y * scaleRef.current + offsetRef.current.y,
        left: position.x * scaleRef.current + offsetRef.current.x,
        width: size.width * scaleRef.current,
      },
      updateTextcardStyle,
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

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

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
    if (isEditing) return;
    handleSelection(e);
    startDragging(e);
  };

  const handleResize = (e, handle) => {
    e.stopPropagation();
    handleSelection(e);
    startResizing(e, handle);
  };

  const handleEditing = () => {
    setIsEditing(true);
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
    () =>
      getPointerEvents({
        selectedTool,
        isDrawing,
        selectedElements,
        isArrowDragging,
        elementId: rect.id,
      }),
    [selectedTool, isDrawing, selectedElements, isArrowDragging, rect.id]
  );

  const textcardStyles = useMemo(
    () =>
      getTextcardStyles(
        position,
        size,
        scaleRef.current,
        offsetRef.current,
        properties,
        isSelected,
        hoveredElement?.id === rect.id,
        mouseDownElement?.id === rect.id,
        isEditing,
        pointerEvents(),
        rect.zIndex,
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
      isEditing,
      pointerEvents(),
      rect.zIndex,
    ]
  );

  return (
    <>
      <div
        style={textcardStyles}
        onMouseDown={handleDrag}
        onDoubleClick={handleEditing}
      >
        <TextCardContent
          isEditing={isEditing}
          text={text}
          onChange={handleTextChange}
          onBlur={() => setIsEditing(false)}
          textAlign={properties.textAlign}
          textColor={properties.textColor}
          font={properties.font}
          textSize={properties.textSize}
          fontStyles={properties.fontStyles}
        />
        {showActionBar && (
          <Handles
            onResize={handleResize}
            onCreateArrow={handleArrowCreation}
          />
        )}
      </div>
      {showActionBar && <TextCardActionBar {...textcardActionBarProps} />}
    </>
  );
};

export default TextCard;
