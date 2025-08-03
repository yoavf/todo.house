from datetime import datetime, timedelta, time
from typing import Dict, Optional, Any
from enum import Enum
from babel import Locale
from babel.dates import format_date


class SnoozeOption(str, Enum):
    CONTEXT_SENSITIVE = "context_sensitive"  # Weekend/tomorrow based on current day
    NEXT_WEEK = "next_week"  # Next week's first workday
    FEW_WEEKS = "few_weeks"  # ~3 weeks from now
    LATER = "later"  # Indefinite future


class SnoozeService:
    """Service for calculating intelligent snooze options based on context and locale."""
    
    DEFAULT_TASK_TIME = time(9, 0)  # 9 AM for snoozed tasks
    
    @classmethod
    def is_weekend(cls, weekday: int, locale: Locale) -> bool:
        """Check if a weekday is a weekend day for the given locale."""
        return locale.weekend_start <= weekday <= locale.weekend_end
    
    @classmethod
    def is_workday(cls, weekday: int, locale: Locale) -> bool:
        """Check if a weekday is a work day for the given locale."""
        return not cls.is_weekend(weekday, locale)
    
    @classmethod
    def get_first_workday(cls, locale: Locale) -> int:
        """Get the first workday of the week for the locale."""
        # Start from first_week_day and find the first non-weekend day
        for offset in range(7):
            day = (locale.first_week_day + offset) % 7
            if not cls.is_weekend(day, locale):
                return day
        # Fallback (should never happen with valid locale data)
        return 0  # Monday
    
    @classmethod
    def get_last_workday(cls, locale: Locale) -> int:
        """Get the last workday before the weekend for the locale."""
        # Work backwards from weekend_start to find last workday
        return (locale.weekend_start - 1) % 7
    
    @classmethod
    def calculate_snooze_options(
        cls, 
        current_datetime: Optional[datetime] = None,
        locale_str: str = "en_US"
    ) -> Dict[SnoozeOption, Dict[str, Any]]:
        """
        Calculate all snooze options based on the current date/time context and locale.
        
        Returns a dictionary with snooze options as keys and dictionaries containing:
        - date: The target datetime for the snooze
        - label: Human-readable label for the option
        - description: Additional context about when the task will resurface
        """
        now = current_datetime or datetime.now()
        current_weekday = now.weekday()  # 0 = Monday, 6 = Sunday
        
        # Get locale from Babel
        babel_locale = Locale.parse(locale_str)
        
        options = {}
        
        # Option 1: Context-sensitive (weekend/tomorrow)
        context_option = cls._calculate_context_sensitive_snooze(
            now, current_weekday, babel_locale
        )
        options[SnoozeOption.CONTEXT_SENSITIVE] = context_option
        
        # Option 2: Next week
        next_week_option = cls._calculate_next_week_snooze(
            now, current_weekday, babel_locale
        )
        options[SnoozeOption.NEXT_WEEK] = next_week_option
        
        # Option 3: Few weeks (~3 weeks)
        few_weeks_option = cls._calculate_few_weeks_snooze(
            now, babel_locale
        )
        options[SnoozeOption.FEW_WEEKS] = few_weeks_option
        
        # Option 4: Later (indefinite)
        later_option = cls._calculate_later_snooze(babel_locale)
        options[SnoozeOption.LATER] = later_option
        
        return options
    
    @classmethod
    def _calculate_context_sensitive_snooze(
        cls, 
        now: datetime, 
        current_weekday: int,
        locale: Locale
    ) -> Dict[str, Any]:
        """
        Calculate context-sensitive snooze based on current day and locale.
        
        Logic:
        - Midweek (not last workday): Snooze to weekend
        - Last workday: Snooze to tomorrow
        - Weekend: Snooze to next work week's first day
        """
        is_workday = cls.is_workday(current_weekday, locale)
        last_workday = cls.get_last_workday(locale)
        is_last_workday = current_weekday == last_workday
        
        if is_workday and not is_last_workday:
            # Midweek: snooze to weekend start
            days_until_weekend = (locale.weekend_start - current_weekday) % 7
            if days_until_weekend == 0:
                days_until_weekend = 7
            
            target_date = now + timedelta(days=days_until_weekend)
            target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
            
            # Get localized day name
            try:
                day_name = locale.days['format']['wide'][locale.weekend_start]
            except (KeyError, TypeError):
                day_name = "Weekend"
            
            return {
                "date": target_datetime,
                "label": "This weekend",
                "description": f"{day_name} at {cls.DEFAULT_TASK_TIME.strftime('%I:%M %p')}"
            }
        
        elif is_last_workday:
            # Last workday: snooze to tomorrow
            target_date = now + timedelta(days=1)
            target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
            
            return {
                "date": target_datetime,
                "label": "Tomorrow",
                "description": f"Tomorrow at {cls.DEFAULT_TASK_TIME.strftime('%I:%M %p')}"
            }
        
        else:
            # Weekend: snooze to first workday
            first_workday = cls.get_first_workday(locale)
            days_until_workday = (first_workday - current_weekday) % 7
            if days_until_workday == 0:
                days_until_workday = 7
            
            target_date = now + timedelta(days=days_until_workday)
            target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
            
            # Get localized day name
            try:
                day_name = locale.days['format']['wide'][first_workday]
            except (KeyError, TypeError):
                day_name = "Weekday"
            
            return {
                "date": target_datetime,
                "label": "Next week",
                "description": f"{day_name} at {cls.DEFAULT_TASK_TIME.strftime('%I:%M %p')}"
            }
    
    @classmethod
    def _calculate_next_week_snooze(
        cls, 
        now: datetime, 
        current_weekday: int,
        locale: Locale
    ) -> Dict[str, Any]:
        """
        Calculate snooze to next week based on current day and locale.
        
        Logic:
        - Weekday: Snooze to next week's first workday
        - Weekend: Snooze to next weekend
        """
        is_workday = cls.is_workday(current_weekday, locale)
        
        if is_workday:
            # Weekday: snooze to next week's first workday
            first_workday = cls.get_first_workday(locale)
            # Calculate days until the first workday of next week
            days_until_workday = (first_workday - current_weekday) % 7
            # If we're already past or at the first workday, add 7 days
            if days_until_workday <= 0:
                days_until_workday += 7
            
            target_date = now + timedelta(days=days_until_workday)
            target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
            
            # Get localized day name
            try:
                day_name = locale.days['format']['wide'][first_workday]
            except (KeyError, TypeError):
                day_name = "Weekday"
            
            return {
                "date": target_datetime,
                "label": "Next week",
                "description": f"Next {day_name} at {cls.DEFAULT_TASK_TIME.strftime('%I:%M %p')}"
            }
        else:
            # Weekend: snooze to next weekend
            days_until_next_weekend = ((locale.weekend_start - current_weekday) % 7) + 7
            
            target_date = now + timedelta(days=days_until_next_weekend)
            target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
            
            # Get localized day name
            try:
                day_name = locale.days['format']['wide'][locale.weekend_start]
            except (KeyError, TypeError):
                day_name = "Weekend"
            
            return {
                "date": target_datetime,
                "label": "Next weekend",
                "description": f"Next {day_name} at {cls.DEFAULT_TASK_TIME.strftime('%I:%M %p')}"
            }
    
    @classmethod
    def _calculate_few_weeks_snooze(
        cls, 
        now: datetime,
        locale: Locale
    ) -> Dict[str, Any]:
        """Calculate snooze for approximately 3 weeks from now."""
        # Go to the first workday approximately 3 weeks from now
        first_workday = cls.get_first_workday(locale)
        
        # Add 3 weeks
        target_date = now + timedelta(weeks=3)
        
        # Adjust to the next occurrence of first_workday
        target_weekday = target_date.weekday()
        days_until_workday = (first_workday - target_weekday) % 7
        if days_until_workday == 0 and cls.is_weekend(target_weekday, locale):
            # If 3 weeks lands on weekend, go to next first workday
            days_until_workday = 7
        
        target_date = target_date + timedelta(days=days_until_workday)
        target_datetime = datetime.combine(target_date.date(), cls.DEFAULT_TASK_TIME)
        
        # Format date using Babel
        formatted_date = format_date(
            target_date.date(), 
            format='long',
            locale=locale
        )
        
        return {
            "date": target_datetime,
            "label": "In a few weeks",
            "description": f"3 weeks from now ({formatted_date})"
        }
    
    @classmethod
    def _calculate_later_snooze(cls, babel_locale: Locale) -> Dict[str, Any]:
        """Calculate indefinite 'Later' snooze."""
        # Use a far future date (Python's datetime.max causes issues with some DBs)
        far_future = datetime(2099, 12, 31, 23, 59, 59)
        
        return {
            "date": far_future,
            "label": "Later",
            "description": "Indefinitely snoozed"
        }
    
    @classmethod
    def get_snooze_date_by_option(
        cls, 
        option: SnoozeOption,
        current_datetime: Optional[datetime] = None,
        locale_str: str = "en_US"
    ) -> datetime:
        """Get the snooze date for a specific option."""
        options = cls.calculate_snooze_options(current_datetime, locale_str)
        if option not in options:
            raise ValueError(f"Invalid snooze option: {option}")
        return options[option]["date"]