import React, { memo, useMemo } from "react";
import TextInput from "@/components/Helper/TextInput";
import styles from "@/components/Helper/Frame/FrameHeader.module.css";

const FrameHeader = memo(
  ({
    position,
    size,
    scale,
    offset,
    heading,
    textStyles,
    onHeadingChange,
    pointerEvents,
    isLoading,
  }) => {
    const dynamicHeaderStyle = useMemo(
      () => ({
        position: "absolute",
        top: position.y * scale + offset.y - 40,
        left: position.x * scale + offset.x,
        zIndex: textStyles.zIndex,
        pointerEvents,
        minWidth: `${size.width * scale}px`,
      }),
      [position, size, scale, offset, textStyles, pointerEvents]
    );

    const textInputWidth = `${size.width * scale}px`;

    return (
      <div style={dynamicHeaderStyle} className={styles.headerContainer}>
        {isLoading ? (
          <div
            className={styles.loadingIndicator}
            style={{ color: textStyles.textColor || "inherit" }}
            role="status"
            aria-live="polite"
          >
            <span className={styles.dot} aria-hidden="true"></span>{" "}
            {/* aria-hidden für dekorative Elemente */}
            <span className={styles.dot} aria-hidden="true"></span>
            <span className={styles.dot} aria-hidden="true"></span>
            <span style={{ position: "absolute", left: "-9999px" }}>
              Loading heading
            </span>{" "}
            {/* Text für Screenreader */}
          </div>
        ) : (
          <TextInput
            placeholder="Heading.."
            value={heading}
            onChange={onHeadingChange}
            minWidth={`${size.width * scale}px`}
            maxWidth={`${size.width * scale}px`}
            {...textStyles}
          />
        )}
      </div>
    );
  }
);

export default FrameHeader;
