import { toolSystem } from '../core/ToolSystem';

// 分析类工具
import { analyzeTool } from './AnalyzeTool';
import { observeProjectTool } from './ObserveProjectTool';
import { listResourcesTool } from './ListResourcesTool';

// 生成类工具
import { promptGeneratorTool } from './PromptGeneratorTool';
import { shotGeneratorTool } from './ShotGeneratorTool';
import { textProcessorTool } from './TextProcessorTool';
import { generateAssetTool } from './GenerateAssetTool';
import { contentDesignTool } from './ContentDesignTool';
import { viralChecklistTool } from './ViralChecklistTool';

// 添加类工具
import { addClipTool } from './AddClipTool';
import { addAssetTool } from './AddAssetTool';
import { useAssetTool } from './UseAssetTool';
import { useTemplateTool } from './UseTemplateTool';
import { batchAddTool } from './BatchAddTool';

// 效果类工具
import { applyEffectTool } from './ApplyEffectTool';
import { createPresetTool } from './CreatePresetTool';
import { removeEffectTool } from './RemoveEffectTool';

// 管理类工具
import { manageTrackTool } from './ManageTrackTool';
import { trackVisibilityTool } from './TrackVisibilityTool';
import { updateClipTool } from './UpdateClipTool';
import { removeClipTool } from './RemoveClipTool';
import { moveClipTool } from './MoveClipTool';
import { duplicateClipTool } from './DuplicateClipTool';
import { projectSettingsTool } from './ProjectSettingsTool';
import { exportVideoTool } from './ExportVideoTool';

// 注册所有工具到工具系统
toolSystem.register(analyzeTool);
toolSystem.register(observeProjectTool);
toolSystem.register(listResourcesTool);

toolSystem.register(promptGeneratorTool);
toolSystem.register(shotGeneratorTool);
toolSystem.register(textProcessorTool);
toolSystem.register(generateAssetTool);
toolSystem.register(contentDesignTool);
toolSystem.register(viralChecklistTool);

toolSystem.register(addClipTool);
toolSystem.register(addAssetTool);
toolSystem.register(useAssetTool);
toolSystem.register(useTemplateTool);
toolSystem.register(batchAddTool);

toolSystem.register(applyEffectTool);
toolSystem.register(createPresetTool);
toolSystem.register(removeEffectTool);

toolSystem.register(manageTrackTool);
toolSystem.register(trackVisibilityTool);
toolSystem.register(updateClipTool);
toolSystem.register(removeClipTool);
toolSystem.register(moveClipTool);
toolSystem.register(duplicateClipTool);
toolSystem.register(projectSettingsTool);
toolSystem.register(exportVideoTool);

export { toolSystem };

// 导出所有工具（供测试和外部使用）
export {
  analyzeTool,
  observeProjectTool,
  listResourcesTool,
  promptGeneratorTool,
  shotGeneratorTool,
  textProcessorTool,
  generateAssetTool,
  contentDesignTool,
  viralChecklistTool,
  addClipTool,
  addAssetTool,
  useAssetTool,
  useTemplateTool,
  batchAddTool,
  applyEffectTool,
  createPresetTool,
  removeEffectTool,
  manageTrackTool,
  trackVisibilityTool,
  updateClipTool,
  removeClipTool,
  moveClipTool,
  duplicateClipTool,
  projectSettingsTool,
  exportVideoTool,
};
