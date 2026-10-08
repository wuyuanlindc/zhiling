/**
 * Step 2: 24 栅格低代码表单设计器工作台 (FormDesignerCanvas)
 * - 左侧：控件库 (18 基础控件 + 8 布局控件) 与 大纲树
 * - 中间：PC/移动端切换、统一单画布自由排版、横杠拖拽插入指示器、24 栅格自适应调节
 *   （不需要系统硬编码区分下发/回执区域，用户可自行拖入【分割线】或【分组标题】进行划分）
 * - 右侧：组件属性、组件样式、表单属性
 */

import React, { useState } from 'react';
import { 
  FormWidgetComponent, 
  FormGlobalConfig,
  FormWidgetType 
} from '../../../types/processEngine';
import { 
  BASIC_WIDGET_LIST, 
  ADVANCED_WIDGET_LIST,
  LAYOUT_WIDGET_LIST, 
  CUSTOM_WIDGETS_MAP,
  CustomWidgetMetaItem,
  createWidgetInstance,
  createCustomWidgetInstance
} from './widgetMeta';
import { FormWidgetRenderer } from './FormWidgetRenderer';
import { WidgetPropertyPanel } from './WidgetPropertyPanel';
import { 
  LayoutGrid, 
  Layers, 
  Monitor, 
  Smartphone, 
  Trash2, 
  Play, 
  ChevronDown, 
  ChevronRight, 
  Sliders, 
  Type, 
  AlignLeft, 
  Hash, 
  ToggleRight, 
  CheckCircle, 
  CheckSquare, 
  ChevronDownSquare, 
  Calendar, 
  Clock, 
  AlarmClock,
  CalendarCheck,
  Timer,
  Hourglass,
  UploadCloud, 
  Image as ImageIcon, 
  Palette, 
  FileText, 
  ExternalLink, 
  MousePointerClick, 
  AlertCircle, 
  Heading, 
  Minus, 
  ChevronsUpDown, 
  FolderKanban, 
  ListOrdered, 
  CreditCard, 
  Table as TableIcon,
  Search,
  Paintbrush,
  GripHorizontal,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  ChevronUp,
  Check,
  Sparkles,
  Star
} from 'lucide-react';

interface FormDesignerCanvasProps {
  templateName: string;
  formConfig: FormGlobalConfig;
  widgets: FormWidgetComponent[];
  onChangeFormConfig: (config: FormGlobalConfig) => void;
  onChangeWidgets: (widgets: FormWidgetComponent[]) => void;
  onOpenPreview: () => void;
  isReadOnly?: boolean;
  currentVersionCode?: string;
  currentVersionStatus?: 'active' | 'history' | 'draft';
  isHistoricalVersion?: boolean;
  onAttemptEditInReadOnly?: () => void;
  templateType?: 'normal' | 'process';
}

export const FormDesignerCanvas: React.FC<FormDesignerCanvasProps> = ({
  templateName,
  formConfig,
  widgets,
  onChangeFormConfig,
  onChangeWidgets,
  onOpenPreview,
  isReadOnly = false,
  currentVersionCode,
  currentVersionStatus,
  isHistoricalVersion = false,
  onAttemptEditInReadOnly,
  templateType = 'normal'
}) => {
  // 左侧导航 Tab: 'widgets' (控件库) | 'outline' (大纲树)
  const [leftNavTab, setLeftNavTab] = useState<'widgets' | 'outline'>('widgets');

  // 控件库顶部分类 Tab: 'basic' (基础组件) | 'custom' (自定义组件)
  const [widgetCategoryTab, setWidgetCategoryTab] = useState<'basic' | 'custom'>('basic');

  // 自定义组件三大分类展开/折叠状态: 1. 指令流转 2. 点点速豹 3. 知了网评
  const [customSectionsOpen, setCustomSectionsOpen] = useState({
    SYS_ZLL: true,
    SYS_DDSB: true,
    SYS_ZLWP: true
  });

  // 折叠分组展开状态
  const [basicOpen, setBasicOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [layoutOpen, setLayoutOpen] = useState(true);
  const [widgetSearch, setWidgetSearch] = useState('');

  // 终端形态：'pc' | 'mobile'
  const [deviceMode, setDeviceMode] = useState<'pc' | 'mobile'>('pc');

  // 当前选中的控件 ID
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // 右侧属性 Tab: 'props' (组件属性) | 'style' (组件样式) (表单属性已移除)
  const [rightTab, setRightTab] = useState<'props' | 'style'>('props');

  // 校验规则折叠开关与编辑项
  const [validationOpen, setValidationOpen] = useState<boolean>(true);
  const [editingValidationKey, setEditingValidationKey] = useState<string | null>(null);

  // 拖拽插入指示器：记录即将插入的索引位置（在画布中以零位移横杠高亮展示）
  const [dropIndicator, setDropIndicator] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 获取当前选中的组件
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId) || null;

  // 控件图标匹配映射
  const getWidgetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Type': return <Type className="w-3.5 h-3.5" />;
      case 'AlignLeft': return <AlignLeft className="w-3.5 h-3.5" />;
      case 'Hash': return <Hash className="w-3.5 h-3.5" />;
      case 'ToggleRight': return <ToggleRight className="w-3.5 h-3.5" />;
      case 'CheckCircle': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'CheckSquare': return <CheckSquare className="w-3.5 h-3.5" />;
      case 'ChevronDownSquare': return <ChevronDownSquare className="w-3.5 h-3.5" />;
      case 'Layers': return <Layers className="w-3.5 h-3.5" />;
      case 'Calendar': return <Calendar className="w-3.5 h-3.5" />;
      case 'Clock': return <Clock className="w-3.5 h-3.5" />;
      case 'AlarmClock': return <AlarmClock className="w-3.5 h-3.5" />;
      case 'CalendarCheck': return <CalendarCheck className="w-3.5 h-3.5" />;
      case 'Timer': return <Timer className="w-3.5 h-3.5" />;
      case 'Hourglass': return <Hourglass className="w-3.5 h-3.5" />;
      case 'UploadCloud': return <UploadCloud className="w-3.5 h-3.5" />;
      case 'Image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'Palette': return <Palette className="w-3.5 h-3.5" />;
      case 'FileText': return <FileText className="w-3.5 h-3.5" />;
      case 'ExternalLink': return <ExternalLink className="w-3.5 h-3.5" />;
      case 'MousePointerClick': return <MousePointerClick className="w-3.5 h-3.5" />;
      case 'AlertCircle': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'Heading': return <Heading className="w-3.5 h-3.5" />;
      case 'Minus': return <Minus className="w-3.5 h-3.5" />;
      case 'ChevronsUpDown': return <ChevronsUpDown className="w-3.5 h-3.5" />;
      case 'FolderKanban': return <FolderKanban className="w-3.5 h-3.5" />;
      case 'ListOrdered': return <ListOrdered className="w-3.5 h-3.5" />;
      case 'LayoutGrid': return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'CreditCard': return <CreditCard className="w-3.5 h-3.5" />;
      case 'Table': return <TableIcon className="w-3.5 h-3.5" />;
      case 'Smartphone': return <Smartphone className="w-3.5 h-3.5" />;
      case 'Star': return <Star className="w-3.5 h-3.5" />;
      default: return <Type className="w-3.5 h-3.5" />;
    }
  };

  // 添加新控件 (点击左侧控件时，插入到当前选中的控件之后，或追加到末尾)
  const handleAddWidget = (type: FormWidgetType) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const newWidget = createWidgetInstance(type);
    let updated: FormWidgetComponent[];
    if (selectedWidgetId) {
      const idx = widgets.findIndex(w => w.id === selectedWidgetId);
      updated = [...widgets];
      updated.splice(idx + 1, 0, newWidget);
    } else {
      updated = [...widgets, newWidget];
    }
    onChangeWidgets(updated);
    setSelectedWidgetId(newWidget.id);
    setRightTab('props');
  };

  // 更新当前选中控件的属性
  const handleUpdateSelectedWidget = (updatedFields: Partial<FormWidgetComponent>) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    if (!selectedWidgetId) return;
    const updated = widgets.map(w => {
      if (w.id === selectedWidgetId) {
        return { ...w, ...updatedFields };
      }
      return w;
    });
    onChangeWidgets(updated);
  };

  // 更新指定控件的 24 栅格 span
  const handleUpdateSpan = (id: string, span: number) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const clamped = Math.min(24, Math.max(1, span));
    const updated = widgets.map(w => (w.id === id ? { ...w, span: clamped } : w));
    onChangeWidgets(updated);
  };

  // 删除控件
  const handleDeleteWidget = (id: string) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const updated = widgets.filter(w => w.id !== id);
    onChangeWidgets(updated);
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  };

  // 复制控件
  const handleCloneWidget = (widget: FormWidgetComponent) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const cloned: FormWidgetComponent = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      key: `${widget.key}_copy`,
      label: `${widget.label} (副本)`
    };
    const index = widgets.findIndex(w => w.id === widget.id);
    const updated = [...widgets];
    updated.splice(index + 1, 0, cloned);
    onChangeWidgets(updated);
    setSelectedWidgetId(cloned.id);
  };

  // 清空表单所有控件
  const handleClearAllWidgets = () => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    if (window.confirm('确定要清空画布中的所有表单控件吗？')) {
      onChangeWidgets([]);
      setSelectedWidgetId(null);
    }
  };

  // ================= 拖拽事件处理（无布局位移指示器，彻底杜绝闪烁，精准放置） =================
  // 1. 左侧控件库拖拽开始
  const handleDragStart = (e: React.DragEvent, type: FormWidgetType) => {
    if (isReadOnly) {
      e.preventDefault();
      onAttemptEditInReadOnly?.();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'library', type }));
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 1.1 自定义业务组件拖拽开始
  const handleCustomDragStart = (e: React.DragEvent, customWidget: CustomWidgetMetaItem) => {
    if (isReadOnly) {
      e.preventDefault();
      onAttemptEditInReadOnly?.();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'custom_library', customWidget, type: customWidget.type }));
    e.dataTransfer.setData('text/plain', customWidget.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 添加自定义业务组件实例
  const handleAddCustomWidget = (customWidget: CustomWidgetMetaItem) => {
    if (isReadOnly) {
      onAttemptEditInReadOnly?.();
      return;
    }
    const newWidget = createCustomWidgetInstance(customWidget);
    let updated: FormWidgetComponent[];
    if (selectedWidgetId) {
      const idx = widgets.findIndex(w => w.id === selectedWidgetId);
      updated = [...widgets];
      updated.splice(idx + 1, 0, newWidget);
    } else {
      updated = [...widgets, newWidget];
    }
    onChangeWidgets(updated);
    setSelectedWidgetId(newWidget.id);
    setRightTab('props');
  };

  // 2. 画布内已有控件拖拽重排开始
  const handleCanvasWidgetDragStart = (e: React.DragEvent, widget: FormWidgetComponent) => {
    if (isReadOnly) {
      e.preventDefault();
      onAttemptEditInReadOnly?.();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'canvas', id: widget.id, type: widget.type }));
    e.dataTransfer.setData('text/plain', widget.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 3. 拖拽结束时重置状态
  const handleDragEnd = () => {
    setIsDragging(false);
    setDropIndicator(null);
  };

  // 4. 拖拽悬停在特定控件上时，判断鼠标位于前半部分还是后半部分
  const handleWidgetDragOver = (e: React.DragEvent, index: number, span = 24) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    let isAfter = false;
    if (span === 24) {
      const midY = rect.top + rect.height / 2;
      isAfter = e.clientY > midY;
    } else {
      const midX = rect.left + rect.width / 2;
      isAfter = e.clientX > midX;
    }

    const targetIndex = isAfter ? index + 1 : index;
    if (dropIndicator !== targetIndex) {
      setDropIndicator(targetIndex);
    }
  };

  // 5. 悬停在容器空白或末尾
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'copy';
    if (dropIndicator === null && widgets.length > 0) {
      setDropIndicator(widgets.length);
    }
  };

  // 6. 移出画布时清空指示横杠
  const handleCanvasDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndicator(null);
    }
  };

  // 7. 松开鼠标放下 (Drop)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReadOnly) {
      setDropIndicator(null);
      setIsDragging(false);
      onAttemptEditInReadOnly?.();
      return;
    }

    const insertIndex = dropIndicator !== null ? dropIndicator : widgets.length;
    setDropIndicator(null);
    setIsDragging(false);

    let payload: any = null;
    try {
      const rawJson = e.dataTransfer.getData('application/json');
      if (rawJson) {
        payload = JSON.parse(rawJson);
      }
    } catch {
      payload = null;
    }

    const widgetType = (payload?.type || e.dataTransfer.getData('text/plain')) as FormWidgetType;

    // 情况 A：画布内已有控件拖拽重新排序
    if (payload?.source === 'canvas' && payload?.id) {
      const existingIndex = widgets.findIndex(w => w.id === payload.id);
      if (existingIndex < 0) return;

      const widget = widgets[existingIndex];
      const remaining = widgets.filter(w => w.id !== payload.id);

      // 计算新的插入索引
      let adjustedIndex = insertIndex;
      if (existingIndex < insertIndex) {
        adjustedIndex = insertIndex - 1;
      }
      adjustedIndex = Math.max(0, Math.min(adjustedIndex, remaining.length));

      remaining.splice(adjustedIndex, 0, widget);
      onChangeWidgets(remaining);
      setSelectedWidgetId(widget.id);
      return;
    }

    // 情况 B：从自定义业务组件库拖入
    if (payload?.source === 'custom_library' && payload?.customWidget) {
      const newWidget = createCustomWidgetInstance(payload.customWidget);
      const targetIdx = Math.max(0, Math.min(insertIndex, widgets.length));
      const nextWidgets = [...widgets];
      nextWidgets.splice(targetIdx, 0, newWidget);
      onChangeWidgets(nextWidgets);
      setSelectedWidgetId(newWidget.id);
      setRightTab('props');
      return;
    }

    // 情况 C：从基础/布局控件库拖入新控件
    if (widgetType) {
      const newWidget = createWidgetInstance(widgetType);
      const targetIdx = Math.max(0, Math.min(insertIndex, widgets.length));
      const nextWidgets = [...widgets];
      nextWidgets.splice(targetIdx, 0, newWidget);
      onChangeWidgets(nextWidgets);
      setSelectedWidgetId(newWidget.id);
      setRightTab('props');
    }
  };

  // 过滤后的基础与布局控件库
  const filteredBasic = BASIC_WIDGET_LIST.filter(w => 
    !widgetSearch || w.label.includes(widgetSearch) || w.type.includes(widgetSearch)
  );
  const filteredAdvanced = ADVANCED_WIDGET_LIST.filter(w => 
    !widgetSearch || w.label.includes(widgetSearch) || w.type.includes(widgetSearch)
  );
  const filteredLayout = LAYOUT_WIDGET_LIST.filter(w => 
    !widgetSearch || w.label.includes(widgetSearch) || w.type.includes(widgetSearch)
  );

  // 过滤后的两大业务自定义组件库（点点速豹置顶、知了网评次之）
  const filteredDdsbCustom = (CUSTOM_WIDGETS_MAP.SYS_DDSB || []).filter(w =>
    !widgetSearch || w.label.includes(widgetSearch) || w.description.includes(widgetSearch)
  );
  const filteredZlwpCustom = (CUSTOM_WIDGETS_MAP.SYS_ZLWP || []).filter(w =>
    !widgetSearch || w.label.includes(widgetSearch) || w.description.includes(widgetSearch)
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100 select-none">
      {/* ===================== 最左侧：只显示图标的菜单栏 (48px) ===================== */}
      <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-2.5 shrink-0 z-20 shadow-2xs">
        {/* 1. 控件库图标按钮 */}
        <button
          type="button"
          onClick={() => setLeftNavTab('widgets')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative mb-2.5 ${
            leftNavTab === 'widgets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
          }`}
          title="控件库 (基础组件与自定义组件)"
        >
          <LayoutGrid className="w-4 h-4" />
          {/* 悬浮 Tooltip 气泡 */}
          <div className="absolute left-11 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            控件库
          </div>
        </button>

        {/* 2. 大纲树图标按钮 */}
        <button
          type="button"
          onClick={() => setLeftNavTab('outline')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative mb-2.5 ${
            leftNavTab === 'outline'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
          }`}
          title="大纲树 (组件结构与顺序)"
        >
          <Layers className="w-4 h-4" />
          {/* 悬浮 Tooltip 气泡 */}
          <div className="absolute left-11 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            大纲树
          </div>
        </button>
      </div>

      {/* ===================== 左侧二级面板 (268px) ===================== */}
      <div className="w-68 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
        {/* 当处于「控件库」模式 */}
        {leftNavTab === 'widgets' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 控件库顶部一级分类: 1. 基础组件  2. 自定义组件 */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setWidgetCategoryTab('basic')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  widgetCategoryTab === 'basic'
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>基础组件</span>
              </button>
              <button
                type="button"
                onClick={() => setWidgetCategoryTab('custom')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  widgetCategoryTab === 'custom'
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>自定义组件</span>
              </button>
            </div>

            {/* 控件库内容区 */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3">
              {/* 搜索框 */}
              <div className="relative mb-3 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={widgetCategoryTab === 'basic' ? "搜索基础控件..." : "搜索自定义业务组件..."}
                  value={widgetSearch}
                  onChange={e => setWidgetSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* ---------------- 1. 基础组件展示 ---------------- */}
              {widgetCategoryTab === 'basic' && (
                <>
                  {/* 分组 1: 基础控件 */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setBasicOpen(!basicOpen)}
                      className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        {basicOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>基础控件 ({filteredBasic.length})</span>
                      </span>
                    </button>

                    {basicOpen && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {filteredBasic.map(w => (
                          <div
                            key={w.type}
                            draggable
                            onDragStart={e => handleDragStart(e, w.type)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAddWidget(w.type)}
                            className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 bg-white flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all text-xs text-slate-700 hover:text-blue-600 shadow-2xs group"
                            title="按住左键拖拽至画布指定横杠处插入，或点击添加"
                          >
                            <span className="text-slate-500 group-hover:text-blue-600">
                              {getWidgetIcon(w.iconName)}
                            </span>
                            <span className="font-medium truncate">{w.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 分组 2: 高级控件 (限时响应时间、限时处理时间、限时响应时限、限时处理时限) */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-slate-700 hover:text-amber-600 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>高级控件 ({filteredAdvanced.length})</span>
                      </span>
                    </button>

                    {advancedOpen && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {filteredAdvanced.map(w => (
                          <div
                            key={w.type}
                            draggable
                            onDragStart={e => handleDragStart(e, w.type)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAddWidget(w.type)}
                            className="p-2.5 rounded-lg border border-amber-200/80 hover:border-amber-500 hover:bg-amber-50/40 bg-white flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all text-xs text-slate-700 hover:text-amber-700 shadow-2xs group"
                            title="按住左键拖拽至画布指定横杠处插入，或点击添加"
                          >
                            <span className="text-amber-600 group-hover:text-amber-700">
                              {getWidgetIcon(w.iconName)}
                            </span>
                            <span className="font-medium truncate">{w.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 分组 3: 布局控件 (包含分割线、分组标题等) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setLayoutOpen(!layoutOpen)}
                      className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        {layoutOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>布局与划分控件 ({filteredLayout.length})</span>
                      </span>
                    </button>

                    {layoutOpen && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {filteredLayout.map(w => (
                          <div
                            key={w.type}
                            draggable
                            onDragStart={e => handleDragStart(e, w.type)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAddWidget(w.type)}
                            className={`p-2.5 rounded-lg border hover:bg-indigo-50/40 bg-white flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all text-xs text-slate-700 hover:text-indigo-600 shadow-2xs group ${
                              w.type === 'divider' ? 'border-indigo-300 ring-1 ring-indigo-100 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-500'
                            }`}
                            title="按住左键拖拽至画布指定横杠处插入，支持用【分割线】自主划分区域"
                          >
                            <span className={w.type === 'divider' ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}>
                              {getWidgetIcon(w.iconName)}
                            </span>
                            <span className="font-medium truncate">{w.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ---------------- 2. 自定义组件展示 (点点速豹在最上面，其次是知了网评) ---------------- */}
              {widgetCategoryTab === 'custom' && (
                <div className="space-y-4">
                  {/* 分类 1: 点点速豹 (置顶) */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-2.5">
                    <button
                      type="button"
                      onClick={() => setCustomSectionsOpen(prev => ({ ...prev, SYS_DDSB: !prev.SYS_DDSB }))}
                      className="w-full flex items-center justify-between py-1 text-xs font-bold text-amber-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {customSectionsOpen.SYS_DDSB ? <ChevronDown className="w-3.5 h-3.5 text-amber-600" /> : <ChevronRight className="w-3.5 h-3.5 text-amber-600" />}
                        <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
                        <span>1. 点点速豹</span>
                      </span>
                      <span className="text-[10px] font-medium bg-amber-100/80 text-amber-700 px-1.5 py-0.5 rounded">
                        {filteredDdsbCustom.length}项
                      </span>
                    </button>

                    {customSectionsOpen.SYS_DDSB && (
                      <div className="space-y-1.5 mt-2">
                        {filteredDdsbCustom.map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => handleCustomDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAddCustomWidget(item)}
                            className="p-2.5 rounded-lg border border-amber-200/80 hover:border-amber-500 hover:bg-amber-50 bg-white cursor-grab active:cursor-grabbing transition-all text-xs shadow-2xs group"
                            title="点击添加或拖拽至画布插入"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-slate-800 group-hover:text-amber-700 flex items-center gap-1.5 truncate">
                                <span className="text-amber-600">{getWidgetIcon(item.iconName)}</span>
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                                {item.defaultSpan}/24
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 分类 2: 知了网评 */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-2.5">
                    <button
                      type="button"
                      onClick={() => setCustomSectionsOpen(prev => ({ ...prev, SYS_ZLWP: !prev.SYS_ZLWP }))}
                      className="w-full flex items-center justify-between py-1 text-xs font-bold text-emerald-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {customSectionsOpen.SYS_ZLWP ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        <span>2. 知了网评</span>
                      </span>
                      <span className="text-[10px] font-medium bg-emerald-100/80 text-emerald-700 px-1.5 py-0.5 rounded">
                        {filteredZlwpCustom.length}项
                      </span>
                    </button>

                    {customSectionsOpen.SYS_ZLWP && (
                      <div className="space-y-1.5 mt-2">
                        {filteredZlwpCustom.map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => handleCustomDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAddCustomWidget(item)}
                            className="p-2.5 rounded-lg border border-emerald-200/80 hover:border-emerald-500 hover:bg-emerald-50 bg-white cursor-grab active:cursor-grabbing transition-all text-xs shadow-2xs group"
                            title="点击添加或拖拽至画布插入"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5 truncate">
                                <span className="text-emerald-600">{getWidgetIcon(item.iconName)}</span>
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                                {item.defaultSpan}/24
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 当处于「大纲树」模式 */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <Layers className="w-3.5 h-3.5" />
                <span>表单控件大纲树</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                共 {widgets.length} 项
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {widgets.map((w, index) => {
                const isDivider = w.type === 'divider';
                const isTitle = w.type === 'section_title';

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedWidgetId(w.id);
                      setRightTab('props');
                    }}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedWidgetId === w.id
                        ? 'bg-blue-100 text-blue-700 font-bold shadow-2xs'
                        : isDivider
                        ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-dashed border-slate-200'
                        : isTitle
                        ? 'bg-indigo-50/50 text-indigo-800 font-bold hover:bg-indigo-100/50'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {isDivider ? (
                        <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : isTitle ? (
                        <Heading className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : w.type === 'collapse' ? (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : null}
                      <span className="truncate">{index + 1}. {w.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                      {w.span}/24
                    </span>
                  </div>
                );
              })}
              {widgets.length === 0 && (
                <div className="text-center text-[11px] text-slate-400 py-8">
                  画布暂无表单控件
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================== 中间 24 栅格低代码画布 ===================== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        {/* 画布顶栏控制器：操作图标 */}
        <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs">
          {/* 左侧 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">表单设计画布</span>
            <span className="text-[11px] text-slate-400">（24 栅格布局）</span>
          </div>

          {/* 画布右侧操作：清空与快速预览 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAllWidgets}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="清空表单所有控件"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="实时预览测试"
            >
              <Play className="w-3.5 h-3.5" />
              <span>实时预览</span>
            </button>
          </div>
        </div>

        {/* 受保护版本只读横幅提示 (启用中与历史版本均显示) */}
        {isReadOnly && (
          <div className="bg-amber-50/95 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                当前配置{currentVersionStatus === 'active' ? '启用中' : (currentVersionStatus === 'history' ? `处于历史版本【${currentVersionCode || '历史归档'}】` : '受保护')}，仅可查看，不支持编辑。如需编辑，请{templateType === 'process' ? '创建新流程' : '创建新模板'}或切换到设计中的配置版本。
              </span>
            </div>
            <button
              type="button"
              onClick={onAttemptEditInReadOnly}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>{templateType === 'process' ? '创建新流程' : '创建新模板'}</span>
            </button>
          </div>
        )}

        {/* 画布工作区域 (背景为实体底色，非半透明) */}
        <div
          onClick={() => setSelectedWidgetId(null)}
          onDragLeave={handleCanvasDragLeave}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center items-start bg-slate-100"
        >
          {/* 画布主卡片 (实体白色，背景不透明) */}
          <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all ${
              deviceMode === 'mobile' ? 'w-[420px]' : 'w-full max-w-5xl'
            }`}
          >
            {/* 表单大标题区域 */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
              <h2 className="text-lg font-black text-slate-800">
                {formConfig.formTitle || templateName || '未命名流程表单'}
              </h2>
            </div>

            {/* 统一 24 栅格表单画布 */}
            <div
              onDragOver={handleContainerDragOver}
              onDrop={handleDrop}
              className="p-6"
            >
              <div className="flex flex-wrap -mx-2 min-h-[220px] p-3 rounded-xl bg-slate-50/50 border border-slate-200/80">
                {widgets.map((widget, idx) => {
                  let indicatorPosition: 'before' | 'after' | null = null;
                  if (dropIndicator === idx) {
                    indicatorPosition = 'before';
                  } else if (dropIndicator === widgets.length && idx === widgets.length - 1) {
                    indicatorPosition = 'after';
                  }

                  return (
                    <FormWidgetRenderer
                      key={widget.id}
                      widget={widget}
                      mode="design"
                      isSelected={selectedWidgetId === widget.id}
                      dropIndicatorPosition={indicatorPosition}
                      draggable={!isReadOnly}
                      onDragStart={(e) => {
                        if (isReadOnly) {
                          e.preventDefault();
                          onAttemptEditInReadOnly?.();
                          return;
                        }
                        handleCanvasWidgetDragStart(e, widget);
                      }}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleWidgetDragOver(e, idx, widget.span || 24)}
                      onDrop={handleDrop}
                      onSelect={() => {
                        setSelectedWidgetId(widget.id);
                        setRightTab('props');
                      }}
                      onDelete={() => {
                        if (isReadOnly) {
                          onAttemptEditInReadOnly?.();
                          return;
                        }
                        handleDeleteWidget(widget.id);
                      }}
                      onClone={() => {
                        if (isReadOnly) {
                          onAttemptEditInReadOnly?.();
                          return;
                        }
                        handleCloneWidget(widget);
                      }}
                      onUpdateSpan={(span) => {
                        if (isReadOnly) {
                          onAttemptEditInReadOnly?.();
                          return;
                        }
                        handleUpdateSpan(widget.id, span);
                      }}
                    />
                  );
                })}

                {/* 底部末尾放置指示区域 */}
                {widgets.length > 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dropIndicator !== widgets.length) {
                        setDropIndicator(widgets.length);
                      }
                    }}
                    onDrop={handleDrop}
                    className={`w-full py-2.5 mt-2 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                      dropIndicator === widgets.length
                        ? 'border-blue-500 bg-blue-50/70 text-blue-600 ring-2 ring-blue-300/60 shadow-xs'
                        : 'border-slate-200/80 bg-white/40 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1.5">
                      <GripHorizontal className="w-3.5 h-3.5" />
                      <span>拖拽至此处添加到表单末尾</span>
                    </span>
                  </div>
                )}

                {/* 空态区域 */}
                {widgets.length === 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropIndicator(0);
                    }}
                    className={`w-full py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all ${
                      dropIndicator === 0
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <LayoutGrid className="w-6 h-6 text-blue-500" />
                    <p className="text-xs text-slate-700 font-bold">画布暂无表单控件</p>
                    <p className="text-[11px] text-slate-400">
                      从左侧拖拽控件到此处，或点击左侧控件添加；支持通过【分割线】或【分组标题】自主划分表单区域
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== 右侧属性面板 (组件属性与组件样式) ===================== */}
      <WidgetPropertyPanel
        selectedWidget={selectedWidget}
        onUpdateWidget={handleUpdateSelectedWidget}
        rightTab={rightTab}
        onChangeTab={setRightTab}
      />
    </div>
  );
};
