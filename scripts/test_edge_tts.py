import asyncio
import edge_tts
import sys

async def main():
    text = sys.argv[1] if len(sys.argv) > 1 else "你好"
    output = sys.argv[2] if len(sys.argv) > 2 else "test.mp3"
    rate = sys.argv[3] if len(sys.argv) > 3 else "+60%"
    voice = "zh-CN-XiaoxiaoNeural"
    tts = edge_tts.Communicate(text, voice=voice, rate=rate)
    await tts.save(output)
    print(f"saved {output}")

asyncio.run(main())
