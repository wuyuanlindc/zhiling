/**
 * 业务数据模板 - 基础信息编辑弹窗 (TemplateBasicInfoEditModal)
 * 用于修改模板的基本元数据：模板名称、模板类型、所属业务系统、归属范围（公共/机构专属）、业务分类、描述与启用状态
 */

import React, { useState } from 'react';
import { 
  X, 
  Save, 
  FileSpreadsheet, 
  ShieldCheck, 
  Siren, 
  Target,
  AlertCircle,
  FileText,
  GitMerge
} from 'lucide-react';
import { ProcessTemplateItem, TemplateType, BUSINESS_SYSTEMS } from '../../types/processEngine';

interface TemplateBasicInfoEditModalProps {
  template: ProcessTemplateItem;
  onSave: (updatedTemplate: ProcessTemplateItem) => void;
  onClose: () => void;
}

export const TemplateBasicInfoEditModal: React.FC<TemplateBasicInfoEditModalProps> = ({
  template,
  onSave,
  onClose
}) => {
  const [templateName, setTemplateName] = useState(template.templateName);
  const [templateType, setTemplateType] = useState<TemplateType>(template.templateType || 'process');
  const [systemId, setSystemId] = useState(template.systemId);
  const [category, setCategory] = useState(template.category || '任务流转类');
  const [description, setDescription] = useState(template.description || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(template.status || 'active');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('请输入模板名称');
      return;
    }

    const selectedSys = BUSINESS_SYSTEMS.find(s => s.id === systemId);

    const updated: ProcessTemplateItem = {
      ...template,
      templateType,
      templateName: templateName.trim(),
      systemId,
      systemName: selectedSys?.name || template.systemName,
      category,
      description: description.trim(),
      status,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[640px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 标题栏 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-800">编辑模板基础信息</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  templateType === 'normal' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {templateType === 'normal' ? '普通模板' : '流程模板'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                修改模板名称、所属业务系统、适用范围、业务分类及说明
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 0. 模板类型切换 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              模板类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setTemplateType('normal')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${
                  templateType === 'normal'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">普通模板</h4>
                  <p className="text-[10px] text-slate-400">纯表单模式，无审批流转</p>
                </div>
              </div>

              <div
                onClick={() => setTemplateType('process')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${
                  templateType === 'process'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">流程模板</h4>
                  <p className="text-[10px] text-slate-400">包含多节点流转与审批</p>
                </div>
              </div>
            </div>
          </div>

          {/* 1. 所属业务系统 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              所属业务系统 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUSINESS_SYSTEMS.map(sys => {
                const isSelected = systemId === sys.id;
                const IconComp = 
                  sys.id === 'SYS_ZLL' ? ShieldCheck :
                  sys.id === 'SYS_DDSB' ? Target : Siren;

                return (
                  <div
                    key={sys.id}
                    onClick={() => setSystemId(sys.id)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-600/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      sys.id === 'SYS_ZLL' ? 'bg-blue-100 text-blue-700' :
                      sys.id === 'SYS_DDSB' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{sys.shortName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{sys.appCode}</p>
                    </div>
                  </div>
                  );
              })}
            </div>
          </div>

          {/* 2. 模板ID与模板名称 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                模板 ID (10位唯一标识)
              </label>
              <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600 flex items-center">
                {template.id}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                模板名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={e => {
                  setTemplateName(e.target.value);
                  setError('');
                }}
                placeholder="例如：网络涉政舆情处置模板"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          {/* 4. 业务分类与状态 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                业务分类
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 cursor-pointer font-medium"
              >
                {[
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
                ].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                模板启用状态
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-bold outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="active">启用中 (正常生效)</option>
                <option value="inactive">已停用 (暂停使用)</option>
              </select>
            </div>
          </div>

          {/* 5. 业务描述 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              业务描述说明
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请简要阐述该业务模板的应用场景、填报规范及业务要求..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* 底部按钮 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
