import styles from "./HomeScreenButton.module.css";

const CanvasButton = ({ label, onClick }) => {
  return (
    <button className={styles['canvas-button']} onClick={onClick}>
      {label}
    </button>
  );
};

export default CanvasButton;