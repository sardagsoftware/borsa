# Nirvana TF Bot v2 - Production Dockerfile
FROM python:3.11-slim

# System dependencies for TA-Lib
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install TA-Lib C library
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create directories
RUN mkdir -p artifacts/model artifacts/checkpoints data/cache backtest

# Expose FastAPI port
EXPOSE 8000

# Default command (FastAPI serving)
CMD ["uvicorn", "src.serving.app:app", "--host", "0.0.0.0", "--port", "8000"]