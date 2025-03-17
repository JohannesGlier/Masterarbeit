export const getFrameStyles = (
  position,
  size,
  scale,
  offset,
  properties,
  isSelected,
  isHovered,
  isMouseDown,
  pointerEvents,
  zIndex,
) => ({
  position: "absolute",
  top: position.y * scale + offset.y,
  left: position.x * scale + offset.x,
  width: `${size.width * scale}px`,
  height: `${size.height * scale}px`,
  backgroundColor: properties.frameColor,
  border:
    isSelected || isHovered || isMouseDown
      ? `${properties.borderWidth <= 2 ? 3 : properties.borderWidth}px solid rgb(23, 104, 255)`
      : `${properties.borderWidth}px solid ${properties.frameBorderColor}`,
  cursor: "grab",
  zIndex,
  pointerEvents,
});
