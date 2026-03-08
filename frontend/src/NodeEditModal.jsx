import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, MessageSquare, GripVertical, ChevronLeft, Edit3, Folder } from 'lucide-react';

export default function NodeEditModal({ isOpen, onClose, nodeData, onSave, onDelete, projects = [] }) {
  const [viewStack, setViewStack] = useState([]);
  
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [subIdeas, setSubIdeas] = useState([]);
  const [newSubIdea, setNewSubIdea] = useState('');
  const [color, setColor] = useState('#3b82f6'); 
  const [projectId, setProjectId] = useState(''); // 👈 NUEVO: Estado del teletransportador

  useEffect(() => {
    if (nodeData && isOpen) {
      setLabel(nodeData.data.label || '');
      setDescription(nodeData.data.description || '');
      setSubIdeas(nodeData.data.subIdeas || []);
      setColor(nodeData.data.color || (nodeData.data.type === 'grupo' ? '#10b981' : '#3b82f6'));
      // Tratamos de agarrar su proyecto actual, si no, se queda en blanco por defecto
      setProjectId(nodeData.data.projectId || ''); 
      setViewStack([]);
    }
  }, [nodeData, isOpen]);

  if (!isOpen || !nodeData) return null;

  const isGroup = nodeData.data.type === 'grupo' && viewStack.length === 0;

  const handleSave = () => {
    // 1. Mejoramos el nombre automático para que reconozca las imágenes
    const defaultLabel = isGroup ? 'Nuevo Grupo' : isImage ? 'Nueva Imagen' : 'Nueva Idea';
    const finalLabel = label.trim() === '' ? defaultLabel : label;

    if (viewStack.length === 0) {
      // 2. ¡Empacamos la imagen y el caption en el paquete!
      onSave(nodeData.id, { 
        label: finalLabel, 
        description, 
        subIdeas, 
        color, 
        projectId,
        imageUrl, // 👈 Se guarda la foto
        caption   // 👈 Se guarda el texto
      });
      onClose();
    } else {
      goBack(finalLabel);
    }
  };

  const deleteSubIdea = (id) => setSubIdeas(subIdeas.filter(idea => idea.id !== id));

  const addSubIdea = () => {
    if (newSubIdea.trim()) {
      setSubIdeas([...subIdeas, { id: Date.now(), text: newSubIdea.trim(), description: '', completed: false, subIdeas: [] }]);
      setNewSubIdea('');
    }
  };

  const enterSubIdea = (ideaToEdit) => {
    setViewStack([...viewStack, { editingId: ideaToEdit.id, label, description, subIdeas, color }]);
    setLabel(ideaToEdit.text);
    setDescription(ideaToEdit.description || '');
    setSubIdeas(ideaToEdit.subIdeas || []);
  };

  const goBack = (currentLabel) => {
    const parentState = viewStack[viewStack.length - 1];
    const newStack = viewStack.slice(0, -1);
    
    const updatedParentSubIdeas = parentState.subIdeas.map(item => 
      item.id === parentState.editingId 
        ? { ...item, text: currentLabel, description, subIdeas } 
        : item
    );

    setLabel(parentState.label);
    setDescription(parentState.description);
    setSubIdeas(updatedParentSubIdeas);
    setColor(parentState.color);
    setViewStack(newStack);
  };

  // 1. Detectamos si el nodo actual es una imagen
  const isImage = nodeData?.type === 'image' || nodeData?.data?.type === 'image';
  
  // 2. Creamos los espacios en la memoria del Modal para la foto y el pie de imagen
  const [imageUrl, setImageUrl] = useState(nodeData?.data?.imageUrl || nodeData?.imageUrl || '');
  const [caption, setCaption] = useState(nodeData?.data?.caption || nodeData?.caption || '');

  // 3. La magia para leer archivos desde tu computadora
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#141923] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* --- CABECERA --- */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1A212E] rounded-t-2xl">
          <div className="flex items-center gap-3">
            {viewStack.length > 0 ? (
              <button onClick={() => goBack(label)} className="text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md transition-colors">
                <ChevronLeft size={16} /> Volver
              </button>
            ) : isGroup ? (
              <Folder size={18} style={{ color }} />
            ) : isImage ? (
              <ImageIcon size={18} className="text-pink-500" />
            ) : (
              <MessageSquare size={18} style={{ color }} />
            )}
            <h2 className="text-lg font-semibold text-slate-200">
              {viewStack.length > 0 ? 'Configurando Sub-idea' : isGroup ? 'Configuración del Grupo' : isImage ? 'Editor de Imagen' : 'Editor de Idea'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* --- CUERPO DEL MODAL --- */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* TÍTULO Y COLOR (Para todos) */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                {isImage ? 'Nombre de la imagen' : 'Título'}
              </label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Escribe el nombre aquí..." className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            
            {viewStack.length === 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color</label>
                <div className="flex bg-[#0B0F17] border border-slate-700 rounded-lg p-1.5 h-[50px] w-[50px] items-center justify-center">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                </div>
              </div>
            )}
          </div>

          {/* TELETRANSPORTADOR (Para todos) */}
          {viewStack.length === 0 && projects?.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Ubicación (Proyecto)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none">
                <option value="" disabled>Selecciona un proyecto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.title || 'Proyecto sin nombre'}</option>
                ))}
              </select>
            </div>
          )}

          {/* 👇 AQUÍ EMPIEZA LA DIVISIÓN MÁGICA 👇 */}
          {isImage ? (
            /* --- MODO IMAGEN --- */
            <div className="space-y-6 border-t border-slate-800/60 pt-6 mt-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Archivo de Imagen</label>
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/50">
                    <img src={imageUrl} alt="Preview" className="w-full max-h-[250px] object-contain" />
                    <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-[#0B0F17] hover:bg-slate-800/50 transition-colors">
                    <ImageIcon size={32} className="text-slate-600 mb-3" />
                    <p className="text-sm text-slate-300 mb-1">Haz clic para subir una foto</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 cursor-pointer w-full max-w-[250px] mt-4" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pie de Imagen (Caption)</label>
                <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej. Referencia de la armadura..." className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          ) : (
            /* --- MODO IDEA / GRUPO (Lo que ya tenías) --- */
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Detalles / Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Añade contexto o notas adicionales..." className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              {!isGroup && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    {viewStack.length > 0 ? 'Sub-ideas de esta sub-idea' : 'Sub-Ideas'}
                  </label>
                  <div className="space-y-2 mb-3">
                    {subIdeas.map((idea) => (
                      <div key={idea.id} className="flex items-center gap-3 bg-[#0B0F17] border border-slate-800 p-2 rounded-lg group">
                        <GripVertical size={16} className="text-slate-700 cursor-grab" />
                        <input type="checkbox" className="accent-indigo-500 h-4 w-4 rounded border-slate-700 bg-slate-800" />
                        <span className="text-sm text-slate-300 flex-1">{idea.text}</span>
                        <button onClick={() => enterSubIdea(idea)} className="text-slate-500 hover:text-indigo-400 p-1 rounded transition-colors" title="Configurar detalles">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => deleteSubIdea(idea.id)} className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newSubIdea} onChange={(e) => setNewSubIdea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubIdea()} placeholder="Escribe y presiona Enter..." className="flex-1 bg-[#0B0F17] border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                    <button onClick={addSubIdea} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <Plus size={16} /> Añadir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- PIE DEL MODAL --- */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#0B0F17]/50 rounded-b-2xl">
          {viewStack.length === 0 ? (
            <button onClick={() => { onDelete(nodeData.id); onClose(); }} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={16} /> Eliminar Completamente
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button onClick={viewStack.length > 0 ? () => goBack(label) : onClose} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2">Cancelar</button>
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20">
              {viewStack.length > 0 ? 'Guardar y Volver' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}