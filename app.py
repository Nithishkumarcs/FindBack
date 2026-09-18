import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    # Prevent serving sensitive files
    if filename.endswith(('.py', '.db', '.sqlite', '.env', '.gitignore')):
        return "Access denied", 403
    return send_from_directory('.', filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("\n" + "=" * 56)
    print(" [+] FindBack (Simple Edition) is running!")
    print(f" [*] Open your browser at: http://127.0.0.1:{port}")
    print("=" * 56 + "\n")
    app.run(host='0.0.0.0', port=port, debug=False)
