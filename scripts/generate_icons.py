import asyncio

# Create app icons using canvas/image generation
# We'll use a Python library to generate PNG icons

async def generate_icons():
    # Using PIL/Pillow to generate icons
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Colors matching the portal theme
    bg_color = (10, 10, 26)  # Deep indigo #0a0a1a
    accent_color = (255, 107, 157)  # Coral #ff6b9d
    gold_color = (201, 162, 39)  # Gold #c9a227
    
    for size in sizes:
        img = Image.new('RGB', (size, size), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Calculate dimensions
        padding = size // 8
        inner_size = size - (padding * 2)
        
        # Draw rounded rectangle background with subtle border
        corner_radius = size // 10
        
        # Draw gradient-like effect with border
        border_color = (30, 30, 60)  # Slightly lighter indigo
        draw.rounded_rectangle(
            [padding, padding, size - padding, size - padding],
            radius=corner_radius,
            outline=border_color,
            width=max(2, size // 50)
        )
        
        # Draw "PK" initials
        # Use a simple font sizing approach
        font_size = int(size * 0.45)
        
        try:
            # Try to use a system font
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        text = "PK"
        
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center the text
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - (text_height // 8)
        
        # Draw text with coral accent
        draw.text((x, y), text, font=font, fill=accent_color)
        
        # Add a small decorative dot (like a wine drop)
        dot_size = max(4, size // 25)
        dot_y = y + text_height + (size // 15)
        dot_x = size // 2
        draw.ellipse(
            [dot_x - dot_size, dot_y - dot_size, dot_x + dot_size, dot_y + dot_size],
            fill=gold_color
        )
        
        # Save the icon
        output_path = f"/data/workspace/static/icons/icon-{size}x{size}.png"
        img.save(output_path, "PNG")
        print(f"Generated: {output_path}")
    
    return len(sizes)

# Run the icon generation
result = asyncio.run(generate_icons())
print(f"\nGenerated {result} app icons successfully!")
