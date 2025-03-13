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

const Handles = memo(({ onResize, onCreateArrow }) => (
  <>
    {HANDLE_CONFIG.map(({ position, cursor, type }) => (
      <ResizeHandle
        key={position}
        position={position}
        cursor={cursor}
        color={type === 'arrow' ? 'rgb(23, 104, 255)' : 'rgb(252, 252, 252)'}
        onMouseDown={(e) => 
          type === 'arrow' ? onCreateArrow(e, position) : onResize(e, position)
        }
      />
    ))}
  </>
));

export default Handles;