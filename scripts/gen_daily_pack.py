import json
import random
import hashlib
import os
import datetime

# --- Logic from original level_gen.py ---

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
                    changed = True
                    steps += 1
                elif active_count == clue:
                    for nx, ny in unknowns: state[ny][nx] = 0
                    changed = True
                    steps += 1
    
    solved = all(cell != -1 for row in state for cell in row)
    return solved, steps

def generate_level(width, height, name):
    for _ in range(1000): # Increased attempts for guaranteed daily quality
        solution = [[random.choice([0, 1]) for _ in range(width)] for _ in range(height)]
        
        # Check for boring solutions (all empty or all full)
        flat_sol = [item for sublist in solution for item in sublist]
        if sum(flat_sol) < 5 or sum(flat_sol) > 20:
            continue

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
            uid = hashlib.md5(f"daily:{clue_str}".encode()).hexdigest()[:12]
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

# --- Daily Generation Logic ---

if __name__ == "__main__":
    out_dir = '/home/baxter/projects/proxima8/levels/daily'
    os.makedirs(out_dir, exist_ok=True)
    
    start_date = datetime.date(2026, 2, 13)
    years = 10
    total_days = 365 * years + 3 # approx including leaps
    
    daily_manifest = []
    
    print(f"Targeting {total_days} levels for {years} years starting {start_date}...")
    
    for i in range(total_days):
        current_date = start_date + datetime.timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")
        level_name = f"Daily Challenge {date_str}"
        
        level = generate_level(5, 5, level_name)
        if level:
            level['date'] = date_str
            # We use the date as the filename for easy lookups
            file_path = os.path.join(out_dir, f"{date_str}.json")
            with open(file_path, 'w') as f:
                json.dump(level, f, indent=2)
            
            daily_manifest.append({
                "date": date_str,
                "uid": level['uid'],
                "name": level['name']
            })
            
            if i % 100 == 0 or i == total_days - 1:
                print(f"Progress: {i+1}/{total_days} ({date_str})")
        else:
            print(f"CRITICAL: Failed to generate solvable level for {date_str}")

    # Save a manifest for the daily pack
    with open(os.path.join(out_dir, "daily_manifest.json"), "w") as f:
        json.dump(daily_manifest, f, indent=2)
    
    print(f"Generation Complete. {len(daily_manifest)} levels saved to {out_dir}")
