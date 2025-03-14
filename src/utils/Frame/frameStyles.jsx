export const getFrameStyles = (
  position,
  size,
  scale,
  offset,
  properties,
  isSelected,
  isHovered,
  isMouseDown,
  pointerEvents
) => ({
  position: "absolute",
  top: position.y * scale + offset.y,
  left: position.x * scale + offset.x,
  width: `${size.width * scale}px`,
  height: `${size.height * scale}px`,
  backgroundColor: properties.frameColor,
  border:
    isSelected || isHovered || isMouseDown
      ? "3px solid rgb(23, 104, 255)"
      : `${properties.borderWidth}px solid ${properties.frameBorderColor}`,
  cursor: "grab",
  zIndex: 5,
  pointerEvents,
});
