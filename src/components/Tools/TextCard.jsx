import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { useCursor } from "@/components/Canvas/CursorContext";
import { useLanguage } from "@/components/Canvas/LanguageContext";
import animationStyles from "@/components/Tools/PreviewTools/ArrowTool.module.css";

const TEXTCARD_SIZE_STAGES = [
  // thresholdWidth: Die maximale Breite für diese Stufe (exklusiv der nächsten)
  { name: "Original Text", thresholdWidth: 150, representativeHeight: 50 },
  { name: "Keywords", thresholdWidth: 190, representativeHeight: 60 },
  { name: "Examples", thresholdWidth: 250, representativeHeight: 70 },
  { name: "Short Text", thresholdWidth: 300, representativeHeight: 100 },
  { name: "Medium Text", thresholdWidth: 350, representativeHeight: 150 },
  { name: "Long Text", thresholdWidth: Infinity, representativeHeight: 200 }, // Letzte Stufe ohne obere Grenze
];

const ORIGINAL_TEXT_STAGE_KEY = "Original Text";

const classifySizeStage = (currentWidth, stages) => {
  if (!stages || stages.length === 0) return null;

  for (const stage of stages) {
    if (currentWidth < stage.thresholdWidth) {
      return stage.name;
    }
  }
  return stages[stages.length - 1].name;
};

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
  onAiGenerationComplete
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
  const [lastPosition, setLastPosition] = useState({
    x: position.x,
    y: position.y,
  });
  const { language } = useLanguage();
  const chatGPTService = useMemo(() => {
    console.log(`Initializing ChatGPTService with language: ${language}`);
    return new ChatGPTService(language); // Übergebe die Sprache an den Konstruktor
  }, [language]);
  const { setCursorStyle, cursorStyle: currentGlobalCursor } = useCursor();

  const [currentResizeStageName, setCurrentResizeStageName] = useState(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  const [stagedTexts, setStagedTexts] = useState({});
  const hasDoneInitialGenerationRef = useRef(false);
  const initialBaseTextForGenerationsRef = useRef(null);
  const [optimisticDisplayText, setOptimisticDisplayText] = useState(null);
  const [isGeneratingStagedTexts, setIsGeneratingStagedTexts] = useState(false);

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
    if (!hasDoneInitialGenerationRef.current) {
      setStagedTexts(prev => ({ ...prev, [ORIGINAL_TEXT_STAGE_KEY]: textcardText }));
    }
  }, [textcardText]);

  useEffect(() => {
    if (optimisticDisplayText !== null && optimisticDisplayText === textcardText) {
      // Die Prop textcardText hat den optimistischen Wert übernommen, wir brauchen den Override nicht mehr.
      setOptimisticDisplayText(null);
    }
  }, [textcardText, optimisticDisplayText]);

  useEffect(() => {
    if (!isResizing && hasDoneInitialGenerationRef.current && initialBaseTextForGenerationsRef.current) {
      const currentStageNameAtRest = classifySizeStage(size.width, TEXTCARD_SIZE_STAGES);
      const textFromGeneratedStage = stagedTexts[currentStageNameAtRest];
      
      const fallbackText = stagedTexts[ORIGINAL_TEXT_STAGE_KEY] || initialBaseTextForGenerationsRef.current;

      let textToConsiderApply = textFromGeneratedStage;

      if (
        !textToConsiderApply ||
        textToConsiderApply === "Generiere..." ||
        typeof textToConsiderApply === 'string' && (textToConsiderApply.startsWith("Fehler für") || textToConsiderApply.endsWith("n.v.)"))
      ) {
        textToConsiderApply = fallbackText;
      }

      if (textToConsiderApply && textToConsiderApply !== textcardText) {
        console.log(
          `Staged text for stage "${currentStageNameAtRest}" (value: "${textToConsiderApply}") became available after resize or changed. Updating card text from "${textcardText}".`
        );
        onTextChange(textToConsiderApply);
      }
    }
  }, [
    stagedTexts,
    isResizing,
    size.width,
    textcardText,
    onTextChange,
  ]);

  useEffect(() => {
    const updateLabelPos = (e) => {
      setLabelPosition({ x: e.clientX, y: e.clientY });
    };

    if (isResizing) {
      window.addEventListener('mousemove', updateLabelPos);
      const currentStage = classifySizeStage(size.width, TEXTCARD_SIZE_STAGES);
      setCurrentResizeStageName(currentStage);

      return () => {
        window.removeEventListener('mousemove', updateLabelPos);
        setCurrentResizeStageName(null); // Label-Text entfernen

        if (hasDoneInitialGenerationRef.current) {
          const finalStageName = classifySizeStage(size.width, TEXTCARD_SIZE_STAGES);
          let textToApply = stagedTexts[finalStageName] || stagedTexts[ORIGINAL_TEXT_STAGE_KEY] || initialBaseTextForGenerationsRef.current;

          if (textToApply === "Generiere..." || typeof textToApply === 'undefined') {
            textToApply = stagedTexts[ORIGINAL_TEXT_STAGE_KEY] || initialBaseTextForGenerationsRef.current || textcardText;
          }

          if (textToApply) {
            setOptimisticDisplayText(textToApply); 
            if (textToApply !== textcardText) { 
              onTextChange(textToApply);
            }
          }
        } else {
          setOptimisticDisplayText(null); // Kein optimistischer Text, wenn keine Generierung stattfand
        }
      };
    }
  }, [
    isResizing,
    size.width,
    stagedTexts,
    textcardText,
    onTextChange,
    initialBaseTextForGenerationsRef,
    hasDoneInitialGenerationRef,
    setOptimisticDisplayText,
    setCurrentResizeStageName,
    setLabelPosition
  ]);

  useEffect(() => {
    setPosition({ x: rect.x, y: rect.y });
    setSize({ width: rect.width, height: rect.height });
    setProperties((prev) => ({
      ...prev,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
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
    if (!isDragging && !currentOverTextcard) {
      // Wenn nicht gezogen wird UND keine Karte überlappt ist, kann die Prüfung gestoppt werden.
      return;
    }

    const checkOverlappingTextCards = () => {
      const currentRect = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };

      const elementsInside = getElementsInRectangle(elements, currentRect);
      const textCardsInside = elementsInside.filter((element) => element.type === "textcard" && element.id !== rect.id);

      if (textCardsInside.length > 0) {
        const topTextCard = textCardsInside.reduce((prev, current) =>prev.zIndex > current.zIndex ? prev : current);

        if (topTextCard.id !== currentOverTextcard?.id) {
          setCurrentOverTextcard(topTextCard);
          const cacheEntry = textcardCache[topTextCard.id];

          if ((!cacheEntry || !cacheEntry.responses || cacheEntry.responses.length === 0 || cacheEntry.error) && topTextCard.text && textcardText) {
            console.log("Neue Textkarte überfahren oder Cache leer/fehlerhaft, starte ChatGPT-Kombinationsaufruf für 3 Previews");
            getTextcardCombinationTexts(topTextCard.text, topTextCard.id);
          } else if (cacheEntry && cacheEntry.responses && cacheEntry.responses.length > 0) {
            console.log("Verwende zwischengespeicherte Kombinationsantworten.");
          }
        }
      } else {
        if (currentOverTextcard !== null) {
          console.log("Keine Überlappung mehr, entferne Previews.");
          setCurrentOverTextcard(null);
        }
      }
    };

    const intervalTime = 10;
    const intervalId = setInterval(checkOverlappingTextCards, intervalTime);
    return () => {
      clearInterval(intervalId);
    };
  }, [
    isDragging,
    position,
    size,
    elements,
    rect.id,
    textcardText,
    currentOverTextcard,
    textcardCache,
  ]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);

    if (currentOverTextcard) {
      setSelectedElements([]); // Überdenken, ob das hier noch gewünscht ist.
      console.log("Ziehen beendet über einer Karte. Previews bleiben sichtbar.");
    } else {
      console.log("Ziehen beendet, nicht über einer Karte.");
    }

    //setCursorStyle("grab");
  }, [currentOverTextcard, textcardCache, currentResponseIndex, elements]);

  const getTextcardCombinationTexts = async (text, sourceId) => {
    try {
      setTextcardCache((prev) => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: true,
          responses: [], // Wird bis zu 3 Antworten enthalten
          error: false,
        },
      }));

      console.log("Eingabe für Prompt (Kombination für 3 Previews):\n", textcardText, " | ", text);
      const response = await chatGPTService.combineTextcards(textcardText, text);
      console.log("ChatGPT Antwort (Kombination)", response.content);

      let parsedData = { response: [] };
      try {
        parsedData = JSON.parse(response.content);
      } catch (error) {
        console.error("JSON Parse Error (Kombination):", error);
      }

      const combinedResponses = Array.isArray(parsedData?.response) ? parsedData.response.map((item) => String(item || "").trim()).slice(0, 3) : [];

      console.log("Finale Kombinations-Antworten (bis zu 3):", combinedResponses);

      setTextcardCache((prev) => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: false,
          responses: combinedResponses,
          error: combinedResponses.length === 0 && !parsedData?.response,
        },
      }));
    } catch (error) {
      console.error("Fehler bei ChatGPT-Kombinationsanfrage:", error);
      setTextcardCache((prev) => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: false,
          responses: [],
          error: true,
        },
      }));
    }
  };

  const handlePreviewDoubleClick = (
    previewText,
    previewPositionAndSize,
    previewIndex,      
    baseCardId    
  ) => {
    if (!previewText || !previewPositionAndSize || previewIndex === undefined || !baseCardId) return;

    //console.log(`Preview (Index: ${previewIndex}) doppelt geklickt. Erstelle permanente Karte mit Text: "${previewText}".`);

    const newCardX = (previewPositionAndSize.x - offsetRef.current.x) / scaleRef.current;
    const newCardY = (previewPositionAndSize.y - offsetRef.current.y) / scaleRef.current;
    const newCardWidth = previewPositionAndSize.width / scaleRef.current;
    const newCardHeight = previewPositionAndSize.height / scaleRef.current;

    const newTextcard = {
      x: newCardX,
      y: newCardY,
      width: newCardWidth,
      height: newCardHeight,
      text: previewText,
      aiGenerated: true,
    };

    addTextcard(newTextcard);

    let arePreviewsRemaining = false;

    // Geklickte Preview aus dem Cache entfernen
    setTextcardCache(prevCache => {
      const currentEntry = prevCache[baseCardId];
      if (!currentEntry || !currentEntry.responses) {
        if (currentEntry && currentEntry.responses) {
          arePreviewsRemaining = currentEntry.responses.length > 0;
        }
        return prevCache;
      }

      const newResponses = currentEntry.responses.filter((_, idx) => idx !== previewIndex);
      arePreviewsRemaining = newResponses.length > 0;

      return {
        ...prevCache,
        [baseCardId]: {
          ...currentEntry,
          responses: newResponses,
        },
      };
    });

    if (!arePreviewsRemaining) {
      setCurrentOverTextcard(null);
      console.log("Keine Previews mehr für diese Karte, currentOverTextcard zurückgesetzt.");
    }
  };

  const handleMouseEnter = () => {
    if (currentGlobalCursor === "default" || currentGlobalCursor === "grab" || currentGlobalCursor === "grabbing") {
      setCursorStyle("grab");
    }
  };

  const handleMouseLeave = () => {
    if (currentGlobalCursor === "grab") {
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
    setIsDragging,
    handleDragEnd
  );

  const handleActualResize = useCallback((newSize, newPosition) => {
    setSize(newSize);
    setPosition(newPosition);
    onResize(rect.id, newSize, newPosition);

    const stageName = classifySizeStage(newSize.width, TEXTCARD_SIZE_STAGES);
    setCurrentResizeStageName(stageName);
  }, [rect.id, onResize, setSize, setPosition, setCurrentResizeStageName]);

  const { startResizing, isResizing } = useResize(
    size,
    position,
    scaleRef,
    offsetRef,
    handleActualResize
  );

  const handleDrag = (e) => {
    if (isEditing || e.buttons !== 1) return;
    handleSelection(e);
    startDragging(e);
  };

  const handleResize = useCallback(async (e, handle) => {
    if (e.buttons !== 1) return;
    e.stopPropagation();
    handleSelection(e);

    if (optimisticDisplayText !== null) {
      setOptimisticDisplayText(null);
    }

    const currentTextForGeneration = textcardText;

    if (currentTextForGeneration && currentTextForGeneration.trim() !== "" && !hasDoneInitialGenerationRef.current) {
      console.log(`--- First-Ever Resize for card id ${rect.id}: Initiating ALL Stage Text Generations based on "${currentTextForGeneration}" ---`);
      initialBaseTextForGenerationsRef.current = currentTextForGeneration;
      
      hasDoneInitialGenerationRef.current = true; 

      const loadingTexts = { [ORIGINAL_TEXT_STAGE_KEY]: currentTextForGeneration };
      TEXTCARD_SIZE_STAGES.forEach(stage => {
        if (stage.name !== ORIGINAL_TEXT_STAGE_KEY) {
          loadingTexts[stage.name] = "Generiere..."; // "Generating..."
        }
      });
      setStagedTexts(loadingTexts);
      setIsGeneratingStagedTexts(true);

      const stagesToGenerateFor = TEXTCARD_SIZE_STAGES.filter(
        stage => stage.name !== ORIGINAL_TEXT_STAGE_KEY
      );

      const generationPromises = stagesToGenerateFor.map(async (stage) => {
        let generatedText = `Fehler für ${stage.name}`;
        try {
          let response;
          console.log(`   Requesting ChatGPT for stage: "${stage.name}" with base text: "${initialBaseTextForGenerationsRef.current}"`);
          switch (stage.name) {
            case "Keywords": response = await chatGPTService.generateKeyword(initialBaseTextForGenerationsRef.current); break;
            case "Examples": response = await chatGPTService.generateShortPhrase(initialBaseTextForGenerationsRef.current); break;
            case "Short Text": response = await chatGPTService.generateShortText(initialBaseTextForGenerationsRef.current); break;
            case "Medium Text": response = await chatGPTService.generateMediumText(initialBaseTextForGenerationsRef.current); break;
            case "Long Text": response = await chatGPTService.generateLongText(initialBaseTextForGenerationsRef.current); break;
            default:
              console.warn(`No specific ChatGPT method for stage: ${stage.name}`);
              return { stageName: stage.name, text: initialBaseTextForGenerationsRef.current };
          }
          if (response && typeof response.content === 'string') {
            generatedText = response.content.trim();
          } else {
            console.error(`Invalid or missing content in response for stage ${stage.name}:`, response);
            generatedText = `${initialBaseTextForGenerationsRef.current} (Format ${stage.name} n.v.)`;
          }
        } catch (error) {
          console.error(`Error calling ChatGPT for stage "${stage.name}":`, error);
        }
        return { stageName: stage.name, text: generatedText };
      });

      // Starte die Promises, aber warte hier NICHT auf ihr Ergebnis mit await.
      Promise.all(generationPromises)
        .then(results => {
          setStagedTexts(prevStagedTexts => { // Funktionale Aktualisierung für den State
            const newTexts = results.reduce((acc, result) => {
              acc[result.stageName] = result.text;
              return acc;
            }, {});
            console.log("   All stage texts generated, updating state. Base was:", initialBaseTextForGenerationsRef.current);
            // Stelle sicher, dass der Originaltext der ist, der für die Generierung verwendet wurde.
            return { ...prevStagedTexts, ...newTexts, [ORIGINAL_TEXT_STAGE_KEY]: initialBaseTextForGenerationsRef.current };
          });
          if (onAiGenerationComplete) {
            onAiGenerationComplete(rect.id);
          }
        })
        .catch(error => {
          console.error("Error processing initial stage text generations (Promise.all failed):", error);
        })
        .finally(() => {
          setIsGeneratingStagedTexts(false);
        });
    }
    startResizing(e, handle);
  }, [
    textcardText,
    optimisticDisplayText,
    startResizing,
    chatGPTService,
    rect.id,
    handleSelection,
    onAiGenerationComplete
  ]);

  const handleEditing = () => {
    setIsEditing(true);
  };

  const handleDoubleClick = useCallback(
    (e) => {
      if (!isEditing) {
        setIsEditing(true);
      }
    },
    [isEditing]
  );

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
        rect.aiGenerated
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
      rect.aiGenerated,
    ]
  );

  let displayText = textcardText; // Standardmäßig der aktuelle Prop-Text

  if (optimisticDisplayText !== null) {
    // Wenn ein optimistischer Text gesetzt ist (direkt nach Resize-Ende), verwende diesen.
    displayText = optimisticDisplayText;
  } else if (isResizing && currentResizeStageName) {
    // Wenn aktiv resized wird und eine Stufe klassifiziert wurde:
    if (hasDoneInitialGenerationRef.current) { // Und wenn die initiale Generierung erfolgt ist
      const liveStageText = stagedTexts[currentResizeStageName] || stagedTexts[ORIGINAL_TEXT_STAGE_KEY];

      if (liveStageText && liveStageText !== "Generiere...") {
        displayText = liveStageText;
      } else { // Fallback, wenn der Stufentext noch lädt oder nicht vorhanden ist
        displayText = stagedTexts[ORIGINAL_TEXT_STAGE_KEY] || textcardText; // Zeige den Originaltext der Generierungsbasis oder den aktuellen Prop-Text
      }
    }
    // Wenn die initiale Generierung noch nicht abgeschlossen ist, bleibt displayText der aktuelle textcardText (oder der ggf. gesetzte optimisticDisplayText, was hier aber nicht der Fall sein sollte).
  }

  return (
    <>
      {currentOverTextcard && textcardCache[currentOverTextcard.id] && (
        <>
          {(() => {
            const cacheEntry = textcardCache[currentOverTextcard.id];
            const isLoading = cacheEntry?.isGeneratingResponse;
            const responses = cacheEntry?.responses;
            const baseCard = currentOverTextcard;

            const numberOfPreviews = 3;
            const previewScaledWidth = 200 * scaleRef.current;
            const previewScaledHeight = 75 * scaleRef.current;
            const previewGap = 20 * scaleRef.current;

            const totalPreviewsRowWidth = (numberOfPreviews * previewScaledWidth) + ((numberOfPreviews - 1) * previewGap);
            const baseCardCenterX = (baseCard.position.x + baseCard.size.width / 2) * scaleRef.current + offsetRef.current.x;
            const rowStartX = baseCardCenterX - (totalPreviewsRowWidth / 2);
            const commonFinalTop = (baseCard.position.y - baseCard.size.height - 25) * scaleRef.current + offsetRef.current.y;

            if (isLoading && (!responses || responses.length === 0)) {
              return Array.from({ length: numberOfPreviews }).map((_, index) => {
                const individualPreviewLeft = rowStartX + (index * (previewScaledWidth + previewGap));
                return (
                  <PreviewTextcard
                    key={`${baseCard.id}-loading-preview-${index}`}
                    finalTop={commonFinalTop}
                    finalLeft={individualPreviewLeft}
                    scaledWidth={previewScaledWidth}
                    scaledHeight={previewScaledHeight}
                    isLoading={true}
                    previewTextContent=""
                  />
                );
              });
            } else if (responses && responses.length > 0) {
              return responses.slice(0, numberOfPreviews).map((responseText, index) => {
                const individualPreviewLeft = rowStartX + (index * (previewScaledWidth + previewGap));
                const currentPreviewPositionAndSize = {
                  x: individualPreviewLeft,
                  y: commonFinalTop,
                  width: previewScaledWidth,
                  height: previewScaledHeight,
                };
                return (
                  <PreviewTextcard
                    key={`${baseCard.id}-preview-${index}`}
                    finalTop={commonFinalTop}
                    finalLeft={individualPreviewLeft}
                    scaledWidth={previewScaledWidth}
                    scaledHeight={previewScaledHeight}
                    isLoading={isLoading && index === 0 && responses.length < numberOfPreviews}
                    previewTextContent={responseText}
                    onDoubleClick={() => handlePreviewDoubleClick(responseText, currentPreviewPositionAndSize, index, baseCard.id)}
                  />
                );
              });
            }
            return null;
          })()}
        </>
      )}
      
      <div
        className={isGeneratingStagedTexts ? animationStyles.loadingPulseDiv : ''}
        style={textcardStyles}
        onMouseDown={handleDrag}
        onDoubleClick={handleEditing}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isGeneratingStagedTexts ? (
          <div className={animationStyles ? animationStyles.loadingDotsContainer : "loadingDotsContainer"}>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        ) : (
          <TextCardContent
            isEditing={isEditing}
            text={displayText}
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
        )}
        {showActionBar && (
          <Handles
            onResize={handleResize}
            onCreateArrow={handleArrowCreation}
            text={textcardText}
          />
        )}
      </div>
      {showActionBar && <TextCardActionBar {...textcardActionBarProps} />}

      {isResizing && currentResizeStageName && (
        <div
          style={{
            position: "fixed",
            left: `${labelPosition.x + 40}px`,
            top: `${labelPosition.y + 40}px`,
            padding: "5px 10px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            color: "rgba(0, 0, 0, 1)",
            borderRadius: "4px",
            fontSize: "16px",
            zIndex: 10000,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            transform: "translate(-50%, -50%)", // Optional: Zentriert das Label genauer an der Mausspitze
          }}
        >
          {currentResizeStageName}
        </div>
      )}
    </>
  );
};

export default TextCard;
