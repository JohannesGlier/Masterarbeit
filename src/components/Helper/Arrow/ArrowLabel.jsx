import TextInput from "@/components/Helper/TextInput";

const ArrowLabel = ({
  middleX,
  middleY,
  scale,
  offset,
  textAlignment,
  text,
  onChange,
  start,
  end,
  textSize,
  textColor,
  zIndex,
}) => {
  let rotationAngle =
    textAlignment === "horizontal"
      ? Math.atan2(end.y - start.y, end.x - start.x)
      : 0;

  if (start.x > end.x && textAlignment === "horizontal") {
    rotationAngle += Math.PI;
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: middleY * scale + offset.y - 25,
          left: middleX * scale + offset.x,
          transform: `translate(-50%, -50%) rotate(${rotationAngle}rad)`,
          zIndex,
        }}
      >
        <TextInput
          placeholder="Enter Prompt.."
          value={text}
          onChange={onChange}
          minWidth={150}
          maxWidth={250}
          textAlign="center"
          fontSize={textSize}
          textColor={textColor}
          fontStyles={{ bold: false, italic: false, underline: false }}
        />
      </div>
    </>
  );
};

export default ArrowLabel;
