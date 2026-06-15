import { Router } from 'express';
import { getModel } from '../models';
import { runVlm } from '../handlers/vlm.handler';
import { runLlm } from '../handlers/llm.handler';

export const inferRouter = Router();

inferRouter.post('/api/infer', async (req, res) => {
  const { kind, name, version, input } = req.body as {
    kind: string;
    name: string;
    version: string;
    input: Record<string, unknown>;
  };

  if (!kind || !name || !version || !input) {
    res.status(422).json({ error: 'kind, name, version, and input are required' });
    return;
  }

  const model = getModel(kind, name, version);
  if (!model) {
    res.status(404).json({ error: `Model ${kind}/${name}/${version} not found` });
    return;
  }

  const start = Date.now();
  try {
    let output: unknown;
    if (model.kind === 'vlm') {
      if (!input['image']) { res.status(422).json({ error: 'input.image is required for vlm' }); return; }
      output = await runVlm(model, { image: input['image'] as string });
    } else {
      if (!input['prompt']) { res.status(422).json({ error: 'input.prompt is required for llm' }); return; }
      output = await runLlm(model, {
        prompt: input['prompt'] as string,
        image:   input['image'] as string | undefined,
        context: input['context'] as Record<string, unknown> | undefined,
      });
    }
    res.json({ output, model: `${kind}/${name}/${version}`, duration_ms: Date.now() - start });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
