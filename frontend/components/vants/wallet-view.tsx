"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { RotateCcw, Image, X, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import jsQR from "jsqr"

interface RecentPayee {
  id: string
  name: string
  description: string
  initials: string
  color: string
  glowColor: string
}

const recentPayees: RecentPayee[] = [
  {
    id: "cfe",
    name: "CFE",
    description: "Energia Elétrica",
    initials: "CFE",
    color: "bg-[#00D2FF]",
    glowColor: "rgba(0, 210, 255, 0.3)",
  },
  {
    id: "telmex",
    name: "Telmex",
    description: "Telefonia",
    initials: "TM",
    color: "bg-[#6851FF]",
    glowColor: "rgba(104, 81, 255, 0.3)",
  },
  {
    id: "totalplay",
    name: "Totalplay",
    description: "Internet",
    initials: "TP",
    color: "bg-[#4CAF50]",
    glowColor: "rgba(76, 175, 80, 0.3)",
  },
]

type ScanStatus = "idle" | "requesting" | "scanning" | "denied" | "result"

interface WalletViewProps {
  onPayBill?: () => void
}

export function WalletView({ onPayBill }: WalletViewProps) {
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setStatus("idle")
  }, [])

  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      setQrResult(code.data)
      setStatus("result")
      stopCamera()
      return
    }

    animFrameRef.current = requestAnimationFrame(scanFrame)
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    setStatus("requesting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, aspectRatio: 1 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStatus("scanning")
      animFrameRef.current = requestAnimationFrame(scanFrame)
    } catch {
      setStatus("denied")
    }
  }, [facingMode, scanFrame])

  const flipCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === "environment" ? "user" : "environment")
  }, [stopCamera])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const isScanning = status === "scanning"

  return (
    <div className="flex flex-col h-full">
      {/* Área da câmera */}
      <div className="relative bg-black overflow-hidden" style={{ minHeight: 320 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ minHeight: 320, display: isScanning ? "block" : "none" }}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Placeholder quando não está escaneando */}
        {!isScanning && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              minHeight: 320,
              background: "linear-gradient(135deg, #060e1f 0%, #0d1836 100%)",
            }}
          >
            {/* Radial glow decorativo */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, rgba(104, 81, 255, 0.15) 0%, transparent 70%)",
              }}
            />
            {/* Dot grid sutil */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>
        )}

        {/* Controles superiores */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-20">
          <div className="w-10" />
          <div className="flex items-center gap-2">
            <button
              onClick={flipCamera}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors hover:bg-black/60"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white transition-colors hover:bg-black/60">
              <Image className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder QR com bordas indigo */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="relative w-56 h-56">
            {/* Cantos do viewfinder — indigo alinhado ao brand */}
            <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#6851FF] rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#6851FF] rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#6851FF] rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#6851FF] rounded-br-sm" />

            {/* Linha de scan — cyan */}
            {isScanning && (
              <span className="scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00D2FF] to-transparent shadow-[0_0_8px_2px_rgba(0,210,255,0.6)]" />
            )}

            {/* Overlay escurecido fora do frame */}
            <div
              className="absolute inset-0 border border-transparent"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
            />
          </div>
        </div>

        {/* Overlay de resultado */}
        {status === "result" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 gap-3 px-6">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4CAF50]"
              style={{ boxShadow: "0 0 30px rgba(76, 175, 80, 0.5)" }}
            >
              <span className="text-white text-2xl font-bold">✓</span>
            </div>
            <p className="text-white font-bold text-lg">QR Detectado!</p>
            <p className="text-[#8F9BBA] text-sm text-center font-mono break-all line-clamp-3">
              {qrResult}
            </p>
            <Button
              size="sm"
              onClick={() => { setStatus("idle"); setQrResult(null) }}
              className="mt-2 bg-[#6851FF] hover:bg-[#5842e6] text-white rounded-xl"
              style={{ boxShadow: "0 4px 16px rgba(104, 81, 255, 0.4)" }}
            >
              Escanear Novamente
            </Button>
          </div>
        )}

        {/* Texto de instrução */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
          <p className="text-white/70 text-xs px-3 py-1.5 bg-black/30 rounded-full backdrop-blur-sm">
            {status === "denied"
              ? "Acesso à câmera negado"
              : status === "result"
              ? ""
              : "Centralize o QR Code no quadro"}
          </p>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-4 relative z-20 px-5 pt-5 pb-8">
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

        {/* Título */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-foreground">Pagar Conta</h2>
          <button
            className="text-[#6851FF] text-sm font-semibold mt-1 hover:text-[#5842e6] transition-colors"
            onClick={onPayBill}
          >
            Ou insira CLABE/PIX manualmente
          </button>
        </div>

        {/* Botão CTA */}
        <Button
          onClick={isScanning ? stopCamera : startCamera}
          disabled={status === "requesting"}
          className="w-full h-12 rounded-2xl font-bold text-base bg-[#6851FF] hover:bg-[#5842e6] text-white gap-2 mb-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ boxShadow: "0 8px 24px rgba(104, 81, 255, 0.35)" }}
        >
          {status === "requesting" && (
            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {status === "scanning" ? (
            <>
              <X className="h-5 w-5" />
              Parar Scan
            </>
          ) : status === "requesting" ? (
            "Solicitando câmera…"
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z" fill="currentColor" stroke="none" />
              </svg>
              Escanear QR Code
            </>
          )}
        </Button>

        {/* Pagadores Recentes */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-widest">
            Recentes
          </h3>
          <div className="flex flex-col rounded-2xl overflow-hidden border border-border">
            {recentPayees.map((payee, index) => (
              <button
                key={payee.id}
                onClick={onPayBill}
                className={`flex items-center gap-4 p-3.5 bg-card hover:bg-card/80 transition-colors text-left w-full ${
                  index < recentPayees.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${payee.color} text-white text-xs font-bold shrink-0`}
                  style={{ boxShadow: `0 4px 12px ${payee.glowColor}` }}
                >
                  {payee.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{payee.name}</p>
                  <p className="text-xs text-muted-foreground">{payee.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
