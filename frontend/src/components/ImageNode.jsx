import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Image as ImageIcon, X, UploadCloud, Edit3 } from 'lucide-react';

export default function ImageNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  
  // Si no hay imagen guardada, empezamos en "modo edición"
  const [isEditing, setIsEditing] = useState(!data.imageUrl);

  // Función para guardar datos en la memoria del nodo
  const updateNodeData = (newData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n))
    );
  };

  // Magia para leer el archivo de tu computadora y mostrarlo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Guardamos la imagen en Base64 en el nodo
        updateNodeData({ imageUrl: reader.result });
        setIsEditing(false); // Cerramos el modo edición
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    updateNodeData({ imageUrl: null });
    setIsEditing(true);
  };

  return (
    <div 
      onDoubleClick={() => data.imageUrl && setIsEditing(true)}
      className={`group relative bg-[#0B0F17]/80 border rounded-xl shadow-xl transition-all duration-300 backdrop-blur-md min-w-[200px] select-none ${
        selected ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-slate-800'
      }`}
    >
      {/* --- ESTADO 1: MODO EDICIÓN / SUBIR IMAGEN --- */}
      {isEditing ? (
        <div className="p-4 flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-slate-700/50 rounded-xl m-2 bg-[#141923]/50">
          {data.imageUrl && (
            <button onClick={() => setIsEditing(false)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-800 rounded-md">
              <X size={14} />
            </button>
          )}
          
          <UploadCloud size={32} className="text-indigo-400 mb-2" />
          <p className="text-xs text-slate-300 font-medium mb-1">Subir imagen</p>
          <p className="text-[10px] text-slate-500 mb-3 text-center">Haz clic abajo para elegir un archivo</p>
          
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileUpload}
            className="text-[10px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer w-full max-w-[180px]"
          />

          {data.imageUrl && (
             <button onClick={clearImage} className="mt-4 text-[10px] text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-3 py-1 rounded-md transition-colors">
               Borrar imagen actual
             </button>
          )}
        </div>
      ) : (
        /* --- ESTADO 2: MODO VISUALIZACIÓN (LIMPIO) --- */
        <div className="relative flex flex-col overflow-hidden rounded-xl">
          {/* Botón flotante para editar que aparece al pasar el mouse */}
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-indigo-600"
            title="Doble clic para editar"
          >
            <Edit3 size={14} />
          </button>

          {/* La Imagen */}
          <img 
            src={data.imageUrl} 
            alt="Nodo visual" 
            className="w-full max-w-[300px] max-h-[400px] object-cover pointer-events-none"
          />
          
          {/* El pie de imagen (Caption) */}
          <div className="bg-[#141923] p-2 border-t border-slate-800/80">
            <input 
              type="text"
              placeholder="Escribe un pie de imagen..."
              value={data.caption || ''}
              onChange={(e) => updateNodeData({ caption: e.target.value })}
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:text-indigo-200 text-center"
            />
          </div>
        </div>
      )}

      {/* Puntos de conexión para React Flow */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-indigo-500 !border-transparent" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-indigo-500 !border-transparent" />
    </div>
  );
}