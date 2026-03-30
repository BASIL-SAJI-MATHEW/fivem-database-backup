<div align="center">

# 🛡️ BSM FiveM AutoBackup V2 🚀
**The Ultimate, Most Advanced, & SEO-Optimized Database Backup Solution for FiveM Servers**

[![Author](https://img.shields.io/badge/Author-Basil%20Saji%20Mathew%20(BSM)-blue?style=for-the-badge&logo=github)](https://github.com/)
[![Version](https://img.shields.io/badge/Version-2.0.0-success?style=for-the-badge)](https://github.com/)
[![FiveM Ready](https://img.shields.io/badge/FiveM-Ready-orange?style=for-the-badge&logo=fivem)](https://fivem.net/)
[![Discord Integration](https://img.shields.io/badge/Discord-Integrated-7289DA?style=for-the-badge&logo=discord)](https://discord.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE.md)

</div>

<br>

## 🌟 Overview

Welcome to the **BSM FiveM AutoBackup V2**, developed and optimized by **Basil Saji Mathew (BSM)**. Managing a FiveM server requires ensuring that your crucial database information is protected against corruption, accidental deletion, or server crashes. This advanced automated database backup script provides peace of mind by securely backing up multi-database configurations, applying high-level compression, and sending detailed reports directly to your Discord server via Webhooks!

Built specifically to be SEO-optimized and feature-rich, this script runs seamlessly on both Windows and Linux, drastically improving your server's disaster recovery strategies.

---

## 🔥 Advanced Features

*   **Multi-Database Support:** Backup multiple databases (e.g., `essentialmode`, `qbcore`) simultaneously.
*   **Discord Webhook Integration:** Get real-time notifications with beautifully formatted embeds for both successful and failed backups.
*   **Targeted Role Mentions:** Optionally ping `@everyone`, `@here`, or specific Admin roles if a backup fails.
*   **Smart Compression (GZip):** Maximizes local and cloud storage by applying level-9 gzip compression to your SQL dumps.
*   **Automated Retention Policy:** Keep your disk clean! Automatically deletes backups older than X days based on your configuration.
*   **Customizable Logging & Aesthetics:** Clean and structured console logs with custom prefixes (`[BSM AutoBackup]`).
*   **Dynamic Command Trigger:** Trigger backups manually via the in-game/server console using `/runbackup` (secured with Ace permissions).
*   **Watermarked Security:** Custom built by **Basil Saji Mathew (BSM)** ensuring top-tier script optimization and reliability.

---

## ⚙️ Installation Guide

1. **Download & Extract** the `fivem-auto-backup` folder into your FiveM server's `resources` directory.
2. **Install Dependencies:**
   Navigate to the resource directory using your terminal/command prompt and run:
   ```bash
   npm install
   ```
3. **Configure the Script:**
   Open `config.json` and adjust the settings according to your server credentials (see **Configuration** below).
4. **Ensure `mysqldump` is Accessible:**
   *   *Windows:* Add MySQL/MariaDB `bin` folder to your System Environment Path, or provide the absolute path to `mysqldump.exe` in `config.json`.
   *   *Linux:* Usually available by default after installing `mysql-client`.
5. **Start the Resource:**
   Add the following line to your `server.cfg`:
   ```cfg
   ensure fivem-auto-backup
   ```

---

## 🛠️ Configuration (`config.json`)

The config file is designed to be highly intuitive. Here is the default setup created by BSM:

```json
{
    "database": {
        "host": "127.0.0.1",
        "port": 3306,
        "user": "root",
        "password": "your_secure_password",
        "databases": ["essentialmode", "qbcore"]
    },
    "discord": {
        "webhook_url": "YOUR_DISCORD_WEBHOOK_URL_HERE",
        "bot_name": "BSM AutoBackup",
        "ping_role_on_error": false
    },
    ...
}
```
*(Refer to the `config.json` inside the repository for the full payload).*

---

## 💬 Discord Webhook Preview

When a backup executes, the system notifies your configured Discord channel. BSM's custom embeds display:
*   ✅ **Success Logs:** Database Name, File Size, Compression Mode, and Execution Time.
*   ❌ **Error Logs:** Failed Database Name, Detailed Error Output, and targeted Pings for immediate action.

---

## 👨‍💻 About The Author

This project is proudly **Created, Maintained, and Optimized by Basil Saji Mathew (BSM)**. 
Aiming to provide the best-in-class solutions for the FiveM developer community with clean code, advanced logic, and user-centric design.

---

## 📜 License & Copyright

Distributed under the MIT License. See `LICENSE.md` for more information.

> *Watermark: This script core and architecture is proprietary logic designed by Basil Saji Mathew (BSM).*

---
<div align="center">
  <b>⭐ If you like this script, don't forget to star the repository! ⭐</b>
</div>
