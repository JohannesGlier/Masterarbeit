import { useCallback, useRef, useEffect } from "react";

const useResize = (
  initialSize,
  initialPosition,
  scaleRef,
  offsetRef,
  onResize
) => {
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const lastUpdate = useRef(Date.now());
  const animationFrame = useRef();

  const calculateNewDimensions = useCallback(
    (clientX, clientY) => {
      const mouseCanvasX = (clientX - offsetRef.current.x) / scaleRef.current;
      const mouseCanvasY = (clientY - offsetRef.current.y) / scaleRef.current;

      const newSize = { ...initialSize };
      const newPosition = { ...initialPosition };

      switch (resizeHandle.current) {
        case "top-left":
          newSize.width = initialPosition.x + initialSize.width - mouseCanvasX;
          newSize.height =
            initialPosition.y + initialSize.height - mouseCanvasY;
          newPosition.x = mouseCanvasX;
          newPosition.y = mouseCanvasY;
          break;

        case "top-right":
          newSize.width = mouseCanvasX - initialPosition.x;
          newSize.height =
            initialPosition.y + initialSize.height - mouseCanvasY;
          newPosition.y = mouseCanvasY;
          break;

        case "bottom-left":
          newSize.width = initialPosition.x + initialSize.width - mouseCanvasX;
          newSize.height = mouseCanvasY - initialPosition.y;
          newPosition.x = mouseCanvasX;
          break;

        case "bottom-right":
          newSize.width = mouseCanvasX - initialPosition.x;
          newSize.height = mouseCanvasY - initialPosition.y;
          break;

        default:
          break;
      }

      newSize.width = Math.max(newSize.width, 0);
      newSize.height = Math.max(newSize.height, 0);

      return { newSize, newPosition };
    },
    [initialSize, initialPosition, scaleRef, offsetRef]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing.current || Date.now() - lastUpdate.current < 16) return;

      animationFrame.current = requestAnimationFrame(() => {
        const { newSize, newPosition } = calculateNewDimensions(
          e.clientX,
          e.clientY
        );
        onResize(newSize, newPosition);
        lastUpdate.current = Date.now();
      });
    },
    [calculateNewDimensions, onResize]
  );

  const handleMouseUp = useCallback((e) => {
    if (e.button !== 0) return;

    isResizing.current = false;
    resizeHandle.current = null;
    document.body.style.userSelect = "";
    document.body.style.pointerEvents = "";
  }, []);

  const startResizing = useCallback((e, handle) => {
      isResizing.current = true;
      resizeHandle.current = handle;

      document.body.style.userSelect = "none";
      document.body.style.pointerEvents = "none";
    },
    []
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    startResizing,
    isResizing: isResizing.current,
  };
};

export default useResize;
