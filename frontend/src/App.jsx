import React, { useState, useCallback, useEffect } from 'react';
import { Search, Plus, LayoutDashboard, Component, Folder, MessageSquare, ChevronRight, ChevronLeft, ArrowLeft, Edit3, 
  LogOut, Settings, Moon, UserCircle, LogIn, UserPlus, ListTree, LayoutGrid, Network, FolderClosed, 
  FolderOpen, MoreHorizontal, GripVertical, Share2, Save, Trash2 } from 'lucide-react';
import ReactFlow, { Background, Controls, applyNodeChanges, ReactFlowProvider, useReactFlow, MiniMap, useNodesState, useEdgesState, addEdge, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import NetworkNode from './NetworkNode';
import GradientEdge from './GradientEdge';
import NodeEditModal from './NodeEditModal';
import ProjectModal from './ProjectModal';
import AuthModal from './AuthModal';

const nodeTypesCanvas = { custom: CustomNode };
const nodeTypesNetwork = { network: NetworkNode };
const edgeTypesNetwork = { gradient: GradientEdge };

const hexToRGB = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex && hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
  return `${r}, ${g}, ${b}`;
};

function IdearbolApp() {
  const { project, fitView } = useReactFlow();

  const [currentUser, setCurrentUser] = useState(null); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  
  const [nodes, setNodes] = useState([]);
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

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

  useEffect(() => {
    const savedSession = localStorage.getItem('idearbol_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetch(`https://idearbol.onrender.com/api/projects/${currentUser._id}`).then(res => res.json()).then(data => {
          const formatted = data.map(p => ({ ...p, id: p._id }));
          setProjects(formatted);
          if (formatted.length > 0) { setActiveProjectId(formatted[0].id); setCurrentFolderId('root'); } 
          else setActiveProjectId(null);
          
          // 👇 ESTA ES LA LÍNEA NUEVA QUE DEBES AGREGAR
          fetchBoards(currentUser._id);
        }).catch(err => console.error(err));
    } else { setProjects([]); setNodes([]); setActiveProjectId(null); }
  }, [currentUser]);

  useEffect(() => {
    if (activeProjectId) {
      fetch(`https://idearbol.onrender.com/api/nodes/${activeProjectId}`).then(res => res.json()).then(data => {
          const formattedNodes = data.map(n => ({
            id: n._id, type: 'custom', position: n.position || { x: 100, y: 100 },
            data: { label: n.label, type: n.type, description: n.description, color: n.color, parentId: n.parentId, projectId: n.projectId, subIdeas: n.subIdeas }
          }));
          setNodes(formattedNodes);
        }).catch(err => console.error(err));
    } else setNodes([]);
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
    setSearchQuery(''); setActiveProjectId(node.data.projectId); setCurrentFolderId(node.data.parentId); 
    setSelectedNode(node); setIsModalOpen(true); 
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
    if (!newBoardName.trim()) return alert("Ponle un nombre a tu pizarra");
    if (selectedProjectIds.length === 0) return alert("Selecciona al menos un proyecto");
    
    const payload = { userId: currentUser._id, name: newBoardName, linkedProjects: selectedProjectIds };
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

  // --- FUNCIÓN PARA ELIMINAR UNA PIZARRA COMPLETA ---
  const handleDeleteBoard = async (event, boardId) => {
    event.stopPropagation(); // Evita que al dar clic al basurero se abra la pizarra
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta pizarra?")) return;
    
    try {
      await fetch(`https://idearbol.onrender.com/api/boards/${boardId}`, { method: 'DELETE' });
      setBoards(boards.filter(b => b._id !== boardId)); // La quitamos de la pantalla
      if (activeBoard?._id === boardId) setActiveBoard(null);
    } catch (err) {
      console.error("Error al eliminar la pizarra:", err);
    }
  };

  // --- FUNCIÓN PARA QUITAR UN NODO DEL LIENZO (DOBLE CLIC) ---
  const onNetworkNodeDoubleClick = useCallback((event, node) => {
    event.stopPropagation();
    // 1. Quitamos el nodo del lienzo (esto hará que regrese al inventario automáticamente)
    setNetworkNodes((nds) => nds.filter((n) => n.id !== node.id));
    // 2. Quitamos cualquier flecha que estuviera conectada a este nodo
    setNetworkEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
  }, [setNetworkNodes, setNetworkEdges]);

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

    const newNode = {
      id: `net-${fullNode.id}`, // Usamos su ID original para evitar duplicados
      type: 'network',
      position,
      // CAMBIO CLAVE: Guardamos el 'originalId' para saber quién es quién
      data: { ...fullNode.data, originalId: fullNode.id }, 
    };
    setNetworkNodes((nds) => nds.concat(newNode));
  }, [project, setNetworkNodes]);

  // --- LÓGICA DE CONEXIÓN MÁGICA (GRADIENTE) ---
  const onConnectNetwork = useCallback((params) => {
    const sourceNode = networkNodes.find(n => n.id === params.source);
    const targetNode = networkNodes.find(n => n.id === params.target);
    
    const newEdge = {
      ...params,
      type: 'gradient',
      data: {
        sourceColor: sourceNode?.data?.type === 'grupo' ? '#10b981' : '#6366f1',
        targetColor: targetNode?.data?.type === 'grupo' ? '#10b981' : '#6366f1',
      }
    };
    setNetworkEdges((eds) => addEdge(newEdge, eds));
  }, [networkNodes, setNetworkEdges]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    setNetworkEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, [setNetworkEdges]);


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
    if (!activeProjectId) return;
    const paneWidth = window.innerWidth - 256; const paneHeight = window.innerHeight - 104;
    const projectedCenter = project({ x: paneWidth / 2, y: paneHeight / 2 });
    const position = { x: projectedCenter.x - 130 + (Math.random() * 40), y: projectedCenter.y - 50 + (Math.random() * 40) };
    const payload = { label: '', type: tipo, description: '', parentId: currentFolderId, projectId: activeProjectId, subIdeas: [], color: tipo === 'grupo' ? '#10b981' : '#3b82f6', position };
    const res = await fetch(`https://idearbol.onrender.com/api/nodes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const dbNode = await res.json();
    const newNode = { id: dbNode._id, type: 'custom', position: dbNode.position, data: { ...dbNode } };
    setNodes((nds) => [...nds, newNode]); setIsFabOpen(false); setSelectedNode(newNode); setIsModalOpen(true);
  };

  const handleSaveNode = async (nodeId, newData) => {
    await fetch(`https://idearbol.onrender.com/api/nodes/${nodeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newData) });
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node));
  };

  const handleDeleteNode = async (nodeId) => {
    await fetch(`https://idearbol.onrender.com/api/nodes/${nodeId}`, { method: 'DELETE' });
    setNodes((nds) => nds.filter((node) => node.id !== nodeId && node.data.parentId !== nodeId));
  };

  const onNodeDragStop = async (event, node) => {
    await fetch(`https://idearbol.onrender.com/api/nodes/${node.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: node.position }) });
  };

  const renderTree = (parentId, level) => {
    const children = nodes.filter(n => n.data.parentId === parentId);
    if (children.length === 0) return null;
    return (
      <div className={level > 0 ? "ml-4 pl-5 border-l border-slate-700/60 relative" : "space-y-0.5"}>
        {children.map((node, index) => {
          const isGroup = node.data.type === 'grupo'; const isActive = selectedNode?.id === node.id; const isLast = index === children.length - 1;
          return (
            <div key={node.id} className="relative mt-1">
              {level > 0 && <div className="absolute w-5 h-[1px] bg-slate-700/60 -left-5 top-[19px]"></div>}
              {level > 0 && isLast && <div className="absolute w-[3px] h-[calc(100%-19px)] bg-[#0B0F17] -left-[21px] top-[20px]"></div>}
              <div className="flex items-center group w-fit" onClick={() => setSelectedNode(node)}>
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-indigo-900/30 border-indigo-700/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'border-transparent hover:bg-slate-800/40'}`}>
                  {isGroup ? <div className="flex items-center gap-1.5"><ChevronRight size={14} className="text-slate-400" /><Folder size={18} className="text-emerald-500 fill-emerald-500/20" /></div> : <div className="flex items-center gap-1.5 ml-1"><div className="relative w-4 h-4 flex items-center justify-center"><div className="absolute left-0 bottom-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" /><div className="absolute right-0 top-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full" /></div></div>}
                  <span className={`text-[15px] font-medium tracking-wide ${isActive ? 'text-indigo-100' : 'text-slate-200'}`}>{node.data.label || (isGroup ? 'Nuevo Grupo' : 'Nueva Idea')}</span>
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

  const getBreadcrumbs = () => {
    let crumbs = []; let currentId = currentFolderId;
    while (currentId !== 'root') {
      const node = nodes.find(n => n.id === currentId);
      if (node) { crumbs.unshift({ id: node.id, label: node.data.label }); currentId = node.data.parentId; } else break;
    }
    return crumbs;
  };

  const searchResults = searchQuery.trim() === '' ? [] : nodes.filter(n => (n.data.label || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.data.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const visibleNodes = nodes.filter(node => node.data.projectId === activeProjectId && node.data.parentId === currentFolderId);

  return (
    <div className="flex flex-col h-screen font-sans bg-background">
      {/* BARRA SUPERIOR */}
      <header className="h-14 border-b border-slate-800 bg-surface flex items-center justify-between px-4 shrink-0 z-50 relative">
        <div onClick={handleGoHome} className="flex items-center gap-2 text-indigo-400 font-bold text-xl cursor-pointer hover:text-indigo-300 transition-colors">
          <Component size={24} /><span>Ideárbol</span>
        </div>
        
        <div className="flex-1 max-w-xl px-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar ideas, grupos, proyectos..." className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>
          {searchQuery && (
            <div className="absolute top-full mt-2 w-full left-0 bg-[#141923] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-2 space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase px-2 py-1">Resultados</div>
                  {searchResults.map(result => {
                    const isGroup = result.data.type === 'grupo';
                    const projName = projects.find(p => p.id === result.data.projectId)?.name || 'Desconocido';
                    return (
                      <button key={result.id} onClick={() => handleSearchResultClick(result)} className="w-full text-left flex flex-col p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                          {isGroup ? <FolderClosed size={14} className="text-emerald-400"/> : <MessageSquare size={14} className="text-blue-400"/>}
                          {result.data.label}
                        </div>
                        <div className="text-xs text-slate-500 ml-6 flex items-center gap-1">En proyecto: <span className="text-slate-400">{projName}</span></div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No se encontraron resultados para "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center">
          {currentUser ? (
            <div className="relative">
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
                  <ReactFlow nodes={visibleNodes} onNodesChange={onNodesChange} nodeTypes={nodeTypesCanvas} onNodeDoubleClick={onNodeDoubleClick} onNodeDragStop={onNodeDragStop} fitView className="dark" nodesConnectable={false} elementsSelectable={true} minZoom={0.1} maxZoom={1.5}>
                    <Background color="#334155" gap={24} size={2} />
                    <Controls position="top-left" style={{ marginTop: '20px', marginLeft: '20px' }} className="!bg-[#141923] overflow-hidden !border !border-slate-800 shadow-xl !rounded-lg [&>button]:!bg-[#141923] [&>button]:!fill-slate-300 [&>button]:!border-b [&>button]:!border-slate-800 hover:[&>button]:!bg-slate-800 transition-colors" />
                    <MiniMap position="bottom-left" style={{ width: 220, height: 140, marginBottom: '24px', marginLeft: '24px' }} className="!bg-[#141923] !border !border-slate-800 !rounded-xl overflow-hidden shadow-2xl" maskColor="rgba(11, 15, 23, 0.7)" nodeColor={(node) => node.data.type === 'grupo' ? '#10b981' : '#3b82f6'} pannable={true} zoomable={true} />
                  </ReactFlow>
                )}

                {/* VISTA 2: ÁRBOL */}
                {viewMode === 'tree' && (
                  <div className="p-10 h-full overflow-y-auto"><div className="max-w-5xl mx-auto"><div className="mb-8 pl-3"><h1 className="text-3xl font-semibold text-slate-100 mb-4 tracking-wide">{projects.find(p => p.id === activeProjectId)?.name || 'Proyecto'}</h1><div className="flex items-center gap-2 text-sm text-slate-400 font-medium"><ChevronLeft size={16} className="text-slate-500" /><button onClick={() => setCurrentFolderId('root')} className="hover:text-slate-200 transition-colors">Raíz</button>{getBreadcrumbs().map(crumb => (<React.Fragment key={crumb.id}><ChevronRight size={14} className="text-slate-600" /><button onClick={() => setCurrentFolderId(crumb.id)} className="hover:text-slate-200 transition-colors">{crumb.label}</button></React.Fragment>))}</div></div><div className="mt-6">{nodes.length === 0 ? (<div className="text-left text-slate-500 py-10 pl-4"><p>No hay nodos en este proyecto.</p><button onClick={() => setViewMode('canvas')} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm">Crear desde el Explorador</button></div>) : (renderTree('root', 0))}</div></div></div>
                )}

                {/* VISTA 3: EL NUEVO LIENZO DE CONEXIONES */}
                {viewMode === 'connections' && (
                <div className="h-full flex flex-col bg-[#0B0F17]">
                  {!activeBoard ? (
                    /* --- SUB-VISTA A: DASHBOARD DE PIZARRAS --- */
                    <div className="p-10 max-w-5xl mx-auto w-full overflow-y-auto">
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
                            {/* Botón de eliminar Pizarra (Aparece al pasar el mouse) */}
                            <button 
                              onClick={(e) => handleDeleteBoard(e, b._id)}
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
                        <button 
                          onClick={() => setActiveBoard(null)} 
                          className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 backdrop-blur-sm shadow-xl flex items-center gap-2 transition-colors"
                        >
                          <ArrowLeft size={14} /> Volver
                        </button>
                      </div>
                      
                      {/* INVENTARIO FILTRADO MÚLTIPLE */}
                      <aside className="w-64 bg-[#0B0F17] border-r border-slate-800 p-4 overflow-y-auto z-10 shadow-xl flex flex-col gap-3">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Elementos Disponibles</h3>
                        {nodes
                          .filter(n => activeBoard.linkedProjects.some(lp => (lp._id || lp) === n.data.projectId))
                          .filter(n => !networkNodes.some(net => net.data.originalId === n.id)) // El filtro que evita duplicados (¡Tu idea!)
                          .map(n => (
                            <div 
                              key={n.id} 
                              draggable 
                              onDragStart={(e) => onDragStartInventory(e, n)} 
                              className="flex items-center gap-3 p-3 bg-[#141923] border border-slate-700/50 hover:border-slate-500 rounded-lg cursor-grab active:cursor-grabbing transition-colors group"
                            >
                              <GripVertical size={16} className="text-slate-600 group-hover:text-slate-400" />
                              {n.data.type === 'grupo' ? <FolderClosed size={16} className="text-emerald-400" /> : <MessageSquare size={16} className="text-indigo-400" />}
                              <span className="text-sm font-medium text-slate-300 truncate">{n.data.label || 'Sin título'}</span>
                            </div>
                        ))}
                      </aside>

                      {/* REACT FLOW */}
                      {/* --- ÁREA DEL LIENZO --- */}
                      {/* --- ÁREA DEL LIENZO --- */}
                      <div className="flex-1 relative">
                        <ReactFlow 
                          nodes={networkNodes} 
                          edges={networkEdges} 
                          onNodesChange={onNetworkNodesChange} 
                          onEdgesChange={onNetworkEdgesChange} 
                          onConnect={onConnectNetwork} 
                          isValidConnection={isValidConnectionNetwork}
                          onEdgeDoubleClick={onEdgeDoubleClick}
                          onNodeDoubleClick={onNetworkNodeDoubleClick}
                          onNodeDragStart={onNodeDragStartNetwork} /* <-- NUEVO: Avisa que agarraste un nodo */
                          onNodeDragStop={onNodeDragStopNetwork}   /* <-- NUEVO: Avisa que soltaste el nodo */
                          connectionMode={ConnectionMode.Loose}
                          nodeTypes={nodeTypesNetwork} 
                          edgeTypes={edgeTypesNetwork} 
                          onDrop={onDropNetwork} 
                          onDragOver={onDragOverNetwork} 
                          fitView 
                          className="dark"
                        >
                          <Background color="#1e293b" gap={20} />
                          <Controls />
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
              { (viewMode === 'canvas') && (
                <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end gap-4">
                  {isFabOpen && (
                    <div className="bg-[#141923] border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-40">
                      <button onClick={() => addNode('idea')} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-blue-500/20 hover:text-blue-400 rounded-md transition-colors flex items-center gap-2"><MessageSquare size={14} /> Nueva Idea</button>
                      <button onClick={() => addNode('grupo')} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-md transition-colors flex items-center gap-2"><FolderClosed size={14} /> Nuevo Grupo</button>
                    </div>
                  )}
                  <button onClick={() => setIsFabOpen(!isFabOpen)} className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform hover:scale-105"><Plus size={32} className={`text-white transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} /></button>
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

      {/* MODAL NUEVA PIZARRA */}
      {isCreatingBoard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#141923] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Configurar Nueva Pizarra</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Nombre de la Pizarra</label>
                <input 
                  type="text" 
                  value={newBoardName} 
                  onChange={(e) => setNewBoardName(e.target.value)} 
                  placeholder="Ej: Mapa de Personajes" 
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Proyectos a Vincular</label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {projects.map(proj => (
                    <label key={proj.id} className="flex items-center gap-3 p-2 bg-[#0B0F17] rounded-lg cursor-pointer hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedProjectIds.includes(proj.id)} 
                        onChange={(e) => {
                          if(e.target.checked) setSelectedProjectIds([...selectedProjectIds, proj.id]);
                          else setSelectedProjectIds(selectedProjectIds.filter(id => id !== proj.id));
                        }} 
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-transparent cursor-pointer" 
                      />
                      <span className="text-sm text-slate-300">{proj.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCreatingBoard(false)} className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleCreateBoard} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">Crear Pizarra</button>
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

      <NodeEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} nodeData={selectedNode} onSave={handleSaveNode} onDelete={handleDeleteNode} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} projectData={projectToEdit} onSave={handleSaveProject} onDelete={handleDeleteProject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default function App() { return <ReactFlowProvider><IdearbolApp /></ReactFlowProvider>; }