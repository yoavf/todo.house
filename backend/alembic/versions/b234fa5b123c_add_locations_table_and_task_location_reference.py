"""Add locations table and task location reference

Revision ID: b234fa5b123c
Revises: a773fa5a991f
Create Date: 2025-08-02 17:40:00.000000

"""

from alembic import op
import sqlalchemy as sa

# Import JSONType from shared models to avoid duplication
from app.database.models import JSONType


# revision identifiers, used by Alembic.
revision = "b234fa5b123c"
down_revision = "a773fa5a991f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get the bind to check the database dialect
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # Create locations table
    op.create_table(
        "locations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("location_metadata", JSONType(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP" if dialect_name == "sqlite" else "now()"
            ),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP" if dialect_name == "sqlite" else "now()"
            ),
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

    # Handle adding column and foreign key differently for SQLite
    if dialect_name == "sqlite":
        # For SQLite, we need to use batch mode to add foreign key
        with op.batch_alter_table("tasks") as batch_op:
            batch_op.add_column(sa.Column("location_id", sa.UUID(), nullable=True))
            # Note: SQLite doesn't enforce foreign keys by default, but we add them for consistency
            batch_op.create_foreign_key(
                "fk_tasks_location_id",
                "locations",
                ["location_id"],
                ["id"],
            )
    else:
        # For PostgreSQL and other databases
        op.add_column("tasks", sa.Column("location_id", sa.UUID(), nullable=True))
        op.create_foreign_key(
            "fk_tasks_location_id",
            "tasks",
            "locations",
            ["location_id"],
            ["id"],
        )


def downgrade() -> None:
    # Get the bind to check the database dialect
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # Handle dropping column and foreign key differently for SQLite
    if dialect_name == "sqlite":
        # For SQLite, use batch mode
        with op.batch_alter_table("tasks") as batch_op:
            batch_op.drop_constraint("fk_tasks_location_id", type_="foreignkey")
            batch_op.drop_column("location_id")
    else:
        # For PostgreSQL and other databases
        op.drop_constraint("fk_tasks_location_id", "tasks", type_="foreignkey")
        op.drop_column("tasks", "location_id")

    # Drop index
    op.drop_index("idx_locations_user_active", table_name="locations")

    # Drop locations table
    op.drop_table("locations")
