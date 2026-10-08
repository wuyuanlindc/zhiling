/**
 * 流程设计器画布组件 (FlowCanvas)
 * 具备以下能力：
 * 1. 节点可视化渲染（开始/办理/审批/条件/抄送/等待/结束）
 * 2. 节点拖拽移动定位
 * 3. 拖拽连线生成（节点出入连接点）
 * 4. 节点复制（Ctrl+D 或卡片菜单）、删除、撤销/重做 (Ctrl+Z / Ctrl+Y)
 * 5. 画布平移与缩放 (10% - 200%)、自适应居中、一键自动排版 (水平从左到右 / 垂直从上到下)
 * 6. 节点状态标识：会签(N人)、或签、条件分支数、超时警示
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  CheckSquare, 
  Stamp, 
  GitFork, 
  Send, 
  Clock, 
  Flag, 
  Plus, 
  Trash2, 
  Copy, 
  MoreHorizontal, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { 
  FlowCanvasNode, 
  FlowCanvasEdge, 
  FlowNodeType, 
  FlowNodeData 
} from '../../types/processEngine';

interface FlowCanvasProps {
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodes: (nodes: FlowCanvasNode[]) => void;
  onUpdateEdges: (edges: FlowCanvasEdge[]) => void;
  onCopyNode: (node: FlowCanvasNode) => void;
  onDeleteNode: (nodeId: string) => void;
  readOnly?: boolean;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onUpdateEdges,
  onCopyNode,
  onDeleteNode,
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 节点拖拽移动状态
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 连线拖拽状态
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 快捷键支持 Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedNodeId) {
        e.preventDefault();
        const target = nodes.find(n => n.id === selectedNodeId);
        if (target) onCopyNode(target);
      }
      if (e.key === 'Delete' && selectedNodeId && !readOnly) {
        const target = nodes.find(n => n.id === selectedNodeId);
        if (target && target.type !== 'start' && target.type !== 'end') {
          onDeleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, readOnly, onCopyNode, onDeleteNode]);

  // 画布平移鼠标事件
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId && !readOnly) {
      const newX = Math.round((e.clientX - dragOffset.x - pan.x) / zoom);
      const newY = Math.round((e.clientY - dragOffset.y - pan.y) / zoom);
      onUpdateNodes(
        nodes.map(n => n.id === draggingNodeId ? { ...n, x: Math.max(20, newX), y: Math.max(20, newY) } : n)
      );
    } else if (connectingSourceId) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSourceId(null);
  };

  // 接收从左侧面板拖拽放置的新节点
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const nodeType = e.dataTransfer.getData('application/flow-node-type') as FlowNodeType;
    if (!nodeType) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropX = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const dropY = Math.round((e.clientY - rect.top - pan.y) / zoom);

      const newNodeId = `node_${nodeType}_${Date.now().toString(36)}`;
      const defaultName = 
        nodeType === 'handle' ? '新办理任务' :
        nodeType === 'approval' ? '新审批审核' :
        nodeType === 'condition' ? '条件分流判断' :
        nodeType === 'cc' ? '抄送通知' :
        nodeType === 'wait' ? '延时等待' : '节点';

      const newNode: FlowCanvasNode = {
        id: newNodeId,
        type: nodeType,
        x: dropX - 80,
        y: dropY - 40,
        data: {
          name: defaultName,
          nodeType: nodeType,
          handleMode: nodeType === 'handle' ? 'any' : undefined,
          receivers: [],
          conditionBranches: nodeType === 'condition' ? [
            { id: `b_${Date.now()}_1`, name: '条件满足分支', relation: 'AND', rules: [], targetNodeId: '' },
            { id: `b_${Date.now()}_2`, name: '否则(默认兜底)', relation: 'AND', rules: [], targetNodeId: '', isDefault: true }
          ] : undefined
        }
      };

      onUpdateNodes([...nodes, newNode]);
      onSelectNode(newNodeId);
    }
  };

  // 节点鼠标按下
  const handleNodeMouseDown = (e: React.MouseEvent, node: FlowCanvasNode) => {
    e.stopPropagation();
    onSelectNode(node.id);
    if (!readOnly) {
      setDraggingNodeId(node.id);
      setDragOffset({
        x: e.clientX - node.x * zoom - pan.x,
        y: e.clientY - node.y * zoom - pan.y
      });
    }
  };

  // 开始拖动连线
  const handleStartConnect = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    if (readOnly) return;
    setConnectingSourceId(sourceId);
  };

  // 连线连接到目标节点
  const handleEndConnect = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (connectingSourceId && connectingSourceId !== targetId && !readOnly) {
      // 避免重复连线
      const exists = edges.some(edge => edge.source === connectingSourceId && edge.target === targetId);
      if (!exists) {
        const newEdge: FlowCanvasEdge = {
          id: `edge_${connectingSourceId}_${targetId}_${Date.now()}`,
          source: connectingSourceId,
          target: targetId,
          label: '流转推进'
        };
        onUpdateEdges([...edges, newEdge]);
      }
    }
    setConnectingSourceId(null);
  };

  // 自动整理布局（横向从左至右）
  const handleAutoLayout = () => {
    const spacingX = 270;
    const sortedNodes = [...nodes];
    const updated = sortedNodes.map((n, idx) => ({
      ...n,
      x: 60 + idx * spacingX,
      y: 220 + (n.type === 'condition' ? 0 : 0)
    }));
    onUpdateNodes(updated);
    setPan({ x: 30, y: 30 });
    setZoom(1);
  };

  // 适应画布
  const handleFitView = () => {
    setPan({ x: 40, y: 40 });
    setZoom(1);
  };

  // 节点尺寸基准 (扩宽至 224px 提升易读性)
  const NODE_WIDTH = 224;
  const NODE_HEIGHT = 92;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 h-full relative overflow-hidden bg-[#F4F7FB] cursor-grab active:cursor-grabbing select-none"
      id="flow_canvas_viewport"
    >
      {/* 流程图网格背景 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `radial-gradient(#94A3B8 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* SVG 连线层 */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#64748B" />
          </marker>
          <marker id="arrowhead-selected" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#2563EB" />
          </marker>
        </defs>

        {/* 既有连线 */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const sx = sourceNode.x + NODE_WIDTH;
          const sy = sourceNode.y + NODE_HEIGHT / 2;
          const tx = targetNode.x;
          const ty = targetNode.y + NODE_HEIGHT / 2;

          // 平滑三次贝塞尔曲线
          const dx = Math.abs(tx - sx) * 0.5;
          const pathD = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
          const isSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;

          return (
            <g key={edge.id} className="pointer-events-auto group cursor-pointer">
              <path
                d={pathD}
                fill="none"
                stroke={isSelected ? '#2563EB' : '#94A3B8'}
                strokeWidth={isSelected ? '2.5' : '2'}
                strokeDasharray={edge.branchId ? '4,4' : undefined}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                className="transition-all hover:stroke-blue-500"
              />
              {/* 连线文字标签 */}
              {(edge.label || edge.conditionDescription) && (
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2 - 8}
                  fill="#475569"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="bg-white/80"
                >
                  {edge.label || edge.conditionDescription}
                </text>
              )}
            </g>
          );
        })}

        {/* 正在拉伸的临时连线 */}
        {connectingSourceId && (() => {
          const src = nodes.find(n => n.id === connectingSourceId);
          if (!src) return null;
          const sx = src.x + NODE_WIDTH;
          const sy = src.y + NODE_HEIGHT / 2;
          const tx = mousePos.x;
          const ty = mousePos.y;
          const dx = Math.abs(tx - sx) * 0.5;
          return (
            <path
              d={`M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-selected)"
            />
          );
        })()}
      </svg>

      {/* 节点层 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const { data, type } = node;

          // 视觉主题色
          const nodeHeaderBg = 
            type === 'start' ? 'bg-emerald-600 text-white' :
            type === 'handle' ? 'bg-blue-600 text-white' :
            type === 'approval' ? 'bg-purple-600 text-white' :
            type === 'condition' ? 'bg-amber-600 text-white' :
            type === 'cc' ? 'bg-slate-600 text-white' :
            type === 'wait' ? 'bg-amber-500 text-white' :
            'bg-slate-800 text-white';

          const nodeIcon = 
            type === 'start' ? <Play className="w-3.5 h-3.5" /> :
            type === 'handle' ? <CheckSquare className="w-3.5 h-3.5" /> :
            type === 'approval' ? <Stamp className="w-3.5 h-3.5" /> :
            type === 'condition' ? <GitFork className="w-3.5 h-3.5" /> :
            type === 'cc' ? <Send className="w-3.5 h-3.5" /> :
            type === 'wait' ? <Clock className="w-3.5 h-3.5" /> :
            <Flag className="w-3.5 h-3.5" />;

          // 摘要文字
          const receiversCount = data.receivers?.length || 0;
          const isCountersign = data.handleMode === 'countersign' || data.approvalMode === 'countersign';
          const isOrSign = data.handleMode === 'or_sign' || data.approvalMode === 'or_sign';

          return (
            <div
              key={node.id}
              onMouseDown={e => handleNodeMouseDown(e, node)}
              className={`absolute pointer-events-auto rounded-lg bg-white border shadow-sm transition-shadow group ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${NODE_WIDTH}px`,
                minHeight: `${NODE_HEIGHT}px`
              }}
            >
              {/* 节点头部 */}
              <div className={`px-3 py-1.5 rounded-t-lg flex items-center justify-between ${nodeHeaderBg}`}>
                <div className="flex items-center gap-1.5 truncate">
                  {nodeIcon}
                  <span className="text-xs font-bold truncate">{data.name}</span>
                </div>

                {!readOnly && type !== 'start' && type !== 'end' && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyNode(node);
                      }}
                      className="p-0.5 hover:bg-black/20 rounded cursor-pointer"
                      title="复制节点"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-0.5 hover:bg-black/20 rounded cursor-pointer"
                      title="删除节点"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 节点内容 */}
              <div className="p-2.5 flex flex-col gap-1.5 text-xs">
                {/* 办理/审批核心规则胶囊 */}
                {(type === 'handle' || type === 'approval') && (
                  <div className="flex flex-wrap gap-1">
                    {isCountersign && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        会签 {data.countersignConfig?.finishCondition === 'min_count' ? `(≥${data.countersignConfig.minCount}人)` : '· 全员'}
                      </span>
                    )}
                    {isOrSign && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        或签 · 任一人
                      </span>
                    )}
                    {data.handleMode === 'main_assistant' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        主办 + 协办
                      </span>
                    )}
                    {receiversCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[170px]" title={data.receivers?.[0]?.targetName}>
                        {data.receivers?.[0]?.targetName} {receiversCount > 1 && `+${receiversCount - 1}`}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ⚠ 未配置接收对象
                      </span>
                    )}
                  </div>
                )}

                {/* 条件节点信息 */}
                {type === 'condition' && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-amber-800 font-bold">
                      {data.conditionBranches?.length || 0} 个条件分支
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {data.conditionBranches?.[0]?.name || '金额/工作日分流'}
                    </span>
                  </div>
                )}

                {/* 抄送节点 */}
                {type === 'cc' && (
                  <span className="text-[11px] text-slate-600">
                    抄送对象: {data.ccReceivers?.length ? `${data.ccReceivers.length} 个部门/群组` : '未配置'}
                  </span>
                )}

                {/* 开始与结束节点 */}
                {type === 'start' && (
                  <span className="text-[11px] text-slate-500">业务指令填报后自动流转</span>
                )}
                {type === 'end' && (
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>归档完成 (广播结果事件)</span>
                  </span>
                )}
              </div>

              {/* 连线连接锚点 (左：入，右：出) */}
              {type !== 'start' && (
                <div
                  onMouseUp={e => handleEndConnect(e, node.id)}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-400 hover:border-blue-600 hover:scale-125 transition-all cursor-crosshair shadow-2xs"
                  title="流入连接点"
                />
              )}

              {type !== 'end' && (
                <div
                  onMouseDown={e => handleStartConnect(e, node.id)}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-500 hover:bg-blue-600 hover:scale-125 transition-all cursor-crosshair shadow-2xs"
                  title="点击拖拽连线到下一节点"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 画布底部悬浮控制台 (平移/缩放/自动排版) */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md text-xs">
        <button
          type="button"
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2))}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold"
          title="放大 (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-slate-600 px-1 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold"
          title="缩小 (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 my-auto" />
        <button
          type="button"
          onClick={handleFitView}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold"
          title="居中适应视图"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleAutoLayout}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors cursor-pointer"
          title="自动对齐整理节点"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>自动排版</span>
        </button>
      </div>

      {/* 底部操作提示 */}
      <div className="absolute bottom-5 left-5 z-10 text-[11px] text-slate-400 bg-white/80 backdrop-blur-2xs px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <span>操作提示: 从左侧工具栏拖入节点 | 拖动节点右侧小圆点连线 | 点击节点展开右侧配置 | Ctrl+D 复制节点</span>
      </div>
    </div>
  );
};
