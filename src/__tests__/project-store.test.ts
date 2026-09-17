/**
 * useProjectStore 核心操作测试：撤销/重做、分割、波纹删除、防重叠落位。
 * 直接驱动 zustand store（jsdom 环境，localStorage 可用）。
 */
import { useProjectStore } from '../store/useProjectStore';
import type { Project, Clip, Asset } from '../types/core';

function makeClip(id: string, start: number, dur: number, trackId = 'track_v1', extra: Partial<Clip> = {}): Clip {
  return {
    id,
    assetId: 'asset-1',
    trackId,
    type: 'video',
    startTime: start,
    duration: dur,
    offset: 0,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    style: { opacity: 1, zIndex: 0 },
    effects: [],
    name: id,
    ...extra,
  };
}

function seedProject(clips: Clip[]): void {
  const project: Project = {
    id: 'p1',
    name: 'test',
    width: 1920,
    height: 1080,
    duration: 120,
    fps: 30,
    tracks: [
      { id: 'track_v1', type: 'video', name: 'V1', visible: true, locked: false },
      { id: 'track_v2', type: 'video', name: 'V2', visible: true, locked: false },
    ],
    clips: Object.fromEntries(clips.map(c => [c.id, c])),
    lastModified: Date.now(),
  };
  useProjectStore.setState({ project, past: [], future: [], copiedClip: null });
}

const get = () => useProjectStore.getState();

describe('撤销/重做', () => {
  beforeEach(() => seedProject([makeClip('a', 0, 4)]));

  it('removeClip 产生一步历史并可撤销恢复', () => {
    get().removeClip('a');
    expect(Object.keys(get().project.clips)).toHaveLength(0);
    expect(get().past).toHaveLength(1);

    get().undo();
    expect(get().project.clips['a']).toBeTruthy();
    expect(get().future).toHaveLength(1);

    get().redo();
    expect(get().project.clips['a']).toBeUndefined();
  });

  it('连续操作入栈、新操作清空 future', () => {
    get().markHistory();
    useProjectStore.setState(s => ({ project: { ...s.project } }));
    get().removeClip('a');
    get().undo();
    expect(get().project.clips['a']).toBeTruthy();
    expect(get().future.length).toBeGreaterThan(0);

    get().duplicateClip('a');
    expect(get().future).toHaveLength(0);
    expect(Object.keys(get().project.clips)).toHaveLength(2); // 原 a + 副本
  });

  it('undo 空栈安全', () => {
    const before = get().project;
    get().undo();
    expect(get().project).toBe(before);
  });
});

describe('moveClip 防重叠让位', () => {
  beforeEach(() => seedProject([
    makeClip('a', 0, 4),
    makeClip('b', 6, 4),
  ]));

  it('拖到占用区时贴到最近合法位置', () => {
    // 自身不计占用：wanted=5 与 b[6,10] 冲突，左空隙 [a原位被排除后 0..6] 内可放 2(dist3)，
    // 右侧需 10(dist5) → 最近为 2
    expect(get().moveClip('a', 'track_v1', 5)).toBe(true);
    expect(get().project.clips['a'].startTime).toBe(2);
  });

  it('轨道类型不兼容拒绝移动', () => {
    useProjectStore.setState(s => ({
      project: { ...s.project, tracks: [...s.project.tracks, { id: 'track_a1', type: 'audio' as const, name: 'A1', visible: true, locked: false }] },
    }));
    expect(get().moveClip('a', 'track_a1', 20)).toBe(false);
  });
});

describe('splitAtTime 分割', () => {
  beforeEach(() => seedProject([
    makeClip('a', 0, 4, 'track_v1', { effects: [{ id: 'e1', presetId: 'entrance_fade_in', type: 'entrance', name: 'fadeIn', duration: 1, params: {} }] }),
    makeClip('b', 1, 4, 'track_v2'),
  ]));

  it('全量分割：所有跨线片段一分为二且位置正确', () => {
    const n = get().splitAtTime(2);
    expect(n).toBe(2);
    const clips = Object.values(get().project.clips);
    expect(clips).toHaveLength(4);

    const part1 = clips.find(c => c.name.startsWith('a ('));
    const aParts = clips.filter(c => c.name === 'a (1)' || c.name === 'a (2)');
    expect(aParts).toHaveLength(2);
    const aHead = aParts.find(c => c.startTime === 0)!;
    const aTail = aParts.find(c => c.startTime === 2)!;
    expect(aHead.duration).toBe(2);
    expect(aTail.offset).toBe(2);
    // 入场效果只留在前半段
    expect(aHead.effects?.length).toBe(1);
    expect(aTail.effects?.[0].duration ?? 0).toBe(0);
  });

  it('线在片段边界外时不产生变更也不写历史', () => {
    const pastBefore = get().past.length;
    expect(get().splitAtTime(-1)).toBe(0);
    expect(get().splitAtTime(100)).toBe(0);
    expect(get().past.length).toBe(pastBefore);
  });
});

describe('rippleDeleteClip 波纹删除', () => {
  beforeEach(() => seedProject([
    makeClip('a', 0, 3),
    makeClip('b', 4, 3),
    makeClip('c', 8, 2),
  ]));

  it('删除中间片段后右侧补位前移', () => {
    get().rippleDeleteClip('b');
    const clips = get().project.clips;
    expect(clips['b']).toBeUndefined();
    expect(clips['c'].startTime).toBe(5); // 8 - 3
    expect(clips['a'].startTime).toBe(0); // 不动
  });

  it('级联删除文本与其配音', () => {
    seedProject([
      makeClip('t1', 0, 3, 'track_v1', { type: 'text', voiceOver: { audioSource: 'x', audioDuration: 3, voice: '', speed: 1, generatedAt: 0, linkedClipId: 'au1' } } as unknown as Clip),
      makeClip('au1', 0, 3, 'track_a1', { type: 'audio' }),
      makeClip('d', 5, 2),
    ]);
    useProjectStore.setState(s => ({
      project: { ...s.project, tracks: [...s.project.tracks, { id: 'track_a1', type: 'audio' as const, name: 'A1', visible: true, locked: false }] },
    }));
    get().rippleDeleteClip('t1');
    const clips = get().project.clips;
    expect(clips['t1']).toBeUndefined();
    expect(clips['au1']).toBeUndefined();
    // 配音在不同轨道不计入位移；同轨被删总时长 = t1 的 3s → d 从 5 前移到 2
    expect(clips['d'].startTime).toBe(2);
  });
});

describe('pasteClip / duplicateClip 落位', () => {
  beforeEach(() => seedProject([makeClip('a', 0, 4)]));

  it('复制后在原片段之后创建副本（无冲突）', () => {
    get().copyClip('a');
    expect(get().duplicateClip('a')).toBe(true);
    const copies = Object.values(get().project.clips).filter(c => c.id !== 'a');
    expect(copies).toHaveLength(1);
    expect(copies[0].startTime).toBe(4);
  });

  it('粘贴到占用点自动找空位', () => {
    get().copyClip('a');
    // 在 0 处粘贴 → 与 a 冲突 → 让位到 4
    expect(get().pasteClip('track_v1', 0)).toBe(true);
    const copy = Object.values(get().project.clips).find(c => c.name.includes('Copy'))!;
    expect(copy.startTime).toBe(4);
  });
});
