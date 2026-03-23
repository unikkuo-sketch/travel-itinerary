import sys
try:
    from PyPDF2 import PdfReader
except ImportError:
    print("PyPDF2 not installed")
    sys.exit(1)

reader = PdfReader('C:\\Users\\unikkuo\\Desktop\\Anti\\traveling\\.agent\\travel-itinerary-2026\\2026關東賞櫻6日遊.pdf')
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

print(text)
