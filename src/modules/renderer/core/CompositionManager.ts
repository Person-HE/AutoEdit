import type { ComponentType } from 'react';

export interface Composition {
  id: string;
  component: ComponentType;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

class CompositionManagerClass {
  private compositions: Map<string, Composition> = new Map();

  registerComposition(comp: Composition): void {
    if (this.compositions.has(comp.id)) {
      console.warn(`Composition with id "${comp.id}" already exists. Overwriting.`);
    }
    this.compositions.set(comp.id, { ...comp });
  }

  getComposition(id: string): Composition | undefined {
    return this.compositions.get(id);
  }

  listCompositions(): Composition[] {
    return Array.from(this.compositions.values());
  }

  hasComposition(id: string): boolean {
    return this.compositions.has(id);
  }

  unregisterComposition(id: string): boolean {
    return this.compositions.delete(id);
  }

  clear(): void {
    this.compositions.clear();
  }

  get count(): number {
    return this.compositions.size;
  }
}

export const CompositionManager = new CompositionManagerClass();

export { CompositionManagerClass };
export default CompositionManager;
