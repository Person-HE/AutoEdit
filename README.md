# NanoEdit Pro (AutoEdit)

**A browser video editor with a ReAct AI director. Timeline, presets, keyframes and export — no upload, no server round-trip.**

[![Live demo](https://img.shields.io/badge/Live%20demo-nanoedit--pro.pages.dev-2f7cf6?style=flat-square)](https://nanoedit-pro.pages.dev)
![Tests](https://img.shields.io/badge/tests-Jest-brightgreen?style=flat-square)
![Presets](https://img.shields.io/badge/presets-95-1a7f37?style=flat-square)
![Framework](https://img.shields.io/badge/React%2019%20%C2%B7%20Vite%206-blueviolet?style=flat-square)

Multi-track timeline editing that runs client-side: 95 animated presets, 9 transitions, per-property keyframes, a WebAudio graph, MediaPipe segmentation for cut-out work, and an **AI Director** that plans a video from a one-line brief by calling its own tools.

**→ [nanoedit-pro.pages.dev](https://nanoedit-pro.pages.dev)**

## The two halves

**Editor** — tracks, clips, transforms, opacity/scale/position keyframes, text, stickers, LUT grading, spatial curves, audio gain and fades. State lives in `Dexie`/IndexedDB, so a project survives a refresh without an account.

**AI Director** — a ReAct loop over a tool registry (`analyze topic → write copy → build shot list → place presets → time to audio → render`). It is agent-directed rather than prompt-to-magic: every step is an inspectable tool call against the same project model the manual UI edits, so you can open the timeline after a director run and see what it actually did.

## Measured, not claimed

`npm run metrics` rebuilds, runs the test suite, walks the output and writes `docs/metrics.json` — including the machine the numbers came from.

| Metric | Value |
| --- | --- |
| Clean build | 7.7 s |
| Jest suite results | 71 passed · 4 skipped · 75 total · 0 failed (6 suites, 32.1 s) |
| Presets / template files | 95 / 28 (`node scripts/count-assets.mjs`) |
| Build output | 8 files · 34.93 MB raw · 20.33 MB gzip |
| Application JS | 911 KB raw (rest is MediaPipe models) |
| Source | 314 files · 43,616 lines |
| Direct dependencies | 30 |

Live behaviour, cold cache, real browser, deployed site:

| Metric | Value |
| --- | --- |
| TTFB | 868 ms |
| `load` event | 2.33 s |
| First-page transfer | ~269 KB |

## Try it in the browser

The hosted build is fully client-side and ships a **mock AI mode**, so the director loop is explorable without any key. To drive it with a real model, open the AI settings panel and point it at any OpenAI-compatible endpoint with your own key — nothing is sent to this project's author, because there is no such server.

Two things cannot work in a hosted, browser-only deployment, by design:

- **Local FFmpeg export.** The frame-accurate MP4 path spawns Puppeteer + FFmpeg on Node. In the browser, export produces the web formats available in-page.
- **The `/api/nvidia` and ComfyUI proxies.** Those are Vite dev-server proxies to a local ComfyUI on `127.0.0.1:7860`; a static host has nowhere to forward them.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173 — dev server also proxies local ComfyUI
npm test           # Jest (ts-jest ESM + jsdom)
npm run build
npm run metrics    # docs/metrics.json + docs/metrics.md
```

For local rendering, export API keys through the environment rather than editing
them into scripts: `AGNES_API_KEY` for the helper scripts under `scripts/`, and the
in-app AI settings panel for editor/director usage.

## Layout

```
src/
  engine/          timeline, keyframes, mask/segmentation, template + preset system
  modules/ai-director/   ReAct loop, tool registry, AI service
  components/      timeline UI, overlays, export modal
  __tests__/       Jest suites (integration, placement, grading, store, keyframes)
scripts/           asset counters, local render helpers, metrics collector
public/mediapipe/  segmentation models + wasm
```

Design docs (Chinese) are in the repo root and are worth reading before extending the
preset or template system: `PRESET_DEVELOPMENT_GUIDE.md`, `TEMPLATE_DEVELOPMENT_GUIDE.md`,
`AI_DIRECTOR_DEVELOPMENT_GUIDE.md`.

## Honest gaps

- **34.93 MB of build output**, 33.6 MB of which is MediaPipe models and WASM. First paint is fast; segmentation is not, until cached.
- **Coverage is unknown.** Jest runs with no coverage instrumentation configured, so no percentage is claimed here. Four FFmpeg-dependent cases are skipped by design.
- **UI is Chinese-first.**
- The deployed site is a single-page bundle with no code-splitting of the model assets.

## 中文说明

NanoEdit Pro（仓库名 AutoEdit）是一个**纯浏览器端**的视频编辑器：多轨时间线、95 个动效预设、9 种转场、逐属性关键帧、WebAudio、MediaPipe 抠像，以及一个基于 ReAct 的 **AI 导演**——它把"一句话需求"拆解为选题分析 → 文案 → 分镜 → 预设摆放 → 音画对齐 → 渲染的可检查步骤，每一步都是与手工编辑完全相同的工具调用。

- 在线体验：<https://nanoedit-pro.pages.dev>（内置 mock 模式，无需任何 key 即可观察导演流程；接入真实模型请在应用内 AI 设置里填你自己的端点与密钥）
- 本地 FFmpeg 精确导出、ComfyUI 代理仅在本机 Node 环境可用，静态托管下不可用。
- 数据复现：`npm run metrics`，结果与采集机器写入 `docs/metrics.json`。
- 安全提醒：任何 API key 只应通过 `AGNES_API_KEY` 环境变量或应用内设置注入。本仓库历史中的明文密钥已于 2026-09-19 清除，**请务必在服务商后台吊销旧密钥**——GitHub 仍可能通过旧 commit SHA 访问到它们。

## License

All rights reserved.
