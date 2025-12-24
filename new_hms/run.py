#!/usr/bin/env python3

from app import create_app, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        print("Database tables created/verified.")
    
    print("Starting Hotel Management System...")
    print("Access the application at: http://localhost:5000")
    print("Login with username: admin, password: admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)