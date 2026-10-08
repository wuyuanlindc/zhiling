import React, { useState } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Check, 
  Sparkles, 
  FileText, 
  GitMerge, 
  Building2, 
  AlertCircle, 
  CheckCheck,
  Eye,
  CornerDownLeft,
  ChevronRight,
  Share2,
  FileCheck,
  Paperclip,
  Image as ImageIcon,
  Download,
  Award,
  Layers,
  Save,
  Undo2,
  Sliders,
  Zap
} from 'lucide-react';
import { 
  ProcessTemplateItem, 
  FormWidgetComponent, 
  FlowStepNodeItem, 
  FormGlobalConfig 
} from '../../../types/processEngine';

interface ProcessFlowSimulationModalProps {
  templateName: string;
  versionCode: string;
  widgets: FormWidgetComponent[];
  flowNodes: FlowStepNodeItem[];
  formConfig?: FormGlobalConfig;
  onClose: () => void;
}

// 模拟表单初始测试数据生成函数
const getInitialFormValues = (widgets: FormWidgetComponent[]): Record<string, any> => {
  const values: Record<string, any> = {};
  widgets.forEach(w => {
    if (w.defaultValue !== undefined && w.defaultValue !== '') {
      values[w.key] = w.defaultValue;
    } else if (w.key === 'opinionTitle' || w.key === 'recordTitle') {
      values[w.key] = '关于开展全市网络巡查与应急协同处置测试指令';
    } else if (w.key === 'monitorTime' || w.key === 'recordDate') {
      values[w.key] = '2026-09-28';
    } else if (w.key === 'sourceChannel') {
      values[w.key] = 'weibo';
    } else if (w.key === 'warningLevel') {
      values[w.key] = 'level_2';
    } else if (w.key === 'postUrl') {
      values[w.key] = 'https://weibo.com/p/10080829310842/detail';
    } else if (w.key === 'mainContent' || w.key === 'contentDetail') {
      values[w.key] = '监测发现涉及辖区商圈突发聚集舆情线索，网民转发讨论量在过去1小时内上升300%。请对口责任单位第一时间组织警力现场核查，查明真实诉求并做好网络舆论引导。';
    } else if (w.key === 'targetDept' || w.key === 'targetOrg') {
      values[w.key] = '历下分局泉城路派出所';
    } else if (w.key === 'handleDeadline') {
      values[w.key] = '请在 4 小时内核查属地线下处置整改成效，回传加盖印章的电子回执与现场佐证材料。';
    } else if (w.key === 'attachments') {
      values[w.key] = '网络应急处置研判通报_20260928.pdf';
    } else if (w.key === 'feedbackDetail') {
      values[w.key] = '已派驻值班巡逻组抵达现场，与涉事商场管理方沟通协调，聚集人员已和平劝离，涉事网帖已完成澄清回应，未发生次生舆情。';
    } else if (w.key === 'feedbackImages') {
      values[w.key] = '现场巡查执法与秩序恢复照片.jpg';
    } else if (w.key === 'archiveOpinion') {
      values[w.key] = '涉事各方核查闭环，网情平稳可控，符合归档结案标准。';
    } else if (w.type === 'select') {
      values[w.key] = w.options && w.options[0] ? w.options[0].value : 'normal';
    } else if (w.type === 'switch' || w.type === 'checkbox') {
      values[w.key] = false;
    } else if (w.type === 'number') {
      values[w.key] = 1;
    } else {
      values[w.key] = '';
    }
  });
  return values;
};

// 按钮数据接口
interface ActionButtonConfig {
  id: string;
  label: string;
  actionType: 'submit' | 'save_draft' | 'transfer' | 'reject' | 'pass' | 'terminate' | 'urge';
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  enabled: boolean;
}

export const ProcessFlowSimulationModal: React.FC<ProcessFlowSimulationModalProps> = ({
  templateName,
  versionCode,
  widgets,
  flowNodes,
  formConfig,
  onClose
}) => {
  // 当前正在模拟执行的流程节点索引 (0 ~ flowNodes.length - 1)
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(0);

  // 模拟填写的表单各字段数据
  const [formData, setFormData] = useState<Record<string, any>>(() => getInitialFormValues(widgets));

  // 当前节点的审批批注意见
  const [nodeComment, setNodeComment] = useState<string>('情况属实，符合处置规范，同意流转至下一环节办理。');

  // 轻量提示消息 Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 流程流转历史履历记录
  interface SimulationLogItem {
    nodeId: string;
    nodeName: string;
    operator: string;
    action: string;
    comment: string;
    timestamp: string;
  }

  const [historyLogs, setHistoryLogs] = useState<SimulationLogItem[]>([
    {
      nodeId: flowNodes[0]?.id || 'start',
      nodeName: flowNodes[0]?.name || '发起人提交',
      operator: '张三 (市局指挥中心·发起人)',
      action: '【下发指令/提交】',
      comment: '填写业务基本信息与处置要求，启动流程',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }
  ]);

  // 是否已完成全流程流转 (达到最后一个办结节点)
  const isCompleted = currentNodeIndex >= flowNodes.length - 1;

  const currentNode = flowNodes[currentNodeIndex] || flowNodes[0];

  // 获取当前环节在流程设计与各节点配置中启用的操作按钮列表 (与流程设计中操作按钮完全对齐)
  const getActiveActionButtons = (node: FlowStepNodeItem): ActionButtonConfig[] => {
    // 优先：如果节点在流程设计抽屉中配置了专属 nodeButtons（审批按钮 / 操作按钮清单）
    if (node.nodeButtons && node.nodeButtons.length > 0) {
      // 严格按照流程设计中的 enabled 显隐性进行过滤，只有开启启用的按钮在测试时才能看见
      const activeNodeButtons = node.nodeButtons.filter(b => b.enabled);
      return activeNodeButtons.map(nb => {
        let actionType: ActionButtonConfig['actionType'] = 'submit';
        let color: ActionButtonConfig['color'] = 'blue';

        if (nb.key === 'agree' || nb.key === 'pass') {
          actionType = 'pass';
          color = 'emerald';
        } else if (nb.key === 'refuse') {
          actionType = 'terminate';
          color = 'red';
        } else if (nb.key === 'save') {
          actionType = 'save_draft';
          color = 'slate';
        } else if (nb.key === 'transfer') {
          actionType = 'transfer';
          color = 'amber';
        } else if (nb.key === 'reject') {
          actionType = 'reject';
          color = 'red';
        } else if (nb.key === 'recall') {
          actionType = 'terminate';
          color = 'slate';
        } else if (nb.key === 'submit') {
          actionType = 'submit';
          color = 'blue';
        }

        return {
          id: `btn_${nb.key}`,
          // 操作按钮的显示名称严格一致（采用在流程设计中配置的 displayName）
          label: nb.displayName || nb.label,
          actionType,
          color,
          enabled: true
        };
      });
    }

    // 其次：如果节点配置了 actionButtons（例如在流转规则与操作按钮配置中）
    if (node.actionButtons && node.actionButtons.length > 0) {
      // 仅展示处于启用状态 (enabled: true) 的按钮，显示名称完全保持一致
      return node.actionButtons
        .filter(b => b.enabled !== false)
        .map(b => ({
          id: b.id,
          label: b.label,
          actionType: b.actionType,
          color: b.color,
          enabled: true
        }));
    }

    // 若当前节点尚未自定义 actionButtons，按节点类型提供标准默认按钮
    if (node.nodeType === 'draft') {
      return [
        { id: 'btn_default_1', label: '下发指令/提交', actionType: 'submit', color: 'blue', enabled: true },
        { id: 'btn_default_2', label: '保存草稿', actionType: 'save_draft', color: 'slate', enabled: true },
        { id: 'btn_default_3', label: '撤销下发', actionType: 'terminate', color: 'red', enabled: true }
      ];
    } else if (node.nodeType === 'handle') {
      return [
        { id: 'btn_default_4', label: '提交', actionType: 'submit', color: 'blue', enabled: true },
        { id: 'btn_default_5', label: '转交', actionType: 'transfer', color: 'amber', enabled: true }
      ];
    } else if (node.nodeType === 'approval') {
      return [
        { id: 'btn_default_8', label: '同意', actionType: 'pass', color: 'emerald', enabled: true },
        { id: 'btn_default_9', label: '转交', actionType: 'transfer', color: 'amber', enabled: true }
      ];
    } else {
      return [
        { id: 'btn_default_10', label: '导出工单台账', actionType: 'save_draft', color: 'blue', enabled: true },
        { id: 'btn_default_11', label: '查看全生命周期轨迹', actionType: 'submit', color: 'slate', enabled: true }
      ];
    }
  };

  const currentActiveButtons = getActiveActionButtons(currentNode);

  // 计算指定字段在当前节点中的读写权限
  const getFieldPermission = (widget: FormWidgetComponent): 'editable' | 'readonly' | 'hidden' => {
    // 1. 如果节点单独配置了 fieldPermissions
    if (currentNode.fieldPermissions && currentNode.fieldPermissions[widget.key]) {
      return currentNode.fieldPermissions[widget.key];
    }

    // 2. 默认智能策略：
    const isFeedbackField = widget.key.includes('feedback') || widget.key.includes('archive') || widget.key.includes('opinion');

    if (currentNode.nodeType === 'draft') {
      // 发起节点：基础字段可编辑；回执与办结字段隐藏
      if (isFeedbackField) return 'hidden';
      return 'editable';
    }

    if (currentNode.nodeType === 'handle') {
      // 处理节点：回执字段可编辑，发起内容只读
      if (widget.key.includes('feedback')) return 'editable';
      if (widget.key.includes('archive')) return 'hidden';
      return 'readonly';
    }

    if (currentNode.nodeType === 'approval') {
      // 审批节点：全表单只读，聚焦审批批注
      return 'readonly';
    }

    // 办结节点：全表单只读归档
    return 'readonly';
  };

  // 获取当前模拟执行人的展示身份
  const getSimulatedOperatorTitle = () => {
    if (currentNode.receiverLabel) {
      return `${currentNode.receiverLabel} · 模拟经办`;
    }
    if (currentNode.nodeType === 'draft') return '市局值班员 · 张三 (发起人)';
    if (currentNode.nodeType === 'handle') return '历下分局网络安全保卫大队 · 李四 (承办人)';
    if (currentNode.nodeType === 'approval') return '指挥中心分管科长 · 王五 (审批人)';
    if (currentNode.nodeType === 'notify') return '系统自动化服务 · 消息服务中心';
    if (currentNode.nodeType === 'cc') return '分管领导及值班调度室 · 抄送查阅';
    return '归档办结监督员 · 赵六';
  };

  // 点击左侧表单处的具体操作按钮
  const handleExecuteActionButton = (btn: ActionButtonConfig) => {
    // 1. 提交 / 通过 / 流转类动作
    if (btn.actionType === 'submit' || btn.actionType === 'pass') {
      if (currentNodeIndex >= flowNodes.length - 1) {
        showToast(`已执行【${btn.label}】，流程已正式归档结案！`);
        return;
      }
      const nextIndex = currentNodeIndex + 1;
      const nextNode = flowNodes[nextIndex];

      const newLog: SimulationLogItem = {
        nodeId: currentNode.id,
        nodeName: currentNode.name,
        operator: getSimulatedOperatorTitle(),
        action: `【${btn.label}】`,
        comment: nodeComment || '符合处置标准，确认推进',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };

      setHistoryLogs(prev => [...prev, newLog]);
      setCurrentNodeIndex(nextIndex);
      showToast(`已触发【${btn.label}】，成功流转至环节【${nextNode?.name || '下一环节'}】`);

      // 设置下一环节预置意见
      if (nextNode?.nodeType === 'end') {
        setNodeComment('全环节处置完毕，整改成效显著，已按规范归档办结。');
      } else if (nextNode?.nodeType === 'approval') {
        setNodeComment('经审核，承办单位提交的核查结果真实有效，整改措施落地，同意办结。');
      } else {
        setNodeComment('已完成线下走访与排查，处置成效良好，上传回执凭证。');
      }
    } 
    // 2. 退回 / 驳回类动作
    else if (btn.actionType === 'reject') {
      const prevIndex = Math.max(0, currentNodeIndex - 1);
      const prevNode = flowNodes[prevIndex];

      const newLog: SimulationLogItem = {
        nodeId: currentNode.id,
        nodeName: currentNode.name,
        operator: getSimulatedOperatorTitle(),
        action: `【${btn.label}】退回`,
        comment: nodeComment || '填报信息不完整或核查事实不清，予以退回重办',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };

      setHistoryLogs(prev => [...prev, newLog]);
      setCurrentNodeIndex(prevIndex);
      showToast(`已执行【${btn.label}】，流程已回退至环节【${prevNode?.name || '上一步'}】`);
    }
    // 3. 转办类动作
    else if (btn.actionType === 'transfer') {
      const newLog: SimulationLogItem = {
        nodeId: currentNode.id,
        nodeName: currentNode.name,
        operator: getSimulatedOperatorTitle(),
        action: `【${btn.label}】转派协同`,
        comment: nodeComment || '根据属地网格管辖权责，申请跨科室转办协同处置',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };

      setHistoryLogs(prev => [...prev, newLog]);
      showToast(`已执行【${btn.label}】，已向协同科室发起转派请求`);
    }
    // 4. 暂存 / 草稿类动作
    else if (btn.actionType === 'save_draft') {
      const newLog: SimulationLogItem = {
        nodeId: currentNode.id,
        nodeName: currentNode.name,
        operator: getSimulatedOperatorTitle(),
        action: `【${btn.label}】暂存`,
        comment: '暂存当前表单填报数据快照',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };

      setHistoryLogs(prev => [...prev, newLog]);
      showToast(`【${btn.label}】成功，当前表单填报数据已缓存保存！`);
    }
    // 5. 撤销 / 终止类动作
    else if (btn.actionType === 'terminate') {
      const newLog: SimulationLogItem = {
        nodeId: currentNode.id,
        nodeName: currentNode.name,
        operator: getSimulatedOperatorTitle(),
        action: `【${btn.label}】流程撤销`,
        comment: '创建人主动撤回当前流转任务',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };

      setHistoryLogs(prev => [...prev, newLog]);
      showToast(`已执行【${btn.label}】，指令任务已撤回`);
    }
    // 其他动作
    else {
      showToast(`已执行【${btn.label}】操作`);
    }
  };

  // 点击“退回上一节点”
  const handleRollbackPrevious = () => {
    if (currentNodeIndex <= 0) return;
    setCurrentNodeIndex(currentNodeIndex - 1);
  };

  // 重置整个模拟测试
  const handleResetSimulation = () => {
    setCurrentNodeIndex(0);
    setFormData(getInitialFormValues(widgets));
    setNodeComment('情况属实，符合处置规范，同意流转至下一环节办理。');
    setHistoryLogs([
      {
        nodeId: flowNodes[0]?.id || 'start',
        nodeName: flowNodes[0]?.name || '发起人提交',
        operator: '张三 (市局指挥中心·发起人)',
        action: '【下发指令/提交】',
        comment: '填写业务基本信息与处置要求，启动流程',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      }
    ]);
    showToast('流程模拟测试已重置至第 1 环节');
  };

  // 渲染按钮样式的辅助方法
  const getButtonClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border-blue-700';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-emerald-700';
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs border-amber-700';
      case 'red':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border-rose-700';
      case 'slate':
        return 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 select-none">
      <div 
        className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* ======================= 浮动反馈 Toast ======================= */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ======================= 顶栏：测试工作台状态与操作 ======================= */}
        <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Play className="w-5 h-5 fill-purple-600 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  流程流转仿真模拟测试
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <GitMerge className="w-3 h-3 text-blue-600" />
                  <span>流程模板 · {versionCode}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  当前环节：第 {currentNodeIndex + 1} / {flowNodes.length} ({currentNode.name})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                测试模板：<strong className="text-slate-700">{templateName}</strong>
                <span className="ml-2 text-slate-400">（左侧表单展示当前环节按流程设置启用的操作按钮，右侧跟踪实时流转链路）</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetSimulation}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="重新从第 1 节点开始模拟"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>重新开始测试</span>
            </button>

            <div className="w-px h-5 bg-slate-200" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="退出模拟测试"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================= 主体视窗：左右双栏结构 ======================= */}
        <div className="flex-1 flex overflow-hidden">
          {/* ----------------- 左侧：表单模拟展示与流转动作按钮区域 (w-7/12) ----------------- */}
          <div className="w-7/12 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
            {/* 当前节点经办人员身份条 */}
            <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <div className="text-xs">
                  <span className="text-slate-500 font-medium">当前模拟经办身份：</span>
                  <strong className="text-blue-900 font-black ml-1">
                    {getSimulatedOperatorTitle()}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 font-bold">
                  {currentNode.categoryLabel || '流程节点'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                  currentNode.timeLimitEnabled 
                    ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>
                    时效: {currentNode.timeLimitEnabled 
                      ? (currentNode.timeLimitMode === 'initiator_select' 
                          ? `自选(${currentNode.timeLimitFieldName || '表单时效'})` 
                          : `${currentNode.timeLimitHours || 24}h`)
                      : (currentNode.timeLimitLabel || '标准时限')}
                  </span>
                </span>
              </div>
            </div>

            {/* 节点提示说明卡片 */}
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-slate-800">{currentNode.name}:</span>
                <span className="text-slate-500 truncate">{currentNode.description || '请按规定业务时限和操作要求完成本环节流转'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                  {currentNode.approveModeLabel || '或签生效'}
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>启用{currentActiveButtons.length}个按钮</span>
                </span>
              </div>
            </div>

            {/* 表单内容滚动区 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/30">
              {/* 表单卡片 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {templateName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        根据当前环节【{currentNode.name}】动态呈现字段读写与填报权限
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    工单编号: FLOW-20260928-0082
                  </span>
                </div>

                {/* 动态渲染 24 栅格表单控件 */}
                <div className="grid grid-cols-24 gap-4">
                  {widgets.map(w => {
                    const perm = getFieldPermission(w);
                    if (perm === 'hidden') return null;
                    const isReadOnly = perm === 'readonly';

                    // 1. 分割线控件
                    if (w.type === 'divider') {
                      return (
                        <div key={w.id} className="col-span-24 pt-3 pb-1">
                          <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                            <h5 className="text-xs font-black text-slate-800">{w.label}</h5>
                            <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                              {isReadOnly ? '前序环节已填报' : '本环节重点填报'}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={w.id} 
                        style={{ gridColumn: `span ${w.span || 24}` }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <span>{w.label}</span>
                            {w.required && <span className="text-red-500">*</span>}
                          </label>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isReadOnly ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isReadOnly ? '只读' : '可编辑'}
                          </span>
                        </div>

                        {/* 单行文本 */}
                        {w.type === 'input' && (
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={formData[w.key] || ''}
                            onChange={e => setFormData({ ...formData, [w.key]: e.target.value })}
                            placeholder={w.placeholder || '请输入'}
                            className={`w-full h-8 px-2.5 text-xs rounded-lg border outline-none transition-colors ${
                              isReadOnly 
                                ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
                                : 'bg-white border-slate-300 focus:border-blue-500 text-slate-800 shadow-2xs'
                            }`}
                          />
                        )}

                        {/* 多行文本 */}
                        {w.type === 'textarea' && (
                          <textarea
                            rows={3}
                            disabled={isReadOnly}
                            value={formData[w.key] || ''}
                            onChange={e => setFormData({ ...formData, [w.key]: e.target.value })}
                            placeholder={w.placeholder || '请输入详细内容'}
                            className={`w-full p-2.5 text-xs rounded-lg border outline-none transition-colors resize-none ${
                              isReadOnly 
                                ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
                                : 'bg-white border-slate-300 focus:border-blue-500 text-slate-800 shadow-2xs'
                            }`}
                          />
                        )}

                        {/* 下拉单选 */}
                        {w.type === 'select' && (
                          <select
                            disabled={isReadOnly}
                            value={formData[w.key] || ''}
                            onChange={e => setFormData({ ...formData, [w.key]: e.target.value })}
                            className={`w-full h-8 px-2 text-xs rounded-lg border outline-none ${
                              isReadOnly 
                                ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
                                : 'bg-white border-slate-300 focus:border-blue-500 text-slate-800 shadow-2xs'
                            }`}
                          >
                            {(w.options || [{ label: '微博', value: 'weibo' }, { label: '抖音', value: 'douyin' }]).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}

                        {/* 日期选择 */}
                        {w.type === 'date' && (
                          <input
                            type="date"
                            disabled={isReadOnly}
                            value={formData[w.key] || '2026-09-28'}
                            onChange={e => setFormData({ ...formData, [w.key]: e.target.value })}
                            className={`w-full h-8 px-2 text-xs rounded-lg border outline-none ${
                              isReadOnly ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white border-slate-300'
                            }`}
                          />
                        )}

                        {/* 机构级联选择器 */}
                        {w.type === 'cascader' && (
                          <div className={`w-full h-8 px-2.5 text-xs rounded-lg border flex items-center justify-between ${
                            isReadOnly ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white border-slate-300 text-slate-800'
                          }`}>
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formData[w.key] || '历下分局泉城路派出所'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">已指派</span>
                          </div>
                        )}

                        {/* 附件上传 */}
                        {w.type === 'file' && (
                          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Paperclip className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 block text-xs">
                                  {formData[w.key] || '网络舆情处置核查材料.pdf'}
                                </span>
                                <span className="text-[10px] text-slate-400">1.8 MB · 完整PDF</span>
                              </div>
                            </div>
                            <span className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                              <Download className="w-3 h-3" />
                              <span>查看</span>
                            </span>
                          </div>
                        )}

                        {/* 图片上传 */}
                        {w.type === 'image' && (
                          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 block text-xs">
                                  {formData[w.key] || '现场核查反馈照片.jpg'}
                                </span>
                                <span className="text-[10px] text-slate-400">1920x1080 · 已盖电子章</span>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-bold">
                              原图已存档
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 非首节点的「本环节办理与审批批注」专有互动区域 */}
              {currentNodeIndex > 0 && !isCompleted && (
                <div className="bg-blue-50/60 p-4.5 rounded-2xl border border-blue-200 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>【{currentNode.name}】环节办理意见录入</span>
                    </span>
                    <span className="text-[11px] text-blue-700 font-mono">
                      通过规则: {currentNode.approveModeLabel || '或签通过'}
                    </span>
                  </div>

                  {/* 审批批语输入框 */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      经办 / 审批指导批示意见
                    </label>
                    <textarea
                      rows={2}
                      value={nodeComment}
                      onChange={e => setNodeComment(e.target.value)}
                      placeholder="请输入具体的审批指导意见或处置核实结论..."
                      className="w-full p-2.5 text-xs bg-white border border-blue-200 rounded-lg outline-none focus:border-blue-500 resize-none text-slate-800 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* 办结成功提示横幅 */}
              {isCompleted && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 space-y-3 text-center shadow-xs animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900">
                      全流程仿真流转顺利闭环办结！
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed mt-1">
                      所有环节（共 {flowNodes.length} 个流转节点）已按既定政务流转规则校验通过。已自动生成正式闭环工单档案台账，满意度已沉淀至效能智库。
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <span className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                      档案号: ARCHIVE-JN-20260928
                    </span>
                    <span className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                      流转耗时: 1小时24分
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ================== 左侧表单处操作控制栏：显示当前环节根据流程设置中启用的操作按钮 ================== */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-md">
              {/* 返回上一步辅助操作 */}
              <button
                type="button"
                disabled={currentNodeIndex === 0}
                onClick={handleRollbackPrevious}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="返回上一流转环节"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回上一步</span>
              </button>

              {/* 动态渲染左侧表单处当前环节的操作按钮列表 (根据流程设置中按钮设置的显隐性来定) */}
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {currentActiveButtons.length > 0 ? (
                  currentActiveButtons.map((btn, bIndex) => (
                    <button
                      key={btn.id || `btn_${bIndex}`}
                      type="button"
                      onClick={() => handleExecuteActionButton(btn)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${getButtonClasses(btn.color)}`}
                      title={`触发【${btn.label}】动作`}
                    >
                      {btn.actionType === 'submit' && <Send className="w-3.5 h-3.5" />}
                      {btn.actionType === 'pass' && <Check className="w-3.5 h-3.5" />}
                      {btn.actionType === 'reject' && <Undo2 className="w-3.5 h-3.5" />}
                      {btn.actionType === 'save_draft' && <Save className="w-3.5 h-3.5" />}
                      {btn.actionType === 'transfer' && <Share2 className="w-3.5 h-3.5" />}
                      {btn.actionType === 'terminate' && <X className="w-3.5 h-3.5" />}
                      <span>{btn.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                      ⚠️ 流程设置中该环节所有按钮均已关闭隐藏
                    </span>
                    {currentNodeIndex < flowNodes.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = currentNodeIndex + 1;
                          setCurrentNodeIndex(nextIdx);
                          showToast(`已跳过流转至【${flowNodes[nextIdx]?.name || '下一环节'}】`);
                        }}
                        className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
                      >
                        跳过并流转
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ----------------- 右侧：设计好的流程图与实时流转跟踪 (w-5/12) ----------------- */}
          <div className="w-5/12 bg-slate-50 flex flex-col overflow-hidden">
            {/* 顶栏说明 */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-purple-600" />
                <span>设计好的流程拓扑链路 (实时流转跟踪)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                环节数: {flowNodes.length}
              </span>
            </div>

            {/* 节点垂直流转卡片流 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {flowNodes.map((node, index) => {
                const isPassed = index < currentNodeIndex;
                const isCurrent = index === currentNodeIndex;
                const isPending = index > currentNodeIndex;
                const activeBtns = getActiveActionButtons(node);

                return (
                  <div key={node.id} className="relative">
                    {/* 节点卡片 */}
                    <div
                      onClick={() => setCurrentNodeIndex(index)}
                      className={`p-3.5 rounded-xl border-2 transition-all relative z-10 cursor-pointer ${
                        isCurrent
                          ? 'border-blue-600 bg-white shadow-md ring-4 ring-blue-500/10'
                          : isPassed
                            ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs hover:border-emerald-400'
                            : 'border-slate-200 bg-white/70 opacity-60 hover:opacity-80'
                      }`}
                      title="点击可预览切换至该环节所见的表单状态与对应按钮"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* 状态徽标 */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white animate-pulse'
                              : isPassed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isPassed ? <Check className="w-3.5 h-3.5" /> : index + 1}
                          </div>

                          <div>
                            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <span>{node.name}</span>
                              <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                {node.nodeType === 'draft' ? '发起填报' : node.nodeType === 'end' ? '办结终点' : '审批流转'}
                              </span>
                            </h5>
                          </div>
                        </div>

                        {/* 右侧状态标签 */}
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 animate-pulse">
                            正在办理中
                          </span>
                        )}
                        {isPassed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            已流转通过
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] text-slate-400">
                            待流转
                          </span>
                        )}
                      </div>

                      {/* 节点经办人与按钮显隐概览 */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 truncate max-w-[170px]">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{node.receiverLabel || '指定承办科室'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                            {activeBtns.length}个可用按钮
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 节点间的向下指示箭头与流线 */}
                    {index < flowNodes.length - 1 && (
                      <div className="flex flex-col items-center my-1">
                        <div className={`w-0.5 h-3.5 transition-colors ${
                          index < currentNodeIndex ? 'bg-emerald-400' : 'bg-slate-200'
                        }`} />
                        <div className={`w-2 h-2 rotate-45 border-r-2 border-b-2 transition-colors ${
                          index < currentNodeIndex ? 'border-emerald-500' : 'border-slate-300'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ---------------- 底部流转履历时间轴 ---------------- */}
              <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>仿真流转履历日志</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {historyLogs.length} 条记录
                  </span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {historyLogs.map((log, idx) => (
                    <div key={idx} className="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {log.nodeName} · {log.operator}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 font-medium text-[11px]">
                        动作：<span className="text-blue-700 font-bold">{log.action}</span> · 意见：{log.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
