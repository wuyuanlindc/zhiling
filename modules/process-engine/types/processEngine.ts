/**
 * 流程与模板引擎管理 - 核心类型定义 (Process & Low-Code Template Engine Types)
 * 
 * 核心架构规范：
 * 1. 业务系统与租户架构：
 *    - 纳管 3 大业务系统：正管用（网络生态综合治理平台）、谛听预警（态势感知预警系统）、点点速报（协同督办与指令流转系统）
 *    - 模板必须属于某一业务系统 (systemId / systemName)
 *    - 模板归属范围：可以是「公共模板」(scope: 'public')，也可以是「某个机构/租户专属模板」(scope: 'org', orgId, orgName)
 * 2. 4步式低代码流程模板向导工作台：
 *    - 步骤 1：基础信息 (系统、归属范围、模板名称与编码、分类说明)
 *    - 步骤 2：低代码表单设计 (24 栅格低代码画布、18基础控件+8布局控件拖拽与大小调节、发令与回执双区域)
 *    - 步骤 3：流程设计 (政务审批流转节点卡片链路、支持插入/删除/移动、审批模式、时限与归档策略)
 *    - 步骤 4：流程配置 (节点字段读写权限矩阵、操作按钮与动作权限、全局流转规则)
 */

// 3大业务系统定义
export interface BusinessSystemItem {
  id: string;
  code: string;
  name: string;
  shortName: string;
  desc: string;
  appCode: string;
  themeColor: 'blue' | 'amber' | 'emerald';
  badgeColor: string;
}

export const BUSINESS_SYSTEMS: BusinessSystemItem[] = [
  {
    id: 'SYS_ZLL',
    code: 'SYS_ZLL',
    name: '指令流转',
    shortName: '指令流转',
    desc: '跨层级指令流转、任务指派与政务审批协同',
    appCode: 'V8-FLOW-01',
    themeColor: 'blue',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'SYS_DDSB',
    code: 'SYS_DDSB',
    name: '点点速豹',
    shortName: '点点速豹',
    desc: '协同督办、实时速报与紧急处置抢办',
    appCode: 'V8-SPEED-02',
    themeColor: 'amber',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'SYS_ZLWP',
    code: 'SYS_ZLWP',
    name: '知了网评',
    shortName: '知了网评',
    desc: '网评引导、网络生态舆情研判与多维度巡查',
    appCode: 'V8-REVIEW-03',
    themeColor: 'emerald',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
];

// ======================= 低代码 24 栅格表单设计器类型 =======================

// 控件大类
export type FormWidgetCategory = 'basic' | 'advanced' | 'layout';

// 基础控件类型 (含扩展业务组件)
export type BasicWidgetType =
  | 'input'         // 单行输入
  | 'textarea'      // 多行输入
  | 'number'        // 数字输入
  | 'switch'        // 开关
  | 'radio'         // 单选框组
  | 'checkbox'      // 多选框组
  | 'select'        // 下拉选择 / 下拉单选
  | 'multi_select'   // 下拉复选
  | 'cascader'      // 级联选择
  | 'date'          // 日期选择
  | 'time'          // 时间选择
  | 'file'          // 文件上传
  | 'image'         // 图片上传
  | 'color'         // 颜色选择
  | 'rich_text'     // 富文本
  | 'link'          // 链接
  | 'button'        // 按钮
  | 'static_text'   // 静态文本
  | 'alert'         // 提示信息
  | 'phone_verify'  // 手机验证码
  | 'rate'          // 打分/评分组件
  | 'score'         // 评分
  | 'org_group_dispatch'; // 下发组织节点/群组

// 高级控件类型 (4种时效控件)
export type AdvancedWidgetType =
  | 'response_time_limit'     // 限时响应时间
  | 'handle_time_limit'       // 限时处理时间
  | 'response_duration_limit' // 限时响应时限
  | 'handle_duration_limit';  // 限时处理时限

// 布局控件类型 (8种)
export type LayoutWidgetType =
  | 'section_title'   // 分组标题
  | 'divider'         // 分割线
  | 'collapse'        // 折叠面板
  | 'tabs'            // 标签面板
  | 'steps'           // 步骤条
  | 'grid_container'  // 栅格容器
  | 'card_container'  // 卡片容器
  | 'table_container';// 表格容器

export type FormWidgetType = BasicWidgetType | AdvancedWidgetType | LayoutWidgetType;

// 单个表单组件实例数据模型
export interface FormWidgetComponent {
  id: string;                       // 组件唯一 ID (如 widget_123)
  key: string;                      // 字段英文 key (如 title, urgency, deadline)
  label: string;                    // 组件显示名称
  type: FormWidgetType;             // 控件类型
  category: FormWidgetCategory;     // 控件大类
  
  // 24 栅格宽度控制 (1 ~ 24，默认为 24 或 12)
  span: number;                     // 栅格占用列数，例如 24 占满一行, 12 占半行, 8 占1/3, 6 占1/4
  
  // 基础表单属性
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  helpText?: string;
  widgetStatus?: 'normal' | 'disabled' | 'readonly' | 'hidden'; // 状态 (普通、禁用、只读、隐藏)
  clearable?: boolean;            // 清除按钮 (单行输入等)
  rows?: number;                  // 高度/行数 (多行输入等)
  autoHeight?: boolean;           // 自动高度
  unit?: string;                  // 单位 (数值组件，如 元、%、件)
  precision?: number;             // 小数位数 (数值组件)
  thousandSeparator?: boolean;    // 千位分隔符 (数值组件)
  multiple?: boolean;             // 下拉复选 / 多选
  selectAll?: boolean;            // 全选按钮
  direction?: 'horizontal' | 'vertical'; // 排列方式 (单选/复选)
  
  // 下拉/单选/多选候选选项
  options?: { label: string; value: any; color?: string }[];
  
  // 特殊字段配置与校验
  min?: number;                   // 最小值
  max?: number;                   // 最大值
  minLength?: number;             // 最小长度
  maxLength?: number;             // 最大长度
  step?: number;                  // 步长
  maxCount?: number;              // 最大上传文件数
  maxFileSizeMB?: number;           // 最大文件尺寸
  dateFormat?: string;              // 如 YYYY-MM-DD
  defaultValueType?: 'none' | 'now' | 'custom'; // 默认值策略
  dateDefaultType?: 'none' | 'now' | 'custom';  // 兼容别名
  dateRangeType?: 'none' | 'future' | 'past' | 'custom_range' | 'custom'; // 可选时间区间策略
  linkUrl?: string;                 // 链接地址
  buttonText?: string;              // 按钮文案
  alertType?: 'info' | 'warning' | 'success' | 'error';
  defaultCollapsed?: boolean;       // 折叠面板默认折叠状态 (true: 默认折叠, false: 默认展开)
  collapseContent?: string;         // 折叠面板详细说明/内容
  
  // 打分组件专属等级配置与文案
  rateLevels?: { score: number; label: string; color?: string; desc?: string; star?: number; grade?: string }[];
  showScoreText?: boolean;          // 是否显示分值文案

  // 校验规则
  validationRegex?: string;
  validationMessage?: string;
  
  // 所属区域分区 ('issue' 指令发令下发区域 | 'feedback' 处置回执办理区域)
  region?: 'issue' | 'feedback';

  // 样式属性
  labelAlign?: 'left' | 'right' | 'center';
  customClass?: string;
  customStyle?: Record<string, string>;
}

// 表单全局属性配置
export interface FormGlobalConfig {
  formTitle: string;
  formSubTitle?: string;
  labelPosition: 'top' | 'left' | 'right';
  labelWidth: number;
  size: 'small' | 'default' | 'large';
  gutter: number; // 栅格间距 (px)
  columnsTotal: 24; // 固化 24 栅格标准
}

// 表单分区定义
export interface FormSectionRegion {
  id: 'issue' | 'feedback';
  name: string;
  subTitle: string;
  iconName: string;
}

// ======================= 流程设计与流转节点类型 =======================

export type FlowNodeCategory = 'draft' | 'handle' | 'approval' | 'condition' | 'parallel' | 'cc' | 'notify' | 'end';

// 分支项条件规则定义
export interface FlowBranchConditionRule {
  id: string;
  fieldKey: string;
  fieldName: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
  value: string;
  valueLabel?: string;
}

// 分支项定义 (用于条件分支和并行分支)
export interface FlowBranchItem {
  id: string;
  name: string;                   // 分支名称，如 "条件1" 或 "其他情况" 或 "并行分支1"
  branchType?: 'if' | 'else';     // 条件分支区分 if (条件判断) 和 else (其他情况)
  tag?: string;                   // 标签显示：如 "IF" 或 "ELSE"
  desc?: string;                  // 说明文字，如 "所有数据均可进入" 或 "其他情况进入此流程"
  conditionText?: string;         // 具体条件描述
  priority?: number;              // 优先级
  configMode?: 'condition' | 'formula'; // 规则配置方式：按条件配置(condition) 或 按公式配置(formula)
  formula?: string;               // 按公式配置时的公式表达式
  conditionLogic?: 'and' | 'or';  // 条件关系：全部满足 (and) / 任一满足 (or)
  conditions?: FlowBranchConditionRule[]; // 结构化条件列表
  nodes?: FlowStepNodeItem[];     // 分支内部包含的子流转节点（可选嵌套）
}

export interface DetailedTimeoutRuleItem {
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
  transferMembers?: { id: string; name: string; org?: string; role?: string; avatarBg?: string }[];
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

export interface FlowStepNodeItem {
  id: string;
  nodeCode: string;
  name: string;
  nodeType: FlowNodeCategory;
  categoryLabel: string;
  description: string;
  
  // 分支节点专属配置 (条件分支 / 并行分支)
  branchType?: 'condition' | 'parallel';
  branches?: FlowBranchItem[];
  
  // 办理人与审批配置
  receiverType?: 'initiator' | 'dept' | 'role' | 'specified_users';
  receiverLabel?: string;
  approveMode?: 'any' | 'all' | 'single' | 'or_sign'; // 或签(一名通过即生效) | 会签
  approveModeLabel?: string;

  // 审批人详细设置 (参考图片 2)
  assigneeMode?: 'simple' | 'condition';
  assigneeType?: 'specified_member' | 'role' | 'dept_leader' | 'multi_leader' | 'direct_leader' | 'dept_contact' | 'initiator' | 'initiator_select' | 'form_member' | 'third_party';
  selectedMembers?: { id: string; name: string; org?: string; role?: string }[];
  supervisorLevel?: 'direct' | 'level2' | 'continuous';
  deptLeaderLevel?: number; // 1 ~ 10 发起人的第几级主管
  supervisorSource?: 'initiator' | 'form_member';
  supervisorSourceFormMemberField?: string;
  supervisorEndpointType?: 'role' | 'top_level' | 'specific_level';
  supervisorSelectedRole?: string;
  supervisorMaxLevel?: number; // 1 ~ 10
  supervisorDirectoryLevel?: string; // 'top' | 'level_1' ~ 'level_10'
  supervisorLevelSelect?: string;
  supervisorSelfAction?: 'self' | 'skip';
  supervisorEmptyAction?: 'auto_pass' | 'admin' | 'specified';
  supervisorMultiType?: 'all' | 'or_sign' | 'sequential';
  supervisorFallbackApprovers?: { id: string; name: string; org?: string; role?: string; avatarBg?: string }[];
  selectedRoleId?: string;
  selectedRoleName?: string;
  formMemberFieldKey?: string;
  formMemberFieldName?: string;
  multiApproveType?: 'all' | 'or_sign' | 'sequential'; // 会签(需所有审批人同意) | 或签(一名审批人同意即可) | 依次审批(按顺序依次审批)

  // 审批按钮详细设置 (参考图片 3)
  nodeButtons?: {
    key: string;
    label: string;
    displayName: string;
    opinionPolicy: string;
    allowBatch?: boolean;
    batchChecked?: boolean;
    enabled: boolean;
  }[];

  // 跳转设置 (参考图片 4 Tab 4)
  jumpEnabled?: boolean;
  jumpRules?: { id: string; conditionField: string; operator: string; value: string; targetNodeId: string }[];

  // 高级设置 (参考图片 1)
  autoApproveInitiator?: boolean;
  autoApproveAdjacent?: boolean;
  emptyAssigneeAction?: 'skip' | 'admin' | 'specified' | 'pause';

  // 响应和处理时效限制
  timeLimitEnabled?: boolean;                     // 是否开启响应和处理时效限制
  timeLimitMode?: 'default' | 'initiator_select'; // 'default' 默认模式(固定时限) | 'initiator_select' 发起人自选模式
  timeLimitHours?: number;                        // 默认模式下的处理时效 (数字，单位 h)
  timeLimitFieldKey?: string;                     // 发起人自选模式下绑定的表单字段 key
  timeLimitFieldName?: string;                    // 发起人自选模式下绑定的表单字段名称

  timeoutRules?: { id: string; hours?: number; action?: string; desc?: string }[];
  timeoutRulesDetailed?: DetailedTimeoutRuleItem[];

  // 消息通知节点配置
  notifyChannels?: ('sms' | 'wechat' | 'dingtalk' | 'in_app')[];
  notifyReceivers?: string[];
  notifyTemplateTitle?: string;
  notifyTargetType?: 'member' | 'group';
  notifyTargetTypes?: string[];
  notifyMembers?: { id: string; name: string; org?: string; role?: string; avatarBg?: string }[];
  notifyRoleId?: string;
  notifyFormField?: string;
  notifyTitle?: string;
  notifyContent?: string;
  notifyButtonName?: string;
  notifyButtonAction?: 'form' | 'custom_url';
  notifyButtonUrl?: string;
  notifyRelatedFormId?: string;
  notifyRelatedFormName?: string;
  
  // 时效与超时展示规则
  timeLimitLabel?: string;
  
  // 特殊控制
  allowTransfer?: boolean;          // 处理人可转办
  allowPostpone?: boolean;          // 允许申请延期
  rejectPolicy?: 'to_initiator' | 'to_previous' | 'end';
  rejectPolicyLabel?: string;
  passPolicy?: 'to_next' | 'direct_archive';
  passPolicyLabel?: string;
  
  // 归档策略 (办结节点使用)
  archiveActions?: string[];
  
  // 动作按钮列表 (第4步配置)
  actionButtons?: {
    id: string;
    label: string;
    actionType: 'submit' | 'save_draft' | 'transfer' | 'reject' | 'pass' | 'terminate' | 'urge';
    color: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
    enabled: boolean;
  }[];

  // 字段读写权限矩阵 (第4步配置: [fieldKey]: 'editable' | 'readonly' | 'hidden')
  fieldPermissions?: Record<string, 'editable' | 'readonly' | 'hidden'>;
}

// 兼容旧字段接口
export interface TemplateFieldItem {
  key: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: any }[];
}

// ======================= 完整低代码流程模板实体 =======================

export type TemplateType = 'normal' | 'process';

// 关联表单与流程模型
export interface AssociatedProcessTemplateLink {
  id: string;                      // 关联记录唯一ID
  templateId: string;              // 关联的流程/表单模板ID
  templateName: string;            // 关联流程名称
  templateType?: TemplateType;     // 模板类型 ('normal' | 'process')
  systemId?: string;               // 所属系统ID
  systemName?: string;             // 所属系统名称
  category?: string;               // 业务分类
  relationType?: 'upstream' | 'downstream' | 'collaborative' | 'sub_process' | 'shared_form'; // 关联类型
  relationLabel?: string;          // 关联类型标签
  description?: string;            // 关联说明
  linkedAt: string;                // 关联建立时间
  status?: 'active' | 'inactive';  // 关联状态
}

export interface ProcessTemplateItem {
  id: string;                     // 10位真实唯一ID
  systemId: string;               // 必须属于某一业务系统 (SYS_ZLL | SYS_DDSB | SYS_ZLWP)
  systemName: string;
  templateType?: TemplateType;     // 'normal' 普通模板 (仅表单设计+全局设置) | 'process' 流程模板 (全功能审批流转)
  templateCode?: string;          // 历史编码（已废弃）
  templateName: string;
  category: string;
  scope: 'public' | 'org';        // 'public' 公共 或 'org' 机构专属
  scopeMode?: 'public' | 'org_tree' | 'org_group' | 'org_custom'; // 授权归属模式 (公共 / 层级树继承 / 机构分组 / 自定义清单)
  orgId?: string;                 // 机构ID（当 scope 为 'org' 时）
  orgIds?: string[];               // 多机构ID列表（当 scope 为 'org' 且授权多个机构时）
  orgName?: string;               // 机构名称
  orgNames?: string[];             // 多机构名称列表
  orgGroupName?: string;          // 所属机构预设分组名称 (如：全辖基层派出所群 78家)
  orgRootName?: string;           // 层级继承根节点名称 (如：历下分局含下辖全部15家机构)
  excludeOrgIds?: string[];       // 反向排除机构ID列表
  excludeOrgNames?: string[];     // 反向排除机构名称列表
  description?: string;
  version: string;
  status: 'active' | 'inactive' | 'draft';
  isNewTemplate?: boolean;
  appliedTenantCount?: number;    // 引用/开通租户机构数
  creator: string;
  createdAt: string;
  updatedAt: string;

  // 1. 低代码表单定义 (包含 24 栅格所有组件)
  formConfig?: FormGlobalConfig;
  formWidgets?: FormWidgetComponent[];

  // 2. 流程流转链路定义 (4个及以上政务流转环节)
  flowNodes?: FlowStepNodeItem[];

  // 3. 全局流转规则设置
  globalRules?: {
    allowCancel: boolean;
    cancelTimeLimitMinutes: number;
    slaOverdueAlert: boolean;
    slaOverdueHours: number;
    urgeMethod: 'in_app' | 'sms' | 'wechat';
  };

  // 4. 关联表单与流程列表
  associatedTemplates?: AssociatedProcessTemplateLink[];

  // 兼容旧接口字段
  fields: TemplateFieldItem[];
  defaultProcessId?: string;
  supportedProcessIds?: string[];
}

// 接收对象类型
export type ReceiverType = 'org' | 'role' | 'group' | 'user';
export type ReceiverScope = 'current_org' | 'current_and_sub' | 'specified_org' | 'all';

export interface ReceiverItem {
  id: string;
  type: ReceiverType;
  scope: ReceiverScope;
  targetId: string;
  targetName: string;
  orgId?: string;
  orgName?: string;
  deptId?: string;
  deptName?: string;
  roleId?: string;
  roleName?: string;
  description?: string;
}

export type HandleMode = 'single' | 'any' | 'countersign' | 'or_sign' | 'main_assistant' | 'multi_collab';

export interface CountersignConfig {
  finishCondition: 'all' | 'min_count';
  minCount?: number;
}

export interface MainAssistantConfig {
  mainUserId: string;
  mainUserName: string;
  assistantUserIds: string[];
  assistantUserNames: string[];
}

export type TimeLimitType = 'unlimited' | 'fixed_duration' | 'specified_date' | 'field_calc';

export interface TimeLimitConfig {
  type: TimeLimitType;
  duration?: number;
  durationUnit?: 'hours' | 'work_days' | 'natural_days';
  specifiedDate?: string;
  fieldExpression?: string;
}

export type OverdueRule = 'alert' | 'urge' | 'notify_leader' | 'escalate';
export type ApprovalMode = 'single' | 'countersign' | 'or_sign' | 'leader';
export type ApprovalAction = 'pass' | 'return' | 'reject' | 'transfer' | 'add_sign';
export type CCMethod = 'in_app_notice' | 'sms' | 'wechat_work' | 'dingtalk';
export type WaitType = 'fixed_duration' | 'specified_date' | 'business_event';
export type FlowNodeType = 'start' | 'handle' | 'approval' | 'condition' | 'cc' | 'wait' | 'end';

export type ConditionOperator = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'is_workday' | 'is_holiday';

export interface ConditionRule {
  id: string;
  field: string;
  fieldName: string;
  operator: ConditionOperator;
  value: any;
  valueLabel?: string;
}

export interface ConditionBranch {
  id: string;
  name: string;
  relation: 'AND' | 'OR';
  rules: ConditionRule[];
  targetNodeId: string;
  isDefault?: boolean;
}

export interface FlowNodeData {
  name: string;
  description?: string;
  nodeType: FlowNodeType;
  isValid?: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  startTriggerType?: 'auto_create' | 'manual' | 'api_trigger';
  receivers?: ReceiverItem[];
  handleMode?: HandleMode;
  countersignConfig?: CountersignConfig;
  mainAssistantConfig?: MainAssistantConfig;
  timeLimit?: TimeLimitConfig;
  overdueRules?: OverdueRule[];
  feedbackRequirements?: string[];
  allowTransfer?: boolean;
  allowPostpone?: boolean;
  approvalMode?: ApprovalMode;
  approvalActions?: ApprovalAction[];
  returnRule?: 'to_previous' | 'to_start' | 'to_handler';
  rejectRule?: 'end_process' | 're_draft';
  requireComment?: boolean;
  ccReceivers?: ReceiverItem[];
  ccMethods?: CCMethod[];
  conditionBranches?: ConditionBranch[];
  waitType?: WaitType;
  waitDuration?: number;
  waitDurationUnit?: 'hours' | 'days';
  waitDate?: string;
  waitEventName?: string;
  businessEvents?: string[];
}

export interface FlowCanvasNode {
  id: string;
  type: FlowNodeType;
  x: number;
  y: number;
  data: FlowNodeData;
}

export interface FlowCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  branchId?: string;
  conditionDescription?: string;
}

export interface ProcessDefinition {
  id: string;
  systemId: string;
  systemName: string;
  processCode: string;
  processName: string;
  description: string;
  category: 'task' | 'report' | 'approval' | 'verify' | 'urge' | 'special';
  categoryName: string;
  version: string;
  status: 'draft' | 'published' | 'disabled';
  scope: 'platform' | 'org';
  orgId?: string;
  orgName?: string;
  relatedTemplateIds: string[];
  relatedTemplateNames: string[];
  allowMultiTemplates?: boolean;
  creator: string;
  createdAt: string;
  updatedAt: string;
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
}

export interface ProcessVersionItem {
  id: string;
  processId: string;
  processCode: string;
  processName: string;
  version: string;
  status: 'published' | 'archived' | 'draft';
  creator: string;
  createdAt: string;
  publishedAt?: string;
  changeLog: string;
  nodesCount: number;
}
