#!/bin/bash
# Script para iniciar o verificador automático em background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/verificador.log"
PID_FILE="$PROJECT_DIR/verificador.pid"

# Criar pasta de logs
mkdir -p "$PROJECT_DIR/logs"

# Verificar se já está rodando
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "Verificador já está rodando (PID: $PID)"
        exit 1
    fi
fi

# Iniciar verificador em background
echo "Iniciando verificador automático..."
cd "$PROJECT_DIR"
nohup python3 "$SCRIPT_DIR/auto_verificador.py" >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
echo "Verificador iniciado com PID: $(cat $PID_FILE)"
echo "Logs em: $LOG_FILE"
echo ""
echo "Para ver os logs em tempo real:"
echo "  tail -f $LOG_FILE"
echo ""
echo "Para parar o verificador:"
echo "  ./scripts/stop_verificador.sh"
