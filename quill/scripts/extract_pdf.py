#!/usr/bin/env python3
"""Extract text content from Enterprise AI Agent Patterns PDF."""

import PyPDF2
import json
import sys

pdf_path = "/Users/trannguyen/Downloads/Enterprise_AI_Agent_Patterns.pdf"

try:
    # Open and read the PDF
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        
        print(f"📄 PDF Info:")
        print(f"   Pages: {len(pdf_reader.pages)}")
        print(f"   File: Enterprise_AI_Agent_Patterns.pdf")
        print(f"\n📝 Extracting text...\n")
        
        # Extract text from all pages
        full_text = ""
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            full_text += f"\n\n--- Page {i+1} ---\n\n" + text
            
        # Save to file
        with open('pdf_content.txt', 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        print(f"✅ Extracted {len(full_text)} characters")
        print(f"💾 Saved to: pdf_content.txt")
        
        # Print first 2000 characters as preview
        print(f"\n📖 Preview (first 2000 chars):")
        print("=" * 80)
        print(full_text[:2000])
        print("=" * 80)
        
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
