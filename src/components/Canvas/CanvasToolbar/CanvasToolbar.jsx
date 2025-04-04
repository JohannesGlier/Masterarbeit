import React from 'react';
import styles from "./CanvasToolbar.module.css";
import { useCanvas } from '@/components/Canvas/CanvasContext';

import { BiSolidPointer } from "react-icons/bi";
import { CgArrowLongUp } from "react-icons/cg";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { FiScissors } from "react-icons/fi";
import { LuSquareMousePointer } from "react-icons/lu";

const CanvasToolbar = () => {
    const { selectedTool, setSelectedTool } = useCanvas();
  
    return (
      <div className={styles['canvasToolbar']}>
        <button
          className={`${styles['button']} ${selectedTool === 'Pointer' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Pointer')}
        >
          <BiSolidPointer />
        </button>
        <button
          className={`${styles['button']} ${selectedTool === 'TextCard' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('TextCard')}
        >
          <RiTextBlock />
        </button>
        <button
          className={`${styles['button']} ${selectedTool === 'Frame' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Frame')}
        >
          <MdOutlineRectangle />
        </button>
        <button
          className={`${styles['button']} ${selectedTool === 'Arrow' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Arrow')}
        >
          <CgArrowLongUp style={{ transform: 'rotate(45deg)' }} />
        </button>
        <button
          className={`${styles['button']} ${selectedTool === 'Scissor' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Scissor')}
        >
          <FiScissors />
        </button>
        <button
          className={`${styles['button']} ${selectedTool === 'AITextcard' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('AITextcard')}
        >
          <LuSquareMousePointer />
        </button>
      </div>
    );
};
  
export default CanvasToolbar;
