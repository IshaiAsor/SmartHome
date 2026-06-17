#pragma once
#include <vector>
#include <string>
#include <Arduino.h>
#include <ArduinoJson.h>
#include "services/PreferencesManagerService.h"
#include <actions/ActionPinsSetup.h>
#include <actions/AckPublisher.h>

// Result returned by execute() so the MQTT callback can publish the ack right at the
// call site, keeping ack logic out of the action class entirely.
struct ActionResult
{
    bool   ok;
    String commandId; // empty for unsolicited changes (auto-off, boot restore)
    String value;     // state the device actually applied
};

class BaseCommandAction
{
protected:
    bool hasRange = false;
    int  rangeMin = 0;
    int  rangeMax = 0;

    int32_t       _durationMs     = -1;
    unsigned long _durationStart  = 0;
    bool          _durationActive = false;

    String state;

    bool validateActionPayload(String action)
    {
        for (int i = 0; i < validParameters.size(); i++)
        {
            if (strcmp(action.c_str(), validParameters[i].c_str()) == 0)
                return true;
        }
        if (hasRange)
        {
            bool isNum = action.length() > 0;
            for (unsigned int i = 0; i < action.length(); i++)
            {
                if (!isdigit(action[i]) && !(i == 0 && action[i] == '-'))
                {
                    isNum = false;
                    break;
                }
            }
            if (isNum)
            {
                int val = action.toInt();
                if (val >= rangeMin && val <= rangeMax)
                    return true;
            }
        }
        return false;
    }

    // Returns true if the action was valid and applied, false if rejected.
    bool applyAction(String action, int32_t durationMs = -1)
    {
        if (validateActionPayload(action))
        {
            Serial.println("Executing valid action: " + action);
            executeValidAction(action);
            state = action;
            prefService.SaveActionState((char *)actionName.c_str(), (char *)action.c_str());
            if (durationMs > 0)
            {
                _durationMs    = durationMs;
                _durationStart = millis();
                _durationActive = true;
            }
            else
            {
                _durationActive = false;
            }
            return true;
        }
        Serial.println("Invalid parameter: " + action);
        return false;
    }

    virtual void executeValidAction(String action) = 0;

private:
    PreferencesManagerService prefService;

public:
    String actionName;
    std::vector<ActionPinsSetup> actionPinsSetup;
    std::vector<std::string> validParameters;

    BaseCommandAction(String name, std::vector<ActionPinsSetup> pinsSetup, std::vector<std::string> validParams)
    {
        actionName = name;
        actionPinsSetup = pinsSetup;
        validParameters = validParams;
    }

    BaseCommandAction(String name, std::vector<ActionPinsSetup> pinsSetup, std::vector<std::string> validParams,
                      bool useRange, int rMin, int rMax)
    {
        actionName = name;
        actionPinsSetup = pinsSetup;
        validParameters = validParams;
        hasRange = useRange;
        rangeMin = rMin;
        rangeMax = rMax;
    }

    virtual ~BaseCommandAction() {}

    // Restores the last saved state from NVS on boot. Publishes an unsolicited ack (no
    // commandId) so the backend records the restored state as authoritative.
    void loadState()
    {
        String lastState = prefService.LoadActionState((char *)actionName.c_str());
        if (lastState.length() > 0)
        {
            bool ok = applyAction(lastState);
            if (ackPublisher)
                ackPublisher(actionName.c_str(), "", ok, lastState.c_str());
        }
    }

    // Duration auto-off. Publishes an unsolicited ack (no commandId) so the backend
    // records the "off" as the authoritative state even though no user command caused it.
    virtual void loop()
    {
        if (_durationActive &&
            (millis() - _durationStart) >= (unsigned long)_durationMs)
        {
            _durationActive = false;
            applyAction("off");
            if (ackPublisher)
                ackPublisher(actionName.c_str(), "", true, "off");
        }
    }

    virtual void initPins()
    {
        for (int i = 0; i < actionPinsSetup.size(); i++)
        {
            pinMode(actionPinsSetup[i].PIN_NUMBER, actionPinsSetup[i].PIN_MODE);
            Serial.println("Pin " + String(actionPinsSetup[i].PIN_NUMBER) + " set to " + String(actionPinsSetup[i].PIN_MODE));
        }
    }

    // Parses JSON payload {"value":"on","duration":30,"commandId":"..."} and applies it.
    // Returns the result so the MQTT callback can publish the ack at the call site.
    virtual ActionResult execute(String payload)
    {
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, payload);

        String action;
        String commandId;
        int32_t durationMs = -1;

        if (!err && !doc["value"].isNull())
        {
            action = doc["value"].as<String>();
            JsonVariant dur = doc["duration"];
            if (!dur.isNull() && strcmp(dur.as<const char *>(), "*") != 0)
                durationMs = (int32_t)(dur.as<float>() * 1000.0f);
            JsonVariant cid = doc["commandId"];
            if (!cid.isNull())
                commandId = cid.as<String>();
        }
        else
        {
            action = payload;
        }

        bool ok = applyAction(action, durationMs);
        return { ok, commandId, ok ? state : action };
    }
};
