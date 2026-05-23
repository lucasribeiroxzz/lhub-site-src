"""

import requests
import time
import json
from datetime import datetime
from pathlib import Path

SITE_URL = "https://passesff.squareweb.app"

INTERVALO = 50

PROJETO_DIR = Path(__file__).parent.parent
DB_PATH = PROJETO_DIR / "db.json"
DBS_DIR = PROJETO_DIR / "dbs"
CONTAS_SEM_DIMAS_PATH = DBS_DIR / "contas_semdimas.json"

BLN_API_BASE = "https://blnhubpasses-freefire.squareweb.app"

def load_env():
    """Carrega variáveis do .env"""
    env_path = PROJETO_DIR / ".env"
    env_vars = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"').strip("'")
    return env_vars

ENV = load_env()
RESELLER_KEY = ENV.get('RESELLER_KEY', '')

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def verificar_via_site():
    """Chama a API de verificação do site"""
    try:
        url = f"{SITE_URL}/api/cron/verify"
        log(f"Chamando {url}...")
        
        response = requests.get(url, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                d = data.get('data', {})
                log(f"✓ Contas: {d.get('contas', 0)} | Passes: {d.get('totalPasses', 0)} | Diamantes: {d.get('totalDiamantes', 0)} | Movidas: {d.get('contasMovidas', 0)}")
                return True
            else:
                log(f"✗ Erro: {data.get('error', 'Desconhecido')}")
                return False
        else:
            log(f"✗ HTTP {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        log("✗ Timeout na requisição")
        return False
    except requests.exceptions.ConnectionError:
        log("✗ Erro de conexão - site offline?")
        return False
    except Exception as e:
        log(f"✗ Erro: {e}")
        return False

def carregar_db():
    """Carrega o db.json"""
    if not DB_PATH.exists():
        return None
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def salvar_db(data):
    """Salva o db.json"""
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def separar_db(db):
    """Separa db.json em arquivos individuais"""
    DBS_DIR.mkdir(exist_ok=True)
    
    colecoes = {
        'users.json': db.get('users', []),
        'contas.json': db.get('garenaAccounts', []),
        'transactions.json': db.get('transactions', []),
        'coupons.json': db.get('coupons', []),
        'likesOrders.json': db.get('likesOrders', []),
        'apiKeys.json': db.get('apiKeys', []),
        'settings.json': db.get('settings', {}),
        'products.json': db.get('products', [])
    }
    
    for arquivo, dados in colecoes.items():
        caminho = DBS_DIR / arquivo
        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(dados, f, indent=2, ensure_ascii=False)

def carregar_contas_sem_dimas():
    """Carrega contas sem dimas"""
    DBS_DIR.mkdir(exist_ok=True)
    if not CONTAS_SEM_DIMAS_PATH.exists():
        with open(CONTAS_SEM_DIMAS_PATH, 'w') as f:
            f.write('[]')
        return []
    with open(CONTAS_SEM_DIMAS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def salvar_contas_sem_dimas(contas):
    """Salva contas sem dimas"""
    DBS_DIR.mkdir(exist_ok=True)
    with open(CONTAS_SEM_DIMAS_PATH, 'w', encoding='utf-8') as f:
        json.dump(contas, f, indent=2, ensure_ascii=False)

def verificar_local():
    """Verificação local direto na API externa (fallback)"""
    if not RESELLER_KEY:
        log("RESELLER_KEY não configurada!")
        return False
    
    try:

        url = f"{BLN_API_BASE}/api/contas/verificar?reseller_key={RESELLER_KEY}"
        log(f"Chamando API externa: {url}")
        
        response = requests.get(url, timeout=30, headers={'Accept': 'application/json'})
        

        content_type = response.headers.get('content-type', '')
        if 'application/json' not in content_type:
            log(f"✗ API retornou HTML ao invés de JSON")
            return False
        
        data = response.json()
        
        if not response.ok or 'contas' not in data:
            log(f"✗ API retornou: {data.get('status', data.get('message', 'Erro'))}")
            return False
        
        log(f"API retornou {len(data['contas'])} contas")
        

        db = carregar_db()
        if not db:
            log("✗ Erro ao carregar db.json")
            return False
        

        contas_sem_dimas = carregar_contas_sem_dimas()
        contas_sem_dimas_uids = {c['uid'] for c in contas_sem_dimas}
        

        garena_dict = {c['uid']: c for c in db.get('garenaAccounts', [])}
        
        contas_movidas = 0
        

        for conta_api in data['contas']:
            uid = conta_api.get('uid')
            diamonds = conta_api.get('diamonds', 0)
            passes = conta_api.get('passes', 0)
            

            if diamonds == 0 and passes == 0:
                conta_local = garena_dict.get(uid)
                if conta_local and conta_local.get('password') and uid not in contas_sem_dimas_uids:
                    contas_sem_dimas.append({
                        'uid': uid,
                        'password': conta_local.get('password', ''),
                        'movedAt': datetime.now().isoformat(),
                        'lastDiamonds': diamonds,
                        'lastPasses': passes
                    })
                    contas_sem_dimas_uids.add(uid)
                    del garena_dict[uid]
                    contas_movidas += 1
                    log(f"  -> Conta {uid} movida para contas_semdimas.json")
            else:

                if uid in garena_dict:
                    garena_dict[uid]['diamonds'] = diamonds
                    garena_dict[uid]['passes'] = passes
                    garena_dict[uid]['presentesSentToday'] = conta_api.get('presentes_enviados_hoje', 0)
                    garena_dict[uid]['status'] = 'ACTIVE'
                    garena_dict[uid]['updatedAt'] = datetime.now().isoformat()
        

        db['garenaAccounts'] = list(garena_dict.values())
        

        if contas_movidas > 0:
            salvar_contas_sem_dimas(contas_sem_dimas)
        

        total_passes = sum(c.get('passes', 0) for c in db['garenaAccounts'] if c.get('status') == 'ACTIVE')
        total_diamantes = sum(c.get('diamonds', 0) for c in db['garenaAccounts'])
        

        for i, p in enumerate(db.get('products', [])):
            if p.get('type') == 'PASSE' or 'passe' in p.get('id', '').lower():
                db['products'][i]['stock'] = total_passes
                db['products'][i]['updatedAt'] = datetime.now().isoformat()
                break
        

        salvar_db(db)
        

        separar_db(db)
        
        log(f"✓ Contas: {len(db['garenaAccounts'])} | Passes: {total_passes} | Diamantes: {total_diamantes} | Movidas: {contas_movidas} | Sem dimas: {len(contas_sem_dimas)}")
        return True
        
    except Exception as e:
        log(f"✗ Erro: {e}")
        return False

def verificar():
    """Tenta verificar via site, se falhar usa modo local"""

    if verificar_via_site():
        return
    

    log("Tentando verificação local...")
    verificar_local()

def main():
    log("=" * 50)
    log("VERIFICADOR AUTOMÁTICO DE CONTAS")
    log(f"Site: {SITE_URL}")
    log(f"Intervalo: {INTERVALO} segundos")
    log(f"RESELLER_KEY: {'Configurada' if RESELLER_KEY else 'NÃO CONFIGURADA!'}")
    log("=" * 50)
    log("")
    

    DBS_DIR.mkdir(exist_ok=True)
    if not CONTAS_SEM_DIMAS_PATH.exists():
        with open(CONTAS_SEM_DIMAS_PATH, 'w') as f:
            f.write('[]')
    

    verificar()
    

    while True:
        time.sleep(INTERVALO)
        verificar()

if __name__ == "__main__":
    main()
