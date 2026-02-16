"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Ticket,
  Users,
  Keyboard,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface CheckInResult {
  valid: boolean;
  alreadyCheckedIn?: boolean;
  message: string;
  fanName?: string;
  fanEmail?: string;
  ticketCode?: string;
  ticketNumber?: number;
  totalTickets?: number;
  checkedInAt?: string;
  error?: string;
}

interface CheckInScannerProps {
  eventId: string;
  bandName: string;
  venueName: string;
  totalTickets: number;
  initialCheckedIn: number;
}

export function CheckInScanner({
  eventId,
  bandName,
  venueName,
  totalTickets,
  initialCheckedIn,
}: CheckInScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>("");
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkIn = useCallback(
    async (ticketCode: string) => {
      // Prevent duplicate scans within 3 seconds
      if (ticketCode === lastScannedRef.current) return;
      lastScannedRef.current = ticketCode;
      setTimeout(() => {
        lastScannedRef.current = "";
      }, 3000);

      setProcessing(true);
      setResult(null);

      try {
        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketCode, eventId }),
        });

        const data: CheckInResult = await res.json();
        setResult(data);

        if (data.valid) {
          setCheckedIn((prev) => prev + 1);
        }

        // Clear result after 5 seconds
        if (resultTimeoutRef.current) {
          clearTimeout(resultTimeoutRef.current);
        }
        resultTimeoutRef.current = setTimeout(() => {
          setResult(null);
        }, 5000);
      } catch {
        setResult({
          valid: false,
          message: "Network error. Please try again.",
        });
      } finally {
        setProcessing(false);
      }
    },
    [eventId]
  );

  const startCamera = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract ticket code from URL or use as-is
          let code = decodedText;
          const urlMatch = decodedText.match(/[?&]code=([A-Z0-9-]+)/i);
          if (urlMatch) {
            code = urlMatch[1];
          }
          checkIn(code);
        },
        () => {
          // QR code not found in frame — normal, just keep scanning
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setResult({
        valid: false,
        message: "Could not access camera. Please use manual entry.",
      });
      setMode("manual");
    }
  }, [checkIn]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === "camera" && !cameraActive) {
      startCamera();
    } else if (mode === "manual" && cameraActive) {
      stopCamera();
    }
  }, [mode, cameraActive, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      checkIn(manualCode.trim().toUpperCase());
      setManualCode("");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold">{bandName}</h1>
        <p className="text-sm text-zinc-500">{venueName} &middot; Check-In</p>

        {/* Stats bar */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">
              {checkedIn} In
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
            <Users className="h-4 w-4 text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-700">
              {totalTickets - checkedIn} Left
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2">
            <Ticket className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">
              {totalTickets} Total
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          className={mode === "camera" ? "flex-1 bg-orange-600 hover:bg-orange-700" : "flex-1"}
          onClick={() => setMode("camera")}
        >
          <Camera className="mr-2 h-4 w-4" />
          Scan QR
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          className={mode === "manual" ? "flex-1 bg-orange-600 hover:bg-orange-700" : "flex-1"}
          onClick={() => setMode("manual")}
        >
          <Keyboard className="mr-2 h-4 w-4" />
          Enter Code
        </Button>
      </div>

      {/* Result display */}
      {result && (
        <Card
          className={`mb-4 border-2 ${
            result.valid
              ? "border-green-400 bg-green-50"
              : result.alreadyCheckedIn
              ? "border-amber-400 bg-amber-50"
              : "border-red-400 bg-red-50"
          }`}
        >
          <CardContent className="py-4 text-center">
            {result.valid ? (
              <>
                <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
                <p className="text-lg font-bold text-green-800">
                  {result.fanName}
                </p>
                <p className="text-sm text-green-600">
                  Ticket {result.ticketNumber} of {result.totalTickets}
                </p>
                <Badge className="mt-2 bg-green-600 text-white">
                  Checked In
                </Badge>
              </>
            ) : result.alreadyCheckedIn ? (
              <>
                <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-amber-500" />
                <p className="text-lg font-bold text-amber-800">
                  Already Checked In
                </p>
                <p className="text-sm text-amber-600">
                  {result.fanName} &middot; {result.ticketCode}
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
                <p className="text-lg font-bold text-red-800">
                  {result.error || "Invalid"}
                </p>
                <p className="text-sm text-red-600">{result.message}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera view */}
      {mode === "camera" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              id="qr-reader"
              className="w-full"
              style={{ minHeight: 300 }}
            />
            {!cameraActive && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-zinc-400">
                  <CameraOff className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual entry */}
      {mode === "manual" && (
        <Card>
          <CardContent className="py-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Enter Ticket Code
                </label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="DAB-XXXX-XXXX"
                  className="text-center font-mono text-lg tracking-wider"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={!manualCode.trim() || processing}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Search className="mr-2 h-4 w-4" />
                {processing ? "Checking..." : "Check In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="mt-4 text-center">
          <p className="text-sm text-zinc-500 animate-pulse">
            Verifying ticket...
          </p>
        </div>
      )}
    </div>
  );
}
