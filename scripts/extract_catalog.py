import pymupdf
import os
from PIL import Image

def extract_catalog():
    pdf_path = "MiEstilo_Complete_Luxury_Product_Catalog.pdf"
    os.makedirs("public/catalog", exist_ok=True)
    os.makedirs("public/products", exist_ok=True)

    doc = pymupdf.open(pdf_path)
    print(f"Loaded {pdf_path} with {len(doc)} pages.")

    # Product pages mapping to slugs
    product_page_map = {
        3: "pure-cotton-bedsheet-400-tc",
        4: "pure-cotton-bedsheet-300-tc",
        5: "pure-cotton-bedsheet-210-tc",
        6: "poly-cotton-bedsheet-150-gsm",
        7: "poly-cotton-bedsheet-125-gsm-lining",
        8: "poly-cotton-bedsheet-125-gsm-solid-white",
        9: "color-lining-bedsheet-125-gsm-maroon",
        11: "microfiber-duvet-400-gsm-heavy-winter",
        12: "microfiber-duvet-300-gsm-all-season",
        13: "microfiber-duvet-200-gsm-ac-summer",
        14: "poly-cotton-duvet-cover-125-gsm",
        15: "ultrasonic-comforter-100-gsm-microfiber",
        16: "ultrasonic-comforter-140-gsm-microfiber",
        18: "quilted-mattress-protector-300-gsm",
        19: "terry-waterproof-mattress-protector-220-gsm",
        21: "recron-hotel-king-pillow-750-gm",
        22: "recron-hotel-standard-pillow-550-gm",
        23: "recron-square-cushion-insert-350-gm",
        25: "heavy-pure-cotton-bath-mat-400-gsm",
        26: "pure-cotton-bath-mat-300-gsm",
        28: "pure-cotton-bath-towel-600-gm",
        29: "pure-cotton-bath-towel-550-gm",
        30: "pure-cotton-bath-towel-500-gm",
        31: "pure-cotton-hand-towel-150-gm",
        32: "commercial-poly-cotton-bath-towel-600-gm",
        33: "commercial-poly-cotton-bath-towel-550-gm",
        34: "commercial-poly-cotton-bath-towel-500-gm",
        35: "commercial-poly-cotton-hand-towel-150-gm",
        37: "plain-velvet-bed-runner-cushion-set",
        38: "quilted-velvet-bed-runner-cushion-set",
    }

    for page_idx, page in enumerate(doc):
        page_num = page_idx + 1
        pix = page.get_pixmap(dpi=150)
        page_path = f"public/catalog/page_{page_num}.jpg"
        pix.save(page_path)

        if page_num in product_page_map:
            slug = product_page_map[page_num]
            # Crop upper hero photo (top 0 to 51% of page height)
            with Image.open(page_path) as im:
                w, h = im.size
                # Hero image is in the upper 51%
                hero = im.crop((0, 0, w, int(h * 0.51)))
                hero_path = f"public/products/{slug}.jpg"
                hero.save(hero_path, quality=90)
                print(f"Extracted hero image for {slug}: {hero_path}")

    print("All catalog pages and product images extracted successfully!")

if __name__ == "__main__":
    extract_catalog()
