import os
import subprocess
from tqdm import tqdm

def upscale_images(input_folder, scale=4):
    # Make output folder same as input (overwrite)
    for root, _, files in os.walk(input_folder):
        for file in tqdm(files, desc=f"Processing {root}"):
            if not file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.webp')):
                continue

            input_path = os.path.join(root, file)
            output_path = input_path  # overwrite original

            # Run RealESRGAN on CPU with FP32 precision
            cmd = [
                "python3", "-m", "realesrgan",
                "-n", "RealESRGAN_x4plus",
                "-i", input_path,
                "-o", output_path,
                "--fp32"
            ]
            try:
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except subprocess.CalledProcessError:
                print(f"❌ Failed to upscale {input_path}")

if __name__ == "__main__":
    folder = input("Enter folder path containing images: ").strip()
    if os.path.isdir(folder):
        upscale_images(folder)
    else:
        print("Invalid folder path.")
