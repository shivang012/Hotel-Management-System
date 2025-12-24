from datetime import datetime
from .. import db

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservation.id'), nullable=False)
    subtotal = db.Column(db.Numeric(10,2), nullable=False)
    tax = db.Column(db.Numeric(10,2), default=0)
    total = db.Column(db.Numeric(10,2), nullable=False)
    status = db.Column(db.String(20), default='unpaid')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reservation = db.relationship('Reservation', back_populates='invoices')
    payments = db.relationship('Payment', back_populates='invoice')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), nullable=False)
    amount = db.Column(db.Numeric(10,2), nullable=False)
    method = db.Column(db.String(50), nullable=False)
    reference = db.Column(db.String(100))
    paid_at = db.Column(db.DateTime, default=datetime.utcnow)
    invoice = db.relationship('Invoice', back_populates='payments')
