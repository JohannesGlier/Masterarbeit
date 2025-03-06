import React, { useState } from "react";
import { Slider, Dropdown, Button } from "antd";
import {
  BiArrowFromLeft,
  BiArrowFromRight,
  BiLineChart,
  BiDotsHorizontalRounded,
  BiFontSize,
  BiFontColor,
  BiAlignLeft,
  BiCircle,
} from "react-icons/bi";
import { ChromePicker } from "react-color";

const ArrowActionBar = ({ arrow, updateArrowStyle }) => {
  const [lineStyle, setLineStyle] = useState(arrow.lineStyle || "solid");
  const [arrowHeadStart, setArrowHeadStart] = useState(arrow.arrowHeadStart || false);
  const [arrowHeadEnd, setArrowHeadEnd] = useState(arrow.arrowHeadEnd || true);
  const [lineColor, setLineColor] = useState(arrow.lineColor || "#000000");
  const [lineWidth, setLineWidth] = useState(arrow.lineWidth || 2);
  const [textSize, setTextSize] = useState(arrow.textSize || 14);
  const [textColor, setTextColor] = useState(arrow.textColor || "#000000");
  const [textAlignment, setTextAlignment] = useState(arrow.textAlignment || "horizontal");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  const handleLineStyleChange = (style) => {
    setLineStyle(style);
    updateArrowStyle(arrow.id, { lineStyle: style });
  };

  const handleArrowHeadStartChange = (hasHead) => {
    setArrowHeadStart(hasHead);
    updateArrowStyle(arrow.id, { arrowHeadStart: hasHead });
  };

  const handleArrowHeadEndChange = (hasHead) => {
    setArrowHeadEnd(hasHead);
    updateArrowStyle(arrow.id, { arrowHeadEnd: hasHead });
  };

  const handleLineColorChange = (color) => {
    setLineColor(color.hex);
    updateArrowStyle(arrow.id, { lineColor: color.hex });
  };

  const handleLineWidthChange = (width) => {
    setLineWidth(width);
    updateArrowStyle(arrow.id, { lineWidth: width });
  };

  const handleTextSizeChange = (size) => {
    setTextSize(size);
    updateArrowStyle(arrow.id, { textSize: size });
  };

  const handleTextColorChange = (color) => {
    setTextColor(color.hex);
    updateArrowStyle(arrow.id, { textColor: color.hex });
  };

  const handleTextAlignmentChange = (alignment) => {
    setTextAlignment(alignment);
    updateArrowStyle(arrow.id, { textAlignment: alignment });
  };

  const increaseTextSize = () => {
    const newSize = Math.min(textSize + 1, 30); // Maximal 30
    handleTextSizeChange(newSize);
  };

  const decreaseTextSize = () => {
    const newSize = Math.max(textSize - 1, 10); // Minimal 10
    handleTextSizeChange(newSize);
  };

  const lineStyleIcons = {
    solid: <BiLineChart />,
    dashed: <BiDotsHorizontalRounded />,
    dotted: <BiCircle />,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: arrow.middleY - 225, // Position über dem Pfeil
        left: arrow.middleX,
        transform: "translateX(-50%)",
        display: "flex",
        gap: "32px", // Größerer Abstand zwischen den Aktionen
        backgroundColor: "#fff",
        padding: "16px", // Größeres Padding
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: 10,
      }}
    >
      {/* Pfeilspitze links */}
      <div style={{ display: "flex", alignItems: "center"}}>
        <Button
          icon={<BiArrowFromRight />}
          type={arrowHeadStart ? "primary" : "default"}
          onClick={() => handleArrowHeadStartChange(!arrowHeadStart)}
          style={{ width: "60px", height: "60px", fontSize: "40px", border: "none" }} // Größere Buttons
        />
      </div>

      {/* Pfeilspitze rechts */}
      <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "32px" }}>
        <Button
          icon={<BiArrowFromLeft />}
          type={arrowHeadEnd ? "primary" : "default"}
          onClick={() => handleArrowHeadEndChange(!arrowHeadEnd)}
          style={{ width: "60px", height: "60px", fontSize: "40px", border: "none" }} // Größere Buttons
        />
      </div>

      {/* Linienart */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown
          menu={{
            items: [
              { key: "solid", label: "Durchgezogen", icon: <BiLineChart /> },
              { key: "dashed", label: "Gestrichelt", icon: <BiDotsHorizontalRounded /> },
              { key: "dotted", label: "Gepunktet", icon: <BiCircle /> },
            ],
            onClick: (e) => handleLineStyleChange(e.key),
          }}
        >
          <Button icon={lineStyleIcons[lineStyle]} style={{ width: "60px", height: "60px", fontSize: "40px", border: "none" }} />
        </Dropdown>
      </div>

      {/* Pfeilfarbe */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            backgroundColor: lineColor,
            cursor: "pointer",
            border: "2px solid #e0e0e0",
          }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {showColorPicker && (
          <div style={{ position: "absolute", zIndex: 20, top: "75px" }}>
            <ChromePicker
              color={lineColor}
              onChange={handleLineColorChange}
              disableAlpha={false}
            />
          </div>
        )}
      </div>

      {/* Pfeildicke */}
      <div style={{ display: "flex", flexDirection: "column", alignSelf: "end", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "32px" }}>
        <span style={{ marginBottom: "2px", fontSize: "20px" }}>Line Thickness</span>
        <Slider
          min={1}
          max={10}
          value={lineWidth}
          onChange={handleLineWidthChange}
          style={{ width: "100%" }}
        />
      </div>

      {/* Textausrichtung */}
      <div style={{ display: "flex", alignItems: "center", paddingRight: "16px" }}>
        <Button
            icon={<BiAlignLeft />}
            type={textAlignment === "horizontal" ? "primary" : "default"}
            onClick={() => handleTextAlignmentChange(textAlignment === "horizontal" ? "aligned" : "horizontal")}
            style={{ width: "50px", height: "50px", fontSize: "40px", border: "none" }}
        />
      </div>

      {/* Textfarbe */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            backgroundColor: textColor,
            cursor: "pointer",
            border: "2px solid #e0e0e0",
          }}
          onClick={() => setShowTextColorPicker(!showTextColorPicker)}
        />
        {showTextColorPicker && (
          <div style={{ position: "absolute", zIndex: 20, top: "75px" }}>
            <ChromePicker
              color={textColor}
              onChange={handleTextColorChange}
              disableAlpha={false} // Transparenz aktivieren
            />
          </div>
        )}
      </div>

      {/* Schriftgröße */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown
          menu={{
            items: [10, 12, 14, 16, 18, 20, 24, 30].map((size) => ({
              key: size,
              label: `${size}px`,
              onClick: () => handleTextSizeChange(size),
            })),
          }}
        >
          <Button style={{ fontSize: "28px", padding: "8px 12px", bottom: "2px", border: "none" }}>{textSize}</Button>
        </Dropdown>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Button
            icon={<BiArrowFromRight style={{ transform: "rotate(90deg)" }} />}
            onClick={increaseTextSize}
            style={{ fontSize: "24px", border: "none" }}
          />
          <Button
            icon={<BiArrowFromRight style={{ transform: "rotate(-90deg)" }} />}
            onClick={decreaseTextSize}
            style={{ fontSize: "24px", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ArrowActionBar;