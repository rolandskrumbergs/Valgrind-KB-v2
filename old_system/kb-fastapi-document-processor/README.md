# Document Processing and Embedding API

This FastAPI application processes documents from S3, extracts text using the Unstructured library, and generates embeddings using a custom Hugging Face sentence-transformer model.

## Features

- Document processing from S3 URLs
- Text extraction and cleaning using Unstructured
- Embedding generation using sentence-transformers
- Database storage for embeddings

## Prerequisites

- Docker installed on your system
- AWS credentials for S3 access

## Setup

### Using Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t document-processor .
```

2. Create a `.env` file with your AWS credentials:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. Run the container:
```bash
docker run -d \
  --name document-processor \
  -p 8000:8000 \
  --env-file .env \
  document-processor
```

The API will be available at http://localhost:8000

### Manual Setup (Alternative)

If you prefer to run the application without Docker:

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once the application is running, you can access:
- API documentation: http://localhost:8000/docs
- Alternative documentation: http://localhost:8000/redoc

## Supported Document Types

With the full installation of Unstructured, the API can process various document types including:
- PDF documents
- Microsoft Office files (Word, Excel, PowerPoint)
- Images (with OCR support)
- HTML files
- Markdown files
- Plain text files
- RTF files
- And more

The library will automatically detect the file type and use the appropriate processing pipeline.

## Development

To make changes to the application:

1. Stop the running container (if using Docker):
```bash
docker stop document-processor
```

2. Make your changes to the code

3. Rebuild and restart the container:
```bash
docker build -t document-processor .
docker run -d --name document-processor -p 8000:8000 --env-file .env document-processor
``` 