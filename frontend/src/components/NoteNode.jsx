import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

export default function NoteNode({ data, selected }) {
  const color = data.color || '#fde047'; 

  return (
    <>
      {/* El Resizer controla el tamaño mínimo absoluto (200x200) */}
      <NodeResizer color="#1e293b" isVisible={selected} minWidth={200} minHeight={200} />
      
      {/* La caja amarilla simplemente ocupa el 100% de lo que le diga el Resizer */}
      <div className="relative group shadow-md transition-shadow hover:shadow-lg flex flex-col"
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

        <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
        <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
      </div>
    </>
  );
}