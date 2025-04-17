import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import Handles from "@/components/Helper/Handles";
import TextCardActionBar from "@/components/Tools/ActionBars/TextCardActionBar";
import useDrag from "@/hooks/useDrag";
import useResize from "@/hooks/useResize";
import { TEXTCARD_DEFAULTS } from "@/utils/Textcard/textcardDefaultProperties";
import { getTextcardStyles } from "@/utils/Textcard/textcardStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";
import TextCardContent from "@/components/Helper/Textcard/TextCardContent";
import { getElementsInRectangle } from "@/utils/elementUtils";
import { ChatGPTService } from "@/services/ChatGPTService";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";

const TextCard = ({
  rect,
  textcardText,
  scaleRef,
  offsetRef,
  onUpdate,
  onResize,
  onStartArrowFromFrame,
  onTextChange,
  elements,
  addTextcard,
}) => {
  const [properties, setProperties] = useState(() => ({
    ...TEXTCARD_DEFAULTS,
    ...rect,
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({ x: rect.x, y: rect.y });
  const [size, setSize] = useState({ width: rect.width, height: rect.height });
  const [isDragging, setIsDragging] = useState(false);
  const [textcardCache, setTextcardCache] = useState({});
  const [currentOverTextcard, setCurrentOverTextcard] = useState(null);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [accumulatedDistance, setAccumulatedDistance] = useState(0);
  const [lastPosition, setLastPosition] = useState({ x: position.x, y: position.y }); 
  const chatGPTService = new ChatGPTService();

  const {
    selectedTool,
    selectedElements,
    setSelectedElements,
    toggleSelectedElement,
    isDrawing,
    mouseDownElement,
    hoveredElement,
    isArrowDragging,
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

  const handleTextChange = (newText) => {
    //const newText = e.target.value;
    //setText(newText);
    onTextChange(newText);
  };



  useEffect(() => {
    if (!isDragging) return;
  
    const checkOverlappingTextCards = () => {
      const currentRect = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };

      const elementsInside = getElementsInRectangle(elements, currentRect);
      const textCardsInside = elementsInside.filter((element) => element.type === 'textcard' && element.id !== rect.id);

      if (textCardsInside.length === 0) {
        setCurrentOverTextcard(null);
      }

      const dx = position.x - lastPosition.x;
      const dy = position.y - lastPosition.y;
      const frameDistance = Math.sqrt(dx * dx + dy * dy);

      const newAccumulatedDistance = accumulatedDistance + frameDistance;
      setLastPosition({ x: position.x, y: position.y });

      const DISTANCE_THRESHOLD = 50;

      if (newAccumulatedDistance >= DISTANCE_THRESHOLD) {
        setCurrentResponseIndex(prev => {
          const cacheEntry = currentOverTextcard?.id ? textcardCache[currentOverTextcard.id] : null;
          const responseCount = cacheEntry?.responses?.length || 0;
          return responseCount > 0 ? (prev + 1) % responseCount : 0;
        });
        setAccumulatedDistance(0);

        const elementsInside = getElementsInRectangle(elements, currentRect);
        const textCardsInside = elementsInside.filter((element) => element.type === 'textcard' && element.id !== rect.id);

        if (textCardsInside.length > 0) {
          const topTextCard = textCardsInside.reduce((prev, current) => 
            prev.zIndex > current.zIndex ? prev : current
          );
    
          // Wenn wir eine neue Textkarte überfahren
          if (topTextCard.id !== currentOverTextcard?.id) {
            setCurrentOverTextcard(topTextCard);
            setCurrentResponseIndex(0);

            const cacheEntry = textcardCache[topTextCard.id];
            
            if (!cacheEntry && topTextCard.text && textcardText) {
              console.log("Neue Textkarte gefunden, starte ChatGPT-Aufruf");
              getTextcardCombinationTexts(topTextCard.text, topTextCard.id);
            } 
            else if (cacheEntry && cacheEntry.responses) {
              console.log("Verwende zwischengespeicherte Antworten");
              useCachedResponses(topTextCard.id);
            }
          }
        } else {
          setCurrentOverTextcard(null);
          setAccumulatedDistance(0);
        }
      } else {
        setAccumulatedDistance(newAccumulatedDistance);
      }
    };
  
    const intervalId = setInterval(checkOverlappingTextCards, 10);
    return () => clearInterval(intervalId);
  }, [isDragging, position, size, elements, rect.id, textcardText, currentOverTextcard, setCurrentOverTextcard, textcardCache, accumulatedDistance, lastPosition, currentResponseIndex]);

  const handleDragEnd = useCallback(() => {
    if(currentOverTextcard && !textcardCache[currentOverTextcard.id].isGeneratingResponse) {
      const findFreePosition = (baseCard, depth = 0) => {
        // Sicherheitsabbruch nach 10 Versuchen
        if (depth > 10) return baseCard;
  
        const testRect = {
          x: baseCard.position.x,
          y: baseCard.position.y + baseCard.size.height + 25,
          width: baseCard.size.width,
          height: baseCard.size.height
        };
  
        const elementsInside = getElementsInRectangle(elements, testRect);
        const overlappingCards = elementsInside.filter(e => e.type === 'textcard');
  
        if (overlappingCards.length > 0) {
          // Nächste Position testen (rekursiv)
          return findFreePosition({
            position: { x: testRect.x, y: testRect.y },
            size: { width: testRect.width, height: testRect.height }
          }, depth + 1);
        }
  
        return testRect;
      };
  
      // Startposition bestimmen
      const freePosition = findFreePosition(currentOverTextcard);
  
      // Neue Textkarte erstellen
      const newTextcard = {
        x: freePosition.x,
        y: freePosition.y,
        width: currentOverTextcard.size.width,
        height: currentOverTextcard.size.height,
        text: textcardCache[currentOverTextcard.id].responses[currentResponseIndex]
      };
  
      addTextcard(newTextcard);
      setCurrentOverTextcard(null);
      setSelectedElements([]);
      setAccumulatedDistance(0);
    } else if(currentOverTextcard && textcardCache[currentOverTextcard.id].isGeneratingResponse) {
      //setCurrentOverTextcard(null);
      setSelectedElements([]);
      setAccumulatedDistance(0);
    }
  }, [currentOverTextcard, textcardCache, currentResponseIndex, elements]);

  const getTextcardCombinationTexts = async (text, sourceId) => {
    try {
      setTextcardCache(prev => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: true,
          responses: []
        }
      }));

      console.log("Eingabe für Prompt:\n", textcardText, " | ", text);
      const response = await chatGPTService.combineTextcards(textcardText, text);
      console.log("ChatGPT Antwort", response.content);

      let parsedData = [];
      try {
        parsedData = JSON.parse(response.content);
      } catch (error) {
        console.error("JSON Parse Error:", error);
        parsedData = { response: [] }; // Fallback
      }

      const responses = Array.isArray(parsedData?.response) 
        ? parsedData.response.map(text => text.trim()).slice(0, 5) 
        : [];

      console.log("Final Responses:", responses);

      setTextcardCache(prev => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: false,
          responses: responses
        }
      }));
    } catch (error) {
      console.error("Fehler bei ChatGPT-Anfrage:", error);
      setTextcardCache(prev => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: false,
          responses: [],
          error: true
        }
      }));
    }
  }

  const useCachedResponses = (sourceId) => {
    const cacheEntry = textcardCache[sourceId];
    
    if (!cacheEntry || !cacheEntry.responses || cacheEntry.responses.length === 0) {
      console.log("Keine zwischengespeicherten Antworten vorhanden");
      return;
    }

    console.log("Use Cached Response", cacheEntry.responses[0]);
  }



  const { startDragging } = useDrag(
    position,
    scaleRef,
    (newPos) => {
      setPosition(newPos);
      onUpdate(rect.id, newPos.x, newPos.y);
    },
    setIsDragging,
    handleDragEnd
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

  const handleDoubleClick = useCallback((e) => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

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
        isDragging,
        currentOverTextcard,
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
      isDragging,
      currentOverTextcard,
    ]
  );

  return (
    <>
      {currentOverTextcard && (
        <PreviewTextcard 
          key={rect.id}
          finalTop={(currentOverTextcard.position.y - currentOverTextcard.size.height - 25) * scaleRef.current + offsetRef.current.y}
          finalLeft={currentOverTextcard.position.x * scaleRef.current + offsetRef.current.x}
          scaledWidth={currentOverTextcard.size.width * scaleRef.current}
          scaledHeight={currentOverTextcard.size.height * scaleRef.current}
          isLoading={textcardCache[currentOverTextcard.id]?.isGeneratingResponse}
          previewTextContent={textcardCache[currentOverTextcard.id]?.responses[currentResponseIndex]}
        />
      )}
      <div
        style={textcardStyles}
        onMouseDown={handleDrag}
        onDoubleClick={handleEditing}
      >
        <TextCardContent
          isEditing={isEditing}
          text={textcardText}
          onChange={handleTextChange}
          onBlur={() => setIsEditing(false)}
          textAlign={properties.textAlign}
          textColor={properties.textColor}
          font={properties.font}
          textSize={properties.textSize}
          fontStyles={properties.fontStyles}
          containerSize={size}
          scale={scaleRef.current}
          onDoubleClick={handleDoubleClick}
        />
        {showActionBar && (
          <Handles
            onResize={handleResize}
            onCreateArrow={handleArrowCreation}
            text={textcardText}
          />
        )}
      </div>
      {showActionBar && <TextCardActionBar {...textcardActionBarProps} />}
    </>
  );
};

export default TextCard;
