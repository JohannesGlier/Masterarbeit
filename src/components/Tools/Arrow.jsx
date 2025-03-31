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
import RunPromptButton from "@/components/Helper/Arrow/RunPromptButton";
import ArrowActionBar from "@/components/Tools/ActionBars/ArrowActionBar";
import { getAnchorPosition, getClosestAnchor } from "@/utils/Arrow/anchorUtils";
import {
  getElementAtPosition,
  attachElementToArrow,
  getElementsInRectangle
} from "@/utils/elementUtils";
import { 
  parseChatGPTResponse,
  calculateGridLayout,
  combineCards,
  positionCardsInGrid
} from '@/utils/Arrow/arrowHelpers';
import ArrowHeads from "@/components/Helper/Arrow/ArrowHeads";
import { ARROW_DEFAULTS } from "@/utils/Arrow/arrowDefaultProperties";
import { getArrowStyles } from "@/utils/Arrow/arrowStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";
import ArrowContextMenu from "@/components/Helper/Arrow/ArrowContextMenu";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { ChatGPTService } from "@/services/ChatGPTService";

const Arrow = ({
  arrow,
  scaleRef,
  offsetRef,
  elements,
  updateArrowPosition,
  canvasWrapperRef,
  canvasRef,
  addRectangle,
  addTextcard,
  updateTextcardText,
  handleFrameResize,
  handleTextcardUpdate
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
  const chatGPTService = new ChatGPTService();

  const {
    selectedTool,
    selectedElements,
    toggleSelectedElement,
    isDrawing,
    setHoveredElement,
    setIsArrowDragging,
    contextMenu,
    closeContextMenu,
    showContextMenu,
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
    closeContextMenu(arrow.id);
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

      updateArrowPosition(arrow.id, newPosition, draggingPoint);

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

  const InsertAtPosition = async (e) => {
    const hasElementAttached = arrow.start.elementId && arrow.end.elementId;

    if (hasElementAttached) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX =
        (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const clickY =
        (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      // Pfeillänge berechnen
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);

      const t =
        ((clickX - startX) * dx + (clickY - startY) * dy) / (length * length);
      console.log("Action: Double Click on Arrow Line at position:\n", t);

      const startElement = elements.find((e) => e.id === arrow.start.elementId);
      const endElement = elements.find((e) => e.id === arrow.end.elementId);

      // Texte extrahieren
      const startText =
        startElement?.type === "textcard"
          ? startElement.text
          : startElement?.type === "rectangle"
          ? startElement.heading
          : null;

      const endText =
        endElement?.type === "textcard"
          ? endElement.text
          : endElement?.type === "rectangle"
          ? endElement.heading
          : null;

      // ChatGPT-Aufruf nur wenn beide Texte vorhanden
      if (startText && endText) {
        try {
          console.log("Eingabe für Prompt:\n", startText, " | ", endText);
          const response = await chatGPTService.analyzeArrow(
            startText,
            endText,
            t
          );
          console.log("ChatGPT Response:", response.content);
          const newTextcard = {
            x: clickX - 50,
            y: clickY + 30,
            width: 100,
            height: 50,
            text: response.content
          };
    
          addTextcard(newTextcard);
        } catch (error) {
          console.error("Fehler bei ChatGPT-Anfrage:", error);
        }
      }
    }
  };

  const SelectOutput = (point, e) => {
    e.stopPropagation();

    console.log("Select Output");
    const hasElementAttached =
      (point === "start" && arrow.start.elementId) ||
      (point === "end" && arrow.end.elementId);

    if (hasElementAttached) {
      console.log("Element angeschlossen");
      return;
    }

    const posX = point === "start" ? startX : endX;
    const posY = point === "start" ? startY : endY;

    showContextMenu({ x: posX, y: posY }, point, arrow.id);
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
        pointerEvents,
        arrow.zIndex
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
      arrow.zIndex,
    ]
  );

  const contextMenuButtons = [
    {
      icon: <MdOutlineRectangle size={32} />,
      onClick: () => {
        console.log("Add Frame");
        const newRect = attachElementToArrow(contextMenu.point, arrow, "Frame");
        const newFrameId = addRectangle({
          x: newRect.x,
          y: newRect.y,
          width: newRect.width,
          height: newRect.height,
        });

        updateArrowPosition(
          arrow.id,
          { elementId: newFrameId, anchor: newRect.anchor },
          contextMenu.point
        );
        closeContextMenu(arrow.id);
      },
    },
    {
      icon: <RiTextBlock size={32} />,
      onClick: () => {
        console.log("Add Textcard");
        const newTextcard = attachElementToArrow(
          contextMenu.point,
          arrow,
          "Textcard"
        );
        const newTextcardId = addTextcard({
          x: newTextcard.x,
          y: newTextcard.y,
          width: newTextcard.width,
          height: newTextcard.height,
        });

        updateArrowPosition(
          arrow.id,
          { elementId: newTextcardId, anchor: newTextcard.anchor },
          contextMenu.point
        );
        closeContextMenu(arrow.id);
      },
    },
  ];

  const runPromptButton = async () => {
    if (!text) {
      console.log("Prompt is empty! Prompt kann nicht ausgeführt werden");
      return;
    }
  
    if (!properties.arrowHeadStart && !properties.arrowHeadEnd) {
      console.log("Pfeil hat keine Richtung! Prompt wird nicht ausgeführt");
      return;
    }
  
    if (properties.arrowHeadStart && properties.arrowHeadEnd) {
      console.log("Pfeil zeigt in beide Richtungen! Prompt wird nicht ausgeführt");
      return;
    }
  
    // Hilfsfunktionen
    const getInputFromElement = (element) => {
      if (!element) return "undefined";
      
      if (element.type === "textcard") {
        return element.text;
      } else if (element.type === "rectangle") {
        const elementsInRect = getElementsInRectangle(elements, {
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height
        });
        
        /*
        const simplifiedElements = elementsInRect.map(el => ({
          type: el.type,
          position: { ...el.position },
          size: { ...el.size },
          ...(el.type === "textcard" && { text: el.text }),
          ...(el.type === "rectangle" && { heading: el.heading })
        }));
        */

        const simplifiedElements = elementsInRect.map(el => {
          if (el.type === "textcard") {
            return el.text;
          }
          else if (el.type === "rectangle") {
            return el.heading;
          }
          return null;
        }).filter(item => item !== null);
  
        return JSON.stringify(simplifiedElements, null, 2);
      }
      return "undefined";
    };

    const handleOutput = async (outputElement, inputText, promptText, outputText) => {
      if (!outputElement) {
        try {
          console.log("Kein Output Element");
          console.log("Eingabe Prompt:", promptText);
          console.log("Eingabe Text:", inputText);
          const response = await getChatGPTResponse(inputText, promptText);

          const attachPosition = properties.arrowHeadStart ? "start" : "end";

          const newRect = attachElementToArrow(attachPosition, arrow, "Frame");
          const newFrameId = addRectangle({
            x: newRect.x,
            y: newRect.y,
            width: newRect.width,
            height: newRect.height,
          });

          updateArrowPosition(
            arrow.id,
            { elementId: newFrameId, anchor: newRect.anchor },
            attachPosition
          );
          console.log("ChatGPT Response:", response.content);
          const myRect = {
            id: newFrameId,
            position: { x: newRect.x, y: newRect.y },
            size: { width: newRect.width, height: newRect.height },
            type: "rectangle"
          };
          await handleRectangleOutput(myRect, response);
          return;
        } catch (error) {
          console.error("Fehler bei der Ausgabeverarbeitung:", error);
        }
      }
    
      try {
        console.log("Eingabe Prompt:", promptText);
        console.log("Eingabe Text:", inputText);
        const response = await getChatGPTResponse_Output(inputText, promptText, outputElement.type, outputText);
        console.log("ChatGPT Response:", response.content);

        if (outputElement.type === "textcard") {
          updateTextcardText(outputElement.id, response.content);
          return;
        }
    
        if (outputElement.type === "rectangle") {
          await handleRectangleOutput(outputElement, response);
        }
      } catch (error) {
        console.error("Fehler bei der Ausgabeverarbeitung:", error);
      }
    };
  
    // Hauptlogik
    const isInputFirst = properties.arrowHeadStart && !properties.arrowHeadEnd;
    const inputElement = isInputFirst 
      ? elements.find(e => e.id === arrow.end?.elementId)
      : elements.find(e => e.id === arrow.start?.elementId);
  
    const outputElement = isInputFirst
      ? elements.find(e => e.id === arrow.start?.elementId)
      : elements.find(e => e.id === arrow.end?.elementId);
  
    const inputText = getInputFromElement(inputElement);
    const outputText = getInputFromElement(outputElement);

    await handleOutput(outputElement, inputText, text, outputText);
  };

  const getChatGPTResponse = async (inputText, promptText, outputText) => {
    const input = inputText !== "undefined" ? inputText : outputText;
    return input
      ? chatGPTService.promptArrow_Input(input, promptText)
      : chatGPTService.promptArrow(promptText);
  };

  const getChatGPTResponse_Output = async (inputText, promptText, outputType, outputText) => {
    const input = inputText !== "undefined" ? inputText : outputText;
    return input
      ? chatGPTService.promptArrow_Input_Output(input, promptText, outputType)
      : chatGPTService.promptArrow_Output(promptText, outputType);
  };

  const handleRectangleOutput = async (outputElement, response) => {
    try {
      const cardsData = parseChatGPTResponse(response.content);
      const cardSize = { width: 100, height: 100 };
      const padding = 20;

      const existingCards = getElementsInRectangle(elements, {
        x: outputElement.position.x,
        y: outputElement.position.y,
        width: outputElement.size.width,
        height: outputElement.size.height
      }).filter(el => el.type === "textcard");

      const allCards = combineCards(existingCards, cardsData);
      const grid = calculateGridLayout(allCards.length, cardSize.width, cardSize.height, padding);

      positionCardsInGrid(
        allCards,
        grid,
        outputElement,
        cardSize,
        padding,
        {
          updatePosition: handleTextcardUpdate,
          addCard: addTextcard
        }
      );

      handleFrameResize(outputElement.id, { 
        width: grid.requiredWidth, 
        height: grid.requiredHeight 
      }, { 
        x: outputElement.position.x, 
        y: outputElement.position.y 
      });

    } catch (error) {
      console.error("Fehler bei der Rechteck-Verarbeitung:", error);
      return;
    }
  };


  return (
    <>
      <div
        ref={frameRef}
        style={arrowStyles}
        onClick={SelectArrow}
        onDoubleClick={InsertAtPosition}
      />

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
        zIndex={arrowStyles.zIndex}
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
        zIndex={arrowStyles.zIndex}
      />

      <RunPromptButton
        position={{ x: middleX, y: middleY }}
        scale={scaleRef.current}
        offset={offsetRef.current}
        lineWidth={properties.lineWidth}
        handleClick={runPromptButton}
      />

      {isSelected && (
        <>
          <ArrowHandles
            start={{ x: startX, y: startY }}
            end={{ x: endX, y: endY }}
            scale={scaleRef.current}
            offset={offsetRef.current}
            lineWidth={properties.lineWidth}
            onDragStart={StartDragging}
            onDragEnd={StopDragging}
            onDoubleClick={SelectOutput}
          />

          <ArrowActionBar {...arrowActionBarProps} />
        </>
      )}

      {contextMenu.isVisible && contextMenu.arrowID === arrow.id && (
        <ArrowContextMenu
          top={contextMenu.position.y * scaleRef.current + offsetRef.current.y}
          left={contextMenu.position.x * scaleRef.current + offsetRef.current.x}
          buttons={contextMenuButtons}
        />
      )}
    </>
  );
};

export default Arrow;
