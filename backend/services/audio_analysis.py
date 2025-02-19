import librosa
import numpy as np
from pydub import AudioSegment
from pathlib import Path
import logging
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)

class AudioAnalyzer:
    def __init__(self):
        """Initialize the audio analyzer with default parameters"""
        self.min_pitch = 50  # Hz
        self.max_pitch = 500  # Hz
        
    async def analyze_audio(self, audio_path: Path) -> Dict[str, Any]:
        """
        Analyze audio file to extract vocal features
        
        Args:
            audio_path (Path): Path to the audio file
            
        Returns:
            Dict[str, Any]: Dictionary containing audio metrics
        """
        try:
            # Load audio file using librosa
            y, sr = librosa.load(str(audio_path), sr=None)
            
            # Extract features
            pitch_data = self._extract_pitch(y, sr)
            volume_data = self._extract_volume(y)
            spectral_data = self._extract_spectral_features(y, sr)
            
            return {
                "pitch_metrics": pitch_data,
                "volume_metrics": volume_data,
                "spectral_metrics": spectral_data,
                "sample_rate": sr
            }
            
        except Exception as e:
            logger.error(f"Error analyzing audio: {e}")
            raise

    def _extract_pitch(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract pitch-related features"""
        # Extract pitch using librosa's pitch tracking
        pitches, magnitudes = librosa.piptrack(
            y=y, 
            sr=sr,
            fmin=self.min_pitch,
            fmax=self.max_pitch
        )
        
        # Calculate pitch statistics
        pitch_values = pitches[magnitudes > np.max(magnitudes) * 0.1]
        if len(pitch_values) > 0:
            avg_pitch = float(np.mean(pitch_values))
            pitch_std = float(np.std(pitch_values))
            pitch_range = float(np.ptp(pitch_values))
        else:
            avg_pitch = 0.0
            pitch_std = 0.0
            pitch_range = 0.0
            
        return {
            "average_pitch": avg_pitch,
            "pitch_variability": pitch_std,
            "pitch_range": pitch_range
        }

    def _extract_volume(self, y: np.ndarray) -> Dict[str, float]:
        """Extract volume-related features"""
        # Calculate RMS energy
        rms = librosa.feature.rms(y=y)[0]
        
        # Calculate volume metrics
        avg_volume = float(np.mean(rms))
        volume_std = float(np.std(rms))
        volume_range = float(np.ptp(rms))
        
        return {
            "average_volume": avg_volume,
            "volume_stability": volume_std,
            "volume_range": volume_range
        }

    def _extract_spectral_features(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract spectral features"""
        # Spectral centroid (brightness)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        
        # Spectral rolloff (high-frequency content)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        
        # Spectral bandwidth
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        
        return {
            "spectral_centroid": float(np.mean(centroid)),
            "spectral_rolloff": float(np.mean(rolloff)),
            "spectral_bandwidth": float(np.mean(bandwidth))
        }

# Create a global instance
audio_analyzer = AudioAnalyzer() 