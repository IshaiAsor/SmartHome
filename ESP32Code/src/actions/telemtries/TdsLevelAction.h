#pragma once
#include <vector>
#include <Arduino.h>
#include "actions/telemtries/BaseTelemtryAction.h"

class TdsLevelAction : public BaseTelemetryAction
{
public:
    static const PinSlotDef* blueprint() {
        static const PinSlotDef slots[] = {
            { "adc", "ADC Input", INPUT },
            { nullptr }
        };
        return slots;
    }

    static const char* googleActionType() { return "action.devices.types.SENSOR"; }

    static const GoogleTraitDef* supportedTraits() {
        static const GoogleTraitDef traits[] = {
            { "action.devices.traits.TdsLevel", "TdsLevel" },
            { nullptr }
        };
        return traits;
    }

    static CapabilityDescriptor capability() {
        return { "tds_level", "TDS Sensor", "TdsLevelAction", "telemetry", "tds_level",
                 googleActionType(), supportedTraits(), 5000, blueprint() };
    }

private:
    int sensorPin;

public:
    TdsLevelAction(String name, std::vector<ActionPinsSetup> pins, int readInterval)
        : BaseTelemetryAction(name, readInterval, pins)
    {
        sensorPin = pins.empty() ? 0 : pins[0].PIN_NUMBER;
    }

    void initPins() override {}

    String executeTelemetryAction() override
    {
        int raw = analogRead(sensorPin);
        if (raw < 0 || raw > 4095) return "";
        float tds = (raw / 4095.0f) * 1000.0f;
        Serial.printf("TDS: %.1f ppm\n", tds);
        return String(tds, 1);
    }
};
