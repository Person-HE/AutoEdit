/**
 * AI Agent 导演面板 - 全方位智能体模式
 * 通过 ReAct 智能体自动分析需求、调用项目工具、在轨道面板上创建完整内容
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { aiAgent } from '../../modules/ai-director';
import type { AgentResult } from '../../modules/ai-director';
import { runQuickTest } from '../../test/aiAgentTest';
import clsx from 'clsx';

type PanelMode = 'idle' | 'generating' | 'done' | 'error';

const QUICK_PROMPTS = [
  { icon: '🎬', label: '产品宣传', prompt: '生成15秒科技产品宣传视频：深色背景，霓虹光效，展示智能手表特性，大标题文字从下方滑入' },
  { icon: '🔬', label: '知识科普', prompt: '生成10秒科普短视频：太空深蓝背景，标题"黑洞的诞生"，文案分两行从下往上显示' },
  { icon: '🎉', label: '节日祝福', prompt: '生成8秒新年祝福视频：红金喜庆风格，居中大标题"新年快乐"，副标题从下往上滑入' },
  { icon: '🍳', label: '美食展示', prompt: '生成12秒美食短视频：暖色调温馨背景，标题"今日推荐"在上方，菜名从左侧滑入' },
];

export const AIDirectorPanel: React.FC = () => {
  const [mode, setMode] = useState<PanelMode>('idle');
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState({ status: '', message: '', percent: 0 });
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'agent'; content: string; ts: number }>>([]);
  const [followUp, setFollowUp] = useState('');
  const [showConsoleTip, setShowConsoleTip] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTimeout(() => setShowConsoleTip(false), 8000);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [conversation]);

  const addLog = useCallback((role: 'user' | 'agent', content: string) => {
    const ts = Date.now();
    setConversation(prev => [...prev.slice(-30), { role, content, ts }]);
  }, []);

  const handleGenerate = useCallback(async (prompt?: string) => {
    const input = prompt || userInput;
    if (!input.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setMode('generating');
    setError(null);
    setProgress({ status: 'thinking', message: '正在分析需求...', percent: 5 });
    addLog('user', input);
    if (!prompt) setUserInput('');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev.percent >= 95) return prev;
        const increment = prev.percent < 30 ? 2 : prev.percent < 60 ? 1 : 0.5;
        return { ...prev, percent: Math.min(prev.percent + increment, 95) };
      });
    }, 1000);

    try {
      const startTime = Date.now();
      const res = await aiAgent.generate(input.trim(), {
        onStatusChange: (status, msg) => {
          const msgMap: Record<string, string> = {
            thinking: '分析中',
            acting: '执行工具',
            reflecting: '反思调整',
            done: '完成',
            error: '出错',
          };
          const pctMap: Record<string, number> = { thinking: 20, acting: 50, reflecting: 75, done: 100, error: 0 };
          setProgress({ status, message: msg || msgMap[status] || '', percent: pctMap[status] || 50 });
        },
      });

      clearInterval(progressInterval);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (res.success) {
        const clipCount = res.workingMemory?.addedClipIds?.length ?? 0;
        const summary = [
          `✅ 生成完成！耗时 ${elapsed}s`,
          `• 执行步骤: ${res.stepsExecuted}`,
          `• 添加片段: ${clipCount} 个`,
          res.finalOutput ? `• 输出: ${res.finalOutput}` : '',
        ].filter(Boolean).join('\n');
        addLog('agent', summary);
        setResult(res);
        setProgress({ status: 'done', message: '完成', percent: 100 });
        setMode('done');
      } else {
        setError(res.error || '未知错误');
        addLog('agent', `❌ 生成失败: ${res.error}`);
        setProgress({ status: 'error', message: res.error || '失败', percent: 0 });
        setMode('error');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      if (e.name === 'AbortError') {
        setError('用户取消了生成');
        addLog('agent', '⏹️ 生成已取消');
      } else {
        setError(e.message);
        addLog('agent', `💥 崩溃: ${e.message}`);
      }
      setProgress({ status: 'error', message: e.message, percent: 0 });
      setMode('error');
    }
  }, [userInput, addLog]);

  const handleFollowUp = useCallback(async () => {
    if (!followUp.trim() || mode === 'generating') return;

    setMode('generating');
    setError(null);
    addLog('user', followUp);
    const msg = followUp;
    setFollowUp('');

    try {
      const res = await aiAgent.followUp(msg.trim(), {
        onStatusChange: (status, msg2) => {
          const pctMap: Record<string, number> = { thinking: 20, acting: 60, reflecting: 85, done: 100, error: 0 };
          setProgress({ status, message: msg2 || status, percent: pctMap[status] || 50 });
        },
      });

      if (res.success) {
        addLog('agent', `✅ 已修改: ${res.finalOutput || '完成'}`);
        setResult(res);
        setMode('done');
      } else {
        setError(res.error || '未知错误');
        addLog('agent', `❌ 修改失败: ${res.error}`);
        setMode('error');
      }
    } catch (e: any) {
      setError(e.message);
      addLog('agent', `💥 错误: ${e.message}`);
      setMode('error');
    }
  }, [followUp, mode, addLog]);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    aiAgent.reset();
    setMode('idle');
    setProgress({ status: '', message: '', percent: 0 });
    setResult(null);
    setError(null);
    setConversation([]);
    setFollowUp('');
  }, []);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMode('idle');
    setProgress({ status: '', message: '', percent: 0 });
    addLog('agent', '⏹️ 生成已取消');
  }, [addLog]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-bold text-sm">AI Agent 导演</span>
          <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">全方位智能体</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {/* Console Tip */}
      {showConsoleTip && (
        <div className="mx-3 mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 flex items-start gap-2">
          <span>💡</span>
          <div>
            <div className="font-medium mb-0.5">全方位AI智能体功能</div>
            <div className="text-blue-300 text-[9px]">
              自动使用素材、模板、预设、AI生成、轨道管理等功能创建完整视频
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Idle - Input */}
        {mode === 'idle' && (
          <>
            <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto">
              {/* Quick Prompts */}
              <div className="text-[10px] text-gray-500 mb-1">快速模板（点击自动填入）</div>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => setUserInput(qp.prompt)}
                    className={clsx(
                      'text-left p-2 rounded-lg border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-[10px] truncate',
                      userInput === qp.prompt ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'bg-white/[0.02] text-gray-400'
                    )}
                  >
                    <span className="mr-1">{qp.icon}</span>{qp.label}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
                }}
                placeholder={'告诉 AI Agent 你想生成什么视频...\n\n例如：\n"生成一个产品宣传视频，使用项目中的图片素材，深色背景，大字标题..."\n"用模板创建一个科普短视频，添加文字说明和动画效果"'}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-white resize-none focus:border-purple-500 outline-none placeholder-gray-600"
                rows={6}
              />

              {/* Error */}
              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 flex items-start gap-1.5">
                  <span>❌</span><span>{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1.5 border-t border-white/5">
              <button
                onClick={() => handleGenerate()}
                disabled={!userInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span> 启动 AI Agent 生成
                <span className="text-[10px] opacity-60">(Ctrl+Enter)</span>
              </button>
              <button
                onClick={runQuickTest}
                className="w-full py-1.5 border border-dashed border-white/15 hover:border-green-500/40 text-[10px] text-gray-500 hover:text-green-400 rounded-lg transition-all"
              >
                ⚡ 快速模拟测试（无需API）
              </button>
            </div>
          </>
        )}

        {/* Generating */}
        {mode === 'generating' && (
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="34" stroke="url(#grad)" strokeWidth="6" fill="none"
                  strokeDasharray={`${progress.percent * 2.14} 214`}
                  strokeLinecap="round"
                  className="text-purple-400"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-300">{Math.round(progress.percent)}%</span>
              </div>
            </div>
            <div className="text-xs text-purple-300 font-medium">
              {progress.status === 'thinking' && '🧠 思考分析中'}
              {progress.status === 'acting' && '🔧 执行操作中'}
              {progress.status === 'reflecting' && '🪞 反思优化中'}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-center max-w-[200px]">{progress.message}</div>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-1.5 text-[10px] text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg transition-colors"
            >
              ⏹️ 取消生成
            </button>
          </div>
        )}

        {/* Done / Error */}
        {(mode === 'done' || mode === 'error') && (
          <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
            {mode === 'done' && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-lg">✅</span>
                <div>
                  <div className="text-[11px] text-green-400 font-medium">生成完成</div>
                  <div className="text-[9px] text-green-500/70">
                    {result?.stepsExecuted ?? 0} 步，{(result?.workingMemory?.addedClipIds?.length ?? 0)} 个片段
                  </div>
                </div>
              </div>
            )}

            {mode === 'error' && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span>❌</span>
                <div>
                  <div className="text-[11px] text-red-400 font-medium">生成失败</div>
                  <div className="text-[9px] text-red-500/70">{error}</div>
                </div>
              </div>
            )}

            {/* Conversation Log */}
            {conversation.length > 0 && (
              <div ref={logRef} className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 overflow-y-auto space-y-1.5 max-h-60">
                <div className="text-[9px] text-gray-600 mb-1">📜 执行日志</div>
                {conversation.map((entry, i) => (
                  <div key={i} className={clsx(
                    'text-[10px] p-1.5 rounded whitespace-pre-wrap break-words',
                    entry.role === 'user'
                      ? 'bg-purple-500/10 text-purple-300 ml-3'
                      : 'bg-white/[0.03] text-gray-300 mr-2'
                  )}>
                    <span className="opacity-40 mr-1">{entry.role === 'user' ? '👤' : '🤖'}</span>
                    {entry.content}
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up */}
            <div className="space-y-1">
              <div className="text-[9px] text-gray-500">✏️ 追问修改（如"加大标题"、"换成红色背景"）</div>
              <div className="flex gap-1.5">
                <input
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
                  placeholder="输入修改指令..."
                  disabled={false}
                  className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:border-purple-500 outline-none disabled:opacity-30"
                />
                <button
                  onClick={handleFollowUp}
                  disabled={!followUp.trim()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-[10px] text-white rounded transition-colors"
                >
                  发送
                </button>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-white rounded-lg transition-colors mt-1"
            >
              🆕 新建生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
