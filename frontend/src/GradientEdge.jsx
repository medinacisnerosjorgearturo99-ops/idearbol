import React from 'react';
import { BaseEdge, getBezierPath, getStraightPath, getSmoothStepPath } from 'reactflow';

export default function GradientEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) {
  // 1. Elegimos qué fórmula matemática usar para dibujar la línea
  const shape = data?.shape || 'bezier'; 
  
  const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
  let edgePath = '';

  if (shape === 'straight') [edgePath] = getStraightPath(pathParams);
  else if (shape === 'smoothstep') [edgePath] = getSmoothStepPath(pathParams); // El circuito
  else [edgePath] = getBezierPath(pathParams); // La curva clásica (por defecto)

  // 2. Colores mágicos
  const sourceColor = data?.sourceColor || '#6366f1';
  const targetColor = data?.targetColor || '#cff7e9';

  return (
    <>
      {/* Definimos el degradado de color */}
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      
      {/* La línea brillante */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: `url(#gradient-${id})`,
          strokeWidth: 4, // El grosor de la línea
          filter: `drop-shadow(0 0 5px ${sourceColor}80)`, // El brillo de neón
        }}
        className="react-flow__edge-path transition-all duration-300"
      />
      
      {/* Una línea invisible más gruesa encima para que sea fácil darle clic */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction cursor-pointer"
      />
    </>
  );
}