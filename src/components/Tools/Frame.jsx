import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import FrameActionBar from "@/components/Tools/ActionBars/FrameActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";
import Handles from "@/components/Helper/Handles";
import FrameHeader from "@/components/Helper/Frame/FrameHeader";
import { FRAME_DEFAULTS } from "@/utils/Frame/frameDefaultProperties";
import { getFrameStyles } from "@/utils/Frame/frameStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";
import { ChatGPTService } from "@/services/ChatGPTService";
import { useCursor } from '@/components/Canvas/CursorContext';

const Frame = ({
  rect,
  headingText,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  onStartArrowFromFrame,
  onHeadingChange,
}) => {
  const [properties, setProperties] = useState(() => ({
    ...FRAME_DEFAULTS,
    ...rect,
  }));
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingHeading, setIsGeneratingHeading] = useState(false);
  const generationTriggeredRef = useRef(false);
  const chatGPTService = new ChatGPTService();
  const { setCursorStyle, cursorStyle: currentGlobalCursor } = useCursor();

  const {
    selectedTool,
    selectedElements,
    toggleSelectedElement,
    isDrawing,
    mouseDownElement,
    hoveredElement,
    isArrowDragging,
    headingGeneration,
    setHeadingGeneration,
  } = useCanvas();


  useEffect(() => {
    setPosition({ x: rect.x, y: rect.y });
    setSize({ width: rect.width, height: rect.height });
    // Nur notwendige Properties aus rect übernehmen
    setProperties(prev => ({ 
      ...prev, 
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    }));
  }, [rect.x, rect.y, rect.width, rect.height]);

  useEffect(() => {
    const generateAndSetHeading = async () => {
      if (headingGeneration[rect.id]?.generateHeading && headingGeneration[rect.id]?.text && !isGeneratingHeading && !generationTriggeredRef.current) {
        generationTriggeredRef.current = true;
        setIsGeneratingHeading(true);
        try {
          console.log("Generiere Überschrift für den Text", headingGeneration[rect.id]?.text);
          
          const response = await chatGPTService.generateHeading(headingGeneration[rect.id]?.text);
          const generatedHeading = response.content;
          
          onHeadingChange(generatedHeading);
          console.log("Erfolgreich Überschrift generiert:", generatedHeading);
        } catch (error) {
          console.error("Fehler bei der Überschriftgenerierung:", error);
          onHeadingChange("Heading..");
        } finally {
          setIsGeneratingHeading(false);
          setHeadingGeneration(prev => {
            const newState = { ...prev };
            delete newState[rect.id];
            return newState;
          });
        }
      }
    };
  
    generateAndSetHeading();
  }, [headingGeneration, rect.id, onHeadingChange, isGeneratingHeading, setHeadingGeneration, chatGPTService]);

  useEffect(() => {
    if (!headingGeneration[rect.id]?.generateHeading) {
      generationTriggeredRef.current = false;
    }
  }, [headingGeneration, rect.id]);


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

  const handleHeadingChange = (e) => {
    const newText = e;
    onHeadingChange(newText);
  };


  const handleMouseEnter = () => {
    if (currentGlobalCursor === 'default' || currentGlobalCursor === 'grab' || currentGlobalCursor === 'grabbing') {
       setCursorStyle("grab");
    }
  };

  const handleMouseLeave = () => {
    if (currentGlobalCursor === 'grab') { 
        setCursorStyle("default");
    }
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
    if (e.buttons !== 1) return;
    handleSelection(e);
    startDragging(e);
  };

  const handleResize = (e, handle) => {
    if (e.buttons !== 1) return;
    e.stopPropagation();
    handleSelection(e);
    startResizing(e, handle);
  };

  const handleArrowCreation = (e, handle) => {
    if (e.buttons !== 1) return;
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
        pointerEvents(),
        properties.zIndex,
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
      properties.zIndex,
    ]
  );

  return (
    <>
      <FrameHeader
        position={position}
        size={size}
        scale={scaleRef.current}
        offset={offsetRef.current}
        heading={headingText}
        textStyles={properties}
        onHeadingChange={handleHeadingChange}
        pointerEvents={frameStyles.pointerEvents}
        isLoading={isGeneratingHeading} 
      />
      <div style={frameStyles} onMouseDown={handleDrag} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {showActionBar && (
          <Handles
            onResize={handleResize}
            onCreateArrow={handleArrowCreation}
            text={headingText}
          />
        )}
      </div>
      {showActionBar && <FrameActionBar {...frameActionBarProps} />}
    </>
  );
};

export default Frame;
