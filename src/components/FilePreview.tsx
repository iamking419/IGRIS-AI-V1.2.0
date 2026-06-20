import React from "react";
import { Image, FileCode, FileText, File } from "lucide-react";

interface FilePreviewProps {
  key?: any;
  fileName: string;
  fileType: "image" | "code" | "pdf" | "docx" | "txt";
  previewUrl?: string;
  pageCount?: number;
}

export default function FilePreview({ fileName, fileType, previewUrl, pageCount }: FilePreviewProps) {
  const isImg = fileType === "image";
  const isCode = fileType === "code";
  const isPdf = fileType === "pdf";
  const isWord = fileType === "docx";
  const isText = fileType === "txt";

  const fileTag = `[${fileName}]`;

  if (isImg) {
    return (
      <div id={`image-preview-${fileName}`} className="flex flex-col space-y-1.5 mt-2 select-none">
        <div className="relative rounded-xl overflow-hidden bg-zinc-950/85 border border-white/10 max-w-[220px] max-h-[150px] flex items-center justify-center p-1 shadow-lg transform transition duration-200 hover:scale-[1.01]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={fileName}
              className="max-h-[140px] max-w-[210px] object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="p-8 text-zinc-500">
              <Image size={24} />
            </div>
          )}
        </div>
        <span className="text-[9px] font-mono text-zinc-400 font-bold tracking-wide pl-1 truncate max-w-[220px]">
          {fileTag}
        </span>
      </div>
    );
  }

  return (
    <div
      id={`file-preview-${fileName}`}
      className="flex items-center space-x-3 bg-zinc-900/80 border border-white/10 hover:bg-zinc-900 hover:border-zinc-700 p-2.5 rounded-xl max-w-sm mt-2 select-none shadow-md transition duration-150"
    >
      <div
        className={`p-2.5 rounded-lg bg-zinc-950 border border-white/5 shrink-0 ${
          isCode ? "text-indigo-400" : isPdf ? "text-red-400" : isWord ? "text-pink-400" : "text-cyan-400"
        }`}
      >
        {isCode && <FileCode size={16} />}
        {isPdf && <FileText size={16} />}
        {isWord && <FileText size={16} />}
        {isText && <File size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-white truncate max-w-[200px]" title={fileName}>
          {fileName}
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5">
          <span className="text-[9px] font-mono text-zinc-400 font-semibold">{fileTag}</span>
          {pageCount && (
            <span className="text-[8px] bg-red-400/20 text-red-300 font-extrabold px-1 rounded-sm border border-red-500/10 shrink-0">
              {pageCount}P
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
