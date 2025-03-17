import ArrowHead from "@/components/Helper/Arrow/ArrowHead";

const ArrowHeads = ({
  start,
  end,
  startX,
  startY,
  endX,
  endY,
  scale,
  offset,
  lineAngle,
  color,
  zIndex,
}) => (
  <>
    {start && (
      <ArrowHead
        x={startX * scale + offset.x}
        y={startY * scale + offset.y}
        angle={lineAngle + Math.PI}
        size={10 * scale}
        color={color}
        zIndex={zIndex}
      />
    )}
    {end && (
      <ArrowHead
        x={endX * scale + offset.x}
        y={endY * scale + offset.y}
        angle={lineAngle}
        size={10 * scale}
        color={color}
        zIndex={zIndex}
      />
    )}
  </>
);

export default ArrowHeads;