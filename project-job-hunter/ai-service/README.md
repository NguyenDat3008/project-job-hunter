# 🤖 AI Matching Service

FastAPI microservice tính điểm phù hợp giữa ứng viên và việc làm sử dụng **Sentence-BERT**.

## Tech Stack

| | |
|---|---|
| Framework | FastAPI |
| AI Model | `paraphrase-multilingual-MiniLM-L12-v2` (Sentence-BERT) |
| Hỗ trợ ngôn ngữ | Tiếng Việt + tiếng Anh (multilingual) |
| Python | 3.11 |

## Cách tính điểm

```
Final Score = skill_score × 50% + semantic_score × 35% + location_score × 15%
```

| Thành phần | Mô tả |
|---|---|
| `skill_score` | So khớp kỹ năng bằng Sentence-BERT (bắt được ReactJS ≈ React) |
| `semantic_score` | So sánh user profile với job description bằng BERT embeddings |
| `location_score` | Địa điểm ứng viên và job có khớp không |

## Chạy local (dev)

```bash
cd ai-service

# Tạo virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac

# Cài dependencies (lần đầu sẽ download model ~120MB)
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

## Chạy với Docker

```bash
# Build image (lần đầu download model vào image ~2GB)
docker build -t jobhunter-ai ./ai-service

# Run
docker run -p 8000:8000 jobhunter-ai
```

## Chạy toàn bộ hệ thống (Docker Compose)

```bash
# Từ thư mục project-job-hunter/
docker-compose up -d
```

## API Endpoints

### `POST /api/match-score`
Tính điểm cho 1 job:
```json
{
  "user_skills": ["Java", "Spring Boot", "React"],
  "user_address": "Hà Nội",
  "job_id": 1,
  "job_name": "Backend Developer",
  "job_description": "Tuyển Backend Developer Java ...",
  "job_skills": ["Java", "Docker", "SQL"],
  "job_location": "Hà Nội",
  "company_is_premium": false
}
```

Response:
```json
{
  "job_id": 1,
  "match_score": 78,
  "skill_score": 66.7,
  "semantic_score": 82.3,
  "location_score": 100.0,
  "matched_skills": ["Java"],
  "missing_skills": ["Docker", "SQL"],
  "reasons": ["Kỹ năng khá phù hợp (1 skill khớp)", "Mô tả công việc phù hợp", "Địa điểm phù hợp"],
  "processing_time_ms": 45.2
}
```

### `GET /health`
Kiểm tra service có chạy không.

### `GET /docs`
Swagger UI tự động.
