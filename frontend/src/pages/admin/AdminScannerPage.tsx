import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  QrCode, Camera, CameraOff, CheckCircle, XCircle,
  AlertTriangle, Clock, RefreshCw, ScanLine, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScanStatus = 'idle' | 'camera' | 'processing' | 'valid' | 'used' | 'cancelled' | 'error';

interface ScanResult {
  booking: {
    bookingRef: string;
    seatLabel: string;
    status: string;
    studentId?: { name: string; refNumber: string; department: string };
    subjectId?: { code: string; name: string };
    slotId?: { date: string; startTime: string; endTime: string };
    roomId?: { name: string; building: string };
  };
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  valid: { icon: CheckCircle, label: 'Valid — Attendance Marked', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  used: { icon: AlertTriangle, label: 'Already Used', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  cancelled: { icon: XCircle, label: 'Booking Cancelled', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  error: { icon: XCircle, label: 'Invalid QR / Not Found', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function AdminScannerPage() {
  const { toast } = useToast();

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [processing, setProcessing] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef(false); // prevent duplicate scans

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    detectedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanStatus('camera');
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`;
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setScanStatus((s) => (s === 'camera' ? 'idle' : s));
  }, []);

  // ── Validate QR against backend ───────────────────────────────────────────
  const validateQr = useCallback(async (qrData: string) => {
    setProcessing(true);
    setScanStatus('processing');
    try {
      const result = await api.validateQr(qrData) as ScanResult;
      setScanResult(result);
      setScanStatus('valid');
      stopCamera();
      toast({ title: '✅ Attendance marked successfully!' });
    } catch (err: any) {
      const msg: string = err.message || '';
      setScanResult(null);
      if (msg.includes('already') || msg.includes('completed')) {
        setScanStatus('used');
      } else if (msg.includes('cancel')) {
        setScanStatus('cancelled');
      } else {
        setScanStatus('error');
      }
      stopCamera();
      toast({ title: 'QR Scan failed', description: msg, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [stopCamera, toast]);

  // ── QR frame scan loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && !detectedRef.current) {
        detectedRef.current = true;
        validateQr(code.data);
        return; // stop loop
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraActive, validateQr]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Manual ref / QR data submission ──────────────────────────────────────
  const handleManualScan = async () => {
    if (!manualInput.trim()) return;
    await validateQr(manualInput.trim());
  };

  const reset = () => {
    setScanResult(null);
    setScanStatus('idle');
    detectedRef.current = false;
    setManualInput('');
  };

  const statusCfg = scanStatus in STATUS_CONFIG ? STATUS_CONFIG[scanStatus] : null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">QR Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan student booking QR codes to record attendance
        </p>
      </div>

      <Card>
        <CardContent className="py-6 space-y-4">
          {/* ── Camera viewport ─────────────────────────────────────────── */}
          <div className="relative w-full aspect-video max-h-72 bg-black rounded-xl overflow-hidden border border-border shadow-inner">
            {/* Live video */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              muted
              playsInline
              autoPlay
            />

            {/* Hidden canvas for frame decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay when camera is active */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Corner brackets */}
                <div className="relative w-48 h-48">
                  {/* TL */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  {/* TR */}
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  {/* BL */}
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  {/* BR */}
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
                  {/* Animated scan line */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/80 animate-[scanLine_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {/* Processing spinner */}
            {scanStatus === 'processing' && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
                <p className="text-white text-sm font-medium">Verifying QR…</p>
              </div>
            )}

            {/* Idle placeholder */}
            {!cameraActive && scanStatus === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
                <QrCode className="h-14 w-14 opacity-40" />
                <p className="text-sm">Camera not active</p>
              </div>
            )}

            {/* Error placeholder */}
            {cameraError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <CameraOff className="h-10 w-10 text-red-400" />
                <p className="text-red-300 text-sm">{cameraError}</p>
              </div>
            )}
          </div>

          {/* ── Camera controls ──────────────────────────────────────────── */}
          <div className="flex gap-2">
            {!cameraActive ? (
              <Button
                className="flex-1"
                onClick={startCamera}
                disabled={processing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                onClick={stopCamera}
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            )}
            {(scanStatus !== 'idle' && scanStatus !== 'camera') && (
              <Button variant="ghost" size="icon" onClick={reset} title="Scan again">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ── Manual fallback ───────────────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Paste QR data or booking ref…"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
              disabled={processing}
            />
            <Button onClick={handleManualScan} disabled={processing || !manualInput.trim()}>
              {processing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ScanLine className="h-4 w-4" />
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Scan result card ─────────────────────────────────────────────── */}
      {statusCfg && (
        <Card className={`border ${statusCfg.bg}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-base flex items-center gap-2 ${statusCfg.color}`}>
              <statusCfg.icon className="h-5 w-5" />
              {statusCfg.label}
            </CardTitle>
          </CardHeader>
          {scanResult?.booking && (
            <CardContent className="space-y-1.5 text-sm">
              {[
                ['Booking Ref', scanResult.booking.bookingRef],
                ['Student', `${(scanResult.booking.studentId as any)?.name ?? '—'} (${(scanResult.booking.studentId as any)?.refNumber ?? ''})`],
                ['Subject', `${(scanResult.booking.subjectId as any)?.code ?? ''} · ${(scanResult.booking.subjectId as any)?.name ?? '—'}`],
                ['Room', `${(scanResult.booking.roomId as any)?.name ?? '—'}, ${(scanResult.booking.roomId as any)?.building ?? ''} — Seat ${scanResult.booking.seatLabel}`],
                ['Date', (scanResult.booking.slotId as any)?.date ?? '—'],
                ['Time', `${(scanResult.booking.slotId as any)?.startTime ?? ''} – ${(scanResult.booking.slotId as any)?.endTime ?? ''}`],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <Button className="w-full mt-3" variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan Next
              </Button>
            </CardContent>
          )}
          {!scanResult?.booking && (
            <CardContent>
              <Button className="w-full" variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
