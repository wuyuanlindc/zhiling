/**
 * 业务数据模板 - 新建/编辑/克隆模态框 (TemplateEditModal)
 * 核心特性：
 * 1. 业务系统归属选择 (必须属于 3 大系统之一: 正管用 / 谛听预警 / 点点速报)
 * 2. 租户归属属性 (全平台公用模板 vs 机构专属定制模板)
 * 3. 动态表单字段构建器 (增删字段、类型选择、选项字典、必填约束)
 * 4. 流程引擎解耦绑定 (默认流转流程与备选流程)
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  Building2, 
  Globe2, 
  ShieldCheck, 
  Siren, 
  Target, 
  Sliders, 
  Check, 
  Info,
  GitFork,
  HelpCircle
} from 'lucide-react';
import { 
  ProcessTemplateItem, 
  TemplateFieldItem, 
  BUSINESS_SYSTEMS, 
  ProcessDefinition 
} from '../../types/processEngine';
import { MOCK_ORGS } from '../../data/mockProcessEngine';

interface TemplateEditModalProps {
  initialData?: ProcessTemplateItem | null;
  processes: ProcessDefinition[];
  defaultSystemId?: string;
  defaultScope?: 'public' | 'org';
  defaultOrgId?: string;
  onSave: (template: ProcessTemplateItem) => void;
  onClose: () => void;
}

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  initialData,
  processes,
  defaultSystemId = 'SYS_ZGY',
  defaultScope = 'public',
  defaultOrgId = '',
  onSave,
  onClose
}) => {
  const isEditing = !!initialData?.id;

  const [systemId, setSystemId] = useState<string>(
    initialData?.systemId || defaultSystemId
  );
  const [scope, setScope] = useState<'public' | 'org'>(
    initialData?.scope || defaultScope
  );
  const [orgId, setOrgId] = useState<string>(
    initialData?.orgId || defaultOrgId || (MOCK_ORGS[0]?.id || '')
  );

  const [templateName, setTemplateName] = useState<string>(
    initialData?.templateName || ''
  );
  const [templateCode, setTemplateCode] = useState<string>(
    initialData?.templateCode || `TPL_${Date.now().toString(36).toUpperCase()}`
  );
  const [category, setCategory] = useState<string>(
    initialData?.category || '任务派发'
  );
  const [version, setVersion] = useState<string>(
    initialData?.version || 'V1.0'
  );
  const [description, setDescription] = useState<string>(
    initialData?.description || ''
  );

  // 绑定流程
  const [defaultProcessId, setDefaultProcessId] = useState<string>(
    initialData?.defaultProcessId || processes[0]?.id || ''
  );
  const [supportedProcessIds, setSupportedProcessIds] = useState<string[]>(
    initialData?.supportedProcessIds || (processes.slice(0, 2).map(p => p.id))
  );

  // 字段列表
  const [fields, setFields] = useState<TemplateFieldItem[]>(
    initialData?.fields || [
      { key: 'title', label: '事项标题', type: 'string', required: true, placeholder: '请输入标题' },
      { key: 'content', label: '要点及要求说明', type: 'textarea', required: true, placeholder: '详细办理要求' },
      { key: 'urgency', label: '紧急程度', type: 'select', required: true, defaultValue: 'normal', options: [{ label: '普通', value: 'normal' }, { label: '紧急', value: 'urgent' }] },
      { key: 'deadline', label: '完成时限', type: 'date', required: true }
    ]
  );

  // 添加字段
  const handleAddField = () => {
    const newKey = `field_${Date.now().toString(36).slice(-4)}`;
    setFields(prev => [
      ...prev,
      {
        key: newKey,
        label: `自定义字段 ${prev.length + 1}`,
        type: 'string',
        required: false,
        placeholder: '请输入内容'
      }
    ]);
  };

  // 修改字段
  const handleUpdateField = (index: number, partial: Partial<TemplateFieldItem>) => {
    setFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...partial };
      return copy;
    });
  };

  // 移除字段
  const handleRemoveField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  // 移动字段
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setFields(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // 添加下拉选项
  const handleAddOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const currentOptions = field.options || [];
    const newOptVal = `opt_${currentOptions.length + 1}`;
    const newOptions = [...currentOptions, { label: `选项 ${currentOptions.length + 1}`, value: newOptVal }];
    handleUpdateField(fieldIndex, { options: newOptions });
  };

  // 修改下拉选项
  const handleUpdateOption = (fieldIndex: number, optIndex: number, key: 'label' | 'value', val: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optIndex] = { ...options[optIndex], [key]: val };
    handleUpdateField(fieldIndex, { options });
  };

  // 删除下拉选项
  const handleRemoveOption = (fieldIndex: number, optIndex: number) => {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optIndex);
    handleUpdateField(fieldIndex, { options });
  };

  const handleToggleSupportedProcess = (procId: string) => {
    setSupportedProcessIds(prev => 
      prev.includes(procId)
        ? prev.filter(id => id !== procId)
        : [...prev, procId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      alert('请填写模板名称');
      return;
    }

    const selectedSys = BUSINESS_SYSTEMS.find(s => s.id === systemId);
    const selectedOrg = MOCK_ORGS.find(o => o.id === orgId);

    const result: ProcessTemplateItem = {
      id: initialData?.id || `tpl_${Date.now().toString(36)}`,
      systemId,
      systemName: selectedSys?.name || '业务系统',
      templateCode: templateCode.trim() || `TPL_${Date.now()}`,
      templateName: templateName.trim(),
      category: category.trim() || '通用',
      scope,
      orgId: scope === 'org' ? orgId : undefined,
      orgName: scope === 'org' ? (selectedOrg?.name || '专属机构') : undefined,
      description: description.trim(),
      defaultProcessId: defaultProcessId || processes[0]?.id || '',
      supportedProcessIds: supportedProcessIds.length > 0 ? supportedProcessIds : [defaultProcessId],
      version: version.trim() || 'V1.0',
      status: initialData?.status || 'active',
      fields,
      appliedTenantCount: initialData?.appliedTenantCount ?? (scope === 'public' ? 128 : 1),
      creator: initialData?.creator || '当前管理员',
      createdAt: initialData?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    onSave(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-[1080px] max-w-[96vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 头部 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? `编辑业务数据模板 · ${templateName || '未命名'}` : '新建业务数据模板'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                模板负责承载业务表单数据结构与填写规范，可绑定至流程引擎进行灵活流转
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/40">
          {/* 第 1 步：所属业务系统选择 (必须属于某一业务系统) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>所属业务系统 <span className="text-red-500">*</span></span>
              </label>
              <span className="text-[11px] text-slate-400">模板必须且仅归属于 3 大核心业务系统之一</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BUSINESS_SYSTEMS.map(sys => {
                const isSelected = systemId === sys.id;
                const IconComponent = 
                  sys.id === 'SYS_ZGY' ? ShieldCheck :
                  sys.id === 'SYS_DTYJ' ? Siren : Target;

                return (
                  <div
                    key={sys.id}
                    onClick={() => setSystemId(sys.id)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      sys.id === 'SYS_ZGY' ? 'bg-blue-100 text-blue-700' :
                      sys.id === 'SYS_DTYJ' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{sys.shortName}</span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-blue-600 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug truncate">{sys.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 第 2 步：模板归属范围配置 (公共 vs 机构专属) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>模板归属范围与租户设定 <span className="text-red-500">*</span></span>
              </label>
              <span className="text-[11px] text-slate-400">设定模板是全网通用还是某个租户机构定制</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 选项 A：公共 */}
              <div
                onClick={() => setScope('public')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  scope === 'public'
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">公共模板 (Public)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">全员共享</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    该业务系统下的所有租户与客户机构均可直接引用此通用标准模板，统一填报规范。
                  </p>
                </div>
              </div>

              {/* 选项 B：机构专属定制 */}
              <div
                onClick={() => setScope('org')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  scope === 'org'
                    ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">机构专属定制模板 (Tenant-Exclusive)</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">机构私有</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    为特定租户机构定制的专属字段与流转模板，仅该机构及下属部门可用。
                  </p>
                </div>
              </div>
            </div>

            {/* 若选择机构专属，展开机构选择下拉 */}
            {scope === 'org' && (
              <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-lg flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
                <span className="text-xs font-bold text-purple-900 shrink-0 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>指定所属客户机构：</span>
                </span>
                <select
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  className="flex-1 h-9 px-3 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                >
                  {MOCK_ORGS.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 第 3 步：基础元信息 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>模板基础信息</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">模板名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="例：网络舆情专项巡查上报模板"
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">模板唯一编码 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={templateCode}
                  onChange={e => setTemplateCode(e.target.value)}
                  placeholder="例：ZGY_TPL_PATROL_01"
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">业务分类</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="例：任务派发 / 网络巡查 / 线索核查"
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">版本号</label>
                <input
                  type="text"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="例：V1.0"
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">模板说明与办理指导</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="说明该模板的使用场景、报送规范与业务背景"
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 第 4 步：动态表单字段设计器 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>动态表单字段设计器 ({fields.length} 个字段)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">配置此业务模板包含的数据项，支持单行文本、多行文本、数字、下拉单选/多选、日期与附件等</p>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加新字段</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {fields.map((field, fIdx) => (
                <div key={fIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-3">
                  {/* 字段主行 */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {fIdx + 1}
                    </span>

                    {/* 字段名称 */}
                    <div className="flex-1 min-w-[160px]">
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => handleUpdateField(fIdx, { label: e.target.value })}
                        placeholder="字段显示名称（如：任务标题）"
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 字段 Key */}
                    <div className="w-36">
                      <input
                        type="text"
                        value={field.key}
                        onChange={e => handleUpdateField(fIdx, { key: e.target.value })}
                        placeholder="英文标识 key"
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 字段类型 */}
                    <div className="w-36">
                      <select
                        value={field.type}
                        onChange={e => handleUpdateField(fIdx, { type: e.target.value as any })}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="string">单行文本 (string)</option>
                        <option value="textarea">多行文本 (textarea)</option>
                        <option value="number">数字金额 (number)</option>
                        <option value="select">下拉单选 (select)</option>
                        <option value="date">日期 (date)</option>
                        <option value="datetime">日期时间 (datetime)</option>
                        <option value="boolean">布尔开关 (boolean)</option>
                        <option value="attachment">文件附件 (attachment)</option>
                      </select>
                    </div>

                    {/* 必填开关 */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => handleUpdateField(fIdx, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span>必填</span>
                    </label>

                    {/* 顺序与删除操作 */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        disabled={fIdx === 0}
                        onClick={() => handleMoveField(fIdx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={fIdx === fields.length - 1}
                        onClick={() => handleMoveField(fIdx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(fIdx)}
                        className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer ml-1"
                        title="删除此字段"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 若为下拉选项，提供选项配置器 */}
                  {field.type === 'select' && (
                    <div className="pl-9 pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">下拉候选选项列表：</span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(fIdx)}
                          className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>添加选项</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(field.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                            <input
                              type="text"
                              value={opt.label}
                              placeholder="显示名称"
                              onChange={e => handleUpdateOption(fIdx, oIdx, 'label', e.target.value)}
                              className="w-20 text-xs text-slate-800 font-bold outline-none"
                            />
                            <span className="text-slate-300">:</span>
                            <input
                              type="text"
                              value={opt.value}
                              placeholder="值 value"
                              onChange={e => handleUpdateOption(fIdx, oIdx, 'value', e.target.value)}
                              className="w-16 text-[11px] font-mono text-slate-600 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(fIdx, oIdx)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 第 5 步：绑定流程引擎 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-blue-600" />
                <span>绑定指令流转流程</span>
              </label>
              <span className="text-[11px] text-slate-400">设定该模板提交后触发的默认与备选流程</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">默认主流程 <span className="text-red-500">*</span></label>
                <select
                  value={defaultProcessId}
                  onChange={e => setDefaultProcessId(e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  {processes.map(proc => (
                    <option key={proc.id} value={proc.id}>
                      {proc.processName} ({proc.processCode}) · [{proc.systemName}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">支持的备选流程</label>
                <div className="p-2 border border-slate-200 rounded-lg max-h-28 overflow-y-auto flex flex-col gap-1.5 bg-slate-50/50">
                  {processes.map(proc => {
                    const isChecked = supportedProcessIds.includes(proc.id);
                    return (
                      <label key={proc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSupportedProcess(proc.id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span className="truncate">{proc.processName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 底部按钮栏 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            已配置 <strong className="text-slate-700 font-mono">{fields.length}</strong> 个业务字段
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {isEditing ? '保存模板修改' : '确认创建业务模板'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
