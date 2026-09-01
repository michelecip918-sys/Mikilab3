import re
lines = open("/app/frontend/src/sections/PianoProduzioneAI.jsx").read().split("\n")
depth = 0
start = 953  # 1-based line of the wrapper
for i in range(start - 1, len(lines)):
    l = lines[i]
    opens = len(re.findall(r"<div\b(?![^>]*/>)", l))
    closes = len(re.findall(r"</div>", l))
    depth += opens - closes
    if depth <= 0:
        print(f"wrapper opened at line {start} closes at line {i+1}: {l.strip()[:80]}")
        break
else:
    print("never closed, final depth", depth)
