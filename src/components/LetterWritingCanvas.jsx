import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { feedbackForScore, scoreCanvasPixels } from "../utils/goldenLettersCanvas";

const WIDTH = 360;
const HEIGHT = 320;

const LetterWritingCanvas = forwardRef(function LetterWritingCanvas({ glyph, mode = "trace", guideOpacity = 0.22, onResult }, ref) {
  const guideRef = useRef(null);
  const inkRef = useRef(null);
  const strokesRef = useRef([]);
  const currentRef = useRef([]);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [showGuide, setShowGuide] = useState(mode !== "write");
  const fontSize = Math.max(58, Math.min(220, Math.round(430 / Math.max(1, String(glyph || "").length))));

  const drawGuide = () => {
    const canvas = guideRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.save();
    context.font = `${fontSize}px 'Amiri','Scheherazade New','Noto Naskh Arabic',serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#c99418";
    context.globalAlpha = showGuide ? guideOpacity : 0;
    context.fillText(glyph || "", WIDTH / 2, HEIGHT / 2 + 8);
    context.restore();
  };

  const drawInk = () => {
    const canvas = inkRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.strokeStyle = "#102649";
    context.lineWidth = 10;
    context.lineCap = "round";
    context.lineJoin = "round";
    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      context.beginPath();
      context.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
    });
  };

  useEffect(drawGuide, [glyph, guideOpacity, showGuide]);
  useEffect(() => { strokesRef.current = []; currentRef.current = []; setHasInk(false); drawInk(); }, [glyph, mode]);

  const pointFromEvent = (event) => {
    const canvas = inkRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    return { x: ((source.clientX - rect.left) / rect.width) * WIDTH, y: ((source.clientY - rect.top) / rect.height) * HEIGHT };
  };

  const start = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    currentRef.current = [pointFromEvent(event)];
    strokesRef.current = [...strokesRef.current, currentRef.current];
    setHasInk(true);
  };
  const move = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    currentRef.current.push(pointFromEvent(event));
    drawInk();
  };
  const end = (event) => { if (event?.preventDefault) event.preventDefault(); drawingRef.current = false; currentRef.current = []; };

  const clear = () => { strokesRef.current = []; currentRef.current = []; setHasInk(false); drawInk(); onResult?.(null); };
  const undo = () => { strokesRef.current = strokesRef.current.slice(0, -1); setHasInk(strokesRef.current.length > 0); drawInk(); onResult?.(null); };
  const check = () => {
    const guideCanvas = document.createElement("canvas");
    guideCanvas.width = WIDTH; guideCanvas.height = HEIGHT;
    const context = guideCanvas.getContext("2d");
    context.font = `${fontSize}px 'Amiri','Scheherazade New','Noto Naskh Arabic',serif`;
    context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = "#000";
    context.fillText(glyph || "", WIDTH / 2, HEIGHT / 2 + 8);
    const guidePixels = context.getImageData(0, 0, WIDTH, HEIGHT);
    const userPixels = inkRef.current.getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
    const result = scoreCanvasPixels(guidePixels, userPixels, WIDTH, HEIGHT, mode === "write" ? 22 : 14);
    const complete = { ...result, ...feedbackForScore(result, mode) };
    onResult?.(complete);
    return complete;
  };

  useImperativeHandle(ref, () => ({ clear, undo, check, showGuide: () => setShowGuide(true), hasInk: () => hasInk }));

  return <div className="gl-writing-wrap">
    <div className="gl-writing-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end}>
      <canvas ref={guideRef} width={WIDTH} height={HEIGHT} aria-hidden="true" />
      <canvas ref={inkRef} width={WIDTH} height={HEIGHT} aria-label={`Writing canvas for ${glyph}`} />
      {!hasInk && <span className="gl-canvas-hint">Write here</span>}
    </div>
    <div className="gl-canvas-tools">
      <button type="button" onClick={undo} disabled={!hasInk}>↶ Undo</button>
      <button type="button" onClick={clear} disabled={!hasInk}>Clear</button>
      <button type="button" onClick={() => setShowGuide((value) => !value)}>{showGuide ? "Hide guide" : "Show me"}</button>
    </div>
  </div>;
});

export default LetterWritingCanvas;
