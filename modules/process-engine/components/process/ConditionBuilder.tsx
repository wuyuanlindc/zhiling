/**
 * 条件构建器组件 (ConditionBuilder)
 * 具备可视化规则引擎配置能力：
 * 1. 条件分支管理（+添加分支、默认兜底分支、目标节点绑定）
 * 2. 规则组合（AND/OR 关系切换、+添加规则条件、字段选择、操作符、对比值）
 * 3. 覆盖真实业务场景：
 *    - 金额条件 (涉案金额 >= 10000 走领导审批，否则走部门审批)
 *    - 日期条件 (今天是工作日 / 周末或节假日)
 *    - 字段条件 (紧急程度=特急 / 存在风险=是)
 *    - 业务结果 (办理结论=属实已整改)
 */

import React from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Layers, 
  HelpCircle,
  Split
} from 'lucide-react';
import { 
  ConditionBranch, 
  ConditionRule, 
  ConditionOperator, 
  FlowCanvasNode 
} from '../../types/processEngine';

interface ConditionBuilderProps {
  branches?: ConditionBranch[];
  availableTargetNodes: FlowCanvasNode[];
  onChange: (branches: ConditionBranch[]) => void;
  readOnly?: boolean;
}

// 可选业务字段字典（对应模板字段与系统上下文环境变量）
const FIELD_OPTIONS = [
  { key: 'amount', label: '涉案金额 (元)', type: 'number', defaultOp: 'gte', defaultVal: 10000 },
  { key: 'today_type', label: '日历属性 (工作日/节假日)', type: 'date_type', defaultOp: 'is_workday', defaultVal: 'workday' },
  { key: 'urgency', label: '任务紧急程度', type: 'select', defaultOp: 'eq', defaultVal: 'extreme', options: [
    { label: '普通', value: 'normal' },
    { label: '紧急', value: 'urgent' },
    { label: '特急', value: 'extreme' }
  ]},
  { key: 'risk_level', label: '预警风险等级', type: 'select', defaultOp: 'eq', defaultVal: 'major', options: [
    { label: '一般', value: 'general' },
    { label: '重大', value: 'major' },
    { label: '特急严重', value: 'severe' }
  ]},
  { key: 'is_has_risk', label: '是否存在重大涉案风险', type: 'boolean', defaultOp: 'eq', defaultVal: true },
  { key: 'verify_conclusion', label: '核查定性结论', type: 'select', defaultOp: 'eq', defaultVal: 'true_rectified', options: [
    { label: '属实已整改', value: 'true_rectified' },
    { label: '不实谣言', value: 'rumor' },
    { label: '待侦办', value: 'pending' }
  ]}
];

// 操作符字典
const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: '等于 (=)',
  neq: '不等于 (≠)',
  gt: '大于 (>)',
  gte: '大于等于 (≥)',
  lt: '小于 (<)',
  lte: '小于等于 (≤)',
  contains: '包含',
  in: '在集合中',
  is_workday: '是标准工作日',
  is_holiday: '是双休或法定节假日'
};

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  branches = [],
  availableTargetNodes,
  onChange,
  readOnly = false
}) => {

  // 添加新分支
  const handleAddBranch = () => {
    const newBranchId = `branch_${Date.now()}`;
    const newBranch: ConditionBranch = {
      id: newBranchId,
      name: `条件分支 ${branches.length + 1}`,
      relation: 'AND',
      rules: [
        {
          id: `rule_${Date.now()}`,
          field: 'amount',
          fieldName: '涉案金额 (元)',
          operator: 'gte',
          value: 10000,
          valueLabel: '10000'
        }
      ],
      targetNodeId: availableTargetNodes[0]?.id || ''
    };
    onChange([...branches, newBranch]);
  };

  // 移除分支
  const handleRemoveBranch = (branchId: string) => {
    onChange(branches.filter(b => b.id !== branchId));
  };

  // 修改分支属性
  const handleUpdateBranch = (branchId: string, partial: Partial<ConditionBranch>) => {
    onChange(branches.map(b => b.id === branchId ? { ...b, ...partial } : b));
  };

  // 向某个分支添加规则
  const handleAddRule = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    const newRule: ConditionRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      field: 'urgency',
      fieldName: '任务紧急程度',
      operator: 'eq',
      value: 'extreme',
      valueLabel: '特急'
    };
    handleUpdateBranch(branchId, {
      rules: [...branch.rules, newRule]
    });
  };

  // 更新某个分支内的单条规则
  const handleUpdateRule = (branchId: string, ruleId: string, partial: Partial<ConditionRule>) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    const updatedRules = branch.rules.map(r => {
      if (r.id !== ruleId) return r;
      const merged = { ...r, ...partial };
      // 如果字段改变，自动更新对应的默认操作符与名称
      if (partial.field && partial.field !== r.field) {
        const foundField = FIELD_OPTIONS.find(f => f.key === partial.field);
        if (foundField) {
          merged.fieldName = foundField.label;
          merged.operator = foundField.defaultOp as ConditionOperator;
          merged.value = foundField.defaultVal;
          merged.valueLabel = String(foundField.defaultVal);
        }
      }
      return merged;
    });
    handleUpdateBranch(branchId, { rules: updatedRules });
  };

  // 移除单条规则
  const handleRemoveRule = (branchId: string, ruleId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    handleUpdateBranch(branchId, {
      rules: branch.rules.filter(r => r.id !== ruleId)
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitFork className="w-4 h-4 text-orange-600" />
          <span className="font-bold text-slate-800">条件分支规则构建器</span>
          <span className="text-[10px] text-slate-400 font-normal">({branches.length} 个分支路径)</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddBranch}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md font-bold text-xs transition-colors cursor-pointer border border-orange-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加条件分支</span>
          </button>
        )}
      </div>

      {branches.length === 0 ? (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>⚠ 尚未定义任何条件分支。请至少添加一个满足分支和一个否则(兜底)分支。</span>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddBranch}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              立即新建
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {branches.map((branch, bIdx) => (
            <div 
              key={branch.id || bIdx}
              className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col gap-2.5 hover:border-orange-300 transition-colors"
            >
              {/* 分支头 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold text-[11px] flex items-center justify-center">
                    {bIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={branch.name}
                    disabled={readOnly}
                    onChange={e => handleUpdateBranch(branch.id, { name: e.target.value })}
                    className="font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-orange-500 outline-none px-1 py-0.5 text-xs bg-transparent"
                    placeholder="分支描述，如 金额 >= 10000"
                  />
                  {branch.isDefault && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                      默认兜底
                    </span>
                  )}
                </div>

                {!readOnly && branches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBranch(branch.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="删除该分支"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 规则关系切换 AND / OR */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">条件组合逻辑：</span>
                  <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleUpdateBranch(branch.id, { relation: 'AND' })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        branch.relation === 'AND' 
                          ? 'bg-orange-500 text-white shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AND (全部满足)
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleUpdateBranch(branch.id, { relation: 'OR' })}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        branch.relation === 'OR' 
                          ? 'bg-orange-500 text-white shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      OR (任一满足)
                    </button>
                  </div>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleAddRule(branch.id)}
                    className="text-[11px] text-orange-600 hover:text-orange-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加条件</span>
                  </button>
                )}
              </div>

              {/* 规则列表 */}
              <div className="flex flex-col gap-1.5 bg-[#F8FAFC] p-2 rounded-md border border-slate-100">
                {branch.rules.map((rule, rIdx) => {
                  const currentField = FIELD_OPTIONS.find(f => f.key === rule.field);

                  return (
                    <div 
                      key={rule.id || rIdx}
                      className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200"
                    >
                      {/* 字段选择 */}
                      <select
                        value={rule.field}
                        disabled={readOnly}
                        onChange={e => handleUpdateRule(branch.id, rule.id, { field: e.target.value })}
                        className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none focus:border-orange-500 min-w-[130px]"
                      >
                        {FIELD_OPTIONS.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </select>

                      {/* 操作符选择 */}
                      <select
                        value={rule.operator}
                        disabled={readOnly}
                        onChange={e => handleUpdateRule(branch.id, rule.id, { operator: e.target.value as ConditionOperator })}
                        className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none focus:border-orange-500 min-w-[100px]"
                      >
                        {currentField?.type === 'date_type' ? (
                          <>
                            <option value="is_workday">是标准工作日</option>
                            <option value="is_holiday">是周末/节假日</option>
                          </>
                        ) : currentField?.type === 'number' ? (
                          <>
                            <option value="gte">大于等于 (≥)</option>
                            <option value="gt">大于 (&gt;)</option>
                            <option value="lte">小于等于 (≤)</option>
                            <option value="lt">小于 (&lt;)</option>
                            <option value="eq">等于 (=)</option>
                          </>
                        ) : (
                          <>
                            <option value="eq">等于 (=)</option>
                            <option value="neq">不等于 (≠)</option>
                            <option value="contains">包含</option>
                          </>
                        )}
                      </select>

                      {/* 值输入 */}
                      {currentField?.type === 'date_type' ? (
                        <span className="h-7 px-2 flex items-center text-[11px] text-slate-500 bg-slate-50 rounded border border-slate-200 flex-1">
                          系统自动读取国家法定工作日历
                        </span>
                      ) : currentField?.type === 'boolean' ? (
                        <select
                          value={rule.value ? 'true' : 'false'}
                          disabled={readOnly}
                          onChange={e => handleUpdateRule(branch.id, rule.id, { value: e.target.value === 'true', valueLabel: e.target.value === 'true' ? '是' : '否' })}
                          className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 flex-1"
                        >
                          <option value="true">是 (TRUE)</option>
                          <option value="false">否 (FALSE)</option>
                        </select>
                      ) : currentField?.options ? (
                        <select
                          value={rule.value}
                          disabled={readOnly}
                          onChange={e => {
                            const opt = currentField.options?.find(o => o.value === e.target.value);
                            handleUpdateRule(branch.id, rule.id, { value: e.target.value, valueLabel: opt?.label });
                          }}
                          className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 flex-1"
                        >
                          {currentField.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={currentField?.type === 'number' ? 'number' : 'text'}
                          value={rule.value}
                          disabled={readOnly}
                          onChange={e => handleUpdateRule(branch.id, rule.id, { 
                            value: currentField?.type === 'number' ? Number(e.target.value) : e.target.value,
                            valueLabel: e.target.value
                          })}
                          placeholder="比对值"
                          className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 flex-1 outline-none focus:border-orange-500"
                        />
                      )}

                      {!readOnly && branch.rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(branch.id, rule.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                          title="删除该条条件"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 目标流向节点绑定 */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <ArrowRight className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-600 shrink-0">满足时流向：</span>
                <select
                  value={branch.targetNodeId}
                  disabled={readOnly}
                  onChange={e => handleUpdateBranch(branch.id, { targetNodeId: e.target.value })}
                  className="h-7 px-2 border border-slate-200 rounded text-xs bg-white text-slate-800 flex-1 focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="">-- 请选择目标流向节点 --</option>
                  {availableTargetNodes.map(node => (
                    <option key={node.id} value={node.id}>
                      [{node.data.name}] ({node.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
