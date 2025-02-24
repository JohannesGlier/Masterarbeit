import React, { useState } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';
import FrameTool from '@/components/Tools/FrameTool';
import ArrowTool from '@/components/Tools/ArrowTool';
import TextCardTool from '@/components/Tools/TextCardTool';
import PointerTool from '@/components/Tools/PointerTool';

const CanvasContent = ({ canvasRef, canvasWrapperRef }) => {
  const { selectedTool, offsetRef, scaleRef } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);

  const addRectangle = (rect) => {
    setRectangles((prevRectangles) => [...prevRectangles, rect]);
  };

  const addTextcards = (textcard) => {
    setTextCards((prevTextcards) => [...prevTextcards, textcard]);
  };

  const addArrows = (arrow) => {
    setArrows((prevArrows) => [...prevArrows, arrow]);
  };

  return (
    <div>
      {selectedTool === "Pointer" && <PointerTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef}/>}
      {selectedTool === "Frame" && <FrameTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addRectangle={addRectangle}/>}
      {selectedTool === "TextCard" && <TextCardTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addTextcard={addTextcards}/>}
      {selectedTool === "Arrow" && <ArrowTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addArrow={addArrows}/>}

      {/* Rendern der gespeicherten Rechtecke */}
      {rectangles.map((rect, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: rect.y * scaleRef.current + offsetRef.current.y,
            left: rect.x * scaleRef.current + offsetRef.current.x,
            width: `${rect.width * scaleRef.current}px`,
            height: `${rect.height * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.5)",
            border: "1px solid blue",
            borderRadius: "8px",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Rendern der gespeicherten Textkarten */}
      {textcards.map((card, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: card.y * scaleRef.current + offsetRef.current.y,
            left: card.x * scaleRef.current + offsetRef.current.x,
            width: `${card.width * scaleRef.current}px`,
            height: `${card.height * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.5)",
            border: "1px solid blue",
            borderRadius: "8px",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Rendern der gespeicherten Verbindungen */}
      {arrows.map((arrow, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: arrow.y * scaleRef.current + offsetRef.current.y,
            left: arrow.x * scaleRef.current + offsetRef.current.x,
            width: `${arrow.width * scaleRef.current}px`,
            height: `${arrow.height * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.5)",
            border: "1px solid blue",
            borderRadius: "8px",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
};

export default CanvasContent;
