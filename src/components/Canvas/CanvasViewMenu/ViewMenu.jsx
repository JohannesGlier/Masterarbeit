import React from "react";
import { LuLayoutDashboard } from "react-icons/lu";
import { LuLayoutGrid } from "react-icons/lu";
import { useCanvas } from '@/components/Canvas/CanvasContext';
import styles from "@/components/Canvas/CanvasToolbar/CanvasToolbar.module.css";

const ViewMenu = () => {
  const { activeView, setActiveView } = useCanvas();

  return (
    <div className={styles.canvasViewMenu}>
      <button
        title="Standard View"
        className={`${styles.button} ${activeView === 'StandardView' ? styles.selectedButton : ''}`}
        onClick={() => setActiveView('StandardView')}
      >
        <LuLayoutGrid
          size={40}
        />
      </button>
      <button
        title="Layout View"
        className={`${styles.button} ${activeView === 'LayoutView' ? styles.selectedButton : ''}`}
        onClick={() => setActiveView('LayoutView')}
      >
        <LuLayoutDashboard
          size={40}
        />
      </button>
    </div>
  );
};

export default ViewMenu;
