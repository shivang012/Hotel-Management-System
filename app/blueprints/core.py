from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from .. import db
from ..models.core import Room, RoomType, Guest, Reservation, Service
from ..models.billing import Invoice, Payment
from ..models.setting import Setting
from datetime import date
from sqlalchemy import func

core_bp = Blueprint('core', __name__)

@core_bp.route('/')
@login_required
def dashboard():
    total_rooms = Room.query.count()
    occupied = Reservation.query.filter(Reservation.status.in_(['confirmed','checked-in']), Reservation.check_in <= date.today(), Reservation.check_out > date.today()).count()
    maintenance = Room.query.filter_by(status='maintenance').count()
    available = total_rooms - occupied - maintenance
    return render_template('dashboard.html', stats={
        'total_rooms': total_rooms,
        'occupied_rooms': occupied,
        'available_rooms': available,
        'maintenance_rooms': maintenance
    })

# Page Routes
@core_bp.route('/rooms')
@login_required
def rooms():
    return render_template('rooms.html')

@core_bp.route('/room-types')
@login_required
def room_types():
    return render_template('room_types.html')

@core_bp.route('/guests')
@login_required
def guests():
    return render_template('guests.html')

@core_bp.route('/reservations')
@login_required
def reservations():
    return render_template('reservations.html')

@core_bp.route('/services')
@login_required
def services():
    return render_template('services.html')

# API endpoints for rooms
@core_bp.route('/api/rooms')
@login_required
def api_rooms():
    rooms = Room.query.all()
    return jsonify([{'id':r.id,'number':r.number,'type': r.room_type.name if r.room_type else 'N/A','status':r.status} for r in rooms])

# API endpoints for room types
@core_bp.route('/api/room-types')
@login_required  
def api_room_types():
    room_types = RoomType.query.all()
    return jsonify([{'id':rt.id,'name':rt.name,'description':rt.description,'base_price':float(rt.base_price)} for rt in room_types])

# API endpoints for guests
@core_bp.route('/api/guests')
@login_required
def api_guests():
    guests = Guest.query.all()
    return jsonify([{'id':g.id,'name':g.name,'email':g.email,'phone':g.phone,'address':g.address} for g in guests])

# API endpoints for reservations
@core_bp.route('/api/reservations')
@login_required
def api_reservations():
    reservations = Reservation.query.all()
    return jsonify([{
        'id':r.id,
        'guest_name':r.guest.name if r.guest else 'N/A',
        'room_number':r.room.number if r.room else 'N/A',
        'check_in':r.check_in.isoformat() if r.check_in else None,
        'check_out':r.check_out.isoformat() if r.check_out else None,
        'status':r.status,
        'total_price':float(r.total_price)
    } for r in reservations])

# API endpoints for services
@core_bp.route('/api/services')
@login_required
def api_services():
    services = Service.query.all()
    return jsonify([{'id':s.id,'name':s.name,'type':s.type,'price':float(s.price),'status':s.status,'description':s.description} for s in services])

# POST endpoints for creating new records
@core_bp.route('/api/room-types', methods=['POST'])
@login_required
def create_room_type():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('base_price'):
        return jsonify({'error': 'Name and base_price are required'}), 400
    
    room_type = RoomType(
        name=data['name'],
        description=data.get('description', ''),
        base_price=float(data['base_price'])
    )
    db.session.add(room_type)
    db.session.commit()
    return jsonify({'success': True, 'id': room_type.id})

@core_bp.route('/api/rooms', methods=['POST'])
@login_required
def create_room():
    data = request.get_json()
    if not data or not data.get('number') or not data.get('room_type_id'):
        return jsonify({'error': 'Number and room_type_id are required'}), 400
    
    room = Room(
        number=data['number'],
        room_type_id=int(data['room_type_id']),
        status=data.get('status', 'available')
    )
    db.session.add(room)
    db.session.commit()
    return jsonify({'success': True, 'id': room.id})

@core_bp.route('/api/guests', methods=['POST'])
@login_required
def create_guest():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Name and email are required'}), 400
    
    guest = Guest(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone', ''),
        address=data.get('address', '')
    )
    db.session.add(guest)
    db.session.commit()
    return jsonify({'success': True, 'id': guest.id})

@core_bp.route('/api/reservations', methods=['POST'])
@login_required
def create_reservation():
    data = request.get_json()
    required_fields = ['guest_id', 'room_type_id', 'check_in', 'check_out', 'num_guests']
    if not data or not all(data.get(field) for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Calculate total price based on room type and duration
    room_type = RoomType.query.get(data['room_type_id'])
    if not room_type:
        return jsonify({'error': 'Invalid room type'}), 400
    
    from datetime import datetime
    check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
    check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
    nights = (check_out - check_in).days
    total_price = float(room_type.base_price) * nights
    
    reservation = Reservation(
        guest_id=int(data['guest_id']),
        room_type_id=int(data['room_type_id']),
        check_in=check_in,
        check_out=check_out,
        num_guests=int(data['num_guests']),
        total_price=total_price,
        status=data.get('status', 'confirmed')
    )
    db.session.add(reservation)
    db.session.commit()
    return jsonify({'success': True, 'id': reservation.id})

@core_bp.route('/api/services', methods=['POST'])
@login_required
def create_service():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('price'):
        return jsonify({'error': 'Name and price are required'}), 400
    
    service = Service(
        name=data['name'],
        type=data.get('type', 'other'),
        price=float(data['price']),
        status=data.get('status', 'active'),
        description=data.get('description', '')
    )
    db.session.add(service)
    db.session.commit()
    return jsonify({'success': True, 'id': service.id})

# PUT endpoints for updating records
@core_bp.route('/api/guests/<int:guest_id>', methods=['PUT'])
@login_required
def update_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id)
    data = request.get_json()
    
    if data.get('name'):
        guest.name = data['name']
    if data.get('email'):
        guest.email = data['email']
    if data.get('phone'):
        guest.phone = data['phone']
    if data.get('address'):
        guest.address = data['address']
    
    db.session.commit()
    return jsonify({'success': True})

@core_bp.route('/api/reservations/<int:reservation_id>', methods=['PUT'])
@login_required
def update_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    data = request.get_json()
    
    if data.get('guest_id'):
        reservation.guest_id = int(data['guest_id'])
    if data.get('room_type_id'):
        reservation.room_type_id = int(data['room_type_id'])
    if data.get('check_in'):
        from datetime import datetime
        reservation.check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
    if data.get('check_out'):
        from datetime import datetime
        reservation.check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
    if data.get('num_guests'):
        reservation.num_guests = int(data['num_guests'])
    if data.get('status'):
        reservation.status = data['status']
    
    # Recalculate total price if dates or room type changed
    if data.get('room_type_id') or data.get('check_in') or data.get('check_out'):
        room_type = RoomType.query.get(reservation.room_type_id)
        if room_type:
            nights = (reservation.check_out - reservation.check_in).days
            reservation.total_price = float(room_type.base_price) * nights
    
    db.session.commit()
    return jsonify({'success': True})

@core_bp.route('/api/rooms/<int:room_id>', methods=['PUT'])
@login_required
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.get_json()
    
    if data.get('number'):
        room.number = data['number']
    if data.get('room_type_id'):
        room.room_type_id = int(data['room_type_id'])
    if data.get('status'):
        room.status = data['status']
    
    db.session.commit()
    return jsonify({'success': True})

# DELETE endpoints
@core_bp.route('/api/rooms/<int:room_id>', methods=['DELETE'])
@login_required
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    
    # Check if room has active reservations
    active_reservations = Reservation.query.filter_by(room_id=room_id).filter(
        Reservation.status.in_(['confirmed', 'checked-in'])
    ).count()
    
    if active_reservations > 0:
        return jsonify({'error': 'Cannot delete room with active reservations'}), 400
    
    db.session.delete(room)
    db.session.commit()
    return jsonify({'success': True})

@core_bp.route('/api/guests/<int:guest_id>', methods=['DELETE'])
@login_required
def delete_guest(guest_id):
    guest = Guest.query.get_or_404(guest_id)
    
    # Check if guest has active reservations
    active_reservations = Reservation.query.filter_by(guest_id=guest_id).filter(
        Reservation.status.in_(['confirmed', 'checked-in'])
    ).count()
    
    if active_reservations > 0:
        return jsonify({'error': 'Cannot delete guest with active reservations'}), 400
    
    db.session.delete(guest)
    db.session.commit()
    return jsonify({'success': True})

@core_bp.route('/api/reservations/<int:reservation_id>', methods=['DELETE'])
@login_required
def delete_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    
    # Check if reservation has invoices
    invoices = Invoice.query.filter_by(reservation_id=reservation_id).count()
    if invoices > 0:
        return jsonify({'error': 'Cannot delete reservation with existing invoices'}), 400
    
    db.session.delete(reservation)
    db.session.commit()
    return jsonify({'success': True})

@core_bp.route('/api/invoices/<int:invoice_id>')
@login_required
def view_invoice(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    return jsonify({
        'id': invoice.id,
        'reservation_id': invoice.reservation_id,
        'guest_name': invoice.reservation.guest.name,
        'room_number': invoice.reservation.room.number if invoice.reservation.room else 'TBD',
        'room_type': invoice.reservation.room_type.name,
        'check_in': invoice.reservation.check_in.strftime('%Y-%m-%d'),
        'check_out': invoice.reservation.check_out.strftime('%Y-%m-%d'),
        'subtotal': float(invoice.subtotal),
        'tax': float(invoice.tax),
        'total': float(invoice.total),
        'status': invoice.status,
        'created_at': invoice.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'services': [{'name': s.name, 'price': float(s.price)} for s in invoice.reservation.services] if hasattr(invoice.reservation, 'services') else []
    })

@core_bp.route('/api/invoices/<int:invoice_id>/payment', methods=['POST'])
@login_required
def process_payment(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    data = request.get_json()
    
    if not data or not data.get('method') or not data.get('amount'):
        return jsonify({'error': 'Payment method and amount are required'}), 400
    
    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'error': 'Payment amount must be positive'}), 400
    
    if amount > float(invoice.total):
        return jsonify({'error': 'Payment amount cannot exceed invoice total'}), 400
    
    # Create payment record
    payment = Payment(
        invoice_id=invoice_id,
        amount=amount,
        method=data['method'],
        reference=data.get('reference', '')
    )
    db.session.add(payment)
    
    # Update invoice payment status
    total_payments = db.session.query(db.func.sum(Payment.amount)).filter_by(
        invoice_id=invoice_id
    ).scalar() or 0
    total_payments = float(total_payments) + amount
    
    if total_payments >= float(invoice.total):
        invoice.status = 'paid'
    elif total_payments > 0:
        invoice.status = 'partial'
    
    db.session.commit()
    return jsonify({'success': True, 'payment_id': payment.id, 'new_status': invoice.status})

@core_bp.route('/api/payments/<int:invoice_id>')
@login_required
def get_payments(invoice_id):
    payments = Payment.query.filter_by(invoice_id=invoice_id).all()
    return jsonify([{
        'id': p.id,
        'amount': float(p.amount),
        'method': p.method,
        'reference': p.reference,
        'paid_at': p.paid_at.strftime('%Y-%m-%d %H:%M:%S')
    } for p in payments])

# Dashboard real-time stats API
@core_bp.route('/api/dashboard/stats')
@login_required
def dashboard_stats():
    from datetime import date
    total_rooms = Room.query.count()
    occupied = Reservation.query.filter(
        Reservation.status.in_(['confirmed','checked-in']), 
        Reservation.check_in <= date.today(), 
        Reservation.check_out > date.today()
    ).count()
    maintenance = Room.query.filter_by(status='maintenance').count()
    available = total_rooms - occupied - maintenance
    
    # Calculate revenue breakdown by room type
    revenue_data = db.session.query(
        RoomType.name,
        db.func.sum(Reservation.total_price).label('revenue')
    ).join(Reservation).group_by(RoomType.name).all()
    
    revenue_breakdown = [{'room_type': r.name, 'revenue': float(r.revenue or 0)} for r in revenue_data]
    
    return jsonify({
        'total_rooms': total_rooms,
        'occupied_rooms': occupied,
        'available_rooms': available,
        'maintenance_rooms': maintenance,
        'revenue_breakdown': revenue_breakdown
    })

# Recent activity API
@core_bp.route('/api/dashboard/activity')
@login_required
def recent_activity():
    from datetime import datetime, timedelta
    
    # Get recent reservations, payments, and room status changes
    recent_reservations = Reservation.query.filter(
        Reservation.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(Reservation.created_at.desc()).limit(5).all()
    
    recent_payments = Payment.query.filter(
        Payment.paid_at >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(Payment.paid_at.desc()).limit(5).all()
    
    activities = []
    
    for res in recent_reservations:
        activities.append({
            'type': 'reservation',
            'icon': '🏨',
            'text': f'New reservation for {res.guest.name}',
            'time': res.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    for payment in recent_payments:
        activities.append({
            'type': 'payment',
            'icon': '💳',
            'text': f'Payment received - ${float(payment.amount):.2f}',
            'time': payment.paid_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Sort by time and return latest 10
    activities.sort(key=lambda x: x['time'], reverse=True)
    return jsonify(activities[:10])

# Social media simulation API (for demo purposes)
@core_bp.route('/api/dashboard/social')
@login_required
def social_mentions():
    import random
    
    # Simulated social media mentions for demonstration
    sample_mentions = [
        {
            'platform': 'twitter',
            'icon': '🐦',
            'content': 'Amazing stay at the hotel! Perfect location and great staff.',
            'sentiment': 'positive',
            'time': 'Just now'
        },
        {
            'platform': 'facebook', 
            'icon': '📘',
            'content': 'Beautiful rooms and excellent service. Will definitely return!',
            'sentiment': 'positive',
            'time': '15 min ago'
        },
        {
            'platform': 'instagram',
            'icon': '📷',
            'content': 'Perfect weekend getaway! #hotel #vacation #relax',
            'sentiment': 'positive',
            'time': '1 hour ago'
        },
        {
            'platform': 'google',
            'icon': '🔍',
            'content': 'Good value for money, but room service could be faster.',
            'sentiment': 'neutral',
            'time': '3 hours ago'
        }
    ]
    
    # Add some randomization to simulate real-time updates
    mentions = random.sample(sample_mentions, random.randint(2, 4))
    
    stats = {
        'total_mentions': random.randint(35, 55),
        'positive_sentiment': random.randint(75, 95),
        'response_rate': random.randint(85, 98),
        'avg_rating': round(random.uniform(4.2, 4.8), 1)
    }
    
    return jsonify({
        'mentions': mentions,
        'stats': stats
    })
