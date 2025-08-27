
"""
Generate Professional Records Script
-----------------------------------
This script generates random professional records (expedientes) using Faker and saves them as a JSON file.
Intended for populating the database with demo data for development or testing.

Steps:
    1. Generate 1000 random expedientes
    2. Each expediente contains 1–4 random work experiences
    3. Save the data to 'expedientes.json' in the data folder
"""

import json
from faker import Faker
import random
import os


# Initialize Faker for Mexican Spanish locale
fake = Faker('es_MX')


# List to store generated expedientes
expedientes = []


# Generate 1000 random expedientes
for _ in range(1000):
    expediente = {
        "profesional": None, # Will be linked to a professional later
        "experiencias": [
            {
                "empresa": fake.company(),                # Company name
                "descripcion": fake.sentence(nb_words=8), # Description of work
                "anios": random.randint(1, 10)            # Years of experience
            }
            for _ in range(random.randint(1, 4))           # 1–4 experiences per expediente
        ]
    }
    expedientes.append(expediente)


# Prepare output folder and file path
folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA")
output_path = os.path.join(folder_path, "expedientes.json")
os.makedirs(folder_path, exist_ok=True)


# Write expedientes data to JSON file
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(expedientes, f, ensure_ascii=False, indent=2)


# Print confirmation message
print(f"✅ Archivo generado: {output_path}")
