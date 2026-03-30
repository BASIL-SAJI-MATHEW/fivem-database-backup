fx_version 'cerulean'
game 'gta5'

name 'BSM AutoBackup'
author 'Basil Saji Mathew (BSM)'
description 'Advanced Automatic MySQL Database Backup & Discord Integration System by BSM.'
version '2.0.0'

server_scripts {
    'server.js'
}

files {
    'config.json'
}

-- Ensure package.json is ignored from streaming
files {
    'package.json'
}
