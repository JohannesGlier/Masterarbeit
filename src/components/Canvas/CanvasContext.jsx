import React, { createContext, useContext, useState, useRef } from 'react';

const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  const zIndexRectangles = useRef(1000); // Baselayer für Rechtecke
  const zIndexArrows = useRef(2000);     // Baselayer für Pfeile
  const zIndexTextCards = useRef(3000);  // Baselayer für Textkarten

  const [selectedTool, setSelectedTool] = useState('Pointer');
  const [selectedElements, setSelectedElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(2);
  const [mouseDownElement, setMouseDownElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [isArrowDragging, setIsArrowDragging] = useState(false);

  const changeTool = (tool) => {
    if (tool !== selectedTool) {
      setSelectedTool(tool);
      if (selectedTool === 'Pointer') {
        setSelectedElements([]);
      }
    }
  };

  const toggleSelectedElement = (element, isMultiSelect) => {
    setSelectedElements((prevSelectedElements) => {
      if (isMultiSelect) {
        // Multi-Select: Element hinzufügen oder entfernen
        const elementIndex = prevSelectedElements.findIndex(el => el.id === element.id);
        if (elementIndex !== -1) {
          return prevSelectedElements.filter((el) => el.id !== element.id);
        } else {
          return [...prevSelectedElements, element];
        }
      } else {
        // Single-Select: Nur dieses Element auswählen
        return [element];
      }
    });
  };

  const incrementZIndex = (type) => {
    switch (type) {
      case "rectangle":
        if (zIndexRectangles.current < 2000) {
          zIndexRectangles.current += 1;
        }
        return zIndexRectangles.current;
      case "textcard":
        if (zIndexTextCards.current < 3000) {
          zIndexTextCards.current += 1;
        }
        return zIndexTextCards.current;
      case "arrow":
        if (zIndexArrows.current < 4000) {
          zIndexArrows.current += 1;
        }
        return zIndexArrows.current;
      default:
        return 0;
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        selectedTool,
        setSelectedTool: changeTool,
        selectedElements,
        setSelectedElements,
        toggleSelectedElement,
        isDrawing,
        setIsDrawing,
        offsetRef,
        scaleRef,
        mouseDownElement,
        setMouseDownElement,
        hoveredElement,
        setHoveredElement,
        isArrowDragging,
        setIsArrowDragging,
        zIndexRectangles, 
        zIndexTextCards, 
        zIndexArrows, 
        incrementZIndex
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

