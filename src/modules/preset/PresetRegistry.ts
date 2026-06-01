import type { AnimationEffect, PresetCategory, PresetRegistryItem } from './PresetTypes';

class PresetRegistry {
  private static instance: PresetRegistry;
  private presets: Map<string, AnimationEffect> = new Map();
  private categories: Map<PresetCategory, string[]> = new Map();

  private constructor() {}

  static getInstance(): PresetRegistry {
    if (!PresetRegistry.instance) {
      PresetRegistry.instance = new PresetRegistry();
    }
    return PresetRegistry.instance;
  }

  register(preset: AnimationEffect): void {
    if (!preset.id || !preset.apply) {
      throw new Error(`Invalid preset: must have id and apply function. Got: ${JSON.stringify({ id: preset.id, hasApply: !!preset.apply })}`);
    }

    this.presets.set(preset.id, preset);

    const categoryPresets = this.categories.get(preset.category) || [];
    if (!categoryPresets.includes(preset.id)) {
      categoryPresets.push(preset.id);
      this.categories.set(preset.category, categoryPresets);
    }
  }

  unregister(id: string): void {
    const preset = this.presets.get(id);
    if (preset) {
      const categoryPresets = this.categories.get(preset.category) || [];
      const filtered = categoryPresets.filter(presetId => presetId !== id);
      this.categories.set(preset.category, filtered);
      this.presets.delete(id);
    }
  }

  get(id: string): AnimationEffect | undefined {
    return this.presets.get(id);
  }

  getByCategory(category: PresetCategory): AnimationEffect[] {
    const ids = this.categories.get(category) || [];
    return ids.map(id => this.presets.get(id)).filter(Boolean) as AnimationEffect[];
  }

  getAll(): AnimationEffect[] {
    return Array.from(this.presets.values());
  }

  findByName(name: string): AnimationEffect | undefined {
    return Array.from(this.presets.values()).find(
      preset => preset.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  getCategories(): PresetCategory[] {
    return Array.from(this.categories.keys());
  }

  get count(): number {
    return this.presets.size;
  }

  has(id: string): boolean {
    return this.presets.has(id);
  }

  clear(): void {
    this.presets.clear();
    this.categories.clear();
  }

  getRegistryItems(): PresetRegistryItem[] {
    return Array.from(this.presets.values()).map(preset => ({
      preset,
      renderFn: (params: Record<string, any>, progress: number) => {
        const result = preset.apply(progress, params, { x: 0, y: 0, scale: 1, rotation: 0 });
        return {
          transform: {
            x: result.transform.x,
            y: result.transform.y,
            scale: result.transform.scale,
            rotation: result.transform.rotation
          },
          opacity: result.opacity
        };
      }
    }));
  }
}

const presetRegistryInstance = PresetRegistry.getInstance();
export default presetRegistryInstance;
export { presetRegistryInstance as presetRegistry, PresetRegistry };
