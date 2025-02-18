import React from 'react';
import styles from './CanvasMenu.module.css';

import { TiHome } from "react-icons/ti";

interface CanvasMenuProps {
  onBack: () => void;
}

const CanvasMenu: React.FC<CanvasMenuProps> = ({ onBack }) => {
  return (
    <div className={styles.canvasToolbar}>
      <button className={styles.demo}>
        Demo 1
      </button>
      <button onClick={onBack} className={styles.button}>
        <TiHome />
      </button>
    </div>
  );
};

export default CanvasMenu;