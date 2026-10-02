"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Why recording could not start / continue. Drives the fallback UI. */
export type RecorderError =
  | "not_supported" // No getUserMedia / MediaRecorder in this browser
  | "permission_denied" // User (or policy) blocked the microphone
  | "no_device" // No microphone found
  | "failed"; // Device present, recording itself failed

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "stopping";

export interface RecordedAudio {
  blob: Blob;
  /** Frontend-only object URL. The caller owns revoking it. */
  url: string;
  durationMs: number;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg", ""];
  for (const type of candidates) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type || undefined;
  }
  return undefined;
}

/**
 * Microphone recording for the Interview Room, on top of getUserMedia +
 * MediaRecorder. Exposes a coarse status, an elapsed timer, and one
 * error classification — the room decides how to fall back (typing),
 * this hook never crashes the page on its own.
 */
export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<RecorderError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveStopRef = useRef<((audio: RecordedAudio | null) => void) | null>(
    null,
  );

  const teardownStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Hard reset back to idle (used by "retry answer"). */
  const reset = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      } catch {
        /* no-op */
      }
    }
    recorderRef.current = null;
    chunksRef.current = [];
    teardownStream();
    resolveStopRef.current = null;
    setElapsedMs(0);
    setError(null);
    setStatus("idle");
  }, [clearTimer, teardownStream]);

  const start = useCallback(async (): Promise<boolean> => {
    if (status === "recording" || status === "requesting") return false;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("not_supported");
      return false;
    }

    setStatus("requesting");
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("permission_denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("no_device");
      } else {
        setError("failed");
      }
      setStatus("idle");
      return false;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      const mimeType = pickMimeType();
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      teardownStream();
      setError("failed");
      setStatus("idle");
      return false;
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      clearTimer();
      teardownStream();
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      chunksRef.current = [];
      const durationMs = Date.now() - startedAtRef.current;
      const resolve = resolveStopRef.current;
      resolveStopRef.current = null;
      setStatus("idle");
      if (blob.size === 0) {
        setError("failed");
        resolve?.(null);
        return;
      }
      resolve?.({ blob, url: URL.createObjectURL(blob), durationMs });
    };

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    recorder.start(250);
    setStatus("recording");
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return true;
  }, [clearTimer, status, teardownStream]);

  /** Stop and resolve the finished recording, or null if it failed. */
  const stop = useCallback((): Promise<RecordedAudio | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      setStatus("stopping");
      resolveStopRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        resolveStopRef.current = null;
        setStatus("idle");
        teardownStream();
        setError("failed");
        resolve(null);
      }
    });
  }, [teardownStream]);

  // Release the microphone and timers when the room unmounts.
  useEffect(() => {
    return () => {
      clearTimer();
      try {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          recorder.onstop = null;
          recorder.stop();
        }
      } catch {
        /* no-op */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [clearTimer]);

  return { status, error, elapsedMs, start, stop, reset };
}
