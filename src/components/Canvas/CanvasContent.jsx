import React, { useState, useEffect, useMemo } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import FrameTool from "@/components/Tools/PreviewTools/FrameTool";
import ArrowTool from "@/components/Tools/PreviewTools/ArrowTool";
import TextCardTool from "@/components/Tools/PreviewTools/TextCardTool";
import PointerTool from "@/components/Tools/PreviewTools/PointerTool";
import ScissorTool from "@/components/Tools/PreviewTools/ScissorTool";
import AITextcardTool from "@/components/Tools/PreviewTools/AITextcardTool";
import TextCard from "@/components/Tools/TextCard";
import Frame from "@/components/Tools/Frame";
import Arrow from "@/components/Tools/Arrow";
import { getAnchorPosition } from "@/utils/Arrow/anchorUtils";

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
  } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [initialArrowStart, setInitialArrowStart] = useState(null);

  const elements = useMemo(() => {
    return [
      ...textcards.map((textcard) => ({
        id: textcard.id,
        position: { x: textcard.x, y: textcard.y },
        size: { width: textcard.width, height: textcard.height },
        type: "textcard",
        zIndex: textcard.zIndex,
        text: textcard.text,
      })),
      ...rectangles.map((rect) => ({
        id: rect.id,
        position: { x: rect.x, y: rect.y },
        size: { width: rect.width, height: rect.height },
        type: "rectangle",
        zIndex: rect.zIndex,
        heading: rect.heading,
      })),
    ];
  }, [textcards, rectangles]);

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
  };

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

  const handleStartArrowFromFrame = (startData) => {
    setSelectedTool("Arrow");
    setInitialArrowStart(startData);
  };

  const handleEndArrowFromFrame = (endData) => {
    setInitialArrowStart(endData);
  };

  return (
    <div>
      {selectedTool === "Pointer" && (
        <PointerTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          elements={elements}
          addTextcard={addTextcards}
        />
      )}
      {selectedTool === "Frame" && (
        <FrameTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addRectangle={addRectangle}
        />
      )}
      {selectedTool === "TextCard" && (
        <TextCardTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addTextcard={addTextcards}
        />
      )}
      {selectedTool === "Arrow" && (
        <ArrowTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addArrow={addArrows}
          elements={elements}
          initialStart={initialArrowStart}
          onEndArrowFromFrame={handleEndArrowFromFrame}
          addTextcard={addTextcards}
          updateArrowPosition={updateArrowPosition}
          updateTextcardText={updateTextCardText}
        />
      )}
      {selectedTool === "Scissor" && (
        <ScissorTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          elements={elements}
          addTextcard={addTextcards}
        />
      )}
      {selectedTool === "AITextcard" && (
        <AITextcardTool
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          addTextcard={addTextcards}
          elements={elements}
          updateTextCardText={updateTextCardText}
        />
      )}

      {/* Rendern der gespeicherten Rechtecke */}
      {rectangles.map((rect, index) => (
        <Frame
          key={index}
          rect={rect}
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
      {textcards.map((textcard, index) => (
        <TextCard
          key={index}
          rect={textcard}
          textcardText={textcard.text}
          onTextChange={(newText) => updateTextCardText(textcard.id, newText)}
          scaleRef={scaleRef}
          offsetRef={offsetRef}
          onUpdate={handleTextcardUpdate}
          onResize={handleTextcardResize}
          onStartArrowFromFrame={handleStartArrowFromFrame}
          elements={elements}
          addTextcard={addTextcards}
        />
      ))}

      {/* Rendern der gespeicherten Verbindungen */}
      {arrows.map((arrow, index) => (
        <Arrow
          key={index}
          arrow={arrow}
          scaleRef={scaleRef}
          offsetRef={offsetRef}
          elements={elements}
          updateArrowPosition={updateArrowPosition}
          canvasWrapperRef={canvasWrapperRef}
          canvasRef={canvasRef}
          addRectangle={addRectangle}
          addTextcard={addTextcards}
          updateTextcardText={updateTextCardText}
          handleFrameResize={handleFrameResize}
          handleTextcardUpdate={handleTextcardUpdate}
        />
      ))}
    </div>
  );
};

export default CanvasContent;
