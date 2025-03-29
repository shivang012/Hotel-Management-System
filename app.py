# app.py - Main Flask application
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from flask_mysqldb import MySQL
from datetime import datetime, timedelta
import json
import os
import re
import hashlib
import secrets
import requests

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'  # Update with your MySQL username
app.config['MYSQL_PASSWORD'] = 'root'  # Update with your MySQL password
app.config['MYSQL_DB'] = 'hotel_management'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Initialize MySQL
mysql = MySQL(app)

# Session configuration
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)

# Routes


@app.route('/')
def index():
    if 'logged_in' in session:
        return render_template('index.html')
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Check if the request is JSON
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
        else:
            # Handle form data
            username = request.form.get('username')
            password = request.form.get('password')

        # Hash the password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Check if user exists
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s AND password = %s",
                    (username, hashed_password))
        user = cur.fetchone()
        cur.close()

        if user:
            session['logged_in'] = True
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']


            return redirect(url_for('dashboard'))
        else:
            # Return to login page with error
            return render_template('login.html', error='Invalid username or password')

    return render_template('login.html')

    #         # Return JSON response for API requests
    #         if request.is_json:
    #             return jsonify({
    #                 "message": "Login successful",
    #                 "user": {
    #                     "id": user['id'],
    #                     "username": user['username'],
    #                     "role": user['role']
    #                 }
    #             }), 200
    #         else:
    #             # Redirect for HTML form submission
    #             return redirect(url_for('dashboard'))
    #     else:
    #         # Return error response
    #         if request.is_json:
    #             return jsonify({"message": "Invalid username or password"}), 401
    #         else:
    #             return render_template('login.html', error='Invalid username or password')

    # # Render the login page for GET requests
    # return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# API Routes for Reservations


@app.route('/api/reservations', methods=['GET'])
def get_reservations():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Get optional query parameters
    status = request.args.get('status')

    cur = mysql.connection.cursor()

    query = """
        SELECT r.*, g.name as guest_name, rt.name as room_type_name 
        FROM reservations r
        JOIN guests g ON r.guest_id = g.id
        JOIN room_types rt ON r.room_type_id = rt.id
    """

    if status:
        query += " WHERE r.status = %s"
        cur.execute(query, (status,))
    else:
        cur.execute(query)

    reservations = cur.fetchall()
    cur.close()

    # Format dates for JSON response
    for res in reservations:
        res['check_in_date'] = res['check_in_date'].strftime('%Y-%m-%d')
        res['check_out_date'] = res['check_out_date'].strftime('%Y-%m-%d')
        res['created_at'] = res['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if res['updated_at']:
            res['updated_at'] = res['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

    return jsonify(reservations)


@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json

    # Validate required fields
    required_fields = ['guest_name', 'guest_email', 'check_in_date',
                       'check_out_date', 'room_type_id', 'num_guests']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", data['guest_email']):
        return jsonify({'error': 'Invalid email format'}), 400

    # Validate dates
    try:
        check_in = datetime.strptime(data['check_in_date'], '%Y-%m-%d')
        check_out = datetime.strptime(data['check_out_date'], '%Y-%m-%d')

        if check_in < datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
            return jsonify({'error': 'Check-in date cannot be in the past'}), 400

        if check_out <= check_in:
            return jsonify({'error': 'Check-out date must be after check-in date'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Begin transaction
    cur = mysql.connection.cursor()

    try:
        # Check if guest exists, or create new guest
        cur.execute("SELECT id FROM guests WHERE email = %s",
                    (data['guest_email'],))
        guest = cur.fetchone()

        if guest:
            guest_id = guest['id']
        else:
            # Create new guest
            cur.execute(
                "INSERT INTO guests (name, email, phone) VALUES (%s, %s, %s)",
                (data['guest_name'], data['guest_email'],
                 data.get('guest_phone', ''))
            )
            mysql.connection.commit()
            guest_id = cur.lastrowid

        # Check room availability
        cur.execute("""
            SELECT COUNT(*) as available_rooms
            FROM rooms r
            WHERE r.room_type_id = %s
            AND r.status = 'available'
            AND r.id NOT IN (
                SELECT res.room_id
                FROM reservations res
                WHERE (res.check_in_date BETWEEN %s AND %s
                OR res.check_out_date BETWEEN %s AND %s
                OR (res.check_in_date <= %s AND res.check_out_date >= %s))
                AND res.status != 'cancelled'
            )
        """, (
            data['room_type_id'],
            data['check_in_date'], data['check_out_date'],
            data['check_in_date'], data['check_out_date'],
            data['check_in_date'], data['check_out_date']
        ))

        availability = cur.fetchone()

        if availability and availability['available_rooms'] > 0:
            # Calculate total price
            cur.execute(
                "SELECT base_price FROM room_types WHERE id = %s", (data['room_type_id'],))
            room_type = cur.fetchone()

            if not room_type:
                return jsonify({'error': 'Invalid room type'}), 400

            base_price = room_type['base_price']
            nights = (check_out - check_in).days
            total_price = base_price * nights

            # Apply any discounts
            if nights >= 7:
                total_price = total_price * 0.9  # 10% discount for week-long stays

            # Create the reservation
            cur.execute("""
                INSERT INTO reservations (
                    guest_id, room_type_id, check_in_date, check_out_date, 
                    num_guests, total_price, status, special_requests, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                guest_id, data['room_type_id'], data['check_in_date'], data['check_out_date'],
                data['num_guests'], total_price, 'confirmed', data.get(
                    'special_requests', ''),
                session['user_id']
            ))

            mysql.connection.commit()
            reservation_id = cur.lastrowid

            # Get the created reservation
            cur.execute("""
                SELECT r.*, g.name as guest_name, g.email as guest_email, rt.name as room_type_name
                FROM reservations r
                JOIN guests g ON r.guest_id = g.id
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.id = %s
            """, (reservation_id,))

            new_reservation = cur.fetchone()

            # Format dates for JSON response
            new_reservation['check_in_date'] = new_reservation['check_in_date'].strftime(
                '%Y-%m-%d')
            new_reservation['check_out_date'] = new_reservation['check_out_date'].strftime(
                '%Y-%m-%d')
            new_reservation['created_at'] = new_reservation['created_at'].strftime(
                '%Y-%m-%d %H:%M:%S')

            return jsonify({
                'success': True,
                'message': 'Reservation created successfully',
                'reservation': new_reservation
            })
        else:
            return jsonify({'error': 'No rooms available for the selected dates and room type'}), 400

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()


@app.route('/api/reservations/<int:id>', methods=['GET'])
def get_reservation(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT r.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
        rt.name as room_type_name
        FROM reservations r
        JOIN guests g ON r.guest_id = g.id
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.id = %s
    """, (id,))

    reservation = cur.fetchone()
    cur.close()

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    # Format dates for JSON response
    reservation['check_in_date'] = reservation['check_in_date'].strftime(
        '%Y-%m-%d')
    reservation['check_out_date'] = reservation['check_out_date'].strftime(
        '%Y-%m-%d')
    reservation['created_at'] = reservation['created_at'].strftime(
        '%Y-%m-%d %H:%M:%S')
    if reservation['updated_at']:
        reservation['updated_at'] = reservation['updated_at'].strftime(
            '%Y-%m-%d %H:%M:%S')

    return jsonify(reservation)


@app.route('/api/reservations/<int:id>', methods=['PUT'])
def update_reservation(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json

    cur = mysql.connection.cursor()

    # First check if reservation exists
    cur.execute("SELECT * FROM reservations WHERE id = %s", (id,))
    reservation = cur.fetchone()

    if not reservation:
        cur.close()
        return jsonify({'error': 'Reservation not found'}), 404

    # Build update query based on provided fields
    update_fields = []
    params = []

    if 'room_type_id' in data:
        update_fields.append("room_type_id = %s")
        params.append(data['room_type_id'])

    if 'check_in_date' in data:
        update_fields.append("check_in_date = %s")
        params.append(data['check_in_date'])

    if 'check_out_date' in data:
        update_fields.append("check_out_date = %s")
        params.append(data['check_out_date'])

    if 'num_guests' in data:
        update_fields.append("num_guests = %s")
        params.append(data['num_guests'])

    if 'status' in data:
        update_fields.append("status = %s")
        params.append(data['status'])

    if 'special_requests' in data:
        update_fields.append("special_requests = %s")
        params.append(data['special_requests'])

    if 'room_id' in data:
        update_fields.append("room_id = %s")
        params.append(data['room_id'])

    # Only update if there are fields to update
    if update_fields:
        update_fields.append("updated_at = %s")
        params.append(datetime.now())

        update_fields.append("updated_by = %s")
        params.append(session['user_id'])

        # Create the query
        query = "UPDATE reservations SET " + \
            ", ".join(update_fields) + " WHERE id = %s"
        params.append(id)

        try:
            cur.execute(query, tuple(params))
            mysql.connection.commit()

            # Get the updated reservation
            cur.execute("""
                SELECT r.*, g.name as guest_name, rt.name as room_type_name
                FROM reservations r
                JOIN guests g ON r.guest_id = g.id
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.id = %s
            """, (id,))

            updated_reservation = cur.fetchone()

            # Format dates for JSON response
            updated_reservation['check_in_date'] = updated_reservation['check_in_date'].strftime(
                '%Y-%m-%d')
            updated_reservation['check_out_date'] = updated_reservation['check_out_date'].strftime(
                '%Y-%m-%d')
            updated_reservation['created_at'] = updated_reservation['created_at'].strftime(
                '%Y-%m-%d %H:%M:%S')
            if updated_reservation['updated_at']:
                updated_reservation['updated_at'] = updated_reservation['updated_at'].strftime(
                    '%Y-%m-%d %H:%M:%S')

            return jsonify({
                'success': True,
                'message': 'Reservation updated successfully',
                'reservation': updated_reservation
            })

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500

        finally:
            cur.close()

    else:
        cur.close()
        return jsonify({'message': 'No changes to update'})


@app.route('/api/reservations/<int:id>', methods=['DELETE'])
def delete_reservation(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()

    # Check if reservation exists
    cur.execute("SELECT * FROM reservations WHERE id = %s", (id,))
    reservation = cur.fetchone()

    if not reservation:
        cur.close()
        return jsonify({'error': 'Reservation not found'}), 404

    try:
        # Instead of deleting, set status to cancelled
        cur.execute(
            "UPDATE reservations SET status = 'cancelled', updated_at = %s, updated_by = %s WHERE id = %s",
            (datetime.now(), session['user_id'], id)
        )
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Reservation cancelled successfully'
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()

# API Routes for Rooms


@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Get optional query parameters
    status = request.args.get('status')
    room_type_id = request.args.get('room_type_id')

    cur = mysql.connection.cursor()

    query = """
        SELECT r.*, rt.name as room_type_name, rt.base_price
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
    """

    params = []
    where_clauses = []

    if status:
        where_clauses.append("r.status = %s")
        params.append(status)

    if room_type_id:
        where_clauses.append("r.room_type_id = %s")
        params.append(room_type_id)

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY r.room_number"

    cur.execute(query, tuple(params) if params else None)
    rooms = cur.fetchall()
    cur.close()

    return jsonify(rooms)


@app.route('/api/rooms', methods=['POST'])
def create_room():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    data = request.json

    # Validate required fields
    required_fields = ['room_number', 'room_type_id', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    cur = mysql.connection.cursor()

    try:
        # Check if room number already exists
        cur.execute("SELECT id FROM rooms WHERE room_number = %s",
                    (data['room_number'],))
        existing_room = cur.fetchone()

        if existing_room:
            return jsonify({'error': 'Room number already exists'}), 400

        # Check if room type exists
        cur.execute("SELECT id FROM room_types WHERE id = %s",
                    (data['room_type_id'],))
        room_type = cur.fetchone()

        if not room_type:
            return jsonify({'error': 'Invalid room type'}), 400

        # Create the room
        cur.execute("""
            INSERT INTO rooms (room_number, room_type_id, status, notes)
            VALUES (%s, %s, %s, %s)
        """, (
            data['room_number'],
            data['room_type_id'],
            data['status'],
            data.get('notes', '')
        ))

        mysql.connection.commit()
        room_id = cur.lastrowid

        # Get the created room
        cur.execute("""
            SELECT r.*, rt.name as room_type_name, rt.base_price
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = %s
        """, (room_id,))

        new_room = cur.fetchone()

        return jsonify({
            'success': True,
            'message': 'Room created successfully',
            'room': new_room
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()


@app.route('/api/rooms/<int:id>', methods=['GET'])
def get_room(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT r.*, rt.name as room_type_name, rt.base_price, rt.description
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.id = %s
    """, (id,))

    room = cur.fetchone()
    cur.close()

    if not room:
        return jsonify({'error': 'Room not found'}), 404

    return jsonify(room)


@app.route('/api/rooms/<int:id>', methods=['PUT'])
def update_room(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    data = request.json

    cur = mysql.connection.cursor()

    # First check if room exists
    cur.execute("SELECT * FROM rooms WHERE id = %s", (id,))
    room = cur.fetchone()

    if not room:
        cur.close()
        return jsonify({'error': 'Room not found'}), 404

    # Build update query based on provided fields
    update_fields = []
    params = []

    if 'room_number' in data:
        # Check if the new room number already exists (except for this room)
        cur.execute("SELECT id FROM rooms WHERE room_number = %s AND id != %s",
                    (data['room_number'], id))
        existing_room = cur.fetchone()

        if existing_room:
            cur.close()
            return jsonify({'error': 'Room number already exists'}), 400

        update_fields.append("room_number = %s")
        params.append(data['room_number'])

    if 'room_type_id' in data:
        # Check if room type exists
        cur.execute("SELECT id FROM room_types WHERE id = %s",
                    (data['room_type_id'],))
        room_type = cur.fetchone()

        if not room_type:
            cur.close()
            return jsonify({'error': 'Invalid room type'}), 400

        update_fields.append("room_type_id = %s")
        params.append(data['room_type_id'])

    if 'status' in data:
        update_fields.append("status = %s")
        params.append(data['status'])

    if 'notes' in data:
        update_fields.append("notes = %s")
        params.append(data['notes'])

    # Only update if there are fields to update
    if update_fields:
        # Create the query
        query = "UPDATE rooms SET " + \
            ", ".join(update_fields) + " WHERE id = %s"
        params.append(id)

        try:
            cur.execute(query, tuple(params))
            mysql.connection.commit()

            # Get the updated room
            cur.execute("""
                SELECT r.*, rt.name as room_type_name, rt.base_price
                FROM rooms r
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE r.id = %s
            """, (id,))

            updated_room = cur.fetchone()

            return jsonify({
                'success': True,
                'message': 'Room updated successfully',
                'room': updated_room
            })

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500

        finally:
            cur.close()

    else:
        cur.close()
        return jsonify({'message': 'No changes to update'})


@app.route('/api/rooms/<int:id>', methods=['DELETE'])
def delete_room(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    cur = mysql.connection.cursor()

    # Check if room exists
    cur.execute("SELECT * FROM rooms WHERE id = %s", (id,))
    room = cur.fetchone()

    if not room:
        cur.close()
        return jsonify({'error': 'Room not found'}), 404

    # Check if room is referenced in any reservations
    cur.execute("SELECT id FROM reservations WHERE room_id = %s", (id,))
    reservations = cur.fetchall()

    if reservations:
        cur.close()
        return jsonify({'error': 'Cannot delete room with existing reservations'}), 400

    try:
        # Delete the room
        cur.execute("DELETE FROM rooms WHERE id = %s", (id,))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Room deleted successfully'
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()

# API Routes for Room Types


@app.route('/api/room-types', methods=['GET'])
def get_room_types():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()

    cur.execute("""
        SELECT rt.*, 
            (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id) as room_count
        FROM room_types rt
        ORDER BY rt.base_price
    """)

    room_types = cur.fetchall()
    cur.close()

    return jsonify(room_types)


@app.route('/api/room-types', methods=['POST'])
def create_room_type():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    data = request.json

    # Validate required fields
    required_fields = ['name', 'base_price']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    cur = mysql.connection.cursor()

    try:
        # Check if room type name already exists
        cur.execute("SELECT id FROM room_types WHERE name = %s",
                    (data['name'],))
        existing_type = cur.fetchone()

        if existing_type:
            return jsonify({'error': 'Room type name already exists'}), 400

        # Create the room type
        cur.execute("""
            INSERT INTO room_types (name, description, base_price, amenities)
            VALUES (%s, %s, %s, %s)
        """, (
            data['name'],
            data.get('description', ''),
            data['base_price'],
            json.dumps(data.get('amenities', []))
        ))

        mysql.connection.commit()
        room_type_id = cur.lastrowid

        # Get the created room type
        cur.execute("SELECT * FROM room_types WHERE id = %s", (room_type_id,))
        new_room_type = cur.fetchone()

        return jsonify({
            'success': True,
            'message': 'Room type created successfully',
            'room_type': new_room_type
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()


@app.route('/api/room-types/<int:id>', methods=['GET'])
def get_room_type(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT rt.*, 
            (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id) as room_count
        FROM room_types rt
        WHERE rt.id = %s
    """, (id,))

    room_type = cur.fetchone()
    cur.close()

    if not room_type:
        return jsonify({'error': 'Room type not found'}), 404

    # Parse JSON amenities
    if room_type['amenities']:
        try:
            room_type['amenities'] = json.loads(room_type['amenities'])
        except:
            room_type['amenities'] = []

    return jsonify(room_type)


@app.route('/api/room-types/<int:id>', methods=['PUT'])
def update_room_type(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    data = request.json

    cur = mysql.connection.cursor()

    # First check if room type exists
    cur.execute("SELECT * FROM room_types WHERE id = %s", (id,))
    room_type = cur.fetchone()

    if not room_type:
        cur.close()
        return jsonify({'error': 'Room type not found'}), 404

    # Build update query based on provided fields
    update_fields = []
    params = []

    if 'name' in data:
        # Check if the new name already exists (except for this room type)
        cur.execute(
            "SELECT id FROM room_types WHERE name = %s AND id != %s", (data['name'], id))
        existing_type = cur.fetchone()

        if existing_type:
            cur.close()
            return jsonify({'error': 'Room type name already exists'}), 400

        update_fields.append("name = %s")
        params.append(data['name'])

    if 'description' in data:
        update_fields.append("description = %s")
        params.append(data['description'])

    if 'base_price' in data:
        update_fields.append("base_price = %s")
        params.append(data['base_price'])

    if 'amenities' in data:
        update_fields.append("amenities = %s")
        params.append(json.dumps(data['amenities']))

    # Only update if there are fields to update
    if update_fields:
        # Create the query
        query = "UPDATE room_types SET " + \
            ", ".join(update_fields) + " WHERE id = %s"
        params.append(id)

        try:
            cur.execute(query, tuple(params))
            mysql.connection.commit()

            # Get the updated room type
            cur.execute("""
                SELECT rt.*, 
                    (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id) as room_count
                FROM room_types rt
                WHERE rt.id = %s
            """, (id,))

            updated_room_type = cur.fetchone()

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cur.close()

            # Parse JSON amenities
            if update_fields:
                # Create the query
                query = "UPDATE room_types SET " + \
                ", ".join(update_fields) + " WHERE id = %s"
        params.append(id)

        try:
            cur.execute(query, tuple(params))
            mysql.connection.commit()

            # Get the updated room type
            cur.execute("""
                SELECT rt.*, 
                    (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id) as room_count
                FROM room_types rt
                WHERE rt.id = %s
            """, (id,))

            updated_room_type = cur.fetchone()

            # Parse JSON amenities
            if updated_room_type['amenities']:
                try:
                    updated_room_type['amenities'] = json.loads(
                        updated_room_type['amenities'])
                except:
                    updated_room_type['amenities'] = []

            return jsonify({
                'success': True,
                'message': 'Room type updated successfully',
                'room_type': updated_room_type
            })

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500

        finally:
            cur.close()

    else:
        cur.close()
        return jsonify({'message': 'No changes to update'})


@app.route('/api/room-types/<int:id>', methods=['DELETE'])
def delete_room_type(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Check if user has admin role
    if session.get('role') != 'admin':
        return jsonify({'error': 'Permission denied. Admin role required'}), 403

    cur = mysql.connection.cursor()

    # Check if room type exists
    cur.execute("SELECT * FROM room_types WHERE id = %s", (id,))
    room_type = cur.fetchone()

    if not room_type:
        cur.close()
        return jsonify({'error': 'Room type not found'}), 404

    # Check if room type is referenced in any rooms
    cur.execute("SELECT id FROM rooms WHERE room_type_id = %s", (id,))
    rooms = cur.fetchall()

    if rooms:
        cur.close()
        return jsonify({'error': 'Cannot delete room type with existing rooms'}), 400

    try:
        # Delete the room type
        cur.execute("DELETE FROM room_types WHERE id = %s", (id,))
        mysql.connection.commit()

        return jsonify({
            'success': True,
            'message': 'Room type deleted successfully'
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()

# API Routes for Guests

@app.route('/guests')
def guests():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('guests.html')

@app.route('/api/guests', methods=['GET'])
def get_guests():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Get optional query parameters
    search = request.args.get('search', '')

    cur = mysql.connection.cursor()

    if search:
        search_term = f"%{search}%"
        query = """
            SELECT g.*, 
                (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as reservation_count
            FROM guests g
            WHERE g.name LIKE %s OR g.email LIKE %s OR g.phone LIKE %s
            ORDER BY g.name
        """
        cur.execute(query, (search_term, search_term, search_term))
    else:
        query = """
            SELECT g.*, 
                (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as reservation_count
            FROM guests g
            ORDER BY g.name
        """
        cur.execute(query)

    guests = cur.fetchall()
    cur.close()

    # Format dates for JSON response
    for guest in guests:
        if guest['created_at']:
            guest['created_at'] = guest['created_at'].strftime(
                '%Y-%m-%d %H:%M:%S')
        if guest['updated_at']:
            guest['updated_at'] = guest['updated_at'].strftime(
                '%Y-%m-%d %H:%M:%S')

    return jsonify(guests)


@app.route('/api/guests/<int:id>', methods=['GET'])
def get_guest(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()

    # Get guest details
    cur.execute("""
        SELECT g.*, 
            (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as reservation_count
        FROM guests g
        WHERE g.id = %s
    """, (id,))

    guest = cur.fetchone()

    if not guest:
        cur.close()
        return jsonify({'error': 'Guest not found'}), 404

    # Format dates for JSON response
    if guest['created_at']:
        guest['created_at'] = guest['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    if guest['updated_at']:
        guest['updated_at'] = guest['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

    # Get guest's reservations
    cur.execute("""
        SELECT r.id, r.check_in_date, r.check_out_date, r.status, r.total_price,
            rt.name as room_type_name
        FROM reservations r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.guest_id = %s
        ORDER BY r.check_in_date DESC
    """, (id,))

    reservations = cur.fetchall()

    # Format dates for reservations
    for res in reservations:
        res['check_in_date'] = res['check_in_date'].strftime('%Y-%m-%d')
        res['check_out_date'] = res['check_out_date'].strftime('%Y-%m-%d')

    # Add reservations to guest data
    guest['reservations'] = reservations

    cur.close()
    return jsonify(guest)


@app.route('/api/guests/<int:id>', methods=['PUT'])
def update_guest(id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json

    cur = mysql.connection.cursor()

    # First check if guest exists
    cur.execute("SELECT * FROM guests WHERE id = %s", (id,))
    guest = cur.fetchone()

    if not guest:
        cur.close()
        return jsonify({'error': 'Guest not found'}), 404

    # Build update query based on provided fields
    update_fields = []
    params = []

    if 'name' in data:
        update_fields.append("name = %s")
        params.append(data['name'])

    if 'email' in data:
        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            cur.close()
            return jsonify({'error': 'Invalid email format'}), 400

        # Check if the new email already exists (except for this guest)
        cur.execute(
            "SELECT id FROM guests WHERE email = %s AND id != %s", (data['email'], id))
        existing_guest = cur.fetchone()

        if existing_guest:
            cur.close()
            return jsonify({'error': 'Email already exists for another guest'}), 400

        update_fields.append("email = %s")
        params.append(data['email'])

    if 'phone' in data:
        update_fields.append("phone = %s")
        params.append(data['phone'])

    if 'address' in data:
        update_fields.append("address = %s")
        params.append(data['address'])

    if 'notes' in data:
        update_fields.append("notes = %s")
        params.append(data['notes'])

    # Only update if there are fields to update
    if update_fields:
        update_fields.append("updated_at = %s")
        params.append(datetime.now())

        # Create the query
        query = "UPDATE guests SET " + \
            ", ".join(update_fields) + " WHERE id = %s"
        params.append(id)

        try:
            cur.execute(query, tuple(params))
            mysql.connection.commit()

            # Get the updated guest
            cur.execute("""
                SELECT g.*, 
                    (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as reservation_count
                FROM guests g
                WHERE g.id = %s
            """, (id,))

            updated_guest = cur.fetchone()

            # Format dates for JSON response
            if updated_guest['created_at']:
                updated_guest['created_at'] = updated_guest['created_at'].strftime(
                    '%Y-%m-%d %H:%M:%S')
            if updated_guest['updated_at']:
                updated_guest['updated_at'] = updated_guest['updated_at'].strftime(
                    '%Y-%m-%d %H:%M:%S')

            return jsonify({
                'success': True,
                'message': 'Guest updated successfully',
                'guest': updated_guest
            })

        except Exception as e:
            mysql.connection.rollback()
            return jsonify({'error': str(e)}), 500

        finally:
            cur.close()

    else:
        cur.close()
        return jsonify({'message': 'No changes to update'})
    
# You might want to add a POST endpoint for creating new guests if not already present (Newly added)
@app.route('/api/guests', methods=['POST'])
def create_guest():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json

    # Validate required fields
    required_fields = ['name', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
        return jsonify({'error': 'Invalid email format'}), 400

    cur = mysql.connection.cursor()

    try:
        # Check if email already exists
        cur.execute("SELECT id FROM guests WHERE email = %s", (data['email'],))
        existing_guest = cur.fetchone()

        if existing_guest:
            return jsonify({'error': 'Email already exists for another guest'}), 400

        # Create the guest
        cur.execute("""
            INSERT INTO guests (name, email, phone, address, notes)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data['name'],
            data['email'],
            data.get('phone', ''),
            data.get('address', ''),
            data.get('notes', '')
        ))

        mysql.connection.commit()
        guest_id = cur.lastrowid

        # Get the created guest
        cur.execute("""
            SELECT g.*, 
                (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as reservation_count,
                (SELECT MAX(check_out_date) FROM reservations WHERE guest_id = g.id) as last_stay
            FROM guests g
            WHERE g.id = %s
        """, (guest_id,))

        new_guest = cur.fetchone()

        # Format dates for JSON response
        if new_guest['created_at']:
            new_guest['created_at'] = new_guest['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if new_guest['last_stay']:
            new_guest['last_stay'] = new_guest['last_stay'].strftime('%Y-%m-%d')

        return jsonify({
            'success': True,
            'message': 'Guest created successfully',
            'guest': new_guest
        })

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()

# API Routes for Dashboard Statistics
@app.route('/dashboard')
def dashboard():
    if 'logged_in' not in session:
        return redirect(url_for('login'))

    try:
        # Fetch dashboard stats directly from the database
        cur = mysql.connection.cursor()
        
        # Get current date
        today = datetime.now().date()
        
        # Get basic stats
        cur.execute("SELECT COUNT(*) as total FROM rooms")
        total_rooms = cur.fetchone()['total']
        
        cur.execute("""
            SELECT COUNT(DISTINCT r.id) as occupied 
            FROM rooms r
            JOIN reservations res ON res.room_id = r.id
            WHERE res.status IN ('checked-in', 'confirmed')
            AND res.check_in_date <= %s AND res.check_out_date > %s
        """, (today, today))
        occupied_rooms = cur.fetchone()['occupied']
        
        cur.execute("SELECT COUNT(*) as maintenance FROM rooms WHERE status = 'maintenance'")
        maintenance_rooms = cur.fetchone()['maintenance']
        
        available_rooms = total_rooms - occupied_rooms - maintenance_rooms
        
        # Get recent reservations
        cur.execute("""
            SELECT r.id, r.check_in_date, r.check_out_date, r.status, r.total_price,
                g.name as guest_name, rt.name as room_type_name
            FROM reservations r
            JOIN guests g ON r.guest_id = g.id
            JOIN room_types rt ON r.room_type_id = rt.id
            ORDER BY r.created_at DESC
            LIMIT 5
        """)
        recent_reservations = cur.fetchall()
        
        # Format dates
        for res in recent_reservations:
            res['check_in_date'] = res['check_in_date'].strftime('%Y-%m-%d')
            res['check_out_date'] = res['check_out_date'].strftime('%Y-%m-%d')
        
        # Basic stats for initial page load
        stats = {
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'maintenance_rooms': maintenance_rooms,
            'occupancy_rate': round((occupied_rooms / (total_rooms - maintenance_rooms) * 100), 2) if (total_rooms - maintenance_rooms) > 0 else 0,
            'todays_checkins': 0,  # Will be updated by JavaScript
            'todays_checkouts': 0,  # Will be updated by JavaScript
            'revenue': {
                'today': 0  # Will be updated by JavaScript
            },
            'recent_reservations': recent_reservations
        }
        
        return render_template('index.html', stats=stats)
        
    except Exception as e:
        # Fallback if there's an error
        stats = {
            'total_rooms': 0,
            'occupied_rooms': 0,
            'available_rooms': 0,
            'maintenance_rooms': 0,
            'occupancy_rate': 0,
            'todays_checkins': 0,
            'todays_checkouts': 0,
            'revenue': {
                'today': 0
            },
            'recent_reservations': []
        }
        return render_template('index.html', stats=stats)
        
    finally:
        cur.close()

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cur = mysql.connection.cursor()

    try:
        # Get current date
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # Get total rooms count (excluding maintenance)
        cur.execute("SELECT COUNT(*) as total FROM rooms WHERE status != 'maintenance'")
        total_rooms = cur.fetchone()['total']

        # Get occupied rooms (both checked-in and reserved)
        cur.execute("""
            SELECT COUNT(DISTINCT r.id) as occupied 
            FROM rooms r
            JOIN reservations res ON res.room_id = r.id
            WHERE res.status IN ('checked-in', 'confirmed')
            AND res.check_in_date <= %s AND res.check_out_date > %s
        """, (today, today))
        occupied_result = cur.fetchone()
        occupied_rooms = occupied_result['occupied'] if occupied_result else 0

        # Get maintenance rooms
        cur.execute("SELECT COUNT(*) as maintenance FROM rooms WHERE status = 'maintenance'")
        maintenance_result = cur.fetchone()
        maintenance_rooms = maintenance_result['maintenance'] if maintenance_result else 0

        # Calculate available rooms
        available_rooms = total_rooms - occupied_rooms

        # Get today's check-ins
        cur.execute("""
            SELECT COUNT(*) as total FROM reservations 
            WHERE check_in_date = %s AND status = 'confirmed'
        """, (today,))
        todays_checkins = cur.fetchone()['total']

        # Get today's check-outs
        cur.execute("""
            SELECT COUNT(*) as total FROM reservations 
            WHERE check_out_date = %s AND status = 'checked-in'
        """, (today,))
        todays_checkouts = cur.fetchone()['total']

        # Get today's reservations
        cur.execute("""
            SELECT COUNT(*) as total FROM reservations 
            WHERE DATE(created_at) = %s
        """, (today,))
        todays_reservations = cur.fetchone()['total']

        # Get total guests
        cur.execute("SELECT COUNT(*) as total FROM guests")
        total_guests = cur.fetchone()['total']

        # Get revenue stats
        cur.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(check_in_date) = %s THEN total_price ELSE 0 END), 0) as today_revenue,
                COALESCE(SUM(CASE WHEN DATE(check_in_date) = %s THEN total_price ELSE 0 END), 0) as yesterday_revenue,
                COALESCE(SUM(CASE WHEN check_in_date >= DATE_SUB(%s, INTERVAL 30 DAY) THEN total_price ELSE 0 END), 0) as month_revenue
            FROM reservations
            WHERE status != 'cancelled'
        """, (today, yesterday, today))
        revenue = cur.fetchone()

        # Get occupancy rate (excluding maintenance rooms)
        if total_rooms > 0:
            occupancy_rate = round((occupied_rooms / total_rooms) * 100, 2)
        else:
            occupancy_rate = 0

        # Get recent reservations
        cur.execute("""
            SELECT r.id, r.check_in_date, r.check_out_date, r.status, r.total_price,
                g.name as guest_name, rt.name as room_type_name
            FROM reservations r
            JOIN guests g ON r.guest_id = g.id
            JOIN room_types rt ON r.room_type_id = rt.id
            ORDER BY r.created_at DESC
            LIMIT 5
        """)
        recent_reservations = cur.fetchall()

        # Format dates for JSON response
        for res in recent_reservations:
            res['check_in_date'] = res['check_in_date'].strftime('%Y-%m-%d')
            res['check_out_date'] = res['check_out_date'].strftime('%Y-%m-%d')

        # Compile all stats
        stats = {
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'maintenance_rooms': maintenance_rooms,
            'occupancy_rate': occupancy_rate,
            'todays_checkins': todays_checkins,
            'todays_checkouts': todays_checkouts,
            'todays_reservations': todays_reservations,
            'total_guests': total_guests,
            'revenue': {
                'today': float(revenue['today_revenue']),
                'yesterday': float(revenue['yesterday_revenue']),
                'month': float(revenue['month_revenue'])
            },
            'recent_reservations': recent_reservations
        }

        return jsonify(stats)

    except Exception as e:
        app.logger.error(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

    finally:
        cur.close()
# API Routes for Reports


@app.route('/api/reports/occupancy', methods=['GET'])
def get_occupancy_report():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Get optional date range parameters
    start_date = request.args.get(
        'start_date', datetime.now().date().replace(day=1).strftime('%Y-%m-%d'))
    end_date = request.args.get('end_date', (datetime.now().date().replace(
        day=1) + timedelta(days=30)).strftime('%Y-%m-%d'))

    try:
        # Convert string dates to datetime
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Validate date range
    if start > end:
        return jsonify({'error': 'Start date must be before end date'}), 400

    cur = mysql.connection.cursor()

    try:
        # Get total rooms count
        cur.execute("SELECT COUNT(*) as total FROM rooms")
        total_rooms = cur.fetchone()['total']

        # Generate date range
        date_range = []
        current_date = start
        while current_date <= end:
            date_range.append(current_date)
            current_date += timedelta(days=1)

        # Get occupancy data for each date
        occupancy_data = []

        for date in date_range:
            # Count occupied rooms
            cur.execute("""
                SELECT COUNT(*) as occupied FROM reservations 
                WHERE status IN ('confirmed', 'checked-in') 
                AND check_in_date <= %s AND check_out_date > %s
            """, (date, date))
            occupied = cur.fetchone()['occupied']

            # Calculate occupancy rate
            occupancy_rate = round(
                (occupied / total_rooms * 100), 2) if total_rooms > 0 else 0

            occupancy_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'occupied_rooms': occupied,
                'available_rooms': total_rooms - occupied,
                'occupancy_rate': occupancy_rate
            })

        # Get occupancy by room type
        cur.execute("""
            SELECT rt.id, rt.name, COUNT(r.id) as room_count
            FROM room_types rt
            LEFT JOIN rooms r ON r.room_type_id = rt.id
            GROUP BY rt.id
        """)
        room_types = cur.fetchall()

        room_type_occupancy = []

        for rt in room_types:
            # Get average occupancy for this room type
            cur.execute("""
                SELECT AVG(
                    CASE WHEN res.status IN ('confirmed', 'checked-in') 
                    AND res.check_in_date <= %s AND res.check_out_date > %s 
                    THEN 1 ELSE 0 END
                ) * 100 as avg_occupancy
                FROM rooms r
                LEFT JOIN reservations res ON res.room_id = r.id
                WHERE r.room_type_id = %s
            """, (end, start, rt['id']))

            avg_occupancy = cur.fetchone()['avg_occupancy']

            room_type_occupancy.append({
                'room_type_id': rt['id'],
                'room_type_name': rt['name'],
                'room_count': rt['room_count'],
                'avg_occupancy_rate': round(float(avg_occupancy or 0), 2)
            })

        report = {
            'start_date': start_date,
            'end_date': end_date,
            'total_rooms': total_rooms,
            'daily_occupancy': occupancy_data,
            'room_type_occupancy': room_type_occupancy
        }

        return jsonify(report)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()


@app.route('/api/reports/revenue', methods=['GET'])
def get_revenue_report():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Get optional date range parameters
    start_date = request.args.get(
        'start_date', (datetime.now().date() - timedelta(days=30)).strftime('%Y-%m-%d'))
    end_date = request.args.get(
        'end_date', datetime.now().date().strftime('%Y-%m-%d'))

    try:
        # Convert string dates to datetime
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Validate date range
    if start > end:
        return jsonify({'error': 'Start date must be before end date'}), 400

    cur = mysql.connection.cursor()

    try:
        # Generate date range
        date_range = []
        current_date = start
        while current_date <= end:
            date_range.append(current_date)
            current_date += timedelta(days=1)

        # Get revenue data for each date
        revenue_data = []

        for date in date_range:
            # Get revenue for this date
            cur.execute("""
                SELECT SUM(total_price) as daily_revenue, COUNT(*) as reservation_count
                FROM reservations 
                WHERE check_in_date = %s AND status != 'cancelled'
            """, (date,))
            result = cur.fetchone()

            revenue_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': float(result['daily_revenue'] or 0),
                'reservation_count': result['reservation_count']
            })

        # Get revenue by room type
        cur.execute("""
            SELECT rt.id, rt.name,
                SUM(CASE WHEN res.check_in_date BETWEEN %s AND %s THEN res.total_price ELSE 0 END) as revenue,
                COUNT(CASE WHEN res.check_in_date BETWEEN %s AND %s THEN res.id ELSE NULL END) as reservation_count
            FROM room_types rt
            LEFT JOIN reservations res ON res.room_type_id = rt.id AND res.status != 'cancelled'
            GROUP BY rt.id
            ORDER BY revenue DESC
        """, (start, end, start, end))

        room_type_revenue = cur.fetchall()

        # Calculate total revenue
        total_revenue = sum(item['revenue'] for item in revenue_data)
        total_reservations = sum(item['reservation_count']
                                 for item in revenue_data)

        report = {
            'start_date': start_date,
            'end_date': end_date,
            'total_revenue': total_revenue,
            'total_reservations': total_reservations,
            'daily_revenue': revenue_data,
            'room_type_revenue': [
                {
                    'room_type_id': rt['id'],
                    'room_type_name': rt['name'],
                    'revenue': float(rt['revenue']),
                    'reservation_count': rt['reservation_count'],
                    'percentage': round((float(rt['revenue']) / total_revenue * 100), 2) if total_revenue > 0 else 0
                }
                for rt in room_type_revenue
            ]
        }

        return jsonify(report)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()

# API Routes for Services
@app.route('/api/services', methods=['GET'])
def get_services():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    search = request.args.get('search', '')
    status = request.args.get('status', '')
    service_type = request.args.get('type', '')

    cur = mysql.connection.cursor()
    try:
        query = "SELECT * FROM services WHERE 1=1"
        params = []
        
        if search:
            query += " AND (name LIKE %s OR description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        
        if status:
            query += " AND status = %s"
            params.append(status)
            
        if service_type:
            query += " AND type = %s"
            params.append(service_type)
            
        query += " ORDER BY name"
        
        cur.execute(query, tuple(params))
        services = cur.fetchall()
        return jsonify(services)
    except Exception as e:
        app.logger.error(f"Error fetching services: {str(e)}")
        return jsonify({'error': 'Database error'}), 500
    finally:
        cur.close()

@app.route('/api/services', methods=['POST'])
def create_service():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = ['name', 'type', 'price']
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({'error': f'Missing required field: {field}'}), 400

    try:
        price = float(data['price'])
        if price <= 0:
            return jsonify({'error': 'Price must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid price format'}), 400

    service_data = {
        'name': data['name'].strip(),
        'type': data['type'],
        'price': price,
        'status': data.get('status', 'active'),
        'description': data.get('description', '').strip()
    }

    cur = mysql.connection.cursor()
    try:
        cur.execute("""
            INSERT INTO services (name, type, price, status, description)
            VALUES (%(name)s, %(type)s, %(price)s, %(status)s, %(description)s)
        """, service_data)
        mysql.connection.commit()
        
        cur.execute("SELECT * FROM services WHERE id = %s", (cur.lastrowid,))
        new_service = cur.fetchone()
        
        return jsonify({
            'success': True,
            'service': new_service,
            'message': 'Service created successfully'
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        app.logger.error(f"Error creating service: {str(e)}")
        return jsonify({'error': 'Failed to create service'}), 500
    finally:
        cur.close()

# Main entry point
if __name__ == '__main__':
    app.run(debug=True)
