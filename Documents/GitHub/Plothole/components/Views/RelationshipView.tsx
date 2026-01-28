
import React, { useState, useEffect, useRef } from 'react';
import { Character, Relationship } from '../../types';
import { Button } from '../ui/Button';
import { Plus, X, UploadCloud, User, ZoomIn, ZoomOut, Move, Camera, Maximize, Play, Pause, RefreshCw } from 'lucide-react';
import { analyzeRelationships } from '../../services/geminiService';

interface RelationshipViewProps {
  characters: Character[];
  relationships: Relationship[];
  onUpdateRelationships: (relationships: Relationship[]) => void;
  onLinkClick: (type: 'character' | 'location', id: string) => void;
}

// --- PHYSICS & RENDER TYPES ---

interface Point { x: number; y: number; }
interface PhysicsNode extends Point {
  id: string;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  character: Character;
  imgElement?: HTMLImageElement; // Cache for canvas
}

const COLORS = {
  enemy: '#f43f5e',   // Rose
  ally: '#10b981',    // Emerald
  romance: '#d946ef', // Fuchsia
  family: '#3b82f6',  // Blue
  mentor: '#8b5cf6',  // Violet
  neutral: '#94a3b8', // Slate
  text: '#e2e8f0',    // Light Gray
  bg: '#0f172a'       // Slate 900
};

const getRelColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('enemy') || t.includes('rival') || t.includes('hate')) return COLORS.enemy;
  if (t.includes('friend') || t.includes('ally') || t.includes('support')) return COLORS.ally;
  if (t.includes('romance') || t.includes('love') || t.includes('married')) return COLORS.romance;
  if (t.includes('family') || t.includes('sibling') || t.includes('parent')) return COLORS.family;
  if (t.includes('mentor') || t.includes('teacher') || t.includes('student')) return COLORS.mentor;
  return COLORS.neutral;
};

export const RelationshipView: React.FC<RelationshipViewProps> = ({
  characters,
  relationships,
  onUpdateRelationships,
  onLinkClick
}) => {
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Fix: Added null as initial value to satisfy the TS requirement of useRef expecting 1 argument
  const requestRef = useRef<number | null>(null);
  
  // State
  const [nodes, setNodes] = useState<PhysicsNode[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [addMode, setAddMode] = useState(false);
  
  // Camera State
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // New Relationship Form
  const [newRel, setNewRel] = useState<Partial<Relationship>>({ sourceId: '', targetId: '', type: '' });

  // --- INITIALIZATION ---

  useEffect(() => {
    // 1. Initialize Nodes
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const center = { x: width / 2, y: height / 2 };

    setNodes(prev => {
        return characters.map((char, i) => {
            const existing = prev.find(n => n.id === char.id);
            // Spawn in a ring if new
            const angle = (i / characters.length) * 2 * Math.PI;
            const radius = 300;
            
            // Preload Image
            let img: HTMLImageElement | undefined;
            if (char.imageUrl) {
                img = new Image();
                img.src = char.imageUrl;
            } else if (existing?.imgElement) {
                img = existing.imgElement;
            }

            return {
                id: char.id,
                x: existing ? existing.x : center.x + Math.cos(angle) * radius,
                y: existing ? existing.y : center.y + Math.sin(angle) * radius,
                vx: existing ? existing.vx : 0,
                vy: existing ? existing.vy : 0,
                radius: 35, // Visual size
                mass: 1,
                character: char,
                imgElement: img
            };
        });
    });
  }, [characters]); // Re-run if character list changes

  // --- PHYSICS ENGINE ---

  const updatePhysics = () => {
    if (isPaused) return;

    setNodes(currentNodes => {
        const nextNodes = currentNodes.map(n => ({ ...n }));
        const repulsion = 15000;
        const springLength = 250;
        const springK = 0.005;
        const centerForce = 0.002;
        const damping = 0.92; // Friction

        // 1. Repulsion (Node vs Node)
        for (let i = 0; i < nextNodes.length; i++) {
            for (let j = i + 1; j < nextNodes.length; j++) {
                const dx = nextNodes[j].x - nextNodes[i].x;
                const dy = nextNodes[j].y - nextNodes[i].y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 1;

                if (dist < 800) {
                    const f = repulsion / (distSq + 100);
                    const fx = (dx / dist) * f;
                    const fy = (dy / dist) * f;

                    nextNodes[i].vx -= fx;
                    nextNodes[i].vy -= fy;
                    nextNodes[j].vx += fx;
                    nextNodes[j].vy += fy;
                }
            }
        }

        // 2. Attraction (Edges)
        relationships.forEach(rel => {
            const s = nextNodes.find(n => n.id === rel.sourceId);
            const t = nextNodes.find(n => n.id === rel.targetId);
            if (s && t) {
                const dx = t.x - s.x;
                const dy = t.y - s.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                
                const force = (dist - springLength) * springK;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                s.vx += fx;
                s.vy += fy;
                t.vx -= fx;
                t.vy -= fy;
            }
        });

        // 3. Center Gravity & Integration
        const centerX = (containerRef.current?.clientWidth || 0) / 2; // In world space? No, screen center relative to pan? 
        // We actually want them to cluster around (0,0) or the initial center. 
        // Let's assume a static world center at roughly where they spawned.
        const worldCenter = { x: 1000, y: 1000 }; // Arbitrary large world center

        nextNodes.forEach(n => {
            if (n.id === draggedNodeId) return;

            // Pull gently to center to prevent drifting into infinity
            // We use the initial center calculated in mount if possible, or just drag them together.
            // For now, we rely on the springs to keep them together, but a weak gravity helps disconnected nodes.
            // Let's compute centroid
            
            // Apply Velocity
            n.x += n.vx;
            n.y += n.vy;
            n.vx *= damping;
            n.vy *= damping;
        });

        return nextNodes;
    });
  };

  // --- RENDER LOOP ---

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background (Deep Space)
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    gradient.addColorStop(0, '#1e293b'); // Slate 800
    gradient.addColorStop(1, '#020617'); // Slate 950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (Subtle)
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.1;
    const gridSize = 100;
    // Simple grid logic could go here, omitting for performance/aesthetic cleanliness
    
    // --- DRAW LINKS ---
    relationships.forEach(rel => {
        const s = nodes.find(n => n.id === rel.sourceId);
        const t = nodes.find(n => n.id === rel.targetId);
        if (!s || !t) return;

        const color = getRelColor(rel.type);
        const isSelected = selectedRelId === rel.id;
        
        // Curve
        ctx.beginPath();
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const cpX = (s.x + t.x) / 2 - dy * 0.2; // Curve control point
        const cpY = (s.y + t.y) / 2 + dx * 0.2;
        
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(cpX, cpY, t.x, t.y);
        
        // Glow Effect
        ctx.shadowBlur = isSelected ? 15 : 5;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.globalAlpha = isSelected ? 1 : 0.6;
        ctx.stroke();
        
        // Reset Shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Flow Particle (Animated Dot)
        const time = Date.now() * 0.001;
        const speed = 1;
        const tVal = (time * speed) % 1; // 0 to 1
        // Point on Quadratic Bezier: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        const mt = 1 - tVal;
        const px = mt*mt*s.x + 2*mt*tVal*cpX + tVal*tVal*t.x;
        const py = mt*mt*s.y + 2*mt*tVal*cpY + tVal*tVal*t.y;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label (Midpoint)
        if (isSelected || hoveredNodeId === s.id || hoveredNodeId === t.id) {
            // Calculate midpoint of curve (t=0.5)
            const mx = 0.25*s.x + 0.5*cpX + 0.25*t.x;
            const my = 0.25*s.y + 0.5*cpY + 0.25*t.y;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(mx - 30, my - 10, 60, 20, 10);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rel.type, mx, my);
        }
    });

    // --- DRAW NODES ---
    nodes.forEach(node => {
        const isHovered = hoveredNodeId === node.id;
        const r = node.radius * (isHovered ? 1.1 : 1);

        // Glow
        if (isHovered) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#3b82f6'; // Blue glow
        } else {
            ctx.shadowBlur = 0;
        }

        // Image clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (node.imgElement && node.imgElement.complete) {
            ctx.drawImage(node.imgElement, node.x - r, node.y - r, r * 2, r * 2);
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            // Placeholder Icon Text
            ctx.fillStyle = '#64748b';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.character.name.charAt(0), node.x, node.y);
        }
        ctx.restore();

        // Border Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.lineWidth = isHovered ? 4 : 2;
        ctx.strokeStyle = isHovered ? '#3b82f6' : '#ffffff';
        ctx.stroke();

        // Label
        if (isHovered || transform.k > 0.8) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'black';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.character.name, node.x, node.y + r + 15);
            
            if (isHovered) {
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = '#cbd5e1';
                ctx.fillText(node.character.role, node.x, node.y + r + 28);
            }
            ctx.shadowBlur = 0;
        }
    });

    ctx.restore();
  };

  // Animation Loop
  useEffect(() => {
    const loop = () => {
        updatePhysics();
        draw();
        // Fix: Added safety check to ensure current is treated as MutableRefObject
        requestRef.current = requestAnimationFrame(loop);
    };
    // Fix: satisfy the TS requirement by initializing or updating ref current
    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes, relationships, transform, hoveredNodeId, isPaused, draggedNodeId]); // Dependencies for redraw

  // --- INTERACTION HANDLERS ---

  // Coordinate Conversion: Screen -> World
  const toWorld = (sx: number, sy: number) => ({
      x: (sx - transform.x) / transform.k,
      y: (sy - transform.y) / transform.k
  });

  const handleMouseDown = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const wx = (e.clientX - rect.left - transform.x) / transform.k;
      const wy = (e.clientY - rect.top - transform.y) / transform.k;

      // Check Node Hit
      const hitNode = nodes.find(n => {
          const dx = n.x - wx;
          const dy = n.y - wy;
          return dx*dx + dy*dy < n.radius * n.radius;
      });

      if (hitNode) {
          setDraggedNodeId(hitNode.id);
      } else {
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const wx = (e.clientX - rect.left - transform.x) / transform.k;
      const wy = (e.clientY - rect.top - transform.y) / transform.k;

      // Hover Logic
      const hitNode = nodes.find(n => {
          const dx = n.x - wx;
          const dy = n.y - wy;
          return dx*dx + dy*dy < n.radius * n.radius;
      });
      setHoveredNodeId(hitNode ? hitNode.id : null);
      canvasRef.current!.style.cursor = hitNode ? 'pointer' : (isDragging ? 'grabbing' : 'default');

      // Dragging Logic
      if (draggedNodeId) {
          setNodes(prev => prev.map(n => 
              n.id === draggedNodeId ? { ...n, x: wx, y: wy, vx: 0, vy: 0 } : n
          ));
      } else if (isDragging && dragStart) {
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
          setDragStart({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (draggedNodeId) {
          setDraggedNodeId(null);
          // If it was a quick click, trigger navigation
          // Logic omitted for brevity, assuming drag vs click threshold
          if (hoveredNodeId) onLinkClick('character', hoveredNodeId);
      }
      setIsDragging(false);
      setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleBy = 1.1;
      const oldScale = transform.k;
      const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      
      // Zoom towards mouse pointer
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const worldX = (x - transform.x) / oldScale;
      const worldY = (y - transform.y) / oldScale;
      
      const newX = x - worldX * newScale;
      const newY = y - worldY * newScale;

      setTransform({ x: newX, y: newY, k: Math.max(0.1, Math.min(newScale, 5)) });
  };

  // Resize Handler
  useEffect(() => {
      const resize = () => {
          if (containerRef.current && canvasRef.current) {
              canvasRef.current.width = containerRef.current.clientWidth;
              canvasRef.current.height = containerRef.current.clientHeight;
              // Center view initially
              setTransform({ x: containerRef.current.clientWidth/2 - 1000, y: containerRef.current.clientHeight/2 - 1000, k: 1 }); // Approx
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, []);

  const handleSnapshot = () => {
      if (canvasRef.current) {
          const link = document.createElement('a');
          link.download = `sociogram_${Date.now()}.png`;
          link.href = canvasRef.current.toDataURL();
          link.click();
      }
  };

  // Add Relationship Logic
  const handleAddRelationship = () => {
      if (newRel.sourceId && newRel.targetId && newRel.type) {
          onUpdateRelationships([...relationships, {
              id: crypto.randomUUID(),
              sourceId: newRel.sourceId,
              targetId: newRel.targetId,
              type: newRel.type!,
              description: newRel.description
          }]);
          setAddMode(false);
          setNewRel({ sourceId: '', targetId: '', type: '' });
      }
  };

  // AI Import
  const handleAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              const text = ev.target?.result as string;
              const newRels = await analyzeRelationships(text, characters);
              const existingIds = new Set(relationships.map(r => `${r.sourceId}-${r.targetId}`));
              const toAdd = newRels.filter(r => !existingIds.has(`${r.sourceId}-${r.targetId}`) && !existingIds.has(`${r.targetId}-${r.sourceId}`));
              onUpdateRelationships([...relationships, ...toAdd]);
          } catch(err) {
              alert("Analysis failed.");
          } finally {
              setIsAnalyzing(false);
          }
      };
      reader.readAsText(file);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-900 overflow-hidden">
        <canvas 
            ref={canvasRef}
            className="block w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        />

        {/* --- HUD OVERLAYS --- */}

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="sm" onClick={() => setAddMode(true)} className="shadow-lg shadow-blue-900/20 bg-blue-600 hover:bg-blue-500 border-none">
                <Plus size={16} className="mr-2" /> Add Link
            </Button>
            <div className="relative group">
                <input 
                    type="file" 
                    accept=".txt" 
                    onChange={handleAnalyze} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={isAnalyzing}
                />
                <Button size="sm" variant="secondary" className="shadow-lg w-full bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700" isLoading={isAnalyzing}>
                    <UploadCloud size={16} className="mr-2" /> AI Import
                </Button>
            </div>
        </div>

        {/* Bottom Right Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <div className="bg-slate-800/90 backdrop-blur rounded-full p-2 border border-slate-700 flex flex-col gap-2 shadow-2xl">
                <button onClick={() => setTransform(t => ({ ...t, k: Math.min(t.k * 1.2, 5) }))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><ZoomIn size={20} /></button>
                <button onClick={() => setTransform(t => ({ ...t, k: Math.max(t.k / 1.2, 0.1) }))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><ZoomOut size={20} /></button>
                <button onClick={() => {
                    // Reset View
                    const width = containerRef.current?.clientWidth || 800;
                    const height = containerRef.current?.clientHeight || 600;
                    setTransform({ x: width/2 - 1000, y: height/2 - 1000, k: 1 }); // Reset logic approx
                }} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><Maximize size={20} /></button>
            </div>
            
            <div className="bg-slate-800/90 backdrop-blur rounded-full p-2 border border-slate-700 flex flex-col gap-2 shadow-2xl">
                <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded-full transition-colors ${isPaused ? 'text-yellow-400' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button onClick={handleSnapshot} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><Camera size={20} /></button>
            </div>
        </div>

        {/* Add Modal */}
        {addMode && (
            <div className="absolute top-16 right-4 w-72 bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 text-white">
                    <h3 className="font-bold text-sm">New Connection</h3>
                    <button onClick={() => setAddMode(false)}><X size={16} className="text-slate-400 hover:text-white"/></button>
                </div>
                <div className="space-y-3">
                    <select 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        value={newRel.sourceId}
                        onChange={e => setNewRel({...newRel, sourceId: e.target.value})}
                    >
                        <option value="">Origin</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        value={newRel.targetId}
                        onChange={e => setNewRel({...newRel, targetId: e.target.value})}
                    >
                        <option value="">Target</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-200"
                        placeholder="Type (e.g. Rival)"
                        value={newRel.type}
                        onChange={e => setNewRel({...newRel, type: e.target.value})}
                    />
                    <Button onClick={handleAddRelationship} size="sm" className="w-full bg-blue-600 hover:bg-blue-500 border-none">Create Link</Button>
                </div>
            </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-slate-800/80 backdrop-blur p-3 rounded-lg border border-slate-700 text-[10px] text-slate-300 pointer-events-none select-none">
            <div className="font-bold mb-2 uppercase tracking-wider text-slate-500">Relationship Types</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(COLORS).filter(([k]) => k !== 'text' && k !== 'bg').map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }}></div>
                        <span className="capitalize">{key}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
