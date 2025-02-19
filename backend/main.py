from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Set
import asyncio
import uuid
import os
from pathlib import Path
import wave
import tempfile
from services.transcription import transcription_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="Vocal Backend",
    description="Backend API for Vocal - AI-powered speech therapy assistant",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a set to store active WebSocket connections
active_connections: Set[WebSocket] = set()

# Create temporary directory for audio files if it doesn't exist
TEMP_DIR = Path(tempfile.gettempdir()) / "vocal_audio"
TEMP_DIR.mkdir(exist_ok=True)

class AudioBuffer:
    def __init__(self):
        self.chunks = []
        self.id = str(uuid.uuid4())
        self.temp_file = TEMP_DIR / f"{self.id}.wav"

    async def add_chunk(self, chunk: bytes):
        """Add a chunk of audio data to the buffer"""
        self.chunks.append(chunk)

    async def save_to_wav(self, channels=1, sample_width=2, framerate=44100):
        """Save the buffered audio data to a WAV file"""
        try:
            with wave.open(str(self.temp_file), 'wb') as wav_file:
                wav_file.setnchannels(channels)
                wav_file.setsampwidth(sample_width)
                wav_file.setframerate(framerate)
                for chunk in self.chunks:
                    wav_file.writeframes(chunk)
            return self.temp_file
        except Exception as e:
            logger.error(f"Error saving WAV file: {e}")
            raise

    async def cleanup(self):
        """Clean up temporary files"""
        try:
            if self.temp_file.exists():
                self.temp_file.unlink()
        except Exception as e:
            logger.error(f"Error cleaning up temporary file: {e}")

async def process_audio(audio_path: Path) -> Dict:
    """
    Process audio file with transcription service
    
    Args:
        audio_path (Path): Path to the audio file
        
    Returns:
        Dict: Transcription result
    """
    try:
        result = await transcription_service.transcribe_audio(audio_path)
        return result
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        raise

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for receiving audio streams
    
    Args:
        websocket (WebSocket): The WebSocket connection
    """
    # Initialize audio buffer for this connection
    audio_buffer = AudioBuffer()
    
    try:
        # Accept the connection
        await websocket.accept()
        # Add to active connections set
        active_connections.add(websocket)
        logger.info(f"New WebSocket connection established. Active connections: {len(active_connections)}")

        # Send confirmation message
        await websocket.send_json({
            "status": "connected", 
            "session_id": audio_buffer.id,
            "config": {
                "sample_rate": 44100,
                "channels": 1,
                "sample_width": 2
            }
        })

        # Receive audio chunks
        while True:
            try:
                # Receive binary data (audio chunk)
                chunk = await websocket.receive_bytes()
                
                # Add chunk to buffer
                await audio_buffer.add_chunk(chunk)
                
                # Send acknowledgment
                await websocket.send_json({"status": "chunk_received"})
                
            except WebSocketDisconnect:
                logger.info("Client disconnected normally")
                break
            except Exception as e:
                logger.error(f"Error receiving audio chunk: {e}")
                await websocket.send_json({"status": "error", "message": str(e)})
                break

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in active_connections:
            await websocket.close(code=1001, reason="Server error")
    
    finally:
        # Clean up
        try:
            # Remove from active connections
            active_connections.discard(websocket)
            logger.info(f"Connection closed. Active connections: {len(active_connections)}")
            
            # Save the audio buffer to a WAV file
            if audio_buffer.chunks:
                await audio_buffer.save_to_wav()
                logger.info(f"Audio saved to {audio_buffer.temp_file}")
                
                # Process the audio file
                try:
                    transcription = await process_audio(audio_buffer.temp_file)
                    await websocket.send_json({
                        "status": "transcription_complete",
                        "result": transcription
                    })
                    # Clean up temporary files only after successful processing
                    await audio_buffer.cleanup()
                except Exception as e:
                    logger.error(f"Error processing audio: {e}")
                    await websocket.send_json({
                        "status": "error",
                        "message": "Error processing audio"
                    })
                    # Clean up on error as well
                    await audio_buffer.cleanup()
            
        except Exception as e:
            logger.error(f"Error in cleanup: {e}")

# Global exception handler for unexpected errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler to catch and log any unhandled exceptions
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred"}
    )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handler for HTTP exceptions with custom status codes
    """
    logger.warning(f"HTTP exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail}
    )

@app.get("/", response_model=Dict[str, str])
async def root() -> Dict[str, str]:
    """
    Root endpoint that returns a welcome message
    
    Returns:
        Dict[str, str]: A dictionary containing a welcome message
    """
    try:
        return {"message": "Hello from Vocal Backend"}
    except Exception as e:
        logger.error(f"Error in root endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint to verify API is running
    
    Returns:
        Dict[str, str]: A dictionary containing the API status
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 