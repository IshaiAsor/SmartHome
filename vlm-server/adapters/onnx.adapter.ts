import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import type { IVisionAdapter, VisionDetection } from './interface.ts';

export class OnnxAdapter implements IVisionAdapter {
  private session: ort.InferenceSession | null = null;
  private readonly modelPath: string;
  private readonly classes: string[];

  constructor(modelPath: string, classes: string[]) {
    this.modelPath = modelPath;
    this.classes = classes;
  }

  async init(): Promise<void> {
    this.session = await ort.InferenceSession.create(this.modelPath);
    console.log(`[OnnxAdapter] Model loaded: ${this.modelPath}`);
  }

  async analyze(imageBuffer: Buffer): Promise<VisionDetection[]> {
    if (!this.session) throw new Error('ONNX session not initialized — call init() first');

    const { data } = await sharp(imageBuffer)
      .resize(640, 640, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelCount = 640 * 640;
    const float32Data = new Float32Array(3 * pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      float32Data[i]                  = (data[i * 3]     ?? 0) / 255.0;
      float32Data[i + pixelCount]     = (data[i * 3 + 1] ?? 0) / 255.0;
      float32Data[i + 2 * pixelCount] = (data[i * 3 + 2] ?? 0) / 255.0;
    }

    const inputName = this.session.inputNames[0];
    if (!inputName) throw new Error('ONNX model has no input name');

    const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
    const outputs = await this.session.run({ [inputName]: inputTensor });

    const outputName = this.session.outputNames[0];
    if (!outputName) throw new Error('ONNX model has no output name');
    const outputTensor = outputs[outputName];
    if (!outputTensor) throw new Error('ONNX model returned no output tensor');

    return this.parseOutput(outputTensor.data as Float32Array, outputTensor.dims);
  }

  private softmax(values: number[]): number[] {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, v) => a + v, 0) || 1;
    return exps.map(v => v / sum);
  }

  private iou(a: VisionDetection, b: VisionDetection): number {
    const x1 = Math.max(a.box.x1, b.box.x1);
    const y1 = Math.max(a.box.y1, b.box.y1);
    const x2 = Math.min(a.box.x2, b.box.x2);
    const y2 = Math.min(a.box.y2, b.box.y2);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    if (inter === 0) return 0;
    const areaA = Math.max(0, a.box.x2 - a.box.x1) * Math.max(0, a.box.y2 - a.box.y1);
    const areaB = Math.max(0, b.box.x2 - b.box.x1) * Math.max(0, b.box.y2 - b.box.y1);
    const union = areaA + areaB - inter;
    return union > 0 ? inter / union : 0;
  }

  private nms(detections: VisionDetection[], iouThreshold = 0.45): VisionDetection[] {
    const results: VisionDetection[] = [];
    const sorted = detections.slice().sort((a, b) => b.confidence - a.confidence);
    while (sorted.length > 0) {
      const current = sorted.shift()!;
      results.push(current);
      for (let i = sorted.length - 1; i >= 0; i--) {
        const c = sorted[i];
        if (!c || current.className !== c.className) continue;
        if (this.iou(current, c) > iouThreshold) sorted.splice(i, 1);
      }
    }
    return results;
  }

  private parseOutput(data: Float32Array, dims: readonly number[]): VisionDetection[] {
    if (dims.length < 3) throw new Error('Unexpected ONNX output dimensions');

    let numElements = dims[1]!;
    let numPredictions = dims[2]!;
    let rowMajor = false;

    if (numElements !== 7 && dims[2] === 7) {
      numElements = dims[2]!;
      numPredictions = dims[1]!;
      rowMajor = true;
    }

    if (numElements < 7) throw new Error('Unexpected ONNX output element count');

    const classCount = Math.min(this.classes.length, numElements - 4);
    const confidenceThreshold = 0.5;
    const detections: VisionDetection[] = [];

    for (let p = 0; p < numPredictions; p++) {
      const logits: number[] = [];
      for (let c = 0; c < classCount; c++) {
        const idx = rowMajor
          ? p * numElements + 4 + c
          : (4 + c) * numPredictions + p;
        logits.push(data[idx] ?? 0);
      }

      const probs = this.softmax(logits);
      const maxConf = Math.max(...probs);
      const classId = probs.indexOf(maxConf);

      if (maxConf > confidenceThreshold && classId >= 0) {
        const cx = (rowMajor ? data[p * numElements + 0] : data[0 * numPredictions + p]) ?? 0;
        const cy = (rowMajor ? data[p * numElements + 1] : data[1 * numPredictions + p]) ?? 0;
        const w  = (rowMajor ? data[p * numElements + 2] : data[2 * numPredictions + p]) ?? 0;
        const h  = (rowMajor ? data[p * numElements + 3] : data[3 * numPredictions + p]) ?? 0;

        detections.push({
          className: this.classes[classId] ?? 'Unknown',
          confidence: maxConf,
          box: {
            x1: cx * 640 - (w * 640) / 2,
            y1: cy * 640 - (h * 640) / 2,
            x2: cx * 640 + (w * 640) / 2,
            y2: cy * 640 + (h * 640) / 2,
          },
        });
      }
    }

    return this.nms(detections).sort((a, b) => b.confidence - a.confidence);
  }
}
