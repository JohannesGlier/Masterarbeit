import React, { useState, useEffect, useMemo } from 'react';
import { useCanvas } from '@/components/CanvasContext/CanvasContext';
import FrameTool from '@/components/Tools/FrameTool';
import ArrowTool from '@/components/Tools/ArrowTool';
import TextCardTool from '@/components/Tools/TextCardTool';
import PointerTool from '@/components/Tools/PointerTool';
import TextCard from '@/components/Tools/TextCard';
import Frame from '@/components/Tools/Frame';
import Arrow from '@/components/Tools/Arrow';

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const CanvasContent = ({ canvasRef, canvasWrapperRef }) => {
  const { selectedTool, offsetRef, scaleRef, selectedElements, setSelectedElements } = useCanvas();
  const [rectangles, setRectangles] = useState([]);
  const [textcards, setTextCards] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const elements = useMemo(() => {
    return [
      ...textcards.map((textcard) => ({
        id: textcard.id,
        position: { x: textcard.x, y: textcard.y },
        size: { width: textcard.width, height: textcard.height },
        type: 'textcard',
      })),
      ...rectangles.map((rect) => ({
        id: rect.id,
        position: { x: rect.x, y: rect.y },
        size: { width: rect.width, height: rect.height },
        type: 'rectangle',
      })),
    ];
  }, [textcards, rectangles]);



  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'x' && selectedElements.length > 0) {
        deleteSelectedElements();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElements]);

  useEffect(() => {
    const updatedArrows = arrows.map(arrow => {
      const newArrow = { ...arrow };
  
      // Startpunkt aktualisieren, falls an ein Element gekoppelt
      if (newArrow.start.elementId) {
        const startElement = elements.find(element => element.id === newArrow.start.elementId);
        if (startElement) {
          const newX = startElement.position.x + startElement.size.width / 2;
          const newY = startElement.position.y + startElement.size.height / 2;
  
          // Nur aktualisieren, wenn sich die Position geändert hat
          if (newArrow.start.x !== newX || newArrow.start.y !== newY) {
            newArrow.start.x = newX;
            newArrow.start.y = newY;
          }
        }
      }
  
      // Endpunkt aktualisieren, falls an ein Element gekoppelt
      if (newArrow.end.elementId) {
        const endElement = elements.find(element => element.id === newArrow.end.elementId);
        if (endElement) {
          const newX = endElement.position.x + endElement.size.width / 2;
          const newY = endElement.position.y + endElement.size.height / 2;
  
          // Nur aktualisieren, wenn sich die Position geändert hat
          if (newArrow.end.x !== newX || newArrow.end.y !== newY) {
            newArrow.end.x = newX;
            newArrow.end.y = newY;
          }
        }
      }
  
      return newArrow;
    });
  
    // Nur setArrows aufrufen, wenn sich die Pfeile tatsächlich geändert haben
    if (JSON.stringify(updatedArrows) !== JSON.stringify(arrows)) {
      setArrows(updatedArrows);
    }
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
      },
    ]);
  };



  const deleteSelectedElements = () => {
    setRectangles((prev) =>
      prev.filter((rect) => !selectedElements.some((el) => el.id === rect.id))
    );
    setTextCards((prev) =>
      prev.filter((textcard) => !selectedElements.some((el) => el.id === textcard.id))
    );
    setArrows((prev) =>
      prev.filter((arrow) => !selectedElements.some((el) => el.id === arrow.id))
    );

    // Zurücksetzen der Auswahl
    setSelectedElements([]);
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

  const handleTextcardUpdate = (id, newX, newY) => {
    setTextCards((prev) =>
      prev.map((rect) => (rect.id === id ? { ...rect, x: newX, y: newY } : rect))
    );
  };

  const handleTextcardResize = (id, newWidth, newHeight) => {
    setTextCards((prev) =>
      prev.map((rect) => (rect.id === id ? { ...rect, width: newWidth, height: newHeight } : rect))
    );
  };
  
  const updateArrowPosition = (arrowId, newPosition, pointType) => {
    setArrows((prevArrows) =>
      prevArrows.map((arrow) => {
        if (arrow.id === arrowId) {
          // Wenn newPosition eine elementId enthält, kopple den Punkt an das Element
          if (newPosition.elementId) {
            return {
              ...arrow,
              [pointType]: {
                elementId: newPosition.elementId, // Kopple an das Element
                x: null, // Freie Position wird nicht mehr verwendet
                y: null, // Freie Position wird nicht mehr verwendet
              },
            };
          } else {
            // Wenn newPosition keine elementId enthält, aktualisiere die freie Position
            return {
              ...arrow,
              [pointType]: {
                elementId: null, // Entkopple vom Element
                x: newPosition.x, // Neue freie X-Position
                y: newPosition.y, // Neue freie Y-Position
              },
            };
          }
        }
        return arrow;
      })
    );
  };
  

  return (
    <div>
      {selectedTool === "Pointer" && <PointerTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef}/>}
      {selectedTool === "Frame" && <FrameTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addRectangle={addRectangle}/>}
      {selectedTool === "TextCard" && <TextCardTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addTextcard={addTextcards}/>}
      {selectedTool === "Arrow" && <ArrowTool canvasRef={canvasRef} canvasWrapperRef={canvasWrapperRef} addArrow={addArrows} elements={elements}/>}

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
          rect={textcard}
          text={textcard.text}
          onTextChange={() => {}}
          scaleRef={scaleRef} 
          offsetRef={offsetRef} 
          isSelected={selectedFrame === textcard.id}
          onUpdate={handleTextcardUpdate}
          onResize={handleTextcardResize}
          canvasWrapperRef={canvasWrapperRef}
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
