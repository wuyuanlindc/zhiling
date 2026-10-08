/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 全局页面ID注册与解析中心 (Deterministic Page ID Registry)
 * 核心规范：
 * 1. 每个页面的ID是唯一的，能够区分每一个页面。
 * 2. 页面ID一旦约定，无论什么时候点击、进入多少次，页面ID都是完全固定一致的，方便代码查找与修改。
 * 3. 记录每个页面ID对应的源码组件路径，方便开发者快速定位修改文件。
 */

export interface PageMeta {
  id: string;          // 固定的6位数字ID (如 "101007")
  name: string;        // 页面中文名称
  component: string;   // 对应的组件源码路径
  category: string;    // 所属模块/分类
  description?: string;// 页面说明
}

/**
 * 约定页面ID对照表 (Canonical Page Registry)
 * 一旦约定，不可变更，任何时候访问该页面均展示此固定ID
 */
export const PAGE_REGISTRY: Record<string, PageMeta> = {
  // -------------------------------------------------------------
  // 1. 全局一级/二级主导航菜单 (100000 系列)
  // -------------------------------------------------------------
  'dashboard': {
    id: '100001',
    name: '应用综合看板',
    component: 'src/components/Dashboard.tsx',
    category: '看板'
  },
  'menu_app_dashboard': {
    id: '100001',
    name: '应用综合看板',
    component: 'src/components/Dashboard.tsx',
    category: '看板'
  },
  'cust_org_manage_list': {
    id: '100002',
    name: '客户机构管理-机构列表',
    component: 'src/components/CustomerOrgManage.tsx',
    category: '客户机构'
  },
  'menu_cust_org_manage_list': {
    id: '100002',
    name: '客户机构管理-机构列表',
    component: 'src/components/CustomerOrgManage.tsx',
    category: '客户机构'
  },
  'apps_list': {
    id: '100003',
    name: '应用管理-应用列表',
    component: 'src/components/AppManagement.tsx',
    category: '应用管理'
  },
  'menu_app_list': {
    id: '100003',
    name: '应用管理-应用列表',
    component: 'src/components/AppManagement.tsx',
    category: '应用管理'
  },
  'apps_create_step1': {
    id: '100004',
    name: '新增应用接入-基础配置',
    component: 'src/components/AppManagement.tsx',
    category: '应用管理'
  },
  'menu_v8_user_database': {
    id: '100201',
    name: 'V8用户体系-V8用户数据库',
    component: 'src/components/V8UserDatabase.tsx',
    category: 'V8用户'
  },
  'menu_wechat_user_database': {
    id: '100202',
    name: 'V8用户体系-微信用户数据库',
    component: 'src/components/WechatUserDatabase.tsx',
    category: 'V8用户'
  },
  'menu_ext_user_app_config': {
    id: '100301',
    name: '外部用户体系-体系配置',
    component: 'src/components/ExternalUserAppConfig.tsx',
    category: '外部用户'
  },
  'menu_ext_user_dashboard': {
    id: '100302',
    name: '外部用户体系-用户数据库',
    component: 'src/components/ExternalUserDashboard.tsx',
    category: '外部用户'
  },
  'menu_app_data_dict': {
    id: '100401',
    name: '全局应用数据字典',
    component: 'src/components/AppDataDictManage.tsx',
    category: '数据字典'
  },
  'menu_process_engine_manage': {
    id: '100501',
    name: '流程与模板引擎管理',
    component: 'src/components/process/ProcessManagementPage.tsx',
    category: '流程引擎'
  },
  'menu_cms_app_register': {
    id: '100601',
    name: '全局CMS系统-CMS应用注册',
    component: 'src/components/cms/CMSAppRegister.tsx',
    category: 'CMS系统'
  },
  'menu_cms_org_manage': {
    id: '100602',
    name: '全局CMS系统-CMS机构管理',
    component: 'src/components/cms/CMSOrgManage.tsx',
    category: 'CMS系统'
  },
  'menu_cms_article_data': {
    id: '100603',
    name: '全局CMS系统-文章数据查看',
    component: 'src/components/cms/CMSArticleData.tsx',
    category: 'CMS系统'
  },
  'menu_mt_customer_org_list': {
    id: '100701',
    name: '模拟指令流转MT-客户机构列表',
    component: 'src/components/MTCustomerOrgList.tsx',
    category: '模拟流转'
  },
  'menu_mt_open_user_list': {
    id: '100702',
    name: '模拟指令流转MT-开通用户列表',
    component: 'src/components/MTOpenUserList.tsx',
    category: '模拟流转'
  },
  'menu_ext_user_default_basic_config': {
    id: '100711',
    name: '外部用户MT引用-基础配置',
    component: 'src/components/ExtUserDefaultBasicConfig.tsx',
    category: 'MT引用页'
  },
  'menu_ext_user_invitation_config_page': {
    id: '100712',
    name: '外部用户MT引用-邀请配置',
    component: 'src/components/ExtUserInvitationConfig.tsx',
    category: 'MT引用页'
  },
  'menu_ext_user_perm_dict_page': {
    id: '100713',
    name: '外部用户MT引用-权限字典',
    component: 'src/components/ExtUserPermDict.tsx',
    category: 'MT引用页'
  },
  'menu_ext_user_role_config_page': {
    id: '100714',
    name: '外部用户MT引用-角色配置',
    component: 'src/components/ExtUserRoleConfig.tsx',
    category: 'MT引用页'
  },
  'menu_ext_user_default_group_config_page': {
    id: '100715',
    name: '外部用户MT引用-群组配置',
    component: 'src/components/ExtUserDefaultGroupConfig.tsx',
    category: 'MT引用页'
  },
  'menu_ext_user_data_list_page': {
    id: '100716',
    name: '外部用户MT引用-数据列表',
    component: 'src/components/ExtUserDataList.tsx',
    category: 'MT引用页'
  },
  'menu_std_app_component_group': {
    id: '100801',
    name: '应用标准组件组',
    component: 'src/components/StandardControls.tsx',
    category: '标准组件'
  },
  'menu_std_ext_user_component_group': {
    id: '100802',
    name: '外部用户标准功能组件组',
    component: 'src/components/StdExtUserComponentGroup.tsx',
    category: '标准组件'
  },
  'ddsb_admin': {
    id: '100901',
    name: '点点速报管理端',
    component: 'src/components/ddsb/DDSBAdminView.tsx',
    category: '管理端'
  },
  'portal_entry': {
    id: '100902',
    name: '原型门户入口',
    component: 'src/components/PortalEntryView.tsx',
    category: '门户'
  },
  'menu_cust_directory': {
    id: '100903',
    name: '客户管理-客户名录',
    component: 'src/components/CustomerDirectory.tsx',
    category: '客户管理'
  },
  'menu_entity_log': {
    id: '100904',
    name: '主体维护-操作日志',
    component: 'src/components/OperationLogView.tsx',
    category: '日志'
  },
  'menu_system_settings': {
    id: '100905',
    name: '系统设置',
    component: 'src/components/SystemSettings.tsx',
    category: '设置'
  },
  'menu_message_center': {
    id: '100906',
    name: '消息中心',
    component: 'src/components/MessageCenter.tsx',
    category: '消息'
  },

  // -------------------------------------------------------------
  // 2. 单应用详情配置二级页面与各个 Tab (101000 系列 - AppCreateStep2.tsx)
  // -------------------------------------------------------------
  'tab_basic_info': {
    id: '101001',
    name: '应用详情配置-应用基本配置',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_base': {
    id: '101011',
    name: '应用基本配置-基本信息',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_login': {
    id: '101012',
    name: '应用基本配置-登录配置',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_ext_user': {
    id: '101013',
    name: '应用基本配置-外部用户配置',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_instruction': {
    id: '101014',
    name: '应用基本配置-指令流转配置',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_callback': {
    id: '101015',
    name: '应用基本配置-回调地址配置',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_basic_info_security': {
    id: '101016',
    name: '应用基本配置-安全与密钥',
    component: 'src/components/AppBasicConfigPanel.tsx',
    category: '应用配置'
  },
  'tab_analytics': {
    id: '101002',
    name: '应用详情配置-分析看板',
    component: 'src/components/AnalyticsBoard.tsx',
    category: '应用配置'
  },
  'tab_perm_dict': {
    id: '101003',
    name: '应用详情配置-权限字典',
    component: 'src/components/PermissionDictManage.tsx',
    category: '应用配置'
  },
  'tab_default_roles': {
    id: '101004',
    name: '应用详情配置-默认角色',
    component: 'src/components/DefaultRoleManage.tsx',
    category: '应用配置'
  },
  'tab_default_menus': {
    id: '101005',
    name: '应用详情配置-默认菜单',
    component: 'src/components/FrontendMenuManage.tsx',
    category: '应用配置'
  },
  'tab_data_dict': {
    id: '101006',
    name: '应用详情配置-数据字典',
    component: 'src/components/AppDataDictManage.tsx',
    category: '应用配置'
  },
  // 重点：客户机构 Tab 页面固定为 101007，无论何时何应用点击，均能确定此页面为客户机构
  'tab_customer_orgs': {
    id: '101007',
    name: '应用详情配置-客户机构',
    component: 'src/components/CustomerOrgManage.tsx',
    category: '客户机构'
  },
  'customer_orgs': {
    id: '101007',
    name: '应用详情配置-客户机构',
    component: 'src/components/CustomerOrgManage.tsx',
    category: '客户机构'
  },

  // -------------------------------------------------------------
  // 3. 客户专属应用配置页面 (101100 系列 - CustomerAppConfig.tsx)
  // 点击客户机构列表操作列“管理”按钮进入，固定专属ID，方便开发修改
  // -------------------------------------------------------------
  'customer_app_config': {
    id: '101100',
    name: '客户专属应用配置-主页',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_system_settings': {
    id: '101101',
    name: '客户应用配置-系统设置',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_system_settings': {
    id: '101101',
    name: '客户应用配置-系统设置',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_org_exclusive_service_account': {
    id: '101110',
    name: '客户应用配置-机构专属服务号',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_org_exclusive_service_account': {
    id: '101110',
    name: '客户应用配置-机构专属服务号',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_user_management': {
    id: '101102',
    name: '客户应用配置-用户管理',
    component: 'src/components/CustomerUserManage.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_user_management': {
    id: '101102',
    name: '客户应用配置-用户管理',
    component: 'src/components/CustomerUserManage.tsx',
    category: '客户应用配置'
  },
  'cust_config_menu_settings': {
    id: '101103',
    name: '客户应用配置-菜单设置',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_menu_settings': {
    id: '101103',
    name: '客户应用配置-菜单设置',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_trial_records': {
    id: '101104',
    name: '客户应用配置-试用记录',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_trial_records': {
    id: '101104',
    name: '客户应用配置-试用记录',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_op_logs': {
    id: '101105',
    name: '客户应用配置-操作日志',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_op_logs': {
    id: '101105',
    name: '客户应用配置-操作日志',
    component: 'src/components/CustomerAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_perm_dict': {
    id: '101106',
    name: '客户应用配置-权限字典',
    component: 'src/components/CustomerPermissionDictManage.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_perm_dict': {
    id: '101106',
    name: '客户应用配置-权限字典',
    component: 'src/components/CustomerPermissionDictManage.tsx',
    category: '客户应用配置'
  },
  'cust_config_role_management': {
    id: '101107',
    name: '客户应用配置-角色管理',
    component: 'src/components/UnifiedOrgRoleManageView.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_role_management': {
    id: '101107',
    name: '客户应用配置-角色管理',
    component: 'src/components/UnifiedOrgRoleManageView.tsx',
    category: '客户应用配置'
  },
  'cust_config_external_user_system': {
    id: '101108',
    name: '客户应用配置-外部用户体系配置',
    component: 'src/components/ExternalUserAppConfig.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_external_user_system': {
    id: '101108',
    name: '客户应用配置-外部用户体系配置',
    component: 'src/components/ExternalUserAppConfig.tsx',
    category: '客户应用配置'
  },
  'cust_config_org_management': {
    id: '101109',
    name: '客户应用配置-组织机构管理',
    component: 'src/components/CustomerOrgHierarchyManage.tsx',
    category: '客户应用配置'
  },
  'customer_app_config_org_management': {
    id: '101109',
    name: '客户应用配置-组织机构管理',
    component: 'src/components/CustomerOrgHierarchyManage.tsx',
    category: '客户应用配置'
  }
};

/**
 * 确定性哈希算法 (FNV-1a)
 * 针对任意传入的 key 产生完全固定且唯一的 6 位数字 (120000 ~ 899999)
 * 保证：相同的输入何时调用都返回相同的 6 位数字，绝不使用随机数！
 */
function deterministicSixDigitHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = Math.abs(hash);
  const num = 120000 + (positive % 780000);
  return String(num);
}

/**
 * 根据页面标识或上下文 key 解析约定的唯一、固定 PageMeta
 * 核心逻辑：
 * 1. 优先查阅固定约定注册表（全字匹配）；
 * 2. 匹配规则模式（如含 customer_orgs 则固定指向 101007，含 cust_config 则固定指向 101100 等）；
 * 3. 若无匹配，采用确定性哈希生成固定的 6 位数字（绝不随机！无论点击多少次都一致）。
 */
export function resolvePageMeta(rawKey?: string, title?: string): PageMeta {
  if (!rawKey) {
    return {
      id: '100001',
      name: title || '首页看板',
      component: 'src/components/Dashboard.tsx',
      category: '看板'
    };
  }

  const key = rawKey.trim();

  // 1. 精确匹配约定表
  if (PAGE_REGISTRY[key]) {
    return PAGE_REGISTRY[key];
  }

  // 2. 模式与语义匹配 (保证只要是客户机构页面，就稳定返回 101007；只要是客户配置管理，就稳定返回对应固定ID)
  const lowerKey = key.toLowerCase();

  // (a) 客户专属应用配置页面 (点击客户列表右侧“管理”进入)
  if (lowerKey.includes('cust_config') || lowerKey.includes('cust_app_config') || lowerKey.includes('customer_app_config')) {
    if (lowerKey.includes('org_management') || lowerKey.includes('org_hierarchy') || lowerKey.includes('organization')) return PAGE_REGISTRY['cust_config_org_management'];
    if (lowerKey.includes('system_settings') || lowerKey.includes('system') || lowerKey.includes('settings')) return PAGE_REGISTRY['cust_config_system_settings'];
    if (lowerKey.includes('user_management') || lowerKey.includes('account') || lowerKey.includes('user')) return PAGE_REGISTRY['cust_config_user_management'];
    if (lowerKey.includes('menu_settings') || lowerKey.includes('menu')) return PAGE_REGISTRY['cust_config_menu_settings'];
    if (lowerKey.includes('trial_records') || lowerKey.includes('trial')) return PAGE_REGISTRY['cust_config_trial_records'];
    if (lowerKey.includes('op_logs') || lowerKey.includes('log')) return PAGE_REGISTRY['cust_config_op_logs'];
    if (lowerKey.includes('perm_dict') || lowerKey.includes('perm')) return PAGE_REGISTRY['cust_config_perm_dict'];
    if (lowerKey.includes('role_management') || lowerKey.includes('role')) return PAGE_REGISTRY['cust_config_role_management'];
    if (lowerKey.includes('external_user') || lowerKey.includes('ext_user')) return PAGE_REGISTRY['cust_config_external_user_system'];
    return PAGE_REGISTRY['customer_app_config'];
  }

  // (b) 应用配置中的各个 Tab 页面
  if (lowerKey.includes('customer_orgs') || lowerKey.includes('cust_org')) {
    return PAGE_REGISTRY['tab_customer_orgs'];
  }
  if (lowerKey.includes('perm_dict')) {
    return PAGE_REGISTRY['tab_perm_dict'];
  }
  if (lowerKey.includes('default_roles') || lowerKey.includes('default_role')) {
    return PAGE_REGISTRY['tab_default_roles'];
  }
  if (lowerKey.includes('default_menus') || lowerKey.includes('default_menu')) {
    return PAGE_REGISTRY['tab_default_menus'];
  }
  if (lowerKey.includes('data_dict')) {
    return PAGE_REGISTRY['tab_data_dict'];
  }
  if (lowerKey.includes('analytics')) {
    return PAGE_REGISTRY['tab_analytics'];
  }
  if (lowerKey.includes('basic_info')) {
    if (lowerKey.includes('login')) return PAGE_REGISTRY['tab_basic_info_login'];
    if (lowerKey.includes('ext_user')) return PAGE_REGISTRY['tab_basic_info_ext_user'];
    if (lowerKey.includes('instruction')) return PAGE_REGISTRY['tab_basic_info_instruction'];
    if (lowerKey.includes('callback')) return PAGE_REGISTRY['tab_basic_info_callback'];
    if (lowerKey.includes('security')) return PAGE_REGISTRY['tab_basic_info_security'];
    return PAGE_REGISTRY['tab_basic_info'];
  }

  // (c) 应用管理列表与新建步骤
  if (lowerKey.includes('apps_create_step1') || lowerKey.includes('create_step1')) {
    return PAGE_REGISTRY['apps_create_step1'];
  }
  if (lowerKey.includes('app_list') || lowerKey.includes('apps_list')) {
    return PAGE_REGISTRY['apps_list'];
  }

  // 3. 动态页面的确定性哈希 (稳定、唯一、不可变)
  const deterministicId = deterministicSixDigitHash(key);
  return {
    id: deterministicId,
    name: title || key,
    component: 'src/App.tsx',
    category: '动态页面'
  };
}

/**
 * 获取指定页面标识的约定 6 位数字 ID（固定一致，绝不随时变动）
 */
export function getPageIdByKey(key?: string, title?: string): string {
  return resolvePageMeta(key, title).id;
}

// -------------------------------------------------------------
// 全局活动页面状态管理 (Active Page Management)
// -------------------------------------------------------------

export interface ActivePageInfo {
  key: string;
  id: string;
  title: string;
  meta: PageMeta;
}

const initialMeta = resolvePageMeta('dashboard', '首页看板');
let currentActiveInfo: ActivePageInfo = {
  key: 'dashboard',
  id: initialMeta.id,
  title: initialMeta.name,
  meta: initialMeta
};

type ActivePageListener = (info: ActivePageInfo) => void;
const activePageListeners = new Set<ActivePageListener>();

/**
 * 切换并设置全局当前活跃页面
 * 根据传入的 key 查找约定的固定页面ID，并通知所有页面ID徽章与顶栏
 */
export function setActivePage(key: string, title?: string): string {
  if (!key) return currentActiveInfo.id;

  const meta = resolvePageMeta(key, title);
  currentActiveInfo = {
    key,
    id: meta.id,
    title: meta.name || title || key,
    meta
  };

  activePageListeners.forEach(fn => {
    try {
      fn(currentActiveInfo);
    } catch (e) {
      console.error('ActivePageListener error:', e);
    }
  });

  return meta.id;
}

/**
 * 获取当前全局活跃页面信息
 */
export function getActivePageInfo(): ActivePageInfo {
  return currentActiveInfo;
}

/**
 * 订阅当前全局活跃页面变更事件
 */
export function subscribeActivePage(listener: ActivePageListener): () => void {
  activePageListeners.add(listener);
  // 立即触发一次当前状态
  listener(currentActiveInfo);
  return () => {
    activePageListeners.delete(listener);
  };
}
