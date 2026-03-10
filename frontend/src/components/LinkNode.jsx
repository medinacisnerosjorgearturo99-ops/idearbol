import React from 'react';
import { Handle, Position } from 'reactflow';
import { Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function LinkNode({ data, selected, isConnectable }) { 
  const color = data.color || '#06b6d4';
  
  const getDomain = (url) => {
    try { return new URL(url).hostname; } catch { return null; }
  };
  
  const domain = getDomain(data.url);
  // 👇 1. CAMBIAMOS GOOGLE POR ICON HORSE (Servicio amigable con CORS) 👇
  const logoUrl = domain ? `https://icon.horse/icon/${domain}` : null;

  return (
    <div className={`relative group bg-[#141923] border overflow-hidden w-64 rounded-xl transition-all duration-500 ease-in-out origin-center ${
      data.isAbsorbing 
        ? 'scale-0 opacity-0 rotate-180' 
        : selected 
          ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-[1.02]' 
          : 'border-slate-700/50 shadow-lg hover:border-slate-500 scale-100'
    }`}>
      <div className="h-1.5 w-full" style={{ backgroundColor: color }}></div>
      
      <div className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#0B0F17] flex items-center justify-center shrink-0 overflow-hidden border border-slate-800">
          {logoUrl ? (
            /* 👇 2. LE AGREGAMOS crossOrigin="anonymous" PARA CALMAR AL NAVEGADOR 👇 */
            <img src={logoUrl} alt="logo" crossOrigin="anonymous" className="w-6 h-6 object-contain rounded-sm" />
          ) : (
            <LinkIcon size={20} className="text-slate-500" />
          )}
        </div>
        
        <div className="flex flex-col flex-1 min-w-0 pr-6">
          <span className="text-sm font-bold text-slate-200 truncate">
            {data.label || 'Nuevo Enlace'}
          </span>
          <span className="text-xs text-slate-500 truncate mt-0.5 font-mono">
            {domain || 'Sin URL configurada'}
          </span>
        </div>

        {data.url && (
          <a href={data.url} target="_blank" rel="noopener noreferrer" 
             onClick={(e) => e.stopPropagation()}
             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-md transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable}
        className={`!w-2 !h-2 !bg-cyan-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
      
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable}
        className={`!w-2 !h-2 !bg-cyan-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
      
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable}
        className={`!w-2 !h-2 !bg-cyan-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
      
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable}
        className={`!w-2 !h-2 !bg-cyan-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
    </div>
  );
}