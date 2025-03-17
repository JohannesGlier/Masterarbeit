export const getElementAtPosition = (elements, x, y) => {
  // Filtert alle Elemente, die sich an der angegebenen Position befinden
  const elementsAtPosition = elements.filter((element) => {
    const elemX = element.position.x;
    const elemY = element.position.y;
    const elemWidth = element.size.width;
    const elemHeight = element.size.height;

    return x >= elemX && x <= elemX + elemWidth && y >= elemY && y <= elemY + elemHeight;
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
