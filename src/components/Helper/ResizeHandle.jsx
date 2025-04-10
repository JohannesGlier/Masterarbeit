import React from "react";

const ResizeHandle = ({ position, cursor, onMouseDown, color, title }) => {
  const baseStyles = {
    position: "absolute",
    width: "15px",
    height: "15px",
    backgroundColor: color,
    border: "2px solid rgb(88, 88, 88)",
    borderRadius: "50%",
    cursor: cursor,
    zIndex: 4002,
  };

  const positionStyles = {
    "top-left": { top: "-8px", left: "-8px" },
    "top-right": { top: "-8px", right: "-8px" },
    "bottom-left": { bottom: "-8px", left: "-8px" },
    "bottom-right": { bottom: "-8px", right: "-8px" },
    "top": { 
      top: "-40px", 
      left: "50%", 
      transform: "translateX(-50%)" 
    },
    "bottom": { 
      bottom: "-40px", 
      left: "50%", 
      transform: "translateX(-50%)" 
    },
    "left": { 
      left: "-40px", 
      top: "50%", 
      transform: "translateY(-50%)" 
    },
    "right": { 
      right: "-40px", 
      top: "50%", 
      transform: "translateY(-50%)" 
    },
  };

  return <div style={{ ...baseStyles, ...positionStyles[position] }} onMouseDown={onMouseDown} title={title} />;
};

export default ResizeHandle;