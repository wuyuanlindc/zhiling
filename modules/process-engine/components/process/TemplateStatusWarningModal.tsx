/**
 * 流程状态校验提示弹窗 (TemplateStatusWarningModal)
 * 当流程处于【开启】状态时，拦截【设计】或【编辑】操作，
 * 提示用户“只有关闭状态的流程才能设计/编辑”，并支持一键停用后直接进入。
 */

import React from 'react';
import { ProcessTemplateItem } from '../../types/processEngine';
import { 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  PowerOff, 
  ArrowRight,
  Info
} from 'lucide-react';

interface TemplateStatusWarningModalProps {
  actionType: 'design' | 'edit';
  template: ProcessTemplateItem;
  onClose: () => void;
  onDeactivateAndProceed: () => void;
}

export const TemplateStatusWarningModal: React.FC<TemplateStatusWarningModalProps> = ({
  actionType,
  template,
  onClose,
  onDeactivateAndProceed
}) => {
  const actionLabel = actionType === 'design' ? '设计' : '编辑';
  const actionFullLabel = actionType === 'design' ? '表单与流转设计' : '基础信息编辑';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[480px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* 顶栏 */}
        <div className="px-6 py-4.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                只有关闭状态的流程才能{actionLabel}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                流程处于开启状态，操作已被系统拦截
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-4">
          
          {/* 流程信息展示 */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">流程模板名称:</span>
              <span className="font-bold text-slate-800">{template.templateName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">流程模板 ID:</span>
              <span className="font-mono font-bold text-slate-700">{template.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">当前流程状态:</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>开启（启用中）</span>
              </span>
            </div>
          </div>

          {/* 规则阐述 */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>规范说明：</strong>
              当前流程处于【开启】状态。为确保各业务系统正在流转的业务任务不受结构变更冲击、保证表单数据强一致性，
              <strong className="text-amber-950 underline underline-offset-2 mx-1">
                只有关闭（停用）状态的流程才能进行{actionFullLabel}
              </strong>
              。
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>您可以先停用该流程，完成修改配置后再重新开启投入使用。</span>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer"
          >
            我知道了
          </button>
          
          <button
            type="button"
            onClick={onDeactivateAndProceed}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>立即停用并进入{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
