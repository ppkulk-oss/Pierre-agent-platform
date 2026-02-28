import struct
import zlib

def create_png_chunk(chunk_type, data):
    chunk = struct.pack('>I', len(data)) + chunk_type + data
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    return chunk + struct.pack('>I', crc)

def create_png(width, height, bg_color, text, text_color, accent_color):
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # RGBA
    ihdr = create_png_chunk(b'IHDR', ihdr_data)
    
    # Create image data (simple filled rectangle with text representation)
    # For simplicity, we'll create a solid color background
    raw_data = []
    for y in range(height):
        raw_data.append(0)  # Filter byte
        for x in range(width):
            # Border
            border = 8
            if x < border or x >= width - border or y < border or y >= height - border:
                raw_data.extend([30, 30, 58, 255])  # Border color
            else:
                # Gradient-ish background
                r = int(10 + (y / height) * 8)
                g = int(10 + (y / height) * 8)
                b = int(26 + (y / height) * 4)
                raw_data.extend([r, g, b, 255])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    idat = create_png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = create_png_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

# Generate icons in different sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    png_data = create_png(size, size, (10, 10, 26), "PK", (255, 107, 157), (201, 162, 39))
    with open(f'/data/workspace/static/icons/icon-{size}x{size}.png', 'wb') as f:
        f.write(png_data)
    print(f"Created icon-{size}x{size}.png")

print("\nAll icons generated!")
