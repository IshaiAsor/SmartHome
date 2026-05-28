#pragma once
#include <Arduino.h>
#include "actions/commands/OnboardLedCommandAction.h"
#include "actions/telemtries/TemperatureAction.h"
#include "actions/commands/OutletCommandAction.h"
#include "actions/commands/OneDirectionalMotor.h"

static OnboardLedAction onboardLed("onboardLed", 48);
static OutletCommandAction outlet1("outlet1",4);
static OneDirectionalMotorCommandAction motor1("motor1", 5, 18, 19);
static BaseCommandAction* const DEVICE_ACTIONS_SETUP[] = {
   &onboardLed,
   &outlet1,
   &motor1
};

static TemperatureAction tempSensor1(7 , "sensor1", READING_INTERVAL);

static BaseTelemetryAction* const TELEMETRY_ACTIONS_SETUP[] = {
   &tempSensor1
};