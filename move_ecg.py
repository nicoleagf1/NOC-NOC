import re

with open('src/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

# Find ECG Widget Grid block
start_marker = "      {/* ECG Widget Grid */}"
end_marker = "      {/* Bottom Status Bar */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

ecg_block = content[start_idx:end_idx]

# Remove the block from its current position
content = content[:start_idx] + content[end_idx:]

# Insert it before Main Content Grid
target_marker = "      {/* Main Content Grid */}"
target_idx = content.find(target_marker)

if target_idx == -1:
    print("Could not find target marker")
    exit(1)

content = content[:target_idx] + ecg_block + "\n" + content[target_idx:]

with open('src/app/(dashboard)/page.tsx', 'w') as f:
    f.write(content)

print("Moved ECG Widget successfully.")
