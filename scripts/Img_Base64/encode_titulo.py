import base64
import os
import tkinter as tk
from tkinter import filedialog

def convertir_imagen_a_base64(ruta_imagen):
    with open(ruta_imagen, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    # Detectar tipo MIME por extensión
    extension = os.path.splitext(ruta_imagen)[1].lower()
    if extension == ".png":
        mime = "image/png"
    elif extension in [".jpg", ".jpeg"]:
        mime = "image/jpeg"
    else:
        mime = "application/octet-stream"  # por si acaso

    return f"data:{mime};base64,{b64}"

def generar_mutacion(titulo_nombre, imagen_base64):
    return f'''
mutation {{
  agregarExpediente(
    profesionalCedula: "604840754",
    titulos: [
      {{
        nombre: "{titulo_nombre}",
        imagenBase64: "{imagen_base64}"
      }}
    ],
    experiencias: [
      {{
        empresa: "Empresa Prueba",
        descripcion: "Test de carga de imagen",
        anios: 1
      }}
    ]
  ) {{
    profesional {{
      cedula
      nombre
    }}
    titulos {{
      nombre
      imagenBase64
    }}
  }}
}}
'''

# === GUI para seleccionar archivo ===
root = tk.Tk()
root.withdraw()

print("📁 Selecciona la imagen del título desde el explorador...")
ruta = filedialog.askopenfilename(
    title="Seleccionar imagen del título",
    filetypes=[("Archivos de imagen", "*.jpg *.png *.jpeg")]
)

if not ruta:
    print("⚠️ No se seleccionó ninguna imagen.")
    exit()

nombre = os.path.splitext(os.path.basename(ruta))[0]
b64 = convertir_imagen_a_base64(ruta)

# Crear carpeta de salida
folder_path = os.path.join("..", "DEMO_PROYECTOFINAL", "MUTACIONES_TITULOS")
os.makedirs(output_folder, exist_ok=True)

# Crear archivo .txt
output_file = os.path.join(output_folder, f"mutacion_{nombre}.txt")
with open(output_file, "w", encoding="utf-8") as f:
    f.write(generar_mutacion(nombre, b64))

print(f"\n✅ Mutación guardada como archivo:\n{output_file}")
