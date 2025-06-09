export const getTextcardStyles = (
  position,
  size,
  scale,
  offset,
  properties,
  isSelected,
  isHovered,
  isMouseDown,
  isEditing,
  pointerEvents,
  zIndex,
  isDragging,
  currentOverTextcard,
  isAiGenerated,
  cardColor
) => ({
  position: "absolute",
  top: position.y * scale + offset.y,
  left: position.x * scale + offset.x,
  width: `${size.width * scale}px`,
  height: `${size.height * scale}px`,
  backgroundColor: cardColor
    ? cardColor // 1. Priorität: Die übergebene Farbe, falls vorhanden
    : isAiGenerated
    ? "#C9CCE3" // 2. Priorität: Die Farbe für KI-Karten
    : properties.textcardColor,
  border:
    isSelected || isHovered || isMouseDown
      ? `${properties.borderWidth <= 2 ? 3 : properties.borderWidth}px solid rgb(23, 104, 255)`
      : `${properties.borderWidth}px solid ${properties.textcardBorderColor}`,
  borderRadius: "25px",
  boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
  padding: "12px",
  boxSizing: "border-box",
  //cursor: isEditing ? "text" : "grab",
  zIndex: currentOverTextcard ? 4000 : zIndex,
  pointerEvents,
  opacity: currentOverTextcard ? 0.7 : 1,
});
