import os
from PIL import Image

def find_bounding_box(img, bg_color):
    """Find bounding box of non-background pixels."""
    pixels = img.load()
    w, h = img.size
    min_x = w
    min_y = h
    max_x = 0
    max_y = 0
    for y in range(h):
        for x in range(w):
            p = pixels[x, y]
            # Simple color distance
            dist = sum(abs(p[i] - bg_color[i]) for i in range(3))
            if dist > 20: # threshold for noise/anti-aliasing
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    
    # Return with some padding
    padding = 20
    return (max(0, min_x-padding), max(0, min_y-padding), min(w, max_x+padding), min(h, max_y+padding))

def crop_precise():
    img_path = r"C:\Users\bhava\.gemini\antigravity\brain\fe5ef306-25cf-4cfc-8626-4a28065466fe\media__1790871839855.png"
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    bg = img.getpixel((0,0))
    print(f"Size: {w}x{h}, BG: {bg}")

    # The branding sheet usually has sections. Let's divide it and find bounding boxes.
    # Primary logo is usually top left quadrant.
    top_left = img.crop((0, 0, w//2, h//2))
    tl_box = find_bounding_box(top_left, bg)
    print(f"Top Left Bounding Box: {tl_box}")
    primary_logo = top_left.crop(tl_box)
    
    # Favicon is usually bottom right.
    bottom_right = img.crop((w//2, h//2, w, h))
    br_box = find_bounding_box(bottom_right, bg)
    print(f"Bottom Right Bounding Box: {br_box}")
    favicon_logo = bottom_right.crop(br_box)
    
    out_dir = r"d:\hackerrank-orchestrate-september26-main\frontend\public\branding"
    os.makedirs(out_dir, exist_ok=True)
    
    primary_logo.save(os.path.join(out_dir, "buy-or-wait-logo.png"))
    favicon_logo.save(os.path.join(out_dir, "favicon.png"))
    print("Precise crop done.")

crop_precise()
