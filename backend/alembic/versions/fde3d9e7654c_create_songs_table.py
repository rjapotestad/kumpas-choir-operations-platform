"""create songs table

Revision ID: fde3d9e7654c
Revises: 
Create Date: 2026-07-21 12:41:08.543088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fde3d9e7654c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Originally auto-generated as "drop the leftover members table" — that
    # only made sense on databases that had gone through the pre-pivot
    # Member draft. A genuinely fresh database (e.g. a new deploy target)
    # never has a `members` table, so this is now a safe no-op.
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
