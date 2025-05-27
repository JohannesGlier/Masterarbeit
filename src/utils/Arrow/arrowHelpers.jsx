// Hilfsfunktion zum Parsen der ChatGPT-Antwort
export const parseChatGPTResponse = (response) => {
  try {
    // Check if response is null or undefined
    if (response == null) {
      throw new Error("Antwort ist null oder undefined");
    }

    // Trim and check for empty string
    const trimmedResponse = response.trim();
    if (trimmedResponse === "") {
      throw new Error("Antwort ist ein leerer String");
    }

    // Parse JSON
    const data = JSON.parse(trimmedResponse);

    // Check if parsed data is null
    if (data === null) {
      throw new Error("Antwort ist null");
    }

    // Check if it's an array
    if (!Array.isArray(data)) {
      throw new Error("Antwort ist kein Array");
    }

    // Check for empty array
    if (data.length === 0) {
      throw new Error("Antwort ist ein leeres Array");
    }

    return data;
  } catch (error) {
    console.error("Fehler beim Parsen der Antwort:", {
      error: error.message,
      originalResponse: response,
    });
    throw error;
  }
};

// Berechnet das optimale Grid-Layout
export const calculateGridLayout = (
  cardCount,
  cardWidth,
  cardHeight,
  padding
) => {
  const columns = Math.ceil(Math.sqrt(cardCount));
  const rows = Math.ceil(cardCount / columns);

  return {
    columns,
    rows,
    requiredWidth: columns * (cardWidth + padding) + padding,
    requiredHeight: rows * (cardHeight + padding) + padding,
  };
};

// Kombiniert vorhandene und neue Karten
export const combineCards = (existingCards, newCardsData) => {
  return [
    ...existingCards.map((card) => ({
      text: card.text,
      existing: true,
      id: card.id,
    })),
    ...newCardsData.map((card) => ({
      text: card.text,
      existing: false,
    })),
  ];
};

// Positioniert Karten im Grid
export const positionCardsInGrid = (
  cards,
  grid,
  outputElement,
  cardSize,
  padding,
  handlers
) => {
  cards.forEach((card, index) => {
    const row = Math.floor(index / grid.columns);
    const col = index % grid.columns;

    const x =
      outputElement.position.x + padding + col * (cardSize.width + padding);
    const y =
      outputElement.position.y + padding + row * (cardSize.height + padding);

    if (card.existing) {
      handlers.updatePosition(card.id, x, y);
    } else {
      handlers.addCard({
        x,
        y,
        ...cardSize,
        text: card.text,
        aiGenerated: true,
      });
    }
  });
};

export const attachElementToArrowCentered = (point, arrow, elementSize) => {
  const arrowPoint = point === "start" ? arrow.start : arrow.end;
  const otherPoint = point === "start" ? arrow.end : arrow.start;

  const { width: rectWidth, height: rectHeight } = elementSize;

  // Berechne die Richtung des Pfeils
  const dx = otherPoint.x - arrowPoint.x;
  const dy = otherPoint.y - arrowPoint.y;
  const angle = Math.atan2(dy, dx); // Winkel in Radianten

  let rectX, rectY, anchor;

  // Bestimme die Hauptrichtung und positioniere mittig
  if (Math.abs(angle) < Math.PI / 4) {
    // Pfeil zeigt hauptsächlich nach rechts
    rectX = arrowPoint.x - rectWidth; // Rechteck beginnt am Pfeilpunkt
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "right"; // Pfeil verankert am LINKEN Rand des Rechtecks
  } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
    // Pfeil zeigt hauptsächlich nach links
    rectX = arrowPoint.x; // Rechteck endet am Pfeilpunkt
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "left"; // Pfeil verankert am RECHTEN Rand des Rechtecks
  } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    // Pfeil zeigt hauptsächlich nach unten
    rectX = arrowPoint.x - rectWidth / 2;
    rectY = arrowPoint.y - rectHeight; // Rechteck beginnt am Pfeilpunkt
    anchor = "bottom"; // Pfeil verankert am OBEREN Rand des Rechtecks
  } else {
    // Pfeil zeigt hauptsächlich nach oben
    rectX = arrowPoint.x - rectWidth / 2;
    rectY = arrowPoint.y; // Rechteck endet am Pfeilpunkt
    anchor = "top"; // Pfeil verankert am UNTEREN Rand des Rechtecks
  }

  return {
    x: rectX,
    y: rectY,
    width: rectWidth,
    height: rectHeight,
    anchor: anchor,
  };
};
