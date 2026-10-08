/**
 * Step 3: 流程设计流转拓扑工作台 (FlowDesignerStep)
 * 具备以下能力：
 * 1. 节点属性全屏高覆盖抽屉 (上下全覆盖，覆盖顶栏上一步、下一步、测试、保存、发布等按钮，右侧全部覆盖)
 * 2. 审批节点与处理节点的差异化配置：
 *    - 审批节点：表头包含【审批人】、【审批按钮】、【设置字段权限】、【高级设置】
 *      - 审批按钮从上到下按顺序排列：
 *        1. 同意（审核通过并流转至下一环节）
 *        2. 拒绝（若审批人操作拒绝，则审批单终止）
 *        3. 保存（若审批人点击保存，则关闭页面，再次进入的时候会保留已经填写过的信息）
 *        4. 转交（将当前审批任务转派给其他责任人办理）
 *        5. 退回（通过选择前面的节点进行退回操作，在该节点重新进行审批）
 *        6. 收回（当下一次节审批节点执行节点未操作时，可以收回到当前节点重新处理）
 *    - 处理节点/执行节点：表头仅有【执行人】、【操作按钮】、【设置字段权限】、【高级设置】
 *      - 操作按钮从上到下按顺序排列：
 *        1. 提交（完成当前节点任务办理并提交至下一环节）
 *        2. 保存（若点击保存，则关闭页面，再次进入的时候会保留已经填写过的信息）
 *        3. 转交（将任务转派给其他科室或人员处理）
 *        4. 退回（通过选择前面的节点进行退回操作，在该节点重新进行审批）
 *        5. 收回（当下一次节审批节点执行节点未操作时，可以收回到当前节点重新处理）
 * 3. 开启后标识按钮可执行状态
 * 4. 左侧流转节点库已精简并包含【消息通知】节点
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FlowStepNodeItem, 
  FlowNodeCategory, 
  FlowBranchItem,
  FlowBranchConditionRule,
  FormWidgetComponent 
} from '../../../types/processEngine';
import { MOCK_USERS, MOCK_TEMPLATES } from '../../../data/mockProcessEngine';
import { 
  Plus, 
  Trash2, 
  User, 
  UserPlus,
  Clock, 
  CheckCircle2, 
  Send, 
  FileCheck, 
  ArrowLeft,
  ArrowRight, 
  Share2, 
  Sparkles,
  Info,
  Check,
  GripVertical,
  Play,
  AlertCircle,
  AlertTriangle,
  Lock,
  Bell,
  Pencil,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  HelpCircle,
  Settings2,
  CheckSquare,
  Square,
  MessageSquare,
  Mail,
  Zap,
  SlidersHorizontal,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitFork,
  Split,
  GitMerge,
  Calculator,
  Building2,
  Users,
  ShieldCheck,
  Search,
  Forward
} from 'lucide-react';
import { FormulaEditorModal } from './FormulaEditorModal';

export interface SystemOrgMemberItem {
  id: string;
  name: string;
  phone: string;
  org: string;
  role: string;
  avatarBg?: string;
}

export interface DetailedTimeoutRule {
  id: string;
  triggerType: 'after_timeout' | 'before_timeout' | 'after_arrival' | 'after_node_reach';
  timeValue: number;
  timeUnit?: 'hours' | 'days';
  triggerHours?: number;
  actionType: 'remind' | 'auto_pass' | 'transfer' | 'auto_reject' | 'jump';
  remindTargets?: ('assignee' | 'initiator' | 'supervisor' | 'admin')[];
  remindChannels?: ('app' | 'wecom' | 'sms' | 'email')[];
  repeatRemind?: boolean;
  repeatIntervalHours?: number;
  maxRepeatCount?: number;
  customMessage?: string;
  transferType?: 'supervisor' | 'specified' | 'admin';
  transferMember?: { id: string; name: string; org?: string; role?: string; avatarBg?: string };
  transferTargetType?: 'leader' | 'admin' | 'specified';
  transferMembers?: SystemOrgMemberItem[];
  opinion?: string;
  jumpTargetNodeId?: string;
  jumpTargetNodeName?: string;
  notifyTargets?: string[];
  notifyChannels?: string[];
  isRecurring?: boolean;
  recurringIntervalHours?: number;
  recurringMaxCount?: number;
  desc?: string;
  enabled?: boolean;
}

export const generateTimeoutRuleDesc = (rule: Partial<DetailedTimeoutRule>): string => {
  const hours = rule.timeValue || rule.triggerHours || 2;
  const unit = rule.timeUnit === 'days' ? '天' : '小时';
  const timeStr = `${hours} ${unit}`;

  const triggerText = rule.triggerType === 'before_timeout'
    ? `距离超时前 ${timeStr}`
    : (rule.triggerType === 'after_node_reach' || rule.triggerType === 'after_arrival')
    ? `进入节点后 ${timeStr}`
    : `超时 ${timeStr}`;

  let actionText = '';
  if (rule.actionType === 'auto_pass') {
    actionText = `系统自动代办同意流转至下一环节${rule.opinion ? `（附言：“${rule.opinion}”）` : ''}`;
  } else if (rule.actionType === 'auto_reject') {
    actionText = `系统自动拒绝并终止流程${rule.opinion ? `（原因：“${rule.opinion}”）` : ''}`;
  } else if (rule.actionType === 'transfer') {
    if (rule.transferType === 'admin' || rule.transferTargetType === 'admin') {
      actionText = '自动转交至系统管理员代办处理';
    } else if (rule.transferType === 'specified' || rule.transferTargetType === 'specified') {
      const target = rule.transferMember?.name || (rule.transferMembers && rule.transferMembers.length > 0 ? rule.transferMembers.map(m => m.name).join('、') : '指定成员');
      actionText = `自动转交至指定成员「${target}」代办处理`;
    } else {
      actionText = '自动转交至直属主管代办处理';
    }
  } else if (rule.actionType === 'jump') {
    actionText = `自动跳转至指定环节「${rule.jumpTargetNodeName || '指定环节'}」`;
  } else {
    // remind
    const targetMap: Record<string, string> = {
      'assignee': '当前处理人',
      'leader': '直属主管',
      'supervisor': '直属主管',
      'initiator': '工单发起人',
      'admin': '系统管理员'
    };
    const rawTargets = rule.remindTargets || rule.notifyTargets || ['assignee'];
    const targets = rawTargets.map(t => targetMap[t] || t).join('、');

    const channelMap: Record<string, string> = {
      'work_wechat': '企微/钉钉',
      'wecom': '企业微信/钉钉',
      'in_app': '站内消息',
      'app': '站内消息',
      'sms': '短信通知',
      'dingtalk': '钉钉通知',
      'email': '邮件通知'
    };
    const rawChannels = rule.remindChannels || rule.notifyChannels || ['wecom', 'app'];
    const channels = rawChannels.map(c => channelMap[c] || c).join(' / ');

    let recur = '';
    if (rule.repeatRemind || rule.isRecurring) {
      const interval = rule.repeatIntervalHours || rule.recurringIntervalHours || 2;
      const maxCount = rule.maxRepeatCount || rule.recurringMaxCount || 3;
      recur = `，每隔 ${interval} 小时重复提醒（最多 ${maxCount} 次）`;
    }
    actionText = `通过「${channels}」向「${targets}」发送催办提醒${recur}`;
  }

  return `【${triggerText}】${actionText}`;
};

export const ALL_SYSTEM_PERSONNEL: SystemOrgMemberItem[] = [
  { id: 'usr_1', name: '张建国', phone: '13800100001', org: '市公安局 / 办公室', role: '部门负责人', avatarBg: 'bg-blue-600' },
  { id: 'usr_2', name: '李红艳', phone: '13800100002', org: '市公安局 / 网安支队', role: '专职审批人员', avatarBg: 'bg-purple-600' },
  { id: 'usr_3', name: '王强', phone: '13800100003', org: '历下分局 / 治安大队', role: '普通办理人员', avatarBg: 'bg-emerald-600' },
  { id: 'usr_4', name: '赵德民', phone: '13800100004', org: '历下分局 / 办公室', role: '单位负责人', avatarBg: 'bg-indigo-600' },
  { id: 'usr_5', name: '刘芳', phone: '13800100005', org: '市公安局 / 指挥中心', role: '值班人员', avatarBg: 'bg-amber-600' },
  { id: 'usr_6', name: '孙伟', phone: '13800100006', org: '市公安局 / 宣传处', role: '网评员', avatarBg: 'bg-teal-600' },
  { id: 'usr_7', name: '钱文峰', phone: '13800100007', org: '治安支队 / 一大队', role: '单位负责人', avatarBg: 'bg-rose-600' },
  { id: 'usr_8', name: '周小敏', phone: '13800100008', org: '市公安局 / 办公室', role: '普通办理人员', avatarBg: 'bg-sky-600' },
  { id: 'usr_9', name: '吴永明', phone: '13800100009', org: '市公安局 / 网安支队', role: '系统管理员', avatarBg: 'bg-cyan-600' },
  { id: 'usr_10', name: '郑海涛', phone: '13800100010', org: '市公安局 / 指挥中心', role: '部门负责人', avatarBg: 'bg-blue-700' },
  { id: 'usr_11', name: '冯丽丽', phone: '13800100011', org: '历下分局 / 办公室', role: '专职审批人员', avatarBg: 'bg-violet-600' },
  { id: 'usr_12', name: '陈志华', phone: '13800100012', org: '治安支队 / 一大队', role: '普通办理人员', avatarBg: 'bg-emerald-700' },
];

export const ORG_TREE_LIST = [
  { id: 'ALL', name: '全部机构科室', count: 12 },
  { id: '市公安局 / 办公室', name: '市公安局 / 办公室', count: 2 },
  { id: '市公安局 / 网安支队', name: '市公安局 / 网安支队', count: 2 },
  { id: '市公安局 / 指挥中心', name: '市公安局 / 指挥中心', count: 2 },
  { id: '市公安局 / 宣传处', name: '市公安局 / 宣传处', count: 1 },
  { id: '历下分局 / 办公室', name: '历下分局 / 办公室', count: 2 },
  { id: '历下分局 / 治安大队', name: '历下分局 / 治安大队', count: 1 },
  { id: '治安支队 / 一大队', name: '治安支队 / 一大队', count: 2 },
];

export const ROLE_DICTIONARY_LIST = [
  { id: 'ALL', name: '全部角色', count: 12 },
  { id: '单位负责人', name: '单位负责人', desc: '拥有最终核准权', count: 2 },
  { id: '部门负责人', name: '部门负责人', desc: '处室/科所主管', count: 2 },
  { id: '专职审批人员', name: '专职审批人员', desc: '业务审查与合规审核', count: 2 },
  { id: '普通办理人员', name: '普通办理人员', desc: '具体业务承办经办', count: 3 },
  { id: '值班人员', name: '值班人员', desc: '应急值守调度', count: 1 },
  { id: '网评员', name: '网评员', desc: '网络生态巡查专员', count: 1 },
  { id: '系统管理员', name: '系统管理员', desc: '运维与系统配置', count: 1 },
];

interface NodeButtonConfig {
  key: string;
  label: string;
  displayName: string;
  opinionPolicy: string;
  allowBatch?: boolean;
  batchChecked?: boolean;
  enabled: boolean;
  tip?: string;
}

// 审批节点的标准按钮清单 (从上到下：同意、拒绝、保存、转交、退回、收回)
const APPROVAL_BUTTON_DEFINITIONS: NodeButtonConfig[] = [
  {
    key: 'agree',
    label: '同意',
    displayName: '同意',
    opinionPolicy: '「非必填」同意',
    allowBatch: true,
    batchChecked: false,
    enabled: true,
    tip: '审核通过并流转至下一环节'
  },
  {
    key: 'refuse',
    label: '拒绝',
    displayName: '拒绝',
    opinionPolicy: '「非必填」拒绝',
    allowBatch: true,
    batchChecked: false,
    enabled: false,
    tip: '若审批人操作拒绝，则审批单终止'
  },
  {
    key: 'save',
    label: '保存',
    displayName: '保存',
    opinionPolicy: '--',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '若审批人点击保存，则关闭页面，再次进入的时候会保留已经填写过的信息'
  },
  {
    key: 'transfer',
    label: '转交',
    displayName: '转交',
    opinionPolicy: '「非必填」转交',
    allowBatch: false,
    batchChecked: false,
    enabled: true,
    tip: '将当前审批任务转派给其他责任人办理'
  },
  {
    key: 'reject',
    label: '退回',
    displayName: '退回',
    opinionPolicy: '「必填」退回',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '通过选择前面的节点进行退回操作，在该节点重新进行审批'
  },
  {
    key: 'recall',
    label: '收回',
    displayName: '收回',
    opinionPolicy: '--',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '当下一次节审批节点执行节点未操作时，可以收回到当前节点重新处理'
  }
];

// 执行节点/处理节点的标准按钮清单 (从上到下：提交、保存、转交、退回、收回)
const HANDLE_BUTTON_DEFINITIONS: NodeButtonConfig[] = [
  {
    key: 'submit',
    label: '提交',
    displayName: '提交',
    opinionPolicy: '「非必填」提交',
    allowBatch: false,
    batchChecked: false,
    enabled: true,
    tip: '完成当前节点任务办理并提交至下一环节'
  },
  {
    key: 'save',
    label: '保存',
    displayName: '保存',
    opinionPolicy: '--',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '若审批人点击保存，则关闭页面，再次进入的时候会保留已经填写过的信息'
  },
  {
    key: 'transfer',
    label: '转交',
    displayName: '转交',
    opinionPolicy: '「非必填」转交',
    allowBatch: false,
    batchChecked: false,
    enabled: true,
    tip: '将当前任务转派给其他责任人办理'
  },
  {
    key: 'reject',
    label: '退回',
    displayName: '退回',
    opinionPolicy: '「必填」退回',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '通过选择前面的节点进行退回操作，在该节点重新进行审批'
  },
  {
    key: 'recall',
    label: '收回',
    displayName: '收回',
    opinionPolicy: '--',
    allowBatch: false,
    batchChecked: false,
    enabled: false,
    tip: '当下一次节审批节点执行节点未操作时，可以收回到当前节点重新处理'
  }
];

const STANDARD_FIELD_KEYS = [
  { key: 'work_order_info', label: '工单信息' },
  { key: 'service_order_no', label: '服务单号' },
  { key: 'related_customer', label: '关联客户' },
  { key: 'account_manager', label: '客户经理' },
  { key: 'created_time', label: '创建时间' },
  { key: 'customer_name', label: '客户名称' },
  { key: 'product_name', label: '产品名称' },
  { key: 'product_spec', label: '产品规格' },
  { key: 'product_type', label: '产品类型' },
  { key: 'applicant_name', label: '申请人姓名' },
  { key: 'contact_info', label: '联系方式' },
  { key: 'address', label: '地址' },
  { key: 'order_type', label: '工单类型' }
];

interface FlowDesignerStepProps {
  flowNodes: FlowStepNodeItem[];
  onChangeFlowNodes: (nodes: FlowStepNodeItem[]) => void;
  widgets?: FormWidgetComponent[];
  onGoToStep4: () => void;
  onOpenTest?: () => void;
  isReadOnly?: boolean;
  currentVersionCode?: string;
  currentVersionStatus?: 'active' | 'history' | 'draft';
  onAttemptEditInReadOnly?: () => void;
  templateType?: 'normal' | 'process';
}

export const FlowDesignerStep: React.FC<FlowDesignerStepProps> = ({
  flowNodes,
  onChangeFlowNodes,
  widgets = [],
  onGoToStep4,
  onOpenTest,
  isReadOnly = false,
  currentVersionCode,
  currentVersionStatus,
  onAttemptEditInReadOnly,
  templateType = 'process'
}) => {
  // 当前选中的节点 ID
  const [selectedNodeId, setSelectedNodeId] = useState<string>(flowNodes[0]?.id || 'fn_1');

  // 是否开启右侧上下全覆盖抽屉弹窗 (上下全覆盖，覆盖顶部按钮)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // 流程节点库选择弹窗控制
  const [isNodeLibraryModalOpen, setIsNodeLibraryModalOpen] = useState<boolean>(false);
  const [addNodeIndex, setAddNodeIndex] = useState<number>(0);

  // 连线上加号弹窗控制 (点击加号从右侧直接弹出黑色菜单面板)
  const [activePopoverGapIndex, setActivePopoverGapIndex] = useState<number | null>(null);

  // 分支内部加号弹窗控制 (点击分支内加号弹出添加节点面板)
  const [activeBranchPopoverKey, setActiveBranchPopoverKey] = useState<string | null>(null);

  // 画布自由移动与缩放状态
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 画布自由拖动事件处理
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (activePopoverGapIndex !== null && !target.closest('.popover-panel')) {
      setActivePopoverGapIndex(null);
    }
    if (activeBranchPopoverKey !== null && !target.closest('.popover-panel')) {
      setActiveBranchPopoverKey(null);
    }
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('[data-no-pan="true"]') ||
      target.closest('.group\\/gap') ||
      target.closest('.group\\/innergap') ||
      target.closest('.cursor-pointer')
    ) {
      return;
    }
    setIsDraggingCanvas(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // 拖拽放置指示状态 (记录当前拖拽悬停在第几个节点之后)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 节点重排序拖拽状态 (被拖拽节点的索引)
  const [reorderDragIndex, setReorderDragIndex] = useState<number | null>(null);

  // 右侧属性面板选中的 Tab: 'assignee' | 'buttons' | 'permissions' | 'advanced' | 'branch_rule' | 'parallel_config' | 'notify_target' | 'notify_content'
  const [activeRightTab, setActiveRightTab] = useState<'assignee' | 'buttons' | 'permissions' | 'advanced' | 'branch_rule' | 'parallel_config' | 'notify_target' | 'notify_content'>('assignee');

  // 当前选中节点重命名状态
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // 当前选中的分支项 ID (用于条件分支和并行分支)
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // 人员选择弹窗状态 (用于条件分支中的选择人员)
  const [isMemberSelectModalOpen, setIsMemberSelectModalOpen] = useState(false);
  const [memberPickerTarget, setMemberPickerTarget] = useState<{ branchId: string; ruleId: string } | null>(null);
  const [memberSearchText, setMemberSearchText] = useState('');
  const [tempSelectedMembers, setTempSelectedMembers] = useState<string[]>([]);

  // 节点同步与保存 toast 提示
  const [panelToast, setPanelToast] = useState<string | null>(null);

  // 消息通知专属设置项 (按图1、图2严格配置)
  const [notifyTargetType, setNotifyTargetType] = useState<'member' | 'group'>('member');
  const [notifyTargetTypes, setNotifyTargetTypes] = useState<string[]>(['specified_member']); // 'specified_member' | 'role' | 'form_member'
  const [notifyMembers, setNotifyMembers] = useState<SystemOrgMemberItem[]>([ALL_SYSTEM_PERSONNEL[0]]);
  const [notifyRoleId, setNotifyRoleId] = useState<string>('role_dept_leader');
  const [notifyFormField, setNotifyFormField] = useState<string>('派单人员');
  const [notifyTitle, setNotifyTitle] = useState<string>('【系统通知】您有一条待办任务更新');
  const [notifyContent, setNotifyContent] = useState<string>('您好，您提交的流程表单已有最新处理进展，请及时查看并跟进。');
  const [notifyButtonName, setNotifyButtonName] = useState<string>('查看详情');
  const [notifyButtonAction, setNotifyButtonAction] = useState<'form' | 'custom_url'>('form');
  const [notifyButtonUrl, setNotifyButtonUrl] = useState<string>('https://');
  const [notifyRelatedFormId, setNotifyRelatedFormId] = useState<string>('current_form');

  // 可供关联的已发布业务表单列表
  const publishedFormTemplates = React.useMemo(() => {
    return [
      {
        id: 'current_form',
        templateName: '本流程当前业务表单（默认）',
        systemName: '本系统',
        version: '最新发布版',
        category: '当前表单'
      },
      ...MOCK_TEMPLATES.filter(t => t.status === 'active' || (t as any).status === 'published').map(t => ({
        id: t.id,
        templateName: t.templateName,
        systemName: t.systemName,
        version: t.version || 'V1.0.0',
        category: t.category || '业务表单'
      }))
    ];
  }, []);

  // 递归检索选中节点 (支持顶层流转节点与分支内部嵌套子节点)
  const selectedNode = React.useMemo(() => {
    for (const n of flowNodes) {
      if (n.id === selectedNodeId) return n;
      if (n.branches && n.branches.length > 0) {
        for (const b of n.branches) {
          if (b.nodes && b.nodes.length > 0) {
            for (const sub of b.nodes) {
              if (sub.id === selectedNodeId) return sub;
            }
          }
        }
      }
    }
    return flowNodes[0] || {
      id: 'fn_default',
      nodeCode: 'node_default',
      name: '服务派单节点',
      nodeType: 'handle',
      categoryLabel: '处理节点',
      description: '负责派发工单并明确处置职责'
    };
  }, [flowNodes, selectedNodeId]);

  const isDraftNode = selectedNode.nodeType === 'draft';
  const isApprovalNode = selectedNode.nodeType === 'approval';
  const isHandleNode = selectedNode.nodeType === 'handle';
  const isConditionNode = selectedNode.nodeType === 'condition';
  const isParallelNode = selectedNode.nodeType === 'parallel';

  // 本地暂存属性 (参考截图配置项)
  const [assigneeMode, setAssigneeMode] = useState<'simple' | 'condition'>('simple');
  const [assigneeType, setAssigneeType] = useState<string>('specified_member');
  const [selectedApprovers, setSelectedApprovers] = useState<SystemOrgMemberItem[]>([ALL_SYSTEM_PERSONNEL[0]]);
  const [supervisorLevel, setSupervisorLevel] = useState<'direct' | 'level2' | 'continuous'>('direct');
  const [supervisorSource, setSupervisorSource] = useState<'initiator' | 'form_member'>('initiator');
  const [supervisorSourceFormMemberField, setSupervisorSourceFormMemberField] = useState<string>('派单人员');
  const [supervisorEndpointType, setSupervisorEndpointType] = useState<'role' | 'top_level'>('role');
  const [supervisorSelectedRole, setSupervisorSelectedRole] = useState<string>('部门负责人');
  const [supervisorMaxLevel, setSupervisorMaxLevel] = useState<number>(1);
  const [supervisorDirectoryLevel, setSupervisorDirectoryLevel] = useState<string>('top');
  const [supervisorLevelSelect, setSupervisorLevelSelect] = useState<string>('level_1');
  const [supervisorSelfAction, setSupervisorSelfAction] = useState<'self' | 'skip'>('self');
  const [supervisorEmptyAction, setSupervisorEmptyAction] = useState<'auto_pass' | 'admin' | 'specified'>('admin');
  const [supervisorMultiType, setSupervisorMultiType] = useState<'all' | 'or_sign' | 'sequential'>('all');
  const [supervisorFallbackApprovers, setSupervisorFallbackApprovers] = useState<SystemOrgMemberItem[]>([ALL_SYSTEM_PERSONNEL[0]]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_dept_leader');
  const [deptLeaderLevel, setDeptLeaderLevel] = useState<number>(1);
  const [formMemberField, setFormMemberField] = useState<string>('派单人员');
  const [multiApproveType, setMultiApproveType] = useState<'all' | 'or_sign' | 'sequential'>('all');
  
  // 节点审批人/执行人选择弹窗状态 (支持按机构、按角色选人)
  const [isNodeMemberSelectModalOpen, setIsNodeMemberSelectModalOpen] = useState<boolean>(false);
  const [nodeMemberSelectTarget, setNodeMemberSelectTarget] = useState<'node_approvers' | 'supervisor_fallback'>('node_approvers');
  const [nodeMemberModalTab, setNodeMemberModalTab] = useState<'org' | 'role'>('org');
  const [nodeMemberOrgFilter, setNodeMemberOrgFilter] = useState<string>('ALL');
  const [nodeMemberRoleFilter, setNodeMemberRoleFilter] = useState<string>('ALL');
  const [nodeMemberSearchKeyword, setNodeMemberSearchKeyword] = useState<string>('');
  const [tempNodeSelectedMembers, setTempNodeSelectedMembers] = useState<SystemOrgMemberItem[]>([]);
  
  // 按钮配置表 (审批节点与执行节点区分不同的操作按钮清单)
  const [nodeButtons, setNodeButtons] = useState<NodeButtonConfig[]>([]);
  const [editingBtnKey, setEditingBtnKey] = useState<string | null>(null);

  // 字段读写权限矩阵 (Record<fieldKey, 'editable' | 'readonly' | 'hidden'>)
  const [fieldPerms, setFieldPerms] = useState<Record<string, 'editable' | 'readonly' | 'hidden'>>({});

  // 高级设置项
  const [autoApproveAdjacent, setAutoApproveAdjacent] = useState<boolean>(false);
  const [emptyAssigneeAction, setEmptyAssigneeAction] = useState<'skip' | 'admin' | 'specified' | 'pause'>('pause');
  const [timeoutRulesDetailed, setTimeoutRulesDetailed] = useState<DetailedTimeoutRule[]>([]);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState<boolean>(false);
  const [editingTimeoutRule, setEditingTimeoutRule] = useState<DetailedTimeoutRule | null>(null);

  // 响应和处理时效限制设置 (默认模式 vs 发起人自选模式)
  const [timeLimitEnabled, setTimeLimitEnabled] = useState<boolean>(false);
  const [timeLimitMode, setTimeLimitMode] = useState<'default' | 'initiator_select'>('default');
  const [timeLimitHours, setTimeLimitHours] = useState<number>(24);
  const [timeLimitFieldKey, setTimeLimitFieldKey] = useState<string>('');
  const [timeLimitFieldName, setTimeLimitFieldName] = useState<string>('');

  // 跳转设置项 (仅审批节点)
  const [jumpEnabled, setJumpEnabled] = useState<boolean>(false);
  const [jumpRules, setJumpRules] = useState<{ id: string; condition: string; targetName: string }[]>([
    { id: 'jr_1', condition: '工单紧急程度 等于「特急办理」', targetName: '办结归档' }
  ]);

  // 条件分支公式编辑器弹窗状态
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [formulaEditingBranchId, setFormulaEditingBranchId] = useState<string | null>(null);

  // 计算用于字段权限列表的数据 (整个表单的所有字段)
  const displayFieldsList = React.useMemo(() => {
    if (widgets && widgets.length > 0) {
      return widgets
        .filter(w => w.type !== 'divider' && (w.key || w.label))
        .map(w => ({
          key: w.key,
          label: w.label || w.placeholder || w.key,
          type: w.type,
          required: !!w.required
        }));
    }
    return STANDARD_FIELD_KEYS.map(f => ({ ...f, type: 'input', required: false }));
  }, [widgets]);

  // 当选中节点改变时，同步节点数据至局部编辑表单
  useEffect(() => {
    if (selectedNode) {
      setTempTitle(selectedNode.name || (isApprovalNode ? '业务科长审核' : isDraftNode ? '开始' : '服务派单节点'));
      setIsRenamingTitle(false);
      setAssigneeMode(selectedNode.assigneeMode || 'simple');
      
      if (isApprovalNode) {
        const initialType = selectedNode.assigneeType && ['specified_member', 'dept_leader', 'multi_leader', 'initiator', 'form_member'].includes(selectedNode.assigneeType)
          ? selectedNode.assigneeType
          : 'specified_member';
        setAssigneeType(initialType);
        const initMembers = selectedNode.selectedMembers && selectedNode.selectedMembers.length > 0
          ? selectedNode.selectedMembers
          : selectedNode.receiverLabel && selectedNode.receiverLabel !== '所有人'
          ? ALL_SYSTEM_PERSONNEL.filter(u => selectedNode.receiverLabel?.includes(u.name))
          : [ALL_SYSTEM_PERSONNEL[0]];
        setSelectedApprovers(initMembers.length > 0 ? initMembers : [ALL_SYSTEM_PERSONNEL[0]]);
        setDeptLeaderLevel(selectedNode.deptLeaderLevel || 1);
        setSupervisorLevel(selectedNode.supervisorLevel || 'direct');
        setSupervisorEndpointType(selectedNode.supervisorEndpointType === 'top_level' ? 'top_level' : 'specific_level');
        setSupervisorMaxLevel(selectedNode.supervisorMaxLevel || 1);
        setSupervisorDirectoryLevel(selectedNode.supervisorDirectoryLevel || 'top');
        setSupervisorEmptyAction(selectedNode.supervisorEmptyAction || 'admin');
        if (selectedNode.supervisorFallbackApprovers && selectedNode.supervisorFallbackApprovers.length > 0) {
          setSupervisorFallbackApprovers(selectedNode.supervisorFallbackApprovers);
        } else {
          setSupervisorFallbackApprovers([ALL_SYSTEM_PERSONNEL[0]]);
        }
      } else {
        const initialType = selectedNode.assigneeType && ['specified_member', 'dept_leader', 'multi_leader', 'initiator', 'form_member'].includes(selectedNode.assigneeType)
          ? selectedNode.assigneeType
          : 'specified_member';
        setAssigneeType(initialType);
        const initMembers = selectedNode.selectedMembers && selectedNode.selectedMembers.length > 0
          ? selectedNode.selectedMembers
          : selectedNode.receiverLabel && selectedNode.receiverLabel !== '所有人'
          ? ALL_SYSTEM_PERSONNEL.filter(u => selectedNode.receiverLabel?.includes(u.name))
          : [ALL_SYSTEM_PERSONNEL[2]];
        setSelectedApprovers(initMembers.length > 0 ? initMembers : [ALL_SYSTEM_PERSONNEL[2]]);
        setDeptLeaderLevel(selectedNode.deptLeaderLevel || 1);
        setSupervisorLevel(selectedNode.supervisorLevel || 'direct');
        setSupervisorEndpointType(selectedNode.supervisorEndpointType === 'top_level' ? 'top_level' : 'specific_level');
        setSupervisorMaxLevel(selectedNode.supervisorMaxLevel || 1);
        setSupervisorDirectoryLevel(selectedNode.supervisorDirectoryLevel || 'top');
        setSupervisorEmptyAction(selectedNode.supervisorEmptyAction || 'admin');
        if (selectedNode.supervisorFallbackApprovers && selectedNode.supervisorFallbackApprovers.length > 0) {
          setSupervisorFallbackApprovers(selectedNode.supervisorFallbackApprovers);
        } else {
          setSupervisorFallbackApprovers([ALL_SYSTEM_PERSONNEL[0]]);
        }
      }

      setFormMemberField(selectedNode.formMemberFieldName || '派单人员');
      setMultiApproveType(selectedNode.multiApproveType || (selectedNode.approveMode === 'or_sign' ? 'or_sign' : 'all'));
      
      // 区分审批节点与执行节点的按钮配置
      const defaultBtns = isApprovalNode ? APPROVAL_BUTTON_DEFINITIONS : HANDLE_BUTTON_DEFINITIONS;
      if (selectedNode.nodeButtons && selectedNode.nodeButtons.length > 0) {
        // 如果已保存过，则融合最新配置以保证顺序与提示文案精确对应
        const merged = defaultBtns.map(def => {
          const found = selectedNode.nodeButtons?.find(b => b.key === def.key);
          if (found) {
            return {
              ...def,
              displayName: found.displayName || def.displayName,
              enabled: found.enabled,
              batchChecked: found.batchChecked
            };
          }
          return def;
        });
        setNodeButtons(merged);
      } else {
        setNodeButtons([...defaultBtns]);
      }

      // 如果当前是开始节点，直接切到字段权限 Tab；消息通知切到选择通知对象；审批节点与处理节点默认切到执行人/审批人 Tab
      if (selectedNode.nodeType === 'draft') {
        setActiveRightTab('permissions');
      } else if (selectedNode.nodeType === 'condition') {
        setActiveRightTab('branch_rule');
        setSelectedBranchId(selectedNode.branches?.[0]?.id || null);
      } else if (selectedNode.nodeType === 'parallel') {
        setActiveRightTab('parallel_config');
        setSelectedBranchId(selectedNode.branches?.[0]?.id || null);
      } else if (selectedNode.nodeType === 'notify') {
        setActiveRightTab('notify_target');
      } else {
        setActiveRightTab('assignee');
      }

      // 同步消息通知专属配置
      if (selectedNode.nodeType === 'notify') {
        setNotifyTargetType((selectedNode as any).notifyTargetType || 'member');
        setNotifyTargetTypes((selectedNode as any).notifyTargetTypes || ['specified_member']);
        if ((selectedNode as any).notifyMembers && (selectedNode as any).notifyMembers.length > 0) {
          setNotifyMembers((selectedNode as any).notifyMembers);
        } else if (selectedNode.selectedMembers && selectedNode.selectedMembers.length > 0) {
          setNotifyMembers(selectedNode.selectedMembers as any);
        } else {
          setNotifyMembers([ALL_SYSTEM_PERSONNEL[0]]);
        }
        setNotifyRoleId((selectedNode as any).notifyRoleId || selectedNode.selectedRoleId || 'role_dept_leader');
        setNotifyFormField((selectedNode as any).notifyFormField || selectedNode.formMemberFieldName || '派单人员');
        setNotifyTitle((selectedNode as any).notifyTitle || selectedNode.name || '【系统通知】您有一条待办任务更新');
        setNotifyContent((selectedNode as any).notifyContent || selectedNode.description || '您好，您提交的流程表单已有最新处理进展，请及时查看并跟进。');
        setNotifyButtonName((selectedNode as any).notifyButtonName || '查看详情');
        setNotifyButtonAction((selectedNode as any).notifyButtonAction || 'form');
        setNotifyButtonUrl((selectedNode as any).notifyButtonUrl || 'https://');
        setNotifyRelatedFormId((selectedNode as any).notifyRelatedFormId || 'current_form');
      }

      // 字段权限 (开始节点默认可编辑，中间节点默认只读)
      const initialPerms: Record<string, 'editable' | 'readonly' | 'hidden'> = { ...(selectedNode.fieldPermissions || {}) };
      displayFieldsList.forEach(f => {
        if (!initialPerms[f.key]) {
          initialPerms[f.key] = selectedNode.nodeType === 'draft' ? 'editable' : 'readonly';
        }
      });
      setFieldPerms(initialPerms);

      setAutoApproveAdjacent(!!selectedNode.autoApproveAdjacent);
      setEmptyAssigneeAction(selectedNode.emptyAssigneeAction || 'pause');
      setJumpEnabled(!!selectedNode.jumpEnabled);

      // 同步超时处理规则
      if (selectedNode.timeoutRulesDetailed && selectedNode.timeoutRulesDetailed.length > 0) {
        setTimeoutRulesDetailed(selectedNode.timeoutRulesDetailed as any);
      } else if (selectedNode.timeoutRules && selectedNode.timeoutRules.length > 0) {
        setTimeoutRulesDetailed(selectedNode.timeoutRules.map((r, idx) => ({
          id: r.id || `tr_${idx}`,
          triggerType: 'after_timeout',
          triggerHours: r.hours || 4,
          actionType: (r.action === 'pass' ? 'auto_pass' : r.action === 'transfer' ? 'transfer' : 'remind'),
          notifyTargets: ['assignee'],
          notifyChannels: ['work_wechat', 'in_app'],
          transferTargetType: 'leader',
          transferMembers: [],
          jumpTargetNodeId: '',
          jumpTargetNodeName: '',
          isRecurring: false,
          recurringIntervalHours: 2,
          recurringMaxCount: 3,
          desc: `【超时 ${r.hours || 4} 小时】自动执行超时催办或流转`,
          enabled: true
        })));
      } else {
        setTimeoutRulesDetailed([]);
      }

      // 同步响应和处理时效限制
      setTimeLimitEnabled(!!selectedNode.timeLimitEnabled);
      setTimeLimitMode(selectedNode.timeLimitMode || 'default');
      setTimeLimitHours(selectedNode.timeLimitHours !== undefined ? selectedNode.timeLimitHours : 24);
      setTimeLimitFieldKey(selectedNode.timeLimitFieldKey || '');
      setTimeLimitFieldName(selectedNode.timeLimitFieldName || '');
    }
  }, [selectedNodeId, flowNodes, isApprovalNode, isHandleNode, isDraftNode, isConditionNode, isParallelNode, displayFieldsList]);

  // 获取当前节点适用的 Tab 表头列表
  const currentTabs = React.useMemo(() => {
    if (isConditionNode) {
      // 条件分支：去掉高级设置，仅保留条件分支规则
      return [
        { key: 'branch_rule', label: '条件分支规则' }
      ] as const;
    }
    if (isParallelNode) {
      return [
        { key: 'parallel_config', label: '并行分支设置' },
        { key: 'advanced', label: '高级设置' }
      ] as const;
    }
    if (isHandleNode) {
      return [
        { key: 'assignee', label: '执行人' },
        { key: 'buttons', label: '操作按钮' },
        { key: 'permissions', label: '设置字段权限' },
        { key: 'advanced', label: '高级设置' }
      ] as const;
    }
    if (isApprovalNode) {
      return [
        { key: 'assignee', label: '审批人' },
        { key: 'buttons', label: '审批按钮' },
        { key: 'permissions', label: '设置字段权限' },
        { key: 'advanced', label: '高级设置' }
      ] as const;
    }
    if (selectedNode.nodeType === 'draft') {
      return [
        { key: 'permissions', label: '设置字段权限' },
        { key: 'advanced', label: '高级设置' }
      ] as const;
    }
    if (selectedNode.nodeType === 'notify') {
      // 消息通知：严格按照图1、图2，仅有选择通知对象与设置通知内容，去除设置字段权限和高级设置
      return [
        { key: 'notify_target', label: '选择通知对象' },
        { key: 'notify_content', label: '设置通知内容' }
      ] as const;
    }
    return [
      { key: 'assignee', label: '经办人' },
      { key: 'buttons', label: '操作按钮' },
      { key: 'permissions', label: '设置字段权限' },
      { key: 'advanced', label: '高级设置' }
    ] as const;
  }, [selectedNode.nodeType, isHandleNode, isApprovalNode, isConditionNode, isParallelNode]);

  // 插入新节点
  const handleInsertNode = (index: number, category: FlowNodeCategory) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const nodeCount = flowNodes.length + 1;
    let newNode: FlowStepNodeItem;

    if (category === 'condition') {
      const defaultConditionBranches: FlowBranchItem[] = [
        {
          id: `cb_${Date.now()}_1`,
          name: '条件1',
          branchType: 'if',
          tag: 'IF',
          priority: 1,
          desc: '满足条件时进入此分支',
          conditionText: '所有数据均可进入',
          nodes: []
        },
        {
          id: `cb_${Date.now()}_2`,
          name: '其他情况',
          branchType: 'else',
          tag: 'ELSE',
          priority: 2,
          desc: '未满足上述条件时流转',
          conditionText: '其他情况进入此流程',
          nodes: []
        }
      ];
      newNode = {
        id: `fn_${Date.now()}`,
        nodeCode: `node_condition_${nodeCount}`,
        name: '条件分支',
        nodeType: 'condition',
        categoryLabel: '条件分支',
        description: '根据表单数据规则分流，支持 IF 条件判断与 ELSE 兜底流转',
        branchType: 'condition',
        branches: defaultConditionBranches
      };
    } else if (category === 'parallel') {
      const defaultParallelBranches: FlowBranchItem[] = [
        {
          id: `pb_${Date.now()}_1`,
          name: '并行分支1',
          desc: '同时并发流转执行',
          nodes: []
        },
        {
          id: `pb_${Date.now()}_2`,
          name: '并行分支2',
          desc: '同时并发流转执行',
          nodes: []
        }
      ];
      newNode = {
        id: `fn_${Date.now()}`,
        nodeCode: `node_parallel_${nodeCount}`,
        name: '并行分支',
        nodeType: 'parallel',
        categoryLabel: '并行分支',
        description: '多路分支同时并发执行，无 IF/ELSE 规则限制，全部完成再汇聚',
        branchType: 'parallel',
        branches: defaultParallelBranches
      };
    } else {
      const defaultBtns = category === 'approval' ? APPROVAL_BUTTON_DEFINITIONS : HANDLE_BUTTON_DEFINITIONS;
      newNode = {
        id: `fn_${Date.now()}`,
        nodeCode: `node_step_${nodeCount}`,
        name: category === 'approval' 
          ? '业务科长审核' 
          : category === 'handle' 
          ? '服务派单节点' 
          : category === 'cc' 
          ? '通报抄送' 
          : '消息通知提醒',
        nodeType: category,
        categoryLabel: category === 'approval' 
          ? '审批节点' 
          : category === 'handle' 
          ? '处理节点' 
          : category === 'cc' 
          ? '抄送节点' 
          : '通知节点',
        description: category === 'notify'
          ? '通过微信、短信、钉钉推送处置进展与到期提醒'
          : '请按照规定业务时限开展处置与复核工作',
        receiverLabel: category === 'notify' ? '工单责任人及分管领导' : '指定科室承办人',
        receiverType: 'dept',
        approveMode: 'or_sign',
        approveModeLabel: '或签(一名通过即生效)',
        timeLimitHours: 4,
        timeLimitLabel: '限时 4h',
        allowTransfer: true,
        nodeButtons: [...defaultBtns],
        actionButtons: [
          { id: `btn_${Date.now()}_1`, label: '审核通过/提交', actionType: 'submit', color: 'blue', enabled: true },
          { id: `btn_${Date.now()}_2`, label: '退回重办', actionType: 'reject', color: 'red', enabled: true }
        ]
      };
    }

    const updated = [...flowNodes];
    updated.splice(index + 1, 0, newNode);
    onChangeFlowNodes(updated);
    setSelectedNodeId(newNode.id);
    if (newNode.branches && newNode.branches.length > 0) {
      setSelectedBranchId(newNode.branches[0].id);
    }
    setIsDrawerOpen(true);
  };

  // 为分支节点添加分支 (支持智能缩放与视图居中，杜绝画布遮挡)
  const handleAddBranchToNode = (nodeId: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    let newBranchId = '';
    let updatedBranchCount = 0;
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentBranches = n.branches || [];
      if (n.nodeType === 'condition') {
        const ifBranches = currentBranches.filter(b => b.branchType === 'if');
        const nextPriority = ifBranches.length + 1;
        newBranchId = `cb_${Date.now()}`;
        const newIfBranch: FlowBranchItem = {
          id: newBranchId,
          name: `条件${nextPriority}`,
          branchType: 'if',
          tag: 'IF',
          priority: nextPriority,
          desc: '满足条件时进入此分支',
          conditionText: '所有数据均可进入',
          nodes: []
        };
        const elseIndex = currentBranches.findIndex(b => b.branchType === 'else');
        const newBranchList = [...currentBranches];
        if (elseIndex >= 0) {
          newBranchList.splice(elseIndex, 0, newIfBranch);
        } else {
          newBranchList.push(newIfBranch);
        }
        updatedBranchCount = newBranchList.length;
        return { ...n, branches: newBranchList };
      } else {
        // 并行分支：没有 if，没有 else
        newBranchId = `pb_${Date.now()}`;
        const newBranch: FlowBranchItem = {
          id: newBranchId,
          name: `并行分支${currentBranches.length + 1}`,
          desc: '同时并发流转执行',
          nodes: []
        };
        const newBranchList = [...currentBranches, newBranch];
        updatedBranchCount = newBranchList.length;
        return { ...n, branches: newBranchList };
      }
    });
    onChangeFlowNodes(updated);
    setSelectedNodeId(nodeId);
    if (newBranchId) {
      setSelectedBranchId(newBranchId);
    }
    // 智能自适应缩放：当分支达到3个或更多时，微调缩放保证完全处于可视区域，绝不被画布遮挡
    if (updatedBranchCount >= 5 && zoom > 0.7) {
      setZoom(0.7);
    } else if (updatedBranchCount >= 4 && zoom > 0.8) {
      setZoom(0.8);
    } else if (updatedBranchCount >= 3 && zoom > 0.9) {
      setZoom(0.9);
    }
    setPanelToast('已成功添加新分支');
    setTimeout(() => setPanelToast(null), 1500);
  };

  // 为分支内部添加子流转节点 (在条件分支或并行分支列中增加审批人/经办人/抄送/通知/条件分支/并行分支)
  const handleAddNodeToBranch = (nodeId: string, branchId: string, insertIndex: number, category: FlowNodeCategory) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    let newInnerNode: FlowStepNodeItem;

    if (category === 'condition') {
      const defaultConditionBranches: FlowBranchItem[] = [
        {
          id: `cb_${Date.now()}_1`,
          name: '条件1',
          branchType: 'if',
          tag: 'IF',
          priority: 1,
          desc: '满足条件时进入此分支',
          conditionText: '所有数据均可进入',
          nodes: []
        },
        {
          id: `cb_${Date.now()}_2`,
          name: '其他情况',
          branchType: 'else',
          tag: 'ELSE',
          priority: 2,
          desc: '未满足上述条件时流转',
          conditionText: '其他情况进入此流程',
          nodes: []
        }
      ];
      newInnerNode = {
        id: `fn_branch_${Date.now()}`,
        nodeCode: `node_condition_${Date.now().toString(36).slice(-4)}`,
        name: '条件分支',
        nodeType: 'condition',
        categoryLabel: '条件分支',
        description: '根据表单数据规则分流，支持 IF 条件判断与 ELSE 兜底流转',
        branchType: 'condition',
        branches: defaultConditionBranches
      };
    } else if (category === 'parallel') {
      const defaultParallelBranches: FlowBranchItem[] = [
        {
          id: `pb_${Date.now()}_1`,
          name: '并行分支1',
          desc: '同时并发流转执行',
          nodes: []
        },
        {
          id: `pb_${Date.now()}_2`,
          name: '并行分支2',
          desc: '同时并发流转执行',
          nodes: []
        }
      ];
      newInnerNode = {
        id: `fn_branch_${Date.now()}`,
        nodeCode: `node_parallel_${Date.now().toString(36).slice(-4)}`,
        name: '并行分支',
        nodeType: 'parallel',
        categoryLabel: '并行分支',
        description: '多路分支同时并发执行，无 IF/ELSE 规则限制，全部完成再汇聚',
        branchType: 'parallel',
        branches: defaultParallelBranches
      };
    } else {
      const defaultBtns = category === 'approval' ? APPROVAL_BUTTON_DEFINITIONS : HANDLE_BUTTON_DEFINITIONS;
      newInnerNode = {
        id: `fn_branch_${Date.now()}`,
        nodeCode: `node_inner_${Date.now().toString(36).slice(-4)}`,
        name: category === 'approval' 
          ? '分支审批节点' 
          : category === 'handle' 
          ? '分支执行经办' 
          : category === 'cc' 
          ? '分支通报抄送' 
          : '分支消息提醒',
        nodeType: category,
        categoryLabel: category === 'approval' 
          ? '审批节点' 
          : category === 'handle' 
          ? '处理节点' 
          : category === 'cc' 
          ? '抄送节点' 
          : '通知节点',
        description: category === 'approval'
          ? '满足当前条件分支后触发专项审批验收'
          : category === 'handle'
          ? '负责落实当前条件分支下的处置经办工作'
          : category === 'cc'
          ? '向相关分管领导推送分支办理进展'
          : '通过微信/钉钉/短信及时提醒分支处置',
        receiverLabel: category === 'notify' ? '工单责任人及科室领导' : '指定承办人/审批人',
        receiverType: 'dept',
        approveMode: 'or_sign',
        approveModeLabel: '或签(一名通过即生效)',
        timeLimitHours: 4,
        timeLimitLabel: '限时 4h',
        allowTransfer: true,
        nodeButtons: [...defaultBtns],
        actionButtons: [
          { id: `btn_${Date.now()}_1`, label: '审核通过/提交', actionType: 'submit', color: 'blue', enabled: true },
          { id: `btn_${Date.now()}_2`, label: '退回重办', actionType: 'reject', color: 'red', enabled: true }
        ]
      };
    }

    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const updatedBranches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        const currentInnerNodes = [...(b.nodes || [])];
        currentInnerNodes.splice(insertIndex, 0, newInnerNode);
        return { ...b, nodes: currentInnerNodes };
      });
      return { ...n, branches: updatedBranches };
    });

    onChangeFlowNodes(updated);
    setSelectedNodeId(newInnerNode.id);
    if (newInnerNode.nodeType === 'condition' || newInnerNode.nodeType === 'parallel') {
      setSelectedBranchId(newInnerNode.branches?.[0]?.id || null);
      setActiveRightTab('branch_rule');
    } else if (newInnerNode.nodeType === 'approval' || newInnerNode.nodeType === 'handle') {
      setActiveRightTab('assignee');
    } else if (newInnerNode.nodeType === 'notify') {
      setActiveRightTab('notify_target');
    }
    setIsDrawerOpen(true);
    setActiveBranchPopoverKey(null);
    setPanelToast(`已在分支中成功增加【${newInnerNode.categoryLabel}】`);
    setTimeout(() => setPanelToast(null), 1500);
  };

  // 删除分支内部的子流转节点
  const handleDeleteInnerNodeFromBranch = (nodeId: string, branchId: string, innerNodeId: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const updatedBranches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          nodes: (b.nodes || []).filter(sub => sub.id !== innerNodeId)
        };
      });
      return { ...n, branches: updatedBranches };
    });
    onChangeFlowNodes(updated);
    if (selectedNodeId === innerNodeId) {
      setSelectedNodeId(nodeId);
      setIsDrawerOpen(false);
    }
    setPanelToast('已删除分支内的节点');
    setTimeout(() => setPanelToast(null), 1500);
  };

  // 删除某条分支 (至少保留两条)
  const handleDeleteBranch = (nodeId: string, branchId: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const targetNode = flowNodes.find(n => n.id === nodeId);
    if (!targetNode || (targetNode.branches?.length || 0) <= 2) {
      alert('分支节点至少需要保留两个分支！');
      return;
    }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const filtered = (n.branches || []).filter(b => b.id !== branchId);
      let ifCount = 1;
      const reindexed = filtered.map(b => {
        if (b.branchType === 'if') {
          return { ...b, priority: ifCount++ };
        }
        return b;
      });
      return { ...n, branches: reindexed };
    });
    onChangeFlowNodes(updated);
    if (selectedBranchId === branchId) {
      const remainingBranches = updated.find(n => n.id === nodeId)?.branches || [];
      setSelectedBranchId(remainingBranches[0]?.id || null);
    }
    setPanelToast('已删除该分支');
    setTimeout(() => setPanelToast(null), 1500);
  };

  // 修改某条分支属性 (如分支名称、判断条件等)
  const handleUpdateBranch = (nodeId: string, branchId: string, partial: Partial<FlowBranchItem>) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const updatedBranches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        return { ...b, ...partial };
      });
      return { ...n, branches: updatedBranches };
    });
    onChangeFlowNodes(updated);
  };

  const getOperatorLabel = (op: string) => {
    switch (op) {
      case 'eq': return '等于';
      case 'neq': return '不等于';
      case 'contains': return '包含';
      case 'not_contains': return '不包含';
      case 'in': return '属于';
      case 'gt': return '>';
      case 'gte': return '≥';
      case 'lt': return '<';
      case 'lte': return '≤';
      case 'empty': return '为空';
      case 'not_empty': return '不为空';
      default: return '等于';
    }
  };

  // 添加一条条件规则
  const handleAddRuleToBranch = (nodeId: string, branchId: string) => {
    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const branches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        const curRules = b.conditions && b.conditions.length > 0
          ? b.conditions
          : [{ id: `rule_${Date.now()}_1`, fieldKey: 'initiator', fieldName: '发起人', operator: 'eq' as const, value: '', valueLabel: '选择人员' }];
        const newRule: FlowBranchConditionRule = {
          id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fieldKey: 'initiator',
          fieldName: '发起人',
          operator: 'eq',
          value: '',
          valueLabel: '选择人员'
        };
        const nextRules = [...curRules, newRule];
        const conditionText = nextRules.map(r => `${r.fieldName} ${getOperatorLabel(r.operator)} ${r.valueLabel && r.valueLabel !== '选择人员' ? r.valueLabel : (r.value || '未设置')}`).join(' 且 ');
        return {
          ...b,
          conditions: nextRules,
          conditionText: conditionText || '所有数据均可进入'
        };
      });
      return { ...n, branches };
    });
    onChangeFlowNodes(updated);
  };

  // 删除一条条件规则
  const handleRemoveRuleFromBranch = (nodeId: string, branchId: string, ruleId: string) => {
    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const branches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        const curRules = b.conditions || [];
        let nextRules = curRules.filter(r => r.id !== ruleId);
        if (nextRules.length === 0) {
          nextRules = [{
            id: `rule_${Date.now()}`,
            fieldKey: 'initiator',
            fieldName: '发起人',
            operator: 'eq',
            value: '',
            valueLabel: '选择人员'
          }];
        }
        const conditionText = nextRules.map(r => `${r.fieldName} ${getOperatorLabel(r.operator)} ${r.valueLabel && r.valueLabel !== '选择人员' ? r.valueLabel : (r.value || '未设置')}`).join(' 且 ');
        return {
          ...b,
          conditions: nextRules,
          conditionText: conditionText || '所有数据均可进入'
        };
      });
      return { ...n, branches };
    });
    onChangeFlowNodes(updated);
  };

  // 更新一条条件规则
  const handleUpdateRuleInBranch = (nodeId: string, branchId: string, ruleId: string, partial: Partial<FlowBranchConditionRule>) => {
    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
    const updated = flowNodes.map(n => {
      if (n.id !== nodeId) return n;
      const branches = (n.branches || []).map(b => {
        if (b.id !== branchId) return b;
        const curRules = b.conditions && b.conditions.length > 0
          ? b.conditions
          : [{ id: `rule_${Date.now()}_1`, fieldKey: 'initiator', fieldName: '发起人', operator: 'eq' as const, value: '', valueLabel: '选择人员' }];
        const nextRules = curRules.map(r => {
          if (r.id !== ruleId) return r;
          return { ...r, ...partial };
        });
        const conditionText = nextRules.map(r => `${r.fieldName} ${getOperatorLabel(r.operator)} ${r.valueLabel && r.valueLabel !== '选择人员' ? r.valueLabel : (r.value || '未设置')}`).join(' 且 ');
        return {
          ...b,
          conditions: nextRules,
          conditionText: conditionText || '所有数据均可进入'
        };
      });
      return { ...n, branches };
    });
    onChangeFlowNodes(updated);
  };

  // 删除节点 (支持顶层节点与分支内嵌套节点)
  const handleDeleteNode = (id: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const isTopLevel = flowNodes.some(n => n.id === id);
    if (isTopLevel) {
      if (flowNodes.length <= 2) {
        alert('流程至少需要保留开始与结束环节！');
        return;
      }
      const updated = flowNodes.filter(n => n.id !== id);
      onChangeFlowNodes(updated);
      if (selectedNodeId === id) {
        setSelectedNodeId(updated[0].id);
      }
    } else {
      const updated = flowNodes.map(n => {
        if (!n.branches) return n;
        return {
          ...n,
          branches: n.branches.map(b => ({
            ...b,
            nodes: (b.nodes || []).filter(sub => sub.id !== id)
          }))
        };
      });
      onChangeFlowNodes(updated);
      if (selectedNodeId === id) {
        setSelectedNodeId(updated[0].id);
      }
    }
  };

  // 重置为仅含【开始】与【结束】的默认流程
  const handleResetToDefaultFlow = () => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    if (flowNodes.length === 2 && flowNodes[0].nodeType === 'draft' && flowNodes[1].nodeType === 'end') {
      alert('当前已经是仅包含【开始】与【结束】节点的默认流程！');
      return;
    }
    if (confirm('是否确认重置为仅包含【开始】与【结束】的默认流程？中间配置的所有环节节点将被清空。')) {
      const defaultStartNode: FlowStepNodeItem = {
        id: 'fn_start',
        nodeCode: 'node_start',
        name: '开始',
        nodeType: 'draft',
        categoryLabel: '开始节点',
        description: '由创建人登记业务基本信息，并明确处置要求与办理时限',
        receiverLabel: '所有人',
        receiverType: 'initiator',
        actionButtons: [
          { id: 'btn_s_1', label: '下发指令/提交', actionType: 'submit', color: 'blue', enabled: true },
          { id: 'btn_s_2', label: '保存草稿', actionType: 'save_draft', color: 'slate', enabled: true }
        ]
      };
      const defaultEndNode: FlowStepNodeItem = {
        id: 'fn_end',
        nodeCode: 'node_end',
        name: '结束',
        nodeType: 'end',
        categoryLabel: '流程办结',
        description: '对处置回执验收结案，归档生成台账',
        actionButtons: [
          { id: 'btn_e_1', label: '导出工单台账', actionType: 'save_draft', color: 'blue', enabled: true }
        ]
      };
      onChangeFlowNodes([defaultStartNode, defaultEndNode]);
      setSelectedNodeId('fn_start');
      setIsDrawerOpen(false);
    }
  };

  // 更新当前选中节点属性 (支持顶层流转节点与分支内部子节点递归更新)
  const handleUpdateNode = (fields: Partial<FlowStepNodeItem>) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updateRecursively = (nodesList: FlowStepNodeItem[]): FlowStepNodeItem[] => {
      return nodesList.map(n => {
        if (n.id === selectedNodeId) {
          return { ...n, ...fields };
        }
        if (n.branches && n.branches.length > 0) {
          return {
            ...n,
            branches: n.branches.map(b => ({
              ...b,
              nodes: b.nodes ? updateRecursively(b.nodes) : []
            }))
          };
        }
        return n;
      });
    };
    onChangeFlowNodes(updateRecursively(flowNodes));
  };

  // 节点上下重排序放置
  const handleDropOnNode = (targetIndex: number) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    if (reorderDragIndex !== null && reorderDragIndex !== targetIndex) {
      const updated = [...flowNodes];
      const [moved] = updated.splice(reorderDragIndex, 1);
      updated.splice(targetIndex, 0, moved);
      onChangeFlowNodes(updated);
      setSelectedNodeId(moved.id);
    }
    setReorderDragIndex(null);
    setDragOverIndex(null);
  };

  // 处理在连接点放置新节点或重排节点
  const handleDropOnGap = (gapIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }

    const newCategory = e.dataTransfer.getData('application/flow-node-category') as FlowNodeCategory;
    if (newCategory) {
      handleInsertNode(gapIndex, newCategory);
      return;
    }

    if (reorderDragIndex !== null) {
      const updated = [...flowNodes];
      const [moved] = updated.splice(reorderDragIndex, 1);
      const targetPos = reorderDragIndex < gapIndex ? gapIndex : gapIndex + 1;
      updated.splice(targetPos, 0, moved);
      onChangeFlowNodes(updated);
      setSelectedNodeId(moved.id);
      setReorderDragIndex(null);
    }
  };

  // 保存右侧面板所有属性修改
  const handleSaveNodeConfig = () => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }

    // 严格同步构造 actionButtons 映射，与 nodeButtons 保持显示名称和启用状态完全一致
    const mappedActionButtons = nodeButtons.map(nb => {
      let actionType: 'submit' | 'save_draft' | 'transfer' | 'reject' | 'pass' | 'terminate' = 'submit';
      let color: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' = 'blue';

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
        label: nb.displayName || nb.label,
        actionType,
        color,
        enabled: !!nb.enabled
      };
    });

    let computedReceiverLabel = '未指定人员';
    if (selectedNode.nodeType === 'notify') {
      const labels: string[] = [];
      if (notifyTargetTypes.includes('specified_member')) {
        labels.push(notifyMembers.length > 0 ? notifyMembers.map(m => m.name).join('、') : '指定成员');
      }
      if (notifyTargetTypes.includes('role')) {
        labels.push(ROLE_DICTIONARY_LIST.find(r => r.id === notifyRoleId)?.name || '指定角色');
      }
      if (notifyTargetTypes.includes('form_member')) {
        labels.push(notifyFormField || '表单成员字段');
      }
      computedReceiverLabel = labels.join(' + ') || '未指定通知对象';
    } else if (assigneeType === 'specified_member') {
      computedReceiverLabel = selectedApprovers.length > 0 ? selectedApprovers.map(m => m.name).join('、') : '未指定人员';
    } else if (assigneeType === 'multi_leader') {
      computedReceiverLabel = '多级主管';
    } else if (assigneeType === 'initiator') {
      computedReceiverLabel = '发起人本人';
    } else if (assigneeType === 'role') {
      computedReceiverLabel = ROLE_DICTIONARY_LIST.find(r => r.id === selectedRoleId)?.name || '指定角色';
    } else if (assigneeType === 'dept_leader') {
      computedReceiverLabel = '部门主管';
    } else {
      computedReceiverLabel = formMemberField || '表单内成员';
    }

    handleUpdateNode({
      name: tempTitle.trim() || selectedNode.name,
      description: selectedNode.nodeType === 'notify' ? (notifyTitle || selectedNode.description || '消息通知') : selectedNode.description,
      assigneeMode,
      assigneeType: assigneeType as any,
      selectedMembers: selectedApprovers,
      supervisorLevel,
      selectedRoleId,
      receiverLabel: computedReceiverLabel,
      notifyTargetType,
      notifyTargetTypes,
      notifyMembers,
      notifyRoleId,
      notifyFormField,
      notifyTitle,
      notifyContent,
      notifyButtonName,
      notifyButtonAction,
      notifyButtonUrl,
      notifyRelatedFormId,
      notifyRelatedFormName: publishedFormTemplates.find(f => f.id === notifyRelatedFormId)?.templateName || '本流程当前业务表单',
      formMemberFieldName: formMemberField,
      multiApproveType,
      approveMode: multiApproveType === 'all' ? 'all' : 'or_sign',
      approveModeLabel: multiApproveType === 'all' 
        ? '会签(需所有审批人同意)' 
        : multiApproveType === 'sequential' 
        ? '依次审批(按顺序依次审批)' 
        : '或签(一名审批人同意即可)',
      nodeButtons,
      actionButtons: mappedActionButtons,
      fieldPermissions: fieldPerms,
      deptLeaderLevel,
      autoApproveAdjacent,
      emptyAssigneeAction,
      jumpEnabled,
      timeoutRulesDetailed,
      timeoutRules: timeoutRulesDetailed.map(r => ({
        id: r.id,
        hours: r.timeValue,
        desc: r.desc || generateTimeoutRuleDesc(r)
      })),
      timeLimitEnabled,
      timeLimitMode,
      timeLimitHours: timeLimitMode === 'default' ? Number(timeLimitHours) || 24 : undefined,
      timeLimitFieldKey: timeLimitMode === 'initiator_select' ? timeLimitFieldKey : undefined,
      timeLimitFieldName: timeLimitMode === 'initiator_select' 
        ? (displayFieldsList.find(f => f.key === timeLimitFieldKey)?.label || timeLimitFieldName || timeLimitFieldKey)
        : undefined
    });
    setPanelToast(`节点【${tempTitle || selectedNode.name}】配置已保存成功！`);
    setTimeout(() => {
      setPanelToast(null);
      setIsDrawerOpen(false);
    }, 500);
  };

  // 节点配置同步
  const handleSyncConfig = () => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updatedPerms = { ...fieldPerms };
    displayFieldsList.forEach(f => {
      if (!updatedPerms[f.key]) updatedPerms[f.key] = 'readonly';
    });
    setFieldPerms(updatedPerms);
    setPanelToast('已完成与表单组件及流转规则的实时同步');
    setTimeout(() => setPanelToast(null), 2000);
  };

  // 批量设置字段权限
  const handleBatchSetPerm = (mode: 'editable' | 'readonly' | 'hidden') => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updated = { ...fieldPerms };
    displayFieldsList.forEach(f => {
      updated[f.key] = mode;
    });
    setFieldPerms(updated);
  };

  // 获取节点卡片主题样式
  const getNodeColorTheme = (type: FlowNodeCategory) => {
    switch (type) {
      case 'draft':
        return {
          headerBg: 'bg-emerald-600 text-white',
          tagBg: 'bg-emerald-700 text-white',
          border: 'border-emerald-500'
        };
      case 'handle':
        return {
          headerBg: 'bg-blue-600 text-white',
          tagBg: 'bg-blue-700 text-white',
          border: 'border-blue-500'
        };
      case 'approval':
        return {
          headerBg: 'bg-amber-500 text-white',
          tagBg: 'bg-amber-600 text-white',
          border: 'border-amber-500'
        };
      case 'cc':
        return {
          headerBg: 'bg-teal-600 text-white',
          tagBg: 'bg-teal-700 text-white',
          border: 'border-teal-500'
        };
      case 'notify':
        return {
          headerBg: 'bg-purple-600 text-white',
          tagBg: 'bg-purple-700 text-white',
          border: 'border-purple-500'
        };
      case 'end':
        return {
          headerBg: 'bg-slate-800 text-white',
          tagBg: 'bg-slate-900 text-white',
          border: 'border-slate-800'
        };
      case 'condition':
        return {
          headerBg: 'bg-indigo-600 text-white',
          tagBg: 'bg-indigo-700 text-white',
          border: 'border-indigo-500'
        };
      case 'parallel':
        return {
          headerBg: 'bg-teal-600 text-white',
          tagBg: 'bg-teal-700 text-white',
          border: 'border-teal-500'
        };
      default:
        return {
          headerBg: 'bg-indigo-600 text-white',
          tagBg: 'bg-indigo-700 text-white',
          border: 'border-indigo-500'
        };
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100/70 select-none relative">
      {/* Toast 提示横幅 */}
      {panelToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{panelToast}</span>
        </div>
      )}

      {/* ===================== 左侧：流程节点库 (固定侧栏面板) ===================== */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs p-4 overflow-y-auto custom-scrollbar justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>流程节点库</span>
            </h3>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">固定面板</span>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            可拖拽或点击添加环节
          </span>

          <div className="space-y-2.5">
            {/* 1. 处理节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'handle');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'handle');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                    <span>处理节点 (执行经办)</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                指派责任科室或承办人员进行落地整改与回执填报...
              </p>
            </div>

            {/* 2. 审批节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'approval');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'approval');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-600 flex items-center gap-1">
                    <span>审批节点 (审核验收)</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                创建人或科室领导验收处置成效，审核同意或拒绝终止...
              </p>
            </div>

            {/* 3. 抄送节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'cc');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'cc');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-600 flex items-center gap-1">
                    <span>抄送节点</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                将处置进展与整改通告实时推送至分管领导及值班室...
              </p>
            </div>

            {/* 4. 消息通知节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'notify');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'notify');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-600 flex items-center gap-1">
                    <span>消息通知</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                支持短信、企业微信或系统站内信及时触达
              </p>
            </div>

            {/* 5. 条件分支节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'condition');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'condition');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入条件分支'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                    <span>条件分支</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded font-mono">IF / ELSE</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                支持 IF 条件判断与 ELSE 默认兜底，智能路由不同路径
              </p>
            </div>

            {/* 6. 并行分支节点 */}
            <div
              draggable={!isReadOnly}
              onDragStart={(e) => {
                if (isReadOnly) {
                  e.preventDefault();
                  onAttemptEditInReadOnly?.();
                  return;
                }
                e.dataTransfer.setData('application/flow-node-category', 'parallel');
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (isReadOnly) {
                  onAttemptEditInReadOnly?.();
                  return;
                }
                handleInsertNode(flowNodes.length >= 2 ? flowNodes.length - 2 : 0, 'parallel');
              }}
              className={`p-3 rounded-xl border bg-white transition-all group shadow-2xs ${
                isReadOnly
                  ? 'border-slate-200 opacity-80 cursor-pointer hover:border-amber-400 hover:bg-amber-50/40'
                  : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 cursor-grab active:cursor-grabbing'
              }`}
              title={isReadOnly ? '当前版本受保护，点击了解详情' : '拖拽或点击插入并行分支'}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Split className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-600 flex items-center gap-1">
                    <span>并行分支</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1 py-0.2 rounded">并发无条件</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-9 leading-relaxed">
                多个分支同时并发执行流转，无需 IF / ELSE 规则判断
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== 中间：垂直流转节点画布 (可自由移动，背景白色) ===================== */}
      <div 
        ref={canvasContainerRef}
        className={`flex-1 flex flex-col items-center overflow-auto relative select-none bg-white custom-scrollbar ${
          isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* 受保护版本只读横幅提示 */}
        {isReadOnly && (
          <div className="w-full max-w-2xl bg-amber-50/95 border border-amber-200 px-4 py-2.5 my-3 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs shrink-0 animate-in fade-in duration-200 z-30 pointer-events-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                当前流程{currentVersionStatus === 'active' ? '启用中' : (currentVersionStatus === 'history' ? `处于历史版本【${currentVersionCode || '历史归档'}】` : '受保护')}，仅可查看，不支持编辑。如需编辑，请创建新流程或切换到设计中的配置版本。
              </span>
            </div>
            <button
              type="button"
              onClick={onAttemptEditInReadOnly}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 ml-2"
            >
              <span>创建新流程</span>
            </button>
          </div>
        )}

        {/* 自由平移画布内容区 */}
        <div 
          className="w-full flex-1 flex flex-col items-center pt-8 pb-32 overflow-visible"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isDraggingCanvas ? 'none' : 'transform 0.08s ease-out'
          }}
        >
          {/* 垂直节点流 (自适应横向分支网格，无固定宽度截断限制，杜绝遮挡) */}
          <div className="w-full min-w-max flex flex-col items-center px-16">
            {flowNodes.map((node, index) => {
              const theme = getNodeColorTheme(node.nodeType);
              const isSelected = selectedNodeId === node.id;
              const canReorder = node.nodeType !== 'draft' && node.nodeType !== 'end';

              return (
                <React.Fragment key={node.id}>
                  {/* 1. 开始节点：默认开始节点 */}
                  {node.nodeType === 'draft' ? (
                    <div
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setActiveRightTab('permissions');
                        setIsDrawerOpen(true);
                      }}
                      className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${
                        isSelected ? 'ring-4 ring-blue-500/30 shadow-md' : ''
                      }`}
                      title="开始发起节点 (点击配置表单字段权限)"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-sm font-bold tracking-wide">开始</span>
                      <span className="text-[11px] text-slate-300 font-normal border-l border-slate-600 pl-2">
                        {node.receiverLabel || '所有人'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                    </div>
                  ) : node.nodeType === 'end' ? (
                    /* 2. 结束节点：默认结束节点 (无法点击弹出右侧弹窗) */
                    <div
                      className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#475569] text-white shadow-sm cursor-default select-none"
                      title="结束节点 (流程办结归档)"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                      <span className="text-sm font-bold tracking-wide">结束</span>
                    </div>
                  ) : node.nodeType === 'condition' || node.nodeType === 'parallel' ? (
                    /* 3. 分支流转节点 (条件分支 / 并行分支) */
                    <div 
                      className={`w-full flex flex-col items-center my-2 select-none ${
                        isSelected ? 'relative z-20' : 'relative z-10'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedBranchId(node.branches?.[0]?.id || null);
                        setIsDrawerOpen(true);
                      }}
                    >
                      {/* 顶部分支操作条：添加分支按钮 + 删除整组按钮 */}
                      <div className="flex items-center gap-2 mb-1.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddBranchToNode(node.id);
                          }}
                          className={`px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs hover:shadow-sm border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            node.nodeType === 'condition' 
                              ? 'text-indigo-600 border-indigo-200 hover:border-indigo-400' 
                              : 'text-teal-600 border-teal-200 hover:border-teal-400'
                          }`}
                          title={node.nodeType === 'condition' ? '添加条件分支' : '添加并行分支'}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{node.nodeType === 'condition' ? '添加条件' : '添加并行分支'}</span>
                        </button>

                        {canReorder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isReadOnly) {
                                onAttemptEditInReadOnly?.();
                                return;
                              }
                              handleDeleteNode(node.id);
                            }}
                            className="p-1.5 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
                            title="删除整个分支节点"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 垂直连接线进入分支横梁 */}
                      <div className="w-[2px] h-5 bg-slate-300" />

                      {/* 横向分支网格 (无固定宽度截断，横向自由舒展，杜绝遮挡) */}
                      <div className="flex items-start justify-center overflow-visible pb-1">
                        {(node.branches || []).map((branch, bIdx, branchesArr) => {
                          const isFirst = bIdx === 0;
                          const isLast = bIdx === branchesArr.length - 1;
                          const isBranchSelected = isSelected && selectedBranchId === branch.id;
                          const isIf = branch.branchType === 'if';
                          const isElse = branch.branchType === 'else';
                          const isNearRightEdge = bIdx >= branchesArr.length - 1 && branchesArr.length > 2;

                          return (
                            <div key={branch.id || bIdx} className="relative flex flex-col items-center px-4">
                              {/* 顶部横向连接导轨与垂直落线 */}
                              <div className="w-full h-5 relative">
                                {/* 横向横梁：首列从50%到100%，尾列从0%到50%，中间列0%到100% */}
                                <div 
                                  className={`absolute top-0 h-[2px] bg-slate-300 ${
                                    branchesArr.length === 1
                                      ? 'hidden'
                                      : isFirst 
                                      ? 'left-1/2 right-0' 
                                      : isLast 
                                      ? 'left-0 right-1/2' 
                                      : 'left-0 right-0'
                                  }`} 
                                />
                                {/* 垂直导线直下到卡片顶部 */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-5 bg-slate-300" />
                              </div>

                              {/* 分支卡片 */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNodeId(node.id);
                                  setSelectedBranchId(branch.id);
                                  setIsDrawerOpen(true);
                                }}
                                className={`w-[210px] bg-white rounded-xl border-2 transition-all shadow-2xs hover:shadow-md cursor-pointer overflow-hidden group ${
                                  isBranchSelected
                                    ? node.nodeType === 'condition'
                                      ? 'border-indigo-500 ring-4 ring-indigo-500/15 shadow-md'
                                      : 'border-teal-500 ring-4 ring-teal-500/15 shadow-md'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {/* 卡片头部 */}
                                <div className={`px-3 py-2 flex items-center justify-between border-b ${
                                  node.nodeType === 'condition'
                                    ? isIf ? 'bg-indigo-50/90 border-indigo-100' : 'bg-slate-100/90 border-slate-200'
                                    : 'bg-teal-50/90 border-teal-100'
                                }`}>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {/* 条件分支显示 IF / ELSE 标签；并行分支没有 IF / ELSE 标签 */}
                                    {node.nodeType === 'condition' ? (
                                      isIf ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white tracking-wide shadow-2xs shrink-0">
                                          IF
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-600 text-white tracking-wide shadow-2xs shrink-0">
                                          ELSE
                                        </span>
                                      )
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 shrink-0">
                                        并行
                                      </span>
                                    )}
                                    
                                    <span className="text-xs font-bold text-slate-800 truncate" title={branch.name}>
                                      {branch.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {node.nodeType === 'condition' && isIf && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        优先级 {branch.priority || bIdx + 1}
                                      </span>
                                    )}
                                    {branchesArr.length > 2 && (node.nodeType === 'parallel' || isIf) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteBranch(node.id, branch.id);
                                        }}
                                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition-colors"
                                        title="删除该分支"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* 卡片内容 */}
                                <div className="p-3 text-left bg-white">
                                  <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed min-h-[32px]">
                                    {node.nodeType === 'condition'
                                      ? branch.conditionText || (isElse ? '其他情况进入此流程' : '所有数据均可进入')
                                      : branch.desc || '同时并发流转执行，无需条件'}
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold transition-transform group-hover:translate-x-0.5">
                                    <span className={node.nodeType === 'condition' ? 'text-indigo-600' : 'text-teal-600'}>
                                      {node.nodeType === 'condition' ? (isElse ? '查看兜底设置' : '配置判断条件') : '配置并行设置'}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  </div>
                                </div>
                              </div>

                              {/* 分支内部子节点列表与 + 号添加按钮 (支持在条件分支下方增加流程节点) */}
                              <div className="flex flex-col items-center w-full">
                                {/* 如果分支内部已有子节点 */}
                                {(branch.nodes || []).map((subNode, subIdx) => {
                                  const subTheme = getNodeColorTheme(subNode.nodeType);
                                  const isSubSelected = selectedNodeId === subNode.id;
                                  const popoverKey = `${node.id}_${branch.id}_${subIdx + 1}`;

                                  return (
                                    <React.Fragment key={subNode.id || subIdx}>
                                      {/* 垂直连接线 */}
                                      <div className="w-[2px] h-4 bg-slate-300" />

                                      {/* 分支子节点卡片 */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedNodeId(subNode.id);
                                          if (subNode.nodeType === 'condition' || subNode.nodeType === 'parallel') {
                                            setSelectedBranchId(subNode.branches?.[0]?.id || null);
                                            setActiveRightTab('branch_rule');
                                          } else if (subNode.nodeType === 'approval' || subNode.nodeType === 'handle') {
                                            setActiveRightTab('assignee');
                                          } else if (subNode.nodeType === 'notify') {
                                            setActiveRightTab('notify_target');
                                          }
                                          setIsDrawerOpen(true);
                                        }}
                                        className={`w-[210px] bg-white rounded-xl border-2 transition-all shadow-2xs hover:shadow-md cursor-pointer overflow-hidden group ${
                                          isSubSelected
                                            ? `${subTheme.border} ring-4 ring-blue-500/15 shadow-md`
                                            : 'border-slate-200 hover:border-blue-400'
                                        }`}
                                      >
                                        {/* 子节点色带头部 */}
                                        <div className={`px-2.5 py-1.5 flex items-center justify-between ${subTheme.headerBg}`}>
                                          <span className="font-bold text-xs truncate" title={subNode.name}>{subNode.name}</span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${subTheme.tagBg}`}>
                                              {subNode.categoryLabel}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteInnerNodeFromBranch(node.id, branch.id, subNode.id);
                                              }}
                                              className="text-white/70 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                                              title="删除分支内此节点"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* 子节点卡片主体 */}
                                        <div className="p-2 space-y-1 text-left bg-white">
                                          {subNode.nodeType === 'condition' || subNode.nodeType === 'parallel' ? (
                                            <div className="flex items-center justify-between text-[11px] text-slate-700 py-0.5">
                                              <span className="truncate font-bold flex items-center gap-1.5 min-w-0 text-indigo-700">
                                                <GitFork className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                <span>{subNode.branches?.length || 2} 个子分支</span>
                                              </span>
                                              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                                            </div>
                                          ) : (
                                            <>
                                              <div className="flex items-center justify-between text-[11px] text-slate-700">
                                                <span className="truncate font-medium flex items-center gap-1 min-w-0" title={subNode.receiverLabel || '所有人'}>
                                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                  {(() => {
                                                    const names = (subNode.receiverLabel || '所有人').split('、');
                                                    if (names.length > 2) {
                                                      return (
                                                        <span className="truncate flex items-center gap-1">
                                                          <span className="truncate">{names.slice(0, 2).join('、')}</span>
                                                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-1 py-0.2 rounded shrink-0">
                                                            +{names.length - 2}
                                                          </span>
                                                        </span>
                                                      );
                                                    }
                                                    return <span className="truncate">{subNode.receiverLabel || '所有人'}</span>;
                                                  })()}
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                                              </div>
                                              {subNode.approveModeLabel && (
                                                <div className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60 inline-block font-medium">
                                                  {subNode.approveModeLabel}
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* 子节点之间的 + 号按钮 */}
                                      <div className="relative flex flex-col items-center my-0.5 group/innergap">
                                        <div className="w-[2px] h-3 bg-slate-300 group-hover/innergap:bg-blue-400" />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isReadOnly) {
                                              onAttemptEditInReadOnly?.();
                                              return;
                                            }
                                            setActiveBranchPopoverKey(prev => prev === popoverKey ? null : popoverKey);
                                          }}
                                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-2xs z-20 ${
                                            activeBranchPopoverKey === popoverKey
                                              ? 'bg-blue-600 text-white ring-3 ring-blue-500/20'
                                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                                          }`}
                                          title="在此分支位置添加后续流程节点"
                                        >
                                          <Plus className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ${activeBranchPopoverKey === popoverKey ? 'rotate-45' : ''}`} />
                                        </button>
                                        <div className="w-[2px] h-3 bg-slate-300 group-hover/innergap:bg-blue-400" />

                                        {/* 分支加号弹出菜单 */}
                                        {activeBranchPopoverKey === popoverKey && (
                                          <>
                                            <div 
                                              className="fixed inset-0 z-40" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveBranchPopoverKey(null);
                                              }} 
                                            />
                                            <div 
                                              onClick={(e) => e.stopPropagation()}
                                              className={`popover-panel absolute top-1/2 -translate-y-1/2 z-50 w-[240px] bg-[#0c0f17] text-white rounded-2xl p-3 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-left select-none ${
                                                isNearRightEdge ? 'right-full mr-3' : 'left-full ml-3'
                                              }`}
                                            >
                                              <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent ${
                                                isNearRightEdge 
                                                  ? 'left-full border-l-[8px] border-l-[#0c0f17]' 
                                                  : 'right-full border-r-[8px] border-r-[#0c0f17]'
                                              }`} />
                                              <div className="text-[11px] font-bold text-slate-400 mb-2 px-0.5 tracking-wide">
                                                在分支内添加节点
                                              </div>
                                              <div className="space-y-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'approval')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-amber-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <FileCheck className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400">审批人</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'handle')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <User className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400">执行人</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'cc')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-teal-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <Send className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400">抄送人</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'notify')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-purple-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <Bell className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-purple-400">消息通知</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'condition')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-indigo-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <GitFork className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-400">条件分支</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAddNodeToBranch(node.id, branch.id, subIdx + 1, 'parallel')}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-teal-500/60 transition-all text-left cursor-pointer group"
                                                >
                                                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <Split className="w-3.5 h-3.5" />
                                                  </div>
                                                  <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400">并行分支</span>
                                                </button>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </React.Fragment>
                                  );
                                })}

                                {/* 如果分支内部还没有子节点，直接展示卡片正下方的 + 号按钮 */}
                                {(!branch.nodes || branch.nodes.length === 0) && (
                                  <div className="relative flex flex-col items-center my-0.5 group/innergap">
                                    <div className="w-[2px] h-3.5 bg-slate-300 group-hover/innergap:bg-blue-400" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isReadOnly) {
                                          onAttemptEditInReadOnly?.();
                                          return;
                                        }
                                        const key = `${node.id}_${branch.id}_0`;
                                        setActiveBranchPopoverKey(prev => prev === key ? null : key);
                                      }}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-xs z-20 ${
                                        activeBranchPopoverKey === `${node.id}_${branch.id}_0`
                                          ? 'bg-blue-600 text-white ring-3 ring-blue-500/20'
                                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                                      }`}
                                      title="在条件分支下方添加流程节点 (审批人/执行人/通知/分支)"
                                    >
                                      <Plus className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ${activeBranchPopoverKey === `${node.id}_${branch.id}_0` ? 'rotate-45' : ''}`} />
                                    </button>
                                    <div className="w-[2px] h-3.5 bg-slate-300 group-hover/innergap:bg-blue-400" />

                                    {/* 分支加号弹出菜单 */}
                                    {activeBranchPopoverKey === `${node.id}_${branch.id}_0` && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveBranchPopoverKey(null);
                                          }} 
                                        />
                                        <div 
                                          onClick={(e) => e.stopPropagation()}
                                          className={`popover-panel absolute top-1/2 -translate-y-1/2 z-50 w-[240px] bg-[#0c0f17] text-white rounded-2xl p-3 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-left select-none ${
                                            isNearRightEdge ? 'right-full mr-3' : 'left-full ml-3'
                                          }`}
                                        >
                                          <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent ${
                                            isNearRightEdge 
                                              ? 'left-full border-l-[8px] border-l-[#0c0f17]' 
                                              : 'right-full border-r-[8px] border-r-[#0c0f17]'
                                          }`} />
                                          <div className="text-[11px] font-bold text-slate-400 mb-2 px-0.5 tracking-wide">
                                            在分支内添加节点
                                          </div>
                                          <div className="space-y-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'approval')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-amber-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <FileCheck className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400">审批人</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'handle')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <User className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400">执行人</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'cc')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-teal-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Send className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400">抄送人</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'notify')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-purple-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Bell className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-purple-400">消息通知</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'condition')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-indigo-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <GitFork className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-400">条件分支</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleAddNodeToBranch(node.id, branch.id, 0, 'parallel')}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800 hover:border-teal-500/60 transition-all text-left cursor-pointer group"
                                            >
                                              <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Split className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400">并行分支</span>
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 卡片下方的垂直落线到汇聚横梁 */}
                              <div className="w-full h-3 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-slate-300" />
                                <div 
                                  className={`absolute bottom-0 h-[2px] bg-slate-300 ${
                                    branchesArr.length === 1
                                      ? 'hidden'
                                      : isFirst 
                                      ? 'left-1/2 right-0' 
                                      : isLast 
                                      ? 'left-0 right-1/2' 
                                      : 'left-0 right-0'
                                  }`} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 汇聚点与汇聚后垂直连线 */}
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 -mt-1 z-10 ring-2 ring-white shadow-2xs" title="分支汇聚节点" />
                        <div className="w-[2px] h-3 bg-slate-300" />
                      </div>
                    </div>
                  ) : (
                  /* 4. 中间常规流转节点卡片（审批节点、处理节点、抄送节点、通知节点） */
                  <div
                    draggable={canReorder && !isReadOnly}
                    onDragStart={(e) => {
                      if (isReadOnly) {
                        e.preventDefault();
                        onAttemptEditInReadOnly?.();
                        return;
                      }
                      if (!canReorder) return;
                      setReorderDragIndex(index);
                      e.dataTransfer.setData('text/plain', node.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setReorderDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setIsDrawerOpen(true);
                      if (node.nodeType === 'approval' || node.nodeType === 'handle') {
                        setActiveRightTab('assignee');
                      }
                    }}
                    className={`w-[260px] bg-white rounded-xl border-2 transition-all shadow-xs cursor-pointer overflow-hidden group hover:shadow-md ${
                      isSelected
                        ? `${theme.border} ring-4 ring-blue-500/15 shadow-md`
                        : 'border-slate-200 hover:border-blue-400'
                    } ${reorderDragIndex === index ? 'opacity-50 border-dashed border-blue-400' : ''}`}
                  >
                    {/* 顶部色带栏 */}
                    <div className={`px-3.5 py-2 flex items-center justify-between ${theme.headerBg}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {canReorder && (
                          <span 
                            onClick={(e) => {
                              if (isReadOnly) {
                                e.stopPropagation();
                                onAttemptEditInReadOnly?.();
                              }
                            }}
                            className={`${isReadOnly ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'} text-white/70 hover:text-white shrink-0`} 
                            title={isReadOnly ? '当前受保护版本不可调整环节顺序' : '按住拖拽可调整环节上下顺序'}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="font-bold text-xs truncate" title={node.name}>{node.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${theme.tagBg}`}>
                          {node.categoryLabel}
                        </span>
                        {canReorder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isReadOnly) {
                                onAttemptEditInReadOnly?.();
                                return;
                              }
                              handleDeleteNode(node.id);
                            }}
                            className="text-white/70 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                            title={isReadOnly ? '当前版本受保护不可删除环节' : '删除此环节'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 卡片主体 */}
                    <div className="p-3 space-y-1.5 bg-white">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span className="truncate font-medium flex items-center gap-1 min-w-0" title={node.receiverLabel || '所有人'}>
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          {(() => {
                            const names = (node.receiverLabel || '所有人').split('、');
                            if (names.length > 2) {
                              return (
                                <span className="truncate flex items-center gap-1">
                                  <span className="truncate">{names.slice(0, 2).join('、')}</span>
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-1 py-0.2 rounded shrink-0">
                                    +{names.length - 2}
                                  </span>
                                </span>
                              );
                            }
                            return <span className="truncate">{node.receiverLabel || '所有人'}</span>;
                          })()}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                      </div>

                      {node.approveModeLabel && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block font-medium">
                          {node.approveModeLabel}
                        </div>
                      )}

                      {node.timeLimitEnabled && (
                        <div className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70 inline-flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>时效: {node.timeLimitMode === 'initiator_select' ? (node.timeLimitFieldName || '发起人自选') : `${node.timeLimitHours || 24}h`}</span>
                        </div>
                      )}

                      {node.nodeType === 'notify' && (
                        <div className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60 inline-block font-medium">
                          多渠道推送 (企微/钉钉/短信)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 连线与加号按钮区域 (点击中间加号出现弹窗来显示流程节点库) */}
                {index < flowNodes.length - 1 && (
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      setDragOverIndex(index);
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === index) {
                        setDragOverIndex(null);
                      }
                    }}
                    onDrop={(e) => handleDropOnGap(index, e)}
                    className={`flex flex-col items-center my-0.5 relative group/gap ${activePopoverGapIndex === index ? 'z-30' : 'z-10'}`}
                  >
                    {/* 上半段竖线 */}
                    <div className="w-[2px] h-5 bg-slate-300 group-hover/gap:bg-blue-400 transition-colors" />

                    {/* 加号按钮 (点击在右侧直接弹出黑色卡片面板) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isReadOnly) {
                          onAttemptEditInReadOnly?.();
                          return;
                        }
                        setActivePopoverGapIndex(prev => prev === index ? null : index);
                      }}
                      className={`w-7 h-7 rounded-full shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 z-20 ${
                        activePopoverGapIndex === index
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                      title={isReadOnly ? '当前版本受保护不可新增环节' : '点击在此添加节点'}
                    >
                      <Plus className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${activePopoverGapIndex === index ? 'rotate-45' : ''}`} />
                    </button>

                    {/* 从右侧直接在当前页面弹出的黑色卡片面板 (根据参考图实现) */}
                    {activePopoverGapIndex === index && (
                      <>
                        {/* 点击外部透明遮罩层 */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopoverGapIndex(null);
                          }} 
                        />

                        {/* 黑色弹窗卡片 */}
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="popover-panel absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 w-[300px] bg-[#0c0f17] text-white rounded-2xl p-4 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-left select-none"
                        >
                          {/* 箭头指向左侧加号 */}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#0c0f17]" />

                          {/* 第一组：人工节点 */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 mb-2 px-0.5 tracking-wide">
                              人工节点
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {/* 审批人 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'approval');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                  审批人
                                </span>
                              </button>

                              {/* 执行人 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'handle');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                  执行人
                                </span>
                              </button>

                              {/* 抄送人 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'cc');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <Send className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                  抄送人
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* 第二组：消息节点 */}
                          <div className="mt-3.5">
                            <div className="text-[11px] font-bold text-slate-400 mb-2 px-0.5 tracking-wide">
                              消息节点
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {/* 消息通知 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'notify');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-blue-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                  消息通知
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* 第三组：分支节点 */}
                          <div className="mt-3.5">
                            <div className="text-[11px] font-bold text-slate-400 mb-2 px-0.5 tracking-wide">
                              分支节点
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {/* 条件分支 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'condition');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-indigo-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <GitFork className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors block">
                                    条件分支
                                  </span>
                                  <span className="text-[9px] text-slate-400 block truncate">
                                    含 IF / ELSE
                                  </span>
                                </div>
                              </button>

                              {/* 并行分支 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleInsertNode(index, 'parallel');
                                  setActivePopoverGapIndex(null);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-slate-800/90 hover:border-teal-500/60 transition-all text-left cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                  <Split className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-100 group-hover:text-teal-400 transition-colors block">
                                    并行分支
                                  </span>
                                  <span className="text-[9px] text-slate-400 block truncate">
                                    多路并发
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 下半段竖线 */}
                    <div className="w-[2px] h-5 bg-slate-300 group-hover/gap:bg-blue-400 transition-colors" />

                    {/* 向下箭头 */}
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-300 -mt-0.5 group-hover/gap:border-t-blue-400 transition-colors" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 画布自由移动与缩放悬浮控制条 */}
      <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-lg p-1.5 flex items-center gap-1 text-xs select-none">
        <button
          type="button"
          onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(1))))}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
          title="缩小画布"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] font-bold text-slate-700 px-1 min-w-[38px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom(prev => Math.min(2.0, Number((prev + 0.1).toFixed(1))))}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
          title="放大画布"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors flex items-center gap-1"
          title="复位至居中原点"
        >
          <Maximize2 className="w-3 h-3" />
          <span>居中复位</span>
        </button>
      </div>
    </div>

      {/* ===================== 右侧：上下全覆盖属性抽屉弹窗 (覆盖顶栏按钮与右侧整屏) ===================== */}
      {isDrawerOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* 半透明遮罩层 (点击遮罩收起抽屉) */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-[90] animate-in fade-in duration-150"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* 右侧抽屉主体：上下全覆盖 (fixed top-0 bottom-0 right-0 z-[100])，把上一步/下一步/测试/保存/发布全部覆盖 */}
          <div className="fixed top-0 bottom-0 right-0 z-[100] w-[560px] max-w-[95vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* 顶栏：圆形图标、节点名称、类型标签、编辑铅笔、节点配置同步、关闭 */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold shrink-0 shadow-xs ${
                  isApprovalNode ? 'bg-indigo-600' : isHandleNode ? 'bg-blue-600' : isConditionNode ? 'bg-indigo-600' : isParallelNode ? 'bg-teal-600' : 'bg-slate-700'
                }`}>
                  {isApprovalNode ? <FileCheck className="w-4 h-4" /> : isConditionNode ? <GitFork className="w-4 h-4" /> : isParallelNode ? <Split className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {isRenamingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsRenamingTitle(false);
                          handleUpdateNode({ name: tempTitle });
                        }
                      }}
                      autoFocus
                      className="px-2 py-1 text-sm font-bold text-slate-800 border border-blue-500 rounded bg-blue-50/40 outline-none w-48"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsRenamingTitle(false);
                        handleUpdateNode({ name: tempTitle });
                      }}
                      className="text-xs text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      确定
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 
                      className="text-sm font-black text-slate-800 truncate tracking-tight"
                      onClick={() => {
                        if (!isReadOnly && !isDraftNode) setIsRenamingTitle(true);
                      }}
                      title={isDraftNode ? '开始发起节点' : '点击重命名节点'}
                    >
                      {isDraftNode ? '开始发起节点' : (tempTitle || selectedNode.name)}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isDraftNode
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isApprovalNode 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : isConditionNode
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : isParallelNode
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {isDraftNode ? '发起节点' : isApprovalNode ? '审批节点' : isHandleNode ? '执行节点' : selectedNode.categoryLabel}
                    </span>
                    {!isReadOnly && !isDraftNode && (
                      <button
                        type="button"
                        onClick={() => setIsRenamingTitle(true)}
                        className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer transition-colors"
                        title="修改节点名称"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncConfig}
                  className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  title="与最新表单组件同步配置"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>节点配置同步</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  title="关闭抽屉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 选项卡导航栏：消息通知专属步骤条 (按图1、图2) 或 其他节点选项卡 */}
            {selectedNode.nodeType === 'notify' ? (
              <div className="py-5 px-10 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center justify-between max-w-sm mx-auto relative">
                  {/* 连接线 */}
                  <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-200 -z-0" />
                  <div 
                    className="absolute top-4 left-10 h-0.5 bg-blue-600 transition-all duration-300 -z-0" 
                    style={{ width: activeRightTab === 'notify_content' ? 'calc(100% - 5rem)' : '0%' }}
                  />
                  
                  {/* Step 1: 选择通知对象 */}
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('notify_target')}
                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      activeRightTab === 'notify_target' 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      1
                    </div>
                    <span className={`text-xs transition-colors ${
                      activeRightTab === 'notify_target' ? 'text-blue-600 font-bold' : 'text-slate-700 font-medium'
                    }`}>
                      选择通知对象
                    </span>
                  </button>

                  {/* Step 2: 设置通知内容 */}
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('notify_content')}
                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      activeRightTab === 'notify_content' 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      2
                    </div>
                    <span className={`text-xs transition-colors ${
                      activeRightTab === 'notify_content' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
                    }`}>
                      设置通知内容
                    </span>
                  </button>
                </div>
              </div>
            ) : !isDraftNode && currentTabs.length > 1 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div 
                  className={`grid border border-slate-200 rounded-lg overflow-hidden bg-white text-xs divide-x divide-slate-200 shadow-2xs ${
                    currentTabs.length === 5 ? 'grid-cols-5' : currentTabs.length === 4 ? 'grid-cols-4' : currentTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}
                >
                  {currentTabs.map(tab => {
                    const isActive = activeRightTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveRightTab(tab.key as any)}
                        className={`py-2 px-1 text-center font-bold transition-all cursor-pointer relative ${
                          isActive ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 选项卡内容主体区 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {isDraftNode ? (
                /* 开始发起节点弹出的面板只有一个配置项，就是字段权限，是整个表单的所有字段的权限配置 */
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>表单字段权限配置</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleSyncConfig}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="与表单设计器组件同步"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>同步表单字段</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      配置发起人在创建工单/填报发起时对整个表单所有字段的编辑、只读或隐藏权限（默认全部字段可编辑）。
                    </p>
                  </div>

                  {/* 快捷批量设置 */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-500 font-medium">快捷批量设置：</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleBatchSetPerm('editable')}
                        className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                      >
                        全部可编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetPerm('readonly')}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        全部只读
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetPerm('hidden')}
                        className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      >
                        全部隐藏
                      </button>
                    </div>
                  </div>

                  {/* 字段权限表格 */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-4 w-52">表单字段名称</th>
                          <th className="py-2.5 px-3 text-center w-24">可编辑</th>
                          <th className="py-2.5 px-3 text-center w-24">只读</th>
                          <th className="py-2.5 px-3 text-center w-24">隐藏</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* 全选行 */}
                        <tr className="bg-slate-50/70 font-semibold border-b border-slate-200">
                          <td className="py-2.5 px-4 text-slate-800">全选所有字段</td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={displayFieldsList.length > 0 && displayFieldsList.every(f => (fieldPerms[f.key] || 'editable') === 'editable')}
                              onChange={() => handleBatchSetPerm('editable')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为可编辑"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={displayFieldsList.length > 0 && displayFieldsList.every(f => fieldPerms[f.key] === 'readonly')}
                              onChange={() => handleBatchSetPerm('readonly')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为只读"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={displayFieldsList.length > 0 && displayFieldsList.every(f => fieldPerms[f.key] === 'hidden')}
                              onChange={() => handleBatchSetPerm('hidden')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为隐藏"
                            />
                          </td>
                        </tr>

                        {/* 各字段权限行 */}
                        {displayFieldsList.map((f) => {
                          const currentVal = fieldPerms[f.key] || 'editable';
                          return (
                            <tr key={f.key} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 text-slate-800 font-medium">
                                <div className="flex items-center gap-1.5">
                                  {f.required && <span className="text-red-500 font-bold">*</span>}
                                  <span className="truncate max-w-[200px]" title={f.label}>{f.label}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({f.key})</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`draft_perm_${f.key}`}
                                  checked={currentVal === 'editable'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    const next = { ...fieldPerms, [f.key]: 'editable' as const };
                                    setFieldPerms(next);
                                    handleUpdateNode({ fieldPermissions: next });
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`draft_perm_${f.key}`}
                                  checked={currentVal === 'readonly'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    const next = { ...fieldPerms, [f.key]: 'readonly' as const };
                                    setFieldPerms(next);
                                    handleUpdateNode({ fieldPermissions: next });
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`draft_perm_${f.key}`}
                                  checked={currentVal === 'hidden'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    const next = { ...fieldPerms, [f.key]: 'hidden' as const };
                                    setFieldPerms(next);
                                    handleUpdateNode({ fieldPermissions: next });
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  {/* ===================== TAB 1: 审批人 / 执行人 ===================== */}
                  {activeRightTab === 'assignee' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      {isApprovalNode ? (
                        /* ========== 审批节点：审批人设置 (严格 5 种类型：指定成员、部门主管、多级主管、发起人本人、表单内成员字段) ========== */
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-800">
                            审批人设置
                          </h4>

                          {/* 选项单选列表 (5 种) */}
                          <div className="grid grid-cols-5 gap-y-3 gap-x-2 pt-1 text-xs">
                            {[
                              { id: 'specified_member', label: '指定成员' },
                              { id: 'dept_leader', label: '部门主管' },
                              { id: 'multi_leader', label: '多级主管' },
                              { id: 'initiator', label: '发起人本人' },
                              { id: 'form_member', label: '表单内成员字段' }
                            ].map((item) => {
                              const isChecked = assigneeType === item.id;
                              return (
                                <label 
                                  key={item.id} 
                                  className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-slate-700 hover:text-slate-900 select-none"
                                >
                                  <input
                                    type="radio"
                                    name="assigneeType_approval"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      setAssigneeType(item.id);
                                      const numChinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
                                      const labelMap: Record<string, string> = {
                                        'specified_member': selectedApprovers.map(m => m.name).join('、') || '指定成员',
                                        'dept_leader': `发起人的第${numChinese[deptLeaderLevel || 1]}级主管`,
                                        'multi_leader': supervisorEndpointType === 'top_level' ? (supervisorDirectoryLevel === 'top' ? '通讯录最高主管' : `通讯录第${supervisorDirectoryLevel.replace('level_', '')}级主管`) : `不超过发起人向上第${supervisorMaxLevel || 1}级主管`,
                                        'initiator': '发起人本人',
                                        'form_member': formMemberField || '表单内成员'
                                      };
                                      handleUpdateNode({
                                        assigneeType: item.id as any,
                                        receiverLabel: labelMap[item.id] || '审批人'
                                      });
                                    }}
                                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span className={isChecked ? 'font-bold text-slate-900' : ''}>{item.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* 1. 指定成员 -> 选择审批人输入框 */}
                          {assigneeType === 'specified_member' && (
                            <div className="pt-2 space-y-1.5 animate-in fade-in duration-150">
                              <label className="text-xs font-bold text-slate-700 block">
                                <span className="text-red-500">*</span> 选择审批人
                              </label>
                              <div 
                                onClick={() => {
                                  if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                  setTempNodeSelectedMembers([...selectedApprovers]);
                                  setNodeMemberSearchKeyword('');
                                  setNodeMemberOrgFilter('ALL');
                                  setNodeMemberRoleFilter('ALL');
                                  setIsNodeMemberSelectModalOpen(true);
                                }}
                                className="w-full min-h-[38px] p-2 bg-white border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-xl flex items-center justify-between shadow-2xs cursor-pointer transition-all group"
                              >
                                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                  {selectedApprovers.length > 0 ? (
                                    <>
                                      {selectedApprovers.slice(0, 2).map((mem) => (
                                        <span 
                                          key={mem.id || mem.name}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900 shadow-2xs"
                                        >
                                          <div className={`w-3.5 h-3.5 rounded-full ${mem.avatarBg || 'bg-blue-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                                            {mem.name.slice(0, 1)}
                                          </div>
                                          <span>{mem.name}</span>
                                          <span className="text-[10px] text-blue-600/80 font-normal">({mem.role})</span>
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const next = selectedApprovers.filter(m => m.id !== mem.id);
                                                setSelectedApprovers(next);
                                                handleUpdateNode({
                                                  selectedMembers: next,
                                                  receiverLabel: next.map(n => n.name).join('、') || '未指定人员'
                                                });
                                              }}
                                              className="text-blue-400 hover:text-rose-500 ml-0.5 p-0.5 rounded transition-colors"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </span>
                                      ))}
                                      {selectedApprovers.length > 2 && (
                                        <span 
                                          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-100/80 border border-blue-300 text-xs font-bold text-blue-800 shadow-2xs shrink-0"
                                          title={`其他成员: ${selectedApprovers.slice(2).map(m => m.name).join('、')}`}
                                        >
                                          +{selectedApprovers.length - 2}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400 pl-1 flex items-center gap-1.5">
                                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                                      <span>点击选择审批人（支持按角色/按机构快速筛选）...</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 pl-2 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors">
                                    {selectedApprovers.length > 0 ? '重新选择' : '选择人员'}
                                  </span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. 部门主管设置 */}
                          {assigneeType === 'dept_leader' && (
                            <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">
                                  <span className="text-red-500">*</span> 选择部门主管
                                </label>
                                <div className="relative">
                                  <select
                                    value={deptLeaderLevel || 1}
                                    onChange={(e) => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      const lvl = parseInt(e.target.value, 10);
                                      setDeptLeaderLevel(lvl);
                                      const numChinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
                                      handleUpdateNode({
                                        assigneeType: 'dept_leader',
                                        deptLeaderLevel: lvl,
                                        receiverLabel: `发起人的第${numChinese[lvl] || lvl}级主管`
                                      });
                                    }}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-lg text-xs font-medium text-slate-800 outline-none appearance-none transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <option value={1}>第一级主管（直属主管）</option>
                                    <option value={2}>第二级主管（分管主管）</option>
                                    <option value={3}>第三级主管</option>
                                    <option value={4}>第四级主管</option>
                                    <option value={5}>第五级主管</option>
                                    <option value={6}>第六级主管</option>
                                    <option value={7}>第七级主管</option>
                                    <option value={8}>第八级主管</option>
                                    <option value={9}>第九级主管</option>
                                    <option value={10}>第十级主管</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>

                              <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-800/90 leading-relaxed flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>流程将指派给发起人所在部门向上的第 {deptLeaderLevel || 1} 级主管人员审批。</span>
                              </div>
                            </div>
                          )}

                          {/* 3. 多级主管设置 */}
                          {assigneeType === 'multi_leader' && (
                            <div className="pt-2 space-y-4 animate-in fade-in duration-150 text-xs">
                              {/* 审批终点 */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 block">审批终点</label>
                                
                                <div className="space-y-3">
                                  {/* 第一个选项：不超过发起人向上的第n级主管，下拉项 1、2、3、4 */}
                                  <div className="flex items-center gap-2 text-slate-700 select-none">
                                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                      <input
                                        type="radio"
                                        name="supervisorEndpointType"
                                        checked={supervisorEndpointType === 'specific_level'}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEndpointType('specific_level');
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'specific_level',
                                            supervisorMaxLevel: supervisorMaxLevel || 1,
                                            receiverLabel: `不超过发起人向上的第${supervisorMaxLevel || 1}级主管`
                                          });
                                        }}
                                        className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span className={supervisorEndpointType === 'specific_level' ? 'font-bold text-slate-900' : ''}>
                                        不超过发起人向上的
                                      </span>
                                    </label>

                                    <div className="relative w-36">
                                      <select
                                        value={supervisorMaxLevel || 1}
                                        disabled={supervisorEndpointType !== 'specific_level'}
                                        onChange={(e) => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          const lvl = parseInt(e.target.value, 10);
                                          setSupervisorMaxLevel(lvl);
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'specific_level',
                                            supervisorMaxLevel: lvl,
                                            receiverLabel: `不超过发起人向上的第${lvl}级主管`
                                          });
                                        }}
                                        className={`w-full h-8 pl-3 pr-7 bg-white border rounded-lg text-xs font-medium outline-none appearance-none transition-colors shadow-2xs ${
                                          supervisorEndpointType === 'specific_level'
                                            ? 'border-slate-300 text-slate-800 hover:border-blue-500 cursor-pointer'
                                            : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                        }`}
                                      >
                                        <option value={1}>第 1 级主管</option>
                                        <option value={2}>第 2 级主管</option>
                                        <option value={3}>第 3 级主管</option>
                                        <option value={4}>第 4 级主管</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* 第二个选项：通讯录中的最高，然后 1、2、3、4 */}
                                  <div className="flex items-center gap-2 text-slate-700 select-none">
                                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                      <input
                                        type="radio"
                                        name="supervisorEndpointType"
                                        checked={supervisorEndpointType === 'top_level'}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEndpointType('top_level');
                                          const labelMap: Record<string, string> = {
                                            'top': '通讯录中的最高层级主管',
                                            'level_1': '通讯录中的第 1 级主管',
                                            'level_2': '通讯录中的第 2 级主管',
                                            'level_3': '通讯录中的第 3 级主管',
                                            'level_4': '通讯录中的第 4 级主管'
                                          };
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'top_level',
                                            supervisorDirectoryLevel: supervisorDirectoryLevel,
                                            receiverLabel: labelMap[supervisorDirectoryLevel] || '通讯录主管'
                                          });
                                        }}
                                        className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span className={supervisorEndpointType === 'top_level' ? 'font-bold text-slate-900' : ''}>
                                        通讯录中的
                                      </span>
                                    </label>

                                    <div className="relative w-40">
                                      <select
                                        value={supervisorDirectoryLevel}
                                        disabled={supervisorEndpointType !== 'top_level'}
                                        onChange={(e) => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          const val = e.target.value;
                                          setSupervisorDirectoryLevel(val);
                                          const labelMap: Record<string, string> = {
                                            'top': '通讯录中的最高层级主管',
                                            'level_1': '通讯录中的第 1 级主管',
                                            'level_2': '通讯录中的第 2 级主管',
                                            'level_3': '通讯录中的第 3 级主管',
                                            'level_4': '通讯录中的第 4 级主管'
                                          };
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'top_level',
                                            supervisorDirectoryLevel: val,
                                            receiverLabel: labelMap[val] || '通讯录主管'
                                          });
                                        }}
                                        className={`w-full h-8 pl-3 pr-7 bg-white border rounded-lg text-xs font-medium outline-none appearance-none transition-colors shadow-2xs ${
                                          supervisorEndpointType === 'top_level'
                                            ? 'border-slate-300 text-slate-800 hover:border-blue-500 cursor-pointer'
                                            : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                        }`}
                                      >
                                        <option value="top">最高层级主管</option>
                                        <option value="level_1">第 1 级主管</option>
                                        <option value="level_2">第 2 级主管</option>
                                        <option value="level_3">第 3 级主管</option>
                                        <option value="level_4">第 4 级主管</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 找不到主管时 */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-800 block">找不到主管时</label>
                                <div className="space-y-2 text-slate-700">
                                  {[
                                    { id: 'auto_pass', label: '自动通过' },
                                    { id: 'admin', label: '自动转交管理员' },
                                    { id: 'specified', label: '指定人员审批' }
                                  ].map(opt => (
                                    <label
                                      key={opt.id}
                                      className="flex items-center gap-2 cursor-pointer select-none"
                                    >
                                      <input
                                        type="radio"
                                        name="supervisorEmptyAction"
                                        checked={supervisorEmptyAction === opt.id}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEmptyAction(opt.id as any);
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEmptyAction: opt.id as any
                                          });
                                        }}
                                        className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span className={supervisorEmptyAction === opt.id ? 'font-bold text-slate-900' : ''}>{opt.label}</span>
                                    </label>
                                  ))}
                                </div>

                                {supervisorEmptyAction === 'specified' && (
                                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-slate-500 text-[11px]">备用审批人:</span>
                                      {supervisorFallbackApprovers.length > 0 ? (
                                        supervisorFallbackApprovers.map(m => (
                                          <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px]">
                                            {m.name}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">未选择人员</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                        setNodeMemberSelectTarget('supervisor_fallback');
                                        setTempNodeSelectedMembers([...supervisorFallbackApprovers]);
                                        setNodeMemberSearchKeyword('');
                                        setNodeMemberOrgFilter('ALL');
                                        setNodeMemberRoleFilter('ALL');
                                        setIsNodeMemberSelectModalOpen(true);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer shrink-0 pl-2"
                                    >
                                      {supervisorFallbackApprovers.length > 0 ? '修改人员' : '选择人员'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 4. 发起人本人 */}
                          {assigneeType === 'initiator' && (
                            <div className="pt-2 p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1 text-xs animate-in fade-in duration-150">
                              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                                <Info className="w-3.5 h-3.5 text-blue-600" />
                                <span>发起人本人审批说明</span>
                              </div>
                              <p className="text-[11px] text-blue-800/90 leading-relaxed pl-5">
                                流程流转至当前节点时，将由该工单的<strong>发起人本人</strong>进行确认与审批办理。
                              </p>
                            </div>
                          )}

                          {/* 5. 表单内成员字段 */}
                          {assigneeType === 'form_member' && (
                            <div className="pt-2 space-y-1.5 animate-in fade-in duration-150">
                              <label className="text-xs font-bold text-slate-700 block">
                                <span className="text-red-500">*</span> 选择表单成员字段
                              </label>
                              <div className="relative">
                                <select
                                  value={formMemberField}
                                  onChange={(e) => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFormMemberField(e.target.value);
                                    handleUpdateNode({
                                      assigneeType: 'form_member',
                                      formMemberFieldName: e.target.value,
                                      receiverLabel: e.target.value
                                    });
                                  }}
                                  className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-medium text-slate-800 outline-none appearance-none transition-colors cursor-pointer shadow-2xs"
                                >
                                  <option value="派单人员">派单人员</option>
                                  <option value="责任人">责任人</option>
                                  <option value="经办人">经办人</option>
                                  <option value="申请人">申请人</option>
                                  <option value="填报民警">填报民警</option>
                                  {displayFieldsList.map(f => (
                                    <option key={f.key} value={f.label}>{f.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ========== 执行节点/处理节点：执行人设置 (去除指定角色，保留指定成员、部门主管、多级主管、发起人本人、表单成员字段) ========== */
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-800">
                            执行人设置
                          </h4>

                          {/* 选项单选列表 (5 种) */}
                          <div className="grid grid-cols-5 gap-y-3 gap-x-2 pt-1 text-xs">
                            {[
                              { id: 'specified_member', label: '指定成员' },
                              { id: 'dept_leader', label: '部门主管' },
                              { id: 'multi_leader', label: '多级主管' },
                              { id: 'initiator', label: '发起人本人' },
                              { id: 'form_member', label: '表单成员字段' }
                            ].map((item) => {
                              const isChecked = assigneeType === item.id;
                              return (
                                <label 
                                  key={item.id} 
                                  className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-slate-700 hover:text-slate-900 select-none"
                                >
                                  <input
                                    type="radio"
                                    name="assigneeType_handle"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      setAssigneeType(item.id);
                                      const numChinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
                                      const labelMap: Record<string, string> = {
                                        'specified_member': selectedApprovers.map(m => m.name).join('、') || '指定成员',
                                        'dept_leader': `发起人的第${numChinese[deptLeaderLevel || 1]}级主管`,
                                        'multi_leader': supervisorEndpointType === 'top_level' ? (supervisorDirectoryLevel === 'top' ? '通讯录最高主管' : `通讯录第${supervisorDirectoryLevel.replace('level_', '')}级主管`) : `不超过发起人向上第${supervisorMaxLevel || 1}级主管`,
                                        'initiator': '发起人本人',
                                        'form_member': formMemberField || '表单成员字段'
                                      };
                                      handleUpdateNode({
                                        assigneeType: item.id as any,
                                        receiverLabel: labelMap[item.id] || '执行人'
                                      });
                                    }}
                                    className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className={isChecked ? 'font-bold text-slate-900' : ''}>{item.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* 1. 指定成员 -> 选择执行人 */}
                          {assigneeType === 'specified_member' && (
                            <div className="pt-2 space-y-1.5 animate-in fade-in duration-150">
                              <label className="text-xs font-bold text-slate-700 block">
                                <span className="text-red-500">*</span> 选择执行人
                              </label>
                              <div 
                                onClick={() => {
                                  if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                  setTempNodeSelectedMembers([...selectedApprovers]);
                                  setNodeMemberSearchKeyword('');
                                  setNodeMemberOrgFilter('ALL');
                                  setNodeMemberRoleFilter('ALL');
                                  setIsNodeMemberSelectModalOpen(true);
                                }}
                                className="w-full min-h-[38px] p-2 bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-500 rounded-xl flex items-center justify-between shadow-2xs cursor-pointer transition-all group"
                              >
                                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                  {selectedApprovers.length > 0 ? (
                                    <>
                                      {selectedApprovers.slice(0, 2).map((mem) => (
                                        <span 
                                          key={mem.id || mem.name}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 shadow-2xs"
                                        >
                                          <div className={`w-3.5 h-3.5 rounded-full ${mem.avatarBg || 'bg-emerald-600'} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                                            {mem.name.slice(0, 1)}
                                          </div>
                                          <span>{mem.name}</span>
                                          <span className="text-[10px] text-emerald-700/80 font-normal">({mem.role})</span>
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const next = selectedApprovers.filter(m => m.id !== mem.id);
                                                setSelectedApprovers(next);
                                                handleUpdateNode({
                                                  selectedMembers: next,
                                                  receiverLabel: next.map(n => n.name).join('、') || '未指定人员'
                                                });
                                              }}
                                              className="text-emerald-400 hover:text-rose-500 ml-0.5 p-0.5 rounded transition-colors"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </span>
                                      ))}
                                      {selectedApprovers.length > 2 && (
                                        <span 
                                          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs shrink-0"
                                          title={`其他成员: ${selectedApprovers.slice(2).map(m => m.name).join('、')}`}
                                        >
                                          +{selectedApprovers.length - 2}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400 pl-1 flex items-center gap-1.5">
                                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                                      <span>点击选择执行人（支持按角色/按机构快速筛选）...</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 pl-2 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors">
                                    {selectedApprovers.length > 0 ? '重新选择' : '选择人员'}
                                  </span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. 部门主管设置 */}
                          {assigneeType === 'dept_leader' && (
                            <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">
                                  <span className="text-red-500">*</span> 选择部门主管
                                </label>
                                <div className="relative">
                                  <select
                                    value={deptLeaderLevel || 1}
                                    onChange={(e) => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      const lvl = parseInt(e.target.value, 10);
                                      setDeptLeaderLevel(lvl);
                                      const numChinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
                                      handleUpdateNode({
                                        assigneeType: 'dept_leader',
                                        deptLeaderLevel: lvl,
                                        receiverLabel: `发起人的第${numChinese[lvl] || lvl}级主管`
                                      });
                                    }}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-500 rounded-lg text-xs font-medium text-slate-800 outline-none appearance-none transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <option value={1}>第一级主管（直属主管）</option>
                                    <option value={2}>第二级主管（分管主管）</option>
                                    <option value={3}>第三级主管</option>
                                    <option value={4}>第四级主管</option>
                                    <option value={5}>第五级主管</option>
                                    <option value={6}>第六级主管</option>
                                    <option value={7}>第七级主管</option>
                                    <option value={8}>第八级主管</option>
                                    <option value={9}>第九级主管</option>
                                    <option value={10}>第十级主管</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>

                              <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs text-emerald-800/90 leading-relaxed flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>流程将指派给发起人所在部门向上的第 {deptLeaderLevel || 1} 级主管人员处理。</span>
                              </div>
                            </div>
                          )}

                          {/* 3. 多级主管设置 (配置与审批节点完全一致) */}
                          {assigneeType === 'multi_leader' && (
                            <div className="pt-2 space-y-4 animate-in fade-in duration-150 text-xs">
                              {/* 审批终点 */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 block">审批终点</label>
                                
                                <div className="space-y-3">
                                  {/* 第一个选项：不超过发起人向上的第n级主管，下拉项 1、2、3、4 */}
                                  <div className="flex items-center gap-2 text-slate-700 select-none">
                                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                      <input
                                        type="radio"
                                        name="supervisorEndpointType_handle"
                                        checked={supervisorEndpointType === 'specific_level'}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEndpointType('specific_level');
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'specific_level',
                                            supervisorMaxLevel: supervisorMaxLevel || 1,
                                            receiverLabel: `不超过发起人向上的第${supervisorMaxLevel || 1}级主管`
                                          });
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span className={supervisorEndpointType === 'specific_level' ? 'font-bold text-slate-900' : ''}>
                                        不超过发起人向上的
                                      </span>
                                    </label>

                                    <div className="relative w-36">
                                      <select
                                        value={supervisorMaxLevel || 1}
                                        disabled={supervisorEndpointType !== 'specific_level'}
                                        onChange={(e) => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          const lvl = parseInt(e.target.value, 10);
                                          setSupervisorMaxLevel(lvl);
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'specific_level',
                                            supervisorMaxLevel: lvl,
                                            receiverLabel: `不超过发起人向上的第${lvl}级主管`
                                          });
                                        }}
                                        className={`w-full h-8 pl-3 pr-7 bg-white border rounded-lg text-xs font-medium outline-none appearance-none transition-colors shadow-2xs ${
                                          supervisorEndpointType === 'specific_level'
                                            ? 'border-slate-300 text-slate-800 hover:border-emerald-500 cursor-pointer'
                                            : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                        }`}
                                      >
                                        <option value={1}>第 1 级主管</option>
                                        <option value={2}>第 2 级主管</option>
                                        <option value={3}>第 3 级主管</option>
                                        <option value={4}>第 4 级主管</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* 第二个选项：通讯录中的最高，然后 1、2、3、4 */}
                                  <div className="flex items-center gap-2 text-slate-700 select-none">
                                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                      <input
                                        type="radio"
                                        name="supervisorEndpointType_handle"
                                        checked={supervisorEndpointType === 'top_level'}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEndpointType('top_level');
                                          const labelMap: Record<string, string> = {
                                            'top': '通讯录中的最高层级主管',
                                            'level_1': '通讯录中的第 1 级主管',
                                            'level_2': '通讯录中的第 2 级主管',
                                            'level_3': '通讯录中的第 3 级主管',
                                            'level_4': '通讯录中的第 4 级主管'
                                          };
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'top_level',
                                            supervisorDirectoryLevel: supervisorDirectoryLevel,
                                            receiverLabel: labelMap[supervisorDirectoryLevel] || '通讯录主管'
                                          });
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span className={supervisorEndpointType === 'top_level' ? 'font-bold text-slate-900' : ''}>
                                        通讯录中的
                                      </span>
                                    </label>

                                    <div className="relative w-40">
                                      <select
                                        value={supervisorDirectoryLevel}
                                        disabled={supervisorEndpointType !== 'top_level'}
                                        onChange={(e) => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          const val = e.target.value;
                                          setSupervisorDirectoryLevel(val);
                                          const labelMap: Record<string, string> = {
                                            'top': '通讯录中的最高层级主管',
                                            'level_1': '通讯录中的第 1 级主管',
                                            'level_2': '通讯录中的第 2 级主管',
                                            'level_3': '通讯录中的第 3 级主管',
                                            'level_4': '通讯录中的第 4 级主管'
                                          };
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEndpointType: 'top_level',
                                            supervisorDirectoryLevel: val,
                                            receiverLabel: labelMap[val] || '通讯录主管'
                                          });
                                        }}
                                        className={`w-full h-8 pl-3 pr-7 bg-white border rounded-lg text-xs font-medium outline-none appearance-none transition-colors shadow-2xs ${
                                          supervisorEndpointType === 'top_level'
                                            ? 'border-slate-300 text-slate-800 hover:border-emerald-500 cursor-pointer'
                                            : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                        }`}
                                      >
                                        <option value="top">最高层级主管</option>
                                        <option value="level_1">第 1 级主管</option>
                                        <option value="level_2">第 2 级主管</option>
                                        <option value="level_3">第 3 级主管</option>
                                        <option value="level_4">第 4 级主管</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 找不到主管时 */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-800 block">找不到主管时</label>
                                <div className="space-y-2 text-slate-700">
                                  {[
                                    { id: 'auto_pass', label: '自动通过' },
                                    { id: 'admin', label: '自动转交管理员' },
                                    { id: 'specified', label: '指定人员审批' }
                                  ].map(opt => (
                                    <label
                                      key={opt.id}
                                      className="flex items-center gap-2 cursor-pointer select-none"
                                    >
                                      <input
                                        type="radio"
                                        name="supervisorEmptyAction_handle"
                                        checked={supervisorEmptyAction === opt.id}
                                        onChange={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          setSupervisorEmptyAction(opt.id as any);
                                          handleUpdateNode({
                                            assigneeType: 'multi_leader',
                                            supervisorEmptyAction: opt.id as any
                                          });
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span className={supervisorEmptyAction === opt.id ? 'font-bold text-slate-900' : ''}>{opt.label}</span>
                                    </label>
                                  ))}
                                </div>

                                {supervisorEmptyAction === 'specified' && (
                                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-slate-500 text-[11px]">备用经办人:</span>
                                      {supervisorFallbackApprovers.length > 0 ? (
                                        supervisorFallbackApprovers.map(m => (
                                          <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                                            {m.name}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">未选择人员</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                        setNodeMemberSelectTarget('supervisor_fallback');
                                        setTempNodeSelectedMembers([...supervisorFallbackApprovers]);
                                        setNodeMemberSearchKeyword('');
                                        setNodeMemberOrgFilter('ALL');
                                        setNodeMemberRoleFilter('ALL');
                                        setIsNodeMemberSelectModalOpen(true);
                                      }}
                                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer shrink-0 pl-2"
                                    >
                                      {supervisorFallbackApprovers.length > 0 ? '修改人员' : '选择人员'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 4. 发起人本人 */}
                          {assigneeType === 'initiator' && (
                            <div className="pt-2 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 text-xs animate-in fade-in duration-150">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <Info className="w-3.5 h-3.5 text-emerald-600" />
                                <span>发起人本人办理说明</span>
                              </div>
                              <p className="text-[11px] text-emerald-800/90 leading-relaxed pl-5">
                                流程流转至当前节点时，将由该工单的<strong>发起人本人</strong>进行处理与提交。
                              </p>
                            </div>
                          )}

                          {/* 5. 表单成员字段 */}
                          {assigneeType === 'form_member' && (
                            <div className="pt-2 space-y-1.5 animate-in fade-in duration-150">
                              <label className="text-xs font-bold text-slate-700 block">
                                <span className="text-red-500">*</span> 选择表单成员字段
                              </label>
                              <div className="relative">
                                <select
                                  value={formMemberField}
                                  onChange={(e) => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFormMemberField(e.target.value);
                                    handleUpdateNode({
                                      assigneeType: 'form_member',
                                      formMemberFieldName: e.target.value,
                                      receiverLabel: e.target.value
                                    });
                                  }}
                                  className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-xs font-medium text-slate-800 outline-none appearance-none transition-colors cursor-pointer shadow-2xs"
                                >
                                  <option value="派单人员">派单人员</option>
                                  <option value="责任人">责任人</option>
                                  <option value="经办人">经办人</option>
                                  <option value="申请人">申请人</option>
                                  <option value="填报民警">填报民警</option>
                                  {displayFieldsList.map(f => (
                                    <option key={f.key} value={f.label}>{f.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                  {/* 分隔与多人办理/审批说明 */}
                  {isHandleNode ? (
                    /* 执行节点：去除多人办理配置，新增抢单协同办理规则说明提示 */
                    <div className="pt-2 animate-in fade-in duration-150">
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>多人办理规则说明</span>
                        </div>
                        <p className="text-[11px] text-amber-800/90 leading-relaxed pl-5">
                          若执行人处设置了多名成员，系统采用协同经办机制：<strong>任意一名成员处理并提交任务后，当前节点即办理完成</strong>，其余成员待办列表中的该任务将自动同步完结并消失。
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* 审批节点：在指定成员、部门主管、表单内成员字段模式下保留多人审批方式设置 */
                    (assigneeType === 'specified_member' || assigneeType === 'dept_leader' || assigneeType === 'form_member') && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                        <div className="w-full h-px bg-slate-100" />
                        <h4 className="text-sm font-bold text-slate-800">
                          多人审批方式
                        </h4>
                        <div className="space-y-2.5 text-xs text-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="multiApproveType"
                              checked={multiApproveType === 'all'}
                              onChange={() => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                setMultiApproveType('all');
                                handleUpdateNode({ multiApproveType: 'all', approveMode: 'all', approveModeLabel: '会签(需全员同意)' });
                              }}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={multiApproveType === 'all' ? 'font-bold text-slate-900' : ''}>
                              会签（需所有审批人同意）
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="multiApproveType"
                              checked={multiApproveType === 'or_sign'}
                              onChange={() => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                setMultiApproveType('or_sign');
                                handleUpdateNode({ multiApproveType: 'or_sign', approveMode: 'or_sign', approveModeLabel: '或签(一名同意即可)' });
                              }}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={multiApproveType === 'or_sign' ? 'font-bold text-slate-900' : ''}>
                              或签（一名审批人同意即可）
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="multiApproveType"
                              checked={multiApproveType === 'sequential'}
                              onChange={() => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                setMultiApproveType('sequential');
                                handleUpdateNode({ multiApproveType: 'sequential', approveMode: 'single', approveModeLabel: '依次审批' });
                              }}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={multiApproveType === 'sequential' ? 'font-bold text-slate-900' : ''}>
                              依次审批（按顺序依次审批）
                            </span>
                          </label>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ===================== TAB 2: 审批按钮 / 操作按钮 (按顺序排列与详细小括号提示) ===================== */}
              {activeRightTab === 'buttons' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {isApprovalNode ? '审批按钮' : '操作按钮'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        开启开关后该操作按钮将在当前环节界面中允许经办人员执行。
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-3">操作按钮</th>
                          <th className="py-2.5 px-3">显示名称</th>
                          <th className="py-2.5 px-3">
                            <span className="flex items-center gap-1">
                              <span>{isApprovalNode ? '审批意见' : '办理意见'}</span>
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              <span className="text-blue-600 cursor-pointer font-normal hover:underline ml-1">编辑</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 text-center w-24">启用</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {nodeButtons.map((btn, idx) => (
                          <tr key={btn.key} className="hover:bg-slate-50/60 transition-colors">
                            {/* 操作按钮名称与问号移入提示 */}
                            <td className="py-3 px-3 text-slate-700">
                              <div className="flex items-center gap-1.5 leading-snug">
                                <span className="font-bold text-slate-900 text-xs">{btn.label}</span>
                                {btn.tip && (
                                  <div className="relative group inline-flex items-center">
                                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
                                    <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 w-64 p-2 bg-slate-800 text-white text-[11px] leading-relaxed rounded-md shadow-lg pointer-events-none whitespace-normal animate-in fade-in duration-150">
                                      {btn.tip}
                                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 显示名称 (可即时编辑) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {editingBtnKey === btn.key ? (
                                <input
                                  type="text"
                                  value={btn.displayName}
                                  onChange={(e) => {
                                    const updated = [...nodeButtons];
                                    updated[idx].displayName = e.target.value;
                                    setNodeButtons(updated);
                                  }}
                                  onBlur={() => setEditingBtnKey(null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingBtnKey(null); }}
                                  autoFocus
                                  className="px-1.5 py-0.5 border border-blue-400 rounded w-20 outline-none text-xs"
                                />
                              ) : (
                                <span 
                                  onClick={() => {
                                    if (!isReadOnly) setEditingBtnKey(btn.key);
                                  }}
                                  className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600 text-slate-800"
                                >
                                  <span>{btn.displayName}</span>
                                  <Pencil className="w-2.5 h-2.5 text-slate-400" />
                                </span>
                              )}
                            </td>

                            {/* 审批意见 */}
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {btn.opinionPolicy}
                            </td>

                            {/* 启用开关 */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                  const updated = [...nodeButtons];
                                  updated[idx].enabled = !updated[idx].enabled;
                                  setNodeButtons(updated);
                                }}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer inline-flex items-center ${
                                  btn.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                                }`}
                                title={btn.enabled ? '已启用，点击停用' : '未启用，点击启用'}
                              >
                                <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===================== TAB 3: 设置字段权限 ===================== */}
              {activeRightTab === 'permissions' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      <span>字段权限</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </h4>
                    <button
                      type="button"
                      onClick={handleSyncConfig}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      同步表单组件状态
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-4 w-44">组件名称</th>
                          <th className="py-2.5 px-3 text-center w-24">可编辑</th>
                          <th className="py-2.5 px-3 text-center w-24">只读</th>
                          <th className="py-2.5 px-3 text-center w-24">隐藏</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* 全选行 */}
                        <tr className="bg-slate-50/70 font-semibold border-b border-slate-200">
                          <td className="py-2.5 px-4 text-slate-800">全选</td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              onChange={() => handleBatchSetPerm('editable')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为可编辑"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              onChange={() => handleBatchSetPerm('readonly')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为只读"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              onChange={() => handleBatchSetPerm('hidden')}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="全部设为隐藏"
                            />
                          </td>
                        </tr>

                        {/* 各字段权限行 */}
                        {displayFieldsList.map((f) => {
                          const currentVal = fieldPerms[f.key] || 'readonly';
                          return (
                            <tr key={f.key} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2 px-4 text-slate-800 font-medium truncate max-w-[170px]" title={f.label}>
                                {f.label}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`perm_${f.key}`}
                                  checked={currentVal === 'editable'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFieldPerms(prev => ({ ...prev, [f.key]: 'editable' }));
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`perm_${f.key}`}
                                  checked={currentVal === 'readonly'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFieldPerms(prev => ({ ...prev, [f.key]: 'readonly' }));
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`perm_${f.key}`}
                                  checked={currentVal === 'hidden'}
                                  onChange={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFieldPerms(prev => ({ ...prev, [f.key]: 'hidden' }));
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===================== TAB: 条件分支规则设置 ===================== */}
              {activeRightTab === 'branch_rule' && isConditionNode && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 分支切换选择器 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">分支列表与优先级</label>
                      <button
                        type="button"
                        onClick={() => handleAddBranchToNode(selectedNode.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>添加条件</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedNode.branches || []).map((b, bIdx) => {
                        const isCur = (selectedBranchId || selectedNode.branches?.[0]?.id) === b.id;
                        const isIf = b.branchType === 'if';
                        return (
                          <button
                            key={b.id || bIdx}
                            type="button"
                            onClick={() => setSelectedBranchId(b.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isCur
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`px-1 py-0.2 rounded text-[9px] font-black ${
                              isIf ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                            }`}>
                              {isIf ? 'IF' : 'ELSE'}
                            </span>
                            <span>{b.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 当前选中分支的详细配置 */}
                  {(() => {
                    const currentBranch = (selectedNode.branches || []).find(
                      b => b.id === (selectedBranchId || selectedNode.branches?.[0]?.id)
                    ) || selectedNode.branches?.[0];
                    if (!currentBranch) return null;
                    const isIf = currentBranch.branchType === 'if';
                    const configMode = currentBranch.configMode || (currentBranch.formula ? 'formula' : 'condition');
                    const branchConditions: FlowBranchConditionRule[] = (currentBranch.conditions && currentBranch.conditions.length > 0)
                      ? currentBranch.conditions
                      : [{
                          id: 'rule_default_1',
                          fieldKey: 'initiator',
                          fieldName: '发起人',
                          operator: 'eq',
                          value: '',
                          valueLabel: '选择人员'
                        }];

                    return (
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        {/* 分支基本信息 */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-black tracking-wide text-white shadow-2xs ${
                                isIf ? 'bg-blue-600' : 'bg-slate-600'
                              }`}>
                                {isIf ? 'IF 条件分支' : 'ELSE 兜底分支'}
                              </span>
                              {isIf && (
                                <span className="text-xs text-slate-500 font-medium">
                                  优先级 {currentBranch.priority}
                                </span>
                              )}
                            </div>
                            {(selectedNode.branches || []).length > 2 && isIf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBranch(selectedNode.id, currentBranch.id)}
                                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>删除该分支</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">分支名称</label>
                            <input
                              type="text"
                              value={currentBranch.name}
                              onChange={(e) => handleUpdateBranch(selectedNode.id, currentBranch.id, { name: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500 outline-none"
                              placeholder="如：条件1 或 涉案金额大于等于10000"
                            />
                          </div>
                        </div>

                        {/* 条件规则设置 (IF 分支) vs 兜底说明 (ELSE 分支) */}
                        {isIf ? (
                          <div className="space-y-5 pt-1">
                            {/* 1. 配置方式 */}
                            <div className="space-y-2.5">
                              <label className="text-sm font-bold text-slate-800 block">配置方式</label>
                              <div className="flex items-center gap-8 text-xs text-slate-700">
                                <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
                                  <input
                                    type="radio"
                                    name={`configMode_${currentBranch.id}`}
                                    checked={configMode === 'condition'}
                                    onChange={() => handleUpdateBranch(selectedNode.id, currentBranch.id, { configMode: 'condition' })}
                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span>按条件规则进入</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
                                  <input
                                    type="radio"
                                    name={`configMode_${currentBranch.id}`}
                                    checked={configMode === 'formula'}
                                    onChange={() => handleUpdateBranch(selectedNode.id, currentBranch.id, { configMode: 'formula' })}
                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span>按公式定义进入</span>
                                </label>
                              </div>
                            </div>

                            {/* 2. 条件规则 (按条件规则进入) */}
                            {configMode === 'condition' && (
                              <div className="space-y-3 pt-1">
                                <label className="text-sm font-bold text-slate-800 block">条件规则</label>
                                <div className="space-y-2.5">
                                  {branchConditions.map((rule, rIdx) => {
                                    const isInitiatorField = rule.fieldKey === 'initiator' || rule.fieldKey === 'initiator_role' || rule.fieldKey === 'member';
                                    return (
                                      <div key={rule.id || rIdx} className="flex items-center gap-2">
                                        {/* 下拉1：字段选择 (默认发起人) */}
                                        <div className="relative min-w-[120px] max-w-[145px]">
                                          <select
                                            value={rule.fieldKey}
                                            onChange={(e) => {
                                              const selectedOpt = e.target.options[e.target.selectedIndex];
                                              handleUpdateRuleInBranch(selectedNode.id, currentBranch.id, rule.id, {
                                                fieldKey: e.target.value,
                                                fieldName: selectedOpt.text,
                                                value: '',
                                                valueLabel: e.target.value === 'initiator' ? '选择人员' : ''
                                              });
                                            }}
                                            className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg text-xs font-normal text-slate-700 outline-none appearance-none transition-colors cursor-pointer"
                                          >
                                            <option value="initiator">发起人</option>
                                            <option value="initiator_dept">发起人所属部门</option>
                                            <option value="initiator_org">发起人所属机构</option>
                                            <option value="initiator_role">发起人角色</option>
                                            {displayFieldsList.map(f => (
                                              <option key={f.key} value={f.key}>{f.label}</option>
                                            ))}
                                          </select>
                                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>

                                        {/* 下拉2：比较操作符 (等于 等) */}
                                        <div className="relative min-w-[85px] max-w-[95px]">
                                          <select
                                            value={rule.operator}
                                            onChange={(e) => {
                                              handleUpdateRuleInBranch(selectedNode.id, currentBranch.id, rule.id, {
                                                operator: e.target.value as any
                                              });
                                            }}
                                            className="w-full h-9 pl-3 pr-7 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg text-xs font-normal text-slate-700 outline-none appearance-none transition-colors cursor-pointer"
                                          >
                                            <option value="eq">等于</option>
                                            <option value="neq">不等于</option>
                                            <option value="contains">包含</option>
                                            <option value="not_contains">不包含</option>
                                            <option value="in">属于</option>
                                            <option value="gte">大于等于 (≥)</option>
                                            <option value="gt">大于 (&gt;)</option>
                                            <option value="lte">小于等于 (≤)</option>
                                            <option value="lt">小于 (&lt;)</option>
                                            <option value="empty">为空</option>
                                            <option value="not_empty">不为空</option>
                                          </select>
                                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>

                                        {/* 控件3：选择人员 / 文本数值输入 */}
                                        {isInitiatorField ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                              setMemberPickerTarget({ branchId: currentBranch.id, ruleId: rule.id });
                                              setTempSelectedMembers(rule.value ? rule.value.split(',').filter(Boolean) : []);
                                              setMemberSearchText('');
                                              setIsMemberSelectModalOpen(true);
                                            }}
                                            className="flex-1 h-9 px-3.5 bg-white border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-lg text-xs font-normal text-slate-700 flex items-center justify-start gap-1.5 transition-colors cursor-pointer truncate"
                                            title={rule.valueLabel || '选择人员'}
                                          >
                                            <UserPlus className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                            <span className={`truncate ${rule.valueLabel && rule.valueLabel !== '选择人员' ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                              {rule.valueLabel || '选择人员'}
                                            </span>
                                          </button>
                                        ) : (
                                          <input
                                            type="text"
                                            value={rule.value || ''}
                                            onChange={(e) => {
                                              handleUpdateRuleInBranch(selectedNode.id, currentBranch.id, rule.id, {
                                                value: e.target.value,
                                                valueLabel: e.target.value
                                              });
                                            }}
                                            placeholder="输入对比数值/文本..."
                                            className="flex-1 h-9 px-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg text-xs font-normal text-slate-700 outline-none transition-colors"
                                          />
                                        )}

                                        {/* 删除与添加操作按钮 */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRuleFromBranch(selectedNode.id, currentBranch.id, rule.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                            title="删除此条件"
                                          >
                                            <Trash2 className="w-4 h-4 stroke-[1.75]" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAddRuleToBranch(selectedNode.id, currentBranch.id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                            title="添加条件"
                                          >
                                            <Plus className="w-4 h-4 stroke-[1.75]" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 3. 条件公式 (按公式定义进入) */}
                            {configMode === 'formula' && (
                              <div className="space-y-3 pt-1">
                                <label className="text-sm font-bold text-slate-800 block">条件公式</label>
                                <div
                                  onClick={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setFormulaEditingBranchId(currentBranch.id);
                                    setIsFormulaModalOpen(true);
                                  }}
                                  className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                      <Calculator className="w-4 h-4" />
                                    </div>
                                    <div className="truncate">
                                      <span className="font-mono text-xs text-slate-800 block truncate">
                                        {currentBranch.formula || '点击配置条件公式表达式...'}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        支持表单字段、布尔逻辑与函数运算
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold shrink-0"
                                  >
                                    {currentBranch.formula ? '编辑公式' : '配置公式'}
                                  </button>
                                </div>

                                {currentBranch.formula && (
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-slate-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>当前生效公式</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                          handleUpdateBranch(selectedNode.id, currentBranch.id, {
                                            formula: '',
                                            conditionText: '所有数据均可进入'
                                          });
                                        }}
                                        className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                      >
                                        清空
                                      </button>
                                    </div>
                                    <div className="p-2 bg-white rounded font-mono text-xs text-slate-800 border border-slate-100 break-all">
                                      {currentBranch.formula}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ELSE 兜底分支展示 */
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span className="text-xs font-bold text-slate-800">默认兜底机制说明</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              本分支为流程中的 <strong>ELSE 兜底分支</strong>。当以上所有前面的 IF 条件均未命中满足时，工单将自动进入此分支流转推进。
                            </p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              ELSE 分支无需配置判断条件，确保在任何业务数据下流程都不会出现死锁或无路可走的情况。
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ===================== TAB: 并行分支设置 ===================== */}
              {activeRightTab === 'parallel_config' && isParallelNode && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 并行机制说明 */}
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Split className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="text-xs font-bold text-teal-900">并行流转机制</span>
                    </div>
                    <p className="text-xs text-teal-800 leading-relaxed">
                      并行分支中的所有分支将<strong>同时并发激活</strong>并开展办理，<strong>无任何 IF / ELSE 条件判断</strong>。
                    </p>
                    <p className="text-[11px] text-teal-700 leading-relaxed">
                      所有并行分支办理完成并提交后，流程将在汇聚点自动会聚并流转至后续环节。
                    </p>
                  </div>

                  {/* 并行分支列表管理 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        并行分支列表 ({(selectedNode.branches || []).length} 路分支)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBranchToNode(selectedNode.id)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>添加并行分支</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(selectedNode.branches || []).map((b, bIdx) => (
                        <div 
                          key={b.id || bIdx} 
                          className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                                {bIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={b.name}
                                onChange={(e) => handleUpdateBranch(selectedNode.id, b.id, { name: e.target.value })}
                                className="font-bold text-xs text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-teal-500 outline-none px-1 py-0.5"
                                placeholder="输入分支名称"
                              />
                            </div>
                            {(selectedNode.branches || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBranch(selectedNode.id, b.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded cursor-pointer transition-colors"
                                title="删除该分支"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={b.desc || ''}
                            onChange={(e) => handleUpdateBranch(selectedNode.id, b.id, { desc: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:bg-white focus:border-teal-500 outline-none"
                            placeholder="分支办理说明..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB: 消息通知专属 - 1. 选择通知对象 (严格按图1) ===================== */}
              {activeRightTab === 'notify_target' && selectedNode.nodeType === 'notify' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* 通知人员 */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>通知人员</span>
                      <span className="text-red-500">*</span>
                    </h4>

                    {/* Checkbox 选项列表 (指定成员、指定角色、指定成员字段) */}
                    <div className="space-y-4">
                      {/* 1. 指定成员 */}
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none">
                          <input
                            type="checkbox"
                            checked={notifyTargetTypes.includes('specified_member')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotifyTargetTypes([...notifyTargetTypes, 'specified_member']);
                              } else {
                                setNotifyTargetTypes(notifyTargetTypes.filter(t => t !== 'specified_member'));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={notifyTargetTypes.includes('specified_member') ? 'font-bold text-slate-900' : ''}>
                            指定成员
                          </span>
                        </label>

                        {notifyTargetTypes.includes('specified_member') && (
                          <div className="pl-6.5 space-y-2 animate-in fade-in duration-100">
                            <div className="flex flex-wrap items-center gap-2">
                              {notifyMembers.map(m => (
                                <span 
                                  key={m.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium"
                                >
                                  <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                    {m.name.slice(0, 1)}
                                  </span>
                                  <span>{m.name}</span>
                                  {m.org && <span className="text-[10px] text-blue-600/70">({m.org})</span>}
                                  <button
                                    type="button"
                                    onClick={() => setNotifyMembers(notifyMembers.filter(x => x.id !== m.id))}
                                    className="text-blue-400 hover:text-blue-600 cursor-pointer ml-0.5"
                                    title="移除成员"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setNodeMemberSelectTarget('notify_members');
                                  setTempNodeSelectedMembers(notifyMembers);
                                  setNodeMemberSearchKeyword('');
                                  setNodeMemberOrgFilter('ALL');
                                  setNodeMemberRoleFilter('ALL');
                                  setIsNodeMemberSelectModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-300 hover:bg-blue-50/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>添加成员</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. 指定角色 */}
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none">
                          <input
                            type="checkbox"
                            checked={notifyTargetTypes.includes('role')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotifyTargetTypes([...notifyTargetTypes, 'role']);
                              } else {
                                setNotifyTargetTypes(notifyTargetTypes.filter(t => t !== 'role'));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={notifyTargetTypes.includes('role') ? 'font-bold text-slate-900' : ''}>
                            指定角色
                          </span>
                        </label>

                        {notifyTargetTypes.includes('role') && (
                          <div className="pl-6.5 animate-in fade-in duration-100">
                            <select
                              value={notifyRoleId}
                              onChange={e => setNotifyRoleId(e.target.value)}
                              className="w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                            >
                              {ROLE_DICTIONARY_LIST.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.count}人)</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 3. 指定成员字段 */}
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none">
                          <input
                            type="checkbox"
                            checked={notifyTargetTypes.includes('form_member')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotifyTargetTypes([...notifyTargetTypes, 'form_member']);
                              } else {
                                setNotifyTargetTypes(notifyTargetTypes.filter(t => t !== 'form_member'));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={notifyTargetTypes.includes('form_member') ? 'font-bold text-slate-900' : ''}>
                            指定成员字段
                          </span>
                        </label>

                        {notifyTargetTypes.includes('form_member') && (
                          <div className="pl-6.5 animate-in fade-in duration-100">
                            <select
                              value={notifyFormField}
                              onChange={e => setNotifyFormField(e.target.value)}
                              className="w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                            >
                              <option value="派单人员">派单人员 (成员控件)</option>
                              <option value="经办人">经办人 (成员控件)</option>
                              <option value="申请人">申请人 (人员选择)</option>
                              <option value="分管领导">分管领导 (成员控件)</option>
                              {displayFieldsList.filter(f => f.type === 'member' || f.type === 'user' || f.type === 'text').map(f => (
                                <option key={f.key} value={f.label}>{f.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB: 消息通知专属 - 2. 设置通知内容 (严格按图2) ===================== */}
              {activeRightTab === 'notify_content' && selectedNode.nodeType === 'notify' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* 1. 标题 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">标题</label>
                    <input
                      type="text"
                      value={notifyTitle}
                      onChange={e => setNotifyTitle(e.target.value)}
                      placeholder="请输入通知标题..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* 2. 内容 * [M↓] */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>内容</span>
                        <span className="text-red-500">*</span>
                        <span className="ml-1 px-1 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-mono border border-slate-200 flex items-center gap-0.5">
                          <span>M↓</span>
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-400">支持插入表单变量</span>
                    </div>
                    <textarea
                      rows={6}
                      value={notifyContent}
                      onChange={e => setNotifyContent(e.target.value)}
                      placeholder="请输入通知正文内容，支持使用下方变量..."
                      className="w-full p-3 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors leading-relaxed resize-y min-h-[140px]"
                    />
                    {/* 快捷插入变量 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400">快捷插入:</span>
                      {['发起人', '发起时间', '流程名称', '单据编号', '当前办理节点'].map(varName => (
                        <button
                          key={varName}
                          type="button"
                          onClick={() => setNotifyContent(prev => `${prev}{${varName}}`)}
                          className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
                        >
                          +{varName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. 操作按钮 */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-800">操作按钮</h4>
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                      {/* 按钮名称 */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span>按钮名称</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={notifyButtonName}
                          onChange={e => setNotifyButtonName(e.target.value)}
                          placeholder="查看详情"
                          className="w-full px-3 py-2 bg-white border border-blue-400 ring-2 ring-blue-500/10 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* 关联表单 */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none">
                            <input
                              type="radio"
                              name="notifyButtonAction"
                              checked={notifyButtonAction === 'form'}
                              onChange={() => setNotifyButtonAction('form')}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>关联表单</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-800 select-none">
                            <input
                              type="radio"
                              name="notifyButtonAction"
                              checked={notifyButtonAction === 'custom_url'}
                              onChange={() => setNotifyButtonAction('custom_url')}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>自定义链接</span>
                          </label>
                        </div>

                        {notifyButtonAction === 'form' ? (
                          <div className="pl-6 space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <span>选择已发布的业务表单</span>
                                  <span className="text-red-500">*</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  共 {publishedFormTemplates.length} 个可用表单
                                </span>
                              </label>
                              <div className="relative">
                                <select
                                  value={notifyRelatedFormId}
                                  onChange={e => setNotifyRelatedFormId(e.target.value)}
                                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                                >
                                  {publishedFormTemplates.map(tpl => (
                                    <option key={tpl.id} value={tpl.id}>
                                      {tpl.templateName}（{tpl.systemName} · {tpl.id === 'current_form' ? '当前' : '已发布'}）
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* 选中表单详情提示卡片 */}
                            {(() => {
                              const selTpl = publishedFormTemplates.find(t => t.id === notifyRelatedFormId) || publishedFormTemplates[0];
                              return (
                                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="truncate">{selTpl.templateName}</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                          已发布
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                        所属系统: {selTpl.systemName} · 分类: {selTpl.category}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-200 shrink-0">
                                    点击可打开表单
                                  </span>
                                </div>
                              );
                            })()}

                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              接收人收到通知后，点击操作按钮将直接在移动端或 PC 端打开所选已发布业务表单。
                            </p>
                          </div>
                        ) : (
                          <div className="pl-6 space-y-1.5">
                            <input
                              type="text"
                              value={notifyButtonUrl}
                              onChange={e => setNotifyButtonUrl(e.target.value)}
                              placeholder="https://example.com/page?id=..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                            />
                            <p className="text-[11px] text-slate-400">
                              接收人点击操作按钮将通过新页面跳转至该自定义链接。
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 5: 高级设置 ===================== */}
              {activeRightTab === 'advanced' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* 1. 自动审批 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">自动审批</h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoApproveAdjacent}
                          onChange={(e) => {
                            if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                            setAutoApproveAdjacent(e.target.checked);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>相邻节点自动审批（当前节点人员为上一节点人员时，自动审批）</span>
                      </label>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />

                  {/* 2. 审批人为空时 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      {isHandleNode ? '办理人为空时' : '审批人为空时'}
                    </h4>
                    <div className="space-y-2.5 text-xs text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="emptyAssigneeAction"
                          checked={emptyAssigneeAction === 'skip'}
                          onChange={() => {
                            if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                            setEmptyAssigneeAction('skip');
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>自动跳过节点</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="emptyAssigneeAction"
                          checked={emptyAssigneeAction === 'admin'}
                          onChange={() => {
                            if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                            setEmptyAssigneeAction('admin');
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>转交给应用主管理员</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="emptyAssigneeAction"
                          checked={emptyAssigneeAction === 'specified'}
                          onChange={() => {
                            if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                            setEmptyAssigneeAction('specified');
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>转交给指定成员</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="emptyAssigneeAction"
                          checked={emptyAssigneeAction === 'pause'}
                          onChange={() => {
                            if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                            setEmptyAssigneeAction('pause');
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className={emptyAssigneeAction === 'pause' ? 'font-bold text-slate-900' : ''}>
                          流程暂停（即不允许为空）
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />

                  {/* 3. 响应和处理时效限制 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800">响应和处理时效限制</h4>
                      </div>
                      {/* 打开/关闭开关 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                          setTimeLimitEnabled(!timeLimitEnabled);
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          timeLimitEnabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                        title={timeLimitEnabled ? '点击关闭时效限制' : '点击开启时效限制'}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            timeLimitEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      开启后可针对此节点配置处理办结时效要求，支持默认固定时长或由发起人动态自选。
                    </p>

                    {/* 打开后配置区域 */}
                    {timeLimitEnabled && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-in fade-in duration-150">
                        {/* 模式选择：默认模式 vs 发起人自选 */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">时效模式</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                setTimeLimitMode('default');
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                timeLimitMode === 'default'
                                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${timeLimitMode === 'default' ? 'text-blue-700' : 'text-slate-700'}`}>
                                  默认模式
                                </span>
                                {timeLimitMode === 'default' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">固定填写节点处理时效(h)</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                setTimeLimitMode('initiator_select');
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                timeLimitMode === 'initiator_select'
                                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${timeLimitMode === 'initiator_select' ? 'text-blue-700' : 'text-slate-700'}`}>
                                  发起人自选
                                </span>
                                {timeLimitMode === 'initiator_select' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">选择表单中关于时效的字段</p>
                            </button>
                          </div>
                        </div>

                        {/* 1. 默认模式配置 */}
                        {timeLimitMode === 'default' && (
                          <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                              <span>节点处理时效</span>
                              <span className="text-[10px] font-normal text-slate-400">单位：小时 (h)</span>
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min={1}
                                max={720}
                                step={1}
                                value={timeLimitHours}
                                onChange={(e) => {
                                  if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                  setTimeLimitHours(Math.max(1, Number(e.target.value) || 1));
                                }}
                                placeholder="请输入处理时效数值"
                                className="w-full h-9 pl-3 pr-10 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                              />
                              <span className="absolute right-3 text-xs font-bold text-slate-500 pointer-events-none">
                                h
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>快捷时效：</span>
                              {[2, 4, 12, 24, 48, 72].map(h => (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => {
                                    if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                    setTimeLimitHours(h);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                    timeLimitHours === h
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
                                  }`}
                                >
                                  {h}h
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. 发起人自选模式配置 */}
                        {timeLimitMode === 'initiator_select' && (
                          <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-bold text-slate-700 block">
                              选择表单中关于时效的字段
                            </label>
                            <select
                              value={timeLimitFieldKey}
                              onChange={(e) => {
                                if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                const selectedKey = e.target.value;
                                setTimeLimitFieldKey(selectedKey);
                                const found = displayFieldsList.find(f => f.key === selectedKey);
                                if (found) {
                                  setTimeLimitFieldName(found.label);
                                }
                              }}
                              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                            >
                              <option value="">-- 请选择表单中的时效字段 --</option>
                              <optgroup label="高级控件 (时效字段)">
                                {displayFieldsList
                                  .filter(f => ['handle_time_limit', 'handle_duration_limit', 'date'].includes(f.type))
                                  .map(f => (
                                    <option key={f.key} value={f.key}>
                                      {f.label} ({f.type === 'handle_time_limit' ? '限时处理时间' : f.type === 'handle_duration_limit' ? '限时处理时限' : '日期选择'})
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="其他表单字段">
                                {displayFieldsList
                                  .filter(f => !['handle_time_limit', 'handle_duration_limit', 'date'].includes(f.type))
                                  .map(f => (
                                    <option key={f.key} value={f.key}>
                                      {f.label} [{f.key}]
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              提示：发起人在填报表单时所选定的时效字段（如【限时处理时间】、【限时处理时限】等），将动态绑定为本节点的流转时效。
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full h-px bg-slate-100" />

                  {/* 4. 超时处理 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">超时处理</h4>
                      {timeoutRulesDetailed.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-400">
                          已配置 {timeoutRulesDetailed.length} 条规则
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      审批或经办超时未处理时，自动触发相应规则，如催办提醒、自动同意、自动转交、跳转节点或终止流程。
                    </p>

                    {/* 规则卡片列表 */}
                    {timeoutRulesDetailed.length > 0 ? (
                      <div className="space-y-2.5">
                        {timeoutRulesDetailed.map((r, idx) => {
                          const triggerLabel = r.triggerType === 'after_timeout'
                            ? `超时 ${r.timeValue}${r.timeUnit === 'days' ? '天' : 'h'}`
                            : r.triggerType === 'before_timeout'
                            ? `提前 ${r.timeValue}${r.timeUnit === 'days' ? '天' : 'h'}`
                            : `到达 ${r.timeValue}${r.timeUnit === 'days' ? '天' : 'h'}`;

                          const actionBadgeConfig = {
                            remind: { label: '催办提醒', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                            auto_pass: { label: '自动同意', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                            transfer: { label: '自动转交', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
                            jump: { label: '自动跳转', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
                            auto_reject: { label: '自动拒绝', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
                          }[r.actionType] || { label: '超时规则', bg: 'bg-slate-50 text-slate-700 border-slate-200' };

                          return (
                            <div
                              key={r.id}
                              className={`p-3 rounded-xl border transition-all ${
                                r.enabled !== false
                                  ? 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                                  : 'bg-slate-50 border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {triggerLabel}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${actionBadgeConfig.bg}`}>
                                    {actionBadgeConfig.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* 开关 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      setTimeoutRulesDetailed(prev =>
                                        prev.map(item => item.id === r.id ? { ...item, enabled: item.enabled === false ? true : false } : item)
                                      );
                                    }}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                      r.enabled !== false ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                    title={r.enabled !== false ? '点击停用' : '点击启用'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                                        r.enabled !== false ? 'translate-x-3.5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>

                                  {/* 编辑 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      setEditingTimeoutRule({ ...r });
                                      setIsTimeoutModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                    title="编辑规则"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* 删除 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                                      setTimeoutRulesDetailed(prev => prev.filter(item => item.id !== r.id));
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="删除规则"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                                {r.desc || generateTimeoutRuleDesc(r)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                        <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs text-slate-500 font-medium">暂未添加超时处理规则</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          可配置超时催办、自动流转、转交主管等自动化处理策略
                        </p>
                      </div>
                    )}

                    {/* 操作按钮与快捷预设 */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                          setEditingTimeoutRule({
                            id: `tr_${Date.now()}`,
                            triggerType: 'after_timeout',
                            timeValue: 2,
                            timeUnit: 'hours',
                            actionType: 'remind',
                            remindTargets: ['assignee'],
                            remindChannels: ['wecom', 'app'],
                            repeatRemind: true,
                            repeatIntervalHours: 2,
                            maxRepeatCount: 3,
                            enabled: true
                          });
                          setIsTimeoutModalOpen(true);
                        }}
                        className="w-full py-2 bg-white hover:bg-blue-50/50 text-blue-600 font-bold rounded-xl border border-blue-200 hover:border-blue-300 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>添加规则</span>
                      </button>

                      {/* 常用模板推荐 */}
                      <div className="pt-1">
                        <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                          <span>推荐规则预设：</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                              const newRule: DetailedTimeoutRule = {
                                id: `tr_${Date.now()}_1`,
                                triggerType: 'after_timeout',
                                timeValue: 2,
                                timeUnit: 'hours',
                                actionType: 'remind',
                                remindTargets: ['assignee'],
                                remindChannels: ['wecom', 'app'],
                                repeatRemind: true,
                                repeatIntervalHours: 2,
                                maxRepeatCount: 3,
                                enabled: true
                              };
                              newRule.desc = generateTimeoutRuleDesc(newRule);
                              setTimeoutRulesDetailed(prev => [...prev, newRule]);
                            }}
                            className="px-2 py-1 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 rounded-lg text-[10px] text-slate-600 transition-colors cursor-pointer"
                          >
                            + 超时2h企微催办当前人
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                              const newRule: DetailedTimeoutRule = {
                                id: `tr_${Date.now()}_2`,
                                triggerType: 'after_timeout',
                                timeValue: 24,
                                timeUnit: 'hours',
                                actionType: 'transfer',
                                transferType: 'supervisor',
                                enabled: true
                              };
                              newRule.desc = generateTimeoutRuleDesc(newRule);
                              setTimeoutRulesDetailed(prev => [...prev, newRule]);
                            }}
                            className="px-2 py-1 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 rounded-lg text-[10px] text-slate-600 transition-colors cursor-pointer"
                          >
                            + 超时24h自动转交直属主管
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isReadOnly) { onAttemptEditInReadOnly?.(); return; }
                              const newRule: DetailedTimeoutRule = {
                                id: `tr_${Date.now()}_3`,
                                triggerType: 'after_timeout',
                                timeValue: 48,
                                timeUnit: 'hours',
                                actionType: 'auto_pass',
                                opinion: '超时48小时未处理，系统自动同意',
                                enabled: true
                              };
                              newRule.desc = generateTimeoutRuleDesc(newRule);
                              setTimeoutRulesDetailed(prev => [...prev, newRule]);
                            }}
                            className="px-2 py-1 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 rounded-lg text-[10px] text-slate-600 transition-colors cursor-pointer"
                          >
                            + 超时48h自动同意通过
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* 底部固定操作栏 */}
            <div className="h-14 border-t border-slate-200 px-6 bg-white flex items-center justify-end gap-3 shrink-0 shadow-xs">
              {selectedNode.nodeType === 'notify' ? (
                activeRightTab === 'notify_target' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                      }}
                      className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRightTab('notify_content');
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>下一步</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                      }}
                      className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRightTab('notify_target');
                      }}
                      className="px-5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>上一步</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNodeConfig}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>保存</span>
                    </button>
                  </>
                )
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                    }}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNodeConfig}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>保存</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ===================== 流程节点库选择弹窗 (点击中间加号出现) ===================== */}
      {isNodeLibraryModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* 半透明遮罩层 */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setIsNodeLibraryModalOpen(false)}
          />

          {/* 弹窗主体 */}
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 z-10 flex flex-col">
            {/* 顶栏 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>添加流程节点</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      流程节点库
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    选择要在当前环节后插入的节点类型
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNodeLibraryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 节点类型卡片网格 */}
            <div className="p-6 grid grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* 1. 审批节点 */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'approval');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      审批类
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-700 mb-1">
                    审批节点
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    由指定审批人员进行同意、拒绝、保存、转交、退回、收回等流转审批
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 2. 执行节点 (处理节点) */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'handle');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      办理类
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-blue-700 mb-1">
                    执行节点 (办理节点)
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    指派责任科室或具体承办人线下核查办理，支持提交、保存、转交、退回与收回
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 3. 抄送节点 */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'cc');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      传阅类
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-teal-700 mb-1">
                    抄送节点
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    任务流转至此时，将表单数据与办理进展实时抄送给相关人员查阅
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 4. 消息通知节点 */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'notify');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      提醒类
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-purple-700 mb-1">
                    消息通知节点
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    支持短信、企业微信或系统站内信及时触达
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 5. 条件分支节点 */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'condition');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <GitFork className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      路由类 (IF / ELSE)
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-700 mb-1">
                    条件分支
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    根据表单字段数据满足 IF 条件或兜底进入 ELSE，智能分流不同审批与处置流程
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 6. 并行分支节点 */}
              <div
                onClick={() => {
                  handleInsertNode(addNodeIndex, 'parallel');
                  setIsNodeLibraryModalOpen(false);
                }}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Split className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      并发类 (无条件)
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 group-hover:text-teal-700 mb-1">
                    并行分支
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    多路分支同时激活并发推进，无需 IF / ELSE 规则判断，全部完成后汇聚
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>点击添加</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* 底栏 */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                提示：添加后将自动选中并可在右侧配置该节点的审批人及操作按钮
              </span>
              <button
                type="button"
                onClick={() => setIsNodeLibraryModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 节点人员选择弹窗 (支持按机构、按角色筛选，置顶 z-[99999]) ===================== */}
      {isNodeMemberSelectModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-150">
          {/* 半透明背景遮罩 */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsNodeMemberSelectModalOpen(false)}
          />

          {/* 弹窗主体 */}
          <div 
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* 顶栏 */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${isApprovalNode ? 'bg-blue-600' : 'bg-emerald-600'} text-white flex items-center justify-center shadow-xs`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {isApprovalNode ? '选择审批人' : '选择执行人'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    支持通过【按机构】或【按角色】进行人员精准检索与多选配置
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNodeMemberSelectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 弹窗主体双栏/三栏布局 */}
            <div className="flex-1 flex overflow-hidden min-h-[420px] max-h-[520px]">
              {/* 左侧导航栏：按机构 / 按角色 */}
              <div className="w-56 bg-slate-50/80 border-r border-slate-200 flex flex-col shrink-0">
                {/* 维度切换 Tabs */}
                <div className="p-2.5 border-b border-slate-200 flex gap-1 bg-slate-100/70">
                  <button
                    type="button"
                    onClick={() => {
                      setNodeMemberModalTab('org');
                      setNodeMemberOrgFilter('ALL');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      nodeMemberModalTab === 'org'
                        ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>按机构选择</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNodeMemberModalTab('role');
                      setNodeMemberRoleFilter('ALL');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      nodeMemberModalTab === 'role'
                        ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>按角色选择</span>
                  </button>
                </div>

                {/* 机构树列表 / 角色字典列表 */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {nodeMemberModalTab === 'org' ? (
                    ORG_TREE_LIST.map((org) => {
                      const isSelected = nodeMemberOrgFilter === org.id;
                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => setNodeMemberOrgFilter(org.id)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{org.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200/70 text-slate-500'
                          }`}>
                            {org.count}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    ROLE_DICTIONARY_LIST.map((role) => {
                      const isSelected = nodeMemberRoleFilter === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setNodeMemberRoleFilter(role.id)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{role.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200/70 text-slate-500'
                          }`}>
                            {role.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 中间：人员检索与选择清单 */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* 搜索与全选工具条 */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nodeMemberSearchKeyword}
                      onChange={(e) => setNodeMemberSearchKeyword(e.target.value)}
                      placeholder="搜索人员姓名、手机号、科室或角色..."
                      className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs outline-none transition-colors"
                    />
                  </div>
                  {(() => {
                    const filtered = ALL_SYSTEM_PERSONNEL.filter(usr => {
                      if (nodeMemberModalTab === 'org' && nodeMemberOrgFilter !== 'ALL' && usr.org !== nodeMemberOrgFilter) return false;
                      if (nodeMemberModalTab === 'role' && nodeMemberRoleFilter !== 'ALL' && usr.role !== nodeMemberRoleFilter) return false;
                      if (nodeMemberSearchKeyword.trim()) {
                        const kw = nodeMemberSearchKeyword.trim().toLowerCase();
                        return usr.name.toLowerCase().includes(kw) || usr.phone.includes(kw) || usr.org.toLowerCase().includes(kw) || usr.role.toLowerCase().includes(kw);
                      }
                      return true;
                    });
                    const allChecked = filtered.length > 0 && filtered.every(u => tempNodeSelectedMembers.some(m => m.id === u.id));
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (allChecked) {
                            setTempNodeSelectedMembers(prev => prev.filter(m => !filtered.some(f => f.id === m.id)));
                          } else {
                            const map = new Map<string, SystemOrgMemberItem>();
                            tempNodeSelectedMembers.forEach(m => map.set(m.id, m));
                            filtered.forEach(f => map.set(f.id, f));
                            setTempNodeSelectedMembers(Array.from(map.values()));
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer shrink-0"
                      >
                        {allChecked ? '取消全选本页' : '全选本页'}
                      </button>
                    );
                  })()}
                </div>

                {/* 人员网格/列表 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                  {ALL_SYSTEM_PERSONNEL
                    .filter(usr => {
                      if (nodeMemberModalTab === 'org' && nodeMemberOrgFilter !== 'ALL' && usr.org !== nodeMemberOrgFilter) return false;
                      if (nodeMemberModalTab === 'role' && nodeMemberRoleFilter !== 'ALL' && usr.role !== nodeMemberRoleFilter) return false;
                      if (nodeMemberSearchKeyword.trim()) {
                        const kw = nodeMemberSearchKeyword.trim().toLowerCase();
                        return usr.name.toLowerCase().includes(kw) || usr.phone.includes(kw) || usr.org.toLowerCase().includes(kw) || usr.role.toLowerCase().includes(kw);
                      }
                      return true;
                    })
                    .map((usr) => {
                      const isChecked = tempNodeSelectedMembers.some(m => m.id === usr.id);
                      return (
                        <div
                          key={usr.id}
                          onClick={() => {
                            setTempNodeSelectedMembers(prev => 
                              isChecked 
                                ? prev.filter(m => m.id !== usr.id) 
                                : [...prev, usr]
                            );
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className={`w-8 h-8 rounded-xl ${usr.avatarBg || 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}>
                              {usr.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{usr.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{usr.phone}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{usr.org}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {usr.role}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 右侧：已选人员清单 */}
              <div className="w-64 bg-slate-50/60 border-l border-slate-200 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100/50">
                  <span className="text-xs font-bold text-slate-800">
                    已选人员 ({tempNodeSelectedMembers.length})
                  </span>
                  {tempNodeSelectedMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempNodeSelectedMembers([])}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      清空已选
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                  {tempNodeSelectedMembers.length > 0 ? (
                    tempNodeSelectedMembers.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-5 h-5 rounded-full ${mem.avatarBg || 'bg-blue-600'} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                            {mem.name.slice(0, 1)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">{mem.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{mem.role}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempNodeSelectedMembers(prev => prev.filter(m => m.id !== mem.id));
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded cursor-pointer transition-colors shrink-0"
                          title="移除"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <Users className="w-8 h-8 text-slate-300 mb-2" />
                      <span>尚未选择人员</span>
                      <span className="text-[11px] text-slate-400 mt-1">从左侧或搜索选取</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底栏 */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                已确认选定 <strong className="text-blue-600 font-bold">{tempNodeSelectedMembers.length}</strong> 名{nodeMemberSelectTarget === 'notify_members' ? '通知对象' : isApprovalNode ? '审批责任人' : '执行人员'}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNodeMemberSelectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer border border-slate-200"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (nodeMemberSelectTarget === 'notify_members') {
                      setNotifyMembers(tempNodeSelectedMembers);
                      setIsNodeMemberSelectModalOpen(false);
                      setPanelToast(`已成功配置 ${tempNodeSelectedMembers.length} 名通知对象`);
                      setTimeout(() => setPanelToast(null), 1500);
                      return;
                    }
                    if (nodeMemberSelectTarget === 'supervisor_fallback') {
                      setSupervisorFallbackApprovers(tempNodeSelectedMembers);
                      handleUpdateNode({
                        supervisorFallbackApprovers: tempNodeSelectedMembers
                      });
                      setIsNodeMemberSelectModalOpen(false);
                      setPanelToast(`已成功配置 ${tempNodeSelectedMembers.length} 名备用审批人`);
                      setTimeout(() => setPanelToast(null), 1500);
                      return;
                    }
                    setSelectedApprovers(tempNodeSelectedMembers);
                    const receiverLabel = tempNodeSelectedMembers.length > 0
                      ? tempNodeSelectedMembers.map(m => m.name).join('、')
                      : '未指定人员';
                    handleUpdateNode({
                      selectedMembers: tempNodeSelectedMembers,
                      receiverLabel
                    });
                    setIsNodeMemberSelectModalOpen(false);
                    setPanelToast(`已成功配置 ${tempNodeSelectedMembers.length} 名${isApprovalNode ? '审批人' : '执行人'}`);
                    setTimeout(() => setPanelToast(null), 1500);
                  }}
                  className={`px-5 py-2 ${isApprovalNode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>确定回填</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 条件分支人员选择弹窗 ===================== */}
      {isMemberSelectModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setIsMemberSelectModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 z-10 flex flex-col max-h-[85vh]">
            {/* 顶栏 */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">选择条件判定人员</h3>
                  <p className="text-[11px] text-slate-400">选择满足条件流转的发起人或目标责任人</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberSelectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 搜索栏 */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <input
                type="text"
                value={memberSearchText}
                onChange={(e) => setMemberSearchText(e.target.value)}
                placeholder="搜索姓名、科室机构或岗位..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg text-xs outline-none transition-colors"
              />
            </div>

            {/* 人员列表 */}
            <div className="p-3 overflow-y-auto space-y-1.5 max-h-[320px] custom-scrollbar">
              {[
                { id: 'usr_zhangsan', name: '张建国', org: '市公安局 / 办公室', role: '部门主管' },
                { id: 'usr_lihongyan', name: '李红艳', org: '市公安局 / 网安支队', role: '专职审核' },
                { id: 'usr_wangqiang', name: '王强', org: '历下分局 / 治安大队', role: '经办民警' },
                { id: 'usr_zhaodemin', name: '赵德民', org: '历下分局 / 办公室', role: '分局负责人' },
                { id: 'usr_liufang', name: '刘芳', org: '市公安局 / 指挥中心', role: '值班长' },
                ...MOCK_USERS
              ]
                .filter((usr, idx, arr) => arr.findIndex(u => u.name === usr.name) === idx)
                .filter(u => !memberSearchText.trim() || u.name.includes(memberSearchText) || (u.org && u.org.includes(memberSearchText)) || (u.role && u.role.includes(memberSearchText)))
                .map((u) => {
                  const isChecked = tempSelectedMembers.includes(u.name);
                  return (
                    <label
                      key={u.id || u.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempSelectedMembers(prev => 
                          prev.includes(u.name) 
                            ? prev.filter(n => n !== u.name) 
                            : [...prev, u.name]
                        );
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-blue-500 bg-blue-50/60 shadow-2xs' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.org} · {u.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-100">
                        {u.role}
                      </span>
                    </label>
                  );
                })}
            </div>

            {/* 底栏 */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                已选 <strong className="text-blue-600">{tempSelectedMembers.length}</strong> 人
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberSelectModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (memberPickerTarget) {
                      const labels = tempSelectedMembers.join('、') || '选择人员';
                      const val = tempSelectedMembers.join(',');
                      handleUpdateRuleInBranch(selectedNode.id, memberPickerTarget.branchId, memberPickerTarget.ruleId, {
                        value: val,
                        valueLabel: labels
                      });
                    }
                    setIsMemberSelectModalOpen(false);
                    setMemberPickerTarget(null);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 条件分支公式编辑器弹窗 */}
      {(() => {
        const currentFormulaBranch = (selectedNode.branches || []).find(
          b => b.id === (formulaEditingBranchId || selectedBranchId || selectedNode.branches?.[0]?.id)
        ) || selectedNode.branches?.[0];

        return (
          <FormulaEditorModal
            isOpen={isFormulaModalOpen}
            initialFormula={currentFormulaBranch?.formula || ''}
            branchName={currentFormulaBranch?.name || '条件分支'}
            fields={displayFieldsList.map(f => ({ key: f.key, label: f.label, type: f.type }))}
            onClose={() => {
              setIsFormulaModalOpen(false);
              setFormulaEditingBranchId(null);
            }}
            onConfirm={(newFormula) => {
              if (currentFormulaBranch) {
                handleUpdateBranch(selectedNode.id, currentFormulaBranch.id, {
                  formula: newFormula,
                  configMode: 'formula',
                  conditionText: newFormula ? `[公式] ${newFormula}` : '所有数据均可进入'
                });
              }
              setIsFormulaModalOpen(false);
              setFormulaEditingBranchId(null);
            }}
          />
        );
      })()}

      {/* ===================== 超时处理规则配置弹窗 ===================== */}
      {isTimeoutModalOpen && editingTimeoutRule && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setIsTimeoutModalOpen(false)}
          />

          {/* 弹窗主体 */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 z-10 flex flex-col max-h-[90vh]">
            {/* 顶栏 */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{timeoutRulesDetailed.some(r => r.id === editingTimeoutRule.id) ? '编辑超时处理规则' : '添加超时处理规则'}</span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                      {isApprovalNode ? '审批节点' : '处理节点'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    设置达到超时条件后执行的自动化流转、催办与代办策略
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimeoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {/* 1. 触发时机 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  <span>触发时机</span>
                </label>

                {/* 触发类型选择 */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'after_timeout', label: '超时后', desc: '超过设定办理时效时触发' },
                    { key: 'before_timeout', label: '距离超时前', desc: '在设定时效到期前预警' },
                    { key: 'after_arrival', label: '节点到达后', desc: '工单流入该节点后触发' }
                  ].map(item => {
                    const isSelected = editingTimeoutRule.triggerType === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setEditingTimeoutRule(prev => prev ? { ...prev, triggerType: item.key as any } : prev)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {item.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* 时间数值与单位配置 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-medium shrink-0">
                        {editingTimeoutRule.triggerType === 'after_timeout' ? '超时时长：' : editingTimeoutRule.triggerType === 'before_timeout' ? '提前时长：' : '到达时长：'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={editingTimeoutRule.timeValue}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setEditingTimeoutRule(prev => prev ? { ...prev, timeValue: val } : prev);
                        }}
                        className="w-24 h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 text-center"
                      />
                      <select
                        value={editingTimeoutRule.timeUnit || 'hours'}
                        onChange={(e) => {
                          const unit = e.target.value as 'hours' | 'days';
                          setEditingTimeoutRule(prev => prev ? { ...prev, timeUnit: unit } : prev);
                        }}
                        className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="hours">小时 (h)</option>
                        <option value="days">工作日 (天)</option>
                      </select>
                    </div>

                    {/* 快捷选择 */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">快捷：</span>
                      {[1, 2, 4, 8, 12, 24, 48].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setEditingTimeoutRule(prev => prev ? { ...prev, timeValue: h, timeUnit: 'hours' } : prev)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                            editingTimeoutRule.timeValue === h && editingTimeoutRule.timeUnit !== 'days'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 执行动作 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                  <span>执行动作</span>
                </label>

                {/* 动作类型卡片 */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'remind', label: '催办提醒', icon: Bell, color: 'blue' },
                    { key: 'auto_pass', label: '自动同意', icon: CheckCircle2, color: 'emerald' },
                    { key: 'transfer', label: '自动转交', icon: Forward, color: 'amber' },
                    { key: 'jump', label: '自动跳转', icon: ArrowRight, color: 'violet' },
                    { key: 'auto_reject', label: '自动拒绝', icon: AlertTriangle, color: 'rose' }
                  ].map(act => {
                    const isSelected = editingTimeoutRule.actionType === act.key;
                    const IconComp = act.icon;
                    return (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => setEditingTimeoutRule(prev => prev ? { ...prev, actionType: act.key as any } : prev)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold ring-1 ring-blue-500 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] whitespace-nowrap">{act.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 动作专属子配置面板 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in duration-150">
                  {/* 催办提醒设置 */}
                  {editingTimeoutRule.actionType === 'remind' && (
                    <div className="space-y-3.5">
                      {/* 提醒对象 */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">提醒对象</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'assignee', label: '当前节点处理人' },
                            { key: 'initiator', label: '流程发起人' },
                            { key: 'supervisor', label: '当前人直属主管' },
                            { key: 'admin', label: '应用系统管理员' }
                          ].map(t => {
                            const isChecked = (editingTimeoutRule.remindTargets || ['assignee']).includes(t.key as any);
                            return (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => {
                                  const current = editingTimeoutRule.remindTargets || ['assignee'];
                                  const updated = current.includes(t.key as any)
                                    ? current.filter(x => x !== t.key)
                                    : [...current, t.key as any];
                                  setEditingTimeoutRule(prev => prev ? { ...prev, remindTargets: updated.length > 0 ? updated : ['assignee'] } : prev);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isChecked
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                <span>{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 提醒渠道 */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">通知渠道</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'wecom', label: '企业微信 / 钉钉通知' },
                            { key: 'app', label: '应用站内消息' },
                            { key: 'sms', label: '手机短信通知' },
                            { key: 'email', label: '电子邮箱通知' }
                          ].map(c => {
                            const isChecked = (editingTimeoutRule.remindChannels || ['wecom']).includes(c.key as any);
                            return (
                              <button
                                key={c.key}
                                type="button"
                                onClick={() => {
                                  const current = editingTimeoutRule.remindChannels || ['wecom'];
                                  const updated = current.includes(c.key as any)
                                    ? current.filter(x => x !== c.key)
                                    : [...current, c.key as any];
                                  setEditingTimeoutRule(prev => prev ? { ...prev, remindChannels: updated.length > 0 ? updated : ['wecom'] } : prev);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isChecked
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                <span>{c.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 循环催办 */}
                      <div className="pt-1 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-xs font-bold text-slate-700">循环催办提醒</span>
                            <p className="text-[10px] text-slate-400">开启后将按固定间隔多次发送催办通知</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingTimeoutRule(prev => prev ? { ...prev, repeatRemind: !prev.repeatRemind } : prev)}
                            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                              editingTimeoutRule.repeatRemind ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                                editingTimeoutRule.repeatRemind ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {editingTimeoutRule.repeatRemind && (
                          <div className="flex items-center gap-3 pt-1 text-xs text-slate-600">
                            <span>每隔</span>
                            <input
                              type="number"
                              min={1}
                              max={48}
                              value={editingTimeoutRule.repeatIntervalHours || 2}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value) || 1);
                                setEditingTimeoutRule(prev => prev ? { ...prev, repeatIntervalHours: val } : prev);
                              }}
                              className="w-16 h-7 px-2 bg-white border border-slate-200 rounded text-center text-xs font-mono outline-none focus:border-blue-500"
                            />
                            <span>小时催办一次，最多催办</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={editingTimeoutRule.maxRepeatCount || 3}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value) || 1);
                                setEditingTimeoutRule(prev => prev ? { ...prev, maxRepeatCount: val } : prev);
                              }}
                              className="w-16 h-7 px-2 bg-white border border-slate-200 rounded text-center text-xs font-mono outline-none focus:border-blue-500"
                            />
                            <span>次</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 自动转交设置 */}
                  {editingTimeoutRule.actionType === 'transfer' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-700 block">转交办理对象</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'supervisor', label: '直属主管', desc: '转交给当前人的直接上级' },
                          { key: 'specified', label: '指定人员', desc: '从通讯录选择转交专人' },
                          { key: 'admin', label: '应用管理员', desc: '转交至主管理员督办' }
                        ].map(t => {
                          const isSelected = (editingTimeoutRule.transferType || 'supervisor') === t.key;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setEditingTimeoutRule(prev => prev ? { ...prev, transferType: t.key as any } : prev)}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-400'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${isSelected ? 'text-amber-800' : 'text-slate-700'}`}>{t.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                            </button>
                          );
                        })}
                      </div>

                      {editingTimeoutRule.transferType === 'specified' && (
                        <div className="pt-2">
                          <label className="text-xs font-medium text-slate-600 block mb-1.5">选择转交指定人员：</label>
                          <select
                            value={editingTimeoutRule.transferMember?.id || 'usr_zhangsan'}
                            onChange={(e) => {
                              const found = MOCK_USERS.find(u => u.id === e.target.value) || { id: e.target.value, name: '指定经办人', org: '管理办公室', role: '经办人' };
                              setEditingTimeoutRule(prev => prev ? { ...prev, transferMember: found } : prev);
                            }}
                            className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500"
                          >
                            <option value="usr_zhangsan">张建国 (市公安局 / 办公室 · 部门主管)</option>
                            <option value="usr_lihongyan">李红艳 (市公安局 / 网安支队 · 专职审核)</option>
                            <option value="usr_wangqiang">王强 (历下分局 / 治安大队 · 经办民警)</option>
                            <option value="usr_zhaodemin">赵德民 (历下分局 / 办公室 · 分局负责人)</option>
                            <option value="usr_liufang">刘芳 (市公安局 / 指挥中心 · 值班长)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 自动跳转设置 */}
                  {editingTimeoutRule.actionType === 'jump' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-700 block">选择跳转目标节点</label>
                      <select
                        value={editingTimeoutRule.jumpTargetNodeId || ''}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          const foundNode = flowNodes.find(n => n.id === targetId);
                          setEditingTimeoutRule(prev => prev ? {
                            ...prev,
                            jumpTargetNodeId: targetId,
                            jumpTargetNodeName: foundNode?.name || '指定节点'
                          } : prev);
                        }}
                        className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-violet-500"
                      >
                        <option value="">-- 请选择流程目标节点 --</option>
                        {flowNodes
                          .filter(n => n.id !== selectedNode.id)
                          .map(n => (
                            <option key={n.id} value={n.id}>
                              【{n.categoryLabel || n.nodeType}】{n.name}
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-slate-400">
                        提示：触发超时后，流程将直接跳过本节点，流转至所选的目标节点继续办理。
                      </p>
                    </div>
                  )}

                  {/* 自动同意 / 自动拒绝 附言 */}
                  {(editingTimeoutRule.actionType === 'auto_pass' || editingTimeoutRule.actionType === 'auto_reject') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        {editingTimeoutRule.actionType === 'auto_pass' ? '自动审批同意附言说明' : '自动拒绝终止原因说明'}
                      </label>
                      <input
                        type="text"
                        value={editingTimeoutRule.opinion || ''}
                        onChange={(e) => setEditingTimeoutRule(prev => prev ? { ...prev, opinion: e.target.value } : prev)}
                        placeholder={editingTimeoutRule.actionType === 'auto_pass' ? '例如：超过规定时效，系统自动审批通过' : '例如：超时未处理，系统自动拒绝并终止流程'}
                        className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 实时规则预览 */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="text-[11px] font-bold text-blue-800 mb-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>规则执行描述预览：</span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  {generateTimeoutRuleDesc(editingTimeoutRule)}
                </p>
              </div>
            </div>

            {/* 底栏操作 */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsTimeoutModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalDesc = generateTimeoutRuleDesc(editingTimeoutRule);
                  const finalizedRule: DetailedTimeoutRule = {
                    ...editingTimeoutRule,
                    desc: finalDesc,
                    enabled: editingTimeoutRule.enabled !== false
                  };

                  let nextRules: DetailedTimeoutRule[];
                  if (timeoutRulesDetailed.some(r => r.id === finalizedRule.id)) {
                    nextRules = timeoutRulesDetailed.map(r => r.id === finalizedRule.id ? finalizedRule : r);
                  } else {
                    nextRules = [...timeoutRulesDetailed, finalizedRule];
                  }

                  setTimeoutRulesDetailed(nextRules);
                  handleUpdateNode({
                    timeoutRulesDetailed: nextRules,
                    timeoutRules: nextRules.map(r => ({ id: r.id, hours: r.timeValue, desc: r.desc || generateTimeoutRuleDesc(r) }))
                  });
                  setIsTimeoutModalOpen(false);
                  setPanelToast('已成功保存超时处理规则');
                  setTimeout(() => setPanelToast(null), 1500);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>保存规则</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
