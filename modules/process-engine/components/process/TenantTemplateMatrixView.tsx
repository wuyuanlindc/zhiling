/**
 * 3大业务系统多租户模板授权矩阵看板 (TenantTemplateMatrixView)
 * 
 * 核心功能：
 * 1. 矩阵大表：展示各公安分局/租户机构在 正管用、谛听预警、点点速报 3 大系统下的可用模板
 * 2. 区分全平台公用模板继承状态 vs 机构专属定制模板
 * 3. 支持一键为某租户派生定制专属模板
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Globe2, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Siren, 
  Target, 
  Plus, 
  Copy, 
  ArrowRight, 
  FileSpreadsheet, 
  Search,
  Sparkles
} from 'lucide-react';
import { 
  ProcessTemplateItem, 
  ProcessDefinition, 
  BUSINESS_SYSTEMS 
} from '../../types/processEngine';
import { MOCK_ORGS } from '../../data/mockProcessEngine';

interface TenantTemplateMatrixViewProps {
  templates: ProcessTemplateItem[];
  processes: ProcessDefinition[];
  onOpenCreateTemplateForOrg: (orgId: string, systemId: string) => void;
  onPreviewTemplate: (template: ProcessTemplateItem) => void;
}

export const TenantTemplateMatrixView: React.FC<TenantTemplateMatrixViewProps> = ({
  templates,
  processes,
  onOpenCreateTemplateForOrg,
  onPreviewTemplate
}) => {
  const [activeSystemId, setActiveSystemId] = useState<string>('SYS_ZGY');
  const [searchOrg, setSearchOrg] = useState<string>('');

  const currentSys = BUSINESS_SYSTEMS.find(s => s.id === activeSystemId) || BUSINESS_SYSTEMS[0];

  // 该业务系统下的公共模板
  const publicTemplates = templates.filter(t => t.systemId === activeSystemId && t.scope === 'public');

  // 过滤机构
  const filteredOrgs = MOCK_ORGS.filter(org => {
    if (!searchOrg.trim()) return true;
    return org.name.toLowerCase().includes(searchOrg.trim().toLowerCase()) ||
           org.code.toLowerCase().includes(searchOrg.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 顶部系统切换卡片 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>3大业务系统 · 租户模板分布与派生矩阵</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            实时查看各租户机构在所选业务系统中的公共模板继承与机构专属定制模板配置情况
          </p>
        </div>

        {/* 3系统快捷切换 Tab */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          {BUSINESS_SYSTEMS.map(sys => {
            const isSelected = activeSystemId === sys.id;
            const IconComponent = 
              sys.id === 'SYS_ZGY' ? ShieldCheck :
              sys.id === 'SYS_DTYJ' ? Siren : Target;

            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => setActiveSystemId(sys.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${
                  sys.id === 'SYS_ZGY' ? 'text-blue-600' :
                  sys.id === 'SYS_DTYJ' ? 'text-amber-600' : 'text-emerald-600'
                }`} />
                <span>{sys.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索与当前系统公共模板清单 */}
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" />
            <span>【{currentSys.shortName}】当前全网公共标准模板 ({publicTemplates.length})：</span>
          </span>
          {publicTemplates.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onPreviewTemplate(tpl)}
              className="px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-400 text-blue-800 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3 text-blue-600" />
              <span>{tpl.templateName}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchOrg}
            onChange={e => setSearchOrg(e.target.value)}
            placeholder="过滤租户机构/分局..."
            className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 矩阵大表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4 w-48">租户机构 / 直属分局</th>
                <th className="py-3 px-4 w-32">机构编码</th>
                <th className="py-3 px-4 w-52">全网公共模板继承状态</th>
                <th className="py-3 px-4">机构专属定制模板</th>
                <th className="py-3 px-4 w-36 text-right">租户专属定制操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map(org => {
                // 查找属于该机构的专属模板
                const exclusiveTemplates = templates.filter(
                  t => t.systemId === activeSystemId && t.scope === 'org' && t.orgId === org.id
                );

                return (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 机构名称 */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{org.name}</span>
                      </div>
                    </td>

                    {/* 机构编码 */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {org.code}
                    </td>

                    {/* 公共模板继承 */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>全量继承 ({publicTemplates.length} 个公共模板)</span>
                      </span>
                    </td>

                    {/* 专属定制模板列表 */}
                    <td className="py-3.5 px-4">
                      {exclusiveTemplates.length === 0 ? (
                        <span className="text-slate-400 text-[11px]">暂无专属定制模板 (使用公共标准版)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {exclusiveTemplates.map(tpl => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => onPreviewTemplate(tpl)}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="点击仿真预览此专属模板"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-purple-600" />
                              <span>{tpl.templateName}</span>
                              <span className="text-[10px] text-purple-400 font-mono">({tpl.fields.length}字段)</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* 操作：为该机构派生专属模板 */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenCreateTemplateForOrg(org.id, activeSystemId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>定制专属模板</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
