import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Los estilos originales
import { useReactFlow } from 'reactflow';

export default function TextNode({ id, data, selected }) {
  // Vamos a guardar el contenido HTML en la variable "description" para no tener que modificar tu Base de Datos
  const [content, setContent] = useState(data.description || '<p>Escribe tu texto aquí...</p>');
  const { setNodes } = useReactFlow();

  // 🛠️ CONFIGURACIÓN DE LA BARRA DE HERRAMIENTAS
  const modules = {
    toolbar: [
      [{ 'size': ['small', false, 'large', 'huge'] }], // Tamaños de letra
      ['bold', 'italic', 'underline', 'strike'],       // Estilos básicos
      [{ 'color': [] }, { 'background': [] }],         // Colores
      [{ 'align': [] }],                               // Alineación (Izquierda, Centro, Derecha)
      ['clean']                                        // Quitar formato
    ],
  };

  // Cuando el usuario escribe, actualizamos la pantalla al instante
  const handleChange = (value) => {
    setContent(value);
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, description: value } } : n))
    );
  };

  // 💾 Cuando el usuario da clic fuera del texto, guardamos silenciosamente en la Base de Datos
  const handleBlur = async () => {
    const realId = data.originalId || id;
    // Evitamos que guarde si es un nodo de solo-pizarra (los que empiezan con net-nota-)
    if (String(id).startsWith('net-nota-')) return; 

    try {
      await fetch(`https://idearbol.onrender.com/api/nodes/${realId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: content }) 
      });
    } catch (err) { console.error("Error guardando el texto:", err); }
  };

  return (
    // La clase "nodrag" es VITAL: permite que el usuario pueda seleccionar texto para pintarlo sin mover el nodo entero por accidente
    <div className={`text-node-container min-w-[250px] ${selected ? 'is-selected' : ''}`}>
      
      {/* 🎨 HECHIZOS CSS PARA HACERLO INVISIBLE CUANDO NO LO TOCAS */}
      <style>{`
        .text-node-container .ql-container.ql-snow {
          border: none !important;
          font-family: inherit;
        }
        .text-node-container .ql-editor {
          padding: 10px;
          font-size: 16px;
          color: #f1f5f9; /* Color de texto base claro */
        }
        /* Ocultamos la barra de herramientas si NO está seleccionado */
        .text-node-container:not(.is-selected) .ql-toolbar {
          display: none;
        }
        /* Estilo de la barra cuando SÍ está seleccionado */
        .text-node-container.is-selected .ql-toolbar {
          border: 1px solid #334155;
          border-radius: 8px 8px 0 0;
          background-color: #1e293b;
          position: absolute;
          top: -45px; /* Que flote arribita del texto */
          left: 0;
          width: max-content;
          z-index: 100;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .text-node-container.is-selected {
          border: 1px dashed #6366f1; /* Borde punteado azul al seleccionar */
          border-radius: 8px;
          background-color: rgba(15, 23, 42, 0.4);
        }
        /* Ajustar los iconitos de la barra al modo oscuro */
        .ql-snow .ql-stroke { stroke: #cbd5e1; }
        .ql-snow .ql-fill { fill: #cbd5e1; }
        .ql-snow .ql-picker { color: #cbd5e1; }
        .ql-snow .ql-picker-options { background-color: #1e293b; border-color: #334155; }
      `}</style>

      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        modules={modules}
        className="nodrag custom-quill-editor" 
      />
    </div>
  );
}