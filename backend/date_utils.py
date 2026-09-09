from datetime import date, datetime
from zoneinfo import ZoneInfo


APP_TIMEZONE = ZoneInfo("America/Fortaleza")


def current_local_date() -> date:
    return datetime.now(APP_TIMEZONE).date()
