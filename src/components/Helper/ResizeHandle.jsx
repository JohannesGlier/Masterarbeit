import React from "react";

const ResizeHandle = ({ position, cursor, onMouseDown }) => {
  const styles = {
    position: "absolute",
    width: "15px",
    height: "15px",
    backgroundColor: "rgb(252, 252, 252)",
    border: "2px solid rgb(88, 88, 88)",
    borderRadius: "50%",
    cursor: cursor,
    ...(position === "top-left" && { top: "-8px", left: "-8px" }),
    ...(position === "top-right" && { top: "-8px", right: "-8px" }),
    ...(position === "bottom-left" && { bottom: "-8px", left: "-8px" }),
    ...(position === "bottom-right" && { bottom: "-8px", right: "-8px" }),
  };

  return <div style={styles} onMouseDown={onMouseDown} />;
};

export default ResizeHandle;