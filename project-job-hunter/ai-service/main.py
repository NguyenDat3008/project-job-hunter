"""
AI Matching Service — Job Hunter Project
========================================
Sử dụng Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2) để tính
semantic similarity giữa profile ứng viên và mô tả công việc.

Mô hình hỗ trợ tiếng Việt + tiếng Anh (multilingual).

Endpoint chính: POST /api/match-score
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
import numpy as np
import time
import logging
import io
import pdfplumber
import docx

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
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
logger.info(f"Loading Sentence-BERT model: {MODEL_NAME} ...")
model = SentenceTransformer(MODEL_NAME)
logger.info("Model loaded successfully!")


# ─── Schemas ────────────────────────────────────────────────────────────────
class MatchRequest(BaseModel):
    user_skills: List[str] = []
    user_address: Optional[str] = ""
    user_level: Optional[str] = ""
    job_id: int
    job_name: str
    job_description: Optional[str] = ""
    job_skills: List[str] = []
    job_location: Optional[str] = ""
    job_level: Optional[str] = ""
    company_name: Optional[str] = ""
    company_is_premium: Optional[bool] = False

class MatchResponse(BaseModel):
    job_id: int
    job_name: str
    company_name: str
    match_score: int
    skill_score: float
    semantic_score: float
    location_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    reasons: List[str]
    processing_time_ms: float

class BatchMatchRequest(BaseModel):
    user_skills: List[str] = []
    user_address: Optional[str] = ""
    jobs: List[dict]

class HealthResponse(BaseModel):
    status: str
    model: str
    message: str

# ─── CV Extraction Helpers ──────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        logger.error(f"Error extracting DOCX: {e}")
        return ""

def extract_skills_from_text(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []
    skill_keywords = [
        "java", "python", "javascript", "react", "node", "spring", 
        "docker", "kubernetes", "aws", "azure", "sql", "nosql",
        "typescript", "angular", "vue", "flutter", "swift", "kotlin",
        "php", "laravel", "c#", "net", "ruby", "go", "devops", "agile",
        "project management", "ui/ux", "figma", "english", "chinese"
    ]
    for skill in skill_keywords:
        if skill in text_lower:
            found_skills.append(skill.capitalize())
    return list(set(found_skills))

# ─── Core Logic Helpers ─────────────────────────────────────────────────────

def normalize_skill(skill: str) -> str:
    return skill.strip().lower()

def compute_skill_score(user_skills: List[str], job_skills: List[str]):
    if not job_skills:
        return 50.0, [], []
    user_norm = [normalize_skill(s) for s in user_skills]
    job_norm = [normalize_skill(s) for s in job_skills]
    matched = []
    missing = []
    if not user_skills:
        return 0.0, matched, job_skills
    all_user_embeddings = model.encode(user_norm, convert_to_tensor=True)
    all_job_embeddings = model.encode(job_norm, convert_to_tensor=True)
    for i, job_skill in enumerate(job_norm):
        job_emb = all_job_embeddings[i]
        similarities = util.cos_sim(job_emb, all_user_embeddings)[0]
        max_sim = float(similarities.max())
        if max_sim > 0.75:
            matched.append(job_skills[i])
        else:
            missing.append(job_skills[i])
    score = (len(matched) / len(job_skills)) * 100 if job_skills else 50.0
    return round(score, 2), matched, missing

def compute_semantic_score(user_skills: List[str], user_address: str,
                            job_description: str, job_name: str, job_location: str) -> float:
    if not job_description and not job_name:
        return 50.0
    user_text_parts = []
    if user_skills:
        user_text_parts.append(f"Kỹ năng: {', '.join(user_skills)}")
    if user_address:
        user_text_parts.append(f"Địa điểm: {user_address}")
    user_text = ". ".join(user_text_parts) if user_text_parts else "Ứng viên tìm việc"
    job_text_parts = [job_name]
    if job_description:
        job_text_parts.append(job_description[:500])
    if job_location:
        job_text_parts.append(f"Địa điểm: {job_location}")
    job_text = ". ".join(job_text_parts)
    user_emb = model.encode(user_text, convert_to_tensor=True)
    job_emb = model.encode(job_text, convert_to_tensor=True)
    similarity = float(util.cos_sim(user_emb, job_emb)[0][0])
    score = ((similarity + 1) / 2) * 100
    return round(score, 2)

def compute_location_score(user_address: str, job_location: str) -> float:
    if not user_address or not job_location:
        return 50.0
    user_loc = user_address.lower().strip()
    job_loc = job_location.lower().strip()
    if user_loc in job_loc or job_loc in user_loc:
        return 100.0
    user_emb = model.encode(user_loc, convert_to_tensor=True)
    job_emb = model.encode(job_loc, convert_to_tensor=True)
    sim = float(util.cos_sim(user_emb, job_emb)[0][0])
    return round(((sim + 1) / 2) * 100, 2)

def compute_level_score(user_level: str, job_level: str) -> float:
    levels = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE", "SENIOR", "LEAD", "MANAGER"]
    if not user_level or not job_level:
        return 70.0
    try:
        user_idx = levels.index(user_level.upper())
        job_idx = levels.index(job_level.upper())
        if user_idx >= job_idx:
            return 100.0
        if job_idx - user_idx == 1:
            return 60.0
        return 30.0
    except:
        return 50.0

def build_reasons(skill_score: float, semantic_score: float,
                  location_score: float, is_premium: bool,
                  matched_skills: List[str]) -> List[str]:
    reasons = []
    final_score = skill_score * 0.4 + semantic_score * 0.3 + location_score * 0.15 + 70 * 0.15
    if skill_score >= 80:
        reasons.append(f"Kỹ năng rất phù hợp ({len(matched_skills)} skill khớp)")
    elif skill_score >= 50:
        reasons.append(f"Kỹ năng khá phù hợp ({len(matched_skills)} skill khớp)")
    if semantic_score >= 70:
        reasons.append("Mô tả công việc phù hợp với profile của bạn")
    if location_score >= 80:
        reasons.append("Địa điểm phù hợp")
    if is_premium:
        reasons.append("Công ty uy tín (Premium)")
    if final_score >= 85:
        reasons.append("🔥 Cực kỳ phù hợp với bạn!")
    return reasons

# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
def root():
    return HealthResponse(status="ok", model=MODEL_NAME, message="AI Matching Service is running")

@app.post("/api/extract-cv")
async def extract_cv(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()
    text = ""
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file .pdf hoặc .docx")
    skills = extract_skills_from_text(text)
    return {
        "filename": file.filename,
        "extracted_skills": skills,
        "text_preview": text[:500] + "..." if len(text) > 500 else text
    }

@app.post("/api/match-score", response_model=MatchResponse)
def match_score(req: MatchRequest):
    start = time.time()
    try:
        # 0. Tự động bổ sung kỹ năng từ mô tả công việc nếu tags bị thiếu hoặc ít
        all_job_skills = req.job_skills.copy()
        if req.job_description:
            extracted_from_desc = extract_skills_from_text(req.job_description)
            # Gộp lại và loại bỏ trùng lặp
            all_job_skills = list(set(all_job_skills + extracted_from_desc))

        # 1. Skill score (40% trọng số) - Sử dụng danh sách kỹ năng đã được làm giàu
        skill_score, matched_skills, missing_skills = compute_skill_score(
            req.user_skills, all_job_skills
        )
        semantic_score = compute_semantic_score(req.user_skills, req.user_address or "",
                                             req.job_description or "", req.job_name,
                                             req.job_location or "")
        location_score = compute_location_score(req.user_address or "", req.job_location or "")
        
        # SỬA LỖI: Lấy level thực tế từ request thay vì hardcode JUNIOR
        user_level = getattr(req, 'user_level', 'FRESHER') # Mặc định là FRESHER nếu chưa có
        level_score = compute_level_score(user_level, req.job_level or "JUNIOR")
        
        final_score = (skill_score * 0.40 + semantic_score * 0.30 + location_score * 0.15 + level_score * 0.15)
        final_score = min(100, max(0, round(final_score)))
        reasons = build_reasons(skill_score, semantic_score, location_score, req.company_is_premium or False, matched_skills)
        
        elapsed = round((time.time() - start) * 1000, 2)
        return MatchResponse(
            job_id=req.job_id, job_name=req.job_name, company_name=req.company_name or "",
            match_score=final_score, skill_score=skill_score, semantic_score=semantic_score,
            location_score=location_score, matched_skills=matched_skills, missing_skills=missing_skills,
            reasons=reasons, processing_time_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Error match-score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-batch")
def match_batch(req: BatchMatchRequest):
    start = time.time()
    results = []
    for job_dict in req.jobs:
        try:
            job_req = MatchRequest(
                user_skills=req.user_skills, user_address=req.user_address,
                job_id=job_dict.get("id", 0), job_name=job_dict.get("name", ""),
                job_description=job_dict.get("description", ""), job_skills=job_dict.get("skills", []),
                job_location=job_dict.get("location", ""), job_level=job_dict.get("level", ""),
                company_name=job_dict.get("companyName", ""), company_is_premium=job_dict.get("isPremium", False),
            )
            res = match_score(job_req)
            if res.match_score > 30:
                results.append(res.model_dump())
        except:
            continue
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return {"total": len(results), "processing_time_ms": round((time.time() - start) * 1000, 2), "results": results}
