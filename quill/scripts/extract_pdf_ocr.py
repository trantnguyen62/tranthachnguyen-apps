#!/usr/bin/env python3
"""Extract text from image-based PDF using OCR."""

from pdf2image import convert_from_path
import pytesseract
import os

pdf_path = "/Users/trannguyen/Downloads/Enterprise_AI_Agent_Patterns.pdf"
output_file = "pdf_content_ocr.txt"

print("📄 Converting PDF to images...")
print("   This may take a minute for a 14-page PDF...\n")

try:
    # Convert PDF to images (limit to first 14 pages)
    images = convert_from_path(pdf_path, dpi=300, fmt='png')
    
    print(f"✅ Converted {len(images)} pages to images")
    print(f"🔍 Running OCR on each page...\n")
    
    full_text = ""
    
    for i, image in enumerate(images, 1):
        print(f"   Page {i}/{len(images)}... ", end="", flush=True)
        
        # Run OCR on the image
        text = pytesseract.image_to_string(image, lang='eng')
        full_text += f"\n\n{'='*80}\n"
        full_text += f"PAGE {i}\n"
        full_text += f"{'='*80}\n\n"
        full_text += text
        
        print(f"✓ ({len(text)} chars)")
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    print(f"\n✅ OCR Complete!")
    print(f"   Total characters: {len(full_text):,}")
    print(f"   Saved to: {output_file}")
    
    # Show preview
    print(f"\n📖 Preview (first 1500 chars):")
    print("=" * 80)
    print(full_text[:1500])
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
