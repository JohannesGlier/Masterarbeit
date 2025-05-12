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

      const mousePos = getCanvasMousePosition(
        event,
        canvasRef,
        offsetRef,
        scaleRef
      );

      setTempRectangle({
        x: tempRectangle.x,
        y: tempRectangle.y,
        width: mousePos.x - tempRectangle.x,
        height: mousePos.y - tempRectangle.y,
      });

      if (
        tempRectangle &&
        tempRectangle.width > 0 &&
        tempRectangle.height > 0
      ) {
        const selected = elements.filter((element) =>
          isElementInRectangle(element, tempRectangle)
        );

        setSelectedElements(selected);
      }
    };

    const handleMouseUp = (event) => {
      if (event.button !== 0) return;

      if (
        tempRectangle &&
        tempRectangle.width > 0 &&
        tempRectangle.height > 0 &&
        event.ctrlKey
      ) {
        console.log(
          "Aktion: Rechteck über Elemente ziehen\n",
          selectedElements
        );
        createPreviewTextcard();
        CreateSummaryTextcard();
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
      x:
        (tempRectangle.x + tempRectangle.width + 20) * scaleRef.current +
        offsetRef.current.x,
      y:
        (tempRectangle.y + tempRectangle.height + 20) * scaleRef.current +
        offsetRef.current.y,
      width: defaultWidth * scaleRef.current,
      height: defaultHeight * scaleRef.current,
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
