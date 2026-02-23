# Text Embedding API

This FastAPI application provides an API endpoint for generating text embeddings using the Sentence Transformers library.

## Local Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running Locally

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Docker Build and Run

```bash
# Build the image
docker build -t embedding-api .

# Run the container
docker run -d -p 8000:8000 --env-file .env embedding-api
```

## AWS Deployment Steps

1. **ECR Setup**:
```bash
# Login to AWS ECR
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account.dkr.ecr.your-region.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name embedding-api

# Tag the image
docker tag embedding-api:latest your-account.dkr.ecr.your-region.amazonaws.com/embedding-api:latest

# Push to ECR
docker push your-account.dkr.ecr.your-region.amazonaws.com/embedding-api:latest
```

2. **ECS Deployment**:
- Create an ECS cluster
- Create a task definition using the ECR image
- Configure environment variables in the task definition
- Set up an ECS service with the task definition
- Configure load balancer and target groups

3. **Environment Setup**:
- Update `.env` file with production values
- Configure AWS credentials
- Set up proper security groups and VPC

## Security Features

- Rate limiting: 10 requests per second per IP
- CORS protection
- Trusted hosts middleware
- Input validation and sanitization
- Request size limits

## API Endpoints

### GET /
- Welcome message endpoint
- Returns a simple welcome message

### GET /health
- Health check endpoint
- Returns service status and version

### POST /embed
- Generates embeddings for input text
- Request body: JSON object with a "text" field
- Returns: JSON object with "embeddings" field
- Rate limited to 10 requests per second per IP
- Maximum text length: 5000 characters

## API Documentation

Once the server is running, you can access:
- Interactive API documentation at: `http://localhost:8000/docs`
- Alternative API documentation at: `http://localhost:8000/redoc`

## Production Considerations

1. **Security**:
   - Set proper ALLOWED_ORIGINS in production
   - Configure ALLOWED_HOSTS for your domain
   - Use HTTPS in production
   - Set up proper AWS IAM roles

2. **Monitoring**:
   - Set up CloudWatch metrics and alarms
   - Monitor memory usage
   - Set up error logging
   - Configure request tracking

3. **Scaling**:
   - Configure auto-scaling groups
   - Set up proper instance sizes
   - Monitor resource utilization

4. **Backup**:
   - Regular backups of configuration
   - Version control of all changes 