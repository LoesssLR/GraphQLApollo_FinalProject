import os
import json
import random
from faker import Faker
from pymongo import MongoClient

# === Config ===
DB_NAME = "ProyectoFinal"
COLL_EXPEDIENTES = "Expedientes"
OUTPUT_PATH = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA", "titulos.json")
CANTIDAD_TITULOS = 1000

# === Conexión a Mongo ===
client = MongoClient("mongodb://localhost:27017/")
db = client[DB_NAME]
expedientes = list(db[COLL_EXPEDIENTES].find({}, {"_id": 1}))

if not expedientes:
    print("⚠️ No se encontraron expedientes en la base de datos.")
    exit()

# === Generación de títulos ===
fake = Faker("es_MX")
fake_base64 = "U29sbyB1biB0aXR1bG8gZW4gYmFzZTY0Lg=="  # cadena base64 simulada

titulos = []

for _ in range(CANTIDAD_TITULOS):
    expediente_id = random.choice(expedientes)["_id"]
    titulo = {
        "nombre": fake.job(),
        "imagenBase64": fake_base64,
        "expediente": str(expediente_id)
    }
    titulos.append(titulo)

# === Guardar JSON ===
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(titulos, f, ensure_ascii=False, indent=2)

print(f"✅ {CANTIDAD_TITULOS} títulos generados correctamente y relacionados con expedientes reales.")
print(f"📂 Archivo: {OUTPUT_PATH}")

client.close()