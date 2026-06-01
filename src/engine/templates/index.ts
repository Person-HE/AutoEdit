import { TemplateDefinition, TemplateCategory } from './types';
import { keyboardFloatTemplate } from './keyboardFloat';
import { codeExecutionTemplate } from './codeExecution';

// Text 文字效果模板
import { splitTextTemplate } from './splitText';
import { blurTextTemplate } from './blurText';
import { circularTextTemplate } from './circularText';
import { typewriterTemplate } from './typewriter';
import { shinyTextTemplate } from './shinyText';
import { gradientTextTemplate } from './gradientText';
import { fallingTextTemplate } from './fallingText';
import { decryptedTextTemplate } from './decryptedText';
import { glitchTextTemplate } from './glitchText';
import { scrollRevealTemplate } from './scrollReveal';
import { countUpTemplate } from './countUp';
import { textPressureTemplate } from './textPressure';
import { gradualBlurTemplate } from './gradualBlur';
import { asciiTextTemplate } from './asciiText';
import { scrambledTextTemplate } from './scrambledText';

// UI 组件模板
import { elasticButtonTemplate } from './elasticButton';
import { cardFlipTemplate } from './cardFlip';
import { card3DTemplate } from './card3D';
import { spotlightCardTemplate } from './spotlightCard';
import { borderGlowTemplate } from './borderGlow';
import { magnetButtonTemplate } from './magnetButton';
import { glassCardTemplate } from './glassCard';
import { cardStackTemplate } from './cardStack';
import { accordionTemplate } from './accordion';
import { tabsTemplate } from './tabs';

// Background 背景效果模板
import { liquidEtherTemplate } from './liquidEther';
import { auroraTemplate } from './aurora';
import { wavesTemplate } from './waves';
import { silkTemplate } from './silk';
import { particlesTemplate } from './particles';
import { gridDistortionTemplate } from './gridDistortion';
import { lightRaysTemplate } from './lightRays';
import { beamsTemplate } from './beams';
import { galaxyTemplate } from './galaxy';
import { noiseTextureTemplate } from './noiseTexture';

// Effect 视觉特效模板
import { particleExplosionTemplate } from './particleExplosion';
import { haloExpandTemplate } from './haloExpand';
import { energyRingTemplate } from './energyRing';
import { shockwaveTemplate } from './shockwave';
import { magicCircleTemplate } from './magicCircle';
import { dataStreamTemplate } from './dataStream';
import { codeRainTemplate } from './codeRain';
import { matrixTemplate } from './matrix';
import { fireTemplate } from './fire';
import { smokeTemplate } from './smoke';

// Transition 转场效果模板
import { fadeTransitionTemplate } from './fadeTransition';
import { slideTransitionTemplate } from './slideTransition';
import { zoomTransitionTemplate } from './zoomTransition';
import { rotateTransitionTemplate } from './rotateTransition';
import { blurTransitionTemplate } from './blurTransition';

// 导出所有模板
export {
  keyboardFloatTemplate,
  codeExecutionTemplate,
  splitTextTemplate,
  blurTextTemplate,
  circularTextTemplate,
  typewriterTemplate,
  shinyTextTemplate,
  gradientTextTemplate,
  fallingTextTemplate,
  decryptedTextTemplate,
  glitchTextTemplate,
  scrollRevealTemplate,
  countUpTemplate,
  textPressureTemplate,
  gradualBlurTemplate,
  asciiTextTemplate,
  scrambledTextTemplate,
  elasticButtonTemplate,
  cardFlipTemplate,
  card3DTemplate,
  spotlightCardTemplate,
  borderGlowTemplate,
  magnetButtonTemplate,
  glassCardTemplate,
  cardStackTemplate,
  accordionTemplate,
  tabsTemplate,
  liquidEtherTemplate,
  auroraTemplate,
  wavesTemplate,
  silkTemplate,
  particlesTemplate,
  gridDistortionTemplate,
  lightRaysTemplate,
  beamsTemplate,
  galaxyTemplate,
  noiseTextureTemplate,
  particleExplosionTemplate,
  haloExpandTemplate,
  energyRingTemplate,
  shockwaveTemplate,
  magicCircleTemplate,
  dataStreamTemplate,
  codeRainTemplate,
  matrixTemplate,
  fireTemplate,
  smokeTemplate,
  fadeTransitionTemplate,
  slideTransitionTemplate,
  zoomTransitionTemplate,
  rotateTransitionTemplate,
  blurTransitionTemplate,
};

// 模板注册表
const TEMPLATES: Record<string, TemplateDefinition> = {};

// 注册模板
export const registerTemplate = (template: TemplateDefinition): void => {
  if (!template.id || !template.name || typeof template.render !== 'function') {
    throw new Error('Invalid template format: must have id, name, and render function');
  }

  TEMPLATES[template.id] = template;
  console.log(`✅ Template registered: ${template.name} (${template.id})`);
};

// 获取模板
export const getTemplate = (id: string): TemplateDefinition | undefined => {
  return TEMPLATES[id];
};

// 获取所有模板
export const getAllTemplates = (): TemplateDefinition[] => {
  return Object.values(TEMPLATES);
};

// 按分类获取模板
export const getTemplatesByCategory = (category: TemplateCategory): TemplateDefinition[] => {
  return Object.values(TEMPLATES).filter(t => t.category === category);
};

// 获取模板分类列表
export const getTemplateCategories = (): { key: TemplateCategory; name: string }[] => {
  return [
    { key: 'ui', name: 'UI 元素' },
    { key: 'code', name: '代码效果' },
    { key: 'text', name: '文字效果' },
    { key: 'effect', name: '视觉特效' },
    { key: 'transition', name: '转场效果' },
    { key: 'other', name: '其他' }
  ];
};

// 检查模板是否存在
export const hasTemplate = (id: string): boolean => {
  return id in TEMPLATES;
};

// 获取模板的默认参数
export const getTemplateDefaultParams = (templateId: string): Record<string, any> => {
  const template = TEMPLATES[templateId];
  if (!template) return {};

  const defaults: Record<string, any> = {};
  template.schema.forEach(param => {
    defaults[param.key] = param.default;
  });

  return defaults;
};

// 导出类型
export type { TemplateDefinition, TemplateParamSchema, TemplateRenderContext, TemplateCategory } from './types';

// 导出模板工具
export {
  easing,
  adaptiveLayout,
  colorUtils,
  drawUtils,
  animationUtils,
  paramGuard,
  TemplateBase
} from './templateUtils';

// 导出模板导入器
export {
  validateTemplateCode,
  importTemplateFromCode,
  registerTemplateFromCode,
  exportTemplateToCode,
  getTemplateCodeTemplate
} from './templateImporter';

// 导出模板注册表（只读）
export { TEMPLATES };

// 注册内置模板（在导出后执行，避免循环依赖）

// 基础模板
registerTemplate(keyboardFloatTemplate);
registerTemplate(codeExecutionTemplate);

// Text 文字效果模板 (15个)
registerTemplate(splitTextTemplate);
registerTemplate(blurTextTemplate);
registerTemplate(circularTextTemplate);
registerTemplate(typewriterTemplate);
registerTemplate(shinyTextTemplate);
registerTemplate(gradientTextTemplate);
registerTemplate(fallingTextTemplate);
registerTemplate(decryptedTextTemplate);
registerTemplate(glitchTextTemplate);
registerTemplate(scrollRevealTemplate);
registerTemplate(countUpTemplate);
registerTemplate(textPressureTemplate);
registerTemplate(gradualBlurTemplate);
registerTemplate(asciiTextTemplate);
registerTemplate(scrambledTextTemplate);

// UI 组件模板 (10个)
registerTemplate(elasticButtonTemplate);
registerTemplate(cardFlipTemplate);
registerTemplate(card3DTemplate);
registerTemplate(spotlightCardTemplate);
registerTemplate(borderGlowTemplate);
registerTemplate(magnetButtonTemplate);
registerTemplate(glassCardTemplate);
registerTemplate(cardStackTemplate);
registerTemplate(accordionTemplate);
registerTemplate(tabsTemplate);

// Background 背景效果模板 (10个)
registerTemplate(liquidEtherTemplate);
registerTemplate(auroraTemplate);
registerTemplate(wavesTemplate);
registerTemplate(silkTemplate);
registerTemplate(particlesTemplate);
registerTemplate(gridDistortionTemplate);
registerTemplate(lightRaysTemplate);
registerTemplate(beamsTemplate);
registerTemplate(galaxyTemplate);
registerTemplate(noiseTextureTemplate);

// Effect 视觉特效模板 (10个)
registerTemplate(particleExplosionTemplate);
registerTemplate(haloExpandTemplate);
registerTemplate(energyRingTemplate);
registerTemplate(shockwaveTemplate);
registerTemplate(magicCircleTemplate);
registerTemplate(dataStreamTemplate);
registerTemplate(codeRainTemplate);
registerTemplate(matrixTemplate);
registerTemplate(fireTemplate);
registerTemplate(smokeTemplate);

// Transition 转场效果模板 (5个)
registerTemplate(fadeTransitionTemplate);
registerTemplate(slideTransitionTemplate);
registerTemplate(zoomTransitionTemplate);
registerTemplate(rotateTransitionTemplate);
registerTemplate(blurTransitionTemplate);
