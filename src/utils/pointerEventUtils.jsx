export const getPointerEvents = ({
  selectedTool,
  isDrawing,
  selectedElements,
  isArrowDragging = false,
  elementId,
}) => {
  if (selectedTool !== "Pointer" || isDrawing) return "none";

  const hasActiveElements = selectedElements.some(
    (el) => el.isResizing || el.isDragging
  );

  if (hasActiveElements || isArrowDragging) {
    return selectedElements.some(
      (el) => el.id === elementId && (el.isResizing || el.isDragging)
    )
      ? isArrowDragging ? "auto" : "none"
      : "none";
  }

  return "auto";
};
