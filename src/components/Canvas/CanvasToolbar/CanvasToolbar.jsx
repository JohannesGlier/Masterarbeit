import React from 'react';
import styles from "./CanvasToolbar.module.css";
import { useCanvas } from '@/components/Canvas/CanvasContext';

import { BiSolidPointer } from "react-icons/bi";
import { CgArrowLongUp } from "react-icons/cg";
import { MdOutlineRectangle } from "react-icons/md";
import { RiTextBlock } from "react-icons/ri";
import { FiScissors } from "react-icons/fi";
import { LuSquareMousePointer } from "react-icons/lu";
import { LuLayoutDashboard } from "react-icons/lu";

const CanvasToolbar = () => {
    const { selectedTool, setSelectedTool } = useCanvas();
  
    return (
      <div className={styles['canvasToolbar']}>
        <button
          title="Pointer-Tool zum Auswählen, Verschieben und Anpassen von Elementen"
          className={`${styles['button']} ${selectedTool === 'Pointer' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Pointer')}
        >
          <BiSolidPointer />
        </button>
        <button
          title="Textkarten-Tool zum Erstellen von Textkarten"
          className={`${styles['button']} ${selectedTool === 'TextCard' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('TextCard')}
        >
          <RiTextBlock />
        </button>
        <button
          title="Bereich-Tool zum Erstellen von Bereichen"
          className={`${styles['button']} ${selectedTool === 'Frame' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Frame')}
        >
          <MdOutlineRectangle />
        </button>
        <button
          title="Verbindungs-Tool zum Erstellen von Verbindungen"
          className={`${styles['button']} ${selectedTool === 'Arrow' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Arrow')}
        >
          <CgArrowLongUp style={{ transform: 'rotate(45deg)' }} />
        </button>
        <button
          title="Schere-Tool zum automatischen Aufteilen von Textkarten"
          className={`${styles['button']} ${selectedTool === 'Scissor' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('Scissor')}
        >
          <FiScissors />
        </button>
        <button
          title="Intelligentes Textkarten-Erstellungs-Tool zum Erstellen von Textkarten mit automatisch generiertem Inhalt"
          className={`${styles['button']} ${selectedTool === 'AITextcard' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('AITextcard')}
        >
          <LuSquareMousePointer />
        </button>
        <button
          title="Auto-Layout-Tool zum automatischen Anordnen von Elementen auf dem Canvas"
          className={`${styles['button']} ${selectedTool === 'AutoLayout' ? styles.selectedButton : ''}`} 
          onClick={() => setSelectedTool('AutoLayout')}
        >
          <LuLayoutDashboard />
        </button>
      </div>
    );
};
  
export default CanvasToolbar;
