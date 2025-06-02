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

const TEXTCARD_SIZE_STAGES = [
  // thresholdWidth: Die maximale Breite für diese Stufe (exklusiv der nächsten)
  { name: "Original Text", thresholdWidth: 75, representativeHeight: 50 },
  { name: "Keyword", thresholdWidth: 100, representativeHeight: 60 },
  { name: "Short Phrase", thresholdWidth: 175, representativeHeight: 70 },
  { name: "Short Text", thresholdWidth: 250, representativeHeight: 100 },
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
    if (!isDragging) return;

    const checkOverlappingTextCards = () => {
      const currentRect = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };

      const elementsInside = getElementsInRectangle(elements, currentRect);
      const textCardsInside = elementsInside.filter(
        (element) => element.type === "textcard" && element.id !== rect.id
      );

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
        setCurrentResponseIndex((prev) => {
          const cacheEntry = currentOverTextcard?.id
            ? textcardCache[currentOverTextcard.id]
            : null;
          const responseCount = cacheEntry?.responses?.length || 0;
          return responseCount > 0 ? (prev + 1) % responseCount : 0;
        });
        setAccumulatedDistance(0);

        const elementsInside = getElementsInRectangle(elements, currentRect);
        const textCardsInside = elementsInside.filter(
          (element) => element.type === "textcard" && element.id !== rect.id
        );

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
            } else if (cacheEntry && cacheEntry.responses) {
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
  }, [
    isDragging,
    position,
    size,
    elements,
    rect.id,
    textcardText,
    currentOverTextcard,
    setCurrentOverTextcard,
    textcardCache,
    accumulatedDistance,
    lastPosition,
    currentResponseIndex,
  ]);

  const handleDragEnd = useCallback(() => {
    if (
      currentOverTextcard &&
      !textcardCache[currentOverTextcard.id].isGeneratingResponse
    ) {
      const findFreePosition = (baseCard, depth = 0) => {
        // Sicherheitsabbruch nach 10 Versuchen
        if (depth > 10) return baseCard;

        const testRect = {
          x: baseCard.position.x,
          y: baseCard.position.y + baseCard.size.height + 25,
          width: baseCard.size.width,
          height: baseCard.size.height,
        };

        const elementsInside = getElementsInRectangle(elements, testRect);
        const overlappingCards = elementsInside.filter(
          (e) => e.type === "textcard"
        );

        if (overlappingCards.length > 0) {
          // Nächste Position testen (rekursiv)
          return findFreePosition(
            {
              position: { x: testRect.x, y: testRect.y },
              size: { width: testRect.width, height: testRect.height },
            },
            depth + 1
          );
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
        text: textcardCache[currentOverTextcard.id].responses[
          currentResponseIndex
        ],
        aiGenerated: true,
      };

      addTextcard(newTextcard);
      setCurrentOverTextcard(null);
      setSelectedElements([]);
      setAccumulatedDistance(0);
    } else if (
      currentOverTextcard &&
      textcardCache[currentOverTextcard.id].isGeneratingResponse
    ) {
      //setCurrentOverTextcard(null);
      setSelectedElements([]);
      setAccumulatedDistance(0);
    }
  }, [currentOverTextcard, textcardCache, currentResponseIndex, elements]);

  const getTextcardCombinationTexts = async (text, sourceId) => {
    try {
      setTextcardCache((prev) => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: true,
          responses: [],
        },
      }));

      console.log("Eingabe für Prompt:\n", textcardText, " | ", text);
      const response = await chatGPTService.combineTextcards(
        textcardText,
        text
      );
      console.log("ChatGPT Antwort", response.content);

      let parsedData = [];
      try {
        parsedData = JSON.parse(response.content);
      } catch (error) {
        console.error("JSON Parse Error:", error);
        parsedData = { response: [] }; // Fallback
      }

      const responses = Array.isArray(parsedData?.response)
        ? parsedData.response.map((text) => text.trim()).slice(0, 5)
        : [];

      console.log("Final Responses:", responses);

      setTextcardCache((prev) => ({
        ...prev,
        [sourceId]: {
          isGeneratingResponse: false,
          responses: responses,
        },
      }));
    } catch (error) {
      console.error("Fehler bei ChatGPT-Anfrage:", error);
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

  const useCachedResponses = (sourceId) => {
    const cacheEntry = textcardCache[sourceId];

    if (
      !cacheEntry ||
      !cacheEntry.responses ||
      cacheEntry.responses.length === 0
    ) {
      console.log("Keine zwischengespeicherten Antworten vorhanden");
      return;
    }

    console.log("Use Cached Response", cacheEntry.responses[0]);
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

  const handleResize = useCallback(async (e, handle) => { // `async` kann hier bleiben, schadet nicht.
    if (e.buttons !== 1) return;
    e.stopPropagation();
    handleSelection(e); // Deine existierende Selektionslogik

    if (optimisticDisplayText !== null) {
      setOptimisticDisplayText(null);
    }

    const currentTextForGeneration = textcardText;

    if (currentTextForGeneration && currentTextForGeneration.trim() !== "" && !hasDoneInitialGenerationRef.current) {
      console.log(`--- First-Ever Resize for card id ${rect.id}: Initiating ALL Stage Text Generations based on "${currentTextForGeneration}" ---`);
      initialBaseTextForGenerationsRef.current = currentTextForGeneration;
      
      // Wichtig: Sofort `true` setzen, um mehrfache Auslösung zu verhindern, während diese Runde läuft.
      hasDoneInitialGenerationRef.current = true; 

      const loadingTexts = { [ORIGINAL_TEXT_STAGE_KEY]: currentTextForGeneration };
      TEXTCARD_SIZE_STAGES.forEach(stage => {
        if (stage.name !== ORIGINAL_TEXT_STAGE_KEY) {
          loadingTexts[stage.name] = "Generiere..."; // "Generating..."
        }
      });
      setStagedTexts(loadingTexts); // UI sofort mit Ladeplatzhaltern aktualisieren

      const stagesToGenerateFor = TEXTCARD_SIZE_STAGES.filter(
        stage => stage.name !== ORIGINAL_TEXT_STAGE_KEY
      );

      const generationPromises = stagesToGenerateFor.map(async (stage) => {
        let generatedText = `Fehler für ${stage.name}`;
        try {
          let response;
          console.log(`   Requesting ChatGPT for stage: "${stage.name}" with base text: "${initialBaseTextForGenerationsRef.current}"`);
          switch (stage.name) {
            case "Keyword": response = await chatGPTService.generateKeyword(initialBaseTextForGenerationsRef.current); break;
            case "Short Phrase": response = await chatGPTService.generateShortPhrase(initialBaseTextForGenerationsRef.current); break;
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
          // hasDoneInitialGenerationRef.current wurde bereits oben optimistisch auf true gesetzt.
        })
        .catch(error => {
          console.error("Error processing initial stage text generations (Promise.all failed):", error);
          // Hier könntest du entscheiden, hasDoneInitialGenerationRef.current wieder auf false zu setzen,
          // damit ein erneuter Versuch beim nächsten Resize möglich ist, oder Fehler in stagedTexts anzeigen.
          // Für den Moment bleibt es true, um die "nur einmal generieren" Logik strikt zu halten,
          // aber die Texte könnten Fehler enthalten.
          // Eine robustere Fehlerbehandlung würde hier ansetzen.
        });
    }

    // Starte den eigentlichen Resize-Vorgang SOFORT, nachdem die asynchrone Logik angestoßen wurde.
    startResizing(e, handle);

  }, [
    textcardText,
    optimisticDisplayText, // Wird am Anfang von handleResize gelesen
    startResizing,
    chatGPTService,
    rect.id,
    handleSelection,
    // setOptimisticDisplayText, setStagedTexts (stabile Setter)
    // hasDoneInitialGenerationRef, initialBaseTextForGenerationsRef (Refs, ändern nicht die Callback-Identität)
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
      {currentOverTextcard && (
        <PreviewTextcard
          key={rect.id}
          finalTop={
            (currentOverTextcard.position.y -
              currentOverTextcard.size.height -
              25) *
              scaleRef.current +
            offsetRef.current.y
          }
          finalLeft={
            currentOverTextcard.position.x * scaleRef.current +
            offsetRef.current.x
          }
          scaledWidth={currentOverTextcard.size.width * scaleRef.current}
          scaledHeight={currentOverTextcard.size.height * scaleRef.current}
          isLoading={
            textcardCache[currentOverTextcard.id]?.isGeneratingResponse
          }
          previewTextContent={
            textcardCache[currentOverTextcard.id]?.responses[
              currentResponseIndex
            ]
          }
        />
      )}
      <div
        style={textcardStyles}
        onMouseDown={handleDrag}
        onDoubleClick={handleEditing}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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
