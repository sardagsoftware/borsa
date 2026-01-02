#!/usr/bin/env python3

"""
PWA Icon Generator - Creates PNG icons with grape logo and LyDian text
Uses PIL/Pillow to render graphics
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ Pillow not installed. Installing...")
    import subprocess
    subprocess.check_call(["python3", "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont
    import os

def create_pwa_icon(size=512, output_path="public/icons/pwa-icon-512.png"):
    """Create PWA icon with dark background, white grape outline, and LyDian text"""

    # Create image with dark background
    img = Image.new('RGB', (size, size), '#1C2536')
    draw = ImageDraw.Draw(img)

    # Colors
    white = '#FFFFFF'

    # Calculate scaled dimensions
    center_x = size // 2
    center_y = int(size * 0.45)  # Slightly above center for logo

    # Scale factor for 512px canvas
    scale = size / 512

    # Draw outer circle frames
    r1 = int(170 * scale)
    r2 = int(155 * scale)

    # Outer circle
    draw.ellipse(
        [center_x - r1, center_y - r1, center_x + r1, center_y + r1],
        outline=white,
        width=int(6 * scale)
    )

    # Inner circle
    draw.ellipse(
        [center_x - r2, center_y - r2, center_x + r2, center_y + r2],
        outline=white,
        width=int(4 * scale)
    )

    # Draw grape berries (circles)
    berry_width = int(5 * scale)

    # Berry positions (scaled from original 512 viewBox)
    berries = [
        (256, 186, 24),  # Row 1
        (220, 226, 23), (256, 231, 23), (292, 226, 23),  # Row 2
        (190, 271, 22), (230, 276, 22), (282, 276, 22), (322, 271, 22),  # Row 3
        (218, 321, 21), (256, 326, 21), (294, 321, 21),  # Row 4
        (235, 366, 20), (277, 366, 20),  # Row 5
        (256, 406, 19),  # Row 6
    ]

    for bx, by, br in berries:
        # Adjust to our center and scale
        scaled_x = int((bx - 256) * scale * 0.66) + center_x
        scaled_y = int((by - 256) * scale * 0.66) + center_y
        scaled_r = int(br * scale * 0.66)

        draw.ellipse(
            [scaled_x - scaled_r, scaled_y - scaled_r,
             scaled_x + scaled_r, scaled_y + scaled_r],
            outline=white,
            width=berry_width
        )

    # Draw leaves (simplified as filled shapes)
    leaf_width = int(5 * scale)

    # Stem curl
    stem_y = center_y - int(150 * scale * 0.66)
    draw.arc(
        [center_x - 10, stem_y, center_x + 10, stem_y + 40],
        start=180,
        end=360,
        fill=white,
        width=leaf_width
    )

    # Add text "LyDian" at bottom
    try:
        # Try to use system font
        font_size = int(42 * scale)
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()

    text = "LyDian"

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (size - text_width) // 2
    text_y = size - int(82 * scale)

    draw.text((text_x, text_y), text, fill=white, font=font)

    # Save image
    img.save(output_path, 'PNG', quality=95)
    print(f"✅ Created: {output_path} ({size}x{size})")

    return output_path

if __name__ == "__main__":
    print("📱 Generating PWA icons...\n")

    # Create output directory if needed
    os.makedirs("public/icons", exist_ok=True)

    # Generate icons
    create_pwa_icon(512, "public/icons/pwa-icon-512.png")
    create_pwa_icon(192, "public/icons/pwa-icon-192.png")

    print("\n✅ PWA icons generated successfully!")
    print("\n📂 Generated files:")
    for fname in ["pwa-icon-512.png", "pwa-icon-192.png"]:
        fpath = f"public/icons/{fname}"
        if os.path.exists(fpath):
            size_kb = os.path.getsize(fpath) / 1024
            print(f"   {fpath} ({size_kb:.1f} KB)")

    # Open preview
    import subprocess
    subprocess.call(["open", "public/icons/pwa-icon-512.png"])
