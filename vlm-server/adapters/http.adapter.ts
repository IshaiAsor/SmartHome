import type { IVisionAdapter, VisionDetection } from './interface.ts';

export interface HttpAdapterConfig {
  url: string;
  headers?: Record<string, string>;
}

export class HttpAdapter implements IVisionAdapter {
  constructor(private readonly config: HttpAdapterConfig) {}

  async analyze(imageBuffer: Buffer): Promise<VisionDetection[]> {
    const res = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        ...(this.config.headers ?? {}),
      },
      body: imageBuffer,
    });

    if (!res.ok) {
      throw new Error(`HTTP adapter upstream error: ${res.status} ${res.statusText}`);
    }

    const body = await res.json() as Record<string, unknown>;

    // Normalize response — handles both generic { detections: [] } and
    // the legacy hydro-vision format { detections: [{className, confidence, box}] }
    const raw = Array.isArray(body['detections']) ? body['detections'] : [];
    return (raw as Record<string, unknown>[]).map(d => ({
      className:  String(d['className'] ?? d['class_name'] ?? 'Unknown'),
      confidence: Number(d['confidence'] ?? 0),
      box: {
        x1: Number((d['box'] as Record<string, unknown>)?.['x1'] ?? 0),
        y1: Number((d['box'] as Record<string, unknown>)?.['y1'] ?? 0),
        x2: Number((d['box'] as Record<string, unknown>)?.['x2'] ?? 0),
        y2: Number((d['box'] as Record<string, unknown>)?.['y2'] ?? 0),
      },
    }));
  }
}
