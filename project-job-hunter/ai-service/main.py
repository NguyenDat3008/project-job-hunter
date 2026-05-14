"""
AI Matching Service — Job Hunter Project
========================================
Sử dụng Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2) để tính
semantic similarity giữa profile ứng viên và mô tả công việc.

Mô hình hỗ trợ tiếng Việt + tiếng Anh (multilingual).

Endpoint chính: POST /api/match-score
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
import numpy as np
import time
import logging

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── App init ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Job Hunter AI Matching Service",
    description="Semantic job matching using Sentence-BERT (multilingual)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load model (một lần duy nhất khi start) ────────────────────────────────
# paraphrase-multilingual-MiniLM-L12-v2: nhỏ, nhanh, hỗ trợ 50+ ngôn ngữ bao gồm Việt
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
logger.info(f"Loading Sentence-BERT model: {MODEL_NAME} ...")
model = SentenceTransformer(MODEL_NAME)
logger.info("Model loaded successfully!")


# ─── Schemas ────────────────────────────────────────────────────────────────
class MatchRequest(BaseModel):
    # Thông tin ứng viên
    user_skills: List[str] = []          # ["Java", "Spring Boot", "React"]
    user_address: Optional[str] = ""     # "Hà Nội"

    # Thông tin job
    job_id: int
    job_name: str
    job_description: Optional[str] = "" # Mô tả chi tiết công việc
    job_skills: List[str] = []           # ["Java", "Docker", "SQL"]
    job_location: Optional[str] = ""    # "Hà Nội"
    job_level: Optional[str] = ""       # "JUNIOR", "SENIOR", ...
    company_name: Optional[str] = ""
    company_is_premium: Optional[bool] = False


class MatchResponse(BaseModel):
    job_id: int
    job_name: str
    company_name: str
    match_score: int                    # 0–100
    skill_score: float                  # điểm thành phần: kỹ năng
    semantic_score: float               # điểm thành phần: ngữ nghĩa (AI)
    location_score: float               # điểm thành phần: địa điểm
    matched_skills: List[str]
    missing_skills: List[str]
    reasons: List[str]
    processing_time_ms: float


class BatchMatchRequest(BaseModel):
    user_skills: List[str] = []
    user_address: Optional[str] = ""
    jobs: List[dict]                    # List các job objects từ Java


class HealthResponse(BaseModel):
    status: str
    model: str
    message: str


# ─── Helpers ────────────────────────────────────────────────────────────────
def normalize_skill(skill: str) -> str:
    """Chuẩn hóa tên skill về lowercase, bỏ khoảng trắng thừa."""
    return skill.strip().lower()


def compute_skill_score(user_skills: List[str], job_skills: List[str]):
    """
    Tính điểm kỹ năng theo 2 cách:
    1. Exact match (tên skill giống hệt)
    2. Semantic match (dùng BERT — 'ReactJS' ≈ 'React', 'JS' ≈ 'JavaScript')
    """
    if not job_skills:
        return 50.0, [], []  # Không yêu cầu skill cụ thể → score trung bình

    user_norm = [normalize_skill(s) for s in user_skills]
    job_norm = [normalize_skill(s) for s in job_skills]

    matched = []
    missing = []

    if not user_skills:
        return 0.0, matched, job_skills

    # Encode tất cả skills
    all_user_embeddings = model.encode(user_norm, convert_to_tensor=True)
    all_job_embeddings = model.encode(job_norm, convert_to_tensor=True)

    for i, job_skill in enumerate(job_norm):
        job_emb = all_job_embeddings[i]

        # Tính cosine similarity với từng skill của user
        similarities = util.cos_sim(job_emb, all_user_embeddings)[0]
        max_sim = float(similarities.max())

        # Ngưỡng: > 0.75 = match (bắt được ReactJS ↔ React, JS ↔ JavaScript)
        if max_sim > 0.75:
            matched.append(job_skills[i])  # Dùng tên gốc trong response
        else:
            missing.append(job_skills[i])

    score = (len(matched) / len(job_skills)) * 100 if job_skills else 50.0
    return round(score, 2), matched, missing


def compute_semantic_score(user_skills: List[str], user_address: str,
                            job_description: str, job_name: str, job_location: str) -> float:
    """
    Tính điểm ngữ nghĩa bằng Sentence-BERT:
    So sánh 'user profile text' với 'job description text'.
    Đây là phần AI cốt lõi — không thể làm bằng rule-based.
    """
    if not job_description and not job_name:
        return 50.0

    # Tạo profile text của user
    user_text_parts = []
    if user_skills:
        user_text_parts.append(f"Kỹ năng: {', '.join(user_skills)}")
    if user_address:
        user_text_parts.append(f"Địa điểm: {user_address}")
    user_text = ". ".join(user_text_parts) if user_text_parts else "Ứng viên tìm việc"

    # Tạo job text
    job_text_parts = [job_name]
    if job_description:
        # Giới hạn độ dài để tránh token limit
        job_text_parts.append(job_description[:500])
    if job_location:
        job_text_parts.append(f"Địa điểm: {job_location}")
    job_text = ". ".join(job_text_parts)

    # Encode và tính cosine similarity
    user_emb = model.encode(user_text, convert_to_tensor=True)
    job_emb = model.encode(job_text, convert_to_tensor=True)

    similarity = float(util.cos_sim(user_emb, job_emb)[0][0])

    # Chuyển từ [-1, 1] sang [0, 100]
    score = ((similarity + 1) / 2) * 100
    return round(score, 2)


def compute_location_score(user_address: str, job_location: str) -> float:
    """Tính điểm địa điểm (0, 50, hoặc 100)."""
    if not user_address or not job_location:
        return 50.0

    user_loc = user_address.lower().strip()
    job_loc = job_location.lower().strip()

    if user_loc in job_loc or job_loc in user_loc:
        return 100.0

    # Semantic similarity cho location
    user_emb = model.encode(user_loc, convert_to_tensor=True)
    job_emb = model.encode(job_loc, convert_to_tensor=True)
    sim = float(util.cos_sim(user_emb, job_emb)[0][0])

    return round(((sim + 1) / 2) * 100, 2)


def build_reasons(skill_score: float, semantic_score: float,
                  location_score: float, is_premium: bool,
                  matched_skills: List[str]) -> List[str]:
    """Tạo danh sách lý do gợi ý dạng text (cho frontend hiển thị)."""
    reasons = []

    final_score = skill_score * 0.5 + semantic_score * 0.35 + location_score * 0.15

    if skill_score >= 80:
        reasons.append(f"Kỹ năng rất phù hợp ({len(matched_skills)} skill khớp)")
    elif skill_score >= 50:
        reasons.append(f"Kỹ năng khá phù hợp ({len(matched_skills)} skill khớp)")

    if semantic_score >= 70:
        reasons.append("Mô tả công việc phù hợp với profile của bạn")
    elif semantic_score >= 50:
        reasons.append("Công việc có liên quan đến lĩnh vực của bạn")

    if location_score >= 80:
        reasons.append("Địa điểm phù hợp")

    if is_premium:
        reasons.append("Công ty uy tín (Premium)")

    if final_score >= 85:
        reasons.append("🔥 Cực kỳ phù hợp với bạn!")
    elif final_score >= 70:
        reasons.append("✅ Phù hợp tốt")

    return reasons


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
def root():
    return HealthResponse(
        status="ok",
        model=MODEL_NAME,
        message="AI Matching Service is running"
    )


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        model=MODEL_NAME,
        message="AI Matching Service is healthy"
    )


@app.post("/api/match-score", response_model=MatchResponse)
def match_score(req: MatchRequest):
    """
    Tính điểm phù hợp giữa ứng viên và một job cụ thể.
    
    Điểm tổng = skill_score × 0.5 + semantic_score × 0.35 + location_score × 0.15
    
    - skill_score: exact + semantic skill matching (BERT)
    - semantic_score: so sánh user profile với job description (BERT)  
    - location_score: địa điểm phù hợp
    """
    start = time.time()

    try:
        # 1. Skill score (50% trọng số)
        skill_score, matched_skills, missing_skills = compute_skill_score(
            req.user_skills, req.job_skills
        )

        # 2. Semantic score (35% trọng số) — AI core
        semantic_score = compute_semantic_score(
            req.user_skills, req.user_address or "",
            req.job_description or "", req.job_name,
            req.job_location or ""
        )

        # 3. Location score (15% trọng số)
        location_score = compute_location_score(
            req.user_address or "", req.job_location or ""
        )

        # 4. Tổng hợp
        final_score = (
            skill_score * 0.50 +
            semantic_score * 0.35 +
            location_score * 0.15
        )
        final_score = min(100, max(0, round(final_score)))

        # 5. Lý do
        reasons = build_reasons(
            skill_score, semantic_score, location_score,
            req.company_is_premium or False, matched_skills
        )

        elapsed = round((time.time() - start) * 1000, 2)
        logger.info(f"Job {req.job_id} ({req.job_name}): score={final_score}, time={elapsed}ms")

        return MatchResponse(
            job_id=req.job_id,
            job_name=req.job_name,
            company_name=req.company_name or "",
            match_score=final_score,
            skill_score=skill_score,
            semantic_score=semantic_score,
            location_score=location_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            reasons=reasons,
            processing_time_ms=elapsed,
        )

    except Exception as e:
        logger.error(f"Error processing match for job {req.job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@app.post("/api/match-batch")
def match_batch(req: BatchMatchRequest):
    """
    Tính điểm cho nhiều job cùng lúc (dùng trong JobController.getRecommendedJobs).
    Trả về list đã sort theo score giảm dần, chỉ giữ score > 30.
    """
    start = time.time()
    results = []

    for job_dict in req.jobs:
        try:
            job_req = MatchRequest(
                user_skills=req.user_skills,
                user_address=req.user_address,
                job_id=job_dict.get("id", 0),
                job_name=job_dict.get("name", ""),
                job_description=job_dict.get("description", ""),
                job_skills=job_dict.get("skills", []),
                job_location=job_dict.get("location", ""),
                job_level=job_dict.get("level", ""),
                company_name=job_dict.get("companyName", ""),
                company_is_premium=job_dict.get("isPremium", False),
            )
            result = match_score(job_req)
            if result.match_score > 30:
                results.append(result.model_dump())
        except Exception as e:
            logger.warning(f"Skipped job {job_dict.get('id')}: {e}")
            continue

    # Sort theo score giảm dần
    results.sort(key=lambda x: x["match_score"], reverse=True)

    elapsed = round((time.time() - start) * 1000, 2)
    logger.info(f"Batch: {len(req.jobs)} jobs processed, {len(results)} matched, time={elapsed}ms")

    return {
        "total": len(results),
        "processing_time_ms": elapsed,
        "results": results
    }
