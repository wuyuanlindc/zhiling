/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import {
  resolvePageMeta,
  subscribeActivePage,
  getActivePageInfo,
  PageMeta
} from '../utils/pageId';

interface PageIdBadgeProps {
  pageKey?: string;
  theme?: 'light' | 'dark' | 'amber' | 'subtle';
  className?: string;
  id?: string;
  syncWithGlobal?: boolean;
}

export const PageIdBadge: React.FC<PageIdBadgeProps> = ({
  pageKey,
  theme = 'light',
  className = '',
  id = 'top_left_page_id_badge',
  syncWithGlobal = false
}) => {
  // 页面约定元数据（包含固定的6位数字ID、页面名称、源码文件路径）
  const [currentMeta, setCurrentMeta] = useState<PageMeta>(() => {
    if (syncWithGlobal) {
      return getActivePageInfo().meta;
    }
    return resolvePageMeta(pageKey);
  });

  const [copied, setCopied] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  // 1. 如果启用了全局同步（例如 Header 顶栏），实时随全站路由与活动页面变化同步其固定的约定ID
  useEffect(() => {
    if (syncWithGlobal) {
      const unsubscribe = subscribeActivePage((info) => {
        setCurrentMeta(info.meta);
      });
      return unsubscribe;
    }
  }, [syncWithGlobal]);

  // 2. 局部组件指定的 pageKey：约定ID固定稳定，绝不随机变动
  useEffect(() => {
    if (!syncWithGlobal && pageKey) {
      setCurrentMeta(resolvePageMeta(pageKey));
    }
  }, [pageKey, syncWithGlobal]);

  // 复制六位页面ID到剪贴板
  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentMeta.id);
    }
    setCopied(true);
    setToastText(`已复制: ${currentMeta.id} [${currentMeta.component}]`);
    setTimeout(() => setCopied(false), 2200);
    setTimeout(() => setToastText(null), 2500);
  };

  // 主题样式配置
  const getThemeStyles = () => {
    switch (theme) {
      case 'dark':
        return {
          container: 'bg-slate-900/85 border-blue-500/40 text-slate-100 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
          number: 'text-cyan-400 bg-blue-950/70 border-blue-800/80 hover:border-cyan-400/80',
          btn: 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
        };
      case 'amber':
        return {
          container: 'bg-white/95 border-amber-300/90 text-amber-950 shadow-xs',
          number: 'text-amber-900 bg-amber-50/90 border-amber-200 hover:border-amber-400',
          btn: 'text-amber-600 hover:text-amber-900 hover:bg-amber-100'
        };
      case 'subtle':
        return {
          container: 'bg-slate-50 border-slate-200 text-slate-700 shadow-xs',
          number: 'text-slate-800 bg-white border-slate-200 hover:border-slate-400',
          btn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
        };
      case 'light':
      default:
        return {
          container: 'bg-white border-blue-200 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
          number: 'text-[#0052D9] bg-[#F0F6FF] border-[#BFDBFE] hover:border-[#3B82F6]',
          btn: 'text-slate-400 hover:text-[#0052D9] hover:bg-blue-50'
        };
    }
  };

  const styles = getThemeStyles();
  const tooltipContent = `页面ID: ${currentMeta.id}\n页面: ${currentMeta.name}\n源码: ${currentMeta.component}\n(点击复制ID，方便定位修改)`;

  return (
    <div className={`relative inline-flex items-center select-none ${className}`} id={id}>
      <div
        className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg border transition-all duration-200 backdrop-blur-xs ${styles.container}`}
      >
        {/* 用户标记内容 1: 约定固定的六位数字框 (何时点击都是固定的) */}
        <span
          onClick={handleCopyId}
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded border tracking-wider cursor-pointer active:scale-95 transition-all ${styles.number}`}
          title={tooltipContent}
        >
          {currentMeta.id}
        </span>

        {/* 用户标记内容 2: 复制按钮 */}
        <button
          type="button"
          onClick={handleCopyId}
          title={tooltipContent}
          aria-label="复制约定六位页面ID"
          className={`p-1 rounded transition-colors cursor-pointer active:scale-90 ${styles.btn}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 浮动提示 Toast (展示ID与源码对应关系，方便用户快速修改) */}
      {toastText && (
        <div className="absolute top-full left-0 mt-1.5 z-50 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  );
};
