import { AgentTool, ToolResult, AgentContext } from './AgentTypes';

class ToolSystem {
  private tools: Map<string, AgentTool> = new Map();

  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAll(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  getToolDescriptions(): string {
    const descriptions: string[] = [];
    for (const tool of this.tools.values()) {
      const paramsStr = tool.parameters
        .map(p => `    - ${p.name}${p.required ? ' (必需)' : ''}: ${p.type} — ${p.description}${p.enum ? ` [枚举: ${p.enum.join('|')}]` : ''}`)
        .join('\n');
      descriptions.push(`${tool.name}: ${tool.description}\n  参数:\n${paramsStr}`);
    }
    return descriptions.join('\n\n');
  }

  async execute(
    name: string,
    params: Record<string, any>,
    context: AgentContext
  ): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) {
      return { success: false, error: `工具不存在: ${name}` };
    }
    for (const param of tool.parameters) {
      if (param.required && params[param.name] === undefined && params[param.name] === null) {
        return { success: false, error: `缺少必需参数: ${param.name} (${param.description})` };
      }
      if (param.enum && params[param.name] !== undefined && !param.enum.includes(params[param.name])) {
        return {
          success: false,
          error: `参数 ${param.name} 的值 "${params[param.name]}" 无效，必须是: ${param.enum.join(', ')}`,
        };
      }
    }
    try {
      return await tool.execute(params, context);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error(`[ToolSystem] 工具 "${name}" 执行失败:`, e);
      return { success: false, error: errMsg };
    }
  }

  validateParams(name: string, params: Record<string, any>): { valid: boolean; errors: string[] } {
    const tool = this.get(name);
    if (!tool) return { valid: false, errors: [`工具不存在: ${name}`] };
    const errors: string[] = [];
    for (const param of tool.parameters) {
      if (param.required && params[param.name] === undefined) {
        errors.push(`缺少必需参数: ${param.name}`);
      }
      if (param.enum && params[param.name] !== undefined && !param.enum.includes(params[param.name])) {
        errors.push(`参数 ${param.name} 值无效`);
      }
    }
    return { valid: errors.length === 0, errors };
  }
}

export const toolSystem = new ToolSystem();
export { ToolSystem };
