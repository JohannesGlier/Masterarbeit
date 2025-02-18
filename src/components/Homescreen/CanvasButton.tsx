import "./CanvasButton.module.css";

const CanvasButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  return (
    <button className="canvas-button" onClick={onClick}>
      {label}
    </button>
  );
};

export default CanvasButton;