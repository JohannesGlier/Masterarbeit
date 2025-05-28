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

export const getTextFromAllElement = (allElements) => {
  if (!allElements) return "Kein Element auf dem Canvas!";

  const simplifiedElements = allElements.map((el) => ({
    ...(el.type === "textcard" && { text: el.text }),
    ...(el.type === "rectangle" && { text: el.heading }),
  }));

  const text = JSON.stringify(simplifiedElements, null, 2);
  console.log("Text von allen Elementen auf dem Canvas:\n", text);
  return text;
};

export const getTextFromAllElements = (elements) => {
  if (!Array.isArray(elements)) {
    console.error("Ungültige Eingabe: 'elements' ist kein Array.");
    return "Fehler: Ungültige Eingabe.";
  }
  if (elements.length === 0) {
    return "Keine Elemente übergeben.";
  }

  const textItems = elements
    .map(el => {
      let textContent = null;
      // Extrahiere den Text basierend auf dem Typ und stelle sicher, dass es ein String ist
      if (el.type === "textcard" && el.text && typeof el.text === 'string') {
        textContent = el.text.trim(); // Entferne Leerzeichen am Anfang/Ende
      } else if (el.type === "rectangle" && el.heading && typeof el.heading === 'string') {
        textContent = el.heading.trim(); // Entferne Leerzeichen am Anfang/Ende
      }
      // Gib nur nicht-leere Strings zurück, sonst null
      return textContent && textContent.length > 0 ? textContent : null;
    })
    .filter(text => text !== null); // Entferne alle null-Einträge (Elemente ohne passenden Text oder leere Texte)

  // 2. Formatiere den String basierend auf der Anzahl der gefundenen Texte
  if (textItems.length === 0) {
    // Fall: Elemente vorhanden, aber keine relevanten Texte extrahierbar
    return "Keine relevanten Texte in den Elementen gefunden.";
  }
  if (textItems.length === 1) {
    // Fall: Nur ein Text vorhanden
    return textItems[0];
  }

  // Fall: Zwei oder mehr Texte vorhanden
  // Nimm das letzte Element für die "und"-Verknüpfung
  const lastItem = textItems.pop(); // .pop() entfernt das letzte Element aus textItems und gibt es zurück
  // Verbinde die verbleibenden Elemente mit ", "
  const firstPart = textItems.join(", ");

  return `${firstPart} und ${lastItem}`;
};

const calculateDistance = (x1, y1, x2, y2) => {
  const deltaX = x1 - x2;
  const deltaY = y1 - y2;
  return Math.hypot(deltaX, deltaY);
};

const calculateCosineSimilarity = (vecA, vecB, distA, distB) => {
  const magnitudeA =
    distA !== undefined ? distA : Math.sqrt(vecA.x * vecA.x + vecA.y * vecA.y);
  const magnitudeB =
    distB !== undefined ? distB : Math.sqrt(vecB.x * vecB.x + vecB.y * vecB.y);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return magnitudeA === 0 && magnitudeB === 0 ? 1 : 0; // Oder eine andere Logik
  }

  const dotProduct = vecA.x * vecB.x + vecA.y * vecB.y;
  return dotProduct / (magnitudeA * magnitudeB);
};

export const findTopVisibleNearbyElements = (
  mousePos,
  elements,
  maxNeighbors = 4,
  cosineThreshold = 0.95 // Schwellenwert anpassen für gewünschte "Sichtbarkeit"
) => {
  // --- Eingabevalidierung ---
  if (
    !mousePos ||
    typeof mousePos.x !== "number" ||
    typeof mousePos.y !== "number"
  ) {
    console.error("Ungültige mousePos übergeben.");
    return [];
  }
  if (!Array.isArray(elements)) {
    console.error("Ungültiges elements Array übergeben.");
    return [];
  }
  if (maxNeighbors <= 0) {
    return [];
  }

  const elementsWithData = [];

  elements.forEach((element) => {
    if (
      !element ||
      typeof element.position?.x !== "number" ||
      typeof element.position?.y !== "number" ||
      typeof element.size?.width !== "number" ||
      typeof element.size?.height !== "number"
    ) {
      console.warn(
        "Ungültiges oder unvollständiges Element übersprungen:",
        element
      );
      return;
    }

    const centerX = element.position.x + element.size.width / 2;
    const centerY = element.position.y + element.size.height / 2;
    const distance = calculateDistance(
      mousePos.x,
      mousePos.y,
      centerX,
      centerY
    );
    const vectorX = centerX - mousePos.x;
    const vectorY = centerY - mousePos.y;

    // Element direkt an der Mausposition (oder sehr nah) sollte berücksichtigt werden
    // und keine Division durch Null verursachen.
    const isAtMousePos = distance < 1e-6; // Kleine Toleranz für Fließkommaungenauigkeiten

    elementsWithData.push({
      element: element,
      distance: distance,
      vector: { x: vectorX, y: vectorY },
      isAtMousePos: isAtMousePos,
    });
  });

  // --- 2. Sortiere nach Distanz ---
  elementsWithData.sort((a, b) => a.distance - b.distance);

  // --- 3. Iteratives Filtern ---
  const visibleNeighbors = [];
  const acceptedVectors = []; // Speichere die Vektoren der bereits akzeptierten Nachbarn

  for (const currentData of elementsWithData) {
    // Wenn wir genug Nachbarn haben, stoppen.
    if (visibleNeighbors.length >= maxNeighbors) {
      break;
    }

    // Elemente direkt an der Mausposition werden immer hinzugefügt (falls Platz ist)
    if (currentData.isAtMousePos) {
      visibleNeighbors.push(currentData.element);
      // Füge einen "Pseudo"-Vektor hinzu oder behandle ihn speziell,
      // damit er keine zukünftigen Elemente fälschlicherweise blockiert.
      // Hier fügen wir ihn nicht zu acceptedVectors hinzu, da seine Richtung undefiniert ist.
      continue; // Gehe zum nächsten Element
    }

    let isOccluded = false;
    // Vergleiche mit allen *bereits akzeptierten*, näheren Elementen
    for (let i = 0; i < acceptedVectors.length; i++) {
      const acceptedVector = acceptedVectors[i].vector;
      const acceptedDistance = acceptedVectors[i].distance; // Brauchen wir für die Kosinus-Funktion

      // Berechne Kosinus-Ähnlichkeit nur, wenn der akzeptierte Vektor gültig ist
      if (acceptedDistance > 1e-6) {
        const similarity = calculateCosineSimilarity(
          currentData.vector,
          acceptedVector,
          currentData.distance,
          acceptedDistance
        );

        // Wenn die Richtung zu ähnlich ist, ist das aktuelle Element verdeckt
        if (similarity > cosineThreshold) {
          isOccluded = true;
          break; // Keine weiteren Vergleiche für dieses Element nötig
        }
      }
    }

    // Wenn nicht verdeckt, füge es zur Ergebnisliste und zu den Vergleichsvektoren hinzu
    if (!isOccluded) {
      visibleNeighbors.push(currentData.element);
      // Füge nur hinzu, wenn es eine klare Richtung gibt (nicht an Mausposition)
      if (!currentData.isAtMousePos) {
        acceptedVectors.push({
          vector: currentData.vector,
          distance: currentData.distance,
        });
      }
    }
  }

  return visibleNeighbors;
};

// Hilfsfunktion: Findet den Punkt auf einem Rechteck, der einem gegebenen Punkt am nächsten ist.
function closestPointOnRectToPoint(rect, point) {
  // rect = { x, y, width, height } (angenommen: Weltkoordinaten)
  // point = { x, y } (Mittelpunkt des Kreises, Weltkoordinaten)
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  return { x: closestX, y: closestY };
}

/**
 * Findet alle Elemente, deren Bounding Box den gegebenen Kreis berührt oder schneidet.
 * @param {Array<Object>} elements - Liste aller Elemente auf dem Canvas.
 * Jedes Element muss element.position = {x, y} und element.size = {width, height} haben.
 * @param {Object} circleCenter - Mittelpunkt des Kreises { x, y } in Weltkoordinaten.
 * @param {number} radius - Radius des Kreises in Weltkoordinaten.
 * @returns {Array<Object>} - Eine Liste der Elemente, die den Kreis berühren.
 */
export const getElementsInCircle = (elements, circleCenter, radius) => {
  if (!Array.isArray(elements) || !circleCenter || typeof radius !== 'number' || radius <= 0) {
    console.warn("getElementsInCircle: Ungültige Eingabeparameter.");
    return [];
  }

  return elements.filter(element => {
    // Stelle sicher, dass das Element die benötigten Eigenschaften hat
    if (!element || typeof element.position?.x !== 'number' || typeof element.position?.y !== 'number' ||
        typeof element.size?.width !== 'number' || typeof element.size?.height !== 'number') {
      // console.warn("getElementsInCircle: Element übersprungen, ungültige Struktur:", element);
      return false;
    }

    const elRect = {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
    };

    // 1. Prüfe, ob der Mittelpunkt des Kreises innerhalb des Rechtecks liegt.
    // (Dies ist eine schnelle Überprüfung für vollständige Überlappung)
    if (circleCenter.x >= elRect.x && circleCenter.x <= elRect.x + elRect.width &&
        circleCenter.y >= elRect.y && circleCenter.y <= elRect.y + elRect.height) {
      return true;
    }

    // 2. Finde den dem Kreismittelpunkt am nächsten gelegenen Punkt auf dem Rand des Rechtecks.
    const closestPt = closestPointOnRectToPoint(elRect, circleCenter);

    // 3. Berechne die Distanz vom Kreismittelpunkt zu diesem nächsten Punkt.
    const dx = circleCenter.x - closestPt.x;
    const dy = circleCenter.y - closestPt.y;
    const distanceSquared = (dx * dx) + (dy * dy);

    // 4. Wenn die quadrierte Distanz kleiner oder gleich dem quadrierten Radius ist, gibt es eine Kollision.
    return distanceSquared <= (radius * radius);
  });
};
