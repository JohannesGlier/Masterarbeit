export const getCanvasMousePosition = (event, canvasRef, offsetRef, scaleRef) => {
  const rect = canvasRef.current.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - offsetRef.current.x) / scaleRef.current,
    y: (event.clientY - rect.top - offsetRef.current.y) / scaleRef.current,
  };
};
