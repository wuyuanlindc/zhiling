/**
 * 流程模拟运行器组件 (FlowSimulator)
 * 具备以下能力：
 * 1. 输入模拟表单数据（如涉案金额=15000、是否节假日=是、紧急程度=特急）
 * 2. 逐步单步调试 (Step-by-Step) 或 一键自动运行完整流转
 * 3. 动态展示当前激活节点、流转分支判断结果、接收对象解析出的具体目标机构与人员
 * 4. 实时生成可视化审计运行日志，直观验证条件分支分流与会签/或签逻辑是否正确
 */

import React, { useState } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  UserCheck, 
  AlertCircle, 
  HelpCircle,
  FileSpreadsheet,
  Activity,
  Award
} from 'lucide-react';
import { ProcessDefinition, FlowCanvasNode } from '../../types/processEngine';
import { MOCK_TEMPLATES } from '../../data/mockProcessEngine';

interface FlowSimulatorProps {
  process: ProcessDefinition;
  onClose: () => void;
}

export const FlowSimulator: React.FC<FlowSimulatorProps> = ({
  process,
  onClose
}) => {
  const boundTemplate = MOCK_TEMPLATES.find(t => t.id === process.templateId);

  // 模拟输入参数
  const [formData, setFormData] = useState<Record<string, any>>({
    task_title: '【专项研判】关于某重点涉案线索核查处置任务',
    amount: 15000,
    is_holiday: false,
    urgency: 'extreme',
    is_has_risk: true,
    handler_remark: '初步研判属实，线索清晰'
  });

  // 运行状态
  const [currentNodeId, setCurrentNodeId] = useState<string>(process.nodes[0]?.id || '');
  const [executionLogs, setExecutionLogs] = useState<{
    time: string;
    step: number;
    nodeName: string;
    action: string;
    detail: string;
    type: 'info' | 'success' | 'warn';
  }[]>([
    {
      time: '10:00:01',
      step: 1,
      nodeName: process.nodes[0]?.data.name || '开始',
      action: '流程实例启动',
      detail: '经办人填报指令数据，开始流转解析',
      type: 'info'
    }
  ]);
  const [isFinished, setIsFinished] = useState(false);

  // 获取当前节点
  const currentNode = process.nodes.find(n => n.id === currentNodeId);

  // 步骤推进
  const handleStepForward = () => {
    if (!currentNode || isFinished) return;

    // 寻找下一个节点
    if (currentNode.type === 'condition') {
      // 执行条件匹配
      const branches = currentNode.data.conditionBranches || [];
      let matchedBranch = branches[0];

      // 简单模拟判断规则：如果涉案金额 >= 10000 走大额分支，否则走小额/默认
      if (formData.amount >= 10000 && branches.length > 0) {
        matchedBranch = branches[0];
      } else if (branches.length > 1) {
        matchedBranch = branches[1];
      }

      const targetId = matchedBranch?.targetNodeId || process.edges.find(e => e.source === currentNode.id)?.target;
      const targetNode = process.nodes.find(n => n.id === targetId);

      const newLog = {
        time: new Date().toLocaleTimeString(),
        step: executionLogs.length + 1,
        nodeName: currentNode.data.name,
        action: `条件判定命中: [${matchedBranch?.name || '默认分支'}]`,
        detail: `规则计算: 涉案金额(${formData.amount}) ${formData.amount >= 10000 ? '>= 10000' : '< 10000'}，智能流向 [${targetNode?.data.name || '下一步'}]`,
        type: 'info' as const
      };

      setExecutionLogs(prev => [...prev, newLog]);

      if (targetNode) {
        setCurrentNodeId(targetNode.id);
        if (targetNode.type === 'end') {
          setIsFinished(true);
        }
      } else {
        setIsFinished(true);
      }
      return;
    }

    // 普通流转推进
    const outEdge = process.edges.find(e => e.source === currentNode.id);
    if (outEdge) {
      const nextNode = process.nodes.find(n => n.id === outEdge.target);
      if (nextNode) {
        const actionDesc = 
          currentNode.type === 'handle' 
            ? `办理完成 (${currentNode.data.handleMode === 'countersign' ? '会签完成' : '已办理'})` 
            : currentNode.type === 'approval' 
            ? '领导审批通过' : '流转推进';

        const detailDesc = 
          currentNode.type === 'handle'
            ? `接收对象: ${currentNode.data.receivers?.map(r => r.targetName).join(', ') || '各责任部门'}，办理合格`
            : currentNode.type === 'approval'
            ? '审签完成，流转至下一处理节点' : '进入下一步骤';

        const newLog = {
          time: new Date().toLocaleTimeString(),
          step: executionLogs.length + 1,
          nodeName: currentNode.data.name,
          action: actionDesc,
          detail: detailDesc,
          type: 'success' as const
        };

        setExecutionLogs(prev => [...prev, newLog]);
        setCurrentNodeId(nextNode.id);

        if (nextNode.type === 'end') {
          setIsFinished(true);
          setExecutionLogs(prev => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              step: prev.length + 2,
              nodeName: nextNode.data.name,
              action: '流程闭环结束',
              detail: '广播业务事实事件: [TASK_COMPLETED]，触发外部评价中心自适应记录',
              type: 'success'
            }
          ]);
        }
      }
    } else {
      setIsFinished(true);
    }
  };

  // 一键自动模拟到底
  const handleAutoRun = () => {
    let currentId = currentNodeId;
    const logs = [...executionLogs];
    let stepCount = logs.length;

    while (true) {
      const cNode = process.nodes.find(n => n.id === currentId);
      if (!cNode || cNode.type === 'end') {
        break;
      }

      if (cNode.type === 'condition') {
        const branches = cNode.data.conditionBranches || [];
        const matched = (formData.amount >= 10000 ? branches[0] : branches[1]) || branches[0];
        const nextId = matched?.targetNodeId || process.edges.find(e => e.source === cNode.id)?.target;
        const nNode = process.nodes.find(n => n.id === nextId);

        stepCount++;
        logs.push({
          time: new Date().toLocaleTimeString(),
          step: stepCount,
          nodeName: cNode.data.name,
          action: `条件匹配: ${matched?.name || '默认'}`,
          detail: `涉案金额=${formData.amount}元，流向 [${nNode?.data.name || '下一环节'}]`,
          type: 'info'
        });

        if (nNode) {
          currentId = nNode.id;
          if (nNode.type === 'end') break;
        } else {
          break;
        }
      } else {
        const edge = process.edges.find(e => e.source === cNode.id);
        if (!edge) break;
        const nNode = process.nodes.find(n => n.id === edge.target);
        stepCount++;
        logs.push({
          time: new Date().toLocaleTimeString(),
          step: stepCount,
          nodeName: cNode.data.name,
          action: cNode.type === 'approval' ? '审批核准通过' : '办理交付办结',
          detail: `接收人签署完毕，流向 [${nNode?.data.name || '结束'}]`,
          type: 'success'
        });

        if (nNode) {
          currentId = nNode.id;
          if (nNode.type === 'end') break;
        } else {
          break;
        }
      }
    }

    // 补全结束节点日志
    const endNode = process.nodes.find(n => n.type === 'end');
    if (endNode) {
      currentId = endNode.id;
      logs.push({
        time: new Date().toLocaleTimeString(),
        step: stepCount + 1,
        nodeName: endNode.data.name,
        action: '流程归档完结',
        detail: '广播 [TASK_COMPLETED, HIGH_QUALITY]，闭环流程模拟成功',
        type: 'success'
      });
    }

    setExecutionLogs(logs);
    setCurrentNodeId(currentId);
    setIsFinished(true);
  };

  // 重置模拟器
  const handleReset = () => {
    setCurrentNodeId(process.nodes[0]?.id || '');
    setIsFinished(false);
    setExecutionLogs([
      {
        time: new Date().toLocaleTimeString(),
        step: 1,
        nodeName: process.nodes[0]?.data.name || '开始',
        action: '流程重新启动',
        detail: '已重置模拟运行环境，请重新调试',
        type: 'info'
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-[1260px] max-w-[96vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">流程动态模拟运行器 (Sandbox)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  {process.processName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {process.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                模拟填报真实业务表单数据，步进式检验条件分支路由、会签/或签判定及接收人解析
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

        {/* 主体两栏布局：左侧参数输入与流转节点列表，右侧执行日志与状态 */}
        <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
          {/* 左侧：模拟参数输入与流程节点状态 (480px) */}
          <div className="w-[480px] border-r border-slate-200 bg-white p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>模拟表单数据输入</span>
              </span>
              <span className="text-[10px] text-slate-400">驱动条件分支判定</span>
            </div>

            {/* 表单模拟输入 */}
            <div className="flex flex-col gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">任务标题</label>
                <input
                  type="text"
                  value={formData.task_title}
                  onChange={e => setFormData({ ...formData, task_title: e.target.value })}
                  className="h-7 px-2 border border-slate-200 rounded text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">涉案金额 (元)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="h-7 px-2 border border-slate-200 rounded text-xs bg-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">≥10000将走领导审批</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">紧急程度</label>
                  <select
                    value={formData.urgency}
                    onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                    className="h-7 px-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="normal">普通</option>
                    <option value="urgent">紧急</option>
                    <option value="extreme">特急 (优先流转)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 font-medium">是否法定节假日/双休：</span>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_holiday}
                    onChange={e => setFormData({ ...formData, is_holiday: e.target.checked })}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {formData.is_holiday ? '是 (节假日值班排班)' : '否 (常规工作日)'}
                  </span>
                </label>
              </div>
            </div>

            {/* 节点流转推进卡片列 */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-slate-700 text-xs">节点推进状态</span>
              <div className="flex flex-col gap-2">
                {process.nodes.map((n, idx) => {
                  const isCurrent = n.id === currentNodeId;
                  const isPassed = executionLogs.some(l => l.nodeName === n.data.name);

                  return (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isCurrent 
                          ? 'border-purple-500 bg-purple-50/80 font-bold text-purple-950 shadow-2xs ring-1 ring-purple-400' 
                          : isPassed 
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900' 
                          : 'border-slate-200 bg-white text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent ? 'bg-purple-600 text-white animate-pulse' :
                          isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{n.data.name}</span>
                      </div>

                      <span className="text-[10px] font-medium">
                        {isCurrent ? '● 正在执行' : isPassed ? '✓ 已通过' : '待激活'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧：执行记录日志与控制台 */}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
            {/* 顶栏控制按钮 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs">模拟控制：</span>
                <button
                  type="button"
                  onClick={handleStepForward}
                  disabled={isFinished}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isFinished ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>单步推进下一步</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoRun}
                  disabled={isFinished}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isFinished ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-purple-700 border-purple-300'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>自动完整模拟</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置</span>
                </button>
              </div>

              {isFinished && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>流程流转已顺利闭环</span>
                </span>
              )}
            </div>

            {/* 审计日志输出区 */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700 text-xs">实时流转审计追踪日志</span>
                <span className="text-[10px] text-slate-400 font-mono">共 {executionLogs.length} 条记录</span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col gap-1 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                        <span className="font-bold text-slate-800">[{log.nodeName}]</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Step {log.step}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-1">{log.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            模拟测试完毕后，可在设计器中随时修改分支判断阈值或添加审批协同人
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
          >
            完成模拟退出
          </button>
        </div>
      </div>
    </div>
  );
};
