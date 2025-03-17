import React from "react";

const ArrowHead = ({ x, y, angle, size = 10, color = "#000000", zIndex }) => {
  return (
    <svg
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        transform: `rotate(${angle}rad)`,
        pointerEvents: "none",
        zIndex,
      }}
      width={size}
      height={size}
      viewBox="0 0 10 10"
    >
      <path
        d="M0,0 L10,5 L0,10 Z"
        fill={color}
        stroke="none"
      />
    </svg>
  );
};

export default ArrowHead;