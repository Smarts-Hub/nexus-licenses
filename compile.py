import json
import os
import shutil
import subprocess

# Función para actualizar la versión en el archivo package.json
def update_package_json_version(version):
    package_json_path = './src/package.json'

    with open(package_json_path, 'r+') as f:
        data = json.load(f)
        data['version'] = version
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
    
    print(f"Versión en {package_json_path} actualizada a: {version}")

# Función para actualizar la versión en ./src/lib/version.js
def update_lib_version(version):
    lib_version_path = './src/lib.js'

    with open(lib_version_path, 'r+') as f:
        lines = f.readlines()

    with open(lib_version_path, 'w') as f:
        for line in lines:
            if line.strip().startswith('version:'):
                f.write(f'  version: "{version}",\n')
            else:
                f.write(line)
    
    print(f"Versión en {lib_version_path} actualizada a: {version}")

# Función para ejecutar el comando de ofuscación
def obfuscate_js():
    command = 'javascript-obfuscator ./src --output ./dist --exclude node_modules'
    subprocess.run(command, shell=True)
    print("Ofuscación completada.")

# Función para reemplazar config.js en la carpeta dist
def replace_config_js():
    config_src = './config.js'
    config_dst = './dist/config.js'

    # Borrar config.js de ./dist
    if os.path.exists(config_dst):
        os.remove(config_dst)
        print(f"{config_dst} eliminado.")

    # Copiar config.js desde ./ al directorio ./dist
    shutil.copy(config_src, config_dst)
    print(f"{config_src} copiado a {config_dst}.")

def main():
    # Solicitar la versión
    version = input("Introduce la nueva versión: ")

    # Actualizar versiones
    update_package_json_version(version)
    update_lib_version(version)

    # Ejecutar la ofuscación
    obfuscate_js()

    # Reemplazar config.js
    replace_config_js()

if __name__ == "__main__":
    main()
