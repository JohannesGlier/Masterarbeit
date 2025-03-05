import React, { useState, useRef, useEffect } from "react";

const FrameHeadingInput = ({ placeholder, value, onChange, maxWidth }) => {
  const inputRef = useRef(null);
  const [width, setWidth] = useState("auto");
  const minWidth = 150;

  useEffect(() => {
    if (inputRef.current) {
      setWidth(`${inputRef.current.scrollWidth}px`);
      if(maxWidth < minWidth)
        maxWidth = minWidth;
    }
  }, [value, maxWidth]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: width,
        minWidth: minWidth,
        maxWidth: maxWidth,
        padding: "5px",
        fontSize: "18px",
        border: "none",
        backgroundColor: "transparent",
        outline: "none",
        color: "black",
      }}
    />
  );
};

export default FrameHeadingInput;