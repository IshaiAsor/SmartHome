#pragma once
#include <vector>
#include <Arduino.h>
#include "actions/telemtries/BaseTelemtryAction.h"

class WaterLevelAction : public BaseTelemetryAction
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
            { "action.devices.traits.WaterLevel", "WaterLevel" },
            { nullptr }
        };
        return traits;
    }

    static CapabilityDescriptor capability() {
        return { "water_level", "Water Level Sensor", "WaterLevelAction", "telemetry", "water_level",
                 googleActionType(), supportedTraits(), 10000, blueprint() };
    }

private:
    int sensorPin;

public:
    WaterLevelAction(String name, std::vector<ActionPinsSetup> pins, int readInterval)
        : BaseTelemetryAction(name, readInterval, pins)
    {
        sensorPin = pins.empty() ? 0 : pins[0].PIN_NUMBER;
    }

    void initPins() override {}

    String executeTelemetryAction() override
    {
        int raw = analogRead(sensorPin);
        if (raw < 0 || raw > 4095) return "";
        float pct = (raw / 4095.0f) * 100.0f;
        Serial.printf("Water Level: %.1f%%\n", pct);
        return String(pct, 1);
    }
};
