import React from 'react';
import styles from './CanvasMenu.module.css';
import { TiHome } from "react-icons/ti";

const CanvasMenu = ({ onBack }) => {
  

  return (
    <div>
      <button className={styles['demo']}>
        Demo
      </button>
      <button onClick={onBack} className={styles['button']}>
        <TiHome />
      </button>
    </div>
  );
};

export default CanvasMenu;