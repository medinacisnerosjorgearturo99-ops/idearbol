import React from 'react';
import { Handle, Position } from 'reactflow';
import { Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function LinkNode({ data }) {
  const color = data.color || '#06b6d4';
  
  // Función para extraer el dominio puro (ej. youtube.com)
  const getDomain = (url) => {
    try { return new URL(url).hostname; } catch { return null; }
  };
  
  const domain = getDomain(data.url);
  // El truco mágico: La API gratuita de Google Favicons
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  return (
    <div className="relative group bg-[#141923] border border-slate-700/50 rounded-xl shadow-lg transition-all hover:border-slate-500 overflow-hidden w-64">
      {/* Tira de color superior */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }}></div>
      
      <div className="p-3 flex items-center gap-3">
        {/* Logo o Icono por defecto */}
        <div className="w-10 h-10 rounded bg-[#0B0F17] flex items-center justify-center shrink-0 overflow-hidden border border-slate-800">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain" />
          ) : (
            <LinkIcon size={20} className="text-slate-500" />
          )}
        </div>
        
        {/* Título y URL corta */}
        <div className="flex flex-col flex-1 min-w-0 pr-6">
          <span className="text-sm font-bold text-slate-200 truncate">
            {data.label || 'Nuevo Enlace'}
          </span>
          <span className="text-xs text-slate-500 truncate mt-0.5 font-mono">
            {domain || 'Sin URL configurada'}
          </span>
        </div>

        {/* Botón para abrir */}
        {data.url && (
          <a href={data.url} target="_blank" rel="noopener noreferrer" 
             onClick={(e) => e.stopPropagation()}
             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-md transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}