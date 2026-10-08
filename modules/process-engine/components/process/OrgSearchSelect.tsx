import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  Check, 
  ChevronDown, 
  ChevronRight,
  FolderTree, 
  Layers, 
  Sparkles, 
  FileSpreadsheet, 
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { MOCK_ORGS, MOCK_ORG_GROUPS, OrgItem, OrgGroupItem } from '../../data/mockProcessEngine';

interface OrgSearchSelectProps {
  selectedOrgIds: string[];
  onChange: (newOrgIds: string[]) => void;
  required?: boolean;
}

export const OrgSearchSelect: React.FC<OrgSearchSelectProps> = ({
  selectedOrgIds,
  onChange,
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [isBatchPasteOpen, setIsBatchPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  
  // 树状弹窗内部的展开折叠状态
  const [treeExpandedNodes, setTreeExpandedNodes] = useState<Record<string, boolean>>({
    'org_root': true,
    'org_lx': true,
    'org_sz': true,
    'org_tq': true
  });
  const [treeSearchTerm, setTreeSearchTerm] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部自动关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 过滤候选机构（根据输入的名称或编码查找）
  const filteredCandidates = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return MOCK_ORGS.slice(0, 50); // 默认优先展示前50项
    return MOCK_ORGS.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.code.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  // 已选机构对象列表
  const selectedOrgs = useMemo(() => {
    const set = new Set(selectedOrgIds);
    return MOCK_ORGS.filter(o => set.has(o.id));
  }, [selectedOrgIds]);

  // 选中或取消选中机构
  const handleToggleOrg = (orgId: string) => {
    if (selectedOrgIds.includes(orgId)) {
      onChange(selectedOrgIds.filter(id => id !== orgId));
    } else {
      onChange([...selectedOrgIds, orgId]);
      setSearchTerm('');
    }
    inputRef.current?.focus();
  };

  const handleRemoveOrg = (orgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(selectedOrgIds.filter(id => id !== orgId));
    inputRef.current?.focus();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  // 一键选择预设业务分组
  const handleSelectGroup = (group: OrgGroupItem) => {
    const currentSet = new Set(selectedOrgIds);
    const allInGroup = group.orgIds.every(id => currentSet.has(id));

    if (allInGroup) {
      // 若全部已选，则从已选中移除该分组
      const groupSet = new Set(group.orgIds);
      onChange(selectedOrgIds.filter(id => !groupSet.has(id)));
    } else {
      // 否则将该分组全部补齐加入
      const merged = Array.from(new Set([...selectedOrgIds, ...group.orgIds]));
      onChange(merged);
    }
  };

  // 键盘退格键在输入为空时删除最后一个标签
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !searchTerm && selectedOrgIds.length > 0) {
      onChange(selectedOrgIds.slice(0, -1));
    }
  };

  // 组织树节点勾选（包含下级级联逻辑）
  const handleToggleTreeNodeCascade = (nodeId: string, includeChildren: boolean = true) => {
    const currentSet = new Set(selectedOrgIds);
    
    // 找出该节点及其所有下级子节点
    const findSubOrgIds = (pId: string): string[] => {
      const directChildren = MOCK_ORGS.filter(o => o.parentId === pId);
      let res: string[] = directChildren.map(c => c.id);
      directChildren.forEach(c => {
        res = [...res, ...findSubOrgIds(c.id)];
      });
      return res;
    };

    const targetIds = includeChildren ? [nodeId, ...findSubOrgIds(nodeId)] : [nodeId];
    const isAllChecked = targetIds.every(id => currentSet.has(id));

    if (isAllChecked) {
      const removeSet = new Set(targetIds);
      onChange(selectedOrgIds.filter(id => !removeSet.has(id)));
    } else {
      const merged = Array.from(new Set([...selectedOrgIds, ...targetIds]));
      onChange(merged);
    }
  };

  // 批量粘贴解析处理
  const handleExecuteBatchPaste = () => {
    if (!pasteContent.trim()) return;
    
    // 按换行、逗号、分号或空格切分
    const tokens = pasteContent
      .split(/[\n,;，；\s]+/)
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    let matchedIds: string[] = [];
    let unmatchedCount = 0;

    tokens.forEach(tok => {
      const found = MOCK_ORGS.find(o => 
        o.name.toLowerCase() === tok || 
        o.code.toLowerCase() === tok ||
        o.name.toLowerCase().includes(tok)
      );
      if (found) {
        matchedIds.push(found.id);
      } else {
        unmatchedCount++;
      }
    });

    const newMerged = Array.from(new Set([...selectedOrgIds, ...matchedIds]));
    onChange(newMerged);
    setPasteFeedback(`已成功匹配并导入 ${matchedIds.length} 个机构${unmatchedCount > 0 ? `（${unmatchedCount} 项未匹配）` : ''}`);
    setTimeout(() => {
      setIsBatchPasteOpen(false);
      setPasteContent('');
      setPasteFeedback(null);
    }, 1200);
  };

  // 展示标签：当选择机构数量较多时，默认收折，避免挤压页面
  const displayLimit = isTagsExpanded ? selectedOrgs.length : 10;
  const visibleOrgs = selectedOrgs.slice(0, displayLimit);
  const hiddenCount = selectedOrgs.length - displayLimit;

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* 头部控制栏：标题、已选数量统计与三大高效操作入口 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-slate-800">
            选择专属机构 {required && <span className="text-red-500">*</span>}
          </label>
          {selectedOrgs.length > 0 && (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              已选 {selectedOrgs.length} / {MOCK_ORGS.length} 家机构 ({Math.round((selectedOrgs.length / MOCK_ORGS.length) * 100)}%)
            </span>
          )}
        </div>

        {/* 100+ 机构高效管理快捷动作入口 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTreeModalOpen(true)}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="通过层级组织树批量勾选，支持级联包含下级所有机构"
          >
            <FolderTree className="w-3 h-3 text-indigo-600" />
            <span>架构树级联选择</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBatchPasteOpen(true)}
            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="从 Excel 或 OA 粘贴多行机构名单直接批量导入"
          >
            <FileSpreadsheet className="w-3 h-3 text-slate-500" />
            <span>批量粘贴匹配</span>
          </button>
        </div>
      </div>

      {/* 快捷机构预设分组一键勾选栏 (专门解决 100+ 机构时单选痛点) */}
      <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-0.5">
          <span className="font-bold flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>快捷预设分组一键勾选（解决100+机构批量授权）：</span>
          </span>
          <span className="text-[10px] text-slate-400">点击分组一键全选或移除</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {MOCK_ORG_GROUPS.map(grp => {
            const grpSet = new Set(grp.orgIds);
            const matchedCount = selectedOrgIds.filter(id => grpSet.has(id)).length;
            const isAll = matchedCount === grp.orgIds.length;
            const isPartial = matchedCount > 0 && !isAll;

            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => handleSelectGroup(grp)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                  isAll 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                    : isPartial
                      ? 'bg-purple-50 text-purple-800 border-purple-300 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title={`${grp.desc}（点击一键加入或移除全部 ${grp.orgIds.length} 个机构）`}
              >
                <Layers className={`w-3 h-3 ${isAll ? 'text-white' : 'text-purple-600'}`} />
                <span>{grp.name}</span>
                {isAll ? (
                  <Check className="w-3 h-3 text-white" />
                ) : isPartial ? (
                  <span className="text-[10px] font-mono text-purple-700">({matchedCount}/{grp.orgIds.length})</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">+{grp.orgIds.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 统一输入框与标签容器：直接在此框中输入名称或编码查找，选中后以标签形式加入 */}
      <div className="relative">
        <div
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          className={`min-h-[46px] max-h-40 overflow-y-auto w-full px-2.5 py-1.5 bg-white border rounded-xl flex flex-wrap items-center gap-1.5 transition-all cursor-text ${
            isOpen
              ? 'border-purple-500 ring-2 ring-purple-500/10 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* 已选中的机构标签（支持超限折叠展开） */}
          {visibleOrgs.map(org => (
            <span
              key={org.id}
              className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs group select-none animate-in fade-in zoom-in-95 duration-100"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="max-w-[120px] truncate">{org.name}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveOrg(org.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-purple-400 hover:text-white hover:bg-purple-600 transition-colors cursor-pointer"
                title={`移除 ${org.name}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {/* 隐藏折叠提示 */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTagsExpanded(true);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              +{hiddenCount} 更多...
            </button>
          )}

          {isTagsExpanded && selectedOrgs.length > 10 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTagsExpanded(false);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              收起展示
            </button>
          )}

          {/* 实时搜索输入框：可直接输入名称或编码查找 */}
          <div className="flex-1 min-w-[140px] flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedOrgs.length === 0
                  ? "在 100+ 机构中输入名称或编码搜索..."
                  : "继续输入名称或编码检索..."
              }
              className="w-full h-7 px-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none border-none"
            />
          </div>

          {/* 右侧清空与下拉指示器 */}
          <div className="flex items-center gap-1 ml-auto shrink-0 pr-0.5">
            {selectedOrgs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1 text-slate-300 hover:text-slate-500 rounded cursor-pointer transition-colors"
                title="清空已选机构"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 候选机构下拉弹层 */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-slate-600">
                <Search className="w-3 h-3 text-purple-600" />
                <span>点击机构加入专属范围（支持拼音、中文与机构代码模糊检索）</span>
              </span>
              <span>检索匹配到 {filteredCandidates.length} 个机构</span>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                未检索到「{searchTerm}」，支持使用名称或机构编码
              </div>
            ) : (
              filteredCandidates.map(org => {
                const isSelected = selectedOrgIds.includes(org.id);
                return (
                  <div
                    key={org.id}
                    onClick={() => handleToggleOrg(org.id)}
                    className={`px-3 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                      <span className="truncate">{org.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {org.code}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {org.type === 'station' ? '基层所队' : org.type === 'district' ? '区分局' : '直属支队'}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                        <Check className="w-3 h-3" />
                        <span>已加入</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 hover:text-purple-600 font-medium shrink-0">
                        + 加入
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 弹窗 1：组织架构树级联选择弹窗 (针对 100+ 机构最核心的树形级联工具) */}
      {isTreeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 树弹窗头部 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    组织架构树级联批量选择 (覆盖 100+ 机构)
                  </h3>
                  <p className="text-xs text-slate-500">
                    勾选父节点支持一键级联包含所有下级派出所与科室，极大幅度提升上百家机构的授权效率
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTreeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索与快捷工具栏 */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={treeSearchTerm}
                  onChange={e => setTreeSearchTerm(e.target.value)}
                  placeholder="在架构树中过滤机构..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(MOCK_ORGS.map(o => o.id))}
                  className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 cursor-pointer"
                >
                  一键全选全部 {MOCK_ORGS.length} 家
                </button>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer"
                >
                  清空全部
                </button>
              </div>
            </div>

            {/* 树形列表内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {/* 根节点：市局 */}
              {MOCK_ORGS.filter(o => o.level === 1).map(root => {
                const rootChildren = MOCK_ORGS.filter(o => o.parentId === root.id);
                const isRootChecked = selectedOrgIds.includes(root.id);

                return (
                  <div key={root.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTreeExpandedNodes(p => ({ ...p, [root.id]: !p[root.id] }))}
                          className="p-1 text-slate-400"
                        >
                          {treeExpandedNodes[root.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <input
                          type="checkbox"
                          checked={isRootChecked}
                          onChange={() => handleToggleTreeNodeCascade(root.id, true)}
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-black text-slate-800">{root.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">（包含全局 {MOCK_ORGS.length} 家）</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTreeNodeCascade(root.id, true)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        一键级联勾选全部
                      </button>
                    </div>

                    {/* 市局直属处室与支队 (折叠块) */}
                    {treeExpandedNodes[root.id] && (
                      <div className="mt-3 pl-6 border-l-2 border-slate-200 ml-4 space-y-2.5">
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">市局机关处室与直属支队 (16家)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const deptIds = MOCK_ORGS.filter(o => o.parentId === root.id && (o.type === 'dept' || o.type === 'detachment')).map(o => o.id);
                                const allChecked = deptIds.every(id => selectedOrgIds.includes(id));
                                if (allChecked) {
                                  const removeSet = new Set(deptIds);
                                  onChange(selectedOrgIds.filter(id => !removeSet.has(id)));
                                } else {
                                  onChange(Array.from(new Set([...selectedOrgIds, ...deptIds])));
                                }
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:underline"
                            >
                              切换全组
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MOCK_ORGS.filter(o => o.parentId === root.id && (o.type === 'dept' || o.type === 'detachment')).map(d => (
                              <label key={d.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedOrgIds.includes(d.id)}
                                  onChange={() => handleToggleOrg(d.id)}
                                  className="w-3.5 h-3.5 text-purple-600 rounded"
                                />
                                <span className="truncate">{d.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 各区县公安分局及下辖派出所 */}
                        {MOCK_ORGS.filter(o => o.parentId === root.id && o.type === 'district').map(dist => {
                          const stations = MOCK_ORGS.filter(o => o.parentId === dist.id);
                          const isDistChecked = selectedOrgIds.includes(dist.id);
                          const isDistExpanded = !!treeExpandedNodes[dist.id];
                          const checkedStationCount = stations.filter(s => selectedOrgIds.includes(s.id)).length;

                          return (
                            <div key={dist.id} className="p-3 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTreeExpandedNodes(p => ({ ...p, [dist.id]: !p[dist.id] }))}
                                    className="p-0.5 text-slate-400"
                                  >
                                    {isDistExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>
                                  <input
                                    type="checkbox"
                                    checked={isDistChecked}
                                    onChange={() => handleToggleTreeNodeCascade(dist.id, true)}
                                    className="w-3.5 h-3.5 text-purple-600 rounded"
                                  />
                                  <span className="text-xs font-bold text-slate-800">{dist.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    （下辖 {checkedStationCount}/{stations.length} 派出所）
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleTreeNodeCascade(dist.id, true)}
                                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                                >
                                  级联全选该区分局及下辖所队
                                </button>
                              </div>

                              {/* 派出所子节点 */}
                              {isDistExpanded && stations.length > 0 && (
                                <div className="mt-2.5 pl-4 border-l-2 border-indigo-100 ml-2 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {stations.map(st => (
                                    <label key={st.id} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedOrgIds.includes(st.id)}
                                        onChange={() => handleToggleOrg(st.id)}
                                        className="w-3.5 h-3.5 text-purple-600 rounded"
                                      />
                                      <span className="truncate">{st.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 树弹窗底部 */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-bold">
                当前已选择 <strong className="text-purple-700 font-mono text-sm">{selectedOrgIds.length}</strong> / {MOCK_ORGS.length} 个机构
              </span>
              <button
                type="button"
                onClick={() => setIsTreeModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                完成选择并应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 2：批量粘贴导入弹窗 */}
      {isBatchPasteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black text-slate-800">
                  批量粘贴机构名单导入
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPasteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500">
                可直接从 Excel、OA 或文档中复制多行机构名称或机构代码，系统将自动模糊匹配、去重并添加到已选列表：
              </p>
              <textarea
                value={pasteContent}
                onChange={e => setPasteContent(e.target.value)}
                rows={7}
                placeholder="例如：&#10;泉城路派出所&#10;大明湖派出所&#10;DEPT_WAZD&#10;历下分局..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 font-mono"
              />

              {pasteFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{pasteFeedback}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchPasteOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchPaste}
                disabled={!pasteContent.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                解析并批量导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
