import json
import random
import hashlib
import os

# Adjectives from the original script logic (implied by the name list in generator)
prefixes = ["Lateral", "Axial", "Nodal", "Linear", "Focal", "Vector", "Kinetic", "Static", "Binary", "Scalar", "Radial", "Orbital", "Thermal", "Flux", "Tidal", "Isotope"]
nouns = ["Mass", "Field", "Pulse", "Node", "Point", "Cluster", "Array", "Strata", "Core", "Shell", "Wave", "Force", "Matrix", "Lattice", "Vertex", "Gradient"]

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

def generate_level(width, height):
    for _ in range(1000):
        # Generate random solution
        solution = [[random.choice([0, 1]) for _ in range(width)] for _ in range(height)]
        # Calculate clues
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
            name = f"{random.choice(prefixes)} {random.choice(nouns)}"
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

if __name__ == "__main__":
    out_dir = '/home/baxter/projects/proxima8/levels'
    manifest_path = '/home/baxter/projects/proxima8/level_manifest.json'
    
    # Load manifest
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    
    # Filter out 10x10 and 15x15
    new_manifest = [l for l in manifest if l['width'] not in [10, 15]]
    
    # Generate more 8x8 levels (up to 59 total to match 5x5 set)
    generated_count = len([l for l in new_manifest if l['width'] == 8])
    while generated_count < 59:
        l = generate_level(8, 8)
        if l:
            # Check for duplicates in manifest
            if any(m['id'] == l['uid'] for m in new_manifest):
                continue
                
            file_path = os.path.join(out_dir, f"{l['uid']}.json")
            with open(file_path, 'w') as f:
                json.dump(l, f, indent=2)
            
            new_manifest.append({
                "id": l['uid'],
                "title": l['name'],
                "width": l['width'],
                "height": l['height'],
                "difficulty": "medium",
                "steps": l['logical_steps']
            })
            print(f"Generated 8x8: {l['uid']} ({l['name']})")
            generated_count += 1
            
    # Save new manifest
    with open(manifest_path, 'w') as f:
        json.dump(new_manifest, f, indent=2)
    print("Manifest updated. 10x10 and 15x15 removed.")
