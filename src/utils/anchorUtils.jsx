export const getAnchorPosition = (element, anchor) => {
  if (!element || !anchor) return null;
  const { x, y } = element.position;
  const { width, height } = element.size;

  switch (anchor) {
    case "top":
      return { x: x + width / 2, y: y };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x: x, y: y + height / 2 };
    case "right":
      return { x: x + width, y: y + height / 2 };
    default:
      return null;
  }
};

export const getClosestAnchor = (element, referenceX, referenceY) => {
  const anchors = {
    top: {
      x: element.position.x + element.size.width / 2,
      y: element.position.y,
    },
    bottom: {
      x: element.position.x + element.size.width / 2,
      y: element.position.y + element.size.height,
    },
    left: {
      x: element.position.x,
      y: element.position.y + element.size.height / 2,
    },
    right: {
      x: element.position.x + element.size.width,
      y: element.position.y + element.size.height / 2,
    },
  };

  let closestAnchor = "";
  let minDistance = Infinity;

  Object.entries(anchors).forEach(([key, point]) => {
    const distance = Math.hypot(point.x - referenceX, point.y - referenceY);
    if (distance < minDistance) {
      minDistance = distance;
      closestAnchor = key;
    }
  });

  return {
    anchor: closestAnchor,
    ...anchors[closestAnchor],
  };
};
