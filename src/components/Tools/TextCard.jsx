import React, { useState } from 'react';

const TextCard = ({ x, y, width, height }) => {
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
  
    return (
      <div
        style={{
          position: "absolute",
          top: y,
          left: x,
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "25px",
          padding: "12px",
          boxSizing: "border-box",
          cursor: "text",
        }}
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setIsEditing(false)}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              backgroundColor: "transparent",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          />
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
        )}
      </div>
    );
};

export default TextCard;