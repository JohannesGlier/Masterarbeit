export const getPointerEvents = ({
  selectedTool,
  isDrawing,
  selectedElements,
  isArrowDragging,
  elementId,
}) => {
  if (selectedTool !== "Pointer") return "none";
  if (isDrawing) return "none";

  const hasActiveElements = selectedElements.some(
    (el) => el.isResizing || el.isDragging
  );

  if (hasActiveElements || isArrowDragging) {
    const isOurElementActive = selectedElements.some(
      (el) => el.id === elementId && (el.isResizing || el.isDragging)
    );
    return isOurElementActive ? "auto" : "none";
  }

  return "auto";
};
