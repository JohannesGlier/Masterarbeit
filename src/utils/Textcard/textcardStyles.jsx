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
) => ({
  position: "absolute",
  top: position.y * scale + offset.y,
  left: position.x * scale + offset.x,
  width: `${size.width * scale}px`,
  height: `${size.height * scale}px`,
  backgroundColor: properties.textcardColor,
  border:
    isSelected || isHovered || isMouseDown
      ? "3px solid rgb(23, 104, 255)"
      : `${properties.borderWidth}px solid ${properties.textcardBorderColor}`,
  borderRadius: "25px",
  boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
  padding: "12px",
  boxSizing: "border-box",
  cursor: isEditing ? "text" : "grab",
  zIndex,
  pointerEvents,
});
