/**
 * 新建模板向导模态框 (NewTemplateWizardModal)
 * 融合统一紧凑版：
 * 在单一步骤中直接选择【模板类型】（普通模板 vs 流程模板）与【基本信息配置】（系统归属、名称、分类、说明），
 * 模板归属范围统一收敛至低代码设计器的【全局设置 - 模板归属范围】菜单中维护。
 */

import React, { useState, useRef } from 'react';
import { 
  ProcessTemplateItem, 
  TemplateType,
  BUSINESS_SYSTEMS 
} from '../../types/processEngine';
import { 
  X, 
  Sparkles, 
  FileText, 
  GitMerge,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';

export const PRESET_BUSINESS_CATEGORIES = [
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

interface NewTemplateWizardModalProps {
  initialSystemId?: string;
  initialScope?: 'public' | 'org';
  initialOrgId?: string;
  initialType?: TemplateType;
  onConfirmAndDesign: (initialTemplate: Partial<ProcessTemplateItem>) => void;
  onClose: () => void;
}

export const NewTemplateWizardModal: React.FC<NewTemplateWizardModalProps> = ({
  initialSystemId = 'SYS_ZLL',
  initialScope = 'org',
  initialOrgId = '',
  initialType = 'normal',
  onConfirmAndDesign,
  onClose
}) => {
  // 模板类型：'normal' 普通模板 (纯表单) | 'process' 流程模板 (带流转审批)
  const [templateType, setTemplateType] = useState<TemplateType>(initialType);

  // 基础信息
  const [systemId, setSystemId] = useState<string>(initialSystemId);
  const [templateName, setTemplateName] = useState<string>('');
  const [category, setCategory] = useState<string>('舆情处置类');
  const [description, setDescription] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('张建国');

  // 表单校验错误状态
  const [errors, setErrors] = useState<{
    systemId?: string;
    templateName?: string;
  }>({});
  const templateNameInputRef = useRef<HTMLInputElement>(null);

  const currentSys = BUSINESS_SYSTEMS.find(s => s.id === systemId) || BUSINESS_SYSTEMS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      systemId?: string;
      templateName?: string;
    } = {};

    // 必填项 1：所属系统
    if (!systemId) {
      newErrors.systemId = '请选择所属业务系统';
    }

    // 必填项 2：模板名称
    if (!templateName.trim()) {
      newErrors.templateName = '请输入模板名称';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.templateName) {
        templateNameInputRef.current?.focus();
      }
      return;
    }

    setErrors({});
    const generated10DigitId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    onConfirmAndDesign({
      id: generated10DigitId,
      templateType,
      systemId,
      systemName: currentSys.name,
      scope: initialScope || 'org',
      orgId: initialOrgId || undefined,
      orgIds: initialOrgId ? [initialOrgId] : [],
      orgName: undefined,
      templateName: templateName.trim(),
      category: category.trim() || '舆情处置类',
      description: description.trim() || (templateType === 'normal' ? '普通业务数据填报模板' : '多节点协同流转与闭环处置流程模板'),
      version: 'V1',
      status: 'draft',
      isNewTemplate: true,
      appliedTenantCount: 0,
      creator: creatorName.trim() || '张建国',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      formWidgets: [],
      associatedTemplates: [],
      flowNodes: [
        {
          id: 'fn_start',
          nodeCode: 'node_start',
          name: '开始',
          nodeType: 'draft',
          categoryLabel: '开始节点',
          description: '由创建人登记业务基本信息，并明确处置要求与办理时限',
          receiverLabel: '所有人',
          receiverType: 'initiator',
          actionButtons: [
            { id: 'btn_s_1', label: '下发指令/提交', actionType: 'submit', color: 'blue', enabled: true },
            { id: 'btn_s_2', label: '保存草稿', actionType: 'save_draft', color: 'slate', enabled: true }
          ]
        },
        {
          id: 'fn_end',
          nodeCode: 'node_end',
          name: '结束',
          nodeType: 'end',
          categoryLabel: '流程办结',
          description: '对处置回执验收结案，归档生成台账',
          actionButtons: [
            { id: 'btn_e_1', label: '导出工单台账', actionType: 'save_draft', color: 'blue', enabled: true }
          ]
        }
      ]
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 模态框顶栏 (紧凑适度) */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-xs text-white ${
              templateType === 'normal' ? 'bg-indigo-600' : 'bg-blue-600'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">新建模板</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                  templateType === 'normal'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {templateType === 'normal' ? '普通模板 · 纯表单' : '流程模板 · 带流转审批'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                选择模板类型并完善基础信息，点击确定后立即进入设计器
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单内容区 (紧凑排版，无归属范围) */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* 必填校验错误提示条 */}
          {Object.keys(errors).length > 0 && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-medium text-[11px]">
                请检查并完善必填项：{Object.values(errors).join('；')}
              </span>
            </div>
          )}

          {/* 模块 1：模板类型选择 */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              模板类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* 卡片 A：普通模板 */}
              <div
                onClick={() => setTemplateType('normal')}
                className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 group ${
                  templateType === 'normal'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  templateType === 'normal' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-slate-800">普通模板</strong>
                      <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-800">纯表单</span>
                    </div>
                    {templateType === 'normal' && (
                      <span className="w-4.5 h-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    用于数据填报、台账录入与登记
                  </p>
                </div>
              </div>

              {/* 卡片 B：流程模板 */}
              <div
                onClick={() => setTemplateType('process')}
                className={`relative p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 group ${
                  templateType === 'process'
                    ? 'border-blue-600 bg-blue-50/40 shadow-2xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  templateType === 'process' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-100 text-blue-700'
                }`}>
                  <GitMerge className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-slate-800">流程模板</strong>
                      <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800">带流转审批</span>
                    </div>
                    {templateType === 'process' && (
                      <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    用于多节点审批与闭环下发流转
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 模块 2：所属业务系统 */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              所属业务系统 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BUSINESS_SYSTEMS.map(sys => (
                <div
                  key={sys.id}
                  onClick={() => {
                    setSystemId(sys.id);
                    if (errors.systemId) setErrors(err => ({ ...err, systemId: undefined }));
                  }}
                  className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    systemId === sys.id
                      ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/10 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{sys.shortName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{sys.appCode}</span>
                  </div>
                  {systemId === sys.id && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>已选中</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.systemId && (
              <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.systemId}
              </p>
            )}
          </div>

          {/* 模块 3：模板名称 */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {templateType === 'normal' ? '普通模板名称' : '流程模板名称'} <span className="text-red-500">*</span>
            </label>
            <input
              ref={templateNameInputRef}
              type="text"
              placeholder={templateType === 'normal' ? '例：网络生态日常巡查登记表' : '例：网络舆情处置下发指令流程'}
              value={templateName}
              onChange={e => {
                setTemplateName(e.target.value);
                if (errors.templateName) {
                  setErrors(err => ({ ...err, templateName: undefined }));
                }
              }}
              className={`w-full h-8.5 px-3 rounded-lg text-xs outline-none transition-all font-bold ${
                errors.templateName
                  ? 'border-2 border-red-500 bg-red-50/20 text-slate-800 ring-2 ring-red-500/10'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
              }`}
            />
            {errors.templateName && (
              <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.templateName}
              </p>
            )}
          </div>

          {/* 模块 4：业务分类与说明 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">业务分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-8.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
              >
                {PRESET_BUSINESS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">模板说明 (可选)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={templateType === 'normal' ? '简要阐述表单填报场景' : '简要阐述流转业务场景'}
                className="w-full h-8.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-4.5 py-1.5 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                templateType === 'normal' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span>确定并进入设计器</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
