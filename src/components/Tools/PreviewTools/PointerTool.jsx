import React, { useState, useEffect, useMemo } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import { isElementInRectangle } from "@/utils/elementUtils";
import { ChatGPTService } from "@/services/ChatGPTService";
import { getCanvasMousePosition } from "@/utils/canvasUtils";
import PreviewTextcard from "@/components/Tools/PreviewTools/PreviewTextcard";
import { useCursor } from "@/components/Canvas/CursorContext";
import { useLanguage } from "@/components/Canvas/LanguageContext";

const PointerTool = ({
  canvasRef,
  canvasWrapperRef,
  elements,
  addTextcard,
}) => {
  const {
    offsetRef,
    scaleRef,
    isDrawing,
    setIsDrawing,
    setSelectedElements,
    selectedElements,
  } = useCanvas();
  const { setCursorStyle } = useCursor();
  const [tempRectangle, setTempRectangle] = useState(null);
  const { language } = useLanguage();
  const chatGPTService = useMemo(() => {
    console.log(`Initializing ChatGPTService with language: ${language}`);
    return new ChatGPTService(language);
  }, [language]);
  const [preview, setPreview] = useState([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      setCursorStyle("crosshair");

      setIsDrawing(true);
      setSelectedElements([]);

      const mousePos = getCanvasMousePosition(
        event,
        canvasRef,
        offsetRef,
        scaleRef
      );
      setTempRectangle({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event) => {
      if (event.button !== 0) return;
      if (!isDrawing || !tempRectangle) return;

      const mousePos = getCanvasMousePosition(event, canvasRef, offsetRef, scaleRef);

      const updatedTempRectangle = {
        x: tempRectangle.x,
        y: tempRectangle.y,
        width: mousePos.x - tempRectangle.x,
        height: mousePos.y - tempRectangle.y,
      };
      setTempRectangle(updatedTempRectangle);

      const normalizedRect = {
        x: Math.min(updatedTempRectangle.x, mousePos.x),
        y: Math.min(updatedTempRectangle.y, mousePos.y),
        width: Math.abs(updatedTempRectangle.width),
        height: Math.abs(updatedTempRectangle.height),
      };

      if (normalizedRect.width > 0 || normalizedRect.height > 0) {
        const selected = elements.filter(
          (element) => isElementInRectangle(element, normalizedRect)
        );
        setSelectedElements(selected);
      } else {
        setSelectedElements([]);
      }
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      if (tempRectangle && event.ctrlKey) {
        const finalRectNormalized = {
          x:
            tempRectangle.width < 0
              ? tempRectangle.x + tempRectangle.width
              : tempRectangle.x,
          y:
            tempRectangle.height < 0
              ? tempRectangle.y + tempRectangle.height
              : tempRectangle.y,
          width: Math.abs(tempRectangle.width),
          height: Math.abs(tempRectangle.height),
        };

        if (finalRectNormalized.width > 0 && finalRectNormalized.height > 0) {
          console.log(
            "Aktion: Rechteck über Elemente ziehen (normalisiert)\n",
            selectedElements
          );
          createPreviewTextcard();
          CreateSummaryTextcard();
        }
      }

      if (!isSummaryLoading) {
        setCursorStyle("default");
      }

      setTempRectangle(null);
      setIsDrawing(false);
    };

    const canvasWrapper = canvasWrapperRef.current;

    canvasWrapper.addEventListener("mousedown", handleMouseDown);
    canvasWrapper.addEventListener("mousemove", handleMouseMove);
    canvasWrapper.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvasWrapper.removeEventListener("mousedown", handleMouseDown);
      canvasWrapper.removeEventListener("mousemove", handleMouseMove);
      canvasWrapper.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    canvasRef,
    canvasWrapperRef,
    isDrawing,
    tempRectangle,
    scaleRef,
    offsetRef,
    preview,
  ]);

  useEffect(() => {
    if (isSummaryLoading) {
      setCursorStyle("wait");
    } else {
      if (!isDrawing) {
        setCursorStyle("default");
      }
    }
  }, [isSummaryLoading, isDrawing, setCursorStyle]);

  const createPreviewTextcard = () => {
    const defaultWidth = 250;
    const defaultHeight = 125;
    const previewsData = [];

    previewsData.push({
      key: `preview-${defaultWidth}`,
      x: tempRectangle.x + tempRectangle.width + 20,
      y: tempRectangle.y + tempRectangle.height + 20,
      width: defaultWidth,
      height: defaultHeight,
      text: "",
      isLoading: true,
    });

    setPreview(previewsData);
  };

  const CreateSummaryTextcard = async () => {
    setIsSummaryLoading(true);

    try {
      if (selectedElements.length > 0) {
        const simplifiedElements = selectedElements
          .map((el) => {
            if (el.type === "textcard") {
              return el.text;
            } else if (el.type === "rectangle") {
              return el.heading;
            }
            return null;
          })
          .filter((item) => item !== null);

        const text = JSON.stringify(simplifiedElements, null, 2);
        console.log("Eingabe als Prompt:", text);
        const response = await chatGPTService.getSummary(text);
        console.log("ChatGPT Response:", response.content);

        const newTextcard = {
          x: tempRectangle.x + tempRectangle.width + 20,
          y: tempRectangle.y + tempRectangle.height + 20,
          width: 250,
          height: 125,
          text: response.content,
          aiGenerated: true,
        };

        addTextcard(newTextcard);
      }
    } catch (error) {
      console.error("Fehler bei ChatGPT-Anfrage:", error);
    } finally {
      setIsSummaryLoading(false);
      setPreview([]);
    }
  };

  return (
    <div>
      {preview.map((preview) => (
        <PreviewTextcard
          key={preview.key}
          finalTop={preview.y * scaleRef.current + offsetRef.current.y}
          finalLeft={preview.x * scaleRef.current + offsetRef.current.x}
          scaledWidth={preview.width * scaleRef.current}
          scaledHeight={preview.height * scaleRef.current}
          isLoading={preview.isLoading}
        />
      ))}
      {tempRectangle && (
        <div
          style={{
            position: "absolute",
            top: (tempRectangle.height < 0 ? tempRectangle.y + tempRectangle.height : tempRectangle.y) * scaleRef.current + offsetRef.current.y,
            left: (tempRectangle.width < 0 ? tempRectangle.x + tempRectangle.width : tempRectangle.x) * scaleRef.current + offsetRef.current.x,
            width: `${Math.abs(tempRectangle.width) * scaleRef.current}px`,
            height: `${Math.abs(tempRectangle.height) * scaleRef.current}px`,
            backgroundColor: "rgba(0, 0, 255, 0.3)",
            border: "1px dashed blue",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 4000,
          }}
        />
      )}
    </div>
  );
};

export default PointerTool;
