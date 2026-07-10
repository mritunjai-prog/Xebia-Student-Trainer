import os
import sys
import time
import socket
import subprocess
import re
import urllib.request
from pathlib import Path

# ANSI colors for beautiful terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Port configuration mapping
SERVICES = {
    "PostgreSQL": {"port": 5432, "required": True, "type": "db"},
    "Redis": {"port": 6379, "required": True, "type": "cache"},
    "user-service": {"port": 8081, "required": True, "type": "backend", "path": "backend/user-service", "test_url": "http://localhost:8081/actuator/health"},
    "batch-service": {"port": 8082, "required": True, "type": "backend", "path": "backend/batch-service", "test_url": "http://localhost:8082/actuator/health"},
    "assessment-service": {"port": 8083, "required": True, "type": "backend", "path": "backend/assessment-service", "test_url": "http://localhost:8083/actuator/health"},
    "api-gateway": {"port": 8080, "required": True, "type": "backend", "path": "backend/api-gateway", "test_url": "http://localhost:8080/actuator/health"},
    "Frontend (Vite)": {"port": 3000, "required": True, "type": "frontend", "path": ".", "test_url": "http://localhost:3000"}
}

running_subprocesses = []

def log(msg, color=Colors.CYAN, bold=False):
    style = Colors.BOLD if bold else ""
    print(f"{style}{color}{msg}{Colors.ENDC}")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def kill_port_owner(port):
    """Finds the process ID using the port and forcefully kills it."""
    log(f"Checking for any processes blocking port {port}...", Colors.WARNING)
    try:
        # Get netstat output for the port
        output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode('utf-8', errors='ignore')
        pids = set()
        for line in output.strip().split('\n'):
            line = line.strip()
            if not line:
                continue
            parts = re.split(r'\s+', line)
            # The PID is the last column
            if len(parts) >= 5:
                pid = parts[-1]
                # Validate PID is a number
                if pid.isdigit() and pid != '0':
                    pids.add(pid)
        
        for pid in pids:
            log(f"Forcefully killing process {pid} occupying port {port}...", Colors.FAIL)
            subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(0.5)
    except subprocess.CalledProcessError:
        # findstr returns exit code 1 if no matches found
        pass

def check_system_dependency(cmd, name):
    try:
        subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        log(f"[ERROR] {name} is not installed or not found on PATH. Please install it to run the project.", Colors.FAIL, bold=True)
        return False

def try_start_postgresql():
    """Attempts to auto-repair/start PostgreSQL if down."""
    log("Checking if PostgreSQL is running on Docker...", Colors.WARNING)
    try:
        res = subprocess.run("docker ps -a", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and "xebia-postgres" in res.stdout:
            log("Found 'xebia-postgres' container. Starting it...", Colors.WARNING)
            subprocess.run("docker start xebia-postgres", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            time.sleep(3)
            if is_port_in_use(5432):
                log("PostgreSQL container started successfully.", Colors.GREEN)
                return True
    except Exception as e:
        log(f"Docker postgres check failed: {e}", Colors.FAIL)

    log("Docker method skipped/failed. Attempting to start PostgreSQL Windows service...", Colors.WARNING)
    # 1. Try Windows Service Manager
    for service_name in ["postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14", "postgresql-x64-13", "postgresql"]:
        try:
            res = subprocess.run(f"net start {service_name}", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0:
                log("PostgreSQL service started successfully via Service Manager.", Colors.GREEN)
                return True
        except Exception:
            pass

    # 2. Search in common program files
    pg_search_paths = list(Path("C:/Program Files/PostgreSQL").glob("**/bin/pg_ctl.exe"))
    if pg_search_paths:
        pg_ctl = pg_search_paths[0]
        # Locate data directory relative to bin
        pg_data = pg_ctl.parent.parent / "data"
        if pg_data.exists():
            log(f"Found PostgreSQL installation at {pg_ctl}. Starting manual instance...", Colors.WARNING)
            try:
                subprocess.Popen([str(pg_ctl), "start", "-D", str(pg_data)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(3)
                if is_port_in_use(5432):
                    log("PostgreSQL started successfully.", Colors.GREEN)
                    return True
            except Exception as e:
                log(f"Failed starting manually: {e}", Colors.FAIL)

    log("[ERROR] Could not start PostgreSQL automatically. Ensure it is installed and running on port 5432.", Colors.FAIL)
    return False

def try_start_redis():
    """Attempts to auto-repair/start Redis if down."""
    log("Checking if Redis is running on Docker...", Colors.WARNING)
    try:
        res = subprocess.run("docker ps -a", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and "xebia-redis" in res.stdout:
            log("Found 'xebia-redis' container. Starting it...", Colors.WARNING)
            subprocess.run("docker start xebia-redis", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            time.sleep(2)
            if is_port_in_use(6379):
                log("Redis container started successfully.", Colors.GREEN)
                return True
    except Exception as e:
        log(f"Docker redis check failed: {e}", Colors.FAIL)

    log("Docker method skipped/failed. Attempting to start Redis Windows service...", Colors.WARNING)
    # 1. Try Windows Service Manager
    for service_name in ["redis", "Redis", "memurai", "Memurai"]:
        try:
            res = subprocess.run(f"net start {service_name}", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0:
                log("Redis service started successfully via Service Manager.", Colors.GREEN)
                return True
        except Exception:
            pass

    # 2. Try raw command on PATH
    try:
        subprocess.Popen("redis-server", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2)
        if is_port_in_use(6379):
            log("Redis started successfully.", Colors.GREEN)
            return True
    except Exception:
        pass

    # 3. Check common installation directories
    common_paths = [
        "C:/Program Files/Redis/redis-server.exe",
        "C:/Program Files/Memurai/memurai-server.exe",
        "C:/Program Files/Memurai/memurai.exe"
    ]
    for path in common_paths:
        if os.path.exists(path):
            log(f"Found Redis binary at {path}. Starting manually...", Colors.WARNING)
            try:
                subprocess.Popen([path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(2)
                if is_port_in_use(6379):
                    log("Redis started successfully.", Colors.GREEN)
                    return True
            except Exception:
                pass

    log("[ERROR] Could not start Redis automatically. Ensure it is installed and running on port 6379.", Colors.FAIL)
    return False

def check_url(url):
    """Query service endpoint to check status."""
    try:
        with urllib.request.urlopen(url, timeout=1.0) as conn:
            return conn.status == 200
    except Exception:
        return False

def start_backend_service(name, info):
    log(f"Launching {name}...", Colors.BLUE, bold=True)
    # Clean up logs folder
    os.makedirs("logs", exist_ok=True)
    log_file = open(f"logs/{name}.log", "w", encoding="utf-8")
    
    # Check if port is occupied, kill it forcefully
    kill_port_owner(info["port"])
    
    # Run the Spring Boot application
    # Use mvnw directly in its directory
    cmd = "mvnw.cmd spring-boot:run -Dmaven.test.skip=true" if os.name == 'nt' else "./mvnw spring-boot:run -Dmaven.test.skip=true"
    cwd = os.path.abspath(info["path"])
    
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        shell=True,
        stdout=log_file,
        stderr=log_file
    )
    running_subprocesses.append((name, proc, log_file))

def start_frontend(info):
    log("Launching Frontend (Vite)...", Colors.BLUE, bold=True)
    os.makedirs("logs", exist_ok=True)
    log_file = open("logs/frontend.log", "w", encoding="utf-8")
    
    kill_port_owner(info["port"])
    
    # Check node_modules
    if not os.path.exists("node_modules"):
        log("node_modules not found. Installing frontend dependencies (npm install)...", Colors.WARNING)
        subprocess.run("npm install", shell=True, check=True)
    
    # Check .env file
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            log("Copying .env.example to create default .env...", Colors.WARNING)
            with open(".env.example", "r") as src, open(".env", "w") as dst:
                dst.write(src.read())
        else:
            with open(".env", "w") as f:
                f.write("VITE_GROQ_API_KEY=\n")
    
    proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        stdout=log_file,
        stderr=log_file
    )
    running_subprocesses.append(("Frontend (Vite)", proc, log_file))

def get_live_status():
    status = {}
    for name, info in SERVICES.items():
        if info["type"] in ["db", "cache"]:
            status[name] = "UP" if is_port_in_use(info["port"]) else "DOWN"
        elif "test_url" in info:
            status[name] = "UP" if check_url(info["test_url"]) else ("STARTING" if is_port_in_use(info["port"]) else "DOWN")
        else:
            status[name] = "UP" if is_port_in_use(info["port"]) else "DOWN"
    return status

def print_dashboard(status, start_time):
    # Clear screen
    os.system('cls' if os.name == 'nt' else 'clear')
    elapsed = int(time.time() - start_time)
    
    print("=" * 60)
    print(f"       {Colors.BOLD}{Colors.HEADER}XEBIA CLASSROOM - LMS SERVICES MANAGEMENT DASHBOARD{Colors.ENDC}")
    print(f"       Uptime: {elapsed} seconds | Press Ctrl+C to Stop All Services")
    print("=" * 60)
    print(f"{'Service Name':<25} | {'Port':<8} | {'Status':<15}")
    print("-" * 60)
    
    all_up = True
    for name, info in SERVICES.items():
        stat = status.get(name, "DOWN")
        port = info["port"]
        
        if stat == "UP":
            stat_str = f"{Colors.GREEN}{Colors.BOLD}● UP{Colors.ENDC}"
        elif stat == "STARTING":
            stat_str = f"{Colors.WARNING}▲ STARTING{Colors.ENDC}"
            all_up = False
        else:
            stat_str = f"{Colors.FAIL}■ DOWN{Colors.ENDC}"
            all_up = False
            
        print(f"{name:<25} | {port:<8} | {stat_str}")
        
    print("=" * 60)
    if all_up:
        print(f"{Colors.GREEN}{Colors.BOLD}✔ ALL SERVICES ONLINE AND READILY RUNNING!{Colors.ENDC}")
        print(f"👉 Access Frontend: {Colors.UNDERLINE}http://localhost:3000{Colors.ENDC}")
        print(f"👉 API Gateway:    {Colors.UNDERLINE}http://localhost:8080{Colors.ENDC}")
    else:
        print(f"{Colors.CYAN}⌛ Waiting for all services to spin up and complete health checks...{Colors.ENDC}")
        print("💡 Detailed logs are written to: ./logs/")
    print("=" * 60)

def main():
    log("==================================================", Colors.HEADER, bold=True)
    log("   Xebia Student-Trainer LMS Orchestrator         ", Colors.HEADER, bold=True)
    log("==================================================", Colors.HEADER, bold=True)
    
    # 1. System dependency checks
    if not check_system_dependency("node -v", "Node.js"):
        sys.exit(1)
    if not check_system_dependency("java -version", "Java/JDK"):
        sys.exit(1)
        
    # 2. Database checks and auto-heal
    if not is_port_in_use(SERVICES["PostgreSQL"]["port"]):
        if not try_start_postgresql():
            log("[WARNING] PostgreSQL is not running. Backend services will fail to connect.", Colors.WARNING)
            
    if not is_port_in_use(SERVICES["Redis"]["port"]):
        if not try_start_redis():
            log("[WARNING] Redis is not running. Cache & Assessment evaluations will fail.", Colors.WARNING)

    # 3. Start Backend Services
    for name, info in SERVICES.items():
        if info["type"] == "backend":
            start_backend_service(name, info)
            time.sleep(1) # Allow slight gap to avoid resource hogging on startup
            
    # 4. Start Frontend
    start_frontend(SERVICES["Frontend (Vite)"])
    
    # 5. Monitoring loop
    start_time = time.time()
    try:
        while True:
            status = get_live_status()
            print_dashboard(status, start_time)
            time.sleep(3)
    except KeyboardInterrupt:
        log("\nShutting down all Xebia LMS services...", Colors.WARNING, bold=True)
        for name, proc, log_file in running_subprocesses:
            log(f"Stopping subprocess {name}...", Colors.BLUE)
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                log(f"Forcefully terminating {name}...", Colors.FAIL)
                proc.kill()
            log_file.close()
        log("All services shut down cleanly. Bye!", Colors.GREEN, bold=True)

if __name__ == "__main__":
    main()
