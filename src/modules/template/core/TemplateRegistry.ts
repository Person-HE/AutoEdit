import type { AnyTemplate, TemplateCategory } from './TemplateEngine';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail?: string;
  schema: Array<{
    key: string;
    label: string;
    type: string;
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: any }[];
    placeholder?: string;
  }>;
}

class TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();

  register(definition: TemplateDefinition): void {
    if (!definition.id || !definition.name) {
      throw new Error('Invalid template definition: must have id and name');
    }
    this.templates.set(definition.id, definition);
  }

  unregister(id: string): void {
    this.templates.delete(id);
  }

  get(id: string): TemplateDefinition | undefined {
    return this.templates.get(id);
  }

  getByCategory(category: TemplateCategory): TemplateDefinition[] {
    return this.getAll().filter(t => t.category === category);
  }

  getAll(): TemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  search(query: string): TemplateDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.id.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  clear(): void {
    this.templates.clear();
  }

  getCategories(): TemplateCategory[] {
    const categories = new Set<TemplateCategory>();
    this.getAll().forEach(t => categories.add(t.category));
    return Array.from(categories);
  }

  getDefaultParams(templateId: string): Record<string, any> {
    const template = this.get(templateId);
    if (!template) return {};

    const defaults: Record<string, any> = {};
    template.schema.forEach(param => {
      defaults[param.key] = param.default;
    });
    return defaults;
  }

  getCount(): number {
    return this.templates.size;
  }

  getCountByCategory(category: TemplateCategory): number {
    return this.getByCategory(category).length;
  }
}

const templateRegistryInstance = new TemplateRegistry();

export default templateRegistryInstance;
export { templateRegistryInstance as templateRegistry, TemplateRegistry };
