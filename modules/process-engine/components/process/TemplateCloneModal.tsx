/**
 * 复制流程模板弹窗 (TemplateCloneModal)
 * 允许用户在复制流程时自定义：
 * 1. 流程名称（默认带上被复制模板名称 + " 副本"）
 * 2. 所属业务系统（SYS_ZLL / SYS_DDSB / SYS_ZGY）
 * 3. 所属机构与归属范围（公共 vs 指定专属机构）
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ProcessTemplateItem, 
  BUSINESS_SYSTEMS 
} from '../../types/processEngine';
import { MOCK_ORGS } from '../../data/mockProcessEngine';
import { OrgSearchSelect } from './OrgSearchSelect';
import { 
  X, 
  Copy, 
  Building2, 
  Globe2, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Tag,
  AlignLeft
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  '舆情处置类',
  '日常督办类',
  '执法监督类',
  '涉稳处置类',
  '重大保障类',
  '综合治理类',
  '预警研判类',
  '网评引导类',
  '考核考评类',
  '应急处突类',
  '任务流转类'
];

interface TemplateCloneModalProps {
  sourceTemplate: ProcessTemplateItem;
  onConfirmClone: (newTemplate: ProcessTemplateItem) => void;
  onClose: () => void;
}

export const TemplateCloneModal: React.FC<TemplateCloneModalProps> = ({
  sourceTemplate,
  onConfirmClone,
  onClose
}) => {
  // 默认填充原流程名加上“副本”两字
  const [templateName, setTemplateName] = useState<string>(() => {
    return `${sourceTemplate.templateName} 副本`;
  });

  // 业务分类：默认继承源模板业务分类
  const [category, setCategory] = useState<string>(() => {
    return sourceTemplate.category || '舆情处置类';
  });

  // 模板说明：默认继承源模板说明
  const [description, setDescription] = useState<string>(() => {
    return sourceTemplate.description || '';
  });

  // 所属系统：默认选中使用源模板所属系统
  const [systemId, setSystemId] = useState<string>(() => {
    return sourceTemplate.systemId || 'SYS_ZGY';
  });

  // 归属范围：公共 vs 机构专属
  const [scope, setScope] = useState<'public' | 'custom'>(() => {
    return sourceTemplate.scope || 'public';
  });

  // 分类选项列表（确保源模板分类在列表中）
  const categoryOptions = useMemo(() => {
    const list = [...STANDARD_CATEGORIES];
    if (sourceTemplate.category && !list.includes(sourceTemplate.category)) {
      list.unshift(sourceTemplate.category);
    }
    return list;
  }, [sourceTemplate.category]);

  // 所属机构初始化
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(() => {
    if (sourceTemplate.orgIds && sourceTemplate.orgIds.length > 0) {
      return [...sourceTemplate.orgIds];
    }
    // 尝试根据 orgName 或 orgNames 反查
    const matched = MOCK_ORGS.filter(o => 
      sourceTemplate.orgNames?.includes(o.name) || 
      sourceTemplate.orgName === o.name
    );
    if (matched.length > 0) {
      return matched.map(m => m.id);
    }
    return [MOCK_ORGS[0].id];
  });

  // 校验错误信息
  const [errors, setErrors] = useState<{
    templateName?: string;
    orgIds?: string;
  }>({});

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, []);

  const handleScopeChange = (newScope: 'public' | 'custom') => {
    setScope(newScope);
    if (newScope === 'custom' && selectedOrgIds.length === 0) {
      setSelectedOrgIds([MOCK_ORGS[0].id]);
    }
    if (errors.orgIds) {
      setErrors(prev => ({ ...prev, orgIds: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = templateName.trim();
    const newErrors: { templateName?: string; orgIds?: string } = {};

    if (!trimmedName) {
      newErrors.templateName = '流程名称不能为空，请输入流程名称';
    }

    if (scope === 'custom' && selectedOrgIds.length === 0) {
      newErrors.orgIds = '请选择至少一个所属机构';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.templateName && nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return;
    }

    const currentSys = BUSINESS_SYSTEMS.find(s => s.id === systemId) || BUSINESS_SYSTEMS[0];
    const chosenOrgs = MOCK_ORGS.filter(o => selectedOrgIds.includes(o.id));
    const generated10DigitId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const cloned: ProcessTemplateItem = {
      ...sourceTemplate,
      id: generated10DigitId,
      templateName: trimmedName,
      category: category.trim() || sourceTemplate.category || '舆情处置类',
      description: description.trim(),
      systemId,
      systemName: currentSys.name,
      scope,
      orgIds: scope === 'custom' ? selectedOrgIds : [],
      orgNames: scope === 'custom' ? chosenOrgs.map(o => o.name) : [],
      orgName: scope === 'custom' ? (chosenOrgs[0]?.name || '指定机构') : undefined,
      // 复制后的新模板初始为停用/关闭状态，以便立即进行设计或编辑
      status: 'inactive',
      version: 'V1.0',
      appliedTenantCount: scope === 'custom' ? chosenOrgs.length : 1,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onConfirmClone(cloned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[580px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* 顶部标题栏 */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">复制流程模板</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  源ID: {sourceTemplate.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                复制源模板【{sourceTemplate.templateName}】的表单字段与配置
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模态框主体表单 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5">
          
          {/* 1. 流程名称与业务分类组合 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="text-red-500 mr-1">*</span>流程名称
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    if (errors.templateName) {
                      setErrors(prev => ({ ...prev, templateName: undefined }));
                    }
                  }}
                  placeholder="请输入新流程名称"
                  className={`w-full h-10 px-3.5 rounded-xl border bg-slate-50/50 text-xs font-medium text-slate-800 outline-none transition-all ${
                    errors.templateName
                      ? 'border-red-500 bg-red-50/30 ring-2 ring-red-200'
                      : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.templateName && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.templateName}</span>
                </p>
              )}
            </div>

            {/* 业务分类 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>业务分类</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. 所属业务系统 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="text-red-500 mr-1">*</span>所属业务系统
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {BUSINESS_SYSTEMS.map((sys) => {
                const isSelected = systemId === sys.id;
                return (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => setSystemId(sys.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sys.id === 'SYS_ZLL' ? 'bg-blue-100 text-blue-700' :
                        sys.id === 'SYS_DDSB' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sys.shortName}
                      </span>
                      <div className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">
                        {sys.name}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="absolute top-2 right-2 text-blue-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 归属范围与所属机构 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="text-red-500 mr-1">*</span>归属范围与所属机构
            </label>
            
            {/* 范围单选 */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => handleScopeChange('public')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  scope === 'public'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  scope === 'public' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Globe2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">公共通用模板</div>
                  <div className="text-[11px] text-slate-400">所有机构均可共享此流程</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange('custom')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  scope === 'custom'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  scope === 'custom' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">机构专属模板</div>
                  <div className="text-[11px] text-slate-400">仅限指定所属机构使用</div>
                </div>
              </button>
            </div>

            {/* 机构专属时，弹出机构选择器 */}
            {scope === 'custom' && (
              <div className="p-3.5 rounded-xl bg-purple-50/30 border border-purple-100 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>选择所属机构（支持多选）</span>
                  </span>
                  <span className="text-[11px] text-purple-600 font-medium">
                    已选 {selectedOrgIds.length} 个机构
                  </span>
                </div>

                <OrgSearchSelect
                  selectedOrgIds={selectedOrgIds}
                  onChange={(newIds) => {
                    setSelectedOrgIds(newIds);
                    if (newIds.length > 0 && errors.orgIds) {
                      setErrors(prev => ({ ...prev, orgIds: undefined }));
                    }
                  }}
                  required
                />

                {errors.orgIds && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.orgIds}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 4. 模板说明 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <AlignLeft className="w-3 h-3 text-slate-400" />
              <span>模板说明</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入该模板的使用场景、填报规范与业务背景说明（选填）..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed transition-all"
            />
          </div>

          {/* 复制说明提示卡片 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>复制说明：</strong>
              系统将完整克隆源流程的表单 24 栅格控件布局、流转步骤与权限配置。复制生成的新流程状态默认为
              <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mx-1">
                停用（关闭）
              </span>
              ，方便您直接进入设计器或编辑信息，调整完毕后随时开启。
            </div>
          </div>

          {/* 底部按钮栏 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>确认复制</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
