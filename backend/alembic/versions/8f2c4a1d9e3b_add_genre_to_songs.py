"""add genre to songs

Revision ID: 8f2c4a1d9e3b
Revises: 36906bfad440
Create Date: 2026-08-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f2c4a1d9e3b'
down_revision: Union[str, Sequence[str], None] = '36906bfad440'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('songs', sa.Column('genre', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('songs', 'genre')
