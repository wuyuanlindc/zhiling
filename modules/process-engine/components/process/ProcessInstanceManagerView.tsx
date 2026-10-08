/**
 * 流程与模板引擎管理 - 实例管理子页面 (ProcessInstanceManagerView)
 * 
 * 核心架构要求与业务设计：
 * 1. 以「流程表单」为第一维度展示全平台流程模板台账，操作列提供「查看详情」
 * 2. 点击每个流程ID或「查看详情」操作，下钻进入该流程的详细管理视图
 * 3. 详细视图包含：
 *    - 当前流程的所有实例数据（流水号、主题、承办人、时效、状态、流转轨迹、催办干预）
 *    - 关联流程和表单的所有实例数据（上游触发源、下游应急督办、跨部门联合会签、基层子流程派生、共享表单台账）
 *    - 表单数据填报汇总台账（结构化业务数据大表）
 * 4. 实例详情抽屉与流程拓扑图跟踪弹窗
 */

import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Search, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Building2, 
  Layers, 
  Send, 
  ChevronRight, 
  X, 
  ShieldAlert, 
  BellRing, 
  Filter, 
  User, 
  ArrowRight, 
  Check, 
  FileText, 
  Sparkles,
  GitBranch,
  Timer,
  ArrowLeft,
  Share2,
  FolderGit2,
  ListFilter,
  FileSpreadsheet,
  ExternalLink,
  Workflow,
  Radio,
  Tag,
  Download,
  Flame,
  Info
} from 'lucide-react';
import { 
  ProcessInstanceRecord, 
  ProcessInstanceStepLog, 
  MOCK_PROCESS_INSTANCES,
  getAssociatedInstancesForTemplate,
  AssociatedInstanceItem
} from '../../data/mockProcessInstances';
import { MOCK_TEMPLATES } from '../../data/mockProcessEngine';
import { ProcessTemplateItem, BUSINESS_SYSTEMS } from '../../types/processEngine';

export const ProcessInstanceManagerView: React.FC = () => {
  // 模板列表与实例数据
  const [templates] = useState<ProcessTemplateItem[]>(MOCK_TEMPLATES);
  const [instances, setInstances] = useState<ProcessInstanceRecord[]>(MOCK_PROCESS_INSTANCES);

  // 当前选中的下钻流程表单 (为 null 时展示流程表单维度主列表)
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplateItem | null>(null);

  // ====================== 主列表筛选状态 (流程表单维度) ======================
  const [tplSystemFilter, setTplSystemFilter] = useState<string>('ALL');
  const [tplScopeFilter, setTplScopeFilter] = useState<string>('ALL');
  const [tplTypeFilter, setTplTypeFilter] = useState<string>('ALL');
  const [tplKeyword, setTplKeyword] = useState<string>('');
  const [tplCurrentPage, setTplCurrentPage] = useState<number>(1);
  const [tplPageSize, setTplPageSize] = useState<number>(10);

  // ====================== 详情内子 Tab 与子筛选状态 ======================
  const [detailTab, setDetailTab] = useState<'current_instances' | 'associated_instances'>('current_instances');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL');
  const [subUrgencyFilter, setSubUrgencyFilter] = useState<string>('ALL');
  const [subRelatedTplFilter, setSubRelatedTplFilter] = useState<string>('ALL');
  const [subKeyword, setSubKeyword] = useState<string>('');
  const [subCurrentPage, setSubCurrentPage] = useState<number>(1);
  const [subPageSize, setSubPageSize] = useState<number>(10);

  // 详情抽屉与流程跟踪弹窗
  const [activeInstance, setActiveInstance] = useState<ProcessInstanceRecord | null>(null);
  const [traceInstance, setTraceInstance] = useState<ProcessInstanceRecord | null>(null);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 触发催办
  const handleUrgeInstance = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInstances(prev => prev.map(ins => {
      if (ins.id === id) {
        return {
          ...ins,
          urgeCount: ins.urgeCount + 1,
          stepHistory: [
            ...ins.stepHistory,
            {
              id: `urge_${Date.now()}`,
              stepIndex: ins.stepHistory.length + 1,
              nodeName: ins.currentNodeName,
              nodeType: ins.currentNodeType,
              operator: '系统管理员',
              operatorDept: '运维控制中心',
              action: 'urge',
              actionLabel: '系统催办提醒',
              opinion: `发起第 ${ins.urgeCount + 1} 次紧急流转催办通报`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              durationMins: 0,
              status: 'current'
            }
          ]
        };
      }
      return ins;
    }));
    showToast(`已向该实例当前责任承办人成功下发即时催办短信与应用内待办提醒！`);
    if (activeInstance && activeInstance.id === id) {
      setActiveInstance(prev => prev ? { ...prev, urgeCount: prev.urgeCount + 1 } : null);
    }
  };

  // 强制终止实例
  const handleTerminateInstance = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('确定要强制终止该流程实例吗？终止后工单将进入作废归档状态。')) return;
    setInstances(prev => prev.map(ins => {
      if (ins.id === id) {
        return {
          ...ins,
          status: 'terminated',
          statusLabel: '管理员强制终止',
          endTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return ins;
    }));
    showToast('该流程实例已成功终止并记入审计日志。');
    if (activeInstance && activeInstance.id === id) {
      setActiveInstance(prev => prev ? { ...prev, status: 'terminated', statusLabel: '管理员强制终止' } : null);
    }
  };

  // 计算每个流程表单的实例统计指标
  const templateStatsMap = useMemo(() => {
    const stats: Record<string, { total: number; running: number; completed: number; overdue: number; lastTime: string }> = {};
    
    templates.forEach(tpl => {
      const directList = instances.filter(i => i.templateId === tpl.id);
      const total = directList.length;
      const running = directList.filter(i => i.status === 'running').length;
      const completed = directList.filter(i => i.status === 'completed').length;
      const overdue = directList.filter(i => i.isOverdue && i.status === 'running').length;
      const lastTime = directList.length > 0 
        ? directList.reduce((max, cur) => cur.startTime > max ? cur.startTime : max, directList[0].startTime)
        : tpl.updatedAt || tpl.createdAt;

      stats[tpl.id] = { total, running, completed, overdue, lastTime };
    });

    return stats;
  }, [templates, instances]);

  // 流程表单主列表过滤
  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      if (tplSystemFilter !== 'ALL' && tpl.systemId !== tplSystemFilter) return false;
      if (tplScopeFilter !== 'ALL' && tpl.scope !== tplScopeFilter) return false;
      if (tplTypeFilter !== 'ALL' && tpl.templateType !== tplTypeFilter) return false;
      if (tplKeyword.trim()) {
        const kw = tplKeyword.toLowerCase().trim();
        const matchId = tpl.id.toLowerCase().includes(kw);
        const matchName = tpl.templateName.toLowerCase().includes(kw);
        const matchCat = (tpl.category || '').toLowerCase().includes(kw);
        const matchSys = (tpl.systemName || '').toLowerCase().includes(kw);
        const matchDesc = (tpl.description || '').toLowerCase().includes(kw);
        if (!matchId && !matchName && !matchCat && !matchSys && !matchDesc) return false;
      }
      return true;
    });
  }, [templates, tplSystemFilter, tplScopeFilter, tplTypeFilter, tplKeyword]);

  // 流程表单分页
  const totalTplItems = filteredTemplates.length;
  const totalTplPages = Math.max(1, Math.ceil(totalTplItems / tplPageSize));
  const currentTplItems = useMemo(() => {
    const start = (tplCurrentPage - 1) * tplPageSize;
    return filteredTemplates.slice(start, start + tplPageSize);
  }, [filteredTemplates, tplCurrentPage, tplPageSize]);

  // 全平台汇总统计
  const platformStats = useMemo(() => {
    const totalTpls = templates.length;
    const totalIns = instances.length;
    const runningIns = instances.filter(i => i.status === 'running').length;
    const overdueIns = instances.filter(i => i.isOverdue && i.status === 'running').length;
    const completedIns = instances.filter(i => i.status === 'completed').length;
    return { totalTpls, totalIns, runningIns, overdueIns, completedIns };
  }, [templates, instances]);

  // ====================== 选中流程详情数据计算 ======================
  // 1. 当前流程所有实例
  const currentFlowInstances = useMemo(() => {
    if (!selectedTemplate) return [];
    return instances.filter(ins => ins.templateId === selectedTemplate.id);
  }, [selectedTemplate, instances]);

  // 2. 关联流程和表单的所有实例
  const associatedFlowInstances = useMemo(() => {
    if (!selectedTemplate) return [];
    return getAssociatedInstancesForTemplate(selectedTemplate.id, instances);
  }, [selectedTemplate, instances]);

  // 关联表单流程选项列表（供筛选使用）
  const relatedTemplateOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; systemName?: string }>();
    associatedFlowInstances.forEach(item => {
      if (!map.has(item.templateId)) {
        map.set(item.templateId, {
          id: item.templateId,
          name: item.templateName,
          systemName: item.systemName
        });
      }
    });
    return Array.from(map.values());
  }, [associatedFlowInstances]);

  // 3. 当前流程过滤后实例
  const filteredCurrentInstances = useMemo(() => {
    return currentFlowInstances.filter(ins => {
      if (subStatusFilter !== 'ALL' && ins.status !== subStatusFilter) return false;
      if (subUrgencyFilter !== 'ALL' && ins.urgency !== subUrgencyFilter) return false;
      if (subKeyword.trim()) {
        const kw = subKeyword.toLowerCase().trim();
        const matchTitle = ins.title.toLowerCase().includes(kw);
        const matchId = ins.id.toLowerCase().includes(kw);
        const matchAssignee = ins.currentAssignees.some(a => a.toLowerCase().includes(kw));
        const matchInitiator = ins.initiator.toLowerCase().includes(kw);
        if (!matchTitle && !matchId && !matchAssignee && !matchInitiator) return false;
      }
      return true;
    });
  }, [currentFlowInstances, subStatusFilter, subUrgencyFilter, subKeyword]);

  // 4. 关联表单流程过滤后实例
  const filteredAssociatedInstances = useMemo(() => {
    return associatedFlowInstances.filter(ins => {
      if (subStatusFilter !== 'ALL' && ins.status !== subStatusFilter) return false;
      if (subRelatedTplFilter !== 'ALL' && ins.templateId !== subRelatedTplFilter) return false;
      if (subKeyword.trim()) {
        const kw = subKeyword.toLowerCase().trim();
        const matchTitle = ins.title.toLowerCase().includes(kw);
        const matchId = ins.id.toLowerCase().includes(kw);
        const matchTpl = ins.templateName.toLowerCase().includes(kw);
        const matchRel = ins.relationTypeLabel.toLowerCase().includes(kw);
        const matchAssignee = ins.currentAssignees.some(a => a.toLowerCase().includes(kw));
        const matchInitiator = ins.initiator.toLowerCase().includes(kw);
        if (!matchTitle && !matchId && !matchTpl && !matchRel && !matchAssignee && !matchInitiator) return false;
      }
      return true;
    });
  }, [associatedFlowInstances, subStatusFilter, subRelatedTplFilter, subKeyword]);

  // 进入指定流程详情
  const handleOpenTemplateDetails = (tpl: ProcessTemplateItem) => {
    setSelectedTemplate(tpl);
    setDetailTab('current_instances');
    setSubStatusFilter('ALL');
    setSubUrgencyFilter('ALL');
    setSubRelatedTplFilter('ALL');
    setSubKeyword('');
    setSubCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ========================================================================= */}
      {/* 视图一：流程表单维度主列表 (默认视图) */}
      {/* ========================================================================= */}
      {!selectedTemplate ? (
        <>
          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">纳管流程表单总数</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {platformStats.totalTpls} <span className="text-xs text-slate-400 font-normal">个</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Workflow className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">全平台流转实例总数</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {platformStats.totalIns} <span className="text-xs text-slate-400 font-normal">单</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">在办流转中实例</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {platformStats.runningIns} <span className="text-xs text-slate-400 font-normal">单</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Play className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">超时待督办预警</span>
                <div className="text-2xl font-black text-red-600 mt-1">
                  {platformStats.overdueIns} <span className="text-xs text-slate-400 font-normal">单</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 筛选与搜索控制条 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* 筛选条件组合 */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 1. 业务系统 */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">业务系统:</span>
                  <select
                    value={tplSystemFilter}
                    onChange={e => {
                      setTplSystemFilter(e.target.value);
                      setTplCurrentPage(1);
                    }}
                    className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">全部业务系统</option>
                    {BUSINESS_SYSTEMS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. 适用范围 */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">授权范围:</span>
                  <select
                    value={tplScopeFilter}
                    onChange={e => {
                      setTplScopeFilter(e.target.value);
                      setTplCurrentPage(1);
                    }}
                    className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                  >
                    <option value="ALL">全部授权范围</option>
                    <option value="public">全辖公共通用</option>
                    <option value="org">机构/部门专属定制</option>
                  </select>
                </div>

                {/* 3. 模板类型 */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">流程类型:</span>
                  <select
                    value={tplTypeFilter}
                    onChange={e => {
                      setTplTypeFilter(e.target.value);
                      setTplCurrentPage(1);
                    }}
                    className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                  >
                    <option value="ALL">全部流程类型</option>
                    <option value="process">流程模板 (多步骤流转)</option>
                    <option value="normal">普通数据模板</option>
                  </select>
                </div>
              </div>

              {/* 搜索与重置 */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索流程ID/表单名称/分类..."
                    value={tplKeyword}
                    onChange={e => {
                      setTplKeyword(e.target.value);
                      setTplCurrentPage(1);
                    }}
                    className="w-64 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTplSystemFilter('ALL');
                    setTplScopeFilter('ALL');
                    setTplTypeFilter('ALL');
                    setTplKeyword('');
                    setTplCurrentPage(1);
                  }}
                  className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  title="重置所有筛选"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 流程表单维度列表表格 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-xs font-bold text-slate-800">
                  流程表单维度台账 (点击流程ID或操作列「查看详情」下钻查看实例数据)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                共 {totalTplItems} 个流程模型
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-36">ID</th>
                    <th className="py-3.5 px-4 min-w-[220px]">流程 / 表单名称</th>
                    <th className="py-3.5 px-4 w-28">所属业务系统</th>
                    <th className="py-3.5 px-4 w-28">业务分类</th>
                    <th className="py-3.5 px-4 w-32">表单控件数</th>
                    <th className="py-3.5 px-4 w-40">授权适用范围</th>
                    <th className="py-3.5 px-4 w-28 text-center">实例总数</th>
                    <th className="py-3.5 px-4 w-28 text-center">流转在办中</th>
                    <th className="py-3.5 px-4 w-28 text-center">已办结</th>
                    <th className="py-3.5 px-4 w-36">最新活跃时间</th>
                    <th className="py-3.5 px-4 w-32 text-center sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentTplItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <span>未找到符合条件的流程表单记录</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentTplItems.map(tpl => {
                      const sys = BUSINESS_SYSTEMS.find(s => s.id === tpl.systemId);
                      const stats = templateStatsMap[tpl.id] || { total: 0, running: 0, completed: 0, overdue: 0, lastTime: '-' };

                      return (
                        <tr 
                          key={tpl.id} 
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenTemplateDetails(tpl)}
                        >
                          {/* 1. ID */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-700 text-xs tracking-wider inline-block">
                              {tpl.id}
                            </span>
                          </td>

                          {/* 2. 流程/表单名称 */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1" title={tpl.templateName}>
                                {tpl.templateName}
                              </span>
                              {tpl.description && (
                                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={tpl.description}>
                                  {tpl.description}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. 业务系统 */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${sys?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                              {tpl.systemName || sys?.name || '通用系统'}
                            </span>
                          </td>

                          {/* 4. 业务分类 */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {tpl.category || '综合业务'}
                            </span>
                          </td>

                          {/* 5. 表单控件数 */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 text-slate-600">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold font-mono">{tpl.fields?.length || 0}</span>
                              <span className="text-[10px] text-slate-400">个字段控件</span>
                            </div>
                          </td>

                          {/* 6. 授权适用范围 */}
                          <td className="py-3.5 px-4">
                            {tpl.scope === 'public' ? (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                全辖公共通用
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold truncate max-w-[140px] inline-block" title={tpl.orgGroupName || tpl.orgRootName || tpl.orgName}>
                                {tpl.orgGroupName || tpl.orgRootName || tpl.orgName || '专属机构定制'}
                              </span>
                            )}
                          </td>

                          {/* 7. 实例总数 */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                            {stats.total > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                                {stats.total} 单
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* 8. 流转在办中 */}
                          <td className="py-3.5 px-4 text-center">
                            {stats.running > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold font-mono inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {stats.running}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>

                          {/* 9. 已办结 */}
                          <td className="py-3.5 px-4 text-center">
                            {stats.completed > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold font-mono">
                                {stats.completed}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>

                          {/* 10. 最新活跃时间 */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {stats.lastTime}
                          </td>

                          {/* 12. 操作列 (查看详情) */}
                          <td 
                            className="py-3.5 px-4 text-center sticky right-0 bg-white group-hover:bg-blue-50/40 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.03)]"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenTemplateDetails(tpl)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>查看详情</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页控制栏 */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>共 <strong className="text-slate-800 font-bold font-mono">{totalTplItems}</strong> 个流程表单模型</span>
                <span>|</span>
                <select
                  value={tplPageSize}
                  onChange={e => {
                    setTplPageSize(Number(e.target.value));
                    setTplCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 outline-none"
                >
                  <option value={10}>10条 / 页</option>
                  <option value={20}>20条 / 页</option>
                  <option value={50}>50条 / 页</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={tplCurrentPage <= 1}
                  onClick={() => setTplCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                >
                  上一页
                </button>
                <span className="px-2 font-mono text-slate-700 font-bold">
                  {tplCurrentPage} / {totalTplPages}
                </span>
                <button
                  type="button"
                  disabled={tplCurrentPage >= totalTplPages}
                  onClick={() => setTplCurrentPage(prev => Math.min(totalTplPages, prev + 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* 视图二：点进每个流程ID后的所有实例数据与关联流程表单数据详情面板 */
        /* ========================================================================= */
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* 顶部返回导航与流程信息 Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回流程表单列表</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">当前流程ID:</span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                  {selectedTemplate.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  BUSINESS_SYSTEMS.find(s => s.id === selectedTemplate.systemId)?.badgeColor || 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedTemplate.systemName}
                </span>
              </div>
            </div>

            {/* 流程基础档案与统计指标 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* 流程卡片详情 */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-800 tracking-tight">
                    {selectedTemplate.templateName}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {selectedTemplate.category || '业务表单'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                    {selectedTemplate.version || 'V1.0'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedTemplate.description || '当前流程表单纳管全生命周期流转实例数据，支持多级审批、协同办理与关联流程穿透跟踪。'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>授权范围: </span>
                    <strong className="text-slate-800">
                      {selectedTemplate.scope === 'public' ? '全辖公共通用' : selectedTemplate.orgGroupName || selectedTemplate.orgName || '机构专属定制'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                    <span>表单控件: </span>
                    <strong className="text-slate-800 font-mono">{selectedTemplate.fields?.length || 0} 个</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>最近更新: </span>
                    <strong className="text-slate-800 font-mono">{selectedTemplate.updatedAt || selectedTemplate.createdAt}</strong>
                  </div>
                </div>
              </div>

              {/* 4 个快捷统计指标 */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">本流程实例</span>
                  <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">
                    {currentFlowInstances.length} <span className="text-[10px] text-slate-400 font-normal">单</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">在办流转中</span>
                  <span className="text-base font-black text-amber-600 font-mono mt-0.5 block">
                    {currentFlowInstances.filter(i => i.status === 'running').length} <span className="text-[10px] text-slate-400 font-normal">单</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">关联协同实例</span>
                  <span className="text-base font-black text-indigo-600 font-mono mt-0.5 block">
                    {associatedFlowInstances.length} <span className="text-[10px] text-slate-400 font-normal">单</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">超时督办预警</span>
                  <span className="text-base font-black text-red-600 font-mono mt-0.5 block">
                    {currentFlowInstances.filter(i => i.isOverdue && i.status === 'running').length} <span className="text-[10px] text-slate-400 font-normal">单</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 选项卡切换：当前流程实例数据 vs 关联流程和表单实例数据 vs 表单填报台账 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            {/* Tab 头部 */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailTab('current_instances');
                  setSubCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x -mb-px ${
                  detailTab === 'current_instances'
                    ? 'bg-white border-slate-200 text-blue-600 shadow-2xs'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>当前流程实例数据</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  {currentFlowInstances.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailTab('associated_instances');
                  setSubCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x -mb-px ${
                  detailTab === 'associated_instances'
                    ? 'bg-white border-slate-200 text-indigo-600 shadow-2xs'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>关联表单流程数据</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  {associatedFlowInstances.length}
                </span>
              </button>
            </div>

            {/* 子筛选与检索工具栏 */}
            <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-500">流转状态:</span>
                    <select
                      value={subStatusFilter}
                      onChange={e => {
                        setSubStatusFilter(e.target.value);
                        setSubCurrentPage(1);
                      }}
                      className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                    >
                      <option value="ALL">全部状态</option>
                      <option value="running">流转办理中</option>
                      <option value="completed">已办结归档</option>
                      <option value="rejected">已驳回</option>
                      <option value="terminated">已作废终止</option>
                    </select>
                  </div>

                  {detailTab === 'current_instances' && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                      <span className="text-[11px] font-bold text-slate-500">紧急程度:</span>
                      <select
                        value={subUrgencyFilter}
                        onChange={e => {
                          setSubUrgencyFilter(e.target.value);
                          setSubCurrentPage(1);
                        }}
                        className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
                      >
                        <option value="ALL">全部紧急度</option>
                        <option value="normal">平急 (常规)</option>
                        <option value="urgent">紧急</option>
                        <option value="extreme">特急 (攻坚)</option>
                      </select>
                    </div>
                  )}

                  {detailTab === 'associated_instances' && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                      <span className="text-[11px] font-bold text-slate-500">关联表单流程:</span>
                      <select
                        value={subRelatedTplFilter}
                        onChange={e => {
                          setSubRelatedTplFilter(e.target.value);
                          setSubCurrentPage(1);
                        }}
                        className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer max-w-[220px]"
                      >
                        <option value="ALL">全部关联表单流程 ({relatedTemplateOptions.length})</option>
                        {relatedTemplateOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>
                            {opt.systemName ? `[${opt.systemName}] ` : ''}{opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索流水号/主题/承办人/关联流程..."
                      value={subKeyword}
                      onChange={e => {
                        setSubKeyword(e.target.value);
                        setSubCurrentPage(1);
                      }}
                      className="w-60 pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubStatusFilter('ALL');
                      setSubUrgencyFilter('ALL');
                      setSubRelatedTplFilter('ALL');
                      setSubKeyword('');
                      setSubCurrentPage(1);
                    }}
                    className="p-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                    title="重置筛选"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            {/* ====================== Tab 1 内容：当前流程的所有实例数据 ====================== */}
            {detailTab === 'current_instances' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-40">实例流水号</th>
                      <th className="py-3 px-4 min-w-[240px]">指令工单主题</th>
                      <th className="py-3 px-4 w-36">发起人 / 部门</th>
                      <th className="py-3 px-4 w-44">当前环节 / 承办人</th>
                      <th className="py-3 px-4 w-32">运行时效</th>
                      <th className="py-3 px-4 w-28 text-center">流转状态</th>
                      <th className="py-3 px-4 w-24 text-center">催办次数</th>
                      <th className="py-3 px-4 w-36 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCurrentInstances.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileText className="w-8 h-8 text-slate-300" />
                            <span>当前流程暂无符合条件的流转实例数据</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCurrentInstances.map(ins => (
                        <tr 
                          key={ins.id} 
                          className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                          onClick={() => setActiveInstance(ins)}
                        >
                          {/* 1. 流水号 */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">
                            {ins.id}
                          </td>

                          {/* 2. 工单主题与紧急度 */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {ins.urgency === 'extreme' && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold shrink-0 border border-red-200">
                                  特急
                                </span>
                              )}
                              {ins.urgency === 'urgent' && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0 border border-amber-200">
                                  紧急
                                </span>
                              )}
                              <span className="font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1" title={ins.title}>
                                {ins.title}
                              </span>
                            </div>
                          </td>

                          {/* 3. 发起人 / 部门 */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{ins.initiator}</span>
                              <span className="text-[10px] text-slate-400">{ins.initiatorDept}</span>
                            </div>
                          </td>

                          {/* 4. 当前环节 / 承办人 */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-blue-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span>{ins.currentNodeName}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 truncate max-w-[170px]" title={ins.currentAssignees.join(', ')}>
                                {ins.currentAssignees.join('、')}
                              </span>
                            </div>
                          </td>

                          {/* 5. 运行时效 */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className={`font-mono font-bold text-xs ${ins.isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                  {ins.durationHours}h
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">/ {ins.timeLimitHours}h</span>
                              </div>
                              {ins.isOverdue && (
                                <span className="text-[10px] text-red-500 font-bold">
                                  超时 {ins.overdueHours}h
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. 状态 */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              ins.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ins.status === 'running'
                                ? ins.isOverdue
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                : ins.status === 'rejected'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {ins.status === 'completed' && <Check className="w-3 h-3 text-emerald-600" />}
                              {ins.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />}
                              <span>{ins.statusLabel}</span>
                            </span>
                          </td>

                          {/* 7. 催办次数 */}
                          <td className="py-3 px-4 text-center font-mono">
                            {ins.urgeCount > 0 ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                {ins.urgeCount} 次
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* 8. 操作 */}
                          <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveInstance(ins)}
                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors cursor-pointer"
                                title="查看实例流转详情"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTraceInstance(ins)}
                                className="p-1 hover:bg-purple-50 text-purple-600 rounded transition-colors cursor-pointer"
                                title="流程拓扑跟踪"
                              >
                                <GitBranch className="w-4 h-4" />
                              </button>
                              {ins.status === 'running' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleUrgeInstance(ins.id, e)}
                                  className="p-1 hover:bg-amber-50 text-amber-600 rounded transition-colors cursor-pointer"
                                  title={`即时催办 (已催办${ins.urgeCount}次)`}
                                >
                                  <BellRing className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ====================== Tab 2 内容：关联流程和表单的所有实例数据 ====================== */}
            {detailTab === 'associated_instances' && (
              <div className="flex flex-col">
                {/* 关联提示说明条 */}
                <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      已为您汇总与当前流程<strong>「{selectedTemplate.templateName}」</strong>相关联的关联表单流程数据，支持上游触发源、下游应急督办及跨系统协同穿透。
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-indigo-700 font-bold shrink-0">
                    共关联 {associatedFlowInstances.length} 条协同实例
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-40">关联实例流水号</th>
                        <th className="py-3 px-4 w-48">关联流程 / 表单模板</th>
                        <th className="py-3 px-4 w-36">关联协同类型</th>
                        <th className="py-3 px-4 min-w-[240px]">关联工单主题与业务说明</th>
                        <th className="py-3 px-4 w-32">当前承办人 / 机构</th>
                        <th className="py-3 px-4 w-28 text-center">实例状态</th>
                        <th className="py-3 px-4 w-32">关联启动时间</th>
                        <th className="py-3 px-4 w-28 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredAssociatedInstances.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Share2 className="w-8 h-8 text-slate-300" />
                              <span>暂无符合条件的关联表单流程数据记录</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAssociatedInstances.map(assoc => {
                          const relBadgeColor = 
                            assoc.relationType === 'upstream'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : assoc.relationType === 'downstream'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : assoc.relationType === 'countersign'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : assoc.relationType === 'subflow'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                          return (
                            <tr 
                              key={assoc.id} 
                              className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                              onClick={() => setActiveInstance(assoc.rawRecord)}
                            >
                              {/* 1. 关联实例流水号 */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                <span className="group-hover:text-indigo-600 transition-colors">
                                  {assoc.id}
                                </span>
                              </td>

                              {/* 2. 关联流程/表单模板 */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 line-clamp-1" title={assoc.templateName}>
                                    {assoc.templateName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {assoc.systemName} · {assoc.templateId}
                                  </span>
                                </div>
                              </td>

                              {/* 3. 关联协同类型 */}
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${relBadgeColor}`}>
                                  {assoc.relationTypeLabel}
                                </span>
                              </td>

                              {/* 4. 工单主题与业务说明 */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1" title={assoc.title}>
                                    {assoc.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                    {assoc.relationDescription}
                                  </span>
                                </div>
                              </td>

                              {/* 5. 当前承办人 / 机构 */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800">{assoc.currentAssignees.join('、')}</span>
                                  <span className="text-[10px] text-slate-400 truncate">{assoc.orgName}</span>
                                </div>
                              </td>

                              {/* 6. 实例状态 */}
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  assoc.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : assoc.status === 'running'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {assoc.status === 'completed' && <Check className="w-3 h-3 text-emerald-600" />}
                                  {assoc.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />}
                                  <span>{assoc.statusLabel}</span>
                                </span>
                              </td>

                              {/* 7. 启动时间 */}
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                {assoc.startTime}
                              </td>

                              {/* 8. 操作 */}
                              <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveInstance(assoc.rawRecord)}
                                    className="p-1 hover:bg-indigo-50 text-indigo-600 rounded transition-colors cursor-pointer"
                                    title="查看关联实例流转快照"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTraceInstance(assoc.rawRecord)}
                                    className="p-1 hover:bg-purple-50 text-purple-600 rounded transition-colors cursor-pointer"
                                    title="流程拓扑跟踪"
                                  >
                                    <GitBranch className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= 实例流转详情抽屉 ======================= */}
      {activeInstance && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* 抽屉顶部 */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      {activeInstance.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeInstance.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activeInstance.statusLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 mt-1 line-clamp-1" title={activeInstance.title}>
                    {activeInstance.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveInstance(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 抽屉主体 (表单数据快照 + 步骤流转轨迹) */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* 1. 基础摘要卡 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">所属业务系统</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">{activeInstance.systemName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">发起人 / 部门</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">{activeInstance.initiator} ({activeInstance.initiatorDept})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">启动时间</span>
                  <span className="font-mono font-bold text-slate-700 mt-0.5 block">{activeInstance.startTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">当前办理人</span>
                  <span className="font-bold text-blue-600 mt-0.5 block">{activeInstance.currentAssignees.join('、')}</span>
                </div>
              </div>

              {/* 2. 表单数据快照 */}
              {activeInstance.formDataSnapshot && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>业务表单数据快照</span>
                  </h4>
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                    {Object.entries(activeInstance.formDataSnapshot).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 font-mono text-[11px]">{k}:</span>
                        <span className="text-slate-800 font-bold max-w-[340px] text-right">
                          {typeof v === 'boolean' ? (v ? '是' : '否') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 步骤流转轨迹历史链 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span>流转历史轨迹与办理意见</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">共 {activeInstance.stepHistory.length} 个步骤节点</span>
                </div>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {activeInstance.stepHistory.map((step, idx) => {
                    const isDone = step.status === 'completed';
                    const isCurr = step.status === 'current';
                    const isRej = step.status === 'rejected';

                    return (
                      <div key={step.id} className="relative flex items-start gap-4 pl-8">
                        {/* 节点序号圆点 */}
                        <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono z-10 ${
                          isDone 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : isCurr
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                            : isRej
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>

                        {/* 节点内容卡片 */}
                        <div className={`flex-1 bg-white border rounded-xl p-3.5 space-y-1.5 shadow-2xs ${
                          isCurr ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">{step.nodeName}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {step.actionLabel}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>经办人: <strong className="text-slate-700">{step.operator}</strong></span>
                            <span>|</span>
                            <span>{step.operatorDept}</span>
                            {step.durationMins > 0 && (
                              <>
                                <span>|</span>
                                <span className="font-mono text-slate-400">耗时 {step.durationMins} 分钟</span>
                              </>
                            )}
                          </div>

                          {step.opinion && step.opinion !== '-' && (
                            <div className="mt-1 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-700 border border-slate-100 leading-relaxed">
                              <span className="font-bold text-slate-500">意见: </span>
                              <span>{step.opinion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 抽屉底部操作条 */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activeInstance.status === 'running' && (
                  <button
                    type="button"
                    onClick={() => handleUrgeInstance(activeInstance.id)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-600" />
                    <span>即时催办 ({activeInstance.urgeCount}次)</span>
                  </button>
                )}
                {activeInstance.status === 'running' && (
                  <button
                    type="button"
                    onClick={() => handleTerminateInstance(activeInstance.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>管理员强制终止</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveInstance(null)}
                className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                关闭详情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 流程拓扑图跟踪弹窗 ======================= */}
      {traceInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  流程实例流转拓扑跟踪: <span className="font-mono text-blue-600">{traceInstance.id}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTraceInstance(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto bg-slate-100/60 flex flex-col items-center justify-center">
              <div className="w-full max-w-xl flex flex-col items-center space-y-3">
                {traceInstance.stepHistory.map((step, idx) => {
                  const isDone = step.status === 'completed';
                  const isCurr = step.status === 'current';
                  const isRej = step.status === 'rejected';

                  return (
                    <React.Fragment key={step.id}>
                      <div className={`w-full p-4 rounded-xl border-2 transition-all shadow-xs ${
                        isDone
                          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                          : isCurr
                          ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-4 ring-blue-500/20 shadow-md'
                          : isRej
                          ? 'bg-red-50 border-red-500 text-red-950'
                          : 'bg-white border-slate-300 text-slate-600 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-mono ${
                              isDone ? 'bg-emerald-600' : isCurr ? 'bg-blue-600' : isRej ? 'bg-red-600' : 'bg-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <span>{step.nodeName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDone ? 'bg-emerald-200 text-emerald-900' : isCurr ? 'bg-blue-200 text-blue-900 animate-pulse' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isDone ? '已流转完成' : isCurr ? '当前激活流转环节' : isRej ? '已驳回' : '等待流转'}
                          </span>
                        </div>
                        <div className="text-[11px] mt-2 flex items-center justify-between text-slate-600">
                          <span>承办: {step.operator} ({step.operatorDept})</span>
                          <span className="font-mono text-[10px]">{step.timestamp}</span>
                        </div>
                      </div>

                      {idx < traceInstance.stepHistory.length - 1 && (
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-slate-400" />
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                          <div className="w-0.5 h-4 bg-slate-400" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setTraceInstance(null)}
                className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 催办/操作 Toast 提醒 */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
