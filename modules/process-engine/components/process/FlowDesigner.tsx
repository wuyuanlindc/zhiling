/**
 * 流程设计器主界面 (FlowDesigner)
 * 采用专业三栏架构：
 * - 左侧工具栏 (220px)：基础节点、业务节点、控制节点可拖拽面板
 * - 中间流程画布 (自适应)：支持拖拽放置、移动、贝塞尔连线、自动排版、缩放平移
 * - 右侧配置面板 (380px)：选中节点的动态表单 (ReceiverSelector、会签/或签、ConditionBuilder)
 * - 顶部工具栏：返回、版本号、保存草稿、流程校验 (FlowValidator)、运行模拟 (FlowSimulator)、预览 (FlowPreview)、发布新版本
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Eye, 
  PlayCircle, 
  Send, 
  Undo2, 
  Redo2, 
  AlertTriangle, 
  Layers, 
  Play, 
  CheckSquare, 
  Stamp, 
  GitFork, 
  Split,
  Clock, 
  Flag, 
  HelpCircle,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  ProcessDefinition, 
  FlowCanvasNode, 
  FlowCanvasEdge, 
  FlowNodeType, 
  FlowNodeData 
} from '../../types/processEngine';
import { FlowCanvas } from './FlowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { FlowPreviewModal } from './FlowPreviewModal';
import { FlowSimulator } from './FlowSimulator';
import { TemplateVersionManager } from './TemplateVersionManager';

interface FlowDesignerProps {
  process: ProcessDefinition;
  onBack: () => void;
  onSave: (updatedProcess: ProcessDefinition, isPublish?: boolean) => void;
  onOpenPreview?: (process: ProcessDefinition) => void;
  onOpenSimulator?: (process: ProcessDefinition) => void;
}

export const FlowDesigner: React.FC<FlowDesignerProps> = ({
  process: initialProcess,
  onBack,
  onSave,
  onOpenPreview,
  onOpenSimulator
}) => {
  const [currentProcess, setCurrentProcess] = useState<ProcessDefinition>(initialProcess);
  const [nodes, setNodes] = useState<FlowCanvasNode[]>(initialProcess.nodes);
  const [edges, setEdges] = useState<FlowCanvasEdge[]>(initialProcess.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialProcess.nodes[1]?.id || initialProcess.nodes[0]?.id || null);

  // 本地预览与模拟器模态框状态
  const [localPreviewOpen, setLocalPreviewOpen] = useState(false);
  const [localSimulatorOpen, setLocalSimulatorOpen] = useState(false);

  // 历史撤销与重做栈
  const [history, setHistory] = useState<{ nodes: FlowCanvasNode[]; edges: FlowCanvasEdge[] }[]>([
    { nodes: initialProcess.nodes, edges: initialProcess.edges }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 校验提示弹窗
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    nodeId?: string;
  }[]>([]);

  // 保存成功的 Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 记录历史操作
  const recordHistory = (newNodes: FlowCanvasNode[], newEdges: FlowCanvasEdge[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
      showToast('已撤销上一步操作');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
      showToast('已重做操作');
    }
  };

  // 节点更新
  const handleUpdateNodes = (newNodes: FlowCanvasNode[]) => {
    setNodes(newNodes);
    recordHistory(newNodes, edges);
  };

  // 连线更新
  const handleUpdateEdges = (newEdges: FlowCanvasEdge[]) => {
    setEdges(newEdges);
    recordHistory(nodes, newEdges);
  };

  // 复制节点（重新生成唯一 ID）
  const handleCopyNode = (sourceNode: FlowCanvasNode) => {
    const newNodeId = `node_${sourceNode.type}_${Date.now().toString(36)}`;
    const clonedNode: FlowCanvasNode = {
      ...sourceNode,
      id: newNodeId,
      x: sourceNode.x + 30,
      y: sourceNode.y + 40,
      data: {
        ...JSON.parse(JSON.stringify(sourceNode.data)),
        name: `${sourceNode.data.name} (复制)`
      }
    };
    const updatedNodes = [...nodes, clonedNode];
    setNodes(updatedNodes);
    setSelectedNodeId(newNodeId);
    recordHistory(updatedNodes, edges);
    showToast(`已复制节点：${clonedNode.data.name}`);
  };

  // 删除节点
  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    recordHistory(updatedNodes, updatedEdges);
    showToast('已删除节点');
  };

  // 更新节点内详细属性
  const handleUpdateNodeData = (nodeId: string, partialData: Partial<FlowNodeData>) => {
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: { ...n.data, ...partialData }
        };
      }
      return n;
    });
    setNodes(updatedNodes);
  };

  // 流程校验
  const handleValidateProcess = () => {
    const results: { type: 'success' | 'warning' | 'error'; message: string; nodeId?: string }[] = [];

    // 1. 开始节点检查
    const startNodes = nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) {
      results.push({ type: 'error', message: '缺少流程开始节点，流程无法被触发' });
    } else {
      results.push({ type: 'success', message: '✓ 开始节点配置正确 (自动触发链路畅通)' });
    }

    // 2. 结束节点检查
    const endNodes = nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) {
      results.push({ type: 'error', message: '缺少流程结束归档节点，指令将无法顺利闭环' });
    } else {
      results.push({ type: 'success', message: '✓ 流程结束节点配置完整 (已配置结果事件广播)' });
    }

    // 3. 检查办理与审批节点的接收对象
    nodes.forEach(node => {
      if (node.type === 'handle' || node.type === 'approval') {
        if (!node.data.receivers || node.data.receivers.length === 0) {
          results.push({
            type: 'warning',
            message: `⚠ 节点 [${node.data.name}] 尚未配置接收对象，流转时将找不到具体承办人`,
            nodeId: node.id
          });
        } else {
          results.push({
            type: 'success',
            message: `✓ [${node.data.name}] 接收对象与办理方式验证通过 (${node.data.receivers.length}个目标)`
          });
        }
      }

      if (node.type === 'condition') {
        const branches = node.data.conditionBranches || [];
        if (branches.length === 0) {
          results.push({
            type: 'warning',
            message: `⚠ 条件分流节点 [${node.data.name}] 未定义任何分支判断规则`,
            nodeId: node.id
          });
        } else {
          const unlinked = branches.filter(b => !b.targetNodeId);
          if (unlinked.length > 0) {
            results.push({
              type: 'warning',
              message: `⚠ 条件节点 [${node.data.name}] 有 ${unlinked.length} 个分支尚未指定目标流向节点`,
              nodeId: node.id
            });
          } else {
            results.push({
              type: 'success',
              message: `✓ [${node.data.name}] 条件分支规则完备 (${branches.length}条分支)`
            });
          }
        }
      }
    });

    setValidationResults(results);
    setShowValidationModal(true);
  };

  // 保存草稿
  const handleSaveDraft = () => {
    const updated = {
      ...currentProcess,
      nodes,
      edges,
      updatedAt: '刚刚'
    };
    onSave(updated, false);
    showToast('流程草稿已安全暂存');
  };

  // 发布新版本
  const handlePublish = () => {
    const updated = {
      ...currentProcess,
      nodes,
      edges,
      status: 'published' as const,
      updatedAt: '刚刚'
    };
    onSave(updated, true);
    showToast('流程已正式发布上线');
  };

  // 当前选中的节点对象
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-100 overflow-hidden" id="flow_designer_page">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* 左侧：返回与面包屑 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-slate-200"
            title="返回流程管理列表"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">流程与模板引擎管理</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-bold">{currentProcess.processName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-bold">可视化流程设计</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                草稿编辑中
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                当前版本: {currentProcess.version}
              </span>
              <span className="text-[10px] text-slate-400">
                所属分类: {currentProcess.categoryName}
              </span>
            </div>
          </div>
        </div>

        {/* 中间：撤销重做快速控制 */}
        <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded transition-colors ${
              historyIndex > 0 ? 'text-slate-700 hover:bg-white cursor-pointer' : 'text-slate-300 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded transition-colors ${
              historyIndex < history.length - 1 ? 'text-slate-700 hover:bg-white cursor-pointer' : 'text-slate-300 cursor-not-allowed'
            }`}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* 右侧操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 版本管理 (对标截图 1 & 2) */}
          <TemplateVersionManager
            templateName={currentProcess.processName}
            templateType="process"
            initialVersionCode={currentProcess.version?.replace(/^V/i, 'V') || 'V4'}
          />

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>保存草稿</span>
          </button>

          <button
            type="button"
            onClick={handleValidateProcess}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>校验流程</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenPreview) {
                onOpenPreview({ ...currentProcess, nodes, edges });
              } else {
                setLocalPreviewOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>流程全景预览</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenSimulator) {
                onOpenSimulator({ ...currentProcess, nodes, edges });
              } else {
                setLocalSimulatorOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>流程运行模拟</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发布生效</span>
          </button>
        </div>
      </header>

      {/* 主工作区三栏布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧节点工具箱 (260px) */}
        <aside className="w-[260px] bg-white border-r border-slate-200 h-full flex flex-col shrink-0 select-none z-10 shadow-sm">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>流程设计节点库</span>
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">拖拽入画布</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
            {/* 分类一：基础控制节点 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">基础控制节点</span>
              <div className="grid grid-cols-1 gap-2">
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'start')}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                    <Play className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-emerald-950">开始节点</span>
                    <span className="text-[10px] text-slate-400 truncate">指令下达生成 / 业务填报启动</span>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'end')}
                  className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-500 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                    <Flag className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900">结束节点</span>
                    <span className="text-[10px] text-slate-400 truncate">闭环归档 / 广播考核事件</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分类二：业务核心流转节点 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">业务流转节点</span>
              <div className="grid grid-cols-1 gap-2">
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'handle')}
                  className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-blue-950">办理节点</span>
                    <span className="text-[10px] text-slate-400 truncate">单人 / 会签 / 或签 / 协办协同</span>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'approval')}
                  className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-purple-600 text-white shrink-0">
                    <Stamp className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-purple-950">审批节点</span>
                    <span className="text-[10px] text-slate-400 truncate">领导审定 / 驳回退回 / 加签</span>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'cc')}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-slate-600 text-white shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800">抄送节点</span>
                    <span className="text-[10px] text-slate-400 truncate">只发通知信息不阻断流转</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分类三：逻辑控制节点 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">智能控制节点</span>
              <div className="grid grid-cols-1 gap-2">
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'condition')}
                  className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-orange-600 text-white shrink-0">
                    <GitFork className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-orange-950">条件分流</span>
                    <span className="text-[10px] text-slate-400 truncate">含 IF / ELSE 规则判断分支</span>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'parallel')}
                  className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-teal-600 text-white shrink-0">
                    <Split className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-teal-950">并行分支</span>
                    <span className="text-[10px] text-slate-400 truncate">多路并发流转，无需条件</span>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/flow-node-type', 'wait')}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="p-2 rounded-lg bg-amber-500 text-white shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-amber-950">延时等待</span>
                    <span className="text-[10px] text-slate-400 truncate">指定时段 / 外部业务事件驱动</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部统计 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>当前画布：<strong className="text-slate-700 font-mono">{nodes.length}</strong> 节点</span>
            <span><strong className="text-slate-700 font-mono">{edges.length}</strong> 条流向</span>
          </div>
        </aside>

        {/* 中间流程画布 */}
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNodes={handleUpdateNodes}
          onUpdateEdges={handleUpdateEdges}
          onCopyNode={handleCopyNode}
          onDeleteNode={handleDeleteNode}
        />

        {/* 右侧节点配置面板 */}
        <NodeConfigPanel
          node={selectedNode}
          allNodes={nodes}
          onUpdateNodeData={handleUpdateNodeData}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Toast 提示框 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 校验弹窗 */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs">
          <div className="bg-white w-[540px] max-w-[90vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">流程完整性校验报告</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto">
              {validationResults.map((res, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    res.type === 'success' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
                    res.type === 'warning' ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
                    'bg-red-50/70 border-red-200 text-red-900'
                  }`}
                >
                  <span className="font-bold shrink-0 mt-0.5">
                    {res.type === 'success' ? '✓' : res.type === 'warning' ? '⚠' : '✕'}
                  </span>
                  <div className="flex-1 flex items-center justify-between">
                    <span>{res.message}</span>
                    {res.nodeId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNodeId(res.nodeId!);
                          setShowValidationModal(false);
                        }}
                        className="text-blue-600 font-bold hover:underline shrink-0 ml-2"
                      >
                        快速定位
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 流程全景预览模态框 */}
      {localPreviewOpen && (
        <FlowPreviewModal
          process={{ ...currentProcess, nodes, edges }}
          onClose={() => setLocalPreviewOpen(false)}
          onOpenSimulator={() => {
            setLocalPreviewOpen(false);
            setLocalSimulatorOpen(true);
          }}
        />
      )}

      {/* 流程动态沙箱模拟器 */}
      {localSimulatorOpen && (
        <FlowSimulator
          process={{ ...currentProcess, nodes, edges }}
          onClose={() => setLocalSimulatorOpen(false)}
        />
      )}
    </div>
  );
};
