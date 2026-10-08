/**
 * 节点属性配置面板组件 (NodeConfigPanel)
 * 依据当前选中节点的类型 (start / handle / approval / condition / cc / wait / end)
 * 动态展示专属参数：
 * - 办理节点：办理方式（单人、任一人、会签[全部完成/最少完成数量]、或签、主办+协办、多人协同）、办理时限、超时规则、反馈要求、转办/延期、ReceiverSelector
 * - 审批节点：审批方式（单人、会签、或签、负责人）、审批动作（通过、退回、驳回、转交、加签）、退回/驳回规则、审批意见
 * - 条件节点：ConditionBuilder 可视化多分支规则
 * - 抄送节点：抄送对象、通知途径（站内通知/短信/企微/钉钉）
 * - 延时/等待节点：固定时长、指定日期、业务事件
 * - 结束节点：预留业务结果事件（为未来积分与评价中心留出事件通知解耦口）
 */

import React from 'react';
import { 
  Play, 
  CheckSquare, 
  Stamp, 
  GitFork, 
  Send, 
  Clock, 
  Flag, 
  X, 
  AlertTriangle,
  FileCheck2,
  Users,
  Building2,
  ShieldCheck,
  Award
} from 'lucide-react';
import { 
  FlowCanvasNode, 
  FlowNodeData, 
  HandleMode, 
  ApprovalMode, 
  ApprovalAction, 
  OverdueRule, 
  TimeLimitType, 
  ReceiverItem,
  ConditionBranch
} from '../../types/processEngine';
import { ReceiverSelector } from './ReceiverSelector';
import { ConditionBuilder } from './ConditionBuilder';
import { MOCK_BUSINESS_EVENTS } from '../../data/mockProcessEngine';

interface NodeConfigPanelProps {
  node: FlowCanvasNode | null;
  allNodes: FlowCanvasNode[];
  onUpdateNodeData: (nodeId: string, partialData: Partial<FlowNodeData>) => void;
  onClose: () => void;
  readOnly?: boolean;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  allNodes,
  onUpdateNodeData,
  onClose,
  readOnly = false
}) => {
  if (!node) {
    return (
      <div className="w-[420px] bg-white border-l border-slate-200 h-full p-6 flex flex-col items-center justify-center text-slate-400 text-xs text-center shrink-0">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
          <CheckSquare className="w-7 h-7 text-slate-300" />
        </div>
        <p className="font-bold text-slate-700 text-sm">未选中任何节点</p>
        <p className="mt-1 text-slate-400 max-w-[280px] leading-relaxed">点击画布中的节点卡片，即可在此展开该节点的专属办理方式、接收对象、分支规则与时限策略配置</p>
      </div>
    );
  }

  const { data, type, id } = node;

  const handleDataChange = (partial: Partial<FlowNodeData>) => {
    onUpdateNodeData(id, partial);
  };

  // 节点类型标识
  const nodeIcon = 
    type === 'start' ? <Play className="w-4 h-4 text-emerald-600" /> :
    type === 'handle' ? <CheckSquare className="w-4 h-4 text-blue-600" /> :
    type === 'approval' ? <Stamp className="w-4 h-4 text-purple-600" /> :
    type === 'condition' ? <GitFork className="w-4 h-4 text-orange-600" /> :
    type === 'cc' ? <Send className="w-4 h-4 text-slate-600" /> :
    type === 'wait' ? <Clock className="w-4 h-4 text-amber-600" /> :
    <Flag className="w-4 h-4 text-slate-700" />;

  const nodeTypeTitle = 
    type === 'start' ? '开始节点配置' :
    type === 'handle' ? '办理节点配置' :
    type === 'approval' ? '审批节点配置' :
    type === 'condition' ? '条件分支节点配置' :
    type === 'cc' ? '抄送节点配置' :
    type === 'wait' ? '等待/延时节点配置' : '结束节点配置';

  const otherNodes = allNodes.filter(n => n.id !== id);

  return (
    <div className="w-[440px] bg-white border-l border-slate-200 h-full flex flex-col shrink-0 text-xs select-none shadow-xl animate-in slide-in-from-right duration-200">
      {/* 头部 */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            {nodeIcon}
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-xs leading-none">{nodeTypeTitle}</h3>
            <span className="text-[10px] text-slate-400 font-mono">节点唯一标识: {id}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          title="收起配置面板"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 主配置表单区 */}
      <div className="flex-1 overflow-y-auto p-4.5 flex flex-col gap-4">
        {/* 基础信息：节点名称与说明 */}
        <div className="flex flex-col gap-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700">节点名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.name || ''}
              disabled={readOnly}
              onChange={e => handleDataChange({ name: e.target.value })}
              className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              placeholder="请输入清晰的节点名称"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-medium text-[11px]">节点说明 / 承办指导意见</label>
            <textarea
              rows={2}
              value={data.description || ''}
              disabled={readOnly}
              onChange={e => handleDataChange({ description: e.target.value })}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 resize-none"
              placeholder="说明此节点的业务背景与办理指导规范"
            />
          </div>
        </div>

        {/* 1. 开始节点 */}
        {type === 'start' && (
          <div className="flex flex-col gap-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <label className="font-bold text-slate-700">流程触发方式</label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'auto_create', label: '创建指令时自动触发', desc: '发起人通过模板填报并点击下发时立即启动' },
                { id: 'manual', label: '手动启动', desc: '经办人手工分派并核定后触发' },
                { id: 'api_trigger', label: '外部系统接口触发 (API/Webhook)', desc: '网安预警平台、指挥调度系统自动推送入库' }
              ].map(trig => (
                <label
                  key={trig.id}
                  className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                    (data.startTriggerType || 'auto_create') === trig.id
                      ? 'border-emerald-500 bg-emerald-50/60 font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="startTrigger"
                    disabled={readOnly}
                    checked={(data.startTriggerType || 'auto_create') === trig.id}
                    onChange={() => handleDataChange({ startTriggerType: trig.id as any })}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs">{trig.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{trig.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 2. 办理节点 */}
        {type === 'handle' && (
          <>
            {/* 接收对象（复用 ReceiverSelector） */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <ReceiverSelector
                value={data.receivers || []}
                readOnly={readOnly}
                onChange={newReceivers => handleDataChange({ receivers: newReceivers })}
                title="办理接收对象"
              />
            </div>

            {/* 办理方式 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">办理方式 (Handling Mode)</label>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                  核心流转机制
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'single', label: '单人办理', desc: '由指定唯一人员办理' },
                  { id: 'any', label: '任一人办理', desc: '部门或角色中任一人办结即完成' },
                  { id: 'countersign', label: '会签 (全部/最少数量)', desc: '全员签署或达成最少完成门槛' },
                  { id: 'or_sign', label: '或签 (任一人先行完成)', desc: '推送到多人，谁先完成谁抢办' },
                  { id: 'main_assistant', label: '主办 + 协办', desc: '主办人总揽提交，协办人协作提供' },
                  { id: 'multi_collab', label: '多人协同', desc: '允许多个经办人共同编辑与处理' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleDataChange({ handleMode: mode.id as HandleMode })}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                      (data.handleMode || 'any') === mode.id
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{mode.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{mode.desc}</span>
                  </button>
                ))}
              </div>

              {/* 会签深度配置：全部完成 / 最少完成数量 */}
              {data.handleMode === 'countersign' && (
                <div className="mt-2 p-2.5 bg-purple-50/80 border border-purple-200 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">会签完成规则：</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cs_condition"
                          disabled={readOnly}
                          checked={!data.countersignConfig?.finishCondition || data.countersignConfig?.finishCondition === 'all'}
                          onChange={() => handleDataChange({ 
                            countersignConfig: { finishCondition: 'all' } 
                          })}
                        />
                        <span className="text-xs text-purple-900">全部人员完成</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cs_condition"
                          disabled={readOnly}
                          checked={data.countersignConfig?.finishCondition === 'min_count'}
                          onChange={() => handleDataChange({ 
                            countersignConfig: { finishCondition: 'min_count', minCount: 3 } 
                          })}
                        />
                        <span className="text-xs text-purple-900">最少完成数量</span>
                      </label>
                    </div>
                  </div>

                  {data.countersignConfig?.finishCondition === 'min_count' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60">
                      <span className="text-[11px] text-purple-800">达成阈值：达到</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={data.countersignConfig?.minCount || 3}
                        disabled={readOnly}
                        onChange={e => handleDataChange({
                          countersignConfig: { 
                            finishCondition: 'min_count', 
                            minCount: Math.max(1, Number(e.target.value)) 
                          }
                        })}
                        className="w-14 h-7 px-2 border border-purple-300 rounded text-xs font-bold text-purple-900 bg-white"
                      />
                      <span className="text-[11px] text-purple-800">人签署即判定该节点通过</span>
                    </div>
                  )}
                </div>
              )}

              {/* 主办+协办配置 */}
              {data.handleMode === 'main_assistant' && (
                <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-xs">主办/协办权责分离：</span>
                    <span className="text-[10px] text-blue-600">主办人负责最终提交</span>
                  </div>
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-blue-100">
                    默认将接收对象中首位责任人置为主办人，其他成员自动转为协办人提交佐证材料。
                  </div>
                </div>
              )}
            </div>

            {/* 办理时限与超时规则 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2.5">
              <label className="font-bold text-slate-700">办理时限 (Time Limit)</label>
              <div className="flex items-center gap-2">
                <select
                  value={data.timeLimit?.type || 'fixed_duration'}
                  disabled={readOnly}
                  onChange={e => handleDataChange({
                    timeLimit: {
                      type: e.target.value as TimeLimitType,
                      duration: 3,
                      durationUnit: 'work_days'
                    }
                  })}
                  className="h-8 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800"
                >
                  <option value="fixed_duration">固定时长</option>
                  <option value="unlimited">不限时</option>
                  <option value="specified_date">指定绝对截止时间</option>
                  <option value="field_calc">按指令业务字段动态计算</option>
                </select>

                {(!data.timeLimit?.type || data.timeLimit.type === 'fixed_duration') && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      min={1}
                      value={data.timeLimit?.duration || 3}
                      disabled={readOnly}
                      onChange={e => handleDataChange({
                        timeLimit: {
                          ...data.timeLimit,
                          type: 'fixed_duration',
                          duration: Number(e.target.value)
                        }
                      })}
                      className="w-16 h-8 px-2 border border-slate-200 rounded text-xs font-bold text-slate-800 bg-white"
                    />
                    <select
                      value={data.timeLimit?.durationUnit || 'work_days'}
                      disabled={readOnly}
                      onChange={e => handleDataChange({
                        timeLimit: {
                          ...data.timeLimit,
                          type: 'fixed_duration',
                          durationUnit: e.target.value as any
                        }
                      })}
                      className="h-8 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800"
                    >
                      <option value="work_days">工作日</option>
                      <option value="natural_days">自然日</option>
                      <option value="hours">小时</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 超时管控策略 */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-600 text-[11px]">超时响应规则 (可多选)：</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'alert', label: '逾期提醒 (黄牌)' },
                    { id: 'urge', label: '督办催办 (红牌督办)' },
                    { id: 'notify_leader', label: '抄报分管局领导' },
                    { id: 'escalate', label: '自动升级流转' }
                  ].map(rule => {
                    const isChecked = (data.overdueRules || []).includes(rule.id as OverdueRule);
                    return (
                      <label
                        key={rule.id}
                        className={`p-1.5 rounded border flex items-center gap-1.5 cursor-pointer text-[11px] ${
                          isChecked ? 'border-amber-400 bg-amber-50/70 font-bold text-amber-900' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={isChecked}
                          onChange={e => {
                            const current = data.overdueRules || [];
                            const updated = e.target.checked
                              ? [...current, rule.id as OverdueRule]
                              : current.filter(r => r !== rule.id);
                            handleDataChange({ overdueRules: updated });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{rule.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 3. 审批节点 */}
        {type === 'approval' && (
          <>
            {/* 审批人对象 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <ReceiverSelector
                value={data.receivers || []}
                readOnly={readOnly}
                onChange={newReceivers => handleDataChange({ receivers: newReceivers })}
                title="配置审批人员 / 审批角色"
              />
            </div>

            {/* 审批方式 */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
              <label className="font-bold text-slate-700">审批方式</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'leader', label: '负责人审定', desc: '部门或分管领导终审' },
                  { id: 'single', label: '单人专审', desc: '指定审查专员' },
                  { id: 'countersign', label: '联合会审', desc: '相关部门共同会审签署' },
                  { id: 'or_sign', label: '首审生效', desc: '任一审批人审定即通过' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleDataChange({ approvalMode: mode.id as ApprovalMode })}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                      (data.approvalMode || 'leader') === mode.id
                        ? 'border-purple-500 bg-purple-50/70 text-purple-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{mode.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{mode.desc}</span>
                  </button>
                ))}
              </div>

              {/* 允许的审批动作 */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-600 text-[11px]">允许的核准动作：</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'pass', label: '同意通过' },
                    { id: 'return', label: '退回修改' },
                    { id: 'reject', label: '予以驳回' },
                    { id: 'transfer', label: '转交他人' },
                    { id: 'add_sign', label: '临时加签' }
                  ].map(act => {
                    const isChecked = (data.approvalActions || ['pass', 'return']).includes(act.id as ApprovalAction);
                    return (
                      <label
                        key={act.id}
                        className={`px-2 py-1 rounded border text-[11px] cursor-pointer flex items-center gap-1 ${
                          isChecked ? 'border-purple-400 bg-purple-50 text-purple-900 font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={isChecked}
                          onChange={e => {
                            const current = data.approvalActions || ['pass', 'return'];
                            const updated = e.target.checked
                              ? [...current, act.id as ApprovalAction]
                              : current.filter(a => a !== act.id);
                            handleDataChange({ approvalActions: updated });
                          }}
                        />
                        <span>{act.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 退回与驳回规则 */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-600">退回路径：</span>
                  <select
                    value={data.returnRule || 'to_previous'}
                    disabled={readOnly}
                    onChange={e => handleDataChange({ returnRule: e.target.value as any })}
                    className="h-7 px-1.5 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="to_previous">退回到上一步</option>
                    <option value="to_start">退回到流程发起人</option>
                    <option value="to_handler">退回到具体经办人</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-600">驳回影响：</span>
                  <select
                    value={data.rejectRule || 'end_process'}
                    disabled={readOnly}
                    onChange={e => handleDataChange({ rejectRule: e.target.value as any })}
                    className="h-7 px-1.5 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="end_process">直接终止流程</option>
                    <option value="re_draft">作废重新立项</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 4. 条件分支节点 */}
        {type === 'condition' && (
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <ConditionBuilder
              branches={data.conditionBranches || []}
              availableTargetNodes={otherNodes}
              readOnly={readOnly}
              onChange={newBranches => handleDataChange({ conditionBranches: newBranches })}
            />
          </div>
        )}

        {/* 5. 抄送节点 */}
        {type === 'cc' && (
          <>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <ReceiverSelector
                value={data.ccReceivers || []}
                readOnly={readOnly}
                onChange={newReceivers => handleDataChange({ ccReceivers: newReceivers })}
                title="抄送对象 (不阻断主流程)"
              />
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
              <label className="font-bold text-slate-700">抄送通知渠道</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'in_app_notice', label: '站内工作台消息' },
                  { id: 'sms', label: '政务专用短信通道' },
                  { id: 'wechat_work', label: '政务微信 / 企业微信' },
                  { id: 'dingtalk', label: '专网移动办公平台' }
                ].map(ch => {
                  const isChecked = (data.ccMethods || ['in_app_notice']).includes(ch.id as any);
                  return (
                    <label
                      key={ch.id}
                      className={`p-2 rounded border flex items-center gap-1.5 cursor-pointer text-xs ${
                        isChecked ? 'border-blue-400 bg-blue-50/70 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={isChecked}
                        onChange={e => {
                          const current = data.ccMethods || ['in_app_notice'];
                          const updated = e.target.checked
                            ? [...current, ch.id as any]
                            : current.filter(c => c !== ch.id);
                          handleDataChange({ ccMethods: updated });
                        }}
                      />
                      <span>{ch.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 6. 等待节点 */}
        {type === 'wait' && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2.5">
            <label className="font-bold text-slate-700">延时/等待规则</label>
            <div className="flex flex-col gap-2">
              <select
                value={data.waitType || 'fixed_duration'}
                disabled={readOnly}
                onChange={e => handleDataChange({ waitType: e.target.value as any })}
                className="h-8 px-2 border border-slate-200 rounded text-xs bg-white"
              >
                <option value="fixed_duration">等待固定时长后流转</option>
                <option value="specified_date">等待至指定时间点 (如周一上午9:00)</option>
                <option value="business_event">等待特定业务信号/外部事件</option>
              </select>

              {(!data.waitType || data.waitType === 'fixed_duration') && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">等待时长：</span>
                  <input
                    type="number"
                    min={1}
                    value={data.waitDuration || 2}
                    disabled={readOnly}
                    onChange={e => handleDataChange({ waitDuration: Number(e.target.value) })}
                    className="w-16 h-8 px-2 border border-slate-200 rounded text-xs font-bold"
                  />
                  <select
                    value={data.waitDurationUnit || 'hours'}
                    disabled={readOnly}
                    onChange={e => handleDataChange({ waitDurationUnit: e.target.value as any })}
                    className="h-8 px-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. 结束节点（预留业务结果事件 - 解耦积分与评价系统） */}
        {type === 'end' && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <label className="font-bold text-slate-800">业务结果事件声明 (预留积分评价对接)</label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              根据业务解耦设计，流程结束时不写死任何具体加扣分值，仅向系统总线广播「事实结果事件」，供未来独立的「评价与积分中心」自适应核算。
            </p>

            <div className="flex flex-col gap-1.5 mt-1">
              {MOCK_BUSINESS_EVENTS.map(evt => {
                const isSelected = (data.businessEvents || ['TASK_COMPLETED']).includes(evt.code);
                return (
                  <label
                    key={evt.code}
                    className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/70 font-bold text-emerald-950' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={isSelected}
                      onChange={e => {
                        const current = data.businessEvents || ['TASK_COMPLETED'];
                        const updated = e.target.checked
                          ? [...current, evt.code]
                          : current.filter(c => c !== evt.code);
                        handleDataChange({ businessEvents: updated });
                      }}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{evt.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">[{evt.code}]</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{evt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
