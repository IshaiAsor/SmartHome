export interface VisionDetection {
  className: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

export interface IVisionAdapter {
  analyze(imageBuffer: Buffer): Promise<VisionDetection[]>;
}
