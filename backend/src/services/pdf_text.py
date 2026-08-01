import sys

try:
    import fitz
except Exception as e:
    print("NO_FITZ", file=sys.stderr)
    sys.exit(1)

doc = fitz.open(sys.argv[1])
for page in doc:
    print(page.get_text("text"))
