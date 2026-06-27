//FastAPI의 /api/upload-pdf 응답 구조와 일치시킵니다.
export interface UploadResponse {
  filename: string;
  status: string;
  total_chunks: number;
  test_search_preview: string;
}

export interface ChatResponse {
  answer: string;
}