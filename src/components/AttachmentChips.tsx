import React from "react";
import { Image, FileCode, FileText, File, X } from "lucide-react";
import { UploadedFile } from "../types";

interface AttachmentChipsProps {
  attachments: UploadedFile[];
  onRemove: (attachment: UploadedFile) => void;
}

export default function AttachmentChips({ attachments, onRemove }: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <div id="attachment-chips-container" className="max-w-3xl mx-auto flex flex-wrap items-center gap-2 mb-3.5 px-1 py-1 text-zinc-300 font-mono">
      <span className="text-[9px] font-mono font-black tracking-widest text-zinc-500 uppercase mr-1">
        STAGED PAYLOADS:
      </span>
      {attachments.map((f, index) => {
        const fileIcon =
          f.fileType === "image" ? (
            <Image size={12} className="text-amber-400 shrink-0" />
          ) : f.fileType === "code" ? (
            <FileCode size={12} className="text-indigo-400 shrink-0" />
          ) : f.fileType === "pdf" ? (
            <FileText size={12} className="text-red-400 shrink-0" />
          ) : f.fileType === "docx" ? (
            <FileText size={12} className="text-pink-400 shrink-0" />
          ) : (
            <File size={12} className="text-cyan-400 shrink-0" />
          );

        return (
          <div
            id={`attachment-chip-${index}`}
            key={f.fileName + "-" + index}
            className="flex items-center space-x-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-purple-500/30 px-2.5 py-1.5 text-[10px] text-zinc-200 transition duration-150 shadow-md transform hover:scale-[1.02]"
          >
            {f.fileType === "image" && f.previewUrl ? (
              <img
                src={f.previewUrl}
                alt={f.fileName}
                className="h-7 w-7 rounded-md object-cover border border-white/10"
              />
            ) : (
              fileIcon
            )}
            <span className="truncate max-w-[130px] font-mono font-medium">{f.fileName}</span>
            {f.pageCount && (
              <span className="text-[8px] bg-red-400/20 text-red-300 font-extrabold px-1.5 py-0.5 rounded border border-red-500/10 shrink-0">
                {f.pageCount}P
              </span>
            )}
            <button
              id={`remove-attachment-${index}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(f);
              }}
              className="text-zinc-500 hover:text-rose-400 transition ml-2 cursor-pointer font-bold select-none p-0.5 rounded hover:bg-zinc-800"
              title="Remove attachment"
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
