from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required
from datetime import datetime, timedelta, date
from sqlalchemy import func
from .. import db
from ..models.core import Reservation, Room

reports_bp = Blueprint('reports', __name__)

# Page routes
@reports_bp.route('/reports')
@login_required
def reports_page():
    return render_template('reports.html')

# API routes
@reports_bp.route('/api/reports/occupancy')
@login_required
def occupancy():
    start = request.args.get('start_date', (date.today()-timedelta(days=7)).isoformat())
    end = request.args.get('end_date', date.today().isoformat())
    s = datetime.strptime(start,'%Y-%m-%d').date()
    e = datetime.strptime(end,'%Y-%m-%d').date()
    total_rooms = Room.query.count()
    data = []
    cur = s
    while cur <= e:
        occupied = Reservation.query.filter(Reservation.status.in_(['confirmed','checked-in']), Reservation.check_in <= cur, Reservation.check_out > cur).count()
        rate = round((occupied/total_rooms*100),2) if total_rooms else 0
        data.append({'date': cur.isoformat(),'occupied': occupied,'available': total_rooms-occupied,'rate': rate})
        cur += timedelta(days=1)
    return jsonify({'start_date': start,'end_date': end,'daily': data,'total_rooms': total_rooms})

@reports_bp.route('/revenue')
@login_required
def revenue():
    start = request.args.get('start_date', (date.today()-timedelta(days=30)).isoformat())
    end = request.args.get('end_date', date.today().isoformat())
    s = datetime.strptime(start,'%Y-%m-%d').date()
    e = datetime.strptime(end,'%Y-%m-%d').date()
    cur = s
    daily = []
    while cur <= e:
        total = db.session.query(func.coalesce(func.sum(Reservation.total_price),0)).filter(Reservation.check_in==cur, Reservation.status!='cancelled').scalar()
        daily.append({'date': cur.isoformat(),'revenue': float(total)})
        cur += timedelta(days=1)
    total_rev = sum(d['revenue'] for d in daily)
    return jsonify({'start_date': start,'end_date': end,'total_revenue': total_rev,'daily': daily})
