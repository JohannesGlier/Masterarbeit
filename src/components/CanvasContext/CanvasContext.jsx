import React, { createContext, useContext, useState, useRef } from 'react';

const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  const [selectedTool, setSelectedTool] = useState('Pointer');
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(2);

  return (
    <CanvasContext.Provider
      value={{
        selectedTool,
        setSelectedTool,
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

