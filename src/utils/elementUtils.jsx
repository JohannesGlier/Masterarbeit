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

  return elements.filter(element => {
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

  const rectWidth = 100; // Breite des Rechtecks
  const rectHeight = 100; // Höhe des Rechtecks

  let rectX, rectY, anchor;

  if (point === "start") {
    rectX = arrowPoint.x - rectWidth;
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "right"; // Rechte Seite des Rechtecks anschließen
  } else if (point === "end") {
    rectX = arrowPoint.x;
    rectY = arrowPoint.y - rectHeight / 2;
    anchor = "left"; // Linke Seite des Rechtecks anschließen
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
  const rectWidth = 100;
  const rectHeight = 100;

  const anchorMap = {
    top: { anchor: "bottom", x: arrowPoint.x - rectWidth / 2, y: arrowPoint.y - rectHeight },
    bottom: { anchor: "top", x: arrowPoint.x - rectWidth / 2, y: arrowPoint.y },
    left: { anchor: "right", x: arrowPoint.x - rectWidth, y: arrowPoint.y - rectHeight / 2 },
    right: { anchor: "left", x: arrowPoint.x, y: arrowPoint.y - rectHeight / 2 },
  };

  const { anchor, x: rectX, y: rectY } = anchorMap[startPointAnchor] || anchorMap.right;

  return { x: rectX, y: rectY, width: rectWidth, height: rectHeight, anchor };
};
