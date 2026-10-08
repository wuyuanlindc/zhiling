/**
 * 业务数据模板引擎管理视图 (TemplateManagementView)
 * 
 * 核心功能：
 * 1. 纳管 3 大核心业务系统：正管用、谛听预警、点点速报
 * 2. 租户多维度筛选：公共模板 vs 机构专属定制模板 (按组织机构级联筛选)
 * 3. 模板列表展示：默认高密表格列表形态展示，支持卡片网格视图切换
 * 4. 新建流程模板：弹出归属业务系统、归属范围及模板名称对话框，确认后直接进入 24 栅格低代码表单设计器
 * 5. 全流程闭环：支持 4 步向导式表单设计、流程拓扑设计、字段读写权限与操作按钮配置、仿真预览与克隆
 */

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Globe2, 
  Copy, 
  Eye, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Siren, 
  Target, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  LayoutGrid, 
  List, 
  Sparkles,
  GitFork,
  Sliders,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  FolderKanban,
  User,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  GitMerge,
  FolderTree
} from 'lucide-react';
import { 
  ProcessTemplateItem, 
  ProcessDefinition, 
  BUSINESS_SYSTEMS, 
  BusinessSystemItem 
} from '../../types/processEngine';
import { MOCK_ORGS } from '../../data/mockProcessEngine';
import { TemplateFormPreviewModal } from './TemplateFormPreviewModal';
import { LowCodeTemplateDesigner } from './LowCodeTemplateDesigner';
import { NewTemplateWizardModal } from './NewTemplateWizardModal';
import { TemplateBasicInfoEditModal } from './TemplateBasicInfoEditModal';
import { TemplateCloneModal } from './TemplateCloneModal';
import { TemplateStatusWarningModal } from './TemplateStatusWarningModal';
import { OrgScopePanoramaModal } from './OrgScopePanoramaModal';

interface TemplateManagementViewProps {
  templates: ProcessTemplateItem[];
  processes: ProcessDefinition[];
  onUpdateTemplates: (updater: (prev: ProcessTemplateItem[]) => ProcessTemplateItem[]) => void;
  onNavigateToProcessDesigner?: (processId: string) => void;
}

export const TemplateManagementView: React.FC<TemplateManagementViewProps> = ({
  templates,
  processes,
  onUpdateTemplates,
  onNavigateToProcessDesigner
}) => {
  // 当前选中的业务系统（'ALL' 或 'SYS_ZGY' / 'SYS_DTYJ' / 'SYS_DDSB'）
  const [selectedSystemId, setSelectedSystemId] = useState<string>('ALL');

  // 模板归属范围筛选（'all' | 'public' | 'org'）
  const [scopeFilter, setScopeFilter] = useState<'all' | 'public' | 'org'>('all');

  // 机构专属筛选
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');

  // 业务分类筛选
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 搜索关键字
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 视图模式：默认高密表格列表 vs 卡片网格
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // 模态框与设计器状态
  const [previewTemplate, setPreviewTemplate] = useState<ProcessTemplateItem | null>(null);
  const [isNewWizardOpen, setIsNewWizardOpen] = useState(false);
  const [lowCodeDesignerTemplate, setLowCodeDesignerTemplate] = useState<ProcessTemplateItem | null>(null);
  const [basicInfoEditingTemplate, setBasicInfoEditingTemplate] = useState<ProcessTemplateItem | null>(null);
  const [deactivatingTemplate, setDeactivatingTemplate] = useState<ProcessTemplateItem | null>(null);
  const [cloningTemplate, setCloningTemplate] = useState<ProcessTemplateItem | null>(null);
  const [statusWarningModal, setStatusWarningModal] = useState<{
    actionType: 'design' | 'edit';
    template: ProcessTemplateItem;
  } | null>(null);

  // 100+ 机构全景穿透查看抽屉/弹窗状态
  const [selectedPanoramaTemplate, setSelectedPanoramaTemplate] = useState<ProcessTemplateItem | null>(null);

  // 保存成功的 Toast 提示
  const [saveToast, setSaveToast] = useState<{
    templateName: string;
    oldVersion: string;
    newVersion: string;
  } | null>(null);

  // 模板类型筛选：'all' | 'normal' | 'process'
  const [typeFilter, setTypeFilter] = useState<'all' | 'normal' | 'process'>('all');

  // 分页状态：默认 10 条每页
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');

  // 当筛选条件变化时自动重置为第 1 页
  React.useEffect(() => {
    setCurrentPage(1);
    setJumpPageInput('1');
  }, [selectedSystemId, scopeFilter, selectedOrgId, selectedCategory, typeFilter, searchQuery]);

  // 格式化时间精确到分 (YYYY-MM-DD HH:mm)
  const formatTimeToMinute = (timeStr?: string) => {
    if (!timeStr) return '2026-09-23 10:00';
    const clean = timeStr.replace('T', ' ');
    if (clean.length >= 16) return clean.substring(0, 16);
    if (clean.length === 10) return `${clean} 10:00`;
    return clean;
  };

  // 统计各系统的模板数量
  const systemStats = useMemo(() => {
    const stats: Record<string, { total: number; publicCount: number; orgCount: number; activeCount: number; inactiveCount: number }> = {
      ALL: { total: templates.length, publicCount: 0, orgCount: 0, activeCount: 0, inactiveCount: 0 }
    };

    BUSINESS_SYSTEMS.forEach(sys => {
      stats[sys.id] = { total: 0, publicCount: 0, orgCount: 0, activeCount: 0, inactiveCount: 0 };
    });

    templates.forEach(t => {
      const isActive = t.status === 'active';
      if (t.scope === 'public') stats.ALL.publicCount++;
      if (t.scope === 'org') stats.ALL.orgCount++;
      if (isActive) stats.ALL.activeCount++;
      else stats.ALL.inactiveCount++;

      if (stats[t.systemId]) {
        stats[t.systemId].total++;
        if (t.scope === 'public') stats[t.systemId].publicCount++;
        if (t.scope === 'org') stats[t.systemId].orgCount++;
        if (isActive) stats[t.systemId].activeCount++;
        else stats[t.systemId].inactiveCount++;
      }
    });

    return stats;
  }, [templates]);

  // 获取所有业务分类列表
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [templates]);

  // 过滤后的模板列表
  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      // 1. 系统筛选
      if (selectedSystemId !== 'ALL' && tpl.systemId !== selectedSystemId) {
        return false;
      }

      // 2. 归属范围筛选
      if (scopeFilter !== 'all' && tpl.scope !== scopeFilter) {
        return false;
      }

      // 3. 机构专属筛选
      if (selectedOrgId !== 'ALL') {
        if (tpl.scope !== 'org') {
          return false;
        }
        const hasOrgId = tpl.orgId === selectedOrgId;
        const hasInOrgIds = tpl.orgIds && tpl.orgIds.includes(selectedOrgId);
        if (!hasOrgId && !hasInOrgIds) {
          return false;
        }
      }

      // 4. 分类筛选
      if (selectedCategory !== 'ALL' && tpl.category !== selectedCategory) {
        return false;
      }

      // 4.5 模板类型筛选 (普通模板 vs 流程模板)
      if (typeFilter !== 'all') {
        const currentType = tpl.templateType || 'process';
        if (currentType !== typeFilter) {
          return false;
        }
      }

      // 5. 关键字搜索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = tpl.id.toLowerCase().includes(q);
        const matchName = tpl.templateName.toLowerCase().includes(q);
        const matchDesc = tpl.description?.toLowerCase().includes(q);
        const matchCategory = tpl.category?.toLowerCase().includes(q);
        const matchField = (tpl.formWidgets || tpl.fields || []).some((f: any) => f.label?.toLowerCase().includes(q) || f.key?.toLowerCase().includes(q));
        const matchOrg = tpl.orgName?.toLowerCase().includes(q) || (tpl.orgNames && tpl.orgNames.some(o => o.toLowerCase().includes(q)));
        const matchCreator = tpl.creator?.toLowerCase().includes(q);
        return matchId || matchName || matchDesc || matchCategory || matchField || matchOrg || matchCreator;
      }

      return true;
    });
  }, [templates, selectedSystemId, scopeFilter, selectedOrgId, selectedCategory, typeFilter, searchQuery]);

  // 分页计算
  const totalCount = filteredTemplates.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTemplates = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, safeCurrentPage, pageSize]);

  // 分页控制条组件 (样式与其他页面一致，支持条数切换、上一页/页码/下一页与快速跳转，默认10条每页)
  const renderPaginationBar = () => {
    const startItem = totalCount > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
    const endItem = Math.min(safeCurrentPage * pageSize, totalCount);

    return (
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        {/* 左侧：数量汇总与每页条数选择 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            显示第 <strong className="font-mono text-slate-800 font-bold">{startItem}</strong> 至{' '}
            <strong className="font-mono text-slate-800 font-bold">{endItem}</strong> 条
          </span>
          <span className="text-slate-300">•</span>
          <span>
            共 <strong className="font-mono text-slate-900 font-bold">{totalCount}</strong> 个流程模板
          </span>

          <div className="flex items-center gap-1.5 ml-2 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
            <span className="text-slate-500 font-bold text-[11px]">每页显示:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                setCurrentPage(1);
                setJumpPageInput('1');
              }}
              className="bg-transparent font-bold text-slate-700 text-xs cursor-pointer focus:outline-none"
            >
              <option value={10}>10 条/页 (默认)</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
              <option value={100}>100 条/页</option>
            </select>
          </div>
        </div>

        {/* 右侧：上一页、页码列表、下一页与直达第几页 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 上一页 */}
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => {
              const prev = Math.max(1, safeCurrentPage - 1);
              setCurrentPage(prev);
              setJumpPageInput(String(prev));
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              safeCurrentPage <= 1
                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>上一页</span>
          </button>

          {/* 页码列表 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-mono">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(item);
                const isActive = safeCurrentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      setJumpPageInput(String(pageNum));
                    }}
                    className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
          </div>

          {/* 下一页 */}
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => {
              const next = Math.min(totalPages, safeCurrentPage + 1);
              setCurrentPage(next);
              setJumpPageInput(String(next));
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              safeCurrentPage >= totalPages
                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
            }`}
          >
            <span>下一页</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* 跳至第几页 */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 ml-1 text-slate-500 text-xs">
              <span>跳至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(jumpPageInput, 10);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    } else {
                      setJumpPageInput(String(safeCurrentPage));
                    }
                  }
                }}
                className="w-12 h-8 px-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span>页</span>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(jumpPageInput, 10);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  } else {
                    setJumpPageInput(String(safeCurrentPage));
                  }
                }}
                className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                确定
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 点击“设计”：进入低代码设计器工作台
  const handleAttemptDesign = (tpl: ProcessTemplateItem) => {
    setLowCodeDesignerTemplate(tpl);
  };

  // 点击“编辑”：打开基础信息编辑弹窗（编辑模板名称、所属系统、归属范围、分类与描述）
  const handleAttemptEdit = (tpl: ProcessTemplateItem) => {
    setBasicInfoEditingTemplate(tpl);
  };

  // 状态拦截弹窗中点击“一键停用并进入”
  const handleDeactivateAndProceed = () => {
    if (!statusWarningModal) return;
    const { template } = statusWarningModal;

    const updatedTpl: ProcessTemplateItem = {
      ...template,
      status: 'inactive',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onUpdateTemplates(prev => prev.map(t => t.id === template.id ? updatedTpl : t));
    setStatusWarningModal(null);
    setLowCodeDesignerTemplate(updatedTpl);
  };

  // 复制弹窗确认回调
  const handleConfirmClone = (clonedTpl: ProcessTemplateItem) => {
    onUpdateTemplates(prev => [clonedTpl, ...prev]);
    setCloningTemplate(null);
  };

  // 保存基础信息编辑
  const handleSaveBasicInfo = (updatedTpl: ProcessTemplateItem) => {
    onUpdateTemplates(prev => prev.map(t => t.id === updatedTpl.id ? updatedTpl : t));
    setBasicInfoEditingTemplate(null);
  };

  // 启停用模板
  const handleToggleStatus = (tpl: ProcessTemplateItem) => {
    if (tpl.status === 'active') {
      // 停用需要二次确认弹窗
      setDeactivatingTemplate(tpl);
    } else {
      // 启用直接切换
      onUpdateTemplates(prev => prev.map(t => {
        if (t.id === tpl.id) {
          return {
            ...t,
            status: 'active',
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return t;
      }));
    }
  };

  // 二次确认停用
  const handleConfirmDeactivate = () => {
    if (!deactivatingTemplate) return;
    onUpdateTemplates(prev => prev.map(t => {
      if (t.id === deactivatingTemplate.id) {
        return {
          ...t,
          status: 'inactive',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return t;
    }));
    setDeactivatingTemplate(null);
  };

  // 删除模板
  const handleDeleteTemplate = (tplId: string) => {
    const t = templates.find(item => item.id === tplId);
    if (!t) return;
    if (window.confirm(`确定要删除业务数据模板【${t.templateName}】吗？删除后不可恢复。`)) {
      onUpdateTemplates(prev => prev.filter(item => item.id !== tplId));
    }
  };

  // 保存低代码设计器结果 (保存时不退出至列表页，仅在显式要求关闭时退出)
  const handleSaveLowCodeTemplate = (savedTpl: ProcessTemplateItem, closeDesigner: boolean = false) => {
    // 获取保存前的原版本
    const existing = templates.find(t => t.id === savedTpl.id);
    const oldVer = existing?.version || 'V1.0.0';
    const newVer = savedTpl.version || 'V1.0.1';

    onUpdateTemplates(prev => {
      const idx = prev.findIndex(t => t.id === savedTpl.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedTpl;
        return copy;
      } else {
        return [savedTpl, ...prev];
      }
    });

    // 更新设计器内的当前模板数据，保持设计器开启
    setLowCodeDesignerTemplate(prev => prev ? { ...prev, ...savedTpl } : null);

    // 仅在明确传入 closeDesigner 为 true 时才关闭设计器并弹出外层列表 Toast
    if (closeDesigner) {
      setSaveToast({
        templateName: savedTpl.templateName,
        oldVersion: oldVer,
        newVersion: newVer
      });

      // 4 秒后自动隐藏 Toast
      setTimeout(() => {
        setSaveToast(null);
      }, 4000);

      setLowCodeDesignerTemplate(null);
    }

    // 如果当前选中的系统筛选与新建的模板系统不匹配，切到新建模板所属系统或ALL，确保用户立即可见
    if (selectedSystemId !== 'ALL' && selectedSystemId !== savedTpl.systemId) {
      setSelectedSystemId(savedTpl.systemId);
    }
    // 重置页码至第1页，并清空搜索以便新模板在列表最顶部清晰呈现
    setCurrentPage(1);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 顶部三大业务系统看板切换卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 卡片 0: 全部系统 */}
        <div
          onClick={() => setSelectedSystemId('ALL')}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            selectedSystemId === 'ALL'
              ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-600/10'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">全部业务系统</h4>
                <p className="text-[10px] text-slate-400">跨系统全局纳管</p>
              </div>
            </div>
            <span className="text-lg font-black text-slate-800 font-mono">
              {systemStats.ALL.total}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>启用:</span>
                <strong className="font-mono font-bold text-emerald-700">{systemStats.ALL.activeCount}</strong>
              </span>
              <span className="text-slate-200">|</span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>停用:</span>
                <strong className="font-mono font-bold text-slate-600">{systemStats.ALL.inactiveCount}</strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-normal">
              公共 {systemStats.ALL.publicCount} · 专属 {systemStats.ALL.orgCount}
            </div>
          </div>
        </div>

        {/* 3 大核心业务系统卡片 */}
        {BUSINESS_SYSTEMS.map(sys => {
          const isSelected = selectedSystemId === sys.id;
          const stats = systemStats[sys.id] || { total: 0, publicCount: 0, orgCount: 0, activeCount: 0, inactiveCount: 0 };
          const IconComp = 
            sys.id === 'SYS_ZLL' ? ShieldCheck :
            sys.id === 'SYS_DDSB' ? Target : Siren;

          return (
            <div
              key={sys.id}
              onClick={() => setSelectedSystemId(sys.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `border-${sys.themeColor}-600 bg-${sys.themeColor}-50/30 shadow-md ring-2 ring-${sys.themeColor}-600/10`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${
                    sys.id === 'SYS_ZLL' ? 'bg-blue-100 text-blue-700' :
                    sys.id === 'SYS_DDSB' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{sys.shortName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{sys.appCode}</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {stats.total}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>启用:</span>
                    <strong className="font-mono font-bold text-emerald-700">{stats.activeCount}</strong>
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>停用:</span>
                    <strong className="font-mono font-bold text-slate-600">{stats.inactiveCount}</strong>
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">
                  公共 {stats.publicCount} · 专属 {stats.orgCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 筛选与搜索控制栏 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* 左侧多维筛选组 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 归属范围 Tab 组 */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部归属
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('public')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                scopeFilter === 'public'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>公共</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('org')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                scopeFilter === 'org'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>机构专属</span>
            </button>
          </div>

          {/* 机构级联选择器 (100+ 机构按层级与类型分组) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedOrgId}
              onChange={e => setSelectedOrgId(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer max-w-[180px]"
            >
              <option value="ALL">全部组织机构 ({MOCK_ORGS.length}家)</option>
              <optgroup label="市局本级">
                {MOCK_ORGS.filter(o => o.level === 1).map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="机关处室与直属支队 (16家)">
                {MOCK_ORGS.filter(o => o.type === 'dept' || o.type === 'detachment').map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="各区县公安分局 (13家)">
                {MOCK_ORGS.filter(o => o.type === 'district').map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="基层派出所 (78家)">
                {MOCK_ORGS.filter(o => o.type === 'station').map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer"
            >
              <option value="ALL">全部分类</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 模板类型筛选 */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-700 font-bold outline-none cursor-pointer"
            >
              <option value="all">全部类型</option>
              <option value="normal">普通模板</option>
              <option value="process">流程模板</option>
            </select>
          </div>

          {/* 搜索框 */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索模板名称、编码、字段..."
              className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          {/* 重置筛选 */}
          {(selectedSystemId !== 'ALL' || scopeFilter !== 'all' || selectedOrgId !== 'ALL' || selectedCategory !== 'ALL' || typeFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSystemId('ALL');
                setScopeFilter('all');
                setSelectedOrgId('ALL');
                setSelectedCategory('ALL');
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置</span>
            </button>
          )}
        </div>

        {/* 右侧动作与视图切换 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 视图切换 */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded text-slate-600 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'
              }`}
              title="高密表格列表视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-slate-600 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'hover:text-slate-900'
              }`}
              title="卡片网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* 新建模板按钮 */}
          <button
            type="button"
            onClick={() => setIsNewWizardOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新建模板</span>
          </button>
        </div>
      </div>

      {/* 结果概览与计数 */}
      <div className="flex items-center text-xs text-slate-500 px-1">
        <div>
          共检索到 <strong className="text-slate-800 font-bold">{filteredTemplates.length}</strong> 个业务数据模板
          {selectedSystemId !== 'ALL' && (
            <span className="ml-1.5 text-blue-600 font-medium">
              （所属系统：{BUSINESS_SYSTEMS.find(s => s.id === selectedSystemId)?.name}）
            </span>
          )}
        </div>
      </div>

      {/* 模板列表渲染：默认表格列表 vs 卡片网格 */}
      {viewMode === 'grid' ? (
        <div className="space-y-4">
          {paginatedTemplates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs">
              <div className="flex flex-col items-center justify-center gap-2">
                <FolderKanban className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <span className="text-xs">暂无匹配的业务流程模板</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTemplates.map((tpl, index) => {
                const isPublic = tpl.scope === 'public';
                const sys = BUSINESS_SYSTEMS.find(s => s.id === tpl.systemId) || BUSINESS_SYSTEMS[0];

                return (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-blue-400"
                  >
                {/* 卡片头部 */}
                <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 tracking-wider">
                          ID: {tpl.id}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mt-1">
                        {tpl.templateName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {tpl.templateType === 'normal' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>普通</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <GitMerge className="w-3 h-3 text-blue-600" />
                          <span>流程</span>
                        </span>
                      )}
                      {isPublic ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPanoramaTemplate(tpl)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="点击查看全系统 108 家机构覆盖全景"
                        >
                          <Globe2 className="w-3 h-3" />
                          <span>公共</span>
                        </button>
                      ) : (
                        <div className="inline-block">
                          {(() => {
                            const orgList = tpl.orgNames && tpl.orgNames.length > 0 
                              ? tpl.orgNames 
                              : [tpl.orgName || '机构专属'];
                            const isMultiple = orgList.length > 1;

                            if (tpl.scopeMode === 'org_group' && tpl.orgGroupName) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPanoramaTemplate(tpl)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 hover:bg-amber-100 transition-all cursor-pointer"
                                  title="业务分组授权，点击穿透查看"
                                >
                                  <Layers className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="truncate max-w-[80px]">{tpl.orgGroupName}</span>
                                </button>
                              );
                            }

                            if (tpl.scopeMode === 'org_tree' && tpl.orgRootName) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPanoramaTemplate(tpl)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1 hover:bg-indigo-100 transition-all cursor-pointer"
                                  title="层级树级联继承，点击穿透查看"
                                >
                                  <FolderTree className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span className="truncate max-w-[80px]">{tpl.orgName || '分局全域'}</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedPanoramaTemplate(tpl)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer`}
                                title="点击打开 100+ 机构全景穿透视图"
                              >
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[70px]">{orgList[0]}</span>
                                {isMultiple && (
                                  <span className="bg-purple-200/90 text-purple-800 text-[9px] font-bold px-1 rounded-xs">
                                    +{orgList.length - 1}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed">
                    {tpl.description || '暂无业务描述说明'}
                  </p>
                </div>

                {/* 卡片系统、分类与版本信息 */}
                <div className="px-4 py-3 bg-slate-50/50 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 所属业务系统与业务分类放在一起 */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sys.id === 'SYS_ZLL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        sys.id === 'SYS_DDSB' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {sys.shortName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px] border border-slate-200">
                        {tpl.category}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                      {tpl.version || 'V1.0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">
                      {tpl.creator || '张建国'}
                    </span>

                    {/* 状态开关 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tpl.status === 'active'}
                        onClick={() => handleToggleStatus(tpl)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                          tpl.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={tpl.status === 'active' ? '点击停用' : '点击启用'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            tpl.status === 'active' ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-bold ${
                        tpl.status === 'active' 
                          ? 'text-emerald-700' 
                          : tpl.status === 'draft' 
                          ? 'text-amber-600' 
                          : 'text-slate-400'
                      }`}>
                        {tpl.status === 'active' ? '启用' : tpl.status === 'draft' ? '设计中' : '停用'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 卡片底部操作栏 */}
                <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatTimeToMinute(tpl.updatedAt)}
                  </span>

                  <div className="flex items-center gap-1.5 font-medium text-xs whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleAttemptDesign(tpl)}
                      className="px-2 py-0.5 font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded transition-colors cursor-pointer"
                      title="编辑模板与流程设计"
                    >
                      编辑
                    </button>
                    <span className="text-slate-200 select-none font-light">|</span>
                    <button
                      type="button"
                      onClick={() => setCloningTemplate(tpl)}
                      className="px-1.5 py-0.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 rounded transition-colors cursor-pointer"
                      title="复制模板副本"
                    >
                      复制
                    </button>
                    <span className="text-slate-200 select-none font-light">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="px-1.5 py-0.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="删除模板"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
        {/* 网格视图底部分页栏 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          {renderPaginationBar()}
        </div>
      </div>
      ) : (
        /* 高密表格列表模式（默认） */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-36">ID</th>
                  <th className="py-3.5 px-4 w-48 max-w-[200px]">模板名称</th>
                  <th className="py-3.5 px-4 w-28 text-center">模板类型</th>
                  <th className="py-3.5 px-4 w-44">归属范围</th>
                  <th className="py-3.5 px-4 w-40">所属业务系统</th>
                  <th className="py-3.5 px-4 w-36">业务分类</th>
                  <th className="py-3.5 px-4 w-40">创建人</th>
                  <th className="py-3.5 px-4 w-28 text-center">状态</th>
                  <th className="py-3.5 px-4 w-48">更新时间</th>
                  <th className="py-3.5 px-4 w-52 min-w-[200px] text-center whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderKanban className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="text-xs">暂无匹配的业务模板</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTemplates.map((tpl) => {
                  const isPublic = tpl.scope === 'public';
                  const sys = BUSINESS_SYSTEMS.find(s => s.id === tpl.systemId) || BUSINESS_SYSTEMS[0];

                  return (
                    <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. ID (10位真实ID，无背景) */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-700 text-xs tracking-wider inline-block">
                          {tpl.id}
                        </span>
                      </td>

                      {/* 2. 模板名称 */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <button
                          type="button"
                          onClick={() => handleAttemptDesign(tpl)}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-left truncate max-w-full block"
                          title={tpl.templateName}
                        >
                          {tpl.templateName}
                        </button>
                      </td>

                      {/* 2.5 模板类型 */}
                      <td className="py-3.5 px-4 text-center">
                        {tpl.templateType === 'normal' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>普通模板</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <GitMerge className="w-3 h-3 text-blue-600" />
                            <span>流程模板</span>
                          </span>
                        )}
                      </td>

                      {/* 3. 归属范围 (统一UI，固定长度，点击展示全景授权列表弹窗) */}
                      <td className="py-3.5 px-4 w-44">
                        {isPublic ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPanoramaTemplate(tpl)}
                            className="w-40 h-7.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center justify-between hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs group"
                            title="公共模板（全机构通用），点击查看全景授权机构列表"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">公共</span>
                            </div>
                            <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              全机构通用
                            </span>
                          </button>
                        ) : (
                          (() => {
                            const orgList = tpl.orgNames && tpl.orgNames.length > 0 
                              ? tpl.orgNames 
                              : [tpl.orgName || '指定机构'];
                            const isMultiple = orgList.length > 1;

                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedPanoramaTemplate(tpl)}
                                className="w-40 h-7.5 px-2.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center justify-between hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer shadow-2xs group"
                                title={`点击查看已授权机构列表与开通详情 (${orgList.length}家)`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span className="truncate max-w-[95px]">{orgList[0]}</span>
                                </div>
                                {isMultiple ? (
                                  <span className="bg-purple-200/90 text-purple-900 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0">
                                    +{orgList.length - 1}家
                                  </span>
                                ) : (
                                  <span className="bg-purple-100 text-purple-700 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded shrink-0">
                                    1家
                                  </span>
                                )}
                              </button>
                            );
                          })()
                        )}
                      </td>

                      {/* 4. 所属业务系统 (与业务分类放在一起) */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sys.id === 'SYS_ZLL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          sys.id === 'SYS_DDSB' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {sys.shortName}
                        </span>
                      </td>

                      {/* 5. 业务分类 (无图标) */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium px-2 py-0.5 rounded bg-slate-100 text-[11px] border border-slate-200/60">
                          {tpl.category}
                        </span>
                      </td>

                      {/* 7. 创建人 (增宽，真实姓名，无图标) */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium text-xs">
                          {tpl.creator || '张建国'}
                        </span>
                      </td>

                      {/* 8. 状态 (状态开关) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={tpl.status === 'active'}
                            onClick={() => handleToggleStatus(tpl)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              tpl.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={tpl.status === 'active' ? '点击停用' : '点击启用'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                tpl.status === 'active' ? 'translate-x-4.5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <span className={`text-[11px] font-bold ${
                            tpl.status === 'active' 
                              ? 'text-emerald-700' 
                              : tpl.status === 'draft' 
                              ? 'text-amber-600' 
                              : 'text-slate-400'
                          }`}>
                            {tpl.status === 'active' ? '启用' : tpl.status === 'draft' ? '设计中' : '停用'}
                          </span>
                        </div>
                      </td>

                      {/* 9. 更新时间 (增宽，精确到分) */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                        {formatTimeToMinute(tpl.updatedAt)}
                      </td>

                      {/* 10. 操作 (表头居中，操作项居中，带优雅竖线分隔符及悬停视觉反馈) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleAttemptDesign(tpl)}
                            className="px-2 py-0.5 font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded transition-colors cursor-pointer"
                            title="编辑模板与流程设计"
                          >
                            编辑
                          </button>
                          <span className="text-slate-200 select-none font-light">|</span>
                          <button
                            type="button"
                            onClick={() => setCloningTemplate(tpl)}
                            className="px-1.5 py-0.5 font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 rounded transition-colors cursor-pointer"
                            title="复制并以此为副本新建"
                          >
                            复制
                          </button>
                          <span className="text-slate-200 select-none font-light">|</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="px-1.5 py-0.5 font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="删除该业务模板"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
          {/* 表格底部分页控制栏 */}
          {renderPaginationBar()}
        </div>
      )}

      {/* 弹窗 1：表单仿真预览弹窗 */}
      {previewTemplate && (
        <TemplateFormPreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* 弹窗 2：基础信息编辑弹窗 */}
      {basicInfoEditingTemplate && (
        <TemplateBasicInfoEditModal
          template={basicInfoEditingTemplate}
          onSave={handleSaveBasicInfo}
          onClose={() => setBasicInfoEditingTemplate(null)}
        />
      )}

      {/* 弹窗 3：新建流程模板对话框 */}
      {isNewWizardOpen && (
        <NewTemplateWizardModal
          initialSystemId={selectedSystemId !== 'ALL' ? selectedSystemId : 'SYS_ZLL'}
          initialScope={scopeFilter !== 'all' ? scopeFilter : 'public'}
          initialOrgId={selectedOrgId !== 'ALL' ? selectedOrgId : undefined}
          onConfirmAndDesign={(initialTpl) => {
            setIsNewWizardOpen(false);
            setLowCodeDesignerTemplate(initialTpl as ProcessTemplateItem);
          }}
          onClose={() => setIsNewWizardOpen(false)}
        />
      )}

      {/* 弹窗 4：低代码 24 栅格表单与流程设计器 (4 步向导) */}
      {lowCodeDesignerTemplate && (
        <LowCodeTemplateDesigner
          template={lowCodeDesignerTemplate}
          onSave={handleSaveLowCodeTemplate}
          onClose={() => setLowCodeDesignerTemplate(null)}
        />
      )}

      {/* 弹窗 5：停用流程模板二次确认弹窗 */}
      {deactivatingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-[460px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* 顶栏 */}
            <div className="px-6 py-4.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">停用流程模板确认</h3>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium">请核实停用后对流转任务的影响</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeactivatingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">模板名称:</span>
                  <span className="font-bold text-slate-800">{deactivatingTemplate.templateName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">模板 ID:</span>
                  <span className="font-mono font-bold text-slate-700">{deactivatingTemplate.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">所属系统:</span>
                  <span className="font-medium text-slate-700">{deactivatingTemplate.systemName}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>停用影响提示：</strong>
                  模板停用后，各业务系统将无法继续发起该模板的新增流转任务。已在流转中的在途历史任务不受影响，可继续办理至归档。
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeactivatingTemplate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 6：复制流程模板向导弹窗 (选择所属系统、所属机构、输入流程名称) */}
      {cloningTemplate && (
        <TemplateCloneModal
          sourceTemplate={cloningTemplate}
          onConfirmClone={handleConfirmClone}
          onClose={() => setCloningTemplate(null)}
        />
      )}

      {/* 弹窗 7：流程开启状态拦截校验弹窗 (只有关闭状态才能设计或编辑) */}
      {statusWarningModal && (
        <TemplateStatusWarningModal
          actionType={statusWarningModal.actionType}
          template={statusWarningModal.template}
          onClose={() => setStatusWarningModal(null)}
          onDeactivateAndProceed={handleDeactivateAndProceed}
        />
      )}

      {/* 弹窗 8：100+ 机构归属全景穿透查看抽屉/弹窗 */}
      {selectedPanoramaTemplate && (
        <OrgScopePanoramaModal
          template={selectedPanoramaTemplate}
          onClose={() => setSelectedPanoramaTemplate(null)}
        />
      )}

      {/* 保存成功的 Toast 通知提示 (展示：已保存，版本从 V几 更新至 V几) */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col pr-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>流程模板保存成功</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-400 font-mono font-bold">已生效</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-slate-100 max-w-[200px] truncate">【{saveToast.templateName}】</span>
              <span>已保存，版本从</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700 text-[10px]">
                {saveToast.oldVersion}
              </span>
              <span>更新至</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-800 text-[10px]">
                {saveToast.newVersion}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
