import React, { useState } from 'react';
import styles from './CanvasToolbar.module.css';

import { BiSolidPointer } from "react-icons/bi";
import { CgArrowLongUp } from "react-icons/cg";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";

const CanvasToolbar: React.FC = () => {
    const [selectedButton, setSelectedButton] = useState<string>('');
  
    const handleButtonClick = (buttonId: string) => {
      setSelectedButton(buttonId);
    };
  
    return (
      <div className={styles.canvasToolbar}>
        <button
          className={`${styles.button} ${selectedButton === 'Pointer' ? styles.selectedButton : ''}`} 
          onClick={() => handleButtonClick('Pointer')}
        >
          <BiSolidPointer />
        </button>
        <button
          className={`${styles.button} ${selectedButton === 'Frame' ? styles.selectedButton : ''}`} 
          onClick={() => handleButtonClick('Frame')}
        >
          <RiTextBlock />
        </button>
        <button
          className={`${styles.button} ${selectedButton === 'TextCard' ? styles.selectedButton : ''}`} 
          onClick={() => handleButtonClick('TextCard')}
        >
          <MdOutlineRectangle />
        </button>
        <button
          className={`${styles.button} ${selectedButton === 'Arrow' ? styles.selectedButton : ''}`} 
          onClick={() => handleButtonClick('Arrow')}
        >
          <CgArrowLongUp style={{ transform: 'rotate(45deg)' }}/>
        </button>
      </div>
    );
  };
  
export default CanvasToolbar;