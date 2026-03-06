import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, Plus, LayoutDashboard, Component, Folder, MessageSquare, 
  ChevronRight, ChevronLeft, ArrowLeft, Edit3, LogOut, Settings, Moon, UserCircle, LogIn, UserPlus, 
  ListTree, LayoutGrid, Network, FolderClosed, FolderOpen, MoreHorizontal, GripVertical
} from 'lucide-react';
import ReactFlow, { Background, Controls, applyNodeChanges, ReactFlowProvider, useReactFlow, MiniMap, useNodesState, useEdgesState, addEdge } from 'reactflow';
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


  // --- LÓGICA DE DRAG & DROP PARA CONEXIONES ---
  const onDragStartInventory = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverNetwork = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropNetwork = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = event.target.getBoundingClientRect();
    const nodeDataStr = event.dataTransfer.getData('application/reactflow');
    if (!nodeDataStr) return;
    
    const nodeData = JSON.parse(nodeDataStr);
    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode = {
      id: `net-${nodeData.id}-${Date.now()}`, 
      type: 'network',
      position,
      data: { ...nodeData }, 
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
                  <div className="flex h-full w-full">
                    {/* INVENTARIO IZQUIERDO */}
                    <div className="w-64 bg-[#0B0F17] border-r border-slate-800 p-4 shrink-0 overflow-y-auto z-10 flex flex-col gap-3 shadow-xl">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Arrastra al lienzo</h3>
                      {nodes.filter(n => n.data.projectId === activeProjectId).map(n => (
                        <div 
                          key={n.id} 
                          draggable 
                          onDragStart={(e) => onDragStartInventory(e, n.data)}
                          className="flex items-center gap-3 p-3 bg-[#141923] border border-slate-700/50 hover:border-slate-500 rounded-lg cursor-grab active:cursor-grabbing transition-colors group"
                        >
                          <GripVertical size={16} className="text-slate-600 group-hover:text-slate-400" />
                          {n.data.type === 'grupo' ? <FolderClosed size={16} className="text-emerald-400" /> : <MessageSquare size={16} className="text-indigo-400" />}
                          <span className="text-sm font-medium text-slate-300 truncate">{n.data.label || 'Sin título'}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* LA PIZARRA CONECTORA */}
                    <div className="flex-1 relative" onDragOver={onDragOverNetwork} onDrop={onDropNetwork}>
                      <ReactFlow 
                        nodes={networkNodes} 
                        edges={networkEdges} 
                        onNodesChange={onNetworkNodesChange} 
                        onEdgesChange={onNetworkEdgesChange} 
                        onConnect={onConnectNetwork}
                        onEdgeDoubleClick={onEdgeDoubleClick}
                        nodeTypes={nodeTypesNetwork} 
                        edgeTypes={edgeTypesNetwork} 
                        fitView 
                        className="dark" 
                        minZoom={0.1} maxZoom={2}
                      >
                        <Background color="#1e293b" gap={32} size={2} variant="dots" />
                        <Controls className="!bg-[#141923] overflow-hidden !border !border-slate-800 shadow-xl !rounded-lg" />
                      </ReactFlow>
                    </div>
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

      <NodeEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} nodeData={selectedNode} onSave={handleSaveNode} onDelete={handleDeleteNode} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} projectData={projectToEdit} onSave={handleSaveProject} onDelete={handleDeleteProject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default function App() { return <ReactFlowProvider><IdearbolApp /></ReactFlowProvider>; }