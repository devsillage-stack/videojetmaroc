@echo off
REM ==============================================================================
REM VIDEOJET MAROC INDUSTRIAL PLATFORM - AUTOMATED DATABASE BACKUP SCRIPT (WINDOWS)
REM ==============================================================================

setlocal enabledelayedexpansion

set BACKUP_DIR=backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

set DB_NAME=videojet_db
set DB_USER=postgres
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%TIMESTAMP%.sql

echo =================================================================
echo  [VIDEOJET MAROC] Demarrage de la sauvegarde de la base de donnees...
echo  Base de donnees : %DB_NAME%
echo  Fichier cible   : %BACKUP_FILE%
echo =================================================================

REM Check if docker container is active
docker ps --format "{{.Names}}" 2>nul | findstr /R "^videojet_postgres$" >nul
if %errorlevel% equ 0 (
    echo => Sauvegarde via conteneur Docker 'videojet_postgres'...
    docker exec -t videojet_postgres pg_dump -U %DB_USER% %DB_NAME% > "%BACKUP_FILE%"
) else (
    echo => Sauvegarde locale pg_dump...
    set PGPASSWORD=postgres
    pg_dump -h localhost -p 5432 -U %DB_USER% %DB_NAME% > "%BACKUP_FILE%"
)

if %errorlevel% equ 0 (
    echo [OK] Sauvegarde effectuee avec succes : %BACKUP_FILE%
) else (
    echo [ERREUR] Echec de la sauvegarde PostgreSQL.
)

echo =================================================================
pause
