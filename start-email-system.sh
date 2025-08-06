#!/bin/bash

# 📧 Script de Inicio - Sistema de Automatización de E-books
# Bibliowave Technologies

echo "🚀 Iniciando Sistema de Automatización de E-books..."
echo "📧 Bibliowave Technologies"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instálalo desde: https://nodejs.org/"
    exit 1
fi

# Verificar si npm está disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible. Instala Node.js completo."
    exit 1
fi

echo "✅ Node.js disponible: $(node --version)"
echo "✅ npm disponible: $(npm --version)"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install nodemailer express
    echo "✅ Dependencias instaladas"
else
    echo "✅ Dependencias ya instaladas"
fi

echo ""

# Verificar que el e-book existe
if [ -f "ebooks-downloads/aprende-ia-ebook.pdf" ]; then
    echo "✅ E-book encontrado: aprende-ia-ebook.pdf"
    echo "📊 Tamaño: $(ls -lh ebooks-downloads/aprende-ia-ebook.pdf | awk '{print $5}')"
else
    echo "⚠️  E-book no encontrado. Verificando archivo original..."
    if [ -f "APRENDE A UTILIZAR LA IA E-BOOK.pdf" ]; then
        echo "📁 Copiando e-book al directorio correcto..."
        mkdir -p ebooks-downloads
        cp "APRENDE A UTILIZAR LA IA E-BOOK.pdf" "ebooks-downloads/aprende-ia-ebook.pdf"
        echo "✅ E-book copiado exitosamente"
    else
        echo "❌ E-book no encontrado. Coloca el PDF en el directorio."
        exit 1
    fi
fi

echo ""

# Verificar configuración de email
echo "📧 Configuración de Email:"
if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASS" ]; then
    echo "⚠️  Variables de entorno no configuradas"
    echo "📋 Para configurar tu email:"
    echo "   export EMAIL_USER=tu-email@gmail.com"
    echo "   export EMAIL_PASS=tu-app-password"
    echo ""
    echo "🔗 Guía de configuración: INSTRUCCIONES-EMAIL-AUTOMATION.md"
    echo ""
    echo "💡 Iniciando con configuración de prueba..."
else
    echo "✅ Email configurado: $EMAIL_USER"
fi

echo ""
echo "🌟 ¡Iniciando servidor de automatización!"
echo "📡 Puerto: 3001"
echo "🔗 Prueba: http://localhost:3001/test-email?email=tu-email@gmail.com"
echo ""
echo "⚠️  Para detener el servidor: Ctrl + C"
echo "================================================"
echo ""

# Iniciar el servidor
node email-automation.js 