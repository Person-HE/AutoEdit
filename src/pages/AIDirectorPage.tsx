/**
 * AI 导演 · 全屏独立界面
 * 唯一的 AI 能力入口：ReAct 智能体直接操作当前项目（工具链 ~25 个）
 * 左：会话控制台 | 中：执行活动流 | 右：项目大纲 + AI 服务配置
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { aiAgent } from '../modules/ai-director';
import type { AgentResult } from '../modules/ai-director';
import { runQuickTest } from '../test/aiAgentTest';
import { useProjectStore } from '../store/useProjectStore';
import { useAppRouter } from '../store/useAppRouter';
import { AIConfigPanel } from '../components/ai/AIConfigPanel';
import clsx from 'clsx';

type PanelMode = 'idle' | 'generating' | 'done' | 'error';

interface LogEntry {
  role: 'user' | 'agent';
  content: string;
  ts: number;
}

const QUICK_PROMPTS = [
  { icon: 'film', label: '产品宣传', prompt: '生成15秒科技产品宣传视频：深色背景，霓虹光效，展示智能手表特性，大标题文字从下方滑入' },
  { icon: 'scope', label: '知识科普', prompt: '生成10秒科普短视频：太空深蓝背景，标题"黑洞的诞生"，文案分两行从下往上显示' },
  { icon: 'party', label: '节日祝福', prompt: '生成8秒新年祝福视频：红金喜庆风格，居中大标题"新年快乐"，副标题从下往上滑入' },
  { icon: 'chef', label: '美食展示', prompt: '生成12秒美食短视频：暖色调温馨背景，标题"今日推荐"在上方，菜名从左侧滑入' },
];

// ==================== 页面 ====================
export const AIDirectorPage: React.FC = () => {
  const goToEditor = useAppRouter(s => s.goToEditor);
  const [mode, setMode] = useState<PanelMode>('idle');
  const [userInput, setUserInput] = useState('');
  const [progress, setProgress] = useState({ status: '', message: '', percent: 0 });
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<LogEntry[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [showAIConfig, setShowAIConfig] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [conversation]);

  const addLog = useCallback((role: 'user' | 'agent', content: string) => {
    setConversation(prev => [...prev.slice(-200), { role, content, ts: Date.now() }]);
  }, []);

  const handleGenerate = useCallback(async (prompt?: string) => {
    const input = prompt || userInput;
    if (!input.trim()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMode('generating');
    setError(null);
    setProgress({ status: 'thinking', message: '正在分析需求...', percent: 5 });
    addLog('user', input);
    if (!prompt) setUserInput('');

    const timer = setInterval(() => {
      setProgress(prev => prev.percent >= 95 ? prev : {
        ...prev,
        percent: Math.min(prev.percent + (prev.percent < 30 ? 2 : prev.percent < 60 ? 1 : 0.5), 95),
      });
    }, 1000);

    try {
      const start = Date.now();
      const res = await aiAgent.generate(input.trim(), {
        onStatusChange: (status, msg) => {
          const pctMap: Record<string, number> = { thinking: 20, acting: 55, reflecting: 80, done: 100, error: 0 };
          setProgress({ status, message: msg || status, percent: pctMap[status] ?? 50 });
        },
      });
      clearInterval(timer);

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (res.success) {
        const clips = res.workingMemory?.addedClipIds?.length ?? 0;
        addLog('agent', [
          `✅ 生成完成！耗时 ${elapsed}s`,
          `• 执行步骤: ${res.stepsExecuted}`,
          `• 添加片段: ${clips} 个`,
          res.finalOutput ? `• ${res.finalOutput}` : '',
        ].filter(Boolean).join('\n'));
        setResult(res);
        setProgress({ status: 'done', message: '完成', percent: 100 });
        setMode('done');
      } else {
        setError(res.error || '未知错误');
        addLog('agent', `❌ 生成失败: ${res.error}`);
        setMode('error');
      }
    } catch (e: any) {
      clearInterval(timer);
      addLog('agent', e.name === 'AbortError' ? '⏹️ 已取消' : `💥 崩溃: ${e.message}`);
      if (e.name !== 'AbortError') setError(e.message);
      setMode('error');
    }
  }, [userInput, addLog]);

  const handleFollowUp = useCallback(async () => {
    if (!followUp.trim() || mode === 'generating') return;
    const msg = followUp.trim();
    setMode('generating');
    addLog('user', msg);
    setFollowUp('');

    try {
      const res = await aiAgent.followUp(msg, {
        onStatusChange: (status, m2) => {
          const pctMap: Record<string, number> = { thinking: 20, acting: 60, reflecting: 85, done: 100, error: 0 };
          setProgress({ status, message: m2 || status, percent: pctMap[status] ?? 50 });
        },
      });
      if (res.success) {
        addLog('agent', `✅ 已修改: ${res.finalOutput || '完成'}`);
        setResult(res);
        setMode('done');
      } else {
        addLog('agent', `❌ 修改失败: ${res.error}`);
        setError(res.error || '未知错误');
        setMode('error');
      }
    } catch (e: any) {
      addLog('agent', `💥 错误: ${e.message}`);
      setError(e.message);
      setMode('error');
    }
  }, [followUp, mode, addLog]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    aiAgent.reset();
    setMode('idle');
    setResult(null);
    setError(null);
    setConversation([]);
    setFollowUp('');
    setProgress({ status: '', message: '', percent: 0 });
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0A0A12] text-gray-200 flex flex-col overflow-hidden">
      {/* 顶栏 */}
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-5 gap-4 bg-[#101018]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="font-bold text-sm leading-tight">AI 导演</div>
            <div className="text-[10px] text-gray-500">ReAct 智能体 · 直接驱动当前项目时间线</div>
          </div>
        </div>

        <div className="flex-1" />

        {/* 状态徽标 */}
        <span className={clsx("text-[10px] px-2 py-1 rounded-full border",
          mode === 'generating' ? "border-purple-500/40 text-purple-300 animate-pulse" :
          mode === 'done' ? "border-green-500/40 text-green-400" :
          mode === 'error' ? "border-red-500/40 text-red-400" :
          "border-white/10 text-gray-500")}>
          {mode === 'idle' && '待命'}
          {mode === 'generating' && `${progress.message} ${Math.round(progress.percent)}%`}
          {mode === 'done' && '已完成'}
          {mode === 'error' && '出错'}
        </span>

        <button
          onClick={() => setShowAIConfig(true)}
          className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 transition-colors"
        >
          ⚙ AI 服务
        </button>
        <button
          onClick={() => goToEditor()}
          className="text-xs font-medium px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
        >
          返回编辑器 →
        </button>
      </header>

      {/* 三栏主体 */}
      <div className="flex-1 min-h-0 grid grid-cols-[360px_1fr_300px]">
        {/* 左栏：会话控制台 */}
        <aside className="border-r border-white/5 flex flex-col min-h-0">
          <ConsolePane
            mode={mode}
            userInput={userInput}
            setUserInput={setUserInput}
            progress={progress}
            error={error}
            followUp={followUp}
            setFollowUp={setFollowUp}
            result={result}
            onGenerate={handleGenerate}
            onFollowUp={handleFollowUp}
            onReset={handleReset}
            onCancel={() => {
              abortRef.current?.abort();
              setMode('idle');
              addLog('agent', '⏹️ 已取消');
            }}
            onMockTest={async () => {
              addLog('user', '⚡ 运行内置模拟测试');
              await runQuickTest();
              addLog('agent', '✅ 模拟测试已在控制台执行完毕（按 F12 查看）');
              setMode('done');
            }}
          />
        </aside>

        {/* 中栏：执行活动流 */}
        <main className="flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-2 text-[10px] text-gray-500 uppercase tracking-wider">执行活动流</div>
          <div ref={logRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
            {conversation.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-40">
                <svg className="text-5xl opacity-40" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <p className="text-sm">描述你的创意，智能体会自动调度 25 个工具</p>
                <p className="text-xs">分析素材 → 规划分镜 → 创建轨道与片段 → 应用效果 → 输出成片</p>
              </div>
            )}
            {conversation.map((entry, i) => (
              <div key={i} className={clsx(
                "rounded-xl p-3 text-sm whitespace-pre-wrap break-words border",
                entry.role === 'user'
                  ? 'ml-12 bg-purple-500/10 border-purple-500/20 text-purple-200'
                  : 'mr-8 bg-white/[0.03] border-white/5 text-gray-300'
              )}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-50">
                  <span>{entry.role === 'user' ? '👤 你' : '🤖 导演'}</span>
                  <span>{new Date(entry.ts).toLocaleTimeString()}</span>
                </div>
                {entry.content}
              </div>
            ))}
          </div>
        </main>

        {/* 右栏：项目大纲 */}
        <aside className="border-l border-white/5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <ProjectOutline />
        </aside>
      </div>

      {/* AI 服务配置弹窗 */}
      {showAIConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAIConfig(false)}>
          <div className="bg-[#15151F] border border-white/10 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <AIConfigPanel onClose={() => setShowAIConfig(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 会话控制台 ====================
interface ConsoleProps {
  mode: PanelMode;
  userInput: string;
  setUserInput: (v: string) => void;
  progress: { status: string; message: string; percent: number };
  error: string | null;
  followUp: string;
  setFollowUp: (v: string) => void;
  result: AgentResult | null;
  onGenerate: (prompt?: string) => void;
  onFollowUp: () => void;
  onReset: () => void;
  onCancel: () => void;
  onMockTest: () => void;
}

const ConsolePane: React.FC<ConsoleProps> = ({
  mode, userInput, setUserInput, progress, error, followUp, setFollowUp,
  result, onGenerate, onFollowUp, onReset, onCancel, onMockTest,
}) => (
  <>
    {/* 快捷模板 + 输入 */}
    {(mode === 'idle' || mode === 'done' || mode === 'error') && (
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_PROMPTS.map((qp, i) => (
            <button key={i} onClick={() => setUserInput(qp.prompt)}
              className={clsx(
                'text-left p-2 rounded-lg border text-[11px] truncate transition-all',
                userInput === qp.prompt
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                  : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-purple-500/30 hover:bg-purple-500/5'
              )}>
              <span className="mr-1 text-base">{qp.icon === 'film' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              ) : qp.icon === 'scope' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              ) : qp.icon === 'party' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              )}</span>{qp.label}
            </button>
          ))}
        </div>

        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate(); }}
          rows={7}
          placeholder={'告诉 AI 导演你想生成什么视频…\n\n例如："生成一个产品宣传视频，使用项目里的图片素材，深色背景，大字标题滑入"'}
          className="w-full bg-black/25 border border-white/10 rounded-xl p-3 text-sm resize-none focus:border-purple-500 outline-none placeholder-gray-600"
        />

        {mode !== 'idle' && (
          <input
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onFollowUp()}
            placeholder='追问修改，如"加大标题"、"换成红色背景"'
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-purple-500 outline-none"
          />
        )}

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-400">❌ {error}</div>
        )}

        <div className="space-y-1.5">
          <button
            onClick={() => onGenerate()}
            disabled={!userInput.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all"
          >
            🚀 启动 AI 导演 <span className="text-[10px] opacity-60">(Ctrl+Enter)</span>
          </button>
          <div className="flex gap-1.5">
            <button onClick={onMockTest}
              className="flex-1 py-1.5 border border-dashed border-white/15 hover:border-green-500/40 text-[10px] text-gray-500 hover:text-green-400 rounded-lg transition-all">
              ⚡ 模拟测试(无需API)
            </button>
            <button onClick={onReset}
              className="flex-1 py-1.5 border border-dashed border-white/15 hover:border-white/30 text-[10px] text-gray-500 hover:text-gray-300 rounded-lg transition-all">
              🔄 重置会话
            </button>
          </div>
        </div>

        {result?.success && mode === 'done' && (
          <DoneSummary steps={result.stepsExecuted} clips={result.workingMemory?.addedClipIds?.length ?? 0} />
        )}
      </div>
    )}

    {/* 进行中 */}
    {mode === 'generating' && (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <ProgressRing percent={progress.percent} />
        <div className="mt-4 text-sm text-purple-300 font-medium">
          {progress.status === 'thinking' && '🧠 思考分析中'}
          {progress.status === 'acting' && '🔧 执行操作中'}
          {progress.status === 'reflecting' && '🪞 反思优化中'}
        </div>
        <div className="text-xs text-gray-500 mt-1">{progress.message}</div>
        <button onClick={onCancel}
          className="mt-6 px-4 py-1.5 text-xs text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg transition-colors">
          ⏹ 取消
        </button>
      </div>
    )}
  </>
);

const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="relative w-24 h-24">
    <svg className="w-full h-full -rotate-90">
      <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
      <circle cx="48" cy="48" r="42" stroke="url(#g1)" strokeWidth="7" fill="none"
        strokeDasharray={`${percent * 2.64} 264`} strokeLinecap="round" />
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-purple-300">
      {Math.round(percent)}%
    </div>
  </div>
);

const DoneSummary: React.FC<{ steps: number; clips: number }> = ({ steps, clips }) => (
  <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl space-y-2">
    <div className="text-xs text-green-400 font-medium">✅ 完成 · {steps} 步 · {clips} 个片段</div>
    <a
      href="#/editor"
      onClick={(e) => { e.preventDefault(); useAppRouter.getState().goToEditor(); }}
      className="block text-center text-[11px] py-1.5 rounded-lg bg-green-600/80 hover:bg-green-600 text-white transition-colors"
    >
      前往编辑器查看成品 →
    </a>
  </div>
);

// ==================== 项目大纲 ====================
const ProjectOutline: React.FC = () => {
  const project = useProjectStore(s => s.project);
  const assetsCount = useProjectStore(s => s.assets.length);

  const trackRows = project.tracks.map(track => ({
    track,
    clips: Object.values(project.clips).filter(c => c.trackId === track.id).sort((a, b) => a.startTime - b.startTime),
  }));
  const totalClips = Object.keys(project.clips).length;

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">项目大纲（实时）</div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="时长" value={`${project.duration.toFixed(0)}s`} />
        <Stat label="片段" value={`${totalClips}`} />
        <Stat label="轨道" value={`${project.tracks.length}`} />
        <Stat label="素材" value={`${assetsCount}`} />
        <Stat label="分辨率" value={`${project.width}×${project.height}`} />
        <Stat label="帧率" value={`${project.fps}fps`} />
      </div>

      {trackRows.map(({ track, clips }) => (
        <div key={track.id} className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
            <span>{track.type === 'video' ? (
              <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            ) : track.type === 'text' ? (
              <span className="text-[10px] font-mono mr-1">T</span>
            ) : (
              <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            )} {track.name}</span>
            <span className="text-gray-600 font-normal">{clips.length}</span>
          </div>
          {clips.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1">
              <span className="truncate text-[11px] text-gray-300">
                {c.type === 'image' ? (
                  <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                ) : c.type === 'video' ? (
                  <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                ) : c.type === 'text' ? (
                  <span className="text-[10px] font-mono mr-1">T</span>
                ) : c.type === 'template' ? (
                  <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                ) : (
                  <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                )} {c.name}
              </span>
              <span className="text-[9px] text-gray-600 shrink-0 ml-2">
                {c.startTime.toFixed(1)}s·{(c.effects?.length ?? 0)}fx
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
    <div className="text-[9px] text-gray-600">{label}</div>
    <div className="text-sm font-bold text-gray-200">{value}</div>
  </div>
);

export default AIDirectorPage;
