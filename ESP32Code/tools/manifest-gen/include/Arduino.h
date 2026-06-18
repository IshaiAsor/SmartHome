#pragma once
// Minimal host shim. The capability-manifest code path (ActionPinsSetup.h,
// CapabilityRegistry.h, CapabilitySerializer.h) touches nothing from the real Arduino
// core except the pin-mode constants, so this is all the host build needs.
#ifndef INPUT
#define INPUT 0x01
#endif
#ifndef OUTPUT
#define OUTPUT 0x03
#endif
