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
  const [maxOffsetX, setMaxOffsetX] = useState(0);
  const [maxOffsetY, setMaxOffsetY] = useState(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

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
      const visibleWidth = window.innerWidth / scale;
      const visibleHeight = window.innerHeight / scale;

      const halfBackground = BACKGROUND_SIZE / 2;

      // Maximale Grenzen berechnen
      const maxX = halfBackground - visibleWidth / 2;
      const maxY = halfBackground - visibleHeight / 2;

      // Minimale Grenzen berechnen (negativ, weil man nach links/oben scrollt)
      const minX = -halfBackground + visibleWidth / 2;
      const minY = -halfBackground + visibleHeight / 2;

      setMaxOffsetX(maxX);
      setMaxOffsetY(maxY);
      setOffset((prevOffset) => ({
        x: Math.min(Math.max(prevOffset.x, minX), maxX),
        y: Math.min(Math.max(prevOffset.y, minY), maxY),
      }));
    }
  }, [scale]);

  const handleWheel = (event) => {
    if (!canvasRef.current) return;

    let wheelDeltaY = event.deltaY;

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    if (isMac) {
      wheelDeltaY = -wheelDeltaY;
    }

    const newScale = Math.min(
      Math.max(scale - wheelDeltaY * 0.001, MIN_SCALE),
      MAX_SCALE
    );
    if (newScale === scale) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const scaleRatio = newScale / scale;

    const newOffsetX = (offset.x - mouseX) * scaleRatio + mouseX;
    const newOffsetY = (offset.y - mouseY) * scaleRatio + mouseY;

    setScale(newScale);
    setOffset({
      x: Math.min(Math.max(newOffsetX, -maxOffsetX / 2), maxOffsetX / 2),
      y: Math.min(Math.max(newOffsetY, -maxOffsetY / 2), maxOffsetY / 2),
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

      const newOffsetX = Math.min(
        Math.max(
          offset.x + dx,
          -(BACKGROUND_SIZE * scale - window.innerWidth) / 2
        ),
        (BACKGROUND_SIZE * scale - window.innerWidth) / 2
      );
      const newOffsetY = Math.min(
        Math.max(
          offset.y + dy,
          -(BACKGROUND_SIZE * scale - window.innerHeight) / 2
        ),
        (BACKGROUND_SIZE * scale - window.innerHeight) / 2
      );

      setOffset({ x: newOffsetX, y: newOffsetY });
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
