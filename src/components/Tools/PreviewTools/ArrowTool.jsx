import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import {
  getAnchorFromPosition,
  getAnchorData,
} from "@/utils/Arrow/anchorUtils";
import {
  getElementAtPosition,
  attachTextcardToArrow,
} from "@/utils/elementUtils";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import styles from "@/components/Tools/PreviewTools/ArrowTool.module.css";

const ArrowTool = ({
  canvasRef,
  canvasWrapperRef,
  addArrow,
  elements,
  initialStart,
  onEndArrowFromFrame,
  addTextcard,
  updateArrowPosition,
  updateTextcardText,
  chatGPTResponse,
  onResponseProcessed,
}) => {
  const {
    offsetRef,
    scaleRef,
    setSelectedTool,
    setMouseDownElement,
    setHoveredElement,
    showContextMenu,
  } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const MAX_LENGTH = 500;

  const [previewEntries, setPreviewEntries] = useState([]);
  const [previewStatus, setPreviewStatus] = useState("idle");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(-1);
  const [lastTextcardId, setLastTextcardId] = useState(null);
  const [lastPreviewIndex, setLastPreviewIndex] = useState(-1);

  useEffect(() => {
    if (previewStatus === "success" && lastTextcardId && previewEntries.length > 0) {
      const targetIndex = lastPreviewIndex >= 0 ? lastPreviewIndex : 
                       currentPreviewIndex >= 0 ? currentPreviewIndex : 0;
      const content = previewEntries[targetIndex] || previewEntries[0];

      updateTextcardText(lastTextcardId, content);
      setStartPoint(null);
      setEndPoint(null);
      setIsDrawing(false);
      setMouseDownElement(null);
      setHoveredElement(null);
      onEndArrowFromFrame(null);
      setLastTextcardId(null);
      setLastPreviewIndex(-1);
      setSelectedTool("Pointer");
      onResponseProcessed();
      document.body.style.cursor = "default";
    }
    else if(previewStatus === "error") {
      updateTextcardText(lastTextcardId, "Parsing Error");
      setStartPoint(null);
      setEndPoint(null);
      setIsDrawing(false);
      setMouseDownElement(null);
      setHoveredElement(null);
      onEndArrowFromFrame(null);
      setLastTextcardId(null);
      setLastPreviewIndex(-1);
      setSelectedTool("Pointer");
      onResponseProcessed();
      document.body.style.cursor = "default";
    }
  }, [previewStatus, previewEntries, currentPreviewIndex, lastTextcardId]);

  useEffect(() => {
    if (chatGPTResponse?.content) {
      setPreviewStatus("loading");
      setPreviewEntries([]);

      console.log("Rohe Antwort von ChatGPT:", chatGPTResponse.content);
      const result = parseUnknownKeyArray(chatGPTResponse.content);

      if (result.success) {
        setPreviewEntries(result.data);
        setPreviewStatus("success");
        console.log("Geparste Einträge:", result.data);
      } else {
        setPreviewEntries([]);
        setPreviewStatus("error");
      }
    } else {
      setPreviewEntries([]);
      setPreviewStatus("idle");
    }
  }, [chatGPTResponse]);

  useEffect(() => {
    if (!isDrawing || !startPoint || !endPoint) return;
  
    const normalizedLength = calculateNormalizedLength(startPoint, endPoint);
    const index = Math.floor(normalizedLength * 10); // Immer 10 Stufen
    
    setCurrentPreviewIndex(index);
  }, [endPoint, isDrawing, startPoint]);

  const parseUnknownKeyArray = (jsonString) => {
    let data;
  
    // 1. Versuch, den String als JSON zu parsen
    try {
      data = JSON.parse(jsonString);
    } catch (error) {
      const errorMessage = "Fehler beim Parsen der JSON-Antwort.";
      console.error(errorMessage, error);
      console.error("Empfangener String:", jsonString);
      return { success: false, data: [], error: errorMessage };
    }
  
    // 2. Überprüfen, ob das Ergebnis ein Objekt ist (und nicht null, etc.)
    if (typeof data !== 'object' || data === null) {
      const errorMessage = "Geparste Daten sind kein gültiges Objekt.";
      console.warn(errorMessage, "Geparste Daten:", data);
      console.warn("Ursprünglicher String:", jsonString);
      return { success: false, data: [], error: errorMessage };
    }
  
    // 3. Finde den ersten Wert im Objekt, der ein Array ist
    for (const key in data) {
      // Stelle sicher, dass es sich um eine eigene Eigenschaft des Objekts handelt
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (Array.isArray(value)) {
          // Optional: Prüfen, ob die Array-Elemente Strings sind (für zusätzliche Robustheit)
          const allStrings = value.every(item => typeof item === 'string');
          if (!allStrings) {
               const warningMessage = `Warnung: Array unter Schlüssel '${key}' enthält nicht nur Strings. Gebe es trotzdem zurück.`;
               console.warn(warningMessage, "Array-Inhalt:", value);
               // Entscheide, ob du hier einen Fehler zurückgeben oder weitermachen möchtest.
               // Hier geben wir es trotzdem zurück, aber mit einer Warnung.
          }
          // Erfolg! Gib das gefundene Array zurück.
          return { success: true, data: value, error: null };
        }
      }
    }
  
    // 4. Wenn die Schleife durchläuft, ohne ein Array zu finden
    const errorMessage = "Kein Array als Wert im JSON-Objekt gefunden.";
    console.warn(errorMessage, "Geparstes Objekt:", data);
    console.warn("Ursprünglicher String:", jsonString);
    return { success: false, data: [], error: errorMessage };
  };

  useEffect(() => {
    if (initialStart) {
      // Setze den Startpunkt automatisch
      const element = elements.find((el) => el.id === initialStart.elementId);
      if (element) {
        const pos = getAnchorFromPosition(initialStart.anchor, element);
        setStartPoint({
          elementId: element.id,
          anchor: initialStart.anchor,
          x: pos.x,
          y: pos.y,
        });
        setIsDrawing(true);
      }
    }
  }, [initialStart]);

  useEffect(() => {
    if (lastTextcardId && previewStatus === "idle") {
      document.body.style.cursor = "wait";
    } else {
      document.body.style.cursor = "crosshair";
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0 || initialStart) return;
      event.stopPropagation();

      setIsDrawing(true);
      const { x: mouseX, y: mouseY } = getCanvasMousePosition(
        event,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const element = getElementAtPosition(elements, mouseX, mouseY);

      if (element) {
        const { anchor, x, y } = getAnchorData(element, mouseX, mouseY);
        setStartPoint({ elementId: element.id, anchor, x, y });
        setMouseDownElement(element);
      } else {
        setStartPoint({ x: mouseX, y: mouseY });
        setMouseDownElement(null);
      }
      setEndPoint({ x: mouseX, y: mouseY });
    };

    const handleMouseMove = (event) => {
      const { x: mouseX, y: mouseY } = getCanvasMousePosition(
        event,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const element = getElementAtPosition(elements, mouseX, mouseY);
      setHoveredElement(element);

      if (!isDrawing) return;

      let newEnd = { x: mouseX, y: mouseY };
      let newStart = startPoint;

      // Start Anchor aktualisieren
      if (startPoint.elementId) {
        const startElement = elements.find(
          (el) => el.id === startPoint.elementId
        );
        if (startElement) {
          const anchorData = getAnchorData(startElement, mouseX, mouseY);
          newStart = { ...startPoint, ...anchorData };
        }
      }

      // Längenbegrenzung
      if (initialStart) {
        newEnd = calculateLimitedPosition(startPoint, newEnd, MAX_LENGTH);
      }

      // End Anchor setzen
      if (element) {
        const anchorData = getAnchorData(element, newStart.x, newStart.y);
        newEnd = { ...anchorData, elementId: element.id };
      }

      setStartPoint(newStart);
      setEndPoint(newEnd);
    };

    const handleMouseUp = async (event) => {
      if (event.button !== 0) return;

      const { x: mouseX, y: mouseY } = getCanvasMousePosition(
        event,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const endElement = getElementAtPosition(elements, mouseX, mouseY);

      // Startpunkt vorbereiten
      const start = startPoint.elementId
        ? {
            elementId: startPoint.elementId,
            anchor: startPoint.anchor,
            x: startPoint.x,
            y: startPoint.y,
          }
        : { x: startPoint.x, y: startPoint.y };

      // Endpunkt vorbereiten
      let end = { x: mouseX, y: mouseY };
      if (endElement) {
        const referenceX = startPoint.elementId ? startPoint.x : startPoint.x;
        const referenceY = startPoint.elementId ? startPoint.y : startPoint.y;
        const anchorData = getAnchorData(endElement, referenceX, referenceY);
        end = { ...anchorData, elementId: endElement.id };
      }

      let textcardID = null;
      // Shortcut-Pfeil
      if (initialStart) {
        end = calculateLimitedPosition(start, end, MAX_LENGTH);
        textcardID = await addTextcardToShortcutArrow(start, end);
      } else {
        // Normaler Pfeil
        const newArrow = addArrow({ start, end });
        showContextMenu({ x: end.x, y: end.y }, "end", newArrow.id);
      }

      setLastPreviewIndex(currentPreviewIndex);

      if (textcardID && previewStatus === "idle") {
        setStartPoint(null);
        setEndPoint(null);
        setIsDrawing(false);
        setMouseDownElement(null);
        setHoveredElement(null);
        onEndArrowFromFrame(null);
        document.body.style.cursor = "wait";
      } else {
        document.body.style.cursor = "default";
        resetDrawingState();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        resetDrawingState();
      }
    };

    const resetDrawingState = () => {
      setSelectedTool("Pointer");
      setStartPoint(null);
      setEndPoint(null);
      setIsDrawing(false);
      setMouseDownElement(null);
      setHoveredElement(null);
      onEndArrowFromFrame(null);
      setLastTextcardId(null);
      setLastPreviewIndex(-1);
      onResponseProcessed();
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    scaleRef,
    offsetRef,
    addArrow,
    startPoint,
    elements,
    addTextcardToShortcutArrow,
    setLastTextcardId,
    lastTextcardId
  ]);

  const addTextcardToShortcutArrow = async (start, end) => {
    // Erstelle die Textkarte immer sofort
    const arrow = addArrow({ start, end });
    const newTextcard = attachTextcardToArrow(arrow, start.anchor);
    
    // Bestimme den initialen Text
    let initialText = "Loading...";
    if (previewStatus === "success") {
      initialText = previewEntries[currentPreviewIndex] || "Error";
    }
  
    // Erstelle die Textkarte und merke die ID
    const newTextcardId = addTextcard({
      x: newTextcard.x,
      y: newTextcard.y,
      width: newTextcard.width,
      height: newTextcard.height,
      text: initialText,
    });
    
    setLastTextcardId(newTextcardId); // Speichere ID für späteres Update
    updateArrowPosition(arrow.id, { 
      elementId: newTextcardId, 
      anchor: newTextcard.anchor 
    }, "end");

    return newTextcardId;
  };

  const calculateLimitedPosition = (start, end, maxLength) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy) * scaleRef.current;

    if (currentLength <= maxLength) return end;

    const angle = Math.atan2(dy, dx);
    const limitedLength = maxLength / scaleRef.current;
    return {
      x: start.x + limitedLength * Math.cos(angle),
      y: start.y + limitedLength * Math.sin(angle),
      ...(end.elementId
        ? {
            elementId: end.elementId,
            anchor: end.anchor,
          }
        : {}),
    };
  };

  const calculateNormalizedLength = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    return (pixelLength * scaleRef.current) / MAX_LENGTH;
  };

  const renderLengthIndicator = () => {
    if (!isDrawing || !initialStart || !startPoint || !endPoint) return null;

    const endElement = getElementAtPosition(elements, endPoint.x, endPoint.y);
    if (endElement) return null;

    return (
      <div
        style={{
          position: "absolute",
          top:
            ((startPoint.y + endPoint.y) / 2) * scaleRef.current +
            offsetRef.current.y -
            10,
          left:
            ((startPoint.x + endPoint.x) / 2) * scaleRef.current +
            offsetRef.current.x -
            20,
          color: "black",
          fontSize: "12px",
          pointerEvents: "none",
          zIndex: 3000,
          backgroundColor: "white",
          padding: "2px 4px",
          borderRadius: "3px",
        }}
      >
        {(
          (Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          ) *
            scaleRef.current) /
          MAX_LENGTH
        ).toFixed(2)}
      </div>
    );
  };

  const renderPreview = () => {
    if (!isDrawing || !initialStart || !endPoint) return null;

    const isLoading = previewStatus === "loading" || previewStatus === "idle";
    let previewTextContent; // Text-Inhalt für den Erfolgsfall

    // Text nur im Erfolgsfall setzen (oder bei Fehler)
    if (previewStatus === "success") {
      if (
        previewEntries.length > 0 &&
        currentPreviewIndex >= 0 &&
        currentPreviewIndex < previewEntries.length
      ) {
        previewTextContent = previewEntries[currentPreviewIndex];
      } else if (previewEntries.length === 0) {
        previewTextContent = "Nichts gefunden";
      } else {
        previewTextContent = "Ungültiger Index";
      }
    } else if (previewStatus === "error") {
      previewTextContent = "Fehler";
    }

    const baseWidth = 200;
    const baseHeight = 75;

    // --- Skalierte Dimensionen für den Style des Preview-Divs ---
    const scale = scaleRef.current;
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;

    // --- Berechne die RAW Top-Left Koordinaten ---
    // basierend auf dem ENDPUNKT und dem AKTUELLEN Start-Anker
    // Diese Logik spiegelt attachTextcardToArrow
    let rawX, rawY;
    const currentEndPoint = endPoint; // Aktuelle Position während des Ziehens
    // *** Verwende den AKTUELLEN Anker aus dem startPoint State ***
    const currentStartAnchor = startPoint.anchor;

    switch (currentStartAnchor) { // Verwende den dynamischen Anker
        case 'top': // Textkarte ist ÜBER dem Endpunkt
            rawX = currentEndPoint.x - baseWidth / 2;
            rawY = currentEndPoint.y - baseHeight;
            break;
        case 'bottom': // Textkarte ist UNTER dem Endpunkt
            rawX = currentEndPoint.x - baseWidth / 2;
            rawY = currentEndPoint.y;
            break;
        case 'left': // Textkarte ist LINKS vom Endpunkt
            rawX = currentEndPoint.x - baseWidth;
            rawY = currentEndPoint.y - baseHeight / 2;
            break;
        case 'right': // Textkarte ist RECHTS vom Endpunkt
        default: // Fallback, falls Anker ungültig
            rawX = currentEndPoint.x;
            rawY = currentEndPoint.y - baseHeight / 2;
            break;
    }

    // --- Konvertiere RAW Canvas-Koordinaten in SCREEN-Koordinaten für CSS ---
    const finalLeft = rawX * scale + offsetRef.current.x;
    const finalTop = rawY * scale + offsetRef.current.y;

    return (
      <div
        style={{
          position: "absolute",
          top: `${finalTop}px`,
          left: `${finalLeft}px`,
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          color: "black",
          backgroundColor: "rgba(230, 230, 230, 0.4)",
          borderRadius: "25px",
          boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
          padding: "12px",
          boxSizing: "border-box",
          border: "0px solid #ccc",
          zIndex: 3000,
          pointerEvents: "none",
          fontSize: "auto",
          textAlign: "center",
          alignContent: "center",
          overflow: "hidden",
        }}
        className={isLoading ? styles.loadingPulseDiv : ""}
      >
        {isLoading ? (
          <div className={styles.loadingDotsContainer}>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        ) : (
          <span style={{ padding: "12px" }}>{previewTextContent}</span>
        )}
      </div>
    );
  };

  return (
    <div>
      {isDrawing && startPoint && endPoint && (
        <div
          style={{
            position: "absolute",
            top: startPoint.y * scaleRef.current + offsetRef.current.y,
            left: startPoint.x * scaleRef.current + offsetRef.current.x,
            width: `${
              Math.sqrt(
                Math.pow(endPoint.x - startPoint.x, 2) +
                  Math.pow(endPoint.y - startPoint.y, 2)
              ) * scaleRef.current
            }px`,
            height: "2px",
            backgroundColor: "blue",
            transform: `rotate(${Math.atan2(
              endPoint.y - startPoint.y,
              endPoint.x - startPoint.x
            )}rad)`,
            transformOrigin: "0 0",
            pointerEvents: "none",
            zIndex: 2999,
          }}
        />
      )}
      {renderLengthIndicator()}
      {renderPreview()}
    </div>
  );
};

export default ArrowTool;
