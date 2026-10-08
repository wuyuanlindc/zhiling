/**
 * 完整低代码模板设计器工作台 (LowCodeTemplateDesigner)
 * 
 * 核心模式支持：
 * 1. 普通模板 (templateType === 'normal')：
 *    - 仅有 2 个步骤：【表单设计】与【全局设置】
 *    - 纯表单模式，无审批流转节点，高效聚焦业务字段设计与全局提交配置
 * 2. 流程模板 (templateType === 'process')：
 *    - 包含 3 个步骤：【表单设计】、【流程设计】与【全局设置】
 *    - 支持多节点审批、分支条件、时限管控与办结归档
 */

import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ProcessTemplateItem, 
  TemplateType,
  BUSINESS_SYSTEMS, 
  FormWidgetComponent, 
  FormGlobalConfig,
  FlowStepNodeItem,
  AssociatedProcessTemplateLink
} from '../../types/processEngine';
import { FormDesignerCanvas } from './lowcode/FormDesignerCanvas';
import { FlowDesignerStep } from './lowcode/FlowDesignerStep';
import { TemplateFormPreviewModal } from './TemplateFormPreviewModal';
import { ProcessFlowSimulationModal } from './simulation/ProcessFlowSimulationModal';
import { 
  TemplateVersionManager, 
  ProcessTemplateVersionRecord, 
  getDefaultVersionList 
} from './TemplateVersionManager';
import { MOCK_ORGS, MOCK_TEMPLATES } from '../../data/mockProcessEngine';
import { OrgSearchSelect } from './OrgSearchSelect';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Save, 
  Send,
  Loader2,
  X, 
  Globe2, 
  Building2, 
  Sparkles, 
  FileText, 
  GitMerge, 
  Settings, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Layers, 
  HelpCircle, 
  AlertCircle,
  AlertTriangle,
  Plus,
  Info,
  Play,
  Share2,
  Link2,
  Trash2,
  Search,
  CheckSquare,
  Square,
  Tag,
  ExternalLink,
  Filter,
  ShieldCheck,
  RefreshCw,
  User,
  ArrowUpDown,
  Lock,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil
} from 'lucide-react';

interface LowCodeTemplateDesignerProps {
  template: ProcessTemplateItem;
  onSave: (savedTemplate: ProcessTemplateItem, closeDesigner?: boolean) => void;
  onClose: () => void;
}

type DesignerStepKey = 'form' | 'flow_design' | 'global';

interface DesignerStepDef {
  key: DesignerStepKey;
  label: string;
}

export const LowCodeTemplateDesigner: React.FC<LowCodeTemplateDesignerProps> = ({
  template,
  onSave,
  onClose
}) => {
  const isNormal = template.templateType === 'normal';

  // 动态步骤定义：
  // 普通模板包含：【表单设计】与【全局设置】
  // 流程模板包含：【表单设计】、【流程设计】与【全局设置】
  const steps: DesignerStepDef[] = useMemo(() => {
    if (isNormal) {
      return [
        { key: 'form', label: '表单设计' },
        { key: 'global', label: '全局设置' }
      ];
    }
    return [
      { key: 'form', label: '表单设计' },
      { key: 'flow_design', label: '流程设计' },
      { key: 'global', label: '全局设置' }
    ];
  }, [isNormal]);

  // 当前步骤索引 (默认第 0 步：表单设计)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStep = steps[currentStepIndex] || steps[0];

  // 基础信息状态
  // 判断是否为新建模板（新建模板进设计器时，为空设计器和空白流程，版本为 V1 设计中）
  const isNew = Boolean(
    template.isNewTemplate || 
    template.status === 'draft' || 
    (template.version && template.version.replace(/^V/i, '') === '1' && template.status !== 'active')
  );

  const [systemId, setSystemId] = useState<string>(template.systemId || 'SYS_ZLL');
  const [scope, setScope] = useState<'public' | 'org'>(template.scope || (isNew ? 'org' : 'public'));
  const initialOrgIds = isNew
    ? (template.orgIds || (template.orgId ? [template.orgId] : []))
    : (template.orgIds && template.orgIds.length > 0 
        ? template.orgIds 
        : (template.orgId ? [template.orgId] : (MOCK_ORGS[0] ? [MOCK_ORGS[0].id] : [])));
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(initialOrgIds);
  const [templateName, setTemplateName] = useState<string>(
    template.templateName || (isNormal ? '网络生态日常巡查登记表' : '网络舆情处置下发指令流程')
  );
  const [category, setCategory] = useState<string>(template.category || '舆情处置类');
  const [description, setDescription] = useState<string>(
    template.description || (isNormal ? '用于日常业务数据登记与信息填报，无需多节点审批流转' : '下发单位填写处置要求与指令内容，承办科室落地核实整改并上传闭环回执')
  );

  // 表单全局配置与 24 栅格控件列表
  const [formConfig, setFormConfig] = useState<FormGlobalConfig>(
    template.formConfig || {
      formTitle: template.templateName || (isNormal ? '业务数据填报登记表' : '网络舆情处置下发指令表单'),
      formSubTitle: isNormal ? '请如实填写各项业务指标与基本信息' : '下发单位填写处置要求与指令内容',
      labelPosition: 'top',
      labelWidth: 100,
      size: 'default',
      gutter: 16,
      columnsTotal: 24
    }
  );

  // 普通模板专属规则配置
  const [normalRules, setNormalRules] = useState({
    allowRepeatSubmit: true,
    autoSaveDraft: true,
    submitSuccessMessage: '业务数据已成功保存入库！',
    enableAuditLog: true
  });

  // 流程模板全局流转规则配置
  const [globalRules, setGlobalRules] = useState(
    template.globalRules || {
      allowCancel: true,
      cancelTimeLimitMinutes: 30,
      slaOverdueAlert: true,
      slaOverdueHours: 24,
      urgeMethod: 'in_app' as const
    }
  );

  // ====================== 基础设置独立编辑状态 (在全局设置中点击“编辑”开启，展示“保存”与“取消”) ======================
  const [isEditingBasicSettings, setIsEditingBasicSettings] = useState<boolean>(false);
  const basicSettingsBackupRef = useRef<{
    systemId: string;
    templateName: string;
    category: string;
    description: string;
    formConfig: FormGlobalConfig;
    normalRules: {
      allowRepeatSubmit: boolean;
      autoSaveDraft: boolean;
      submitSuccessMessage: string;
      enableAuditLog: boolean;
    };
    globalRules: {
      allowCancel: boolean;
      cancelTimeLimitMinutes: number;
      slaOverdueAlert: boolean;
      slaOverdueHours: number;
      urgeMethod: 'in_app';
    };
  }>({
    systemId,
    templateName,
    category,
    description,
    formConfig: JSON.parse(JSON.stringify(formConfig)),
    normalRules: JSON.parse(JSON.stringify(normalRules)),
    globalRules: JSON.parse(JSON.stringify(globalRules))
  });

  const handleStartEditBasicSettings = () => {
    basicSettingsBackupRef.current = {
      systemId,
      templateName,
      category,
      description,
      formConfig: JSON.parse(JSON.stringify(formConfig)),
      normalRules: JSON.parse(JSON.stringify(normalRules)),
      globalRules: JSON.parse(JSON.stringify(globalRules))
    };
    setIsEditingBasicSettings(true);
  };

  const handleCancelEditBasicSettings = () => {
    const backup = basicSettingsBackupRef.current;
    setSystemId(backup.systemId);
    setTemplateName(backup.templateName);
    setCategory(backup.category);
    setDescription(backup.description);
    setFormConfig(JSON.parse(JSON.stringify(backup.formConfig)));
    setNormalRules(JSON.parse(JSON.stringify(backup.normalRules)));
    setGlobalRules(JSON.parse(JSON.stringify(backup.globalRules)));
    setIsEditingBasicSettings(false);
    setDesignerToast({
      type: 'info',
      message: '已取消对基础设置的修改'
    });
    setTimeout(() => setDesignerToast(null), 2500);
  };

  const handleSaveBasicSettings = () => {
    if (!templateName.trim()) {
      alert('请填写模板名称！');
      return;
    }
    setIsEditingBasicSettings(false);
    const updatedTemplate: ProcessTemplateItem = {
      ...template,
      templateType: isNormal ? 'normal' : 'process',
      systemId,
      systemName: (BUSINESS_SYSTEMS.find(s => s.id === systemId) || BUSINESS_SYSTEMS[0]).name,
      scope,
      orgId: scope === 'org' ? selectedOrgIds[0] : undefined,
      orgIds: scope === 'org' ? selectedOrgIds : undefined,
      templateName,
      category,
      description,
      formConfig,
      formWidgets: widgets,
      flowNodes: isNormal ? undefined : flowNodes,
      globalRules: isNormal ? undefined : globalRules,
      associatedTemplates,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    onSave(updatedTemplate, false);
    setDesignerToast({
      type: 'success',
      message: '基础设置修改已成功保存！'
    });
    setTimeout(() => setDesignerToast(null), 2500);
  };

  // ====================== 全局设置左侧子菜单与状态 ======================
  const [globalNavMenu, setGlobalNavMenu] = useState<'basic_settings' | 'scope_settings' | 'associated_list'>('basic_settings');
  const [assocSearch, setAssocSearch] = useState<string>('');
  const [assocSystemFilter, setAssocSystemFilter] = useState<string>('ALL');

  // ====================== 模板归属客户/机构全景状态 ======================
  const [scopeUnitFilter, setScopeUnitFilter] = useState<string>('康奈总部 / 陕西区域√ / 陕西二区√ / 安康商洛区域 / 商洛市');
  const [scopeClientSearch, setScopeClientSearch] = useState<string>('');
  const [scopeManagerSearch, setScopeManagerSearch] = useState<string>('');
  const [scopeVersionFilter, setScopeVersionFilter] = useState<string>('ALL');
  const [scopeStatusFilter, setScopeStatusFilter] = useState<string>('ALL');
  const [scopeSortOrder, setScopeSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddOrgModal, setShowAddOrgModal] = useState<boolean>(false);
  const [selectedOrgsToAdd, setSelectedOrgsToAdd] = useState<string[]>([]);
  const [modalOrgSearch, setModalOrgSearch] = useState<string>('');
  const [modalOrgLevelFilter, setModalOrgLevelFilter] = useState<string>('ALL');
  const [newOrgSalesName, setNewOrgSalesName] = useState<string>('夏小花');
  const [newOrgUnitPath, setNewOrgUnitPath] = useState<string>('康奈总部');
  const [newOrgVersion, setNewOrgVersion] = useState<'正式版' | '专业版'>('正式版');

  // 机构列表分页状态
  const [scopeOrgPage, setScopeOrgPage] = useState<number>(1);
  const [scopeOrgPageSize, setScopeOrgPageSize] = useState<number>(10);
  const [scopeOrgJumpPage, setScopeOrgJumpPage] = useState<string>('1');

  // 当前已授权机构客户列表
  const [scopeOrgClients, setScopeOrgClients] = useState<Array<{
    id: string;
    name: string;
    fullName: string;
    creditCode: string;
    unitPath: string;
    salesName: string;
    salesPhone?: string;
    version: '正式版' | '专业版' | '旗舰版';
    status: 'active' | 'inactive';
    expireDate: string;
    daysRemaining: number;
    authDate: string;
    description: string;
  }>>(() => [
    {
      id: 'c_01',
      name: '西安高新数资',
      fullName: '西安高新数字资源管理运营有限公司',
      creditCode: '91610131MA6U98XX1A',
      unitPath: '康奈总部',
      salesName: '夏小花',
      salesPhone: '138****0192',
      version: '正式版',
      status: 'active',
      expireDate: '2027-12-31',
      daysRemaining: 459,
      authDate: '2025-01-10',
      description: '重点数字治理服务商，负责高新区全域政务数据流转与指令协同'
    },
    {
      id: 'c_02',
      name: '铜川数材',
      fullName: '铜川市数字材料产业技术研究院',
      creditCode: '91610200MA7T12YY3B',
      unitPath: '陕西区域',
      salesName: '周主管',
      salesPhone: '139****5821',
      version: '正式版',
      status: 'inactive',
      expireDate: '2025-08-01',
      daysRemaining: -423,
      authDate: '2024-06-15',
      description: '材料产业数字创新示范点，当前版本授权处于维护关停状态'
    },
    {
      id: 'c_03',
      name: '安康秦巴生态',
      fullName: '安康秦巴生态数字化运营科技有限公司',
      creditCode: '91610900MA6W56ZZ4C',
      unitPath: '陕西二区',
      salesName: '张伟',
      salesPhone: '137****3310',
      version: '正式版',
      status: 'active',
      expireDate: '2028-04-09',
      daysRemaining: 559,
      authDate: '2025-03-01',
      description: '秦巴生态治理重点监测单位，支持跨部门环境数据协同上报'
    },
    {
      id: 'c_04',
      name: '绵阳科城激光',
      fullName: '绵阳科技城激光智能感知技术有限责任公司',
      creditCode: '91510700MA6K78QQ5D',
      unitPath: '康奈总部',
      salesName: '陈敏',
      salesPhone: '136****9928',
      version: '正式版',
      status: 'active',
      expireDate: '2026-12-31',
      daysRemaining: 94,
      authDate: '2024-11-20',
      description: '光电智能感知系统应用节点，负责指令快速研判与协同'
    },
    {
      id: 'c_05',
      name: '眉山东坡智农',
      fullName: '眉山现代东坡智慧农业科技有限公司',
      creditCode: '91511400MA6H34PP6E',
      unitPath: '陕西区域',
      salesName: '李晓波',
      salesPhone: '135****4471',
      version: '正式版',
      status: 'active',
      expireDate: '2027-02-28',
      daysRemaining: 153,
      authDate: '2025-02-18',
      description: '农业农村大数据治理试点单位，支持日常巡查与台账上报'
    }
  ]);

  // 当前模板关联的流程列表
  const [associatedTemplates, setAssociatedTemplates] = useState<AssociatedProcessTemplateLink[]>(() => {
    if (template.associatedTemplates !== undefined) {
      return template.associatedTemplates;
    }
    if (isNew) {
      return [];
    }
    return [
      {
        id: 'link_01',
        templateId: '1008291002',
        templateName: '网络指令流转与闭环处置模板',
        templateType: 'process',
        systemId: 'SYS_ZLL',
        systemName: '指令流转',
        category: '网络巡查',
        relationType: 'downstream',
        relationLabel: '下游协同督办',
        description: '本工单发起并核准后，自动向下游处置网格下发闭环办理指令',
        linkedAt: '2026-09-20 10:30',
        status: 'active'
      },
      {
        id: 'link_02',
        templateId: '1008291006',
        templateName: '重大敏感舆情多部门联合会商研判流程',
        templateType: 'process',
        systemId: 'SYS_DDSB',
        systemName: '点点速豹',
        category: '涉稳处置',
        relationType: 'collaborative',
        relationLabel: '跨部门联合会商',
        description: '当舆情等级达到二级及以上时，联动启动点点速报跨部门联合会商审批',
        linkedAt: '2026-09-22 14:15',
        status: 'active'
      },
      {
        id: 'link_03',
        templateId: '1008291008',
        templateName: '知了网评生态巡查与评论引导工单',
        templateType: 'process',
        systemId: 'SYS_ZLWP',
        systemName: '知了网评',
        category: '网评引导',
        relationType: 'shared_form',
        relationLabel: '网评引导协同',
        description: '共享本表单原帖链接与舆情关键词，同步下发网评引导任务',
        linkedAt: '2026-09-25 09:00',
        status: 'active'
      }
    ];
  });

  // 新增关联流程弹窗状态
  const [showAddAssocModal, setShowAddAssocModal] = useState<boolean>(false);
  const [modalAssocSearch, setModalAssocSearch] = useState<string>('');
  const [modalAssocSys, setModalAssocSys] = useState<string>('ALL');
  const [selectedTplIdsToLink, setSelectedTplIdsToLink] = useState<string[]>([]);
  const [selectedRelationType, setSelectedRelationType] = useState<'upstream' | 'downstream' | 'collaborative' | 'sub_process' | 'shared_form'>('downstream');
  const [selectedRelationNote, setSelectedRelationNote] = useState<string>('');

  // 24 栅格组件列表：普通模板 vs 流程模板默认组件
  const [widgets, setWidgets] = useState<FormWidgetComponent[]>(() => {
    if (template.formWidgets !== undefined) {
      return template.formWidgets;
    }
    if (isNew) {
      return [];
    }
    // 普通模板：清爽标准表单控件
    if (isNormal) {
      return [
        { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true, placeholder: '请输入登记事项标题' },
        { id: 'w_n2', key: 'recordDate', label: '登记日期', type: 'date', category: 'basic', span: 12, required: true },
        { id: 'w_n3', key: 'categoryType', label: '业务分类', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '日常登记', value: 'daily' }, { label: '重点排查', value: 'focus' }, { label: '专项督导', value: 'supervision' }, { label: '信息报送', value: 'report' }] },
        { id: 'w_n4', key: 'targetOrg', label: '涉及责任单位/科室', type: 'cascader', category: 'basic', span: 12, required: true, placeholder: '请选择责任单位或辖区科室' },
        { id: 'w_n5', key: 'priorityLevel', label: '重要程度', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '普通', value: 'normal' }, { label: '重要', value: 'high' }, { label: '紧急', value: 'urgent' }] },
        { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true, placeholder: '详细阐述业务数据、背景情况与填写说明...' },
        { id: 'w_n7', key: 'attachments', label: '佐证材料/附件上传', type: 'file', category: 'basic', span: 24, required: false }
      ];
    }

    // 流程模板：全量高保真初始组件集（发令 + 回执）
    return [
      { id: 'w_1', key: 'opinionTitle', label: '舆情标题', type: 'input', category: 'basic', span: 24, required: true, placeholder: '请输入舆情事件标题' },
      { id: 'w_2', key: 'monitorTime', label: '监测时间', type: 'date', category: 'basic', span: 12, required: true },
      { id: 'w_3', key: 'sourceChannel', label: '舆情来源渠道', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '微博', value: 'weibo' }, { label: '抖音', value: 'douyin' }, { label: '微信公众号', value: 'wechat' }, { label: '小红书', value: 'xhs' }, { label: '网络论坛', value: 'bbs' }] },
      { id: 'w_4', key: 'warningLevel', label: '预警等级', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '一级 (特大/红色)', value: 'level_1' }, { label: '二级 (重大/橙色)', value: 'level_2' }, { label: '三级 (较大/黄色)', value: 'level_3' }, { label: '四级 (一般/蓝色)', value: 'level_4' }] },
      { id: 'w_5', key: 'postUrl', label: '原帖链接/涉事账号', type: 'input', category: 'basic', span: 12, required: true, placeholder: 'https://... 或 @涉事博主账号' },
      { id: 'w_6', key: 'mainContent', label: '舆情主要内容与焦点', type: 'textarea', category: 'basic', span: 24, required: true, placeholder: '详细阐述舆情传播发酵脉络与舆论焦点...' },
      { id: 'w_7', key: 'targetDept', label: '初判涉事责任单位', type: 'cascader', category: 'basic', span: 12, required: true, placeholder: '请选择直属分局及派出所' },
      { id: 'w_8', key: 'handleDeadline', label: '处置要求与办理时限', type: 'textarea', category: 'basic', span: 24, required: true, placeholder: '请在规定时限内核查处置并回传佐证材料' },
      { id: 'w_9', key: 'attachments', label: '佐证材料/截图附件', type: 'file', category: 'basic', span: 24, required: true },
      { id: 'w_divider', key: 'feedback_divider', label: '处置回执与核查结果', type: 'divider', category: 'layout', span: 24 },
      { id: 'w_10', key: 'feedbackDetail', label: '核实与处置情况说明', type: 'textarea', category: 'basic', span: 24, required: true, placeholder: '详细说明线下查证结果、处置措施与整改成效' },
      { id: 'w_11', key: 'feedbackImages', label: '处置凭证截图', type: 'image', category: 'basic', span: 24, required: true },
      { id: 'w_12', key: 'archiveOpinion', label: '办结归档意见', type: 'textarea', category: 'basic', span: 24, required: false, placeholder: '归档说明与后期防范建议' }
    ];
  });

  // 流程流转节点列表 (普通模板不需要)
  const [flowNodes, setFlowNodes] = useState<FlowStepNodeItem[]>(() => {
    if (template.flowNodes !== undefined && template.flowNodes.length > 0) {
      return template.flowNodes;
    }
    if (isNew) {
      return [
        {
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
        },
        {
          id: 'fn_end',
          nodeCode: 'node_end',
          name: '结束',
          nodeType: 'end',
          categoryLabel: '流程办结',
          description: '对处置回执验收结案，归档生成台账',
          actionButtons: [
            { id: 'btn_e_1', label: '导出工单台账', actionType: 'save_draft', color: 'blue', enabled: true }
          ]
        }
      ];
    }
    return [
      {
        id: 'fn_1',
        nodeCode: 'node_draft',
        name: '创建人发起与处置要求',
        nodeType: 'draft',
        categoryLabel: '发起填报',
        description: '由创建人登记业务基本信息，并明确具体处置要求、核查重点与办理时限',
        receiverLabel: '指令发起人',
        receiverType: 'initiator',
        actionButtons: [
          { id: 'btn_1_1', label: '下发指令/提交', actionType: 'submit', color: 'blue', enabled: true },
          { id: 'btn_1_2', label: '保存草稿', actionType: 'save_draft', color: 'slate', enabled: true },
          { id: 'btn_1_3', label: '撤销下发', actionType: 'terminate', color: 'red', enabled: true }
        ]
      },
      {
        id: 'fn_2',
        nodeCode: 'node_handle',
        name: '处理人核查处置',
        nodeType: 'handle',
        categoryLabel: '处理节点',
        description: '落地核查整改并填报反馈；支持跨部门申请转办',
        receiverLabel: '对口责任科室/承办人员',
        receiverType: 'dept',
        approveMode: 'or_sign',
        approveModeLabel: '或签(一名通过即生效)',
        timeLimitHours: 4,
        timeLimitLabel: '限时 4h',
        allowTransfer: true,
        actionButtons: [
          { id: 'btn_2_1', label: '提交处置回执', actionType: 'submit', color: 'blue', enabled: true },
          { id: 'btn_2_2', label: '申请转办', actionType: 'transfer', color: 'amber', enabled: true },
          { id: 'btn_2_3', label: '退回重办', actionType: 'reject', color: 'red', enabled: true },
          { id: 'btn_2_4', label: '暂存反馈', actionType: 'save_draft', color: 'slate', enabled: true }
        ]
      },
      {
        id: 'fn_3',
        nodeCode: 'node_approve',
        name: '复核审批',
        nodeType: 'approval',
        categoryLabel: '审批节点',
        description: '验收处置整改实效：审核通过归档，驳回退回重办',
        receiverLabel: '创建人本人',
        receiverType: 'initiator',
        approveMode: 'or_sign',
        approveModeLabel: '或签(一名通过即生效)',
        timeLimitHours: 2,
        timeLimitLabel: '限时 2h',
        rejectPolicyLabel: '驳回退回处理人',
        passPolicyLabel: '通过即归档',
        actionButtons: [
          { id: 'btn_3_1', label: '审核通过', actionType: 'pass', color: 'emerald', enabled: true },
          { id: 'btn_3_2', label: '驳回整改', actionType: 'reject', color: 'red', enabled: true }
        ]
      },
      {
        id: 'fn_4',
        nodeCode: 'node_end',
        name: '办结归档',
        nodeType: 'end',
        categoryLabel: '流程办结',
        description: '对回执结果进行验收结案归档，生成电子工单闭环台账',
        archiveActions: [
          '自动生成标准电子处置工单与闭环台账文件',
          '自动向发起人、承办人推送《工单办结通报》'
        ],
        actionButtons: [
          { id: 'btn_4_1', label: '导出工单台账', actionType: 'save_draft', color: 'blue', enabled: true },
          { id: 'btn_4_2', label: '查看全生命周期轨迹', actionType: 'submit', color: 'slate', enabled: true }
        ]
      }
    ];
  });

  // 全局预览模态框
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 流程流转模拟仿真测试模态框 (仅流程模板生效)
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // 获取当前业务系统与机构
  const currentSys = BUSINESS_SYSTEMS.find(s => s.id === systemId) || BUSINESS_SYSTEMS[0];
  const chosenOrgs = MOCK_ORGS.filter(o => selectedOrgIds.includes(o.id));

  // 构建当前完整对象
  const currentTemplateObj: ProcessTemplateItem = {
    ...template,
    templateType: isNormal ? 'normal' : 'process',
    systemId,
    systemName: currentSys.name,
    scope,
    orgId: scope === 'org' ? selectedOrgIds[0] : undefined,
    orgIds: scope === 'org' ? selectedOrgIds : undefined,
    orgName: scope === 'org' ? (chosenOrgs[0]?.name || '指定机构') : undefined,
    orgNames: scope === 'org' ? chosenOrgs.map(o => o.name) : undefined,
    appliedTenantCount: scope === 'public' ? (template.appliedTenantCount || 128) : selectedOrgIds.length,
    templateName,
    category,
    description,
    formConfig,
    formWidgets: widgets,
    flowNodes: isNormal ? undefined : flowNodes,
    globalRules: isNormal ? undefined : globalRules,
    associatedTemplates: associatedTemplates,
    fields: widgets.map(w => ({
      key: w.key,
      label: w.label,
      type: w.type,
      required: !!w.required,
      defaultValue: w.defaultValue,
      placeholder: w.placeholder,
      options: w.options
    }))
  };

  // ======================= 版本管理核心状态 =======================
  // 版本管理列表（支持切换历史版本与自动提取历史版本快照）
  const [versionList, setVersionList] = useState<ProcessTemplateVersionRecord[]>(() => {
    if (isNew) {
      return [
        {
          id: 'ver_v1',
          versionCode: 'V1',
          remark: isNormal ? '模板版本V1' : '流程版本V1',
          status: 'draft',
          creator: template.creator || '张建国',
          createdAt: template.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
          updater: template.creator || '张建国',
          updatedAt: template.updatedAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
          widgetsSnapshot: []
        }
      ];
    }
    return getDefaultVersionList(isNormal ? 'normal' : 'process');
  });

  // 当前激活/选中的版本对象 (新建模板默认使用 status === 'draft' 的 V1 版本)
  const [currentVersion, setCurrentVersion] = useState<ProcessTemplateVersionRecord>(() => {
    if (isNew) {
      return versionList[0];
    }
    return versionList.find(v => v.status === 'active') || versionList[0];
  });

  // 是否处于受保护状态（启用中与历史版本均仅可查看，不支持编辑；只有设计中 draft 状态才允许编辑）
  const isProtectedVersion = currentVersion.status === 'active' || currentVersion.status === 'history';
  const isHistoricalVersion = isProtectedVersion;

  // 历史版本只读保护拦截弹窗显示状态
  const [showReadOnlyModal, setShowReadOnlyModal] = useState<boolean>(false);

  // 发布二次确认弹窗显示状态
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState<boolean>(false);

  // 全局 Toast 提示（支持转圈加载保存中、保存成功与普通提示）
  interface DesignerToast {
    type: 'loading' | 'success' | 'info';
    message: string;
  }
  const [designerToast, setDesignerToast] = useState<DesignerToast | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 获取当前已启用的基准版本
  const activeVersion = useMemo(() => {
    return versionList.find(v => v.status === 'active') || versionList[0];
  }, [versionList]);

  // 切换版本回调
  const handleSwitchVersion = (v: ProcessTemplateVersionRecord) => {
    setCurrentVersion(v);
    if (v.widgetsSnapshot && v.widgetsSnapshot.length > 0) {
      setWidgets([...v.widgetsSnapshot]);
    }
    if (v.status === 'history') {
      setDesignerToast({
        type: 'info',
        message: `已切换至历史版本【${isNormal ? '模板版本' : '流程版本'}${v.versionCode}】，当前处于只读保护状态`
      });
    } else if (v.status === 'active') {
      setDesignerToast({
        type: 'info',
        message: `已切换至启用中版本【${isNormal ? '模板版本' : '流程版本'}${v.versionCode}】，当前处于只读保护状态`
      });
    } else {
      setDesignerToast({
        type: 'info',
        message: `已切换至设计中版本【${isNormal ? '模板版本' : '流程版本'}${v.versionCode}】，可自由编辑`
      });
    }
    setTimeout(() => setDesignerToast(null), 3000);
  };

  // 点击“创建新模板”：沿用当前历史版本所保留的东西，重新创建一个设计状态中的模板（不跳转，版本按最高顺延递增）
  const handleCreateNewTemplateFromHistory = () => {
    // 1. 计算版本号：递增规则基于所有已有版本中的最高版本数字 (例如当前最高为 V4，则递增至 V5)
    let maxVerNum = 0;
    versionList.forEach(v => {
      const match = v.versionCode.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxVerNum) maxVerNum = n;
      }
    });
    const nextVerNum = maxVerNum > 0 ? maxVerNum + 1 : 1;
    const nextVersionCode = `V${nextVerNum}`;

    // 2. 构造设计状态中的新版本实体 (沿用当前历史版本所保留的全部表单控件与配置)
    const newDraftVersion: ProcessTemplateVersionRecord = {
      id: `ver_${Date.now()}`,
      versionCode: nextVersionCode,
      remark: `${isNormal ? '模板版本' : '流程版本'}${nextVersionCode} (基于${currentVersion.versionCode}设计)`,
      status: 'draft', // 设计状态！
      creator: '张建国',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updater: '张建国',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      widgetsSnapshot: [...widgets] // 沿用当前历史版本所保留的东西
    };

    // 3. 将新版本加入版本列表顶部，并切换当前编辑版本为该设计中版本
    setVersionList(prev => [newDraftVersion, ...prev]);
    setCurrentVersion(newDraftVersion);

    // 4. 关闭只读拦截弹窗，保持在表单设计器中，不跳转至列表页
    setShowReadOnlyModal(false);

    // 5. 反馈提示
    setDesignerToast({
      type: 'info',
      message: `已沿用【${currentVersion.versionCode}】配置创建设计状态版本【${nextVersionCode}】，当前可自由拖拽与编辑表单`
    });
    setTimeout(() => setDesignerToast(null), 4000);
  };

  // 1. 保存配置（作为草稿或更新当前设计中/启用中版本，不退出设计器）
  const handleSaveDraft = () => {
    if (!templateName.trim()) {
      alert('请填写模板名称！');
      const globalIdx = steps.findIndex(s => s.key === 'global');
      if (globalIdx >= 0) setCurrentStepIndex(globalIdx);
      return;
    }

    if (isProtectedVersion && currentStep.key !== 'global') {
      setShowReadOnlyModal(true);
      return;
    }

    setIsSaving(true);
    // 第一步：toast 弹窗提示转圈提示保存中
    setDesignerToast({
      type: 'loading',
      message: '保存中...'
    });

    // 更新当前版本在版本列表中的快照与时间
    const updatedVersionList: ProcessTemplateVersionRecord[] = versionList.map(v => {
      if (v.id === currentVersion.id) {
        return {
          ...v,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          widgetsSnapshot: [...widgets]
        };
      }
      return v;
    });

    setVersionList(updatedVersionList);
    setCurrentVersion(prev => ({ ...prev, widgetsSnapshot: [...widgets] }));

    const draftTemplate: ProcessTemplateItem = {
      ...currentTemplateObj,
      templateName,
      version: currentVersion.versionCode,
      status: currentVersion.status === 'active' ? 'active' : 'inactive',
      formWidgets: [...widgets],
      formConfig: {
        ...formConfig,
        formTitle: templateName
      },
      fields: widgets.map(w => ({
        key: w.key,
        label: w.label,
        type: w.type,
        required: !!w.required,
        defaultValue: w.defaultValue,
        placeholder: w.placeholder,
        options: w.options
      })),
      flowNodes: isNormal ? undefined : flowNodes,
      globalRules: isNormal ? undefined : globalRules,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // 同步给父级，明确不退出设计器 (closeDesigner = false)
    onSave(draftTemplate, false);

    // 第二步：转圈后提示保存成功
    setTimeout(() => {
      setIsSaving(false);
      setDesignerToast({
        type: 'success',
        message: '保存成功'
      });

      // 第三步：2秒后自动隐藏保存成功 toast
      setTimeout(() => {
        setDesignerToast(null);
      }, 2000);
    }, 600);
  };

  // 2. 发布模板前进行表单校验，校验通过后弹出二次确认弹窗
  const handlePublish = () => {
    if (!templateName.trim()) {
      alert('请填写模板名称！');
      const globalIdx = steps.findIndex(s => s.key === 'global');
      if (globalIdx >= 0) setCurrentStepIndex(globalIdx);
      return;
    }

    // 打开二次确认弹窗（支持设计中与历史版本发布二次确认）
    setShowPublishConfirmModal(true);
  };

  // 二次确认后正式发布当前版本
  const handleConfirmPublish = () => {
    setShowPublishConfirmModal(false);

    setDesignerToast({
      type: 'loading',
      message: '正在发布...'
    });

    // 发布当前版本（例如处于设计状态中的 V6 或 V5，或重新发布）
    // 发布时：当前版本变成“启用中”，原本处于“启用中”的旧版本变为“历史”，其他“设计中”版本状态保持“设计中”不变
    const publishedVersionCode = currentVersion.versionCode;

    const updatedVersionList: ProcessTemplateVersionRecord[] = versionList.map(v => {
      if (v.id === currentVersion.id) {
        return {
          ...v,
          status: 'active',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          widgetsSnapshot: [...widgets]
        };
      }
      // 仅将此前处于 active（已启用）状态的版本转换为 history（历史版本）
      // 其余处于 draft（设计中）的版本保持 draft 不变，允许后续继续发布
      if (v.status === 'active') {
        return {
          ...v,
          status: 'history',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return v;
    });

    setVersionList(updatedVersionList);
    setCurrentVersion(prev => ({ ...prev, status: 'active', widgetsSnapshot: [...widgets] }));

    const finalTemplate: ProcessTemplateItem = {
      ...currentTemplateObj,
      templateName,
      version: publishedVersionCode,
      status: 'active',
      formWidgets: [...widgets],
      formConfig: {
        ...formConfig,
        formTitle: templateName
      },
      fields: widgets.map(w => ({
        key: w.key,
        label: w.label,
        type: w.type,
        required: !!w.required,
        defaultValue: w.defaultValue,
        placeholder: w.placeholder,
        options: w.options
      })),
      flowNodes: isNormal ? undefined : flowNodes,
      globalRules: isNormal ? undefined : globalRules,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onSave(finalTemplate, false);

    setTimeout(() => {
      setDesignerToast({
        type: 'success',
        message: `发布成功！【${isNormal ? '模板版本' : '流程版本'}${publishedVersionCode}】已设为启用中`
      });
      setTimeout(() => {
        setDesignerToast(null);
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* ===================== 顶部全景导航条 ===================== */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-30 shadow-xs relative">
        {/* 左侧：返回箭头、模板标题、类型徽章、版本管理 */}
        <div className="flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-base font-black text-slate-800 tracking-tight truncate max-w-[240px]" title={templateName}>
            {templateName || (isNormal ? '未命名普通模板' : '未命名流程模板')}
          </span>

          {/* 模板类型徽章 */}
          {isNormal ? (
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shrink-0">
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>普通模板</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 shrink-0">
              <GitMerge className="w-3 h-3 text-blue-600" />
              <span>流程模板</span>
            </span>
          )}

          {/* 版本管理 (取消在全局设置中的流程版本显示) */}
          {currentStep.key !== 'global' && (
            <TemplateVersionManager
              templateName={templateName}
              templateType={isNormal ? 'normal' : 'process'}
              initialVersionCode={template.version?.replace(/^V/i, 'V') || 'V4'}
              versionList={versionList}
              selectedVersionId={currentVersion.id}
              onVersionListChange={setVersionList}
              onVersionChange={handleSwitchVersion}
              onCreateNewDraft={handleCreateNewTemplateFromHistory}
              dropdownAlign="left"
            />
          )}
        </div>

        {/* 中间：根据模板类型动态呈现的步进条 (流程导航整体居中) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10 pointer-events-auto">
          {steps.map((item, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            // 符号确定：
            // 在表单配置中（isNormal）：【表单设计】与【全局设置】中的符号为竖杠 |
            // 在流程模板配置中（!isNormal）：【流程设计】与【全局设置】中的符号为竖杠 |，【表单设计】与【流程设计】中的符号不变 >
            let separatorSymbol = '>';
            if (isNormal) {
              if (item.key === 'form') {
                separatorSymbol = '|';
              }
            } else {
              if (item.key === 'flow_design') {
                separatorSymbol = '|';
              }
            }

            return (
              <React.Fragment key={item.key}>
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? (isNormal ? 'bg-indigo-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                      : isCompleted
                      ? (isNormal ? 'text-indigo-600 hover:bg-indigo-50' : 'text-blue-600 hover:bg-blue-50')
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isCurrent
                      ? 'bg-white text-slate-900 font-black'
                      : isCompleted
                      ? (isNormal ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-blue-100 text-blue-700 font-bold')
                      : 'bg-slate-200 text-slate-600 font-bold'
                  }`}>
                    {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                  </span>
                  <span>{item.label}</span>
                </button>

                {idx < steps.length - 1 && (
                  <span className="text-slate-300 font-bold px-1">{separatorSymbol}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 右侧：点击全局设置，去除最右上角所有按钮 */}
        {currentStep.key !== 'global' && (
          <div className="flex items-center justify-end gap-2 z-10">
            {/* 在流程设计处，增加一个测试按钮 (仅流程模板生效) */}
            {!isNormal && currentStep.key === 'flow_design' && (
              <button
                type="button"
                onClick={() => setIsSimulationOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all animate-in fade-in"
                title="模拟测试当前流程流转"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>测试</span>
              </button>
            )}

            {/* 状态 1：历史状态 (history) -> 恢复展示「发布」和「创建新流程/创建新模板」 */}
            {currentVersion.status === 'history' && (
              <>
                {/* 发布 */}
                <button
                  type="button"
                  onClick={handlePublish}
                  className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                    isNormal ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title="发布当前历史版本为正式启用版本"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>发布</span>
                </button>

                {/* 创建新流程 / 创建新模板 */}
                <button
                  type="button"
                  onClick={handleCreateNewTemplateFromHistory}
                  className="px-3.5 py-1.5 rounded-lg border border-purple-200 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="基于当前配置创建设计状态的新版本以进行编辑"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isNormal ? '创建新模板' : '创建新流程'}</span>
                </button>
              </>
            )}

            {/* 状态 2：启用中状态 (active) -> 仅有一个「创建新流程」/「创建新模板」 */}
            {currentVersion.status === 'active' && (
              <button
                type="button"
                onClick={handleCreateNewTemplateFromHistory}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                  isNormal ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="当前版本启用中不可直接修改，点击创建新版本进行编辑"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNormal ? '创建新模板' : '创建新流程'}</span>
              </button>
            )}

            {/* 状态 3：设计中状态 (draft) -> 按钮为「保存」和「发布流程」/「发布模板」 */}
            {currentVersion.status === 'draft' && (
              <>
                {/* 保存 */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all bg-white"
                  title="保存设计中草稿"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{isSaving ? '保存中...' : '保存'}</span>
                </button>

                {/* 发布流程 / 发布模板 */}
                <button
                  type="button"
                  onClick={handlePublish}
                  className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                    isNormal ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={isNormal ? "发布当前设计中的表单模板" : "发布当前设计中的流程版本"}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isNormal ? '发布模板' : '发布流程'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ===================== 主体内容渲染 (根据当前选中的步骤渲染) ===================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. 表单设计 (FormDesignerCanvas) */}
        {currentStep.key === 'form' && (
          <FormDesignerCanvas
            templateName={templateName}
            formConfig={formConfig}
            widgets={widgets}
            onChangeFormConfig={setFormConfig}
            onChangeWidgets={setWidgets}
            onOpenPreview={() => setIsPreviewOpen(true)}
            isReadOnly={isProtectedVersion}
            currentVersionCode={currentVersion.versionCode}
            currentVersionStatus={currentVersion.status}
            isHistoricalVersion={isProtectedVersion}
            onAttemptEditInReadOnly={() => setShowReadOnlyModal(true)}
            templateType={isNormal ? 'normal' : 'process'}
          />
        )}

        {/* 2. 流程设计 (FlowDesignerStep，仅在流程模板中可见) */}
        {currentStep.key === 'flow_design' && (
          <FlowDesignerStep
            flowNodes={flowNodes}
            onChangeFlowNodes={setFlowNodes}
            widgets={widgets}
            onGoToStep4={() => {
              const globalIdx = steps.findIndex(s => s.key === 'global');
              if (globalIdx >= 0) setCurrentStepIndex(globalIdx);
            }}
            onOpenTest={() => setIsSimulationOpen(true)}
            isReadOnly={isProtectedVersion}
            currentVersionCode={currentVersion.versionCode}
            currentVersionStatus={currentVersion.status}
            onAttemptEditInReadOnly={() => setShowReadOnlyModal(true)}
            templateType={isNormal ? 'normal' : 'process'}
          />
        )}

        {/* 3. 全局设置 (Global Settings: 左侧菜单：基础设置 / 关联列表) */}
        {currentStep.key === 'global' && (
          <div className="flex-1 flex overflow-hidden bg-slate-50">
            {/* 左侧子菜单导航 */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                全局设置分类
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setGlobalNavMenu('basic_settings')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    globalNavMenu === 'basic_settings'
                      ? 'bg-blue-50 text-blue-700 shadow-2xs ring-1 ring-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className={`w-4 h-4 ${globalNavMenu === 'basic_settings' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="block">基础设置</span>
                      <p className="text-[10px] font-normal text-slate-400 mt-0.5">系统归属与表单全局样式</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGlobalNavMenu('scope_settings')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    globalNavMenu === 'scope_settings'
                      ? 'bg-purple-50 text-purple-700 shadow-2xs ring-1 ring-purple-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className={`w-4 h-4 ${globalNavMenu === 'scope_settings' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="block">模板归属范围</span>
                      <p className="text-[10px] font-normal text-slate-400 mt-0.5">公共通用 / 机构专属授权</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    globalNavMenu === 'scope_settings'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {scope === 'public' ? '公共' : `${selectedOrgIds.length}家`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGlobalNavMenu('associated_list')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    globalNavMenu === 'associated_list'
                      ? 'bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className={`w-4 h-4 ${globalNavMenu === 'associated_list' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="block">关联列表</span>
                      <p className="text-[10px] font-normal text-slate-400 mt-0.5">跨流程协同与表单绑定</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    globalNavMenu === 'associated_list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {associatedTemplates.length}
                  </span>
                </button>
              </div>

              {/* 底部关联小贴士 */}
              <div className="mt-auto bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>多流程协同指南</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  在【关联列表】中添加关联流程后，系统将在实例中心自动汇聚全生命周期协同数据。
                </p>
              </div>
            </div>

            {/* 右侧主工作区 (铺满全屏画布) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
              <div className="w-full bg-white rounded-2xl p-7 border border-slate-200 shadow-2xs space-y-7">
                
                {/* 顶栏说明与分类标识 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      {globalNavMenu === 'basic_settings' ? (
                        <Settings className="w-5 h-5 text-slate-700" />
                      ) : globalNavMenu === 'scope_settings' ? (
                        <Building2 className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Share2 className="w-5 h-5 text-indigo-600" />
                      )}
                      <h2 className="text-base font-black text-slate-800">
                        {globalNavMenu === 'basic_settings' 
                          ? '全局设置 · 基础设置'
                          : globalNavMenu === 'scope_settings'
                          ? '全局设置 · 模板归属范围'
                          : '全局设置 · 关联表单流程列表'}
                      </h2>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        globalNavMenu === 'basic_settings'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : globalNavMenu === 'scope_settings'
                          ? (scope === 'public' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200')
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {globalNavMenu === 'basic_settings'
                          ? (isEditingBasicSettings ? '编辑中...' : '已就绪')
                          : globalNavMenu === 'scope_settings'
                          ? (scope === 'public' ? '公共全通用' : `已授权 ${selectedOrgIds.length} 家机构`)
                          : `已关联 ${associatedTemplates.length} 个流程`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {globalNavMenu === 'basic_settings'
                        ? '统一维护模板基础属性、所属业务系统归属与表单全局样式'
                        : globalNavMenu === 'scope_settings'
                        ? '配置并维护当前模板在各级单位的组织授权与适用范围'
                        : '配置并纳管当前流程所协同绑定的上游预警源、下游处置流程、跨部门联合审批及共享表单'}
                    </p>
                  </div>

                  {/* 基础设置右侧：增加编辑按钮，点击编辑后变为保存和取消 */}
                  {globalNavMenu === 'basic_settings' && (
                    <div className="flex items-center gap-2">
                      {!isEditingBasicSettings ? (
                        <button
                          type="button"
                          onClick={handleStartEditBasicSettings}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          title="编辑基础设置"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>编辑</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 animate-in fade-in">
                          <button
                            type="button"
                            onClick={handleCancelEditBasicSettings}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors bg-white shadow-2xs"
                            title="取消修改并还原"
                          >
                            <X className="w-3.5 h-3.5 text-slate-500" />
                            <span>取消</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveBasicSettings}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                            title="保存修改"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>保存</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ===================== 子视图 1：基础设置 ===================== */}
                {globalNavMenu === 'basic_settings' && (
                  <div className="space-y-7">
                    {/* 模块 A：基础属性与归属 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>模板基础属性与系统归属</span>
                      </div>

                      {/* 基础属性：所属业务系统、模板 ID 与 模板名称 */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            所属业务系统 <span className="text-red-500">*</span>
                          </label>
                          <select
                            disabled={!isEditingBasicSettings}
                            value={systemId}
                            onChange={e => setSystemId(e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          >
                            {BUSINESS_SYSTEMS.map(sys => (
                              <option key={sys.id} value={sys.id}>
                                {sys.shortName}（{sys.name}）
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">模板 ID</label>
                          <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600 flex items-center">
                            {template.id}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            模板名称 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            disabled={!isEditingBasicSettings}
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder={isNormal ? '例：网络生态日常巡查登记表' : '例：网络舆情处置下发指令流程'}
                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* 分类与说明 */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">业务分类</label>
                          <select
                            disabled={!isEditingBasicSettings}
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer font-medium disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          >
                            {[
                              '舆情处置类',
                              '日常督办类',
                              '执法监督类',
                              '涉稳处置类',
                              '重大保障类',
                              '综合治理类',
                              '预警研判类',
                              '网评引导类',
                              '考核考评类',
                              '应急处突类',
                              '任务流转类'
                            ].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">模板说明</label>
                          <input
                            type="text"
                            disabled={!isEditingBasicSettings}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="简要阐述该模板的业务使用背景"
                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 模块 B：表单全局样式与交互设置 */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>表单全局样式与布局</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">表单主标题</label>
                          <input
                            type="text"
                            disabled={!isEditingBasicSettings}
                            value={formConfig.formTitle || ''}
                            onChange={e => setFormConfig({ ...formConfig, formTitle: e.target.value })}
                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">表单副标题 / 填写说明</label>
                          <input
                            type="text"
                            disabled={!isEditingBasicSettings}
                            value={formConfig.formSubTitle || ''}
                            onChange={e => setFormConfig({ ...formConfig, formSubTitle: e.target.value })}
                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================== 子视图 2：模板归属范围 (独立菜单) ===================== */}
                {globalNavMenu === 'scope_settings' && (
                  <div className="space-y-6">
                    {/* 范围模式卡片切换 */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* 公共通用卡片 */}
                      <div
                        onClick={() => setScope('public')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative ${
                          scope === 'public'
                            ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          scope === 'public' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Globe2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-bold text-slate-800">公共模板 (全机构通用)</strong>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                全平台开放
                              </span>
                            </div>
                            {scope === 'public' && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            面向【{currentSys.name}】全系统所有接入的各级机构、分局与科室开放使用，无需逐一设置机构授权白名单。
                          </p>
                        </div>
                      </div>

                      {/* 专属机构卡片 */}
                      <div
                        onClick={() => setScope('org')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative ${
                          scope === 'org'
                            ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-2 ring-purple-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          scope === 'org' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-bold text-slate-800">机构专属定制模板</strong>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                定向授权
                              </span>
                            </div>
                            {scope === 'org' && (
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            仅面向下方授权清单中所指定的具体单位或科室开放，支持精确细分与独立业务定制流转。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 专属机构模式：展示详细名单及维护列表；公共模板：无需展示详细名单 */}
                    {scope === 'org' ? (
                      <div className="space-y-4 pt-2">
                        {/* 搜索与新增操作栏 */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-sm">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={scopeClientSearch}
                                onChange={e => {
                                  setScopeClientSearch(e.target.value);
                                  setScopeOrgPage(1);
                                  setScopeOrgJumpPage('1');
                                }}
                                placeholder="搜索已授权机构名称、机构代码或所在辖区..."
                                className="w-full h-8 pl-8 pr-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrgsToAdd([]);
                              setShowAddOrgModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span>新增机构</span>
                          </button>
                        </div>

                        {/* 已选择的机构列表表格及分页器 */}
                        {(() => {
                          const fullSelectedList = selectedOrgIds.map(orgId => {
                            const orgItem = MOCK_ORGS.find(o => o.id === orgId);
                            const clientItem = scopeOrgClients.find(c => c.id === orgId);
                            return {
                              id: orgId,
                              name: orgItem?.name || clientItem?.name || '指定机构',
                              fullName: clientItem?.fullName || orgItem?.name || '指定业务机构',
                              code: orgItem?.code || clientItem?.creditCode || `ORG_${orgId}`,
                              levelLabel: orgItem?.level === 1 ? '市局本级' : orgItem?.level === 2 ? '市局直属处室' : orgItem?.level === 3 ? '区分局' : '基层派出所',
                              unitPath: clientItem?.unitPath || (orgItem?.level === 1 ? '市局本级' : '下属分局/科室'),
                              authDate: clientItem?.authDate || '2025-01-15'
                            };
                          }).filter(item => {
                            if (scopeClientSearch.trim()) {
                              const kw = scopeClientSearch.toLowerCase().trim();
                              return item.name.toLowerCase().includes(kw) || item.code.toLowerCase().includes(kw) || item.unitPath.toLowerCase().includes(kw);
                            }
                            return true;
                          });

                          const totalCount = fullSelectedList.length;
                          const totalPages = Math.max(1, Math.ceil(totalCount / scopeOrgPageSize));
                          const safeCurrentPage = Math.min(Math.max(1, scopeOrgPage), totalPages);
                          const startItem = totalCount > 0 ? (safeCurrentPage - 1) * scopeOrgPageSize + 1 : 0;
                          const endItem = Math.min(safeCurrentPage * scopeOrgPageSize, totalCount);

                          const paginatedList = fullSelectedList.slice(
                            (safeCurrentPage - 1) * scopeOrgPageSize,
                            safeCurrentPage * scopeOrgPageSize
                          );

                          return (
                            <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-3 px-4 w-16 text-center">序号</th>
                                    <th className="py-3 px-4 min-w-[200px]">机构 / 单位名称</th>
                                    <th className="py-3 px-4 w-36">机构编码 / 信用代码</th>
                                    <th className="py-3 px-4 w-28">所属系统</th>
                                    <th className="py-3 px-4 w-36">管理层级 / 类别</th>
                                    <th className="py-3 px-4 w-28 text-center">授权状态</th>
                                    <th className="py-3 px-4 w-36">授权时间</th>
                                    <th className="py-3 px-4 w-24 text-center">操作</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {paginatedList.length === 0 ? (
                                    <tr>
                                      <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                          <Building2 className="w-8 h-8 text-slate-300" />
                                          <span className="text-xs">
                                            {selectedOrgIds.length === 0 ? '暂无专属授权机构' : '未检索到匹配的授权机构'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedOrgsToAdd([]);
                                              setShowAddOrgModal(true);
                                            }}
                                            className="mt-1 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 cursor-pointer"
                                          >
                                            + 立即新增机构
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    paginatedList.map((org, idx) => (
                                      <tr key={org.id} className="hover:bg-purple-50/20 transition-colors">
                                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                                          {(safeCurrentPage - 1) * scopeOrgPageSize + idx + 1}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-800">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                              <Building2 className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                              <span>{org.name}</span>
                                              {org.fullName !== org.name && (
                                                <p className="text-[10px] text-slate-400 font-normal line-clamp-1">{org.fullName}</p>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                                          {org.code}
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            {currentSys.shortName}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                            {org.levelLabel} ({org.unitPath})
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>已授权</span>
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                          {org.authDate}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedOrgIds(prev => prev.filter(id => id !== org.id));
                                              setDesignerToast({
                                                type: 'success',
                                                message: `已移除【${org.name}】的模板使用授权`
                                              });
                                              setTimeout(() => setDesignerToast(null), 3000);
                                            }}
                                            className="px-2 py-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer text-xs font-medium"
                                            title="移除机构"
                                          >
                                            移除
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>

                              {/* 机构列表分页控制条 */}
                              {totalCount > 0 && (
                                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                                  {/* 左侧：数量汇总与每页条数选择 */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span>
                                      显示第 <strong className="font-mono text-slate-800 font-bold">{startItem}</strong> 至{' '}
                                      <strong className="font-mono text-slate-800 font-bold">{endItem}</strong> 条
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span>
                                      共 <strong className="font-mono text-slate-900 font-bold">{totalCount}</strong> 家授权机构
                                    </span>

                                    <div className="flex items-center gap-1.5 ml-2 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                                      <span className="text-slate-500 font-bold text-[11px]">每页显示:</span>
                                      <select
                                        value={scopeOrgPageSize}
                                        onChange={(e) => {
                                          const newSize = Number(e.target.value);
                                          setScopeOrgPageSize(newSize);
                                          setScopeOrgPage(1);
                                          setScopeOrgJumpPage('1');
                                        }}
                                        className="bg-transparent font-bold text-slate-700 text-xs cursor-pointer focus:outline-none"
                                      >
                                        <option value={10}>10 条/页 (默认)</option>
                                        <option value={20}>20 条/页</option>
                                        <option value={50}>50 条/页</option>
                                        <option value={100}>100 条/页</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* 右侧：上一页、页码列表、下一页与直达第几页 */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* 上一页 */}
                                    <button
                                      type="button"
                                      disabled={safeCurrentPage <= 1}
                                      onClick={() => {
                                        const prev = Math.max(1, safeCurrentPage - 1);
                                        setScopeOrgPage(prev);
                                        setScopeOrgJumpPage(String(prev));
                                      }}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                                        safeCurrentPage <= 1
                                          ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
                                      }`}
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                      <span>上一页</span>
                                    </button>

                                    {/* 页码列表 */}
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
                                        .reduce((acc: (number | string)[], p, idx, arr) => {
                                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                            acc.push('...');
                                          }
                                          acc.push(p);
                                          return acc;
                                        }, [])
                                        .map((item, idx) => {
                                          if (item === '...') {
                                            return (
                                              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-mono">
                                                ...
                                              </span>
                                            );
                                          }
                                          const pageNum = Number(item);
                                          const isActive = safeCurrentPage === pageNum;
                                          return (
                                            <button
                                              key={pageNum}
                                              type="button"
                                              onClick={() => {
                                                setScopeOrgPage(pageNum);
                                                setScopeOrgJumpPage(String(pageNum));
                                              }}
                                              className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                isActive
                                                  ? 'bg-purple-600 text-white shadow-xs'
                                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                              }`}
                                            >
                                              {pageNum}
                                            </button>
                                          );
                                        })}
                                    </div>

                                    {/* 下一页 */}
                                    <button
                                      type="button"
                                      disabled={safeCurrentPage >= totalPages}
                                      onClick={() => {
                                        const next = Math.min(totalPages, safeCurrentPage + 1);
                                        setScopeOrgPage(next);
                                        setScopeOrgJumpPage(String(next));
                                      }}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                                        safeCurrentPage >= totalPages
                                          ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
                                      }`}
                                    >
                                      <span>下一页</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                    {/* 跳至第几页 */}
                                    {totalPages > 1 && (
                                      <div className="flex items-center gap-1.5 ml-1 text-slate-500 text-xs">
                                        <span>跳至</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={totalPages}
                                          value={scopeOrgJumpPage}
                                          onChange={(e) => setScopeOrgJumpPage(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const val = parseInt(scopeOrgJumpPage, 10);
                                              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                                setScopeOrgPage(val);
                                              } else {
                                                setScopeOrgJumpPage(String(safeCurrentPage));
                                              }
                                            }
                                          }}
                                          className="w-12 h-8 px-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                                        />
                                        <span>页</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const val = parseInt(scopeOrgJumpPage, 10);
                                            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                              setScopeOrgPage(val);
                                            } else {
                                              setScopeOrgJumpPage(String(safeCurrentPage));
                                            }
                                          }}
                                          className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                          确定
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* 公共模板说明（无需展示详细机构名单） */
                      <div className="pt-2">
                        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2 text-emerald-950">
                          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>公共模板适用全域说明</span>
                          </div>
                          <p className="text-emerald-900 leading-relaxed pl-7 text-xs">
                            当前模板已被设定为<strong>【公共模板（全机构通用）】</strong>。在【{currentSys.name}】业务系统中，所有接入的组织机构均默认开通使用权限，无需配置具体机构名单，全平台经办人员均可直接填报与发起。
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== 子视图 3：关联列表 ===================== */}
                {globalNavMenu === 'associated_list' && (
                  <div className="space-y-4">
                    {/* 操作与检索工具栏 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={assocSearch}
                            onChange={e => setAssocSearch(e.target.value)}
                            placeholder="搜索关联流程名称 / ID..."
                            className="w-full h-8 pl-8 pr-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <select
                          value={assocSystemFilter}
                          onChange={e => setAssocSystemFilter(e.target.value)}
                          className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 cursor-pointer font-medium"
                        >
                          <option value="ALL">全部系统</option>
                          <option value="SYS_ZLL">指令流转</option>
                          <option value="SYS_DDSB">点点速豹</option>
                          <option value="SYS_ZLWP">知了网评</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTplIdsToLink([]);
                          setSelectedRelationType('downstream');
                          setSelectedRelationNote('');
                          setShowAddAssocModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新增关联流程</span>
                      </button>
                    </div>

                    {/* 关联列表表格 */}
                    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-32">流程 ID</th>
                            <th className="py-3 px-4 min-w-[180px]">关联流程 / 表单名称</th>
                            <th className="py-3 px-4 w-28">所属系统</th>
                            <th className="py-3 px-4 min-w-[200px]">关联说明</th>
                            <th className="py-3 px-4 w-36">关联时间</th>
                            <th className="py-3 px-4 w-20 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {associatedTemplates
                            .filter(item => {
                              if (assocSystemFilter !== 'ALL' && item.systemId !== assocSystemFilter) return false;
                              if (assocSearch.trim()) {
                                const kw = assocSearch.toLowerCase().trim();
                                return item.templateName.toLowerCase().includes(kw) || item.templateId.includes(kw) || (item.description || '').toLowerCase().includes(kw);
                              }
                              return true;
                            })
                            .map(link => {
                              return (
                                <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                    {link.templateId}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-800">
                                    <div className="flex items-center gap-1.5">
                                      <GitMerge className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span>{link.templateName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {link.systemName || '业务系统'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 text-[11px] leading-relaxed">
                                    {link.description || '无补充说明'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                                    {link.linkedAt}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssociatedTemplates(prev => prev.filter(p => p.id !== link.id));
                                        setDesignerToast({
                                          type: 'success',
                                          message: `已解除与【${link.templateName}】的流程关联`
                                        });
                                        setTimeout(() => setDesignerToast(null), 3000);
                                      }}
                                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                      title="解除关联"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                          {associatedTemplates.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Share2 className="w-8 h-8 text-slate-300" />
                                  <span className="text-xs">暂无关联的表单流程</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTplIdsToLink([]);
                                      setShowAddAssocModal(true);
                                    }}
                                    className="mt-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 cursor-pointer"
                                  >
                                    + 立即新增关联
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== 全真表单仿真预览模态框 ===================== */}
      {isPreviewOpen && (
        <TemplateFormPreviewModal
          template={currentTemplateObj}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* ===================== 历史版本只读保护拦截弹窗 (置于最顶层 z-[9999]) ===================== */}
      {showReadOnlyModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-[500px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* 顶栏 */}
            <div className="px-6 py-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">版本配置提示</h4>
                  <p className="text-[11px] text-amber-700 font-medium">当前配置版本受保护中</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReadOnlyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 提示内容核心区域 */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  当前配置{currentVersion.status === 'active' ? '启用中' : (currentVersion.status === 'history' ? `处于历史版本【${currentVersion.versionCode}】` : '受保护')}，仅可查看，不支持编辑。如需编辑，请{isNormal ? '创建新模板' : '创建新流程'}或切换到设计中的配置版本。
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentVersion.status === 'active'
                    ? `当前版本为正式启用中配置。为保障线上在办业务与生产数据的一致性与稳定性，已启用的版本处于只读保护状态。如需编辑，请基于此${isNormal ? '创建新模板' : '创建新流程'}。`
                    : `您当前浏览的为历史归档版本。为保障线上在办业务与历史数据的安全一致性，该版本下${isNormal ? '表单元素' : '流转节点与规则'}处于只读状态。`}
                </p>
              </div>

              {/* 历史版本已保留信息摘要 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">当前查看版本：</span>
                  <span className="font-mono font-bold text-slate-800">
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px]">
                      {isNormal ? '模板版本' : '流程版本'}{currentVersion.versionCode} ({currentVersion.status === 'active' ? '启用中' : '历史版本'})
                    </span>
                  </span>
                </div>
                {(() => {
                  let maxVerNum = 0;
                  versionList.forEach(v => {
                    const match = v.versionCode.match(/(\d+)/);
                    if (match) {
                      const n = parseInt(match[1], 10);
                      if (n > maxVerNum) maxVerNum = n;
                    }
                  });
                  const nextCode = `V${maxVerNum > 0 ? maxVerNum + 1 : 1}`;
                  return (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500">创建新版本号：</span>
                      <span className="font-mono font-bold text-blue-600">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] border border-blue-200">
                          {isNormal ? '模板版本' : '流程版本'}{nextCode}
                        </span>
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">已保留表单控件：</span>
                  <span className="font-semibold text-slate-800">{widgets.length} 个字段组件（完整继承）</span>
                </div>
                {!isNormal && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">已保留流转环节：</span>
                    <span className="font-semibold text-slate-800">{flowNodes.length} 个流转节点（完整继承）</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">创建后状态：</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    设计中
                  </span>
                </div>
              </div>
            </div>

            {/* 底部双操作按钮 (继续查看 vs 创建新模板/创建新流程) */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReadOnlyModal(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                继续查看
              </button>
              <button
                type="button"
                onClick={handleCreateNewTemplateFromHistory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNormal ? '创建新模板' : '创建新流程'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 发布版本二次确认弹窗 (置于最顶层 z-[9999]) ===================== */}
      {showPublishConfirmModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-[520px] max-w-[95vw] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* 顶栏 */}
            <div className="px-6 py-4.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    发布{isNormal ? '模板' : '流程'}版本确认
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5 font-medium">请核对即将启用的新版本配置与流转规则</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  确定要发布当前版本【{isNormal ? '模板版本' : '流程版本'}{currentVersion.versionCode}】吗？
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  发布后，该版本将作为正式启用版本上线，供各业务系统及用户填报发起使用。
                </p>
              </div>

              {/* 核心提示说明条 (对标用户明确要求的提示内容) */}
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>生效规则与流转说明：</span>
                </div>
                <div className="space-y-1.5 pl-5.5 text-blue-900 leading-relaxed">
                  <p>
                    • <strong>后续用户提交的话将以此版本为主</strong>：发布成功后，所有新发起的业务事项将默认自动加载并执行当前【{isNormal ? '模板版本' : '流程版本'}{currentVersion.versionCode}】表单与审批流转配置。
                  </p>
                  <p>
                    • <strong>不影响正在运行中的流程</strong>：历史已发起且当前仍在在途审批、办理中的任务不受任何影响，继续沿用发起时绑定的历史版本节点及规则执行直至办结。
                  </p>
                </div>
              </div>

              {/* 版本变更信息明细 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">模板名称：</span>
                  <span className="font-bold text-slate-800">{templateName || '未命名模板'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">发布后状态：</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{isNormal ? '模板版本' : '流程版本'}{currentVersion.versionCode} (启用中)</span>
                  </span>
                </div>
                {activeVersion && activeVersion.id !== currentVersion.id && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">原启用版本：</span>
                    <span className="font-mono text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {isNormal ? '模板版本' : '流程版本'}{activeVersion.versionCode} (自动归档为历史版本)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">归属范围：</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    scope === 'public'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {scope === 'public' ? '公共模板 (全机构通用)' : `机构专属(${selectedOrgIds.length})`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">包含表单控件：</span>
                  <span className="font-medium text-slate-700">{widgets.length} 个字段组件</span>
                </div>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>确认发布</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 新增关联表单流程弹窗 (置于最顶层 z-[9999]) ===================== */}
      {showAddAssocModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-[800px] max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* 顶栏 */}
            <div className="px-6 py-4.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    新增关联表单流程
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5 font-medium">
                    选择系统中所有可用的流程与表单，建立跨流程/表单的数据联动与协同流转关系
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAssocModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 检索过滤栏 */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={modalAssocSearch}
                    onChange={e => setModalAssocSearch(e.target.value)}
                    placeholder="输入流程名称/ID/分类快速筛选..."
                    className="w-full h-8 pl-8 pr-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-lg">
                  {[
                    { key: 'ALL', label: '全部流程' },
                    { key: 'SYS_ZLL', label: '指令流转' },
                    { key: 'SYS_DDSB', label: '点点速豹' },
                    { key: 'SYS_ZLWP', label: '知了网评' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setModalAssocSys(tab.key)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        modalAssocSys === tab.key
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 中间流程选择列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 max-h-[380px]">
              <div className="grid grid-cols-1 gap-2">
                {MOCK_TEMPLATES
                  .filter(t => t.id !== template.id) // 排除自身
                  .filter(t => {
                    if (modalAssocSys !== 'ALL' && t.systemId !== modalAssocSys) return false;
                    if (modalAssocSearch.trim()) {
                      const kw = modalAssocSearch.toLowerCase().trim();
                      return (
                        t.templateName.toLowerCase().includes(kw) ||
                        t.id.includes(kw) ||
                        (t.category || '').toLowerCase().includes(kw) ||
                        (t.description || '').toLowerCase().includes(kw)
                      );
                    }
                    return true;
                  })
                  .map(tpl => {
                    const isAlreadyLinked = associatedTemplates.some(a => a.templateId === tpl.id);
                    const isSelected = selectedTplIdsToLink.includes(tpl.id);

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          if (isAlreadyLinked) return;
                          if (isSelected) {
                            setSelectedTplIdsToLink(prev => prev.filter(id => id !== tpl.id));
                          } else {
                            setSelectedTplIdsToLink(prev => [...prev, tpl.id]);
                          }
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all flex items-start justify-between gap-3 ${
                          isAlreadyLinked
                            ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50/40 border-indigo-500 shadow-2xs ring-2 ring-indigo-500/10 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-0.5">
                            {isAlreadyLinked ? (
                              <CheckSquare className="w-4 h-4 text-slate-400" />
                            ) : isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-600">
                                {tpl.id}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {tpl.templateName}
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {tpl.systemName}
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {tpl.category}
                              </span>
                              {isAlreadyLinked && (
                                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  已关联
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {tpl.description || '支持指令协同与流程流转'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {tpl.fields?.length || 0} 个表单控件
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                            tpl.templateType === 'normal' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {tpl.templateType === 'normal' ? '普通模板' : '流程模板'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 关联属性配置区 */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  关联业务说明 / 备注
                </label>
                <input
                  type="text"
                  value={selectedRelationNote}
                  onChange={e => setSelectedRelationNote(e.target.value)}
                  placeholder="例：本工单办结后自动向下游处置网格下发闭环办理指令"
                  className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-600">
                已选中 <strong className="text-indigo-600 font-bold font-mono">{selectedTplIdsToLink.length}</strong> 个流程
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAssocModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={selectedTplIdsToLink.length === 0}
                  onClick={() => {
                    const newLinks: AssociatedProcessTemplateLink[] = selectedTplIdsToLink.map(id => {
                      const found = MOCK_TEMPLATES.find(t => t.id === id);
                      const relLabel = 
                        selectedRelationType === 'upstream'
                          ? '上游预警触发源'
                          : selectedRelationType === 'collaborative'
                          ? '跨部门联合会商'
                          : selectedRelationType === 'sub_process'
                          ? '基层子流程派生'
                          : selectedRelationType === 'shared_form'
                          ? '共享表单数据'
                          : '下游协同督办';

                      return {
                        id: `link_${Date.now()}_${id}`,
                        templateId: id,
                        templateName: found?.templateName || '关联流程',
                        templateType: found?.templateType || 'process',
                        systemId: found?.systemId || 'SYS_ZLL',
                        systemName: found?.systemName || '业务系统',
                        category: found?.category || '业务类别',
                        relationType: selectedRelationType,
                        relationLabel: relLabel,
                        description: selectedRelationNote.trim() || `与【${found?.templateName || id}】建立${relLabel}协同关系`,
                        linkedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                        status: 'active'
                      };
                    });

                    setAssociatedTemplates(prev => [...prev, ...newLinks]);
                    setShowAddAssocModal(false);
                    setDesignerToast({
                      type: 'success',
                      message: `已成功关联 ${newLinks.length} 个表单流程！`
                    });
                    setTimeout(() => setDesignerToast(null), 3000);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确定关联</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 新增模板授权机构模态框 (置于最顶层 z-[9999]) ===================== */}
      {showAddOrgModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-[800px] max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* 顶栏 */}
            <div className="px-6 py-4.5 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    新增模板授权机构
                  </h4>
                  <p className="text-xs text-purple-700 mt-0.5 font-medium">
                    选择系统中需要使用本模板的直属处室、区分局或基层科室，批量加入专属授权白名单
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOrgModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 搜索与过滤工具栏 */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={modalOrgSearch}
                    onChange={e => setModalOrgSearch(e.target.value)}
                    placeholder="输入机构名称、编码或拼音搜索..."
                    className="w-full h-8.5 pl-8 pr-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={modalOrgLevelFilter}
                  onChange={e => setModalOrgLevelFilter(e.target.value)}
                  className="h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 cursor-pointer font-medium"
                >
                  <option value="ALL">全部层级分类</option>
                  <option value="LEVEL_1">市局本级</option>
                  <option value="LEVEL_2">直属处室与支队</option>
                  <option value="LEVEL_3">各区县分局</option>
                  <option value="LEVEL_4">基层科室/派出所</option>
                </select>
              </div>

              {/* 快捷批量全选/全不选 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const unselectedCandidateIds = MOCK_ORGS
                      .filter(o => !selectedOrgIds.includes(o.id))
                      .map(o => o.id);
                    setSelectedOrgsToAdd(unselectedCandidateIds);
                  }}
                  className="px-2.5 py-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 font-bold transition-colors cursor-pointer"
                >
                  全选未授权
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrgsToAdd([])}
                  className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer"
                >
                  清空选择
                </button>
              </div>
            </div>

            {/* 机构候选列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 max-h-[380px]">
              <div className="grid grid-cols-2 gap-2.5">
                {MOCK_ORGS
                  .filter(o => {
                    if (modalOrgLevelFilter === 'LEVEL_1' && o.level !== 1) return false;
                    if (modalOrgLevelFilter === 'LEVEL_2' && o.level !== 2) return false;
                    if (modalOrgLevelFilter === 'LEVEL_3' && o.level !== 3) return false;
                    if (modalOrgLevelFilter === 'LEVEL_4' && o.level !== 4) return false;
                    if (modalOrgSearch.trim()) {
                      const kw = modalOrgSearch.toLowerCase().trim();
                      return o.name.toLowerCase().includes(kw) || o.code.toLowerCase().includes(kw);
                    }
                    return true;
                  })
                  .map(org => {
                    const isAlreadyAdded = selectedOrgIds.includes(org.id);
                    const isSelected = selectedOrgsToAdd.includes(org.id);
                    const levelBadge = 
                      org.level === 1 ? '市局本级' : 
                      org.level === 2 ? '直属支队' : 
                      org.level === 3 ? '区分局' : '派出所';

                    return (
                      <div
                        key={org.id}
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          if (isSelected) {
                            setSelectedOrgsToAdd(prev => prev.filter(id => id !== org.id));
                          } else {
                            setSelectedOrgsToAdd(prev => [...prev, org.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 select-none ${
                          isAlreadyAdded
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-50/70 border-purple-400 ring-1 ring-purple-400/30 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="shrink-0">
                            {isAlreadyAdded ? (
                              <CheckSquare className="w-4 h-4 text-slate-400" />
                            ) : isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800 truncate" title={org.name}>
                                {org.name}
                              </span>
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {levelBadge}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {org.code}
                            </span>
                          </div>
                        </div>

                        {isAlreadyAdded && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            已授权
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-600">
                已选中 <strong className="text-purple-600 font-bold font-mono">{selectedOrgsToAdd.length}</strong> 家机构
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={selectedOrgsToAdd.length === 0}
                  onClick={() => {
                    const uniqueNewIds = Array.from(new Set([...selectedOrgIds, ...selectedOrgsToAdd]));
                    setSelectedOrgIds(uniqueNewIds);
                    setShowAddOrgModal(false);
                    setDesignerToast({
                      type: 'success',
                      message: `已成功添加 ${selectedOrgsToAdd.length} 家机构授权！`
                    });
                    setTimeout(() => setDesignerToast(null), 3000);
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确定添加</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== 流程流转仿真模拟测试模态窗 (仅流程模板生效) ===================== */}
      {isSimulationOpen && !isNormal && (
        <ProcessFlowSimulationModal
          templateName={templateName}
          versionCode={currentVersion.versionCode}
          widgets={widgets}
          flowNodes={flowNodes}
          formConfig={formConfig}
          onClose={() => setIsSimulationOpen(false)}
        />
      )}

      {/* ===================== 全局反馈 Toast 浮条 (支持转圈保存中与保存成功) ===================== */}
      {designerToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2.5 border border-slate-700/80 pointer-events-none">
          {designerToast.type === 'loading' && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
          )}
          {designerToast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {designerToast.type === 'info' && (
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-100">{designerToast.message}</span>
        </div>
      )}
    </div>
  );
};
