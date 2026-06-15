#pragma once
#include <vector>
#include "actions/ActionPinsSetup.h"
#include "actions/commands/OutletCommandAction.h"
#include "actions/commands/OneDirectionalMotor.h"
#include "actions/commands/LightDimmerAction.h"
#include "actions/telemtries/TemperatureAction.h"
#include "actions/telemtries/WaterLevelAction.h"
#include "actions/telemtries/PhLevelAction.h"
#include "actions/telemtries/TdsLevelAction.h"
#include "actions/telemtries/HumidityAction.h"
#include "actions/telemtries/AirTemperatureAction.h"
#include "actions/telemtries/CO2LevelAction.h"
#ifdef HAS_CAMERA
#include "actions/telemtries/LiveStreamAction.h"
#include "actions/telemtries/TakePictureAction.h"
#include "actions/telemtries/TakePictureHttpAction.h"
#include "actions/telemtries/LiveStreamHttpAction.h"
#endif

class DeviceCapabilitiesService {
public:
    static std::vector<CapabilityDescriptor> getCapabilities() {
        std::vector<CapabilityDescriptor> caps;
        caps.push_back(OutletCommandAction::capability());
        caps.push_back(OneDirectionalMotorAction::capability());
        caps.push_back(LightDimmerAction::capability());
        caps.push_back(TemperatureAction::capability());
        caps.push_back(WaterLevelAction::capability());
        caps.push_back(PhLevelAction::capability());
        caps.push_back(TdsLevelAction::capability());
        caps.push_back(HumidityAction::capability());
        caps.push_back(AirTemperatureAction::capability());
        caps.push_back(CO2LevelAction::capability());
#ifdef HAS_CAMERA
        caps.push_back(LiveStreamAction::capability());
        caps.push_back(TakePictureAction::capability());
        caps.push_back(TakePictureHttpAction::capability());
        caps.push_back(LiveStreamHttpAction::capability());
#endif
        return caps;
    }
};
