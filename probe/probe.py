import time
import os
import subprocess
import re
import socket
import logging
import urllib.request
import requests
import speedtest

# Configuration
API_BASE_URL = "http://127.0.0.1:5001"
PING_INTERVAL = 30 # seconds
SPEEDTEST_INTERVAL_MULTIPLIER = 10 # Ru speedtest every 10 pings (300 sec = 5 mins)

# Set logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class NetworkProbe:
    def __init__(self):
        self.hostname = socket.gethostname()
        self.token = None
        self.total_checks = 0
        self.successful_checks = 0
        
    def authenticate(self):
        """Authenticate as guest and get JWT token from the backend"""
        try:
            logging.info("Attempting guest authentication...")
            resp = requests.post(f"{API_BASE_URL}/auth/GuestLogin")
            if resp.status_code == 200:
                self.token = resp.json().get('token')
                logging.info(f"Successfully authenticated as {resp.json().get('username')}")
                return True
            else:
                logging.error(f"Authentication failed: {resp.text}")
                return False
        except Exception as e:
            logging.error(f"Failed to connect to API for authentication: {str(e)}")
            return False

    def check_network_metrics(self, run_speedtest=False):
        """Run tests for latency, packet loss, bandwidth, and uptime"""
        metrics = {
            "latency_ms": 0.0,
            "packet_loss_percent": 100.0,
            "upload_mbps": 0.0,
            "download_mbps": 0.0,
            "uptime_percent": 0.0,
            "connected_devices": 1, # Default placeholder
            "site": self.hostname,
            "interface": "Default",
            "observed_at": int(time.time()),
            "created_at": int(time.time())
        }

        # 1. Ping test (Latency & Packet Loss)
        param = '-n' if os.name == 'nt' else '-c'
        command = ['ping', param, '4', '8.8.8.8']
        
        try:
            output = subprocess.check_output(command, stderr=subprocess.STDOUT, universal_newlines=True)
            
            # Loss parse
            loss_match = re.search(r'(\d+)%\s*(?:packet)?\s*loss', output, re.IGNORECASE)
            if loss_match:
                metrics["packet_loss_percent"] = float(loss_match.group(1))
            else:
                metrics["packet_loss_percent"] = 0.0
                
            # Latency parse
            if os.name == 'nt':
                lat_match = re.search(r'Average\s*=\s*(\d+)ms', output, re.IGNORECASE)
                if lat_match:
                    metrics["latency_ms"] = float(lat_match.group(1))
            else:
                lat_match = re.search(r'min/avg/max/[mdev|stddev]+ = [\d\.]+/([\d\.]+)/', output)
                if lat_match:
                    metrics["latency_ms"] = float(lat_match.group(1))
            
            self.total_checks += 1
            if metrics["packet_loss_percent"] < 100:
                self.successful_checks += 1

        except subprocess.CalledProcessError as e:
            self.total_checks += 1
            logging.warning("Ping command returned an error (likely 100% loss).")

        # Uptime %
        if self.total_checks > 0:
            metrics["uptime_percent"] = round((self.successful_checks / self.total_checks) * 100, 2)

        # 2. Speedtest (Bandwidth)
        if run_speedtest:
            logging.info("Running speedtest (this takes a moment)...")
            try:
                st = speedtest.Speedtest()
                st.get_best_server()
                download_speed = st.download()
                upload_speed = st.upload()
                
                # Convert to Mbps
                metrics["download_mbps"] = round(download_speed / 1_000_000, 2)
                metrics["upload_mbps"] = round(upload_speed / 1_000_000, 2)
                logging.info(f"Speedtest complete: {metrics['download_mbps']} Mbps down, {metrics['upload_mbps']} Mbps up.")
            except speedtest.SpeedtestException as e:
                logging.error(f"Failed to run speedtest: {e}")
        else:
             metrics["download_mbps"] = 0.0
             metrics["upload_mbps"] = 0.0

        return metrics

    def send_metrics(self, metrics):
        """Submit data to backend"""
        if not self.token:
            if not self.authenticate():
                return
                
        headers = {
            "x-access-token": self.token
        }
        
        try:
            res = requests.post(f"{API_BASE_URL}/network-health", data=metrics, headers=headers)
            if res.status_code == 201:
                logging.info(f"Successfully recorded metrics. Record ID: {res.json().get('record_id')}")
            elif res.status_code in [401, 403]:
                logging.warning("Token expired or invalid, re-authenticating...")
                self.token = None # Reset token and let it retry next loop
            else:
                logging.error(f"Failed to record metrics: {res.status_code} - {res.text}")
        except Exception as e:
            logging.error(f"Failed to push metrics to API: {e}")
        

    def run(self):
        logging.info("Starting lightweight network probe...")
        logging.info(f"Site configured as: {self.hostname}")
        
        loop_counter = 0
        while True:
            # Run speedtest every SPEEDTEST_INTERVAL_MULTIPLIER runs
            do_speedtest = (loop_counter % SPEEDTEST_INTERVAL_MULTIPLIER == 0)
            
            metrics = self.check_network_metrics(run_speedtest=do_speedtest)
            
            logging.info(f"Lat: {metrics['latency_ms']} ms | Loss: {metrics['packet_loss_percent']}% | Up%: {metrics['uptime_percent']}%")
            self.send_metrics(metrics)
            
            loop_counter += 1
            time.sleep(PING_INTERVAL)

if __name__ == '__main__':
    probe = NetworkProbe()
    probe.run()
