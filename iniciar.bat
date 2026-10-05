@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Atelier Girassol - site local

rem ====================================================================
rem  INICIAR.BAT - liga o site localmente e deixa no ar para testes
rem
rem  Uso:
rem    iniciar.bat              -> modo desenvolvimento, porta 3000
rem    iniciar.bat 4000         -> modo desenvolvimento, porta 4000
rem    iniciar.bat prod         -> build de producao + servidor (mais leve)
rem    iniciar.bat 4000 prod    -> idem, na porta 4000
rem    iniciar.bat noopen       -> nao abre o navegador
rem
rem  Nao precisa de Visual Studio / compilador C++: o banco usa o SQLite
rem  embutido do Node (node:sqlite). Requisito: Node 22.5 ou superior.
rem
rem  Deixe esta janela ABERTA enquanto estiver testando.
rem  Para encerrar: Ctrl+C (e depois "S" / "Y" se ele perguntar).
rem  Se o navegador nao abrir sozinho, copie o endereco mostrado na tela.
rem ====================================================================

pushd "%~dp0"

set "PORT=3000"
set "MODE=dev"
set "OPEN=1"

rem ------------------------- argumentos -------------------------------
:loop_args
if "%~1"=="" goto args_done
if /i "%~1"=="prod" (
  set "MODE=prod"
  shift
  goto loop_args
)
if /i "%~1"=="noopen" (
  set "OPEN=0"
  shift
  goto loop_args
)
set "PORT=%~1"
shift
goto loop_args
:args_done

echo.
echo ============================================================
echo    ATELIER GIRASSOL - portfolio de arte + livro 3D
echo ============================================================
echo.

if not exist "package.json" (
  echo [X] package.json nao encontrado.
  echo     Coloque este .bat na pasta raiz do projeto e rode de novo.
  goto fim_erro
)

echo !PORT!|findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo [X] Porta invalida: "!PORT!"  ^(use um numero, ex.: iniciar.bat 4000^)
  goto fim_erro
)

rem --------------------------- Node.js --------------------------------
where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js nao encontrado no PATH.
  echo     Instale a versao 22 LTS ou superior: https://nodejs.org
  goto fim_erro
)

for /f "delims=" %%v in ('node -v 2^>nul') do set "NODEVER=%%v"
set "NODE_NUMS=!NODEVER:v=!"
for /f "tokens=1,2 delims=." %%a in ("!NODE_NUMS!") do (
  set "NODE_MAJOR=%%a"
  set "NODE_MINOR=%%b"
)

if !NODE_MAJOR! LSS 22 (
  echo [X] Node !NODEVER! encontrado, mas o projeto exige Node 22.5 ou superior.
  echo     ^(o banco usa o SQLite embutido do Node - sem compilador C++^)
  echo     Instale a versao LTS: https://nodejs.org
  goto fim_erro
)
if !NODE_MAJOR! EQU 22 if !NODE_MINOR! LSS 5 (
  echo [X] Node !NODEVER! e antigo demais: atualize para 22.5 ou superior.
  echo     https://nodejs.org
  goto fim_erro
)

rem -------- SQLite embutido do Node disponivel? (22.5+ tem, com flag) ----
set "NODE_FLAGS=--disable-warning=ExperimentalWarning"
node -e "require('node:sqlite')" >nul 2>&1
if errorlevel 1 (
  node --experimental-sqlite -e "require('node:sqlite')" >nul 2>&1
  if errorlevel 1 (
    echo [X] O Node !NODEVER! nao expos o modulo node:sqlite.
    echo     Atualize para Node 22 LTS ^(22.13+^) ou 24: https://nodejs.org
    goto fim_erro
  )
  set "NODE_FLAGS=--experimental-sqlite !NODE_FLAGS!"
  echo [1/4] Node !NODEVER! OK ^(com --experimental-sqlite^)
) else (
  echo [1/4] Node !NODEVER! OK
)
set "NODE_OPTIONS=!NODE_FLAGS!"

rem ------------------------ dependencias ------------------------------
if not exist "node_modules\next\package.json" (
  echo [2/4] Instalando dependencias ^(primeira vez, pode demorar^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo [!] A instalacao falhou. Causas comuns no Windows:
    echo     - uma janela do VS Code / editor aberta segurando a pasta;
    echo     - antivirus ou OneDrive sincronizando a pasta do projeto;
    echo     - pasta node_modules corrompida de uma tentativa anterior.
    echo.
    echo     Feche o editor/antivirus e pressione uma tecla para tentar de novo...
    pause >nul
    if exist "node_modules" rmdir /s /q "node_modules" 2>nul
    call npm install --no-audit --no-fund
    if errorlevel 1 (
      echo [X] Nao foi possivel instalar as dependencias.
      echo     Dica: mova o projeto para uma pasta simples ^(ex.: C:\dev\portf^) e rode de novo.
      goto fim_erro
    )
  )
) else (
  echo [2/4] Dependencias OK
)

rem --------------------------- banco ----------------------------------
echo [3/4] Sincronizando o banco SQLite ^(data\atelier.sqlite^)...
call npm run db:build
if errorlevel 1 (
  echo [X] Falha ao preparar o banco.
  goto fim_erro
)

rem ------------------------ endereco da rede --------------------------
set "LANIP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4" ^| findstr /v /c:"169.254."') do (
  if not defined LANIP (
    for /f "tokens=* delims= " %%b in ("%%a") do set "LANIP=%%b"
  )
)

echo [4/4] Subindo o servidor ^(modo !MODE!, porta !PORT!)...
echo.
echo   ------------------------------------------------------------
echo    Site ......... http://localhost:!PORT!
echo    Estudio ...... http://localhost:!PORT!/estudio   ^(pede login^)
echo    Admin ........ http://localhost:!PORT!/admin     ^(senha no inicio desta janela^)
echo    Galeria ...... http://localhost:!PORT!/galeria
echo    API .......... http://localhost:!PORT!/api/health
if defined LANIP echo    No celular ... http://!LANIP!:!PORT!   ^(mesma rede Wi-Fi^)
echo   ------------------------------------------------------------
echo.
echo    Deixe esta janela aberta. Ctrl+C encerra o servidor.
echo.

rem ------------- abre o navegador quando o site responder -------------
if "!OPEN!"=="1" (
  start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $u='http://localhost:!PORT!'; for($i=0; $i -lt 150; $i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 3; if($r.StatusCode -ge 200){ Start-Process $u; break } } catch {}; Start-Sleep -Milliseconds 800 }" >nul 2>&1
)

rem ---------------------------- servidor ------------------------------
if /i "!MODE!"=="prod" (
  echo Compilando a versao de producao ^(pode levar 1-3 minutos^)...
  call npm run build
  if errorlevel 1 (
    echo [X] Falha no build.
    goto fim_erro
  )
  call npm run start:lan -- -p !PORT!
) else (
  call npm run dev:lan -- -p !PORT!
)

echo.
echo Servidor encerrado.
goto fim

:fim_erro
echo.
echo Nao foi possivel ligar o site.
pause
popd
exit /b 1

:fim
popd
pause
endlocal
