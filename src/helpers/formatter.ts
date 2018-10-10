class DateTimeFormatter {
    private _lastTimezone: number;
    private _formatter: Intl.DateTimeFormatter;

    constructor() {
        // Every hour check for time zone change.
        this._initFormatter();
        setInterval(() => {
            if (this._lastTimezone !== new Date().getTimezoneOffset()) {
                // Change formatter to ensure it picks up the new time zone.
                this._initFormatter();
            }
        }, 60 * 60 * 1000);
    }

    private _initFormatter() {
        this._lastTimezone = new Date().getTimezoneOffset();
        this._formatter = new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    format(date: number | Date) {
        return this._formatter.format(date);
    }
}

export const time = new DateTimeFormatter();
