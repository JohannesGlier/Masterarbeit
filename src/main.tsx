import { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { COMPONENT_POSITIONS, ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import CanvasButton from "./components/Homescreen/CanvasButton";
import "./styles/HomeScreen.css";
import CanvasToolbar from "./components/CanvasToolbar/CanvasToolbar";
import CanvasContent from "./components/CanvasContent/CanvasContent";
import CanvasMenu from "./components/CanvasMenu/CanvasMenu";

const HomeScreen = ({ onSelectCanvas }: { onSelectCanvas: (index: number) => void }) => {
  const buttons = ["Demo 1", "Demo 2", "Demo 3", "Demo 4", "Demo 5", "Demo 6", "Demo 7", "Demo 8"];
  return (
    <div className="home-container">
      <h1>Wähle eine Demo</h1>
      <div className="button-grid">
        {buttons.map((btn, index) => (
          <CanvasButton key={index} label={btn} onClick={() => onSelectCanvas(index)} />
        ))}
      </div>
    </div>
  );
};

const InfiniteCanvas = ({ onBack }: { onBack: () => void }) => {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>();
  return (
    <div style={{ width: "100vw", height: "100vh" }}>   
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc) => mountFunc.fitContentToView({ scale: 1 })}
        customComponents={[
          {
            component: (
              <div>
                <CanvasToolbar />  
                <CanvasMenu onBack={onBack} />        
              </div>
            ),
            position: COMPONENT_POSITIONS.TOP_LEFT,
            offset: { x: 5, y: 0 },
          },
        ]}
      >
        <CanvasContent />
      </ReactInfiniteCanvas>
    </div>
  );
};

const App = () => {
  const [showCanvas, setShowCanvas] = useState(false);
  return showCanvas ? <InfiniteCanvas onBack={() => setShowCanvas(false)} /> : <HomeScreen onSelectCanvas={() => setShowCanvas(true)} />;
};

ReactDOM.render(<App />, document.getElementById("root"));