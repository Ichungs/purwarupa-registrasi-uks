#include <WiFi.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>
#include "esp_camera.h"
#include <MAX30102.h>  // Library oximeter
#include "heartRate.h"

// ====== KONFIGURASI ======
const char* WIFI_SSID = "NAMA_WIFI";
const char* WIFI_PASS = "PASSWORD_WIFI";
const char* SERVER_URL = "http://192.168.1.100:3000/api/presensi";

// Pin RFID RC522
#define SS_PIN 5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// Pin Kamera ESP32-CAM (sesuaikan board)
#define PWDN_GPIO_NUM -1
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 10
#define SIOD_GPIO_NUM 40
#define SIOC_GPIO_NUM 39
#define Y9_GPIO_NUM 48
#define Y8_GPIO_NUM 11
#define Y7_GPIO_NUM 12
#define Y6_GPIO_NUM 14
#define Y5_GPIO_NUM 16
#define Y4_GPIO_NUM 18
#define Y3_GPIO_NUM 17
#define Y2_GPIO_NUM 15
#define VSYNC_GPIO_NUM 38
#define HREF_GPIO_NUM 47
#define PCLK_GPIO_NUM 13

MAX30105 sensorOxi;
const int BUFFER_SIZE = 100;
double irBuffer[BUFFER_SIZE];

void setup() {
  Serial.begin(115200);
  
  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi terhubung: " + WiFi.localIP().toString());

  // RFID
  SPI.begin(2, 15, 7, 5);
  rfid.PCD_Init();
  Serial.println("RFID siap");

  // Kamera
  camera_config_t config;
  // ... konfigurasi pin kamera (sesuaikan board)
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) Serial.printf("Kamera gagal: 0x%x\n", err);

  // Oximeter MAX30102/MAX30105
  sensorOxi.begin(Wire, 0x57); // I2C address
  sensorOxi.setup();
  
  Serial.println("Semua modul siap!");
}

void loop() {
  // Tunggu kartu RFID
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  // Baca UID
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.println("UID RFID: " + uid);

  // Ambil foto
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Gagal ambil foto");
    return;
  }

  // Baca oximeter (sederhana)
  int denyut = 0, spo2 = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) {
    uint32_t val = sensorOxi.getIR();
    irBuffer[i] = val;
    delay(20);
  }
  denyut = checkForBeat(irBuffer, BUFFER_SIZE);
  spo2 = 95; // Hitung SpO2 sesuai library

  // Kirim ke server
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "multipart/form-data");

  // Build multipart body
  String boundary = "----ESP32Boundary";
  String body = "";
  body += "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"uid_rfid\"\r\n\r\n" + uid + "\r\n";
  body += "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"denyut_nadi\"\r\n\r\n" + String(denyut) + "\r\n";
  body += "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"spo2\"\r\n\r\n" + String(spo2) + "\r\n";
  body += "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"foto\"; filename=\"foto.jpg\"\r\n";
  body += "Content-Type: image/jpeg\r\n\r\n";

  // Kirim (gunakan http.POST dengan body binary)
  // ... implementasi lengkap sesuai library HTTPClient

  http.end();
  esp_camera_fb_return(fb);
  rfid.PICC_HaltA();
  delay(3000); // Debounce
}