
"""
Generate Titles Data Script
--------------------------
This script generates random title data using Faker and saves it as a JSON file.
Intended for populating the database with demo data for development or testing.

Steps:
    1. Generate 1000 random titles (Titulo)
    2. Save the data to 'titulos.json' in the data folder
"""

import os
import json
import random
from faker import Faker

fake = Faker("es_MX")

# Output file path and number of titles to generate
OUTPUT_PATH = os.path.join("..", "DEMO_PROYECTOFINAL", "JSON_MONGO_DATA", "titulos.json")
CANTIDAD_TITULOS = 1000

# Initialize Faker for Mexican Spanish locale
fake = Faker("es_MX")


def main():
    # List to store generated titles
    titulos = []
    for _ in range(CANTIDAD_TITULOS):
        titulos.append({
            "nombre": fake.job(),      # Title name
            "expediente": None         # Will be linked to an expediente later
        })

    # Create output folder if it does not exist
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    # Write titles data to JSON file
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(titulos, f, ensure_ascii=False, indent=2)

    # Print confirmation message
    print(f"✅ {CANTIDAD_TITULOS} títulos generados sin depender de la BD.")
    print(f"📂 Archivo: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
