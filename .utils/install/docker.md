Making Docker Autostart
To ensure your containers come back online automatically, you need to handle two things: the Docker application itself and the individual containers. 
A. Start Docker on Boot 
Ensure the Docker Desktop application is set to start when you sign in: 
Open Docker Desktop Settings (gear icon).
Under the General tab, check the box for "Start Docker Desktop when you sign in to your computer". 
Reddit
Reddit
 +1
B. Set Container Restart Policies 
Docker containers do not restart by default after a reboot unless they have a Restart Policy. You can set this when creating a container or update an existing one. 
OneUptime
OneUptime
 +1
For a new container: Use the --restart flag.
bash
docker run -d --restart unless-stopped [image_name]
Use code with caution.
For an existing container: Use the update command.
bash
docker update --restart unless-stopped [container_id_or_name]
Use code with caution.
To update ALL your containers at once:
bash
docker update --restart unless-stopped $(docker ps -q)
Use code with caution.



1. Disable via Command Prompt (No Right-Click Needed) 
Press the Windows Key, type cmd, then press Ctrl + Shift + Enter to open it as an Administrator.
Type the following commands one by one, pressing Enter after each:

sc stop wuauserv (Stops the Windows Update service)
sc config wuauserv start= disabled (Disables it permanently; note the space after start=)
sc stop bits (Stops the Background Intelligent Transfer Service)
sc config bits start= disabled 