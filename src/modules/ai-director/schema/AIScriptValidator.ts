// AI 脚本验证器
import type { AIScriptSchema, AIScene, AIElement } from './AIScriptSchema';
import { SCHEMA_VALIDATION_RULES } from './AIScriptSchema';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

class AIScriptValidator {
  validate(schema: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!schema || typeof schema !== 'object') {
      return {
        valid: false,
        errors: [{ field: 'root', message: 'Invalid schema: must be an object', code: 'INVALID_ROOT' }],
        warnings: [],
      };
    }

    const script = schema as AIScriptSchema;

    this.validateTopLevel(script, errors, warnings);
    this.validateMeta(script.meta, errors, warnings);
    this.validateScenes(script.scenes, errors, warnings);
    this.validateGlobalSettings(script.globalSettings, errors, warnings);
    this.validateAssets(script.assets, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateTopLevel(script: AIScriptSchema, errors: ValidationError[], warnings: ValidationWarning[]): void {
    for (const field of SCHEMA_VALIDATION_RULES.requiredFields) {
      if (!(field in script)) {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
          code: 'MISSING_FIELD',
        });
      }
    }

    if (script.version && !/^\d+\.\d+$/.test(script.version)) {
      warnings.push({
        field: 'version',
        message: 'Version should follow semantic versioning (e.g., "1.0")',
        code: 'INVALID_VERSION_FORMAT',
      });
    }
  }

  private validateMeta(meta: AIScriptSchema['meta'], errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!meta) {
      errors.push({ field: 'meta', message: 'Meta information is required', code: 'MISSING_META' });
      return;
    }

    if (!meta.title) {
      errors.push({ field: 'meta.title', message: 'Title is required', code: 'MISSING_TITLE' });
    }

    if (!meta.createdAt || meta.createdAt <= 0) {
      warnings.push({ field: 'meta.createdAt', message: 'Invalid or missing creation date', code: 'INVALID_DATE' });
    }
  }

  private validateScenes(scenes: AIScene[], errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!Array.isArray(scenes)) {
      errors.push({ field: 'scenes', message: 'Scenes must be an array', code: 'INVALID_SCENES_TYPE' });
      return;
    }

    if (scenes.length === 0) {
      warnings.push({ field: 'scenes', message: 'No scenes defined', code: 'EMPTY_SCENES' });
      return;
    }

    scenes.forEach((scene, index) => {
      const prefix = `scenes[${index}]`;

      for (const field of SCHEMA_VALIDATION_RULES.sceneRequiredFields) {
        if (!(field in scene)) {
          errors.push({ field: `${prefix}.${field}`, message: `Missing required field: ${field}`, code: 'MISSING_FIELD' });
        }
      }

      if (scene.duration !== undefined && scene.duration <= 0) {
        errors.push({ field: `${prefix}.duration`, message: 'Duration must be positive', code: 'INVALID_DURATION' });
      }

      if (scene.elements) {
        this.validateElements(scene.elements, index, errors, warnings);
      }
    });

    // 检查场景顺序
    const orders = scenes.map(s => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        warnings.push({ field: 'scenes', message: 'Scene orders may not be sequential starting from 1', code: 'NON_SEQUENTIAL_ORDER' });
        break;
      }
    }
  }

  private validateElements(elements: AIElement[], sceneIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    elements.forEach((element, elemIndex) => {
      const prefix = `scenes[${sceneIndex}].elements[${elemIndex}]`;

      for (const field of SCHEMA_VALIDATION_RULES.elementRequiredFields) {
        if (!(field in element)) {
          errors.push({ field: `${prefix}.${field}`, message: `Missing required field: ${field}`, code: 'MISSING_FIELD' });
        }
      }

      const validTypes = ['text', 'image', 'video', 'shape', 'effect'];
      if (element.type && !validTypes.includes(element.type)) {
        errors.push({ field: `${prefix}.type`, message: `Invalid element type: ${element.type}`, code: 'INVALID_ELEMENT_TYPE' });
      }

      if (element.timing) {
        if (element.timing.duration !== undefined && element.timing.duration < 0) {
          errors.push({ field: `${prefix}.timing.duration`, message: 'Element duration cannot be negative', code: 'NEGATIVE_DURATION' });
        }
      }
    });
  }

  private validateGlobalSettings(settings: AIScriptSchema['globalSettings'], errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!settings) {
      errors.push({ field: 'globalSettings', message: 'Global settings are required', code: 'MISSING_GLOBAL_SETTINGS' });
      return;
    }

    if (settings.fps && (settings.fps < 1 || settings.fps > 120)) {
      warnings.push({ field: 'globalSettings.fps', message: 'FPS value is unusual', code: 'UNUSUAL_FPS' });
    }

    if (settings.resolution) {
      if (settings.resolution.width <= 0 || settings.resolution.height <= 0) {
        errors.push({ field: 'globalSettings.resolution', message: 'Resolution dimensions must be positive', code: 'INVALID_RESOLUTION' });
      }
    }
  }

  private validateAssets(assets: AIScriptSchema['assets'], errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!assets || assets.length === 0) return;

    const validTypes = ['image', 'video', 'audio'];
    assets.forEach((asset, index) => {
      const prefix = `assets[${index}]`;

      if (!validTypes.includes(asset.type)) {
        errors.push({ field: `${prefix}.type`, message: `Invalid asset type: ${asset.type}`, code: 'INVALID_ASSET_TYPE' });
      }

      if (!asset.source) {
        errors.push({ field: `${prefix}.source`, message: 'Asset source is required', code: 'MISSING_ASSET_SOURCE' });
      }
    });
  }
}

const aiscriptValidatorInstance = new AIScriptValidator();
export default aiscriptValidatorInstance;
export { aiscriptValidatorInstance as aiscriptValidator, AIScriptValidator };
