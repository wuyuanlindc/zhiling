/**
 * 低代码 24 栅格表单设计器 - 控件元数据定义与默认配置 (WidgetMeta)
 * 包含 18 种基础控件与 3 种布局控件（分组标题、分割线、折叠面板）
 */

import { FormWidgetType, FormWidgetComponent, FormWidgetCategory } from '../../../types/processEngine';
import { DEFAULT_DISPATCH_PERSONNEL } from './OrgGroupDispatchModal';

export interface WidgetMetaItem {
  type: FormWidgetType;
  label: string;
  category: FormWidgetCategory;
  iconName: string;
  defaultSpan: number; // 默认 24 栅格中占用的列数
  defaultProps: Partial<FormWidgetComponent>;
}

// 18 种基础控件
export const BASIC_WIDGET_LIST: WidgetMetaItem[] = [
  {
    type: 'input',
    label: '单行文本',
    category: 'basic',
    iconName: 'Type',
    defaultSpan: 12,
    defaultProps: {
      placeholder: '请输入',
      required: false,
      defaultValue: ''
    }
  },
  {
    type: 'textarea',
    label: '多行文本',
    category: 'basic',
    iconName: 'AlignLeft',
    defaultSpan: 24,
    defaultProps: {
      placeholder: '请输入',
      required: false,
      defaultValue: '',
      rows: 4
    }
  },
  {
    type: 'number',
    label: '数字输入',
    category: 'basic',
    iconName: 'Hash',
    defaultSpan: 8,
    defaultProps: {
      placeholder: '请输入数字',
      min: 0,
      max: 999999,
      defaultValue: 0,
      step: 1,
      precision: 0
    }
  },
  {
    type: 'switch',
    label: '开关',
    category: 'basic',
    iconName: 'ToggleRight',
    defaultSpan: 6,
    defaultProps: {
      defaultValue: false
    }
  },
  {
    type: 'radio',
    label: '单选框组',
    category: 'basic',
    iconName: 'CheckCircle',
    defaultSpan: 12,
    defaultProps: {
      defaultValue: 'opt1',
      direction: 'horizontal',
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
        { label: '选项三', value: 'opt3' }
      ]
    }
  },
  {
    type: 'checkbox',
    label: '多选框组',
    category: 'basic',
    iconName: 'CheckSquare',
    defaultSpan: 12,
    defaultProps: {
      defaultValue: ['opt1'],
      direction: 'horizontal',
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
        { label: '选项三', value: 'opt3' }
      ]
    }
  },
  {
    type: 'select',
    label: '下拉单选',
    category: 'basic',
    iconName: 'ChevronDownSquare',
    defaultSpan: 12,
    defaultProps: {
      placeholder: '请选择',
      defaultValue: '',
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
        { label: '选项三', value: 'opt3' }
      ]
    }
  },
  {
    type: 'multi_select',
    label: '下拉复选',
    category: 'basic',
    iconName: 'ListOrdered',
    defaultSpan: 12,
    defaultProps: {
      placeholder: '请选择多项',
      defaultValue: [],
      multiple: true,
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
        { label: '选项三', value: 'opt3' }
      ]
    }
  },
  {
    type: 'cascader',
    label: '级联选择',
    category: 'basic',
    iconName: 'Layers',
    defaultSpan: 12,
    defaultProps: {
      placeholder: '请选择分局/科室/网格',
      defaultValue: '',
      options: [
        { label: '济南市公安局 / 指挥中心', value: 'jn_zhzx' },
        { label: '历下分局 / 治安大队', value: 'lx_zadd' },
        { label: '市中分局 / 网安大队', value: 'sz_wadd' }
      ]
    }
  },
  {
    type: 'date',
    label: '日期选择',
    category: 'basic',
    iconName: 'Calendar',
    defaultSpan: 12,
    defaultProps: {
      label: '日期选择',
      placeholder: '请选择',
      helpText: '',
      widgetStatus: 'normal',
      dateFormat: 'YYYY-MM-DD',
      dateRangeType: 'none',
      dateDefaultType: 'none'
    }
  },
  {
    type: 'file',
    label: '文件上传',
    category: 'basic',
    iconName: 'UploadCloud',
    defaultSpan: 24,
    defaultProps: {
      maxCount: 5,
      maxFileSizeMB: 20,
      helpText: '支持 PDF, Word, Excel 压缩包文件，单个不超过 20MB'
    }
  },
  {
    type: 'image',
    label: '图片上传',
    category: 'basic',
    iconName: 'Image',
    defaultSpan: 24,
    defaultProps: {
      maxCount: 9,
      maxFileSizeMB: 10,
      helpText: '支持 JPG, PNG 格式，最多上传 9 张'
    }
  },
  {
    type: 'rich_text',
    label: '富文本',
    category: 'basic',
    iconName: 'FileText',
    defaultSpan: 24,
    defaultProps: {
      placeholder: '在此编写富文本排版内容...',
      defaultValue: ''
    }
  },
  {
    type: 'link',
    label: '链接',
    category: 'basic',
    iconName: 'ExternalLink',
    defaultSpan: 12,
    defaultProps: {
      linkUrl: 'https://example.gov.cn',
      label: '参考权威公告链接'
    }
  },
  {
    type: 'static_text',
    label: '静态文本',
    category: 'basic',
    iconName: 'Type',
    defaultSpan: 24,
    defaultProps: {
      defaultValue: '请认真遵照国家互联网治理规范及网络安全法相关条例，如实详尽填报处置材料。',
      label: '填报说明'
    }
  },
  {
    type: 'alert',
    label: '提示信息',
    category: 'basic',
    iconName: 'AlertCircle',
    defaultSpan: 24,
    defaultProps: {
      alertType: 'warning',
      defaultValue: '注意：涉案线索需在 4 小时内完成初核并报送值班室。',
      label: '重要警示'
    }
  }
];

// 高级控件：限时处理时间、限时处理时限
export const ADVANCED_WIDGET_LIST: WidgetMetaItem[] = [
  {
    type: 'handle_time_limit',
    label: '限时处理时间',
    category: 'advanced',
    iconName: 'CalendarCheck',
    defaultSpan: 12,
    defaultProps: {
      label: '限时处理时间',
      placeholder: '请选择',
      helpText: '',
      widgetStatus: 'normal',
      dateFormat: 'YYYY-MM-DD',
      dateRangeType: 'none',
      dateDefaultType: 'none',
      required: false
    }
  },
  {
    type: 'handle_duration_limit',
    label: '限时处理时限',
    category: 'advanced',
    iconName: 'Hourglass',
    defaultSpan: 12,
    defaultProps: {
      label: '限时处理时限',
      placeholder: '请输入处理办结时限 (小时)',
      defaultValue: 24,
      unit: '小时',
      min: 1,
      max: 720,
      step: 1,
      required: true,
      helpText: '责任部门办理与办结回执的倒计时总时限（小时）'
    }
  }
];

// 3 种布局与划分控件：分组标题、分割线、折叠面板
export const LAYOUT_WIDGET_LIST: WidgetMetaItem[] = [
  {
    type: 'section_title',
    label: '分组标题',
    category: 'layout',
    iconName: 'Heading',
    defaultSpan: 24,
    defaultProps: {
      label: '一、核心下发指令要素与背景'
    }
  },
  {
    type: 'divider',
    label: '分割线',
    category: 'layout',
    iconName: 'Minus',
    defaultSpan: 24,
    defaultProps: {
      label: ''
    }
  },
  {
    type: 'collapse',
    label: '折叠面板',
    category: 'layout',
    iconName: 'ChevronsUpDown',
    defaultSpan: 24,
    defaultProps: {
      label: '展开历史调证研判记录',
      helpText: '点击展开/收起查看关联材料与办理指引',
      defaultCollapsed: false,
      collapseContent: '此处为折叠面板收录的背景研判材料、参考法规及历史流转记录。支持在表单中收起折叠以节省填报空间，点击头部即可展开完整查看。'
    }
  }
];

// 自定义组件定义接口
export interface CustomWidgetMetaItem {
  id: string;
  type: FormWidgetType;
  label: string;
  system: 'SYS_ZLL' | 'SYS_DDSB' | 'SYS_ZLWP';
  systemName: '指令流转' | '点点速豹' | '知了网评';
  iconName: string;
  description: string;
  defaultSpan: number;
  defaultProps: Partial<FormWidgetComponent>;
}

// 自定义组件按业务系统分类配置（点点速豹、知了网评）
export const CUSTOM_WIDGETS_MAP: Record<'SYS_ZLL' | 'SYS_DDSB' | 'SYS_ZLWP', CustomWidgetMetaItem[]> = {
  SYS_DDSB: [
    {
      id: 'ddsb_phone_verify',
      type: 'phone_verify',
      label: '获取手机验证码',
      system: 'SYS_DDSB',
      systemName: '点点速豹',
      iconName: 'Smartphone',
      description: '包含填写手机号文本框、获取验证码按钮、填写验证码文本框',
      defaultSpan: 24,
      defaultProps: {
        label: '手机验证码',
        placeholder: '请输入11位手机号码',
        helpText: '用于速报紧急联系人短信核验与实名认证',
        required: true,
        defaultValue: { phone: '', code: '' }
      }
    },
    {
      id: 'ddsb_score_rating',
      type: 'rate',
      label: '打分',
      system: 'SYS_DDSB',
      systemName: '点点速豹',
      iconName: 'Star',
      description: '分级打分测评组件，严格支持一等至五等分级得分标准(100分~60分)及量化评定文案',
      defaultSpan: 24,
      defaultProps: {
        label: '打分',
        placeholder: '请打分',
        defaultValue: 100,
        max: 5,
        required: true,
        showScoreText: true,
        rateLevels: [
          { score: 100, star: 5, grade: '一等', label: '一等(特优)', color: 'emerald', desc: '100分 · 响应极速处置严密，示范特优' },
          { score: 90, star: 4, grade: '二等', label: '二等(优秀)', color: 'blue', desc: '90分 · 措施有力协同顺畅，办案优秀' },
          { score: 80, star: 3, grade: '三等', label: '三等(良好)', color: 'cyan', desc: '80分 · 基本指标达标，处置时效良好' },
          { score: 70, star: 2, grade: '四等', label: '四等(合格)', color: 'amber', desc: '70分 · 达到底线要求，考核评定合格' },
          { score: 60, star: 1, grade: '五等', label: '五等(基本)', color: 'slate', desc: '60分 · 基本履职，存在瑕疵待提升' }
        ],
        helpText: '打分组件分级得分标准：一等(特优) 100分、二等(优秀) 90分、三等(良好) 80分、四等(合格) 70分、五等(基本) 60分'
      }
    }
  ],
  SYS_ZLWP: [
    {
      id: 'zlwp_org_group_dispatch',
      type: 'org_group_dispatch',
      label: '下发组织节点/群组',
      system: 'SYS_ZLWP',
      systemName: '知了网评',
      iconName: 'FolderKanban',
      description: '知了网评专用的下发组织节点/群组组件，支持选择队伍成员、组织节点与用户群组',
      defaultSpan: 24,
      defaultProps: {
        label: '下发组织节点/群组',
        placeholder: '请选择需下发任务的组织节点或专业网评群组...',
        required: true,
        defaultValue: [],
        helpText: '支持跨层级下派至区县网信办组织节点，或指派至专业网评应急群组'
      }
    }
  ],
  SYS_ZLL: []
};

// 生成新控件实例工厂函数
export function createWidgetInstance(type: FormWidgetType, region: 'issue' | 'feedback' = 'issue'): FormWidgetComponent {
  const meta = [...BASIC_WIDGET_LIST, ...ADVANCED_WIDGET_LIST, ...LAYOUT_WIDGET_LIST].find(w => w.type === type) || BASIC_WIDGET_LIST[0];
  const timestamp = Date.now().toString(36).slice(-4);
  const key = `${type}_${timestamp}`;

  return {
    id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    key,
    label: meta.label,
    type: meta.type,
    category: meta.category,
    span: meta.defaultSpan,
    region,
    ...meta.defaultProps
  };
}

// 根据自定义组件元数据生成控件实例
export function createCustomWidgetInstance(customWidget: CustomWidgetMetaItem, region: 'issue' | 'feedback' = 'issue'): FormWidgetComponent {
  const timestamp = Date.now().toString(36).slice(-4);
  const key = `${customWidget.id}_${timestamp}`;

  return {
    id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    key,
    label: customWidget.defaultProps.label || customWidget.label,
    type: customWidget.type,
    category: 'basic',
    span: customWidget.defaultSpan,
    region,
    ...customWidget.defaultProps
  };
}

// 默认内置的 4 个政务流转环节节点 (对标图片 2 & 3)
export function createDefaultFlowNodes() {
  return [
    {
      id: 'fn_1',
      nodeCode: 'node_draft',
      name: '创建人发起与处置要求',
      nodeType: 'draft' as const,
      categoryLabel: '发起填报',
      description: '由创建人登记业务基本信息，并明确具体处置要求、核查重点与办理时限',
      receiverLabel: '指令发起人',
      receiverType: 'initiator' as const,
      actionButtons: [
        { id: 'btn_1_1', label: '下发指令/提交', actionType: 'submit' as const, color: 'blue' as const, enabled: true },
        { id: 'btn_1_2', label: '保存草稿', actionType: 'save_draft' as const, color: 'slate' as const, enabled: true },
        { id: 'btn_1_3', label: '撤销下发', actionType: 'terminate' as const, color: 'red' as const, enabled: true }
      ]
    },
    {
      id: 'fn_2',
      nodeCode: 'node_handle',
      name: '处理人核查处置',
      nodeType: 'handle' as const,
      categoryLabel: '处理节点',
      description: '落地核查整改并填报反馈；支持跨部门申请转办',
      receiverLabel: '对口责任科室/承办人员',
      receiverType: 'dept' as const,
      approveMode: 'or_sign' as const,
      approveModeLabel: '或签(一名通过即生效)',
      timeLimitHours: 4,
      timeLimitLabel: '限时 4h',
      allowTransfer: true,
      actionButtons: [
        { id: 'btn_2_1', label: '提交处置回执', actionType: 'submit' as const, color: 'blue' as const, enabled: true },
        { id: 'btn_2_2', label: '申请转办', actionType: 'transfer' as const, color: 'amber' as const, enabled: true },
        { id: 'btn_2_3', label: '退回重办', actionType: 'reject' as const, color: 'red' as const, enabled: true },
        { id: 'btn_2_4', label: '暂存反馈', actionType: 'save_draft' as const, color: 'slate' as const, enabled: true },
        { id: 'btn_2_5', label: '申请延期', actionType: 'transfer' as const, color: 'emerald' as const, enabled: true }
      ]
    },
    {
      id: 'fn_3',
      nodeCode: 'node_approve',
      name: '复核审批',
      nodeType: 'approval' as const,
      categoryLabel: '审批节点',
      description: '验收处置整改实效：审核通过归档，驳回退回重办',
      receiverLabel: '创建人本人',
      receiverType: 'initiator' as const,
      approveMode: 'or_sign' as const,
      approveModeLabel: '或签(一名通过即生效)',
      timeLimitHours: 2,
      timeLimitLabel: '限时 2h',
      rejectPolicyLabel: '驳回退回处理人',
      passPolicyLabel: '通过即归档',
      actionButtons: [
        { id: 'btn_3_1', label: '审核通过', actionType: 'pass' as const, color: 'emerald' as const, enabled: true },
        { id: 'btn_3_2', label: '驳回整改', actionType: 'reject' as const, color: 'red' as const, enabled: true }
      ]
    },
    {
      id: 'fn_4',
      nodeCode: 'node_end',
      name: '办结归档',
      nodeType: 'end' as const,
      categoryLabel: '流程办结',
      description: '对回执结果进行验收结案归档，生成电子工单闭环台账',
      archiveActions: [
        '自动生成标准电子处置工单与闭环台账文件',
        '自动向发起人、承办人推送《工单办结通报》',
        '将处置时效及满意度沉淀至案例智库',
        '计入属地网格与业务科室当月效能考核评分'
      ],
      actionButtons: [
        { id: 'btn_4_1', label: '导出工单台账', actionType: 'save_draft' as const, color: 'blue' as const, enabled: true },
        { id: 'btn_4_2', label: '查看全生命周期轨迹', actionType: 'submit' as const, color: 'slate' as const, enabled: true }
      ]
    }
  ];
}
