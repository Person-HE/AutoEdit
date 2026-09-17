// Mock AIService for test environment — bypasses import.meta.env issue
export const AIService = class {
  constructor() {}
  async call() { return { success: true, data: { content: 'mocked' } }; }
  getProviders() { return []; }
  setProvider() {}
};

export const aiService = new AIService();
