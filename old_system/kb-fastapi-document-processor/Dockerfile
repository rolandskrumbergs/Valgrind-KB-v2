# --------------------
# Model Download Stage
# --------------------
FROM python:3.11-slim AS model_downloader
WORKDIR /app

# Install required packages
COPY requirements.txt .
RUN pip install --no-cache-dir sentence_transformers

# Download and cache the model properly
RUN python -c '\
from sentence_transformers import SentenceTransformer; \
model = SentenceTransformer("KBLab/sentence-bert-swedish-cased"); \
model.save("/app/model")'

# --------------------
# Builder Stage
# --------------------
FROM python:3.11-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Configure apt and install build dependencies in a single layer
RUN echo "Acquire::http::Pipeline-Depth 0; Acquire::http::No-Cache true; Acquire::BrokenProxy true;" \
    > /etc/apt/apt.conf.d/99fixbadproxy && \
    apt-get update --fix-missing && \
    apt-get install -y --fix-missing --no-install-recommends \
    build-essential \
    curl \
    software-properties-common \
    git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and build wheels for production
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

# --------------------
# Final (Runtime) Stage
# --------------------
FROM python:3.11-slim

# Set all environment variables in one layer
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/app/huggingface_cache \
    TRANSFORMERS_CACHE=/app/huggingface_cache \
    TRANSFORMERS_OFFLINE=1 \
    SENTENCE_TRANSFORMERS_HOME=/app/model

# Configure apt and install runtime dependencies in a single layer
RUN echo "Acquire::http::Pipeline-Depth 0; Acquire::http::No-Cache true; Acquire::BrokenProxy true;" \
    > /etc/apt/apt.conf.d/99fixbadproxy && \
    apt-get update --fix-missing && \
    apt-get install -y --fix-missing --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    libreoffice \
    tesseract-ocr \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    useradd --create-home appuser

WORKDIR /app

# Copy pre-built wheels and install dependencies
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# Copy the application source code (likely to change most frequently)
COPY . .

# Copy pre-downloaded model
COPY --from=model_downloader /app/model /app/model

# Set permissions and user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]