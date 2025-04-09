export const getElementAtPosition = (elements, x, y) => {
  // Filtert alle Elemente, die sich an der angegebenen Position befinden
  const elementsAtPosition = elements.filter((element) => {
    const elemX = element.position.x;
    const elemY = element.position.y;
    const elemWidth = element.size.width;
    const elemHeight = element.size.height;

    return (
      x >= elemX &&
      x <= elemX + elemWidth &&
      y >= elemY &&
      y <= elemY + elemHeight
    );
  });

  // Falls kein Element gefunden wurde, null zurückgeben
  if (elementsAtPosition.length === 0) {
    return null;
  }

  // Das Element mit dem höchsten zIndex zurückgeben
  return elementsAtPosition.reduce((highest, current) =>
    current.zIndex > highest.zIndex ? current : highest
  );
};

export const isElementInRectangle = (element, rectangle) => {
  const elementLeft = element.position.x;
  const elementRight = element.position.x + element.size.width;
  const elementTop = element.position.y;
  const elementBottom = element.position.y + element.size.height;

  const rectLeft = rectangle.x;
  const rectRight = rectangle.x + rectangle.width;
  const rectTop = rectangle.y;
  const rectBottom = rectangle.y + rectangle.height;

  // Überprüfe, ob das Element innerhalb des Rechtecks liegt
  return (
    elementRight > rectLeft &&
    elementLeft < rectRight &&
    elementBottom > rectTop &&
    elementTop < rectBottom
  );
};

export const getElementsInRectangle = (elements, rectangle) => {
  const rectLeft = rectangle.x;
  const rectRight = rectangle.x + rectangle.width;
  const rectTop = rectangle.y;
  const rectBottom = rectangle.y + rectangle.height;

  return elements.filter((element) => {
    const elementLeft = element.position.x;
    const elementRight = element.position.x + element.size.width;
    const elementTop = element.position.y;
    const elementBottom = element.position.y + element.size.height;

    // Überprüfe, ob das Element innerhalb des Rechtecks liegt
    return (
      elementRight > rectLeft &&
      elementLeft < rectRight &&
      elementBottom > rectTop &&
      elementTop < rectBottom
    );
  });
};

export const attachElementToArrow = (point, arrow, element) => {
  const arrowPoint = point === "start" ? arrow.start : arrow.end;
  const otherPoint = point === "start" ? arrow.end : arrow.start;

  const rectWidth = 150; // Breite des Rechtecks
  const rectHeight = 100; // Höhe des Rechtecks

  // Berechne die Richtung des Pfeils
  const dx = otherPoint.x - arrowPoint.x;
  const dy = otherPoint.y - arrowPoint.y;
  const angle = Math.atan2(dy, dx); // Winkel in Radianten

  let rectX, rectY, anchor;

  // Bestimme die Hauptrichtung (rechts/links/oben/unten)
  if (Math.abs(angle) < Math.PI / 4) {
    // Pfeil zeigt hauptsächlich nach rechts
    rectX = arrowPoint.x - rectWidth;
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "right";
  } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
    // Pfeil zeigt hauptsächlich nach links
    rectX = arrowPoint.x;
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "left";
  } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    // Pfeil zeigt hauptsächlich nach unten
    rectX = arrowPoint.x - rectWidth / 2;
    rectY = arrowPoint.y - rectHeight;
    anchor = "bottom";
  } else {
    // Pfeil zeigt hauptsächlich nach oben
    rectX = arrowPoint.x - rectWidth / 2;
    rectY = arrowPoint.y;
    anchor = "top";
  }

  return {
    x: rectX,
    y: rectY,
    width: rectWidth,
    height: rectHeight,
    anchor: anchor,
  };
};

export const attachTextcardToArrow = (arrow, startPointAnchor) => {
  const arrowPoint = arrow.end;
  const rectWidth = 200;
  const rectHeight = 75;

  const anchorMap = {
    top: {
      anchor: "bottom",
      x: arrowPoint.x - rectWidth / 2,
      y: arrowPoint.y - rectHeight,
    },
    bottom: { anchor: "top", x: arrowPoint.x - rectWidth / 2, y: arrowPoint.y },
    left: {
      anchor: "right",
      x: arrowPoint.x - rectWidth,
      y: arrowPoint.y - rectHeight / 2,
    },
    right: {
      anchor: "left",
      x: arrowPoint.x,
      y: arrowPoint.y - rectHeight / 2,
    },
  };

  const {
    anchor,
    x: rectX,
    y: rectY,
  } = anchorMap[startPointAnchor] || anchorMap.right;

  return { x: rectX, y: rectY, width: rectWidth, height: rectHeight, anchor };
};

export const getTextFromElement = (element, allElements) => {
  if (!element) return "undefined";

  if (element.type === "textcard") {
    console.log("Text from Textcard", element.text);
    return element.text;
  } else if (element.type === "rectangle") {
    const elementsInRect = getElementsInRectangle(allElements, {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
    });

    const textFromElements = elementsInRect
      .map((el) => {
        if (el.type === "textcard") {
          return el.text;
        } else if (el.type === "rectangle") {
          return el.heading;
        }
        return null;
      })
      .filter((item) => item !== null);

    console.log("Texts from Frame", textFromElements);
    return JSON.stringify(textFromElements, null, 2);
  }

  console.log("Text from element " + element.id + "is undefined");
  return "undefined";
};
