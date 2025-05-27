import React, { useState, useRef, useEffect } from "react";
import styles from "./CanvasToolbar.module.css";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import CanvasPromptArrowToolbar from "@/components/Canvas/CanvasToolbar/CanvasPromptArrowToolbar";

import { BiSolidPointer } from "react-icons/bi";
import { CgArrowLongUp } from "react-icons/cg";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { FiScissors } from "react-icons/fi";

const CanvasToolbar = () => {
  const { selectedTool, setSelectedTool } = useCanvas();
  const arrowButtonRef = useRef(null);
  const [arrowButtonTopPosition, setArrowButtonTopPosition] = useState(0);

  useEffect(() => {
    if (arrowButtonRef.current) {
      setArrowButtonTopPosition(arrowButtonRef.current.offsetTop);
    }
  }, []);

  return (
    <div className={styles["canvasToolbar"]}>
      <button
        title="Pointer tool for selecting, moving, and resizing elements"
        className={`${styles["button"]} ${
          selectedTool === "Pointer" ? styles.selectedButton : ""
        }`}
        onClick={() => setSelectedTool("Pointer")}
      >
        <BiSolidPointer />
      </button>
      <button
        title="Text card tool for creating text cards"
        className={`${styles["button"]} ${
          selectedTool === "TextCard" ? styles.selectedButton : ""
        }`}
        onClick={() => setSelectedTool("TextCard")}
      >
        <RiTextBlock size={40} />
      </button>
      <button
        title="Region tool for creating regions"
        className={`${styles["button"]} ${
          selectedTool === "Frame" ? styles.selectedButton : ""
        }`}
        onClick={() => setSelectedTool("Frame")}
      >
        <MdOutlineRectangle size={40} />
      </button>
      <button
        ref={arrowButtonRef}
        title="Connection tool for creating connections"
        className={`${styles["button"]} ${selectedTool === "Arrow" ? styles.selectedButton : "" }`}
        onClick={() => setSelectedTool("Arrow")}
      >
        <CgArrowLongUp style={{ transform: "rotate(45deg)" }} size={40} />
      </button>
      <button
        title="Scissors tool for automatically splitting text cards"
        className={`${styles["button"]} ${
          selectedTool === "Scissor" ? styles.selectedButton : ""
        }`}
        onClick={() => setSelectedTool("Scissor")}
      >
        <FiScissors size={40} />
      </button>

      {/* Konditionales Rendern des Untermenüs */}
      {selectedTool === "Arrow" && arrowButtonRef.current && (
        <CanvasPromptArrowToolbar
          style={{
            position: "absolute", // Positioniert relativ zu .canvasToolbar
            left: "100%",         // Beginnt am rechten Rand von .canvasToolbar
            top: `${arrowButtonTopPosition}px`, // Auf Höhe des Arrow-Buttons
            marginLeft: "8px",      // Kleiner horizontaler Abstand
            zIndex: styles.canvasToolbar ? parseInt(getComputedStyle(arrowButtonRef.current.closest(`.${styles.canvasToolbar}`)).zIndex || '4001', 10) + 1 : 4002
          }}
        />
      )}
    </div>
  );
};

export default CanvasToolbar;
