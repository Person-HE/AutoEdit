import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { aiService, AIProviderConfig } from '../../modules/ai-director/services/AIService';

interface Props {
  onClose?: () => void;
}

const STORAGE_KEY = 'nanoedit_ai_config';

export const AIConfigPanel: React.FC<Props> = ({ onClose }) => {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [defaultId, setDefaultId] = useState<string>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 从 AIService 读取当前配置
    setProviders(aiService.providers.map((p) => ({ ...p })));
    setDefaultId(aiService.currentProvider?.id || '');
  }, []);

  const save = () => {
    const cfg = {
      providers: providers.map((p) => ({ ...p })),
      defaultProviderId: defaultId || providers[0]?.id,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      // 重新初始化服务以读取新配置
      location.reload();
    } catch (e) {
      console.error('[AIConfigPanel] save failed:', e);
    }
  };

  const updateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setSaved(false);
  };

  const addProvider = () => {
    const newId = `custom_${Date.now()}`;
    setProviders((prev) => [
      ...prev,
      {
        id: newId,
        name: '自定义 OpenAI 兼容 API',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
      },
    ]);
    if (!defaultId) setDefaultId(newId);
    setSaved(false);
  };

  const removeProvider = (id: string) => {
    if (providers.length <= 1) return;
    setProviders((prev) => prev.filter((p) => p.id !== id));
    if (defaultId === id) {
      setDefaultId(providers.find((p) => p.id !== id)?.id || '');
    }
    setSaved(false);
  };

  return (
    <div className="p-5 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white">AI 模型配置</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            配置 OpenAI 兼容 API，用于驱动 AI 导演工作流
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {providers.length === 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-[11px] text-yellow-300">
          尚未配置任何 AI 提供商，请点击下方按钮添加。
        </div>
      )}

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {providers.map((p, idx) => (
          <div
            key={p.id}
            className={clsx(
              'p-3 rounded-xl border bg-[#13131f]',
              defaultId === p.id
                ? 'border-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'border-white/5'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="defaultProvider"
                  checked={defaultId === p.id}
                  onChange={() => setDefaultId(p.id)}
                  className="accent-purple-500"
                />
                <span className="text-xs text-white font-medium">提供商 #{idx + 1}</span>
                {defaultId === p.id && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                    默认
                  </span>
                )}
              </div>
              {providers.length > 1 && (
                <button
                  onClick={() => removeProvider(p.id)}
                  className="text-[10px] text-red-400 hover:text-red-300"
                >
                  删除
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Input
                label="名称"
                value={p.name}
                onChange={(v) => updateProvider(p.id, { name: v })}
              />
              <Input
                label="API Endpoint"
                value={p.endpoint}
                onChange={(v) => updateProvider(p.id, { endpoint: v })}
                placeholder="https://..."
              />
              <Input
                label="API Key"
                type="password"
                value={p.apiKey}
                onChange={(v) => updateProvider(p.id, { apiKey: v })}
                placeholder="sk-..."
              />
              <Input
                label="模型名称"
                value={p.model}
                onChange={(v) => updateProvider(p.id, { model: v })}
                placeholder="gpt-4o-mini / meta/llama-3.3-70b-instruct"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addProvider}
        className="w-full py-2 text-xs text-purple-300 border border-dashed border-purple-500/30 rounded-lg hover:bg-purple-500/5 transition-colors"
      >
        + 添加自定义 OpenAI 兼容 API
      </button>

      <div className="text-[10px] text-gray-500 space-y-1">
        <p>• Endpoint 可填 base URL（如 https://api.example.com/v1）或完整地址（.../v1/chat/completions）</p>
        <p>• 默认使用 NVIDIA NIM，端点：/api/nvidia/v1/chat/completions</p>
        <p>• 支持任何 OpenAI 兼容 API（Gemini、火山、硅基流动、agnes-ai 等）</p>
        <p>• API Key 仅存储在浏览器本地，不会上传到服务器</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-medium rounded-lg transition-all"
        >
          保存并刷新
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors"
          >
            取消
          </button>
        )}
      </div>

      {saved && (
        <div className="text-center text-[10px] text-green-400">✓ 已保存，页面即将刷新</div>
      )}
    </div>
  );
};

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 outline-none"
    />
  </div>
);

export default AIConfigPanel;
