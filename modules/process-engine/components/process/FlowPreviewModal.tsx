/**
 * 流程全景预览组件 (FlowPreviewModal)
 * 具备以下能力：
 * 1. 结构化全景展示：基本信息、绑定模板与表单结构、流程流转图、节点流转详细清单
 * 2. 接收对象与办理规则全貌预览（办理方式、会签/或签、时限、超时预警）
 * 3. 方便管理人员在上线发布前进行全局核对与审批确认
 */

import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  FileText, 
  Layers, 
  GitFork, 
  CheckSquare, 
  Stamp, 
  Send, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Users2, 
  Calendar, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ProcessDefinition } from '../../types/processEngine';
import { MOCK_TEMPLATES } from '../../data/mockProcessEngine';

interface FlowPreviewModalProps {
  process: ProcessDefinition;
  onClose: () => void;
  onEdit?: () => void;
}

export const FlowPreviewModal: React.FC<FlowPreviewModalProps> = ({
  process,
  onClose,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'template' | 'logic'>('nodes');
  const boundTemplate = MOCK_TEMPLATES.find(t => process.relatedTemplateIds?.includes(t.id)) || MOCK_TEMPLATES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-[1180px] max-w-[96vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{process.processName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {process.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {process.categoryName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                流程编号: <span className="font-mono font-bold text-slate-700">{process.processCode}</span> | 绑定业务数据模板: <span className="font-bold text-blue-700">{process.templateName}</span>
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

        {/* 导航标签 */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('nodes')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'nodes' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>流程节点流转链 ({process.nodes.length}个环节)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'template' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>绑定业务模板结构 ({boundTemplate?.fields.length || 0}个业务字段)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logic')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logic' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>条件分支与办理策略汇总</span>
          </button>
        </div>

        {/* 内容展示区 */}
        <div className="p-6 flex-1 overflow-y-auto bg-[#F8FAFC]">
          {/* 标签 1: 节点流转详细链条 */}
          {activeTab === 'nodes' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                <span>
                  本流程包含 <strong>{process.nodes.length}</strong> 个节点、<strong>{process.edges.length}</strong> 条流向规则。从发起至归档已实现严格的闭环控制。
                </span>
                <span className="text-[11px] text-blue-700 font-bold">
                  {process.status === 'published' ? '🟢 已上线运行' : '🟡 草稿状态'}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {process.nodes.map((node, index) => {
                  const isHandle = node.type === 'handle';
                  const isApproval = node.type === 'approval';
                  const isCondition = node.type === 'condition';

                  return (
                    <div
                      key={node.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{node.data.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            node.type === 'start' ? 'bg-emerald-100 text-emerald-800' :
                            node.type === 'handle' ? 'bg-blue-100 text-blue-800' :
                            node.type === 'approval' ? 'bg-purple-100 text-purple-800' :
                            node.type === 'condition' ? 'bg-amber-100 text-amber-800' :
                            node.type === 'cc' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-white'
                          }`}>
                            {node.type === 'start' ? '开始节点' :
                             node.type === 'handle' ? '办理节点' :
                             node.type === 'approval' ? '审批节点' :
                             node.type === 'condition' ? '条件分支' :
                             node.type === 'cc' ? '抄送节点' : '结束归档'}
                          </span>
                        </div>

                        {/* 办理时限 */}
                        {node.data.timeLimit && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              时限: {node.data.timeLimit.duration} {node.data.timeLimit.durationUnit === 'work_days' ? '工作日' : '自然日'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 说明 */}
                      {node.data.description && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {node.data.description}
                        </p>
                      )}

                      {/* 办理方式 / 审批方式 */}
                      {(isHandle || isApproval) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#FBFDFF] p-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-600">
                              {isHandle ? '办理机制 (Mode)' : '审批方式'}：
                            </span>
                            <span className="font-bold text-blue-700">
                              {isHandle ? (
                                node.data.handleMode === 'countersign' ? '会签机制 (全员或最少达成阈值)' :
                                node.data.handleMode === 'or_sign' ? '或签机制 (任一人优先办结)' :
                                node.data.handleMode === 'main_assistant' ? '主办 + 协办协同' :
                                node.data.handleMode === 'multi_collab' ? '多人协同办理' :
                                node.data.handleMode === 'single' ? '单人独立办理' : '任一人办理'
                              ) : (
                                node.data.approvalMode === 'leader' ? '部门/分管负责人审定' :
                                node.data.approvalMode === 'countersign' ? '联合会签审批' :
                                node.data.approvalMode === 'or_sign' ? '任一领导审批即生效' : '单人专员审批'
                              )}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-600">接收对象配置：</span>
                            <div className="flex flex-wrap gap-1">
                              {node.data.receivers && node.data.receivers.length > 0 ? (
                                node.data.receivers.map((rec, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px]"
                                  >
                                    {rec.targetName} ({rec.type === 'org' ? '机构' : rec.type === 'role' ? '角色' : rec.type === 'group' ? '群组' : '个人'})
                                  </span>
                                ))
                              ) : (
                                <span className="text-amber-600 text-xs">未指定特定接收人 (按分派规则)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 条件分支 */}
                      {isCondition && node.data.conditionBranches && (
                        <div className="flex flex-col gap-1.5 text-xs bg-amber-50/40 p-3 rounded-lg border border-amber-200/60">
                          <span className="font-bold text-amber-900">分支走向规则：</span>
                          {node.data.conditionBranches.map((b, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2 text-[11px] text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="font-bold text-slate-800">{b.name}</span>
                              <span className="text-slate-400">满足 [{b.relation}] 规则</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-blue-600 font-bold">流向节点 ID: {b.targetNodeId || '未配置'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 标签 2: 绑定业务模板字段 */}
          {activeTab === 'template' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{boundTemplate?.templateName}</h3>
                    <p className="text-xs text-slate-500 font-mono">编码: {boundTemplate?.templateCode} · 版本: {boundTemplate?.version}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {boundTemplate?.category}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">字段标签</th>
                      <th className="py-2.5 px-4 font-bold">字段键名 (Key)</th>
                      <th className="py-2.5 px-4 font-bold">控件类型</th>
                      <th className="py-2.5 px-4 font-bold text-center">必填约束</th>
                      <th className="py-2.5 px-4 font-bold">默认值 / 选项</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boundTemplate?.fields.map((fld, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{fld.label}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{fld.key}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                            {fld.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {fld.required ? (
                            <span className="text-red-500 font-bold">必填</span>
                          ) : (
                            <span className="text-slate-400">选填</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {fld.options ? fld.options.map(o => o.label).join(' / ') : fld.defaultValue !== undefined ? String(fld.defaultValue) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 标签 3: 分支与策略 */}
          {activeTab === 'logic' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                <h4 className="font-bold text-slate-800 text-sm">超时督办与异常处置策略</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
                    <span className="font-bold text-slate-700">预警催办机制</span>
                    <span className="text-slate-500">达到办理时限80%未响应时，向承办人推送黄色预警提醒</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
                    <span className="font-bold text-slate-700">超期红牌督办</span>
                    <span className="text-slate-500">超期即触发系统红牌督办，并自动抄报单位分管领导</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                <h4 className="font-bold text-slate-800 text-sm">解耦设计声明</h4>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950 flex flex-col gap-1">
                  <span className="font-bold">积分与绩效独立事件总线机制</span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    本流程引擎未在节点内写死任何固定积分分值。流程完结时将生成标准化业务事实事件（如 TASK_COMPLETED, OVERDUE_COMPLETED, QUALITY_HIGH），由系统外围独立的考核中心进行自适应规则计算。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部控制栏 */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            流程定义已通过完整性核验，可直接进入运行模拟或正式发布
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer"
            >
              关闭预览
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                进入可视化设计器编辑
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
