export const getArrowStyles = (
  startX,
  startY,
  endX,
  endY,
  scale,
  offset,
  properties,
  isSelected,
  pointerEvents,
  zIndex,
) => ({
  position: "absolute",
  top: startY * scale + offset.y,
  left: startX * scale + offset.x,
  width: `${
    Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) * scale
  }px`,
  height: "2px",
  color: isSelected ? "blue" : properties.lineColor,
  borderStyle: properties.lineStyle,
  borderWidth: properties.lineWidth,
  transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
  transformOrigin: "0 0",
  pointerEvents,
  zIndex,
  cursor: "pointer",
});
