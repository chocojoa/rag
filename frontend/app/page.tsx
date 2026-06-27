'use client';

import { useState, ChangeEvent } from 'react';
import { FileText, Upload, Send, Bot, CheckCircle2, Loader2 } from 'lucide-react';
import { ChatResponse, UploadResponse } from '../types/api';

export default function Home() {
  // 업로드 관련 상태
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // 질문 관련 상태
  const [question, setQuestion] = useState<string>('');
  const [chatAnswer, setChatAnswer] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // 파일 선택 핸들러 (타입스크립트 적용)
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  // 백엔드로 파일 전송
  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch("http://localhost:8000/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      // 백엔드에서 받은 JSON 데이터를 우리가 정의한 UploadResponse 타입으로 변환
      const data: UploadResponse = await response.json();
      setUploadResult(data);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // 질문 전송 핸들러
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    setChatLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data: ChatResponse = await response.json();
      setChatAnswer(data.answer);
    } catch (error) {
      console.error('질문 전송 중 오류 발생:', error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900 flex justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            로컬 RAG 시스템
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            PDF 문서를 업로드하고 내용을 기반으로 질문해보세요 (Ollama 기반)
          </p>
        </div>

        {/* 1. PDF 업로드 섹션 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              1
            </span>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              문서 업로드 및 벡터화
            </h2>
          </div>

          <label
            htmlFor="pdf-upload"
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-neutral-800/70"
          >
            <FileText size={20} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {file ? file.name : 'PDF 파일을 선택하세요'}
            </span>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={uploadLoading || !file}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-neutral-700"
          >
            {uploadLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                문서 분석 중...
              </>
            ) : (
              <>
                <Upload size={16} />
                문서 학습 시키기
              </>
            )}
          </button>

          {uploadResult && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              {uploadResult.filename} 분석 완료! ({uploadResult.total_chunks}개 조각 생성)
            </p>
          )}
        </section>

        {/* 2. RAG 대화 섹션 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              2
            </span>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              문서 기반 질문하기
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 출퇴근 시간을 알려줘"
              disabled={!uploadResult}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-neutral-800"
            />
            <button
              onClick={handleAskQuestion}
              disabled={chatLoading || !uploadResult}
              className="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-neutral-700"
            >
              {chatLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          {!uploadResult && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              먼저 PDF 문서를 업로드해주세요.
            </p>
          )}
        </section>

        {/* 3. 최종 답변 출력 섹션 */}
        {chatAnswer && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/40 dark:bg-blue-950/30">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Bot size={16} />
              RAG 답변
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {chatAnswer}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
