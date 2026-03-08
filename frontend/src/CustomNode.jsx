import React from 'react';
import { Folder, MessageSquare, ListChecks, Edit3 } from 'lucide-react';
import { Handle, Position } from 'reactflow'; // <-- Herramientas para los puntitos

const hexToRGB = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `${r}, ${g}, ${b}`;
};

// 👇 Agregamos 'isConnectable' a las propiedades de la función
export default function CustomNode({ id, data, selected, isConnectable }) {
  const isGroup = data.type === 'grupo';
  const subIdeas = data.subIdeas || [];
  
  const defaultColor = isGroup ? '#10b981' : '#3b82f6';
  const activeColor = data.color || defaultColor;
  
  const rgbColor = hexToRGB(activeColor);

  const headerStyle = {
    backgroundColor: `rgba(${rgbColor}, 0.1)`,
    color: `rgb(${rgbColor})`,
    borderBottomColor: `rgba(${rgbColor}, 0.2)`
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); 
    window.dispatchEvent(new CustomEvent('openEditModal', { detail: id }));
  };

  return (
    <div className={`group bg-[#141923] border rounded-xl shadow-2xl min-w-[260px] max-w-[300px] overflow-hidden transition-all duration-500 origin-center ${
      data.isAbsorbing 
        ? 'scale-0 opacity-0' /* 👈 SI ESTÁ SIENDO ABSORBIDO, SE ENCOGE Y DESAPARECE */
        : selected 
          ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)] scale-105' 
          : 'border-slate-700/80 hover:border-slate-500/50'
    }`}>

      {/* --- LOS 4 PUNTITOS DE CONEXIÓN (HANDLES) --- */}
      {/* --- LOS 4 PUNTITOS (AHORA CON ! PARA FORZAR QUE SE OCULTEN) --- */}
      {isConnectable && (
        <>
          <Handle 
            type="source" position={Position.Top} id="top"
            className="w-3 h-3 border-2 border-[#141923] transition-all duration-300 hover:scale-150 !opacity-0 group-hover:!opacity-100 z-50" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} 
          />
          <Handle 
            type="source" position={Position.Bottom} id="bottom"
            className="w-3 h-3 border-2 border-[#141923] transition-all duration-300 hover:scale-150 !opacity-0 group-hover:!opacity-100 z-50" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} 
          />
          <Handle 
            type="source" position={Position.Left} id="left"
            className="w-3 h-3 border-2 border-[#141923] transition-all duration-300 hover:scale-150 !opacity-0 group-hover:!opacity-100 z-50" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} 
          />
          <Handle 
            type="source" position={Position.Right} id="right"
            className="w-3 h-3 border-2 border-[#141923] transition-all duration-300 hover:scale-150 !opacity-0 group-hover:!opacity-100 z-50" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} 
          />
        </>
      )}

      {/* MAGIA AQUÍ: El lapicito SOLO se renderiza si isGroup es verdadero */}
      {isGroup && (
        <button 
          onClick={handleEditClick}
          className="absolute top-2 right-2 p-1.5 bg-[#0B0F17]/80 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-slate-700 z-10"
          title="Editar propiedades del grupo"
        >
          <Edit3 size={14} />
        </button>
      )}

      <div className="p-3 flex items-center gap-3 border-b pr-10" style={headerStyle}>
        {isGroup ? (
          <Folder size={16} />
        ) : (
          <MessageSquare size={16} />
        )}
        <span className="font-semibold text-sm tracking-wide truncate">
          {data.label || 'Sin título'}
        </span>
      </div>

      <div className="p-3 bg-[#0B0F17]/50 space-y-3">
        {data.description ? (
          <p className="text-xs text-slate-400 line-clamp-2">{data.description}</p>
        ) : (
          <p className="text-xs text-slate-600 italic">
            {isGroup ? 'Clic en el lápiz para editar...' : 'Doble clic para editar...'}
          </p>
        )}

        {!isGroup && subIdeas.length > 0 && (
          <div className="border-t border-slate-800/50 pt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-500 mb-2">
              <ListChecks size={12} />
              <span className="text-[10px] font-medium uppercase tracking-wider">Sub-ideas ({subIdeas.length})</span>
            </div>
            {subIdeas.slice(0, 3).map(idea => (
              <div key={idea.id} className="flex items-center gap-2 bg-[#141923] p-1.5 rounded border border-slate-800">
                <input type="checkbox" checked={idea.completed} readOnly className="h-3 w-3 accent-indigo-500 border-slate-700" />
                <span className="text-[11px] text-slate-300 truncate">{idea.text}</span>
              </div>
            ))}
            {subIdeas.length > 3 && (
              <div className="text-[10px] text-slate-600 pl-5">... y {subIdeas.length - 3} más</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}