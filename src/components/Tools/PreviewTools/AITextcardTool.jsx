import React, { useRef, useEffect, useCallback } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import {
  getElementAtPosition,
  getElementsInRectangle,
} from "@/utils/elementUtils";
import { ChatGPTService } from "@/services/ChatGPTService";

const AITextCardTool = ({
  canvasRef,
  canvasWrapperRef,
  addTextcard,
  elements,
  updateTextCardText,
}) => {
  const { offsetRef, scaleRef, setSelectedTool, setHoveredElement } =
    useCanvas();
  const isOverTextcard = useRef(false);
  const chatGPTService = new ChatGPTService();

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = "auto"; // Sicherstellen dass Cursor sichtbar ist
  };

  const updateCursor = useCallback(
    (e) => {
      const mousePos = getCanvasMousePosition(
        e,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const element = getElementAtPosition(elements, mousePos.x, mousePos.y);
      isOverTextcard.current = element?.type === "textcard";
      setHoveredElement(isOverTextcard.current ? null : element || null);
      forceCursor(isOverTextcard.current ? "not-allowed" : "pointer");
    },
    [canvasRef, elements, offsetRef, scaleRef, isOverTextcard]
  );

  const handleMouseUp = useCallback(
    async (e) => {
      if (e.button !== 0) return;
      const mousePos = getCanvasMousePosition(
        e,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const element = getElementAtPosition(elements, mousePos.x, mousePos.y);

      if (element && element.type === "textcard") {
        setSelectedTool("Pointer");
        isOverTextcard.current = false;
        setHoveredElement(null);
        console.log("Fehler: Ich bin über Textkarte!");
        return;
      }

      const textcardID = addEmptyTextcard(mousePos);
      const textContent = await createNeighborbasedTextcard(mousePos, element);
      updateTextCardText(textcardID, textContent);

      setSelectedTool("Pointer");
      isOverTextcard.current = false;
      setHoveredElement(null);
    },
    [canvasRef, elements, offsetRef, scaleRef]
  );

  const addEmptyTextcard = (mousePos) => {
    const defaultWidth = 100;
    const defaultHeight = 50;
    const finalRectangle = {
      x: mousePos.x - defaultWidth / 2,
      y: mousePos.y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      text: "Inhalt wird generiert..",
    };
    return addTextcard(finalRectangle);
  };

  const createNeighborbasedTextcard = async (mousePos, hoveredElement) => {
    let promptText = "";
    if (hoveredElement) {
      const elementsInFrame = getElementsInRectangle(elements, {
        x: hoveredElement.position.x,
        y: hoveredElement.position.y,
        width: hoveredElement.size.width,
        height: hoveredElement.size.height,
      }).filter((el) => el.type === "textcard");
      const allElements = [...elementsInFrame, ...[hoveredElement]];
      const simplifiedElements = allElements.map((el) => ({
        position: { ...el.position },
        ...(el.type === "textcard" && { text: el.text }),
        ...(el.type === "rectangle" && { text: el.heading }),
      }));

      promptText = JSON.stringify(simplifiedElements, null, 2);
    } else {
      const simplifiedElements = elements.map((el) => ({
        position: { ...el.position },
        ...(el.type === "textcard" && { text: el.text }),
        ...(el.type === "rectangle" && { text: el.heading }),
      }));

      promptText = JSON.stringify(simplifiedElements, null, 2);
    }

    try {
      console.log("Eingabe für Prompt:\n", promptText);
      const response = await chatGPTService.neighborbasedTextcard(promptText, mousePos.x, mousePos.y);
      console.log("ChatGPT Response:", response.content);
      return response.content;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current;
    let frameId;

    const persistentCursorUpdate = () => {
      if (isOverTextcard.current) {
        forceCursor("not-allowed");
      }
      frameId = requestAnimationFrame(persistentCursorUpdate);
    };

    canvasWrapper.addEventListener("mousemove", updateCursor);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    persistentCursorUpdate();
    return () => {
      canvasWrapper.removeEventListener("mousemove", updateCursor);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(frameId);
      forceCursor("");
    };
  }, [canvasWrapperRef, updateCursor, handleMouseUp]);

  return null;
};

export default AITextCardTool;
