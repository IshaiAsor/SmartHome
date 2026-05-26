#ifndef OTA_SERVICE_H
#define OTA_SERVICE_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

class OtaService {
public:
    OtaService(const char* currentVersion, const char* deviceType, const char* rootCa) 
        : _currentVersion(currentVersion), _deviceType(deviceType), _rootCa(rootCa) {}

    void handleUpdateMessage(const char* payload) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (error) {
            Serial.print("OTA: Failed to parse update payload: ");
            Serial.println(error.c_str());
            return;
        }

        const char* newVersion = doc["version"];
        const char* downloadUrl = doc["url"];

        if (!newVersion || !downloadUrl) {
            Serial.println("OTA: Invalid payload format");
            return;
        }

        if (strcmp(newVersion, _currentVersion) == 0) {
            Serial.print("OTA: Device is already on version ");
            Serial.println(_currentVersion);
            return;
        }

        Serial.print("OTA: New version available: ");
        Serial.println(newVersion);
        Serial.print("OTA: Downloading from: ");
        Serial.println(downloadUrl);

        performUpdate(downloadUrl);
    }

private:
    const char* _currentVersion;
    const char* _deviceType;
    const char* _rootCa;

    void performUpdate(const char* url) {
        WiFiClientSecure client;
        client.setCACert(_rootCa);

        // Optional: set timeout for large downloads
        client.setTimeout(12000); 

        Serial.println("OTA: Starting update process...");
        
        // This is a blocking call that will restart the ESP32 on success
        t_httpUpdate_return ret = httpUpdate.update(client, url);

        switch (ret) {
            case HTTP_UPDATE_FAILED:
                Serial.printf("OTA: Update failed! Error (%d): %s\n", 
                              httpUpdate.getLastError(), 
                              httpUpdate.getLastErrorString().c_str());
                break;

            case HTTP_UPDATE_NO_UPDATES:
                Serial.println("OTA: No updates available.");
                break;

            case HTTP_UPDATE_OK:
                Serial.println("OTA: Update successful! Rebooting...");
                break;
        }
    }
};

#endif
