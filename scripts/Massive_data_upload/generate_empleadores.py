
"""
Generate Employers Data Script
-----------------------------
This script generates random employer data using Faker and saves it as a JSON file.
Intended for populating the database with demo data for development or testing.

Steps:
    1. Generate 1000 random employers (Empleador)
    2. Save the data to 'empleadores.json' in the data folder
"""

import json
from faker import Faker
import random
import os


# Initialize Faker for Mexican Spanish locale
fake = Faker('es_MX')


# List to store generated employers
empleadores = []


# Generate 1000 random employers
for i in range(1000):
    empleador = {
        "cedula": fake.unique.random_number(digits=9, fix_len=True), # Unique employer ID
        "nombre": fake.company(),                                   # Company name
        "tipo": random.choice(["FISICA", "JURIDICA"]),           # Type: FISICA or JURIDICA
        "puestosOfertados": []                                      # List of job vacancies (empty)
    }
    empleadores.append(empleador)


# Prepare output folder and file path
folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA")
output_path = os.path.join(folder_path, "empleadores.json")
os.makedirs(folder_path, exist_ok=True)


# Write employers data to JSON file
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(empleadores, f, ensure_ascii=False, indent=2)


# Print confirmation message
print(f"Archivo generado correctamente en: {output_path}")
