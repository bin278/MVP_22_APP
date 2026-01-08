@echo off
setlocal enabledelayedexpansion

REM 数据库快速切换脚本 (Windows版本)
REM 用于在开发环境快速切换数据库提供商

echo ==================================================
echo 🔄 数据库提供商切换工具
echo ==================================================
echo.

REM 检查当前配置
if exist .env.local (
  findstr /B "DATABASE_PROVIDER" .env.local > nul
  if !errorlevel! equ 0 (
    for /f "tokens=2 delims==" %%a in ('findstr /B "DATABASE_PROVIDER" .env.local') do set CURRENT=%%a
    echo 📊 当前数据库: %CURRENT%
  ) else (
    echo 📊 当前数据库: 未配置
  )
) else (
  echo ⚠️  .env.local 文件不存在
)

echo.
echo 请选择要使用的数据库:
echo   1) 国内版 - 腾讯云 CloudBase
echo   2) 国际版 - Supabase
echo   3) 测试当前配置
echo   q) 退出
echo.
set /p choice="请输入选项 [1-3/q]: "

if "%choice%"=="1" goto CLOUDBASE
if "%choice%"=="2" goto SUPABASE
if "%choice%"=="3" goto TEST
if /i "%choice%"=="q" goto QUIT
echo ❌ 无效选项
goto END

:CLOUDBASE
echo.
echo 🇨🇳 切换到国内版 (腾讯云 CloudBase)
echo ------------------------------------------------

if not exist .env.local (
  copy .env.cloudbase.example .env.local > nul
  echo ✅ 已创建 .env.local
) else (
  powershell -Command "(Get-Content .env.local) -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=cloudbase' | Set-Content .env.local"
  echo ✅ 已更新 DATABASE_PROVIDER=cloudbase
)

echo.
echo 下一步:
echo   1. 编辑 .env.local 填写腾讯云配置
echo   2. 运行: npm run config:test
echo   3. 运行: npm run dev
goto END

:SUPABASE
echo.
echo 🌍 切换到国际版 (Supabase)
echo ------------------------------------------------

if not exist .env.local (
  copy .env.supabase.example .env.local > nul
  echo ✅ 已创建 .env.local
) else (
  powershell -Command "(Get-Content .env.local) -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=supabase' | Set-Content .env.local"
  echo ✅ 已更新 DATABASE_PROVIDER=supabase
)

echo.
echo 下一步:
echo   1. 编辑 .env.local 填写 Supabase 配置
echo   2. 在 Supabase SQL Editor 运行: scripts/setup-supabase-db.sql
echo   3. 运行: npm run config:test
echo   4. 运行: npm run dev
goto END

:TEST
echo.
echo 🧪 测试当前配置
echo ------------------------------------------------
node scripts/test-database-switch.js
goto END

:QUIT
echo 👋 再见!
exit /b 0

:END
echo.
echo ==================================================
echo ✅ 操作完成!
echo ==================================================
pause
