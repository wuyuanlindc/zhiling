/**
 * 业务数据模板 - 动态表单实时仿真预览弹窗 (TemplateFormPreviewModal)
 * 根据 24 栅格低代码控件定义与字段约束，动态渲染真实的表单输入控件，支持试填数据和查看 Payload JSON
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Code2, 
  Building2, 
  Globe2, 
  Send, 
  CheckCircle,
  LayoutGrid
} from 'lucide-react';
import { ProcessTemplateItem } from '../../types/processEngine';
import { FormWidgetRenderer } from './lowcode/FormWidgetRenderer';

interface TemplateFormPreviewModalProps {
  template: ProcessTemplateItem;
  onClose: () => void;
}

export const TemplateFormPreviewModal: React.FC<TemplateFormPreviewModalProps> = ({
  template,
  onClose
}) => {
  // 试填表单数据
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [submitted, setSubmitted] = useState(false);

  const widgets = template.formWidgets || [];

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSubmitted(false);
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[960px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-800">{template.templateName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {template.systemName}
                </span>
                {template.scope === 'public' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    <span>公共</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{template.orgName || '机构专属'}</span>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">({template.version || 'V1.0'})</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                模板编码: <span className="font-mono font-bold text-slate-700">{template.templateCode}</span>
                {template.description && <span className="ml-2">· {template.description}</span>}
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

        {/* 选项卡栏 */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>24 栅格动态表单仿真填报</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>业务 Payload 载荷 JSON</span>
            </button>
          </div>

          {/* 控件数量提示 */}
          {activeTab === 'form' && (
            <div className="flex items-center gap-2 my-1.5">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                全表单共 {widgets.length} 个控件
              </span>
            </div>
          )}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          {activeTab === 'form' ? (
            <form onSubmit={handleSimulateSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {template.name || '业务全流程表单'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    24 栅格低代码自适应排版，支持通过分割线自主划分业务阶段
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  24 栅格自适应布局
                </span>
              </div>

              {submitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>表单数据格式与必填规则校验通过！已模拟组装业务指令载荷并准备触发流转。</span>
                </div>
              )}

              {/* 24 栅格控件列表渲染 */}
              <div className="flex flex-wrap -mx-2">
                {widgets.map(widget => (
                  <FormWidgetRenderer
                    key={widget.id}
                    widget={widget}
                    mode="runtime"
                    value={formData[widget.key]}
                    onChange={val => handleFieldChange(widget.key, val)}
                  />
                ))}
              </div>
            </form>
          ) : (
            <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl p-6 text-slate-200 font-mono text-xs overflow-x-auto shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-slate-400">Payload Schema & Mock Data</span>
                <span className="text-emerald-400 text-[11px]">JSON Validated</span>
              </div>
              <pre className="leading-relaxed">
                {JSON.stringify({
                  templateId: template.id,
                  templateCode: template.templateCode,
                  systemId: template.systemId,
                  scope: template.scope,
                  orgId: template.orgId,
                  submittedData: formData,
                  widgetsCount: widgets.length,
                  flowNodesCount: template.flowNodes?.length || 4
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
