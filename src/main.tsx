import React, { useRef } from "react";
import ReactDOM from "react-dom";
import { COMPONENT_POSITIONS, ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";

export { ReactInfiniteCanvas } from "./App";
export type {
  ReactInfiniteCanvasProps,
  ReactInfiniteCanvasHandle,
} from "./App";
export {
  COMPONENT_POSITIONS,
  SCROLL_NODE_POSITIONS,
} from "./helpers/constants";
export { Background } from "./components/Background/background";
export type { BackgroundProps } from "./components/Background/background";
export { EventBlocker } from "./components/EventBlocker/event.blocker";
export type { EventBlockerProps } from "./components/EventBlocker/event.blocker";

const InfiniteCanvas = () => {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>();
  return (
    <>
      <div style={{ width: "100vw", height: "100vw" }}>
        <ReactInfiniteCanvas
          ref={canvasRef}
          onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
            mountFunc.fitContentToView({ scale: 1 });
          }}
          customComponents={[
            {
              component: (
                <button
                  onClick={() => {
                    canvasRef.current?.fitContentToView({ scale: 1 });
                  }}
                >
                  fitToView
                </button>
              ),
              position: COMPONENT_POSITIONS.TOP_LEFT,
              offset: { x: 120, y: 10 },
            },
          ]}
        >
          <div style={{ 
            width: "200px", 
            height: "200px", 
            background: "red",
            position: "absolute",
            top: "120px",  
            left: "520px", 
            }}>
            asdasdsdas
          </div>
          <div style={{ 
            width: "200px", 
            height: "200px", 
            background: "red",
            position: "absolute",
            top: "1200px",  
            left: "100px", 
            }}>
            asdasdsdas
          </div>
        </ReactInfiniteCanvas>
      </div>
    </>
  );
};

ReactDOM.render(<InfiniteCanvas />, document.getElementById("root"));