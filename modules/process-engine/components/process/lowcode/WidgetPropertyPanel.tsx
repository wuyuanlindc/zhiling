import React, { useState } from 'react';
import { FormWidgetComponent } from '../../../types/processEngine';
import { 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  LayoutGrid, 
  Sliders,
  Calendar,
  Languages,
  FileEdit,
  Check,
  X,
  Star
} from 'lucide-react';

interface WidgetPropertyPanelProps {
  selectedWidget: FormWidgetComponent | null;
  onUpdateWidget: (updatedFields: Partial<FormWidgetComponent>) => void;
  rightTab: 'props' | 'style';
  onChangeTab: (tab: 'props' | 'style') => void;
}

export const WidgetPropertyPanel: React.FC<WidgetPropertyPanelProps> = ({
  selectedWidget,
  onUpdateWidget,
  rightTab,
  onChangeTab
}) => {
  const [validationOpen, setValidationOpen] = useState(true);
  const [dateRangeSectionOpen, setDateRangeSectionOpen] = useState(true);
  const [dateRangeMenuOpen, setDateRangeMenuOpen] = useState(false);

  if (!selectedWidget) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
        {/* Tab 切换 */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-white select-none">
          <button
            type="button"
            onClick={() => onChangeTab('props')}
            className={`py-3 px-3 text-sm font-bold relative transition-colors cursor-pointer ${
              rightTab === 'props' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>属性</span>
            {rightTab === 'props' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('style')}
            className={`py-3 px-3 text-sm font-bold relative transition-colors cursor-pointer ${
              rightTab === 'style' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>高级</span>
            {rightTab === 'style' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6">
          <Sliders className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">请点击画布中的组件</p>
          <p className="text-[10px] text-slate-400 mt-1">可在右侧实时调整字段属性、占位文案与校验规则</p>
        </div>
      </div>
    );
  }

  const currentStatus = selectedWidget.widgetStatus || (selectedWidget.disabled ? 'disabled' : selectedWidget.readonly ? 'readonly' : 'normal');

  const isDateOrTimeLimit = selectedWidget.type === 'date' || selectedWidget.type === 'handle_time_limit';

  // 日期区间类型文本映射
  const dateRangeTypeOptions = [
    { value: 'none', label: '无限制' },
    { value: 'after_today', label: '可选今天之后（含今天）' },
    { value: 'before_today', label: '可选今天之前（含今天）' },
    { value: 'disabled_range', label: '不可选区间（含开始和结束）' },
    { value: 'custom', label: '自定义' }
  ];

  const currentDateRangeType = (selectedWidget as any).dateRangeType || 'none';
  const currentDateRangeLabel = dateRangeTypeOptions.find(o => o.value === currentDateRangeType)?.label || '无限制';

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
      {/* 顶部 Tab 栏：属性 与 高级 (对标截图) */}
      <div className="flex items-center px-4 border-b border-slate-200 bg-white select-none">
        <button
          type="button"
          onClick={() => onChangeTab('props')}
          className={`py-3 px-3 text-sm font-bold relative transition-colors cursor-pointer ${
            rightTab === 'props' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>属性</span>
          {rightTab === 'props' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('style')}
          className={`py-3 px-3 text-sm font-bold relative transition-colors cursor-pointer ${
            rightTab === 'style' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>高级</span>
          {rightTab === 'style' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 text-xs">
        {rightTab === 'props' ? (
          <div className="space-y-3.5">
            {/* ========================================================================= */}
            {/* 特别针对「日期选择」与「限时处理时间」的属性面板 (严格对标用户上传参考截图) */}
            {/* ========================================================================= */}
            {isDateOrTimeLimit ? (
              <div className="space-y-3.5">
                {/* 1. 字段标题 (独自占一行) */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-medium">字段标题</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={selectedWidget.label}
                      onChange={e => onUpdateWidget({ label: e.target.value })}
                      placeholder="请输入字段标题"
                      className="w-full h-8 pl-2.5 pr-8 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <div className="absolute right-2 text-slate-400 p-0.5 rounded pointer-events-none">
                      <Languages className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 2. 占位提示 */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">占位提示</label>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={selectedWidget.placeholder !== undefined ? selectedWidget.placeholder : '请选择'}
                      onChange={e => onUpdateWidget({ placeholder: e.target.value })}
                      placeholder="请选择"
                      className="w-full h-8 pl-2.5 pr-8 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <div className="absolute right-2 text-slate-400 p-0.5 rounded pointer-events-none">
                      <Languages className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 3. 描述信息 */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">描述信息</label>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={selectedWidget.helpText || ''}
                      onChange={e => onUpdateWidget({ helpText: e.target.value })}
                      placeholder="编辑描述"
                      className="w-full h-8 pl-2.5 pr-8 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <div className="absolute right-2 text-slate-400 p-0.5 rounded pointer-events-none">
                      <FileEdit className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* 4. 状态 (普通、禁用、只读、隐藏) */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">状态</label>
                  <div className="flex-1">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg w-full">
                      {[
                        { key: 'normal', label: '普通' },
                        { key: 'disabled', label: '禁用' },
                        { key: 'readonly', label: '只读' },
                        { key: 'hidden', label: '隐藏' }
                      ].map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onUpdateWidget({
                            widgetStatus: opt.key as any,
                            disabled: opt.key === 'disabled',
                            readonly: opt.key === 'readonly',
                            hidden: opt.key === 'hidden'
                          })}
                          className={`flex-1 py-1 text-xs rounded-md transition-all cursor-pointer text-center ${
                            currentStatus === opt.key
                              ? 'bg-white text-slate-800 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. 默认值 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="w-16 text-slate-700 shrink-0 font-normal">默认值</label>
                    <div className="flex-1">
                      <select
                        value={(selectedWidget as any).dateDefaultType || 'none'}
                        onChange={e => onUpdateWidget({ 
                          ...({ dateDefaultType: e.target.value } as any),
                          defaultValue: e.target.value === 'none' ? '' : selectedWidget.defaultValue
                        })}
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                      >
                        <option value="none">无</option>
                        <option value="current">填写当时</option>
                        <option value="custom">自定义日期</option>
                      </select>
                    </div>
                  </div>

                  {/* 默认日期输入框 */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0" />
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="text"
                        value={selectedWidget.defaultValue || ''}
                        onChange={e => onUpdateWidget({ defaultValue: e.target.value })}
                        placeholder="请选择日期"
                        className="w-full h-8 pl-2.5 pr-8 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 6. 格式 */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">格式</label>
                  <div className="flex-1">
                    <select
                      value={selectedWidget.dateFormat || 'YYYY-MM-DD'}
                      onChange={e => onUpdateWidget({ dateFormat: e.target.value })}
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                    >
                      <option value="YYYY-MM-DD">年-月-日</option>
                      <option value="YYYY-MM-DD HH:mm">年-月-日 时:分</option>
                      <option value="YYYY-MM-DD HH:mm:ss">年-月-日 时:分:秒</option>
                      <option value="YYYY-MM">年-月</option>
                      <option value="YYYY">年</option>
                    </select>
                  </div>
                </div>

                {/* 7. 可选时间区间 (折叠区域，对标截图) */}
                <div className="pt-2 border-t border-slate-100">
                  <div
                    onClick={() => setDateRangeSectionOpen(!dateRangeSectionOpen)}
                    className="flex items-center justify-between py-1.5 cursor-pointer select-none text-slate-800 font-bold"
                  >
                    <span>可选时间区间</span>
                    {dateRangeSectionOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {dateRangeSectionOpen && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-3 relative">
                        <label className="w-16 text-slate-700 shrink-0 font-normal">类型</label>
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            onClick={() => setDateRangeMenuOpen(!dateRangeMenuOpen)}
                            className="w-full h-8 px-2.5 bg-white border border-blue-500 rounded text-xs text-slate-800 flex items-center justify-between outline-none shadow-2xs cursor-pointer"
                          >
                            <span className="truncate">{currentDateRangeLabel}</span>
                            <div className="flex items-center gap-1">
                              {currentDateRangeType !== 'none' && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateWidget({ dateRangeType: 'none' } as any);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </span>
                              )}
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center">
                                ×
                              </span>
                            </div>
                          </button>

                          {/* 下拉弹出菜单 (严格对标截图) */}
                          {dateRangeMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setDateRangeMenuOpen(false)}
                              />
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-100">
                                {dateRangeTypeOptions.map(opt => {
                                  const isSelected = currentDateRangeType === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        onUpdateWidget({ dateRangeType: opt.value } as any);
                                        setDateRangeMenuOpen(false);
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                                        isSelected ? 'text-slate-900 font-bold bg-slate-50/60' : 'text-slate-700'
                                      }`}
                                    >
                                      <span className="truncate">{opt.label}</span>
                                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. 校验 */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="py-1">
                    <span className="text-slate-800 font-bold">校验</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label className="text-slate-700 font-normal">必填</label>
                    <input
                      type="checkbox"
                      checked={!!selectedWidget.required}
                      onChange={e => onUpdateWidget({ required: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </div>

                  {!!selectedWidget.required && (
                    <input
                      type="text"
                      value={selectedWidget.validationMessage || ''}
                      onChange={e => onUpdateWidget({ validationMessage: e.target.value })}
                      placeholder="请输入自定义必填提示（如：此项为必填）"
                      className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* 其他常规组件的通用属性面板 */
              /* ========================================================================= */
              <>
                {/* 1. 唯一标识：最顶部显示 */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">唯一标识</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={selectedWidget.key}
                      onChange={e => onUpdateWidget({ key: e.target.value })}
                      placeholder="唯一变量名"
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* 2. 字段标题 (独自占一行) */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-medium">字段标题</label>
                  <input
                    type="text"
                    value={selectedWidget.label}
                    onChange={e => onUpdateWidget({ label: e.target.value })}
                    placeholder="请输入字段标题"
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* 3. 占位提示 (非选择框/开关/静态文本) */}
                {selectedWidget.type !== 'switch' && selectedWidget.type !== 'divider' && selectedWidget.type !== 'collapse' && (
                  <div className="flex items-center gap-3">
                    <label className="w-16 text-slate-700 shrink-0 font-normal">占位提示</label>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={selectedWidget.placeholder || ''}
                        onChange={e => onUpdateWidget({ placeholder: e.target.value })}
                        placeholder={selectedWidget.type === 'number' ? '请输入数字' : '请输入'}
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                {/* 4. 描述信息 */}
                <div className="flex items-center gap-3">
                  <label className="w-16 text-slate-700 shrink-0 font-normal">描述信息</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={selectedWidget.helpText || ''}
                      onChange={e => onUpdateWidget({ helpText: e.target.value })}
                      placeholder="请输入描述信息"
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* 5. 状态 (普通、禁用、只读、隐藏) */}
                {(selectedWidget.category === 'basic' || selectedWidget.category === 'advanced') && (
                  <div className="flex items-center gap-3">
                    <label className="w-16 text-slate-700 shrink-0 font-normal">状态</label>
                    <div className="flex-1">
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg w-full">
                        {[
                          { key: 'normal', label: '普通' },
                          { key: 'disabled', label: '禁用' },
                          { key: 'readonly', label: '只读' },
                          { key: 'hidden', label: '隐藏' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => onUpdateWidget({
                              widgetStatus: opt.key as any,
                              disabled: opt.key === 'disabled',
                              readonly: opt.key === 'readonly',
                              hidden: opt.key === 'hidden'
                            })}
                            className={`flex-1 py-1 text-xs rounded-md transition-all cursor-pointer text-center ${
                              currentStatus === opt.key
                                ? 'bg-white text-slate-800 font-bold shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. 单行文本 / 多行文本：默认值输入与 0/500 */}
                {(selectedWidget.type === 'input' || selectedWidget.type === 'textarea') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">默认值</label>
                      <div className="flex-1" />
                    </div>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={selectedWidget.defaultValue || ''}
                        onChange={e => onUpdateWidget({ defaultValue: e.target.value.slice(0, 500) })}
                        placeholder="请输入默认值"
                        maxLength={500}
                        className="w-full p-2.5 pb-6 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 resize-none leading-relaxed shadow-2xs"
                      />
                      <span className="absolute bottom-2 right-2.5 text-[10px] text-slate-400 pointer-events-none select-none font-mono">
                        {(selectedWidget.defaultValue || '').length}/500
                      </span>
                    </div>
                  </div>
                )}

                {/* 多行文本高度 */}
                {selectedWidget.type === 'textarea' && (
                  <div className="flex items-center gap-3">
                    <label className="w-20 text-slate-700 shrink-0 font-normal">多行文本高度</label>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="number"
                        min={2}
                        max={12}
                        value={selectedWidget.rows || 4}
                        onChange={e => onUpdateWidget({ rows: Math.max(2, Math.min(12, Number(e.target.value) || 4)) })}
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs font-mono"
                      />
                      <div className="absolute right-1 flex flex-col">
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ rows: Math.min(12, (selectedWidget.rows || 4) + 1) })}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ rows: Math.max(2, (selectedWidget.rows || 4) - 1) })}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 清除按钮 (单行文本/多行文本/下拉) */}
                {(selectedWidget.type === 'input' || selectedWidget.type === 'select') && (
                  <div className="flex items-center justify-between py-1">
                    <label className="w-16 text-slate-700 shrink-0 font-normal">清除按钮</label>
                    <button
                      type="button"
                      onClick={() => onUpdateWidget({ clearable: !selectedWidget.clearable })}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        selectedWidget.clearable ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${
                        selectedWidget.clearable ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}

                {/* 7. 数字输入专属配置 */}
                {selectedWidget.type === 'number' && (
                  <div className="space-y-3.5">
                    {/* 默认值 */}
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">默认值</label>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={selectedWidget.defaultValue !== undefined ? selectedWidget.defaultValue : ''}
                          onChange={e => onUpdateWidget({ defaultValue: e.target.value === '' ? undefined : Number(e.target.value) })}
                          placeholder="请输入默认值"
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* 单位 */}
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">单位</label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={selectedWidget.unit || ''}
                          onChange={e => onUpdateWidget({ unit: e.target.value })}
                          placeholder="请输入"
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* 小数位数 */}
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">小数位数</label>
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={selectedWidget.precision !== undefined ? selectedWidget.precision : 0}
                          onChange={e => onUpdateWidget({ precision: Number(e.target.value) })}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <div className="absolute right-1 flex flex-col">
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ precision: Math.min(6, (selectedWidget.precision || 0) + 1) })}
                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ precision: Math.max(0, (selectedWidget.precision || 0) - 1) })}
                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 步长 */}
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">步长</label>
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="number"
                          step="any"
                          value={selectedWidget.step !== undefined ? selectedWidget.step : 1}
                          onChange={e => onUpdateWidget({ step: Number(e.target.value) })}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <div className="absolute right-1 flex flex-col">
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ step: (selectedWidget.step || 1) + 1 })}
                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ step: Math.max(0.01, (selectedWidget.step || 1) - 1) })}
                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 千位分隔 */}
                    <div className="flex items-center justify-between py-1">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">千位分隔</label>
                      <button
                        type="button"
                        onClick={() => onUpdateWidget({ thousandSeparator: !selectedWidget.thousandSeparator })}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          selectedWidget.thousandSeparator ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${
                          selectedWidget.thousandSeparator ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. 下拉单选 / 下拉复选 / 单选复选 选项配置 */}
                {(selectedWidget.type === 'select' || selectedWidget.type === 'multi_select' || selectedWidget.type === 'radio' || selectedWidget.type === 'checkbox') && (
                  <div className="space-y-2 pt-1">
                    {selectedWidget.type === 'multi_select' && (
                      <div className="flex items-center justify-between py-1">
                        <label className="w-16 text-slate-700 shrink-0 font-normal">全选按钮</label>
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ selectAll: !selectedWidget.selectAll })}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            selectedWidget.selectAll ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${
                            selectedWidget.selectAll ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    )}

                    {(selectedWidget.type === 'radio' || selectedWidget.type === 'checkbox') && (
                      <div className="flex items-center gap-3">
                        <label className="w-16 text-slate-700 shrink-0 font-normal">排列方式</label>
                        <div className="flex-1 grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ direction: 'horizontal' })}
                            className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                              (selectedWidget.direction || 'horizontal') === 'horizontal' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            横向排列
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ direction: 'vertical' })}
                            className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                              selectedWidget.direction === 'vertical' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            纵向排列
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-700 font-normal">选项配置</span>
                      <button
                        type="button"
                        onClick={() => {
                          const opts = selectedWidget.options || [];
                          const newOpt = { label: `选项 ${opts.length + 1}`, value: `opt_${Date.now()}` };
                          onUpdateWidget({ options: [...opts, newOpt] });
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>添加选项</span>
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                      {(selectedWidget.options || [{ label: '选项一', value: 'opt1' }, { label: '选项二', value: 'opt2' }]).map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={e => {
                              const opts = [...(selectedWidget.options || [{ label: '选项一', value: 'opt1' }, { label: '选项二', value: 'opt2' }])];
                              opts[i] = { ...opts[i], label: e.target.value };
                              onUpdateWidget({ options: opts });
                            }}
                            className="flex-1 h-7 px-2 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const opts = (selectedWidget.options || [{ label: '选项一', value: 'opt1' }, { label: '选项二', value: 'opt2' }]).filter((_, idx) => idx !== i);
                              onUpdateWidget({ options: opts });
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="删除选项"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. 折叠面板专属 */}
                {selectedWidget.type === 'collapse' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">默认展示</label>
                      <div className="flex-1 grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ defaultCollapsed: false })}
                          className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                            !selectedWidget.defaultCollapsed ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          默认展开
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ defaultCollapsed: true })}
                          className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                            selectedWidget.defaultCollapsed ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          默认折叠
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">折叠内容详情</label>
                      <textarea
                        rows={3}
                        value={selectedWidget.collapseContent || ''}
                        onChange={e => onUpdateWidget({ collapseContent: e.target.value })}
                        placeholder="请输入展开后呈现的内容..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* 打分组件专属配置 (严格支持一等100分至五等60分分级得分标准) */}
                {(selectedWidget.type === 'rate' || selectedWidget.type === 'score') && (() => {
                  const STANDARD_RATE_LEVELS = [
                    { score: 100, star: 5, grade: '一等', label: '一等(特优)', color: 'emerald', desc: '100分 · 响应极速处置严密，示范特优' },
                    { score: 90, star: 4, grade: '二等', label: '二等(优秀)', color: 'blue', desc: '90分 · 措施有力协同顺畅，办案优秀' },
                    { score: 80, star: 3, grade: '三等', label: '三等(良好)', color: 'cyan', desc: '80分 · 基本指标达标，时效质量良好' },
                    { score: 70, star: 2, grade: '四等', label: '四等(合格)', color: 'amber', desc: '70分 · 达到底线要求，考核评定合格' },
                    { score: 60, star: 1, grade: '五等', label: '五等(基本)', color: 'slate', desc: '60分 · 基本履职，存在瑕疵待提升' }
                  ];

                  const curLevels = (selectedWidget.rateLevels && selectedWidget.rateLevels.length === 5)
                    ? selectedWidget.rateLevels
                    : STANDARD_RATE_LEVELS;

                  return (
                    <div className="space-y-3.5 pt-1">
                      {/* 满分与分制标准 */}
                      <div className="flex items-center gap-3">
                        <label className="w-16 text-slate-700 shrink-0 font-normal">满分标准</label>
                        <div className="flex-1 grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ max: 100, defaultValue: 100 })}
                            className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                              (selectedWidget.max || 100) === 100 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            100分满分制
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateWidget({ max: 5, defaultValue: 5 })}
                            className={`py-1 text-xs rounded transition-all cursor-pointer font-medium ${
                              selectedWidget.max === 5 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            5星满分制
                          </button>
                        </div>
                      </div>

                      {/* 默认分值 */}
                      <div className="flex items-center gap-3">
                        <label className="w-16 text-slate-700 shrink-0 font-normal">默认得分</label>
                        <div className="flex-1 flex items-center gap-2">
                          <select
                            value={selectedWidget.defaultValue !== undefined ? selectedWidget.defaultValue : 100}
                            onChange={e => onUpdateWidget({ defaultValue: Number(e.target.value) })}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                          >
                            <option value={100}>一等(特优) - 100分</option>
                            <option value={90}>二等(优秀) - 90分</option>
                            <option value={80}>三等(良好) - 80分</option>
                            <option value={70}>四等(合格) - 70分</option>
                            <option value={60}>五等(基本) - 60分</option>
                          </select>
                        </div>
                      </div>

                      {/* 显示等级文案开关 */}
                      <div className="flex items-center justify-between py-1">
                        <label className="w-24 text-slate-700 shrink-0 font-normal">显示等级文案</label>
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ showScoreText: selectedWidget.showScoreText !== false ? false : true })}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            selectedWidget.showScoreText !== false ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${
                            selectedWidget.showScoreText !== false ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* 分级得分标准提示条 */}
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>分级得分标准体系</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 pt-1 text-[11px] text-center font-mono">
                          <div className="p-1 bg-white/80 rounded border border-emerald-200 text-emerald-800 font-semibold">特优:100</div>
                          <div className="p-1 bg-white/80 rounded border border-blue-200 text-blue-800 font-semibold">优秀:90</div>
                          <div className="p-1 bg-white/80 rounded border border-cyan-200 text-cyan-800 font-semibold">良好:80</div>
                          <div className="p-1 bg-white/80 rounded border border-amber-200 text-amber-800 font-semibold">合格:70</div>
                          <div className="p-1 bg-white/80 rounded border border-slate-200 text-slate-700 font-semibold">基本:60</div>
                        </div>
                      </div>

                      {/* 打分等级矩阵配置区 */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>五级得分标准项逐项配置</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">模板：</span>
                            <select
                              onChange={e => {
                                const val = e.target.value;
                                if (val === 'standard') {
                                  onUpdateWidget({ rateLevels: STANDARD_RATE_LEVELS, defaultValue: 100 });
                                } else if (val === 'satisfaction') {
                                  onUpdateWidget({
                                    rateLevels: [
                                      { score: 100, star: 5, label: '非常满意', color: 'emerald', desc: '高效响应、妥善化解、协同示范卓越' },
                                      { score: 90, star: 4, label: '满意', color: 'blue', desc: '处置迅速、措施得当、沟通顺畅' },
                                      { score: 80, star: 3, label: '一般', color: 'cyan', desc: '基本满足处置要求、时效达标' },
                                      { score: 70, star: 2, label: '不满意', color: 'amber', desc: '办理过程存在瑕疵、回复不及时' },
                                      { score: 60, star: 1, label: '非常不满意', color: 'rose', desc: '处置延误、协同不力或成效不佳' }
                                    ]
                                  });
                                } else if (val === 'exam') {
                                  onUpdateWidget({
                                    rateLevels: [
                                      { score: 100, star: 5, label: '优秀', color: 'emerald', desc: '示范模范实效显著' },
                                      { score: 90, star: 4, label: '良好', color: 'blue', desc: '响应迅速处理严密' },
                                      { score: 80, star: 3, label: '合格', color: 'cyan', desc: '达标符合基本指标' },
                                      { score: 70, star: 2, label: '基本合格', color: 'amber', desc: '整改成效存在微小漏洞' },
                                      { score: 60, star: 1, label: '不合格', color: 'rose', desc: '未达到基本验收标准' }
                                    ]
                                  });
                                } else if (val === 'achievement') {
                                  onUpdateWidget({
                                    rateLevels: [
                                      { score: 100, star: 5, label: '卓越', color: 'emerald', desc: '极速处置零舆情回弹' },
                                      { score: 90, star: 4, label: '良好', color: 'blue', desc: '协同高效合规' },
                                      { score: 80, star: 3, label: '达标', color: 'cyan', desc: '按期保质办结' },
                                      { score: 70, star: 2, label: '基本达标', color: 'amber', desc: '办理时效有待提升' },
                                      { score: 60, star: 1, label: '未达标', color: 'rose', desc: '严重逾期未办' }
                                    ]
                                  });
                                }
                              }}
                              className="text-[11px] h-6 px-1 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-500"
                            >
                              <option value="standard">分级得分标准 (一等100分~五等60分)</option>
                              <option value="satisfaction">满意度等级 (非常满意~非常不满意)</option>
                              <option value="exam">考核评级 (优秀~不合格)</option>
                              <option value="achievement">履职成效 (卓越~未达标)</option>
                            </select>
                          </div>
                        </div>

                        {/* 5 级打分项逐项编辑 */}
                        <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
                          {curLevels.map((lvl, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-12 text-[11px] font-bold font-mono text-amber-700 shrink-0 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{lvl.star || (5 - idx)}星</span>
                                </span>
                                <input
                                  type="text"
                                  value={lvl.label}
                                  onChange={e => {
                                    const curList = [...curLevels];
                                    curList[idx] = { ...curList[idx], label: e.target.value };
                                    onUpdateWidget({ rateLevels: curList });
                                  }}
                                  placeholder="等级文案，如一等(特优)"
                                  className="w-32 h-6 px-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 font-bold"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="number"
                                    value={lvl.score}
                                    onChange={e => {
                                      const curList = [...curLevels];
                                      curList[idx] = { ...curList[idx], score: Number(e.target.value) || 0 };
                                      onUpdateWidget({ rateLevels: curList });
                                    }}
                                    className="w-14 h-6 px-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-amber-800 outline-none focus:border-blue-500 text-center"
                                  />
                                  <span className="text-[11px] text-slate-500">分</span>
                                </div>
                              </div>
                              <input
                                type="text"
                                value={lvl.desc || ''}
                                onChange={e => {
                                  const curList = [...curLevels];
                                  curList[idx] = { ...curList[idx], desc: e.target.value };
                                  onUpdateWidget({ rateLevels: curList });
                                }}
                                placeholder="等级补充标准说明"
                                className="w-full h-6 px-1.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 outline-none focus:border-blue-500 truncate"
                              />
                            </div>
                          ))}
                        </div>

                        {/* 快速重置标准按钮 */}
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ rateLevels: STANDARD_RATE_LEVELS, defaultValue: 100, max: 100 })}
                          className="w-full py-1 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer font-medium"
                        >
                          <Star className="w-3 h-3 text-blue-500" />
                          <span>重置为标准分级得分规范 (一等100分 ~ 五等60分)</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 手机验证码专属配置 */}
                {selectedWidget.type === 'phone_verify' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <label className="w-16 text-slate-700 shrink-0 font-normal">按钮文案</label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={selectedWidget.buttonText || '获取验证码'}
                          onChange={e => onUpdateWidget({ buttonText: e.target.value })}
                          placeholder="获取验证码"
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 下发组织节点/群组专属配置 */}
                {selectedWidget.type === 'org_group_dispatch' && (
                  <div className="space-y-3 pt-1">
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 leading-relaxed">
                      💡 运行时或实时表单仿真预览中，点击该控件将自动弹出「下发组织节点/群组」选择弹窗，支持勾选市委网信办组织架构及专业网评群组。
                    </div>
                  </div>
                )}

                {/* 10. 校验规则分组卡片 */}
                <div className="pt-2">
                  <div
                    onClick={() => setValidationOpen(!validationOpen)}
                    className="flex items-center justify-between py-2 border-t border-b border-slate-100 cursor-pointer select-none -mx-4 px-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                  >
                    <span className="font-bold text-slate-800">校验</span>
                    {validationOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {validationOpen && (
                    <div className="divide-y divide-slate-100 pt-1">
                      {/* 必填 */}
                      <div className="py-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">必填</span>
                          <input
                            type="checkbox"
                            checked={!!selectedWidget.required}
                            onChange={e => onUpdateWidget({ required: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </div>
                        {!!selectedWidget.required && (
                          <input
                            type="text"
                            value={selectedWidget.validationMessage || ''}
                            onChange={e => onUpdateWidget({ validationMessage: e.target.value })}
                            placeholder="请输入自定义必填提示（如：此项为必填）"
                            className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] outline-none focus:border-blue-500"
                          />
                        )}
                      </div>

                      {/* 数值专属：最小值 */}
                      {selectedWidget.type === 'number' && (
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">最小值</span>
                            <input
                              type="checkbox"
                              checked={selectedWidget.min !== undefined}
                              onChange={e => onUpdateWidget({ min: e.target.checked ? 0 : undefined })}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </div>
                          {selectedWidget.min !== undefined && (
                            <input
                              type="number"
                              value={selectedWidget.min !== undefined ? selectedWidget.min : ''}
                              onChange={e => onUpdateWidget({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="设置最小值阈值"
                              className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      )}

                      {/* 数值专属：最大值 */}
                      {selectedWidget.type === 'number' && (
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">最大值</span>
                            <input
                              type="checkbox"
                              checked={selectedWidget.max !== undefined}
                              onChange={e => onUpdateWidget({ max: e.target.checked ? 100 : undefined })}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </div>
                          {selectedWidget.max !== undefined && (
                            <input
                              type="number"
                              value={selectedWidget.max !== undefined ? selectedWidget.max : ''}
                              onChange={e => onUpdateWidget({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="设置最大值阈值"
                              className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      )}

                      {/* 最小长度 */}
                      {(selectedWidget.type === 'input' || selectedWidget.type === 'textarea' || selectedWidget.type === 'number' || selectedWidget.type === 'multi_select') && (
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">最小长度</span>
                            <input
                              type="checkbox"
                              checked={selectedWidget.minLength !== undefined && selectedWidget.minLength > 0}
                              onChange={e => onUpdateWidget({ minLength: e.target.checked ? 1 : undefined })}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </div>
                          {(selectedWidget.minLength !== undefined && selectedWidget.minLength > 0) && (
                            <input
                              type="number"
                              min={0}
                              value={selectedWidget.minLength !== undefined ? selectedWidget.minLength : ''}
                              onChange={e => onUpdateWidget({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="设置最小长度数值"
                              className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      )}

                      {/* 最大长度 */}
                      {(selectedWidget.type === 'input' || selectedWidget.type === 'textarea' || selectedWidget.type === 'number' || selectedWidget.type === 'multi_select') && (
                        <div className="py-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">最大长度</span>
                            <input
                              type="checkbox"
                              checked={selectedWidget.maxLength !== undefined && selectedWidget.maxLength > 0}
                              onChange={e => onUpdateWidget({ maxLength: e.target.checked ? 50 : undefined })}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </div>
                          {(selectedWidget.maxLength !== undefined && selectedWidget.maxLength > 0) && (
                            <input
                              type="number"
                              min={0}
                              value={selectedWidget.maxLength !== undefined ? selectedWidget.maxLength : ''}
                              onChange={e => onUpdateWidget({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="设置最大长度数值"
                              className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ===================== 组件高级/样式 (行隔宽度等) ===================== */
          <div className="space-y-5">
            {/* 行隔宽度 (24 栅格控制) */}
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                  <span>行隔宽度 (1-24 栅格)</span>
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {selectedWidget.span || 24} / 24 ({Math.round(((selectedWidget.span || 24) / 24) * 100)}%)
                </span>
              </div>

              {/* 滑块调节 */}
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={selectedWidget.span || 24}
                onChange={e => onUpdateWidget({ span: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />

              {/* 快捷比例按钮 */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[
                  { span: 6, label: '1/4' },
                  { span: 8, label: '1/3' },
                  { span: 12, label: '1/2' },
                  { span: 16, label: '2/3' },
                  { span: 24, label: '整行' }
                ].map(item => (
                  <button
                    key={item.span}
                    type="button"
                    onClick={() => onUpdateWidget({ span: item.span })}
                    className={`py-1 text-xs font-mono font-bold rounded border transition-colors cursor-pointer ${
                      selectedWidget.span === item.span
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label 文本对齐 */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Label 文本对齐
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'left', label: '左对齐' },
                  { key: 'center', label: '居中' },
                  { key: 'right', label: '右对齐' }
                ].map(align => (
                  <button
                    key={align.key}
                    type="button"
                    onClick={() => onUpdateWidget({ labelAlign: align.key as any })}
                    className={`py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                      (selectedWidget.labelAlign || 'left') === align.key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {align.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义 CSS Class */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                自定义 CSS Class 类名
              </label>
              <input
                type="text"
                value={selectedWidget.customClass || ''}
                onChange={e => onUpdateWidget({ customClass: e.target.value })}
                placeholder="例：font-bold text-red-600"
                className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
