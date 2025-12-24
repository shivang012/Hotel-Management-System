import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY','dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL','sqlite:///hotel.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
