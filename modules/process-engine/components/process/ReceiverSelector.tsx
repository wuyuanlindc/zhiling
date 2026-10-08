/**
 * 接收对象高级选择器组件 (ReceiverSelector)
 * 支持：
 * 1. 组织节点 (组织层级 + 接收范围: 当前组织/当前组织及下级/指定组织/全域 + 可选部门 + 可选角色)
 * 2. 角色 (单位负责人、部门负责人、普通办理人员、审批人员、值班人员、网评员等)
 * 3. 群组 (专项行动工作组、重大活动保障组、舆情处置工作组、节假日值班组)
 * 4. 指定人员 (张三、李四、王五、赵六、钱七)
 * 组合能力：“济南市公安局及下属单位 + 部门负责人” 或 “专项工作组 + 张三”
 */

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users2, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { ReceiverItem, ReceiverType, ReceiverScope } from '../../types/processEngine';
import { MOCK_ORGS, MOCK_ROLES, MOCK_GROUPS, MOCK_USERS } from '../../data/mockProcessEngine';

interface ReceiverSelectorProps {
  value?: ReceiverItem[];
  onChange: (items: ReceiverItem[]) => void;
  title?: string;
  readOnly?: boolean;
}

export const ReceiverSelector: React.FC<ReceiverSelectorProps> = ({
  value = [],
  onChange,
  title = '配置接收对象',
  readOnly = false
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);

  // 弹窗内当前正在编辑/构建的选项状态
  const [activeTab, setActiveTab] = useState<ReceiverType>('org');
  const [scope, setScope] = useState<ReceiverScope>('current_and_sub');
  const [selectedOrgId, setSelectedOrgId] = useState('dept_bgs');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('role_dept_leader');
  const [selectedGroupId, setSelectedGroupId] = useState('grp_special_action');
  const [selectedUserId, setSelectedUserId] = useState('usr_zhangsan');

  // 生成当前组合预览文字
  const generateCurrentPreview = () => {
    if (activeTab === 'org') {
      const orgObj = MOCK_ORGS.find(o => o.id === selectedOrgId);
      const roleObj = MOCK_ROLES.find(r => r.id === selectedRoleFilter);
      const scopeLabel = 
        scope === 'current_org' ? '当前组织' :
        scope === 'current_and_sub' ? '当前组织及下级' :
        scope === 'specified_org' ? '指定组织' : '全域';

      let text = `${scopeLabel} · ${orgObj?.name || '所有机构'}`;
      if (roleObj) {
        text += ` 的 [${roleObj.name}]`;
      } else {
        text += ` 的所有符合人员`;
      }
      return text;
    }
    if (activeTab === 'role') {
      const roleObj = MOCK_ROLES.find(r => r.id === selectedRoleId);
      return `全域角色 · [${roleObj?.name || '未选角色'}]`;
    }
    if (activeTab === 'group') {
      const grpObj = MOCK_GROUPS.find(g => g.id === selectedGroupId);
      return `跨机构临时群组 · [${grpObj?.name || '未选群组'}] (${grpObj?.memberCount || 0}人)`;
    }
    if (activeTab === 'user') {
      const userObj = MOCK_USERS.find(u => u.id === selectedUserId);
      return `指定人员 · [${userObj?.name || '未选人员'}] (${userObj?.org} - ${userObj?.role})`;
    }
    return '';
  };

  // 添加到已选清单
  const handleConfirmAdd = () => {
    const newItemId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newItem: ReceiverItem;

    if (activeTab === 'org') {
      const orgObj = MOCK_ORGS.find(o => o.id === selectedOrgId);
      const roleObj = MOCK_ROLES.find(r => r.id === selectedRoleFilter);
      newItem = {
        id: newItemId,
        type: 'org',
        scope,
        targetId: selectedOrgId,
        targetName: orgObj?.name || '指定部门',
        orgName: orgObj?.name,
        roleId: selectedRoleFilter || undefined,
        roleName: roleObj?.name || undefined,
        description: generateCurrentPreview()
      };
    } else if (activeTab === 'role') {
      const roleObj = MOCK_ROLES.find(r => r.id === selectedRoleId);
      newItem = {
        id: newItemId,
        type: 'role',
        scope: 'all',
        targetId: selectedRoleId,
        targetName: roleObj?.name || '角色',
        roleId: selectedRoleId,
        roleName: roleObj?.name,
        description: generateCurrentPreview()
      };
    } else if (activeTab === 'group') {
      const grpObj = MOCK_GROUPS.find(g => g.id === selectedGroupId);
      newItem = {
        id: newItemId,
        type: 'group',
        scope: 'all',
        targetId: selectedGroupId,
        targetName: grpObj?.name || '临时群组',
        description: generateCurrentPreview()
      };
    } else {
      const userObj = MOCK_USERS.find(u => u.id === selectedUserId);
      newItem = {
        id: newItemId,
        type: 'user',
        scope: 'all',
        targetId: selectedUserId,
        targetName: userObj?.name || '指定人员',
        description: generateCurrentPreview()
      };
    }

    onChange([...value, newItem]);
    setIsOpenModal(false);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 w-full text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <span>{title}</span>
          <span className="text-[10px] text-slate-400 font-normal">({value.length} 个配置)</span>
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-xs transition-colors cursor-pointer border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加接收对象</span>
          </button>
        )}
      </div>

      {/* 已选列表展示 */}
      {value.length === 0 ? (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-700 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span>⚠ 尚未配置接收对象，流程流转时将无法确定目标人员</span>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="text-blue-600 underline font-bold cursor-pointer hover:text-blue-800"
            >
              立即配置
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {value.map((item, idx) => {
            const badgeIcon = 
              item.type === 'org' ? <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> :
              item.type === 'role' ? <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" /> :
              item.type === 'group' ? <Users2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> :
              <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />;

            const tagColor = 
              item.type === 'org' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              item.type === 'role' ? 'bg-purple-50 border-purple-200 text-purple-800' :
              item.type === 'group' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              'bg-amber-50 border-amber-200 text-amber-800';

            return (
              <div 
                key={item.id || idx}
                className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className={`p-1 rounded ${tagColor} border`}>
                    {badgeIcon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 truncate">{item.targetName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${tagColor} border`}>
                        {item.type === 'org' ? '组织节点' : item.type === 'role' ? '角色' : item.type === 'group' ? '群组' : '指定人员'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate" title={item.description}>
                      {item.description}
                    </span>
                  </div>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="移除此接收对象"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 弹窗选择器 */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white w-[640px] max-w-[95vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* 弹窗头部 */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">高级接收对象配置器</h3>
                  <p className="text-[11px] text-slate-500">支持「接收范围 + 组织 + 角色/群组/人员」多维度复合规则</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 标签栏（四种核心接收类型） */}
            <div className="px-5 pt-3 border-b border-slate-100 flex gap-2 bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('org')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'org' 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. 组织节点</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('role')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'role' 
                    ? 'border-purple-600 text-purple-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2. 角色</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('group')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'group' 
                    ? 'border-emerald-600 text-emerald-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users2 className="w-3.5 h-3.5" />
                <span>3. 临时群组</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('user')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'user' 
                    ? 'border-amber-600 text-amber-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>4. 指定人员</span>
              </button>
            </div>

            {/* 选项内容区 */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 bg-[#F8FAFC]">
              {/* Tab 1: 组织节点（范围 + 组织 + 角色） */}
              {activeTab === 'org' && (
                <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 text-xs">第一步：选择接收范围 (Scope)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'current_and_sub', label: '当前组织及下级', desc: '包含本级与所辖各基层部门' },
                        { id: 'current_org', label: '当前组织', desc: '仅限本级机构直属人员' },
                        { id: 'specified_org', label: '指定组织', desc: '针对明确指定的独立机构' },
                        { id: 'all', label: '全域', desc: '跨层级跨区域全范围' }
                      ].map(sc => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setScope(sc.id as ReceiverScope)}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                            scope === sc.id 
                              ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-2xs font-bold' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="text-xs">{sc.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{sc.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-700 text-xs">第二步：选择目标组织/部门</label>
                    <select
                      value={selectedOrgId}
                      onChange={e => setSelectedOrgId(e.target.value)}
                      className="h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {MOCK_ORGS.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.level === 1 ? '🏢 ' : '  └─ 📁 '}
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs">第三步：限定角色（可选，不选则发给该部门符合办理规则的全员）</label>
                      {selectedRoleFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedRoleFilter('')}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          清除角色限定
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedRoleFilter}
                      onChange={e => setSelectedRoleFilter(e.target.value)}
                      className="h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">全部人员（不限角色）</option>
                      {MOCK_ROLES.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} - ({r.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 2: 角色 */}
              {activeTab === 'role' && (
                <div className="flex flex-col gap-2.5 bg-white p-4 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-xs">请选择全域职责角色</span>
                  <p className="text-[11px] text-slate-500">发送到该角色的所有在岗持有者（如所有“部门负责人”或所有“值班人员”）</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {MOCK_ROLES.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                          selectedRoleId === role.id 
                            ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{role.name}</span>
                          {selectedRoleId === role.id && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">{role.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: 群组 */}
              {activeTab === 'group' && (
                <div className="flex flex-col gap-2.5 bg-white p-4 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-xs">选择跨部门专项协作临时群组</span>
                  <p className="text-[11px] text-slate-500">临时人员集合，包含跨机构、跨部门、跨角色的指定工作专班</p>
                  <div className="flex flex-col gap-2 mt-1">
                    {MOCK_GROUPS.map(grp => (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setSelectedGroupId(grp.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                          selectedGroupId === grp.id 
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{grp.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{grp.desc}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {grp.memberCount} 人
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: 指定人员 */}
              {activeTab === 'user' && (
                <div className="flex flex-col gap-2.5 bg-white p-4 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-xs">指定具体经办/审签人员</span>
                  <p className="text-[11px] text-slate-500">直派至个人工作台，责任精准到人</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {MOCK_USERS.map(usr => (
                      <button
                        key={usr.id}
                        type="button"
                        onClick={() => setSelectedUserId(usr.id)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                          selectedUserId === usr.id 
                            ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{usr.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{usr.role}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal truncate">{usr.org}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 实时组合生效效果预览 */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-700 shrink-0">组合结果：</span>
                  <span className="font-semibold">{generateCurrentPreview()}</span>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认添加对象</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
