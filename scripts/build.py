import csv
import json
from urllib.parse import urlparse

INPUT_FILE = "channels.csv"
M3U_FILE = "playlist.m3u"
JSON_FILE = "playlist.json"

REQUIRED = {"Name", "URL"}
channels = []
seen_urls = set()

with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)

    if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):
        raise SystemExit(f"CSV must contain columns: {sorted(REQUIRED)}")

    for row in reader:
        name = (row.get("Name") or "").strip()
        url = (row.get("URL") or "").strip()

        if not name or not url:
            continue

        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            print(f"Skipping invalid URL: {url}")
            continue

        if url in seen_urls:
            continue

        seen_urls.add(url)
        channels.append({
            "Name": name,
            "URL": url,
            "Group": (row.get("Group") or "Other").strip() or "Other",
            "Logo": (row.get("Logo") or "").strip(),
            "EPG_ID": (row.get("EPG_ID") or "").strip(),
            "Country": (row.get("Country") or "").strip(),
            "Language": (row.get("Language") or "").strip(),
        })

channels.sort(key=lambda ch: (ch["Group"].lower(), ch["Name"].lower()))

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(channels, f, indent=2, ensure_ascii=False)

with open(M3U_FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write("#EXTM3U\n")
    for ch in channels:
        f.write(
            '#EXTINF:-1 '
            f'tvg-id="{ch["EPG_ID"]}" '
            f'tvg-name="{ch["Name"].replace(chr(34), chr(39))}" '
            f'tvg-logo="{ch["Logo"]}" '
            f'group-title="{ch["Group"].replace(chr(34), chr(39))}",'
            f'{ch["Name"]}\n'
        )
        f.write(ch["URL"] + "\n")

print(f"Done! {len(channels)} unique channels exported.")
