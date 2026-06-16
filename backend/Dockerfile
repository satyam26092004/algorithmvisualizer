FROM python:3.9-slim

WORKDIR /app

# Install system build dependencies for potential package building (e.g. cryptography, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Default command to run backend
CMD ["python", "app.py"]
