import os
import time
import shutil
import glob
from pathlib import Path

DOWNLOADS_DIR = Path(os.environ.get("USERPROFILE", "C:\\Users\\123")) / "Downloads"
TARGET_DIR = Path(r"D:\Worksheet Anak Coding\images")
TARGET_DIR.mkdir(parents=True, exist_ok=True)

print(f"Monitoring: {DOWNLOADS_DIR}")
print(f"Destination: {TARGET_DIR}")
print("Menunggu gambar worksheet dari browser... (Tekan Ctrl+C untuk berhenti)")

moved_count = 0
try:
    while True:
        # Find all files matching worksheet_anak_coding_*
        files = list(DOWNLOADS_DIR.glob("worksheet_anak_coding_*.*"))
        for f in files:
            # Skip incomplete downloads
            if f.suffix in [".crdownload", ".tmp", ".part"]:
                continue
            
            # Check if file is still being written to
            try:
                # Try opening file exclusively to check if download is complete
                with open(f, "rb") as test_f:
                    pass
            except (IOError, PermissionError):
                continue

            dest = TARGET_DIR / f.name
            # If destination already exists, append timestamp or counter
            if dest.exists():
                stem = f.stem
                ext = f.suffix
                dest = TARGET_DIR / f"{stem}_{int(time.time()*1000)}{ext}"

            try:
                shutil.move(str(f), str(dest))
                moved_count += 1
                print(f"[{moved_count}] Berhasil memindahkan: {dest.name}")
            except Exception as e:
                # Still busy or locked
                pass

        time.sleep(1.5)
except KeyboardInterrupt:
    print(f"\nSelesai! Total {moved_count} gambar dipindahkan ke {TARGET_DIR}.")
