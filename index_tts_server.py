"""
Index-TTS Backend Service
提供文本转语音 API 接口，代理到 IndexTTS api_server.py
支持参考音频文件上传
"""

import os
import sys
import time
import uuid
import requests
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

DEFAULT_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_audio")
os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)

INDEX_TTS_API_URL = os.environ.get("INDEX_TTS_API_URL", "http://127.0.0.1:8080")

app = FastAPI(title="Index-TTS Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TTSResponse(BaseModel):
    success: bool
    message: str
    audioUrl: Optional[str] = None
    filePath: Optional[str] = None
    duration: Optional[float] = None


def get_audio_duration(filepath: str) -> float:
    try:
        import wave
        with wave.open(filepath, 'rb') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            return frames / float(rate)
    except Exception:
        pass

    try:
        from mutagen.wave import WAVE
        audio = WAVE(filepath)
        return audio.info.length
    except Exception:
        pass

    try:
        import struct
        with open(filepath, 'rb') as f:
            f.seek(28)
            data = f.read(4)
            if len(data) < 4:
                return 0
            sample_rate = struct.unpack('<I', data)[0]
            f.seek(40)
            data = f.read(4)
            if len(data) < 4:
                return 0
            data_size = struct.unpack('<I', data)[0]
            if sample_rate <= 0:
                return 0
            num_channels = 1
            bits_per_sample = 16
            byte_rate = sample_rate * num_channels * bits_per_sample // 8
            if byte_rate <= 0:
                return 0
            return data_size / byte_rate
    except Exception as e:
        print(f"Failed to calculate audio duration: {e}")
        return 0


@app.post("/api/tts/generate", response_model=TTSResponse)
async def generate_tts(
    text: str = Form(..., description="要合成的文本"),
    prompt_audio: UploadFile = File(..., description="音色参考音频文件"),
    emo_alpha: float = Form(default=1.0, description="情感权重(0.0~1.0)"),
    max_text_tokens_per_segment: int = Form(default=120, description="分句最大Token数"),
    do_sample: bool = Form(default=True, description="是否采样"),
    top_p: float = Form(default=0.8, description="top_p"),
    top_k: int = Form(default=30, description="top_k"),
    temperature: float = Form(default=0.8, description="temperature"),
    length_penalty: float = Form(default=0.0, description="length_penalty"),
    num_beams: int = Form(default=3, description="num_beams"),
    repetition_penalty: float = Form(default=10.0, description="repetition_penalty"),
    max_mel_tokens: int = Form(default=1500, description="max_mel_tokens"),
):
    try:
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        prompt_bytes = await prompt_audio.read()
        if not prompt_bytes:
            raise HTTPException(status_code=400, detail="Reference audio file is required")

        file_id = str(uuid.uuid4())
        timestamp = int(time.time())
        filename = f"tts_{timestamp}_{file_id}.wav"
        output_path = os.path.join(DEFAULT_OUTPUT_DIR, filename)

        files = {
            'prompt_audio': (prompt_audio.filename or 'prompt.wav', prompt_bytes, prompt_audio.content_type or 'audio/wav'),
        }
        data = {
            'text': text,
            'emo_alpha': str(emo_alpha),
            'max_text_tokens_per_segment': str(max_text_tokens_per_segment),
            'do_sample': str(do_sample),
            'top_p': str(top_p),
            'top_k': str(top_k),
            'temperature': str(temperature),
            'length_penalty': str(length_penalty),
            'num_beams': str(num_beams),
            'repetition_penalty': str(repetition_penalty),
            'max_mel_tokens': str(max_mel_tokens),
        }

        print(f"Calling IndexTTS API: {INDEX_TTS_API_URL}/tts")
        print(f"Text: {text[:50]}...")
        print(f"Prompt audio: {prompt_audio.filename}, size: {len(prompt_bytes)} bytes")

        response = requests.post(
            f"{INDEX_TTS_API_URL}/tts",
            files=files,
            data=data,
            timeout=120,
        )

        if response.status_code != 200:
            error_msg = f"IndexTTS API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg = f"IndexTTS API error: {error_detail.get('detail', response.text)}"
            except Exception:
                error_msg = f"IndexTTS API error: {response.status_code} - {response.text[:200]}"
            print(error_msg)
            raise HTTPException(status_code=502, detail=error_msg)

        with open(output_path, 'wb') as f:
            f.write(response.content)

        duration = get_audio_duration(output_path)
        if duration <= 0:
            char_count = len(text.strip())
            duration = max(1.0, (char_count / 4))

        print(f"Audio generated: {filename}, duration: {duration:.2f}s")

        return TTSResponse(
            success=True,
            message="Audio generated successfully",
            audioUrl=f"/api/tts/audio/{filename}",
            filePath=output_path,
            duration=duration,
        )

    except HTTPException:
        raise
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="无法连接到 IndexTTS API 服务，请确保已启动 api_server.py (python api_server.py --port 8080)"
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="IndexTTS API 请求超时")
    except Exception as e:
        print(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts/generate_with_file", response_model=TTSResponse)
async def generate_tts_with_file(
    text: str = Form(..., description="要合成的文本"),
    prompt_audio_path: str = Form(..., description="音色参考音频文件路径(服务器本地路径)"),
    emo_alpha: float = Form(default=1.0, description="情感权重(0.0~1.0)"),
    max_text_tokens_per_segment: int = Form(default=120, description="分句最大Token数"),
    do_sample: bool = Form(default=True, description="是否采样"),
    top_p: float = Form(default=0.8, description="top_p"),
    top_k: int = Form(default=30, description="top_k"),
    temperature: float = Form(default=0.8, description="temperature"),
    length_penalty: float = Form(default=0.0, description="length_penalty"),
    num_beams: int = Form(default=3, description="num_beams"),
    repetition_penalty: float = Form(default=10.0, description="repetition_penalty"),
    max_mel_tokens: int = Form(default=1500, description="max_mel_tokens"),
):
    try:
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        if not os.path.exists(prompt_audio_path):
            raise HTTPException(status_code=400, detail=f"Reference audio file not found: {prompt_audio_path}")

        file_id = str(uuid.uuid4())
        timestamp = int(time.time())
        filename = f"tts_{timestamp}_{file_id}.wav"
        output_path = os.path.join(DEFAULT_OUTPUT_DIR, filename)

        with open(prompt_audio_path, 'rb') as f:
            prompt_bytes = f.read()

        files = {
            'prompt_audio': (os.path.basename(prompt_audio_path), prompt_bytes, 'audio/wav'),
        }
        data = {
            'text': text,
            'emo_alpha': str(emo_alpha),
            'max_text_tokens_per_segment': str(max_text_tokens_per_segment),
            'do_sample': str(do_sample),
            'top_p': str(top_p),
            'top_k': str(top_k),
            'temperature': str(temperature),
            'length_penalty': str(length_penalty),
            'num_beams': str(num_beams),
            'repetition_penalty': str(repetition_penalty),
            'max_mel_tokens': str(max_mel_tokens),
        }

        print(f"Calling IndexTTS API with file path: {prompt_audio_path}")

        response = requests.post(
            f"{INDEX_TTS_API_URL}/tts",
            files=files,
            data=data,
            timeout=120,
        )

        if response.status_code != 200:
            error_msg = f"IndexTTS API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg = f"IndexTTS API error: {error_detail.get('detail', response.text)}"
            except Exception:
                error_msg = f"IndexTTS API error: {response.status_code} - {response.text[:200]}"
            raise HTTPException(status_code=502, detail=error_msg)

        with open(output_path, 'wb') as f:
            f.write(response.content)

        duration = get_audio_duration(output_path)
        if duration <= 0:
            char_count = len(text.strip())
            duration = max(1.0, (char_count / 4))

        return TTSResponse(
            success=True,
            message="Audio generated successfully",
            audioUrl=f"/api/tts/audio/{filename}",
            filePath=output_path,
            duration=duration,
        )

    except HTTPException:
        raise
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="无法连接到 IndexTTS API 服务，请确保已启动 api_server.py"
        )
    except Exception as e:
        print(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts/upload_reference")
async def upload_reference_audio(audio: UploadFile = File(..., description="参考音频文件")):
    try:
        ref_dir = os.path.join(DEFAULT_OUTPUT_DIR, "references")
        os.makedirs(ref_dir, exist_ok=True)

        file_id = str(uuid.uuid4())
        timestamp = int(time.time())
        original_name = audio.filename or "reference.wav"
        ext = os.path.splitext(original_name)[1] or ".wav"
        filename = f"ref_{timestamp}_{file_id}{ext}"
        filepath = os.path.join(ref_dir, filename)

        content = await audio.read()
        with open(filepath, 'wb') as f:
            f.write(content)

        duration = get_audio_duration(filepath)

        return {
            "success": True,
            "message": "Reference audio uploaded",
            "filename": filename,
            "filePath": filepath,
            "audioUrl": f"/api/tts/audio/references/{filename}",
            "duration": duration,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tts/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(DEFAULT_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)


@app.get("/api/tts/audio/references/{filename}")
async def get_reference_audio(filename: str):
    ref_dir = os.path.join(DEFAULT_OUTPUT_DIR, "references")
    file_path = os.path.join(ref_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Reference audio file not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)


@app.get("/health")
async def health_check():
    index_tts_healthy = False
    try:
        response = requests.get(f"{INDEX_TTS_API_URL}/health", timeout=5)
        index_tts_healthy = response.status_code == 200
    except Exception:
        pass

    return {
        "status": "healthy" if index_tts_healthy else "degraded",
        "service": "Index-TTS Proxy",
        "version": "2.0.0",
        "index_tts_connected": index_tts_healthy,
        "index_tts_url": INDEX_TTS_API_URL,
    }


if __name__ == "__main__":
    print(f"Starting Index-TTS Proxy Server...")
    print(f"Audio output directory: {DEFAULT_OUTPUT_DIR}")
    print(f"IndexTTS API URL: {INDEX_TTS_API_URL}")
    print(f"API Documentation: http://localhost:8001/docs")

    uvicorn.run(app, host="0.0.0.0", port=8001)
