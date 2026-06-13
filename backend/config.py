import os

class Config:
    # SQLite Database Path (can be overridden by Render Persistent Disk path)
    DB_PATH = os.environ.get('DB_PATH', os.path.join(os.path.dirname(__file__), 'healthcare.db'))
    
    # Flask Server Settings
    DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '127.0.0.1')
