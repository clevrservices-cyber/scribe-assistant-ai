import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface RecorderCtx {
  isRecording: boolean;
  available: boolean;
  toggleRecording: () => Promise<void>;
  registerHandler: (h: ((blob: Blob) => void) | null) => void;
}

const Ctx = createContext<RecorderCtx>({
  isRecording: false,
  available: true,
  toggleRecording: async () => {},
  registerHandler: () => {},
});

export function RecorderProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const handlerRef = useRef<((blob: Blob) => void) | null>(null);
  const available = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      handlerRef.current?.(blob);
    };
    mr.start();
    mediaRef.current = mr;
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) stop();
    else await start();
  }, [isRecording, start, stop]);

  const registerHandler = useCallback((h: ((blob: Blob) => void) | null) => {
    handlerRef.current = h;
  }, []);

  return (
    <Ctx.Provider value={{ isRecording, available, toggleRecording, registerHandler }}>
      {children}
    </Ctx.Provider>
  );
}

export const useRecorder = () => useContext(Ctx);
