import os
import time
import pyautogui
import pygetwindow as gw
import pytesseract
import librosa
import numpy as np
import soundfile as sf
import sounddevice as sd
import cv2 as cv
from PIL import ImageGrab
import sys
import tempfile



sys.stdout.reconfigure(encoding='utf-8')


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
VOICES_DIR = os.path.join(BASE_DIR, "Audio", "RAW", "voices")
os.makedirs(VOICES_DIR, exist_ok=True)
GRID_START_X = 161
GRID_START_Y = [288, 543]
COL_SPACING = 187
NUM_COLS = 7
CLOSE_BUTTON = (1255, 81)
VOICE_INDICATOR = cv.imread(os.path.join(BASE_DIR, 'voice_button.png'), cv.IMREAD_COLOR)
EVOLVE_INDICATOR = cv.imread(os.path.join(BASE_DIR, 'evolve_indicator.png'), cv.IMREAD_COLOR)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

CARD_NAME_BBOX = (663, 166, 1116, 198)
VOICE_BUTTON = (1262, 488)
EVOLVE_BUTTON = (116, 680)
AUDACITY_RECORD = (333, 80)
AUDACITY_STOP = (156, 80)
EXPORT_HOTKEY = "ctrl+shift+e"

DURATION = 5

def warmup_audio(device=2, sr=44100):
    import sounddevice as sd
    import numpy as np

    print("🎧 Warming up audio device...")

    # --- Warm up input ---
    try:
        _ = sd.rec(int(0.2 * sr), samplerate=sr, channels=1, device=device)
        sd.wait()
        print("✅ Input device warmed up.")
    except Exception as e:
        print(f"⚠️ Input warm-up failed: {e}")

    # --- Warm up output (safely) ---
    try:
        output_info = sd.query_devices(device=None, kind='output')
        out_channels = output_info.get("max_output_channels", 2) or 2
        silence = np.zeros((int(0.1 * sr), out_channels))
        sd.play(silence, samplerate=sr)
        sd.wait()
        print("✅ Output device warmed up.")
    except Exception as e:
        print(f"⚠️ Output warm-up failed: {e}")

    
def record_and_save(filename, duration=4, sr=44100):
    print(f"🎙 Recording → {filename}")
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=1, device=2)
    sd.wait()
    sf.write(filename, audio, sr)

def warmup_librosa():
    # Create a short silent WAV file to trigger initialization
    sr = 22050
    y = np.zeros(sr)
    tmp_path = os.path.join(tempfile.gettempdir(), "librosa_warmup.wav")
    sf.write(tmp_path, y, sr)
    librosa.load(tmp_path, sr=None)
    print("🔧 Librosa warmed up.")
    
def audio_similarity(file1, file2, threshold=0.985):
    print("Loading file1:", file1)
    y1, sr1 = librosa.load(file1, sr=None)
    print("Loading file2:", file2)
    y2, sr2 = librosa.load(file2, sr=None)

    # --- Trim silence ---
    y1, _ = librosa.effects.trim(y1, top_db=30)  # 30 dB below peak = "silence"
    y2, _ = librosa.effects.trim(y2, top_db=30)

    if len(y1) == 0 or len(y2) == 0:
        print(f"⚠️ Empty or silent audio files: {file1}, {file2}")
        return False

    # --- Compute MFCCs ---
    mfcc1 = librosa.feature.mfcc(y=y1, sr=sr1, n_mfcc=13)
    mfcc2 = librosa.feature.mfcc(y=y2, sr=sr2, n_mfcc=13)

    # --- Match lengths ---
    min_len = min(mfcc1.shape[1], mfcc2.shape[1])
    mfcc1, mfcc2 = mfcc1[:, :min_len], mfcc2[:, :min_len]

    # --- Compute cosine similarity ---
    sim = np.mean(np.sum(mfcc1 * mfcc2, axis=0) /
                  (np.linalg.norm(mfcc1, axis=0) * np.linalg.norm(mfcc2, axis=0)))

    print(f"Comparing {file1} and {file2} → Audio similarity: {sim:.3f}")
    return sim > threshold


def find_image(needle, threshold=0.7):
    screenshot = cv.cvtColor(np.array(pyautogui.screenshot()), cv.COLOR_RGB2BGR)
    result = cv.matchTemplate(screenshot, needle, cv.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv.minMaxLoc(result)
    return (max_val >= threshold, max_loc, needle.shape)


def get_card_name():
    screenshot = ImageGrab.grab(CARD_NAME_BBOX)
    text = pytesseract.image_to_string(screenshot)
    print(f"   → Detected card name: {text.strip()}")
    return text.strip().replace(" ", "_")


def process_card():
    gw.getWindowsWithTitle("audacity")[0].activate()
    time.sleep(1)
    pyautogui.click(AUDACITY_RECORD)
    time.sleep(1)

    gw.getWindowsWithTitle("ShadowverseWB")[0].activate()
    time.sleep(1)
    card_name = get_card_name()
    print(f"🎴 Processing card: {card_name}")
    voice_lines = []
    ref_file = None

    found, loc, shape = find_image(VOICE_INDICATOR)
    print(found, loc, shape)
    if found:
        for i in range(1, 12):
            line_file = os.path.join(CACHE_DIR, f"line{i}.wav")
            print(f"🎙 Recording → {line_file}")
            audio = sd.rec(int(DURATION * 44100), samplerate=44100, channels=1, device=2)
            pyautogui.click(VOICE_BUTTON)
            sd.wait()
            sf.write(line_file, audio, 44100)
            # record_and_save(line_file, duration=DURATION)
            if i == 1:
                ref_file = line_file
            if i > 2 and audio_similarity(line_file, ref_file):
                print(f'comparing {line_file} to {ref_file}')
                print(f'🔁 First line repeated → stopping loop with similarity of {audio_similarity(line_file, ref_file)}')
                break
            voice_lines.append(line_file)
    export_path = f"D:\\WBGDB\\Audio\\RAW\\voices\\{card_name}"
    found, loc, shape = find_image(EVOLVE_INDICATOR)
    print(found, loc, shape)
    if found:
        export_path = f"D:\\WBGDB\\Audio\\RAW\\voices\\followers\\{card_name}"
        pyautogui.click(EVOLVE_BUTTON)
        time.sleep(1)
        for i in range(2):
            pyautogui.click(VOICE_BUTTON)
            time.sleep(DURATION)

    gw.getWindowsWithTitle("audacity")[0].activate()
    time.sleep(1)
    pyautogui.click(AUDACITY_STOP)
    time.sleep(1)

    pyautogui.hotkey(*EXPORT_HOTKEY.split("+"))
    time.sleep(1)
    pyautogui.click(546, 255)
    time.sleep(0.5)
    pyautogui.hotkey("ctrl", "a")
    time.sleep(0.2)
    pyautogui.typewrite(export_path, interval=0.05)
    time.sleep(0.5)
    pyautogui.click(890, 579)
    time.sleep(2)
    pyautogui.click(20, 157)

    print(f"✅ Finished card {card_name}")


def get_card_positions():
    positions = []
    for col in range(NUM_COLS):
        x = GRID_START_X + col * COL_SPACING
        for y in GRID_START_Y:
            positions.append((x, y))
    return positions


def process_all_cards():
    positions = get_card_positions()
    for _ in range(5):
        for pos in positions:
            gw.getWindowsWithTitle("ShadowverseWB")[0].activate()
            time.sleep(2)

            pyautogui.click(pos)
            time.sleep(1.5)

            process_card()
            time.sleep(2)
            gw.getWindowsWithTitle("ShadowverseWB")[0].activate()
            time.sleep(2)
            pyautogui.click(CLOSE_BUTTON)
            time.sleep(2)
        pyautogui.click(1328, 408)


if __name__ == "__main__":
    warmup_librosa()
    warmup_audio()
    process_all_cards()
    
    # print(sd.query_devices())