import sys
from pathlib import Path
import pytest
import wave
import numpy as np
import tempfile
import json
from typing import Generator
import asyncio

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from services.transcription import TranscriptionService

@pytest.fixture
def temp_wav_file() -> Generator[Path, None, None]:
    """
    Create a temporary WAV file with a test tone
    """
    # Create a simple sine wave
    sample_rate = 44100
    duration = 2  # seconds
    frequency = 440  # Hz (A4 note)
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = np.sin(2 * np.pi * frequency * t)
    audio_data = (tone * 32767).astype(np.int16)
    
    # Create temporary file
    temp_dir = Path(tempfile.gettempdir()) / "test_audio"
    temp_dir.mkdir(exist_ok=True)
    temp_file = temp_dir / "test_tone.wav"
    
    # Write WAV file
    with wave.open(str(temp_file), 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    yield temp_file
    
    # Cleanup
    if temp_file.exists():
        temp_file.unlink()
    if temp_dir.exists():
        temp_dir.rmdir()

@pytest.fixture
def transcription_service() -> TranscriptionService:
    """
    Create a transcription service instance
    """
    return TranscriptionService()

@pytest.mark.asyncio
async def test_transcription_service_initialization(transcription_service: TranscriptionService):
    """
    Test that the transcription service initializes correctly
    """
    assert transcription_service.model is not None
    assert transcription_service.executor is not None

@pytest.mark.asyncio
async def test_transcription_with_valid_audio(
    transcription_service: TranscriptionService,
    temp_wav_file: Path
):
    """
    Test transcription with a valid audio file
    """
    result = await transcription_service.transcribe_audio(temp_wav_file)
    
    assert isinstance(result, dict)
    assert "text" in result
    assert "segments" in result
    assert "language" in result
    assert isinstance(result["segments"], list)

@pytest.mark.asyncio
async def test_transcription_with_nonexistent_file(transcription_service: TranscriptionService):
    """
    Test transcription with a non-existent file
    """
    with pytest.raises(FileNotFoundError):
        await transcription_service.transcribe_audio(Path("nonexistent.wav"))

@pytest.mark.asyncio
async def test_transcription_result_structure(
    transcription_service: TranscriptionService,
    temp_wav_file: Path
):
    """
    Test the structure of the transcription result
    """
    result = await transcription_service.transcribe_audio(temp_wav_file)
    
    # Verify result structure
    assert isinstance(result["text"], str)
    
    for segment in result["segments"]:
        assert "start" in segment
        assert "end" in segment
        assert "text" in segment
        assert isinstance(segment["start"], (int, float))
        assert isinstance(segment["end"], (int, float))
        assert isinstance(segment["text"], str)

@pytest.mark.asyncio
async def test_concurrent_transcriptions(
    transcription_service: TranscriptionService,
    temp_wav_file: Path
):
    """
    Test multiple concurrent transcription requests
    """
    # Create multiple concurrent transcription tasks
    tasks = [
        transcription_service.transcribe_audio(temp_wav_file)
        for _ in range(3)
    ]
    
    # Run tasks concurrently
    results = await asyncio.gather(*tasks)
    
    # Verify all results
    for result in results:
        assert isinstance(result, dict)
        assert "text" in result
        assert "segments" in result 