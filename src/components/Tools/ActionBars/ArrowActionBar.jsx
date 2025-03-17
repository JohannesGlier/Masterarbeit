import React, { useState } from "react";
import { Slider, Dropdown, Button } from "antd";
import { IoIosArrowUp } from "react-icons/io";
import { BiSolidLeftArrow } from "react-icons/bi";
import { TbLineDotted } from "react-icons/tb";
import { TfiLineDashed } from "react-icons/tfi";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { MdOutlineTextRotationAngleup } from "react-icons/md";
import { MdOutlineTextRotationNone } from "react-icons/md";
import { ChromePicker } from "react-color";

const ArrowActionBar = ({ arrow, updateArrowStyle }) => {
  const [lineStyle, setLineStyle] = useState(arrow.lineStyle || "solid");
  const [arrowHeadStart, setArrowHeadStart] = useState(arrow.arrowHeadStart || false);
  const [arrowHeadEnd, setArrowHeadEnd] = useState(arrow.arrowHeadEnd || false);
  const [lineColor, setLineColor] = useState(arrow.lineColor || "#000000");
  const [lineWidth, setLineWidth] = useState(arrow.lineWidth || 2);
  const [textSize, setTextSize] = useState(arrow.textSize || 14);
  const [textColor, setTextColor] = useState(arrow.textColor || "#000000");
  const [textAlignment, setTextAlignment] = useState(arrow.textAlignment || "horizontal");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  const handleLineStyleChange = (style) => {
    setLineStyle(style);
    updateArrowStyle({ lineStyle: style });
  };

  const handleArrowHeadStartChange = (hasHead) => {
    setArrowHeadStart(hasHead);
    updateArrowStyle({ arrowHeadStart: hasHead });
  };

  const handleArrowHeadEndChange = (hasHead) => {
    setArrowHeadEnd(hasHead);
    updateArrowStyle({ arrowHeadEnd: hasHead });
  };

  const handleLineColorChange = (color) => {
    setLineColor(color.hex);
    updateArrowStyle({ lineColor: color.hex });
  };

  const handleLineWidthChange = (width) => {
    setLineWidth(width);
    updateArrowStyle({ lineWidth: width });
  };

  const handleTextSizeChange = (size) => {
    setTextSize(size);
    updateArrowStyle({ textSize: size });
  };

  const handleTextColorChange = (color) => {
    setTextColor(color.hex);
    updateArrowStyle({ textColor: color.hex });
  };

  const handleTextAlignmentChange = (alignment) => {
    setTextAlignment(alignment);
    updateArrowStyle({ textAlignment: alignment });
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
    solid: <TfiLayoutLineSolid />,
    dashed: <TfiLineDashed />,
    dotted: <TbLineDotted />,
  };

  const actionBarHeight = arrow.startY < arrow.endY ? arrow.startY : arrow.endY;

  return (
    <div
      style={{
        position: "relative",
        width: "880px",
        top: actionBarHeight - 225, // Position über dem Pfeil
        left: arrow.middleX,
        transform: "translateX(-50%)",
        display: "flex",
        gap: "32px",
        backgroundColor: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: 4003,
      }}
    >
      {/* Pfeilspitze links */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          icon={<BiSolidLeftArrow style={{ color: arrowHeadStart ? "rgb(0, 0, 0)" : "rgb(200, 200, 200)"}}/>}
          onClick={() => handleArrowHeadStartChange(!arrowHeadStart)}
          style={{ width: "60px", height: "60px", fontSize: "40px", border: "none" }}
        />
      </div>

      {/* Pfeilspitze rechts */}
      <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "32px" }}>
        <Button
          icon={<BiSolidLeftArrow style={{color: arrowHeadEnd ? "rgb(0, 0, 0)" : "rgb(200, 200, 200)", transform: "rotate(180deg)" }}/>}
          onClick={() => handleArrowHeadEndChange(!arrowHeadEnd)}
          style={{ width: "60px", height: "60px", fontSize: "40px", border: "none" }}
        />
      </div>

      {/* Linienart */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown
          menu={{
            items: [
              { key: "solid", label: "Durchgezogen", icon: <TfiLayoutLineSolid style={{ fontSize: "24px", marginRight: "20px" }}/>, style: { fontSize: "24px" } },
              { key: "dashed", label: "Gestrichelt", icon: <TfiLineDashed style={{ fontSize: "24px", marginRight: "20px" }}/>, style: { fontSize: "24px" } },
              { key: "dotted", label: "Gepunktet", icon: <TbLineDotted style={{ fontSize: "24px", marginRight: "20px" }}/>, style: { fontSize: "24px" } },
            ],
            onClick: (e) => handleLineStyleChange(e.key),
          }}
          overlayStyle={{ minWidth: "250px", paddingTop: "25px" }}
        >
          <Button icon={lineStyleIcons[lineStyle]} style={{ width: "60px", height: "60px", fontSize: "50px", border: "none" }} />
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
          <div style={{ position: "absolute", zIndex: 20, top: "110px" }}>
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
            icon={textAlignment === "horizontal" ? <MdOutlineTextRotationAngleup /> : <MdOutlineTextRotationNone/>}
            onClick={() => handleTextAlignmentChange(textAlignment === "horizontal" ? "aligned" : "horizontal")}
            style={{ width: "50px", height: "50px", fontSize: "50px", border: "none" }}
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
          <div style={{ position: "absolute", zIndex: 20, top: "110px" }}>
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
              style: { fontSize: "24px", marginBottom: "5px" }
            })),
          }}
          overlayStyle={{ paddingTop: "40px" }}
        >
          <Button style={{ fontSize: "28px", padding: "8px 12px", bottom: "2px", border: "none" }}>{textSize}</Button>
        </Dropdown>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Button
            icon={<IoIosArrowUp style={{ transform: "rotate(0deg)" }} />}
            onClick={increaseTextSize}
            style={{ fontSize: "24px", border: "none" }}
          />
          <Button
            icon={<IoIosArrowUp style={{ transform: "rotate(-180deg)" }} />}
            onClick={decreaseTextSize}
            style={{ fontSize: "24px", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ArrowActionBar;