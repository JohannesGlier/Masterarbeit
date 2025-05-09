// CursorContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const CursorContext = createContext();

export const CursorProvider = ({ children, canvasWrapperRef }) => {
  const [cursorStyle, setCursorStyle] = useState('default'); // default, grabbing, crosshair, wait, etc.

  useEffect(() => {
    console.log("Cursor: " + cursorStyle);
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
    } else {
      //document.body.style.cursor = 'default';
    }

    return () => {
      //targetElement.classList.remove(...classesToRemove); // Entferne alle beim Unmounten
      //targetElement.style.cursor = 'default';
    };
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