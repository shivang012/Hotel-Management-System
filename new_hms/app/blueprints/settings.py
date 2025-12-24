from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required
from .. import db
from ..models.setting import Setting

settings_bp = Blueprint('settings', __name__)

# Page routes
@settings_bp.route('/settings')
@login_required
def settings_page():
    return render_template('settings.html')

# API routes
@settings_bp.route('/api/settings/', methods=['GET'])
@login_required
def list_settings():
    rows = Setting.query.all()
    return jsonify([{ 'key': r.key, 'value': r.value } for r in rows])

@settings_bp.route('/api/settings/<key>', methods=['PUT'])
@login_required
def update_setting(key):
    data = request.get_json() or {}
    if 'value' not in data:
        return jsonify({'error':'value required'}),400
    setting = Setting.query.get(key)
    if not setting:
        setting = Setting(key=key, value=str(data['value']))
        db.session.add(setting)
    else:
        setting.value = str(data['value'])
    db.session.commit()
    return jsonify({'success': True})
