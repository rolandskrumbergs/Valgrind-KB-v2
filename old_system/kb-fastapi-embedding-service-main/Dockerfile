# --------------------
# Model Download Stage
# --------------------
FROM python:3.9-slim AS model_downloader
WORKDIR /app

# Install required packages for model download
COPY requirements.txt .
RUN pip install --no-cache-dir sentence-transformers

# Download and cache the model properly
RUN python -c '\
from sentence_transformers import SentenceTransformer; \
model = SentenceTransformer("KBLab/sentence-bert-swedish-cased"); \
model.save("/app/model")'

# --------------------
# Builder Stage
# --------------------
FROM python:3.9-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Copy requirements and build wheels for production
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

# --------------------
# Final (Runtime) Stage
# --------------------
FROM python:3.9-slim

# Set all environment variables in one layer
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/app/huggingface_cache \
    TRANSFORMERS_OFFLINE=1 \
    SENTENCE_TRANSFORMERS_HOME=/app/model

WORKDIR /app

# Copy pre-built wheels and install dependencies
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# Copy the application source code
COPY . .

# Copy pre-downloaded model
COPY --from=model_downloader /app/model /app/model

# Create a non-root user
RUN useradd --create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

# Make port configurable
ENV PORT=8000
EXPOSE ${PORT}

# Use environment variable for port
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"] 