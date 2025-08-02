"""Unit tests for database engine security."""

import pytest
from unittest.mock import patch, MagicMock
import logging
from app.database.engine import create_engine


@pytest.mark.unit
def test_database_url_logging_masks_credentials(caplog):
    """Test that database credentials are properly masked in logs."""
    # Test URLs with credentials
    test_cases = [
        {
            "url": "postgresql+asyncpg://user:password@localhost:5432/mydb",
            "expected_log": "postgresql+asyncpg://***:***@localhost/mydb",
        },
        {
            "url": "postgresql+asyncpg://admin:secret123@db.example.com/production",
            "expected_log": "postgresql+asyncpg://***:***@db.example.com/production",
        },
        {
            "url": "sqlite+aiosqlite:///path/to/database.db",
            "expected_log": "sqlite+aiosqlite://***:***@localhost/path/to/database.db",
        },
    ]

    for test_case in test_cases:
        caplog.clear()

        # Mock the config and create_async_engine
        with patch("app.database.engine.config") as mock_config:
            with patch("app.database.engine.create_async_engine") as mock_create:
                # Set up the mock config
                mock_config.database.database_url = test_case["url"]
                mock_config.database.echo = False
                mock_config.database.pool_size = 5
                mock_config.database.max_overflow = 10
                mock_config.database.pool_pre_ping = True

                # Mock the engine
                mock_create.return_value = MagicMock()

                # Set log level to INFO
                with caplog.at_level(logging.INFO):
                    # Create engine - this should log the masked URL
                    create_engine()

                # Check that credentials are NOT in the log
                log_messages = [record.message for record in caplog.records]
                assert len(log_messages) > 0, "No log messages captured"

                # The log should contain the masked URL
                assert any(test_case["expected_log"] in msg for msg in log_messages), (
                    f"Expected masked URL not found in logs. Logs: {log_messages}"
                )

                # Make sure the actual password is NOT in any log
                if "password" in test_case["url"]:
                    assert not any("password" in msg for msg in log_messages), (
                        "Password found in logs!"
                    )
                if "secret123" in test_case["url"]:
                    assert not any("secret123" in msg for msg in log_messages), (
                        "Password found in logs!"
                    )


@pytest.mark.unit
def test_database_url_logging_handles_invalid_urls(caplog):
    """Test that invalid URLs are handled gracefully."""
    with patch("app.database.engine.config") as mock_config:
        with patch("app.database.engine.create_async_engine") as mock_create:
            # Set up an invalid URL that will cause make_url to fail
            mock_config.database.database_url = "not a valid url"
            mock_config.database.echo = False
            mock_config.database.pool_size = 5
            mock_config.database.max_overflow = 10
            mock_config.database.pool_pre_ping = True

            # Mock the engine
            mock_create.return_value = MagicMock()

            with caplog.at_level(logging.INFO):
                create_engine()

            # Should log generic message
            log_messages = [record.message for record in caplog.records]
            assert any(
                "Created database engine (credentials masked)" in msg
                for msg in log_messages
            ), f"Expected generic message not found. Logs: {log_messages}"
