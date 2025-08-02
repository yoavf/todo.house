"""Add locations table and task location reference

Revision ID: b234fa5b123c
Revises: a773fa5a991f
Create Date: 2025-08-02 17:40:00.000000

"""

from alembic import op
import sqlalchemy as sa
from app.database.models import JSONType

# revision identifiers, used by Alembic.
revision = "b234fa5b123c"
down_revision = "a773fa5a991f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create locations table
    op.create_table(
        "locations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location_type", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata", JSONType(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create index on user_id and is_active for efficient queries
    op.create_index("idx_locations_user_active", "locations", ["user_id", "is_active"])
    
    # Add location_id column to tasks table
    op.add_column(
        "tasks",
        sa.Column("location_id", sa.UUID(), nullable=True)
    )
    
    # Create foreign key constraint
    op.create_foreign_key(
        "fk_tasks_location_id",
        "tasks",
        "locations",
        ["location_id"],
        ["id"],
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint("fk_tasks_location_id", "tasks", type_="foreignkey")
    
    # Remove location_id column from tasks
    op.drop_column("tasks", "location_id")
    
    # Drop index
    op.drop_index("idx_locations_user_active", table_name="locations")
    
    # Drop locations table
    op.drop_table("locations")