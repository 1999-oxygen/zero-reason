# Use official Python runtime as base image
FROM python:3.12-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
# Install in two stages: essential first, then optional AI packages
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    websockets>=12.0 \
    python-multipart>=0.0.9 \
    pydantic>=2.6.0 \
    pydantic-settings>=2.1.0 \
    google-auth>=2.28.0 \
    PyJWT>=2.8.0 \
    pillow>=10.2.0

# Try to install AI packages (optional - will work in mock mode if they fail)
RUN pip install --no-cache-dir \
    numpy>=1.26.0 \
    opencv-python-headless>=4.9.0 \
    ultralytics>=8.1.0 \
    supervision>=0.19.0 \
    || echo "AI packages failed to install - will run in mock mode"

# Copy application code
COPY . .

# Create directory for database and uploads
RUN mkdir -p /app/data /app/uploads

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health')"

# Run the application
# Use PORT env var from Cloud Run, fallback to 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
