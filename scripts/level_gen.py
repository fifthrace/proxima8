import json
import random
import hashlib
import os

def generate_level(width, height):
    prefixes = ["Lateral", "Axial", "Nodal", "Linear", "Focal", "Vector", "Kinetic", "Static", "Binary", "Scalar", "Radial", "Orbital", "Thermal", "Flux", "Tidal", "Isotope"]
    nouns = ["Mass", "Field", "Pulse", "Node", "Point", "Cluster", "Array", "Strata", "Core", "Shell", "Wave", "Force", "Matrix", "Lattice", "Vertex", "Gradient"]
    
    for _ in range(500):
        solution = [[random.choice([0, 1]) for _ in range(width)] for _ in range(height)]
        grid = []
        for y in range(height):
            row = []
            for x in range(width):
                colored_neighbors = 0
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx == 0 and dy == 0: continue
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if solution[ny][nx] == 1:
                                colored_neighbors += 1
                row.append(colored_neighbors)
            grid.append(row)
        
        is_solvable, steps = check_logical_solvability(grid, width, height)
        if is_solvable:
            clue_str = ",".join(["".join(map(str, row)) for row in grid])
            uid = hashlib.md5(f"{width}x{height}:{clue_str}".encode()).hexdigest()[:12]
            name = f"{random.choice(adjectives)} {random.choice(nouns)}"
            return {
                "uid": uid,
                "name": name,
                "width": width, 
                "height": height, 
                "clues": grid, 
                "solution": solution,
                "logical_steps": steps
            }
    return None

def check_logical_solvability(clues, width, height):
    state = [[-1 for _ in range(width)] for _ in range(height)]
    changed = True
    steps = 0
    while changed:
        changed = False
        for y in range(height):
            for x in range(width):
                clue = clues[y][x]
                neighbors = []
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx == 0 and dy == 0: continue
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            neighbors.append((nx, ny))
                active_count = sum(1 for nx, ny in neighbors if state[ny][nx] == 1)
                unknowns = [(nx, ny) for nx, ny in neighbors if state[ny][nx] == -1]
                if not unknowns: continue
                if active_count + len(unknowns) == clue:
                    for nx, ny in unknowns: state[ny][nx] = 1
                    changed = True; steps += 1
                elif active_count == clue:
                    for nx, ny in unknowns: state[ny][nx] = 0
                    changed = True; steps += 1
    solved = all(cell != -1 for row in state for cell in row)
    return solved, steps

if __name__ == "__main__":
    out_dir = 'projects/zen_logic/prototype/levels'
    os.makedirs(out_dir, exist_ok=True)
    
    for size in [3, 5, 10, 15]:
        count = 5 if size == 3 else 3
        for _ in range(count):
            l = generate_level(size, size)
            if l:
                with open(os.path.join(out_dir, f'{l["uid"]}.json'), 'w') as f:
                    json.dump(l, f, indent=2)
                print(f"Generated {size}x{size}: {l['uid']} ({l['name']})")
