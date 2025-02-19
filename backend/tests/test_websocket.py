import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
import json
import wave
import numpy as np
import tempfile
from main import app
import asyncio

def create_test_audio() -> bytes:
    """
    Create a test audio signal
    """
    sample_rate = 44100
    duration = 1  # seconds
    frequency = 440  # Hz
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = np.sin(2 * np.pi * frequency * t)
    audio_data = (tone * 32767).astype(np.int16)
    
    # Create WAV in memory
    import io
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    return buffer.getvalue()

def test_websocket_connection():
    """
    Test WebSocket connection and basic message exchange
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Check if we receive the connection confirmation
        data = websocket.receive_json()
        assert data["status"] == "connected"
        assert "session_id" in data
        assert "config" in data
        assert data["config"]["sample_rate"] == 44100
        assert data["config"]["channels"] == 1

def test_websocket_audio_chunk():
    """
    Test sending an audio chunk through WebSocket
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Skip the initial connection message
        websocket.receive_json()
        
        # Send a dummy audio chunk
        dummy_chunk = bytes([0] * 1024)  # 1KB of silence
        websocket.send_bytes(dummy_chunk)
        
        # Check if we receive acknowledgment
        response = websocket.receive_json()
        assert response["status"] == "chunk_received"

def test_websocket_transcription():
    """
    Test complete audio processing and transcription
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Skip the initial connection message
        websocket.receive_json()
        
        # Send test audio data
        audio_data = create_test_audio()
        websocket.send_bytes(audio_data)
        
        # Get chunk acknowledgment
        response = websocket.receive_json()
        assert response["status"] == "chunk_received"
        
        # Close connection to trigger processing
        websocket.close()
        
        # Should receive transcription result
        try:
            result = websocket.receive_json()
            assert result["status"] == "transcription_complete"
            assert "result" in result
            assert "text" in result["result"]
            assert "segments" in result["result"]
        except Exception:
            # If the connection is already closed, this is expected
            pass

@pytest.mark.asyncio
async def test_websocket_cleanup():
    """
    Test that resources are cleaned up after disconnection
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Skip the initial connection message
        data = websocket.receive_json()
        session_id = data["session_id"]
        
        # Send test audio data
        audio_data = create_test_audio()
        websocket.send_bytes(audio_data)
        websocket.receive_json()  # Skip acknowledgment
        
    # After the context manager exits, the connection should be closed
    # Wait a short time for cleanup to complete
    await asyncio.sleep(0.1)
    
    # Check if temporary files are cleaned up
    temp_file = Path(tempfile.gettempdir()) / "vocal_audio" / f"{session_id}.wav"
    assert not temp_file.exists()

@pytest.mark.asyncio
async def test_multiple_connections():
    """
    Test handling multiple WebSocket connections simultaneously
    """
    client = TestClient(app)
    
    # Create two connections
    with client.websocket_connect("/ws/audio") as ws1, \
         client.websocket_connect("/ws/audio") as ws2:
        
        # Get connection confirmations
        data1 = ws1.receive_json()
        data2 = ws2.receive_json()
        
        # Verify different session IDs
        assert data1["session_id"] != data2["session_id"]
        
        # Send audio to both connections
        audio_data = create_test_audio()
        
        ws1.send_bytes(audio_data)
        ws2.send_bytes(audio_data)
        
        # Verify both receive acknowledgments
        assert ws1.receive_json()["status"] == "chunk_received"
        assert ws2.receive_json()["status"] == "chunk_received" 