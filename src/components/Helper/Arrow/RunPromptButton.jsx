import React from "react";
import { FaPlay } from "react-icons/fa";

const RunPromptButton = ({
  position,
  scale,
  offset,
  lineWidth,
  handleClick,
  pointerEvents,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: position.y * scale + offset.y + lineWidth,
        left: position.x * scale + offset.x,
        transform: `translate(-50%, -50%)`,
        width: "26px",
        height: "26px",
        backgroundColor: "rgb(255, 255, 255)",
        border: "1px solid rgb(88, 88, 88)",
        borderRadius: "50%",
        cursor: "pointer",
        zIndex: 4002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: pointerEvents,
      }}
      onClick={handleClick}
      title="Run Prompt"
    >
      <FaPlay
        style={{
          color: "rgb(0, 0, 0)",
          fontSize: "12px",
          marginLeft: "1px", // Leichter Versatz für optische Zentrierung
        }}
      />
    </div>
  );
};

export default RunPromptButton;
