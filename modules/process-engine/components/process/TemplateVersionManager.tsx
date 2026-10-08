/**
 * 流程与模板版本管理组件 (TemplateVersionManager)
 * 包含：
 * 1. 顶部右上角版本触发器与下拉菜单（流程版本V4 [启用中] / 历史版本列表 / 修改版本备注 / 流程版本管理）
 * 2. 修改版本备注小弹窗
 * 3. 流程版本管理全屏/居中模态框（状态过滤、排序、搜索、版本列表明细与操作）
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Settings, 
  Search, 
  Check, 
  Trash2, 
  Eye, 
  AlertCircle,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Plus
} from 'lucide-react';
import { FormWidgetComponent } from '../../types/processEngine';

export interface ProcessTemplateVersionRecord {
  id: string;
  versionCode: string;
  remark: string;
  status: 'active' | 'history' | 'draft';
  creator: string;
  createdAt: string;
  updater: string;
  updatedAt: string;
  widgetsSnapshot?: FormWidgetComponent[];
}

export interface TemplateVersionManagerProps {
  templateName?: string;
  templateType?: 'normal' | 'process';
  initialVersionCode?: string;
  versionList?: ProcessTemplateVersionRecord[];
  selectedVersionId?: string;
  onVersionListChange?: (list: ProcessTemplateVersionRecord[]) => void;
  onVersionChange?: (version: ProcessTemplateVersionRecord) => void;
  onCreateNewDraft?: () => void;
  dropdownAlign?: 'left' | 'right';
}

// 预置各版本高保真真实表单快照 (支持普通模板与流程模板)
export const getDefaultVersionList = (templateType: 'normal' | 'process' = 'process'): ProcessTemplateVersionRecord[] => {
  if (templateType === 'normal') {
    return [
      {
        id: 'ver_v4',
        versionCode: 'V4',
        remark: '模板版本V4',
        status: 'active',
        creator: '武沅林',
        createdAt: '2026-09-24 15:54:31',
        updater: '武沅林',
        updatedAt: '2026-09-26 21:27:56',
        widgetsSnapshot: [
          { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true, placeholder: '请输入登记事项标题' },
          { id: 'w_n2', key: 'recordDate', label: '登记日期', type: 'date', category: 'basic', span: 12, required: true },
          { id: 'w_n3', key: 'categoryType', label: '业务分类', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '日常登记', value: 'daily' }, { label: '重点排查', value: 'focus' }, { label: '专项督导', value: 'supervision' }, { label: '信息报送', value: 'report' }] },
          { id: 'w_n4', key: 'targetOrg', label: '涉及责任单位/科室', type: 'cascader', category: 'basic', span: 12, required: true, placeholder: '请选择责任单位或辖区科室' },
          { id: 'w_n5', key: 'priorityLevel', label: '重要程度', type: 'select', category: 'basic', span: 12, required: true, options: [{ label: '普通', value: 'normal' }, { label: '重要', value: 'high' }, { label: '紧急', value: 'urgent' }] },
          { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true, placeholder: '详细阐述业务数据、背景情况与填写说明...' },
          { id: 'w_n7', key: 'attachments', label: '佐证材料/附件上传', type: 'file', category: 'basic', span: 24, required: false }
        ]
      },
      {
        id: 'ver_v3',
        versionCode: 'V3',
        remark: '模板版本V3',
        status: 'history',
        creator: '武沅林',
        createdAt: '2026-09-24 14:19:10',
        updater: '武沅林',
        updatedAt: '2026-09-24 15:54:07',
        widgetsSnapshot: [
          { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true },
          { id: 'w_n2', key: 'recordDate', label: '登记日期', type: 'date', category: 'basic', span: 12, required: true },
          { id: 'w_n3', key: 'categoryType', label: '业务分类', type: 'select', category: 'basic', span: 12, required: true },
          { id: 'w_n5', key: 'priorityLevel', label: '重要程度', type: 'select', category: 'basic', span: 12, required: true },
          { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true }
        ]
      },
      {
        id: 'ver_v2',
        versionCode: 'V2',
        remark: '模板版本V2',
        status: 'history',
        creator: '武沅林',
        createdAt: '2026-09-24 14:18:15',
        updater: '武沅林',
        updatedAt: '2026-09-24 15:53:53',
        widgetsSnapshot: [
          { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true },
          { id: 'w_n2', key: 'recordDate', label: '登记日期', type: 'date', category: 'basic', span: 12, required: true },
          { id: 'w_n3', key: 'categoryType', label: '业务分类', type: 'select', category: 'basic', span: 12, required: true },
          { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true }
        ]
      },
      {
        id: 'ver_v1',
        versionCode: 'V1',
        remark: '模板版本V1',
        status: 'history',
        creator: '武沅林',
        createdAt: '2026-09-24 14:04:47',
        updater: '武沅林',
        updatedAt: '2026-09-26 21:27:56',
        widgetsSnapshot: [
          { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true },
          { id: 'w_n2', key: 'recordDate', label: '登记日期', type: 'date', category: 'basic', span: 12, required: true },
          { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true }
        ]
      },
      {
        id: 'ver_v0',
        versionCode: 'V0',
        remark: '模板版本V0',
        status: 'history',
        creator: '武沅林',
        createdAt: '2026-09-24 14:02:03',
        updater: '武沅林',
        updatedAt: '2026-09-24 14:18:18',
        widgetsSnapshot: [
          { id: 'w_n1', key: 'recordTitle', label: '事项/登记标题', type: 'input', category: 'basic', span: 24, required: true },
          { id: 'w_n6', key: 'contentDetail', label: '详细信息说明', type: 'textarea', category: 'basic', span: 24, required: true }
        ]
      }
    ];
  }

  // 流程模板默认版本表单快照
  return [
    {
      id: 'ver_v4',
      versionCode: 'V4',
      remark: '流程版本V4',
      status: 'active',
      creator: '武沅林',
      createdAt: '2026-09-24 15:54:31',
      updater: '武沅林',
      updatedAt: '2026-09-26 21:27:56',
      widgetsSnapshot: [
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
      ]
    },
    {
      id: 'ver_v3',
      versionCode: 'V3',
      remark: '流程版本V3',
      status: 'history',
      creator: '武沅林',
      createdAt: '2026-09-24 14:19:10',
      updater: '武沅林',
      updatedAt: '2026-09-24 15:54:07',
      widgetsSnapshot: [
        { id: 'w_1', key: 'opinionTitle', label: '舆情标题', type: 'input', category: 'basic', span: 24, required: true },
        { id: 'w_2', key: 'monitorTime', label: '监测时间', type: 'date', category: 'basic', span: 12, required: true },
        { id: 'w_4', key: 'warningLevel', label: '预警等级', type: 'select', category: 'basic', span: 12, required: true },
        { id: 'w_6', key: 'mainContent', label: '舆情主要内容与焦点', type: 'textarea', category: 'basic', span: 24, required: true },
        { id: 'w_7', key: 'targetDept', label: '初判涉事责任单位', type: 'cascader', category: 'basic', span: 12, required: true },
        { id: 'w_9', key: 'attachments', label: '佐证材料/截图附件', type: 'file', category: 'basic', span: 24, required: true }
      ]
    },
    {
      id: 'ver_v2',
      versionCode: 'V2',
      remark: '流程版本V2',
      status: 'history',
      creator: '武沅林',
      createdAt: '2026-09-24 14:18:15',
      updater: '武沅林',
      updatedAt: '2026-09-24 15:53:53',
      widgetsSnapshot: [
        { id: 'w_1', key: 'opinionTitle', label: '舆情标题', type: 'input', category: 'basic', span: 24, required: true },
        { id: 'w_2', key: 'monitorTime', label: '监测时间', type: 'date', category: 'basic', span: 12, required: true },
        { id: 'w_6', key: 'mainContent', label: '舆情主要内容与焦点', type: 'textarea', category: 'basic', span: 24, required: true },
        { id: 'w_7', key: 'targetDept', label: '初判涉事责任单位', type: 'cascader', category: 'basic', span: 12, required: true }
      ]
    },
    {
      id: 'ver_v1',
      versionCode: 'V1',
      remark: '流程版本V1',
      status: 'history',
      creator: '武沅林',
      createdAt: '2026-09-24 14:04:47',
      updater: '武沅林',
      updatedAt: '2026-09-26 21:27:56',
      widgetsSnapshot: [
        { id: 'w_1', key: 'opinionTitle', label: '舆情标题', type: 'input', category: 'basic', span: 24, required: true },
        { id: 'w_2', key: 'monitorTime', label: '监测时间', type: 'date', category: 'basic', span: 12, required: true },
        { id: 'w_6', key: 'mainContent', label: '舆情主要内容与焦点', type: 'textarea', category: 'basic', span: 24, required: true }
      ]
    },
    {
      id: 'ver_v0',
      versionCode: 'V0',
      remark: '流程版本V0',
      status: 'history',
      creator: '武沅林',
      createdAt: '2026-09-24 14:02:03',
      updater: '武沅林',
      updatedAt: '2026-09-24 14:18:18',
      widgetsSnapshot: [
        { id: 'w_1', key: 'opinionTitle', label: '舆情标题', type: 'input', category: 'basic', span: 24, required: true },
        { id: 'w_6', key: 'mainContent', label: '舆情主要内容与焦点', type: 'textarea', category: 'basic', span: 24, required: true }
      ]
    }
  ];
};

export const TemplateVersionManager: React.FC<TemplateVersionManagerProps> = ({
  templateName = '网络舆情处置下发指令流程',
  templateType = 'process',
  initialVersionCode = 'V4',
  versionList: controlledVersionList,
  selectedVersionId: controlledSelectedVersionId,
  onVersionListChange,
  onVersionChange,
  onCreateNewDraft,
  dropdownAlign = 'left'
}) => {
  const titlePrefix = templateType === 'normal' ? '模板版本' : '流程版本';

  // 内部维护或受控版本列表
  const [internalVersionList, setInternalVersionList] = useState<ProcessTemplateVersionRecord[]>(() => 
    getDefaultVersionList(templateType === 'normal' ? 'normal' : 'process')
  );

  const versionList = controlledVersionList || internalVersionList;
  const updateVersionList = (newList: ProcessTemplateVersionRecord[] | ((prev: ProcessTemplateVersionRecord[]) => ProcessTemplateVersionRecord[])) => {
    if (onVersionListChange) {
      if (typeof newList === 'function') {
        onVersionListChange(newList(versionList));
      } else {
        onVersionListChange(newList);
      }
    } else {
      setInternalVersionList(newList);
    }
  };

  // 当前激活/选中的版本ID
  const [internalSelectedId, setInternalSelectedId] = useState<string>('ver_v4');
  const selectedVersionId = controlledSelectedVersionId || internalSelectedId;

  // 下拉菜单显示状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 模态弹窗状态
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingRemarkVersion, setEditingRemarkVersion] = useState<ProcessTemplateVersionRecord | null>(null);
  const [newRemarkInput, setNewRemarkInput] = useState('');

  // 流程版本管理弹窗内部筛选与搜索状态
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'history'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'versionCode'>('updatedAt');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast 提示
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 当前选中版本对象
  const currentVersion = useMemo(() => {
    return versionList.find(v => v.id === selectedVersionId) || versionList[0];
  }, [versionList, selectedVersionId]);

  // 新建设计中版本处理函数（自动计算全部已有版本的最大编号 + 1）
  const handleCreateNewVersion = () => {
    if (onCreateNewDraft) {
      onCreateNewDraft();
      setIsDropdownOpen(false);
      setIsManagerModalOpen(false);
      return;
    }

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

    const newDraftVersion: ProcessTemplateVersionRecord = {
      id: `ver_${Date.now()}`,
      versionCode: nextVersionCode,
      remark: `${titlePrefix}${nextVersionCode}`,
      status: 'draft',
      creator: '武沅林',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updater: '武沅林',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      widgetsSnapshot: currentVersion?.widgetsSnapshot ? [...currentVersion.widgetsSnapshot] : []
    };

    updateVersionList(prev => [newDraftVersion, ...prev]);
    setInternalSelectedId(newDraftVersion.id);
    setIsDropdownOpen(false);
    setIsManagerModalOpen(false);
    onVersionChange?.(newDraftVersion);
    showToast(`已创建设计状态新版本【${titlePrefix}${nextVersionCode}】`);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 格式化状态徽章
  const renderStatusBadge = (status: 'active' | 'history' | 'draft') => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f8ea] text-[#00b050]">
            启用中
          </span>
        );
      case 'history':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#e9ecef] text-[#6c757d]">
            历史
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#fff3cd] text-[#856404]">
            设计中
          </span>
        );
    }
  };

  // 打开修改备注小弹窗
  const handleOpenEditRemark = (v: ProcessTemplateVersionRecord) => {
    setEditingRemarkVersion(v);
    setNewRemarkInput(v.remark);
  };

  // 保存修改备注
  const handleSaveRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemarkVersion) return;
    const trimmed = newRemarkInput.trim() || `${titlePrefix}${editingRemarkVersion.versionCode}`;
    updateVersionList(prev => prev.map(item => {
      if (item.id === editingRemarkVersion.id) {
        return {
          ...item,
          remark: trimmed,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updater: '武沅林'
        };
      }
      return item;
    }));
    setEditingRemarkVersion(null);
    showToast(`已成功修改版本【${editingRemarkVersion.versionCode}】的备注`);
  };

  // 切换版本
  const handleSelectVersion = (v: ProcessTemplateVersionRecord) => {
    setInternalSelectedId(v.id);
    setIsDropdownOpen(false);
    setIsManagerModalOpen(false);
    onVersionChange?.(v);
    showToast(`已切换至【${titlePrefix}${v.versionCode}】`);
  };

  // 设为启用中
  const handleSetActive = (targetId: string) => {
    updateVersionList(prev => prev.map(item => {
      if (item.id === targetId) {
        return {
          ...item,
          status: 'active',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      if (item.status === 'active') {
        return {
          ...item,
          status: 'history',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return item;
    }));
    setInternalSelectedId(targetId);
    showToast(`已将该版本设置为【启用中】`);
  };

  // 删除历史版本
  const handleDeleteVersion = (targetId: string, code: string) => {
    if (confirm(`确定要删除历史版本【${code}】吗？删除后将无法恢复。`)) {
      updateVersionList(prev => prev.filter(item => item.id !== targetId));
      showToast(`已成功删除历史版本【${code}】`);
    }
  };

  // 流程版本管理弹窗过滤与排序列表
  const filteredAndSortedVersions = useMemo(() => {
    return versionList
      .filter(item => {
        // 状态筛选
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }
        // 搜索关键词
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.versionCode.toLowerCase().includes(q);
          const matchRemark = item.remark.toLowerCase().includes(q);
          return matchCode || matchRemark;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updatedAt') {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
        if (sortBy === 'createdAt') {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (sortBy === 'versionCode') {
          return b.versionCode.localeCompare(a.versionCode);
        }
        return 0;
      });
  }, [versionList, statusFilter, sortBy, searchQuery]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 顶部右上角版本管理触发器按钮 (对标截图 1) */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-md px-3 py-1.5 shadow-2xs transition-all cursor-pointer text-xs"
        title="点击查看与管理版本"
      >
        <span className="font-medium text-slate-800 tracking-tight">
          {titlePrefix}{currentVersion.versionCode}
        </span>
        {renderStatusBadge(currentVersion.status)}
      </button>

      {/* 下拉菜单面板 (对标截图 1) */}
      {isDropdownOpen && (
        <div className={`absolute ${dropdownAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}>
          {/* 版本列表 */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {versionList.map(v => {
              const isSelected = v.id === selectedVersionId;
              return (
                <div
                  key={v.id}
                  onClick={() => handleSelectVersion(v)}
                  className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#eef8fd] text-slate-900 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="truncate">
                    {titlePrefix}{v.versionCode}
                  </span>
                  <div className="shrink-0 ml-2">
                    {renderStatusBadge(v.status)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分割线 */}
          <div className="border-t border-slate-100 my-1" />

          {/* 操作 1：新建版本 */}
          <button
            type="button"
            onClick={handleCreateNewVersion}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50/70 font-medium cursor-pointer transition-colors text-left"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>新建{titlePrefix}</span>
          </button>

          {/* 操作 2：修改版本备注 */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              handleOpenEditRemark(currentVersion);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors text-left"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>修改版本备注</span>
          </button>

          {/* 操作 3：流程版本管理 */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              setIsManagerModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors text-left"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{titlePrefix}管理</span>
          </button>
        </div>
      )}

      {/* ======================= 修改版本备注弹窗 ======================= */}
      {editingRemarkVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-[400px] max-w-[95vw] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* 顶栏 */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">修改版本备注</h4>
              <button
                type="button"
                onClick={() => setEditingRemarkVersion(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 表单主体 */}
            <form onSubmit={handleSaveRemark} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">版本号</label>
                <div className="h-8 px-2.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700 flex items-center">
                  {titlePrefix}{editingRemarkVersion.versionCode}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  版本备注 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newRemarkInput}
                  onChange={e => setNewRemarkInput(e.target.value)}
                  placeholder={`例：${titlePrefix}${editingRemarkVersion.versionCode}`}
                  className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRemarkVersion(null)}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs cursor-pointer transition-all"
                >
                  确定保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= 流程版本管理全屏模态框 (对标截图 2) ======================= */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100/95 backdrop-blur-2xs animate-in fade-in duration-200 overflow-hidden">
          {/* 顶栏 */}
          <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {titlePrefix}管理
            </h3>
            <button
              type="button"
              onClick={() => setIsManagerModalOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 模态框主体卡片区 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center items-start">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
              {/* 卡片顶部筛选与检索栏 */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                {/* 左侧状态过滤 Tab (全部 | 启用中 | 设计中 | 历史) */}
                <div className="flex items-center gap-2 text-xs">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'active', label: '启用中' },
                    { key: 'draft', label: '设计中' },
                    { key: 'history', label: '历史' }
                  ].map((tab, idx, arr) => {
                    const isTabActive = statusFilter === tab.key;
                    return (
                      <React.Fragment key={tab.key}>
                        <button
                          type="button"
                          onClick={() => setStatusFilter(tab.key as any)}
                          className={`cursor-pointer transition-colors ${
                            isTabActive
                              ? 'font-bold text-slate-900'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                        {idx < arr.length - 1 && (
                          <span className="text-slate-300 font-normal">|</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* 右侧新建版本按钮、排序下拉与搜索输入框 */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCreateNewVersion}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建{titlePrefix}</span>
                  </button>

                  {/* 排序方式下拉 */}
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-transparent text-xs text-slate-600 font-medium outline-none cursor-pointer hover:text-slate-900"
                    >
                      <option value="updatedAt">按更新时间排序 ⌵</option>
                      <option value="createdAt">按创建时间排序</option>
                      <option value="versionCode">按版本号排序</option>
                    </select>
                  </div>

                  {/* 搜索框 */}
                  <div className="relative w-56">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜索版本备注/版本号"
                      className="w-full h-8 pl-3 pr-7 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 版本明细列表表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fcfdfe] border-b border-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-6 w-24">流程版本号</th>
                      <th className="py-3 px-6 w-36">流程版本备注</th>
                      <th className="py-3 px-6 w-24">状态</th>
                      <th className="py-3 px-6 w-28">创建人</th>
                      <th className="py-3 px-6 w-44">创建时间</th>
                      <th className="py-3 px-6 w-28">更新人</th>
                      <th className="py-3 px-6 w-44">更新时间</th>
                      <th className="py-3 px-6 w-36 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedVersions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                          暂无匹配的版本记录
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedVersions.map(row => {
                        const isActive = row.status === 'active';

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* 流程版本号 */}
                            <td className="py-3.5 px-6 font-medium text-slate-800 font-mono">
                              {row.versionCode}
                            </td>

                            {/* 流程版本备注 */}
                            <td className="py-3.5 px-6 text-slate-700">
                              {row.remark}
                            </td>

                            {/* 状态徽章 */}
                            <td className="py-3.5 px-6">
                              {renderStatusBadge(row.status)}
                            </td>

                            {/* 创建人 */}
                            <td className="py-3.5 px-6 text-slate-600">
                              {row.creator}
                            </td>

                            {/* 创建时间 */}
                            <td className="py-3.5 px-6 text-slate-500 font-mono">
                              {row.createdAt}
                            </td>

                            {/* 更新人 */}
                            <td className="py-3.5 px-6 text-slate-600">
                              {row.updater}
                            </td>

                            {/* 更新时间 */}
                            <td className="py-3.5 px-6 text-slate-500 font-mono">
                              {row.updatedAt}
                            </td>

                            {/* 操作 */}
                            <td className="py-3.5 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleSelectVersion(row)}
                                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                                >
                                  {row.status === 'draft' ? '设计' : '查看'}
                                </button>

                                <span className="text-slate-300">|</span>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRemark(row)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                >
                                  修改备注
                                </button>

                                {!isActive && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVersion(row.id, row.versionCode)}
                                      className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                    >
                                      删除
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示浮条 */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
