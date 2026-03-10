import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BaseEdge, getBezierPath, getStraightPath, getSmoothStepPath, useReactFlow } from 'reactflow';
import { AlignJustify, Spline, Slash, ArrowLeftRight, Ban } from 'lucide-react';

// 👇 1. ICONO PERSONALIZADO PARA "CIRCUITO" 👇
const CircuitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 16 12 16 12 8 20 8" />
  </svg>
);

// 👇 2. SISTEMA DE ICONOS DE CANVA PARA LOS MENÚS 👇
const MarkerIcon = ({ type }) => {
  switch(type) {
    case 'bar': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="20" y1="6" x2="20" y2="18"/></svg>;
    case 'arrow-open': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>;
    case 'arrow-closed': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="16" y2="12"/><polygon points="14 6 22 12 14 18" fill="currentColor"/></svg>;
    case 'circle-open': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="16" y2="12"/><circle cx="19" cy="12" r="3"/></svg>;
    case 'circle-closed': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="16" y2="12"/><circle cx="19" cy="12" r="3" fill="currentColor"/></svg>;
    case 'square-open': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="15" y2="12"/><rect x="15" y="9" width="6" height="6"/></svg>;
    case 'square-closed': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="15" y2="12"/><rect x="15" y="9" width="6" height="6" fill="currentColor"/></svg>;
    case 'diamond-open': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="14" y2="12"/><polygon points="19 7 23 12 19 17 15 12"/></svg>;
    case 'diamond-closed': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="14" y2="12"/><polygon points="19 7 23 12 19 17 15 12" fill="currentColor"/></svg>;
    default: return <Ban size={14} className="opacity-50" />;
  }
};


export default function GradientEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, selected }) {
  const { setEdges } = useReactFlow();
  const [activeTab, setActiveTab] = useState(null);

  const color = data?.color || '#ffffff'; 
  const thickness = data?.thickness || 3;
  const isDashed = data?.isDashed || false;
  const routing = data?.routing || 'bezier';
  const startMarkerType = data?.startMarker || 'none'; 
  const endMarkerType = data?.endMarker || 'arrow-closed';    
  const opacity = data?.opacity || 1;

  // Motor de arranque
  useEffect(() => {
    if (data?.initialized === undefined) {
      setEdges((eds) => eds.map((e) => e.id === id ? { ...e, data: { ...e.data, initialized: true, endMarker: 'arrow-closed', startMarker: 'none', color: color } } : e));
    }
  }, [id, data?.initialized, color, setEdges]);

  const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
  let edgePath;
  if (routing === 'straight') [edgePath] = getStraightPath(pathParams);
  else if (routing === 'step') [edgePath] = getSmoothStepPath({ ...pathParams, borderRadius: 12 });
  else [edgePath] = getBezierPath(pathParams);

  const updateEdge = (updates) => {
    setEdges((eds) => eds.map((e) => e.id === id ? { ...e, data: { ...e.data, ...updates } } : e));
  };

  const swapDirection = () => updateEdge({ startMarker: endMarkerType, endMarker: startMarkerType });

  const PALETTE = ['#ffffff', '#ef4444', '#10b981', '#06b6d4', '#ec4899'];
  
  // Listas de las formas de las puntas para renderizar la cuadrícula
  const markerRow1 = ['none', 'arrow-open', 'circle-open', 'square-open', 'diamond-open'];
  const markerRow2 = ['bar', 'arrow-closed', 'circle-closed', 'square-closed', 'diamond-closed'];

  return (
    <>
      {/* 👇 3. EL DICCIONARIO DE PUNTAS (Crea los vectores SVG reales en la pizarra) 👇 */}
      <defs>
        <marker id={`arrow-closed-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill={color} /></marker>
        <marker id={`arrow-open-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polyline points="1,1 9,5 1,9" fill="none" stroke={color} strokeWidth="1.5" /></marker>
        <marker id={`circle-closed-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><circle cx="5" cy="5" r="4" fill={color} /></marker>
        <marker id={`circle-open-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><circle cx="5" cy="5" r="3" fill="#0B0F17" stroke={color} strokeWidth="2" /></marker>
        <marker id={`square-closed-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><rect x="1" y="1" width="8" height="8" fill={color} /></marker>
        <marker id={`square-open-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><rect x="2" y="2" width="6" height="6" fill="#0B0F17" stroke={color} strokeWidth="2" /></marker>
        <marker id={`diamond-closed-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="5,0 10,5 5,10 0,5" fill={color} /></marker>
        <marker id={`diamond-open-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="5,1 9,5 5,9 1,5" fill="#0B0F17" stroke={color} strokeWidth="2" /></marker>
        <marker id={`bar-${id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><line x1="5" y1="0" x2="5" y2="10" stroke={color} strokeWidth="2" /></marker>
      </defs>

      <BaseEdge
        path={edgePath}
        markerStart={startMarkerType !== 'none' ? `url(#${startMarkerType}-${id})` : undefined}
        markerEnd={endMarkerType !== 'none' ? `url(#${endMarkerType}-${id})` : undefined}
        style={{
          ...style, strokeWidth: thickness, stroke: color, opacity: opacity,
          strokeDasharray: isDashed ? '8 6' : 'none',
          filter: `drop-shadow(0px 0px 4px ${color}) drop-shadow(0px 0px 1px rgba(255,255,255,0.4))`,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease, filter 0.3s ease'
        }}
      />

      {selected && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'all', zIndex: 99999 }}
          className="nodrag nopan flex flex-col items-center"
        >
          {activeTab && (
            <div className="mb-2 bg-[#141923] border border-slate-700 p-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              
              {activeTab === 'color' && (
                <div className="flex items-center gap-2">
                  {PALETTE.map((c) => (
                    <button key={c} onClick={() => updateEdge({ color: c })} className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-slate-400 ring-offset-2 ring-offset-[#141923]' : 'hover:scale-110'}`} style={{ backgroundColor: c, boxShadow: `0 0 5px ${c}` }} />
                  ))}
                  <div className="w-px h-4 bg-slate-700 mx-1" />
                  <label className="cursor-pointer w-6 h-6 rounded-full border border-slate-500 overflow-hidden relative shadow-inner hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                    <input type="color" value={color} onChange={(e) => updateEdge({ color: e.target.value })} className="absolute opacity-0 w-full h-full cursor-pointer" />
                  </label>
                </div>
              )}

              {activeTab === 'style' && (
                <>
                  <div className="flex bg-[#0B0F17] rounded p-1 border border-slate-800">
                    <button onClick={() => updateEdge({ thickness: 2 })} className={`w-8 h-6 flex items-center justify-center rounded ${thickness === 2 ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}><div className="w-4 h-[2px] bg-current rounded-full"/></button>
                    <button onClick={() => updateEdge({ thickness: 4 })} className={`w-8 h-6 flex items-center justify-center rounded ${thickness === 4 ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}><div className="w-4 h-[4px] bg-current rounded-full"/></button>
                    <button onClick={() => updateEdge({ thickness: 7 })} className={`w-8 h-6 flex items-center justify-center rounded ${thickness === 7 ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}><div className="w-4 h-[7px] bg-current rounded-full"/></button>
                  </div>
                  <div className="w-px h-5 bg-slate-700 mx-1" />
                  <button onClick={() => updateEdge({ isDashed: !isDashed })} className={`px-2 py-1 rounded text-xs font-bold tracking-widest transition-colors ${isDashed ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[#0B0F17] text-slate-400 border border-slate-800 hover:text-white'}`}>- - -</button>
                </>
              )}

              {/* 👇 4. MENÚS DE PUNTAS CON LA CUADRÍCULA ESTILO CANVA 👇 */}
              {activeTab === 'startMarker' && (
                <div className="flex flex-col gap-1 bg-[#0B0F17] p-1 border border-slate-800 rounded">
                  <div className="flex gap-1">
                    {markerRow1.map(type => (
                      <button key={type} onClick={() => updateEdge({ startMarker: type })} className={`p-1.5 rounded transition-colors ${startMarkerType === type ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <div className="rotate-180"><MarkerIcon type={type} /></div>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {markerRow2.map(type => (
                      <button key={type} onClick={() => updateEdge({ startMarker: type })} className={`p-1.5 rounded transition-colors ${startMarkerType === type ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <div className="rotate-180"><MarkerIcon type={type} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'endMarker' && (
                <div className="flex flex-col gap-1 bg-[#0B0F17] p-1 border border-slate-800 rounded">
                  <div className="flex gap-1">
                    {markerRow1.map(type => (
                      <button key={type} onClick={() => updateEdge({ endMarker: type })} className={`p-1.5 rounded transition-colors ${endMarkerType === type ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <MarkerIcon type={type} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {markerRow2.map(type => (
                      <button key={type} onClick={() => updateEdge({ endMarker: type })} className={`p-1.5 rounded transition-colors ${endMarkerType === type ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <MarkerIcon type={type} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'routing' && (
                <div className="flex gap-1">
                  <button onClick={() => updateEdge({ routing: 'bezier' })} className={`p-1.5 rounded transition-colors ${routing === 'bezier' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`} title="Curva"><Spline size={16} /></button>
                  <button onClick={() => updateEdge({ routing: 'straight' })} className={`p-1.5 rounded transition-colors ${routing === 'straight' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`} title="Recta"><Slash size={16} /></button>
                  <button onClick={() => updateEdge({ routing: 'step' })} className={`p-1.5 rounded transition-colors ${routing === 'step' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`} title="Circuito"><CircuitIcon /></button>
                </div>
              )}

              {activeTab === 'transparency' && (
                <div className="flex items-center gap-3 px-2">
                  <span className="text-xs font-medium text-slate-400 w-8">{(opacity * 100).toFixed(0)}%</span>
                  <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => updateEdge({ opacity: parseFloat(e.target.value) })} className="w-24 accent-cyan-500 cursor-pointer" />
                </div>
              )}
            </div>
          )}

          {/* BARRA PRINCIPAL */}
          <div className="bg-[#0B0F17]/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center gap-1">
            
            <button onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')} className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${activeTab === 'color' ? 'bg-slate-800' : ''}`} title="Color">
              <div className="w-4 h-4 rounded-full border border-slate-600" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
            </button>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <button onClick={() => setActiveTab(activeTab === 'style' ? null : 'style')} className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${activeTab === 'style' ? 'bg-slate-800 text-white' : ''}`} title="Grosor y estilo">
              <AlignJustify size={16} />
            </button>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <button onClick={() => setActiveTab(activeTab === 'startMarker' ? null : 'startMarker')} className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${activeTab === 'startMarker' ? 'bg-slate-800 text-white' : ''}`} title="Inicio de línea">
              <div className="rotate-180"><MarkerIcon type={startMarkerType} /></div>
            </button>

            <button onClick={() => setActiveTab(activeTab === 'endMarker' ? null : 'endMarker')} className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${activeTab === 'endMarker' ? 'bg-slate-800 text-white' : ''}`} title="Fin de línea">
              <MarkerIcon type={endMarkerType} />
            </button>

            <button onClick={swapDirection} className="p-1.5 rounded-md text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors" title="Invertir dirección">
              <ArrowLeftRight size={16} />
            </button>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <button onClick={() => setActiveTab(activeTab === 'routing' ? null : 'routing')} className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${activeTab === 'routing' ? 'bg-slate-800 text-white' : ''}`} title="Forma de línea">
              {routing === 'straight' ? <Slash size={16} /> : routing === 'step' ? <CircuitIcon /> : <Spline size={16} />}
            </button>

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <button onClick={() => setActiveTab(activeTab === 'transparency' ? null : 'transparency')} className={`p-1.5 px-2 rounded-md text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${activeTab === 'transparency' ? 'bg-slate-800 text-white' : ''}`} title="Transparencia">
              {(opacity * 100).toFixed(0)}%
            </button>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}