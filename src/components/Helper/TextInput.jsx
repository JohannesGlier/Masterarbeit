import React, { useState, useRef, useEffect } from "react";

const TextInput = ({ placeholder, value, onChange, maxWidth, minWidth, textAlign, fontSize, textColor, fontStyles, font }) => {
  const inputRef = useRef(null);
  const [width, setWidth] = useState("auto");

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
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: width,
        minWidth: minWidth,
        maxWidth: maxWidth,
        padding: "5px",
        border: "none",
        backgroundColor: "transparent",
        outline: "none",
        color: textColor,
        textAlign: textAlign,
        fontSize: fontSize,
        fontFamily: font,
        fontWeight: fontStyles.bold ? "bold" : "normal",
        fontStyle: fontStyles.italic ? "italic" : "normal",
        textDecoration: fontStyles.underline ? "underline" : "none",
      }}
    />
  );
};

export default TextInput;