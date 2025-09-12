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


sys.stdout.reconfigure(encoding='utf-8')


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
VOICES_DIR = os.path.join(BASE_DIR, "Audio", "RAW", "voices")
os.makedirs(VOICES_DIR, exist_ok=True)
GRID_START_X = 268
GRID_START_Y = [379, 714]  
COL_SPACING = 226
NUM_COLS = 5
CLOSE_BUTTON = (1711, 102)
VOICE_INDICATOR = cv.imread(os.path.join(BASE_DIR, 'voice_button.png'), cv.IMREAD_COLOR)
EVOLVE_INDICATOR = cv.imread(os.path.join(BASE_DIR, 'evolve_indicator.png'), cv.IMREAD_COLOR)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

CARD_NAME_BBOX = (931, 218, 1568, 260)   
VOICE_BUTTON = (1711, 642)       
EVOLVE_BUTTON = (207, 894)              
AUDACITY_RECORD = (705, 232)            
AUDACITY_STOP = (532, 232)              
EXPORT_HOTKEY = "ctrl+shift+e"          

DURATION = 5  

def record_and_save(filename, duration=4, sr=44100):
    print(f"🎙 Recording → {filename}")
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=1, device=4)
    sd.wait()
    sf.write(filename, audio, sr)

def audio_similarity(file1, file2, threshold=0.978):
    y1, sr1 = librosa.load(file1, sr=None)
    y2, sr2 = librosa.load(file2, sr=None)

    mfcc1 = librosa.feature.mfcc(y=y1, sr=sr1, n_mfcc=13)
    mfcc2 = librosa.feature.mfcc(y=y2, sr=sr2, n_mfcc=13)

    min_len = min(mfcc1.shape[1], mfcc2.shape[1])
    mfcc1, mfcc2 = mfcc1[:, :min_len], mfcc2[:, :min_len]

    sim = np.mean(np.sum(mfcc1 * mfcc2, axis=0) /
                  (np.linalg.norm(mfcc1, axis=0) * np.linalg.norm(mfcc2, axis=0)))
    print(f"Comparing {file1} and {file2}   → Audio similarity: {sim:.3f} ")
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

    if found:
        for i in range(1, 12):  
            line_file = os.path.join(CACHE_DIR, f"line{i}.wav")
            pyautogui.click(VOICE_BUTTON)
            record_and_save(line_file, duration=DURATION)
            if i == 1:
                ref_file = line_file
            if i > 2 and audio_similarity(line_file, ref_file):
                print(f'comparing {line_file} to {ref_file}')
                print(f'🔁 First line repeated → stopping loop with similarity of {audio_similarity(line_file, ref_file)}')
                break
            voice_lines.append(line_file)
            
            
     
    found, loc, shape = find_image(EVOLVE_INDICATOR)
    if found:
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
    export_path = f"G:\\WBGDB\\Audio\\RAW\\voices\\{card_name}"  
    pyautogui.click(1008, 370)                     
    time.sleep(0.5)
    pyautogui.hotkey("ctrl", "a")                  
    time.sleep(0.2)
    pyautogui.typewrite(export_path, interval=0.05) 
    time.sleep(0.5)
    pyautogui.click(1172, 726)                      
    time.sleep(1)
    pyautogui.click(395,321)

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
    for _ in range (1):  
        for pos in positions:
            gw.getWindowsWithTitle("ShadowverseWB")[0].activate()
            time.sleep(1)
    
            pyautogui.click(pos)
            time.sleep(1.5)  

            process_card()

            pyautogui.click(CLOSE_BUTTON)
            time.sleep(1)
        pyautogui.click(1802, 537)


if __name__ == "__main__":
    process_all_cards()