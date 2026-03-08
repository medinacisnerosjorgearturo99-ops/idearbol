import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { Image as ImageIcon } from 'lucide-react';
import '@reactflow/node-resizer/dist/style.css'; // Importante para que se vean los puntitos de redimensionar

export default memo(function ImageNode({ id, data, selected }) {
  return (
    <>
      {/* 👇 EL MOTOR DE TAMAÑO 👇 */}
      <NodeResizer 
        color="#ec4899" 
        isVisible={selected} 
        minWidth={150} 
        minHeight={150} 
        // 👇 ESTA ES LA MAGIA DEL AUTOGUARDADO 👇
        onResizeEnd={async (event, params) => {
          try {
            await fetch(`https://idearbol.onrender.com/api/nodes/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ width: params.width, height: params.height })
            });
          } catch (error) {
            console.error("Error guardando el tamaño:", error);
          }
        }}
      />

      {/* Es VITAL que el div principal tenga w-full y h-full para que crezca con el Resizer */}
      <div className={`w-full h-full flex flex-col relative bg-[#0B0F17]/80 border rounded-xl shadow-xl overflow-hidden backdrop-blur-md select-none ${
          selected ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'border-slate-800'
        }`}>
        
        {/* LA IMAGEN */}
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.caption || "Nodo visual"} 
            className="w-full h-[calc(100%-32px)] object-cover pointer-events-none" 
          />
        ) : (
          <div className="w-full h-[calc(100%-32px)] flex flex-col items-center justify-center bg-[#141923]/50">
            <ImageIcon size={32} className="text-slate-700 mb-2" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Sin imagen</span>
          </div>
        )}

        {/* EL PIE DE IMAGEN */}
        <div className="h-8 bg-[#141923] px-3 flex items-center justify-center border-t border-slate-800/80">
          <span className="text-xs text-slate-300 font-medium truncate">
            {data.caption || 'Doble clic para editar'}
          </span>
        </div>

        {/* PUNTOS DE CONEXIÓN */}
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-pink-500 !border-transparent" />
        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-pink-500 !border-transparent" />
      </div>
    </>
  );
});