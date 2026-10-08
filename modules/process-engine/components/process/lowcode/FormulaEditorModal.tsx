import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Code2, 
  Trash2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface FormulaFieldItem {
  key: string;
  label: string;
  type: string;
}

interface FormulaFunctionDef {
  name: string;
  category: 'logic' | 'math' | 'text' | 'date';
  syntax: string;
  template: string;
  description: string;
  example: string;
}

const FORMULA_FUNCTIONS: FormulaFunctionDef[] = [
  {
    name: 'IF',
    category: 'logic',
    syntax: 'IF(判断条件, 成立返回值, 不成立返回值)',
    template: 'IF(条件, true, false)',
    description: '逻辑判断函数，当条件成立时返回第二个参数，否则返回第三个参数。',
    example: 'IF([涉案金额] >= 10000, true, false)'
  },
  {
    name: 'AND',
    category: 'logic',
    syntax: 'AND(条件1, 条件2, ...)',
    template: 'AND(条件1, 条件2)',
    description: '多条件并且判断，所有传入参数均为真时返回 true。',
    example: 'AND([涉案金额] >= 10000, [任务紧急程度] == "特急")'
  },
  {
    name: 'OR',
    category: 'logic',
    syntax: 'OR(条件1, 条件2, ...)',
    template: 'OR(条件1, 条件2)',
    description: '多条件或者判断，只要任一条件为真即返回 true。',
    example: 'OR([预警风险等级] == "重大", [任务紧急程度] == "特急")'
  },
  {
    name: 'NOT',
    category: 'logic',
    syntax: 'NOT(条件)',
    template: 'NOT(条件)',
    description: '逻辑非判断，对传入的布尔值取反。',
    example: 'NOT(ISEMPTY([涉案金额]))'
  },
  {
    name: 'ISEMPTY',
    category: 'text',
    syntax: 'ISEMPTY(字段/值)',
    template: 'ISEMPTY(字段)',
    description: '判断目标字段是否为空（null、未填写或空字符串）。',
    example: 'ISEMPTY([处置结果佐证])'
  },
  {
    name: 'CONTAINS',
    category: 'text',
    syntax: 'CONTAINS(目标文本, 包含子串)',
    template: 'CONTAINS(文本, "子串")',
    description: '判断指定文本中是否包含特定子字符串。',
    example: 'CONTAINS([业务类型], "紧急")'
  },
  {
    name: 'EQUALS',
    category: 'text',
    syntax: 'EQUALS(值1, 值2)',
    template: 'EQUALS(值1, 值2)',
    description: '比较两值是否严格相等。',
    example: 'EQUALS([任务紧急程度], "特急")'
  },
  {
    name: 'SUM',
    category: 'math',
    syntax: 'SUM(数值1, 数值2, ...)',
    template: 'SUM(数值1, 数值2)',
    description: '计算传入所有数字的总和。',
    example: 'SUM([涉案金额], [其他费用]) >= 20000'
  },
  {
    name: 'AVG',
    category: 'math',
    syntax: 'AVG(数值1, 数值2, ...)',
    template: 'AVG(数值1, 数值2)',
    description: '计算传入数值的算术平均值。',
    example: 'AVG([处置用时1], [处置用时2]) <= 24'
  },
  {
    name: 'MAX',
    category: 'math',
    syntax: 'MAX(数值1, 数值2, ...)',
    template: 'MAX(数值1, 数值2)',
    description: '返回传入数值集合中的最大值。',
    example: 'MAX([涉案金额], [评估价值]) > 50000'
  },
  {
    name: 'MIN',
    category: 'math',
    syntax: 'MIN(数值1, 数值2, ...)',
    template: 'MIN(数值1, 数值2)',
    description: '返回传入数值集合中的最小值。',
    example: 'MIN([涉案金额], 10000) == 10000'
  },
  {
    name: 'ROUND',
    category: 'math',
    syntax: 'ROUND(数值, 保留位数)',
    template: 'ROUND(数值, 2)',
    description: '对数值按照指定小数位数进行四舍五入。',
    example: 'ROUND([涉案金额] * 0.1, 2) >= 1000'
  },
  {
    name: 'ABS',
    category: 'math',
    syntax: 'ABS(数值)',
    template: 'ABS(数值)',
    description: '计算传入数值的绝对值。',
    example: 'ABS([偏差值]) > 10'
  },
  {
    name: 'DATEDIF',
    category: 'date',
    syntax: 'DATEDIF(开始日期, 结束日期, "d")',
    template: 'DATEDIF(开始日期, 结束日期, "d")',
    description: '计算两个日期间隔天数（"d" 为天数）。',
    example: 'DATEDIF([立案时间], NOW(), "d") > 3'
  },
  {
    name: 'NOW',
    category: 'date',
    syntax: 'NOW()',
    template: 'NOW()',
    description: '获取当前系统时间。',
    example: '[截止时间] > NOW()'
  }
];

const OPERATOR_GROUPS = [
  {
    name: '比较运算',
    items: [
      { label: '>', value: ' > ', desc: '大于' },
      { label: '<', value: ' < ', desc: '小于' },
      { label: '>=', value: ' >= ', desc: '大于等于' },
      { label: '<=', value: ' <= ', desc: '小于等于' },
      { label: '==', value: ' == ', desc: '等于' },
      { label: '!=', value: ' != ', desc: '不等于' }
    ]
  },
  {
    name: '逻辑运算',
    items: [
      { label: '&&', value: ' && ', desc: '并且 (AND)' },
      { label: '||', value: ' || ', desc: '或者 (OR)' },
      { label: '!', value: '!', desc: '逻辑非 (NOT)' }
    ]
  },
  {
    name: '算术运算',
    items: [
      { label: '+', value: ' + ', desc: '加' },
      { label: '-', value: ' - ', desc: '减' },
      { label: '*', value: ' * ', desc: '乘' },
      { label: '/', value: ' / ', desc: '除' },
      { label: '%', value: ' % ', desc: '取模' }
    ]
  },
  {
    name: '符号与常量',
    items: [
      { label: '(', value: '(', desc: '左括号' },
      { label: ')', value: ')', desc: '右括号' },
      { label: '" "', value: '""', desc: '双引号' },
      { label: ',', value: ', ', desc: '逗号' },
      { label: 'true', value: 'true', desc: '真值' },
      { label: 'false', value: 'false', desc: '假值' }
    ]
  }
];

const PRESET_FORMULAS = [
  { label: '涉案金额 ≥ 10,000 元', formula: '[涉案金额] >= 10000' },
  { label: '任务紧急程度为特急', formula: '[任务紧急程度] == "特急"' },
  { label: '金额超5万且重大风险', formula: '[涉案金额] > 50000 && [预警风险等级] == "重大"' },
  { label: '涉及重大涉案风险', formula: '[涉及重大涉案风险] == "是"' },
  { label: '超时逾期且未办结', formula: 'DATEDIF([立案时间], NOW(), "d") > 3' }
];

interface FormulaEditorModalProps {
  isOpen: boolean;
  initialFormula?: string;
  branchName?: string;
  fields?: FormulaFieldItem[];
  onClose: () => void;
  onConfirm: (formula: string) => void;
}

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  initialFormula = '',
  branchName = '条件分支',
  fields = [],
  onClose,
  onConfirm
}) => {
  const [formula, setFormula] = useState(initialFormula);
  const [fieldSearch, setFieldSearch] = useState('');
  const [activeFuncCategory, setActiveFuncCategory] = useState<'all' | 'logic' | 'math' | 'text' | 'date'>('all');
  const [selectedFunc, setSelectedFunc] = useState<FormulaFunctionDef>(FORMULA_FUNCTIONS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormula(initialFormula || '');
      setFieldSearch('');
    }
  }, [isOpen, initialFormula]);

  if (!isOpen) return null;

  // 在光标位置插入文本
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormula(prev => prev + textToInsert);
      return;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newFormula = 
      formula.substring(0, startPos) + 
      textToInsert + 
      formula.substring(endPos, formula.length);

    setFormula(newFormula);

    // 延时恢复焦点并更新光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // 插入表单字段引用
  const handleInsertField = (field: FormulaFieldItem) => {
    insertTextAtCursor(`[${field.label}]`);
  };

  // 插入运算符
  const handleInsertOperator = (opValue: string) => {
    insertTextAtCursor(opValue);
  };

  // 插入函数
  const handleInsertFunction = (func: FormulaFunctionDef) => {
    insertTextAtCursor(func.template);
  };

  // 过滤字段列表
  const filteredFields = fields.filter(f => 
    !fieldSearch || 
    f.label.toLowerCase().includes(fieldSearch.toLowerCase()) || 
    f.key.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  // 过滤函数列表
  const filteredFunctions = FORMULA_FUNCTIONS.filter(func => 
    activeFuncCategory === 'all' || func.category === activeFuncCategory
  );

  // 简易语法校验检查
  const validateFormula = () => {
    if (!formula.trim()) return { valid: false, message: '公式内容为空，请编辑条件公式' };

    // 检查括号匹配
    let openCount = 0;
    for (let char of formula) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
      if (openCount < 0) return { valid: false, message: '括号不匹配：存在多余的反括号 )' };
    }
    if (openCount !== 0) return { valid: false, message: '括号不匹配：缺少闭合括号 )' };

    // 检查引号匹配
    const quoteCount = (formula.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) return { valid: false, message: '引号不匹配：存在未闭合的双引号' };

    return { valid: true, message: '公式格式检查正常' };
  };

  const validation = validateFormula();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">设置条件公式</h3>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                  {branchName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                通过下方字段、运算符和常用函数快速拼接计算表达式，计算结果应为布尔值（true / false）。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 弹窗主体内容 */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* 1. 公式编辑区 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>公式表达式编辑</span>
              </div>
              <div className="flex items-center gap-2">
                {formula && (
                  <button
                    type="button"
                    onClick={() => setFormula('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>清空公式</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 bg-slate-50/50 transition-all">
              <textarea
                ref={textareaRef}
                value={formula}
                onChange={e => setFormula(e.target.value)}
                rows={3}
                placeholder="在此输入条件公式，例如：[涉案金额] >= 10000 && [任务紧急程度] == &quot;特急&quot;&#10;也可在下方直接点击字段、运算符和函数自动插入..."
                className="w-full p-3.5 bg-transparent text-xs font-mono text-slate-800 outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="px-3 py-1.5 bg-white border-t border-slate-200 rounded-b-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {formula ? (
                    validation.valid ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{validation.message}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{validation.message}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">尚未编辑公式，公式为空时将视为默认匹配</span>
                  )}
                </div>
                <span className="text-slate-400 font-mono">
                  {formula.length} 字符
                </span>
              </div>
            </div>

            {/* 常用模板推荐快捷插入 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>常用预设公式：</span>
              </span>
              {PRESET_FORMULAS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormula(preset.formula)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                  title={`点击使用：${preset.formula}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 字段、运算符、函数 三栏选择区 */}
          <div className="grid grid-cols-12 gap-4 pt-1">
            {/* 左栏：表单字段 (4列) */}
            <div className="col-span-4 border border-slate-200 rounded-xl p-3 bg-white space-y-2.5 flex flex-col h-[280px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">表单字段</span>
                <span className="text-[10px] text-slate-400">点击插入</span>
              </div>
              
              {/* 搜索框 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={e => setFieldSearch(e.target.value)}
                  placeholder="搜索表单字段..."
                  className="w-full h-7 pl-8 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* 字段列表 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {filteredFields.length > 0 ? (
                  filteredFields.map(field => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => handleInsertField(field)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="font-medium text-slate-800 group-hover:text-indigo-700 truncate">
                        {field.label}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 shrink-0 ml-1">
                        [{field.key}]
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    未找到相关字段
                  </div>
                )}
              </div>
            </div>

            {/* 中栏：运算符 (3列) */}
            <div className="col-span-3 border border-slate-200 rounded-xl p-3 bg-white space-y-2.5 flex flex-col h-[280px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">运算符</span>
                <span className="text-[10px] text-slate-400">点击插入</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                {OPERATOR_GROUPS.map((grp, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {grp.name}
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {grp.items.map((op, opIdx) => (
                        <button
                          key={opIdx}
                          type="button"
                          onClick={() => handleInsertOperator(op.value)}
                          className="h-7 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded text-xs font-mono font-bold text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                          title={op.desc}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右栏：常用函数 (5列) */}
            <div className="col-span-5 border border-slate-200 rounded-xl p-3 bg-white space-y-2.5 flex flex-col h-[280px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">常用函数</span>
                {/* 函数分类切换 */}
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'logic', label: '逻辑' },
                    { key: 'math', label: '数学' },
                    { key: 'text', label: '文本' },
                    { key: 'date', label: '日期' }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveFuncCategory(cat.key as any)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        activeFuncCategory === cat.key
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 函数列表 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 max-h-[140px]">
                {filteredFunctions.map(func => (
                  <div
                    key={func.name}
                    onClick={() => setSelectedFunc(func)}
                    onDoubleClick={() => handleInsertFunction(func)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer border ${
                      selectedFunc.name === func.name
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-mono font-bold">{func.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertFunction(func);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      插入
                    </button>
                  </div>
                ))}
              </div>

              {/* 选中函数详细解释卡片 */}
              {selectedFunc && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700">{selectedFunc.syntax}</span>
                    <button
                      type="button"
                      onClick={() => handleInsertFunction(selectedFunc)}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>插入此函数</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{selectedFunc.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">例：{selectedFunc.example}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 弹窗底部操作栏 */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>公式条件命中为真（true）时，工单将自动流入该分支推进</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors shadow-2xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(formula.trim());
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-colors shadow-md hover:shadow-lg"
            >
              保存公式配置
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
