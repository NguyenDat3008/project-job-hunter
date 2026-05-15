# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

# Cài dependencies hệ thống (cần cho torch/numpy)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy và cài Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Pre-download model (lưu vào image để không cần download lại mỗi lần start)
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
