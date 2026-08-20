import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Loader2,
  Send,
  UserPlus,
  Compass,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { SendOfferModal } from './SendOfferModal';

export function NetworkGraphView({
  focusPersonId = 'p1',
  currentUser,
  onSelectPerson,
  onViewProfile,
  onFindPath,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [centerId, setCenterId] = useState(focusPersonId);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filterTypes, setFilterTypes] = useState({
    Person: true,
    Skill: true,
    Project: true,
    Company: true,
  });

  // Selected node for inspector
  const [selectedNode, setSelectedNode] = useState(null);

  // Offer modal state from graph
  const [candidateForOffer, setCandidateForOffer] = useState(null);
  const [connectionSuccess, setConnectionSuccess] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Pointer & physics interaction state
  const stateRef = useRef({
    nodes: [],
    links: [],
    nodeMap: new Map(),
    transform: { x: 0, y: 0, scale: 1 },
    isPointerDown: false,
    isDraggingNode: false,
    isPanning: false,
    dragNode: null,
    pointerDownPos: { x: 0, y: 0 },
    lastPointer: { x: 0, y: 0 },
    hoveredNode: null,
    selectedNodeId: null,
    renderPending: false,
    dpr: 1,
    filterTypes: { Person: true, Skill: true, Project: true, Company: true },
  });

  // Sync active filters in ref
  useEffect(() => {
    stateRef.current.filterTypes = filterTypes;
    scheduleRender();
  }, [filterTypes]);

  // Update center ID when focusPersonId prop updates
  useEffect(() => {
    if (focusPersonId && focusPersonId !== centerId) {
      setCenterId(focusPersonId);
    }
  }, [focusPersonId]);

  // Request a single canvas repaint
  const scheduleRender = useCallback(() => {
    if (stateRef.current.renderPending) return;
    stateRef.current.renderPending = true;

    requestAnimationFrame(() => {
      stateRef.current.renderPending = false;
      drawCanvas();
    });
  }, []);

  // Main Canvas drawing function
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes, links, nodeMap, transform, hoveredNode, selectedNodeId, filterTypes: activeFilters, dpr } = stateRef.current;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Apply pan & zoom
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Subtle background dot grid
    ctx.fillStyle = '#E2E8F0';
    const dotSpacing = 36;
    const minX = -transform.x / transform.scale - 50;
    const minY = -transform.y / transform.scale - 50;
    const maxX = (width - transform.x) / transform.scale + 50;
    const maxY = (height - transform.y) / transform.scale + 50;

    const startX = Math.floor(minX / dotSpacing) * dotSpacing;
    const startY = Math.floor(minY / dotSpacing) * dotSpacing;

    for (let x = startX; x < maxX; x += dotSpacing) {
      for (let y = startY; y < maxY; y += dotSpacing) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // 2. Draw Links
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;
      if (!activeFilters[source.label] || !activeFilters[target.label]) continue;

      const isConnectedToSelected = selectedNodeId && (source.id === selectedNodeId || target.id === selectedNodeId);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (link.type === 'KNOWS') {
        ctx.strokeStyle = isConnectedToSelected ? '#FF007A' : '#08123B';
        ctx.lineWidth = isConnectedToSelected ? 4.5 : 3;
        ctx.setLineDash([]);
      } else if (link.type === 'HAS_SKILL') {
        ctx.strokeStyle = isConnectedToSelected ? '#0052FF' : '#6B82C0';
        ctx.lineWidth = isConnectedToSelected ? 3.5 : 2;
        ctx.setLineDash([5, 4]);
      } else if (link.type === 'WORKED_ON') {
        ctx.strokeStyle = isConnectedToSelected ? '#FF007A' : '#D946EF';
        ctx.lineWidth = isConnectedToSelected ? 4 : 2.5;
        ctx.setLineDash([]);
      } else {
        // WORKS_AT
        ctx.strokeStyle = isConnectedToSelected ? '#00D26A' : '#10B981';
        ctx.lineWidth = isConnectedToSelected ? 4 : 2.5;
        ctx.setLineDash([3, 4]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Draw Nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!activeFilters[node.label]) continue;

      const isCenter = node.id === centerId;
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNodeId === node.id;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Halo ring for selected or hovered node
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#0052FF' : '#FF007A';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, node.radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Brutal shadow
      ctx.fillStyle = '#08123B';
      ctx.beginPath();
      ctx.arc(4, 4, node.radius, 0, Math.PI * 2);
      ctx.fill();

      // Node Fill based on Label
      let fillColor = '#FFFFFF';
      if (isCenter) fillColor = '#FF007A';
      else if (node.label === 'Person') fillColor = '#FFFFFF';
      else if (node.label === 'Skill') fillColor = '#0052FF';
      else if (node.label === 'Project') fillColor = '#08123B';
      else if (node.label === 'Company') fillColor = '#00D26A';

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#08123B';
      ctx.lineWidth = isSelected || isHovered ? 4 : 2.5;
      ctx.stroke();

      // Monogram text
      ctx.fillStyle = node.label === 'Skill' || node.label === 'Project' || isCenter ? '#FFFFFF' : '#08123B';
      ctx.font = `900 ${isCenter ? '16px' : node.label === 'Person' ? '14px' : '12px'} "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.initial, 0, 0);

      // Label Pill
      const pillWidth = Math.max(node.pillWidth || 70, 60);
      const pillHeight = 20;
      const pillY = node.radius + 6;

      // Pill shadow
      ctx.fillStyle = '#08123B';
      ctx.fillRect(-pillWidth / 2 - 2, pillY + 2, pillWidth + 8, pillHeight);

      // Pill background
      ctx.fillStyle = isSelected ? '#0052FF' : isCenter ? '#08123B' : '#FFFFFF';
      ctx.fillRect(-pillWidth / 2 - 4, pillY, pillWidth + 8, pillHeight);
      ctx.strokeStyle = '#08123B';
      ctx.lineWidth = 2;
      ctx.strokeRect(-pillWidth / 2 - 4, pillY, pillWidth + 8, pillHeight);

      // Pill text
      ctx.fillStyle = isSelected || isCenter ? '#FFFFFF' : '#08123B';
      ctx.font = `bold 12px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.displayName, 0, pillY + pillHeight / 2);

      ctx.restore();
    }

    ctx.restore();
  };

  // Node Hit Testing (Accurately checks BOTH circle AND name label pill!)
  const findNodeAtPosition = (mouseX, mouseY) => {
    const { nodes, filterTypes: activeFilters } = stateRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!activeFilters[n.label]) continue;

      // 1. Check circle radius
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }

      // 2. Check label pill rectangular bounds
      const pillWidth = Math.max(n.pillWidth || 70, 60);
      const pillY = n.y + n.radius + 4;
      const minPillX = n.x - pillWidth / 2 - 6;
      const maxPillX = n.x + pillWidth / 2 + 6;
      const minPillY = pillY;
      const maxPillY = pillY + 24;

      if (mouseX >= minPillX && mouseX <= maxPillX && mouseY >= minPillY && mouseY <= maxPillY) {
        return n;
      }
    }
    return null;
  };

  // Layout computation (Stable, no continuous loop, perfectly balanced)
  const computeInitialLayout = (rawNodes, rawLinks) => {
    const width = containerRef.current?.clientWidth || 1000;
    const height = containerRef.current?.clientHeight || 750;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodeMap = new Map();
    const nodes = rawNodes.map((n, idx) => {
      const isCenter = n.id === centerId;
      const angle = (idx / (rawNodes.length || 1)) * Math.PI * 2;
      const dist = isCenter ? 0 : 180 + (idx % 4) * 65;

      const displayName = n.name && n.name.length > 22 ? n.name.slice(0, 20) + '…' : n.name || '';
      const initial = n.name ? n.name.charAt(0).toUpperCase() : '?';
      const pillWidth = Math.max(65, displayName.length * 8);

      const nodeObj = {
        ...n,
        x: isCenter ? centerX : centerX + Math.cos(angle) * dist,
        y: isCenter ? centerY : centerY + Math.sin(angle) * dist,
        radius: isCenter ? 34 : n.label === 'Person' ? 26 : 21,
        displayName,
        initial,
        pillWidth,
      };
      nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    const iterations = 70;
    const count = nodes.length;

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;

      for (let i = 0; i < count; i++) {
        const na = nodes[i];
        for (let j = i + 1; j < count; j++) {
          const nb = nodes[j];
          const dx = nb.x - na.x;
          const dy = nb.y - na.y;
          const distSq = dx * dx + dy * dy;
          const minDist = na.radius + nb.radius + 65;
          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = ((minDist - dist) / dist) * 0.18 * alpha;
            na.x -= dx * force;
            na.y -= dy * force;
            nb.x += dx * force;
            nb.y += dy * force;
          }
        }
      }

      for (let i = 0; i < rawLinks.length; i++) {
        const link = rawLinks[i];
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = link.type === 'KNOWS' ? 160 : 120;
          const force = (dist - targetDist) * 0.05 * alpha;
          source.x += (dx / dist) * force;
          source.y += (dy / dist) * force;
          target.x -= (dx / dist) * force;
          target.y -= (dy / dist) * force;
        }
      }

      for (let i = 0; i < count; i++) {
        const node = nodes[i];
        if (node.id === centerId) {
          node.x = centerX;
          node.y = centerY;
        } else {
          node.x += (centerX - node.x) * 0.008 * alpha;
          node.y += (centerY - node.y) * 0.008 * alpha;
        }
      }
    }

    stateRef.current.nodes = nodes;
    stateRef.current.links = rawLinks;
    stateRef.current.nodeMap = nodeMap;

    scheduleRender();
  };

  // Fetch Subgraph from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getPersonGraph(centerId)
      .then((data) => {
        if (isMounted) {
          const rawNodes = data.nodes || [];
          const rawLinks = data.links || [];
          setGraphData({ nodes: rawNodes, links: rawLinks });
          computeInitialLayout(rawNodes, rawLinks);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load network graph.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [centerId]);

  // Pointer Event Handlers (Accurate click vs drag, zero wobble)
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { transform } = stateRef.current;

    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    const hitNode = findNodeAtPosition(mouseX, mouseY);

    stateRef.current.isPointerDown = true;
    stateRef.current.pointerDownPos = { x: e.clientX, y: e.clientY };
    stateRef.current.lastPointer = { x: e.clientX, y: e.clientY };
    stateRef.current.dragNode = hitNode || null;
    stateRef.current.isDraggingNode = false;
    stateRef.current.isPanning = false;
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { isPointerDown, dragNode, transform } = stateRef.current;

    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    if (isPointerDown) {
      const distMoved = Math.hypot(
        e.clientX - stateRef.current.pointerDownPos.x,
        e.clientY - stateRef.current.pointerDownPos.y
      );

      // Only engage active dragging once movement exceeds 4 pixels (prevents accidental tap shifts!)
      if (distMoved > 4) {
        if (dragNode) {
          stateRef.current.isDraggingNode = true;
          dragNode.x = mouseX;
          dragNode.y = mouseY;
        } else {
          stateRef.current.isPanning = true;
          const dx = e.clientX - stateRef.current.lastPointer.x;
          const dy = e.clientY - stateRef.current.lastPointer.y;
          stateRef.current.transform.x += dx;
          stateRef.current.transform.y += dy;
        }
        stateRef.current.lastPointer = { x: e.clientX, y: e.clientY };
        scheduleRender();
      }
    } else {
      // Hover detection
      const hovered = findNodeAtPosition(mouseX, mouseY);
      if (stateRef.current.hoveredNode?.id !== hovered?.id) {
        stateRef.current.hoveredNode = hovered;
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
        scheduleRender();
      }
    }
  };

  const handlePointerUp = (e) => {
    const canvas = canvasRef.current;
    const { isPointerDown, dragNode, isDraggingNode, isPanning, transform } = stateRef.current;

    if (isPointerDown) {
      const distMoved = Math.hypot(
        e.clientX - stateRef.current.pointerDownPos.x,
        e.clientY - stateRef.current.pointerDownPos.y
      );

      // If user moved less than 5px, it is a deliberate TAP/CLICK!
      if (distMoved <= 5) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
        const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;
        const clickedNode = findNodeAtPosition(mouseX, mouseY);

        if (clickedNode) {
          setSelectedNode(clickedNode);
          stateRef.current.selectedNodeId = clickedNode.id;
          if (onSelectPerson && clickedNode.label === 'Person') {
            onSelectPerson(clickedNode.id);
          }
          scheduleRender();
        } else {
          // Tapped empty space -> clear selection
          setSelectedNode(null);
          stateRef.current.selectedNodeId = null;
          scheduleRender();
        }
      }
    }

    stateRef.current.isPointerDown = false;
    stateRef.current.isDraggingNode = false;
    stateRef.current.isPanning = false;
    stateRef.current.dragNode = null;
    if (canvas) {
      canvas.style.cursor = stateRef.current.hoveredNode ? 'pointer' : 'grab';
    }
  };

  // Double click on node to re-center
  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { transform } = stateRef.current;
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    const hit = findNodeAtPosition(mouseX, mouseY);
    if (hit) {
      if (hit.label === 'Person') {
        setCenterId(hit.id);
      }
      setSelectedNode(hit);
      stateRef.current.selectedNodeId = hit.id;
      scheduleRender();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.35, Math.min(2.5, stateRef.current.transform.scale * zoomFactor));
    stateRef.current.transform.scale = newScale;
    scheduleRender();
  };

  // High-DPI canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        stateRef.current.dpr = dpr;

        scheduleRender();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [scheduleRender]);

  // Send warm connection request directly from inspector
  const handleSendConnection = async () => {
    if (!selectedNode || selectedNode.label !== 'Person') return;
    setConnecting(true);
    setConnectionSuccess(null);
    try {
      const token = localStorage.getItem('startup_graph_token') || '';
      await api.sendConnectionRequest(
        {
          receiverId: selectedNode.id,
          context: `Connected through Interactive Network Map`,
          senderId: currentUser?.id || 'p1',
          senderName: currentUser?.name || 'Elena Rostova',
        },
        token
      );
      setConnectionSuccess(`Connection request sent to ${selectedNode.name}!`);
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      } catch (e) {}
    } catch (err) {
      setConnectionSuccess('Request sent.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with deliberate editorial styling */}
      <div className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#0052FF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md border border-white bg-[#0052FF] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
                COGNODB LIVING UNIVERSE
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
                SUBGRAPH CLUSTER
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Talent, Skills & Startup Relationship Map
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-mono-code mt-1 max-w-2xl leading-relaxed">
              Explore real connections between engineers, skills, and companies. Tap any circle to inspect profile details, extend team offers, or re-center the universe.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => computeInitialLayout(graphData.nodes || [], graphData.links || [])}
              className="brutal-btn bg-[#FF007A] text-white px-4 py-2 text-xs font-display font-extrabold uppercase shadow-[2px_2px_0px_#FFFFFF] hover:bg-[#E6006E]"
            >
              STABILIZE & RE-LAYOUT
            </button>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border-2 border-[#08123B] shadow-[2px_2px_0px_#08123B]">
          <span className="font-mono-code text-[11px] font-bold text-[#08123B] block mb-1">🔵 White Circles = People</span>
          <p className="text-[11px] font-mono-code text-[#4A5578]">
            Engineers, founders & recruiters.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border-2 border-[#08123B] shadow-[2px_2px_0px_#0052FF]">
          <span className="font-mono-code text-[11px] font-bold text-[#0052FF] block mb-1">🟣 Blue Circles = Skills</span>
          <p className="text-[11px] font-mono-code text-[#4A5578]">
            Languages, frameworks & architectures.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border-2 border-[#08123B] shadow-[2px_2px_0px_#FF007A]">
          <span className="font-mono-code text-[11px] font-bold text-[#FF007A] block mb-1">🔴 Dark Circles = Projects</span>
          <p className="text-[11px] font-mono-code text-[#4A5578]">
            High-scale repositories & products.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border-2 border-[#08123B] shadow-[2px_2px_0px_#00D26A]">
          <span className="font-mono-code text-[11px] font-bold text-[#008A3E] block mb-1">🟢 Green Circles = Companies</span>
          <p className="text-[11px] font-mono-code text-[#4A5578]">
            Companies, startups & labs.
          </p>
        </div>
      </div>

      {/* Top Controls Toolbar */}
      <div className="brutal-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-[#08123B] shadow-[3px_3px_0px_#08123B]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md border-2 border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-xs font-bold uppercase">
              GRAPH ENTITIES: {graphData.nodes?.length || 0}
            </span>
            <span className="font-mono-code text-xs text-[#4A5578]">
              {graphData.links?.length || 0} RELATIONSHIPS
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase mr-1">Filter:</span>
          <button
            onClick={() => setFilterTypes((p) => ({ ...p, Person: !p.Person }))}
            className={`px-3 py-1 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
              filterTypes.Person ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#08123B]' : 'bg-[#E2E8F0] text-[#7382A6]'
            }`}
          >
            PEOPLE
          </button>

          <button
            onClick={() => setFilterTypes((p) => ({ ...p, Skill: !p.Skill }))}
            className={`px-3 py-1 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
              filterTypes.Skill ? 'bg-[#0052FF] text-white shadow-[2px_2px_0px_#08123B]' : 'bg-[#E2E8F0] text-[#7382A6]'
            }`}
          >
            SKILLS
          </button>

          <button
            onClick={() => setFilterTypes((p) => ({ ...p, Project: !p.Project }))}
            className={`px-3 py-1 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
              filterTypes.Project ? 'bg-[#FF007A] text-white shadow-[2px_2px_0px_#08123B]' : 'bg-[#E2E8F0] text-[#7382A6]'
            }`}
          >
            PROJECTS
          </button>

          <button
            onClick={() => setFilterTypes((p) => ({ ...p, Company: !p.Company }))}
            className={`px-3 py-1 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
              filterTypes.Company ? 'bg-[#00D26A] text-[#08123B] shadow-[2px_2px_0px_#08123B]' : 'bg-[#E2E8F0] text-[#7382A6]'
            }`}
          >
            COMPANIES
          </button>
        </div>

        {/* Zoom & Canvas controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              stateRef.current.transform.scale = Math.min(2.5, stateRef.current.transform.scale * 1.2);
              scheduleRender();
            }}
            className="brutal-btn bg-white p-1.5 hover:bg-[#F4F6FB]"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              stateRef.current.transform.scale = Math.max(0.4, stateRef.current.transform.scale * 0.8);
              scheduleRender();
            }}
            className="brutal-btn bg-white p-1.5 hover:bg-[#F4F6FB]"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              stateRef.current.transform = { x: 0, y: 0, scale: 1 };
              scheduleRender();
            }}
            className="brutal-btn bg-white p-1.5 hover:bg-[#F4F6FB]"
            title="Reset Canvas View"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => computeInitialLayout(graphData.nodes || [], graphData.links || [])}
            className="brutal-btn bg-[#08123B] text-white p-1.5 hover:bg-[#0052FF]"
            title="Re-run Force Layout"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Container */}
      <div
        ref={containerRef}
        className="brutal-card relative w-full h-[760px] lg:h-[820px] bg-[#FFFFFF] overflow-hidden select-none border-2 border-[#08123B] shadow-[6px_6px_0px_#08123B]"
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 font-mono-code">
            <Loader2 className="h-8 w-8 animate-spin text-[#0052FF] mb-2" />
            <p className="font-bold text-xs uppercase text-[#08123B]">EXTRACTING SUBGRAPH FROM COGNODB...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-6 text-center font-mono-code">
            <p className="text-sm font-bold uppercase text-[#FF007A] mb-2">[GRAPH LOAD ERROR]</p>
            <p className="text-xs text-[#7382A6] max-w-md">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Interactive Node Inspector Panel (Bottom Right Drawer) */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-30 w-84 sm:w-96 rounded-2xl border-3 border-[#08123B] p-5 bg-white shadow-[6px_6px_0px_#08123B] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#08123B]/15 pb-2.5 mb-3">
              <span
                className={`font-mono-code text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  selectedNode.label === 'Person'
                    ? 'bg-[#0052FF] text-white border-[#0052FF]'
                    : selectedNode.label === 'Skill'
                    ? 'bg-[#08123B] text-white border-[#08123B]'
                    : selectedNode.label === 'Company'
                    ? 'bg-[#00D26A] text-[#08123B] border-[#00D26A]'
                    : 'bg-[#FF007A] text-white border-[#FF007A]'
                }`}
              >
                {selectedNode.label} ENTITY
              </span>

              <button
                onClick={() => {
                  setSelectedNode(null);
                  stateRef.current.selectedNodeId = null;
                  scheduleRender();
                }}
                className="rounded-md p-1 hover:bg-[#F4F6FB] text-[#7382A6] hover:text-[#08123B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Node Info Content */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-xl border-2 border-[#08123B] flex items-center justify-center font-display font-extrabold text-sm ${
                    selectedNode.label === 'Person'
                      ? 'bg-white text-[#08123B]'
                      : selectedNode.label === 'Skill'
                      ? 'bg-[#0052FF] text-white'
                      : selectedNode.label === 'Company'
                      ? 'bg-[#00D26A] text-[#08123B]'
                      : 'bg-[#FF007A] text-white'
                  }`}
                >
                  {selectedNode.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-extrabold text-[#08123B] truncate">
                    {selectedNode.name}
                  </h3>
                  {selectedNode.title && (
                    <p className="text-xs text-[#4A5578] font-mono-code truncate">{selectedNode.title}</p>
                  )}
                  {selectedNode.category && (
                    <p className="text-xs text-[#4A5578] font-mono-code">Category: {selectedNode.category}</p>
                  )}
                  {selectedNode.industry && (
                    <p className="text-xs text-[#4A5578] font-mono-code">Industry: {selectedNode.industry}</p>
                  )}
                </div>
              </div>

              {selectedNode.bio && (
                <p className="text-xs font-mono-code text-[#4A5578] bg-[#F4F6FB] p-2 rounded-lg border border-[#08123B]/10 line-clamp-2">
                  "{selectedNode.bio}"
                </p>
              )}

              {connectionSuccess && (
                <div className="p-2 bg-[#EBF7EE] border border-[#008A3E] rounded-lg text-xs font-mono-code font-bold text-[#008A3E] flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>{connectionSuccess}</span>
                </div>
              )}
            </div>

            {/* Actions for Person */}
            {selectedNode.label === 'Person' ? (
              <div className="space-y-2 pt-2 border-t-2 border-[#08123B]/15">
                <button
                  onClick={() => setCandidateForOffer(selectedNode)}
                  className="w-full brutal-btn bg-[#FF007A] text-white py-2 text-xs font-display font-extrabold uppercase hover:bg-[#E6006E] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#08123B]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>EXTEND TEAM OFFER</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={connecting}
                    onClick={handleSendConnection}
                    className="brutal-btn bg-[#0052FF] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center justify-center gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>CONNECT</span>
                  </button>

                  <button
                    onClick={() => onViewProfile && onViewProfile(selectedNode.id)}
                    className="brutal-btn bg-[#08123B] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#202E5C] flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>PROFILE</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCenterId(selectedNode.id)}
                    className="py-1.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] font-mono-code text-[11px] font-bold text-[#08123B] hover:bg-white text-center"
                  >
                    🎯 RE-CENTER
                  </button>

                  {onFindPath && (
                    <button
                      onClick={() => onFindPath(selectedNode.id)}
                      className="py-1.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] font-mono-code text-[11px] font-bold text-[#0052FF] hover:bg-white text-center"
                    >
                      🔗 WARM PATH
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t-2 border-[#08123B]/15">
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    stateRef.current.selectedNodeId = null;
                    scheduleRender();
                  }}
                  className="w-full brutal-btn bg-[#08123B] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF]"
                >
                  DONE
                </button>
              </div>
            )}
          </div>
        )}

        {/* Legend Box (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block rounded-xl border-2 border-[#08123B] bg-white/95 p-3.5 font-mono-code text-[11px] shadow-[3px_3px_0px_#08123B]">
          <p className="font-bold uppercase mb-1.5 text-[#08123B]">GRAPH RELATIONSHIPS</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 bg-[#08123B]" />
              <span>[:KNOWS] Social & Colleague</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 bg-[#0052FF] border-t border-dashed" />
              <span>[:HAS_SKILL] Proficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 bg-[#FF007A]" />
              <span>[:WORKED_ON] Project</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 bg-[#00D26A] border-t border-dotted" />
              <span>[:WORKS_AT] Employment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Extension Modal */}
      {candidateForOffer && (
        <SendOfferModal
          isOpen={Boolean(candidateForOffer)}
          onClose={() => setCandidateForOffer(null)}
          candidate={candidateForOffer}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
