import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
import json
from main import app

def test_websocket_connection():
    """
    Test WebSocket connection and basic message exchange
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Check if we receive the connection confirmation
        data = websocket.receive_json()
        assert data["status"] == "connected"
        assert "session_id" in data

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

def test_websocket_cleanup():
    """
    Test that resources are cleaned up after disconnection
    """
    with TestClient(app).websocket_connect("/ws/audio") as websocket:
        # Skip the initial connection message
        data = websocket.receive_json()
        session_id = data["session_id"]
        
        # Send a dummy audio chunk
        dummy_chunk = bytes([0] * 1024)
        websocket.send_bytes(dummy_chunk)
        websocket.receive_json()  # Skip acknowledgment
        
    # After the context manager exits, the connection should be closed
    # and temporary files should be cleaned up
    temp_file = Path(Path.cwd()) / "temp" / f"{session_id}.wav"
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
        
        # Send chunks to both connections
        dummy_chunk = bytes([0] * 1024)
        
        ws1.send_bytes(dummy_chunk)
        ws2.send_bytes(dummy_chunk)
        
        # Verify both receive acknowledgments
        assert ws1.receive_json()["status"] == "chunk_received"
        assert ws2.receive_json()["status"] == "chunk_received" 