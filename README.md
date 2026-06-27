# RAG MVP

PDF 업로드 → 텍스트 청킹 → 임베딩 → 벡터 검색까지 이어지는 RAG 파이프라인을 연습하기 위한 프로젝트입니다.

- `frontend/` — Next.js
- `backend/` — FastAPI + LangChain + Ollama + FAISS
- `docs/` — 테스트용 샘플 문서

## 실행 방법

### backend

```
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### frontend

```
cd frontend
npm install
npm run dev
```
