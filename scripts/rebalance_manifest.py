import json
import os

sector_names = ['Alpha Sector', 'Crimson Void', 'Azure Reach', 'Obsidian Gate', 'Emerald Nebula', 'Solar Forge', 'Neutron Star']

def rebalance_manifest():
    levels_dir = '/home/baxter/projects/proxima8/levels'
    archive_dir = '/home/baxter/projects/proxima8/levels_archive'
    manifest_path = '/home/baxter/projects/proxima8/level_manifest.json'
    
    os.makedirs(archive_dir, exist_ok=True)
    
    all_levels = []
    # Re-scan levels directory
    for filename in os.listdir(levels_dir):
        if not filename.endswith('.json'): continue
        path = os.path.join(levels_dir, filename)
        
        with open(path, 'r') as f:
            level = json.load(f)
            
        width = level.get('width')
        # Check size constraint
        if width > 8:
            print(f"Archiving large level: {filename} ({width}x{width})")
            os.rename(path, os.path.join(archive_dir, filename))
            continue
            
        all_levels.append({
            "id": level.get('uid') or level.get('id'),
            "title": level.get('name'),
            "width": width,
            "height": level.get('height'),
            "difficulty_rating": level.get('difficulty_rating', 50),
            "steps": level.get('logical_steps', 0)
        })
            
    # Sort by difficulty
    all_levels.sort(key=lambda x: x['difficulty_rating'])
    
    # 13 levels per sector across 7 sectors = 91 levels total
    total_needed = 13 * len(sector_names)
    
    if len(all_levels) < total_needed:
        print(f"WARNING: Only found {len(all_levels)} valid puzzles. Filling as many as possible.")
        total_needed = len(all_levels)
    
    selected_levels = all_levels[:total_needed]
    
    # Assign sectors: 13 per sector
    new_manifest = []
    for i, level in enumerate(selected_levels):
        sector_idx = i // 13
        # Handle overflow if total_needed < 91
        if sector_idx >= len(sector_names): sector_idx = len(sector_names) - 1
        level['sector'] = sector_names[sector_idx]
        new_manifest.append(level)
        
    with open(manifest_path, 'w') as f:
        json.dump(new_manifest, f, indent=2)
        
    print(f"Rebalanced manifest: {len(new_manifest)} levels total (Size <= 8x8).")

if __name__ == "__main__":
    rebalance_manifest()
