// Agrega useRef aquí 👇
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Plus, LayoutDashboard, Component, Folder, MessageSquare, ChevronRight, ChevronLeft, ArrowLeft, Edit3, 
  LogOut, Settings, Moon, UserCircle, LogIn, UserPlus, ListTree, LayoutGrid, Network, FolderClosed, 
  FolderOpen, MoreHorizontal, GripVertical, Share2, Save, Download, Image, ImageOff, Sun, Trash2, Image as ImageIcon} from 'lucide-react';
import ReactFlow, { Background, Controls, Panel, applyNodeChanges, ReactFlowProvider, useReactFlow, MiniMap, useNodesState, useEdgesState, addEdge, ConnectionMode, getNodesBounds, getViewportForBounds } from 'reactflow';
import 'reactflow/dist/style.css';
import { GoogleLogin } from '@react-oauth/google';
import ImageNode from './components/ImageNode';
import { toPng } from 'html-to-image';
import NoteNode from './components/NoteNode';
import LinkNode from './components/LinkNode';
import { Link as LinkIcon, StickyNote } from 'lucide-react'; // Asegúrate de tener estos iconos

import CustomNode from './CustomNode';
import NetworkNode from './NetworkNode';
import GradientEdge from './GradientEdge';
import NodeEditModal from './NodeEditModal';
import ProjectModal from './ProjectModal';
import AuthModal from './AuthModal';

const nodeTypesCanvas = { custom: CustomNode, image: ImageNode, nota: NoteNode, link: LinkNode };
const nodeTypesNetwork = { network: CustomNode, image: ImageNode, nota: NoteNode, link: LinkNode };
const edgeTypesNetwork = { gradient: GradientEdge };

const hexToRGB = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex && hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
  return `${r}, ${g}, ${b}`;
};

function IdearbolApp() {
  const { project, fitView, getViewport } = useReactFlow();

  const [currentUser, setCurrentUser] = useState(null); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // 👇 ESTADOS PARA LAS ALERTAS PREMIUM 👇
  const [boardError, setBoardError] = useState(""); // Guarda el mensaje de error del input
  const [boardToDelete, setBoardToDelete] = useState(null); // Guarda qué pizarra queremos borrar

  // 👇 1. ESTADO PARA LA CÁMARA 👇
  const [isExportingLight, setIsExportingLight] = useState(false);

  // --- ESTADO PARA EL MODAL DE ABSORCIÓN ---
  const [confirmDrop, setConfirmDrop] = useState({ isOpen: false, sourceNode: null, targetGroup: null });

  // --- ESTADO PARA EL MENÚ DE LÍNEAS ---
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // 👇 RADARES PARA DETECTAR CLICS FUERA DE LOS MENÚS 👇
  const fabRef = useRef(null);
  const exportMenuRef = useRef(null);
  const userMenuRef = useRef(null);

// --- MEMORIA A LARGO PLAZO DE LA CÁMARA ---
const [projectViewports, setProjectViewports] = useState(() => {
  // Al cargar la app, buscamos si hay memoria guardada en el navegador
  const memoriaGuardada = localStorage.getItem('idearbol_camara');
  return memoriaGuardada ? JSON.parse(memoriaGuardada) : {};});
  const [rfInstance, setRfInstance] = useState(null); // Control maestro de la cámara

  const saveViewportTimeout = useRef(null); // 👈 Controla el spam a la base de datos

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  
  const [nodes, setNodes] = useState([]);
  const [globalNodes, setGlobalNodes] = useState([]); // <-- NUEVO: Guarda todo para el buscador
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [viewMode, setViewMode] = useState('canvas'); 

  // --- NUEVOS ESTADOS PARA EL LIENZO DE CONEXIONES ---
  const [networkNodes, setNetworkNodes, onNetworkNodesChange] = useNodesState([]);
  const [networkEdges, setNetworkEdges, onNetworkEdgesChange] = useEdgesState([]);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  const [boards, setBoards] = useState([]); // Lista de todas las pizarras del usuario
  const [activeBoard, setActiveBoard] = useState(null); // La pizarra que tenemos abierta
  const [isCreatingBoard, setIsCreatingBoard] = useState(false); // Para mostrar el modal de "Nueva Pizarra"
  const [newBoardName, setNewBoardName] = useState(""); // Nombre para la nueva pizarra
  const [selectedProjectIds, setSelectedProjectIds] = useState([]); // Proyectos que vamos a vincular
  

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  // Estado para el menú de exportación
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

  useEffect(() => {
    const savedSession = localStorage.getItem('idearbol_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetch(`https://idearbol.onrender.com/api/projects/${currentUser._id}`)
        .then(res => res.json())
        .then(async data => {
          const formatted = data.map(p => ({ ...p, id: p._id }));
          
          if (formatted.length > 0) { 
            // 👇 NUEVO: Descargar las cámaras de la nube
            const viewportsDeLaNube = {};
            formatted.forEach(p => {
              if (p.lastViewport && p.lastViewport.zoom) {
                viewportsDeLaNube[p.id] = p.lastViewport;
              }
            });
            // Si la nube tiene datos, reemplazamos el localStorage
            if (Object.keys(viewportsDeLaNube).length > 0) {
              setProjectViewports(viewportsDeLaNube);
            }
            // 👆 FIN DE LO NUEVO 

            setProjects(formatted);
            setActiveProjectId(formatted[0].id); 
            setCurrentFolderId('root'); 
            
            fetchBoards(currentUser._id);

            // Cargar TODOS los nodos en segundo plano para el buscador
            Promise.all(formatted.map(p => fetch(`https://idearbol.onrender.com/api/nodes/${p.id}`).then(r => r.json())))
              .then(results => {
                const all = results.flat().map(n => {
                  // 👇 LA CURA DE LA AMNESIA 👇
                  let reactFlowType = 'custom';
                  if (n.type === 'image') reactFlowType = 'image';
                  if (n.type === 'nota') reactFlowType = 'nota';
                  if (n.type === 'link') reactFlowType = 'link';

                  return {
                    id: n._id,
                    type: reactFlowType, 
                    // 👇 2. Le pasamos el tamaño para que NO salte
                    style: n.width && n.height ? { width: n.width, height: n.height } : {},
                    data: { 
                      label: n.label, description: n.description, projectId: n.projectId, 
                      parentId: n.parentId, type: n.type, color: n.color, url: n.url, // <-- ¡Agregué url por si acaso!
                      imageUrl: n.imageUrl, caption: n.caption, isChecklist: n.isChecklist
                    }
                  };
                });
                setGlobalNodes(all);
              });

          } else { 
            // 👇 NUEVA LÓGICA: SI NO TIENE PROYECTOS, LE CREAMOS UNO "GENERAL" 👇
            try {
              const res = await fetch('https://idearbol.onrender.com/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  name: 'General', // O 'title', dependiendo de cómo se llame en tu backend
                  description: 'Bandeja de entrada para todas tus ideas sueltas.',
                  userId: currentUser._id 
                })
              });
              
              const newProject = await res.json();
              const newFormatted = { ...newProject, id: newProject._id };
              
              setProjects([newFormatted]);
              setActiveProjectId(newFormatted.id);
              setCurrentFolderId('root');
              setGlobalNodes([]); // Como es nuevo, aún no tiene nodos
              
            } catch (error) {
              console.error("Error al crear el proyecto General:", error);
            }
          }
          
        }).catch(err => console.error(err));
    } else { 
      setProjects([]); setNodes([]); setActiveProjectId(null); setGlobalNodes([]); 
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeProjectId) {
      fetch(`https://idearbol.onrender.com/api/nodes/${activeProjectId}`)
        .then(res => res.json())
        .then(data => {
          const formattedNodes = data.map(n => {
            let reactFlowType = 'custom';
            if (n.type === 'image') reactFlowType = 'image';
            if (n.type === 'nota') reactFlowType = 'nota';
            if (n.type === 'link') reactFlowType = 'link';

            return {
              id: n._id, 
              type: reactFlowType, 
              position: n.position || { x: 100, y: 100 },
              
              // 👇 AQUÍ PUSIMOS EL CANDADO EXACTAMENTE 👇
              style: n.width && n.height ? { width: n.width, height: n.height } : (reactFlowType === 'nota' ? { width: 220, height: 220 } : {}),
              
              data: { 
                label: n.label, type: n.type, description: n.description, color: n.color, 
                parentId: n.parentId, projectId: n.projectId, subIdeas: n.subIdeas,
                imageUrl: n.imageUrl, caption: n.caption,
                url: n.url, isChecklist: n.isChecklist
              }
            };
          });
          setNodes(formattedNodes);
        })
        .catch(err => console.error(err));
    } else {
      setNodes([]);
    }
  }, [activeProjectId]);

  useEffect(() => {
    const timer = setTimeout(() => { fitView({ duration: 800, padding: 0.3, maxZoom: 1 }); }, 150);
    return () => clearTimeout(timer);
  }, [currentFolderId, activeProjectId, viewMode, fitView]);

  useEffect(() => {
    const handleOpenEditModal = (e) => {
      const nodeId = e.detail; const nodeToEdit = nodes.find(n => n.id === nodeId);
      if (nodeToEdit) { setSelectedNode(nodeToEdit); setIsModalOpen(true); }
    };
    window.addEventListener('openEditModal', handleOpenEditModal);
    return () => window.removeEventListener('openEditModal', handleOpenEditModal);
  }, [nodes]);

  // Restaura la cámara al cambiar de proyecto (Versión Suave)
  useEffect(() => {
    if (rfInstance && activeProjectId) {
      const savedViewport = projectViewports[activeProjectId];
      
      // EL TRUCO: Le damos 50ms a React para que termine de dibujar las nuevas ideas
      // antes de mover la cámara. Así no se traba la animación.
      setTimeout(() => {
        if (savedViewport) {
          // Vuelo suave hacia donde te quedaste (800ms para que se disfrute el viaje)
          rfInstance.setViewport(savedViewport, { duration: 800 });
        } else {
          // Vuelo suave para centrar todo si es la primera vez
          rfInstance.fitView({ duration: 800, padding: 0.2 });
        }
      }, 50);
    }
  }, [activeProjectId, rfInstance]);

  // 👇 HECHIZO: Cierra los menús si haces clic fuera de ellos 👇
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú flotante (+) está abierto y el clic no fue dentro de él...
      if (fabRef.current && !fabRef.current.contains(event.target)) setIsFabOpen(false);
      
      // Si el menú de exportar está abierto y el clic no fue dentro de él...
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) setIsExportMenuOpen(false);
      
      // Si el menú de usuario está abierto y el clic no fue dentro de él...
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };

    // Escuchamos cada clic en toda la página
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 👇 NUEVA FUNCIÓN: Cierra todos los menús de la interfaz 👇
  const closeAllMenus = useCallback(() => {
    setIsFabOpen(false);
    setIsExportMenuOpen(false);
    setIsUserMenuOpen(false);
  }, []);

  const handleLoginSuccess = (user) => { setCurrentUser(user); localStorage.setItem('idearbol_session', JSON.stringify(user)); };
  const handleLogout = () => { setCurrentUser(null); setIsUserMenuOpen(false); localStorage.removeItem('idearbol_session'); };
  const openLogin = () => { setAuthMode('login'); setIsAuthModalOpen(true); };
  const openRegister = () => { setAuthMode('register'); setIsAuthModalOpen(true); };

  // --- LAS FUNCIONES QUE HABÍA BORRADO POR ERROR ---
  const openNewProjectModal = () => { setProjectToEdit(null); setIsProjectModalOpen(true); };
  const openEditProjectModal = (e, project) => { e.stopPropagation(); setProjectToEdit(project); setIsProjectModalOpen(true); };
  const handleGoHome = () => { if (projects.length > 0) { setActiveProjectId(projects[0].id); setCurrentFolderId('root'); } };
  const onNodeDoubleClick = (event, node) => {
    if (node.data.type === 'grupo') setCurrentFolderId(node.id); 
    else { setSelectedNode(node); setIsModalOpen(true); }
  };
  const handleSearchResultClick = (node) => { 
    setSearchQuery(''); 
    setActiveProjectId(node.data.projectId); 
    setCurrentFolderId(node.data.parentId); 
    setViewMode('canvas'); 
    
    // 1. Primero seleccionamos el nodo para que brille
    setSelectedNode(node); 

    // 2. Le damos tiempo a React Flow para que renderice los nodos del nuevo proyecto
    setTimeout(() => {
      // Marcamos el nodo como seleccionado en el estado de React Flow
      setNodes((nds) => nds.map(n => ({
        ...n,
        selected: n.id === node.id 
      })));

      // 3. ¡LA MAGIA DEL ZOOM! 
      // Buscamos el nodo real en el lienzo para obtener su posición actual
      if (fitView) {
        fitView({
          nodes: [{ id: node.id }], // Enfócate solo en este nodo
          duration: 1000,           // Que el movimiento dure 1 segundo (se ve suave)
          padding: 2,              // Deja un poco de espacio alrededor para que no se pegue a los bordes
        });
      }
    }, 800); // Subimos un poco el tiempo a 800ms para asegurar que el mapa cargó bien
  };

  const fetchBoards = async (userId) => {
    try {
      const res = await fetch(`https://idearbol.onrender.com/api/boards/${userId}`);
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      console.error("Error cargando pizarras:", err);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      // 👇 En lugar del alert, usamos nuestro estado 👇
      setBoardError("¡Necesitas darle un nombre a tu pizarra!");
      setTimeout(() => setBoardError(""), 3000); // Desaparece solo en 3 segundos
      return;
    }
    
    const payload = { userId: currentUser._id, name: newBoardName };
    try {
      const res = await fetch(`https://idearbol.onrender.com/api/boards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setBoards([...boards, data]); 
      setActiveBoard(data); 
      setIsCreatingBoard(false);
      setNewBoardName("");
      setNetworkNodes([]); // Limpiamos el lienzo para la nueva pizarra
      setNetworkEdges([]);
    } catch (err) { console.error("Error al crear pizarra:", err); }
  };

  // --- FUNCIÓN PARA GUARDAR LA PIZARRA (La que se había borrado) ---
  const handleSaveBoard = async () => {
    if (!activeBoard) return;
    
    // Empaquetamos la información actual del lienzo
    const payload = {
      name: activeBoard.name,
      linkedProjects: activeBoard.linkedProjects,
      nodes: networkNodes,
      edges: networkEdges
    };

    try {
      const res = await fetch(`https://idearbol.onrender.com/api/boards/${activeBoard._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updatedBoard = await res.json();
      
      // Actualizamos la lista de pizarras con la información fresca
      setBoards(boards.map(b => b._id === updatedBoard._id ? updatedBoard : b));
      setToastMessage('¡Pizarra guardada con éxito! 💾');
      setTimeout(() => setToastMessage(null), 3000); // Se borra en 3 segundos
    } catch (err) {
      console.error("Error al guardar la pizarra:", err);
      alert('Hubo un error al guardar');
    }
  };

  // 👇 2. FUNCIÓN DE EXPORTACIÓN LIMPIA 👇
  const handleDownloadImage = useCallback(async (mode = 'dark') => {
    setIsExportMenuOpen(false); 
    
    if (networkNodes.length === 0) {
      alert("¡La pizarra está vacía! Agrega ideas primero.");
      return;
    }

    const viewportElement = document.querySelector('.react-flow__viewport');
    
    if (viewportElement) {
      try {
        setToastMessage('Generando imagen, por favor espera... ⏳');

        // ¡Preparamos la pantalla si es modo claro!
        if (mode === 'light') {
          setIsExportingLight(true);
          // Le damos a React 150ms exactos para pintar las líneas negras en la pantalla
          await new Promise(resolve => setTimeout(resolve, 150)); 
        }

        const nodesBounds = getNodesBounds(networkNodes);
        const imageWidth = nodesBounds.width + 200;
        const imageHeight = nodesBounds.height + 200;
        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);

        const bgColor = mode === 'dark' ? '#0B0F17' : null;

        const dataUrl = await toPng(viewportElement, { 
          backgroundColor: bgColor,
          width: imageWidth,
          height: imageHeight,
          style: {
            width: `${imageWidth}px`, 
            height: `${imageHeight}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
          pixelRatio: 2, 
          skipFonts: true
        });

        // ¡Devolvemos todo a la normalidad!
        if (mode === 'light') setIsExportingLight(false);

        const link = document.createElement('a');
        link.download = `${activeBoard ? activeBoard.name : 'Nodara'}-${mode}.png`;
        link.href = dataUrl;
        link.click();
        
        setToastMessage('¡Pizarra exportada a la medida! 📸');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        if (mode === 'light') setIsExportingLight(false); // Rescate en caso de error
        console.error('🚨 Error al exportar la imagen:', err);
        setToastMessage('❌ Error de seguridad con alguna imagen. Usa imágenes locales.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  }, [activeBoard, networkNodes]);

  // --- FUNCIÓN PARA ELIMINAR UNA PIZARRA COMPLETA ---
  // 1. Cuando damos clic al basurero, solo abrimos nuestro modal elegante
  const handleDeleteBoardClick = (event, board) => {
    event.stopPropagation(); 
    setBoardToDelete(board);
  };

  // 2. Cuando confirmamos en el modal, borramos de verdad
  const confirmDeleteBoard = async () => {
    if (!boardToDelete) return;
    const boardId = boardToDelete._id;
    
    try {
      await fetch(`https://idearbol.onrender.com/api/boards/${boardId}`, { method: 'DELETE' });
      setBoards(boards.filter(b => b._id !== boardId)); 
      if (activeBoard?._id === boardId) setActiveBoard(null);
      
      setBoardToDelete(null); // Cerramos el modal
      setToastMessage('¡Pizarra eliminada! 🗑️');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error al eliminar la pizarra:", err);
    }
  };

  // --- FUNCIÓN PARA EDITAR UN NODO DESDE EL LIENZO DE CONEXIONES ---
  const onNetworkNodeDoubleClick = useCallback((event, node) => {
    event.stopPropagation();
    // 1. Recuperamos el ID real (porque en conexiones se llaman "net-1234")
    const realId = node.data.originalId || node.id;
    
    // 2. Buscamos toda la información original de ese nodo
    const nodeToEdit = globalNodes.find(n => n.id === realId) || { ...node, id: realId };
    
    // 3. ¡Abrimos el editor!
    setSelectedNode(nodeToEdit);
    setIsModalOpen(true);
  }, [globalNodes]);

  // --- INICIA EL ARRASTRE: Aparece el basurero flotante ---
  const onNodeDragStartNetwork = useCallback((event, node) => {
    setIsDraggingNode(true);
  }, []);

  // --- TERMINA EL ARRASTRE: Evaluamos si cayó en el basurero ---
  const onNodeDragStopNetwork = useCallback((event, node) => {
    setIsDraggingNode(false); // Ocultamos el basurero
    
    // Si soltamos el click mientras el mouse estaba sobre la zona roja...
    if (isOverTrash) {
      setNetworkNodes((nds) => nds.filter((n) => n.id !== node.id));
      setNetworkEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
      setIsOverTrash(false); // Reseteamos el radar
    }
  }, [isOverTrash, setNetworkNodes, setNetworkEdges]);
  
  // --- LÓGICA DE DRAG & DROP PARA CONEXIONES ---
  const onDragStartInventory = (event, fullNode) => {
    // CAMBIO: Ahora pasamos el nodo COMPLETO (fullNode) para no perder su ID original
    event.dataTransfer.setData('application/reactflow', JSON.stringify(fullNode));
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- GUARDIA DE CONEXIONES (Reglas estrictas) ---
  const isValidConnectionNetwork = useCallback((connection) => {
    // Regla 1: No conectar consigo mismo (Bucle)
    if (connection.source === connection.target) {
      return false; 
    }

    // Regla 2: No permitir conexiones duplicadas (sin importar la dirección)
    const isDuplicate = networkEdges.some(
      (edge) =>
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
    );

    return !isDuplicate; // Si no es duplicado, es válido
  }, [networkEdges]);

  const onDragOverNetwork = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropNetwork = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = event.target.getBoundingClientRect();
    const nodeDataStr = event.dataTransfer.getData('application/reactflow');
    if (!nodeDataStr) return;
    
    const fullNode = JSON.parse(nodeDataStr);
    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // 👇 1. FIX: Le enseñamos a identificar los enlaces y mantener su tipo 👇
    let netType = 'network';
    if (fullNode.type === 'image' || fullNode.data?.type === 'image') netType = 'image';
    if (fullNode.type === 'link' || fullNode.data?.type === 'link') netType = 'link';

    const newNode = {
      id: `net-${fullNode.id}`,
      type: netType, // Usamos la variable inteligente
      position,
      style: fullNode.style, 
      data: { 
        ...fullNode.data, 
        originalId: fullNode.id, 
        color: fullNode.data?.color || fullNode?.color 
      }, 
    };
    setNetworkNodes((nds) => nds.concat(newNode));
  }, [project, setNetworkNodes]);

  // Guarda la posición exacta de la cámara cuando el usuario deja de moverse
  // Guarda la posición exacta en el estado Y en el navegador
  // Guarda la posición exacta de la cámara cuando el usuario deja de moverse
  const onMoveEnd = useCallback((event, viewport) => {
    if (activeProjectId) {
      // 1. Guardado instantáneo para que se sienta rápido
      setProjectViewports((prev) => {
        const nuevaMemoria = { ...prev, [activeProjectId]: viewport };
        localStorage.setItem('idearbol_camara', JSON.stringify(nuevaMemoria));
        return nuevaMemoria;
      });

      // 2. 🛡️ Guardado silencioso en la Nube (Debounce)
      // Si el usuario sigue moviendo el mapa, cancelamos el envío anterior
      if (saveViewportTimeout.current) clearTimeout(saveViewportTimeout.current);
      
      // Esperamos 1.5 segundos de inactividad antes de enviarlo a Render
      saveViewportTimeout.current = setTimeout(async () => {
        try {
          await fetch(`https://idearbol.onrender.com/api/projects/${activeProjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lastViewport: viewport })
          });
          console.log("📸 Toma cinematográfica guardada en la nube");
        } catch (err) {
          console.error("Error guardando la cámara:", err);
        }
      }, 1500);
    }
  }, [activeProjectId]);

  // --- LÓGICA DE CONEXIÓN MÁGICA (GRADIENTE) ---
  const onConnectNetwork = useCallback((params) => {
    const sourceNode = networkNodes.find(n => n.id === params.source);
    const targetNode = networkNodes.find(n => n.id === params.target);
    console.log("Color del nodo de origen:", sourceNode?.data?.color);
    
    const newEdge = {
      ...params,
      type: 'gradient',
      data: {
        // 👇 AQUÍ ESTÁ EL ARREGLO: 
        // Primero intenta usar el color personalizado del nodo (data.color). 
        // Si no tiene, entonces usa el verde o azul por defecto.
        sourceColor: sourceNode?.data?.color || (sourceNode?.data?.type === 'grupo' ? '#10b981' : '#6366f1'),
        targetColor: targetNode?.data?.color || (targetNode?.data?.type === 'grupo' ? '#10b981' : '#6366f1'),
        
        // Mantenemos la forma inicial para el menú que acabamos de crear
        shape: 'bezier' 
      }
    };
    setNetworkEdges((eds) => addEdge(newEdge, eds));
  }, [networkNodes, setNetworkEdges]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    setNetworkEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, [setNetworkEdges]);

  // Cuando le dan un solo clic a la línea
  const onEdgeClickNetwork = useCallback((event, edge) => {
    event.stopPropagation(); 
    setSelectedEdgeId(edge.id);
    closeAllMenus(); // 👈 Agregamos esto para que cierre el botón de (+) o el de Exportar
  }, [closeAllMenus]);

  // Cuando el usuario toca el fondo negro del lienzo
  const onPaneClickNetwork = useCallback(() => {
    setSelectedEdgeId(null);
    closeAllMenus(); // 👈 Agregamos esto
  }, [closeAllMenus]);

  // La función que realmente le cambia la forma a la flecha
  const changeEdgeShape = (newShape) => {
    setNetworkEdges((eds) => eds.map((edge) => {
      if (edge.id === selectedEdgeId) {
        // Le inyectamos la nueva forma en su "data"
        return { ...edge, data: { ...edge.data, shape: newShape } };
      }
      return edge;
    }));
    setSelectedEdgeId(null); // Cerramos el menú después de cambiarla
  };


  // --- CRUD BASE DE DATOS ---
  const handleSaveProject = async (id, data) => {
    if (id) {
      const res = await fetch(`https://idearbol.onrender.com/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated = await res.json(); updated.id = updated._id;
      setProjects(projects.map(p => p.id === id ? updated : p));
    } else {
      const payload = { ...data, userId: currentUser._id };
      const res = await fetch(`https://idearbol.onrender.com/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const newProject = await res.json(); newProject.id = newProject._id;
      setProjects([...projects, newProject]); setActiveProjectId(newProject.id); setCurrentFolderId('root');
    }
  };

  const handleDeleteProject = async (id) => {
    await fetch(`https://idearbol.onrender.com/api/projects/${id}`, { method: 'DELETE' });
    const newProjects = projects.filter(p => p.id !== id); setProjects(newProjects);
    if (newProjects.length > 0) { setActiveProjectId(newProjects[0].id); setCurrentFolderId('root'); } else setActiveProjectId(null);
  };

  const addNode = async (tipo) => {
    try {
      if (!activeProjectId) return;
      const paneWidth = window.innerWidth - 256; 
      const paneHeight = window.innerHeight - 104; 

      const currentViewport = getViewport();
      const centerX = ((paneWidth / 2) - currentViewport.x) / currentViewport.zoom;
      const centerY = ((paneHeight / 2) - currentViewport.y) / currentViewport.zoom;

      // 👇 EL FIX DE LAS NOTAS EXCLUSIVAS 👇
      // Si estás en la pizarra y creas una nota, la hacemos 100% aislada
      if (viewMode === 'connections' && tipo === 'nota') {
        const newBoardNote = {
          id: `net-nota-${Date.now()}`, // Este ID especial evita que viaje a la BD
          type: 'nota',
          position: { x: centerX - 110, y: centerY - 110 },
          style: { width: 220, height: 220 },
          data: { label: '', type: 'nota', description: '', color: '#fde047', isBoardSpecific: true }
        };
        setNetworkNodes((nds) => [...nds, newBoardNote]);
        setIsFabOpen(false);
        setSelectedNode(newBoardNote);
        setIsModalOpen(true);
        return; // Detenemos la función aquí para que NO se guarde en el explorador
      }

      // --- Si NO es una nota de pizarra, sigue el proceso normal hacia la Base de Datos ---
      let position = { x: 0, y: 0 }; 
      let netPosition = { x: 0, y: 0 }; 

      if (viewMode === 'canvas') {
        position = { x: centerX - 130 + (Math.random() * 40), y: centerY - 50 + (Math.random() * 40) };
      } else {
        netPosition = { x: centerX - 130 + (Math.random() * 40), y: centerY - 50 + (Math.random() * 40) };
        const savedViewport = projectViewports[activeProjectId];
        if (savedViewport && savedViewport.zoom) {
          position = {
            x: ((paneWidth / 2) - savedViewport.x) / savedViewport.zoom - 130 + (Math.random() * 40),
            y: ((paneHeight / 2) - savedViewport.y) / savedViewport.zoom - 50 + (Math.random() * 40)
          };
        } else {
          position = { x: 100 + (Math.random() * 40), y: 100 + (Math.random() * 40) };
        }
      }

      const payload = { 
        label: '', type: tipo, description: '', parentId: currentFolderId, projectId: activeProjectId, subIdeas: [], color: tipo === 'grupo' ? '#10b981' : tipo === 'nota' ? '#fde047' : '#06b6d4', position
      };
      
      const res = await fetch(`https://idearbol.onrender.com/api/nodes`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
      });
      const dbNode = await res.json();

      let reactFlowType = 'custom';
      if (tipo === 'image') reactFlowType = 'image';
      if (tipo === 'nota') reactFlowType = 'nota';
      if (tipo === 'link') reactFlowType = 'link';

      const newNode = { 
        id: dbNode._id, type: reactFlowType, position: dbNode.position, 
        style: reactFlowType === 'nota' ? { width: 220, height: 220 } : {}, 
        data: { ...dbNode } 
      };
      
      setNodes((nds) => [...nds, newNode]); 
      setGlobalNodes((prev) => [...prev, newNode]); 

      if (viewMode === 'connections') {
        // 👇 EL FIX: Traducimos el tipo al idioma de la pizarra ('network') 👇
        let networkType = 'network';
        if (tipo === 'image') networkType = 'image';
        if (tipo === 'nota') networkType = 'nota';
        if (tipo === 'link') networkType = 'link';

        const newNetworkNode = {
          id: `net-${dbNode._id}`, 
          type: networkType, // Usamos la variable traducida aquí
          position: netPosition, 
          style: reactFlowType === 'nota' ? { width: 220, height: 220 } : {}, 
          data: { ...dbNode, originalId: dbNode._id }
        };
        setNetworkNodes((nds) => [...nds, newNetworkNode]);
      }
            
      setIsFabOpen(false); setSelectedNode(newNode); setIsModalOpen(true);
    } catch (error) {
      console.error("🚨 Error grave al crear el nodo:", error);
    }
  };


  const handleSaveNode = async (nodeId, newData) => {
    // 👇 ESCUDO: Si es una nota exclusiva de la pizarra, solo se actualiza localmente 👇
    if (String(nodeId).startsWith('net-nota-')) {
      setNetworkNodes((prevNet) => prevNet.map((netNode) => 
        netNode.id === nodeId ? { ...netNode, data: { ...netNode.data, ...newData } } : netNode
      ));
      return; 
    }

    const targetProjectId = newData.projectId || activeProjectId;
    const dataToSave = { ...newData, projectId: targetProjectId };

    await fetch(`https://idearbol.onrender.com/api/nodes/${nodeId}`, { 
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSave) 
    });

    if (targetProjectId !== activeProjectId) {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    } else {
      setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...dataToSave } } : node));
    }

    setGlobalNodes((prevGlobal) => prevGlobal.map((gn) => 
      gn.id === nodeId ? { ...gn, data: { ...gn.data, ...dataToSave } } : gn
    ));

    setNetworkNodes((prevNet) => prevNet.map((netNode) => 
      (netNode.data.originalId === nodeId || netNode.id === nodeId)
        ? { ...netNode, data: { ...netNode.data, ...dataToSave } } : netNode
    ));
  };


  const handleDeleteNode = async (nodeId) => {
    // 👇 ESCUDO: Si es nota exclusiva de la pizarra, se borra solo de ahí 👇
    if (String(nodeId).startsWith('net-nota-')) {
      setNetworkNodes((prevNet) => prevNet.filter((netNode) => netNode.id !== nodeId));
      return;
    }

    await fetch(`https://idearbol.onrender.com/api/nodes/${nodeId}`, { method: 'DELETE' });
    
    setGlobalNodes((prevGlobal) => prevGlobal.filter(gn => gn.id !== nodeId));
    setNodes((nds) => nds.filter((node) => node.id !== nodeId && node.data.parentId !== nodeId));
    
    setNetworkNodes((prevNet) => prevNet.filter((netNode) => 
      netNode.data.originalId !== nodeId && netNode.id !== nodeId
    ));
  };

  const onNodeDragStop = async (event, node) => {
    // 1. Guardamos la posición original en la base de datos
    await fetch(`https://idearbol.onrender.com/api/nodes/${node.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ position: node.position }) 
    });

    // 2. EL RADAR DE COLISIONES
    if (rfInstance && node.data.type !== 'grupo') {
      const nodosChocados = rfInstance.getIntersectingNodes(node);
      const grupoDestino = nodosChocados.find(n => n.data.type === 'grupo');

      if (grupoDestino) {
        // En lugar del feo window.confirm, abrimos nuestro modal elegante
        setConfirmDrop({
          isOpen: true,
          sourceNode: node,
          targetGroup: grupoDestino
        });
      }
    }
  };

  const renderTree = (parentId, level) => {
    const children = nodes.filter(n => n.data.parentId === parentId);
    if (children.length === 0) return null;
    return (
      <div className={level > 0 ? "ml-4 pl-5 border-l border-slate-700/60 relative" : "space-y-0.5"}>
        {children.map((node, index) => {
          const isGroup = node.data.type === 'grupo'; 
          const isImage = node.type === 'image'; // 👇 1. Detectamos si es una imagen
          const isActive = selectedNode?.id === node.id; 
          const isLast = index === children.length - 1;
          
          return (
            <div key={node.id} className="relative mt-1">
              {level > 0 && <div className="absolute w-5 h-[1px] bg-slate-700/60 -left-5 top-[19px]"></div>}
              {level > 0 && isLast && <div className="absolute w-[3px] h-[calc(100%-19px)] bg-[#0B0F17] -left-[21px] top-[20px]"></div>}
              <div className="flex items-center group w-fit" onClick={() => setSelectedNode(node)}>
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-indigo-900/30 border-indigo-700/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'border-transparent hover:bg-slate-800/40'}`}>
                  
                  {/* 👇 2. Le asignamos un icono de foto color rosa/púrpura si es imagen 👇 */}
                  {isGroup ? (
                    <div className="flex items-center gap-1.5"><ChevronRight size={14} className="text-slate-400" /><Folder size={18} className="text-emerald-500 fill-emerald-500/20" /></div>
                  ) : isImage ? (
                    <div className="flex items-center gap-1.5 ml-1 text-pink-400"><ImageIcon size={16} /></div>
                  ) : (
                    <div className="flex items-center gap-1.5 ml-1"><div className="relative w-4 h-4 flex items-center justify-center"><div className="absolute left-0 bottom-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" /><div className="absolute right-0 top-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full" /></div></div>
                  )}
                  
                  {/* 👇 3. Cambiamos el texto por defecto a "Nueva Imagen" 👇 */}
                  <span className={`text-[15px] font-medium tracking-wide ${isActive ? 'text-indigo-100' : 'text-slate-200'}`}>
                    {node.data.label || (isGroup ? 'Nuevo Grupo' : isImage ? 'Nueva Imagen' : 'Nueva Idea')}
                  </span>
                  
                  <button onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setIsModalOpen(true); }} className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white px-1 transition-opacity"><MoreHorizontal size={16} /></button>
                </div>
              </div>
              {isGroup && renderTree(node.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Acción al presionar "Cancelar"
  const cancelDrop = () => {
    setConfirmDrop({ isOpen: false, sourceNode: null, targetGroup: null });
  };

  // Acción al presionar "Sí, mover" (Aquí pusimos toda la magia visual)
  // Acción al presionar "Sí, mover" (Con posicionamiento inteligente)
  const executeDrop = () => {
    const { sourceNode, targetGroup } = confirmDrop;
    
    // 1. Cerramos el modal
    setConfirmDrop({ isOpen: false, sourceNode: null, targetGroup: null });

    // 2. Activamos la animación de encogerse
    setNodes((nds) => nds.map((n) => 
      n.id === sourceNode.id ? { ...n, data: { ...n.data, isAbsorbing: true } } : n
    ));

    // 3. Esperamos medio segundo para la animación
    setTimeout(async () => {
      try {
        // 👇 MAGIA MATEMÁTICA: ¿Dónde ponemos la nueva idea? 👇
        const ideasEnGrupo = nodes.filter(n => n.data.parentId === targetGroup.id);
        let nuevaPosicion = { x: 0, y: 0 };

        if (ideasEnGrupo.length > 0) {
          // Si ya hay ideas adentro, buscamos la última y la ponemos justito a un lado
          const ultimaIdea = ideasEnGrupo[ideasEnGrupo.length - 1];
          nuevaPosicion = { 
            x: ultimaIdea.position.x + 40,  // Desfasada a la derecha
            y: ultimaIdea.position.y + 100  // Desfasada hacia abajo
          };
        } else {
          // Si el grupo está vacío, la ponemos cerca del origen para que el fitView la centre bonito
          nuevaPosicion = { x: 100, y: 100 }; 
        }

        // Guardamos la nueva posición y la nueva carpeta en la Base de Datos
        await fetch(`https://idearbol.onrender.com/api/nodes/${sourceNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: targetGroup.id, position: nuevaPosicion })
        });
        
        // 4. Actualizamos la memoria del Explorador y ¡le quitamos la selección!
        setNodes((nds) => nds.map((n) => 
          n.id === sourceNode.id 
            ? { ...n, position: nuevaPosicion, selected: false, data: { ...n.data, parentId: targetGroup.id, isAbsorbing: false } }
            : n
        ));

        // 5. Le avisamos al Buscador Global
        setGlobalNodes((prev) => prev.map((n) => 
          n.id === sourceNode.id 
            ? { ...n, position: nuevaPosicion, data: { ...n.data, parentId: targetGroup.id } }
            : n
        ));

      } catch (error) {
        console.error("Error al absorber la idea:", error);
      }
    }, 500);
  };

  const getBreadcrumbs = () => {
    let crumbs = []; let currentId = currentFolderId;
    while (currentId !== 'root') {
      const node = nodes.find(n => n.id === currentId);
      if (node) { crumbs.unshift({ id: node.id, label: node.data.label }); currentId = node.data.parentId; } else break;
    }
    return crumbs;
  };

  // 👇 1. BÚSQUEDA DIVIDIDA: Buscamos ideas Y buscamos pizarras 👇
  const searchResultsNodes = searchQuery.trim() === '' ? [] : globalNodes.filter(n => (n.data.label || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.data.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
  
  const searchResultsBoards = searchQuery.trim() === '' ? [] : boards.filter(b => (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  // 👇 2. NUEVA FUNCIÓN: Qué hacer cuando le das clic a una pizarra en el buscador 👇
  const handleBoardSearchResultClick = (board) => {
    setSearchQuery('');           // Limpiamos el buscador
    setViewMode('connections');   // Cambiamos a la vista de conexiones
    setActiveBoard(board);        // Abrimos la pizarra que elegiste
    setNetworkNodes(board.nodes || []); // Cargamos sus nodos
    setNetworkEdges(board.edges || []); // Cargamos sus flechas
  };
  const visibleNodes = nodes.filter(node => node.data.projectId === activeProjectId && node.data.parentId === currentFolderId);

  // 🧠 1. EL PUENTE DE MEMORIA (Para que el teclado siempre tenga datos en vivo)
  const addNodeRef = useRef(addNode);
  useEffect(() => {
    addNodeRef.current = addNode;
  });

  // ⌨️ 2. LOS ATAJOS DE TECLADO (Usando el puente)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // El escudo de siempre
      const activeTag = document.activeElement.tagName.toLowerCase();
      if (isModalOpen || activeTag === 'input' || activeTag === 'textarea') return;
      if (viewMode === 'connections' && !activeBoard) return;
      if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      // ¡Aquí está la magia! Usamos addNodeRef.current en lugar de addNode directo
      if (key === 'a') { e.preventDefault(); addNodeRef.current('idea'); }
      if (key === 's') { e.preventDefault(); addNodeRef.current('grupo'); }
      if (key === 'd') { e.preventDefault(); addNodeRef.current('image'); }
      if (key === 'w') { e.preventDefault(); addNodeRef.current('nota'); }
      if (key === 'e') { e.preventDefault(); addNodeRef.current('link'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    
  // Ya no necesitamos poner un montón de dependencias aquí porque usamos el puente
  }, [viewMode, activeBoard, isModalOpen]);

  // 🧹 ESCUDO ANTI-FANTASMAS: Limpia las selecciones al entrar o salir de una carpeta
  useEffect(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
  }, [currentFolderId]);

  // 👇 3. INTERCEPTAMOS LOS CABLES JUSTO ANTES DE DIBUJARLOS 👇
  const displayedNetworkEdges = React.useMemo(() => {
    if (!isExportingLight) return networkEdges;
    
    return networkEdges.map(edge => {
      const c = edge.data?.color?.toLowerCase() || '#ffffff';
      if (c === '#ffffff' || c === '#fff') {
        // Le pasamos la bandera y el color oscuro
        return { ...edge, data: { ...edge.data, color: '#1e293b', isExportingLight: true } };
      }
      return edge;
    });
  }, [networkEdges, isExportingLight]);

  return (
    <div className="flex flex-col h-screen font-sans bg-background">
      {/* BARRA SUPERIOR */}
      <header className="h-14 border-b border-slate-800 bg-surface flex items-center justify-between px-4 shrink-0 z-50 relative">
        <div onClick={handleGoHome} className="flex items-center gap-2 text-indigo-400 font-bold text-xl cursor-pointer hover:text-indigo-300 transition-colors">
          <Component size={24} /><span>Nodara</span>
        </div>
        
        <div className="flex-1 max-w-xl px-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar ideas..."
              value={searchQuery} // (O como se llame tu variable)
              onChange={(e) => setSearchQuery(e.target.value)}
              
              // 👇 EL HECHIZO LIMPIADOR 👇
              onBlur={() => {
                setTimeout(() => {
                  setSearchQuery(''); // Pon aquí tu variable exacta en blanco
                }, 200); // 200ms es el tiempo perfecto para que no se note, pero no rompa los clics
              }}
              // 👆 ---------------------- 👆
              
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {searchQuery && (
            <div 
              className="absolute top-full mt-2 w-full left-0 bg-[#141923] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto scroll-elegante"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
              {(searchResultsNodes.length > 0 || searchResultsBoards.length > 0) ? (
                <div className="p-2 space-y-3">
                  
                  {/* --- SECCIÓN 1: RESULTADOS DE PIZARRAS --- */}
                  {searchResultsBoards.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider mb-1">Pizarras de Conexión</div>
                      {searchResultsBoards.map(board => (
                        <button key={board._id} onClick={() => handleBoardSearchResultClick(board)} className="w-full text-left flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20">
                            <Network size={16} className="text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-200 font-medium group-hover:text-white transition-colors">{board.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* --- SECCIÓN 2: RESULTADOS DE IDEAS --- */}
                  {searchResultsNodes.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider mb-1">Ideas y Grupos</div>
                      {searchResultsNodes.map(result => {
                        const isGroup = result.data.type === 'grupo';
                        const projName = projects.find(p => p.id === result.data.projectId)?.name || 'Desconocido';
                        return (
                          <button key={result.id} onClick={() => handleSearchResultClick(result)} className="w-full text-left flex flex-col p-2 hover:bg-slate-800 rounded-lg transition-colors group">
                            <div className="flex items-center gap-2 text-sm text-slate-200 font-medium group-hover:text-white transition-colors">
                              {isGroup ? <FolderClosed size={14} className="text-emerald-400"/> : <MessageSquare size={14} className="text-blue-400"/>}
                              {result.data.label || 'Sin título'}
                            </div>
                            <div className="text-xs text-slate-500 ml-6 flex items-center gap-1">En proyecto: <span className="text-slate-400">{projName}</span></div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No se encontraron resultados para "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center">
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-sm font-medium text-white shadow-lg transition-colors">
                {currentUser.initials}
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#141923] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"><Settings size={16} /> Configuración</button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2"><Moon size={16} /> Modo Oscuro</div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-600'}`}><div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"><UserCircle size={16} /> Cambiar de cuenta</button>
                  </div>
                  <div className="border-t border-slate-800 py-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={openLogin} className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-colors"><LogIn size={16} /> Entrar</button>
              <button onClick={openRegister} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"><UserPlus size={16} /> Registro</button>
            </div>
          )}
        </div>
      </header>

      {/* ÁREA DE TRABAJO */}
      <div className="flex flex-1 overflow-hidden z-0">
        <aside className="w-64 bg-surface border-r border-slate-800 flex flex-col shrink-0 relative">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tus Proyectos</span></div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!currentUser ? (
              <div className="text-center text-slate-500 text-sm mt-10">Inicia sesión para ver tus proyectos</div>
            ) : projects.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-10">Aún no tienes proyectos</div>
            ) : (
              projects.map(proj => {
                const rgb = hexToRGB(proj.color); const isActive = activeProjectId === proj.id;
                const style = isActive ? { backgroundColor: `rgba(${rgb}, 0.15)`, borderColor: `rgba(${rgb}, 0.3)`, color: `rgb(${rgb})` } : { backgroundColor: 'transparent', borderColor: 'transparent', color: '#cbd5e1' };
                return (
                  <div key={proj.id} onClick={() => { setActiveProjectId(proj.id); setCurrentFolderId('root'); }} className={`group flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${!isActive && 'hover:bg-slate-800/50'}`} style={style}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <LayoutDashboard size={18} style={{ color: isActive ? `rgb(${rgb})` : '#64748b' }} />
                      <span className="font-medium text-sm truncate">{proj.name}</span>
                    </div>
                    <button onClick={(e) => openEditProjectModal(e, proj)} className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700/50 ${isActive ? 'text-current hover:text-white' : 'text-slate-400 hover:text-slate-200'}`} title="Configurar"><Edit3 size={14} /></button>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800">
            <button disabled={!currentUser} onClick={openNewProjectModal} className="flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-2 rounded-lg text-sm w-full transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={16} /> Nuevo Proyecto
            </button>
          </div>
        </aside>

        <main className="flex-1 relative flex flex-col">
          {!currentUser ? (
             <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
               <LogIn size={48} className="mb-4 opacity-20" />
               <p>Inicia sesión o regístrate para comenzar a idear.</p>
               <button onClick={openRegister} className="mt-4 text-indigo-400 hover:text-indigo-300">Crear una cuenta gratis</button>
             </div>
          ) : activeProjectId ? (
            <>
              {/* BARRA DE NAVEGACIÓN DE VISTAS */}
              <div className="h-12 bg-[#0B0F17]/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 absolute top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-2">
                  {currentFolderId !== 'root' && <button onClick={() => { const currentFolder = nodes.find(n => n.id === currentFolderId); setCurrentFolderId(currentFolder ? currentFolder.data.parentId : 'root'); }} className="text-slate-400 hover:text-white mr-2 p-1 rounded hover:bg-slate-800 transition-colors"><ArrowLeft size={18} /></button>}
                  <button onClick={() => setCurrentFolderId('root')} className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Pizarrón Principal</button>
                  {getBreadcrumbs().map(crumb => (<React.Fragment key={crumb.id}><ChevronRight size={14} className="text-slate-600" /><button onClick={() => setCurrentFolderId(crumb.id)} className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">{crumb.label}</button></React.Fragment>))}
                </div>
                <div className="flex bg-[#141923] border border-slate-700 rounded-lg p-1">
                  <button onClick={() => setViewMode('canvas')} className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'canvas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}><LayoutGrid size={14} /> Explorador</button>
                  <button onClick={() => setViewMode('tree')} className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'tree' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}><ListTree size={14} /> Árbol</button>
                  <button onClick={() => setViewMode('connections')} className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'connections' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}><Network size={14} /> Conexiones</button>
                </div>
              </div>
              
              {/* ÁREA DE CONTENIDO */}
              <div className="flex-1 mt-12 relative bg-[#0B0F17]">
                
                {/* VISTA 1: EXPLORADOR */}
                {viewMode === 'canvas' && (
                  <ReactFlow 
                    nodes={visibleNodes} 
                    onNodesChange={onNodesChange} 
                    nodeTypes={nodeTypesCanvas} 
                    onNodeDoubleClick={onNodeDoubleClick} 
                    onNodeDragStop={onNodeDragStop} 
                    onPaneClick={closeAllMenus}
                    onNodeClick={closeAllMenus}
                    fitView 
                    className="dark" 
                    nodesConnectable={false} 
                    elementsSelectable={true} 
                    minZoom={0.1} 
                    maxZoom={1.5}
                    // LAS DOS LÍNEAS NUEVAS VAN AQUÍ 
                    onInit={setRfInstance}
                    onMoveEnd={onMoveEnd}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="#334155" gap={24} size={2} />
                    <Controls position="top-left" style={{ marginTop: '20px', marginLeft: '20px' }} className="!bg-[#141923] overflow-hidden !border !border-slate-800 shadow-xl !rounded-lg [&>button]:!bg-[#141923] [&>button]:!fill-slate-300 [&>button]:!border-b [&>button]:!border-slate-800 hover:[&>button]:!bg-slate-800 transition-colors" />
                    <MiniMap position="bottom-left" style={{ width: 220, height: 140, marginBottom: '24px', marginLeft: '24px' }} className="!bg-[#141923] !border !border-slate-800 !rounded-xl overflow-hidden shadow-2xl" maskColor="rgba(11, 15, 23, 0.7)" nodeColor={(node) => node.data.type === 'grupo' ? '#10b981' : '#3b82f6'} pannable={true} zoomable={true} />
                    {/* 👇 2. ESTA ES TU NUEVA FIRMA ELEGANTE */}
                    <Panel position="bottom-right" className="text-[10px] text-slate-500 font-mono bg-[#0B0F17]/50 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-800 pointer-events-none mb-1 mr-2 select-none">
                      v1.1.0
                    </Panel>
                  </ReactFlow>
                )}

                {/* VISTA 2: ÁRBOL */}
                {viewMode === 'tree' && (
                  <div className="p-10 h-full overflow-y-auto"><div className="max-w-5xl mx-auto"><div className="mb-8 pl-3"><h1 className="text-3xl font-semibold text-slate-100 mb-4 tracking-wide">{projects.find(p => p.id === activeProjectId)?.name || 'Proyecto'}</h1><div className="flex items-center gap-2 text-sm text-slate-400 font-medium"><ChevronLeft size={16} className="text-slate-500" /><button onClick={() => setCurrentFolderId('root')} className="hover:text-slate-200 transition-colors">Raíz</button>{getBreadcrumbs().map(crumb => (<React.Fragment key={crumb.id}><ChevronRight size={14} className="text-slate-600" /><button onClick={() => setCurrentFolderId(crumb.id)} className="hover:text-slate-200 transition-colors">{crumb.label}</button></React.Fragment>))}</div></div><div className="mt-6">{nodes.length === 0 ? (<div className="text-left text-slate-500 py-10 pl-4"><p>No hay nodos en este proyecto.</p><button onClick={() => setViewMode('canvas')} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm">Crear desde el Explorador</button></div>) : (renderTree('root', 0))}</div></div></div>
                )}

                {/* VISTA 3: EL NUEVO LIENZO DE CONEXIONES */}
              {viewMode === 'connections' && (
                <div className="absolute inset-0 flex flex-col bg-[#0B0F17] z-0">
                  {!activeBoard ? (
                    /* --- SUB-VISTA A: DASHBOARD DE PIZARRAS --- */
                    <div className="flex-1 overflow-y-auto scroll-elegante" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                      <div className="p-10 max-w-5xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h2 className="text-2xl font-bold text-white">Pizarras de Conexión</h2>
                            <p className="text-slate-400">Cruza y conecta ideas de varios proyectos</p>
                          </div>
                          <button 
                            onClick={() => { setIsCreatingBoard(true); setSelectedProjectIds(activeProjectId ? [activeProjectId] : []); }} 
                            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2 transition-colors"
                          >
                            <Plus size={18}/> Nueva Pizarra
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {boards.map(b => (
                            <div 
                              key={b._id} 
                              onClick={() => { setActiveBoard(b); setNetworkNodes(b.nodes || []); setNetworkEdges(b.edges || []); }} 
                              className="relative bg-[#141923] border border-slate-800 p-6 rounded-xl hover:border-indigo-500/50 cursor-pointer group transition-all"
                            >
                              {/* Botón de eliminar Pizarra */}
                              <button 
                                onClick={(e) => handleDeleteBoardClick(e, b)}
                                className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800/50 rounded-md hover:bg-red-500/10"
                                title="Eliminar pizarra"
                              >
                                <Trash2 size={16} />
                              </button>

                              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/20">
                                <Share2 className="text-indigo-400" size={24} />
                              </div>
                              <h3 className="font-bold text-lg text-white mb-1">{b.name}</h3>
                              <p className="text-xs text-slate-500">{b.linkedProjects?.length || 0} proyectos vinculados</p>
                            </div>
                          ))}
                          {boards.length === 0 && (
                            <div className="col-span-full text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500">
                              Aún no tienes pizarras. Crea una para empezar a conectar ideas.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- SUB-VISTA B: EL LIENZO DE LA PIZARRA ACTIVA --- */
                    <div className="flex-1 flex overflow-hidden relative">
                      {/* --- BOTONES DE CONTROL DE LA PIZARRA --- */}
                      <div className="absolute top-4 right-4 z-[60] flex items-center gap-3">
                        <button 
                          onClick={handleSaveBoard} 
                          className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold border border-emerald-500 backdrop-blur-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                        >
                          <Save size={14} /> Guardar Pizarra
                        </button>

                        {/* EL NUEVO MENÚ DE EXPORTACIÓN */}
                        <div className="relative" ref={exportMenuRef}>
                          <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            title="Opciones de exportación"
                          >
                            <Download size={16} />
                            <span className="text-sm font-medium hidden sm:inline">Exportar</span>
                          </button>

                          {isExportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 bg-[#141923] border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 w-64 z-50 flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
                              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider mb-1">Elige un formato</div>
                              
                              <button onClick={() => handleDownloadImage('dark')} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors text-left group">
                                <div className="p-1.5 bg-slate-800 group-hover:bg-[#0B0F17] rounded-md transition-colors"><Image size={16} className="text-indigo-400" /></div>
                                <div>
                                  <div className="font-semibold">Fondo Oscuro (Original)</div>
                                  <div className="text-[10px] text-slate-500">Ideal para pantallas</div>
                                </div>
                              </button>
                              
                              <button onClick={() => handleDownloadImage('transparent')} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors text-left group">
                                <div className="p-1.5 bg-slate-800 group-hover:bg-[#0B0F17] rounded-md transition-colors"><ImageOff size={16} className="text-emerald-400" /></div>
                                <div>
                                  <div className="font-semibold">Transparente (Oscuro)</div>
                                  <div className="text-[10px] text-slate-500">Sin fondo, mantiene colores</div>
                                </div>
                              </button>
                              
                              <button onClick={() => handleDownloadImage('light')} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors text-left group">
                                <div className="p-1.5 bg-slate-800 group-hover:bg-amber-500/10 rounded-md transition-colors"><Sun size={16} className="text-amber-400" /></div>
                                <div>
                                  <div className="font-semibold text-amber-400/90 group-hover:text-amber-400">Transparente (Modo Claro)</div>
                                  <div className="text-[10px] text-slate-500">Adapta el blanco a negro</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => setActiveBoard(null)} 
                          className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 backdrop-blur-sm shadow-xl flex items-center gap-2 transition-colors"
                        >
                          <ArrowLeft size={14} /> Volver
                        </button>
                      </div>
                      
                      {/* INVENTARIO FILTRADO MÚLTIPLE */}
                      <aside className="w-64 bg-[#0B0F17] border-r border-slate-800 flex flex-col z-10 shadow-xl shrink-0 h-full overflow-hidden relative">
                        
                        {/* 👇 HECHIZOS CSS GLOBALES 👇 */}
                        <style>{`
                          /* 1. El scroll elegante... */
                          .scroll-elegante::-webkit-scrollbar { width: 6px; }
                          .scroll-elegante::-webkit-scrollbar-track { background: transparent; }
                          .scroll-elegante::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 20px; }
                          .scroll-elegante::-webkit-scrollbar-thumb:hover { background-color: #4f46e5; }

                          /* 2. EL DISFRAZ MÁGICO */
                          .export-light-mode .cable-blanco {
                            stroke: #1e293b !important; 
                            filter: none !important;
                            transition: none !important; 
                          }
                          
                          .export-light-mode .punta-blanca * {
                            fill: #1e293b !important;
                            stroke: #1e293b !important;
                            transition: none !important; 
                          }
                        `}</style>

                        {/* Cabecera Fija */}
                        <div className="p-4 border-b border-slate-800/80 shrink-0 bg-[#0B0F17] z-20">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Elementos Disponibles</h3>
                        </div>
                        
                        <div className="relative flex-1 min-h-0">
                          <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 pb-8 scroll-elegante" 
                               style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                            
                            {globalNodes
                              .filter(n => n.data.projectId === activeProjectId)
                              .filter(n => !networkNodes.some(net => net.data.originalId === n.id))
                              .filter(n => n.type !== 'nota' && n.data?.type !== 'nota')
                              .map(n => {
                                const isImageNode = n.type === 'image' || n.data?.type === 'image';
                                const isLinkNode = n.type === 'link' || n.data?.type === 'link';
                                
                                return (
                                <div 
                                  key={n.id} 
                                  draggable 
                                  onDragStart={(e) => onDragStartInventory(e, n)} 
                                  className="flex items-center gap-3 p-3 bg-[#141923] border border-slate-700/50 hover:border-slate-500 rounded-lg cursor-grab active:cursor-grabbing transition-colors group shrink-0"
                                >
                                  <GripVertical size={16} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
                                  
                                  {/* Iconos */}
                                  {n.data.type === 'grupo' ? (
                                    <FolderClosed size={16} className="text-emerald-400 shrink-0" />
                                  ) : isImageNode ? (
                                    <ImageIcon size={16} className="text-pink-400 shrink-0" />
                                  ) : isLinkNode ? (
                                    <LinkIcon size={16} className="text-cyan-400 shrink-0" />
                                  ) : (
                                    <MessageSquare size={16} className="text-indigo-400 shrink-0" />
                                  )}
                                  
                                  <span className="text-sm font-medium text-slate-300 truncate">
                                    {n.data.label || (isImageNode ? 'Imagen' : isLinkNode ? 'Enlace' : 'Sin título')}
                                  </span>
                                </div>
                              )})}
                              
                              {/* Mensaje visual por si vacías el inventario */}
                              {globalNodes.filter(n => n.data.projectId === activeProjectId && !networkNodes.some(net => net.data.originalId === n.id) && n.type !== 'nota').length === 0 && (
                                <div className="text-center text-slate-600 text-xs mt-4">
                                  ¡Todas tus ideas están conectadas!
                                </div>
                              )}

                          </div>
                        </div>
                      </aside>

                      {/* --- ÁREA DEL LIENZO --- */}
                      <div className="flex-1 relative">
                        <ReactFlow 
                          nodes={networkNodes} 
                          edges={displayedNetworkEdges} 
                          onNodesChange={onNetworkNodesChange}
                          onEdgesChange={onNetworkEdgesChange} 
                          onConnect={onConnectNetwork} 
                          isValidConnection={isValidConnectionNetwork}
                          onEdgeDoubleClick={onEdgeDoubleClick}
                          
                          onEdgeClick={onEdgeClickNetwork}
                          onPaneClick={onPaneClickNetwork}
                          onNodeClick={closeAllMenus}
                          
                          onNodeDoubleClick={onNetworkNodeDoubleClick}
                          onNodeDragStart={onNodeDragStartNetwork}
                          onNodeDragStop={onNodeDragStopNetwork} 
                          connectionMode={ConnectionMode.Loose}
                          nodeTypes={nodeTypesNetwork} 
                          edgeTypes={edgeTypesNetwork} 
                          onDrop={onDropNetwork} 
                          onDragOver={onDragOverNetwork} 
                          fitView 
                          className="dark"
                          proOptions={{ hideAttribution: true }}
                        >
                          <Background color="#1e293b" gap={20} />
                          <Controls />
                          <Panel position="bottom-right" className="text-[10px] text-slate-500 font-mono bg-[#0B0F17]/50 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-800 pointer-events-none mb-1 mr-2 select-none">
                            v1.1.0
                          </Panel>
                        </ReactFlow>

                        {/* --- EL BASURERO FLOTANTE ANIMADO --- */}
                        {isDraggingNode && (
                          <div 
                            className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-56 h-16 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 z-[70] ${
                              isOverTrash 
                                ? 'bg-red-500 text-white scale-110 shadow-[0_0_40px_rgba(239,68,68,0.6)]' 
                                : 'bg-[#141923]/90 text-slate-400 border border-slate-700 backdrop-blur-md shadow-2xl'
                            }`}
                            onMouseEnter={() => setIsOverTrash(true)}
                            onMouseLeave={() => setIsOverTrash(false)}
                          >
                            <Trash2 size={isOverTrash ? 28 : 22} className={`transition-all ${isOverTrash ? 'animate-bounce' : ''}`} />
                            <span className="font-bold text-sm tracking-wide">
                              {isOverTrash ? '¡Suelta para quitar!' : 'Arrastra aquí para quitar'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* BOTÓN FLOTANTE (Solo en Explorador) */}
              { (viewMode === 'canvas' || (viewMode === 'connections' && activeBoard)) && (
                <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end gap-4 "ref={fabRef}>
                  {isFabOpen && (
                    <div className="bg-[#141923] border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-40">

                      {/* BOTÓN DE NOTA */}
                      <button
                        onClick={() => { addNode('nota'); setIsFabOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-full text-left whitespace-nowrap"
                      >
                        <StickyNote size={16} />
                        Nueva Nota
                      </button>

                      {/* BOTÓN DE ENLACE */}
                      <button
                        onClick={() => { addNode('link'); setIsFabOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors w-full text-left whitespace-nowrap"
                      >
                        <LinkIcon size={16} />
                        Nuevo Enlace
                      </button>
                      
                      <button onClick={() => addNode('idea')} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-blue-500/20 hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                        <MessageSquare size={14} /> Nueva Idea
                      </button>
                      
                      <button onClick={() => addNode('grupo')} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-md transition-colors flex items-center gap-2">
                        <FolderClosed size={14} /> Nuevo Grupo
                      </button>

                      {/* 👇 AQUÍ ENTRA EL NUEVO BOTÓN DE IMAGEN 👇 */}
                      <button onClick={() => addNode('image')} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-pink-500/20 hover:text-pink-400 rounded-md transition-colors flex items-center gap-2">
                        <ImageIcon size={14} /> Nueva Imagen
                      </button>

                    </div>
                  )}
                  <button onClick={() => setIsFabOpen(!isFabOpen)} className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform hover:scale-105">
                    <Plus size={32} className={`text-white transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
              <LayoutDashboard size={48} className="mb-4 opacity-20" />
              <p>Tu lienzo está vacío.</p>
              <button onClick={openNewProjectModal} className="mt-4 text-indigo-400 hover:text-indigo-300">Crea un proyecto para empezar</button>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL NUEVA PIZARRA --- */}
      {isCreatingBoard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#141923] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Configurar Nueva Pizarra</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Nombre de la Pizarra</label>
                <input 
                  type="text" 
                  value={newBoardName} 
                  onChange={(e) => { setNewBoardName(e.target.value); setBoardError(""); }} 
                  placeholder="Ej: Mapa de Personajes" 
                  // 👇 Si hay error, el borde se pone rojo brillante 👇
                  className={`w-full bg-[#0B0F17] border ${boardError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-all`} 
                />
                {/* 👇 Aquí aparece el texto de error elegantemente 👇 */}
                {boardError && (
                  <p className="text-red-400 text-xs mt-2 font-medium animate-in fade-in slide-in-from-top-1">
                    {boardError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setIsCreatingBoard(false); setBoardError(""); }} className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleCreateBoard} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">Crear Pizarra</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ELEGANTE PARA BORRAR PIZARRA --- */}
      {boardToDelete && (
        <div className="fixed inset-0 bg-[#0B0F17]/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 transition-opacity">
          <div className="bg-[#141923] border border-red-900/50 w-full max-w-sm rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] p-6 transform transition-all animate-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icono decorativo rojo */}
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Trash2 className="text-red-400" size={28} />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">¿Eliminar pizarra?</h3>
                <p className="text-sm text-slate-400">
                  Estás a punto de borrar <span className="text-slate-200 font-medium tracking-wide">"{boardToDelete.name}"</span>. Esta acción no se puede deshacer.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 w-full pt-4 mt-2 border-t border-slate-800">
                <button 
                  onClick={() => setBoardToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteBoard}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- BANNER FLOTANTE (TOAST) --- */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600/95 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center gap-3 border border-emerald-400/50 font-medium text-sm transition-all animate-bounce">
          <Save size={18} />
          {toastMessage}
        </div>
      )}

      <NodeEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} nodeData={selectedNode} onSave={handleSaveNode} onDelete={handleDeleteNode} projects={projects} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} projectData={projectToEdit} onSave={handleSaveProject} onDelete={handleDeleteProject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />

        {/* --- MODAL ELEGANTE DE ABSORCIÓN --- */}
      {confirmDrop.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0B0F17]/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#141923] border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 max-w-sm w-full mx-4 transform transition-all">
            
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icono decorativo */}
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <FolderClosed className="text-indigo-400" size={28} />
              </div>
              
              {/* Textos */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">¿Vincular idea?</h3>
                <p className="text-sm text-slate-400">
                  ¿Quieres mover <span className="text-slate-200 font-medium tracking-wide">"{confirmDrop.sourceNode?.data?.label || 'esta idea'}"</span> dentro del grupo <span className="text-indigo-400 font-medium tracking-wide">"{confirmDrop.targetGroup?.data?.label}"</span>?
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 w-full pt-4 mt-2 border-t border-slate-800">
                <button 
                  onClick={cancelDrop}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeDrop}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] transition-all"
                >
                  Sí, mover idea
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>

  );
}

export default function App() { return <ReactFlowProvider><IdearbolApp /></ReactFlowProvider>; }