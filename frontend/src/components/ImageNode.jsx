import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { Image as ImageIcon } from 'lucide-react';
import '@reactflow/node-resizer/dist/style.css';

export default memo(function ImageNode({ id, data, selected, isConnectable }) {
  return (
    <>
      {/* --- EL MOTOR DE TAMAÑO --- */}
      <NodeResizer 
        color="#ec4899" 
        isVisible={selected} 
        minWidth={150} 
        minHeight={150} 
        keepAspectRatio={true} 
        onResizeEnd={async (event, params) => {
          try {
            // Usa el ID original si estamos en la pizarra de conexiones
            const targetId = data.originalId || id;
            await fetch(`https://idearbol.onrender.com/api/nodes/${targetId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ width: params.width, height: params.height })
            });
          } catch (error) {
            console.error("Error guardando el tamaño:", error);
          }
        }}
      />

      {/* --- EL CONTENEDOR PRINCIPAL --- */}
      {/* Nota la clase 'group' al inicio para detectar el mouse */}
      <div className={`group w-full h-full flex flex-col relative bg-[#0B0F17]/80 border rounded-xl shadow-xl overflow-hidden backdrop-blur-md select-none ${
          selected ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'border-slate-800'
        }`}>
        
        {/* 1. LA IMAGEN */}
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.caption || "Nodo visual"} 
            className="w-full h-[calc(100%-32px)] object-contain bg-black/20 pointer-events-none" 
          />
        ) : (
          <div className="w-full h-[calc(100%-32px)] flex flex-col items-center justify-center bg-[#141923]/50">
            <ImageIcon size={32} className="text-slate-700 mb-2" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Sin imagen</span>
          </div>
        )}

        {/* 2. EL PIE DE IMAGEN */}
        <div className="h-8 bg-[#141923] px-3 flex items-center justify-center border-t border-slate-800/80">
          <span className="text-xs text-slate-300 font-medium truncate">
            {data.caption || 'Doble clic para editar'}
          </span>
        </div>

        {/* 3. LOS 4 CONECTORES INTELIGENTES E INVISIBLES */}
        <Handle 
          type="target" position={Position.Top} id="top" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-pink-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} 
        />
        <Handle 
          type="source" position={Position.Right} id="right" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-pink-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} 
        />
        <Handle 
          type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-pink-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} 
        />
        <Handle 
          type="target" position={Position.Left} id="left" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-pink-500 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} 
        />
      </div>
    </>
  );
});