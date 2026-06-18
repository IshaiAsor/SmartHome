#pragma once
// Single source of truth for the device capability manifest.
//
// This header is deliberately free of Arduino / sensor-library includes so it can be
// compiled BOTH on the ESP32 (firmware) and on a host (the manifest generator under
// tools/manifest-gen/). It pulls in only the descriptor structs from ActionPinsSetup.h
// and uses OUTPUT/INPUT, which the host build supplies via a tiny Arduino.h shim.
//
// Each action class forwards its blueprint()/supportedTraits()/googleActionType()/
// capability() statics to the matching function here, so runtime callers
// (DynamicDeviceActionsService, DeviceCapabilitiesService) and the host generator all
// read the exact same data — no drift.
#include <vector>
#include "actions/ActionPinsSetup.h"

namespace CapabilityRegistry {

// ---- Commands ----

inline CapabilityDescriptor outlet() {
    static const PinSlotDef pins[] = {
        { "relay", "Relay", OUTPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.OnOff", "OnOff" },
        { nullptr }
    };
    return { "outlet", "Outlet", "OutletCommandAction", "command", "outlet",
             "action.devices.types.OUTLET", traits, 0, pins };
}

inline CapabilityDescriptor fan() {
    static const PinSlotDef pins[] = {
        { "in1", "Direction Pin 1 (IN1)", OUTPUT },
        { "in2", "Direction Pin 2 (IN2)", OUTPUT },
        { "pwm", "Speed Pin (PWM)",       OUTPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.OnOff",    "OnOff"    },
        { "action.devices.traits.FanSpeed", "FanSpeed" },
        { nullptr }
    };
    return { "fan", "Fan", "OneDirectionalMotorAction", "command", "fan",
             "action.devices.types.FAN", traits, 0, pins };
}

inline CapabilityDescriptor dimmer() {
    static const PinSlotDef pins[] = {
        { "pwm", "PWM", OUTPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.OnOff",      "OnOff"      },
        { "action.devices.traits.Brightness", "Brightness" },
        { nullptr }
    };
    return { "dimmer", "Light Dimmer", "LightDimmerAction", "command", "dimmer",
             "action.devices.types.LIGHT", traits, 0, pins };
}

// ---- Telemetry ----

inline CapabilityDescriptor temperature() {
    static const PinSlotDef pins[] = {
        { "data", "1-Wire Data", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.TemperatureSetting", "TemperatureSetting" },
        { "action.devices.traits.HumiditySetting",    "HumiditySetting"    },
        { nullptr }
    };
    return { "temperature", "Temperature Sensor", "TemperatureAction", "telemetry", "sensor1",
             "action.devices.types.SENSOR", traits, 10000, pins };
}

inline CapabilityDescriptor waterLevel() {
    static const PinSlotDef pins[] = {
        { "adc", "ADC Input", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.WaterLevel", "WaterLevel" },
        { nullptr }
    };
    return { "water_level", "Water Level Sensor", "WaterLevelAction", "telemetry", "water_level",
             "action.devices.types.SENSOR", traits, 10000, pins };
}

inline CapabilityDescriptor phLevel() {
    static const PinSlotDef pins[] = {
        { "adc", "ADC Input", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.PhLevel", "PhLevel" },
        { nullptr }
    };
    return { "ph_level", "pH Sensor", "PhLevelAction", "telemetry", "ph_level",
             "action.devices.types.SENSOR", traits, 5000, pins };
}

inline CapabilityDescriptor tdsLevel() {
    static const PinSlotDef pins[] = {
        { "adc", "ADC Input", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.TdsLevel", "TdsLevel" },
        { nullptr }
    };
    return { "tds_level", "TDS Sensor", "TdsLevelAction", "telemetry", "tds_level",
             "action.devices.types.SENSOR", traits, 5000, pins };
}

inline CapabilityDescriptor humidity() {
    static const PinSlotDef pins[] = {
        { "sda", "I2C SDA (SHT41)", INPUT },
        { "scl", "I2C SCL (SHT41)", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.HumiditySetting", "HumiditySetting" },
        { nullptr }
    };
    return { "humidity", "Humidity Sensor", "HumidityAction", "telemetry", "humidity",
             "action.devices.types.SENSOR", traits, 2000, pins };
}

inline CapabilityDescriptor airTemp() {
    static const PinSlotDef pins[] = {
        { "sda", "I2C SDA (SHT41)", INPUT },
        { "scl", "I2C SCL (SHT41)", INPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.TemperatureSetting", "TemperatureSetting" },
        { nullptr }
    };
    return { "air_temp", "Air Temperature Sensor", "AirTemperatureAction", "telemetry", "air_temp",
             "action.devices.types.SENSOR", traits, 2000, pins };
}

inline CapabilityDescriptor co2Level() {
    static const PinSlotDef pins[] = {
        { "rx", "UART RX (MH-Z19B)", INPUT  },
        { "tx", "UART TX (MH-Z19B)", OUTPUT },
        { nullptr }
    };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.CO2Level", "CO2Level" },
        { nullptr }
    };
    return { "co2_level", "CO2 Sensor", "CO2LevelAction", "telemetry", "co2_level",
             "action.devices.types.SENSOR", traits, 5000, pins };
}

// ---- Camera (HAS_CAMERA builds only) ----

inline CapabilityDescriptor camera() {
    static const PinSlotDef pins[] = { { nullptr } };  // camera GPIO owned by board macros
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.CameraStream", "CameraStream" },
        { nullptr }
    };
    return { "camera", "Camera", "LiveStreamAction", "telemetry", "camera",
             "action.devices.types.CAMERA", traits, 333, pins };
}

inline CapabilityDescriptor cameraWsCapture() {
    static const PinSlotDef pins[] = { { nullptr } };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.CameraStream", "CameraStream" },
        { nullptr }
    };
    return { "camera_ws_capture", "Camera (Snapshot WS)", "TakePictureAction", "telemetry",
             "camera_ws_capture", "action.devices.types.CAMERA", traits, 1000, pins };
}

inline CapabilityDescriptor cameraHttpCapture() {
    static const PinSlotDef pins[] = { { nullptr } };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.CameraStream", "CameraStream" },
        { nullptr }
    };
    return { "camera_http_capture", "Camera (Snapshot HTTP)", "TakePictureHttpAction", "telemetry",
             "camera_http_capture", "action.devices.types.CAMERA", traits, 1000, pins };
}

inline CapabilityDescriptor cameraHttpStream() {
    static const PinSlotDef pins[] = { { nullptr } };
    static const GoogleTraitDef traits[] = {
        { "action.devices.traits.CameraStream", "CameraStream" },
        { nullptr }
    };
    return { "camera_http_stream", "Camera (Live Stream HTTP)", "LiveStreamHttpAction", "telemetry",
             "camera_http_stream", "action.devices.types.CAMERA", traits, 33, pins };
}

// Full manifest for the current build. The HAS_CAMERA gating mirrors the firmware exactly,
// so a host build compiled with -D HAS_CAMERA emits the camera capabilities and a build
// without it does not.
inline std::vector<CapabilityDescriptor> all() {
    std::vector<CapabilityDescriptor> caps;
    caps.push_back(outlet());
    caps.push_back(fan());
    caps.push_back(dimmer());
    caps.push_back(temperature());
    caps.push_back(waterLevel());
    caps.push_back(phLevel());
    caps.push_back(tdsLevel());
    caps.push_back(humidity());
    caps.push_back(airTemp());
    caps.push_back(co2Level());
#ifdef HAS_CAMERA
    caps.push_back(camera());
    caps.push_back(cameraWsCapture());
    caps.push_back(cameraHttpCapture());
    caps.push_back(cameraHttpStream());
#endif
    return caps;
}

}  // namespace CapabilityRegistry
