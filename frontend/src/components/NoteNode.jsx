import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

// 👇 Agregamos isConnectable aquí 👇
export default function NoteNode({ data, selected, isConnectable }) {
  const color = data.color || '#fde047'; 

  return (
    <>
      <NodeResizer color="#1e293b" isVisible={selected} minWidth={200} minHeight={200} />
      
      <div className={`relative group flex flex-col transition-all duration-500 ease-in-out origin-center ${
             data.isAbsorbing ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 shadow-md hover:shadow-lg'
           }`}
           style={{ 
             width: '100%', height: '100%',
             backgroundColor: color, color: '#1e293b', 
             borderRadius: '2px 2px 12px 2px', 
             border: '1px solid rgba(0,0,0,0.1)' 
           }}>
        
        <div className="absolute bottom-0 right-0 w-4 h-4 z-10" style={{ background: 'rgba(0,0,0,0.1)', borderTopLeftRadius: '100%' }}></div>

        {data.label && (
          <div className="text-sm font-black opacity-90 border-b border-black/10 px-4 py-2 shrink-0">
            {data.label}
          </div>
        )}
        
        <div className="text-xs font-medium leading-relaxed whitespace-pre-wrap break-all opacity-80 px-4 py-2 flex-1 overflow-y-auto"
             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
          {data.description || 'Doble clic para escribir...'}
        </div>

        {/* 👇 LOS 4 CONECTORES NEUTROS (Combinan con cualquier color) 👇 */}
        <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-slate-800 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
        
        <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-slate-800 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
        
        <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-slate-800 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
        
        <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable}
          className={`!w-2 !h-2 !bg-slate-800 !border-transparent transition-opacity duration-300 ${isConnectable ? 'opacity-0 group-hover:opacity-100' : '!hidden'}`} />
      </div>
    </>
  );
}