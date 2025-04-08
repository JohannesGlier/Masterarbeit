import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import TurndownService from 'turndown';
import remarkGfm from 'remark-gfm';

// Hilfsfunktionen
const turndownService = new TurndownService({
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
  headingStyle: 'atx',
  hr: '---',
});

// Verbesserte Listen-Regeln
turndownService.addRule('lists', {
  filter: ['li'],
  replacement: function(content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, '\n    ') // indent
    
    const prefix = options.bulletListMarker + ' ';
    return prefix + content + '\n';
  }
});

turndownService.addRule('listItems', {
  filter: ['ul', 'ol'],
  replacement: function(content) {
    return '\n\n' + content.trim() + '\n\n';
  }
});

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
  onDoubleClick,
}) => {
  const testRef = useRef();
  const contentRef = useRef();
  const [fontSize, setFontSize] = useState(16);
  const [showScroll, setShowScroll] = useState(false);
  const [isRichText, setIsRichText] = useState(false);

  // Konfiguration
  const MIN_FONT_SIZE = 8;
  const MAX_FONT_SIZE = 52;
  const LINE_HEIGHT = 1.2;
  const BUFFER = 50;

  // Formatierung erkennen
  useEffect(() => {
    const hasMarkdown = /(\*\*|__|\*|_|\[|\]|\(|\)|#|`|- |\d\. )/.test(text);
    setIsRichText(hasMarkdown);
  }, [text]);

  const calculateSize = useCallback(() => {
    if (!testRef.current || !containerSize) return;

    const maxWidth = containerSize.width * scale;
    const maxHeight = containerSize.height * scale - BUFFER;

    testRef.current.style.width = `${maxWidth}px`;
    testRef.current.style.fontSize = `${fontSize}px`;

    let optimalSize = MAX_FONT_SIZE;
    let needsScroll = false;

    // Binäre Suche für Größenanpassung
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

    testRef.current.style.fontSize = `${optimalSize}px`;
    needsScroll = (testRef.current.offsetHeight * LINE_HEIGHT) > maxHeight;

    setFontSize(needsScroll ? MIN_FONT_SIZE : optimalSize);
    setShowScroll(needsScroll && optimalSize === MIN_FONT_SIZE);
  }, [containerSize, scale]);

  // Effekt für Größenanpassung
  useEffect(() => {
    if (testRef.current) {
      // Temporäres Rendering für Größenmessung
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text
        .replace(/^- /gm, '• ')
        .replace(/^\d+\. /gm, '• ');
      testRef.current.innerHTML = tempDiv.textContent || tempDiv.innerText || '';
      calculateSize();
    }
  }, [text, containerSize, scale, calculateSize]);

  const handlePaste = (e) => {
    e.preventDefault();
    
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');
  
    if (html) {
      try {
        // Bereinigung des HTML
        const cleanHtml = html
          .replace(/<p[^>]*>/g, '')
          .replace(/<\/p>/g, '\n\n')
          .replace(/<br[^>]*>/g, '\n')
          .replace(/<li[^>]*>/g, '<li>')
          .replace(/<ul[^>]*>/g, '<ul>')
          .replace(/<ol[^>]*>/g, '<ol>');
        
        const markdown = turndownService.turndown(cleanHtml)
          .replace(/\n- \n/g, '\n\n') // Doppelte Listenpunkte bereinigen
          .replace(/(\n- ){2,}/g, '$1'); // Mehrfache Listenpunkte reduzieren
        
        onChange(markdown);
      } catch (error) {
        console.error('Konvertierung fehlgeschlagen:', error);
        // Fallback: Plain-Text mit intelligenter Formatierung
        const formattedPlain = plain
          .replace(/^\s*[-*+]\s+/gm, '- ') // Ungeordnete Listen
          .replace(/^\s*\d+\.\s+/gm, '1. ') // Geordnete Listen
          .replace(/\n\s*\n/g, '\n\n'); // Leerzeilen bereinigen
        onChange(formattedPlain);
      }
    } else {
      // Plain-Text ohne HTML
      const formattedPlain = plain
        .replace(/^\s*[-*+]\s+/gm, '- ')
        .replace(/^\s*\d+\.\s+/gm, '1. ')
        .replace(/\n\s*\n/g, '\n\n');
      onChange(formattedPlain);
    }
  };

  const language = useMemo(() => 
    text.match(/[äöüßÄÖÜ]/) ? 'de' : 'en',
    [text]
  );

  return (
    <>
      {/* Unsichtbares Mess-Element (misst formatierten Inhalt) */}
      <div
        ref={testRef}
        lang={language}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontFamily: font,
          zIndex: -9999,
          hyphens: 'auto',
          WebkitHyphens: 'auto',
          MozHyphens: 'auto',
          msHyphens: 'auto',
        }}
      />
      
      {/* Sichtbarer Inhalt */}
      <div
        ref={contentRef}
        onDoubleClick={onDoubleClick}
        style={{
          width: '100%',
          height: '100%',
          overflow: showScroll ? 'auto' : 'hidden',
          fontSize: `${fontSize}px`,
          fontFamily: font,
          color: textColor,
          textAlign,
          alignContent: "center",
          lineHeight: LINE_HEIGHT,
          //cursor: isEditing ? 'text' : 'pointer',
        }}
      >
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onPaste={handlePaste}
            autoFocus
            lang={language}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              color: 'inherit',
              lineHeight: 'inherit',
              cursor: 'text',
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              MozHyphens: 'auto',
              msHyphens: 'auto',
            }}
          />
        ) : isRichText ? (
          <div style={{ pointerEvents: 'none' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p style={{ margin: '4px 0' }} {...props} />,
                strong: ({ node, ...props }) => (
                  <strong style={{ fontWeight: 'bold' }} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={{ fontStyle: 'italic' }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul style={{ 
                    margin: '6px 0', 
                    paddingLeft: '24px',
                    listStyleType: 'disc' 
                  }} {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol style={{ 
                    margin: '6px 0', 
                    paddingLeft: '24px',
                    listStylePosition: 'outside' 
                  }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ 
                    marginLeft: '36px',
                    paddingLeft: '4px',
                    lineHeight: '1.4' 
                  }} {...props} />
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          <div>{text}</div>
        )}
      </div>
    </>
  );
};

export default TextCardContent;