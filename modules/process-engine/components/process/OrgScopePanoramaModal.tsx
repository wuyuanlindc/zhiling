/**
 * 机构归属与授权全景查看弹窗 (OrgScopePanoramaModal)
 * 精确参照最新设计原型：
 * 1. 顶部检索栏：统计单元名称复合输入框、客户简称/全称/统一社会信用代码、客户经理、版本授权、应用状态、搜索/重置按钮
 * 2. 核心表格：
 *    - 客户简称 (悬浮查看详情) / 统计单元 (带橙色详情提示图标与浮层)
 *    - 所属销售 / 经办人
 *    - 开通版本 (正式版/专业版紫色微章)
 *    - 授权状态 (绿色已开通 / 灰色已关停)
 *    - 服务到期日期 ⇅ (到期日期 + 距离到期天数/红字逾期天数)
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  X, 
  User, 
  ChevronDown, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { ProcessTemplateItem } from '../../types/processEngine';

interface OrgScopePanoramaModalProps {
  template: ProcessTemplateItem;
  onClose: () => void;
}

export interface ClientAuthItem {
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
}

export const OrgScopePanoramaModal: React.FC<OrgScopePanoramaModalProps> = ({
  template,
  onClose
}) => {
  // 顶部筛选条件状态
  const [unitPathInput, setUnitPathInput] = useState('康奈总部 / 陕西区域√ / 陕西二区√ / 安康商洛区域 / 商洛市');
  const [clientSearch, setClientSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [versionAuthFilter, setVersionAuthFilter] = useState('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // 排序状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 当前悬浮详情卡片
  const [hoveredItem, setHoveredItem] = useState<ClientAuthItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  const isPublic = template.scope === 'public';

  // 构造全量授权机构与客户列表数据（标准复现参考图片数据）
  const allAuthClients = useMemo<ClientAuthItem[]>(() => {
    const baseList: ClientAuthItem[] = [
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
      },
      {
        id: 'c_06',
        name: '宜宾动力电池大脑',
        fullName: '宜宾动力电池智能制造与数据运营创新中心',
        creditCode: '91511500MA6T88KK7F',
        unitPath: '陕西二区',
        salesName: '王海涛',
        salesPhone: '139****1122',
        version: '正式版',
        status: 'active',
        expireDate: '2027-04-14',
        daysRemaining: 198,
        authDate: '2025-04-14',
        description: '动力电池全生命周期监控平台，承担安全生产指令跨层级流转'
      },
      {
        id: 'c_07',
        name: '西电智校物联',
        fullName: '西安电子科技大学智慧校园物联网运营中心',
        creditCode: '91610100MA6R99MM8G',
        unitPath: '康奈总部',
        salesName: '夏小花',
        salesPhone: '138****0192',
        version: '正式版',
        status: 'active',
        expireDate: '2028-05-14',
        daysRemaining: 594,
        authDate: '2025-05-14',
        description: '校园智能感知与应急督办节点，支持信息即时直报与处置'
      }
    ];

    // 如果模板自身绑定了机构，融合进列表
    const extraOrgNames = template.orgNames && template.orgNames.length > 0 
      ? template.orgNames 
      : (template.orgName ? [template.orgName] : []);

    const extraItems: ClientAuthItem[] = extraOrgNames.map((name, idx) => ({
      id: `tpl_org_${idx}`,
      name: name,
      fullName: `${name}（${template.systemName || '业务系统'}指定授权机构）`,
      creditCode: `91370100MA${String(8000 + idx)}XX9${idx}`,
      unitPath: idx % 2 === 0 ? '康奈总部' : '陕西区域',
      salesName: idx % 2 === 0 ? '张建国' : '夏小花',
      salesPhone: '138****6688',
      version: '正式版',
      status: 'active',
      expireDate: '2027-12-31',
      daysRemaining: 450 + idx * 30,
      authDate: '2025-01-01',
      description: `【${template.templateName}】当前关联的重点执行单位，负责业务协同落地与办理`
    }));

    const map = new Map<string, ClientAuthItem>();
    baseList.forEach(item => map.set(item.name, item));
    extraItems.forEach(item => {
      if (!map.has(item.name)) {
        map.set(item.name, item);
      }
    });

    return Array.from(map.values());
  }, [template]);

  // 根据多重筛选条件过滤与排序
  const filteredList = useMemo(() => {
    let result = allAuthClients.filter(item => {
      // 1. 统计单元搜索/路径
      if (unitPathInput.trim()) {
        const paths = unitPathInput.split('/').map(s => s.replace('√', '').trim()).filter(Boolean);
        if (paths.length > 0) {
          const matchUnit = paths.some(p => item.unitPath.includes(p) || p.includes(item.unitPath));
          if (!matchUnit && !unitPathInput.includes(item.unitPath)) {
            // 允许自定义模糊输入
          }
        }
      }

      // 2. 客户简称、全称、统一社会信用代码搜索
      if (clientSearch.trim()) {
        const kw = clientSearch.toLowerCase().trim();
        const matchClient = 
          item.name.toLowerCase().includes(kw) ||
          item.fullName.toLowerCase().includes(kw) ||
          item.creditCode.toLowerCase().includes(kw);
        if (!matchClient) return false;
      }

      // 3. 客户经理搜索
      if (managerSearch.trim()) {
        const kw = managerSearch.toLowerCase().trim();
        const matchMgr = item.salesName.toLowerCase().includes(kw);
        if (!matchMgr) return false;
      }

      // 4. 版本授权状态筛选
      if (versionAuthFilter !== 'ALL') {
        if (versionAuthFilter === 'formal' && item.version !== '正式版') return false;
        if (versionAuthFilter === 'pro' && item.version !== '专业版') return false;
      }

      // 5. 应用状态筛选
      if (appStatusFilter !== 'ALL') {
        if (appStatusFilter === 'active' && item.status !== 'active') return false;
        if (appStatusFilter === 'inactive' && item.status !== 'inactive') return false;
      }

      return true;
    });

    // 排序
    result.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.daysRemaining - b.daysRemaining;
      }
      return b.daysRemaining - a.daysRemaining;
    });

    return result;
  }, [allAuthClients, unitPathInput, clientSearch, managerSearch, versionAuthFilter, appStatusFilter, sortOrder]);

  // 分页截取
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const handleResetFilters = () => {
    setUnitPathInput('');
    setClientSearch('');
    setManagerSearch('');
    setVersionAuthFilter('ALL');
    setAppStatusFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ===================== 顶部标题栏 ===================== */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  机构归属与授权全景查看
                </h3>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {template.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {isPublic ? '公共覆盖 (全域开放)' : `已授权 ${allAuthClients.length} 家机构客户`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                当前模板：<strong className="text-slate-700">{template.templateName}</strong>
                <span className="ml-2 text-slate-400">所属系统: {template.systemName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== 顶部组合筛选项 (精确还原图片) ===================== */}
        <div className="p-5 border-b border-slate-100 bg-[#fafbfc] shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            {/* 1. 统计单元 */}
            <div className="w-72 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">统计单元</label>
              <div className="h-9 bg-white border border-slate-200 rounded-lg flex items-center px-1.5 text-xs focus-within:border-blue-500 shadow-2xs">
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[11px] font-medium shrink-0 select-none mr-1.5 border border-slate-200/80">
                  统计单元名称
                </span>
                <input
                  type="text"
                  value={unitPathInput}
                  onChange={e => {
                    setUnitPathInput(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="选择或输入统计单元..."
                  className="w-full bg-transparent text-xs text-slate-700 outline-none truncate font-medium"
                />
                {unitPathInput && (
                  <button
                    type="button"
                    onClick={() => setUnitPathInput('')}
                    className="p-1 text-slate-300 hover:text-slate-500 rounded-full cursor-pointer shrink-0"
                    title="清空统计单元"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. 客户简称、全称、统一社会信用代码 */}
            <div className="w-56 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                客户简称、全称、统一社会信用代码
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={e => {
                  setClientSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="客户简称、全称、统一社会信用代码"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* 3. 客户经理 */}
            <div className="w-36 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">客户经理</label>
              <input
                type="text"
                value={managerSearch}
                onChange={e => {
                  setManagerSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="客户经理名称"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* 4. 版本授权 */}
            <div className="w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">版本授权</label>
              <div className="relative">
                <select
                  value={versionAuthFilter}
                  onChange={e => {
                    setVersionAuthFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 shadow-2xs appearance-none cursor-pointer font-medium"
                >
                  <option value="ALL">全部授权</option>
                  <option value="formal">正式版</option>
                  <option value="pro">专业版</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 5. 应用状态 */}
            <div className="w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">应用状态</label>
              <div className="relative">
                <select
                  value={appStatusFilter}
                  onChange={e => {
                    setAppStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 shadow-2xs appearance-none cursor-pointer font-medium"
                >
                  <option value="ALL">全部状态</option>
                  <option value="active">已开通</option>
                  <option value="inactive">已关停</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 搜索与重置按钮 */}
            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="h-9 px-4 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>搜索</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================== 表格主体区域 (1:1 还原包含 5 个主列) ===================== */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 min-w-[260px]">
                    客户简称 (悬浮查看详情) / 统计单元
                  </th>
                  <th className="py-3 px-5 w-44">所属销售</th>
                  <th className="py-3 px-5 w-32">开通版本</th>
                  <th className="py-3 px-5 w-32">授权状态</th>
                  <th className="py-3 px-5 w-44">
                    <button
                      type="button"
                      onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                      className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                      <span>服务到期日期</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="text-xs">暂无符合条件的客户与统计单元授权记录</span>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>重置筛选条件</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map(item => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* 列 1：客户简称 / 统计单元 */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs tracking-tight">
                              {item.name}
                            </span>
                            
                            {/* 橙色悬浮详情圆圈图标 (i) */}
                            <div 
                              className="relative inline-flex items-center cursor-pointer"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverPos({ x: rect.left + 20, y: rect.top - 10 });
                                setHoveredItem(item);
                              }}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <div className="w-4 h-4 rounded-full border border-amber-500 text-amber-500 flex items-center justify-center text-[10px] font-bold hover:bg-amber-50 transition-colors">
                                i
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 font-medium">
                            统计单元: <span className="text-slate-600">{item.unitPath}</span>
                          </div>
                        </div>
                      </td>

                      {/* 列 2：所属销售 */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="w-4 h-4 text-slate-400 shrink-0 stroke-[1.75]" />
                          <span className="font-medium text-xs">{item.salesName}</span>
                        </div>
                      </td>

                      {/* 列 3：开通版本 (紫色标签) */}
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
                          {item.version}
                        </span>
                      </td>

                      {/* 列 4：授权状态 (已开通带绿点 / 已关停带锁) */}
                      <td className="py-3.5 px-5">
                        {item.status === 'active' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] inline-flex items-center gap-1.5 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                            <span>已开通</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-300 inline-flex items-center gap-1.5 shadow-2xs">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>已关停</span>
                          </span>
                        )}
                      </td>

                      {/* 列 5：服务到期日期 */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-800 font-mono">
                            到期：{item.expireDate}
                          </div>
                          <div className={`text-[11px] font-bold font-mono ${
                            item.daysRemaining < 0 
                              ? 'text-red-500 font-bold' 
                              : (item.daysRemaining <= 100 ? 'text-amber-600' : 'text-slate-400')
                          }`}>
                            距离到期: {item.daysRemaining} 天
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== 悬浮查看详情卡片 (Tooltip) ===================== */}
        {hoveredItem && (
          <div 
            className="fixed z-[100] w-80 bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-2xl border border-slate-200 text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              left: Math.min(window.innerWidth - 340, hoverPos.x), 
              top: Math.min(window.innerHeight - 240, hoverPos.y) 
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-slate-800">{hoveredItem.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">
                {hoveredItem.version}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">客户全称:</span>
                <span className="font-medium text-slate-700 text-right max-w-[190px] truncate">{hoveredItem.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">社会信用代码:</span>
                <span className="font-mono text-slate-700">{hoveredItem.creditCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">所属统计单元:</span>
                <span className="font-medium text-slate-700">{hoveredItem.unitPath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">经办销售经理:</span>
                <span className="font-medium text-slate-700">{hoveredItem.salesName} ({hoveredItem.salesPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">服务有效期限:</span>
                <span className="font-mono text-slate-700">{hoveredItem.authDate} ~ {hoveredItem.expireDate}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
              {hoveredItem.description}
            </div>
          </div>
        )}

        {/* ===================== 底部操作与分页控制栏 ===================== */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            共检索到 <strong className="text-slate-800 font-mono font-bold">{filteredList.length}</strong> 条机构客户记录
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer"
          >
            关闭全景视图
          </button>
        </div>
      </div>
    </div>
  );
};
