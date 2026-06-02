export const components = {
  schemas: {
    HealthResponse: {
      type: 'object',
      required: ['status', 'uptime', 'timestamp'],
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 42.3 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    BoundingBox: {
      type: 'object',
      required: ['x1', 'y1', 'x2', 'y2'],
      properties: {
        x1: { type: 'number' }, y1: { type: 'number' },
        x2: { type: 'number' }, y2: { type: 'number' },
      },
    },
    Detection: {
      type: 'object',
      required: ['classId', 'className', 'confidence', 'box'],
      properties: {
        classId:    { type: 'integer' },
        className:  { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        box:        { $ref: '#/components/schemas/BoundingBox' },
      },
    },
    AggregatedDetection: {
      type: 'object',
      required: ['className', 'count', 'confidence'],
      properties: {
        className:  { type: 'string', example: 'Rusak' },
        count:      { type: 'integer', example: 3 },
        confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Highest confidence across instances' },
        boxes:      { type: 'array', items: { $ref: '#/components/schemas/BoundingBox' } },
      },
    },
    AnalyzeV1Response: {
      type: 'object',
      required: ['success', 'timestamp', 'detections_found', 'detections', 'aggregated', 'farm_control_action'],
      properties: {
        success:            { type: 'boolean' },
        timestamp:          { type: 'string', format: 'date-time' },
        detections_found:   { type: 'integer' },
        detections:         { type: 'array', items: { $ref: '#/components/schemas/Detection' } },
        aggregated:         { type: 'array', items: { $ref: '#/components/schemas/AggregatedDetection' } },
        farm_control_action: {
          type: 'string',
          enum: ['maintain_current_state', 'flush_nutrients_and_increase_watering', 'extend_light_cycle_brightness'],
        },
      },
    },
    AnalyzeV2Request: {
      type: 'object',
      required: ['type', 'image'],
      properties: {
        type:   { type: 'string', enum: ['onnx_local', 'http'], example: 'onnx_local' },
        config: {
          type: 'object',
          description: 'Adapter-specific config. For http: { url, headers? }. For onnx_local: {}',
          example: { url: 'http://other-service:3000/analyze' },
        },
        image:  { type: 'string', format: 'byte', description: 'Base64-encoded JPEG' },
      },
    },
    AnalyzeV2Response: {
      type: 'object',
      required: ['timestamp', 'detections'],
      properties: {
        timestamp:  { type: 'string', format: 'date-time' },
        detections: { type: 'array', items: { $ref: '#/components/schemas/AggregatedDetection' } },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};
