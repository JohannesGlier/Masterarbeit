import React from 'react';
import styles from "@/components/Tools/PreviewTools/ArrowTool.module.css";

const PreviewTextcard = ({
  finalTop,
  finalLeft,
  scaledWidth,
  scaledHeight,
  isLoading,
  previewTextContent,
  onDoubleClick,
}) => {
  const containerStyle = {
    position: "absolute",
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    color: "black",
    backgroundColor: "#F8F9FA",
    borderRadius: "25px",
    boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
    padding: "12px",
    boxSizing: "border-box",
    border: "0px solid #ccc",
    zIndex: 5000,
    pointerEvents: typeof onDoubleClick === 'function' ? "auto" : "none",
    fontSize: "auto",
    textAlign: "center",
    alignContent: "center",
    overflow: "hidden",
    cursor: typeof onDoubleClick === 'function' ? "pointer" : "default",
  };

  return (
    <div
      style={containerStyle}
      className={isLoading ? styles.loadingPulseDiv : ""}
      onDoubleClick={typeof onDoubleClick === 'function' ? onDoubleClick : undefined}
    >
      {isLoading ? (
        <div className={styles.loadingDotsContainer}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      ) : (
        previewTextContent
      )}
    </div>
  );
};

export default PreviewTextcard;