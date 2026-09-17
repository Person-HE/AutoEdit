import { useProjectStore } from '../store/useProjectStore';
import { useTrackStore } from '../modules/track/useTrackStore';
import { useAssetStore } from '../modules/asset/useAssetStore';
import { aiAgent } from '../modules/ai-director';
import type { AgentResult, AgentContext, WorkingMemory } from '../modules/ai-director';
import { toolSystem } from '../modules/ai-director/core/ToolSystem';
import { projectAdapter } from '../modules/ai-director/adapters/ProjectAdapter';
import { ClipFactory } from '../modules/clip/ClipTypes';
import { videoExporter } from '../services/videoExporter';

import './tools-init';

export const TEST_CASES = {
  产品宣传: {
    label: '产品宣传视频',
    prompt: '为最新的"智能手表X9"制作一个15秒的产品宣传视频。需要：\n1. 一个产品特写镜头（炫酷科技背景）\n2. 白色大字标题"重新定义智能"\n3. 中文字幕切换展示产品三大卖点：健康监测、7天续航、AI语音助手\n4. 整体风格：深色科技风，有霓虹光效',
    expectedClips: 3,
  },
  知识科普: {
    label: '知识科普短视频',
    prompt: '制作一个10秒的科普短视频，主题是"黑洞是如何形成的"。\n1. 太空背景，深空蓝色调\n2. 标题文字"黑洞的诞生"\n3. 简短文案分两行显示：先显示"恒星坍缩"，再显示"时空扭曲"\n4. 风格：神秘宇宙、专业科学感',
    expectedClips: 2,
  },
  节日祝福: {
    label: '节日祝福视频',
    prompt: '生成一个8秒的新年祝福视频：\n1. 暖色调背景，红金色喜庆风格\n2. 居中大标题"新年快乐"\n3. 副标题"万事如意 心想事成" 从下往上滑入\n4. 有金色粒子飘落效果',
    expectedClips: 2,
  },
  美食展示: {
    label: '美食展示视频',
    prompt: '制作一个12秒的美食短视频：\n1. 暖黄色温馨背景\n2. 标题"今日推荐"在上方\n3. 菜品名称"红烧排骨"从左侧滑入\n4. 底部显示价格标签',
    expectedClips: 2,
  },
};

function createMockContext(): AgentContext {
  const projectState = useProjectStore.getState();
  const assetState = useAssetStore.getState();
  return {
    userInput: '模拟测试',
    conversationHistory: [],
    workingMemory: {
      reflections: [],
      errors: [],
      addedClipIds: [],
    },
    projectState: {
      tracks: (projectState.project.tracks || []).map(t => ({
        id: t.id,
        type: t.type,
        name: t.name,
      })),
      clipsCount: Object.keys(projectState.project.clips || {}).length,
      assetsCount: (assetState.assets || []).length,
      currentTime: 0,
      totalDuration: projectState.project.duration ?? 30,
      canvasSize: {
        width: projectState.project.width ?? 1920,
        height: projectState.project.height ?? 1080,
      },
      fps: projectState.project.fps ?? 30,
    },
    config: {
      maxIterations: 20,
      maxReflections: 3,
      enableSelfCorrection: true,
      verbose: true,
      temperature: 0.7,
    },
  };
}

function ensureTracks(): void {
  const project = useProjectStore.getState().project;
  const hasVideoTrack = project.tracks.some(t => t.type === 'video');
  const hasTextTrack = project.tracks.some(t => t.type === 'text');
  const hasAudioTrack = project.tracks.some(t => t.type === 'audio');

  if (!hasVideoTrack) {
    useProjectStore.getState().addTrack('video');
  }
  if (!hasTextTrack) {
    useProjectStore.getState().addTrack('text');
  }
  if (!hasAudioTrack) {
    useProjectStore.getState().addTrack('audio');
  }
}

function verifyClipData(clipId: string, expected: Record<string, any>): { pass: boolean; errors: string[] } {
  const clip = (useProjectStore.getState().project.clips || {})[clipId];
  const errors: string[] = [];

  if (!clip) {
    return { pass: false, errors: [`片段 ${clipId} 不存在`] };
  }

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = key.includes('.')
      ? key.split('.').reduce((obj: any, k) => obj?.[k], clip as any)
      : (clip as any)[key];

    if (actualValue !== expectedValue) {
      errors.push(`${key}: 期望 ${JSON.stringify(expectedValue)}, 实际 ${JSON.stringify(actualValue)}`);
    }
  }

  return { pass: errors.length === 0, errors };
}

export async function runQuickTest(): Promise<void> {
  console.log('\n🧪 ========================================');
  console.log('🧪 AI导演模式 - 完整模拟测试（不需要AI API）');
  console.log('🧪 ========================================\n');

  ensureTracks();

  const project = useProjectStore.getState().project;
  console.log('📋 项目初始状态:');
  console.log(`  轨道: ${project.tracks.map(t => `${t.name}(${t.id})`).join(', ')}`);
  console.log(`  片段数: ${Object.keys(project.clips).length}`);
  console.log(`  画布: ${project.width}x${project.height}`);
  console.log('');

  const context = createMockContext();
  let totalPassed = 0;
  let totalFailed = 0;

  // ========== 测试1: 通过 addClipTool 添加文本片段 ==========
  console.log('📝 测试1: add_clip_to_track 添加文本片段');
  try {
    const result = await toolSystem.execute('add_clip_to_track', {
      type: 'text',
      content: '重新定义智能',
      fontSize: 56,
      color: '#ffffff',
      y: -200,
      startTime: 0,
      duration: 8,
      presetId: 'entrance_fade_in_up',
    }, context);

    if (result.success) {
      const clipId = result.data.clipId;
      const verification = verifyClipData(clipId, {
        type: 'text',
        duration: 8,
        startTime: 0,
      });

      const clip = (useProjectStore.getState().project.clips || {})[clipId];
      if (clip?.textData?.content === '重新定义智能') {
        console.log(`  ✅ 文本片段添加成功: ${clipId}`);
        console.log(`     内容: "${clip.textData.content}"`);
        console.log(`     字号: ${clip.textData.fontSize}, 颜色: ${clip.textData.color}`);
        console.log(`     位置: (${clip.transform.x}, ${clip.transform.y})`);
        console.log(`     时长: ${clip.duration}s, 开始: ${clip.startTime}s`);
        console.log(`     轨道: ${clip.trackId}`);
        console.log(`     效果: ${clip.effects.length} 个 (${clip.effects.map(e => e.presetId).join(', ')})`);
        totalPassed++;
      } else {
        console.log(`  ❌ 文本内容验证失败`);
        console.log(`     期望: "重新定义智能", 实际: "${clip?.textData?.content}"`);
        totalFailed++;
      }

      if (!verification.pass) {
        console.log(`  ⚠️ 数据验证警告: ${verification.errors.join('; ')}`);
      }

      if (context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds.push(clipId);
      }
    } else {
      console.log(`  ❌ 添加失败: ${result.error}`);
      totalFailed++;
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试2: 通过 addClipTool 添加副标题 ==========
  console.log('\n📝 测试2: add_clip_to_track 添加副标题文本');
  try {
    const result = await toolSystem.execute('add_clip_to_track', {
      type: 'text',
      content: 'AI赋能未来',
      fontSize: 36,
      color: '#a0aec0',
      y: 200,
      startTime: 2,
      duration: 6,
      presetId: 'entrance_slide_in_up',
      exitPresetId: 'exit_fade_out',
    }, context);

    if (result.success) {
      const clipId = result.data.clipId;
      const clip = (useProjectStore.getState().project.clips || {})[clipId];
      if (clip?.textData?.content === 'AI赋能未来') {
        console.log(`  ✅ 副标题添加成功: ${clipId}`);
        console.log(`     内容: "${clip.textData.content}"`);
        console.log(`     字号: ${clip.textData.fontSize}, 颜色: ${clip.textData.color}`);
        console.log(`     位置: (${clip.transform.x}, ${clip.transform.y})`);
        console.log(`     时长: ${clip.duration}s, 开始: ${clip.startTime}s`);
        console.log(`     效果: ${clip.effects.map(e => `${e.presetId}(${e.type})`).join(', ')}`);
        totalPassed++;
      } else {
        console.log(`  ❌ 副标题内容验证失败`);
        totalFailed++;
      }

      if (context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds.push(clipId);
      }
    } else {
      console.log(`  ❌ 添加失败: ${result.error}`);
      totalFailed++;
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试3: 通过 batch_add_clips 批量添加 ==========
  console.log('\n📝 测试3: batch_add_clips 批量添加多个片段');
  try {
    const result = await toolSystem.execute('batch_add_clips', {
      items: [
        {
          type: 'text',
          content: '健康监测',
          fontSize: 42,
          color: '#f6e05e',
          y: 100,
          startTime: 0,
          duration: 5,
          presetId: 'entrance_zoom_in',
        },
        {
          type: 'text',
          content: '7天续航',
          fontSize: 42,
          color: '#68d391',
          y: 100,
          startTime: 5,
          duration: 5,
          presetId: 'entrance_slide_in_left',
        },
        {
          type: 'text',
          content: 'AI语音助手',
          fontSize: 42,
          color: '#63b3ed',
          y: 100,
          startTime: 10,
          duration: 5,
          presetId: 'entrance_bounce_in',
        },
      ],
      baseStartTime: 8,
    }, context);

    if (result.success) {
      const addedCount = result.data.addedCount;
      console.log(`  ✅ 批量添加成功: ${addedCount} 个片段`);

      for (const item of result.data.items) {
        const clip = (useProjectStore.getState().project.clips || {})[item.clipId];
        if (clip) {
          console.log(`     片段 ${item.clipId.slice(0, 8)}...: type=${clip.type}, content="${clip.textData?.content}", start=${clip.startTime}s, dur=${clip.duration}s, track=${clip.trackId}`);
          const expectedStart = item.startTime;
          if (Math.abs(clip.startTime - expectedStart) > 0.01) {
            console.log(`     ⚠️ 开始时间偏差: 期望 ${expectedStart}, 实际 ${clip.startTime}`);
          }
        }
      }
      totalPassed++;
    } else {
      console.log(`  ❌ 批量添加失败: ${result.error}`);
      totalFailed++;
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试4: 通过 apply_preset_effect 添加效果 ==========
  console.log('\n📝 测试4: apply_preset_effect 为已有片段添加效果');
  try {
    const clips = Object.values(useProjectStore.getState().project.clips);
    const textClip = clips.find(c => c.type === 'text' && c.effects.length > 0);

    if (textClip) {
      const result = await toolSystem.execute('apply_preset_effect', {
        clipId: textClip.id,
        presetId: 'emphasis_pulse',
      }, context);

      if (result.success) {
        const updatedClip = (useProjectStore.getState().project.clips || {})[textClip.id];
        console.log(`  ✅ 效果添加成功: emphasis_pulse`);
        console.log(`     片段 ${textClip.id.slice(0, 8)}... 现有 ${updatedClip.effects.length} 个效果`);
        console.log(`     效果列表: ${updatedClip.effects.map(e => e.presetId).join(', ')}`);
        totalPassed++;
      } else {
        console.log(`  ❌ 效果添加失败: ${result.error}`);
        totalFailed++;
      }
    } else {
      console.log(`  ⚠️ 跳过: 没有找到已有效果的文本片段`);
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试5: 通过 manage_track 管理轨道 ==========
  console.log('\n📝 测试5: manage_track 创建和管理轨道');
  try {
    const result = await toolSystem.execute('manage_track', {
      action: 'create',
      trackType: 'effect',
      name: '特效轨道',
    }, context);

    if (result.success) {
      console.log(`  ✅ 轨道创建成功: ${result.data.trackId}`);
      const tracks = useProjectStore.getState().project.tracks;
      console.log(`     当前轨道: ${tracks.map(t => `${t.name}(${t.type})`).join(', ')}`);
      totalPassed++;
    } else {
      console.log(`  ❌ 轨道创建失败: ${result.error}`);
      totalFailed++;
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试6: 数据完整性验证 ==========
  console.log('\n📝 测试6: 数据完整性验证');
  try {
    const finalProject = useProjectStore.getState().project;
    const allClips = Object.values(finalProject.clips || {});
    let dataErrors = 0;

    for (const clip of allClips) {
      if (!clip.id || !clip.trackId || !clip.type) {
        console.log(`  ❌ 片段 ${clip.id} 缺少必要字段`);
        dataErrors++;
        continue;
      }

      const track = finalProject.tracks.find(t => t.id === clip.trackId);
      if (!track) {
        console.log(`  ❌ 片段 ${clip.id} 引用了不存在的轨道 ${clip.trackId}`);
        dataErrors++;
        continue;
      }

      if (clip.type === 'text' && !clip.textData?.content) {
        console.log(`  ❌ 文本片段 ${clip.id} 缺少文本内容`);
        dataErrors++;
        continue;
      }

      if (clip.duration <= 0) {
        console.log(`  ❌ 片段 ${clip.id} 时长无效: ${clip.duration}`);
        dataErrors++;
        continue;
      }

      if (clip.startTime < 0) {
        console.log(`  ❌ 片段 ${clip.id} 开始时间无效: ${clip.startTime}`);
        dataErrors++;
        continue;
      }

      for (const effect of clip.effects) {
        if (!effect.presetId || !effect.type || !effect.id) {
          console.log(`  ❌ 片段 ${clip.id} 的效果缺少必要字段`);
          dataErrors++;
        }
      }
    }

    if (dataErrors === 0) {
      console.log(`  ✅ 所有 ${allClips.length} 个片段数据完整性验证通过`);
      totalPassed++;
    } else {
      console.log(`  ❌ 发现 ${dataErrors} 个数据错误`);
      totalFailed++;
    }
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 测试7: 预览可见性验证 ==========
  console.log('\n📝 测试7: 预览可见性验证');
  try {
    const finalProject = useProjectStore.getState().project;
    const allClips = Object.values(finalProject.clips || {});

    const testTimes = [0, 2, 5, 8, 10, 15, 20];
    for (const t of testTimes) {
      const visibleClips = allClips.filter(
        c => t >= c.startTime && t < c.startTime + c.duration
      );
      if (visibleClips.length > 0) {
        console.log(`  t=${t}s: ${visibleClips.length} 个可见片段 (${visibleClips.map(c => c.textData?.content || c.name).join(', ')})`);
      }
    }
    console.log(`  ✅ 预览可见性验证完成`);
    totalPassed++;
  } catch (e) {
    console.log(`  💥 异常: ${e}`);
    totalFailed++;
  }

  // ========== 最终汇总 ==========
  const finalProject = useProjectStore.getState().project;
  const finalClipCount = Object.keys(finalProject.clips).length;
  const finalTrackCount = finalProject.tracks.length;

  console.log('\n🧪 ========================================');
  console.log(`🧪 测试汇总: ${totalPassed} 通过, ${totalFailed} 失败`);
  console.log(`🧪 项目最终状态:`);
  console.log(`   轨道数: ${finalTrackCount}`);
  console.log(`   片段数: ${finalClipCount}`);
  console.log(`   轨道列表: ${finalProject.tracks.map(t => `${t.name}(${t.type})`).join(', ')}`);

  const clipsByTrack: Record<string, number> = {};
  for (const clip of Object.values(finalProject.clips || {})) {
    clipsByTrack[clip.trackId] = (clipsByTrack[clip.trackId] || 0) + 1;
  }
  for (const [trackId, count] of Object.entries(clipsByTrack)) {
    const track = finalProject.tracks.find(t => t.id === trackId);
    console.log(`   ${track?.name || trackId}: ${count} 个片段`);
  }

  console.log('🧪 ========================================');
  console.log('📌 接下来可以:');
  console.log('  1. 点击播放按钮查看预览效果');
  console.log('  2. 在时间轴上查看片段布局');
  console.log('  3. 在"AI导演模式"面板输入描述，点击"启动 AI Agent"进行真实的AI生成');
  console.log('');
}

export async function runTest(caseKey?: keyof typeof TEST_CASES): Promise<AgentResult | null> {
  const testCase = caseKey ? TEST_CASES[caseKey] : TEST_CASES['产品宣传'];

  console.log(`\n🤖 ==================== AI AGENT 测试 ====================`);
  console.log(`📋 测试用例: ${testCase.label}`);
  console.log(`📝 输入描述: ${testCase.prompt.slice(0, 100)}...`);
  console.log(`🎯 预期生成片段: ${testCase.expectedClips} 个`);
  console.log(`=========================================================\n`);

  try {
    console.time('⏱️ AI Agent 总耗时');

    const result = await aiAgent.generate(testCase.prompt);

    console.timeEnd('⏱️ AI Agent 总耗时');

    if (result.success) {
      console.log('\n✅ ==================== 测试通过 ====================');
      console.log(`📊 执行步骤: ${result.stepsExecuted}`);
      console.log(`📄 最终输出: ${result.finalOutput}`);
      console.log(`💾 工作记忆:`);
      console.log(`  - 分析: ${result.workingMemory?.analysis ? '✅' : '❌'}`);
      console.log(`  - 分镜数据: ${result.workingMemory?.shotData ? '✅' : '❌'}`);
      console.log(`  - 文案: ${result.workingMemory?.textLines?.length ?? 0} 条`);
      console.log(`  - 已添加片段: ${result.workingMemory?.addedClipIds?.length ?? 0} 个`);
      console.log(`========================================================\n`);

      const clipCount = result.workingMemory?.addedClipIds?.length ?? 0;
      if (clipCount >= testCase.expectedClips) {
        console.log(`✅ 片段数量满足预期！(${clipCount} >= ${testCase.expectedClips})`);
      } else {
        console.warn(`⚠️ 片段数量未达预期 (${clipCount} < ${testCase.expectedClips})`);
      }

      const finalProject = useProjectStore.getState().project;
      console.log('\n📋 生成的片段详情:');
      for (const clipId of (result.workingMemory?.addedClipIds || [])) {
        const clip = finalProject.clips[clipId];
        if (clip) {
          console.log(`  ${clipId.slice(0, 8)}...: type=${clip.type}, start=${clip.startTime}s, dur=${clip.duration}s, track=${clip.trackId}`);
          if (clip.textData) {
            console.log(`    text: "${clip.textData.content}", fontSize=${clip.textData.fontSize}, color=${clip.textData.color}`);
          }
          if (clip.effects.length > 0) {
            console.log(`    effects: ${clip.effects.map(e => e.presetId).join(', ')}`);
          }
        }
      }

      console.log('💡 提示: 请到编辑器预览区查看生成的视频效果');
    } else {
      console.error('\n❌ ==================== 测试失败 ====================');
      console.error(`错误: ${result.error}`);
      console.error('💡 可能的原因:');
      console.error('  1. AI API密钥不可用或额度耗尽');
      console.error('  2. 网络连接问题');
      console.error('  3. 输入描述不够清晰');
      console.error(`========================================================\n`);
    }

    return result;
  } catch (e) {
    console.error('\n💥 ==================== 测试崩溃 ====================');
    console.error(e);
    console.error(`========================================================\n`);
    return null;
  }
}

export async function runAllTests(): Promise<void> {
  const cases = Object.keys(TEST_CASES) as Array<keyof typeof TEST_CASES>;
  console.log(`\n🚀 开始运行全部 ${cases.length} 个测试用例...\n`);

  let passed = 0;
  let failed = 0;

  for (const caseKey of cases) {
    const result = await runTest(caseKey);
    if (result?.success) passed++;
    else failed++;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n📊 总结果: ${passed} 通过, ${failed} 失败 (共 ${cases.length})`);
}

if (typeof window !== 'undefined') {
  (window as any).__aiTest = {
    quick: runQuickTest,
    run: runTest,
    runAll: runAllTests,
    cases: TEST_CASES,
    projectAdapter,
    toolSystem,
    videoExporter,
  };
  console.log('💡 AI测试工具已就绪！在控制台中运行:');
  console.log('  __aiTest.quick()       - 快速模拟测试（不需要API）');
  console.log('  __aiTest.run()         - 运行默认产品宣传测试（需要API）');
  console.log('  __aiTest.runAll()      - 运行所有测试用例（需要API）');
  console.log('  __aiTest.run("节日祝福") - 运行指定测试');
  console.log('  __aiTest.cases          - 查看所有可用测试用例');
}
