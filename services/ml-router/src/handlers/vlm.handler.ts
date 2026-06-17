import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { resolve } from 'path';
import { env } from '../config/env.config';
import type { ModelConfig } from '../models';

export interface BoundingBox { x: number; y: number; w: number; h: number }
export interface Detection { label: string; confidence: number; box?: BoundingBox }
export interface VlmOutput { detections: Detection[] }

// Lazy-loaded ONNX sessions keyed by absolute model path.
const _sessions = new Map<string, ort.InferenceSession>();

async function getSession(modelFile: string): Promise<ort.InferenceSession> {
  const path = resolve(env.onnxModelsDir, modelFile);
  if (!_sessions.has(path)) {
    _sessions.set(path, await ort.InferenceSession.create(path));
  }
  return _sessions.get(path)!;
}

const CONF_THRESHOLD = 0.25;
const IOU_THRESHOLD  = 0.45;

function iou(a: BoundingBox, b: BoundingBox): number {
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(a.x + a.w, b.x + b.w);
  const iy2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  return inter / (a.w * a.h + b.w * b.h - inter);
}

function nms(dets: Detection[]): Detection[] {
  dets.sort((a, b) => b.confidence - a.confidence);
  const suppressed = new Set<number>();
  const kept: Detection[] = [];
  for (let i = 0; i < dets.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(dets[i]);
    for (let j = i + 1; j < dets.length; j++) {
      const bi = dets[i].box;
      const bj = dets[j].box;
      if (dets[i].label === dets[j].label && bi && bj && iou(bi, bj) > IOU_THRESHOLD) {
        suppressed.add(j);
      }
    }
  }
  return kept;
}

async function runOnnx(model: ModelConfig, imageBase64: string): Promise<VlmOutput> {
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  // Resize to 640×640, drop alpha, keep RGB — output is HWC uint8
  const raw = await sharp(imageBuffer)
    .resize(640, 640, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Reorder HWC → CHW and normalise 0–255 to 0–1
  const numPixels = 640 * 640;
  const float32 = new Float32Array(3 * numPixels);
  for (let i = 0; i < numPixels; i++) {
    float32[i]               = raw[i * 3]!     / 255.0;  // R plane
    float32[numPixels + i]   = raw[i * 3 + 1]! / 255.0;  // G plane
    float32[2 * numPixels + i] = raw[i * 3 + 2]! / 255.0; // B plane
  }

  const session = await getSession(model.modelFile!);
  const tensor = new ort.Tensor('float32', float32, [1, 3, 640, 640]);
  const results = await session.run({ [session.inputNames[0]!]: tensor });
  const outputData = results[session.outputNames[0]!]?.data as Float32Array | undefined;
  if (!outputData) return { detections: [] };

  // Ultralytics YOLO11 ONNX output: [1, 4+nc, na]
  // Rows 0–3: cx, cy, w, h (pixel coords in 640×640 space)
  // Rows 4…: class scores (sigmoid already applied)
  const nc = model.classes?.length ?? 0;
  const na = outputData.length / (4 + nc);

  const detections: Detection[] = [];
  for (let a = 0; a < na; a++) {
    let bestClass = 0;
    let bestScore = outputData[4 * na + a]!;
    for (let c = 1; c < nc; c++) {
      const score = outputData[(4 + c) * na + a]!;
      if (score > bestScore) { bestScore = score; bestClass = c; }
    }
    if (bestScore < CONF_THRESHOLD) continue;

    const cx = outputData[0 * na + a]!;
    const cy = outputData[1 * na + a]!;
    const w  = outputData[2 * na + a]!;
    const h  = outputData[3 * na + a]!;
    detections.push({
      label: model.classes?.[bestClass] ?? String(bestClass),
      confidence: bestScore,
      box: { x: cx - w / 2, y: cy - h / 2, w, h },
    });
  }

  return { detections: nms(detections) };
}

async function runOllama(model: ModelConfig, imageBase64: string): Promise<VlmOutput> {
  const res = await fetch(`${env.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.ollamaModel,
      prompt: 'Describe what you detect in this image. List each object with its confidence as a JSON array of {label, confidence} objects. Respond with JSON only.',
      images: [imageBase64],
      format: 'json',
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama VLM error: ${res.status}`);
  const body = await res.json() as { response: string };
  const parsed = JSON.parse(body.response) as Detection[] | { detections: Detection[] };
  const detections = Array.isArray(parsed) ? parsed : parsed.detections ?? [];
  return { detections };
}

export async function runVlm(model: ModelConfig, input: { image: string }): Promise<VlmOutput> {
  return model.backend === 'onnx'
    ? runOnnx(model, input.image)
    : runOllama(model, input.image);
}
