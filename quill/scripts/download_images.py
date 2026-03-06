#!/usr/bin/env python3
"""Download Facebook images and save locally."""

import urllib.request
import os
import ssl

# Create uploads directory
os.makedirs('public/uploads/articles', exist_ok=True)

# High-resolution images from the post (extracted via browser)
images = [
    ("01-context-aware.jpg", "https://scontent-ord5-1.xx.fbcdn.net/v/t39.30808-6/625029216_26343498745236168_7824135461125991547_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=ypvpYpADywUQ7kNvwH-xRG6&oe=6982F49F"),
    ("02-prompt-chaining.jpg", "https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/623830147_26343499385236104_8479628487234768263_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=MURfRG4PE2wQ7kNvwHg_DM-&oe=6982CA61"),
    ("03-parallelization.jpg", "https://scontent-ord5-1.xx.fbcdn.net/v/t39.30808-6/624974709_26343499791902730_9093319190468116011_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=DYetOEs2JaMQ7kNvwEencXF&oe=6982DB7A"),
    ("04-orchestrator.jpg", "https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-6/622368562_26343500151902694_7231732240208710464_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=D7-5h-5hyxIQ7kNvwH6ZZy-&oe=6982DDD7"),
    ("05-routing.jpg", "https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/622449515_26343502511902458_6054819604566525089_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=8qlRupM1JhsQ7kNvwHhd4se&oe=6982C8F0"),
    ("06-evaluator.jpg", "https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-6/624637767_26343505235235519_3254643786526817794_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=4tUggf1z5Q0Q7kNvwGujvZD&oe=6982C2BD"),
    ("07-customer-support.jpg", "https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-6/622598241_10214433232700315_1670384360008721983_n.jpg?stp=cp6_dst-jpg_s1080x2048_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&oe=6982D069"),
    ("08-content-data.jpg", "https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/624259571_1307543161413942_229418937383393855_n.jpg?stp=dst-jpg_s1080x2048_tt6&_nc_cat=1&ccb=1-7&_nc_sid=127cfc&oe=6982E0D9"),
]

# Disable SSL verification for Facebook CDN
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

print("📥 Downloading images from Facebook...")

downloaded = []
for filename, url in images:
    filepath = f"public/uploads/articles/{filename}"
    try:
        print(f"  Downloading {filename}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        downloaded.append(filename)
        print(f"  ✅ Saved: {filepath}")
    except Exception as e:
        print(f"  ❌ Failed: {filename} - {e}")

print(f"\n🎉 Downloaded {len(downloaded)}/{len(images)} images!")
print(f"   Location: public/uploads/articles/")
