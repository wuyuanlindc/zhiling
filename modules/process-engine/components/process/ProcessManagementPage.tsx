/**
 * 流程与模板引擎管理 - 统一综合控制中心 (ProcessManagementPage)
 * 
 * 核心架构重构特性：
 * 1. 业务系统体系与多租户纳管：
 *    - 纳管 3 大核心业务系统：正管用、谛听预警、点点速报
 *    - 模板必须属于某一业务系统，归属范围分为「公共模板」与「机构专属定制模板」
 *    - 模板与流程解耦，支持可视化表单字段设计与流程引擎自由绑定
 * 2. 三大核心主功能板块：
 *    - 📑 业务数据模板引擎 (TemplateManagementView)
 *    - 🔀 指令流转流程引擎 (Flow Process Engine + FlowDesigner)
 *    - 🏢 3大系统租户授权矩阵 (TenantTemplateMatrixView)
 * 3. 完整闭环工具链：
 *    - 表单仿真预览 (TemplateFormPreviewModal)
 *    - 全景流程预览 (FlowPreviewModal)
 *    - 动态沙箱模拟 (FlowSimulator)
 *    - 流程可视化设计器 (FlowDesigner)
 */

import React, { useState } from 'react';
import { 
  GitFork, 
  Plus, 
  Search, 
  RotateCcw, 
  Eye, 
  Edit3, 
  PlayCircle, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Globe2,
  Sliders,
  Siren,
  Target,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { 
  ProcessDefinition, 
  ProcessTemplateItem, 
  BUSINESS_SYSTEMS 
} from '../../types/processEngine';
import { 
  MOCK_PROCESSES, 
  MOCK_TEMPLATES, 
  PROCESS_CATEGORIES,
  MOCK_ORGS
} from '../../data/mockProcessEngine';
import { FlowDesigner } from './FlowDesigner';
import { FlowPreviewModal } from './FlowPreviewModal';
import { FlowSimulator } from './FlowSimulator';
import { TemplateManagementView } from './TemplateManagementView';
import { TenantTemplateMatrixView } from './TenantTemplateMatrixView';
import { TemplateEditModal } from './TemplateEditModal';
import { TemplateFormPreviewModal } from './TemplateFormPreviewModal';

export const ProcessManagementPage: React.FC = () => {
  // 顶部大模块 Tab: 'templates' (业务模板) | 'processes' (流转流程) | 'matrix' (租户矩阵)
  const [activeMainTab, setActiveMainTab] = useState<'templates' | 'processes' | 'matrix'>('templates');

  // 数据状态
  const [templates, setTemplates] = useState<ProcessTemplateItem[]>(MOCK_TEMPLATES);
  const [processes, setProcesses] = useState<ProcessDefinition[]>(MOCK_PROCESSES);

  // 流程列表筛选搜索条件
  const [procSystemFilter, setProcSystemFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // 页面模式控制：'list' (列表) | 'design' (设计器)
  const [viewMode, setViewMode] = useState<'list' | 'design'>('list');
  const [currentEditingProcess, setCurrentEditingProcess] = useState<ProcessDefinition | null>(null);

  // 弹窗状态：流程全景预览与沙箱模拟器
  const [previewProcess, setPreviewProcess] = useState<ProcessDefinition | null>(null);
  const [simulatorProcess, setSimulatorProcess] = useState<ProcessDefinition | null>(null);

  // 模板弹窗状态
  const [editingTemplateForOrg, setEditingTemplateForOrg] = useState<{ orgId: string; systemId: string } | null>(null);
  const [previewTemplateItem, setPreviewTemplateItem] = useState<ProcessTemplateItem | null>(null);

  // 新建流程向导弹窗
  const [showNewModal, setShowNewModal] = useState(false);
  const [procStatusWarning, setProcStatusWarning] = useState<ProcessDefinition | null>(null);
  const [newProcessSystemId, setNewProcessSystemId] = useState('SYS_ZGY');
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessNameError, setNewProcessNameError] = useState('');
  const [newProcessCategory, setNewProcessCategory] = useState('task');
  const [newProcessTemplateId, setNewProcessTemplateId] = useState(MOCK_TEMPLATES[0].id);
  const [newProcessDesc, setNewProcessDesc] = useState('');

  // 过滤后的流程列表
  const filteredProcesses = processes.filter(p => {
    if (procSystemFilter !== 'ALL' && p.systemId !== procSystemFilter) {
      return false;
    }
    if (keyword && !p.processName.toLowerCase().includes(keyword.toLowerCase()) && !p.processCode.toLowerCase().includes(keyword.toLowerCase())) {
      return false;
    }
    if (selectedCategory && p.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus && p.status !== selectedStatus) {
      return false;
    }
    if (selectedTemplate && !p.relatedTemplateIds?.includes(selectedTemplate)) {
      return false;
    }
    return true;
  });

  // 进入流程设计器
  const handleOpenDesigner = (process: ProcessDefinition) => {
    if (process.status === 'published') {
      setProcStatusWarning(process);
      return;
    }
    setCurrentEditingProcess(process);
    setViewMode('design');
  };

  // 保存流程
  const handleSaveProcess = (updated: ProcessDefinition, isPublish = false) => {
    setProcesses(prev => prev.map(p => p.id === updated.id ? updated : p));
    setCurrentEditingProcess(updated);
  };

  // 克隆流程
  const handleCloneProcess = (source: ProcessDefinition) => {
    const newId = `proc_${Date.now()}`;
    const cloned: ProcessDefinition = {
      ...source,
      id: newId,
      processCode: `${source.processCode}_COPY`,
      processName: `${source.processName} (副本)`,
      status: 'draft',
      version: 'V1.0',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setProcesses([cloned, ...processes]);
  };

  // 删除流程
  const handleDeleteProcess = (id: string) => {
    if (confirm('确定要删除该流程定义吗？已在运行的历史实例将保持现有拓扑结构。')) {
      setProcesses(processes.filter(p => p.id !== id));
    }
  };

  // 确认创建新流程
  const handleCreateNewProcess = () => {
    if (!newProcessName.trim()) {
      setNewProcessNameError('请输入流程名称');
      return;
    }
    setNewProcessNameError('');

    const selSys = BUSINESS_SYSTEMS.find(s => s.id === newProcessSystemId);
    const selTpl = templates.find(t => t.id === newProcessTemplateId);

    const newProc: ProcessDefinition = {
      id: `proc_${Date.now()}`,
      systemId: newProcessSystemId,
      systemName: selSys?.name || '业务系统',
      processCode: `PROC_${Date.now().toString(36).toUpperCase()}`,
      processName: newProcessName.trim(),
      description: newProcessDesc.trim() || '自定义指令流转流程',
      category: newProcessCategory as any,
      categoryName: PROCESS_CATEGORIES.find(c => c.id === newProcessCategory)?.name || '业务流转类',
      version: 'V1.0',
      status: 'draft',
      scope: 'platform',
      relatedTemplateIds: selTpl ? [selTpl.id] : [],
      relatedTemplateNames: selTpl ? [selTpl.templateName] : [],
      allowMultiTemplates: true,
      creator: '当前管理员',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      nodes: [
        {
          id: 'node_start',
          type: 'start',
          x: 60,
          y: 220,
          data: { name: '指令下达启动', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
        },
        {
          id: 'node_handle',
          type: 'handle',
          x: 330,
          y: 220,
          data: {
            name: '责任单位核查承办',
            nodeType: 'handle',
            handleMode: 'single',
            timeLimit: { type: 'fixed_duration', duration: 24, durationUnit: 'hours' },
            isValid: true
          }
        },
        {
          id: 'node_end',
          type: 'end',
          x: 620,
          y: 220,
          data: { name: '指令办结归档', nodeType: 'end', businessEvents: ['TASK_COMPLETED'], isValid: true }
        }
      ],
      edges: [
        { id: 'e1', source: 'node_start', target: 'node_handle', label: '派发办理' },
        { id: 'e2', source: 'node_handle', target: 'node_end', label: '办结提交' }
      ]
    };

    setProcesses([newProc, ...processes]);
    setShowNewModal(false);
    handleOpenDesigner(newProc);
  };

  // 如果处于设计器全屏模式
  if (viewMode === 'design' && currentEditingProcess) {
    return (
      <FlowDesigner
        process={currentEditingProcess}
        onSave={handleSaveProcess}
        onBack={() => setViewMode('list')}
      />
    );
  }

  return (
    <div className="p-6 max-w-full flex flex-col gap-6 bg-slate-100 min-h-screen">
      {/* 顶部主标题区域 */}
      <div className="flex flex-col gap-1.5">
        {/* 大标题上方增加面包屑 */}
        <nav className="flex items-center gap-1.5 text-xs font-mono" aria-label="Breadcrumb">
          <span className="text-slate-400 font-normal hover:text-slate-600 transition-colors">V8应用集成管理中心</span>
          <span className="text-slate-300 font-normal">/</span>
          <span className="text-slate-400 font-normal hover:text-slate-600 transition-colors">模板与流程引擎管理</span>
          <span className="text-slate-300 font-normal">/</span>
          <span className="text-slate-700 font-medium">模板与流程引擎配置</span>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            模板与流程引擎配置
          </h1>
        </div>
      </div>

      {/* Tab 1: 业务数据模板引擎 */}
      {activeMainTab === 'templates' && (
        <TemplateManagementView
          templates={templates}
          processes={processes}
          onUpdateTemplates={setTemplates}
          onNavigateToProcessDesigner={(procId) => {
            const proc = processes.find(p => p.id === procId);
            if (proc) {
              handleOpenDesigner(proc);
            }
          }}
        />
      )}

      {/* Tab 2: 指令流转流程引擎 */}
      {activeMainTab === 'processes' && (
        <div className="flex flex-col gap-6 w-full">
          {/* 顶部统计指标卡 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">已发布生效流程</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {processes.filter(p => p.status === 'published').length} <span className="text-xs text-slate-400 font-normal">条</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">设计中流程草稿</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {processes.filter(p => p.status === 'draft').length} <span className="text-xs text-slate-400 font-normal">条</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">关联业务模板数</span>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  {templates.length} <span className="text-xs text-slate-400 font-normal">个</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">本月流转指令实例</span>
                <div className="text-2xl font-black text-purple-600 mt-1">
                  2,846 <span className="text-xs text-slate-400 font-normal">次</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 筛选与搜索控制条 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* 所属业务系统筛选 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-500">业务系统:</span>
                <select
                  value={procSystemFilter}
                  onChange={e => setProcSystemFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-bold outline-none cursor-pointer"
                >
                  <option value="ALL">全部业务系统</option>
                  {BUSINESS_SYSTEMS.map(s => (
                    <option key={s.id} value={s.id}>{s.shortName}</option>
                  ))}
                </select>
              </div>

              {/* 流程分类筛选 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-bold outline-none cursor-pointer"
                >
                  <option value="">全部分类</option>
                  {PROCESS_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* 状态筛选 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-bold outline-none cursor-pointer"
                >
                  <option value="">全部状态</option>
                  <option value="published">已发布生效</option>
                  <option value="draft">设计中草稿</option>
                  <option value="disabled">已停用</option>
                </select>
              </div>

              {/* 关键字搜索 */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="搜索流程名称/编码..."
                  className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              {/* 重置 */}
              {(procSystemFilter !== 'ALL' || keyword || selectedCategory || selectedStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setProcSystemFilter('ALL');
                    setKeyword('');
                    setSelectedCategory('');
                    setSelectedStatus('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>
              )}
            </div>

            {/* 新建流程按钮 */}
            <button
              type="button"
              onClick={() => {
                setNewProcessName('');
                setNewProcessDesc('');
                setShowNewModal(true);
              }}
              className="h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新建流转流程</span>
            </button>
          </div>

          {/* 流程定义列表 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4 w-12 text-center">状态</th>
                    <th className="py-3 px-4">所属业务系统</th>
                    <th className="py-3 px-4">流程编码与名称</th>
                    <th className="py-3 px-4">流程分类</th>
                    <th className="py-3 px-4">关联适用业务模板</th>
                    <th className="py-3 px-4">拓扑节点数</th>
                    <th className="py-3 px-4">版本</th>
                    <th className="py-3 px-4">更新时间</th>
                    <th className="py-3 px-4 text-right">操作链路</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcesses.map(proc => {
                    const sys = BUSINESS_SYSTEMS.find(s => s.id === proc.systemId);

                    return (
                      <tr key={proc.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 状态 */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                            proc.status === 'published' ? 'bg-emerald-500' :
                            proc.status === 'draft' ? 'bg-amber-500' : 'bg-slate-300'
                          }`} title={proc.status === 'published' ? '已发布' : '草稿'}></span>
                        </td>

                        {/* 所属业务系统 */}
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sys?.badgeColor || 'bg-slate-50 text-slate-600'}`}>
                            {sys?.shortName || proc.systemName}
                          </span>
                        </td>

                        {/* 流程编码与名称 */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span 
                              onClick={() => handleOpenDesigner(proc)}
                              className="font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {proc.processName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {proc.processCode}
                            </span>
                          </div>
                        </td>

                        {/* 分类 */}
                        <td className="py-3 px-4 text-slate-600">
                          {proc.categoryName}
                        </td>

                        {/* 关联业务模板 */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {proc.relatedTemplateNames && proc.relatedTemplateNames.length > 0 ? (
                              proc.relatedTemplateNames.map((name, i) => (
                                <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">通用全适配</span>
                            )}
                          </div>
                        </td>

                        {/* 节点数 */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {proc.nodes.length} 个节点
                          </span>
                        </td>

                        {/* 版本 */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">
                          {proc.version}
                        </td>

                        {/* 更新时间 */}
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {proc.updatedAt}
                        </td>

                        {/* 操作 */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* 设计器 */}
                            <button
                              type="button"
                              onClick={() => handleOpenDesigner(proc)}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>设计器</span>
                            </button>

                            {/* 预览 */}
                            <button
                              type="button"
                              onClick={() => setPreviewProcess(proc)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="全景流程拓扑预览"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 沙箱模拟 */}
                            <button
                              type="button"
                              onClick={() => setSimulatorProcess(proc)}
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="沙箱动态模拟运行"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* 克隆 */}
                            <button
                              type="button"
                              onClick={() => handleCloneProcess(proc)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                              title="克隆流程"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* 删除 */}
                            <button
                              type="button"
                              onClick={() => handleDeleteProcess(proc.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="删除流程"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 3大系统租户授权矩阵 */}
      {activeMainTab === 'matrix' && (
        <TenantTemplateMatrixView
          templates={templates}
          processes={processes}
          onOpenCreateTemplateForOrg={(orgId, systemId) => {
            setEditingTemplateForOrg({ orgId, systemId });
          }}
          onPreviewTemplate={(tpl) => setPreviewTemplateItem(tpl)}
        />
      )}

      {/* 弹窗 A：全景流程预览模态框 */}
      {previewProcess && (
        <FlowPreviewModal
          process={previewProcess}
          onClose={() => setPreviewProcess(null)}
          onOpenDesigner={() => {
            const p = previewProcess;
            setPreviewProcess(null);
            handleOpenDesigner(p);
          }}
          onOpenSimulator={() => {
            const p = previewProcess;
            setPreviewProcess(null);
            setSimulatorProcess(p);
          }}
        />
      )}

      {/* 弹窗 B：动态沙箱模拟器 */}
      {simulatorProcess && (
        <FlowSimulator
          process={simulatorProcess}
          onClose={() => setSimulatorProcess(null)}
        />
      )}

      {/* 弹窗 C：从租户矩阵一键新建机构专属模板 */}
      {editingTemplateForOrg && (
        <TemplateEditModal
          processes={processes}
          defaultSystemId={editingTemplateForOrg.systemId}
          defaultScope="org"
          defaultOrgId={editingTemplateForOrg.orgId}
          onSave={(newTpl) => {
            setTemplates(prev => [newTpl, ...prev]);
            setEditingTemplateForOrg(null);
            setActiveMainTab('templates');
          }}
          onClose={() => setEditingTemplateForOrg(null)}
        />
      )}

      {/* 弹窗 D：矩阵查看中直接仿真预览模板 */}
      {previewTemplateItem && (
        <TemplateFormPreviewModal
          template={previewTemplateItem}
          onClose={() => setPreviewTemplateItem(null)}
        />
      )}

      {/* 弹窗 E：新建流程向导弹窗 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white w-[600px] max-w-[95vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">新建指令流转流程</h3>
                  <p className="text-[11px] text-slate-500">快速创建并初始化节点拓扑链路</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* 所属系统 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">所属业务系统 <span className="text-red-500">*</span></label>
                <select
                  value={newProcessSystemId}
                  onChange={e => setNewProcessSystemId(e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  {BUSINESS_SYSTEMS.map(sys => (
                    <option key={sys.id} value={sys.id}>
                      {sys.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 流程名称 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">流程名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newProcessName}
                  onChange={e => {
                    setNewProcessName(e.target.value);
                    if (newProcessNameError) setNewProcessNameError('');
                  }}
                  placeholder="例：涉案资金快速审批与核决流程"
                  className={`h-9 px-3 bg-white border rounded-lg text-xs font-bold text-slate-800 outline-none transition-all ${
                    newProcessNameError ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {newProcessNameError && (
                  <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {newProcessNameError}
                  </p>
                )}
              </div>

              {/* 分类与模板 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">业务分类</label>
                  <select
                    value={newProcessCategory}
                    onChange={e => setNewProcessCategory(e.target.value)}
                    className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    {PROCESS_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">初始关联业务模板</label>
                  <select
                    value={newProcessTemplateId}
                    onChange={e => setNewProcessTemplateId(e.target.value)}
                    className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    {templates.filter(t => t.systemId === newProcessSystemId).map(t => (
                      <option key={t.id} value={t.id}>{t.templateName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 描述 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">流程说明</label>
                <textarea
                  rows={2}
                  value={newProcessDesc}
                  onChange={e => setNewProcessDesc(e.target.value)}
                  placeholder="简要说明此流程的流转规则与业务场景"
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateNewProcess}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                确认并进入设计器
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 流程定义状态校验弹窗：只有关闭状态才能设计 */}
      {procStatusWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-[460px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">只有关闭状态的流程才能设计</h3>
                  <p className="text-xs text-amber-800 mt-0.5 font-medium">流程处于开启状态，已被系统拦截</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProcStatusWarning(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">流程名称:</span>
                  <span className="font-bold text-slate-800">{procStatusWarning.processName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">流程编码:</span>
                  <span className="font-mono font-bold text-slate-700">{procStatusWarning.processCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">当前状态:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    开启（已发布/启用）
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 leading-relaxed">
                <strong>规范提示：</strong>当前流程处于【开启】状态。为避免运行中的业务任务发生拓扑错乱，<strong>只有关闭（停用）状态的流程才能进行设计</strong>。
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProcStatusWarning(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
              >
                我知道了
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = procStatusWarning;
                  setProcesses(prev => prev.map(p => p.id === target.id ? { ...p, status: 'disabled' } : p));
                  setProcStatusWarning(null);
                  setCurrentEditingProcess({ ...target, status: 'disabled' });
                  setViewMode('design');
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                立即停用并进入设计
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
