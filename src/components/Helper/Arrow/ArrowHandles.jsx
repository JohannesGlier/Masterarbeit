import ArrowHandle from "@/components/Helper/Arrow/ArrowHandle";

const ArrowHandles = ({
  start,
  end,
  scale,
  offset,
  lineWidth,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  children,
}) => (
  <>
    {["start", "end"].map((type) => {
      const point = { start, end }[type];

      return (
        <ArrowHandle
          key={type}
          top={point.y * scale + offset.y + lineWidth}
          left={point.x * scale + offset.x}
          size={(20) + lineWidth}
          cursor={"pointer"}
          onMouseDown={(e) => onDragStart(type, e)}
          onMouseUp={onDragEnd}
          onDoubleClick={(e) => onDoubleClick(type, e)}
        />
      );
    })}
    {children}
  </>
);

export default ArrowHandles;
