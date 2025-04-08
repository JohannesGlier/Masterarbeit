import React, { useCallback, useEffect, useRef } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import { getElementAtPosition } from "@/utils/elementUtils";
import { ChatGPTService } from "@/services/ChatGPTService";

const ScissorTool = ({
  canvasRef,
  canvasWrapperRef,
  elements,
  addTextcard,
}) => {
  const { offsetRef, scaleRef, setSelectedTool, setHoveredElement } = useCanvas();
  const chatGPTService = new ChatGPTService();
  const isCutting = useRef(false);
  const cursorStyles = {
    default: 'crosshair',   
    scissor: 'url("/cursors/Scissor_64_64.png") 16 16, auto',
    cut: 'url("/cursors/Scissor_Cut_64_64.png") 16 16, auto',
    not_allowed: 'not-allowed',
  };

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = 'auto'; // Sicherstellen dass Cursor sichtbar ist
  };

  const updateCursor = useCallback(
    (e) => {
      if (isCutting.current) return;
      const mousePos = getCanvasMousePosition(
        e,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const element = getElementAtPosition(elements, mousePos.x, mousePos.y);
      if(element){
        setHoveredElement(element);
        forceCursor(element?.type === "textcard" ? cursorStyles.scissor : cursorStyles.not_allowed);
      }
      else{
        setHoveredElement(null);
        forceCursor(cursorStyles.default);
      }
    },
    [canvasRef, elements, offsetRef, scaleRef, isCutting]
  );

  const handleMouseUp = useCallback(async (e) => {
      if (e.button !== 0 || isCutting.current) return;
      const mousePos = getCanvasMousePosition(
        e,
        canvasRef,
        offsetRef,
        scaleRef
      );
      const elementUnderMouse = getElementAtPosition(
        elements,
        mousePos.x,
        mousePos.y
      );
      if (elementUnderMouse?.type === "textcard" && elementUnderMouse.text) {
        isCutting.current = true;
        forceCursor(cursorStyles.cut);

        try {
            await splitIntoMultipleTextcards(elementUnderMouse, mousePos.x, mousePos.y);
          } catch (error) {
            console.error("Fehler beim Teilen:", error);
          } finally {
            isCutting.current = false;
            forceCursor(cursorStyles.default);
            setSelectedTool("Pointer");
            setHoveredElement(null);
          }
        } else {
          setSelectedTool("Pointer");
          setHoveredElement(null);
        }
    },
    [canvasRef, elements, offsetRef, scaleRef]
  );

  const splitIntoMultipleTextcards = async (element, x, y) => {
    try {
      console.log("Eingabe für Prompt:\n", element.text);
      const response = await chatGPTService.splitTextcard(element.text);
      console.log("ChatGPT Response:", response.content);

      let content = response.content;
      if (typeof content === "string") {
        content = JSON.parse(content);
      }

      if (!Array.isArray(content)) {
        throw new Error("Ungültiges Format - Array erwartet");
      }

      const widthOffset = 40;
      const heightOffset = 110;
      await Promise.all(content.map((item, index) => {
        if (item.text && typeof item.text === "string") {
          return new Promise(resolve => {
            setTimeout(() => {
              addTextcard({
                x: element.position.x + element.size.width + widthOffset,
                y: element.position.y + index * heightOffset,
                width: 200,
                height: 75,
                text: item.text,
              });
              resolve();
            }, index * 100);
          });
        }
        return Promise.resolve();
      }));

    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current;
    let frameId;
    
    const persistentCursorUpdate = () => {
      if (isCutting.current) {
        forceCursor(cursorStyles.cut);
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

export default ScissorTool;
