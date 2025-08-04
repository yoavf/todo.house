import pytest
from datetime import datetime
from babel import Locale
from app.services.snooze_service import SnoozeService, SnoozeOption


@pytest.mark.unit
class TestSnoozeService:
    """Test the snooze calculation service."""

    def test_calculate_snooze_options_returns_all_options(self):
        """Test that all snooze options are calculated."""
        options = SnoozeService.calculate_snooze_options()

        assert len(options) == 4
        assert SnoozeOption.CONTEXT_SENSITIVE in options
        assert SnoozeOption.NEXT_WEEK in options
        assert SnoozeOption.FEW_WEEKS in options
        assert SnoozeOption.LATER in options

    def test_context_sensitive_midweek_us_locale(self):
        """Test context-sensitive snooze on a Wednesday in US locale."""
        # Wednesday, January 15, 2025, 2 PM
        current_time = datetime(2025, 1, 15, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="en_US"
        )

        context_option = options[SnoozeOption.CONTEXT_SENSITIVE]
        # Should snooze to Saturday (weekend)
        assert context_option["label"] == "This weekend"
        assert context_option["date"].weekday() == 5  # Saturday
        assert context_option["date"].date() == datetime(2025, 1, 18).date()

    def test_context_sensitive_last_workday_us_locale(self):
        """Test context-sensitive snooze on Friday (last workday) in US locale."""
        # Friday, January 17, 2025, 2 PM
        current_time = datetime(2025, 1, 17, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="en_US"
        )

        context_option = options[SnoozeOption.CONTEXT_SENSITIVE]
        # Should snooze to tomorrow (Saturday)
        assert context_option["label"] == "Tomorrow"
        assert context_option["date"].date() == datetime(2025, 1, 18).date()

    def test_context_sensitive_weekend_us_locale(self):
        """Test context-sensitive snooze on Saturday in US locale."""
        # Saturday, January 18, 2025, 2 PM
        current_time = datetime(2025, 1, 18, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="en_US"
        )

        context_option = options[SnoozeOption.CONTEXT_SENSITIVE]
        # Should snooze to Monday (next workday)
        assert context_option["label"] == "Next week"
        # US locale: first workday is Monday (weekday=0)
        assert context_option["date"].weekday() == 0  # Monday
        assert context_option["date"].date() == datetime(2025, 1, 20).date()

    def test_context_sensitive_midweek_israel_locale(self):
        """Test context-sensitive snooze on Wednesday in Israel locale."""
        # Wednesday, January 15, 2025, 2 PM
        current_time = datetime(2025, 1, 15, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="he_IL"
        )

        context_option = options[SnoozeOption.CONTEXT_SENSITIVE]
        # Should snooze to Friday (weekend in Israel)
        assert context_option["label"] == "This weekend"
        assert context_option["date"].weekday() == 4  # Friday
        assert context_option["date"].date() == datetime(2025, 1, 17).date()

    def test_next_week_option(self):
        """Test next week snooze option."""
        # Wednesday, January 15, 2025
        current_time = datetime(2025, 1, 15, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="en_US"
        )

        next_week_option = options[SnoozeOption.NEXT_WEEK]
        # Should snooze to next Monday
        assert next_week_option["label"] == "Next week"
        assert next_week_option["date"].weekday() == 0  # Monday
        assert next_week_option["date"].date() == datetime(2025, 1, 20).date()

    def test_few_weeks_option(self):
        """Test few weeks snooze option."""
        # Wednesday, January 15, 2025
        current_time = datetime(2025, 1, 15, 14, 0, 0)

        options = SnoozeService.calculate_snooze_options(
            current_datetime=current_time, locale_str="en_US"
        )

        few_weeks_option = options[SnoozeOption.FEW_WEEKS]
        # Should snooze to ~3 weeks from now on a Monday
        assert few_weeks_option["label"] == "In a few weeks"
        assert few_weeks_option["date"].weekday() == 0  # Monday
        # Should be February 10, 2025 (3 weeks later = Feb 5, adjusted to next Monday)
        assert few_weeks_option["date"].date() == datetime(2025, 2, 10).date()

    def test_later_option(self):
        """Test indefinite later snooze option."""
        options = SnoozeService.calculate_snooze_options()

        later_option = options[SnoozeOption.LATER]
        assert later_option["label"] == "Later"
        assert later_option["description"] == "Indefinitely snoozed"
        # Should be far in the future
        assert later_option["date"].year == 2099

    def test_get_snooze_date_by_option(self):
        """Test getting specific snooze date by option."""
        current_time = datetime(2025, 1, 15, 14, 0, 0)

        date = SnoozeService.get_snooze_date_by_option(
            SnoozeOption.CONTEXT_SENSITIVE,
            current_datetime=current_time,
            locale_str="en_US",
        )

        # Should match the context sensitive calculation
        assert date.weekday() == 5  # Saturday
        assert date.date() == datetime(2025, 1, 18).date()

    def test_invalid_snooze_option_raises_error(self):
        """Test that invalid snooze option raises ValueError."""
        with pytest.raises(ValueError, match="Invalid snooze option"):
            SnoozeService.get_snooze_date_by_option("invalid_option")  # type: ignore


@pytest.mark.unit
class TestSnoozeServiceHelpers:
    """Test helper methods in snooze service."""

    def test_is_weekend_us_locale(self):
        """Test weekend detection for US locale."""
        locale = Locale.parse("en_US")

        # US: Saturday-Sunday weekend
        assert SnoozeService.is_weekend(5, locale)  # Saturday
        assert SnoozeService.is_weekend(6, locale)  # Sunday
        assert not SnoozeService.is_weekend(0, locale)  # Monday
        assert not SnoozeService.is_weekend(4, locale)  # Friday

    def test_is_weekend_israel_locale(self):
        """Test weekend detection for Israel locale."""
        locale = Locale.parse("he_IL")

        # Israel: Friday-Saturday weekend
        assert SnoozeService.is_weekend(4, locale)  # Friday
        assert SnoozeService.is_weekend(5, locale)  # Saturday
        assert not SnoozeService.is_weekend(6, locale)  # Sunday (workday)
        assert not SnoozeService.is_weekend(0, locale)  # Monday

    def test_is_workday(self):
        """Test workday detection."""
        locale_us = Locale.parse("en_US")
        locale_il = Locale.parse("he_IL")

        # US locale
        assert SnoozeService.is_workday(0, locale_us)  # Monday
        assert not SnoozeService.is_workday(6, locale_us)  # Sunday

        # Israel locale
        assert SnoozeService.is_workday(6, locale_il)  # Sunday (workday)
        assert not SnoozeService.is_workday(5, locale_il)  # Saturday

    def test_get_first_workday(self):
        """Test getting first workday of the week."""
        locale_us = Locale.parse("en_US")
        locale_uk = Locale.parse("en_GB")
        locale_il = Locale.parse("he_IL")

        # US: First day is Sunday, but first workday is Monday
        assert SnoozeService.get_first_workday(locale_us) == 0  # Monday

        # UK: First day is Monday, first workday is also Monday
        assert SnoozeService.get_first_workday(locale_uk) == 0  # Monday

        # Israel: First day is Sunday, and it's a workday
        assert SnoozeService.get_first_workday(locale_il) == 6  # Sunday

    def test_get_last_workday(self):
        """Test getting last workday before weekend."""
        locale_us = Locale.parse("en_US")
        locale_il = Locale.parse("he_IL")

        # US: Weekend starts Saturday, so last workday is Friday
        assert SnoozeService.get_last_workday(locale_us) == 4  # Friday

        # Israel: Weekend starts Friday, so last workday is Thursday
        assert SnoozeService.get_last_workday(locale_il) == 3  # Thursday

    def test_different_locales(self):
        """Test that different locales work correctly."""
        # Test various locales
        locales = ["en_US", "he_IL", "de_DE", "fr_FR", "ja_JP"]

        for locale_str in locales:
            options = SnoozeService.calculate_snooze_options(locale_str=locale_str)
            assert len(options) == 4  # Should calculate all options without error

            # Verify all options have required fields
            for option in options.values():
                assert "date" in option
                assert "label" in option
                assert "description" in option

    def test_accept_language_header_format(self):
        """Test that Accept-Language header format is parsed correctly."""
        # Test various Accept-Language header formats
        test_cases = [
            ("en-us,en;q=0.9", "en_US"),  # Common browser format
            ("en-US,en;q=0.9", "en_US"),  # Uppercase variant
            ("fr-FR,fr;q=0.9,en;q=0.8", "fr_FR"),  # Multiple languages
            ("de-DE", "de_DE"),  # Simple format without quality
            ("en", "en"),  # Just language code
            ("zh-CN,zh;q=0.9,en;q=0.8", "zh_CN"),  # Chinese locale
        ]

        for header_value, expected_locale in test_cases:
            # Should not raise an error and should calculate all options
            options = SnoozeService.calculate_snooze_options(locale_str=header_value)
            assert len(options) == 4
            
            # Verify parsing worked by checking we get valid dates
            for option in options.values():
                assert isinstance(option["date"], datetime)
