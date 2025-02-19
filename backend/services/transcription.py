import whisper
import logging
from pathlib import Path
import torch
from typing import Dict, Any, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self):
        self.model = None
        self.executor = ThreadPoolExecutor(max_workers=1)
        self._load_model()

    def _load_model(self) -> None:
        """
        Load the Whisper model. Using 'base' model for balance of accuracy and speed.
        """
        try:
            logger.info("Loading Whisper model...")
            self.model = whisper.load_model("base")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            raise

    async def transcribe_audio(self, audio_path: Path) -> Dict[str, Any]:
        """
        Transcribe audio file using Whisper model.
        
        Args:
            audio_path (Path): Path to the audio file
            
        Returns:
            Dict[str, Any]: Transcription result with word-level timestamps
        """
        try:
            if not audio_path.exists():
                raise FileNotFoundError(f"Audio file not found: {audio_path}")

            # Run transcription in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._transcribe_sync,
                str(audio_path)
            )

            return {
                "text": result["text"],
                "segments": result["segments"],
                "language": result["language"]
            }

        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            raise

    def _transcribe_sync(self, audio_path: str) -> Dict[str, Any]:
        """
        Synchronous transcription function to be run in thread pool.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            Dict[str, Any]: Raw transcription result
        """
        try:
            # Transcribe with word-level timestamps
            result = self.model.transcribe(
                audio_path,
                word_timestamps=True,
                language="en"
            )
            return result
        except Exception as e:
            logger.error(f"Error in synchronous transcription: {e}")
            raise

# Create a global instance of the transcription service
transcription_service = TranscriptionService() 