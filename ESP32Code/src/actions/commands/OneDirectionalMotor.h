
#pragma once
#include <vector>
#include <string>
#include <Arduino.h>
#include "BaseCommandAction.h"

class OneDirectionalMotorCommandAction : public BaseCommandAction
{
private:
    int in1PinNumber;
    int in2PinNumber;
    int pwmPinNumber;

public:
    OneDirectionalMotorCommandAction(String name, int in1Pin, int in2Pin, int pwmPin)
        : BaseCommandAction(name,
                            {ActionPinsSetup(in1Pin, OUTPUT),
                                 ActionPinsSetup(in2Pin, OUTPUT), 
                                 ActionPinsSetup(pwmPin, OUTPUT)}
                                 , {"off"})
    {
        in1PinNumber = in1Pin;
        in2PinNumber = in2Pin;
        pwmPinNumber = pwmPin;
    }
    void initPins()
    {
        for(int i = 0 ;i <=100; i++)
        {
           this->validParameters.push_back(String(i).c_str());
        }
    }
    void executeValidAction(String action) override
    {
        if (strcmp(action.c_str(), "0"))
        {
            digitalWrite(in1PinNumber, LOW);
            digitalWrite(in2PinNumber, LOW);
            digitalWrite(pwmPinNumber, 0);
            Serial.println("Motor OFF");
        }
        else
        {
            int parsedValue = atoi(action.c_str());
            int pwmValue = map(parsedValue, 0, 100, 0, 255);
            digitalWrite(in1PinNumber, HIGH);
            digitalWrite(in2PinNumber, LOW);
            digitalWrite(pwmPinNumber, pwmValue);
            Serial.println("Motor ON ");
        }
    }
};
