import React, { memo } from 'react';
import ResizeHandle from '@/components/Helper/ResizeHandle';

const HANDLE_CONFIG = [
  { position: 'top-left', cursor: 'nwse-resize', type: 'resize' },
  { position: 'top-right', cursor: 'nesw-resize', type: 'resize' },
  { position: 'bottom-left', cursor: 'nesw-resize', type: 'resize' },
  { position: 'bottom-right', cursor: 'nwse-resize', type: 'resize' },
  { position: 'top', cursor: 'grab', type: 'arrow' },
  { position: 'bottom', cursor: 'grab', type: 'arrow' },
  { position: 'left', cursor: 'grab', type: 'arrow' },
  { position: 'right', cursor: 'grab', type: 'arrow' }
];

const Handles = memo(({ onResize, onCreateArrow, text }) => (
  <>
    {HANDLE_CONFIG.map(({ position, cursor, type }) => {
      const isArrowHandle = type === 'arrow';
      const isDisabled = isArrowHandle && !text;
      const handleColor = isDisabled ? 'lightgray' : (isArrowHandle ? 'rgb(23, 104, 255)' : 'rgb(252, 252, 252)');
      const handleCursor = isDisabled ? 'not-allowed' : cursor;
      const handlePointerEvents = isDisabled ? 'none' : 'auto';
      const handleMouseDown = (e) => {
        if (isDisabled) {
          // Verhindere das Auslösen des onMouseDown-Events des übergeordneten Divs
          e.stopPropagation();
        } else {
          isArrowHandle ? onCreateArrow(e, position) : onResize(e, position);
        }
      };

      let handleTitle = '';
      if (isDisabled) {
        handleTitle = 'Enter text/heading to create a relation arrow.';
      } else if (type === 'arrow') {
        handleTitle = 'Click and drag to create a relation arrow.';
      } else if (type === 'resize') {
        handleTitle = 'Drag to resize.';
      }

       return (
        <ResizeHandle
          key={position}
          position={position}
          cursor={handleCursor}
          color={handleColor}
          onMouseDown={handleMouseDown}
          style={{ pointerEvents: handlePointerEvents }}
          title={handleTitle}
        />
      );
    })}
  </>
));

export default Handles;