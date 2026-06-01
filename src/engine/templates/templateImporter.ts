// 模板导入器 - 支持从代码字符串动态导入模板

import { TemplateDefinition, TemplateParamSchema, TemplateCategory } from './types';
import { registerTemplate } from './index';

/**
 * 模板导入结果
 */
export interface TemplateImportResult {
  success: boolean;
  template?: TemplateDefinition;
  error?: string;
}

/**
 * 验证模板代码字符串
 * @param code TypeScript/JavaScript 代码字符串
 * @returns 验证结果
 */
export const validateTemplateCode = (code: string): { valid: boolean; error?: string } => {
  // 检查必要的导出
  if (!code.includes('export')) {
    return { valid: false, error: '模板代码必须包含 export 语句' };
  }

  // 检查是否包含 render 函数
  if (!code.includes('render')) {
    return { valid: false, error: '模板必须包含 render 函数' };
  }

  // 检查是否包含必要的属性
  const requiredProps = ['id', 'name', 'description', 'category', 'schema'];
  const missingProps = requiredProps.filter(prop => !code.includes(prop));
  if (missingProps.length > 0) {
    return { valid: false, error: `模板缺少必要属性: ${missingProps.join(', ')}` };
  }

  // 检查语法错误（基础检查）
  try {
    // 尝试解析为函数来检查语法
    new Function(code);
  } catch (e) {
    return { valid: false, error: `语法错误: ${e instanceof Error ? e.message : '未知错误'}` };
  }

  return { valid: true };
};

/**
 * 从代码字符串创建模板
 * @param code TypeScript/JavaScript 代码字符串
 * @param templateId 可选的模板ID（如果代码中没有定义）
 * @returns 导入结果
 */
export const importTemplateFromCode = (
  code: string,
  templateId?: string
): TemplateImportResult => {
  // 验证代码
  const validation = validateTemplateCode(code);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // 创建一个安全的执行环境
    const sandbox = createTemplateSandbox();

    // 包装代码以捕获导出
    const wrappedCode = `
      ${code}
      
      // 返回模板定义
      if (typeof template !== 'undefined') {
        return template;
      }
      if (typeof myTemplate !== 'undefined') {
        return myTemplate;
      }
      // 尝试从 export 语句中提取
      return exports?.template || exports?.default || null;
    `;

    // 执行代码
    const templateFn = new Function(...Object.keys(sandbox), wrappedCode);
    const template = templateFn(...Object.values(sandbox));

    if (!template) {
      return { success: false, error: '无法从代码中提取模板定义' };
    }

    // 验证模板结构
    const validationResult = validateTemplateStructure(template);
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error };
    }

    // 如果提供了 templateId，覆盖代码中的 id
    if (templateId) {
      template.id = templateId;
    }

    // 确保模板有 initParams 函数
    if (!template.initParams) {
      template.initParams = createDefaultInitParams(template.schema);
    }

    // 确保模板有 validateParams 函数
    if (!template.validateParams) {
      template.validateParams = createDefaultValidateParams(template.schema);
    }

    // 包装 render 函数以添加自适应布局
    template.render = wrapRenderWithAdaptiveLayout(template.render);

    return { success: true, template };
  } catch (error) {
    return {
      success: false,
      error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};

/**
 * 注册导入的模板
 * @param code TypeScript/JavaScript 代码字符串
 * @returns 导入结果
 */
export const registerTemplateFromCode = (code: string): TemplateImportResult => {
  const result = importTemplateFromCode(code);

  if (result.success && result.template) {
    try {
      registerTemplate(result.template);
      return { success: true, template: result.template };
    } catch (error) {
      return {
        success: false,
        error: `注册失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  return result;
};

/**
 * 创建模板沙箱环境
 */
const createTemplateSandbox = (): Record<string, any> => {
  return {
    console,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    exports: {},
    module: { exports: {} },
    require: () => ({})
  };
};

/**
 * 验证模板结构
 */
const validateTemplateStructure = (template: any): { valid: boolean; error?: string } => {
  // 检查必要字段
  if (!template.id || typeof template.id !== 'string') {
    return { valid: false, error: '模板必须包含有效的 id 字段（字符串）' };
  }

  if (!template.name || typeof template.name !== 'string') {
    return { valid: false, error: '模板必须包含有效的 name 字段（字符串）' };
  }

  if (!template.description || typeof template.description !== 'string') {
    return { valid: false, error: '模板必须包含有效的 description 字段（字符串）' };
  }

  if (!template.category || !isValidCategory(template.category)) {
    return { valid: false, error: '模板必须包含有效的 category 字段' };
  }

  if (!Array.isArray(template.schema)) {
    return { valid: false, error: '模板必须包含有效的 schema 字段（数组）' };
  }

  // 验证 schema 中的每个参数
  for (const param of template.schema) {
    const paramValidation = validateParamSchema(param);
    if (!paramValidation.valid) {
      return { valid: false, error: `参数验证失败: ${paramValidation.error}` };
    }
  }

  if (typeof template.render !== 'function') {
    return { valid: false, error: '模板必须包含有效的 render 函数' };
  }

  return { valid: true };
};

/**
 * 验证参数定义
 */
const validateParamSchema = (param: any): { valid: boolean; error?: string } => {
  if (!param.key || typeof param.key !== 'string') {
    return { valid: false, error: '参数必须包含有效的 key 字段' };
  }

  if (!param.label || typeof param.label !== 'string') {
    return { valid: false, error: '参数必须包含有效的 label 字段' };
  }

  const validTypes = ['string', 'number', 'color', 'boolean', 'select', 'textarea', 'code'];
  if (!param.type || !validTypes.includes(param.type)) {
    return { valid: false, error: `参数 ${param.key} 的 type 必须是以下之一: ${validTypes.join(', ')}` };
  }

  if (param.default === undefined) {
    return { valid: false, error: `参数 ${param.key} 必须包含 default 值` };
  }

  return { valid: true };
};

/**
 * 检查是否是有效的模板分类
 */
const isValidCategory = (category: string): category is TemplateCategory => {
  const validCategories: TemplateCategory[] = ['ui', 'code', 'text', 'effect', 'transition', 'other'];
  return validCategories.includes(category as TemplateCategory);
};

/**
 * 创建默认的 initParams 函数
 */
const createDefaultInitParams = (schema: TemplateParamSchema[]) => {
  return (duration: number): Record<string, any> => {
    const defaults: Record<string, any> = {};
    schema.forEach(param => {
      defaults[param.key] = param.default;
    });
    return defaults;
  };
};

/**
 * 创建默认的 validateParams 函数
 */
const createDefaultValidateParams = (schema: TemplateParamSchema[]) => {
  return (params: Record<string, any>): boolean => {
    for (const param of schema) {
      const value = params[param.key];

      // 检查必填参数
      if (value === undefined) {
        return false;
      }

      // 类型检查
      switch (param.type) {
        case 'number':
          if (typeof value !== 'number') return false;
          if (param.min !== undefined && value < param.min) return false;
          if (param.max !== undefined && value > param.max) return false;
          break;
        case 'string':
        case 'textarea':
        case 'code':
          if (typeof value !== 'string') return false;
          break;
        case 'boolean':
          if (typeof value !== 'boolean') return false;
          break;
        case 'color':
          if (typeof value !== 'string') return false;
          const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
          if (!colorRegex.test(value)) return false;
          break;
        case 'select':
          if (typeof value !== 'string') return false;
          if (param.options && !param.options.some(opt => opt.value === value)) return false;
          break;
      }
    }
    return true;
  };
};

/**
 * 包装 render 函数以添加自适应布局
 */
const wrapRenderWithAdaptiveLayout = (
  originalRender: Function
): Function => {
  return function(context: any) {
    const { ctx, width, height } = context;

    // 保存原始状态
    ctx.save();

    // 移动到画布中心（如果还没有的话）
    // 注意：渲染器已经设置了 transform，这里不需要再次 translate

    try {
      // 调用原始 render 函数
      originalRender.call(this, context);
    } catch (error) {
      console.error('Template render error:', error);

      // 绘制错误提示
      ctx.save();
      ctx.fillStyle = '#ff0000';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('模板渲染错误', 0, 0);
      ctx.restore();
    } finally {
      // 恢复状态
      ctx.restore();
    }
  };
};

/**
 * 导出模板为代码字符串
 * @param template 模板定义
 * @returns TypeScript 代码字符串
 */
export const exportTemplateToCode = (template: TemplateDefinition): string => {
  const schemaString = JSON.stringify(template.schema, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  return `import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, colorUtils, drawUtils, animationUtils, paramGuard } from './templateUtils';

/**
 * ${template.name}
 * ${template.description}
 */
export const ${template.id}Template: TemplateDefinition = {
  id: '${template.id}',
  name: '${template.name}',
  description: '${template.description}',
  category: '${template.category}',
  schema: ${schemaString},

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, duration, params } = context;

    // 获取自适应尺寸 - 内容占满画面的95%
    const availableSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const availWidth = availableSize.width;
    const availHeight = availableSize.height;

    // 参数边界保护
    // TODO: 添加参数保护

    // 进度边界保护
    const p = paramGuard.number(progress, 0, 0, 1);

    // 使用缓动函数
    const eased = easing.easeOutCubic(p);

    // TODO: 实现渲染逻辑
    // 示例：绘制居中的文字
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = eased;
    ctx.fillText('${template.name}', 0, 0);
    ctx.restore();
  },

  initParams: (duration: number) => {
    return {
${template.schema.map(p => `      ${p.key}: ${JSON.stringify(p.default)}`).join(',\n')}
    };
  },

  validateParams: (params: Record<string, any>) => {
    // TODO: 添加参数验证逻辑
    return true;
  }
};
`;
};

/**
 * 获取模板代码模板
 * @returns 空模板代码字符串
 */
export const getTemplateCodeTemplate = (): string => {
  return `import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, colorUtils, drawUtils, animationUtils, paramGuard } from './templateUtils';

/**
 * 新模板
 * 描述：这是一个新模板
 */
export const myNewTemplate: TemplateDefinition = {
  id: 'my_new_template',
  name: '我的新模板',
  description: '这是一个示例模板描述',
  category: 'effect',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'Hello World',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'color',
      label: '文字颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'scale',
      label: '缩放比例',
      type: 'number',
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, duration, params } = context;

    // 获取自适应尺寸 - 内容占满画面的95%
    const availableSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const availWidth = availableSize.width;
    const availHeight = availableSize.height;

    // 参数边界保护
    const text = paramGuard.string(params.text, 'Hello World');
    const color = paramGuard.color(params.color, '#00d4ff');
    const scale = paramGuard.number(params.scale, 1, 0.5, 2);

    // 进度边界保护
    const p = paramGuard.number(progress, 0, 0, 1);

    // 使用缓动函数创建淡入效果
    const eased = easing.easeOutCubic(p);

    // 计算自适应字体大小
    const fontSize = adaptiveLayout.calculateFontSize(
      ctx,
      text,
      availWidth,
      availHeight
    );

    // 绘制内容
    ctx.save();

    // 应用缩放
    ctx.scale(scale * eased, scale * eased);

    // 设置样式
    ctx.fillStyle = color;
    ctx.font = 'bold \${fontSize}px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 添加发光效果
    drawUtils.glow(ctx, color, 20 * eased, () => {
      ctx.fillText(text, 0, 0);
    });

    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'Hello World',
    color: '#00d4ff',
    scale: 1
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
`;
};

// 导出所有功能
export default {
  validateTemplateCode,
  importTemplateFromCode,
  registerTemplateFromCode,
  exportTemplateToCode,
  getTemplateCodeTemplate
};
