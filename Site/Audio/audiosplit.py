import os
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VOICES_DIR = BASE_DIR
OUTPUT_DIR = os.path.join(VOICES_DIR, "FILTERED")

os.makedirs(OUTPUT_DIR, exist_ok=True)

for card_name in os.listdir(VOICES_DIR):
    card_path = os.path.join(VOICES_DIR, card_name)
    
    if not os.path.isdir(card_path) or card_name == "mp3":
        continue
    
    recording_path = os.path.join(card_path, "untitled.wav")
    if not os.path.exists(recording_path):
        print(f"⚠️ No recording file found in {card_name}, skipping...")
        continue
    
    print(f"🎵 Processing {card_name}...")

    sound = AudioSegment.from_file(recording_path, format="wav")
    sound_len = len(sound)

    nonsilent_ranges = detect_nonsilent(
        sound,
        min_silence_len=1000,   # ms
        silence_thresh=-50      # dB
    )
    
    card_output_dir = os.path.join(OUTPUT_DIR, card_name)
    os.makedirs(card_output_dir, exist_ok=True)

    for i, (start, end) in enumerate(nonsilent_ranges):
        end = min(end + 500, sound_len)
        chunk = sound[start:end]
        
        out_file = os.path.join(card_output_dir, f"chunk{i}.mp3")
        chunk.export(out_file, format="mp3", bitrate="192k")
        print(f"   → Saved {out_file}")

print("✅ Done! All recordings processed.")
