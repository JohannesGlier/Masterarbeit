import React, { useState } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';
import FrameTool from '@/components/Tools/FrameTool';
import ArrowTool from '@/components/Tools/ArrowTool';
import TextCardTool from '@/components/Tools/TextCardTool';
import PointerTool from '@/components/Tools/PointerTool';
import TextCard from '@/components/Tools/TextCard';
import Frame from '@/components/Tools/Frame';

const CanvasContent = ({ canvasRef, canvasWrapperRef }) => {
  const { selectedTool, offsetRef, scaleRef } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const addRectangle = (rect) => {
    setRectangles((prevRectangles) => [...prevRectangles, rect]);
  };

  const addTextcards = (textcard) => {
    setTextCards((prevTextcards) => [...prevTextcards, textcard]);
  };

  const addArrows = (arrow) => {
    setArrows((prevArrows) => [...prevArrows, arrow]);
  };

  const handleFrameUpdate = (id, newX, newY) => {
    setRectangles((prev) =>
      prev.map((rect) => (rect.id === id ? { ...rect, x: newX, y: newY } : rect))
    );
  };

  const handleFrameResize = (id, newWidth, newHeight) => {
    setRectangles((prev) =>
      prev.map((rect) => (rect.id === id ? { ...rect, width: newWidth, height: newHeight } : rect))
    );
  };

  return (
    <div>
      {selectedTool === "Pointer" && <PointerTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef}/>}
      {selectedTool === "Frame" && <FrameTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addRectangle={addRectangle}/>}
      {selectedTool === "TextCard" && <TextCardTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addTextcard={addTextcards}/>}
      {selectedTool === "Arrow" && <ArrowTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addArrow={addArrows}/>}

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
        />
      ))}

      {/* Rendern der gespeicherten Textkarten */}
      {textcards.map((textcard, index) => (
        <TextCard
          key={index}
          x={textcard.x * scaleRef.current + offsetRef.current.x}
          y={textcard.y * scaleRef.current + offsetRef.current.y}
          width={textcard.width * scaleRef.current}
          height={textcard.height * scaleRef.current}
          text={textcard.text}
          onTextChange={() => {}}
        />
      ))}

      {/* Rendern der gespeicherten Verbindungen */}
      {arrows.map((arrow, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: arrow.start.y * scaleRef.current + offsetRef.current.y,
            left: arrow.start.x * scaleRef.current + offsetRef.current.x,
            width: `${Math.sqrt(Math.pow(arrow.end.x - arrow.start.x, 2) + Math.pow(arrow.end.y - arrow.start.y, 2)) * scaleRef.current}px`,
            height: "2px",
            backgroundColor: "black",
            transform: `rotate(${Math.atan2(arrow.end.y - arrow.start.y, arrow.end.x - arrow.start.x)}rad)`,
            transformOrigin: "0 0",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      ))}
    </div>
  );
};

export default CanvasContent;
