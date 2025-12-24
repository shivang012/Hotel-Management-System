# HotelSync - Application Directory

This is the main application directory for the HotelSync Hotel Management System.

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```bash
   python run.py
   ```

3. **Access the Application**
   - Open browser: `http://localhost:5000`
   - Default admin credentials will be shown in terminal

## Architecture

- **Flask 3.0+** with modular blueprint structure
- **SQLAlchemy** ORM with SQLite database
- **Modern UI** with responsive design and real-time features
- **RESTful API** endpoints for all operations

## Key Features

✅ **Complete CRUD Operations** - Rooms, Reservations, Guests, Billing  
✅ **Advanced Maintenance System** - Schedule and track room maintenance  
✅ **Real-time Dashboard** - Live charts and analytics  
✅ **Modern UI/UX** - Professional design with animations  
✅ **Mobile Responsive** - Works on all devices  
✅ **Invoice Management** - Automated billing and payments  

## Project Structure

```
app/
├── blueprints/          # Route handlers
├── models/             # Database models
├── static/             # CSS, JS, images
├── templates/          # HTML templates
├── config.py          # App configuration
└── __init__.py        # App factory
```

## API Endpoints

- **Rooms**: `/api/rooms` - Full CRUD operations
- **Reservations**: `/api/reservations` - Booking management  
- **Guests**: `/api/guests` - Guest profiles
- **Billing**: `/api/billing/invoices` - Invoice and payment handling
- **Dashboard**: `/api/dashboard/stats` - Real-time analytics

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask --app manage.py create-db
flask --app manage.py create-admin admin admin123
python run.py
```
Visit: http://127.0.0.1:5000/login

## Environment Variables
Create a `.env` (if desired):
```
SECRET_KEY=change-me
DATABASE_URL=sqlite:///hotel.db
```

## License
MIT
