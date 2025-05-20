import { useState, useRef, useEffect } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import CanvasToolbar from "@/components/Canvas/CanvasToolbar/CanvasToolbar";
import CanvasMenu from "@/components/Canvas/CanvasMenu/CanvasMenu";
import CanvasContent from "@/components/Canvas/CanvasContent";
import ViewMenu from "@/components/Canvas/CanvasViewMenu/ViewMenu";
import { useCursor } from "@/components/Canvas/CursorContext";

const InfiniteCanvas = ({ onBack }) => {
  const { scaleRef, offsetRef, selectedTool, selectedElements } = useCanvas();
  const { setCursorStyle } = useCursor();
  const [scale, setScale] = useState(2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [minAllowedOffsetX, setMinAllowedOffsetX] = useState(0);
  const [maxAllowedOffsetX, setMaxAllowedOffsetX] = useState(0);
  const [minAllowedOffsetY, setMinAllowedOffsetY] = useState(0);
  const [maxAllowedOffsetY, setMaxAllowedOffsetY] = useState(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  const BACKGROUND_SIZE = 5000;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const maxCoordinate = BACKGROUND_SIZE; // Dies ist die maximale Ausdehnung vom Ursprung
      const maxCoordinateScaled = maxCoordinate * scale;

      const newMinX = window.innerWidth - maxCoordinateScaled;
      const newMaxX = maxCoordinateScaled;
      const newMinY = window.innerHeight - maxCoordinateScaled;
      const newMaxY = maxCoordinateScaled;

      setMinAllowedOffsetX(newMinX);
      setMaxAllowedOffsetX(newMaxX);
      setMinAllowedOffsetY(newMinY);
      setMaxAllowedOffsetY(newMaxY);

      setOffset((prevOffset) => ({
        x: Math.max(newMinX, Math.min(prevOffset.x, newMaxX)),
        y: Math.max(newMinY, Math.min(prevOffset.y, newMaxY)),
      }));
    }
  }, [
    scale,
    typeof window !== "undefined" ? window.innerWidth : null,
    typeof window !== "undefined" ? window.innerHeight : null,
  ]);

  const handleWheel = (event) => {
    if (!canvasRef.current) return;

    let wheelDeltaY = event.deltaY;
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (isMac) {
      wheelDeltaY = -wheelDeltaY;
    }

    const oldScale = scale;
    const newScaleAttempt = scale - wheelDeltaY * 0.001;
    const newScale = Math.min(Math.max(newScaleAttempt, MIN_SCALE), MAX_SCALE);

    if (newScale === oldScale) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const scaleRatio = newScale / oldScale;

    const newIdealOffsetX = mouseX - (mouseX - offset.x) * scaleRatio;
    const newIdealOffsetY = mouseY - (mouseY - offset.y) * scaleRatio;

    setScale(newScale);

    // Grenzen hier neu berechnen mit newScale und korrekter Logik
    const maxCoordinate = BACKGROUND_SIZE;
    const maxCoordinateScaled = maxCoordinate * newScale; // Wichtig: newScale verwenden!

    const currentMinX = window.innerWidth - maxCoordinateScaled;
    const currentMaxX = maxCoordinateScaled;
    const currentMinY = window.innerHeight - maxCoordinateScaled;
    const currentMaxY = maxCoordinateScaled;

    setOffset({
      x: Math.max(currentMinX, Math.min(newIdealOffsetX, currentMaxX)),
      y: Math.max(currentMinY, Math.min(newIdealOffsetY, currentMaxY)),
    });
  };

  const handleMouseDown = (event) => {
    if (event.button === 2) {
      isPanning.current = true;
      lastMousePos.current = { x: event.clientX, y: event.clientY };
      setCursorStyle("grabbing");
    }
  };

  const handleMouseMove = (event) => {
  if (isPanning.current) {
    const dx = event.clientX - lastMousePos.current.x;
    const dy = event.clientY - lastMousePos.current.y;

    const maxCoordinate = BACKGROUND_SIZE;
    const maxCoordinateScaled = maxCoordinate * scale; // Aktuelle Skala verwenden

    // Dieselben Grenzen wie beim Zoomen und im useEffect
    const currentMinX = window.innerWidth - maxCoordinateScaled;
    const currentMaxX = maxCoordinateScaled;
    const currentMinY = window.innerHeight - maxCoordinateScaled;
    const currentMaxY = maxCoordinateScaled;

    const newPanOffsetX = Math.max(currentMinX, Math.min(offset.x + dx, currentMaxX));
    const newPanOffsetY = Math.max(currentMinY, Math.min(offset.y + dy, currentMaxY));

    setOffset({ x: newPanOffsetX, y: newPanOffsetY });
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }
};

  const handleMouseUp = () => {
    if (isPanning.current) setCursorStyle("default");
    isPanning.current = false;
  };

  const pointerEvents = selectedElements.some(
    (el) => el.isResizing || el.isDragging
  )
    ? "none"
    : "auto";

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f3f3f3",
      }}
    >
      <div
        ref={canvasWrapperRef}
        style={{
          position: "absolute",
          top: -5000,
          left: -5000,
          width: 10000,
          height: 10000,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundImage: `linear-gradient(to right, #ddd 1px, transparent 1px),
                            linear-gradient(to bottom, #ddd 1px, transparent 1px)`,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      />
      {
        <CanvasContent
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
        />
      }
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 4001,
          pointerEvents,
        }}
      >
        <CanvasToolbar />
        <CanvasMenu onBack={onBack} />
      </div>
      <div
        style={{
          position: "absolute",
          top: "16px", // Gleiche Höhe wie die anderen Menüs
          left: "50%", // Startet bei 50% der Breite
          transform: "translateX(-50%)", // Zentriert das Element horizontal
          zIndex: 4001, // Gleiche Ebene wie die anderen Menüs
        }}
      >
        <ViewMenu /> {/* Hier die neue Komponente einfügen */}
      </div>
    </div>
  );
};

export default InfiniteCanvas;
