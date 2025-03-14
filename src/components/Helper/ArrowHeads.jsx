import ArrowHead from "@/components/Helper/ArrowHead";

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
}) => (
  <>
    {start && (
      <ArrowHead
        x={startX * scale + offset.x}
        y={startY * scale + offset.y}
        angle={lineAngle + Math.PI}
        size={10 * scale}
        color={color}
      />
    )}
    {end && (
      <ArrowHead
        x={endX * scale + offset.x}
        y={endY * scale + offset.y}
        angle={lineAngle}
        size={10 * scale}
        color={color}
      />
    )}
  </>
);

export default ArrowHeads;