import React from 'react';
import styles from "./CanvasToolbar.module.css";
import { useCanvas } from '@/components/Canvas/CanvasContext';

import { BiSolidPointer } from "react-icons/bi";
import { CgArrowLongUp } from "react-icons/cg";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { FiScissors } from "react-icons/fi";

const CanvasToolbar = () => {
    const { selectedTool, setSelectedTool } = useCanvas();
  
    return (
      <div className={styles['canvasToolbar']}>
        <button
          title="Pointer tool for selecting, moving, and resizing elements"
          className={`${styles['button']} ${selectedTool === 'Pointer' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Pointer')}
        >
          <BiSolidPointer />
        </button>
        <button
          title="Text card tool for creating text cards"
          className={`${styles['button']} ${selectedTool === 'TextCard' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('TextCard')}
        >
          <RiTextBlock size={40}/>
        </button>
        <button
          title="Region tool for creating regions"
          className={`${styles['button']} ${selectedTool === 'Frame' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Frame')}
        >
          <MdOutlineRectangle size={40}/>
        </button>
        <button
          title="Connection tool for creating connections"
          className={`${styles['button']} ${selectedTool === 'Arrow' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Arrow')}
        >
          <CgArrowLongUp style={{ transform: 'rotate(45deg)' }} size={40}/>
        </button>
        <button
          title="Scissors tool for automatically splitting text cards"
          className={`${styles['button']} ${selectedTool === 'Scissor' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Scissor')}
        >
          <FiScissors size={40}/>
        </button>
      </div>
    );
};
  
export default CanvasToolbar;
