# WebSocket Integration Guide for Vocal

This document provides detailed instructions for implementing WebSocket connections in the Next.js frontend to communicate with the Vocal backend for real-time audio streaming.

## Table of Contents
1. [Connection Setup](#connection-setup)
2. [Audio Capture and Streaming](#audio-capture-and-streaming)
3. [Message Protocol](#message-protocol)
4. [Error Handling](#error-handling)
5. [Example Implementation](#example-implementation)

## Connection Setup

### Establishing a Connection

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketHookOptions {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: WebSocketHookOptions = {}) => {
  const {
    onMessage,
    onError,
    onClose,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const reconnectCount = useRef(0);

  const connect = () => {
    try {
      ws.current = new WebSocket('ws://localhost:8000/ws/audio');
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') {
          setSessionId(data.session_id);
        }
        onMessage?.(data);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setSessionId(null);
        onClose?.();

        // Attempt reconnection
        if (reconnectCount.current < reconnectAttempts) {
          setTimeout(() => {
            reconnectCount.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      onError?.(error);
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  return { isConnected, sessionId, disconnect };
};
```

## Audio Capture and Streaming

### Audio Configuration
```typescript
const AUDIO_CONFIG = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  chunkDuration: 100, // milliseconds
  maxMessageSize: 1048576, // 1MB (from backend config)
};
```

### Audio Capture Implementation
```typescript
// hooks/useAudioCapture.ts
import { useEffect, useRef } from 'react';

interface AudioCaptureOptions {
  onAudioChunk: (chunk: ArrayBuffer) => void;
  enabled: boolean;
}

export const useAudioCapture = ({ onAudioChunk, enabled }: AudioCaptureOptions) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioStream = useRef<MediaStream | null>(null);

  const startCapture = async () => {
    try {
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CONFIG.channels,
          sampleRate: AUDIO_CONFIG.sampleRate,
        },
        video: false,
      });

      mediaRecorder.current = new MediaRecorder(audioStream.current, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          onAudioChunk(arrayBuffer);
        }
      };

      // Start recording with the specified chunk duration
      mediaRecorder.current.start(AUDIO_CONFIG.chunkDuration);
    } catch (error) {
      console.error('Error starting audio capture:', error);
    }
  };

  const stopCapture = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (enabled) {
      startCapture();
    } else {
      stopCapture();
    }
    return () => stopCapture();
  }, [enabled]);

  return { isCapturing: enabled };
};
```

## Message Protocol

### Server Messages

1. **Connection Confirmation**
```json
{
  "status": "connected",
  "session_id": "uuid-string",
  "config": {
    "sample_rate": 44100,
    "channels": 1,
    "sample_width": 2,
    "max_message_size": 1048576
  }
}
```

2. **Chunk Acknowledgment**
```json
{
  "status": "chunk_received"
}
```

3. **Error Message**
```json
{
  "status": "error",
  "message": "error description"
}
```

### Client Messages

1. **Audio Chunks**
- Format: Binary WebM audio data
- Maximum size: 1MB per chunk
- Sample rate: 44.1kHz
- Channels: Mono (1 channel)
- Bits per sample: 16-bit

## Error Handling

### Reconnection Strategy
- Automatic reconnection attempts (default: 3 attempts)
- Exponential backoff between attempts
- Session recovery after reconnection

### Error Types and Handling

1. **Connection Errors**
```typescript
const handleConnectionError = (error: any) => {
  console.error('Connection error:', error);
  // Implement appropriate UI feedback
  // e.g., show reconnection status to user
};
```

2. **Audio Capture Errors**
```typescript
const handleAudioError = (error: any) => {
  if (error.name === 'NotAllowedError') {
    // Handle microphone permission denied
  } else if (error.name === 'NotFoundError') {
    // Handle no audio device available
  }
  // Implement appropriate UI feedback
};
```

## Example Implementation

### Complete Integration Example
```typescript
// components/AudioRecorder.tsx
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useState } from 'react';

export const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  
  const handleMessage = (data: any) => {
    if (data.status === 'error') {
      console.error('Server error:', data.message);
      // Handle error in UI
    }
  };

  const { isConnected, sessionId, disconnect } = useWebSocket({
    onMessage: handleMessage,
    onError: (error) => console.error('WebSocket error:', error),
    reconnectAttempts: 3,
  });

  const handleAudioChunk = (chunk: ArrayBuffer) => {
    if (isConnected && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(chunk);
    }
  };

  const { isCapturing } = useAudioCapture({
    onAudioChunk: handleAudioChunk,
    enabled: isRecording,
  });

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div>
      <button 
        onClick={toggleRecording}
        disabled={!isConnected}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Session ID: {sessionId || 'None'}</div>
      <div>Recording: {isCapturing ? 'Yes' : 'No'}</div>
    </div>
  );
};
```

### Usage in Next.js Page
```typescript
// pages/record.tsx
import { AudioRecorder } from '../components/AudioRecorder';

export default function RecordPage() {
  return (
    <div>
      <h1>Voice Recording</h1>
      <AudioRecorder />
    </div>
  );
}
```

## Best Practices

1. **Connection Management**
   - Always clean up WebSocket connections when component unmounts
   - Implement reconnection logic with exponential backoff
   - Monitor connection state and provide user feedback

2. **Audio Handling**
   - Validate audio chunk sizes before sending
   - Monitor audio levels to ensure quality
   - Handle audio device changes gracefully

3. **Error Recovery**
   - Implement proper error boundaries in React components
   - Provide clear user feedback for different error states
   - Log errors appropriately for debugging

4. **Performance**
   - Use appropriate chunk sizes to balance latency and bandwidth
   - Implement proper cleanup of audio resources
   - Monitor memory usage when handling audio data

## Security Considerations

1. **WebSocket Security**
   - Use secure WebSocket connections (WSS) in production
   - Implement proper authentication when required
   - Validate all incoming messages

2. **Audio Data**
   - Handle user media permissions appropriately
   - Implement proper data sanitization
   - Consider implementing end-to-end encryption for sensitive data

## Browser Compatibility

The implementation has been tested and confirmed working on:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

For older browsers, consider implementing appropriate fallbacks or showing compatibility warnings. 