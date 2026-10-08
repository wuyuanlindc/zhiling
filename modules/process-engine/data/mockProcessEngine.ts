/**
 * 流程与模板引擎管理 - Mock 测试数据集
 * 
 * 核心架构要求：
 * 1. 纳管 3 个业务系统：
 *    - SYS_ZGY: 正管用 - 网络生态综合治理平台
 *    - SYS_DTYJ: 谛听预警 - 态势感知预警系统
 *    - SYS_DDSB: 点点速报 - 协同督办与指令流转系统
 * 2. 模板必须属于某一业务系统，归属范围包括：
 *    - 公共模板 (scope: 'public')
 *    - 机构专属模板 (scope: 'org', 如济南市公安局、历下分局、市中分局、天桥分局、历城分局)
 * 3. 模板与流程解耦，支持跨租户配置与自由绑定
 */

import { 
  ProcessDefinition, 
  ProcessTemplateItem, 
  ProcessVersionItem 
} from '../types/processEngine';

// 组织机构数据结构接口
export interface OrgItem {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  code: string;
  type?: 'bureau' | 'dept' | 'detachment' | 'district' | 'station';
}

// 机构预设分组定义（针对 100+ 机构的高效批量纳管模型）
export interface OrgGroupItem {
  id: string;
  name: string;
  desc: string;
  category: 'functional' | 'regional' | 'level';
  orgIds: string[];
}

// 组织机构列表（市局、机关处室支队、13个区分局与下属78个基层派出所，共108家）
export const MOCK_ORGS: OrgItem[] = [
  // 1. 市局本级 (Level 1)
  { id: 'org_root', name: '济南市公安局', parentId: null, level: 1, code: 'JN_GAB_01', type: 'bureau' },

  // 2. 市局直属处室与支队 (Level 2, 共16家)
  { id: 'dept_zhzx', name: '指挥中心', parentId: 'org_root', level: 2, code: 'DEPT_ZHZX', type: 'dept' },
  { id: 'dept_bgs', name: '办公室', parentId: 'org_root', level: 2, code: 'DEPT_BGS', type: 'dept' },
  { id: 'dept_zgb', name: '政治部', parentId: 'org_root', level: 2, code: 'DEPT_ZGB', type: 'dept' },
  { id: 'dept_wazd', name: '网络安全保卫支队', parentId: 'org_root', level: 2, code: 'DEPT_WAZD', type: 'detachment' },
  { id: 'dept_zazd', name: '治安警察支队', parentId: 'org_root', level: 2, code: 'DEPT_ZAZD', type: 'detachment' },
  { id: 'dept_xjzd', name: '刑事侦查支队', parentId: 'org_root', level: 2, code: 'DEPT_XJZD', type: 'detachment' },
  { id: 'dept_jjzd', name: '交通警察支队', parentId: 'org_root', level: 2, code: 'DEPT_JJZD', type: 'detachment' },
  { id: 'dept_tjzd', name: '特警支队', parentId: 'org_root', level: 2, code: 'DEPT_TJZD', type: 'detachment' },
  { id: 'dept_jzzd', name: '经济犯罪侦查支队', parentId: 'org_root', level: 2, code: 'DEPT_JZZD', type: 'detachment' },
  { id: 'dept_dczd', name: '警务督察支队', parentId: 'org_root', level: 2, code: 'DEPT_DCZD', type: 'detachment' },
  { id: 'dept_kxzd', name: '科技信息化支队', parentId: 'org_root', level: 2, code: 'DEPT_KXZD', type: 'detachment' },
  { id: 'dept_crj', name: '出入境管理支队', parentId: 'org_root', level: 2, code: 'DEPT_CRJ', type: 'detachment' },
  { id: 'dept_fzzd', name: '法制支队', parentId: 'org_root', level: 2, code: 'DEPT_FZZD', type: 'detachment' },
  { id: 'dept_jdzd', name: '禁毒支队', parentId: 'org_root', level: 2, code: 'DEPT_JDZD', type: 'detachment' },
  { id: 'dept_xcb', name: '宣传处', parentId: 'org_root', level: 2, code: 'DEPT_XCB', type: 'dept' },
  { id: 'dept_jwbz', name: '警务保障处', parentId: 'org_root', level: 2, code: 'DEPT_JWBZ', type: 'dept' },

  // 3. 各区县公安分局 (Level 2, 共13家)
  { id: 'org_lx', name: '历下分局', parentId: 'org_root', level: 2, code: 'ORG_LX', type: 'district' },
  { id: 'org_sz', name: '市中分局', parentId: 'org_root', level: 2, code: 'ORG_SZ', type: 'district' },
  { id: 'org_tq', name: '天桥分局', parentId: 'org_root', level: 2, code: 'ORG_TQ', type: 'district' },
  { id: 'org_lc', name: '历城分局', parentId: 'org_root', level: 2, code: 'ORG_LC', type: 'district' },
  { id: 'org_hy', name: '槐荫分局', parentId: 'org_root', level: 2, code: 'ORG_HY', type: 'district' },
  { id: 'org_cq', name: '长清分局', parentId: 'org_root', level: 2, code: 'ORG_CQ', type: 'district' },
  { id: 'org_zq', name: '章丘分局', parentId: 'org_root', level: 2, code: 'ORG_ZQ', type: 'district' },
  { id: 'org_jy', name: '济阳分局', parentId: 'org_root', level: 2, code: 'ORG_JY', type: 'district' },
  { id: 'org_lw', name: '莱芜分局', parentId: 'org_root', level: 2, code: 'ORG_LW', type: 'district' },
  { id: 'org_gc', name: '钢城分局', parentId: 'org_root', level: 2, code: 'ORG_GC', type: 'district' },
  { id: 'org_gx', name: '高新分局', parentId: 'org_root', level: 2, code: 'ORG_GX', type: 'district' },
  { id: 'org_ns', name: '南山分局', parentId: 'org_root', level: 2, code: 'ORG_NS', type: 'district' },
  { id: 'org_qb', name: '起步区分局', parentId: 'org_root', level: 2, code: 'ORG_QB', type: 'district' },

  // 4. 历下分局辖区基层派出所 (Level 3, 共14家)
  { id: 'pcs_lx_qcl', name: '泉城路派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_01', type: 'station' },
  { id: 'pcs_lx_dmh', name: '大明湖派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_02', type: 'station' },
  { id: 'pcs_lx_btq', name: '趵突泉派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_03', type: 'station' },
  { id: 'pcs_lx_jfl', name: '解放路派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_04', type: 'station' },
  { id: 'pcs_lx_dg', name: '东关派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_05', type: 'station' },
  { id: 'pcs_lx_whd', name: '文化东路派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_06', type: 'station' },
  { id: 'pcs_lx_qfs', name: '千佛山派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_07', type: 'station' },
  { id: 'pcs_lx_zy', name: '智远派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_08', type: 'station' },
  { id: 'pcs_lx_yd', name: '燕山派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_09', type: 'station' },
  { id: 'pcs_lx_jl', name: '建筑新村派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_10', type: 'station' },
  { id: 'pcs_lx_yy', name: '姚家派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_11', type: 'station' },
  { id: 'pcs_lx_daz', name: '甸柳新村派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_12', type: 'station' },
  { id: 'pcs_lx_kx', name: '科技城派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_13', type: 'station' },
  { id: 'pcs_lx_th', name: '天下第一泉风景区派出所', parentId: 'org_lx', level: 3, code: 'PCS_LX_14', type: 'station' },

  // 5. 市中分局辖区基层派出所 (Level 3, 共14家)
  { id: 'pcs_sz_gsq', name: '杆石桥派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_01', type: 'station' },
  { id: 'pcs_sz_dgy', name: '大观园派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_02', type: 'station' },
  { id: 'pcs_sz_wjz', name: '魏家庄派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_03', type: 'station' },
  { id: 'pcs_sz_slc', name: '四里村派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_04', type: 'station' },
  { id: 'pcs_sz_syl', name: '舜玉路派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_05', type: 'station' },
  { id: 'pcs_sz_lls', name: '六里山派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_06', type: 'station' },
  { id: 'pcs_sz_qls', name: '七里山派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_07', type: 'station' },
  { id: 'pcs_sz_bms', name: '白马山派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_08', type: 'station' },
  { id: 'pcs_sz_qx', name: '七贤派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_09', type: 'station' },
  { id: 'pcs_sz_dj', name: '党家派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_10', type: 'station' },
  { id: 'pcs_sz_slh', name: '十六里河派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_11', type: 'station' },
  { id: 'pcs_sz_xl', name: '兴隆派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_12', type: 'station' },
  { id: 'pcs_sz_eh', name: '二环南路派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_13', type: 'station' },
  { id: 'pcs_sz_lh', name: '领秀城派出所', parentId: 'org_sz', level: 3, code: 'PCS_SZ_14', type: 'station' },

  // 6. 天桥分局辖区基层派出所 (Level 3, 共13家)
  { id: 'pcs_tq_zjs', name: '制锦市派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_01', type: 'station' },
  { id: 'pcs_tq_bt', name: '北坦派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_02', type: 'station' },
  { id: 'pcs_tq_wbl', name: '纬北路派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_03', type: 'station' },
  { id: 'pcs_tq_gzy', name: '官扎营派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_04', type: 'station' },
  { id: 'pcs_tq_bhj', name: '宝华街派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_05', type: 'station' },
  { id: 'pcs_tq_dkl', name: '堤口路派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_06', type: 'station' },
  { id: 'pcs_tq_grxc', name: '工人新村北村派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_07', type: 'station' },
  { id: 'pcs_tq_grxn', name: '工人新村南村派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_08', type: 'station' },
  { id: 'pcs_tq_ys', name: '药山派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_09', type: 'station' },
  { id: 'pcs_tq_szd', name: '桑梓店派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_10', type: 'station' },
  { id: 'pcs_tq_dq', name: '大桥派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_11', type: 'station' },
  { id: 'pcs_tq_wh', name: '无影山派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_12', type: 'station' },
  { id: 'pcs_tq_bl', name: '北园派出所', parentId: 'org_tq', level: 3, code: 'PCS_TQ_13', type: 'station' },

  // 7. 历城分局辖区基层派出所 (Level 3, 共13家)
  { id: 'pcs_lc_sdl', name: '山大路派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_01', type: 'station' },
  { id: 'pcs_lc_hjl', name: '洪家楼派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_02', type: 'station' },
  { id: 'pcs_lc_qf', name: '全福派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_03', type: 'station' },
  { id: 'pcs_lc_df', name: '东风派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_04', type: 'station' },
  { id: 'pcs_lc_wsr', name: '王舍人派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_05', type: 'station' },
  { id: 'pcs_lc_bs', name: '鲍山派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_06', type: 'station' },
  { id: 'pcs_lc_gg', name: '港沟派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_07', type: 'station' },
  { id: 'pcs_lc_cs', name: '彩石派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_08', type: 'station' },
  { id: 'pcs_lc_hq', name: '华山派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_09', type: 'station' },
  { id: 'pcs_lc_gl', name: '郭店派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_10', type: 'station' },
  { id: 'pcs_lc_tg', name: '唐王派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_11', type: 'station' },
  { id: 'pcs_lc_xc', name: '董家派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_12', type: 'station' },
  { id: 'pcs_lc_zh', name: '仲宫派出所', parentId: 'org_lc', level: 3, code: 'PCS_LC_13', type: 'station' },

  // 8. 槐荫分局辖区基层派出所 (Level 3, 共11家)
  { id: 'pcs_hy_qngy', name: '青年公园派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_01', type: 'station' },
  { id: 'pcs_hy_ddj', name: '道德街派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_02', type: 'station' },
  { id: 'pcs_hy_zdhs', name: '中大槐树派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_03', type: 'station' },
  { id: 'pcs_hy_dd', name: '段店派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_04', type: 'station' },
  { id: 'pcs_hy_ks', name: '匡山派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_05', type: 'station' },
  { id: 'pcs_hy_mlh', name: '美里湖派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_06', type: 'station' },
  { id: 'pcs_hy_xsc', name: '西市场派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_07', type: 'station' },
  { id: 'pcs_hy_wjb', name: '吴家堡派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_08', type: 'station' },
  { id: 'pcs_hy_xs', name: '新兴街派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_09', type: 'station' },
  { id: 'pcs_hy_ly', name: '腊山派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_10', type: 'station' },
  { id: 'pcs_hy_yx', name: '营市街派出所', parentId: 'org_hy', level: 3, code: 'PCS_HY_11', type: 'station' },

  // 9. 高新分局辖区基层派出所 (Level 3, 共5家)
  { id: 'pcs_gx_shl', name: '舜华路派出所', parentId: 'org_gx', level: 3, code: 'PCS_GX_01', type: 'station' },
  { id: 'pcs_gx_sc', name: '孙村派出所', parentId: 'org_gx', level: 3, code: 'PCS_GX_02', type: 'station' },
  { id: 'pcs_gx_jyh', name: '巨野河派出所', parentId: 'org_gx', level: 3, code: 'PCS_GX_03', type: 'station' },
  { id: 'pcs_gx_lg', name: '临港派出所', parentId: 'org_gx', level: 3, code: 'PCS_GX_04', type: 'station' },
  { id: 'pcs_gx_cx', name: '创新谷派出所', parentId: 'org_gx', level: 3, code: 'PCS_GX_05', type: 'station' },

  // 10. 长清分局辖区基层派出所 (Level 3, 共4家)
  { id: 'pcs_cq_cg', name: '城关派出所', parentId: 'org_cq', level: 3, code: 'PCS_CQ_01', type: 'station' },
  { id: 'pcs_cq_dxc', name: '大学城派出所', parentId: 'org_cq', level: 3, code: 'PCS_CQ_02', type: 'station' },
  { id: 'pcs_cq_pa', name: '平安派出所', parentId: 'org_cq', level: 3, code: 'PCS_CQ_03', type: 'station' },
  { id: 'pcs_cq_gyh', name: '崮云湖派出所', parentId: 'org_cq', level: 3, code: 'PCS_CQ_04', type: 'station' },

  // 11. 章丘分局辖区基层派出所 (Level 3, 共4家)
  { id: 'pcs_zq_ms1', name: '明水第一派出所', parentId: 'org_zq', level: 3, code: 'PCS_ZQ_01', type: 'station' },
  { id: 'pcs_zq_ms2', name: '明水第二派出所', parentId: 'org_zq', level: 3, code: 'PCS_ZQ_02', type: 'station' },
  { id: 'pcs_zq_ss', name: '双山派出所', parentId: 'org_zq', level: 3, code: 'PCS_ZQ_03', type: 'station' },
  { id: 'pcs_zq_sj', name: '圣井派出所', parentId: 'org_zq', level: 3, code: 'PCS_ZQ_04', type: 'station' },
];

// 预设机构业务分组字典（解决100+机构场景下批量授权、快速引用的核心设计）
export const MOCK_ORG_GROUPS: OrgGroupItem[] = [
  {
    id: 'grp_city_units',
    name: '市局机关及直属支队群 (16家)',
    desc: '包含指挥中心、办公室、政治部及网安、治安、刑警、交警等16个直属业务支队',
    category: 'functional',
    orgIds: [
      'dept_zhzx', 'dept_bgs', 'dept_zgb', 'dept_wazd', 'dept_zazd', 'dept_xjzd', 
      'dept_jjzd', 'dept_tjzd', 'dept_jzzd', 'dept_dczd', 'dept_kxzd', 'dept_crj', 
      'dept_fzzd', 'dept_jdzd', 'dept_xcb', 'dept_jwbz'
    ]
  },
  {
    id: 'grp_core_districts',
    name: '主城六区公安分局机关 (6家)',
    desc: '历下、市中、天桥、历城、槐荫、高新分局机关直属机构',
    category: 'regional',
    orgIds: ['org_lx', 'org_sz', 'org_tq', 'org_lc', 'org_hy', 'org_gx']
  },
  {
    id: 'grp_suburban_districts',
    name: '外围及功能区分局 (7家)',
    desc: '长清、章丘、济阳、莱芜、钢城、南山、起步区分局',
    category: 'regional',
    orgIds: ['org_cq', 'org_zq', 'org_jy', 'org_lw', 'org_gc', 'org_ns', 'org_qb']
  },
  {
    id: 'grp_all_stations',
    name: '全辖基层派出所群 (78家)',
    desc: '全市历下、市中、天桥、历城、槐荫、高新、长清、章丘全辖78个基层派出所全域覆盖',
    category: 'level',
    orgIds: MOCK_ORGS.filter(o => o.level === 3).map(o => o.id)
  },
  {
    id: 'grp_lx_all',
    name: '历下区全辖警区 (15家)',
    desc: '历下分局机关及泉城路、大明湖、趵突泉等下辖全部14个基层派出所',
    category: 'regional',
    orgIds: ['org_lx', ...MOCK_ORGS.filter(o => o.parentId === 'org_lx').map(o => o.id)]
  },
  {
    id: 'grp_sz_all',
    name: '市中区全辖警区 (15家)',
    desc: '市中分局机关及杆石桥、大观园、魏家庄等下辖全部14个基层派出所',
    category: 'regional',
    orgIds: ['org_sz', ...MOCK_ORGS.filter(o => o.parentId === 'org_sz').map(o => o.id)]
  }
];

// 角色字典
export const MOCK_ROLES = [
  { id: 'role_unit_leader', name: '单位负责人', desc: '各机关单位第一责任人，拥有最终核准权' },
  { id: 'role_dept_leader', name: '部门负责人', desc: '处室/科所主管，负责下达与核准' },
  { id: 'role_handler', name: '普通办理人员', desc: '具体业务承办经办人' },
  { id: 'role_approver', name: '专职审批人员', desc: '合规与业务审查专员' },
  { id: 'role_duty', name: '值班人员', desc: '非工作日及夜间应急值班专员' },
  { id: 'role_net_evaluator', name: '网评员', desc: '属地网评与网络生态巡查专员' },
  { id: 'role_sys_admin', name: '系统管理员', desc: '流程与系统配置运维人员' },
];

// 群组字典（跨部门专项协作）
export const MOCK_GROUPS = [
  { id: 'grp_special_action', name: '专项行动工作组', memberCount: 12, desc: '跨支队协同重点任务专项攻坚组' },
  { id: 'grp_heavy_security', name: '重大活动保障组', memberCount: 18, desc: '大型安保及重要节庆响应专班' },
  { id: 'grp_opinion_handle', name: '舆情处置工作组', memberCount: 9, desc: '涉警网络热点应急分析与引导工作组' },
  { id: 'grp_holiday_duty', name: '节假日应急值班组', memberCount: 8, desc: '双休及法定节假日值守调度群组' },
];

// 人员列表
export const MOCK_USERS = [
  { id: 'usr_zhangsan', name: '张三', org: '济南市公安局 / 办公室', role: '部门负责人', phone: '13800000001' },
  { id: 'usr_lisi', name: '李四', org: '济南市公安局 / 网安支队', role: '专职审批人员', phone: '13800000002' },
  { id: 'usr_wangwu', name: '王五', org: '历下分局 / 办公室', role: '普通办理人员', phone: '13800000003' },
  { id: 'usr_zhaoliu', name: '赵六', org: '指挥中心 / 调度科', role: '值班人员', phone: '13800000004' },
  { id: 'usr_qianqi', name: '钱七', org: '治安支队 / 一大队', role: '单位负责人', phone: '13800000005' },
  { id: 'usr_sunba', name: '孙八', org: '济南市公安局 / 宣传处', role: '网评员', phone: '13800000006' },
];

// 业务结果事件（解耦设计，预留未来积分评价中心）
export const MOCK_BUSINESS_EVENTS = [
  { code: 'TASK_COMPLETED', name: '任务按时完成', desc: '承办人员在规定办理期限内完成反馈' },
  { code: 'TASK_OVERDUE', name: '任务逾期完成', desc: '超出办理时限后提交反馈' },
  { code: 'TASK_REJECTED', name: '任务被驳回', desc: '审批不通过且不可挽回' },
  { code: 'REPORT_APPROVED', name: '信息上报审核通过', desc: '上报素材经主管部门审核采纳' },
  { code: 'CONTENT_ADOPTED', name: '网评内容被采用', desc: '巡查或研判内容录入上级工作通报' },
  { code: 'CONTENT_EXCELLENT', name: '优秀办理案例', desc: '工作表现突出，获领导表彰评定' },
];

// 3大业务系统多租户模板 Mock 数据
export const MOCK_TEMPLATES: ProcessTemplateItem[] = [
  // ================= 1. 指令流转 (SYS_ZLL) =================
  {
    id: '1008291001',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateType: 'normal', // 普通模板
    templateName: '通用工作任务派发模板',
    category: '任务派发',
    scope: 'public', // 公共模板
    description: '适用于网络治理日常工作指令下发、数据登记与业务台账填报',
    version: 'V2.2.0',
    status: 'active',
    appliedTenantCount: 128,
    creator: '张建国',
    createdAt: '2026-08-10 10:00',
    updatedAt: '2026-09-15 14:30',
    fields: [
      { key: 'taskTitle', label: '任务指令标题', type: 'string', required: true, placeholder: '请输入清晰的工作任务标题' },
      { key: 'taskContent', label: '工作要点与办理要求', type: 'textarea', required: true, placeholder: '详细阐述任务背景与办理指导意见' },
      { key: 'urgency', label: '紧急程度', type: 'select', required: true, defaultValue: 'normal', options: [{ label: '普通', value: 'normal' }, { label: '紧急', value: 'urgent' }, { label: '特急', value: 'extreme' }] },
      { key: 'deadline', label: '要求完成时限', type: 'date', required: true },
      { key: 'requireAttachment', label: '是否必须上传附件', type: 'boolean', required: false, defaultValue: false }
    ]
  },
  {
    id: '1008291002',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateType: 'process', // 流程模板
    templateName: '网络指令流转与闭环处置模板',
    category: '网络巡查',
    scope: 'public', // 公共模板
    description: '支持网络重点事件跟进、指令协同流转与多维度闭环流转',
    defaultProcessId: 'proc_countersign_task',
    supportedProcessIds: ['proc_countersign_task', 'proc_or_sign_task', 'proc_normal_task'],
    version: 'V1.9.0',
    status: 'active',
    appliedTenantCount: 96,
    creator: '周正明',
    createdAt: '2026-08-15 09:20',
    updatedAt: '2026-09-18 16:10',
    fields: [
      { key: 'platform', label: '涉及网络平台', type: 'select', required: true, options: [{ label: '微博', value: 'weibo' }, { label: '抖音', value: 'douyin' }, { label: '微信视频号', value: 'wechat_channel' }, { label: '快手', value: 'kuaishou' }, { label: '小红书', value: 'xhs' }] },
      { key: 'postUrl', label: '原帖/视频源链接', type: 'string', required: true, placeholder: 'https://...' },
      { key: 'targetHeat', label: '全网热度指数', type: 'number', required: false, defaultValue: 100 },
      { key: 'guideDirection', label: '引导口径与关键词', type: 'textarea', required: true, placeholder: '明确评论引导核心主旨' }
    ]
  },
  {
    id: '1008291003',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateType: 'process',
    templateName: '全辖基层派出所接处警联动处置模板',
    category: '基层联动',
    scope: 'org', // 机构专属：预设分组授权 (全辖78个基层派出所)
    scopeMode: 'org_group',
    orgGroupName: '全辖基层派出所群 (78家)',
    orgId: 'pcs_lx_qcl',
    orgIds: MOCK_ORGS.filter(o => o.level === 3).map(o => o.id),
    orgName: '全辖基层派出所群',
    orgNames: MOCK_ORGS.filter(o => o.level === 3).map(o => o.name),
    description: '采用【机构分组授权模式】，面向全辖历下、市中、天桥、历城、槐荫等78个基层一线派出所，统一部署快速处警与联动台账',
    defaultProcessId: 'proc_normal_task',
    supportedProcessIds: ['proc_normal_task', 'proc_or_sign_task'],
    version: 'V2.0.0',
    status: 'active',
    appliedTenantCount: 78,
    creator: '王志强',
    createdAt: '2026-08-22 14:00',
    updatedAt: '2026-09-26 11:30',
    fields: [
      { key: 'gridCode', label: '基层派出所管区编号', type: 'string', required: true, placeholder: '例：PCS-WQ-0203' },
      { key: 'hotSpot', label: '辖区重点部位', type: 'select', required: true, options: [{ label: '核心商圈商业街', value: 'qcl' }, { label: '重点旅游景区', value: 'dmh' }, { label: '交通枢纽车站', value: 'cbd' }, { label: '高校与科创园区', value: 'gx' }] },
      { key: 'fieldPhoto', label: '现场处置记录与照片', type: 'attachment', required: true },
      { key: 'liaisonOfficer', label: '值班所领导/责任民警', type: 'string', required: true }
    ]
  },
  {
    id: '1008291004',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateType: 'process',
    templateName: '历下分局全域网格生态治理专属模板',
    category: '属地专项',
    scope: 'org', // 机构专属：层级树继承模式 (历下分局含下辖全部14个派出所，共15家)
    scopeMode: 'org_tree',
    orgRootName: '历下分局及下辖全部14个派出所 (15家)',
    orgId: 'org_lx',
    orgIds: ['org_lx', ...MOCK_ORGS.filter(o => o.parentId === 'org_lx').map(o => o.id)],
    orgName: '历下分局',
    orgNames: ['历下分局', ...MOCK_ORGS.filter(o => o.parentId === 'org_lx').map(o => o.name)],
    description: '采用【层级树继承授权模式】，历下分局本级机关及下辖泉城路、大明湖、趵突泉等14个基层派出所全域自动继承，下辖新增机构自动适用',
    defaultProcessId: 'proc_duty_holiday',
    supportedProcessIds: ['proc_duty_holiday', 'proc_normal_task'],
    version: 'V1.3.0',
    status: 'active',
    appliedTenantCount: 15,
    creator: '刘东海',
    createdAt: '2026-09-01 11:20',
    updatedAt: '2026-09-25 15:40',
    fields: [
      { key: 'campusName', label: '涉及高校/产业园区', type: 'string', required: true, placeholder: '请输入园区或院校全称' },
      { key: 'riskGrade', label: '隐患评估等级', type: 'select', required: true, options: [{ label: '低风险', value: 'low' }, { label: '中等风险', value: 'medium' }, { label: '重大敏感', value: 'high' }] },
      { key: 'rectificationMeasure', label: '联合化解措施', type: 'textarea', required: true }
    ]
  },

  // ================= 2. 点点速豹 (SYS_DDSB) =================
  {
    id: '1008291005',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateName: '应急督办与突击抢单指令模板',
    category: '指令督办',
    scope: 'public', // 公共模板
    description: '适用于限时抢办、多方协同攻坚与重大紧急督办任务的高效穿透',
    defaultProcessId: 'proc_or_sign_task',
    supportedProcessIds: ['proc_or_sign_task', 'proc_countersign_task', 'proc_normal_task'],
    version: 'V2.1.0',
    status: 'active',
    appliedTenantCount: 75,
    creator: '李晓梅',
    createdAt: '2026-08-20 14:15',
    updatedAt: '2026-09-18 10:00',
    fields: [
      { key: 'actionName', label: '突击行动/督办代号', type: 'string', required: true, placeholder: '请输入督办指令代号' },
      { key: 'taskGoal', label: '督办核心成效指标', type: 'textarea', required: true, placeholder: '明确量化考核指标' },
      { key: 'isEmergency', label: '是否特急督办', type: 'boolean', required: true, defaultValue: true },
      { key: 'targetDepartment', label: '受督办责任部门', type: 'string', required: true }
    ]
  },
  {
    id: '1008291006',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateName: '跨部门多方联合会签公文模板',
    category: '联合会签',
    scope: 'public', // 公共模板
    description: '支持多个部门、分局全员协同会签与联署批复，确保合规与责任闭环',
    defaultProcessId: 'proc_countersign_task',
    supportedProcessIds: ['proc_countersign_task', 'proc_normal_task'],
    version: 'V1.6.0',
    status: 'active',
    appliedTenantCount: 64,
    creator: '陈思源',
    createdAt: '2026-08-25 16:30',
    updatedAt: '2026-09-15 11:20',
    fields: [
      { key: 'documentTitle', label: '联合公文/制度规范名称', type: 'string', required: true },
      { key: 'participatingDepts', label: '涉及会签部门清单', type: 'string', required: true, placeholder: '网安、治安、办公室、指挥中心等' },
      { key: 'effectiveDate', label: '拟生效施行日期', type: 'date', required: true },
      { key: 'securityLevel', label: '公文密级', type: 'select', required: true, defaultValue: 'internal', options: [{ label: '内部工作秘密', value: 'internal' }, { label: '公开', value: 'public' }, { label: '机密', value: 'confidential' }] }
    ]
  },
  {
    id: '1008291007',
    systemId: 'SYS_DDSB',
    systemName: '点点速豹',
    templateName: '历城分局应急值班与巡查督办模板',
    category: '属地专项',
    scope: 'org', // 历城分局专属
    orgId: 'org_lc',
    orgIds: ['org_lc', 'org_lx'],
    orgName: '历城分局',
    orgNames: ['历城分局', '历下分局'],
    description: '历城分局针对东部新城与交通枢纽区域应急响应定制的专属督办模板',
    defaultProcessId: 'proc_duty_holiday',
    supportedProcessIds: ['proc_duty_holiday', 'proc_normal_task'],
    version: 'V1.0.0',
    status: 'active',
    appliedTenantCount: 2,
    creator: '赵延平',
    createdAt: '2026-09-05 10:40',
    updatedAt: '2026-09-12 14:10',
    fields: [
      { key: 'hubZone', label: '交通枢纽/重点区域', type: 'select', required: true, options: [{ label: '济南东站枢纽', value: 'east_station' }, { label: '郭店物流园区', value: 'logistics' }, { label: '华山生态区', value: 'huashan' }] },
      { key: 'dutyLeader', label: '当日值班局领导', type: 'string', required: true },
      { key: 'responseTimeMin', label: '应急响应耗时(分钟)', type: 'number', required: true, defaultValue: 15 }
    ]
  },

  // ================= 3. 知了网评 (SYS_ZLWP) =================
  {
    id: '1008291008',
    systemId: 'SYS_ZLWP',
    systemName: '知了网评',
    templateName: '全网态势感知与网评专报模板',
    category: '信息报送',
    scope: 'public', // 公共模板
    description: '汇聚多维智能感知数据，快速生成日情简报、网评特刊与研判指令',
    defaultProcessId: 'proc_info_report',
    supportedProcessIds: ['proc_info_report', 'proc_duty_holiday', 'proc_normal_task'],
    version: 'V2.0.0',
    status: 'active',
    appliedTenantCount: 96,
    creator: '林海峰',
    createdAt: '2026-08-12 09:00',
    updatedAt: '2026-09-16 17:20',
    fields: [
      { key: 'reportTitle', label: '网评专报名称', type: 'string', required: true, placeholder: '请输入专报标题' },
      { key: 'reportType', label: '报送类别', type: 'select', required: true, options: [{ label: '日情简报', value: 'daily' }, { label: '专报特刊', value: 'special' }, { label: '重大事件研判', value: 'major' }] },
      { key: 'riskLevel', label: '预警风险等级', type: 'select', required: true, defaultValue: 'general', options: [{ label: '一般', value: 'general' }, { label: '较大', value: 'moderate' }, { label: '特大严重', value: 'severe' }] },
      { key: 'reportContent', label: '核心态势研判要点', type: 'textarea', required: true }
    ]
  },
  {
    id: '1008291009',
    systemId: 'SYS_ZLWP',
    systemName: '知了网评',
    templateName: '涉网评论引导与线索核查模板',
    category: '网评引导',
    scope: 'public', // 公共模板
    description: '适用于网评评论引导快速落地查证、内容核实与分级处置审批',
    defaultProcessId: 'proc_amount_approval',
    supportedProcessIds: ['proc_amount_approval', 'proc_normal_task'],
    version: 'V1.5.0',
    status: 'active',
    appliedTenantCount: 88,
    creator: '孙雪峰',
    createdAt: '2026-08-18 11:30',
    updatedAt: '2026-09-14 10:20',
    fields: [
      { key: 'verifyTarget', label: '被引导主体/事件代号', type: 'string', required: true, placeholder: '线索主体全称或代号' },
      { key: 'amount', label: '涉及评论数(条)', type: 'number', required: true, defaultValue: 500 },
      { key: 'verifyResult', label: '引导定性结论', type: 'select', required: true, options: [{ label: '属实已整改', value: 'true_rectified' }, { label: '不实谣言', value: 'rumor' }, { label: '待持续侦办', value: 'pending' }] }
    ]
  },
  {
    id: '1008291010',
    systemId: 'SYS_ZLWP',
    systemName: '知了网评',
    templateName: '济南市局重大突发网评引导处置模板',
    category: '市局专属',
    scope: 'org', // 济南市公安局及直属支队专属
    orgId: 'org_root',
    orgIds: ['org_root', 'dept_zhzx', 'dept_wazd', 'dept_xcb'],
    orgName: '济南市公安局',
    orgNames: ['济南市公安局', '指挥中心', '网安支队', '宣传处'],
    description: '市局直属指挥调度中心定制，用于全市特大突发敏感网评引导直接呈报市局主要领导',
    defaultProcessId: 'proc_amount_approval',
    supportedProcessIds: ['proc_amount_approval', 'proc_duty_holiday'],
    version: 'V1.3.0',
    status: 'active',
    appliedTenantCount: 4,
    creator: '黄振国',
    createdAt: '2026-08-26 15:40',
    updatedAt: '2026-09-17 09:30',
    fields: [
      { key: 'incidentCode', label: '突发事件专案编号', type: 'string', required: true, placeholder: '例：JN-2026-重大08' },
      { key: 'heatIndex', label: '实时全网热度指数', type: 'number', required: true, defaultValue: 500 },
      { key: 'cityWideImpact', label: '是否涉及全市联动', type: 'boolean', required: true, defaultValue: true },
      { key: 'leaderInstruction', label: '主管局领导批示要点', type: 'textarea', required: false }
    ]
  },
  {
    id: '1008291011',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    templateType: 'process',
    templateName: '跨部门下发与多路组织节点协作流程模板',
    category: '组织下发',
    scope: 'public',
    description: '设计中状态的跨层级下发模板，搭载「下发组织节点群组」自定义表单组件，内置 3 路条件分支智能分流',
    defaultProcessId: 'proc_org_dispatch_3branches',
    supportedProcessIds: ['proc_org_dispatch_3branches', 'proc_normal_task'],
    version: 'V1.0.0',
    status: 'draft',
    appliedTenantCount: 0,
    creator: '张建国',
    createdAt: '2026-09-29 09:00',
    updatedAt: '2026-09-29 10:00',
    fields: [
      { key: 'dispatchTitle', label: '下发指令任务名称', type: 'string', required: true, placeholder: '请输入下发指令标题...' },
      { key: 'dispatchOrgGroup', label: '下发组织节点群组', type: 'string', required: true, placeholder: '请选择下发接收的组织节点或预设群组' },
      { key: 'urgency', label: '紧急程度', type: 'select', required: true, defaultValue: 'urgent', options: [{ label: '普通', value: 'normal' }, { label: '紧急', value: 'urgent' }, { label: '特急', value: 'extreme' }] },
      { key: 'riskLevel', label: '预警风险等级', type: 'select', required: true, defaultValue: 'high', options: [{ label: '低风险', value: 'low' }, { label: '中风险', value: 'medium' }, { label: '高风险', value: 'high' }] },
      { key: 'dispatchRequirement', label: '处置要求与指示', type: 'textarea', required: true, placeholder: '详细填写指示要求与办结反馈标准...' }
    ],
    formWidgets: [
      {
        id: 'widget_disp_title',
        key: 'dispatchTitle',
        label: '下发指令任务名称',
        type: 'input',
        category: 'basic',
        required: true,
        span: 24,
        placeholder: '请输入下发指令标题...'
      },
      {
        id: 'widget_org_group_dispatch_custom',
        key: 'dispatchOrgGroup',
        label: '下发组织节点群组',
        type: 'org_group_dispatch',
        category: 'basic',
        required: true,
        span: 24,
        placeholder: '请选择或指定下发的接收组织节点与预设群组',
        helpText: '自定义下发组件：支持快捷选择直属分局、基层派出所群组或特定联勤单元',
        defaultValue: {
          dispatchType: 'group_node',
          selectedGroupIds: ['grp_pcs_78', 'grp_zf_center'],
          selectedOrgNames: ['市局指挥中心', '历下分局治安大队', '全辖78个基层派出所群']
        }
      },
      {
        id: 'widget_disp_urgency',
        key: 'urgency',
        label: '紧急程度',
        type: 'select',
        category: 'basic',
        required: true,
        span: 12,
        defaultValue: 'urgent',
        options: [
          { label: '普通', value: 'normal' },
          { label: '紧急', value: 'urgent' },
          { label: '特急', value: 'extreme' }
        ]
      },
      {
        id: 'widget_disp_risk',
        key: 'riskLevel',
        label: '预警风险等级',
        type: 'select',
        category: 'basic',
        required: true,
        span: 12,
        defaultValue: 'high',
        options: [
          { label: '低风险', value: 'low' },
          { label: '中风险', value: 'medium' },
          { label: '高风险', value: 'high' }
        ]
      },
      {
        id: 'widget_disp_req',
        key: 'dispatchRequirement',
        label: '处置要求与指示',
        type: 'textarea',
        category: 'basic',
        required: true,
        span: 24,
        placeholder: '详细填写指示要求与办结反馈标准...'
      }
    ],
    flowNodes: [
      {
        id: 'fn_draft_start',
        nodeCode: 'node_start',
        name: '下发指令启动',
        nodeType: 'draft',
        categoryLabel: '开始节点',
        description: '下发填报表单提交后触发启动'
      },
      {
        id: 'fn_draft_handle',
        nodeCode: 'node_handle_params',
        name: '下发组织节点参数配置与派发',
        nodeType: 'handle',
        categoryLabel: '处理节点',
        receiverLabel: '下发经办民警',
        receiverType: 'role',
        description: '指定与调配下发目标组织节点群组参数'
      },
      {
        id: 'fn_draft_cond_3branches',
        nodeCode: 'node_condition_dispatch',
        name: '下发组织节点与风险 3 路条件分支分流',
        nodeType: 'condition',
        categoryLabel: '条件分支',
        description: '根据「下发组织节点群组」选择属性与事件紧急程度，自动开启 3 路分流通道',
        branchType: 'condition',
        branches: [
          {
            id: 'cb_draft_branch_1',
            name: '分支一：市局直属分局/大队特急下发',
            branchType: 'if',
            tag: 'IF',
            priority: 1,
            desc: '当选定直属分局且指令为特急时触发',
            conditionText: '下发组织节点群组 包含「直属分局」 且 紧急程度 等于「特急」',
            configMode: 'condition',
            conditions: [
              { id: 'rule_db_1', fieldKey: 'dispatchOrgGroup', fieldName: '下发组织节点群组', operator: 'contains', value: '直属分局', valueLabel: '直属分局' },
              { id: 'rule_db_2', fieldKey: 'urgency', fieldName: '紧急程度', operator: 'eq', value: 'extreme', valueLabel: '特急' }
            ],
            nodes: [
              {
                id: 'fn_sub_appr_lead',
                nodeCode: 'node_sub_appr_lead',
                name: '市局分管领导特急签署审定',
                nodeType: 'approval',
                categoryLabel: '审批节点',
                receiverLabel: '市局分管领导',
                receiverType: 'role',
                approveModeLabel: '或签(一名通过即生效)',
                description: '市局分管领导针对直属分局特急指令进行核准'
              }
            ]
          },
          {
            id: 'cb_draft_branch_2',
            name: '分支二：全辖派出所群组高风险直达',
            branchType: 'if',
            tag: 'IF',
            priority: 2,
            desc: '当选定全辖派出所群组且风险为高风险时触发',
            conditionText: '下发组织节点群组 包含「派出所群组」 且 预警风险等级 等于「高风险」',
            configMode: 'condition',
            conditions: [
              { id: 'rule_db_3', fieldKey: 'dispatchOrgGroup', fieldName: '下发组织节点群组', operator: 'contains', value: '派出所群组', valueLabel: '派出所群组' },
              { id: 'rule_db_4', fieldKey: 'riskLevel', fieldName: '预警风险等级', operator: 'eq', value: 'high', valueLabel: '高风险' }
            ],
            nodes: [
              {
                id: 'fn_sub_handle_pcs',
                nodeCode: 'node_sub_handle_pcs',
                name: '派出所值班班组联动抢办',
                nodeType: 'handle',
                categoryLabel: '处理节点',
                receiverLabel: '派出所值班领导及干警',
                receiverType: 'dept',
                approveModeLabel: '抢单快速办结',
                description: '全辖派出所群组快速接单办理'
              }
            ]
          },
          {
            id: 'cb_draft_branch_3',
            name: '分支三：常规属地科室下发（兜底通道）',
            branchType: 'else',
            tag: 'ELSE',
            priority: 3,
            desc: '未命中上述两路条件时的常规兜底流转',
            conditionText: '其他情况进入此流程',
            configMode: 'condition',
            conditions: [],
            nodes: [
              {
                id: 'fn_sub_handle_dept',
                nodeCode: 'node_sub_handle_dept',
                name: '常规承办科室登记接收',
                nodeType: 'handle',
                categoryLabel: '处理节点',
                receiverLabel: '科室值班人员',
                receiverType: 'role',
                approveModeLabel: '常规接单办理',
                description: '常规科室下发接单与台账登记'
              }
            ]
          }
        ]
      },
      {
        id: 'fn_draft_cc',
        nodeCode: 'node_cc_center',
        name: '下发执行汇总通报抄送',
        nodeType: 'cc',
        categoryLabel: '抄送节点',
        receiverLabel: '指挥调度中心 / 督察大队',
        receiverType: 'role',
        description: '抄送相关监察及指导部门'
      },
      {
        id: 'fn_draft_end',
        nodeCode: 'node_end',
        name: '组织指令下发办结归档',
        nodeType: 'end',
        categoryLabel: '办结节点',
        description: '指令任务闭环并存入档案库'
      }
    ]
  }
];

// 内置五大真实标准示例流程
export const MOCK_PROCESSES: ProcessDefinition[] = [
  // 示例一：普通工作任务流程
  {
    id: 'proc_normal_task',
    systemId: 'SYS_ZGY',
    systemName: '正管用 - 网络生态综合治理平台',
    processCode: 'WORK_TASK_NORMAL',
    processName: '标准工作任务办理流程',
    description: '用于机关日常工作任务下发、下级承办反馈与处室负责人审定闭环',
    category: 'task',
    categoryName: '工作任务类',
    version: 'V1.0',
    status: 'published',
    scope: 'platform',
    relatedTemplateIds: ['tpl_zgy_work_task', 'tpl_zgy_lx_exclusive'],
    relatedTemplateNames: ['通用工作任务派发模板', '历下分局属地网格治理专属模板'],
    allowMultiTemplates: true,
    creator: '张三',
    createdAt: '2026-08-15 09:30',
    updatedAt: '2026-09-18 14:20',
    nodes: [
      {
        id: 'node_start',
        type: 'start',
        x: 60,
        y: 220,
        data: {
          name: '流程启动',
          nodeType: 'start',
          startTriggerType: 'auto_create',
          isValid: true,
          description: '发起人填写业务指令并下发时自动触发'
        }
      },
      {
        id: 'node_handle_1',
        type: 'handle',
        x: 330,
        y: 220,
        data: {
          name: '责任单位承办办理',
          nodeType: 'handle',
          handleMode: 'any',
          receivers: [
            {
              id: 'rec_1',
              type: 'org',
              scope: 'current_and_sub',
              targetId: 'dept_bgs',
              targetName: '办公室',
              deptName: '办公室',
              roleName: '普通办理人员',
              description: '当前组织及下级所有办公室办理人员'
            }
          ],
          timeLimit: {
            type: 'fixed_duration',
            duration: 3,
            durationUnit: 'work_days'
          },
          overdueRules: ['alert', 'notify_leader'],
          feedbackRequirements: ['办理情况文字综述', '现场支撑图文材料'],
          allowTransfer: true,
          allowPostpone: true,
          isValid: true
        }
      },
      {
        id: 'node_approval_1',
        type: 'approval',
        x: 600,
        y: 220,
        data: {
          name: '处室负责人核决审核',
          nodeType: 'approval',
          approvalMode: 'leader',
          receivers: [
            {
              id: 'rec_2',
              type: 'role',
              scope: 'current_org',
              targetId: 'role_dept_leader',
              targetName: '部门负责人',
              roleName: '部门负责人',
              description: '当前组织部门负责人'
            }
          ],
          approvalActions: ['pass', 'return', 'reject'],
          returnRule: 'to_previous',
          rejectRule: 'end_process',
          requireComment: true,
          isValid: true
        }
      },
      {
        id: 'node_end',
        type: 'end',
        x: 870,
        y: 220,
        data: {
          name: '流程办结归档',
          nodeType: 'end',
          businessEvents: ['TASK_COMPLETED', 'REPORT_APPROVED'],
          isValid: true
        }
      }
    ],
    edges: [
      { id: 'edge_1', source: 'node_start', target: 'node_handle_1', label: '派发承办' },
      { id: 'edge_2', source: 'node_handle_1', target: 'node_approval_1', label: '提交成果' },
      { id: 'edge_3', source: 'node_approval_1', target: 'node_end', label: '审核通过' }
    ]
  },

  // 示例二：涉案金额审批流程
  {
    id: 'proc_amount_approval',
    systemId: 'SYS_DTYJ',
    systemName: '谛听预警 - 态势感知预警系统',
    processCode: 'AMOUNT_COND_APPROVAL',
    processName: '涉案核查金额分级审批流程',
    description: '支持根据涉案处置金额阈值（10000元）自动分支走局领导审批或部门常规审批',
    category: 'approval',
    categoryName: '审批核决类',
    version: 'V1.0',
    status: 'published',
    scope: 'platform',
    relatedTemplateIds: ['tpl_dtyj_clue_verify', 'tpl_dtyj_jn_major'],
    relatedTemplateNames: ['涉案核查与线索定性反馈模板', '济南市局重大突发舆情处置模板'],
    allowMultiTemplates: true,
    creator: '李四',
    createdAt: '2026-08-20 11:00',
    updatedAt: '2026-09-12 16:40',
    nodes: [
      {
        id: 'node_start_amt',
        type: 'start',
        x: 50,
        y: 240,
        data: { name: '核查指令发起', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
      },
      {
        id: 'node_handle_amt',
        type: 'handle',
        x: 270,
        y: 240,
        data: {
          name: '侦办人员落地核查',
          nodeType: 'handle',
          handleMode: 'single',
          receivers: [
            {
              id: 'rec_amt_1',
              type: 'role',
              scope: 'current_org',
              targetId: 'role_handler',
              targetName: '普通办理人员',
              description: '承办经办人填报涉案金额与定性'
            }
          ],
          timeLimit: { type: 'fixed_duration', duration: 24, durationUnit: 'hours' },
          isValid: true
        }
      },
      {
        id: 'node_cond_amt',
        type: 'condition',
        x: 510,
        y: 240,
        data: {
          name: '涉案金额阈值判断',
          nodeType: 'condition',
          conditionBranches: [
            {
              id: 'branch_high',
              name: '金额 >= 10000',
              relation: 'AND',
              rules: [
                { id: 'rule_1', field: 'amount', fieldName: '涉及金额', operator: 'gte', value: 10000, valueLabel: '10000元' }
              ],
              targetNodeId: 'node_appr_leader'
            },
            {
              id: 'branch_low',
              name: '金额 < 10000',
              relation: 'AND',
              rules: [
                { id: 'rule_2', field: 'amount', fieldName: '涉及金额', operator: 'lt', value: 10000, valueLabel: '10000元' }
              ],
              targetNodeId: 'node_appr_dept',
              isDefault: true
            }
          ],
          isValid: true
        }
      },
      {
        id: 'node_appr_leader',
        type: 'approval',
        x: 770,
        y: 120,
        data: {
          name: '分管局领导大额审批',
          nodeType: 'approval',
          approvalMode: 'leader',
          receivers: [
            {
              id: 'rec_lead',
              type: 'role',
              scope: 'all',
              targetId: 'role_unit_leader',
              targetName: '单位负责人',
              description: '分管局领导签署核决意见'
            }
          ],
          approvalActions: ['pass', 'return', 'reject'],
          isValid: true
        }
      },
      {
        id: 'node_appr_dept',
        type: 'approval',
        x: 770,
        y: 360,
        data: {
          name: '部门处室负责人审批',
          nodeType: 'approval',
          approvalMode: 'single',
          receivers: [
            {
              id: 'rec_dept',
              type: 'role',
              scope: 'current_org',
              targetId: 'role_dept_leader',
              targetName: '部门负责人',
              description: '处室主任核准结案'
            }
          ],
          approvalActions: ['pass', 'return', 'reject'],
          isValid: true
        }
      },
      {
        id: 'node_end_amt',
        type: 'end',
        x: 1020,
        y: 240,
        data: {
          name: '核查闭环归档',
          nodeType: 'end',
          businessEvents: ['TASK_COMPLETED'],
          isValid: true
        }
      }
    ],
    edges: [
      { id: 'e_a1', source: 'node_start_amt', target: 'node_handle_amt', label: '下发线索' },
      { id: 'e_a2', source: 'node_handle_amt', target: 'node_cond_amt', label: '提交核查金额' },
      { id: 'e_a3', source: 'node_cond_amt', target: 'node_appr_leader', label: '金额 >= 10000', branchId: 'branch_high' },
      { id: 'e_a4', source: 'node_cond_amt', target: 'node_appr_dept', label: '金额 < 10000', branchId: 'branch_low' },
      { id: 'e_a5', source: 'node_appr_leader', target: 'node_end_amt', label: '局长签署完成' },
      { id: 'e_a6', source: 'node_appr_dept', target: 'node_end_amt', label: '处长审批完成' }
    ]
  },

  // 示例三：节假日值班自适应流转流程
  {
    id: 'proc_duty_holiday',
    systemId: 'SYS_DTYJ',
    systemName: '谛听预警 - 态势感知预警系统',
    processCode: 'DUTY_CALENDAR_DISPATCH',
    processName: '节假日值班自适应分流流程',
    description: '根据日历工作日与法定节假日自动判断派单目标：平日归口责任处室，双休节假日直发值班专班',
    category: 'special',
    categoryName: '应急保障类',
    version: 'V1.0',
    status: 'published',
    scope: 'platform',
    relatedTemplateIds: ['tpl_dtyj_warn_report', 'tpl_zgy_sz_monitor', 'tpl_ddsb_lc_exclusive'],
    relatedTemplateNames: ['全网态势感知与预警专报模板', '市中分局网络生态重点攻坚模板', '历城分局应急值班与巡查督办模板'],
    allowMultiTemplates: true,
    creator: '赵六',
    createdAt: '2026-08-25 10:15',
    updatedAt: '2026-09-10 17:30',
    nodes: [
      {
        id: 'node_s_duty',
        type: 'start',
        x: 50,
        y: 240,
        data: { name: '应急情报接收', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
      },
      {
        id: 'node_c_duty',
        type: 'condition',
        x: 270,
        y: 240,
        data: {
          name: '工作日/节假日自动判别',
          nodeType: 'condition',
          conditionBranches: [
            {
              id: 'b_workday',
              name: '工作日',
              relation: 'AND',
              rules: [{ id: 'r_w', field: 'today_type', fieldName: '日历属性', operator: 'is_workday', value: 'workday', valueLabel: '标准工作日' }],
              targetNodeId: 'node_h_workday'
            },
            {
              id: 'b_holiday',
              name: '周末/节假日',
              relation: 'AND',
              rules: [{ id: 'r_h', field: 'today_type', fieldName: '日历属性', operator: 'is_holiday', value: 'holiday', valueLabel: '非工作日/节假日' }],
              targetNodeId: 'node_h_duty',
              isDefault: true
            }
          ],
          isValid: true
        }
      },
      {
        id: 'node_h_workday',
        type: 'handle',
        x: 540,
        y: 120,
        data: {
          name: '常规处室负责人办理',
          nodeType: 'handle',
          handleMode: 'single',
          receivers: [
            { id: 'rec_wd', type: 'role', scope: 'current_org', targetId: 'role_dept_leader', targetName: '部门负责人' }
          ],
          timeLimit: { type: 'fixed_duration', duration: 4, durationUnit: 'hours' },
          isValid: true
        }
      },
      {
        id: 'node_h_duty',
        type: 'handle',
        x: 540,
        y: 360,
        data: {
          name: '值班应急专员办理',
          nodeType: 'handle',
          handleMode: 'any',
          receivers: [
            { id: 'rec_hd', type: 'group', scope: 'all', targetId: 'grp_holiday_duty', targetName: '节假日应急值班组' }
          ],
          timeLimit: { type: 'fixed_duration', duration: 1, durationUnit: 'hours' },
          overdueRules: ['alert', 'escalate'],
          isValid: true
        }
      },
      {
        id: 'node_appr_duty',
        type: 'approval',
        x: 790,
        y: 240,
        data: {
          name: '值班指挥长研判审定',
          nodeType: 'approval',
          approvalMode: 'single',
          receivers: [{ id: 'rec_cm', type: 'user', scope: 'all', targetId: 'usr_qianqi', targetName: '钱七 (单位负责人)' }],
          approvalActions: ['pass', 'return'],
          isValid: true
        }
      },
      {
        id: 'node_e_duty',
        type: 'end',
        x: 1010,
        y: 240,
        data: { name: '应急处置归档', nodeType: 'end', businessEvents: ['TASK_COMPLETED'], isValid: true }
      }
    ],
    edges: [
      { id: 'ed_1', source: 'node_s_duty', target: 'node_c_duty', label: '自动判别日期' },
      { id: 'ed_2', source: 'node_c_duty', target: 'node_h_workday', label: '工作日', branchId: 'b_workday' },
      { id: 'ed_3', source: 'node_c_duty', target: 'node_h_duty', label: '周末/节假日', branchId: 'b_holiday' },
      { id: 'ed_4', source: 'node_h_workday', target: 'node_appr_duty', label: '处室提交' },
      { id: 'ed_5', source: 'node_h_duty', target: 'node_appr_duty', label: '值班组报送' },
      { id: 'ed_6', source: 'node_appr_duty', target: 'node_e_duty', label: '审核归档' }
    ]
  },

  // 示例四：五部门跨机构全员会签流程
  {
    id: 'proc_countersign_task',
    systemId: 'SYS_DDSB',
    systemName: '点点速报 - 协同督办与指令流转系统',
    processCode: 'MULTI_COUNTERSIGN_FLOW',
    processName: '跨部门全员联署会签流程',
    description: '同时派发给办公室、网安、历下、指挥中心、治安等5人，必须全部签署/办结后方可进入下一节点',
    category: 'special',
    categoryName: '多方协同类',
    version: 'V1.0',
    status: 'published',
    scope: 'platform',
    relatedTemplateIds: ['tpl_ddsb_multi_sign', 'tpl_zgy_net_comment'],
    relatedTemplateNames: ['跨部门多方联合会签公文模板', '网络舆论引导与网评巡查模板'],
    allowMultiTemplates: true,
    creator: '张三',
    createdAt: '2026-08-28 14:00',
    updatedAt: '2026-09-15 09:10',
    nodes: [
      {
        id: 'n_cs_start',
        type: 'start',
        x: 50,
        y: 220,
        data: { name: '联签公文发起', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
      },
      {
        id: 'n_cs_handle',
        type: 'handle',
        x: 300,
        y: 220,
        data: {
          name: '五部门骨干联合会签',
          nodeType: 'handle',
          handleMode: 'countersign',
          countersignConfig: {
            finishCondition: 'all'
          },
          receivers: [
            { id: 'r_u1', type: 'user', scope: 'all', targetId: 'usr_zhangsan', targetName: '张三 (办公室)' },
            { id: 'r_u2', type: 'user', scope: 'all', targetId: 'usr_lisi', targetName: '李四 (网安支队)' },
            { id: 'r_u3', type: 'user', scope: 'all', targetId: 'usr_wangwu', targetName: '王五 (历下分局)' },
            { id: 'r_u4', type: 'user', scope: 'all', targetId: 'usr_zhaoliu', targetName: '赵六 (指挥中心)' },
            { id: 'r_u5', type: 'user', scope: 'all', targetId: 'usr_qianqi', targetName: '钱七 (治安支队)' }
          ],
          timeLimit: { type: 'fixed_duration', duration: 2, durationUnit: 'work_days' },
          overdueRules: ['alert', 'urge'],
          isValid: true
        }
      },
      {
        id: 'n_cs_appr',
        type: 'approval',
        x: 600,
        y: 220,
        data: {
          name: '主管局长终审签署',
          nodeType: 'approval',
          approvalMode: 'leader',
          receivers: [{ id: 'r_lead', type: 'role', scope: 'all', targetId: 'role_unit_leader', targetName: '单位负责人' }],
          approvalActions: ['pass', 'return'],
          isValid: true
        }
      },
      {
        id: 'n_cs_end',
        type: 'end',
        x: 870,
        y: 220,
        data: { name: '联署会签生效归档', nodeType: 'end', businessEvents: ['TASK_COMPLETED', 'CONTENT_ADOPTED'], isValid: true }
      }
    ],
    edges: [
      { id: 'e_cs1', source: 'n_cs_start', target: 'n_cs_handle', label: '派发5人会签' },
      { id: 'e_cs2', source: 'n_cs_handle', target: 'n_cs_appr', label: '5人全员签署达成' },
      { id: 'e_cs3', source: 'n_cs_appr', target: 'n_cs_end', label: '终审通过' }
    ]
  },

  // 示例五：或签敏捷抢单流程
  {
    id: 'proc_or_sign_task',
    systemId: 'SYS_DDSB',
    systemName: '点点速报 - 协同督办与指令流转系统',
    processCode: 'QUICK_OR_SIGN_FLOW',
    processName: '应急突击抢办或签流程',
    description: '同时推送到指定5名业务骨干，任何一人先行完成办理反馈，节点立即达成并推进',
    category: 'task',
    categoryName: '敏捷处置类',
    version: 'V1.0',
    status: 'published',
    scope: 'platform',
    relatedTemplateIds: ['tpl_ddsb_urgent_order', 'tpl_zgy_net_comment'],
    relatedTemplateNames: ['应急督办与突击抢单指令模板', '网络舆论引导与网评巡查模板'],
    allowMultiTemplates: true,
    creator: '李四',
    createdAt: '2026-09-01 16:30',
    updatedAt: '2026-09-17 11:20',
    nodes: [
      {
        id: 'n_os_start',
        type: 'start',
        x: 50,
        y: 220,
        data: { name: '突击任务下达', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
      },
      {
        id: 'n_os_handle',
        type: 'handle',
        x: 310,
        y: 220,
        data: {
          name: '敏捷抢办或签承接',
          nodeType: 'handle',
          handleMode: 'or_sign',
          receivers: [
            { id: 'r_os1', type: 'user', scope: 'all', targetId: 'usr_zhangsan', targetName: '张三' },
            { id: 'r_os2', type: 'user', scope: 'all', targetId: 'usr_lisi', targetName: '李四' },
            { id: 'r_os3', type: 'user', scope: 'all', targetId: 'usr_wangwu', targetName: '王五' },
            { id: 'r_os4', type: 'user', scope: 'all', targetId: 'usr_zhaoliu', targetName: '赵六' },
            { id: 'r_os5', type: 'user', scope: 'all', targetId: 'usr_qianqi', targetName: '钱七' }
          ],
          timeLimit: { type: 'fixed_duration', duration: 4, durationUnit: 'hours' },
          overdueRules: ['alert', 'escalate'],
          isValid: true
        }
      },
      {
        id: 'n_os_cc',
        type: 'cc',
        x: 590,
        y: 220,
        data: {
          name: '全网通报抄送',
          nodeType: 'cc',
          ccReceivers: [
            { id: 'r_grp', type: 'group', scope: 'all', targetId: 'grp_special_action', targetName: '专项行动工作组' }
          ],
          ccMethods: ['in_app_notice', 'sms'],
          isValid: true
        }
      },
      {
        id: 'n_os_end',
        type: 'end',
        x: 870,
        y: 220,
        data: { name: '抢单办结', nodeType: 'end', businessEvents: ['TASK_COMPLETED'], isValid: true }
      }
    ],
    edges: [
      { id: 'e_os1', source: 'n_os_start', target: 'n_os_handle', label: '派发5人抢单' },
      { id: 'e_os2', source: 'n_os_handle', target: 'n_os_cc', label: '任意一人抢办即生效' },
      { id: 'e_os3', source: 'n_os_cc', target: 'n_os_end', label: '抄送完成' }
    ]
  },

  // 示例六：设计中状态 - 组织节点群组下发与三路条件分支流程
  {
    id: 'proc_org_dispatch_3branches',
    systemId: 'SYS_ZLL',
    systemName: '指令流转',
    processCode: 'ORG_GROUP_DISPATCH_FLOW',
    processName: '组织节点群组下发与三路条件分支流程',
    description: '采用「下发组织节点群组」自定义组件，根据下发目标与风险等级自动拆分为 3 路条件分支精准流转（设计中状态草稿）',
    category: 'approval',
    categoryName: '组织下发类',
    version: 'V1.0.0 (设计中)',
    status: 'draft',
    scope: 'platform',
    relatedTemplateIds: ['1008291011'],
    relatedTemplateNames: ['跨部门下发与多路组织节点协作流程模板'],
    allowMultiTemplates: false,
    creator: '张建国',
    createdAt: '2026-09-29 09:00',
    updatedAt: '2026-09-29 10:00',
    nodes: [
      {
        id: 'node_start_disp',
        type: 'start',
        x: 50,
        y: 240,
        data: { name: '组织指令下发启动', nodeType: 'start', startTriggerType: 'auto_create', isValid: true }
      },
      {
        id: 'node_handle_disp',
        type: 'handle',
        x: 260,
        y: 240,
        data: {
          name: '下发组织节点参数配置与派发',
          nodeType: 'handle',
          handleMode: 'single',
          receivers: [
            { id: 'rec_disp_1', type: 'role', scope: 'current_org', targetId: 'role_handler', targetName: '下发经办民警', description: '填报「下发组织节点群组」与指令要点' }
          ],
          isValid: true
        }
      },
      {
        id: 'node_cond_disp_3',
        type: 'condition',
        x: 500,
        y: 240,
        data: {
          name: '下发组织与风险 3 路分支分流',
          nodeType: 'condition',
          conditionBranches: [
            {
              id: 'branch_disp_1',
              name: '分支一：市局直属分局/大队特急下发',
              relation: 'AND',
              rules: [
                { id: 'rule_disp_1', field: 'dispatchOrgGroup', fieldName: '下发组织节点群组', operator: 'contains', value: '直属分局', valueLabel: '直属分局' },
                { id: 'rule_disp_2', field: 'urgency', fieldName: '紧急程度', operator: 'eq', value: 'extreme', valueLabel: '特急' }
              ],
              targetNodeId: 'node_appr_lead_disp'
            },
            {
              id: 'branch_disp_2',
              name: '分支二：全辖派出所群组高风险直达',
              relation: 'AND',
              rules: [
                { id: 'rule_disp_3', field: 'dispatchOrgGroup', fieldName: '下发组织节点群组', operator: 'contains', value: '派出所群组', valueLabel: '派出所群组' },
                { id: 'rule_disp_4', field: 'riskLevel', fieldName: '预警风险等级', operator: 'eq', value: 'high', valueLabel: '高风险' }
              ],
              targetNodeId: 'node_handle_pcs_disp'
            },
            {
              id: 'branch_disp_3',
              name: '分支三：常规属地科室下发（兜底通道）',
              relation: 'AND',
              rules: [],
              isDefault: true,
              targetNodeId: 'node_handle_dept_disp'
            }
          ],
          isValid: true
        }
      },
      {
        id: 'node_appr_lead_disp',
        type: 'approval',
        x: 780,
        y: 100,
        data: {
          name: '市局分管领导特急核决',
          nodeType: 'approval',
          approvalMode: 'leader',
          receivers: [{ id: 'rec_lead_1', type: 'role', scope: 'all', targetId: 'role_unit_leader', targetName: '单位负责人', description: '分管局领导审定并签署指令' }],
          isValid: true
        }
      },
      {
        id: 'node_handle_pcs_disp',
        type: 'handle',
        x: 780,
        y: 240,
        data: {
          name: '派出所值班班组联动抢办',
          nodeType: 'handle',
          handleMode: 'any',
          receivers: [{ id: 'rec_pcs_1', type: 'org', scope: 'current_and_sub', targetId: 'pcs_all', targetName: '全辖78个派出所', description: '派出所值班领导快速抢办处置' }],
          isValid: true
        }
      },
      {
        id: 'node_handle_dept_disp',
        type: 'handle',
        x: 780,
        y: 380,
        data: {
          name: '属地承办科室常规办理',
          nodeType: 'handle',
          handleMode: 'single',
          receivers: [{ id: 'rec_dept_1', type: 'role', scope: 'current_org', targetId: 'role_dept_leader', targetName: '部门负责人', description: '科室负责人接收并分发办理' }],
          isValid: true
        }
      },
      {
        id: 'node_end_disp',
        type: 'end',
        x: 1040,
        y: 240,
        data: { name: '组织指令下发办结归档', nodeType: 'end', businessEvents: ['TASK_COMPLETED'], isValid: true }
      }
    ],
    edges: [
      { id: 'edge_d1', source: 'node_start_disp', target: 'node_handle_disp', label: '配置参数' },
      { id: 'edge_d2', source: 'node_handle_disp', target: 'node_cond_disp_3', label: '评估分流' },
      { id: 'edge_d3', source: 'node_cond_disp_3', target: 'node_appr_lead_disp', label: '直属特急分支' },
      { id: 'edge_d4', source: 'node_cond_disp_3', target: 'node_handle_pcs_disp', label: '派出所高风险分支' },
      { id: 'edge_d5', source: 'node_cond_disp_3', target: 'node_handle_dept_disp', label: '常规兜底分支' },
      { id: 'edge_d6', source: 'node_appr_lead_disp', target: 'node_end_disp', label: '审核归档' },
      { id: 'edge_d7', source: 'node_handle_pcs_disp', target: 'node_end_disp', label: '处置归档' },
      { id: 'edge_d8', source: 'node_handle_dept_disp', target: 'node_end_disp', label: '办结归档' }
    ]
  }
];

// 版本历史 Mock
export const MOCK_PROCESS_VERSIONS: ProcessVersionItem[] = [
  {
    id: 'ver_draft_1',
    processId: 'proc_org_dispatch_3branches',
    processCode: 'ORG_GROUP_DISPATCH_FLOW',
    processName: '组织节点群组下发与三路条件分支流程',
    version: 'V1.0.0 (设计中)',
    status: 'draft',
    creator: '张建国',
    createdAt: '2026-09-29 09:00',
    publishedAt: '-',
    changeLog: '草稿初始化：集成「下发组织节点/群组」自定义控件，内置3路条件分支判定',
    nodesCount: 7
  },
  {
    id: 'ver_1',
    processId: 'proc_normal_task',
    processCode: 'WORK_TASK_NORMAL',
    processName: '标准工作任务办理流程',
    version: 'V1.0',
    status: 'published',
    creator: '张三',
    createdAt: '2026-08-15 09:30',
    publishedAt: '2026-08-15 10:00',
    changeLog: '首发版本，包含任务下发、责任承办、处室负责人审核三级标准链',
    nodesCount: 4
  },
  {
    id: 'ver_2',
    processId: 'proc_amount_approval',
    processCode: 'AMOUNT_COND_APPROVAL',
    processName: '涉案核查金额分级审批流程',
    version: 'V1.0',
    status: 'published',
    creator: '李四',
    createdAt: '2026-08-20 11:00',
    publishedAt: '2026-08-20 11:30',
    changeLog: '上线涉案金额多分支判断能力（>=10000元局领导核准，<10000元处室核准）',
    nodesCount: 6
  },
  {
    id: 'ver_3',
    processId: 'proc_duty_holiday',
    processCode: 'DUTY_CALENDAR_DISPATCH',
    processName: '节假日值班自适应分流流程',
    version: 'V1.0',
    status: 'published',
    creator: '赵六',
    createdAt: '2026-08-25 10:15',
    publishedAt: '2026-08-25 10:45',
    changeLog: '上线智能日历判定分支，自动识别双休日/法定节假日值班响应',
    nodesCount: 6
  },
  {
    id: 'ver_4',
    processId: 'proc_countersign_task',
    processCode: 'MULTI_COUNTERSIGN_FLOW',
    processName: '跨部门全员联署会签流程',
    version: 'V1.0',
    status: 'published',
    creator: '张三',
    createdAt: '2026-08-28 14:00',
    publishedAt: '2026-08-28 14:30',
    changeLog: '首发5人全员联署会签，满足多部门共同签署合规要求',
    nodesCount: 4
  },
  {
    id: 'ver_5',
    processId: 'proc_or_sign_task',
    processCode: 'QUICK_OR_SIGN_FLOW',
    processName: '应急突击抢办或签流程',
    version: 'V1.0',
    status: 'published',
    creator: '李四',
    createdAt: '2026-09-01 16:30',
    publishedAt: '2026-09-01 17:00',
    changeLog: '首发多人或签抢单模式，任意一人办理达成即自动流转下一步',
    nodesCount: 4
  }
];

// 流程业务分类
export const PROCESS_CATEGORIES = [
  { id: 'all', name: '全部分类', desc: '包含系统所有类型指令流转流程' },
  { id: 'task', name: '工作任务类', desc: '日常工作、专项排查与阶段性行动流转' },
  { id: 'report', name: '信息报送类', desc: '下级向上级汇报、日情预警简报报送' },
  { id: 'approval', name: '审批核决类', desc: '需逐级或跨部门签字盖章核决的事项' },
  { id: 'verify', name: '督办核查类', desc: '督查督办、线索核实与限期整改反馈' },
  { id: 'urge', name: '催办督促类', desc: '临期催办、严重超时告警与领导督办' },
  { id: 'special', name: '专项任务类', desc: '跨警种、跨部门专项攻坚联合行动' }
];
