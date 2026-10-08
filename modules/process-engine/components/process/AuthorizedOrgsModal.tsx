import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  X, 
  Copy, 
  Check, 
  Layers, 
  Download, 
  Filter, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface AuthorizedOrgsModalProps {
  templateName: string;
  templateId: string;
  systemName: string;
  scope: string;
  orgNames: string[];
  onClose: () => void;
}

export const AuthorizedOrgsModal: React.FC<AuthorizedOrgsModalProps> = ({
  templateName,
  templateId,
  systemName,
  scope,
  orgNames = [],
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  // 模拟按辖区归类（若名称中包含对应区县关键字，则归属相应分类，否则为其他）
  const classifiedOrgs = useMemo(() => {
    return orgNames.map((name, index) => {
      let district = '市局直属';
      if (name.includes('历下')) district = '历下区';
      else if (name.includes('市中')) district = '市中区';
      else if (name.includes('天桥')) district = '天桥区';
      else if (name.includes('历城')) district = '历城区';
      else if (name.includes('槐荫')) district = '槐荫区';
      else if (name.includes('高新')) district = '高新区';
      else if (name.includes('支队') || name.includes('中心') || name.includes('处')) district = '市局机关';

      return {
        id: `org_auth_${index + 1}`,
        index: index + 1,
        name,
        district,
        code: `ORG_${String(index + 1).padStart(4, '0')}`,
        status: 'authorized'
      };
    });
  }, [orgNames]);

  // 辖区分组统计
  const districtStats = useMemo(() => {
    const stats: Record<string, number> = {};
    classifiedOrgs.forEach(o => {
      stats[o.district] = (stats[o.district] || 0) + 1;
    });
    return stats;
  }, [classifiedOrgs]);

  const districtList = useMemo(() => {
    return ['ALL', ...Object.keys(districtStats)];
  }, [districtStats]);

  // 搜索过滤后的机构列表
  const filteredOrgs = useMemo(() => {
    return classifiedOrgs.filter(item => {
      const matchDistrict = selectedDistrict === 'ALL' || item.district === selectedDistrict;
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchDistrict && matchSearch;
    });
  }, [classifiedOrgs, selectedDistrict, searchQuery]);

  // 一键复制全部清单
  const handleCopyAll = () => {
    const text = orgNames.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[880px] max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white border-b border-purple-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  机构专属归属明细
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-200">
                  已授权 {orgNames.length} 家机构
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>所属模板：</span>
                <strong className="text-slate-800 font-semibold max-w-[320px] truncate">{templateName}</strong>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">ID: {templateId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-purple-700 font-medium">{systemName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                copied 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="复制全部机构名单至剪贴板"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已复制名单' : '复制机构清单'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 核心指标与统计卡片栏 */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">授权模式:</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[11px]">
                定向白名单授权 (机构专属)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">覆盖机构规模:</span>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {orgNames.length} <span className="text-xs font-normal text-slate-500">家</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">覆盖辖区分局:</span>
              <span className="font-bold text-slate-800">
                {Object.keys(districtStats).length} 个区县直属局
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            支持搜索过滤与跨辖区快速定位
          </div>
        </div>

        {/* 搜索与分类 Tab 栏 */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {/* 辖区分组 Tab */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            {districtList.map(dist => {
              const count = dist === 'ALL' ? classifiedOrgs.length : (districtStats[dist] || 0);
              const isActive = selectedDistrict === dist;

              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  <span>{dist === 'ALL' ? '全部机构' : dist}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-purple-700 text-purple-100' : 'bg-white text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 实时搜索框 */}
          <div className="relative min-w-[240px] shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索机构名称或编码..."
              className="w-full h-8 pl-8 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 机构网格列表内容区 (针对 100+ 机构的高密清爽设计) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          {filteredOrgs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs">未找到符合条件的专属机构</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedDistrict('ALL'); }}
                className="text-xs text-purple-600 font-bold hover:underline cursor-pointer mt-1"
              >
                清空筛选条件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex items-start justify-between gap-2.5 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                      {String(org.index).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700 transition-colors" title={org.name}>
                        {org.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                          {org.code}
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium border border-purple-100">
                          {org.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span>已授权</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部架构说明与关闭按钮栏 */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              已展示 <strong>{filteredOrgs.length}</strong> / {orgNames.length} 家机构 · 只有名单内的机构账号在发起新流转时可见并使用本模板
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
