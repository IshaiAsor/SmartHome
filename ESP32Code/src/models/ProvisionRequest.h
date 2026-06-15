#pragma once
#include <vector>
#include <Arduino.h>
#include <ArduinoJson.h>
#include "JsonModel.h"
#include "actions/ActionPinsSetup.h"

struct ProvisionRequest : public JsonModel {
    String macAddress;
    String deviceType;
    String version;
    std::vector<CapabilityDescriptor> capabilities;

    void fromJson(JsonVariantConst src) override {}

    void toJson(JsonVariant dst) const override {
        dst["macAddress"] = macAddress;
        dst["deviceType"] = deviceType;
        dst["version"]    = version;
        JsonArray caps = dst["capabilities"].to<JsonArray>();
        for (const auto& d : capabilities)
            serializeCapability(caps, d);
    }

private:
    static void serializeCapability(JsonArray caps, const CapabilityDescriptor& d) {
        JsonObject cap = caps.add<JsonObject>();
        cap["capability_key"]            = d.key;
        cap["label"]                     = d.label;
        cap["implementation_type"]       = d.implType;
        cap["mqtt_action_type"]          = d.mqttType;
        cap["mqtt_action_name"]          = d.mqttName;
        cap["google_action_type"]        = d.googleType;
        cap["min_telemetry_interval_ms"] = d.minIntervalMs;
        JsonArray tr = cap["google_traits"].to<JsonArray>();
        for (const GoogleTraitDef* t = d.traits; t->traitValue != nullptr; ++t)
            tr.add(t->traitValue);
        JsonArray pinSlots = cap["configurable_pins"].to<JsonArray>();
        if (d.pins != nullptr) {
            for (const PinSlotDef* p = d.pins; p->key != nullptr; ++p) {
                JsonObject pin = pinSlots.add<JsonObject>();
                pin["key"]   = p->key;
                pin["label"] = p->label;
                pin["mode"]  = (p->mode == OUTPUT) ? "OUTPUT" : "INPUT";
            }
        }
    }
};
