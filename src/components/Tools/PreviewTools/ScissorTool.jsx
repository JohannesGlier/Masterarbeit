import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import { getElementAtPosition } from "@/utils/elementUtils";
import { ChatGPTService } from "@/services/ChatGPTService";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";

const ScissorTool = ({
  canvasRef,
  canvasWrapperRef,
  elements,
  addTextcard,
}) => {
  const { offsetRef, scaleRef, setSelectedTool, setHoveredElement } = useCanvas();
  const chatGPTService = new ChatGPTService();
  const isCutting = useRef(false);
  const [previews, setPreviews] = useState([]);
  const [isAnimatingCut, setIsAnimatingCut] = useState(false);
  const cursorIntervalRef = useRef(null);
  const cursorStyles = {
    default: 'crosshair',   
    scissor: 'url("/cursors/Scissor_64_64.png") 16 16, auto',
    cut: 'url("/cursors/Scissor_Cut_64_64.png") 16 16, auto',
    not_allowed: 'not-allowed',
  };

  const forceCursor = (style) => {
    const wrapper = canvasWrapperRef.current;
    if (wrapper) {
      wrapper.style.cursor = style;
    }
  };

  const startCuttingAnimation = useCallback(() => {
    if (cursorIntervalRef.current) return;
    console.log("Start Animation (Scheduling first frame via RAF)");
  
    let isScissor = false;
  
    requestAnimationFrame(() => {
      console.log("Applying first frame via RAF");
      forceCursor(cursorStyles.cut);
    });
  
    cursorIntervalRef.current = setInterval(() => {
      isScissor = !isScissor;
      const nextCursor = isScissor ? cursorStyles.scissor : cursorStyles.cut;
      console.log("Interval Tick - Setting cursor to:", nextCursor);
      forceCursor(nextCursor);
    }, 200);
  
  }, [cursorStyles, forceCursor]); 

  const stopCuttingAnimation = useCallback(() => {
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
      cursorIntervalRef.current = null;
      console.log("Animation Interval Stopped"); // Log für Debugging behalten
    }
    // KEIN forceCursor hier!
  }, []);

  useEffect(() => {
    if (isAnimatingCut) {
      startCuttingAnimation();
    } else {
      stopCuttingAnimation();
    }

    return () => {
      stopCuttingAnimation();
    };
  }, [isAnimatingCut, startCuttingAnimation, stopCuttingAnimation]);

  const updateCursor = useCallback(
    (e) => {
      if (isAnimatingCut || isCutting.current) return;
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
    [canvasRef, elements, offsetRef, scaleRef, isCutting, isAnimatingCut, setHoveredElement, cursorStyles]
  );

  const getScreenCoords = useCallback((canvasX, canvasY) => {
    const scale = scaleRef.current;
    const offset = offsetRef.current;
    return {
      x: canvasX * scale + offset.x,
      y: canvasY * scale + offset.y,
    };
  }, [scaleRef, offsetRef]);

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

      if(!elementUnderMouse.text){
        console.log("Split empty textcard");
        const widthOffset = 40;
        const heightOffset = 110;
        for(let i = 0; i < 2; i++){
          addTextcard({
            x: elementUnderMouse.position.x + elementUnderMouse.size.width + widthOffset,
            y: elementUnderMouse.position.y + i * heightOffset,
            width: 200,
            height: 75,
            text: "",
          });
        }
        return;
      }

      if (elementUnderMouse?.type === "textcard" && elementUnderMouse.text) {
        isCutting.current = true;
        setIsAnimatingCut(true);

        const previewWidth = 200;
        const previewHeight = 75;
        const widthOffset = 40;
        const heightOffset = 110;

        const previewsData = [];
        for (let i = 0; i < 2; i++) {
          const canvasPreviewX = elementUnderMouse.position.x + elementUnderMouse.size.width + widthOffset;
          const canvasPreviewY = elementUnderMouse.position.y + i * heightOffset;

          const screenCoords = getScreenCoords(canvasPreviewX, canvasPreviewY);

          previewsData.push({
            key: `preview-${i}`,
            x: screenCoords.x, // Bildschirm X
            y: screenCoords.y, // Bildschirm Y
            width: previewWidth * scaleRef.current, // Feste Breite in Pixel
            height: previewHeight * scaleRef.current, // Feste Höhe in Pixel
            isLoading: true,
          });
        }
        setPreviews(previewsData);

        try {
            await splitIntoMultipleTextcards(elementUnderMouse, mousePos.x, mousePos.y);
          } catch (error) {
            console.error("Fehler beim Teilen:", error);
          } finally {
            console.log("Cutting finished, resetting state...");
            isCutting.current = false;
            setIsAnimatingCut(false);
            setSelectedTool("Pointer");
            setHoveredElement(null);
    
            console.log("Setting cursor for Pointer tool to 'default'");
            forceCursor('default'); // <-- WICHTIG
          }
        } else {
          // Fall: Klick war nicht auf gültiger Textkarte -> auch zurück zum Pointer
          setSelectedTool("Pointer");
          setHoveredElement(null);
          // Auch hier den Cursor für den Pointer setzen
          forceCursor('default');
        }
    },
    [canvasRef, elements, offsetRef, scaleRef, splitIntoMultipleTextcards, setSelectedTool, setHoveredElement, setIsAnimatingCut, isCutting, forceCursor, getScreenCoords]
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

      const defaultErrorText = "No meaningful split possible";
      if (content.length === 0) {
        console.log("Content array ist leer. Füge Standard-Einträge hinzu.");
        content = [
            { text: defaultErrorText }, // Erster Standardeintrag
            { text: defaultErrorText }  // Zweiter Standardeintrag
        ];
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

    canvasWrapper.addEventListener("mousemove", updateCursor);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvasWrapper.removeEventListener("mousemove", updateCursor);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canvasWrapperRef, updateCursor, handleMouseUp]);

  return (
    <>
      {previews.map(preview => (
        <PreviewTextcard
          key={preview.key}
          finalTop={preview.y}
          finalLeft={preview.x}
          scaledWidth={preview.width}
          scaledHeight={preview.height}
          isLoading={preview.isLoading}
        />
      ))}
    </>
  );
};

export default ScissorTool;
