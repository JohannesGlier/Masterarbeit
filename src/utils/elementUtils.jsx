export const getElementAtPosition = (elements, x, y) => {
  return (
    elements.find((element) => {
      const elemX = element.position.x;
      const elemY = element.position.y;
      const elemWidth = element.size.width;
      const elemHeight = element.size.height;

      // Präzise Kollisionserkennung
      return (
        x >= elemX &&
        x <= elemX + elemWidth &&
        y >= elemY &&
        y <= elemY + elemHeight
      );
    }) || null
  ); // Explizites null zurückgeben
};
