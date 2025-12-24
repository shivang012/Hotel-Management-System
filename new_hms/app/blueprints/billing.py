from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required
from .. import db
from ..models.billing import Invoice, Payment
from ..models.core import Reservation
from ..models.setting import Setting
from decimal import Decimal

billing_bp = Blueprint('billing', __name__)

# Page routes
@billing_bp.route('/billing')
@login_required
def billing_page():
    return render_template('billing.html')

# API routes
@billing_bp.route('/api/billing/invoices', methods=['GET'])
@login_required
def list_invoices():
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify([{'id':i.id,'reservation_id':i.reservation_id,'subtotal':str(i.subtotal),'tax':str(i.tax),'total':str(i.total),'status':i.status} for i in invoices])

@billing_bp.route('/api/billing/invoices', methods=['POST'])
@login_required
def create_invoice():
    data = request.get_json() or {}
    rid = data.get('reservation_id')
    reservation = Reservation.query.get(rid)
    if not reservation:
        return jsonify({'error':'Reservation not found'}),404
    tax_setting = Setting.query.get('tax_rate')
    tax_rate = Decimal(tax_setting.value) if tax_setting else Decimal('0')
    subtotal = Decimal(str(reservation.total_price))
    tax = (subtotal * tax_rate).quantize(Decimal('0.01'))
    total = subtotal + tax
    inv = Invoice(reservation_id=rid, subtotal=subtotal, tax=tax, total=total)
    db.session.add(inv)
    db.session.commit()
    return jsonify({'success': True,'invoice_id': inv.id})

@billing_bp.route('/invoices/<int:invoice_id>/payments', methods=['POST'])
@login_required
def add_payment(invoice_id):
    inv = Invoice.query.get(invoice_id)
    if not inv:
        return jsonify({'error':'Invoice not found'}),404
    data = request.get_json() or {}
    amount = Decimal(str(data.get('amount','0')))
    if amount <= 0:
        return jsonify({'error':'Invalid amount'}),400
    pay = Payment(invoice_id=inv.id, amount=amount, method=data.get('method','cash'), reference=data.get('reference'))
    db.session.add(pay)
    paid_sum = sum(p.amount for p in inv.payments) + amount
    if paid_sum >= inv.total:
        inv.status = 'paid'
    db.session.commit()
    return jsonify({'success': True})
