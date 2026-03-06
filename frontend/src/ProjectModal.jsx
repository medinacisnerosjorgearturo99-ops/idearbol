import React, { useState, useEffect } from 'react';
import { X, Trash2, LayoutDashboard } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, projectData, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1'); // Índigo por defecto

  useEffect(() => {
    if (isOpen) {
      if (projectData) {
        // Modo Edición
        setName(projectData.name || '');
        setDescription(projectData.description || '');
        setColor(projectData.color || '#6366f1');
      } else {
        // Modo Creación (Nuevo Proyecto)
        setName('');
        setDescription('');
        setColor('#6366f1');
      }
    }
  }, [projectData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalName = name.trim() === '' ? 'Nuevo Proyecto' : name;
    onSave(projectData ? projectData.id : null, { name: finalName, description, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#141923] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1A212E] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} style={{ color }} />
            <h2 className="text-lg font-semibold text-slate-200">
              {projectData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Nombre del Proyecto</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mi Videojuego RPG" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color</label>
              <div className="flex bg-[#0B0F17] border border-slate-700 rounded-lg p-1.5 h-[50px] w-[50px] items-center justify-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="¿De qué trata este proyecto?" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#0B0F17]/50 rounded-b-2xl">
          {projectData ? (
            <button onClick={() => { onDelete(projectData.id); onClose(); }} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={16} /> Eliminar
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2">Cancelar</button>
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}