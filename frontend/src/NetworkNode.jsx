import React, { useState } from 'react'; // 👈 1. Agregamos useState
import { Handle, Position, useReactFlow } from 'reactflow'; // 👈 2. Agregamos useReactFlow
import { Folder, MessageCircle, ListChecks } from 'lucide-react'; // 👈 3. Agregamos ListChecks

// 👇 4. Le pedimos que reciba el 'id' también 👇
export default function NetworkNode({ id, data, selected }) {
  const isGroup = data.type === 'grupo';
  const color = isGroup ? '#10b981' : '#6366f1'; 

  // 👇 5. ESTADOS Y MAGIA DEL CHECKLIST (Igual que en CustomNode) 👇
  const [isExpanded, setIsExpanded] = useState(false);
  const { setNodes } = useReactFlow();

  const toggleSubIdea = (ideaId) => {
    if (!data.subIdeas) return;
    const actualizadas = data.subIdeas.map(sub =>
      sub.id === ideaId ? { ...sub, completed: !sub.completed } : sub
    );
    actualizadas.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    
    // Actualizamos solo visualmente en la pizarra de conexiones
    setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, subIdeas: actualizadas } } : n));
  };

  const handleStyle = {
    width: '10px', height: '10px', backgroundColor: '#0B0F17',
    border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}, 0 0 5px ${color} inset`,
    transition: 'all 0.2s ease'
  };

  return (
    <div className={`bg-[#141923] border ${selected ? 'border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-slate-700/80'} rounded-xl shadow-2xl overflow-hidden min-w-[200px] transition-all`}>
      
      {/* ¡EL TRUCO: AHORA LOS 4 PUNTOS SON "SOURCE"! */}
      <Handle type="source" position={Position.Top} id="top" style={{ ...handleStyle, top: '-5px' }} className="hover:scale-150" />
      <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: '-5px' }} className="hover:scale-150" />
      
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2">
        {isGroup ? <Folder size={16} color={color} className="fill-emerald-500/20" /> : <MessageCircle size={16} color={color} className="fill-indigo-500/20" />}
        <span className="text-sm font-semibold text-slate-200">{data.label || 'Sin título'}</span>
      </div>

      {/* 👇 6. ¡AQUÍ ESTÁ EL BLOQUE DE LAS SUB-IDEAS! 👇 */}
      {!isGroup && data.subIdeas && data.subIdeas.length > 0 && (
        <div className="px-4 py-3 bg-[#141923] space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 mb-2">
            <ListChecks size={12} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Sub-ideas</span>
          </div>
          
          {(isExpanded ? data.subIdeas : data.subIdeas.slice(0, 3)).map(idea => (
            <div 
              key={idea.id} 
              className="flex items-center gap-2 bg-[#0B0F17] p-1.5 rounded border border-slate-800"
              style={{ borderLeft: idea.color ? `3px solid ${idea.color}` : '1px solid #1e293b' }}
            >
              {data.isChecklist ? (
                <input 
                  type="checkbox" 
                  checked={idea.completed || false} 
                  onChange={() => toggleSubIdea(idea.id)} 
                  className="h-3 w-3 accent-indigo-500 border-slate-700 cursor-pointer shrink-0" 
                />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mx-1" />
              )}
              <span className={`text-[11px] truncate flex-1 transition-all ${data.isChecklist && idea.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                {idea.text}
              </span>
            </div>
          ))}
          
          {data.subIdeas.length > 3 && (
            <button 
              onClick={(e) => {
                e.stopPropagation(); 
                setIsExpanded(!isExpanded);
              }}
              className="w-full mt-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors text-center py-1.5 hover:bg-indigo-500/10 rounded-md"
            >
              {isExpanded ? 'Ocultar' : `Ver ${data.subIdeas.length - 3} más...`}
            </button>
          )}
        </div>
      )}
      {/* 👆 FIN DEL BLOQUE DE SUB-IDEAS 👆 */}

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: '-5px' }} className="hover:scale-150" />
      <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: '-5px' }} className="hover:scale-150" />
    </div>
  );
}