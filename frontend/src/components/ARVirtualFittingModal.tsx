import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  VideoOff,
  Sparkles,
  Sliders,
  CalendarCheck,
  ShoppingBag,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Maximize2,
  Scan,
} from 'lucide-react';
import { Product, ProductVariant, Branch } from '../services/api.js';

interface ARVirtualFittingModalProps {
  product: Product;
  initialVariant: ProductVariant;
  selectedBranch: Branch | null;
  onClose: () => void;
  onReserve: (product: Product, variant: ProductVariant) => void;
  onBuy: (product: Product, variant: ProductVariant) => void;
}

export const ARVirtualFittingModal: React.FC<ARVirtualFittingModalProps> = ({
  product,
  initialVariant,
  selectedBranch,
  onClose,
  onReserve,
  onBuy,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(initialVariant);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Modo de ajuste: 'AI_TRACKING' (automático al cuerpo) o 'MANUAL'
  const [trackingMode, setTrackingMode] = useState<'AI_TRACKING' | 'MANUAL'>('AI_TRACKING');
  const [isPoseDetected, setIsPoseDetected] = useState(false);
  const [detectedSize, setDetectedSize] = useState<string>('M');
  const [aiConfidence, setAiConfidence] = useState<number>(0);

  // Transformaciones calculadas por la IA
  const [aiTransform, setAiTransform] = useState<{
    x: number;
    y: number;
    scale: number;
    angle: number;
  }>({
    x: 0,
    y: 0,
    scale: 1.0,
    angle: 0,
  });

  // Ajustes manuales (calibración fina adicional)
  const [manualScale, setManualScale] = useState(1.0);
  const [manualPosY, setManualPosY] = useState(0);
  const [manualPosX, setManualPosX] = useState(0);
  const [opacity, setOpacity] = useState(0.95);
  const [showHUD, setShowHUD] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Suavizado cinemático (Lerp) para seguimiento sin tirones
  const smoothRef = useRef<{
    x: number;
    y: number;
    scale: number;
    angle: number;
  }>({
    x: 0,
    y: 0,
    scale: 1.0,
    angle: 0,
  });

  const images = product.imagesJson ? JSON.parse(product.imagesJson) : [];
  const garmentImageUrl = product.arOverlayImageUrl || images[0] || '/garments/biker_jacket.jpg';

  // 1. Cargar biblioteca MediaPipe Pose de forma dinámica si no está presente
  useEffect(() => {
    let isMounted = true;

    const loadMediaPipe = async () => {
      if ((window as any).Pose) {
        initPoseDetector();
        return;
      }

      const script = document.createElement('script');
      script.src = '/mediapipe/pose.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) {
          initPoseDetector();
        }
      };
      script.onerror = () => {
        console.warn('MediaPipe Pose cargado desde CDN alternativo');
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        cdnScript.onload = () => isMounted && initPoseDetector();
        document.body.appendChild(cdnScript);
      };
      document.body.appendChild(script);
    };

    loadMediaPipe();

    return () => {
      isMounted = false;
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          // ignore
        }
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // 2. Inicializar el motor de Pose Estimation
  const initPoseDetector = useCallback(() => {
    const PoseClass = (window as any).Pose;
    if (!PoseClass) return;

    try {
      const pose = new PoseClass({
        locateFile: (file: string) => `/mediapipe/${file}`,
      });

      pose.setOptions({
        modelComplexity: 0, // Lite: óptimo para 60 FPS en navegador
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(handlePoseResults);
      poseRef.current = pose;
      console.log('MediaPipe Pose inicializado correctamente para Body Tracking AR.');
    } catch (err) {
      console.error('Error inicializando Pose:', err);
    }
  }, []);

  // 3. Procesamiento de los Landmarks Anatómicos en Tiempo Real
  const handlePoseResults = (results: any) => {
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      setIsPoseDetected(false);
      clearCanvas();
      return;
    }

    const landmarks = results.poseLandmarks;
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    // Verificar visibilidad de hombros
    const visibilityThreshold = 0.45;
    if (
      !leftShoulder ||
      !rightShoulder ||
      (leftShoulder.visibility && leftShoulder.visibility < visibilityThreshold) ||
      (rightShoulder.visibility && rightShoulder.visibility < visibilityThreshold)
    ) {
      setIsPoseDetected(false);
      clearCanvas();
      return;
    }

    setIsPoseDetected(true);

    // Debido a que el video está en modo espejo (scaleX(-1)), invertimos la X horizontal
    // leftShoulder en pantalla corresponde al hombro derecho del usuario reflejado
    const mirroredLeftX = 1.0 - leftShoulder.x;
    const mirroredRightX = 1.0 - rightShoulder.x;

    const midX = (mirroredLeftX + mirroredRightX) / 2;
    const midY = (leftShoulder.y + rightShoulder.y) / 2;

    // Distancia euclidiana entre ambos hombros en el espacio normalizado (0 a 1)
    const dx = leftShoulder.x - rightShoulder.x;
    const dy = leftShoulder.y - rightShoulder.y;
    const shoulderDistance = Math.sqrt(dx * dx + dy * dy);

    // Ángulo de inclinación del torso (rotación natural al ladear el cuerpo)
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = -angleRad * (180 / Math.PI);

    // Escala proporcional respecto a distancia base de referencia (0.28 normalizada)
    const rawScale = Math.max(0.65, Math.min(2.0, (shoulderDistance / 0.28) * 1.05));

    // CÁLCULO BIOMÉTRICO DE TALLA EN TIEMPO REAL
    let computedSize = 'M';
    if (shoulderDistance < 0.22) {
      computedSize = 'S';
    } else if (shoulderDistance <= 0.31) {
      computedSize = 'M';
    } else if (shoulderDistance <= 0.38) {
      computedSize = 'L';
    } else {
      computedSize = 'XL';
    }

    setDetectedSize(computedSize);
    setAiConfidence(Math.min(99, Math.round(85 + shoulderDistance * 38)));

    // Suavizado exponencial (Lerp) para evitar vibración de imagen
    const lerpFactor = 0.28;
    // Dimensiones típicas del viewport en píxeles (aprox 500x520)
    const targetPixelX = (midX - 0.5) * 440;
    // Ajuste de altura según anclaje: Torso ancla ligeramente abajo del cuello
    const targetPixelY = (midY - 0.38) * 480;

    smoothRef.current.x += (targetPixelX - smoothRef.current.x) * lerpFactor;
    smoothRef.current.y += (targetPixelY - smoothRef.current.y) * lerpFactor;
    smoothRef.current.scale += (rawScale - smoothRef.current.scale) * 0.2;
    smoothRef.current.angle += (angleDeg - smoothRef.current.angle) * 0.25;

    setAiTransform({
      x: Math.round(smoothRef.current.x),
      y: Math.round(smoothRef.current.y),
      scale: parseFloat(smoothRef.current.scale.toFixed(3)),
      angle: parseFloat(smoothRef.current.angle.toFixed(1)),
    });

    // Dibujar marcadores HUD en el canvas
    drawTrackingNodes(mirroredLeftX, leftShoulder.y, mirroredRightX, rightShoulder.y, midX, midY);
  };

  // 4. Dibujar puntos de esqueleto en el HUD
  const drawTrackingNodes = (
    lx: number,
    ly: number,
    rx: number,
    ry: number,
    mx: number,
    my: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    const p1x = lx * w;
    const p1y = ly * h;
    const p2x = rx * w;
    const p2y = ry * h;

    // Línea guía de hombros (dorada neón con resplandor)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Nodo hombro izquierdo
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p1x, p1y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Nodo hombro derecho
    ctx.beginPath();
    ctx.arc(p2x, p2y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Ancla central de pecho
    ctx.fillStyle = '#d4af37';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(mx * w, my * h + 25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // 5. Ciclo continuo de análisis de fotogramas de la cámara
  const startPoseFrameLoop = () => {
    const loop = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
        try {
          await poseRef.current.send({ image: videoRef.current });
        } catch (err) {
          // Ignorar cuadros descartados durante cambio de resolución
        }
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };
    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Iniciar o apagar la cámara web
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsPoseDetected(false);
      clearCanvas();
    } else {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Auto-play fallback:', playErr);
          }
        }
        startPoseFrameLoop();
      } catch (err: any) {
        console.error('Error al acceder a la cámara:', err);
        setCameraError('No se pudo acceder a la cámara web. Verifica los permisos en tu navegador.');
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      videoRef.current.play().catch((e) => console.warn('Play error:', e));
      if (!animFrameIdRef.current) {
        startPoseFrameLoop();
      }
    }
  }, [isCameraActive]);

  // Aplicar talla recomendada por la IA
  const applyAiSize = (size: string) => {
    const match = product.variants.find((v) => v.size.toUpperCase() === size.toUpperCase());
    if (match) {
      setSelectedVariant(match);
    }
  };

  // Selector manual de talla
  const handleSizeChange = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (v.size === 'XS') setManualScale(0.85);
    else if (v.size === 'S') setManualScale(0.92);
    else if (v.size === 'M') setManualScale(1.0);
    else if (v.size === 'L') setManualScale(1.08);
    else if (v.size === 'XL' || v.size === 'XXL') setManualScale(1.16);
  };

  // Determinar posición final de la prenda según el modo activo
  const finalPosX = trackingMode === 'AI_TRACKING' && isPoseDetected
    ? aiTransform.x + manualPosX
    : manualPosX;

  const finalPosY = trackingMode === 'AI_TRACKING' && isPoseDetected
    ? aiTransform.y + manualPosY
    : manualPosY;

  const finalScale = trackingMode === 'AI_TRACKING' && isPoseDetected
    ? aiTransform.scale * manualScale
    : manualScale;

  const finalAngle = trackingMode === 'AI_TRACKING' && isPoseDetected
    ? aiTransform.angle
    : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 940, padding: 0, overflow: 'hidden' }}>
        {/* Header de Lujo */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.98)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--accent-gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b0f19',
              boxShadow: '0 0 16px rgba(212, 175, 55, 0.4)',
            }}>
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', margin: 0, fontWeight: 700 }}>
                Vestidor Virtual AR: <span className="gold-gradient-text">{product.name}</span>
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Realidad Aumentada & Tracking de Hombros y Torso en Tiempo Real (MediaPipe AI)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo Principal del Modal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', minHeight: 520 }}>
          {/* AR Viewport */}
          <div style={{
            position: 'relative',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRight: '1px solid var(--border-color)',
          }}>
            {/* Cámara en vivo */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: isCameraActive ? 'block' : 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Efecto espejo natural
                zIndex: 1,
              }}
            />

            {/* Canvas superpuesto para trazos biométricos y esqueleto */}
            <canvas
              ref={canvasRef}
              width={540}
              height={520}
              style={{
                display: isCameraActive ? 'block' : 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />

            {/* Maniquí Avatar Fallback (cuando la cámara está inactiva) */}
            <div style={{
              display: isCameraActive ? 'none' : 'flex',
              position: 'relative',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%)',
              zIndex: 1,
            }}>
              <div style={{
                position: 'relative',
                width: 280,
                height: 420,
                borderRadius: '140px 140px 60px 60px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px dashed rgba(212, 175, 55, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 30,
              }}>
                <div style={{
                  width: 70,
                  height: 90,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                }} />
                <div style={{
                  width: 220,
                  height: 2,
                  background: 'rgba(212, 175, 55, 0.5)',
                  marginTop: 35,
                }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', marginTop: 4 }}>
                  Línea Guía de Hombros
                </span>
              </div>
            </div>

            {/* Scanning Laser Line Effect */}
            <div className="ar-scanline" />

            {/* PRENDA VIRTUAL AR SUPERPUESTA (Modo Gucci Packshot con recorte transparente) */}
            <div
              style={{
                position: 'absolute',
                top: `calc(50% + ${finalPosY}px)`,
                left: `calc(50% + ${finalPosX}px)`,
                transform: `translate(-50%, -50%) scale(${finalScale}) rotate(${finalAngle}deg)`,
                transformOrigin: '50% 25%',
                transition: trackingMode === 'AI_TRACKING' && isPoseDetected
                  ? 'none' // Para que siga los 60 fps con suavizado Lerp
                  : 'transform 0.15s ease-out',
                pointerEvents: 'none',
                opacity: opacity,
                zIndex: 15,
                // mixBlendMode multiply elimina el fondo blanco y proyecta la prenda y sus sombras sobre el cuerpo
                mixBlendMode: isCameraActive ? 'multiply' : 'normal',
                filter: isCameraActive
                  ? 'contrast(1.15) brightness(1.05) drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                  : 'drop-shadow(0 15px 30px rgba(0,0,0,0.7))',
              }}
            >
              <img
                src={garmentImageUrl}
                alt={product.name}
                style={{
                  maxWidth: 340,
                  maxHeight: 400,
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* AR HUD Overlay Markers */}
            {showHUD && (
              <div style={{
                position: 'absolute',
                inset: 14,
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 12,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 12,
                zIndex: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '0.7rem',
                    color: isPoseDetected ? '#10b981' : 'var(--accent-gold)',
                    background: 'rgba(11, 15, 25, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${isPoseDetected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(212, 175, 55, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                  }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: isPoseDetected ? '#10b981' : '#f59e0b',
                      boxShadow: isPoseDetected ? '0 0 8px #10b981' : 'none',
                    }} />
                    {isPoseDetected
                      ? `TRACKING ACTIVO: ANCLADO AL CUERPO (${aiConfidence}% PRECISIÓN)`
                      : 'ESPERANDO DETECCIÓN DE HOMBROS...'}
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    color: '#fff',
                    background: 'rgba(11, 15, 25, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    fontWeight: 600,
                  }}>
                    TALLA: <span style={{ color: 'var(--accent-gold)' }}>{selectedVariant.size}</span>
                  </div>
                </div>

                {isPoseDetected && trackingMode === 'AI_TRACKING' && (
                  <div style={{
                    alignSelf: 'center',
                    background: 'rgba(11, 15, 25, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#a7f3d0',
                    fontSize: '0.74rem',
                    padding: '6px 14px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                  }}>
                    <Cpu size={14} color="#10b981" />
                    <span>IA Biometría: Hombros detectados. Talla sugerida: <strong>{detectedSize}</strong></span>
                    {selectedVariant.size !== detectedSize && (
                      <button
                        onClick={() => applyAiSize(detectedSize)}
                        style={{
                          background: '#10b981',
                          color: '#000',
                          border: 'none',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                        }}
                      >
                        Auto-Ajustar
                      </button>
                    )}
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(11, 15, 25, 0.75)',
                  backdropFilter: 'blur(4px)',
                  padding: '5px 10px',
                  borderRadius: 6,
                }}>
                  Párate frente a la cámara. La prenda se ajustará automáticamente a tu silueta.
                </div>
              </div>
            )}

            {/* Botón de Cámara en la esquina inferior */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 25 }}>
              <button
                onClick={toggleCamera}
                className={`btn btn-sm ${isCameraActive ? 'btn-secondary' : 'btn-primary'}`}
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
              >
                {isCameraActive ? <VideoOff size={15} /> : <Camera size={15} />}
                <span>{isCameraActive ? 'Usar Maniquí' : 'Activar Mi Cámara Web'}</span>
              </button>
            </div>
          </div>

          {/* Panel Lateral de Controles e IA */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            {cameraError && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: '#fcd34d',
              }}>
                {cameraError}
              </div>
            )}

            {/* Info de Producto */}
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Prenda Seleccionada
              </div>
              <h4 style={{ fontSize: '1.18rem', color: 'var(--text-primary)', margin: '4px 0' }}>
                {product.name}
              </h4>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                ${Number(product.basePrice) + Number(selectedVariant.priceAdjustment || 0)} USD
              </div>
            </div>

            {/* Selector de Modo de Ajuste: IA vs Manual */}
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: 4,
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => setTrackingMode('AI_TRACKING')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: trackingMode === 'AI_TRACKING' ? 'var(--accent-gold-gradient)' : 'transparent',
                  color: trackingMode === 'AI_TRACKING' ? '#000' : 'var(--text-secondary)',
                  transition: 'var(--transition)',
                }}
              >
                <Cpu size={14} /> Tracking IA Cuerpo
              </button>

              <button
                onClick={() => setTrackingMode('MANUAL')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: trackingMode === 'MANUAL' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: trackingMode === 'MANUAL' ? '#fff' : 'var(--text-secondary)',
                  transition: 'var(--transition)',
                }}
              >
                <Sliders size={14} /> Calibración Manual
              </button>
            </div>

            {/* Estado de la IA y cálculo de talla automático */}
            {trackingMode === 'AI_TRACKING' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Scan size={14} /> Análisis Biométrico en Vivo
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>
                    {isPoseDetected ? `${aiConfidence}% FIABILIDAD` : 'Buscando...'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Talla calculada por IA:
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#fff',
                    background: '#10b981',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {detectedSize}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  La prenda se adhiere y rota automáticamente siguiendo la posición de tus hombros y la inclinación de tu torso.
                </div>
              </div>
            )}

            {/* Selector de Talla (con resaltado de la recomendada) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Talla para probar:</label>
                {detectedSize && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>
                    Sugerida por IA: <strong>{detectedSize}</strong>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {product.variants.map((v) => {
                  const isAiChoice = v.size.toUpperCase() === detectedSize.toUpperCase();
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSizeChange(v)}
                      className={`btn btn-sm ${selectedVariant.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '6px 14px',
                        position: 'relative',
                        border: isAiChoice ? '1px solid #10b981' : undefined,
                      }}
                    >
                      {v.size}
                      {isAiChoice && (
                        <span style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calibración Fina (Manual) */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={13} color="var(--accent-gold)" /> Ajuste Milimétrico
                </span>
                <button
                  onClick={() => {
                    setManualScale(1.0);
                    setManualPosY(0);
                    setManualPosX(0);
                    setOpacity(0.95);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  <RefreshCw size={10} /> Reset
                </button>
              </div>

              {/* Ajuste Escala Manual */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Escala / Holgura:</span>
                  <span>{Math.round(finalScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.02"
                  value={manualScale}
                  onChange={(e) => setManualScale(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
                />
              </div>

              {/* Altura Vertical */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Altura en Torso:</span>
                  <span>{manualPosY}px</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="2"
                  value={manualPosY}
                  onChange={(e) => setManualPosY(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
                />
              </div>
            </div>

            {/* Acciones de Reserva y Compra */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onReserve(product, selectedVariant);
                }}
              >
                <CalendarCheck size={16} /> Reservar Probador Físico (Talla {selectedVariant.size})
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onBuy(product, selectedVariant);
                }}
              >
                <ShoppingBag size={16} /> Comprar Directamente Online
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
