from app import create_app, db
from app.models.user import User
import click

app = create_app()

@app.cli.command('create-db')
def create_db():
    db.create_all()
    click.echo('Database created')

@app.cli.command('create-admin')
@click.argument('username')
@click.argument('password')
def create_admin(username, password):
    if User.query.filter_by(username=username).first():
        click.echo('User already exists')
        return
    u = User(username=username, role='admin')
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    click.echo('Admin created')

if __name__ == '__main__':
    app.run(debug=True)
