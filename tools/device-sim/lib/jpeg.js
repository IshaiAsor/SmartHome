// A tiny but structurally-valid baseline JPEG (1x1), used as the payload for simulated camera
// frames. Real firmware sends raw JPEG bytes from the camera driver; the backend transport
// (device-gateway WS /ws/stream + /ws/capture, and POST /api/camera/frame) only forwards bytes,
// so a minimal valid JPEG is enough to exercise the camera pipeline end-to-end.

const SAMPLE_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==';

const SAMPLE_JPEG = Buffer.from(SAMPLE_JPEG_B64, 'base64');

// Returns a frame buffer. Kept as a function so a future revision can vary the bytes per frame
// (e.g. stamp a counter) without changing call sites.
function makeFrame() {
  return SAMPLE_JPEG;
}

module.exports = { SAMPLE_JPEG, makeFrame };
