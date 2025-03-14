import ArrowHandle from "@/components/Helper/ArrowHandle";

const ArrowHandles = ({
  start,
  middle,
  end,
  scale,
  offset,
  lineWidth,
  onDragStart,
  onDragEnd,
  children,
}) => (
  <>
    {["start", "middle", "end"].map((type) => {
      const point = { start, middle, end }[type];
      const isMiddle = type === "middle";

      return (
        <ArrowHandle
          key={type}
          top={point.y * scale + offset.y + lineWidth}
          left={point.x * scale + offset.x}
          size={(isMiddle ? 15 : 20) + lineWidth}
          cursor={isMiddle ? "default" : "pointer"}
          onMouseDown={!isMiddle ? (e) => onDragStart(type, e) : undefined}
          onMouseUp={!isMiddle ? onDragEnd : undefined}
        />
      );
    })}
    {children}
  </>
);

export default ArrowHandles;
