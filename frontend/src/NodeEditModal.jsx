import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, MessageSquare, GripVertical, ChevronLeft, Edit3, Folder, Image as ImageIcon } from 'lucide-react';

export default function NodeEditModal({ isOpen, onClose, nodeData, onSave, onDelete, projects = [] }) {
  const [viewStack, setViewStack] = useState([]);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [subIdeas, setSubIdeas] = useState([]);
  const [newSubIdea, setNewSubIdea] = useState('');
  const [color, setColor] = useState('#3b82f6'); 
  const [projectId, setProjectId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState('');
  // 👇 ESTADO PARA EL ERROR DEL TÍTULO 👇
  const [titleError, setTitleError] = useState("");

  // 👇 LA VALIDACIÓN CORRECTA 👇
  const tipoNodo = nodeData?.type;
  const tipoData = nodeData?.data?.type;

  const isImage = tipoNodo === 'image' || tipoData === 'image';
  const isNote = tipoNodo === 'nota' || tipoData === 'nota';
  const isLink = tipoNodo === 'link' || tipoData === 'link';
  
  // ¡Aquí estaba el error! Los grupos siempre son 'custom' por fuera, pero 'grupo' por dentro:
  const isGroup = tipoData === 'grupo';

  useEffect(() => {
    if (nodeData && isOpen) {
      setLabel(nodeData.data.label || '');
      setDescription(nodeData.data.description || '');
      setSubIdeas(nodeData.data.subIdeas || []);
      setColor(nodeData.data.color || (isGroup ? '#10b981' : isNote ? '#fde047' : isLink ? '#06b6d4' : '#3b82f6'));
      setProjectId(nodeData.data.projectId || ''); 
      setViewStack([]);
      setImageUrl(nodeData.data.imageUrl || '');
      setCaption(nodeData.data.caption || '');
      setUrl(nodeData.data.url || '');
    }
  }, [nodeData, isOpen, isGroup, isNote, isLink]);

  if (!isOpen || !nodeData) return null;

  const handleSave = () => { // O el nombre que tenga tu función
    
    // 👇 EL ESCUDO: Si el título está vacío, detenemos todo y mostramos el error
    if (!label.trim()) {
      setTitleError("El título no puede estar vacío");
      setTimeout(() => setTitleError(""), 3000);
      return; 
    }

    if (viewStack.length === 0) {
      onSave(nodeData.id, { 
        label: label.trim(), description, subIdeas, color, projectId, imageUrl, caption, url 
      });
      onClose();
    } else {
      goBack(label.trim());
    }
  };

  const handleCancel = () => {
    // Si la idea es nueva (no tiene título original) y cancelamos, la borramos de la BD
    if (!nodeData.data.label || nodeData.data.label.trim() === '') {
      onDelete(nodeData.id); 
    }
    onClose(); 
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
      item.id === parentState.editingId ? { ...item, text: currentLabel, description, subIdeas } : item
    );

    setLabel(parentState.label);
    setDescription(parentState.description);
    setSubIdeas(updatedParentSubIdeas);
    setColor(parentState.color);
    setViewStack(newStack);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#141923] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* --- CABECERA --- */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1A212E] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            {viewStack.length > 0 ? (
              <button onClick={() => goBack(label)} className="text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md transition-colors">
                <ChevronLeft size={16} /> Volver
              </button>
            ) : isGroup ? (
              <Folder size={18} style={{ color }} />
            ) : isImage ? (
              <ImageIcon size={18} className="text-pink-500" />
            ) : isNote ? (
              <MessageSquare size={18} className="text-yellow-400" />
            ) : (
              <MessageSquare size={18} style={{ color }} />
            )}
            <h2 className="text-lg font-semibold text-slate-200">
              {viewStack.length > 0 ? 'Configurando Sub-idea' : 
               isGroup ? 'Configuración del Grupo' : 
               isNote ? '📝 Editor de Nota' : 
               isLink ? '🔗 Editor de Enlace' : 
               isImage ? '🖼️ Editor de Imagen' : 
               '💡 Editor de Idea'}
            </h2>
          </div>
          <button onClick={handleCancel} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* --- CUERPO DEL MODAL --- */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* UBICACIÓN (Proyecto) - Visible para todos */}
          {viewStack.length === 0 && projects?.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Ubicación (Proyecto)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                <option value="" disabled>Selecciona un proyecto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.title || 'Proyecto sin nombre'}</option>
                ))}
              </select>
            </div>
          )}

          {/* 👇 SECCIÓN ESPECÍFICA POR TIPO DE NODO 👇 */}
          {isImage ? (
            <div className="space-y-6">
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
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pie de foto (Opcional)</label>
                <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej. Referencia de personaje" className="w-full bg-[#0B0F17] border border-slate-700 p-3 text-slate-200 rounded-lg" />
              </div>
            </div>

          ) : isLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Título del Enlace</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-[#0B0F17] border border-slate-700 p-3 text-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">URL del Enlace</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#0B0F17] border border-slate-700 p-3 text-slate-200 rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color de la etiqueta</label>
                <div className="flex items-center gap-4">
                  {/* Colores predefinidos */}
                  <div className="flex gap-2">
                    {['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'].map(c => (
                      <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  
                  {/* Línea divisoria */}
                  <div className="w-px h-6 bg-slate-700"></div>
                  
                  {/* Selector Libre (RGB) */}
                  <div className="relative group cursor-pointer">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10" />
                    <div className="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 overflow-hidden group-hover:border-slate-400 transition-colors">
                      <div className="w-full h-full" style={{ backgroundColor: color }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : isNote ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Título de la nota (Opcional)</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Tareas pendientes" className="w-full bg-[#0B0F17] border border-slate-700 p-3 text-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Contenido</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Escribe aquí los detalles..." className="w-full bg-[#0B0F17] border border-slate-700 p-3 text-slate-200 rounded-lg resize-y" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color del papel</label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {['#fde047', '#fca5a5', '#bef264', '#67e8f9', '#c4b5fd'].map(c => (
                      <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded border-2 ${color === c ? 'border-black scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="w-px h-6 bg-slate-700"></div>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                </div>
              </div>
            </div>

          ) : (
            /* --- MODO IDEA / GRUPO NORMAL --- */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                
                {/* 👇 BLOQUE DEL TÍTULO ACTUALIZADO 👇 */}
                <div className="flex-1 relative">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Título *</label>
                  <input 
                    type="text" 
                    value={label} 
                    onChange={(e) => {
                      setLabel(e.target.value);
                      setTitleError(""); // Quitamos el error en cuanto empieza a escribir
                    }} 
                    placeholder="Escribe el nombre aquí..." 
                    className={`w-full bg-[#0B0F17] border ${titleError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-slate-700'} p-3 text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all`} 
                  />
                  {titleError && (
                    <p className="absolute -bottom-5 left-0 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                      {titleError}
                    </p>
                  )}
                </div>
                {/* 👆 FIN DEL BLOQUE DEL TÍTULO 👆 */}

                {viewStack.length === 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color</label>
                    <div className="flex gap-2 p-2 bg-[#0B0F17] border border-slate-700 rounded-lg h-[50px] items-center">
                      {PRESET_COLORS.map((preset) => (
                        <button key={preset} type="button" onClick={() => setColor(preset)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === preset ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B0F17]' : 'opacity-70'}`} style={{ backgroundColor: preset }} />
                      ))}
                      <div className="w-[1px] h-full bg-slate-700 mx-1"></div>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Detalles / Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Añade contexto o notas adicionales..." className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg p-3 text-slate-200 resize-y" />
              </div>

              {/* Sub-Ideas */}
              {!isGroup && (
                <div className="border-t border-slate-800/60 pt-4">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{viewStack.length > 0 ? 'Sub-ideas de esta sub-idea' : 'Sub-Ideas'}</label>
                  <div className="space-y-2 mb-3">
                    {subIdeas.map((idea) => (
                      <div key={idea.id} className="flex items-center gap-3 bg-[#0B0F17] border border-slate-800 p-2 rounded-lg group">
                        <GripVertical size={16} className="text-slate-700 cursor-grab" />
                        <span className="text-sm text-slate-300 flex-1">{idea.text}</span>
                        <button onClick={() => enterSubIdea(idea)} className="text-slate-500 hover:text-indigo-400 p-1"><Edit3 size={14} /></button>
                        <button onClick={() => deleteSubIdea(idea.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newSubIdea} onChange={(e) => setNewSubIdea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubIdea()} placeholder="Escribe y presiona Enter..." className="flex-1 bg-[#0B0F17] border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                    <button onClick={addSubIdea} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Añadir</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- PIE DEL MODAL --- */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#0B0F17]/50 rounded-b-2xl shrink-0">
          {viewStack.length === 0 ? (
            <button onClick={() => { onDelete(nodeData.id); onClose(); }} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={16} /> Eliminar
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button onClick={handleCancel} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2">Cancelar</button>
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-6 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20">
              {viewStack.length > 0 ? 'Guardar y Volver' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}