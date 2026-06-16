FROM python:3.11-slim

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run application
CMD ["python", "app.py"]
