# Vocal Backend

This is the backend server for Vocal, an AI-powered speech therapist that analyzes vocal performance. It provides real-time analysis of speech including filler words, stutters, tone, pitch, volume, and pace.

## Prerequisites

- Python 3.8 or higher
- FFmpeg (required for audio processing)
- Git

### Installing FFmpeg

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
Download from [FFmpeg official website](https://ffmpeg.org/download.html) or install via chocolatey:
```bash
choco install ffmpeg
```

## Setup Instructions

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd speech/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   .\venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Download required NLTK data:
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"
   ```

5. Download spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

## Running the Server

1. Make sure your virtual environment is activated:
   ```bash
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   .\venv\Scripts\activate
   ```

2. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

The server will start on `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
```

## Testing

To run the tests:
```bash
pytest
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and accessible from your PATH
   - Try running `ffmpeg -version` to verify the installation

2. **Audio processing errors**
   - Make sure you have sufficient disk space for temporary audio files
   - Verify that your system's audio input devices are properly configured

3. **Package installation errors**
   - Try upgrading pip: `pip install --upgrade pip`
   - If you encounter issues with specific packages, you may need to install additional system dependencies

### Getting Help

If you encounter any issues:
1. Check the logs for detailed error messages
2. Verify all prerequisites are correctly installed
3. Ensure your Python version is compatible (3.8 or higher)
4. Check if your virtual environment is activated

## License

[Add your license information here]
