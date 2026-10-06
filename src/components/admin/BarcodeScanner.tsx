'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, Loader2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ rawValue: string }>>
      }
      getSupportedFormats(): Promise<string[]>
    }
  }
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopStream = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }, [])

  const handleClose = useCallback(() => {
    stopStream()
    setScannedCode(null)
    setErrorMessage(null)
    setHasCameraPermission(null)
    onClose()
  }, [onClose, stopStream])

  const handleScanSuccess = useCallback((code: string) => {
    setScannedCode(code)
    stopStream()
    setTimeout(() => {
      onScan(code)
      handleClose()
    }, 600)
  }, [onScan, handleClose, stopStream])

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser or environment.')
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        setHasCameraPermission(true)
        setIsScanning(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Initialize BarcodeDetector if available
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window && window.BarcodeDetector) {
          try {
            const detector = new window.BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
            })

            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === 4 && !scannedCode) {
                try {
                  const barcodes = await detector.detect(videoRef.current)
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    const detected = barcodes[0].rawValue.trim()
                    if (detected) {
                      handleScanSuccess(detected)
                    }
                  }
                } catch {
                  // Silent catch for intermittent detection frame misses
                }
              }
            }, 300)
          } catch (detectorErr) {
            console.warn('BarcodeDetector initialization skipped:', detectorErr)
          }
        }
      } catch (err: unknown) {
        console.error('Camera access error:', err)
        if (isMounted) {
          setHasCameraPermission(false)
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'Could not access device camera. Please verify camera permissions.'
          setErrorMessage(errorMsg)
        }
      }
    }

    startCamera()

    return () => {
      isMounted = false
      stopStream()
    }
  }, [isOpen, handleScanSuccess, scannedCode, stopStream])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Camera Barcode Scanner
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Align barcode inside the viewfinder box
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-video sm:aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {hasCameraPermission === null && (
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs">Requesting camera permission...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="p-6 text-center text-white space-y-3">
              <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Camera Unavailable</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {errorMessage || 'Camera permission was denied or is not supported. Please type the barcode manually.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="mt-2 text-xs bg-zinc-900 text-white border-zinc-700"
              >
                Enter Barcode Manually
              </Button>
            </div>
          )}

          {/* Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`}
          />

          {/* Viewfinder Target Overlay */}
          {hasCameraPermission && !scannedCode && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-3/4 max-w-[260px] aspect-[3/2] border-2 border-primary/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                {isScanning && (
                  <div className="absolute left-2 right-2 h-0.5 bg-rose-500/80 animate-bounce top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
          )}

          {/* Scanned Badge */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center text-white space-y-2 animate-in zoom-in-95">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <p className="text-sm font-semibold">Barcode Captured!</p>
              <p className="text-xs font-mono bg-black/40 px-3 py-1 rounded border border-white/20">
                {scannedCode}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Manual entry is always supported</span>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
