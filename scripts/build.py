import csv
import json

INPUT_FILE = "channels.csv"
M3U_FILE = "playlist.m3u"
JSON_FILE = "playlist.json"

channels = []

with open(INPUT_FILE, "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)

    print("Columns:", reader.fieldnames)

    for row in reader:
        name = (row.get("Name") or "").strip()
        url = (row.get("URL") or "").strip()

        if not name or not url:
            continue

        channel = {
            "Name": name,
            "URL": url,
            "Group": (row.get("Group") or "").strip(),
            "Logo": (row.get("Logo") or "").strip(),
            "EPG_ID": (row.get("EPG_ID") or "").strip(),
            "Country": (row.get("Country") or "").strip(),
            "Language": (row.get("Language") or "").strip(),
        }

        channels.append(channel)

# Remove duplicate URLs
seen = set()
unique = []

for ch in channels:
    if ch["URL"] not in seen:
        seen.add(ch["URL"])
        unique.append(ch)

channels = unique

# Save JSON
with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(channels, f, indent=2, ensure_ascii=False)

# Save M3U
with open(M3U_FILE, "w", encoding="utf-8", newline="\n") as f:

    # M3U Header
    f.write("#EXTM3U\n")

    for ch in channels:

        extinf = (
            '#EXTINF:-1 '
            f'tvg-id="{ch["EPG_ID"]}" '
            f'tvg-name="{ch["Name"]}" '
            f'tvg-logo="{ch["Logo"]}" '
            f'group-title="{ch["Group"]}",'
            f'{ch["Name"]}'
        )

        f.write(extinf + "\n")
        f.write(ch["URL"] + "\n")

print(f"Done! {len(channels)} channels exported.")
print("playlist.m3u created successfully.")
print("playlist.json created successfully.")
