package main

import (
	"bufio"
	"crypto/rand"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
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
	defaultAPIURL = "https://meteritpro.com/api"
	githubOwner   = "emil-guirguis"
)

var (
	installDir   string
	buildVersion = "dev"
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
	switch runtime.GOOS {
	case "windows":
		installDir = `C:\MeterItPro\SyncServer`
	case "linux":
		installDir = "/opt/meteritpro"
	default:
		die("Unsupported OS: " + runtime.GOOS + ". Only Windows and Ubuntu Linux are supported.")
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

	step(2, "Network Check")
	checkNetwork(r)

	step(3, "Fetching configuration from MeterItPro")
	cfg := fetchBootstrap(serverID, bootstrapKey)
	ok("Config received")

	step(4, "Configuring system for 24/7 operation")
	hardenSystem()

	step(5, "Docker")
	ensureDocker(r)

	step(6, "Authenticating with GitHub Container Registry")
	dockerLogin(cfg)

	step(7, "Writing install files")
	mustMkdir(installDir)
	mustMkdir(filepath.Join(installDir, "docker", "init"))
	writeEnv(serverID, bootstrapKey, cfg)
	writeFile(filepath.Join(installDir, "docker-compose.yml"), dockerComposeYML, 0644)
	writeFile(filepath.Join(installDir, "docker", "init", "00-schema.sql"), schemaSQL, 0644)
	ok("Files written to " + installDir)

	step(8, "Pulling Docker images  (this may take several minutes)")
	compose("pull")

	step(9, "Starting all services")
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

// ── Network check ─────────────────────────────────────────────────────────────

func checkNetwork(r *bufio.Reader) {
	if isEthernetConnected() {
		ok("Wired ethernet connected — skipping WiFi setup")
		return
	}
	fmt.Println("  Setting up WiFi (this server has no wired connection).")
	fmt.Println()
	setupWifi(r)
}

func isEthernetConnected() bool {
	ifaces, err := net.Interfaces()
	if err != nil {
		return false
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		if isWireless(iface.Name) {
			continue
		}
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && ipnet.IP.To4() != nil && !ipnet.IP.IsLoopback() {
				return true
			}
		}
	}
	return false
}

func isWireless(name string) bool {
	if runtime.GOOS == "linux" {
		_, err := os.Stat(filepath.Join("/sys/class/net", name, "wireless"))
		return err == nil
	}
	// Windows: interface appears in 'netsh wlan show interfaces' if it's WiFi
	out := runOutput("netsh", "wlan", "show", "interfaces")
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(strings.ToLower(line), "name") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 && strings.TrimSpace(parts[1]) == name {
				return true
			}
		}
	}
	return false
}

func setupWifi(r *bufio.Reader) {
	var configured bool
	if runtime.GOOS == "linux" {
		configured = setupWifiLinux(r)
	} else {
		configured = setupWifiWindows(r)
	}
	if !configured {
		return
	}
	fmt.Print("  Verifying internet connectivity")
	for i := 0; i < 12; i++ {
		resp, err := http.Get("https://meteritpro.com")
		if err == nil {
			resp.Body.Close()
			fmt.Println()
			ok("Internet connected via WiFi")
			time.Sleep(4 * time.Second)
			return
		}
		fmt.Print(".")
		time.Sleep(5 * time.Second)
	}
	fmt.Println()
	die("WiFi connected but cannot reach internet. Check credentials and try again.")
}

// setupWifiLinux configures WiFi using only tools present on a fresh Ubuntu
// Server install (no internet required): netplan + wpa_supplicant for the
// connection, iw for scanning. The config is written to /etc/netplan so it
// persists across reboots.
func setupWifiLinux(r *bufio.Reader) bool {
	wlan := wifiInterfaceLinux()
	if wlan == "" {
		fmt.Println("  ⚠  No WiFi adapter detected — cannot continue (this server is WiFi-only).")
		die("No WiFi adapter found. Check the adapter is seated, then re-run.")
	}

	// Bring the radio up so scanning and association work.
	exec.Command("ip", "link", "set", wlan, "up").Run()

	fmt.Println("  Scanning for WiFi networks...")
	networks := scanWifiLinux(wlan)
	if len(networks) > 0 {
		fmt.Println("  Available networks:")
		for _, ssid := range networks {
			fmt.Printf("    %s\n", ssid)
		}
		fmt.Println()
	} else {
		fmt.Println("  (No networks listed — you can still type the SSID manually.)")
		fmt.Println()
	}

	ssid := ask(r, "WiFi Network Name (SSID)")
	if ssid == "" {
		die("No SSID entered. This server is WiFi-only and needs a network to continue.")
	}
	password := ask(r, "WiFi Password          ")

	if err := writeWifiNetplan(wlan, ssid, password); err != nil {
		die("Cannot write WiFi config: " + err.Error())
	}

	fmt.Printf("  %-58s", "Applying WiFi configuration...")
	exec.Command("netplan", "generate").Run()
	if err := exec.Command("netplan", "apply").Run(); err != nil {
		fmt.Println("✗")
		die("netplan apply failed: " + err.Error())
	}
	fmt.Println("✓")
	// Give wpa_supplicant a moment to associate and DHCP to lease.
	time.Sleep(3 * time.Second)
	return true
}

// wifiInterfaceLinux returns the first wireless interface name, or "".
func wifiInterfaceLinux() string {
	entries, err := os.ReadDir("/sys/class/net")
	if err != nil {
		return ""
	}
	for _, e := range entries {
		if _, err := os.Stat(filepath.Join("/sys/class/net", e.Name(), "wireless")); err == nil {
			return e.Name()
		}
	}
	return ""
}

// scanWifiLinux returns nearby SSIDs. It uses wpa_cli (shipped with
// wpasupplicant, which is on the Server ISO); iw is NOT on the ISO so it is not
// relied upon. Any failure yields nil — the caller still lets the user type an
// SSID manually.
func scanWifiLinux(wlan string) []string {
	// Start a throwaway wpa_supplicant just for scanning. netplan/networkd has
	// no wifi config yet at this point, so nothing else owns the interface.
	conf := filepath.Join(os.TempDir(), "wpa-scan.conf")
	if err := os.WriteFile(conf, []byte("ctrl_interface=/run/wpa_supplicant\n"), 0600); err != nil {
		return nil
	}
	defer os.Remove(conf)
	exec.Command("wpa_supplicant", "-B", "-i", wlan, "-c", conf).Run()
	// Always tear it down before netplan apply brings up its own supplicant.
	defer exec.Command("wpa_cli", "-i", wlan, "terminate").Run()

	exec.Command("wpa_cli", "-i", wlan, "scan").Run()
	time.Sleep(3 * time.Second)
	out := runOutput("wpa_cli", "-i", wlan, "scan_results")

	var ssids []string
	seen := map[string]bool{}
	for _, line := range strings.Split(out, "\n") {
		// Format: bssid \t freq \t signal \t flags \t ssid
		fields := strings.Split(line, "\t")
		if len(fields) < 5 {
			continue
		}
		s := strings.TrimSpace(fields[4])
		if s != "" && !seen[s] {
			seen[s] = true
			ssids = append(ssids, s)
		}
	}
	return ssids
}

// writeWifiNetplan writes a netplan config that systemd-networkd +
// wpa_supplicant use to join the network on this and every future boot.
func writeWifiNetplan(wlan, ssid, password string) error {
	cfg := fmt.Sprintf(`network:
  version: 2
  wifis:
    %s:
      dhcp4: true
      optional: true
      access-points:
        "%s":
          password: "%s"
`, wlan, ssid, password)
	if err := os.MkdirAll("/etc/netplan", 0755); err != nil {
		return err
	}
	return os.WriteFile("/etc/netplan/99-meteritpro-wifi.yaml", []byte(cfg), 0600)
}

func setupWifiWindows(r *bufio.Reader) bool {
	ssid := ask(r, "WiFi Network Name (SSID) — leave blank to skip")
	if ssid == "" {
		ok("Skipping WiFi")
		return false
	}
	password := ask(r, "WiFi Password          ")

	profileXML := fmt.Sprintf(`<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>%s</name>
    <SSIDConfig><SSID><name>%s</name></SSID></SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM><security>
        <authEncryption>
            <authentication>WPA2PSK</authentication>
            <encryption>AES</encryption>
            <useOneX>false</useOneX>
        </authEncryption>
        <sharedKey>
            <keyType>passPhrase</keyType>
            <protected>false</protected>
            <keyMaterial>%s</keyMaterial>
        </sharedKey>
    </security></MSM>
</WLANProfile>`, ssid, ssid, password)

	profilePath := filepath.Join(os.TempDir(), "meteritpro-wifi.xml")
	if err := os.WriteFile(profilePath, []byte(profileXML), 0600); err != nil {
		die("Cannot write WiFi profile: " + err.Error())
	}
	defer os.Remove(profilePath)

	fmt.Printf("  %-58s", "Adding WiFi profile...")
	if err := exec.Command("netsh", "wlan", "add", "profile", "filename="+profilePath).Run(); err != nil {
		fmt.Println("✗")
		die("Cannot add WiFi profile.")
	}
	fmt.Println("✓")

	fmt.Printf("  %-58s", "Connecting to "+ssid+"...")
	if err := exec.Command("netsh", "wlan", "connect", "name="+ssid).Run(); err != nil {
		fmt.Println("✗")
		die("WiFi connection failed. Check SSID and password.")
	}
	fmt.Println("✓")
	return true
}

// ── System hardening ──────────────────────────────────────────────────────────

func hardenSystem() {
	if runtime.GOOS == "windows" {
		hardenWindows()
	} else {
		hardenLinux()
	}
}

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

func hardenLinux() {
	cmds := []struct {
		label string
		args  []string
	}{
		{
			"Disable sleep and suspend",
			[]string{"systemctl", "mask", "sleep.target", "suspend.target", "hibernate.target", "hybrid-sleep.target"},
		},
		{
			"Enable Docker service on boot",
			[]string{"systemctl", "enable", "docker"},
		},
	}

	for _, c := range cmds {
		fmt.Printf("  %-58s", c.label+"...")
		if err := exec.Command(c.args[0], c.args[1:]...).Run(); err != nil {
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
		ok("Docker already running")
		return
	}

	if runtime.GOOS == "windows" {
		ensureDockerWindows(r)
	} else {
		ensureDockerLinux()
	}
}

func ensureDockerWindows(r *bufio.Reader) {
	const dockerDLURL = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
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

func ensureDockerLinux() {
	fmt.Println("  Installing Docker Engine from official Docker repository...")

	prereqs := []struct {
		label string
		args  []string
	}{
		{"Update apt", []string{"apt-get", "update", "-qq"}},
		{"Install prerequisites", []string{"apt-get", "install", "-y", "-qq", "ca-certificates", "curl"}},
		{"Create keyrings directory", []string{"install", "-m", "0755", "-d", "/etc/apt/keyrings"}},
	}
	for _, s := range prereqs {
		fmt.Printf("  %-58s", s.label+"...")
		cmd := exec.Command(s.args[0], s.args[1:]...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			die(s.label + " failed: " + err.Error())
		}
		fmt.Println("✓")
	}

	fmt.Printf("  %-58s", "Add Docker GPG key...")
	if err := downloadFile("/etc/apt/keyrings/docker.asc", "https://download.docker.com/linux/ubuntu/gpg"); err != nil {
		die("Failed to download Docker GPG key: " + err.Error())
	}
	exec.Command("chmod", "a+r", "/etc/apt/keyrings/docker.asc").Run()
	fmt.Println("✓")

	codename := strings.TrimSpace(runOutput("sh", "-c", `. /etc/os-release && echo "$VERSION_CODENAME"`))
	if codename == "" {
		codename = "noble"
	}
	arch := strings.TrimSpace(runOutput("dpkg", "--print-architecture"))
	if arch == "" {
		arch = "amd64"
	}

	repoLine := fmt.Sprintf(
		"deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n",
		arch, codename,
	)
	fmt.Printf("  %-58s", "Add Docker apt repository...")
	if err := os.WriteFile("/etc/apt/sources.list.d/docker.list", []byte(repoLine), 0644); err != nil {
		die("Cannot write docker.list: " + err.Error())
	}
	fmt.Println("✓")

	fmt.Printf("  %-58s", "Update apt cache...")
	cmd := exec.Command("apt-get", "update", "-qq")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		die("apt-get update failed: " + err.Error())
	}
	fmt.Println("✓")

	fmt.Printf("  %-58s", "Install Docker Engine + Compose plugin...")
	cmd = exec.Command("apt-get", "install", "-y", "-qq",
		"docker-ce", "docker-ce-cli", "containerd.io",
		"docker-buildx-plugin", "docker-compose-plugin")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		die("Docker install failed: " + err.Error())
	}
	fmt.Println("✓")

	fmt.Printf("  %-58s", "Start Docker service...")
	if err := exec.Command("systemctl", "start", "docker").Run(); err != nil {
		die("Could not start Docker: " + err.Error())
	}
	fmt.Println("✓")

	fmt.Print("  Waiting for Docker daemon")
	for i := 0; i < 12; i++ {
		if dockerRunning() {
			fmt.Println()
			ok("Docker Engine ready")
			return
		}
		fmt.Print(".")
		time.Sleep(5 * time.Second)
	}
	fmt.Println()
	die("Docker did not start within 60 seconds.")
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

	githubUser := cfg.GithubOwner
	if githubUser == "" {
		githubUser = githubOwner
	}

	content := fmt.Sprintf(`# MeterItPro Sync Server — generated by installer %s

GITHUB_OWNER=`+githubOwner+`
GITHUB_USER=%s
GITHUB_TOKEN=%s

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
		githubUser,
		cfg.GithubToken,
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
	if runtime.GOOS == "windows" {
		return exec.Command("net", "session").Run() == nil
	}
	return os.Geteuid() == 0
}

func elevate() {
	if runtime.GOOS == "windows" {
		exe, _ := os.Executable()
		script := fmt.Sprintf(`Start-Process -FilePath "%s" -Verb RunAs`, exe)
		exec.Command("powershell", "-Command", script).Run()
	} else {
		exe, _ := os.Executable()
		cmd := exec.Command("sudo", exe)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
	}
	os.Exit(0)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

func runPS(script string) error {
	return exec.Command("powershell", "-NonInteractive", "-Command", script).Run()
}

func runOutput(name string, args ...string) string {
	out, _ := exec.Command(name, args...).Output()
	return string(out)
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

func ok(msg string) { fmt.Printf("  ✓ %s\n", msg) }

func die(msg string) {
	fmt.Fprintln(os.Stderr, "\n  ✗ ERROR:", msg)
	fmt.Fprintln(os.Stderr, "\n  Press Enter to exit...")
	bufio.NewReader(os.Stdin).ReadString('\n')
	os.Exit(1)
}

func printBanner() {
	platform := "Windows"
	if runtime.GOOS == "linux" {
		platform = "Ubuntu Linux"
	}

	hostname := ""
	if runtime.GOOS == "linux" {
		hostname = strings.TrimSpace(runOutput("hostname"))
	}

	fmt.Print("\033[2J\033[H") // clear screen
	fmt.Printf(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          MeterItPro  —  Sync Server Installer              ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Version  : %-47s║
║  Platform : %-47s║
`, buildVersion, platform)

	if hostname != "" {
		fmt.Printf("║  Server   : %-47s║\n", hostname)
	}

	fmt.Print(`║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  This wizard will:                                         ║
║   1. Check network (ethernet / WiFi setup)                 ║
║   2. Fetch configuration from MeterItPro cloud             ║
║   3. Configure system for 24/7 operation                   ║
║   4. Install Docker                                        ║
║   5. Deploy all sync server containers                     ║
║   6. Activate your Cloudflare Tunnel                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

`)

	time.Sleep(4 * time.Second)
}

func printDone() {
	if runtime.GOOS == "windows" {
		fmt.Print(`
╔════════════════════════════════════════════════════════╗
║  ✓  Setup complete!                                    ║
║                                                        ║
║  All services are starting. Your Cloudflare tunnel     ║
║  will activate automatically within ~60 seconds.       ║
║                                                        ║
║  To check status:                                      ║
║    docker compose -f                                   ║
║    C:\MeterItPro\SyncServer\docker-compose.yml ps      ║
║                                                        ║
║  To view logs:                                         ║
║    docker compose -f                                   ║
║    C:\MeterItPro\SyncServer\docker-compose.yml logs -f ║
╚════════════════════════════════════════════════════════╝
`)
	} else {
		hostname := strings.TrimSpace(runOutput("hostname"))
		fmt.Printf(`
╔════════════════════════════════════════════════════════╗
║  ✓  Setup complete!                                    ║
║                                                        ║
║  Server Name: %-41s║
║                                                        ║
║  All services are starting. Your Cloudflare tunnel     ║
║  will activate automatically within ~60 seconds.       ║
║                                                        ║
║  To check status:                                      ║
║    docker compose -f                                   ║
║    /opt/meteritpro/docker-compose.yml ps               ║
║                                                        ║
║  To view logs:                                         ║
║    docker compose -f                                   ║
║    /opt/meteritpro/docker-compose.yml logs -f          ║
╚════════════════════════════════════════════════════════╝
`, hostname)
	}
}
