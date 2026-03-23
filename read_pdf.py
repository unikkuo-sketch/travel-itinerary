import sys
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed")
    sys.exit(1)

def read_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

if __name__ == "__main__":
    file_path = "C:\\Users\\unikkuo\\Desktop\\Anti\\traveling\\.agent\\travel-itinerary-2026\\2026關東賞櫻6日遊.pdf"
    print(read_pdf(file_path))
