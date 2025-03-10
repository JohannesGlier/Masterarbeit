import React, { useState, useEffect, useMemo } from "react";
import { useCanvas } from "@/components/CanvasContext/CanvasContext";
import FrameTool from "@/components/Tools/PreviewTools/FrameTool";
import ArrowTool from "@/components/Tools/PreviewTools/ArrowTool";
import TextCardTool from "@/components/Tools/PreviewTools/TextCardTool";
import PointerTool from "@/components/Tools/PreviewTools/PointerTool";
import TextCard from "@/components/Tools/TextCard";
import Frame from "@/components/Tools/Frame";
import Arrow from "@/components/Tools/Arrow";
import { getAnchorPosition } from "@/utils/anchorUtils";

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
  } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [initialArrowStart, setInitialArrowStart] = useState(null);

  const elements = useMemo(() => {
    return [
      ...textcards.map((textcard) => ({
        id: textcard.id,
        position: { x: textcard.x, y: textcard.y },
        size: { width: textcard.width, height: textcard.height },
        type: "textcard",
      })),
      ...rectangles.map((rect) => ({
        id: rect.id,
        position: { x: rect.x, y: rect.y },
        size: { width: rect.width, height: rect.height },
        type: "rectangle",
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
    setRectangles((prevRectangles) => [
      ...prevRectangles,
      {
        id: generateUniqueId(),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    ]);
  };

  const addTextcards = (textcard) => {
    setTextCards((prevRectangles) => [
      ...prevRectangles,
      {
        id: generateUniqueId(),
        x: textcard.x,
        y: textcard.y,
        width: textcard.width,
        height: textcard.height,
      },
    ]);
  };

  const addArrows = (arrow) => {
    setArrows((prevArrows) => [
      ...prevArrows,
      {
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
      },
    ]);
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

  const handleFrameResize = (id, newWidth, newHeight) => {
    setRectangles((prev) =>
      prev.map((rect) =>
        rect.id === id ? { ...rect, width: newWidth, height: newHeight } : rect
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

  const handleTextcardResize = (id, newWidth, newHeight) => {
    setTextCards((prev) =>
      prev.map((rect) =>
        rect.id === id ? { ...rect, width: newWidth, height: newHeight } : rect
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
        />
      )}

      {/* Rendern der gespeicherten Rechtecke */}
      {rectangles.map((rect, index) => (
        <Frame
          key={index}
          rect={rect}
          scaleRef={scaleRef}
          offsetRef={offsetRef}
          isSelected={selectedFrame === rect.id}
          onUpdate={handleFrameUpdate}
          onResize={handleFrameResize}
          canvasWrapperRef={canvasWrapperRef}
          onStartArrowFromFrame={handleStartArrowFromFrame}
        />
      ))}

      {/* Rendern der gespeicherten Textkarten */}
      {textcards.map((textcard, index) => (
        <TextCard
          key={index}
          rect={textcard}
          text={textcard.text}
          onTextChange={() => {}}
          scaleRef={scaleRef}
          offsetRef={offsetRef}
          isSelected={selectedFrame === textcard.id}
          onUpdate={handleTextcardUpdate}
          onResize={handleTextcardResize}
          canvasWrapperRef={canvasWrapperRef}
          onStartArrowFromFrame={handleStartArrowFromFrame}
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
        />
      ))}
    </div>
  );
};

export default CanvasContent;
