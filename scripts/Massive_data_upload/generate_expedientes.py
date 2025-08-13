import json
from faker import Faker
import random
import os

fake = Faker('es_MX')

expedientes = []

for _ in range(1000):
    expediente = {
        "profesional": None,
        "experiencias": [
            {
                "empresa": fake.company(),
                "descripcion": fake.sentence(nb_words=8),
                "anios": random.randint(1, 10)
            }
            for _ in range(random.randint(1, 4))
        ]
    }
    expedientes.append(expediente)

folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA")
output_path = os.path.join(folder_path, "expedientes.json")
os.makedirs(folder_path, exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(expedientes, f, ensure_ascii=False, indent=2)

print(f"✅ Archivo generado: {output_path}")
