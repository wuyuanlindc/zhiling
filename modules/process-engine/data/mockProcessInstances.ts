/**
 * 流程与模板引擎 - 流程实例运行数据模型与 Mock 数据
 * 支持以「流程表单为维度」的台账纳管、流程ID下钻详情、关联流程与关联表单实例多维联动
 */

export interface ProcessInstanceRecord {
  id: string;                         // 实例流水号 (如 INS_20260924_0891)
  title: string;                      // 实例/工单主题
  systemId: string;                   // 所属系统 (SYS_ZLL | SYS_DDSB | SYS_ZLWP)
  systemName: string;
  templateId: string;                 // 关联模板/流程 ID (如 1008291001)
  templateName: string;               // 模板名称
  category: string;                   // 业务分类
  urgency: 'normal' | 'urgent' | 'extreme'; // 紧急度
  status: 'running' | 'completed' | 'rejected' | 'terminated' | 'suspended'; // 实例状态
  statusLabel: string;
  currentNodeName: string;            // 当前所处节点环节
  currentNodeType: 'draft' | 'handle' | 'approval' | 'condition' | 'cc' | 'end';
  currentAssignees: string[];         // 当前责任承办人/审批人
  currentAssigneeDepts: string[];     // 当前承办部门
  initiator: string;                  // 发起人
  initiatorDept: string;              // 发起部门
  orgName: string;                    // 归属机构 (济南市公安局、历下分局等)
  startTime: string;                  // 启动时间
  endTime?: string;                   // 办结时间
  durationHours: number;              // 已运行耗时 (小时)
  timeLimitHours: number;             // 时限要求 (小时)
  isOverdue: boolean;                 // 是否已超时
  overdueHours?: number;              // 超时时长
  urgeCount: number;                  // 催办次数
  formDataSnapshot?: Record<string, any>; // 业务表单数据快照
  stepHistory: ProcessInstanceStepLog[];  // 流转历史链

  // 关联流程与表单拓展字段
  relatedTemplateIds?: string[];      // 关联的流程/表单模板ID清单
  associationInfo?: {
    relationType: 'upstream' | 'downstream' | 'countersign' | 'subflow' | 'form_link';
    relationTypeLabel: string;
    sourceInstanceId: string;
    sourceTemplateName: string;
    relationDescription: string;
    linkedFormName?: string;
  };
}

export interface ProcessInstanceStepLog {
  id: string;
  stepIndex: number;
  nodeName: string;
  nodeType: string;
  operator: string;
  operatorDept: string;
  action: string;                    // 'submit' | 'pass' | 'reject' | 'transfer' | 'urge' | 'archive'
  actionLabel: string;
  opinion: string;                   // 审批/办理意见
  timestamp: string;
  durationMins: number;
  status: 'completed' | 'current' | 'pending' | 'rejected';
}

export const MOCK_PROCESS_INSTANCES: ProcessInstanceRecord[] = [
  // ================= 1. 模板 1008291001 (通用工作任务派发模板) =================
  {
    id: 'INS_20260924_0891',
    title: '【专项研判】关于泉城路商圈重点网络舆情及治安要素核查指令',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291001',
    templateName: '通用工作任务派发模板',
    category: '任务派发',
    urgency: 'urgent',
    status: 'running',
    statusLabel: '流转办理中',
    currentNodeName: '涉案科室核查办理',
    currentNodeType: 'handle',
    currentAssignees: ['王五', '张明'],
    currentAssigneeDepts: ['历下分局 / 治安大队', '网安支队'],
    initiator: '张三',
    initiatorDept: '市局指挥中心',
    orgName: '历下分局',
    startTime: '2026-09-24 08:30',
    durationHours: 2.5,
    timeLimitHours: 4,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291005', '1008291008', '1008291003', '1008291006'],
    formDataSnapshot: {
      taskTitle: '关于泉城路商圈重点网络舆情及治安要素核查指令',
      urgency: '紧急',
      taskContent: '互联网论坛发现涉及人员聚集相关讨论，需属地网格核查现场真实态势。',
      deadline: '2026-09-24 18:00',
      requireAttachment: true,
      targetLocation: '泉城路恒隆广场周边',
      riskLevel: '三级黄色预警'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '指令下达与起草',
        nodeType: 'draft',
        operator: '张三',
        operatorDept: '市局指挥中心',
        action: 'submit',
        actionLabel: '下达指令',
        opinion: '请历下分局及网安支队按一级勤务标准立即核查落地反馈。',
        timestamp: '2026-09-24 08:30:12',
        durationMins: 5,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '涉案科室核查办理',
        nodeType: 'handle',
        operator: '王五',
        operatorDept: '历下分局 / 治安大队',
        action: 'transfer',
        actionLabel: '现场核实中',
        opinion: '已调派 2 组巡防队员前往商圈巡查，暂无异常聚集迹象。',
        timestamp: '2026-09-24 09:15:00',
        durationMins: 85,
        status: 'current'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '业务科长审核',
        nodeType: 'approval',
        operator: '李四',
        operatorDept: '网安支队',
        action: 'pending',
        actionLabel: '待审核',
        opinion: '待办结材料提交后审核',
        timestamp: '-',
        durationMins: 0,
        status: 'pending'
      },
      {
        id: 'step_4',
        stepIndex: 4,
        nodeName: '指令办结归档',
        nodeType: 'end',
        operator: '系统自动',
        operatorDept: '系统',
        action: 'pending',
        actionLabel: '待归档',
        opinion: '-',
        timestamp: '-',
        durationMins: 0,
        status: 'pending'
      }
    ]
  },
  {
    id: 'INS_20260924_0892',
    title: '【日常督导】关于主城区各派出所夜巡力量在岗履职核查通报',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291001',
    templateName: '通用工作任务派发模板',
    category: '任务派发',
    urgency: 'normal',
    status: 'completed',
    statusLabel: '已办结归档',
    currentNodeName: '指令办结归档',
    currentNodeType: 'end',
    currentAssignees: ['系统自动'],
    currentAssigneeDepts: ['归档库'],
    initiator: '赵六',
    initiatorDept: '督察支队',
    orgName: '济南市公安局',
    startTime: '2026-09-23 20:00',
    endTime: '2026-09-24 06:30',
    durationHours: 10.5,
    timeLimitHours: 12,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291003', '1008291006'],
    formDataSnapshot: {
      taskTitle: '关于主城区各派出所夜巡力量在岗履职核查通报',
      urgency: '普通',
      taskContent: '抽查历下、市中、天桥共28个重点巡段，全部实名签到。',
      deadline: '2026-09-24 07:00',
      requireAttachment: false
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '任务起草',
        nodeType: 'draft',
        operator: '赵六',
        operatorDept: '督察支队',
        action: 'submit',
        actionLabel: '发起核查',
        opinion: '开展全辖视频远程点名与车载GPS巡检。',
        timestamp: '2026-09-23 20:00:00',
        durationMins: 10,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '各分局自查核录',
        nodeType: 'handle',
        operator: '王五',
        operatorDept: '历下分局指挥调度室',
        action: 'submit',
        actionLabel: '提报台账',
        opinion: '历下分局在岗民辅警 142 人，巡逻车组 36 组全员在岗。',
        timestamp: '2026-09-24 05:40:00',
        durationMins: 580,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '督察审核归档',
        nodeType: 'end',
        operator: '赵六',
        operatorDept: '督察支队',
        action: 'archive',
        actionLabel: '归档完成',
        opinion: '台账核查无误，通报予以闭环。',
        timestamp: '2026-09-24 06:30:00',
        durationMins: 50,
        status: 'completed'
      }
    ]
  },
  {
    id: 'INS_20260924_0893',
    title: '【紧急排查】关于辖区重点涉外旅馆业实名登记专项抽查',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291001',
    templateName: '通用工作任务派发模板',
    category: '任务派发',
    urgency: 'urgent',
    status: 'running',
    statusLabel: '流转办理中 (超时预警)',
    currentNodeName: '涉案科室核查办理',
    currentNodeType: 'handle',
    currentAssignees: ['钱七'],
    currentAssigneeDepts: ['治安支队 / 出入境大队'],
    initiator: '张三',
    initiatorDept: '市局指挥中心',
    orgName: '历下分局',
    startTime: '2026-09-23 14:00',
    durationHours: 21.0,
    timeLimitHours: 12,
    isOverdue: true,
    overdueHours: 9.0,
    urgeCount: 2,
    relatedTemplateIds: ['1008291005'],
    formDataSnapshot: {
      taskTitle: '关于辖区重点涉外旅馆业实名登记专项抽查',
      urgency: '紧急',
      taskContent: '对涉外酒店前台登记核验终端运行日志进行抓取比对。',
      deadline: '2026-09-24 02:00',
      requireAttachment: true
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '任务派发',
        nodeType: 'draft',
        operator: '张三',
        operatorDept: '市局指挥中心',
        action: 'submit',
        actionLabel: '派发指令',
        opinion: '要求 12 小时内提报抽检日志。',
        timestamp: '2026-09-23 14:00:00',
        durationMins: 5,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '涉案科室核查办理',
        nodeType: 'handle',
        operator: '钱七',
        operatorDept: '治安支队',
        action: 'urge',
        actionLabel: '超时催办',
        opinion: '已向分管大队长发送催办警示，正加急调取后台接口。',
        timestamp: '2026-09-24 08:00:00',
        durationMins: 1255,
        status: 'current'
      }
    ]
  },

  // ================= 2. 模板 1008291002 (网络指令流转与闭环处置模板) =================
  {
    id: 'INS_20260924_0865',
    title: '【行政执法】关于某违规网络自媒体虚假广告查处流转单',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291002',
    templateName: '网络指令流转与闭环处置模板',
    category: '网络巡查',
    urgency: 'urgent',
    status: 'rejected',
    statusLabel: '审核已驳回',
    currentNodeName: '法制科合规复核',
    currentNodeType: 'approval',
    currentAssignees: ['张三'],
    currentAssigneeDepts: ['法制支队'],
    initiator: '王五',
    initiatorDept: '历下分局 / 治安大队',
    orgName: '历下分局',
    startTime: '2026-09-21 09:00',
    endTime: '2026-09-21 16:20',
    durationHours: 7.3,
    timeLimitHours: 8,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291009'],
    formDataSnapshot: {
      platform: '抖音',
      postUrl: 'https://v.douyin.com/abc8921/',
      targetHeat: 3500,
      guideDirection: '严厉驳斥虚假警情，发布权威通告澄清事实真相。'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '立案提请',
        nodeType: 'draft',
        operator: '王五',
        operatorDept: '历下分局',
        action: 'submit',
        actionLabel: '提请立案',
        opinion: '提请市局法制支队与网安支队联合审查。',
        timestamp: '2026-09-21 09:00:00',
        durationMins: 15,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '法制科合规复核',
        nodeType: 'approval',
        operator: '张三',
        operatorDept: '法制支队',
        action: 'reject',
        actionLabel: '驳回重办',
        opinion: '取证材料缺少电子证据时间戳固定公证，请补充公证书后重新提报。',
        timestamp: '2026-09-21 16:20:00',
        durationMins: 425,
        status: 'rejected'
      }
    ]
  },
  {
    id: 'INS_20260924_0866',
    title: '【网络巡查】关于某短视频平台涉考涉招虚假信息联合引导流转',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291002',
    templateName: '网络指令流转与闭环处置模板',
    category: '网络巡查',
    urgency: 'normal',
    status: 'completed',
    statusLabel: '已办结归档',
    currentNodeName: '指令办结归档',
    currentNodeType: 'end',
    currentAssignees: ['系统自动'],
    currentAssigneeDepts: ['归档库'],
    initiator: '周正明',
    initiatorDept: '网安支队',
    orgName: '济南市公安局',
    startTime: '2026-09-20 14:00',
    endTime: '2026-09-21 11:30',
    durationHours: 21.5,
    timeLimitHours: 24,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291008', '1008291009'],
    formDataSnapshot: {
      platform: '微博',
      postUrl: 'https://weibo.com/detail/991203',
      targetHeat: 12000,
      guideDirection: '教育行政部门已辟谣，指导属地网评员跟帖引导。'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '线索研判',
        nodeType: 'draft',
        operator: '周正明',
        operatorDept: '网安支队',
        action: 'submit',
        actionLabel: '发起指令',
        opinion: '启动三级联动辟谣响应。',
        timestamp: '2026-09-20 14:00:00',
        durationMins: 8,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '网评引导处置',
        nodeType: 'handle',
        operator: '孙八',
        operatorDept: '宣传处 / 网评组',
        action: 'submit',
        actionLabel: '发布引导评论',
        opinion: '已累计分发 45 条权威辟谣跟评，舆情热度下降 85%。',
        timestamp: '2026-09-21 10:00:00',
        durationMins: 1200,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '归档结项',
        nodeType: 'end',
        operator: '系统自动',
        operatorDept: '归档库',
        action: 'archive',
        actionLabel: '办结归档',
        opinion: '处置闭环，形成台账。',
        timestamp: '2026-09-21 11:30:00',
        durationMins: 90,
        status: 'completed'
      }
    ]
  },

  // ================= 3. 模板 1008291003 (全辖基层派出所接处警联动处置模板) =================
  {
    id: 'INS_20260924_0855',
    title: '【基层处警】历下分局泉城路派出所重点商圈夜市噪音扰民联调处置',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291003',
    templateName: '全辖基层派出所接处警联动处置模板',
    category: '基层联动',
    urgency: 'normal',
    status: 'running',
    statusLabel: '流转办理中',
    currentNodeName: '值班所领导复核',
    currentNodeType: 'approval',
    currentAssignees: ['王所长'],
    currentAssigneeDepts: ['历下分局 / 泉城路派出所'],
    initiator: '李值班员',
    initiatorDept: '泉城路派出所接警台',
    orgName: '历下分局',
    startTime: '2026-09-24 07:10',
    durationHours: 1.8,
    timeLimitHours: 4,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291004'],
    formDataSnapshot: {
      gridCode: 'PCS-LX-01-WG03',
      hotSpot: '核心商圈商业街',
      fieldPhoto: '现场调解记录单.jpg',
      liaisonOfficer: '王建国 (副所长)'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '派警登记',
        nodeType: 'draft',
        operator: '李值班员',
        operatorDept: '泉城路派出所',
        action: 'submit',
        actionLabel: '登记派发',
        opinion: '指派 2 号巡逻车组现场调处。',
        timestamp: '2026-09-24 07:10:00',
        durationMins: 5,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '现场联合调处',
        nodeType: 'handle',
        operator: '张警官',
        operatorDept: '泉城路派出所巡逻二组',
        action: 'submit',
        actionLabel: '提交调解结果',
        opinion: '商户已将户外音响音量调低，并签署文明经营承诺书。',
        timestamp: '2026-09-24 08:30:00',
        durationMins: 75,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '值班所领导复核',
        nodeType: 'approval',
        operator: '王所长',
        operatorDept: '泉城路派出所',
        action: 'pending',
        actionLabel: '待复核',
        opinion: '等待所领导审核结案',
        timestamp: '-',
        durationMins: 0,
        status: 'current'
      }
    ]
  },

  // ================= 4. 模板 1008291004 (历下分局全域网格生态治理专属模板) =================
  {
    id: 'INS_20260924_0872',
    title: '【属地巡查】市中分局高校周边网络生态巡查研判报告',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateId: '1008291004',
    templateName: '历下分局全域网格生态治理专属模板',
    category: '属地专项',
    urgency: 'normal',
    status: 'completed',
    statusLabel: '已办结归档',
    currentNodeName: '指令办结归档',
    currentNodeType: 'end',
    currentAssignees: ['系统自动'],
    currentAssigneeDepts: ['归档库'],
    initiator: '刘东海',
    initiatorDept: '历下分局 / 治安大队',
    orgName: '历下分局',
    startTime: '2026-09-22 10:00',
    endTime: '2026-09-22 15:40',
    durationHours: 5.6,
    timeLimitHours: 24,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291003', '1008291008'],
    formDataSnapshot: {
      campusName: '山东师范大学千佛山校区周边',
      riskGrade: '低风险',
      rectificationMeasure: '联合高校保卫处开展常态化网络法治宣教，未见不良谣言传播。'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '巡查任务发起',
        nodeType: 'draft',
        operator: '刘东海',
        operatorDept: '历下分局',
        action: 'submit',
        actionLabel: '发起巡查',
        opinion: '按网评周报计划开展属地高校网络巡查。',
        timestamp: '2026-09-22 10:00:00',
        durationMins: 10,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '网评专员实地踏勘',
        nodeType: 'handle',
        operator: '孙八',
        operatorDept: '宣传处 / 网评组',
        action: 'submit',
        actionLabel: '提交核查报告',
        opinion: '排查 12 个重点校友论坛与短视频平台，整体态势平稳。',
        timestamp: '2026-09-22 14:20:00',
        durationMins: 250,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '分局分管领导审批',
        nodeType: 'approval',
        operator: '钱七',
        operatorDept: '分局领导班子',
        action: 'pass',
        actionLabel: '审批通过',
        opinion: '同意结项并通报全区宣传阵地。',
        timestamp: '2026-09-22 15:35:00',
        durationMins: 75,
        status: 'completed'
      },
      {
        id: 'step_4',
        stepIndex: 4,
        nodeName: '指令办结归档',
        nodeType: 'end',
        operator: '系统自动',
        operatorDept: '市局归档中心',
        action: 'archive',
        actionLabel: '闭环归档',
        opinion: '已自动生成电子闭环档案 (编号: ARC20260922008)',
        timestamp: '2026-09-22 15:40:00',
        durationMins: 5,
        status: 'completed'
      }
    ]
  },

  // ================= 5. 模板 1008291005 (应急督办与突击抢单指令模板) =================
  {
    id: 'INS_20260924_0888',
    title: '【特急督办】关于重点科创园区网络安全漏洞整改抢单任务',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateId: '1008291005',
    templateName: '应急督办与突击抢单指令模板',
    category: '指令督办',
    urgency: 'extreme',
    status: 'running',
    statusLabel: '流转办理中 (超时预警)',
    currentNodeName: '多方协同突击抢办',
    currentNodeType: 'handle',
    currentAssignees: ['赵六', '孙八'],
    currentAssigneeDepts: ['高新园区派出所', '网安支队'],
    initiator: '李四',
    initiatorDept: '市局网安支队',
    orgName: '济南市公安局',
    startTime: '2026-09-23 16:00',
    durationHours: 18.5,
    timeLimitHours: 12,
    isOverdue: true,
    overdueHours: 6.5,
    urgeCount: 2,
    relatedTemplateIds: ['1008291001', '1008291006', '1008291008'],
    formDataSnapshot: {
      actionName: '齐鲁软件园网安防线修补',
      taskGoal: '完成园区 3 家核心涉密企业外部接口加固与溯源日志审计',
      isEmergency: true,
      targetDepartment: '高新园区及网安专班'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '督办指令下达',
        nodeType: 'draft',
        operator: '李四',
        operatorDept: '网安支队',
        action: 'submit',
        actionLabel: '下发督办',
        opinion: '要求 12 小时内全部完成漏洞打补丁与基线复测。',
        timestamp: '2026-09-23 16:00:00',
        durationMins: 3,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '多方协同突击抢办',
        nodeType: 'handle',
        operator: '赵六',
        operatorDept: '高新园区派出所',
        action: 'urge',
        actionLabel: '催办提醒',
        opinion: '已于 2026-09-24 07:00 收到系统自动催办提醒，企业端正在重启防火墙。',
        timestamp: '2026-09-24 07:00:20',
        durationMins: 1100,
        status: 'current'
      }
    ]
  },
  {
    id: 'INS_20260924_0850',
    title: '【督查督办】天桥分局重点场所安防联网设备在线率督办',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateId: '1008291005',
    templateName: '应急督办与突击抢单指令模板',
    category: '指令督办',
    urgency: 'normal',
    status: 'running',
    statusLabel: '流转办理中',
    currentNodeName: '天桥分局整改回复',
    currentNodeType: 'handle',
    currentAssignees: ['天桥分局值班员'],
    currentAssigneeDepts: ['天桥分局 / 指挥中心'],
    initiator: '市局督察支队',
    initiatorDept: '市局督察支队',
    orgName: '天桥分局',
    startTime: '2026-09-24 07:45',
    durationHours: 3.2,
    timeLimitHours: 8,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291006'],
    formDataSnapshot: {
      actionName: '天桥辖区视频前端在线率提升攻坚',
      taskGoal: '将重点商圈探头在线率由 91.2% 恢复至 98% 以上',
      isEmergency: false,
      targetDepartment: '天桥分局各基层派出所'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '下发通报督办',
        nodeType: 'draft',
        operator: '督察支队',
        operatorDept: '市局督察支队',
        action: 'submit',
        actionLabel: '督办下发',
        opinion: '限 8 小时内核实离线探头原因并复通。',
        timestamp: '2026-09-24 07:45:00',
        durationMins: 5,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '天桥分局整改回复',
        nodeType: 'handle',
        operator: '天桥分局值班员',
        operatorDept: '天桥分局',
        action: 'pending',
        actionLabel: '排查中',
        opinion: '通信运营商已到达现场检查光缆供电。',
        timestamp: '2026-09-24 08:30:00',
        durationMins: 147,
        status: 'current'
      }
    ]
  },

  // ================= 6. 模板 1008291006 (跨部门多方联合会签公文模板) =================
  {
    id: 'INS_20260924_0841',
    title: '【联合会签】关于《全市大型群众性活动网络安保协同工作规范》多方会签',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateId: '1008291006',
    templateName: '跨部门多方联合会签公文模板',
    category: '联合会签',
    urgency: 'urgent',
    status: 'running',
    statusLabel: '流转办理中',
    currentNodeName: '治安支队与网安支队会签',
    currentNodeType: 'approval',
    currentAssignees: ['钱七', '李四'],
    currentAssigneeDepts: ['治安支队', '网安支队'],
    initiator: '陈思源',
    initiatorDept: '办公室 / 法规处',
    orgName: '济南市公安局',
    startTime: '2026-09-23 09:30',
    durationHours: 24.5,
    timeLimitHours: 48,
    isOverdue: false,
    urgeCount: 1,
    relatedTemplateIds: ['1008291001', '1008291005'],
    formDataSnapshot: {
      documentTitle: '全市大型群众性活动网络安保协同工作规范(试行)',
      participatingDepts: '网安、治安、特警、交警、办公室',
      effectiveDate: '2026-10-01',
      securityLevel: '内部工作秘密'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '会签公文起草',
        nodeType: 'draft',
        operator: '陈思源',
        operatorDept: '办公室',
        action: 'submit',
        actionLabel: '发起联合会签',
        opinion: '请各支队于 48 小时内核定意见。',
        timestamp: '2026-09-23 09:30:00',
        durationMins: 15,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '各支队并联会签',
        nodeType: 'approval',
        operator: '李四',
        operatorDept: '网安支队',
        action: 'pass',
        actionLabel: '会签同意',
        opinion: '网安支队无修改意见，同意施行。',
        timestamp: '2026-09-23 15:20:00',
        durationMins: 350,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '治安支队并联会签',
        nodeType: 'approval',
        operator: '钱七',
        operatorDept: '治安支队',
        action: 'pending',
        actionLabel: '核决中',
        opinion: '正在逐条审核勤务等级标准',
        timestamp: '-',
        durationMins: 0,
        status: 'current'
      }
    ]
  },

  // ================= 7. 模板 1008291008 (全网态势感知与网评专报模板) =================
  {
    id: 'INS_20260924_0879',
    title: '【网评专报】关于近期高校网络热点舆情态势日情分析专报 (第42期)',
    systemId: 'SYS_ZLWP',
    systemName: '知了网评',
    templateId: '1008291008',
    templateName: '全网态势感知与网评专报模板',
    category: '信息报送',
    urgency: 'urgent',
    status: 'completed',
    statusLabel: '已办结归档',
    currentNodeName: '指令办结归档',
    currentNodeType: 'end',
    currentAssignees: ['系统自动'],
    currentAssigneeDepts: ['知了网评研判库'],
    initiator: '林海峰',
    initiatorDept: '宣传处 / 网评研判中心',
    orgName: '济南市公安局',
    startTime: '2026-09-24 06:00',
    endTime: '2026-09-24 08:15',
    durationHours: 2.25,
    timeLimitHours: 3,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291002', '1008291009'],
    formDataSnapshot: {
      reportTitle: '关于近期高校网络热点舆情态势日情分析专报 (第42期)',
      reportType: '专报特刊',
      riskLevel: '较大',
      reportContent: '汇总微博、抖音 12 条高热评论，形成倾向性态势图谱，建议启动二级关注。'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '专报编写',
        nodeType: 'draft',
        operator: '林海峰',
        operatorDept: '宣传处',
        action: 'submit',
        actionLabel: '报送专报',
        opinion: '提报市局分管领导审阅。',
        timestamp: '2026-09-24 06:00:00',
        durationMins: 20,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '宣传处处长核批',
        nodeType: 'approval',
        operator: '孙处长',
        operatorDept: '宣传处',
        action: 'pass',
        actionLabel: '核批通过',
        opinion: '研判准确，同意下发指令流转中心开展属地核查。',
        timestamp: '2026-09-24 07:45:00',
        durationMins: 105,
        status: 'completed'
      },
      {
        id: 'step_3',
        stepIndex: 3,
        nodeName: '归档分发',
        nodeType: 'end',
        operator: '系统自动',
        operatorDept: '归档库',
        action: 'archive',
        actionLabel: '已归档分发',
        opinion: '已联动下发指令流转通用派发模板 (关联流水号 INS_20260924_0891)',
        timestamp: '2026-09-24 08:15:00',
        durationMins: 30,
        status: 'completed'
      }
    ]
  },

  // ================= 8. 模板 1008291009 (涉网评论引导与线索核查模板) =================
  {
    id: 'INS_20260924_0833',
    title: '【线索核查】关于某涉及城市交通管理不实言论核实与评论引导审批',
    systemId: 'SYS_ZLWP',
    systemName: '知了网评',
    templateId: '1008291009',
    templateName: '涉网评论引导与线索核查模板',
    category: '网评引导',
    urgency: 'normal',
    status: 'running',
    statusLabel: '流转办理中',
    currentNodeName: '交警支队核实反馈',
    currentNodeType: 'handle',
    currentAssignees: ['交警支队宣传科'],
    currentAssigneeDepts: ['交警支队'],
    initiator: '孙雪峰',
    initiatorDept: '宣传处 / 网评组',
    orgName: '济南市公安局',
    startTime: '2026-09-24 08:00',
    durationHours: 1.5,
    timeLimitHours: 4,
    isOverdue: false,
    urgeCount: 0,
    relatedTemplateIds: ['1008291001', '1008291008'],
    formDataSnapshot: {
      verifyTarget: '经十路拥堵谣言视频',
      amount: 680,
      verifyResult: '待持续侦办'
    },
    stepHistory: [
      {
        id: 'step_1',
        stepIndex: 1,
        nodeName: '线索提报',
        nodeType: 'draft',
        operator: '孙雪峰',
        operatorDept: '宣传处',
        action: 'submit',
        actionLabel: '提报核查',
        opinion: '交警支队核实实况后由网评员跟帖引导。',
        timestamp: '2026-09-24 08:00:00',
        durationMins: 10,
        status: 'completed'
      },
      {
        id: 'step_2',
        stepIndex: 2,
        nodeName: '交警支队核实反馈',
        nodeType: 'handle',
        operator: '交警值班员',
        operatorDept: '交警支队',
        action: 'pending',
        actionLabel: '调取监控比对中',
        opinion: '已调取经十舜华路路口 07:30-08:00 监控比对',
        timestamp: '-',
        durationMins: 0,
        status: 'current'
      }
    ]
  }
];

/**
 * 关联流程与表单实例数据计算函数
 * 用于根据当前选中的流程/表单模板 ID，查找所有关联/上下游的实例数据
 */
export interface AssociatedInstanceItem {
  id: string;
  title: string;
  systemId: string;
  systemName: string;
  templateId: string;
  templateName: string;
  relationType: 'upstream' | 'downstream' | 'countersign' | 'subflow' | 'form_link';
  relationTypeLabel: string;
  relationDescription: string;
  initiator: string;
  initiatorDept: string;
  orgName: string;
  currentNodeName: string;
  currentAssignees: string[];
  status: 'running' | 'completed' | 'rejected' | 'terminated' | 'suspended';
  statusLabel: string;
  isOverdue: boolean;
  startTime: string;
  durationHours: number;
  timeLimitHours: number;
  urgeCount: number;
  rawRecord: ProcessInstanceRecord;
}

export const getAssociatedInstancesForTemplate = (
  templateId: string,
  allInstances: ProcessInstanceRecord[]
): AssociatedInstanceItem[] => {
  const associatedList: AssociatedInstanceItem[] = [];

  allInstances.forEach(ins => {
    // 排除当前流程自身的直接实例
    if (ins.templateId === templateId) return;

    // 检查是否有双向关联引用
    const isExplicitlyLinked = ins.relatedTemplateIds?.includes(templateId);

    // 预设典型的业务上下游关联合并规则
    if (isExplicitlyLinked) {
      let relType: 'upstream' | 'downstream' | 'countersign' | 'subflow' | 'form_link' = 'form_link';
      let relLabel = '关联表单填报';
      let relDesc = '业务数据跨表单引用与共享';

      if (ins.templateId === '1008291008') {
        relType = 'upstream';
        relLabel = '上游预警触发源';
        relDesc = '态势感知与网评专报研判触发本流程指令';
      } else if (ins.templateId === '1008291005') {
        relType = 'downstream';
        relLabel = '下游应急督办';
        relDesc = '由本流程衍生派发的突击抢办攻坚工单';
      } else if (ins.templateId === '1008291006') {
        relType = 'countersign';
        relLabel = '跨部门联合会签';
        relDesc = '本流程关键审批依赖多方公文联署会签';
      } else if (ins.templateId === '1008291003' || ins.templateId === '1008291004') {
        relType = 'subflow';
        relLabel = '基层子流程派生';
        relDesc = '一线派出所网格落地核实与联动处置工单';
      } else if (ins.templateId === '1008291009') {
        relType = 'downstream';
        relLabel = '网络评论引导协同';
        relDesc = '指令核查落地后推进的评论引导与澄清工单';
      }

      associatedList.push({
        id: ins.id,
        title: ins.title,
        systemId: ins.systemId,
        systemName: ins.systemName,
        templateId: ins.templateId,
        templateName: ins.templateName,
        relationType: relType,
        relationTypeLabel: relLabel,
        relationDescription: relDesc,
        initiator: ins.initiator,
        initiatorDept: ins.initiatorDept,
        orgName: ins.orgName,
        currentNodeName: ins.currentNodeName,
        currentAssignees: ins.currentAssignees,
        status: ins.status,
        statusLabel: ins.statusLabel,
        isOverdue: ins.isOverdue,
        startTime: ins.startTime,
        durationHours: ins.durationHours,
        timeLimitHours: ins.timeLimitHours,
        urgeCount: ins.urgeCount,
        rawRecord: ins
      });
    }
  });

  // 如果某些模板没有显式关联数据，生成智能关联推荐记录保证完整可用性
  if (associatedList.length === 0) {
    const candidateInstances = allInstances.filter(ins => ins.templateId !== templateId).slice(0, 3);
    candidateInstances.forEach((cand, idx) => {
      associatedList.push({
        id: cand.id,
        title: cand.title,
        systemId: cand.systemId,
        systemName: cand.systemName,
        templateId: cand.templateId,
        templateName: cand.templateName,
        relationType: idx === 0 ? 'upstream' : idx === 1 ? 'downstream' : 'form_link',
        relationTypeLabel: idx === 0 ? '前置关联流程' : idx === 1 ? '后置协同工单' : '共享表单台账',
        relationDescription: idx === 0 ? '提供前置业务线索输入' : idx === 1 ? '承接本流程办结后业务推进' : '跨系统复用字段快照数据',
        initiator: cand.initiator,
        initiatorDept: cand.initiatorDept,
        orgName: cand.orgName,
        currentNodeName: cand.currentNodeName,
        currentAssignees: cand.currentAssignees,
        status: cand.status,
        statusLabel: cand.statusLabel,
        isOverdue: cand.isOverdue,
        startTime: cand.startTime,
        durationHours: cand.durationHours,
        timeLimitHours: cand.timeLimitHours,
        urgeCount: cand.urgeCount,
        rawRecord: cand
      });
    });
  }

  return associatedList;
};
