import React from "react";

const ContextMenu = ({ top, left, buttons }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: top,
        left: left,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: 4003,
      }}
    >
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;