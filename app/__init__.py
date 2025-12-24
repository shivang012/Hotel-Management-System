from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from .config import Config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

login_manager.login_view = 'auth.login'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    from .blueprints.auth import auth_bp
    from .blueprints.core import core_bp
    from .blueprints.billing import billing_bp
    from .blueprints.reports import reports_bp
    from .blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(core_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app
