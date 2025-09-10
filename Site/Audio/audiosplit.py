import os
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Base voices directory (where audiosplit.py is)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VOICES_DIR = BASE_DIR
OUTPUT_DIR = os.path.join(VOICES_DIR, "FILTERED")

# Ensure mp3 output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Loop through all folders in voices/
for card_name in os.listdir(VOICES_DIR):
    card_path = os.path.join(VOICES_DIR, card_name)
    
    # Skip non-folders and the mp3 folder itself
    if not os.path.isdir(card_path) or card_name == "mp3":
        continue
    
    recording_path = os.path.join(card_path, "untitled.wav")
    if not os.path.exists(recording_path):
        print(f"⚠️ No recording file found in {card_name}, skipping...")
        continue
    
    print(f"🎵 Processing {card_name}...")

    # Load the recording
    sound = AudioSegment.from_file(recording_path, format="wav")
    sound_len = len(sound)

    # Detect non-silent ranges
    nonsilent_ranges = detect_nonsilent(
        sound,
        min_silence_len=1000,   # ms
        silence_thresh=-50      # dB
    )
    
    # Prepare output folder for this card
    card_output_dir = os.path.join(OUTPUT_DIR, card_name)
    os.makedirs(card_output_dir, exist_ok=True)

    # Export each chunk to MP3 with +0.5s extended
    for i, (start, end) in enumerate(nonsilent_ranges):
        # extend end by 500ms (but not past total length)
        end = min(end + 500, sound_len)
        chunk = sound[start:end]
        
        out_file = os.path.join(card_output_dir, f"chunk{i}.mp3")
        chunk.export(out_file, format="mp3", bitrate="192k")
        print(f"   → Saved {out_file}")

print("✅ Done! All recordings processed.")
