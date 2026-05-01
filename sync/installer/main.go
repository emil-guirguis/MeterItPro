package main

import (
	"bufio"
	"crypto/rand"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

//go:embed docker-compose.yml
var dockerComposeYML []byte

//go:embed 00-schema.sql
var schemaSQL []byte

const (
	installDir    = `C:\MeterItPro\SyncServer`
	dockerDLURL   = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
	defaultAPIURL = "https://meteritpro.com/api"
	githubOwner   = "emil-guirguis"
)

// ── Bootstrap response ────────────────────────────────────────────────────────

type bootstrapData struct {
	ProvisionStatus  string `json:"provision_status"`
	ProvisionError   string `json:"provision_error"`
	TunnelToken      string `json:"tunnel_token"`
	ClientAPIURL     string `json:"client_api_url"`
	GithubOwner      string `json:"github_owner"`
	GithubToken      string `json:"github_token"`
	ApiKey           string `json:"api_key"`
	RemoteDbHost     string `json:"remote_db_host"`
	RemoteDbPort     int    `json:"remote_db_port"`
	RemoteDbName     string `json:"remote_db_name"`
	RemoteDbUser     string `json:"remote_db_user"`
	RemoteDbPassword string `json:"remote_db_password"`
}

// ── Entry point ───────────────────────────────────────────────────────────────

func main() {
	if runtime.GOOS != "windows" {
		die("This installer is for Windows only.")
	}

	printBanner()

	if !isAdmin() {
		fmt.Println("  Requesting administrator privileges...")
		elevate()
		return
	}

	r := bufio.NewReader(os.Stdin)

	step(1, "Server Configuration")
	fmt.Println("  Open the MeterItPro client site → Settings → Sync Servers,")
	fmt.Println("  click the setup instructions for this server, then enter the values below.")
	fmt.Println()
	serverID := ask(r, "Sync Server ID  ")
	bootstrapKey := ask(r, "Bootstrap Key   ")

	step(2, "Fetching configuration from MeterItPro")
	cfg := fetchBootstrap(serverID, bootstrapKey)
	ok("Config received")

	step(3, "Configuring Windows for 24/7 operation")
	hardenWindows()

	step(4, "Docker Desktop")
	ensureDocker(r)

	step(5, "Authenticating with GitHub Container Registry")
	dockerLogin(cfg)

	step(6, "Writing install files")
	mustMkdir(installDir)
	mustMkdir(filepath.Join(installDir, "docker", "init"))
	writeEnv(serverID, bootstrapKey, cfg)
	writeFile(filepath.Join(installDir, "docker-compose.yml"), dockerComposeYML, 0644)
	writeFile(filepath.Join(installDir, "docker", "init", "00-schema.sql"), schemaSQL, 0644)
	ok("Files written to " + installDir)

	step(7, "Pulling Docker images  (this may take several minutes)")
	compose("pull")

	step(8, "Starting all services")
	compose("up", "-d")

	printDone()
	fmt.Print("\nPress Enter to exit...")
	r.ReadString('\n')
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

func fetchBootstrap(serverID, key string) bootstrapData {
	url := fmt.Sprintf("%s/sync-servers/%s/bootstrap?key=%s", defaultAPIURL, serverID, key)

	for attempt := 1; attempt <= 5; attempt++ {
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("  Attempt %d: cannot reach API — %s\n", attempt, err)
			time.Sleep(5 * time.Second)
			continue
		}

		var envelope struct {
			Success bool          `json:"success"`
			Data    bootstrapData `json:"data"`
			Message string        `json:"message"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
			resp.Body.Close()
			die("Invalid response from API: " + err.Error())
		}
		resp.Body.Close()

		if !envelope.Success {
			die("API error: " + envelope.Message)
		}
		switch envelope.Data.ProvisionStatus {
		case "pending", "provisioning":
			die("Server not yet provisioned — click 'Provision Tunnel' on the client site first.")
		case "error":
			die("Server provisioning failed: " + envelope.Data.ProvisionError)
		}
		return envelope.Data
	}
	die("Could not reach MeterItPro API after 5 attempts. Check internet connection.")
	return bootstrapData{}
}

// ── Windows hardening ─────────────────────────────────────────────────────────

func hardenWindows() {
	ps := []struct{ label, script string }{
		{
			"Disable automatic restart after Windows Update",
			`New-Item -Force -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" | Out-Null
			 Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" ` +
				`-Name "NoAutoRebootWithLoggedOnUsers" -Value 1 -Type DWord`,
		},
		{
			"Set Active Hours 6am–11pm (blocks update restart window)",
			`$p = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
			 New-Item -Force -Path $p | Out-Null
			 Set-ItemProperty -Path $p -Name "ActiveHoursStart" -Value 6  -Type DWord -Force
			 Set-ItemProperty -Path $p -Name "ActiveHoursEnd"   -Value 23 -Type DWord -Force`,
		},
		{
			"Disable sleep and hibernation",
			`powercfg /change standby-timeout-ac 0
			 powercfg /change hibernate-timeout-ac 0
			 powercfg /h off`,
		},
		{
			"Set High Performance power plan",
			`powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`,
		},
		{
			"Disable fast startup",
			`Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power" ` +
				`-Name "HiberbootEnabled" -Value 0 -Type DWord -Force`,
		},
		{
			"Add Docker to Windows Defender exclusions",
			`Add-MpPreference -ExclusionPath    "$env:ProgramFiles\Docker"        -ErrorAction SilentlyContinue
			 Add-MpPreference -ExclusionPath    "$env:LOCALAPPDATA\Docker"        -ErrorAction SilentlyContinue
			 Add-MpPreference -ExclusionPath    "` + installDir + `"              -ErrorAction SilentlyContinue
			 Add-MpPreference -ExclusionProcess "docker.exe"                      -ErrorAction SilentlyContinue
			 Add-MpPreference -ExclusionProcess "dockerd.exe"                     -ErrorAction SilentlyContinue`,
		},
		{
			"Configure Docker Desktop to start with Windows",
			`$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
			 $dockerExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
			 if (Test-Path $dockerExe) {
			   Set-ItemProperty -Path $regPath -Name "Docker Desktop" -Value $dockerExe -Force
			 }`,
		},
	}

	for _, s := range ps {
		fmt.Printf("  %-58s", s.label+"...")
		if err := runPS(s.script); err != nil {
			fmt.Println("⚠ skipped")
		} else {
			fmt.Println("✓")
		}
	}
}

// ── Docker ────────────────────────────────────────────────────────────────────

func dockerRunning() bool {
	if _, err := exec.LookPath("docker"); err != nil {
		return false
	}
	return exec.Command("docker", "info").Run() == nil
}

func ensureDocker(r *bufio.Reader) {
	if dockerRunning() {
		ok("Docker Desktop already running")
		return
	}

	fmt.Println("  Docker Desktop not detected. Downloading installer...")
	tmp := filepath.Join(os.TempDir(), "DockerDesktopInstaller.exe")
	if err := downloadFile(tmp, dockerDLURL); err != nil {
		die("Download failed: " + err.Error())
	}

	fmt.Println("  Launching Docker Desktop installer.")
	fmt.Println("  Enable WSL2 integration if prompted, then finish the wizard.")
	cmd := exec.Command(tmp, "install", "--accept-license", "--backend=wsl-2")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()

	fmt.Print("\n  Press Enter once Docker Desktop is running (whale icon in taskbar)...")
	r.ReadString('\n')

	fmt.Print("  Waiting for Docker daemon")
	for i := 0; i < 36; i++ {
		if dockerRunning() {
			fmt.Println()
			ok("Docker Desktop ready")
			return
		}
		fmt.Print(".")
		time.Sleep(5 * time.Second)
	}
	fmt.Println()
	die("Docker did not start within 3 minutes. Launch it manually then re-run this installer.")
}

func dockerLogin(cfg bootstrapData) {
	if cfg.GithubToken == "" {
		fmt.Println("  ⚠ No GitHub token in config — skipping ghcr.io login.")
		return
	}
	cmd := exec.Command("docker", "login", "ghcr.io",
		"-u", githubOwner,
		"--password-stdin",
	)
	cmd.Stdin = strings.NewReader(cfg.GithubToken)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Println("  ⚠ ghcr.io login failed — images may fail to pull if they are private.")
	} else {
		ok("Logged in to ghcr.io as " + githubOwner)
	}
}

// ── File writing ──────────────────────────────────────────────────────────────

func writeEnv(serverID, bootstrapKey string, cfg bootstrapData) {
	clientAPIURL := cfg.ClientAPIURL
	if clientAPIURL == "" {
		clientAPIURL = defaultAPIURL
	}
	remotePort := cfg.RemoteDbPort
	if remotePort == 0 {
		remotePort = 5432
	}

	content := fmt.Sprintf(`# MeterItPro Sync Server — generated by installer %s

GITHUB_OWNER=`+githubOwner+`

# Local PostgreSQL (auto-generated credentials, do not share)
POSTGRES_SYNC_DB=syncdb
POSTGRES_SYNC_USER=syncuser
POSTGRES_SYNC_PASSWORD=%s

# Remote Client Database
POSTGRES_CLIENT_HOST=%s
POSTGRES_CLIENT_PORT=%d
POSTGRES_CLIENT_DB=%s
POSTGRES_CLIENT_USER=%s
POSTGRES_CLIENT_PASSWORD=%s

# Auth
JWT_SECRET=%s
CLIENT_API_KEY=%s

# API + Provisioner
CLIENT_API_URL=%s
SYNC_SERVER_ID=%s
SYNC_SERVER_BOOTSTRAP_KEY=%s

# BACnet
MCP_HTTP_PORT=3003
BACNET_DEBUG_POST_READ_CHECK=false
`,
		time.Now().Format("2006-01-02 15:04:05"),
		randHex(16),
		cfg.RemoteDbHost,
		remotePort,
		cfg.RemoteDbName,
		cfg.RemoteDbUser,
		cfg.RemoteDbPassword,
		randHex(32),
		cfg.ApiKey,
		clientAPIURL,
		serverID,
		bootstrapKey,
	)

	writeFile(filepath.Join(installDir, ".env"), []byte(content), 0600)
	ok(".env written")
}

func compose(args ...string) {
	cmd := exec.Command("docker", append([]string{"compose"}, args...)...)
	cmd.Dir = installDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		die("docker compose " + strings.Join(args, " ") + " failed: " + err.Error())
	}
}

// ── Admin elevation ───────────────────────────────────────────────────────────

func isAdmin() bool {
	return exec.Command("net", "session").Run() == nil
}

func elevate() {
	exe, _ := os.Executable()
	script := fmt.Sprintf(`Start-Process -FilePath "%s" -Verb RunAs`, exe)
	if err := exec.Command("powershell", "-Command", script).Run(); err != nil {
		die("Could not request administrator privileges: " + err.Error())
	}
	os.Exit(0)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

func runPS(script string) error {
	return exec.Command("powershell", "-NonInteractive", "-Command", script).Run()
}

func downloadFile(dest, url string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, resp.Body)
	return err
}

func randHex(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func mustMkdir(path string) {
	if err := os.MkdirAll(path, 0755); err != nil {
		die("Cannot create directory " + path + ": " + err.Error())
	}
}

func writeFile(path string, data []byte, mode os.FileMode) {
	if err := os.WriteFile(path, data, mode); err != nil {
		die("Cannot write " + path + ": " + err.Error())
	}
}

func ask(r *bufio.Reader, label string) string {
	fmt.Printf("  %s: ", label)
	s, _ := r.ReadString('\n')
	return strings.TrimSpace(s)
}

func step(n int, label string) {
	fmt.Printf("\n[Step %d] %s\n", n, label)
	fmt.Println("  " + strings.Repeat("─", len(label)+2))
}

func ok(msg string)  { fmt.Printf("  ✓ %s\n", msg) }

func die(msg string) {
	fmt.Fprintln(os.Stderr, "\n  ✗ ERROR:", msg)
	fmt.Fprintln(os.Stderr, "\n  Press Enter to exit...")
	bufio.NewReader(os.Stdin).ReadString('\n')
	os.Exit(1)
}

func printBanner() {
	fmt.Print(`
╔════════════════════════════════════════════════════════╗
║       MeterItPro — Sync Server Setup                   ║
╠════════════════════════════════════════════════════════╣
║  This wizard will:                                     ║
║   1. Configure Windows for 24/7 server operation       ║
║   2. Install Docker Desktop (if not already installed) ║
║   3. Authenticate with GitHub Container Registry       ║
║   4. Deploy all sync server containers                 ║
║   5. Activate your Cloudflare Tunnel automatically     ║
╚════════════════════════════════════════════════════════╝

`)
}

func printDone() {
	fmt.Print(`
╔════════════════════════════════════════════════════════╗
║  ✓  Setup complete!                                    ║
║                                                        ║
║  All services are starting. Your Cloudflare tunnel     ║
║  will activate automatically within ~60 seconds.       ║
║                                                        ║
║  To check status, run:                                 ║
║    docker compose -f                                   ║
║    C:\MeterItPro\SyncServer\docker-compose.yml ps      ║
║                                                        ║
║  To view logs:                                         ║
║    docker compose -f                                   ║
║    C:\MeterItPro\SyncServer\docker-compose.yml logs -f ║
╚════════════════════════════════════════════════════════╝
`)
}
