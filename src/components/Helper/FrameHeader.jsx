import React, { memo } from 'react';
import TextInput from '@/components/Helper/TextInput';

const FrameHeader = memo(({ 
  position,
  size,
  scale,
  offset,
  heading,
  textStyles,
  onHeadingChange 
}) => (
  <div style={{
    position: 'absolute',
    top: position.y * scale + offset.y - 40,
    left: position.x * scale + offset.x,
    zIndex: 4
  }}>
    <TextInput
      placeholder="Überschrift"
      value={heading}
      onChange={onHeadingChange}
      minWidth={`${size.width * scale}px`}
      maxWidth={`${size.width * scale}px`}
      {...textStyles}
    />
  </div>
));

export default FrameHeader;