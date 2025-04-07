import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const TextCardContent = ({
  isEditing,
  text,
  onChange,
  onBlur,
  textAlign,
  textColor,
  font,
  fontStyles,
  containerSize,
  scale,
}) => {
  const testRef = useRef();
  const textareaRef = useRef();
  const [fontSize, setFontSize] = useState(16);
  const [showScroll, setShowScroll] = useState(false);

  // Konfiguration
  const MIN_FONT_SIZE = 8;
  const MAX_FONT_SIZE = 52;
  const LINE_HEIGHT = 1.2;

  const calculateSize = useCallback(() => {
    if (!testRef.current || !containerSize) return;

    // Skalierte Container-Maße
    const maxWidth = containerSize.width * scale;
    const maxHeight = containerSize.height * scale - 50;

    testRef.current.style.whiteSpace = 'pre-wrap';
    testRef.current.style.width = `${maxWidth}px`;

    let optimalSize = MAX_FONT_SIZE;
    let needsScroll = false;

    // Binäre Suche für optimale Größe
    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      testRef.current.style.fontSize = `${mid}px`;
      
      const textHeight = testRef.current.offsetHeight * LINE_HEIGHT;
      
      if (textHeight <= maxHeight) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Scroll-Notwendigkeit prüfen
    testRef.current.style.fontSize = `${optimalSize}px`;
    needsScroll = (testRef.current.offsetHeight * LINE_HEIGHT) > maxHeight;

    setFontSize(needsScroll ? MIN_FONT_SIZE : optimalSize);
    setShowScroll(needsScroll && optimalSize === MIN_FONT_SIZE);
  }, [containerSize, scale]);

  useEffect(() => {
    calculateSize();
  }, [text, containerSize, scale, calculateSize]);

  const language = useMemo(() => 
    text.match(/[äöüßÄÖÜ]/) ? 'de' : 'en',
    [text]
  );

  return (
    <>
      {/* Unsichtbares Mess-Element */}
      <div
        ref={testRef}
        lang={language}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          fontFamily: font,
          fontWeight: fontStyles.bold ? 'bold' : 'normal',
          fontStyle: fontStyles.italic ? 'italic' : 'normal',
          wordWrap: 'break-word',
          hyphens: 'auto',
          zIndex: -9999,
        }}
      >
        {text}
      </div>

      {/* Sichtbare Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        autoFocus={isEditing}
        lang={language}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          fontSize: `${fontSize}px`,
          textAlign,
          alignContent: "center",
          color: textColor,
          fontFamily: font,
          fontWeight: fontStyles.bold ? 'bold' : 'normal',
          fontStyle: fontStyles.italic ? 'italic' : 'normal',
          textDecoration: fontStyles.underline ? 'underline' : 'none',
          lineHeight: LINE_HEIGHT,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          hyphens: 'auto',
          cursor: isEditing ? 'text' : 'grab',
          overflow: showScroll ? 'auto' : 'hidden',
          WebkitHyphens: 'auto',
          MozHyphens: 'auto',
          msHyphens: 'auto',
        }}
      />
    </>
  );
};

export default TextCardContent;