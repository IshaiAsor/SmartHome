#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>
#include <Arduino.h>
#include <secrets.dev.h>
#include <cert.h>
#include <WiFiManager.h>

const char *ssid;        // = SECRET_SSID;
const char *password;    //= SECRET_PASS;
const char *mqtt_server; // = SECRET_MQTT_SERVER;
int mqtt_port;           //= SECRET_MQTT_PORT;
const char *mqtt_user;   // = SECRET_MQTT_USER;
const char *mqtt_pass;   // = SECRET_MQTT_PASS;
char deviceID[13];
const char *root_ca = certificate_root; // Defined in cert.hS

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup()
{
  Serial.begin(115200);
  loadSavedCredentials();
  // wifiManager.autoConnect("SmartHomeAP", "password123") ;
  setupWifiAndMqttServer();
  setupMqtt();
  syncTime();
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED || !client.connected())
  {
    reconnect();
  }
  // This keeps the connection alive and checks for incoming messages
  client.loop();
}

#define Serial Serial0 // or USBSerial, depending on your board's specific S3 wiring

// --- 3. The "Ear" (Listening for Messages) ---

WiFiManager wifiManager;
void loadSavedCredentials()
{
}

void setupWifiAndMqttServer()
{
  Serial.println("\nStarting WiFi Manager...");
  WiFiManagerParameter custom_mqtt_server("server", "MQTT Server", mqtt_server, 40);
  WiFiManagerParameter custom_mqtt_port("port", "MQTT Port", String(mqtt_port).c_str(), 6);
  WiFiManagerParameter custom_mqtt_user("user", "MQTT User", mqtt_user, 32);
  WiFiManagerParameter custom_mqtt_pass("pass", "MQTT Password", mqtt_pass, 32);
  wifiManager.addParameter(&custom_mqtt_server);
  wifiManager.addParameter(&custom_mqtt_port);
  wifiManager.addParameter(&custom_mqtt_user);
  wifiManager.addParameter(&custom_mqtt_pass);
  wifiManager.preloadWiFi(ssid, password);

  if (wifiManager.autoConnect("SmartHomeAP", "123456789"))
  {
    mqtt_server = custom_mqtt_server.getValue();
    mqtt_port = atoi(custom_mqtt_port.getValue());
    mqtt_user = custom_mqtt_user.getValue();
    mqtt_pass = custom_mqtt_pass.getValue();
    ssid = wifiManager.getWiFiSSID().c_str();
    password = wifiManager.getWiFiPass().c_str();
    
    Serial.println("Connected to WiFi!");
  }
  else
  {
    wifiManager.resetSettings(); // Clear WiFi credentials if connection fails
    Serial.println("Failed to connect to WiFi. Restarting...");
    ESP.restart();
  }
}

void setupMqttRegistration(){

}

void syncTime()
{
  // --- NEW: Sync the clock with the internet ---
  Serial.print("Syncing time");
  // Set time zone to Israel (GMT+2)
  configTime(2 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  time_t now = time(nullptr);
  // Wait until the time is updated (greater than year 1970)
  while (now < 24 * 3600)
  {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime synced successfully!");
}

// 1. Define your status topic
const char *statusTopic = "home/outlet-1/status";
bool connecteToMQTT()
{
  return client.connect("ESP32Client", mqtt_user, mqtt_pass, statusTopic, 0, true, "offline");
}
void reconnect()
{
  int attempt = 0;
  int max_attempts = 5;
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");

    // 2. Connect with Last Will and Testament (LWT)
    // client.connect(clientID, username, password, willTopic, willQoS, willRetain, willMessage)
    if (connecteToMQTT())
    {
      Serial.println("connected");

      // 3. Send the Birth Message immediately after connecting
      client.publish(statusTopic, "online", true); // true = retained message

      // (Don't forget to resubscribe to your '/set' topic here!)
      client.subscribe("home/outlet-1/set");
      attempt = 0; // Reset attempt counter on successful connection
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
      attempt++;
      if (attempt >= max_attempts)
      {
        Serial.println("Max MQTT connection attempts reached. Restarting...");
        wifiManager.resetSettings(); // Clear WiFi credentials to allow reconfiguration
        ESP.restart();
      }
    }
  }
}

void setupMqtt()
{
  Serial.print("Setting up MQTT...");
  Serial.println(mqtt_server);
  Serial.println(mqtt_port);
  client.setServer(mqtt_server, mqtt_port);
  espClient.setCACert(root_ca);
  client.setCallback(callback);
}

void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Convert the payload to a readable string
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.print("Payload: ");
  Serial.println(message);

  // Check what to do
  if (String(topic) == "home/outlet-1/set")
  {
    if (message == "1")
    {
      Serial.println("Turning Outlet 1 ON!");
      digitalWrite(2, HIGH);
      neopixelWrite(48, 150, 0, 0);
      // --- 4. The "Mouth" (Reporting back to the server) ---
      // client.publish("home/outlet-1/set", "1");
    }
    else if (message == "0")
    {
      Serial.println("Turning Outlet 1 OFF!");
      digitalWrite(2, LOW);
      neopixelWrite(48, 0, 0, 150);
      // Report back to the server
      // client.publish("home/outlet-1/set", "0");
    }
  }
}
