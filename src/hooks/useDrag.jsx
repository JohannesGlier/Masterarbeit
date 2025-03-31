import { useCallback, useRef, useEffect } from "react";

const useDrag = (initialPosition, scaleRef, onUpdate, setIsDraggingState, onDragEnd) => {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(Date.now());
  const animationFrame = useRef();

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging.current || Date.now() - lastUpdate.current < 16) return;

      animationFrame.current = requestAnimationFrame(() => {
        const newX = (e.clientX - startPos.current.x) / scaleRef.current;
        const newY = (e.clientY - startPos.current.y) / scaleRef.current;

        onUpdate({ x: newX, y: newY });
        lastUpdate.current = Date.now();
      });
    },
    [scaleRef, onUpdate]
  );

  const handleMouseUp = useCallback((e) => {
    if (e.button !== 0|| !isDragging.current) return;
    setIsDraggingState(false);
    isDragging.current = false;
    document.body.style.userSelect = "";
    document.body.style.pointerEvents = "";

    if (onDragEnd) {
      onDragEnd();
    }
  }, [onDragEnd]);

  const startDragging = useCallback((e) => {
      e.preventDefault();
      isDragging.current = true;
      setIsDraggingState(true);

      startPos.current = {
        x: e.clientX - initialPosition.x * scaleRef.current,
        y: e.clientY - initialPosition.y * scaleRef.current,
      };

      document.body.style.userSelect = "none";
      document.body.style.pointerEvents = "none";
    },
    [initialPosition, scaleRef]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { startDragging };
};

export default useDrag;
