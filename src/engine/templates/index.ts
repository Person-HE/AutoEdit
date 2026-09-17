import { TemplateDefinition, TemplateCategory } from './types';

// Text 文字效果模板
import { viralHookTemplate } from './text/viralHook';
import { kineticTitleTemplate } from './text/kineticTitle';
import { glitchTitleTemplate } from './text/glitchTitle';
import { neonScrambleTemplate } from './text/neonScramble';
import { countUpFireTemplate } from './text/countUpFire';
import { cyberSubtitleTemplate } from './text/cyberSubtitle';

// UI 组件模板
import { glassCardTemplate } from './ui/glassCard';
import { metalButtonTemplate } from './ui/metalButton';
import { hologramFrameTemplate } from './ui/hologramFrame';
import { carbonPanelTemplate } from './ui/carbonPanel';

// Background 背景效果模板
import { matrixRainTemplate } from './background/matrixRain';
import { cyberTerminalTemplate } from './background/cyberTerminal';
import { hologramGridTemplate } from './background/hologramGrid';
import { neonCityTemplate } from './background/neonCity';
import { dataVortexTemplate } from './background/dataVortex';
import { particleTunnelTemplate } from './background/particleTunnel';

// Effect 视觉特效模板
import { screenGlitchTemplate } from './effect/screenGlitch';
import { shockwaveBurstTemplate } from './effect/shockwaveBurst';
import { energyFieldTemplate } from './effect/energyField';
import { chromaticGlowTemplate } from './effect/chromaticGlow';
import { neonScanlinesTemplate } from './effect/neonScanlines';

// Code 代码相关模板
import { codeExecutionTemplate } from './code/codeExecution';
import { terminalLogTemplate } from './code/terminalLog';

// 导出所有模板
export {
  viralHookTemplate,
  kineticTitleTemplate,
  glitchTitleTemplate,
  neonScrambleTemplate,
  countUpFireTemplate,
  cyberSubtitleTemplate,
  glassCardTemplate,
  metalButtonTemplate,
  hologramFrameTemplate,
  carbonPanelTemplate,
  matrixRainTemplate,
  cyberTerminalTemplate,
  hologramGridTemplate,
  neonCityTemplate,
  dataVortexTemplate,
  particleTunnelTemplate,
  screenGlitchTemplate,
  shockwaveBurstTemplate,
  energyFieldTemplate,
  chromaticGlowTemplate,
  neonScanlinesTemplate,
  codeExecutionTemplate,
  terminalLogTemplate,
};

// 模板注册表
const TEMPLATES: Record<string, TemplateDefinition> = {};

export const registerTemplate = (template: TemplateDefinition): void => {
  if (!template.id || !template.name || typeof template.render !== 'function') {
    throw new Error('Invalid template format: must have id, name, and render function');
  }
  TEMPLATES[template.id] = template;
  console.log(`✅ Template registered: ${template.name} (${template.id})`);
};

export const getTemplate = (id: string): TemplateDefinition | undefined => {
  return TEMPLATES[id];
};

export const getAllTemplates = (): TemplateDefinition[] => {
  return Object.values(TEMPLATES);
};

export const getTemplatesByCategory = (category: TemplateCategory): TemplateDefinition[] => {
  return Object.values(TEMPLATES).filter(t => t.category === category);
};

export const getTemplateCategories = (): { key: TemplateCategory; name: string }[] => {
  return [
    { key: 'ui', name: 'UI 元素' },
    { key: 'code', name: '代码效果' },
    { key: 'text', name: '文字效果' },
    { key: 'effect', name: '视觉特效' },
    { key: 'other', name: '其他' }
  ];
};

export const hasTemplate = (id: string): boolean => {
  return id in TEMPLATES;
};

export const getTemplateDefaultParams = (templateId: string): Record<string, any> => {
  const template = TEMPLATES[templateId];
  if (!template) return {};
  const defaults: Record<string, any> = {};
  template.schema.forEach(param => {
    defaults[param.key] = param.default;
  });
  return defaults;
};

export type { TemplateDefinition, TemplateParamSchema, TemplateRenderContext, TemplateCategory } from './types';

export {
  easing,
  adaptiveLayout,
  colorUtils,
  drawUtils,
  animationUtils,
  paramGuard,
  hash,
  TemplateBase
} from './templateUtils';

export {
  validateTemplateCode,
  importTemplateFromCode,
  registerTemplateFromCode,
  exportTemplateToCode,
  getTemplateCodeTemplate
} from './templateImporter';

export { TEMPLATES };

// 注册内置模板
registerTemplate(viralHookTemplate);
registerTemplate(kineticTitleTemplate);
registerTemplate(glitchTitleTemplate);
registerTemplate(neonScrambleTemplate);
registerTemplate(countUpFireTemplate);
registerTemplate(cyberSubtitleTemplate);

registerTemplate(glassCardTemplate);
registerTemplate(metalButtonTemplate);
registerTemplate(hologramFrameTemplate);
registerTemplate(carbonPanelTemplate);

registerTemplate(matrixRainTemplate);
registerTemplate(cyberTerminalTemplate);
registerTemplate(hologramGridTemplate);
registerTemplate(neonCityTemplate);
registerTemplate(dataVortexTemplate);
registerTemplate(particleTunnelTemplate);

registerTemplate(screenGlitchTemplate);
registerTemplate(shockwaveBurstTemplate);
registerTemplate(energyFieldTemplate);
registerTemplate(chromaticGlowTemplate);
registerTemplate(neonScanlinesTemplate);

registerTemplate(codeExecutionTemplate);
registerTemplate(terminalLogTemplate);
