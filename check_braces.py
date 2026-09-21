#!/usr/bin/env python3
import sys

with open(sys.argv[1]) as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    in_str = False
    str_ch = None
    template = False
    for j, ch in enumerate(line):
        if template:
            if ch == '`':
                template = False
            continue
        if in_str:
            if ch == '\\':
                continue
            if ch == str_ch:
                in_str = False
            continue
        if ch == '"' or ch == "'":
            in_str = True
            str_ch = ch
            continue
        if ch == '`':
            template = True
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
    if depth < 0:
        print(f'UNBALANCED at line {i}: depth={depth}')
        print(f'  {stripped[:80]}')
        sys.exit(1)
print(f'Final depth: {depth} (0 = balanced)')
