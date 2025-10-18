import re

with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'r') as f:
    lines = f.readlines()

# Track if we're inside a sanitizeHTML call
in_sanitize = False
sanitize_start = -1
fixed_count = 0

for i, line in enumerate(lines):
    # Check if line contains AilydianSanitizer.sanitizeHTML with opening backtick
    if 'AilydianSanitizer.sanitizeHTML(`' in line and '`);' not in line:
        in_sanitize = True
        sanitize_start = i
    
    # If we're in a sanitize block and find a closing backtick
    elif in_sanitize and re.search(r'^\s*`;', line):
        # Replace `; with `);
        lines[i] = line.replace('`;', '`);')
        fixed_count += 1
        in_sanitize = False
        print(f"Fixed line {i+1}: {line.strip()} → {lines[i].strip()}")

# Write back
with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'w') as f:
    f.writelines(lines)

print(f"\n✅ Fixed {fixed_count} sanitizeHTML template literals")
