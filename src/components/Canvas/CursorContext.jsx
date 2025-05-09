// CursorContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const CursorContext = createContext();

export const CursorProvider = ({ children, canvasWrapperRef }) => {
  const [cursorStyle, setCursorStyle] = useState('default'); // default, grabbing, crosshair, wait, etc.

  useEffect(() => {
    const targetElement = canvasWrapperRef.current || document.body;

    const classesToRemove = [];
    targetElement.classList.forEach(className => {
        if (className.startsWith('cursor-')) {
            classesToRemove.push(className);
        }
    });
    targetElement.classList.remove(...classesToRemove);

    if (cursorStyle && cursorStyle !== 'default') {
      targetElement.classList.add(`cursor-${cursorStyle}`);
    }
  }, [cursorStyle, canvasWrapperRef]);

  return (
    <CursorContext.Provider value={{ cursorStyle, setCursorStyle }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};