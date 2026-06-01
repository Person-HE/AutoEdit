/**
 * AI 脚本校验器
 * 校验脚本格式、网格标识合法性，并自动修正错误
 */

import { getGridSystem as getGrid9x9System, GridId, CANVAS_CONFIG as CANVAS_PRESETS } from './GridSystem';
import {
  AIScript,
  Shot,
  TextElement,
  MaterialElement,
  ValidationError,
  ScriptValidationResult,
} from './AIScriptSchema';

export class AIScriptValidator {
  private gridSystem = getGrid9x9System();
  private errors: ValidationError[] = [];

  /**
   * 校验完整脚本
   */
  validate(script: AIScript): ScriptValidationResult {
    this.errors = [];

    // 深拷贝脚本用于修正
    const correctedScript: AIScript = JSON.parse(JSON.stringify(script));

    // 1. 校验画布配置
    this.validateCanvas(correctedScript);

    // 2. 校验分镜列表
    if (!correctedScript.shots || correctedScript.shots.length === 0) {
      this.errors.push({
        path: 'shots',
        message: '脚本必须包含至少一个分镜',
        severity: 'error',
      });
    } else {
      // 按 order 排序
      correctedScript.shots.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // 为没有 order 的分镜添加 order
      correctedScript.shots.forEach((shot, index) => {
        if (shot.order === undefined) {
          shot.order = index + 1;
          this.errors.push({
            path: `shots[${index}].order`,
            message: `分镜缺少 order 字段，已自动设置为 ${index + 1}`,
            severity: 'warning',
            autoCorrected: true,
          });
        }
      });

      // 校验每个分镜
      correctedScript.shots.forEach((shot, index) => {
        this.validateShot(shot, index, correctedScript);
      });
    }

    // 3. 校验时长总和
    this.validateDuration(correctedScript);

    return {
      valid: this.errors.filter(e => e.severity === 'error').length === 0,
      errors: this.errors,
      correctedScript: this.errors.some(e => e.autoCorrected) ? correctedScript : undefined,
    };
  }

  /**
   * 校验画布配置
   */
  private validateCanvas(script: AIScript): void {
    const validRatios = ['16:9', '9:16', '1:1'];

    if (!script.canvas) {
      script.canvas = { aspectRatio: '16:9' };
      this.errors.push({
        path: 'canvas',
        message: '缺少画布配置，使用默认 16:9',
        severity: 'warning',
        autoCorrected: true,
      });
      return;
    }

    if (!validRatios.includes(script.canvas.aspectRatio)) {
      this.errors.push({
        path: 'canvas.aspectRatio',
        message: `不支持的画布比例: ${script.canvas.aspectRatio}，已修正为 16:9`,
        severity: 'warning',
        autoCorrected: true,
        originalValue: script.canvas.aspectRatio,
        correctedValue: '16:9',
      });
      script.canvas.aspectRatio = '16:9';
    }

    // 更新网格系统
    this.gridSystem.setCanvasConfig(script.canvas.aspectRatio);
  }

  /**
   * 校验单个分镜
   */
  private validateShot(shot: Shot, index: number, script: AIScript): void {
    // 校验分镜ID
    if (!shot.shotId) {
      shot.shotId = `shot_${index + 1}`;
      this.errors.push({
        path: `shots[${index}].shotId`,
        message: '分镜ID缺失，已自动生成',
        severity: 'warning',
        autoCorrected: true,
      });
    }

    // 校验时长
    if (!shot.duration || shot.duration <= 0) {
      shot.duration = 3;
      this.errors.push({
        path: `shots[${index}].duration`,
        message: '分镜时长无效，已设置为3秒',
        severity: 'warning',
        autoCorrected: true,
      });
    }

    // 校验布局ID
    if (shot.layoutId) {
      const validation = this.gridSystem.validateGridId(shot.layoutId);
      if (!validation.valid && validation.corrected) {
        this.errors.push({
          path: `shots[${index}].layoutId`,
          message: validation.error || 'Invalid grid ID',
          severity: 'warning',
          autoCorrected: true,
          originalValue: shot.layoutId,
          correctedValue: validation.corrected,
        });
        shot.layoutId = validation.corrected;
      }
    }

    // 校验文本元素
    shot.texts?.forEach((text, textIndex) => {
      this.validateTextElement(text, `shots[${index}].texts[${textIndex}]`);
    });

    // 校验素材元素
    shot.materials?.forEach((material, matIndex) => {
      this.validateMaterialElement(material, `shots[${index}].materials[${matIndex}]`);
    });
  }

  /**
   * 校验文本元素
   */
  private validateTextElement(text: TextElement, path: string): void {
    // 校验ID
    if (!text.id) {
      text.id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 校验内容
    if (!text.content || text.content.trim() === '') {
      this.errors.push({
        path: `${path}.content`,
        message: '文本内容不能为空',
        severity: 'error',
      });
    }

    // 校验布局ID
    if (text.layoutId) {
      const validation = this.gridSystem.validateGridId(text.layoutId);
      if (!validation.valid && validation.corrected) {
        this.errors.push({
          path: `${path}.layoutId`,
          message: validation.error || 'Invalid grid ID',
          severity: 'warning',
          autoCorrected: true,
          originalValue: text.layoutId,
          correctedValue: validation.corrected,
        });
        text.layoutId = validation.corrected;
      }
    } else {
      text.layoutId = 'grid_5_5';
      this.errors.push({
        path: `${path}.layoutId`,
        message: '文本布局ID缺失，已设置为居中',
        severity: 'warning',
        autoCorrected: true,
      });
    }

    // 校验动画预设ID
    if (text.animation?.entrance?.presetId) {
      // 这里可以添加预设ID校验逻辑
    }
  }

  /**
   * 校验素材元素
   */
  private validateMaterialElement(material: MaterialElement, path: string): void {
    // 校验ID
    if (!material.id) {
      material.id = `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 校验布局ID
    if (material.layoutId) {
      const validation = this.gridSystem.validateGridId(material.layoutId);
      if (!validation.valid && validation.corrected) {
        this.errors.push({
          path: `${path}.layoutId`,
          message: validation.error || 'Invalid grid ID',
          severity: 'warning',
          autoCorrected: true,
          originalValue: material.layoutId,
          correctedValue: validation.corrected,
        });
        material.layoutId = validation.corrected;
      }
    } else {
      material.layoutId = 'grid_5_5';
      this.errors.push({
        path: `${path}.layoutId`,
        message: '素材布局ID缺失，已设置为居中',
        severity: 'warning',
        autoCorrected: true,
      });
    }

    // 校验 ComfyUI 生成参数
    if (material.source === 'comfyui') {
      if (!material.generatePrompt) {
        this.errors.push({
          path: `${path}.generatePrompt`,
          message: 'ComfyUI 生成素材缺少提示词',
          severity: 'warning',
        });
      }
    }
  }

  /**
   * 校验时长总和
   */
  private validateDuration(script: AIScript): void {
    const totalDuration = script.shots.reduce((sum, shot) => sum + (shot.duration || 0), 0);
    
    if (totalDuration <= 0) {
      this.errors.push({
        path: 'shots',
        message: '总时长无效',
        severity: 'error',
      });
    }
  }

  /**
   * 生成校验报告
   */
  generateReport(result: ScriptValidationResult): string {
    if (result.valid && result.errors.length === 0) {
      return '✅ 脚本校验通过';
    }

    const lines: string[] = [];

    const errors = result.errors.filter(e => e.severity === 'error');
    const warnings = result.errors.filter(e => e.severity === 'warning');

    if (errors.length > 0) {
      lines.push(`❌ 发现 ${errors.length} 个错误：`);
      errors.forEach(e => lines.push(`  [${e.path}] ${e.message}`));
    }

    if (warnings.length > 0) {
      lines.push(`\n⚠️ 发现 ${warnings.length} 个警告（已自动修正）：`);
      warnings.forEach(e => {
        const autoFix = e.autoCorrected ? ' [已自动修正]' : '';
        lines.push(`  [${e.path}] ${e.message}${autoFix}`);
      });
    }

    return lines.join('\n');
  }
}

// 单例实例
let validatorInstance: AIScriptValidator | null = null;

export function getAIScriptValidator(): AIScriptValidator {
  if (!validatorInstance) {
    validatorInstance = new AIScriptValidator();
  }
  return validatorInstance;
}
