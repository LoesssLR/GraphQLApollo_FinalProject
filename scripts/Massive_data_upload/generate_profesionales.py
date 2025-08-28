
"""
Generate Professionals Data Script
---------------------------------
This script generates random professional data using Faker and saves it as a JSON file.
Intended for populating the database with demo data for development or testing.

Steps:
    1. Generate 1000 random professionals (Profesional)
    2. Save the data to 'profesionales.json' in the data folder
"""

import json
from faker import Faker
import random
import os


# Initialize Faker for Mexican Spanish locale
fake = Faker('es_MX')


# Example areas of expertise
areas = ["Informática", "Electricista", "Administración", "Contabilidad", "Turismo"]


# List to store generated professionals
profesionales = []


# Generate 1000 random professionals
for i in range(1000):
    fake.unique.clear()  # Clear unique data to avoid duplicates
    profesional = {
        "cedula": fake.unique.random_number(digits=9, fix_len=True), # Unique professional ID
        "nombre": fake.name(),                                      # Full name
        "genero": random.choice(["Masculino", "Femenino", "Otro"]), # Gender
        "profesiones": random.sample(areas, k=random.randint(1, 3)),    # 1–3 random areas
        "postulaciones": []                                              # Empty applications
    }
    profesionales.append(profesional)


# Prepare output folder and file path
folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA")
output_path = os.path.join(folder_path, "profesionales.json")


# Create folder if it does not exist
os.makedirs(folder_path, exist_ok=True)


# Write professionals data to JSON file
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(profesionales, f, ensure_ascii=False, indent=2)


# Print confirmation message
print(f"Archivo generado correctamente en: {output_path}")

