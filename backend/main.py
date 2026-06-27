import io

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from pydantic import BaseModel

load_dotenv()  # .env 파일에서 환경 변수 로드

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수로 벡터 저장소를 임시로 관리합니다. (MVP용)
vector_store = None  # 실제 서비스에서는 데이터베이스나 파일 시스템을 사용해야 합니다.

class ChatRequest(BaseModel):
    question: str

@app.get("/")
async def root(): 
  return {"message": "FastAPI 서버가 정상 작동 중입니다.!"}

@app.post("/api/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
  global vector_store  # 전역 변수 사용

  # 1. 업로드된 파일 읽기 (메모리 상에서 바로 읽기)
  file_content = await file.read()
  pdf_file = io.BytesIO(file_content)

  # 2. PDF에서 텍스트 추출하기
  reader = PdfReader(pdf_file)
  raw_text = ""
  for page in reader.pages:
    text = page.extract_text()
    if text:
      raw_text += text + "\n"

  # 3. 텍스트를 의미 있는 단위로 쪼개기 (청킹)
  # 글자 수 500자 단위로 자르고, 문맥이 끊기지 않게 50자씩 겹치게(overlap) 설정
  text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len
  )
  chunks = text_splitter.split_text(raw_text)
  
  # 4. 임베딩 모델 준비 
  embeddings = OllamaEmbeddings(model="bge-m3")

  # 5. 벡터 DB(FAISS)에 텍스트와 올라마 임베딩 저장
  vector_store = FAISS.from_texts(chunks, embedding=embeddings)

  # [테스트용 검색 확인]
  test_search_result = vector_store.similarity_search("출퇴근 시간을 알려줘.", k=1)
  preview_match = test_search_result[0].page_content if test_search_result else "검색 결과가 없습니다."

  # 6. 결과 반환 (텍스트를 위해 몇 개로 쪼개졌는지와 첫 번째 조각을 보여줍니다.)
  return {
    "filename": file.filename,
    "status": "success",
    "total_chunks": len(chunks),
    "test_search_preview": preview_match
  }

@app.post("/api/chat")
async def chat_with_rag(request: ChatRequest):
  global vector_store  # 전역 변수 사용
  if vector_store is None:
    return {"error": "먼저 PDF 파일을 업로드하여 문서를 분석해주세요."}
  
  # 1. 사용자의 질문과 관련된 조각 검색 (Top 2개 추출)
  docs = vector_store.similarity_search(request.question, k=2)
  context = " ".join([doc.page_content for doc in docs])

  # 2. 올라마 LLM 모델 로드
  llm = OllamaLLM(model="llama3")

  # 3. 프롬프트 생성 (컨텍스트 제공)
  prompt = f"""
당신은 사내 규정 안내 봇입니다.
아래 제공된 [사내 문서 내용]을 바탕으로 사용자의 [질문]에 친절하게 답해주세요.
문서에 나와있지 않은 내용은 추측해서 답변하지 마세요.

[사내 문서 내용]
{context}

[질문]
{request.question}

[답변]
"""
  # 4. LLM 모델에 프롬프트 전달하여 답변 생성
  answer = llm.invoke(prompt)

  # 5. 생성된 답변 반환
  return {"answer": answer}