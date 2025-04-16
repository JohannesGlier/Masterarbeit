import React, { useRef, useEffect, useState } from "react";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import openAIService from '@/services/OpenAIService';

const getColorForCluster = (clusterId) => {
  if (clusterId === -1) return '#888888'; // Grau für Rauschen
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
  return colors[clusterId % colors.length];
};

const AutoLayoutTool = ({
  isAutoLayoutRunning,
  textcards,
}) => {
  const { setSelectedTool } = useCanvas();
  const hasRunForThisMount = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutData, setLayoutData] = useState(null);

  const forceCursor = (style) => {
    document.body.style.cursor = style;
    document.body.style.pointerEvents = "none";
  };

  const handleFetchEmbeddings = async () => {
    if (isLoading || layoutData) return; 

    setIsLoading(true);
    setLayoutData(null); // Alte Daten löschen beim Neustart
    forceCursor("wait");

    try {
      // Rufe den Service auf, um Embeddings für die aktuellen Karten zu holen
      const results = await openAIService.getEmbeddingsForCards(textcards);
      console.log("Embeddings received in component:", results);

      // 1. Clustering auf Basis der 'embedding'-Vektoren durchführen
      const embeddings = Array.isArray(results) ? results.map(item => item.embedding) : [];
      console.log("Embeddings:", embeddings);

      const epsilon = 1.08;  // neighborhood radius --> Dies ist der Radius der Nachbarschaft um einen Datenpunkt. Ein größerer Wert bedeutet, dass mehr Punkte als Nachbarn betrachtet werden
      const minPoints = 1;  // number of points in neighborhood to form a cluster --> Dies ist die Mindestanzahl von Punkten, die in der Nachbarschaft eines Kernpunkts liegen müssen, um einen Cluster zu bilden
     
      var clustering = require('density-clustering');
      var dbscan = new clustering.DBSCAN();
      var clusters = dbscan.run(embeddings, epsilon, minPoints);
      console.log(clusters, dbscan.noise);

      const clusteredText = {};
      clusters.forEach((cluster, clusterIndex) => {
        clusteredText[clusterIndex] = cluster.map(index => results[index].text);
      });
      console.log("Geclusterte Texte:", clusteredText);

      // 2. Layout basierend auf den Clustern berechnen
      const d3 = require('d3-force');

      const nodeClusterIds = {};
      clusters.forEach((cluster, clusterIndex) => {
          cluster.forEach(index => {
              nodeClusterIds[index] = clusterIndex;
          });
      });
      // Rauschpunkte bekommen eine spezielle ID (z.B. -1)
      dbscan.noise.forEach(index => {
          nodeClusterIds[index] = -1; // Kennzeichnung als Rauschen
      });


      // 2.2 Nodes für D3 vorbereiten
      // Jeder Node braucht eine eindeutige ID (wir verwenden den Index) und die Cluster-ID
      const nodes = results.map((item, index) => ({
          id: index, // Verwende den originalen Index als ID
          text: item.text,
          clusterId: nodeClusterIds[index] !== undefined ? nodeClusterIds[index] : -1 // Standardmäßig Rauschen, falls nicht gefunden
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
                      target: cluster[j]  // ID des Zielknotens (Index)
                  });
              }
          }
      });
      console.log("D3 Links:", links);


      // 2.4 D3 Force Simulation konfigurieren
      const width = 600; // Beispiel: Breite des Layout-Bereichs
      const height = 400; // Beispiel: Höhe des Layout-Bereichs

      const simulation = d3.forceSimulation(nodes)
          // Kraft 1: Links (Anziehung innerhalb der Cluster)
          .force("link", d3.forceLink(links)
                          .id(d => d.id) // Sagt D3, wie die Node-ID im Link gefunden wird
                          .strength(0.1) // Stärke der Anziehung (Anpassen!) - Stärker = dichtere Cluster
                          // .distance(30) // Optional: versucht einen bestimmten Abstand zu halten
          )
          // Kraft 2: Abstoßung zwischen ALLEN Knoten
          .force("charge", d3.forceManyBody()
                            .strength(-100) // Stärke der Abstoßung (Anpassen!) - Größerer negativer Wert = mehr Abstand
          )
          // Kraft 3: Zentriert das gesamte Layout
          .force("center", d3.forceCenter(width / 2, height / 2));

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
      const layoutResults = nodes.map(node => ({
          id: node.id,
          text: node.text,
          clusterId: node.clusterId,
          x: node.x,
          y: node.y
      }));

      console.log("Layout Ergebnisse (Koordinaten):", layoutResults);
      setLayoutData(layoutResults);
    } catch (err) {
      console.error("Fehler beim Abrufen der Embeddings:", err);
      setLayoutData(null);
    } finally {
      console.log("Finished: Resetting states");
      setIsLoading(false);
      forceCursor("auto"); 
      //setSelectedTool("Pointer");
    }
  };

  useEffect(() => {
    console.log("AutoLayoutTool Effect triggered.");

    if (isAutoLayoutRunning) {
      console.log("Effect skipped: AutoLayout is already running globally.");
      return;
    }

    if (hasRunForThisMount.current) {
      console.log("Effect skipped: Already ran for this specific mount instance.");
      return;
    }

    console.log("Effect condition met: Starting performAutoLayout.");
    hasRunForThisMount.current = true;
    handleFetchEmbeddings();

    return () => {
      console.log("AutoLayoutTool Cleanup (Unmount)");
      forceCursor("auto");
    };
  }, []);

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Calculating Layout... (Cursor: wait)</div>;
  }

  // Zeige nichts, wenn keine Daten vorhanden sind (oder ein Platzhalter)
  if (!layoutData) {
      return null; // Oder: <div>Ready to calculate layout.</div>;
  }

  const renderWidth = 800; // Breite für das Rendering
  const renderHeight = 600; // Höhe für das Rendering

  // Berechne die Grenzen der Daten
  const xValues = layoutData.map(point => point.x);
  const yValues = layoutData.map(point => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  // Berechne Skalierungsfaktoren und Verschiebungen
  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;
  const scaleX = dataWidth ? (renderWidth - 20) / dataWidth : 1; // 20px padding
  const scaleY = dataHeight ? (renderHeight - 20) / dataHeight : 1;
  const scale = Math.min(scaleX, scaleY); // Gleichmäßige Skalierung beibehalten

  // Mittelpunkt der Daten
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Transformationsfunktion für die Punkte
  const transformPoint = (x, y) => {
    const scaledX = (x - centerX) * scale + renderWidth / 2;
    const scaledY = (y - centerY) * scale + renderHeight / 2;
    return { x: scaledX, y: scaledY };
  };

  return (
    <div style={{ 
      border: '1px solid lightblue', 
      width: renderWidth, 
      height: renderHeight, 
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      overflow: 'hidden',
      margin: '10px' 
    }}>
      <svg width={renderWidth} height={renderHeight}>
        <g> {/* Gruppe für die Punkte */}
          {layoutData.map((point) => {
            const transformed = transformPoint(point.x, point.y);
            return (
              <circle
                key={point.id}
                cx={transformed.x}
                cy={transformed.y}
                r={5}
                fill={getColorForCluster(point.clusterId)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => { e.target.style.opacity = 0.7; }}
                onMouseLeave={(e) => { e.target.style.opacity = 1; }}
              >
                <title>{`ID: ${point.id}\nText: ${point.text}\nCluster: ${point.clusterId}\nPos: (${Math.round(point.x)}, ${Math.round(point.y)})`}</title>
              </circle>
            );
          })}
        </g>
      </svg>
      <div style={{ position: 'absolute', top: 5, left: 5, fontSize: '10px', background: 'rgba(255,255,255,0.7)', padding: '2px' }}>
        Layout Calculated ({layoutData.length} points)
      </div>
    </div>
  );
};

export default AutoLayoutTool;
