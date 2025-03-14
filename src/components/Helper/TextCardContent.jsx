const TextCardContent = ({
  isEditing,
  text,
  onChange,
  onBlur,
  textAlign,
  textColor,
  font,
  textSize,
  fontStyles,
}) => {
  const commonStyles = {
    textAlign,
    color: textColor,
    fontFamily: font,
    fontSize: textSize,
    fontWeight: fontStyles.bold ? "bold" : "normal",
    fontStyle: fontStyles.italic ? "italic" : "normal",
    textDecoration: fontStyles.underline ? "underline" : "none",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  };

  return isEditing ? (
    <textarea
      value={text}
      onChange={onChange}
      onBlur={onBlur}
      autoFocus
      style={{
        ...commonStyles,
        width: "100%",
        height: "100%",
        border: "none",
        outline: "none",
        resize: "none",
        backgroundColor: "transparent",
        cursor: "text",
      }}
    />
  ) : (
    <div style={commonStyles}>
      {text}
    </div>
  );
};

export default TextCardContent;
