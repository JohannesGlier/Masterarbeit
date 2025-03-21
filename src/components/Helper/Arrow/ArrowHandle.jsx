import React from "react";

const ArrowHandle = ({
  top,
  left,
  size = 20,
  cursor = "pointer",
  onMouseDown,
  onMouseUp,
  onDoubleClick,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: top - size / 2,
        left: left - size / 2,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: "rgb(252, 252, 252)",
        border: "2px solid rgb(88, 88, 88)",
        borderRadius: "50%",
        cursor: cursor,
        zIndex: 4002,
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
    />
  );
};

export default ArrowHandle;