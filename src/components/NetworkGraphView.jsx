import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client';

export function NetworkGraphView({
  focusPersonId = 'p1',
  onSelectPerson,
  onViewProfile,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [centerId, setCenterId] = useState(focusPersonId);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states (triggers re-render and redraw)
  const [filterTypes, setFilterTypes] = useState({
    Person: true,
    Skill: true,
    Project: true,
    Company: true,
  });

  // Selected node for popup inspector
  const [selectedNode, setSelectedNode] = useState(null);

  // Low-level animation & interaction state (Refs to avoid component re-renders)
  const stateRef = useRef({
    nodes: [],
    links: [],
    nodeMap: new Map(),
    transform: { x: 0, y: 0, scale: 1 },
    isDragging: false,
    dragNode: null,
    dragStart: { x: 0, y: 0 },
    lastPointer: { x: 0, y: 0 },
    hoveredNode: null,
    renderPending: false,
    dpr: 1,
    filterTypes: { Person: true, Skill: true, Project: true, Company: true },
  });

  // Synchronize active filters in ref
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

  // Request a single canvas repaint without overhead
  const scheduleRender = useCallback(() => {
    if (stateRef.current.renderPending) return;
    stateRef.current.renderPending = true;

    requestAnimationFrame(() => {
      stateRef.current.renderPending = false;
      drawCanvas();
    });
  }, []);

  // Main Canvas drawing function (Optimized, zero unnecessary allocations)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes, links, nodeMap, transform, hoveredNode, filterTypes: activeFilters, dpr } = stateRef.current;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale for high-DPI
    ctx.clearRect(0, 0, width, height);

    // Apply pan & zoom
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Draw subtle background dot grid
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

    // 2. Draw Links - Bold, High-Contrast Neo-Brutalist Edges
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;
      if (!activeFilters[source.label] || !activeFilters[target.label]) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (link.type === 'KNOWS') {
        ctx.strokeStyle = '#08123B';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([]);
      } else if (link.type === 'HAS_SKILL') {
        ctx.strokeStyle = '#0052FF';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
      } else if (link.type === 'WORKED_ON') {
        ctx.strokeStyle = '#FF007A';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
      } else {
        // WORKS_AT
        ctx.strokeStyle = '#00D26A';
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 4]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Draw Nodes - Large, Crisp, Bold Neo-brutalist Badges
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!activeFilters[node.label]) continue;

      const isCenter = node.id === centerId;
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Pronounced Brutal Shadow
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
      ctx.lineWidth = isSelected || isHovered ? 4.5 : 3;
      ctx.stroke();

      // Bold Node Monogram
      ctx.fillStyle = node.label === 'Skill' || node.label === 'Project' || isCenter ? '#FFFFFF' : '#08123B';
      ctx.font = `900 ${isCenter ? '16px' : node.label === 'Person' ? '14px' : '12px'} "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.initial, 0, 0);

      // Pre-calculated Node Name Pill with Bold Border & Shadow
      const pillWidth = Math.max(node.pillWidth || 70, 60);
      const pillHeight = 20;
      const pillY = node.radius + 6;

      // Pill shadow
      ctx.fillStyle = '#08123B';
      ctx.fillRect(-pillWidth / 2 - 2, pillY + 2, pillWidth + 8, pillHeight);

      // Pill body
      ctx.fillStyle = isCenter ? '#08123B' : '#FFFFFF';
      ctx.fillRect(-pillWidth / 2 - 4, pillY, pillWidth + 8, pillHeight);
      ctx.strokeStyle = '#08123B';
      ctx.lineWidth = 2;
      ctx.strokeRect(-pillWidth / 2 - 4, pillY, pillWidth + 8, pillHeight);

      // Pill text
      ctx.fillStyle = isCenter ? '#FFFFFF' : '#08123B';
      ctx.font = `bold 12px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.displayName, 0, pillY + pillHeight / 2);

      ctx.restore();
    }

    ctx.restore();
  };

  // Instant layout computation with 60 synchronous relaxation ticks (0% battery drain after load)
  const computeInitialLayout = (rawNodes, rawLinks) => {
    const width = containerRef.current?.clientWidth || 1000;
    const height = containerRef.current?.clientHeight || 750;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodeMap = new Map();
    const nodes = rawNodes.map((n, idx) => {
      const isCenter = n.id === centerId;
      const angle = (idx / (rawNodes.length || 1)) * Math.PI * 2;
      // Wider radial spacing for expansive layout
      const dist = isCenter ? 0 : 180 + (idx % 4) * 65;
      
      const displayName = n.name && n.name.length > 20 ? n.name.slice(0, 18) + '…' : n.name || '';
      const initial = n.name ? n.name.charAt(0).toUpperCase() : '?';
      const pillWidth = Math.max(60, displayName.length * 7.5);

      const nodeObj = {
        ...n,
        x: isCenter ? centerX : centerX + Math.cos(angle) * dist,
        y: isCenter ? centerY : centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: isCenter ? 34 : n.label === 'Person' ? 26 : 21,
        displayName,
        initial,
        pillWidth,
      };
      nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    // Run 70 fast synchronous iterations with wider repulsive boundaries
    const iterations = 70;
    const count = nodes.length;

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;

      // 1. Repulsion (Expanded distance for airy, wide graph)
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

      // 2. Link springs (Wider target lengths)
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

      // 3. Keep center locked & damp toward center
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

  // Pointer event handlers (Ultra-responsive, no React re-rendering on mousemove)
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { transform, nodes, filterTypes: activeFilters } = stateRef.current;

    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    let clickedNode = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!activeFilters[n.label]) continue;
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
        clickedNode = n;
        break;
      }
    }

    stateRef.current.isDragging = true;
    stateRef.current.lastPointer = { x: e.clientX, y: e.clientY };

    if (clickedNode) {
      stateRef.current.dragNode = clickedNode;
      setSelectedNode(clickedNode);
      if (onSelectPerson && clickedNode.label === 'Person') {
        onSelectPerson(clickedNode.id);
      }
      canvas.style.cursor = 'grabbing';
    } else {
      stateRef.current.dragNode = null;
      canvas.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { isDragging, dragNode, transform, nodes, filterTypes: activeFilters } = stateRef.current;

    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;

    if (isDragging) {
      if (dragNode) {
        dragNode.x = mouseX;
        dragNode.y = mouseY;
      } else {
        const dx = e.clientX - stateRef.current.lastPointer.x;
        const dy = e.clientY - stateRef.current.lastPointer.y;
        stateRef.current.transform.x += dx;
        stateRef.current.transform.y += dy;
        stateRef.current.lastPointer = { x: e.clientX, y: e.clientY };
      }
      scheduleRender();
    } else {
      // Hover detection
      let hovered = null;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!activeFilters[n.label]) continue;
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
          hovered = n;
          break;
        }
      }

      if (stateRef.current.hoveredNode?.id !== hovered?.id) {
        stateRef.current.hoveredNode = hovered;
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
        scheduleRender();
      }
    }
  };

  const handlePointerUp = () => {
    const canvas = canvasRef.current;
    stateRef.current.isDragging = false;
    stateRef.current.dragNode = null;
    if (canvas) {
      canvas.style.cursor = stateRef.current.hoveredNode ? 'pointer' : 'grab';
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(2.5, stateRef.current.transform.scale * zoomFactor));
    stateRef.current.transform.scale = newScale;
    scheduleRender();
  };

  // High-DPI canvas sizing & Window resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        stateRef.current.dpr = dpr;
        scheduleRender();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [scheduleRender]);

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="brutal-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md border-2 border-[#08123B] bg-[#FF007A] text-white px-2 py-0.5 font-mono-code text-xs font-bold uppercase">
              CENTER NODE: {centerId}
            </span>
            <span className="font-mono-code text-xs text-[#4A5578]">
              {graphData.nodes?.length || 0} NODES // {graphData.links?.length || 0} EDGES
            </span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#08123B]">
            Interactive Topology & Subgraph Explorer
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterTypes((p) => ({ ...p, Person: !p.Person }))}
            className={`px-3 py-1 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
              filterTypes.Person ? 'bg-[#FFFFFF] text-[#08123B] shadow-[2px_2px_0px_#08123B]' : 'bg-[#E2E8F0] text-[#7382A6]'
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
              filterTypes.Project ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#FF007A]' : 'bg-[#E2E8F0] text-[#7382A6]'
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

        {/* Zoom and Re-center controls */}
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
            className="brutal-btn bg-[#FF007A] text-white p-1.5 hover:bg-[#E6006E]"
            title="Re-run Force Layout"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Container - Wider & Taller */}
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
          onWheel={handleWheel}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Interactive Node Inspector Panel (Bottom Right) */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 w-80 rounded-xl border-2 border-[#08123B] p-4 bg-white shadow-[4px_4px_0px_#08123B]">
            <div className="flex items-center justify-between border-b-2 border-[#08123B]/20 pb-2 mb-3">
              <span className="font-mono-code text-[10px] font-bold uppercase bg-[#08123B] text-white px-1.5 py-0.5 rounded">
                {selectedNode.label} NODE
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="font-mono-code text-xs font-bold hover:text-[#FF007A]"
              >
                CLOSE [X]
              </button>
            </div>

            <h3 className="font-display text-base font-extrabold text-[#08123B] mb-1">
              {selectedNode.name}
            </h3>

            {selectedNode.title && (
              <p className="text-xs text-[#4A5578] font-mono-code mb-2">{selectedNode.title}</p>
            )}

            {selectedNode.category && (
              <p className="text-xs text-[#4A5578] font-mono-code mb-2">Category: {selectedNode.category}</p>
            )}

            {selectedNode.industry && (
              <p className="text-xs text-[#4A5578] font-mono-code mb-2">Industry: {selectedNode.industry}</p>
            )}

            {selectedNode.label === 'Person' && (
              <div className="mt-3 pt-2 border-t-2 border-[#08123B]/15 flex items-center gap-2">
                <button
                  onClick={() => setCenterId(selectedNode.id)}
                  className="brutal-btn flex-1 bg-[#0052FF] text-white py-1.5 text-xs font-display font-extrabold uppercase text-center hover:bg-[#0042D9]"
                >
                  RE-CENTER GRAPH
                </button>
                <button
                  onClick={() => onViewProfile && onViewProfile(selectedNode.id)}
                  className="brutal-btn bg-[#08123B] text-white px-3 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#FF007A]"
                >
                  PROFILE
                </button>
              </div>
            )}
          </div>
        )}

        {/* Legend Box (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block rounded-xl border-2 border-[#08123B] bg-white/95 p-3.5 font-mono-code text-[11px] shadow-[3px_3px_0px_#08123B]">
          <p className="font-bold uppercase mb-1.5 text-[#08123B]">RELATIONSHIP LEGEND</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#08123B]" />
              <span>[:KNOWS] Social & Colleague</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#0052FF] border-t border-dashed" />
              <span>[:HAS_SKILL] Proficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#FF007A]" />
              <span>[:WORKED_ON] Project</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#00D26A] border-t border-dotted" />
              <span>[:WORKS_AT] Employment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
