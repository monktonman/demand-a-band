"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface TicketQrCodeProps {
  ticketCode: string;
}

export function TicketQrCode({ ticketCode }: TicketQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://demanda.band";

  useEffect(() => {
    if (!canvasRef.current) return;

    const url = `${baseUrl}/check-in/verify?code=${ticketCode}`;

    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  }, [ticketCode, baseUrl]);

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm border border-zinc-100">
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
}
