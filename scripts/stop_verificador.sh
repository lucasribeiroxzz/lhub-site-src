#!/bin/bash
# Script para parar o verificador automático

PROJECT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
PID_FILE="$PROJECT_DIR/verificador.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "Parando verificador (PID: $PID)..."
        kill $PID
        rm "$PID_FILE"
        echo "Verificador parado!"
    else
        echo "Verificador não está rodando (PID antigo: $PID)"
        rm "$PID_FILE"
    fi
else
    echo "Arquivo PID não encontrado. Verificador não está rodando."
fi
