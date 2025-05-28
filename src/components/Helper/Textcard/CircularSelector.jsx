import React from 'react';
import styles from './CircularSelector.module.css';

const CircularSelector = ({ centerX, centerY, radius, scale, offset, isVisible, isBlinking }) => {
  if (!isVisible) return null;

  // Umrechnung der Weltkoordinaten in Bildschirmkoordinaten für den Kreis
  // Der Radius wird direkt skaliert.
  // Die Position ist der Mittelpunkt, daher müssen wir den Radius abziehen, um die linke/obere Ecke zu bekommen.
  const displayRadius = radius * scale;
  const displayX = centerX * scale + offset.x - displayRadius;
  const displayY = centerY * scale + offset.y - displayRadius;

  return (
    <div
      className={`${styles.circle} ${isBlinking ? styles.blink : ''}`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${displayRadius * 2}px`, // Durchmesser
        height: `${displayRadius * 2}px`, // Durchmesser
        // Das CSS kümmert sich um border-radius: 50%
      }}
      aria-hidden="true" // Dekoration, nicht für Screenreader relevant
    />
  );
};

export default CircularSelector;