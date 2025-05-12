import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import FrameTool from "@/components/Tools/PreviewTools/FrameTool";
import ArrowTool from "@/components/Tools/PreviewTools/ArrowTool";
import TextCardTool from "@/components/Tools/PreviewTools/TextCardTool";
import PointerTool from "@/components/Tools/PreviewTools/PointerTool";
import ScissorTool from "@/components/Tools/PreviewTools/ScissorTool";
import AutoLayoutTool from "@/components/Tools/PreviewTools/AutoLayoutTool";
import TextCard from "@/components/Tools/TextCard";
import Frame from "@/components/Tools/Frame";
import Arrow from "@/components/Tools/Arrow";
import { getAnchorPosition } from "@/utils/Arrow/anchorUtils";
import { ChatGPTService } from "@/services/ChatGPTService";
import { getTextFromElement } from "@/utils/elementUtils";
import { useCursor } from '@/components/Canvas/CursorContext';
import { useLanguage } from "@/components/Canvas/LanguageContext";

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const CanvasContent = ({ canvasRef, canvasWrapperRef }) => {
  const {
    selectedTool,
    offsetRef,
    scaleRef,
    selectedElements,
    setSelectedElements,
    setSelectedTool,
    incrementZIndex,
    activeView,
  } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [initialArrowStart, setInitialArrowStart] = useState(null);
  const [isAutoLayoutRunning, setIsAutoLayoutRunning] = useState(false);
  const { language } = useLanguage();
  const chatGPTService = useMemo(() => {
    console.log(`Initializing ChatGPTService with language: ${language}`);
    return new ChatGPTService(language);
  }, [language]);
  const [chatGPTResponse, setChatGPTResponse] = useState(null);
  const [processedArrows, setProcessedArrows] = useState(new Set());
  const [loadingArrows, setLoadingArrows] = useState(new Set());
  const [arrowTexts, setArrowTexts] = useState({});
  const previousView = useRef(activeView);
  const { setCursorStyle, cursorStyle: currentGlobalCursor } = useCursor();

  const elements = useMemo(() => {
    return [
      ...textcards.map((textcard) => ({
        id: textcard.id,
        position: { x: textcard.x, y: textcard.y },
        size: { width: textcard.width, height: textcard.height },
        type: "textcard",
        zIndex: textcard.zIndex,
        text: textcard.text,
        activeView: textcard.activeView,
      })),
      ...rectangles.map((rect) => ({
        id: rect.id,
        position: { x: rect.x, y: rect.y },
        size: { width: rect.width, height: rect.height },
        type: "rectangle",
        zIndex: rect.zIndex,
        heading: rect.heading,
        activeView: rect.activeView,
      })),
    ];
  }, [textcards, rectangles]);

  useEffect(() => {
    arrows.forEach((arrow) => {
      const hasStartElementId = arrow.start?.elementId !== undefined;
      const hasEndElementId = arrow.end?.elementId !== undefined;

      const startElement = hasStartElementId
        ? elements.find((e) => e.id === arrow.start.elementId)
        : undefined;
      const endElement = hasEndElementId
        ? elements.find((e) => e.id === arrow.end.elementId)
        : undefined;

      const startElementExists = !!startElement;
      const endElementExists = !!endElement;

      if (
        startElementExists &&
        endElementExists &&
        !processedArrows.has(arrow.id)
      ) {
        console.log(
          `Arrow ${arrow.id} ist an beiden Enden mit Elementen verbunden:`
        );
        const startElement = elements.find(
          (e) => e.id === arrow.start.elementId
        );
        const endElement = elements.find((e) => e.id === arrow.end.elementId);
        const startText = getTextFromElement(startElement, elements);
        const endText = getTextFromElement(endElement, elements);
        console.log("Start Text:", startText);
        console.log("End Text:", endText);
        getConnectionBetweenElementsText(startText, endText, arrow.id);
        setProcessedArrows((prev) => new Set(prev).add(arrow.id));
      } else if (processedArrows.has(arrow.id)) {
        if (!startElementExists || !endElementExists) {
          console.log(
            `Arrow ${arrow.id} ist nicht mehr an beiden Enden verbunden`
          );
          setProcessedArrows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(arrow.id);
            return newSet;
          });
          setArrowTexts((prevTexts) => {
            const newState = { ...prevTexts };
            delete newState[arrow.id];
            return newState;
          });
          if (loadingArrows.has(arrow.id)) {
            setArrowLoading(arrow.id, false);
          }
        }
      }
    });
  }, [arrows, elements, processedArrows, loadingArrows]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "x" && selectedElements.length > 0) {
        deleteSelectedElements();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElements]);

  useEffect(() => {
    const updatedArrows = arrows.map((arrow) => {
      const newArrow = { ...arrow };

      // Nur aktualisieren wenn beide Werte vorhanden sind
      if (newArrow.start?.elementId && newArrow.start?.anchor) {
        const element = elements.find((e) => e.id === newArrow.start.elementId);
        const pos = getAnchorPosition(element, newArrow.start.anchor);
        if (pos) {
          newArrow.start.x = pos.x;
          newArrow.start.y = pos.y;
        }
      }

      if (newArrow.end?.elementId && newArrow.end?.anchor) {
        const element = elements.find((e) => e.id === newArrow.end.elementId);
        const pos = getAnchorPosition(element, newArrow.end.anchor);
        if (pos) {
          newArrow.end.x = pos.x;
          newArrow.end.y = pos.y;
        }
      }

      return newArrow;
    });

    setArrows(updatedArrows);
  }, [elements]);

  useEffect(() => {
    console.log("Loading Arrows");

    if(loadingArrows.size > 0){
      setCursorStyle("wait");
    }
    else {
      setCursorStyle("default");
    }
  }, [loadingArrows]);

  useEffect(() => {
    if (previousView.current === "StandardView" && activeView === "LayoutView") {
      // Hier die Funktion aufrufen, die beim Wechsel von StandardView zu LayoutView ausgelöst werden soll
      setSelectedTool('AutoLayout');
      deleteLayoutViewElements();
    }
    previousView.current = activeView; // Update previousView nach dem Vergleich
  }, [activeView]);

  const addRectangle = (rect) => {
    const zIndex = incrementZIndex("rectangle");
    const newRect = {
      id: generateUniqueId(),
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      heading: rect.heading || "",
      zIndex,
      activeView: activeView,
    };
    setRectangles((prevRectangles) => [...prevRectangles, newRect]);
    return newRect.id;
  };

  const addTextcards = (textcard) => {
    const zIndex = incrementZIndex("textcard");
    const newTextcard = {
      id: generateUniqueId(),
      x: textcard.x,
      y: textcard.y,
      width: textcard.width,
      height: textcard.height,
      text: textcard.text,
      zIndex,
      activeView: activeView,
    };
    setTextCards((prevTextcards) => [...prevTextcards, newTextcard]);
    return newTextcard.id;
  };

  const addArrows = (arrow) => {
    const zIndex = incrementZIndex("arrow");
    const newArrow = {
      ...arrow,
      id: generateUniqueId(),
      start: {
        elementId: arrow.start.elementId,
        anchor: arrow.start.anchor,
        x: arrow.start.x,
        y: arrow.start.y,
      },
      end: {
        elementId: arrow.end.elementId,
        anchor: arrow.end.anchor,
        x: arrow.end.x,
        y: arrow.end.y,
      },
      zIndex,
      activeView: activeView,
    };
    setArrows((prevArrows) => [...prevArrows, newArrow]);
    return newArrow;
  };

  const deleteSelectedElements = () => {
    setRectangles((prev) =>
      prev.filter((rect) => !selectedElements.some((el) => el.id === rect.id))
    );
    setTextCards((prev) =>
      prev.filter(
        (textcard) => !selectedElements.some((el) => el.id === textcard.id)
      )
    );
    setArrows((prev) =>
      prev.filter((arrow) => !selectedElements.some((el) => el.id === arrow.id))
    );

    // Zurücksetzen der Auswahl
    setSelectedElements([]);

    if (currentGlobalCursor === 'grab' || currentGlobalCursor === 'grabbing') {
      setCursorStyle("default");
   }
  };

  const deleteLayoutViewElements = () => {
    setRectangles((prev) =>
      prev.filter((rect) => rect.activeView !== "LayoutView")
    );
    setTextCards((prev) =>
      prev.filter((textcard) => textcard.activeView !== "LayoutView")
    );
    setArrows((prev) =>
      prev.filter((arrow) => arrow.activeView !== "LayoutView")
    );
  }

  const handleFrameUpdate = (id, newX, newY) => {
    setRectangles((prev) =>
      prev.map((rect) =>
        rect.id === id ? { ...rect, x: newX, y: newY } : rect
      )
    );
  };

  const handleFrameResize = (id, newSize, newPosition) => {
    setRectangles((prev) =>
      prev.map((rect) =>
        rect.id === id
          ? {
              ...rect,
              width: newSize.width,
              height: newSize.height,
              x: newPosition.x,
              y: newPosition.y,
            }
          : rect
      )
    );
  };

  const updateFrameHeading = (id, newHeading) => {
    setRectangles((prevRectangles) =>
      prevRectangles.map((rect) =>
        rect.id === id ? { ...rect, heading: newHeading } : rect
      )
    );
  };

  const handleTextcardUpdate = (id, newX, newY) => {
    setTextCards((prev) =>
      prev.map((rect) =>
        rect.id === id ? { ...rect, x: newX, y: newY } : rect
      )
    );
  };

  const handleTextcardResize = (id, newSize, newPosition) => {
    setTextCards((prev) =>
      prev.map((rect) =>
        rect.id === id
          ? {
              ...rect,
              width: newSize.width,
              height: newSize.height,
              x: newPosition.x,
              y: newPosition.y,
            }
          : rect
      )
    );
  };

  const updateTextCardText = (id, newText) => {
    setTextCards((prevTextCards) =>
      prevTextCards.map((textcard) =>
        textcard.id === id ? { ...textcard, text: newText } : textcard
      )
    );
  };

  const updateArrowPosition = (arrowId, newPosition, pointType) => {
    setArrows((prevArrows) =>
      prevArrows.map((arrow) => {
        if (arrow.id === arrowId) {
          return {
            ...arrow,
            [pointType]: {
              // Lösche Element-Referenz wenn keine vorhanden
              ...(newPosition.elementId
                ? {
                    elementId: newPosition.elementId,
                    anchor: newPosition.anchor,
                  }
                : {}),
              x: newPosition.x,
              y: newPosition.y,
            },
          };
        }
        return arrow;
      })
    );
  };

  const getConnectionBetweenElementsText = async (
    startText,
    endText,
    arrowId
  ) => {
    if (loadingArrows.has(arrowId)) {
      console.log(`Request for arrow ${arrowId} already in progress.`);
      return;
    }

    try {
      setArrowLoading(arrowId, true);
      const response = await chatGPTService.analyzeArrow(startText, endText);
      console.log("ChatGPT Response:", response.content);

      let parsedData = [];
      let rawContent = response.content;

      if (typeof rawContent === "string") {
        try {
          parsedData = JSON.parse(rawContent);
          console.log(
            `DEBUG CanvasContent: Successfully parsed JSON for ${arrowId}.`
          );

          if (!Array.isArray(parsedData)) {
            console.warn(
              `Parsed JSON for arrow ${arrowId} did not result in an array:`,
              parsedData
            );
            parsedData = [];
          } else {
            parsedData = parsedData.slice(0, 10);
            console.log(
              `DEBUG CanvasContent: Parsed data is an array with length ${parsedData.length}.`
            );
          }
        } catch (parseError) {
          console.error(
            `Error parsing JSON response for arrow ${arrowId}:`,
            parseError,
            "\nRaw content was:",
            rawContent
          );
          parsedData = [];
        }
      } else if (Array.isArray(rawContent)) {
        console.log(
          `DEBUG CanvasContent: Response content for ${arrowId} was already an array.`
        );
        parsedData = rawContent;
        parsedData = parsedData.slice(0, 10);
      } else {
        console.warn(
          `Response content for arrow ${arrowId} is neither a string nor an array:`,
          rawContent
        );
        parsedData = [];
      }

      setArrowTexts((prevTexts) => ({
        ...prevTexts,
        [arrowId]: parsedData,
      }));
    } catch (error) {
      console.error(
        `Fehler beim Abrufen des Textes für Pfeil ${arrowId}:`,
        error
      );
      setArrowTexts((prevTexts) => ({
        ...prevTexts,
        [arrowId]: [],
      }));
    } finally {
      setArrowLoading(arrowId, false);
    }
  };

  const setArrowLoading = (arrowId, isLoading) => {
    setLoadingArrows((prev) => {
      const newSet = new Set(prev);
      isLoading ? newSet.add(arrowId) : newSet.delete(arrowId);
      return newSet;
    });
  };

  const handleStartArrowFromFrame = async (startData) => {
    const startElement = elements.find((e) => e.id === startData.elementId);
    const startText = getTextFromElement(startElement, elements);

    if (startText) {
      setSelectedTool("Arrow");
      setInitialArrowStart(startData);
      setChatGPTResponse(null);

      try {
        const response = await chatGPTService.relationshipArrow(startText);
        console.log("Eingabe Text für Verbindung", startText);
        setChatGPTResponse(response);
      } catch (error) {
        console.error("Fehler bei ChatGPT-Anfrage:", error);
        setChatGPTResponse({ content: "Fehler beim Generieren" });
      }
    }
  };

  const handleEndArrowFromFrame = (endData) => {
    setInitialArrowStart(endData);
  };

  const applyAILayout = (aiLayoutData) => {
    if (!Array.isArray(aiLayoutData)) {
      console.error("AI Layout data is not an array:", aiLayoutData);
      alert("Fehler: Ungültiges Layout-Format vom Server.");
      return;
    }

    // Aktuelle Elemente für einfachen Zugriff auf zIndex und Text speichern
    // Wichtig: Arbeite mit dem State-Wert zum Zeitpunkt der Funktionsdefinition
    // oder übergebe `rectangles` und `textcards` explizit an die Funktion,
    // um den aktuellsten Stand zu haben, falls sich was währenddessen ändert (unwahrscheinlich hier).
    const currentTextCardsMap = new Map(textcards.map((el) => [el.id, el]));
    const currentRectanglesMap = new Map(rectangles.map((el) => [el.id, el]));

    const nextTextCards = [];
    const nextRectangles = [];
    const processedNewElementAIIds = new Set(); // Um doppelte *neue* IDs von der AI abzufangen

    aiLayoutData.forEach((item) => {
      if (!item || !item.id || !item.type || !item.position || !item.size) {
        console.warn("Skipping invalid item from AI layout:", item);
        return; // Überspringe ungültige Elemente
      }

      const existingElement =
        currentTextCardsMap.get(item.id) || currentRectanglesMap.get(item.id);

      if (item.type === "Textkarte") {
        const currentTextCard = currentTextCardsMap.get(item.id);
        if (currentTextCard) {
          // Nur existierende Textkarten updaten
          nextTextCards.push({
            id: item.id, // Original-ID beibehalten
            x: item.position.x,
            y: item.position.y,
            width: item.size.width,
            height: item.size.height,
            text: currentTextCard.text, // WICHTIG: Originaltext beibehalten!
            zIndex: currentTextCard.zIndex, // Original-zIndex beibehalten
          });
        } else {
          console.warn(
            `AI tried to modify non-existent textcard with ID: ${item.id}`
          );
        }
      } else if (item.type === "Bereich") {
        const currentRectangle = currentRectanglesMap.get(item.id);
        if (currentRectangle) {
          // Bestehenden Bereich aktualisieren
          nextRectangles.push({
            id: item.id, // Original-ID beibehalten
            x: item.position.x,
            y: item.position.y,
            width: item.size.width,
            height: item.size.height,
            heading: item.heading || currentRectangle.heading || "", // Update Heading, fallback auf alten oder leer
            zIndex: currentRectangle.zIndex, // Original-zIndex beibehalten
          });
          console.log("Heading:", item.heading);
        } else {
          // Neuen Bereich hinzufügen, wenn AI-ID noch nicht verarbeitet wurde
          if (!processedNewElementAIIds.has(item.id)) {
            processedNewElementAIIds.add(item.id); // AI-ID als verarbeitet markieren
            nextRectangles.push({
              id: generateUniqueId(), // Neue, eindeutige ID generieren (sicherer)
              x: item.position.x,
              y: item.position.y,
              width: item.size.width,
              height: item.size.height,
              heading: item.heading || "", // Heading von AI
              zIndex: incrementZIndex("rectangle"), // Neuen zIndex holen
            });
            console.log("Heading:", item.heading);
          } else {
            console.warn(
              `AI provided duplicate new element ID "${item.id}". Skipping duplicate.`
            );
          }
        }
      } else {
        console.warn(
          `Unknown element type "${item.type}" from AI response for ID: ${item.id}`
        );
      }
    });

    console.log("Applying AI Layout: Setting next TextCards state.");
    setTextCards(nextTextCards);
    console.log("Applying AI Layout: Setting next Rectangles state.");
    setRectangles(nextRectangles);
  };

  return (
    <div>
      {selectedTool === "Pointer" && (
        <PointerTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          elements={elements.filter(element => element.activeView === activeView)}
          addTextcard={addTextcards}
        />
      )}
      {selectedTool === "Frame" && (
        <FrameTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addRectangle={addRectangle}
          elements={elements.filter(element => element.activeView === activeView)}
        />
      )}
      {selectedTool === "TextCard" && (
        <TextCardTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addTextcard={addTextcards}
          elements={elements.filter(element => element.activeView === activeView)}
        />
      )}
      {selectedTool === "Arrow" && (
        <ArrowTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addArrow={addArrows}
          elements={elements.filter(element => element.activeView === activeView)}
          initialStart={initialArrowStart}
          onEndArrowFromFrame={handleEndArrowFromFrame}
          addTextcard={addTextcards}
          updateArrowPosition={updateArrowPosition}
          updateTextcardText={updateTextCardText}
          chatGPTResponse={chatGPTResponse}
          onResponseProcessed={() => setChatGPTResponse(null)}
        />
      )}
      {selectedTool === "Scissor" && (
        <ScissorTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          elements={elements.filter(element => element.activeView === activeView)}
          addTextcard={addTextcards}
        />
      )}
      {selectedTool === "AutoLayout" && (
        <AutoLayoutTool
          isAutoLayoutRunning={isAutoLayoutRunning}
          textcards={textcards.filter(textcard => textcard.activeView === "StandardView")}
          handleTextcardUpdate={handleTextcardUpdate}
          addTextcard={addTextcards}
          addRectangle={addRectangle}
        />
      )}

      {activeView === "StandardView" ? (
        <div>
          {/* Rendern der gespeicherten Rechtecke */}
          {rectangles
            .filter((rect) => rect.activeView === "StandardView")
            .map((rect, index) => (
              <Frame
                key={index}
                rect={rect}
                headingText={rect.heading}
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                onUpdate={handleFrameUpdate}
                onResize={handleFrameResize}
                onStartArrowFromFrame={handleStartArrowFromFrame}
                onHeadingChange={(newHeading) =>
                  updateFrameHeading(rect.id, newHeading)
                }
            />
          ))}

          {/* Rendern der gespeicherten Textkarten */}
          {textcards
            .filter((textcard) => textcard.activeView === "StandardView")
            .map((textcard, index) => (
              <TextCard
                key={index}
                rect={textcard}
                textcardText={textcard.text}
                onTextChange={(newText) =>
                  updateTextCardText(textcard.id, newText)
                }
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                onUpdate={handleTextcardUpdate}
                onResize={handleTextcardResize}
                onStartArrowFromFrame={handleStartArrowFromFrame}
                elements={elements.filter(element => element.activeView === activeView)}
                addTextcard={addTextcards}
              />
          ))}

          {/* Rendern der gespeicherten Verbindungen */}
          {arrows
            .filter((arrow) => arrow.activeView === "StandardView")
            .map((arrow, index) => (
              <Arrow
                key={index}
                arrow={arrow}
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                elements={elements.filter(element => element.activeView === activeView)}
                updateArrowPosition={updateArrowPosition}
                canvasWrapperRef={canvasWrapperRef}
                canvasRef={canvasRef}
                addRectangle={addRectangle}
                addTextcard={addTextcards}
                handleTextcardUpdate={handleTextcardUpdate}
                isLoading={loadingArrows.has(arrow.id)}
                responseItems={arrowTexts[arrow.id] || []}
              />
          ))}
        </div>
      ) : activeView === "LayoutView" ? (
        <div>
          {/* Rendern der gespeicherten Rechtecke */}
          {rectangles
            .filter((rect) => rect.activeView === "LayoutView")
            .map((rect, index) => (
              <Frame
                key={index}
                rect={rect}
                headingText={rect.heading}
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                onUpdate={handleFrameUpdate}
                onResize={handleFrameResize}
                onStartArrowFromFrame={handleStartArrowFromFrame}
                onHeadingChange={(newHeading) =>
                  updateFrameHeading(rect.id, newHeading)
                }
            />
          ))}

          {/* Rendern der gespeicherten Textkarten */}
          {textcards
            .filter((textcard) => textcard.activeView === "LayoutView")
            .map((textcard, index) => (
              <TextCard
                key={index}
                rect={textcard}
                textcardText={textcard.text}
                onTextChange={(newText) =>
                  updateTextCardText(textcard.id, newText)
                }
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                onUpdate={handleTextcardUpdate}
                onResize={handleTextcardResize}
                onStartArrowFromFrame={handleStartArrowFromFrame}
                elements={elements.filter(element => element.activeView === activeView)}
                addTextcard={addTextcards}
              />
          ))}

          {/* Rendern der gespeicherten Verbindungen */}
          {arrows
            .filter((arrow) => arrow.activeView === "LayoutView")
            .map((arrow, index) => (
              <Arrow
                key={index}
                arrow={arrow}
                scaleRef={scaleRef}
                offsetRef={offsetRef}
                elements={elements.filter(element => element.activeView === activeView)}
                updateArrowPosition={updateArrowPosition}
                canvasWrapperRef={canvasWrapperRef}
                canvasRef={canvasRef}
                addRectangle={addRectangle}
                addTextcard={addTextcards}
                handleTextcardUpdate={handleTextcardUpdate}
                isLoading={loadingArrows.has(arrow.id)}
                responseItems={arrowTexts[arrow.id] || []}
              />
          ))}
        </div>
      ) : (
        <div>
          <h1>Unbekannte Ansicht: {activeView}</h1>
        </div>
      )}
    </div>
  );
};

export default CanvasContent;
