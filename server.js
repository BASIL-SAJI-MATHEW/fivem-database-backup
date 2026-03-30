// server.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const zlib = require('zlib');
const axios = require('axios');
const FormData = require('form-data');

// ---------------------------------------------------------
// WATERMARK & CREDITS: Basil Saji Mathew (BSM)
// Description: Advanced Automated FiveM Backup System
// ---------------------------------------------------------
const BSM_WATERMARK = "Created & Optimized by Basil Saji Mathew (BSM)";

// Try loading configuration
let config;
try {
    const configPath = path.join(GetResourcePath(GetCurrentResourceName()), 'config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    if (typeof GetResourcePath === 'undefined') {
        // Fallback for standalone NodeJS usage
        config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    } else {
        console.error('^1[BSM AutoBackup] Error loading config.json! Please ensure it exists.^0');
        process.exit(1);
    }
}

// Prefix for console logs
const logPrefix = config.system && config.system.log_prefix ? config.system.log_prefix : "^6[BSM AutoBackup]^0";

const bsmLog = (msg) => console.log(`${logPrefix} ${msg}`);
const bsmWarn = (msg) => console.warn(`${logPrefix} ^3WARNING: ${msg}^0`);
const bsmError = (msg) => console.error(`${logPrefix} ^1ERROR: ${msg}^0`);

// Ensure the local backup folder exists
const resourceRoot = typeof GetResourcePath !== 'undefined' ? GetResourcePath(GetCurrentResourceName()) : __dirname;
const backupFolder = path.resolve(resourceRoot, config.backup.local_backup_folder || 'backups');

if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
}

function getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function sendToDiscord(dbName, filePath, fileName, success, extraInfo = "") {
    bsmLog(`Sending webhook for ${success ? 'Successful' : 'Failed'} backup of ${dbName}...`);
    
    // Check if Discord webhook is configured
    if (!config.discord.webhook_url || !config.discord.webhook_url.startsWith('https://discord.com/api/webhooks/')) {
        bsmWarn('Valid Discord Webhook URL not configured. Skipping upload.');
        return false;
    }

    const form = new FormData();
    form.append('username', config.discord.bot_name || 'BSM AutoBackup');
    if (config.discord.avatar_url) {
        form.append('avatar_url', config.discord.avatar_url);
    }
    
    let content = "";
    if (!success && config.discord.ping_role_on_error) {
        content = config.discord.ping_role_on_error === "@everyone" || config.discord.ping_role_on_error === "@here" 
            ? config.discord.ping_role_on_error 
            : `<@&${config.discord.ping_role_on_error}>`;
    }

    let embedColorSuccess = 5814783;
    let embedColorError = 16711680;
    
    if (config.discord.embed_color_success) {
        embedColorSuccess = parseInt(config.discord.embed_color_success.toString().replace("#", ""), 16) || 5814783;
    }
    if (config.discord.embed_color_error) {
        embedColorError = parseInt(config.discord.embed_color_error.toString().replace("#", ""), 16) || 16711680;
    }

    let payloadJson;

    if (success) {
        let fileSizeStr = "Unknown";
        if (filePath && fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            fileSizeStr = formatBytes(stats.size);
        }

        payloadJson = {
            content: content,
            embeds: [{
                title: "✅ Automated Database Backup Successful",
                description: `A database backup has been automatically successfully generated.\n\n**Database:** \`${dbName}\`\n**File Size:** \`${fileSizeStr}\`\n**Compression:** \`${config.backup.compress ? 'Enabled (GZ)' : 'Disabled'}\`\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>\n${extraInfo}`,
                color: embedColorSuccess,
                footer: {
                    text: BSM_WATERMARK
                }
            }]
        };
        form.append('payload_json', JSON.stringify(payloadJson));
        if (filePath && fileName) {
            form.append('file', fs.createReadStream(filePath), { filename: fileName });
        }
    } else {
        payloadJson = {
            content: content,
            embeds: [{
                title: "❌ Automated Database Backup Failed",
                description: `An error occurred while attempting to backup the database.\n\n**Database:** \`${dbName}\`\n**Error Details:**\n\`\`\`${extraInfo}\`\`\`\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                color: embedColorError,
                footer: {
                    text: BSM_WATERMARK
                }
            }]
        };
        form.append('payload_json', JSON.stringify(payloadJson));
    }

    try {
        await axios.post(config.discord.webhook_url, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        bsmLog(`^2Webhook sent successfully!^0`);
        return true;
    } catch (err) {
        bsmError(`Failed to send webhook: ${err.message}`);
        if (err.response && err.response.data) {
            console.error(err.response.data);
        }
        return false;
    }
}

function compressFile(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const source = fs.createReadStream(inputPath);
        const destination = fs.createWriteStream(outputPath);
        const gzip = zlib.createGzip({ level: config.backup.compression_level || 9 }); 

        source.pipe(gzip).pipe(destination)
            .on('finish', resolve)
            .on('error', reject);
    });
}

function cleanOldBackups() {
    bsmLog('Checking for old backups to clean up...');
    let retentionDays = config.backup.retention_days;
    if (typeof retentionDays !== 'number' || retentionDays <= 0) return;

    let now = Date.now();
    let msInDay = 24 * 60 * 60 * 1000;
    
    fs.readdir(backupFolder, (err, files) => {
        if (err) {
            bsmError(`Error reading backup directory for cleanup: ${err.message}`);
            return;
        }

        let deletedCount = 0;
        files.forEach(file => {
            let filePath = path.join(backupFolder, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                let ageMs = now - stats.mtimeMs;
                let ageDays = ageMs / msInDay;

                if (ageDays > retentionDays) {
                    try {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        if(config.system && config.system.debug_mode) {
                            bsmLog(`Deleted old backup: ${file} (Age: ${ageDays.toFixed(1)} days)`);
                        }
                    } catch (e) {
                        bsmWarn(`Could not delete old backup ${file}: ${e.message}`);
                    }
                }
            });
        });

        if (deletedCount > 0) {
            bsmLog(`Cleaned up ${deletedCount} old backup files (exceeded ${retentionDays} days retention).`);
        }
    });
}

async function doBackupForDatabase(dbName) {
    bsmLog(`Starting backup sequence for database: ^3${dbName}^0`);
    const timestamp = getTimestamp();
    const dbConfig = config.database;
    const sqlFileName = `${dbName}_${timestamp}.sql`;
    const sqlFilePath = path.join(backupFolder, sqlFileName);

    let mysqldumpCmd = `"${config.backup.mysqldump_path}" -h ${dbConfig.host} `;
    if(dbConfig.port) {
        mysqldumpCmd += `-P ${dbConfig.port} `;
    }
    mysqldumpCmd += `-u ${dbConfig.user} `;
    
    if (dbConfig.password && dbConfig.password.length > 0) {
        if (process.platform === 'win32') {
            mysqldumpCmd += `-p"${dbConfig.password}" `;
        } else {
            mysqldumpCmd += `-p'${dbConfig.password}' `;
        }
    }
    
    // Additional mysqldump arguments
    if (config.backup.mysqldump_args && config.backup.mysqldump_args.length > 0) {
        mysqldumpCmd += `${config.backup.mysqldump_args.join(' ')} `;
    }

    mysqldumpCmd += `${dbName} > "${sqlFilePath}"`;

    return new Promise((resolve) => {
        const startTime = Date.now();
        exec(mysqldumpCmd, { maxBuffer: 1024 * 1024 * 50 }, async (error, stdout, stderr) => {
            if (error) {
                bsmError(`mysqldump failed for ${dbName}: ${error.message}`);
                await sendToDiscord(dbName, null, null, false, error.message);
                resolve(false);
                return;
            }

            if (stderr && !stderr.toLowerCase().includes('warning')) {
                bsmWarn(`mysqldump stderr for ${dbName}: ${stderr}`);
            }

            bsmLog(`^2Database '${dbName}' dumped successfully to: ${sqlFileName}^0`);
            
            let fileToSend = sqlFilePath;
            let finalFileName = sqlFileName;

            if (config.backup.compress) {
                bsmLog(`Compressing SQL file for ${dbName}...`);
                const gzFileName = `${sqlFileName}.gz`;
                const gzFilePath = path.join(backupFolder, gzFileName);
                
                try {
                    await compressFile(sqlFilePath, gzFilePath);
                    bsmLog(`^2Compression successful: ${gzFileName}^0`);
                    
                    // Remove raw sql
                    try { fs.unlinkSync(sqlFilePath); } catch(e) {}
                    
                    fileToSend = gzFilePath;
                    finalFileName = gzFileName;
                } catch (err) {
                    bsmError(`Compression error for ${dbName}: ${err.message}`);
                    bsmLog('^3Proceeding with uncompressed SQL file.^0');
                }
            }

            const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const extraInfo = `**Execution Time:** \`${executionTime}s\``;
            
            const success = await sendToDiscord(dbName, fileToSend, finalFileName, true, extraInfo);
            
            if (success && !config.backup.keep_local_backups) {
                try {
                    fs.unlinkSync(fileToSend);
                    bsmLog(`^2Cleaned up local backup file for ${dbName}.^0`);
                } catch(e) {
                    bsmError(`Failed to delete local file for ${dbName}: ${e.message}`);
                }
            }
            
            resolve(true);
        });
    });
}

async function runAllBackups() {
    bsmLog('======================================');
    bsmLog('   BSM AutoBackup Sequence Initiated  ');
    bsmLog('======================================');

    let databases = [];
    if (Array.isArray(config.database.databases)) {
        databases = config.database.databases;
    } else if (config.database.database_name) {
        databases = [config.database.database_name]; // Fallback for old configs
    }

    if (databases.length === 0) {
        bsmError('No databases configured for backup.');
        return;
    }

    // Process sequentially to be safe with CPU/Mem and discord rate limits
    for (let i = 0; i < databases.length; i++) {
        await doBackupForDatabase(databases[i]);
    }

    // Run cleanup for old files if we keep them locally
    if (config.backup.keep_local_backups && config.backup.retention_days > 0) {
        cleanOldBackups();
    }
    
    bsmLog('======================================');
    bsmLog('   BSM AutoBackup Sequence Finished   ');
    bsmLog('======================================');
}

// Start sequence
bsmLog(`======================================`);
bsmLog(`          BSM AutoBackup V2           `);
bsmLog(`       Created by: Basil Saji Mathew  `);
bsmLog(`======================================`);
bsmLog(`Interval set to ${config.backup.interval_hours} hours.`);

if (config.discord.webhook_url && config.discord.webhook_url.startsWith('https://discord.com/api/webhooks/')) {
    bsmLog('^2Discord Webhook properly configured.^0');
} else {
    bsmWarn('Discord Webhook IS NOT configured properly in config.json.');
}

// Only register server side command if running under FiveM
if (typeof RegisterCommand !== 'undefined') {
    RegisterCommand('runbackup', async (source, args, raw) => {
        if (source === 0) {
            await runAllBackups();
        } else {
            // Check for admin permission
            if (IsPlayerAceAllowed(source, 'command.runbackup') || IsPlayerAceAllowed(source, 'admin')) {
                bsmLog(`Backup manually triggered by user ID ${source}.`);
                await runAllBackups();
            } else {
                bsmError(`Access Denied. Command only executable from server console or by Admins.`);
            }
        }
    }, true);
}

// Set up the interval
const intervalMs = config.backup.interval_hours * 60 * 60 * 1000;
setInterval(runAllBackups, intervalMs);
