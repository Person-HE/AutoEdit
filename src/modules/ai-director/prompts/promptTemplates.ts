import { PRESETS } from '../../../engine/presets';
import { getAllTemplates, getTemplateCategories, getTemplatesByCategory } from '../../../engine/templates';
import { SYSTEM_PROMPTS, ENTRANCE_PRESETS_LIST, EXIT_PRESETS_LIST, LAYOUT_SYSTEM } from './systemPrompts';

export function getAvailablePresetsText(): string {
  const allPresets = Object.values(PRESETS);
  const categories = [...new Set(allPresets.map(p => p.category))];

  const sections: string[] = [];

  for (const category of categories) {
    const categoryPresets = allPresets.filter(p => p.category === category);
    if (categoryPresets.length === 0) continue;

    const ids = categoryPresets.map(p => p.id).join(', ');
    sections.push(`- ${category}: ${ids}`);
  }

  if (sections.length === 0) {
    return `可用的预设ID列表（entrance类别）:\n${ENTRANCE_PRESETS_LIST}\n\n可用的预设ID列表（exit类别）:\n${EXIT_PRESETS_LIST}`;
  }

  return `可用的预设ID（共 ${allPresets.length} 个）:\n${sections.join('\n')}`;
}

export function getAvailableLayoutsText(): string {
  return `可用的布局ID:\n${LAYOUT_SYSTEM}`;
}

export function getAvailableTemplatesText(): string {
  const allTemplates = getAllTemplates();
  const categories = getTemplateCategories();

  const sections: string[] = [];

  for (const category of categories) {
    const categoryTemplates = getTemplatesByCategory(category.key);
    if (categoryTemplates.length === 0) continue;

    const items = categoryTemplates
      .map(t => `${t.id}${t.description ? ` (${t.description})` : ''}`)
      .join(', ');
    sections.push(`- ${category.key}: ${items}`);
  }

  if (sections.length === 0) {
    return '暂无可用模板。';
  }

  return `可用的模板ID（共 ${allTemplates.length} 个）:\n${sections.join('\n')}`;
}

export function buildShotDataPrompt(customContext?: string): string {
  let prompt: string = SYSTEM_PROMPTS.GENERATE_SHOT_DATA;

  const presetsSection = `可用的预设ID列表（entrance类别）:\n${ENTRANCE_PRESETS_LIST}\n\n可用的预设ID列表（exit类别）:\n${EXIT_PRESETS_LIST}`;
  const layoutsSection = `可用的布局ID:\n${LAYOUT_SYSTEM}`;

  prompt = prompt.replace('{{PRESETS_SECTION}}', presetsSection);
  prompt = prompt.replace('{{LAYOUTS_SECTION}}', layoutsSection);

  if (customContext) {
    prompt += `\n\n附加上下文：\n${customContext}`;
  }

  return prompt;
}
