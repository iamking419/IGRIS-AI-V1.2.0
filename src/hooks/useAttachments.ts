import { useCallback, useMemo, useState } from "react";
import type { UploadedFile } from "../types";

export interface AttachmentState {
  activeAttachments: UploadedFile[];
  setActiveAttachments: React.Dispatch<React.SetStateAction<UploadedFile[]>>;

  isFileAnalyzing: boolean;
  setIsFileAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;

  addAttachment: (attachment: UploadedFile) => void;
  removeAttachment: (attachment: UploadedFile) => void;
  clearAttachments: () => void;
}

/**
 * Attachment hook used by ChatInterface.
 * Provides staged attachments + a simple analyzing flag.
 */
export function useAttachments(): AttachmentState {
  const [activeAttachments, setActiveAttachments] = useState<UploadedFile[]>([]);
  const [isFileAnalyzing, setIsFileAnalyzing] = useState(false);

  const addAttachment = useCallback((attachment: UploadedFile) => {
    setActiveAttachments((prev) => {
      // Avoid duplicates by (name,size,lastModified)
      const exists = prev.some(
        (a) =>
          a.fileName === attachment.fileName &&
          a.fileSize === attachment.fileSize &&
          a.lastModified === attachment.lastModified
      );
      return exists ? prev : [...prev, attachment];
    });
  }, []);

  const removeAttachment = useCallback((attachment: UploadedFile) => {
    setActiveAttachments((prev) =>
      prev.filter(
        (a) =>
          !(
            a.fileName === attachment.fileName &&
            a.fileSize === attachment.fileSize &&
            a.lastModified === attachment.lastModified
          )
      )
    );
  }, []);

  const clearAttachments = useCallback(() => {
    setActiveAttachments([]);
  }, []);

  return useMemo(
    () => ({
      activeAttachments,
      setActiveAttachments,
      isFileAnalyzing,
      setIsFileAnalyzing,
      addAttachment,
      removeAttachment,
      clearAttachments,
    }),
    [
      activeAttachments,
      setActiveAttachments,
      isFileAnalyzing,
      setIsFileAnalyzing,
      addAttachment,
      removeAttachment,
      clearAttachments,
    ]
  );
}


