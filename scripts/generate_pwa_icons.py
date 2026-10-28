import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public/icons', exist_ok=True)

def create_icon(size, is_maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0) if not is_maskable else (23, 27, 24, 255))
    draw = ImageDraw.Draw(img)

    # Background
    if not is_maskable:
        # Rounded rectangle
        corner_radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=(23, 27, 24, 255))
        # Subtle lime accent ring
        draw.rounded_rectangle([2, 2, size - 3, size - 3], radius=corner_radius - 2, outline=(167, 244, 50, 40), width=max(1, int(size * 0.015)))
    else:
        # Full fill for maskable
        draw.rectangle([0, 0, size, size], fill=(23, 27, 24, 255))

    # Draw luxury "m" letter
    font_size = int(size * 0.58)
    try:
        # Try common modern fonts on Windows
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("segoeuib.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

    text = "m"
    # Measure text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1] - int(size * 0.04)

    # Draw vibrant lime text
    draw.text((x, y), text, font=font, fill=(167, 244, 50, 255))

    # Add a tiny luxury dot / badge accent
    dot_r = int(size * 0.04)
    dot_x = int(x + w + size * 0.02)
    dot_y = int(y + h * 0.75)
    if dot_x + dot_r < size * 0.88:
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=(167, 244, 50, 255))

    return img

# Generate all required icon sizes
create_icon(192).save('public/icons/icon-192.png', 'PNG')
create_icon(512).save('public/icons/icon-512.png', 'PNG')
create_icon(512, is_maskable=True).save('public/icons/icon-maskable-512.png', 'PNG')
create_icon(180).save('public/apple-touch-icon.png', 'PNG')

print("PWA icons generated successfully in public/icons/ and public/")
