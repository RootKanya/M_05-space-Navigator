import numpy as np
import random
import heapq
from typing import List, Tuple, Dict, Any

ROWS = 11 
COLS = 15
GOAL_R = ROWS - 2
GOAL_C = COLS - 2

# Helper
def get_path_length(grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int]):
    def h(a, b): return abs(a[0] - b[0]) + abs(a[1] - b[1])
    heap = [(0, start)]
    g_score = {start: 0}
    
    while heap:
        _, curr = heapq.heappop(heap)
        if curr == end: return g_score[curr]
        
        r, c = curr
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < ROWS and 0 <= nc < COLS and grid[nr][nc] != 1:
                new_g = g_score[curr] + 1
                if new_g < g_score.get((nr, nc), float('inf')):
                    g_score[(nr, nc)] = new_g
                    heapq.heappush(heap, (new_g + h((nr,nc), end), (nr, nc)))
    return -1

def get_grid_and_validate(grid_data: List[List[int]]) -> List[List[int]]:
    if not grid_data or len(grid_data) != ROWS or len(grid_data[0]) != COLS:
         return [[0 for _ in range(COLS)] for _ in range(ROWS)]
    
    grid_data[1][1] = 0
    grid_data[GOAL_R][GOAL_C] = 0 
    return grid_data

# Simulated Annealing
def generate_patrol_path(grid: List[List[int]], start_pos: Tuple[int, int], difficulty: str) -> List[Tuple[int, int]]:
    length = 5
    if difficulty == 'medium': length = 8
    if difficulty == 'hard': length = 12

    current_path = [start_pos]
    r, c = start_pos
    
    # SA logic
    for _ in range(length):
        moves = [(-1,0), (1,0), (0,-1), (0,1)]
        valid_moves = []
        for dr, dc in moves:
            nr, nc = r+dr, c+dc
            if 0 <= nr < ROWS and 0 <= nc < COLS and grid[nr][nc] != 1:
                valid_moves.append((nr, nc))
        
        if valid_moves:
            next_pos = random.choice(valid_moves)
            current_path.append(next_pos)
            r, c = next_pos
        else:
            break
            
    return current_path