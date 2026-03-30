# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - Created by Basil Saji Mathew (BSM)
### Added
- **Multi-Database System**: Support for passing an array of databases to backup simultaneously.
- **Advanced Discord Embeds**: Added dynamic colors, execution time tracking, and customizable ping roles on failure.
- **Smart Retention Policy**: Added logic to automatically purge local backup files older than a configured limit.
- **Customizable Overrides**: New configurations for `mysqldump` arguments handling.
- **Enhanced Logging**: BSM watermarked and prefixed console output formatting.
- **Security Update**: Wrapped Discord token handling and generalized error handlers.
- **Ace Permissions**: Integrated `command.runbackup` Ace permissions for the manual trigger command.

## [1.0.0] - Initial Release
### Added
- Basic `mysqldump` database backing up.
- Basic GZip compression.
- Basic Discord webhook support.
