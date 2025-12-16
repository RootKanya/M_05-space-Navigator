from flask import Flask, render_template, jsonify, request
from ai_engine import get_grid_and_validate, generate_patrol_path, ROWS, COLS 
import os
import random
import sys

app = Flask(__name__, template_folder='./templates', static_folder='./static')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/generate-level', methods=['POST'])
def generate_level():
    data = request.json
    difficulty = data.get('difficulty', 'easy')
    
    grid_data = data.get('grid')
    if not grid_data:
        return jsonify({'error': 'No map data provided from client'}), 400
        
    grid = get_grid_and_validate(grid_data)

    comets = []
    max_moving_comets = {'medium': 2, 'hard': 4}.get(difficulty, 0)
    moving_comets_count = 0
    
    for r in range(ROWS):
        for c in range(COLS):
            if grid[r][c] == 0 and random.random() < 0.10: 
                
                is_moving = (moving_comets_count < max_moving_comets)
                
                if is_moving:
                    path = generate_patrol_path(grid, (r, c), difficulty)
                    comets.append({'start': (r,c), 'path': path, 'type': 'moving'})
                    moving_comets_count += 1
                else:
                    comets.append({'start': (r,c), 'path': [], 'type': 'static'})

    return jsonify({
        'grid': grid,
        'comets': comets,
        'rows': ROWS,
        'cols': COLS
    })

if __name__ == '__main__':
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    app.run(debug=True)