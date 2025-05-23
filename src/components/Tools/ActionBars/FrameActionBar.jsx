import React, { useState } from "react";
import { Slider, Dropdown, Button } from "antd";
import { IoIosArrowUp } from "react-icons/io";
import { FaBold, FaItalic, FaUnderline, FaFont } from 'react-icons/fa';
import { FiAlignLeft, FiAlignCenter, FiAlignRight } from "react-icons/fi";
import { MdOutlineRectangle, MdRectangle } from "react-icons/md";
import { BsLayerBackward, BsLayerForward } from "react-icons/bs";
import { ChromePicker } from "react-color";

const FrameActionBar = ({ rect, updateFrameStyle }) => {
  const [selectedFont, setSelectedFont] = useState(rect.font);
  const [fontStyles, setFontStyles] = useState(rect.fontStyles);
  const [layer, setLayer] = useState(rect.zIndex);

  const [textColor, setTextColor] = useState(rect.textColor || "#000000");
  const [frameColor, setFrameColor] = useState(rect.frameColor || "#000000");
  const [frameBorderColor, setFrameBorderColor] = useState(rect.frameBorderColor || "#000000");

  const [borderWidth, setBorderWidth] = useState(rect.borderWidth);
  const [fontSize, setFontSize] = useState(rect.fontSize);
  const [textAlign, setTextAlign] = useState(rect.textAlign);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFrameColorPicker, setShowFrameColorPicker] = useState(false);
  const [showFrameBorderColorPicker, setShowFrameBorderColorPicker] = useState(false);

  const handleFontChange = (font) => {
    setSelectedFont(font);
    updateFrameStyle({ font: font });
  };

  const toggleFontStyle = (style) => {
    setFontStyles(prev => {
      const newFontStyles = { ...prev, [style]: !prev[style] };
      updateFrameStyle({ fontStyles: newFontStyles });
      return newFontStyles;
    });
  };

  const handleBorderWidthChange = (width) => {
    setBorderWidth(width);
    updateFrameStyle({ borderWidth: width });
  };

  const handleTextSizeChange = (size) => {
    setFontSize(size);
    updateFrameStyle({ fontSize: size });
  };

  const handleLayerChange = (newLayer) => {
    setLayer(newLayer);
    updateFrameStyle({ zIndex: newLayer }); // zIndex wird aktualisiert
  };

  const handleTextColorChange = (color) => {
    setTextColor(color.hex);
    updateFrameStyle({ textColor: color.hex });
  };

  const handleFrameColorChange = (color) => {
    setFrameColor(color.hex);
    updateFrameStyle({ frameColor: color.hex });
  };

  const handleFrameBorderColorChange = (color) => {
    setFrameBorderColor(color.hex);
    updateFrameStyle({ frameBorderColor: color.hex });
  };

  const handleTextAlignmentChange = (alignment) => {
    setTextAlign(alignment);
    updateFrameStyle({ textAlign: alignment });
  };

  const increaseTextSize = () => {
    const newSize = Math.min(fontSize + 1, 30); // Maximal 30
    handleTextSizeChange(newSize);
  };

  const decreaseTextSize = () => {
    const newSize = Math.max(fontSize - 1, 10); // Minimal 10
    handleTextSizeChange(newSize);
  };

  const layerUp = () => {
    const newLayer = Math.min(layer + 1, 2000);
    if (newLayer !== layer) {
      handleLayerChange(newLayer);
    }
  };

  const layerDown = () => {
    const newLayer = Math.max(layer - 1, 1000); 
    if (newLayer !== layer) {
      handleLayerChange(newLayer);
    }
  };

  const icons = {
    left: <FiAlignLeft />,
    center: <FiAlignCenter />,
    right: <FiAlignRight />,
  };

  return (
    <div
      style={{
        position: "relative",
        width: "850px",
        height: "65px",
        top: rect.top - 150,
        left: rect.left + (rect.width - 850) / 2,
        display: "flex",
        gap: "16px",
        backgroundColor: "#fff",
        padding: "4px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: 4003,
      }}
    >
      {/* Font */}
      <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "8px" }}>
        <Dropdown
            menu={{
            items: ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Garamond', 'Brush Script MT', 'Tahoma']
            .map(font => ({
                key: font,
                label: <span style={{ fontFamily: font }}>{font}</span>,
                style: { fontFamily: font, fontSize: '16px' }
            })),
            onClick: (e) => handleFontChange(e.key),
            }}
            overlayStyle={{
                minWidth: "175px",
                maxHeight: "400px",
                overflowY: "auto",
                paddingTop: "40px",
                zIndex: 4003,
            }}
        >
            <Button 
                style={{ 
                    fontFamily: selectedFont,  // selectedFont sollte aus deinem State kommen
                    fontSize: "20px", 
                    padding: "8px 20px", 
                    border: "none",
                    width: "200px",
                    textAlign: "left"
                }}
            >
            {selectedFont}
            </Button>
        </Dropdown>
      </div>

      {/* Schriftgröße */}
      <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "8px" }}>
        <Dropdown
          menu={{
            items: [10, 12, 14, 16, 18, 20, 24, 30].map((size) => ({
              key: size,
              label: `${size}px`,
              onClick: () => handleTextSizeChange(size),
              style: { fontSize: "16px", marginBottom: "2px" }
            })),
          }}
          overlayStyle={{ paddingTop: "30px", zIndex: 4003 }}
        >
          <Button style={{ fontSize: "24px", padding: "8px 8px", bottom: "1px", border: "none" }}>{fontSize}</Button>
        </Dropdown>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Button
            icon={<IoIosArrowUp style={{ transform: "rotate(0deg)" }} />}
            onClick={increaseTextSize}
            style={{ fontSize: "20px", border: "none" }}
          />
          <Button
            icon={<IoIosArrowUp style={{ transform: "rotate(-180deg)" }} />}
            onClick={decreaseTextSize}
            style={{ fontSize: "20px", border: "none" }}
          />
        </div>
      </div>

      {/* Font Style */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown
            trigger={["hover"]}
            placement="bottom"
            align={{ offset: [0, 28] }}
            dropdownRender={() => (
            <div
                style={{
                  display: "flex",
                  gap: "4px",
                  padding: "4px",
                  background: "#fff",
                  boxShadow: "0 3px 6px -4px rgba(0,0,0,0.12)",
                  borderRadius: "4px",
                  zIndex: 4003,
                }}
            >
                {["bold", "italic", "underline"].map((style) => (
                <Button
                    key={style}
                    type="text"
                    icon={{
                        bold: <FaBold />,
                        italic: <FaItalic />,
                        underline: <FaUnderline />,
                    }[style]}
                    onClick={() => toggleFontStyle(style)}
                    style={{ 
                        minWidth: "40px", 
                        height: "30px", 
                        border: "none", 
                        fontSize: "20px",
                        background: "transparent", 
                        color: fontStyles[style] ? "#1890ff" : "inherit" // Nur Icon färben
                    }}
                />
                ))}
            </div>
            )}
        >
        <Button 
          icon={<FaFont />}
          style={{ 
            width: "30px", 
            height: "30px", 
            fontSize: "28px", 
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </Dropdown>
      </div>

      {/* Text Alignment */}
      <div style={{ display: "flex", alignItems: "center" }}>
      <Dropdown
        trigger={["hover"]}
        placement="bottom"
        align={{ offset: [0, 28] }} // Dropdown weiter nach unten verschoben
        dropdownRender={() => (
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "4px",
              background: "#fff",
              boxShadow: "0 3px 6px -4px rgba(0,0,0,0.12)",
              borderRadius: "4px",
              zIndex: 4003,
            }}
          >
            {["left", "center", "right"].map((alignment) => (
              <Button
                key={alignment}
                type="text"
                icon={icons[alignment]}
                onClick={() => handleTextAlignmentChange(alignment)}
                style={{
                  minWidth: "40px",
                  height: "30px",
                  border: "none",
                  fontSize: "20px",
                  background: "transparent",
                  // Nur das Icon soll blau werden, wenn ausgewählt ist:
                  color: textAlign === alignment ? "#1890ff" : "inherit",
                }}
              />
            ))}
          </div>
        )}
      >
        {/* Eltern-Button zeigt immer das aktuell ausgewählte Icon */}
        <Button
          icon={icons[textAlign] || <FiAlignCenter />}
          style={{
            width: "30px",
            height: "30px",
            fontSize: "32px",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Dropdown>
      </div>

      {/* Text Color */}
      <div style={{ display: "flex", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "16px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: textColor,
            cursor: "pointer",
            border: "2px solid #e0e0e0",
          }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {showColorPicker && (
          <div style={{ position: "absolute", zIndex: 20, top: "90px" }}>
            <ChromePicker
              color={textColor}
              onChange={handleTextColorChange}
              disableAlpha={false}
            />
          </div>
        )}
      </div>

      {/* Frame Background Color */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div onClick={() => setShowFrameColorPicker(!showFrameColorPicker)}>
            <MdRectangle
            style={{
                fontSize: "40px",
                color: frameColor,
                cursor: "pointer",
            }}
            />
        </div>
        {showFrameColorPicker && (
            <div style={{ position: "absolute", zIndex: 20, top: "90px" }}>
            <ChromePicker
                color={frameColor}
                onChange={handleFrameColorChange}
                disableAlpha={false}
            />
            </div>
        )}
      </div>

      {/* Frame Border Color */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div onClick={() => setShowFrameBorderColorPicker(!showFrameBorderColorPicker)}>
            <MdOutlineRectangle
            style={{
                fontSize: "40px",
                color: frameBorderColor,
                cursor: "pointer",
            }}
            />
        </div>
        {showFrameBorderColorPicker && (
            <div style={{ position: "absolute", zIndex: 20, top: "90px" }}>
            <ChromePicker
                color={frameBorderColor}
                onChange={handleFrameBorderColorChange}
                disableAlpha={false}
            />
            </div>
        )}
      </div>

      {/* Frame Broder Thickness */}
      <div style={{ display: "flex", flexDirection: "column", alignSelf: "end", alignItems: "center", borderRight: "1px solid #e0e0e0", paddingRight: "16px" }}>
        <span style={{ marginBottom: "-4px", fontSize: "16px", color: "black" }}>Border Thickness</span>
        <Slider
          min={0}
          max={10}
          value={borderWidth}
          onChange={handleBorderWidthChange}
          style={{ width: "100%" }}
        />
      </div>

      {/* Layer */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          icon={<BsLayerForward />}
          onClick={layerUp}
          style={{ fontSize: "28px", border: "none" }}
        />
      </div>

      {/* Layer */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          icon={<BsLayerBackward />}
          onClick={layerDown}
          style={{ fontSize: "28px", border: "none" }}
        />
      </div>
    </div>
  );
};

export default FrameActionBar;