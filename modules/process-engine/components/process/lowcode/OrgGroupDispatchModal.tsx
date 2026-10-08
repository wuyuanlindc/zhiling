/**
 * 知了网评 - 配置下发组织节点/群组弹窗 (OrgGroupDispatchModal)
 * 严格按照用户需求与设计截图 1:1 实现：
 * 1. 顶部统计横幅：账号总数 1280、可用账号人数 1100、已选网评员人数 48 人、提示条
 * 2. 四列并行工作台：
 *    - 第一列：队伍成员 (直接选择网评员进行下发，带姓名首字头像、正常状态、手机号、勾选框)
 *    - 第二列：组织节点 (外部协同与协助单位组织节点，树形节点展开、[转]转办徽章、最多人输入框与总人数)
 *    - 第三列：用户群组 (网评员属性分类与能力标签，骨干/核心/普通/党员/应急/青年群组卡片与人数胶囊)
 *    - 第四列：已选择用户 (48人计数、组织节点转办人次: 140人指示条、搜索、双标签卡片、查看与移除)
 * 3. 底部操作栏：当前已锁定人数、取消与【确认选择并应用】按钮
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  X, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  AlertCircle, 
  Eye, 
  Building2, 
  Tag, 
  CheckCircle2,
  Info
} from 'lucide-react';

export interface DispatchPersonnelItem {
  id: string;
  name: string;
  phone: string;
  avatarText: string;
  avatarBg: string;
  orgName: string;
  groupName: string;
  status: string;
  roleTag?: string;
  duty?: string;
}

export type DispatchSelectedItem = DispatchPersonnelItem;

// 48 位预置标准网评宣传员数据（对标截图）
export const MOCK_48_MEMBERS: DispatchPersonnelItem[] = [
  { id: 'u1', name: '齐杰', phone: '13110001000', avatarText: '齐', avatarBg: 'bg-[#107c41]', orgName: '政治部宣传处', groupName: '骨干网评员', status: '正常', roleTag: '骨干专员', duty: '负责重点涉稳舆论正向跟帖发声与网评矩阵统筹' },
  { id: 'u2', name: '石泉', phone: '13510731137', avatarText: '石', avatarBg: 'bg-[#1a73e8]', orgName: '咸阳市宣传支援组', groupName: '核心网评员', status: '正常', roleTag: '协同联络', duty: '跨地市网络宣传支援与重大突发事件联合引导' },
  { id: 'u3', name: '李明', phone: '13611461274', avatarText: '李', avatarBg: 'bg-[#5c4ce6]', orgName: '舆情应对指挥组', groupName: '普通网评员', status: '正常', roleTag: '应急专员', duty: '舆情态势研判报送与主流媒体互动发声' },
  { id: 'u4', name: '陈红', phone: '13812191411', avatarText: '陈', avatarBg: 'bg-[#e11d48]', orgName: '成都市网评工作专班', groupName: '党员先锋队', status: '正常', roleTag: '先锋模范', duty: '党员骨干带头响应与重大主题专栏宣介' },
  { id: 'u5', name: '刘洋', phone: '13912921548', avatarText: '刘', avatarBg: 'bg-[#ea580c]', orgName: '第一师政法宣传组', groupName: '应急举报组', status: '正常', roleTag: '法治宣传', duty: '不良有害违规信息监测举报与权威辟谣释法' },
  { id: 'u6', name: '孙博', phone: '15013651685', avatarText: '孙', avatarBg: 'bg-[#0d9488]', orgName: '渝中区网络宣传队', groupName: '青年突击队', status: '正常', roleTag: '新媒体专员', duty: '青年网感表达、短视频置顶发声与热点答疑' },
  { id: 'u7', name: '王强', phone: '15114381822', avatarText: '王', avatarBg: 'bg-[#7c3aed]', orgName: '综合调研联络处', groupName: '骨干网评员', status: '正常', roleTag: '调研督导', duty: '网评效果评估与回执闭环跟踪' },
  { id: 'u8', name: '刘波', phone: '15215091959', avatarText: '刘', avatarBg: 'bg-[#2563eb]', orgName: '网络舆情应急处置中心', groupName: '核心网评员', status: '正常', roleTag: '快速反应', duty: '突发事件小时级正向发声引导' },
  { id: 'u9', name: '赵敏', phone: '15316202096', avatarText: '赵', avatarBg: 'bg-[#d97706]', orgName: '陕西省委网信办', groupName: '党员先锋队', status: '正常', roleTag: '省直联络', duty: '省委网信办督导指令极速下达' },
  { id: 'u10', name: '周涛', phone: '15517312233', avatarText: '周', avatarBg: 'bg-[#0284c7]', orgName: '西安市网信协调组', groupName: '普通网评员', status: '正常', roleTag: '属地统筹', duty: '市属高校与重点企业网评联动' },
  { id: 'u11', name: '吴磊', phone: '15618422370', avatarText: '吴', avatarBg: 'bg-[#059669]', orgName: '四川省委网信办', groupName: '青年突击队', status: '正常', roleTag: '省属协同', duty: '川陕联动协作网评专员' },
  { id: 'u12', name: '郑华', phone: '15819532507', avatarText: '郑', avatarBg: 'bg-[#f43f5e]', orgName: '重庆市委网信办', groupName: '应急举报组', status: '正常', roleTag: '成渝协同', duty: '重点敏感言论排查与合规处置' },
  { id: 'u13', name: '钱学森', phone: '15920642644', avatarText: '钱', avatarBg: 'bg-[#4f46e5]', orgName: '新疆维吾尔自治区网信办', groupName: '骨干网评员', status: '正常', roleTag: '边疆联络', duty: '正面宣传引导与民族团结发声' },
  { id: 'u14', name: '冯晓峰', phone: '13021752781', avatarText: '冯', avatarBg: 'bg-[#107c41]', orgName: '甘肃省委网信办联络处', groupName: '核心网评员', status: '正常', roleTag: '西北协同', duty: '西北五省网络宣传联合共进' },
  { id: 'u15', name: '蒋文洁', phone: '13232862918', avatarText: '蒋', avatarBg: 'bg-[#1a73e8]', orgName: '青海省委网信办联络站', groupName: '党员先锋队', status: '正常', roleTag: '网宣尖兵', duty: '生态文明专题舆论正面引导' },
  { id: 'u16', name: '沈海林', phone: '13343973055', avatarText: '沈', avatarBg: 'bg-[#5c4ce6]', orgName: '延安市红色网宣专班', groupName: '应急举报组', status: '正常', roleTag: '红色专班', duty: '红色革命历史正向弘扬与辟谣' },
  { id: 'u17', name: '韩雪梅', phone: '13454083192', avatarText: '韩', avatarBg: 'bg-[#e11d48]', orgName: '绵阳市宣传联络分队', groupName: '青年突击队', status: '正常', roleTag: '科技城发声', duty: '科技创新宣传网评阵地运营' },
  { id: 'u18', name: '杨光', phone: '13765193329', avatarText: '杨', avatarBg: 'bg-[#ea580c]', orgName: '政治部宣传处', groupName: '骨干网评员', status: '正常', roleTag: '政宣骨干', duty: '政策权威解读与正面传播' },
  { id: 'u19', name: '朱德利', phone: '13876203466', avatarText: '朱', avatarBg: 'bg-[#0d9488]', orgName: '咸阳市宣传支援组', groupName: '核心网评员', status: '正常', roleTag: '属地联络', duty: '咸阳区域网络舆情跟踪与处置' },
  { id: 'u20', name: '秦立新', phone: '13987313503', avatarText: '秦', avatarBg: 'bg-[#7c3aed]', orgName: '舆情应对指挥组', groupName: '普通网评员', status: '正常', roleTag: '信息研判', duty: '每日热点舆情提炼' },
  { id: 'u21', name: '尤思成', phone: '14598423640', avatarText: '尤', avatarBg: 'bg-[#2563eb]', orgName: '成都市网评工作专班', groupName: '党员先锋队', status: '正常', roleTag: '成都分中心', duty: '文旅与政务矩阵正面扩散' },
  { id: 'u22', name: '许晓东', phone: '14709533777', avatarText: '许', avatarBg: 'bg-[#d97706]', orgName: '第一师政法宣传组', groupName: '应急举报组', status: '正常', roleTag: '法律把关', duty: '涉法舆论风险合规审查' },
  { id: 'u23', name: '何天明', phone: '15020643814', avatarText: '何', avatarBg: 'bg-[#0284c7]', orgName: '渝中区网络宣传队', groupName: '青年突击队', status: '正常', roleTag: '新青年', duty: '青年自媒体达人联络员' },
  { id: 'u24', name: '吕建军', phone: '15131753951', avatarText: '吕', avatarBg: 'bg-[#059669]', orgName: '综合调研联络处', groupName: '骨干网评员', status: '正常', roleTag: '督察考核', duty: '下发任务完成时效考核' },
  { id: 'u25', name: '施凯', phone: '15242864088', avatarText: '施', avatarBg: 'bg-[#f43f5e]', orgName: '网络舆情应急处置中心', groupName: '核心网评员', status: '正常', roleTag: '应急处置', duty: '极速跟进负面评论引导' },
  { id: 'u26', name: '张文博', phone: '15353974125', avatarText: '张', avatarBg: 'bg-[#4f46e5]', orgName: '陕西省委网信办', groupName: '党员先锋队', status: '正常', roleTag: '政策处室', duty: '省际网信工作专项协调' },
  { id: 'u27', name: '孔维祥', phone: '15564084262', avatarText: '孔', avatarBg: 'bg-[#107c41]', orgName: '西安市网信协调组', groupName: '普通网评员', status: '正常', roleTag: '古城网宣', duty: '城市重大活动网络安保' },
  { id: 'u28', name: '曹雨萱', phone: '15675194399', avatarText: '曹', avatarBg: 'bg-[#1a73e8]', orgName: '四川省委网信办', groupName: '青年突击队', status: '正常', roleTag: '川蜀新声', duty: '青年网民情感互动交流' },
  { id: 'u29', name: '严振华', phone: '15786204436', avatarText: '严', avatarBg: 'bg-[#5c4ce6]', orgName: '重庆市委网信办', groupName: '应急举报组', status: '正常', roleTag: '山城哨点', duty: '网络水军与恶意炒作举报' },
  { id: 'u30', name: '华少宇', phone: '15897314573', avatarText: '华', avatarBg: 'bg-[#e11d48]', orgName: '新疆维吾尔自治区网信办', groupName: '骨干网评员', status: '正常', roleTag: '天山卫士', duty: '多语种网络正面舆论引导' },
  { id: 'u31', name: '金晨阳', phone: '15908424610', avatarText: '金', avatarBg: 'bg-[#ea580c]', orgName: '甘肃省委网信办联络处', groupName: '核心网评员', status: '正常', roleTag: '丝路宣传', duty: '文旅辟谣与权威通报首发' },
  { id: 'u32', name: '魏长春', phone: '16619534747', avatarText: '魏', avatarBg: 'bg-[#0d9488]', orgName: '青海省委网信办联络站', groupName: '党员先锋队', status: '正常', roleTag: '高原网宣', duty: '三江源绿色生态宣传引导' },
  { id: 'u33', name: '陶明德', phone: '16720644884', avatarText: '陶', avatarBg: 'bg-[#7c3aed]', orgName: '延安市红色网宣专班', groupName: '应急举报组', status: '正常', roleTag: '革命老区', duty: '红色正能量全网跟评' },
  { id: 'u34', name: '姜一帆', phone: '17031754921', avatarText: '姜', avatarBg: 'bg-[#2563eb]', orgName: '绵阳市宣传联络分队', groupName: '青年突击队', status: '正常', roleTag: '军工网评', duty: '国防科普宣传与爱国发声' },
  { id: 'u35', name: '戚继伟', phone: '17142865058', avatarText: '戚', avatarBg: 'bg-[#d97706]', orgName: '政治部宣传处', groupName: '骨干网评员', status: '正常', roleTag: '宣传干事', duty: '先进典型事迹挖掘推介' },
  { id: 'u36', name: '谢天笑', phone: '17253975195', avatarText: '谢', avatarBg: 'bg-[#0284c7]', orgName: '咸阳市宣传支援组', groupName: '核心网评员', status: '正常', roleTag: '舆论反制', duty: '不实虚假信息联合核查' },
  { id: 'u37', name: '邹凯明', phone: '17364085232', avatarText: '邹', avatarBg: 'bg-[#059669]', orgName: '舆情应对指挥组', groupName: '普通网评员', status: '正常', roleTag: '数据监测', duty: '热搜榜单与转评赞监测' },
  { id: 'u38', name: '喻国明', phone: '17575195369', avatarText: '喻', avatarBg: 'bg-[#f43f5e]', orgName: '成都市网评工作专班', groupName: '党员先锋队', status: '正常', roleTag: '专家顾问', duty: '突发事件传播学理论分析' },
  { id: 'u39', name: '柏林峰', phone: '17686205406', avatarText: '柏', avatarBg: 'bg-[#4f46e5]', orgName: '第一师政法宣传组', groupName: '应急举报组', status: '正常', roleTag: '政法先锋', duty: '司法公开与公正发声' },
  { id: 'u40', name: '水均益', phone: '17797315543', avatarText: '水', avatarBg: 'bg-[#107c41]', orgName: '渝中区网络宣传队', groupName: '青年突击队', status: '正常', roleTag: '深度评论', duty: '重大国际与民生热点评论' },
  { id: 'u41', name: '窦文涛', phone: '17808425680', avatarText: '窦', avatarBg: 'bg-[#1a73e8]', orgName: '综合调研联络处', groupName: '骨干网评员', status: '正常', roleTag: '圆桌评议', duty: '理性和平交流氛围营造' },
  { id: 'u42', name: '章子怡', phone: '18019535717', avatarText: '章', avatarBg: 'bg-[#5c4ce6]', orgName: '网络舆情应急处置中心', groupName: '核心网评员', status: '正常', roleTag: '文艺网宣', duty: '文娱行业网络清朗专项行动' },
  { id: 'u43', name: '云飞扬', phone: '18120645854', avatarText: '云', avatarBg: 'bg-[#e11d48]', orgName: '陕西省委网信办', groupName: '党员先锋队', status: '正常', roleTag: '三秦网宣', duty: '陕西高质量发展网宣矩阵' },
  { id: 'u44', name: '苏东坡', phone: '18231755991', avatarText: '苏', avatarBg: 'bg-[#ea580c]', orgName: '西安市网信协调组', groupName: '普通网评员', status: '正常', roleTag: '文史网评', duty: '传统文化赋能新媒体网评' },
  { id: 'u45', name: '潘安', phone: '18342866028', avatarText: '潘', avatarBg: 'bg-[#0d9488]', orgName: '四川省委网信办', groupName: '青年突击队', status: '正常', roleTag: '青年智囊', duty: '青年群体意见领袖联动' },
  { id: 'u46', name: '葛天师', phone: '18453976165', avatarText: '葛', avatarBg: 'bg-[#7c3aed]', orgName: '重庆市委网信办', groupName: '应急举报组', status: '正常', roleTag: '清网卫士', duty: '网络黑公关阻击与取证' },
  { id: 'u47', name: '奚美娟', phone: '18564086202', avatarText: '奚', avatarBg: 'bg-[#2563eb]', orgName: '新疆维吾尔自治区网信办', groupName: '骨干网评员', status: '正常', roleTag: '温暖发声', duty: '民生故事与正能量跟评' },
  { id: 'u48', name: '范仲淹', phone: '18675196339', avatarText: '范', avatarBg: 'bg-[#d97706]', orgName: '甘肃省委网信办联络处', groupName: '核心网评员', status: '正常', roleTag: '忧乐先锋', duty: '社情民意收集与正向化解' }
];

export const DEFAULT_DISPATCH_PERSONNEL = MOCK_48_MEMBERS;

// 组织节点树结构定义
export interface OrgTreeNode {
  id: string;
  name: string;
  hasTransfer: boolean; // 是否带蓝色[转]字徽章
  quota: number | string; // 当前设定的下发转办人次
  totalCount: number; // 节点总人数 (如 180人)
  children?: OrgTreeNode[];
}

export const INITIAL_ORG_TREE: OrgTreeNode[] = [
  {
    id: 'org_shanxi',
    name: '陕西省委网信办',
    hasTransfer: true,
    quota: 180,
    totalCount: 180,
    children: [
      { id: 'org_xian', name: '西安市网信协调组', hasTransfer: true, quota: 90, totalCount: 90 },
      { id: 'org_xianyang', name: '咸阳市宣传支援组', hasTransfer: true, quota: 50, totalCount: 50 },
      { id: 'org_yanan', name: '延安市红色网宣专班', hasTransfer: false, quota: '', totalCount: 40 }
    ]
  },
  {
    id: 'org_sichuan',
    name: '四川省委网信办',
    hasTransfer: true,
    quota: '',
    totalCount: 160,
    children: [
      { id: 'org_chengdu', name: '成都市网评工作专班', hasTransfer: true, quota: '', totalCount: 90 },
      { id: 'org_mianyang', name: '绵阳市宣传联络分队', hasTransfer: false, quota: '', totalCount: 70 }
    ]
  },
  {
    id: 'org_chongqing',
    name: '重庆市委网信办',
    hasTransfer: true,
    quota: '',
    totalCount: 120
  },
  {
    id: 'org_gansu',
    name: '甘肃省委网信办联络处',
    hasTransfer: true,
    quota: '',
    totalCount: 90
  },
  {
    id: 'org_qinghai',
    name: '青海省委网信办联络站',
    hasTransfer: false,
    quota: '',
    totalCount: 85
  },
  {
    id: 'org_xinjiang',
    name: '新疆维吾尔自治区网信办',
    hasTransfer: true,
    quota: '',
    totalCount: 110
  }
];

// 用户群组卡片定义
export interface UserGroupCard {
  id: string;
  name: string;
  count: number;
  desc: string;
  colorType: 'emerald' | 'blue' | 'slate' | 'rose' | 'amber' | 'cyan';
}

export const INITIAL_USER_GROUPS: UserGroupCard[] = [
  { id: 'grp_backbone', name: '骨干网评员', count: 85, desc: '政治素质过硬、发声引导力强', colorType: 'emerald' },
  { id: 'grp_core', name: '核心网评员', count: 142, desc: '日常高频发声、积极参与任务', colorType: 'blue' },
  { id: 'grp_regular', name: '普通网评员', count: 320, desc: '基础下发受众、普及覆盖广', colorType: 'slate' },
  { id: 'grp_party', name: '党员先锋队', count: 68, desc: '党员模范带头、急难险重发声', colorType: 'rose' },
  { id: 'grp_emergency', name: '应急举报组', count: 45, desc: '快速处置不良信息、重点举报', colorType: 'amber' },
  { id: 'grp_youth', name: '青年突击队', count: 56, desc: '青年骨干矩阵、网感敏锐', colorType: 'cyan' }
];

interface OrgGroupDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems?: any[];
  onConfirm: (items: any[]) => void;
}

export const OrgGroupDispatchModal: React.FC<OrgGroupDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedItems = [],
  onConfirm
}) => {
  // 1. 第一列：队伍成员勾选状态与搜索
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(() => {
    // 默认全选预置的 48 位网评员（严格契合截图）
    return new Set(MOCK_48_MEMBERS.map(m => m.id));
  });

  // 2. 第二列：组织节点勾选、展开与配额
  const [orgSearch, setOrgSearch] = useState('');
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({
    org_shanxi: true,
    org_sichuan: true
  });
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(
    new Set(['org_shanxi', 'org_xian', 'org_xianyang'])
  );
  const [orgQuotas, setOrgQuotas] = useState<Record<string, number | string>>({
    org_shanxi: 180,
    org_xian: 90,
    org_xianyang: 50
  });

  // 3. 第三列：用户群组勾选与搜索
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(['grp_backbone', 'grp_core'])
  );

  // 4. 第四列：已选人员筛选搜索与详情浮层
  const [selectedUserSearch, setSelectedUserSearch] = useState('');
  const [viewingUser, setViewingUser] = useState<DispatchPersonnelItem | null>(null);
  const [showDetailPopover, setShowDetailPopover] = useState(false);
  const [showAccountListNotice, setShowAccountListNotice] = useState(false);

  // 初始化与外部同步
  React.useEffect(() => {
    if (isOpen) {
      if (Array.isArray(selectedItems) && selectedItems.length > 0) {
        const idSet = new Set<string>();
        selectedItems.forEach((item: any) => {
          if (item?.id) idSet.add(item.id);
        });
        setSelectedMemberIds(idSet);
      } else {
        // 默认载入截图呈现的 48 名人员
        setSelectedMemberIds(new Set(MOCK_48_MEMBERS.map(m => m.id)));
      }
    }
  }, [isOpen, selectedItems]);

  if (!isOpen) return null;

  // 过滤后的队伍成员
  const filteredMembers = MOCK_48_MEMBERS.filter(m => {
    if (!memberSearch) return true;
    const kw = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(kw) || m.phone.includes(kw);
  });

  // 过滤后的组织节点树
  const filteredOrgTree = INITIAL_ORG_TREE.filter(org => {
    if (!orgSearch) return true;
    const kw = orgSearch.toLowerCase();
    if (org.name.toLowerCase().includes(kw)) return true;
    if (org.children && org.children.some(c => c.name.toLowerCase().includes(kw))) return true;
    return false;
  });

  // 过滤后的用户群组
  const filteredGroups = INITIAL_USER_GROUPS.filter(g => {
    if (!groupSearch) return true;
    const kw = groupSearch.toLowerCase();
    return g.name.toLowerCase().includes(kw) || g.desc.toLowerCase().includes(kw);
  });

  // 当前已选人员对象列表
  const selectedMembersList = MOCK_48_MEMBERS.filter(m => selectedMemberIds.has(m.id));

  // 经过第四列搜索过滤的已选人员
  const filteredSelectedList = selectedMembersList.filter(m => {
    if (!selectedUserSearch) return true;
    const kw = selectedUserSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(kw) ||
      m.phone.includes(kw) ||
      m.orgName.toLowerCase().includes(kw) ||
      m.groupName.toLowerCase().includes(kw)
    );
  });

  // 切换单个队伍成员选择
  const handleToggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全选队伍成员
  const handleSelectAllMembers = () => {
    setSelectedMemberIds(new Set(MOCK_48_MEMBERS.map(m => m.id)));
  };

  // 清空队伍成员
  const handleClearMembers = () => {
    setSelectedMemberIds(new Set());
  };

  // 切换组织节点选择
  const handleToggleOrg = (orgId: string, node?: OrgTreeNode) => {
    setSelectedOrgIds(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
        // 如果是父节点，递归取消子节点
        if (node?.children) {
          node.children.forEach(c => next.delete(c.id));
        }
      } else {
        next.add(orgId);
        // 如果是父节点，递归勾选子节点
        if (node?.children) {
          node.children.forEach(c => next.add(c.id));
        }
      }
      return next;
    });
  };

  // 切换组织节点折叠
  const handleToggleExpandOrg = (orgId: string) => {
    setExpandedOrgs(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  // 切换用户群组选择
  const handleToggleGroup = (grpId: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(grpId)) {
        next.delete(grpId);
      } else {
        next.add(grpId);
      }
      return next;
    });
  };

  // 从已选列表中移除单个
  const handleRemoveSelectedUser = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // 清空全部已选
  const handleClearAllSelected = () => {
    setSelectedMemberIds(new Set());
  };

  // 确认应用选择
  const handleConfirm = () => {
    onConfirm(selectedMembersList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[1360px] h-[92vh] max-h-[880px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================= 模态框顶栏 (Title Bar) ======================= */}
        <div className="h-13 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>配置下发组织节点/群组</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="关闭弹窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================= 顶部暖黄统计指示条 (Notice Bar) ======================= */}
        <div className="px-5 pt-3.5 pb-2 shrink-0">
          <div className="bg-[#fef9f0] border border-[#fde8c5] rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs shadow-2xs">
            {/* 左侧三大统计指标 */}
            <div className="flex items-center gap-3 text-slate-700 flex-wrap">
              <div 
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                onClick={() => setShowAccountListNotice(true)}
              >
                <Users className="w-4 h-4 text-amber-500" />
                <span>账号总数:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">1280</span>
              </div>

              <span className="text-amber-200 select-none">|</span>

              <div 
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                onClick={() => setShowAccountListNotice(true)}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>可用账号人数:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">1100</span>
              </div>

              <span className="text-amber-200 select-none">|</span>

              <div className="flex items-center gap-1.5">
                <span>已选网评员人数:</span>
                <span className="px-2 py-0.5 rounded bg-[#ebfbf3] text-[#10b981] border border-[#a7f3d0] font-bold text-xs font-mono">
                  {selectedMemberIds.size} 人
                </span>
              </div>
            </div>

            {/* 右侧浮窗调出指引提示 */}
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>点击各区域人数或标签徽章可直接调出【账号列表】浮窗</span>
            </div>
          </div>
        </div>

        {/* ======================= 主体四列工作台 (4 Columns Grid) ======================= */}
        <div className="flex-1 min-h-0 px-5 pb-3 pt-1 grid grid-cols-4 gap-3.5">
          {/* ---------------- 第一列：队伍成员 ---------------- */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs">
            {/* 列头部 */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#ebfbf3] text-[#10b981] flex items-center justify-center shrink-0 border border-[#bbf0d2]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">队伍成员</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">直接选择网评员进行下发</p>
                </div>
              </div>
              <div className="flex items-center text-xs shrink-0 select-none">
                <button
                  type="button"
                  onClick={handleSelectAllMembers}
                  className="text-[#10b981] hover:underline font-medium cursor-pointer"
                >
                  全选
                </button>
                <span className="text-slate-300 mx-1">/</span>
                <button
                  type="button"
                  onClick={handleClearMembers}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 搜索栏 */}
            <div className="px-3 pt-2.5 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="搜索网评员姓名/手机号..."
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 成员纵向滚动列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-1 space-y-1">
              {filteredMembers.map(member => {
                const isChecked = selectedMemberIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* 单字圆形头像 */}
                      <div className={`w-8 h-8 rounded-full ${member.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                        {member.avatarText}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">{member.name}</span>
                          <span className="px-1 py-0.2 rounded bg-[#ebfbf3] text-[#10b981] border border-[#a7f3d0] text-[10px] font-medium shrink-0">
                            {member.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                          {member.phone}
                        </div>
                      </div>
                    </div>

                    {/* 右侧复选框 */}
                    <div className="shrink-0">
                      <div className={`w-4 h-4 rounded transition-all flex items-center justify-center ${
                        isChecked 
                          ? 'bg-[#10b981] text-white shadow-2xs' 
                          : 'border border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- 第二列：组织节点 ---------------- */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs">
            {/* 列头部 */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0 border border-[#bfdbfe]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">组织节点</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">外部协同与协助单位组织节点</p>
                </div>
              </div>
              <div className="flex items-center text-xs shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = new Set<string>();
                    INITIAL_ORG_TREE.forEach(node => {
                      allIds.add(node.id);
                      if (node.children) node.children.forEach(c => allIds.add(c.id));
                    });
                    setSelectedOrgIds(allIds);
                  }}
                  className="text-[#10b981] hover:underline font-medium cursor-pointer"
                >
                  全选
                </button>
                <span className="text-slate-300 mx-1">/</span>
                <button
                  type="button"
                  onClick={() => setSelectedOrgIds(new Set())}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 搜索栏 */}
            <div className="px-3 pt-2.5 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="搜索组织节点名称..."
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 树形组织节点列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-1 space-y-1 text-xs">
              {filteredOrgTree.map(org => {
                const isExpanded = !!expandedOrgs[org.id];
                const isOrgChecked = selectedOrgIds.has(org.id);
                const hasChildren = org.children && org.children.length > 0;
                const quotaVal = orgQuotas[org.id] !== undefined ? orgQuotas[org.id] : org.quota;

                return (
                  <div key={org.id} className="space-y-1">
                    {/* 一级父节点行 */}
                    <div className="p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-1 group transition-colors">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* 展开/收起箭头 */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => handleToggleExpandOrg(org.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}

                        {/* 复选框 */}
                        <div
                          onClick={() => handleToggleOrg(org.id, org)}
                          className={`w-4 h-4 rounded transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                            isOrgChecked 
                              ? 'bg-[#10b981] text-white shadow-2xs' 
                              : 'border border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        >
                          {isOrgChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* 组织名称 */}
                        <span 
                          onClick={() => handleToggleOrg(org.id, org)}
                          className="font-bold text-slate-800 truncate cursor-pointer text-xs"
                          title={org.name}
                        >
                          {org.name}
                        </span>

                        {/* 蓝色 [转] 字徽章 */}
                        {org.hasTransfer && (
                          <span className="w-4 h-4 rounded bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            转
                          </span>
                        )}
                      </div>

                      {/* 右侧转办配额输入框与总人数 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          value={quotaVal}
                          onChange={e => setOrgQuotas(prev => ({ ...prev, [org.id]: e.target.value }))}
                          placeholder="最多人..."
                          className={`w-13 h-6 px-1 text-center font-mono text-xs rounded outline-none transition-all ${
                            isOrgChecked && quotaVal !== ''
                              ? 'border border-blue-400 bg-blue-50/50 text-blue-700 font-bold'
                              : 'border border-slate-200 bg-white text-slate-500 placeholder:text-slate-300'
                          }`}
                        />
                        <span className="text-slate-400 text-xs font-mono min-w-9 text-right">
                          {org.totalCount}人
                        </span>
                      </div>
                    </div>

                    {/* 二级子节点列表 */}
                    {hasChildren && isExpanded && (
                      <div className="pl-6 space-y-1 border-l border-slate-100 ml-3">
                        {org.children!.map(sub => {
                          const isSubChecked = selectedOrgIds.has(sub.id);
                          const subQuotaVal = orgQuotas[sub.id] !== undefined ? orgQuotas[sub.id] : sub.quota;

                          return (
                            <div 
                              key={sub.id}
                              className="p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-1 group transition-colors"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <div
                                  onClick={() => handleToggleOrg(sub.id)}
                                  className={`w-4 h-4 rounded transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                                    isSubChecked 
                                      ? 'bg-[#10b981] text-white shadow-2xs' 
                                      : 'border border-slate-300 bg-white hover:border-slate-400'
                                  }`}
                                >
                                  {isSubChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>

                                <span 
                                  onClick={() => handleToggleOrg(sub.id)}
                                  className="text-slate-700 truncate cursor-pointer text-xs"
                                  title={sub.name}
                                >
                                  {sub.name}
                                </span>

                                {sub.hasTransfer && (
                                  <span className="w-4 h-4 rounded bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    转
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="text"
                                  value={subQuotaVal}
                                  onChange={e => setOrgQuotas(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                  placeholder="最多人..."
                                  className={`w-13 h-6 px-1 text-center font-mono text-xs rounded outline-none transition-all ${
                                    isSubChecked && subQuotaVal !== ''
                                      ? 'border border-blue-400 bg-blue-50/50 text-blue-700 font-bold'
                                      : 'border border-slate-200 bg-white text-slate-500 placeholder:text-slate-300'
                                  }`}
                                />
                                <span className="text-slate-400 text-xs font-mono min-w-9 text-right">
                                  {sub.totalCount}人
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- 第三列：用户群组 ---------------- */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs">
            {/* 列头部 */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center shrink-0 border border-[#e9d5ff]">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">用户群组</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">网评员属性分类与能力标签</p>
                </div>
              </div>
              <div className="flex items-center text-xs shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedGroupIds(new Set(INITIAL_USER_GROUPS.map(g => g.id)))}
                  className="text-[#10b981] hover:underline font-medium cursor-pointer"
                >
                  全选
                </button>
                <span className="text-slate-300 mx-1">/</span>
                <button
                  type="button"
                  onClick={() => setSelectedGroupIds(new Set())}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 搜索栏 */}
            <div className="px-3 pt-2.5 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  placeholder="搜索群组标签..."
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 群组卡片列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-1 space-y-2">
              {filteredGroups.map(grp => {
                const isGrpChecked = selectedGroupIds.has(grp.id);

                return (
                  <div
                    key={grp.id}
                    onClick={() => handleToggleGroup(grp.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isGrpChecked
                        ? 'border-[#a7f3d0] bg-[#f2fdf7] shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded transition-all flex items-center justify-center shrink-0 ${
                          isGrpChecked 
                            ? 'bg-[#10b981] text-white shadow-2xs' 
                            : 'border border-slate-300 bg-white hover:border-slate-400'
                        }`}>
                          {isGrpChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{grp.name}</span>
                      </div>

                      {/* 右侧人数胶囊徽章 */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 border ${
                        grp.colorType === 'emerald'
                          ? 'bg-[#ebfbf3] text-[#10b981] border-[#a7f3d0]'
                          : grp.colorType === 'blue'
                          ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                          : grp.colorType === 'rose'
                          ? 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]'
                          : grp.colorType === 'amber'
                          ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]'
                          : grp.colorType === 'cyan'
                          ? 'bg-[#ecfeff] text-[#0891b2] border-[#a5f3fc]'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {grp.count} 人
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1.5 pl-6 line-clamp-1">
                      {grp.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- 第四列：已选择用户 ---------------- */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs">
            {/* 列头部 */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#ebfbf3] text-[#10b981] flex items-center justify-center shrink-0 border border-[#bbf0d2]">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex items-center gap-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">已选择用户</h4>
                      <span className="w-5 h-4.5 rounded-full bg-[#10b981] text-white text-[10px] font-bold font-mono flex items-center justify-center">
                        {selectedMemberIds.size}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">已勾选网评人员名单</p>
                  </div>
                </div>
              </div>

              {/* 清空全部 */}
              <button
                type="button"
                onClick={handleClearAllSelected}
                className="text-rose-500 hover:text-rose-600 text-xs font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空全部</span>
              </button>
            </div>

            {/* 组织节点转办人次统计条 */}
            <div className="p-2.5 bg-[#f0f7ff] border-b border-[#dbeafe] flex items-center justify-between text-xs shrink-0 select-none">
              <div className="flex items-center gap-1 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1" />
                <span>组织节点转办人次:</span>
                <span className="text-blue-700 font-bold font-mono text-sm ml-0.5">140</span>
                <span>人</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailPopover(!showDetailPopover)}
                className="text-blue-600 hover:underline font-medium cursor-pointer text-xs"
              >
                查看明细 &gt;
              </button>
            </div>

            {/* 搜索已选人员 */}
            <div className="px-3 pt-2 pb-1 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={selectedUserSearch}
                  onChange={e => setSelectedUserSearch(e.target.value)}
                  placeholder="搜索已选网评员姓名/组织..."
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 一页显示提示 */}
            <div className="px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 shrink-0">
              <span>一页显示前 {filteredSelectedList.length} 位人员</span>
              <button
                type="button"
                onClick={() => setSelectedUserSearch('')}
                className="text-[#10b981] hover:underline font-medium cursor-pointer"
              >
                查看完整清单 ({selectedMemberIds.size})
              </button>
            </div>

            {/* 已选人员纵向卡片列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-1.5 space-y-1.5">
              {filteredSelectedList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  暂无匹配的已选网评人员
                </div>
              ) : (
                filteredSelectedList.map(member => (
                  <div
                    key={member.id}
                    className="p-2.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 flex items-center justify-between gap-2 shadow-2xs transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* 单字圆形头像 */}
                      <div className={`w-8 h-8 rounded-full ${member.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                        {member.avatarText}
                      </div>

                      <div className="min-w-0">
                        {/* 姓名与手机 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{member.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">{member.phone}</span>
                        </div>

                        {/* 双色标签：单位与群组 */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium truncate max-w-28">
                            {member.orgName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium truncate max-w-24">
                            {member.groupName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧查看详情与移除按钮 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingUser(member)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="查看人员详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedUser(member.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="移除此人员"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ======================= 模态框底部确认栏 (Footer) ======================= */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            <span>当前已锁定: </span>
            <strong className="text-[#10b981] font-bold font-mono text-base ml-1 mr-1">
              {selectedMemberIds.size}
            </strong>
            <span> 名宣传网评人员</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium cursor-pointer shadow-2xs transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#065f46] hover:bg-[#044e39] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>确认选择并应用 ({selectedMemberIds.size}人)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================= 转办人次明细气泡浮层 ======================= */}
      {showDetailPopover && (
        <div 
          className="fixed inset-0 z-60 bg-black/20 flex items-center justify-center p-4"
          onClick={() => setShowDetailPopover(false)}
        >
          <div 
            className="w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>组织节点转办人次明细 (共 140 人次)</span>
              </h5>
              <button 
                type="button" 
                onClick={() => setShowDetailPopover(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex justify-between font-bold text-blue-900">
                  <span>陕西省委网信办</span>
                  <span className="font-mono">140 人次配额</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 pl-2 border-l-2 border-blue-400">
                  <div className="flex justify-between">
                    <span>· 西安市网信协调组</span>
                    <span className="font-mono font-semibold text-blue-700">90 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>· 咸阳市宣传支援组</span>
                    <span className="font-mono font-semibold text-blue-700">50 人</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                组织转办人次由指定协同节点的负责人二次分解，下发至直属各区县与专班团队。
              </p>
            </div>
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setShowDetailPopover(false)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 人员详情查看浮层 ======================= */}
      {viewingUser && (
        <div 
          className="fixed inset-0 z-60 bg-black/20 flex items-center justify-center p-4"
          onClick={() => setViewingUser(null)}
        >
          <div 
            className="w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${viewingUser.avatarBg} text-white font-bold text-sm flex items-center justify-center`}>
                  {viewingUser.avatarText}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{viewingUser.name}</h4>
                  <p className="text-xs font-mono text-slate-400">{viewingUser.phone}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">所属组织</span>
                <span className="font-medium text-slate-800">{viewingUser.orgName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">能力群组</span>
                <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {viewingUser.groupName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">账号状态</span>
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {viewingUser.status}
                </span>
              </div>
              {viewingUser.duty && (
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">履职专项职责</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 leading-relaxed text-[11px] border border-slate-100">
                    {viewingUser.duty}
                  </p>
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 【账号列表】快捷说明浮层 ======================= */}
      {showAccountListNotice && (
        <div 
          className="fixed inset-0 z-60 bg-black/20 flex items-center justify-center p-4"
          onClick={() => setShowAccountListNotice(false)}
        >
          <div 
            className="w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>账号池信息提示</span>
              </h5>
              <button 
                type="button" 
                onClick={() => setShowAccountListNotice(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              当前知了网评系统共登记网评员账号 <strong>1280</strong> 个，实名活跃并处于可用状态 <strong>1100</strong> 人。当前弹窗已锁定 <strong>{selectedMemberIds.size}</strong> 名直属下发人选。
            </p>
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setShowAccountListNotice(false)}
                className="px-3 py-1 bg-amber-600 text-white rounded-md text-xs font-bold"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
