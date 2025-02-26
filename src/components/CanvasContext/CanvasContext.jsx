import React, { createContext, useContext, useState, useRef } from 'react';

const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  const [selectedTool, setSelectedTool] = useState('Pointer');
  const [selectedElements, setSelectedElements] = useState([]);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(2);

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

  return (
    <CanvasContext.Provider
      value={{
        selectedTool,
        setSelectedTool: changeTool,
        selectedElements,
        setSelectedElements,
        toggleSelectedElement,
        offsetRef,
        scaleRef,
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

