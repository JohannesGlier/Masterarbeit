import React, { useRef, useEffect, useState } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import openAIService from "@/services/OpenAIService";

const getColorForCluster = (clusterId) => {
  if (clusterId === -1) return "#888888"; // Grau für Rauschen
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];
  return colors[clusterId % colors.length];
};

const AutoLayoutTool = ({ isAutoLayoutRunning, textcards, addTextcard, addRectangle }) => {
  const { setSelectedTool, setHeadingGeneration } = useCanvas();
  const hasRunForThisMount = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = "auto";
  };

  const handleFetchEmbeddings = async () => {
    if (isLoading) return;

    console.log("Hier");
    setIsLoading(true);
    forceCursor("wait");

    if (textcards.length < 5) {
      console.log("Not enough Textcards for Auto Layout");
      setIsLoading(false);
      forceCursor("");
      setSelectedTool("Pointer");
      return;
    }
    try {
        // Rufe den Service auf, um Embeddings für die aktuellen Karten zu holen
        const results = await openAIService.getEmbeddingsForCards(textcards);
        console.log("Embeddings received in component:", results);

        // 1. Clustering auf Basis der 'embedding'-Vektoren durchführen
        const embeddings = Array.isArray(results)
          ? results.map((item) => item.embedding)
          : [];
        console.log("Embeddings:", embeddings);

        const epsilon = 1.08; // neighborhood radius --> Dies ist der Radius der Nachbarschaft um einen Datenpunkt. Ein größerer Wert bedeutet, dass mehr Punkte als Nachbarn betrachtet werden
        const minPoints = 1; // number of points in neighborhood to form a cluster --> Dies ist die Mindestanzahl von Punkten, die in der Nachbarschaft eines Kernpunkts liegen müssen, um einen Cluster zu bilden

        var clustering = require("density-clustering");
        var dbscan = new clustering.DBSCAN();
        var clusters = dbscan.run(embeddings, epsilon, minPoints);
        console.log(clusters, dbscan.noise);

        const clusteredText = {};
        clusters.forEach((cluster, clusterIndex) => {
          clusteredText[clusterIndex] = cluster.map(
            (index) => results[index].text
          );
        });
        console.log("Geclusterte Texte:", clusteredText);

        // 2. Layout basierend auf den Clustern berechnen
        const d3 = require("d3-force");

        const nodeClusterIds = {};
        clusters.forEach((cluster, clusterIndex) => {
          cluster.forEach((index) => {
            nodeClusterIds[index] = clusterIndex;
          });
        });
        // Rauschpunkte bekommen eine spezielle ID (z.B. -1)
        dbscan.noise.forEach((index) => {
          nodeClusterIds[index] = -1; // Kennzeichnung als Rauschen
        });

        // 2.2 Nodes für D3 vorbereiten
        // Jeder Node braucht eine eindeutige ID (wir verwenden den Index) und die Cluster-ID
        const nodes = results.map((item, index) => ({
          id: index, // Verwende den originalen Index als ID
          text: item.text,
          clusterId:
            nodeClusterIds[index] !== undefined ? nodeClusterIds[index] : -1, // Standardmäßig Rauschen, falls nicht gefunden
        }));
        console.log("D3 Nodes:", nodes);

        // 2.3 Links für D3 vorbereiten (nur innerhalb von Clustern)
        const links = [];
        clusters.forEach((cluster) => {
          // Erstelle Links zwischen allen Knotenpaaren innerhalb dieses Clusters
          for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
              links.push({
                source: cluster[i], // ID des Quellknotens (Index)
                target: cluster[j], // ID des Zielknotens (Index)
              });
            }
          }
        });
        console.log("D3 Links:", links);

        // 2.4 D3 Force Simulation konfigurieren
        const width = 1500; // Beispiel: Breite des Layout-Bereichs
        const height = 1200; // Beispiel: Höhe des Layout-Bereichs

        const simulation = d3
          .forceSimulation(nodes)
          // Kraft 1: Links (Anziehung innerhalb der Cluster)
          .force(
            "link",
            d3
              .forceLink(links)
              .id((d) => d.id) // Sagt D3, wie die Node-ID im Link gefunden wird
              .strength(0.7) // Stärke der Anziehung (Anpassen!) - Stärker = dichtere Cluster
            // .distance(30) // Optional: versucht einen bestimmten Abstand zu halten
          )
          // Kraft 2: Abstoßung zwischen ALLEN Knoten
          .force(
            "charge",
            d3.forceManyBody().strength(-400) // Stärke der Abstoßung (Anpassen!) - Größerer negativer Wert = mehr Abstand
          )
          // Kraft 3: Zentriert das gesamte Layout
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force(
            "collision",
            d3
              .forceCollide()
              .radius((d) => 100) // Radius ≈ halbe Diagonale der Textkarte (√(200²+75²)/2 ≈ 109)
              .strength(0.05)
          )
          .force(
            "cluster",
            d3
              .forceY()
              .strength(0.05)
              .y((d) => {
                // Jeder Cluster bekommt eine vertikale Zone
                const clusterZones = { 0: height * 0.3, 1: height * 0.7 };
                return clusterZones[d.clusterId] || height / 2;
              })
          );

        // 2.5 Simulation laufen lassen (synchron, da wir keine Visualisierung machen)
        // D3 läuft normalerweise asynchron. Um die finalen Koordinaten zu bekommen,
        // stoppen wir die automatischen Ticks und lassen sie manuell laufen.
        simulation.stop();

        // Anzahl der Iterationen (Ticks) - 300 ist oft ein guter Startwert
        const nTicks = 300;
        for (let i = 0; i < nTicks; ++i) {
          simulation.tick();
        }

        console.log("Simulation abgeschlossen.");

        // 2.6 Koordinaten extrahieren
        // Die 'x' und 'y' Eigenschaften wurden den Node-Objekten hinzugefügt
        const layoutResults = nodes.map((node) => ({
          id: node.id,
          text: node.text,
          clusterId: node.clusterId,
          x: node.x,
          y: node.y,
        }));

        console.log("Layout Ergebnisse (Koordinaten):", layoutResults);

        const clusterMap = {};

        layoutResults.forEach((layoutItem) => {
          const finalTextcard = {
            x: layoutItem.x,
            y: layoutItem.y,
            width: 150,
            height: 75,
            text: layoutItem.text,
          };
          addTextcard(finalTextcard);

          // Gruppiere Textkarten nach ClusterId für die Rechteckberechnung
          if (!clusterMap[layoutItem.clusterId]) {
            clusterMap[layoutItem.clusterId] = [];
          }
          clusterMap[layoutItem.clusterId].push(finalTextcard);
        });

        // Padding für die Rechtecke
        const padding = 20;

        // Iteriere über die Cluster und erstelle Rechtecke
        for (const clusterId in clusterMap) {
          if (clusterMap.hasOwnProperty(clusterId)) {
            const clusterTextcards = clusterMap[clusterId];

            if (clusterTextcards.length > 0) {
              // Initialisiere min und max Werte mit dem ersten Element
              let minX = clusterTextcards[0].x;
              let minY = clusterTextcards[0].y;
              let maxX = clusterTextcards[0].x + clusterTextcards[0].width;
              let maxY = clusterTextcards[0].y + clusterTextcards[0].height;

              // Finde die tatsächlichen min und max Koordinaten aller Textkarten im Cluster
              clusterTextcards.forEach((textcard) => {
                minX = Math.min(minX, textcard.x);
                minY = Math.min(minY, textcard.y);
                maxX = Math.max(maxX, textcard.x + textcard.width);
                maxY = Math.max(maxY, textcard.y + textcard.height);
              });

              // Berechne die Größe und Position des Rechtecks mit Padding
              const rectX = minX - padding;
              const rectY = minY - padding;
              const rectWidth = maxX - minX + 2 * padding;
              const rectHeight = maxY - minY + 2 * padding;

              // Erstelle das Rechteck
              const finalRect = {
                x: rectX,
                y: rectY,
                width: rectWidth,
                height: rectHeight,
                heading: "",
              };
              const rectId = addRectangle(finalRect);

              const textFromCluster = clusterTextcards.map((textcard) => textcard.text);
              //const text = JSON.stringify(textFromCluster, null, 2)

              console.log("Text from Cluster", textFromCluster);
              setHeadingGeneration(prev => ({
                ...prev,
                [rectId]: { // Verwende die rectId als Schlüssel
                  generateHeading: true,
                  text: textFromCluster,
                },
              }));
            }
          }
        }
    } catch (err) {
      console.error("Fehler beim Abrufen der Embeddings:", err);
    } finally {
      console.log("Finished: Resetting states");
      setIsLoading(false);
      forceCursor("auto");
      setSelectedTool("Pointer");
    }
  };

  useEffect(() => {
    let frameId;

    const persistentCursorUpdate = () => {
      if (isLoading) {
        console.log("Hier");
        forceCursor("wait");
      }
      frameId = requestAnimationFrame(persistentCursorUpdate);
    };

    persistentCursorUpdate();

    return () => {
      cancelAnimationFrame(frameId);
      forceCursor("");
    };
  }, [isLoading, forceCursor]);

  useEffect(() => {
    console.log("AutoLayoutTool Effect triggered.");

    if (isAutoLayoutRunning) {
      console.log("Effect skipped: AutoLayout is already running globally.");
      return;
    }

    if (hasRunForThisMount.current) {
      console.log(
        "Effect skipped: Already ran for this specific mount instance."
      );
      return;
    }

    console.log("Effect condition met: Starting performAutoLayout.");
    hasRunForThisMount.current = true;
    handleFetchEmbeddings();

    return () => {
      console.log("AutoLayoutTool Cleanup (Unmount)");
    };
  }, []);

  return null;
};

export default AutoLayoutTool;
