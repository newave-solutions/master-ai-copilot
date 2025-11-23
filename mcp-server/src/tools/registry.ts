import { ToolHandler } from '../types';

export class ToolRegistry {
  private tools: Record<string, ToolHandler> = {};

  register(name: string, handler: ToolHandler) {
    if (this.tools[name]) {
      console.warn(`Tool '${name}' is already registered. Overwriting.`);
    }
    this.tools[name] = handler;
  }

  get(name: string): ToolHandler | undefined {
    return this.tools[name];
  }

  getAll(): string[] {
    return Object.keys(this.tools);
  }
}

export const toolRegistry = new ToolRegistry();
