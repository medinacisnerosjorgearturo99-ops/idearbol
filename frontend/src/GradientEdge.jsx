import React from 'react';
import { getBezierPath } from 'reactflow';

export default function GradientEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data
}) {
  // Genera la curva perfecta y flexible
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  // Recibe los colores dinámicos (o usa los por defecto si fallan)
  const color1 = data?.sourceColor || '#10b981'; // Esmeralda
  const color2 = data?.targetColor || '#6366f1'; // Índigo

  return (
    <>
      <defs>
        {/* El gradiente que mapea exactamente de la coordenada de inicio a la de fin */}
        <linearGradient id={`grad-${id}`} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        
        {/* Filtro para el brillo (Glow) de la línea */}
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* La línea renderizada en el lienzo */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={`url(#grad-${id})`}
        strokeWidth={2.5}
        fill="none"
        filter={`url(#glow-${id})`}
      />
    </>
  );
}