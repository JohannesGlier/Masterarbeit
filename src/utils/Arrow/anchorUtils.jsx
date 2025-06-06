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

export const getAnchorFromPosition = (position, element) => {
  const { x, y } = element.position;
  const { width, height } = element.size;

  const anchors = {
    top: { x: x + width/2, y: y },
    bottom: { x: x + width/2, y: y + height },
    left: { x: x, y: y + height/2 },
    right: { x: x + width, y: y + height/2 }
  };

  return anchors[position] || { x, y };
};

export const getAnchorData = (element, x, y) => {
  return element ? getClosestAnchor(element, x, y) : null;
};

export const getAnchorData2 = (element, x, y) => {
  return element ? getClosestAnchor2(element, x, y) : null;
};

export const getClosestAnchor2 = (element, referenceX, referenceY) => {
  const anchors = {
    top: {
      x: element.x + element.width / 2,
      y: element.y,
    },
    bottom: {
      x: element.x + element.width / 2,
      y: element.y + element.height,
    },
    left: {
      x: element.x,
      y: element.y + element.height / 2,
    },
    right: {
      x: element.x + element.width,
      y: element.y + element.height / 2,
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
