import React from 'react';
import { Handle, Position } from 'reactflow';
import { Folder, MessageCircle } from 'lucide-react';

export default function NetworkNode({ data, selected }) {
  const isGroup = data.type === 'grupo';
  const color = isGroup ? '#10b981' : '#6366f1'; 

  const handleStyle = {
    width: '10px', height: '10px', backgroundColor: '#0B0F17',
    border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}, 0 0 5px ${color} inset`,
    transition: 'all 0.2s ease'
  };

  return (
    <div className={`bg-[#141923] border ${selected ? 'border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-slate-700/80'} rounded-xl shadow-2xl overflow-hidden min-w-[180px] transition-all`}>
      
      {/* ¡EL TRUCO: AHORA LOS 4 PUNTOS SON "SOURCE"! */}
      <Handle type="source" position={Position.Top} id="top" style={{ ...handleStyle, top: '-5px' }} className="hover:scale-150" />
      <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: '-5px' }} className="hover:scale-150" />
      
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2">
        {isGroup ? <Folder size={16} color={color} className="fill-emerald-500/20" /> : <MessageCircle size={16} color={color} className="fill-indigo-500/20" />}
        <span className="text-sm font-semibold text-slate-200">{data.label || 'Sin título'}</span>
      </div>
      
      <div className="px-4 py-2 bg-[#0B0F17]/80">
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">{isGroup ? 'Grupo' : 'Idea'}</span>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: '-5px' }} className="hover:scale-150" />
      <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: '-5px' }} className="hover:scale-150" />
    </div>
  );
}