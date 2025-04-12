import React from 'react';
import styles from "@/components/Tools/PreviewTools/ArrowTool.module.css";

const PreviewTextcard = ({
  finalTop,
  finalLeft,
  scaledWidth,
  scaledHeight,
  isLoading,
  previewTextContent,
}) => {
  const containerStyle = {
    position: "absolute",
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    color: "black",
    backgroundColor: "rgba(230, 230, 230, 0.4)",
    borderRadius: "25px",
    boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
    padding: "12px",
    boxSizing: "border-box",
    border: "0px solid #ccc",
    zIndex: 5000,
    pointerEvents: "none",
    fontSize: "auto",
    textAlign: "center",
    alignContent: "center",
    overflow: "hidden",
  };

  return (
    <div
      style={containerStyle}
      className={isLoading ? styles.loadingPulseDiv : ""}
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