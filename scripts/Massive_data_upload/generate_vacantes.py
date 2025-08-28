
"""
Generate Vacancies Data Script
-----------------------------
This script generates random job vacancy data using Faker and saves it as a JSON file.
Intended for populating the database with demo data for development or testing.

Steps:
    1. Generate 1000 random vacancies (Vacante)
    2. Save the data to 'vacantes.json' in the data folder
"""

import json
from faker import Faker
import random
import os


# Initialize Faker for Mexican Spanish locale
fake = Faker('es_MX')


# Example areas of expertise
areas = ["Informática", "Electricista", "Administración", "Contabilidad", "Turismo"]


# List to store generated vacancies
vacantes = []


# Generate 1000 random vacancies
for i in range(1000):
    vacante = {
        "titulo": fake.job(),                                 # Job title
        "area": random.choice(areas),                         # Area of expertise
        "descripcion": fake.sentence(nb_words=12),            # Job description
        "empresa": None,                                      # Will be linked to an employer later
        "fechaPublicacion": fake.date_this_year().isoformat() # Publication date
    }
    vacantes.append(vacante)


# Prepare output folder and file path
folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA")
output_path = os.path.join(folder_path, "vacantes.json")
os.makedirs(folder_path, exist_ok=True)


# Write vacancies data to JSON file
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(vacantes, f, ensure_ascii=False, indent=2)


# Print confirmation message
print(f"Archivo generado correctamente en: {output_path}")
