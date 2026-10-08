/**
 * 24 栅格低代码表单控件渲染器 (FormWidgetRenderer)
 * 支持「设计模式 (Design)」与「运行/预览模式 (Runtime/Preview)」
 * 精确渲染 18 种基础控件与 3 种布局控件（分组标题、分割线、折叠面板）
 */

import React from 'react';
import { 
  FormWidgetComponent, 
  BasicWidgetType, 
  AdvancedWidgetType,
  LayoutWidgetType 
} from '../../../types/processEngine';
import { 
  Type, 
  AlignLeft, 
  Hash, 
  ToggleRight, 
  CheckCircle, 
  CheckSquare, 
  ChevronDownSquare, 
  Layers, 
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
  LayoutGrid, 
  CreditCard, 
  Table as TableIcon,
  Trash2,
  Copy,
  GripVertical,
  Sliders,
  ChevronDown,
  Info,
  X,
  Smartphone,
  Star,
  KeyRound,
  Building2,
  Users,
  Check,
  CheckCircle2,
  Search,
  Eye,
  Phone,
  Plus,
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  OrgGroupDispatchModal, 
  DispatchSelectedItem, 
  DEFAULT_DISPATCH_PERSONNEL, 
  DispatchPersonnelItem 
} from './OrgGroupDispatchModal';

interface FormWidgetRendererProps {
  widget: FormWidgetComponent;
  mode?: 'design' | 'runtime' | 'preview';
  isSelected?: boolean;
  permission?: 'editable' | 'readonly' | 'hidden';
  value?: any;
  onChange?: (val: any) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onUpdateSpan?: (span: number) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  dropIndicatorPosition?: 'before' | 'after' | null;
}

export const FormWidgetRenderer: React.FC<FormWidgetRendererProps> = ({
  widget,
  mode = 'design',
  isSelected = false,
  permission = 'editable',
  value,
  onChange,
  onSelect,
  onDelete,
  onClone,
  onUpdateSpan,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dropIndicatorPosition
}) => {
  if (permission === 'hidden' || widget.widgetStatus === 'hidden') {
    if (mode !== 'design') return null;
  }

  const isWidgetDisabled = widget.widgetStatus === 'disabled';
  const isWidgetReadOnly = widget.widgetStatus === 'readonly';
  const isReadOnly = (mode !== 'design' && permission === 'readonly') || isWidgetReadOnly;
  const span = Math.min(24, Math.max(1, widget.span || 24));

  // 折叠面板展开/收起状态
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(
    widget.defaultCollapsed !== undefined ? !!widget.defaultCollapsed : false
  );

  React.useEffect(() => {
    if (widget.defaultCollapsed !== undefined) {
      setIsCollapsed(widget.defaultCollapsed);
    }
  }, [widget.defaultCollapsed]);

  // 下发组织节点/群组弹窗状态
  const [isDispatchModalOpen, setIsDispatchModalOpen] = React.useState<boolean>(false);

  // 手机验证码倒计时与通知状态
  const [countdown, setCountdown] = React.useState<number>(0);
  const [smsNotice, setSmsNotice] = React.useState<string>('');

  React.useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendVerificationCode = () => {
    if (countdown > 0) return;
    const curObj = typeof value === 'object' && value ? value : { phone: '', code: '' };
    const curPhone = curObj.phone || (typeof value === 'string' ? value : '');
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCountdown(60);
    setSmsNotice(`短信验证码已发送至 ${curPhone ? curPhone : '当前手机'}：${mockCode}（模拟核验）`);
    if (onChange) {
      onChange({ phone: curPhone || '13800000000', code: mockCode });
    }
    setTimeout(() => {
      setSmsNotice('');
    }, 6000);
  };

  // 打分组件悬浮分值
  const [hoverRating, setHoverRating] = React.useState<number>(0);

  // 栅格宽度样式 (24 栅格)
  const gridSpanClass = `col-span-${span}`;

  // 渲染控件核心内容
  const renderControlInput = () => {
    switch (widget.type) {
      case 'input':
        return (
          <div className="relative flex items-center">
            <input
              type="text"
              disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
              readOnly={isReadOnly}
              value={value !== undefined ? value : (widget.defaultValue || '')}
              placeholder={widget.placeholder || '请输入文本内容'}
              minLength={widget.minLength}
              maxLength={widget.maxLength}
              onChange={e => onChange && onChange(e.target.value)}
              className={`w-full h-9 px-3 ${widget.clearable ? 'pr-8' : ''} bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            />
            {widget.clearable && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange && onChange('');
                }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="清空内容"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            rows={widget.rows || 3}
            disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
            readOnly={isReadOnly}
            value={value !== undefined ? value : (widget.defaultValue || '')}
            placeholder={widget.placeholder || '请输入详细多行内容...'}
            minLength={widget.minLength}
            maxLength={widget.maxLength}
            onChange={e => onChange && onChange(e.target.value)}
            className={`w-full p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all resize-y ${
              isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
            }`}
          />
        );

      case 'number':
        return (
          <div className="relative flex items-center">
            <input
              type="number"
              disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
              readOnly={isReadOnly}
              value={value !== undefined ? value : (widget.defaultValue ?? '')}
              min={widget.min}
              max={widget.max}
              step={widget.step || (widget.precision ? Math.pow(10, -widget.precision) : 1)}
              placeholder={widget.placeholder || '请输入数值'}
              onChange={e => onChange && onChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full h-9 px-3 ${widget.unit ? 'pr-12' : ''} bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-500 ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            />
            {widget.unit && (
              <span className="absolute right-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold pointer-events-none border border-slate-200">
                {widget.unit}
              </span>
            )}
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center gap-2 py-1">
            <button
              type="button"
              disabled={isReadOnly || mode === 'design'}
              onClick={() => onChange && onChange(!value)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                (value !== undefined ? value : widget.defaultValue) ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  (value !== undefined ? value : widget.defaultValue) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-slate-600">
              {(value !== undefined ? value : widget.defaultValue) ? '开启' : '关闭'}
            </span>
          </div>
        );

      case 'radio':
        return (
          <div className={`py-1 ${widget.direction === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-4'}`}>
            {(widget.options || [{ label: '选项一', value: 'opt1' }, { label: '选项二', value: 'opt2' }]).map((opt, i) => (
              <label key={i} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name={widget.id}
                  disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
                  checked={(value !== undefined ? value : widget.defaultValue) === opt.value}
                  onChange={() => onChange && onChange(opt.value)}
                  className="w-3.5 h-3.5 text-blue-600"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className={`py-1 ${widget.direction === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-4'}`}>
            {(widget.options || [{ label: '选项一', value: 'opt1' }, { label: '选项二', value: 'opt2' }]).map((opt, i) => (
              <label key={i} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
                  checked={Array.isArray(value) ? value.includes(opt.value) : (Array.isArray(widget.defaultValue) ? widget.defaultValue.includes(opt.value) : true)}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? [...value] : (Array.isArray(widget.defaultValue) ? [...widget.defaultValue] : []);
                    const next = e.target.checked ? [...current, opt.value] : current.filter(v => v !== opt.value);
                    onChange && onChange(next);
                  }}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <div className="relative">
            <select
              disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
              value={value !== undefined ? value : (widget.defaultValue || '')}
              onChange={e => onChange && onChange(e.target.value)}
              className={`w-full h-9 px-3 ${widget.clearable ? 'pr-8' : ''} bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            >
              <option value="">{widget.placeholder || '请选择'}</option>
              {(widget.options || []).map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multi_select':
        return (
          <div className={`w-full min-h-[36px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 flex flex-wrap items-center gap-1.5 ${
            isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
          }`}>
            {(Array.isArray(value) && value.length > 0) || (Array.isArray(widget.defaultValue) && widget.defaultValue.length > 0) ? (
              (Array.isArray(value) ? value : (widget.defaultValue || [])).map((v: any, i: number) => {
                const opt = (widget.options || []).find(o => o.value === v);
                return (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                    <span>{opt ? opt.label : v}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-slate-400">{widget.placeholder || '请选择多项 (可多选)'}</span>
            )}
          </div>
        );

      case 'cascader':
        return (
          <div className="relative">
            <input
              type="text"
              readOnly
              placeholder={widget.placeholder || '请选择级联组织/网格'}
              value={value || '济南市公安局 / 网安支队 / 研判科'}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none cursor-pointer"
            />
            <Layers className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        );

      case 'date':
        return (
          <div className="relative flex items-center">
            <input
              type={widget.dateFormat?.includes('HH:mm') ? 'datetime-local' : 'date'}
              disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
              value={value || widget.defaultValue || ''}
              onChange={e => onChange && onChange(e.target.value)}
              placeholder={widget.placeholder || '请选择日期'}
              className={`w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-500 transition-all ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>
        );

      {/* 高级控件: 限时处理时间 */}
      case 'handle_time_limit':
        return (
          <div className="relative flex items-center">
            <input
              type={widget.dateFormat?.includes('HH:mm') ? 'datetime-local' : 'date'}
              disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
              value={value || widget.defaultValue || ''}
              onChange={e => onChange && onChange(e.target.value)}
              placeholder={widget.placeholder || '请选择截止处理办结时间'}
              className={`w-full h-9 pl-9 pr-3 bg-white border border-emerald-200 hover:border-emerald-400 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-emerald-500 shadow-2xs transition-all ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            />
            <CalendarCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        );

      {/* 高级控件 3: 限时响应时限 */}
      case 'response_duration_limit':
        return (
          <div className="relative">
            <select
              disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
              value={value !== undefined ? value : (widget.defaultValue || '2h')}
              onChange={e => onChange && onChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-amber-200 hover:border-amber-400 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500 shadow-2xs"
            >
              {(widget.options || [
                { label: '30 分钟 (极速响应)', value: '0.5h' },
                { label: '1 小时 (特急响应)', value: '1h' },
                { label: '2 小时 (加急响应)', value: '2h' },
                { label: '4 小时 (常规响应)', value: '4h' },
                { label: '12 小时 (当日响应)', value: '12h' },
                { label: '24 小时 (次日响应)', value: '24h' }
              ]).map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Timer className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        );

      {/* 高级控件 4: 限时处理时限 (改为数字输入，非下拉) */}
      case 'handle_duration_limit': {
        const rawVal = value !== undefined ? value : (widget.defaultValue !== undefined ? widget.defaultValue : 24);
        const numVal = typeof rawVal === 'string' ? (rawVal.replace(/[^0-9.]/g, '') || '') : rawVal;
        return (
          <div className="relative flex items-center">
            <Hourglass className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="number"
              min={widget.min !== undefined ? widget.min : 1}
              max={widget.max}
              step={widget.step || 1}
              disabled={isReadOnly || mode === 'design' || isWidgetDisabled}
              readOnly={isReadOnly}
              value={numVal}
              placeholder={widget.placeholder || '请输入处理时限 (小时)'}
              onChange={e => onChange && onChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full h-9 pl-9 pr-16 bg-white border border-indigo-200 hover:border-indigo-400 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 shadow-2xs ${
                isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
              }`}
            />
            <span className="absolute right-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold pointer-events-none border border-indigo-200">
              小时 (h)
            </span>
          </div>
        );
      }

      case 'file':
        return (
          <div className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 transition-colors text-center cursor-pointer">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">点击上传佐证材料附件</span>
            <span className="text-[10px] text-slate-400">{widget.helpText || '支持 PDF、Word、Excel，单个不超过 20MB'}</span>
          </div>
        );

      case 'image':
        return (
          <div className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 transition-colors text-center cursor-pointer">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">点击上传现场照片 / 处置截图</span>
            <span className="text-[10px] text-slate-400">{widget.helpText || '支持 JPG、PNG 格式，最多上传 9 张'}</span>
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              disabled={isReadOnly || mode === 'design'}
              value={value || widget.defaultValue || '#2563EB'}
              onChange={e => onChange && onChange(e.target.value)}
              className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
            />
            <span className="text-xs font-mono text-slate-700 font-bold">{value || widget.defaultValue || '#2563EB'}</span>
          </div>
        );

      case 'rich_text':
        return (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-500 text-xs">
              <span className="font-bold">B</span>
              <span className="italic">I</span>
              <span className="underline">U</span>
              <span className="text-slate-300">|</span>
              <span className="text-[10px]">H1</span>
              <span className="text-[10px]">H2</span>
              <span className="text-[10px]">引用</span>
            </div>
            <textarea
              rows={4}
              disabled={isReadOnly || mode === 'design'}
              placeholder={widget.placeholder || '在此编写富文本排版内容...'}
              className="w-full p-3 text-xs text-slate-800 outline-none resize-none"
            />
          </div>
        );

      case 'link':
        return (
          <a
            href={widget.linkUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-bold"
          >
            <span>{widget.label}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        );

      case 'button':
        return (
          <button
            type="button"
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {widget.buttonText || widget.label || '操作按钮'}
          </button>
        );

      case 'static_text':
        return (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {widget.defaultValue || '静态文本说明信息'}
          </p>
        );

      case 'alert':
        return (
          <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
            widget.alertType === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            widget.alertType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            widget.alertType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">{widget.label}</strong>
              <span>{widget.defaultValue || '重要提醒事项与办案纪律规范说明'}</span>
            </div>
          </div>
        );

      // ================= 布局控件渲染 =================
      case 'section_title':
        return (
          <div className="flex items-center gap-2 py-1.5 border-b-2 border-blue-600 my-1">
            <Heading className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase">
              {widget.label}
            </h4>
          </div>
        );

      case 'divider':
        return (
          <div className="w-full my-3 flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            {widget.label && widget.label !== '分割线' ? (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {widget.label}
              </span>
            ) : null}
            <div className="h-px bg-slate-200 flex-1" />
          </div>
        );

      case 'collapse':
        return (
          <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all hover:border-slate-300">
            {/* 折叠面板头部 (点击展开/折叠) */}
            <div
              onClick={(e) => {
                if (mode === 'design') {
                  e.stopPropagation();
                  onSelect && onSelect();
                }
                setIsCollapsed(!isCollapsed);
              }}
              className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-transparent data-[open=true]:border-slate-100"
              data-open={!isCollapsed}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  tabIndex={-1}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90 text-slate-400' : 'rotate-0 text-blue-600'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  <ChevronsUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {widget.label || '折叠面板'}
                  </span>
                  {widget.helpText && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline ml-1 font-normal">
                      · {widget.helpText}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                    isCollapsed
                      ? 'bg-slate-200/80 text-slate-600'
                      : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                  }`}
                >
                  {isCollapsed ? '已折叠' : '已展开'}
                </span>
                <span className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hidden xs:inline">
                  {isCollapsed ? '展开内容' : '收起内容'}
                </span>
              </div>
            </div>

            {/* 折叠面板主体内容 (展开时呈现，折叠时平滑隐藏) */}
            {!isCollapsed && (
              <div className="p-4 bg-white border-t border-slate-100 animate-in fade-in duration-150">
                {widget.collapseContent ? (
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words bg-slate-50/60 p-3.5 rounded-lg border border-slate-100">
                    {widget.collapseContent}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50/80 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">
                        {mode === 'design' ? '【折叠面板详情内容区】' : '暂无补充说明'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {mode === 'design'
                          ? '可在右侧属性面板配置详细核查要点、业务规范指引或关联背景说明；在业务办理填报时，填报人可随时折叠或展开本区域以节省空间。'
                          : '该业务流程环节暂无额外指引或附件材料。'}
                      </p>
                    </div>
                  </div>
                )}

                {mode === 'design' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      当前显示：{isCollapsed ? '已收起' : '已展开'} · 默认行为：
                      {widget.defaultCollapsed ? '默认折叠' : '默认展开'}
                    </span>
                    <span className="text-blue-600 font-medium">
                      点击头部可随时切换展开/折叠测试
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'tabs':
      case 'steps':
      case 'grid_container':
      case 'card_container':
      case 'table_container':
        return (
          <div className="p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>{widget.label} [{widget.type}]</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                24 栅格容器
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-400">
              容器区域 · 内部可嵌套子控件
            </div>
          </div>
        );

      // ================= 自定义业务组件 1: 点点速豹 - 获取手机验证码 =================
      case 'phone_verify': {
        const curObj = typeof value === 'object' && value !== null ? value : { phone: typeof value === 'string' ? value : '', code: '' };
        const phoneVal = curObj.phone || '';
        const codeVal = curObj.code || '';

        return (
          <div className="space-y-2.5 w-full">
            {/* 1. 填写手机号文本框 */}
            <div className="relative flex items-center">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                maxLength={11}
                disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
                readOnly={isReadOnly}
                value={phoneVal}
                placeholder={widget.placeholder || '请输入11位手机号码'}
                onChange={e => {
                  const newPhone = e.target.value.replace(/[^0-9]/g, '');
                  onChange && onChange({ phone: newPhone, code: codeVal });
                }}
                className={`w-full h-9 pl-9 pr-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-amber-500 shadow-2xs ${
                  isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* 2. 填写验证码文本框 与 获取验证码按钮 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
                  readOnly={isReadOnly}
                  value={codeVal}
                  placeholder="请输入6位短信验证码"
                  onChange={e => {
                    const newCode = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
                    onChange && onChange({ phone: phoneVal, code: newCode });
                  }}
                  className={`w-full h-9 pl-9 pr-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-mono tracking-widest text-slate-800 outline-none focus:border-amber-500 shadow-2xs ${
                    isReadOnly || isWidgetDisabled ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* 获取验证码按钮 */}
              <button
                type="button"
                disabled={isReadOnly || isWidgetDisabled || countdown > 0 || mode === 'design'}
                onClick={handleSendVerificationCode}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer select-none shadow-2xs ${
                  countdown > 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95 shadow-xs'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码'}</span>
              </button>
            </div>

            {/* 模拟验证码发送成功轻提示 */}
            {smsNotice && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-800 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[3]" />
                <span className="font-medium">{smsNotice}</span>
              </div>
            )}
          </div>
        );
      }

      // ================= 自定义业务组件 2: 点点速豹 - 打分组件 (分级得分标准: 一等100分 ~ 五等60分) =================
      case 'rate':
      case 'score': {
        // 5级标准分级得分标准 (一等(特优):100分、二等(优秀):90分、三等(良好):80分、四等(合格):70分、五等(基本):60分)
        const defaultRateLevels = [
          { score: 100, star: 5, grade: '一等', label: '一等(特优)', color: 'emerald', desc: '100分 · 响应极速处置严密，示范特优' },
          { score: 90, star: 4, grade: '二等', label: '二等(优秀)', color: 'blue', desc: '90分 · 措施有力协同顺畅，办案优秀' },
          { score: 80, star: 3, grade: '三等', label: '三等(良好)', color: 'cyan', desc: '80分 · 基本指标达标，时效质量良好' },
          { score: 70, star: 2, grade: '四等', label: '四等(合格)', color: 'amber', desc: '70分 · 达到底线要求，考核评定合格' },
          { score: 60, star: 1, grade: '五等', label: '五等(基本)', color: 'slate', desc: '60分 · 基本履职，存在瑕疵待提升' }
        ];

        const rateLevels = (widget.rateLevels && widget.rateLevels.length === 5) ? widget.rateLevels : defaultRateLevels;

        const currentVal = typeof value === 'number' 
          ? value 
          : (typeof widget.defaultValue === 'number' ? widget.defaultValue : 100);

        const activeVal = hoverRating || currentVal;

        // 精确匹配当前等级 (支持按分值 100/90/80/70/60 或按星级 5/4/3/2/1 匹配)
        let activeLevel = rateLevels.find(l => 
          l.score === activeVal || 
          (l.star !== undefined && l.star === activeVal)
        );

        if (!activeLevel) {
          if (activeVal <= 5) {
            // 兼容 1~5 传统星级
            activeLevel = rateLevels.find(l => l.star === activeVal) || rateLevels[Math.max(0, Math.min(4, 5 - activeVal))];
          } else {
            // 找最接近的分值等级
            activeLevel = [...rateLevels].sort((a, b) => Math.abs(a.score - activeVal) - Math.abs(b.score - activeVal))[0];
          }
        }
        if (!activeLevel) {
          activeLevel = rateLevels[0];
        }

        const activeStarCount = activeLevel.star !== undefined 
          ? activeLevel.star 
          : (activeLevel.score === 100 ? 5 :
             activeLevel.score === 90 ? 4 :
             activeLevel.score === 80 ? 3 :
             activeLevel.score === 70 ? 2 :
             activeLevel.score === 60 ? 1 : 5);

        return (
          <div className="w-full p-4 bg-white border border-amber-200 rounded-xl space-y-3 shadow-2xs">
            {/* 顶栏：星级评分区与分值指示 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* 5星打分交互区 (1~5星对应五等60分 ~ 一等100分) */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = activeStarCount >= starVal;
                    // 找到该星级对应的等级分值 (1星=五等60分, 2星=四等70分, 3星=三等80分, 4星=二等90分, 5星=一等100分)
                    const matchedLvl = rateLevels.find(l => l.star === starVal) || rateLevels[5 - starVal] || rateLevels[0];
                    return (
                      <button
                        key={starVal}
                        type="button"
                        disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
                        onMouseEnter={() => !isReadOnly && mode !== 'design' && setHoverRating(matchedLvl.score)}
                        onMouseLeave={() => !isReadOnly && mode !== 'design' && setHoverRating(0)}
                        onClick={() => {
                          if (isReadOnly || mode === 'design') return;
                          onChange && onChange(matchedLvl.score);
                        }}
                        className={`p-1 rounded-md transition-all hover:scale-115 cursor-pointer ${
                          isReadOnly || mode === 'design' ? 'cursor-default' : ''
                        }`}
                        title={`${starVal}星 - ${matchedLvl.label} (${matchedLvl.score}分)`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* 分值指示牌 */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                  <span className="text-xs text-amber-700 font-medium">得分</span>
                  <span className="text-base font-black font-mono">
                    {activeLevel.score}
                  </span>
                  <span className="text-xs text-amber-700 font-medium">分</span>
                </div>
              </div>

              {/* 当前激活的等级文案 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">分级评定：</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  activeLevel.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : activeLevel.color === 'blue'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : activeLevel.color === 'cyan'
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                    : activeLevel.color === 'amber'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  {activeLevel.label} · {activeLevel.score}分
                </span>
              </div>
            </div>

            {/* 严格按照要求呈现的「打分组件分级得分标准」5级卡片矩阵 */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              {rateLevels.map((lvl, idx) => {
                const isCurrent = activeLevel.score === lvl.score;
                const lvlStarCount = lvl.star !== undefined ? lvl.star : (
                  lvl.score === 100 ? 5 :
                  lvl.score === 90 ? 4 :
                  lvl.score === 80 ? 3 :
                  lvl.score === 70 ? 2 :
                  lvl.score === 60 ? 1 : (5 - idx)
                );
                return (
                  <button
                    key={lvl.score}
                    type="button"
                    disabled={isReadOnly || isWidgetDisabled || mode === 'design'}
                    onMouseEnter={() => !isReadOnly && mode !== 'design' && setHoverRating(lvl.score)}
                    onMouseLeave={() => !isReadOnly && mode !== 'design' && setHoverRating(0)}
                    onClick={() => {
                      if (isReadOnly || mode === 'design') return;
                      onChange && onChange(lvl.score);
                    }}
                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer select-none flex flex-col items-center justify-between gap-1.5 ${
                      isCurrent
                        ? lvl.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300 scale-[1.02]'
                          : lvl.color === 'blue'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300 scale-[1.02]'
                          : lvl.color === 'cyan'
                          ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs ring-2 ring-cyan-300 scale-[1.02]'
                          : lvl.color === 'amber'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 scale-[1.02]'
                          : 'bg-slate-600 text-white border-slate-700 shadow-xs ring-2 ring-slate-300 scale-[1.02]'
                        : 'bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-mono text-[11px] font-semibold">
                      <div className="flex items-center">
                        {Array.from({ length: lvlStarCount }).map((_, sIdx) => (
                          <Star key={sIdx} className={`w-2.5 h-2.5 ${isCurrent ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                        ))}
                      </div>
                      <span className={isCurrent ? 'text-white/90' : 'text-slate-500'}>{lvlStarCount}星</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                        {lvl.label}
                      </div>
                      <div className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-black font-mono ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {lvl.score}分
                      </div>
                    </div>

                    <div className={`text-[10px] leading-tight line-clamp-1 ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                      {lvl.desc || `${lvl.score}分评定标准`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // ================= 自定义业务组件 3: 知了网评 - 下发组织节点/群组 (去除拖拽至表单时的已选下发组织展示，仅通过弹窗配置) =================
      case 'org_group_dispatch': {
        const personnelList: any[] = Array.isArray(value) 
          ? value 
          : (Array.isArray(widget.defaultValue) ? widget.defaultValue : []);

        const selectedCount = personnelList.length;

        return (
          <>
            <div className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-2xs transition-all">
              {/* 1. 卡片顶栏：带浅绿色圆角矩形图标、标题与选择下发对象按钮 */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50/60 via-white to-slate-50/50 border-b border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* 浅绿色圆角矩形图标 */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-300/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <FolderKanban className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 tracking-wide truncate">
                        {widget.label || '下发组织节点/群组'}
                      </h4>
                      {widget.required && (
                        <span className="text-rose-500 font-bold text-sm">*</span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 shrink-0">
                        知了网评专用
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {widget.helpText || '支持跨层级下派至区县网信办组织节点，或指派至专业网评应急群组'}
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      disabled={isReadOnly && mode !== 'preview'}
                      onClick={() => onChange && onChange([])}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="清空已选下发对象"
                    >
                      清空
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isReadOnly && mode !== 'preview'}
                    onClick={() => setIsDispatchModalOpen(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                      isReadOnly && mode !== 'preview'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : selectedCount > 0
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    }`}
                  >
                    {selectedCount > 0 ? (
                      <>
                        <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>修改下发对象</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>选择下发对象</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 简明状态指示区：拖拽至表单时去除冗长已选人员列表展示，保持表单精炼整洁 */}
              <div 
                onClick={() => {
                  if (mode !== 'design') {
                    setIsDispatchModalOpen(true);
                  }
                }}
                className={`p-4 transition-all ${
                  mode !== 'design' ? 'cursor-pointer hover:bg-slate-50/60' : ''
                }`}
              >
                {selectedCount === 0 ? (
                  <div className="py-5 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          未配置下发对象
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          点击上方按钮或此区域，即可按队伍成员、组织节点与用户群组调出配置工作台
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-emerald-200/80 shadow-2xs hover:bg-emerald-50 shrink-0">
                      点击配置下发对象 &gt;
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">已配置下发目标</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#ebfbf3] text-[#10b981] border border-[#a7f3d0] text-xs font-bold font-mono">
                            已锁定 {selectedCount} 名网评员
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                            <span>组织节点转办人次: 140 人</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-400">已关联陕西省委网信办等外部协同单位与骨干群组</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDispatchModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shrink-0 shadow-2xs cursor-pointer"
                    >
                      查看与重新配置
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 弹出的选择组织节点/群组弹窗 */}
            <OrgGroupDispatchModal
              isOpen={isDispatchModalOpen}
              onClose={() => setIsDispatchModalOpen(false)}
              selectedItems={personnelList}
              onConfirm={(items) => {
                onChange && onChange(items);
              }}
            />
          </>
        );
      }

      default:
        return <div className="text-xs text-slate-400">未知控件类型: {widget.type}</div>;
    }
  };

  // 栅格百分比计算与样式
  const widthPercent = `${(span / 24) * 100}%`;

  return (
    <div
      onClick={(e) => {
        if (mode === 'design') {
          e.stopPropagation();
          onSelect && onSelect();
        }
      }}
      draggable={mode === 'design' ? draggable : undefined}
      onDragStart={mode === 'design' ? onDragStart : undefined}
      onDragEnd={mode === 'design' ? onDragEnd : undefined}
      onDragOver={mode === 'design' ? onDragOver : undefined}
      onDrop={mode === 'design' ? onDrop : undefined}
      style={{ width: mode === 'design' ? widthPercent : '100%' }}
      className={`relative transition-all ${
        mode === 'design'
          ? `p-3 rounded-xl group border-2 ${
              isSelected
                ? 'border-blue-600 bg-blue-50/20 shadow-sm ring-2 ring-blue-500/20 z-20'
                : dropIndicatorPosition
                ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-300/60 z-20'
                : 'border-transparent hover:border-blue-300 hover:bg-slate-50/60'
            }`
          : 'mb-4'
      }`}
    >
      {/* 零高度位移拖拽指示横杠 (绝对定位悬浮，完全不挤占文档流，彻底消除其他组件抖动与闪烁) */}
      {mode === 'design' && dropIndicatorPosition === 'before' && (
        <div className="absolute -top-1.5 left-2 right-2 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 rounded-full z-40 pointer-events-none ring-2 ring-blue-300 shadow-md flex items-center justify-center animate-in fade-in duration-100">
          <span className="text-[9px] font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-full shadow-xs -translate-y-2.5 flex items-center gap-1 border border-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>在此前插入</span>
          </span>
        </div>
      )}

      {mode === 'design' && dropIndicatorPosition === 'after' && (
        <div className="absolute -bottom-1.5 left-2 right-2 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 rounded-full z-40 pointer-events-none ring-2 ring-blue-300 shadow-md flex items-center justify-center animate-in fade-in duration-100">
          <span className="text-[9px] font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-full shadow-xs translate-y-2.5 flex items-center gap-1 border border-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>在此后插入</span>
          </span>
        </div>
      )}

      {/* 设计模式下的浮动快捷操作栏 */}
      {mode === 'design' && (
        <div
          className={`absolute -top-3 right-3 flex items-center gap-1 bg-white border border-slate-200 shadow-md rounded-lg px-1.5 py-0.5 z-30 transition-opacity ${
            isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
          }`}
        >
          {/* 栅格宽度快速微调按钮 */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
            <span className="text-[10px] font-mono font-bold text-blue-600 px-1">
              {span}/24
            </span>
            {[6, 8, 12, 16, 24].map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSpan && onUpdateSpan(s);
                }}
                className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold cursor-pointer ${
                  span === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title={`设为 ${s}/24 栅格宽度`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* 复制与删除 */}
          {widget.type === 'collapse' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
              title={isCollapsed ? '展开面板' : '收起面板'}
            >
              <ChevronsUpDown className="w-3 h-3 text-blue-600" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClone && onClone();
            }}
            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
            title="复制控件"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete();
            }}
            className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="删除控件"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 内部控件内容：设计模式下 pointer-events-none 彻底防止子元素截获拖拽事件造成闪烁 (折叠面板保留 pointer-events-auto 以支持实时展开/折叠测试) */}
      <div className={mode === 'design' && widget.type !== 'collapse' ? 'pointer-events-none select-none' : ''}>
        {/* 控件 Label 标题与必填星号 (支持基础控件与限时时效等高级控件) */}
        {(widget.category === 'basic' || widget.category === 'advanced') && widget.type !== 'button' && widget.type !== 'alert' && widget.type !== 'static_text' && widget.type !== 'link' && (
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1 select-none">
              <span>{widget.label}</span>
              {widget.required && <span className="text-red-500 font-bold">*</span>}
              {mode === 'design' && (
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  ({widget.key})
                </span>
              )}
            </label>

            {mode === 'design' && (
              <div className="flex items-center gap-1.5">
                {widget.widgetStatus && widget.widgetStatus !== 'normal' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    widget.widgetStatus === 'disabled'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : widget.widgetStatus === 'readonly'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {widget.widgetStatus === 'disabled' ? '禁用' : widget.widgetStatus === 'readonly' ? '只读' : '隐藏'}
                  </span>
                )}
                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                  {span}/24 栅格
                </span>
              </div>
            )}
          </div>
        )}

        {/* 渲染实际控件内容 */}
        {renderControlInput()}

        {/* 描述信息 */}
        {widget.helpText && widget.type !== 'collapse' && (
          <p className="text-[11px] text-slate-400 mt-1 leading-normal select-none">
            {widget.helpText}
          </p>
        )}
      </div>
    </div>
  );
};
