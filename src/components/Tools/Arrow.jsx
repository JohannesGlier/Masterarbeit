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
  getElementsInRectangle,
  getTextFromElement,
} from "@/utils/elementUtils";
import {
  parseChatGPTResponse,
  calculateGridLayout,
  combineCards,
  positionCardsInGrid,
} from "@/utils/Arrow/arrowHelpers";
import ArrowHeads from "@/components/Helper/Arrow/ArrowHeads";
import { ARROW_DEFAULTS } from "@/utils/Arrow/arrowDefaultProperties";
import { getArrowStyles } from "@/utils/Arrow/arrowStyles";
import { getPointerEvents } from "@/utils/pointerEventUtils";
import ArrowContextMenu from "@/components/Helper/Arrow/ArrowContextMenu";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { ChatGPTService } from "@/services/ChatGPTService";
import styles from "@/components/Tools/Arrow.module.css";
import clsx from "clsx";

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
  handleTextcardUpdate,
  isLoading,
  responseItems,
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

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoverPointPosition, setHoverPointPosition] = useState(null);
  const prevIsLoadingRef = useRef();

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

  const arrowGeometry = useMemo(() => {
    const x1 = startX;
    const y1 = startY;
    const x2 = endX;
    const y2 = endY;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    const length = lengthSq > 0 ? Math.sqrt(lengthSq) : 0;
    return { x1, y1, x2, y2, dx, dy, length, lengthSq };
  }, [startX, startY, endX, endY]);

  const handleMouseMove = useCallback(
    (event) => {
      const isArrayCheckResult = Array.isArray(responseItems);
      const arrayLength = responseItems ? responseItems.length : 0;
      const isNotArray = !isArrayCheckResult;
      const isEmpty = responseItems == null || arrayLength === 0;
      const isZeroLengthSq =
        arrowGeometry == null || arrowGeometry.lengthSq === 0;

      if (isNotArray || isEmpty || isZeroLengthSq) {
        if (tooltipVisible) {
          setTooltipVisible(false);
        }
        if (hoverPointPosition !== null) {
          setHoverPointPosition(null);
        }
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const logicalMouseX =
        (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const logicalMouseY =
        (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      const mouseVecX = logicalMouseX - arrowGeometry.x1;
      const mouseVecY = logicalMouseY - arrowGeometry.y1;
      const dotProduct =
        mouseVecX * arrowGeometry.dx + mouseVecY * arrowGeometry.dy;
      const normalizedDistance = Math.max(
        0,
        Math.min(1, dotProduct / arrowGeometry.lengthSq)
      );

      const arrayIndex = Math.min(
        arrayLength - 1,
        Math.max(0, Math.floor(normalizedDistance * arrayLength))
      );

      if (arrayIndex < 0 || arrayIndex >= arrayLength) {
        console.error(
          `Calculated index ${arrayIndex} is out of bounds for length ${arrayLength}!`
        );
        setTooltipText("Error: Index calculation failed");
        // Optionally hide tooltip on error
        if (tooltipVisible) setTooltipVisible(false);
        if (hoverPointPosition !== null) setHoverPointPosition(null);
      } else {
        const currentText = responseItems[arrayIndex];
        if (typeof currentText === "string") {
          setTooltipText(currentText);
        } else {
          console.error("Retrieved item is not a string:", currentText);
          setTooltipText("Error: Invalid data type");
        }

        const pointX_logical =
          arrowGeometry.x1 + arrowGeometry.dx * normalizedDistance;
        const pointY_logical =
          arrowGeometry.y1 + arrowGeometry.dy * normalizedDistance;
        setHoverPointPosition({ x: pointX_logical, y: pointY_logical });

        if (!tooltipVisible) {
          setTooltipVisible(true);
        }
      }

      setTooltipPosition({ x: event.clientX + 15, y: event.clientY + 10 });

      if (!tooltipVisible) {
        setTooltipVisible(true);
      }
    },
    [
      canvasRef,
      offsetRef,
      scaleRef,
      tooltipVisible,
      arrowGeometry,
      responseItems,
      setTooltipVisible,
      setTooltipPosition,
      setHoverPointPosition,
      hoverPointPosition,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false);
    setHoverPointPosition(null);
  }, [setTooltipVisible, setHoverPointPosition]);

  useEffect(() => {
    const prevIsLoading = prevIsLoadingRef.current;
    if (prevIsLoading === true && isLoading === false) {
      setDraggingPoint(null);
      setHoveredElement(null);
      isDragging.current = false;
      setIsArrowDragging(false);

      if (selectedTool === "Pointer") {
        toggleSelectedElement(
          { ...arrow, isDragging: isDragging.current },
          false
        );
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [
    isLoading,
    prevIsLoadingRef,
    arrow.id,
    setHoveredElement,
    setIsArrowDragging,
    setDraggingPoint,
  ]);



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

  const CreateTextcardFromTooltip = async (e) => {
    if (tooltipVisible && tooltipText) {
      const scale = scaleRef.current;
      const offset = offsetRef.current;
      const canvas = canvasRef.current;

      if (!canvas) {
        console.error("Canvas ref is not available!");
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const clickX_viewport = e.clientX;
      const clickY_viewport = e.clientY;

      const tooltipBaseWidth = 200;
      const tooltipBaseHeight = 75;
      const tooltipScaledWidth = tooltipBaseWidth * scale;

      const tooltipLeft_viewport =
        clickX_viewport + 15 - tooltipScaledWidth / 2;
      const tooltipTop_viewport = clickY_viewport + 10 + 50 * scaleRef.current;

      const logicalX = (tooltipLeft_viewport - rect.left - offset.x) / scale;
      const logicalY = (tooltipTop_viewport - rect.top - offset.y) / scale;

      const newTextcard = {
        x: logicalX,
        y: logicalY,
        width: tooltipBaseWidth,
        height: tooltipBaseHeight,
        text: tooltipText,
      };

      console.log("Erstelle Tooltip als Textkarte:", newTextcard);
      addTextcard(newTextcard);
      setTooltipVisible(false);
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
          text: "",
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
    try {
      if (!text) {
        console.log("Prompt is empty! Prompt kann nicht ausgeführt werden");
        return;
      }

      if (!properties.arrowHeadStart && !properties.arrowHeadEnd) {
        console.log("Pfeil hat keine Richtung! Prompt wird nicht ausgeführt");
        return;
      }

      if (properties.arrowHeadStart && properties.arrowHeadEnd) {
        console.log(
          "Pfeil zeigt in beide Richtungen! Prompt wird nicht ausgeführt"
        );
        return;
      }

      /*
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
      */

      const handleOutput = async (
        outputElement,
        inputText,
        promptText,
        outputText
      ) => {
        if (!outputElement) {
          try {
            console.log("Kein Output Element");
            console.log("Eingabe Prompt:", promptText);
            console.log("Eingabe Text:", inputText);
            const response = await getChatGPTResponse(inputText, promptText);

            const attachPosition = properties.arrowHeadStart ? "start" : "end";

            const newRect = attachElementToArrow(
              attachPosition,
              arrow,
              "Frame"
            );
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
              type: "rectangle",
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
          const response = await getChatGPTResponse_Output(
            inputText,
            promptText,
            outputElement.type,
            outputText
          );
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
      const isInputFirst =
        properties.arrowHeadStart && !properties.arrowHeadEnd;
      const inputElement = isInputFirst
        ? elements.find((e) => e.id === arrow.end?.elementId)
        : elements.find((e) => e.id === arrow.start?.elementId);

      const outputElement = isInputFirst
        ? elements.find((e) => e.id === arrow.start?.elementId)
        : elements.find((e) => e.id === arrow.end?.elementId);

      const inputText = getTextFromElement(inputElement, elements);
      const outputText = getTextFromElement(outputElement, elements);

      await handleOutput(outputElement, inputText, text, outputText);
    } catch (error) {
      console.error("Fehler:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChatGPTResponse = async (inputText, promptText, outputText) => {
    const input = inputText !== "undefined" ? inputText : outputText;
    return input
      ? chatGPTService.promptArrow_Input(input, promptText)
      : chatGPTService.promptArrow(promptText);
  };

  const getChatGPTResponse_Output = async (
    inputText,
    promptText,
    outputType,
    outputText
  ) => {
    const input = inputText !== "undefined" ? inputText : outputText;
    return input
      ? chatGPTService.promptArrow_Input_Output(input, promptText, outputType)
      : chatGPTService.promptArrow_Output(promptText, outputType);
  };

  const handleRectangleOutput = async (outputElement, response) => {
    try {
      const cardsData = parseChatGPTResponse(response.content);
      const cardSize = { width: 200, height: 75 };
      const padding = 20;

      const existingCards = getElementsInRectangle(elements, {
        x: outputElement.position.x,
        y: outputElement.position.y,
        width: outputElement.size.width,
        height: outputElement.size.height,
      }).filter((el) => el.type === "textcard");

      const allCards = combineCards(existingCards, cardsData);
      const grid = calculateGridLayout(
        allCards.length,
        cardSize.width,
        cardSize.height,
        padding
      );

      positionCardsInGrid(allCards, grid, outputElement, cardSize, padding, {
        updatePosition: handleTextcardUpdate,
        addCard: addTextcard,
      });

      handleFrameResize(
        outputElement.id,
        {
          width: grid.requiredWidth,
          height: grid.requiredHeight,
        },
        {
          x: outputElement.position.x,
          y: outputElement.position.y,
        }
      );
    } catch (error) {
      console.error("Fehler bei der Rechteck-Verarbeitung:", error);
      return;
    }
  };

  const pointerEvents = getPointerEvents({
    selectedTool,
    isDrawing,
    selectedElements,
    elementId: arrow.id,
  });

  const arrowInlineStyles = useMemo(
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

  const arrowClassName = clsx(styles["arrow-line"], {
    [styles["arrow-loading"]]: isLoading,
  });

  return (
    <>
      <div
        ref={frameRef}
        className={arrowClassName}
        style={arrowInlineStyles}
        onClick={SelectArrow}
        onDoubleClick={CreateTextcardFromTooltip}
        onMouseMove={responseItems?.length > 0 ? handleMouseMove : undefined}
        onMouseLeave={responseItems?.length > 0 ? handleMouseLeave : undefined}
      />

      {tooltipVisible && start && end && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPosition.x - (200 * scaleRef.current) / 2}px`,
            top: `${tooltipPosition.y + 25}px`,
            width: `${200 * scaleRef.current}px`,
            height: `${75 * scaleRef.current}px`,
            color: "black",
            backgroundColor: "rgba(230, 230, 230, 0.4)",
            borderRadius: "25px",
            boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
            padding: "12px",
            boxSizing: "border-box",
            border: "0px solid #ccc",
            zIndex: 3000,
            pointerEvents: "none",
            fontSize: "auto",
            textAlign: "center",
            alignContent: "center",
            overflow: "hidden",
            transition: "opacity 0.1s ease-in-out",
            //whiteSpace: "nowrap",
          }}
        >
          {tooltipText}
        </div>
      )}

      {tooltipVisible && hoverPointPosition && start && end && (
        <div
          style={{
            position: "absolute",
            left: `${
              hoverPointPosition.x * scaleRef.current + offsetRef.current.x
            }px`,
            top: `${
              hoverPointPosition.y * scaleRef.current + offsetRef.current.y
            }px`,
            width: "13px",
            height: "13px",
            backgroundColor: "rgba(0, 0, 0, 1)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: (arrowInlineStyles.zIndex || 1) + 1,
            pointerEvents: "none",
            transition: "opacity 0.3s ease-in-out",
            opacity: 1,
          }}
          aria-hidden="true"
        />
      )}

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
        zIndex={arrowInlineStyles.zIndex}
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
        zIndex={arrowInlineStyles.zIndex}
        pointerEvents={pointerEvents}
      />

      <RunPromptButton
        position={{ x: middleX, y: middleY }}
        scale={scaleRef.current}
        offset={offsetRef.current}
        lineWidth={properties.lineWidth}
        handleClick={runPromptButton}
        pointerEvents={pointerEvents}
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
