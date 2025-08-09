import json
from faker import Faker
import random
import os
import base64

fake = Faker('es_MX')

expedientes = []

for i in range(1000):
    expediente = {
        "profesional": None,  # Asignarás luego con IDs reales
        "titulos": [
            {
                "nombre": fake.job(),
                "imagenBase64": base64.b64encode(fake.text(50).encode()).decode()
            }
            for _ in range(random.randint(1, 3))
        ],
        "experiencias": [
            {
                "empresa": fake.company(),
                "descripcion": fake.sentence(nb_words=8),
                "años": random.randint(1, 10)
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

print(f"Archivo generado correctamente en: {output_path}")
