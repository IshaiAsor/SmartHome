#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>
#include <Arduino.h>
#include <secrets.h>
#include <cert.h>

// --- 1. Credentials ---
const char* ssid = SECRET_SSID;
const char* password = SECRET_PASS;
const char* mqtt_server = SECRET_MQTT_SERVER;
const int mqtt_port = SECRET_MQTT_PORT; 
const char* mqtt_user = SECRET_MQTT_USER;
const char* mqtt_pass = SECRET_MQTT_PASS;

// --- 2. Let's Encrypt Root Certificate (ISRG Root X1) ---
// Use a Raw String Literal (R"EOF(...)EOF") so you can paste it normally!
const char* root_ca = certificate_root; // Defined in cert.hS
WiFiClientSecure espClient;
PubSubClient client(espClient);


#define PIN        48 // The pin labeled on your board
#define NUMPIXELS  1  // There is only 1 RGB LED onboard
#define Serial Serial0 // or USBSerial, depending on your board's specific S3 wiring

Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

// --- 3. The "Ear" (Listening for Messages) ---
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Convert the payload to a readable string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Payload: ");
  Serial.println(message);

  // Check what to do
  if (String(topic) == "home/outlet-1/set") {
    if (message == "1") {
      Serial.println("Turning Outlet 1 ON!");
       digitalWrite(2, HIGH); 
      pixels.setPixelColor(0, pixels.Color(150, 0, 0));
      // --- 4. The "Mouth" (Reporting back to the server) ---
      //client.publish("home/outlet-1/set", "1");
    } 
    else if (message == "0") {
      Serial.println("Turning Outlet 1 OFF!");
       digitalWrite(2, LOW); 
      pixels.setPixelColor(0, pixels.Color(0, 0, 150));
      // Report back to the server
     // client.publish("home/outlet-1/set", "0");
    }
  }
}

void setup_wifi() {
  Serial.begin(115200);
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void syncTime(){
  // --- NEW: Sync the clock with the internet ---
  Serial.print("Syncing time");
  // Set time zone to Israel (GMT+2)
  configTime(2 * 3600, 0, "pool.ntp.org", "time.nist.gov"); 
  
  time_t now = time(nullptr);
  // Wait until the time is updated (greater than year 1970)
  while (now < 24 * 3600) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime synced successfully!");
}

// 1. Define your status topic
const char* statusTopic = "home/esp32/status";

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // 2. Connect with Last Will and Testament (LWT)
    // client.connect(clientID, username, password, willTopic, willQoS, willRetain, willMessage)
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass, statusTopic, 0, true, "offline")) {
      Serial.println("connected");
      
      // 3. Send the Birth Message immediately after connecting
      client.publish(statusTopic, "online", true); // true = retained message
      
      // (Don't forget to resubscribe to your '/set' topic here!)
      client.subscribe("home/esp32/set");
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  pixels.begin();
  setup_wifi();
  syncTime();
  // Apply the Let's Encrypt Root Certificate instead of setInsecure()
  espClient.setCACert(root_ca); 
 // espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  
  // Attach the "Ear" (Callback function) to the client
  client.setCallback(callback);
 // pinMode(2,OUTPUT);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  // This keeps the connection alive and checks for incoming messages
  client.loop(); 
}
