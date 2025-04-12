import React, { useState, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { ChatGPTService } from "@/services/ChatGPTService";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";
import {
  getElementAtPosition,
  getTextFromElement,
  getTextFromAllElement,
} from "@/utils/elementUtils";

const TextCardTool = ({
  canvasRef,
  canvasWrapperRef,
  addTextcard,
  elements,
}) => {
  const { offsetRef, scaleRef, setSelectedTool } = useCanvas();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempRectangle, setTempRectangle] = useState(null);
  const chatGPTService = new ChatGPTService();
  const [preview, setPreview] = useState([]);

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = "auto";
  };

  // Mouse event handling for drawing
  useEffect(() => {
    document.body.style.cursor = "crosshair";

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setIsDrawing(true);
      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
      setTempRectangle({
        x: tempRectangle.x,
        y: tempRectangle.y,
        width: mousePos.x - tempRectangle.x,
        height: mousePos.y - tempRectangle.y,
      });
    };

    const handleMouseUp = async (event) => {
      if (event.button !== 0) return;

      if (tempRectangle && tempRectangle.width > 0 && tempRectangle.height > 0) {
        // Benutzerdefiniertes Rechteck durch Ziehen
        addTextcard({ ...tempRectangle, text: "" });
        setSelectedTool("Pointer");
      } else {
        const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);
        const elementUnderMouse = getElementAtPosition(elements, mousePos.x, mousePos.y);

        createPreviewTextcard(mousePos);
        setIsDrawing(false);
        setTempRectangle(null);
        forceCursor("wait");

        let textContent = "";
        try {
          textContent = await getTextcardContent(elementUnderMouse);
        } catch (error) {
          console.error("Fehler beim Erstellen der Textkarte:", error);
        } finally {
          console.log("Erstellen der Textkarte abgeschlossen, resetting state...");
          forceCursor("default");
          setSelectedTool("Pointer");
          setPreview([]);
          createTextcard(mousePos, textContent);
        }
      }

      setTempRectangle(null);
      setIsDrawing(false);
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);

    let frameId;

    const persistentCursorUpdate = () => {
      if (preview.length === 1) {
        forceCursor("wait");
      }
      frameId = requestAnimationFrame(persistentCursorUpdate);
    };

    persistentCursorUpdate();

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(frameId);
      forceCursor("");
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    tempRectangle,
    scaleRef,
    offsetRef,
    setPreview,
  ]);

  const createPreviewTextcard = (mousePos) => {
    const defaultWidth = 200 * scaleRef.current;
    const defaultHeight = 75 * scaleRef.current;
    const previewsData = [];

    previewsData.push({
      key: `preview-${defaultWidth}`,
      x: mousePos.x * scaleRef.current + offsetRef.current.x - defaultWidth / 2,
      y: mousePos.y * scaleRef.current + offsetRef.current.y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      text: "",
      isLoading: true,
    });

    setPreview(previewsData);
  }

  const createTextcard = (mousePos, text) => {
    const defaultWidth = 200;
    const defaultHeight = 75;
    const finalTextcard = {
      x: mousePos.x - defaultWidth / 2,
      y: mousePos.y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      text: text,
    };
    addTextcard(finalTextcard);
  };

  const getTextcardContent = async (hoveredElement) => {
    let promptText = "";
    
    if(hoveredElement)
      promptText = getTextFromElement(hoveredElement, elements);
    else
      promptText = getTextFromAllElement(elements);

    try {
      console.log("Eingabe für Prompt:\n", promptText);
      const response = await chatGPTService.neighborbasedTextcard(promptText);
      console.log("ChatGPT Response:", response.content);
      return response.content;
    } catch (error) {
      throw error;
    }
  };

  return (
    <div>
      {preview.map(preview => (
        <PreviewTextcard
          key={preview.key}
          finalTop={preview.y}
          finalLeft={preview.x}
          scaledWidth={preview.width}
          scaledHeight={preview.height}
          isLoading={preview.isLoading}
        />
      ))}
      {tempRectangle && (
        <div
          style={{
            position: "absolute",
            top: tempRectangle.y * scaleRef.current + offsetRef.current.y,
            left: tempRectangle.x * scaleRef.current + offsetRef.current.x,
            width: `${tempRectangle.width * scaleRef.current}px`,
            height: `${tempRectangle.height * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.3)",
            border: "1px dashed blue",
            borderRadius: "25px",
            pointerEvents: "none",
            zIndex: 3999,
          }}
        />
      )}
    </div>
  );
};

export default TextCardTool;
