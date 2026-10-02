"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraError =
  | "not_supported" // No getUserMedia in this browser
  | "permission_denied" // Camera blocked
  | "no_device" // No camera found
  | "failed";

export type CameraStatus = "off" | "requesting" | "on" | "error";

/**
 * Optional local self-view camera for the Interview Room.
 *
 * Purely a mirror to make practice feel like a real interview — the
 * stream is never analysed, recorded, or uploaded. Failing is fine: the
 * room keeps working and the user can answer by voice or typing.
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>("off");
  const [error, setError] = useState<CameraError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const disable = useCallback(() => {
    stopStream();
    setError(null);
    setStatus("off");
  }, [stopStream]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (status === "on" || status === "requesting") return false;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("not_supported");
      setStatus("error");
      return false;
    }

    setStatus("requesting");
    setError(null);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      streamRef.current = media;
      setStream(media);
      setStatus("on");
      return true;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("permission_denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("no_device");
      } else {
        setError("failed");
      }
      setStatus("error");
      return false;
    }
  }, [status]);

  // Attach / detach the stream to a <video> element via a ref callback.
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  // Stop the camera when the room unmounts.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { status, error, stream, enable, disable, attachVideo };
}
