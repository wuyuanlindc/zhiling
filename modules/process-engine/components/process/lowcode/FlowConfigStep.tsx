/**
 * Step 4: 流程配置工作台 (FlowConfigStep)
 * 严格按照图片 3 设计与布局：
 * - 左侧：全局流转规则卡片 与 4 个环节节点列表
 * - 中间与右侧：当前选中环节的 3 个配置 Tab：
 *   1. 👁 表单权限 (字段读写控制矩阵)：区域一 (指令下发内容) 与 区域二 (指令回执信息) 表单字段读写可见性控制，支持批量切换
 *   2. ⚡️ 操作按钮与动作权限：配置每个环节可用的操作按钮
 *   3. 🌐 全局流转规则设置：超时催办、SLA 考核与撤回机制
 */

import React, { useState } from 'react';
import { 
  FlowStepNodeItem, 
  FormWidgetComponent 
} from '../../../types/processEngine';
import { 
  Globe, 
  Eye, 
  Zap, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Lightbulb, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  AlertCircle,
  ToggleRight,
  Sparkles,
  Minus,
  Info,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface FlowConfigStepProps {
  flowNodes: FlowStepNodeItem[];
  widgets: FormWidgetComponent[];
  onChangeFlowNodes: (nodes: FlowStepNodeItem[]) => void;
  isReadOnly?: boolean;
  currentVersionCode?: string;
  currentVersionStatus?: 'active' | 'history' | 'draft';
  onAttemptEditInReadOnly?: () => void;
}

export const FlowConfigStep: React.FC<FlowConfigStepProps> = ({
  flowNodes,
  widgets,
  onChangeFlowNodes,
  isReadOnly = false,
  currentVersionCode,
  currentVersionStatus,
  onAttemptEditInReadOnly
}) => {
  // 当前选中的环节索引 (0 ~ flowNodes.length - 1)
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);

  // 当前 Tab: 'permissions' (表单权限) | 'buttons' (操作按钮) | 'global' (全局规则)
  const [activeTab, setActiveTab] = useState<'permissions' | 'buttons' | 'global'>('permissions');

  const currentNode = flowNodes[selectedNodeIndex] || flowNodes[0];

  // 获取字段在当前节点的权限 (默认为可编辑或按政务流程规则分配)
  const getFieldPermission = (node: FlowStepNodeItem, widgetKey: string): 'editable' | 'readonly' | 'hidden' => {
    if (node.fieldPermissions && node.fieldPermissions[widgetKey]) {
      return node.fieldPermissions[widgetKey];
    }
    // 默认策略：
    // 发起节点默认为可编辑
    // 审批/办结 (approval/end) 默认为只读
    if (node.nodeType === 'draft') {
      return 'editable';
    } else if (node.nodeType === 'handle') {
      return 'editable';
    } else {
      return 'readonly';
    }
  };

  // 设置单字段权限
  const handleSetFieldPermission = (widgetKey: string, perm: 'editable' | 'readonly' | 'hidden') => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const permissions = { ...(currentNode.fieldPermissions || {}) };
    permissions[widgetKey] = perm;

    const updated = flowNodes.map((node, i) => {
      if (i === selectedNodeIndex) {
        return { ...node, fieldPermissions: permissions };
      }
      return node;
    });
    onChangeFlowNodes(updated);
  };

  // 批量设置权限
  const handleBatchSetPermissions = (mode: 'all_editable' | 'all_readonly' | 'all_hidden') => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const permissions: Record<string, 'editable' | 'readonly' | 'hidden'> = {};

    widgets.forEach(w => {
      if (mode === 'all_editable') {
        permissions[w.key] = 'editable';
      } else if (mode === 'all_readonly') {
        permissions[w.key] = 'readonly';
      } else if (mode === 'all_hidden') {
        permissions[w.key] = 'hidden';
      }
    });

    const updated = flowNodes.map((node, i) => {
      if (i === selectedNodeIndex) {
        return { ...node, fieldPermissions: permissions };
      }
      return node;
    });
    onChangeFlowNodes(updated);
  };

  // 切换操作按钮启用状态
  const handleToggleActionButton = (buttonId: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const currentButtons = currentNode.actionButtons || [];
    const updatedButtons = currentButtons.map(btn => {
      if (btn.id === buttonId) {
        return { ...btn, enabled: !btn.enabled };
      }
      return btn;
    });

    const updated = flowNodes.map((node, i) => {
      if (i === selectedNodeIndex) {
        return { ...node, actionButtons: updatedButtons };
      }
      return node;
    });
    onChangeFlowNodes(updated);
  };

  // 调节按钮顺序 (顺序是从左往右展示)
  const handleMoveButton = (buttonIndex: number, direction: 'up' | 'down') => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const currentButtons = [...(currentNode.actionButtons || [])];
    const targetIndex = direction === 'up' ? buttonIndex - 1 : buttonIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentButtons.length) return;

    const temp = currentButtons[buttonIndex];
    currentButtons[buttonIndex] = currentButtons[targetIndex];
    currentButtons[targetIndex] = temp;

    const updated = flowNodes.map((node, i) => {
      if (i === selectedNodeIndex) {
        return { ...node, actionButtons: currentButtons };
      }
      return node;
    });
    onChangeFlowNodes(updated);
  };

  // 获取控件中文类型描述
  const getWidgetTypeName = (type: string) => {
    switch (type) {
      case 'input': return '单行文本';
      case 'textarea': return '多行文本';
      case 'number': return '数字数值';
      case 'select': return '单选下拉';
      case 'radio': return '单选框组';
      case 'checkbox': return '多选框组';
      case 'date': return '日期时间';
      case 'file': return '文件上传';
      case 'image': return '图片上传';
      case 'cascader': return '责任人员/网格';
      default: return '标准表单项';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100/70 select-none">
      {/* ===================== 左侧：全局规则与环节列表 (240px) ===================== */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-xs p-3 overflow-y-auto custom-scrollbar">
        {/* 全局流转规则设置卡片 */}
        <div
          onClick={() => setActiveTab('global')}
          className={`p-3 rounded-xl border transition-all cursor-pointer mb-4 ${
            activeTab === 'global'
              ? 'border-blue-500 bg-blue-50/50 shadow-2xs ring-2 ring-blue-500/10'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>全局流转规则设置</span>
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
              全流程通用
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            取消受理回退、撤回时效、SLA考核与超时督办
          </p>
        </div>

        {/* 环节节点配置列表 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>环节节点配置</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            共{flowNodes.length}个环节
          </span>
        </div>

        <div className="space-y-2">
          {flowNodes.map((node, index) => {
            const isSelected = activeTab !== 'global' && selectedNodeIndex === index;
            const buttonsCount = node.actionButtons?.filter(b => b.enabled).length || 3;

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeIndex(index);
                  if (activeTab === 'global') setActiveTab('permissions');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 shadow-xs ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                    {node.categoryLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>表单权限</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{buttonsCount}个动作按钮</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== 中间及右侧配置主体 ===================== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* 受保护版本只读横幅提示 */}
        {isReadOnly && (
          <div className="bg-amber-50/95 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                当前流程{currentVersionStatus === 'active' ? '启用中' : (currentVersionStatus === 'history' ? `处于历史版本【${currentVersionCode || '历史归档'}】` : '受保护')}，仅可查看，不支持编辑。如需编辑，请创建新流程或切换到设计中的配置版本。
              </span>
            </div>
            <button
              type="button"
              onClick={onAttemptEditInReadOnly}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 ml-2"
            >
              <span>创建新流程</span>
            </button>
          </div>
        )}

        {activeTab !== 'global' ? (
          <>
            {/* 选中环节顶部抬头 */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-slate-800">
                      {currentNode.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {currentNode.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      环节编码: {currentNode.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentNode.description || '登记业务基本信息，并明确具体处置要求、核查重点与办理时限'}
                  </p>
                </div>
              </div>

              {/* 上下环节切换器 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedNodeIndex === 0}
                  onClick={() => setSelectedNodeIndex(Math.max(0, selectedNodeIndex - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一环节</span>
                </button>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {selectedNodeIndex + 1} / {flowNodes.length}
                </span>
                <button
                  type="button"
                  disabled={selectedNodeIndex === flowNodes.length - 1}
                  onClick={() => setSelectedNodeIndex(Math.min(flowNodes.length - 1, selectedNodeIndex + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>下一环节</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3 个配置 Tab 栏 */}
            <div className="bg-white border-b border-slate-200 px-6 pt-2 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'permissions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>表单权限 (字段读写控制)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('buttons')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'buttons'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>操作按钮与动作权限</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('global')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  activeTab === 'global'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>全局流转规则设置</span>
              </button>
            </div>

            {/* Tab 1: 表单权限矩阵 */}
            {activeTab === 'permissions' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 提示信息横幅 */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>字段权限矩阵：</strong>决定当前环节办理人在查看或处理单据时，各表单字段的读写可见性。例如：在处理节点环节，发令下发内容通常应设为「只读」，回执信息设为「可编辑」。
                  </p>
                </div>

                {/* 批量操作工具栏 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">字段读写权限设置矩阵</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBatchSetPermissions('all_editable')}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      全部可编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetPermissions('all_readonly')}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      全部只读
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetPermissions('all_hidden')}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      全部隐藏
                    </button>
                  </div>
                </div>

                {/* 统一表单字段权限清单 */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>表单字段权限清单 (共 {widgets.length} 项)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      支持用户通过【分割线】自主划分业务区域
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4 w-48">字段名称</th>
                        <th className="py-2.5 px-4 w-36">组件类型</th>
                        <th className="py-2.5 px-4 w-28">校验约束</th>
                        <th className="py-2.5 px-4">权限设定</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {widgets.map(widget => {
                        // 如果是分割线，以分割带形式优雅渲染
                        if (widget.type === 'divider') {
                          return (
                            <tr key={widget.id} className="bg-slate-50/80">
                              <td colSpan={4} className="py-2 px-4 text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Minus className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-blue-700 font-bold">{widget.label || '分割线'}</span>
                                  <div className="flex-1 h-px bg-slate-200 ml-2" />
                                  <span className="text-[10px] text-slate-400 font-normal">区域分割标记</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const perm = getFieldPermission(currentNode, widget.key);
                        return (
                          <tr key={widget.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {widget.label}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {getWidgetTypeName(widget.type)}
                            </td>
                            <td className="py-3 px-4">
                              {widget.required ? (
                                <span className="text-red-600 font-bold">必填</span>
                              ) : (
                                <span className="text-slate-400">选填</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                  <input
                                    type="radio"
                                    name={`perm_${currentNode.id}_${widget.key}`}
                                    checked={perm === 'editable'}
                                    onChange={() => handleSetFieldPermission(widget.key, 'editable')}
                                    className="text-blue-600"
                                  />
                                  <span>可编辑</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                  <input
                                    type="radio"
                                    name={`perm_${currentNode.id}_${widget.key}`}
                                    checked={perm === 'readonly'}
                                    onChange={() => handleSetFieldPermission(widget.key, 'readonly')}
                                    className="text-blue-600"
                                  />
                                  <span>只读</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                                  <input
                                    type="radio"
                                    name={`perm_${currentNode.id}_${widget.key}`}
                                    checked={perm === 'hidden'}
                                    onChange={() => handleSetFieldPermission(widget.key, 'hidden')}
                                    className="text-blue-600"
                                  />
                                  <span>隐藏</span>
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: 操作按钮与动作权限 */}
            {activeTab === 'buttons' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {/* 顶部排版规则说明条 (顺序是从左往右) */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>说明：</strong>办理界面中操作按钮的<strong>顺序是从左往右</strong>排列展示。您可通过下方表格“顺序”栏中的上移/下移箭头调节按钮展示先后顺序。
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200 font-medium shrink-0 shadow-2xs">
                    <span className="font-bold text-slate-600">界面排布效果 (从左往右)：</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(currentNode.actionButtons || []).filter(b => b.enabled).map((b, i) => (
                        <span
                          key={b.id}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                            b.color === 'blue' ? 'bg-blue-600' :
                            b.color === 'emerald' ? 'bg-emerald-600' :
                            b.color === 'red' ? 'bg-red-600' :
                            b.color === 'amber' ? 'bg-amber-600' :
                            'bg-slate-600'
                          }`}
                        >
                          {i + 1}. {b.label}
                        </span>
                      ))}
                      {(currentNode.actionButtons || []).filter(b => b.enabled).length === 0 && (
                        <span className="text-slate-400 italic">暂无启用按钮</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        当前环节可用操作按钮 ({currentNode.name})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        第一列为按钮id，按钮名称，动作类型，顺序，将按钮的开关放在最后
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      已启用 {(currentNode.actionButtons || []).filter(b => b.enabled).length} / {(currentNode.actionButtons || []).length} 个按钮
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="py-3 px-4 w-40">按钮ID</th>
                          <th className="py-3 px-4 min-w-[140px]">按钮名称</th>
                          <th className="py-3 px-4 w-32">动作类型</th>
                          <th className="py-3 px-4 w-36 text-center">顺序与调序</th>
                          <th className="py-3 px-4 w-28 text-center">按钮开关</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(currentNode.actionButtons || []).map((btn, idx) => (
                          <tr
                            key={btn.id}
                            className={`transition-colors hover:bg-slate-50/80 ${
                              btn.enabled ? 'bg-white' : 'bg-slate-50/30 opacity-70'
                            }`}
                          >
                            {/* 1. 按钮ID */}
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {btn.id}
                              </span>
                            </td>

                            {/* 2. 按钮名称 */}
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white inline-block ${
                                btn.color === 'blue' ? 'bg-blue-600' :
                                btn.color === 'emerald' ? 'bg-emerald-600' :
                                btn.color === 'red' ? 'bg-red-600' :
                                btn.color === 'amber' ? 'bg-amber-600' :
                                'bg-slate-600'
                              }`}>
                                {btn.label}
                              </span>
                            </td>

                            {/* 3. 动作类型 */}
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {btn.actionType}
                              </span>
                            </td>

                            {/* 4. 顺序与调序 (从左往右) */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 w-6 h-6 inline-flex items-center justify-center rounded-full border border-slate-200">
                                  {idx + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveButton(idx, 'up')}
                                    className={`p-1 rounded-md border transition-colors cursor-pointer flex items-center justify-center ${
                                      idx === 0
                                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                                        : 'border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-2xs'
                                    }`}
                                    title="上移（在界面排布更靠左）"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (currentNode.actionButtons || []).length - 1}
                                    onClick={() => handleMoveButton(idx, 'down')}
                                    className={`p-1 rounded-md border transition-colors cursor-pointer flex items-center justify-center ${
                                      idx === (currentNode.actionButtons || []).length - 1
                                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                                        : 'border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-2xs'
                                    }`}
                                    title="下移（在界面排布更靠右）"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* 5. 按钮开关 */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActionButton(btn.id)}
                                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                    btn.enabled ? 'bg-blue-600' : 'bg-slate-300'
                                  }`}
                                  title={btn.enabled ? '点击停用按钮' : '点击启用按钮'}
                                >
                                  <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                      btn.enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Tab 3: 全局流转规则设置 */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>全局流转规则与超时考核策略</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <strong className="text-xs font-bold text-slate-800 block">撤回时效控制</strong>
                  <p className="text-[11px] text-slate-500">
                    发令人在下发后一定时间内，若承办人未开始办理，允许无损撤回。
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      defaultValue={15}
                      className="w-20 h-8 px-2 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                    <span className="text-xs text-slate-600">分钟内允许撤回</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <strong className="text-xs font-bold text-slate-800 block">SLA 超时自动督办</strong>
                  <p className="text-[11px] text-slate-500">
                    超出节点规定时限前 30 分钟与超时即刻推送督办短信及站内弹窗。
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                      <span>开启站内预警与短信强提醒</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
