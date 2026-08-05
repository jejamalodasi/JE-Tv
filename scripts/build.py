import csv
import json

channels = []

with open("channels.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)

    print("Columns found:", reader.fieldnames)

    for row in reader:
        name = (row.get("Name") or "").strip()
        url = (row.get("URL") or "").strip()

        if not name or not url:
            continue

        channels.append({
            "Name": name,
            "Group": (row.get("Group") or "").strip(),
            "Logo": (row.get("Logo") or "").strip(),
            "URL": url,
            "EPG_ID": (row.get("EPG_ID") or "").strip(),
            "Country": (row.get("Country") or "").strip(),
            "Language": (row.get("Language") or "").strip(),
        })

# Remove duplicate URLs
seen = set()
unique = []

for ch in channels:
    if ch["URL"] not in seen:
        seen.add(ch["URL"])
        unique.append(ch)

channels = unique

# JSON
with open("playlist.json", "w", encoding="utf-8") as f:
    json.dump(channels, f, indent=2, ensure_ascii=False)

# M3U
with open("playlist.m3u", "w", encoding="utf-8") as f:
    f.write("#EXTM3U\n")

    for ch in channels:
        f.write(
            '#EXTINF:-1'
            f' tvg-id="{ch["EPG_ID"]}"'
            f' tvg-logo="{ch["Logo"]}"'
            f' group-title="{ch["Group"]}",'
            f'{ch["Name"]}\n'
        )
        f.write(ch["URL"] + "\n")

print(f"Done! {len(channels)} channels written.")
