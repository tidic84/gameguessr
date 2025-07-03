@echo off
echo Compilation du serveur TypeScript...
npx tsc server-new.ts --outDir dist --moduleResolution node --esModuleInterop --target es2020 --allowJs --skipLibCheck

if %errorlevel% neq 0 (
    echo Erreur de compilation TypeScript
    pause
    exit /b 1
)

echo Démarrage du serveur...
node dist/server-new.js
