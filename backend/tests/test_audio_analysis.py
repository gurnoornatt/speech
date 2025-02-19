import sys
from pathlib import Path
import pytest
import numpy as np
import wave
import tempfile
from services.audio_analysis import audio_analyzer

def create_test_audio_file() -> Path:
    """Create a test audio file with known characteristics"""
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
    
    return temp_file

@pytest.fixture
def test_audio_file():
    """Fixture to create and cleanup test audio file"""
    file_path = create_test_audio_file()
    yield file_path
    # Cleanup
    if file_path.exists():
        file_path.unlink()

@pytest.mark.asyncio
async def test_audio_analysis(test_audio_file):
    """Test audio analysis with a known test tone"""
    result = await audio_analyzer.analyze_audio(test_audio_file)
    
    # Check structure of the result
    assert "pitch_metrics" in result
    assert "volume_metrics" in result
    assert "spectral_metrics" in result
    assert "sample_rate" in result
    
    # Check pitch metrics (should be close to 440 Hz)
    pitch_metrics = result["pitch_metrics"]
    assert abs(pitch_metrics["average_pitch"] - 440) < 50  # Allow some tolerance
    assert "pitch_variability" in pitch_metrics
    assert "pitch_range" in pitch_metrics
    
    # Check volume metrics
    volume_metrics = result["volume_metrics"]
    assert "average_volume" in volume_metrics
    assert "volume_stability" in volume_metrics
    assert "volume_range" in volume_metrics
    assert volume_metrics["average_volume"] > 0
    
    # Check spectral metrics
    spectral_metrics = result["spectral_metrics"]
    assert "spectral_centroid" in spectral_metrics
    assert "spectral_rolloff" in spectral_metrics
    assert "spectral_bandwidth" in spectral_metrics
    assert spectral_metrics["spectral_centroid"] > 0

@pytest.mark.asyncio
async def test_audio_analysis_with_silence(tmp_path):
    """Test audio analysis with silence"""
    # Create silent audio
    silence_path = tmp_path / "silence.wav"
    sample_rate = 44100
    duration = 1  # second
    silence = np.zeros(sample_rate * duration, dtype=np.int16)
    
    with wave.open(str(silence_path), 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(silence.tobytes())
    
    result = await audio_analyzer.analyze_audio(silence_path)
    
    # Check that metrics are present but close to zero
    assert result["volume_metrics"]["average_volume"] < 0.01
    assert result["pitch_metrics"]["average_pitch"] == 0

@pytest.mark.asyncio
async def test_audio_analysis_nonexistent_file():
    """Test error handling for non-existent files"""
    with pytest.raises(Exception):
        await audio_analyzer.analyze_audio(Path("nonexistent.wav"))

@pytest.mark.asyncio
async def test_audio_analysis_invalid_file(tmp_path):
    """Test error handling for invalid audio files"""
    invalid_file = tmp_path / "invalid.wav"
    invalid_file.write_text("This is not a WAV file")
    
    with pytest.raises(Exception):
        await audio_analyzer.analyze_audio(invalid_file) 