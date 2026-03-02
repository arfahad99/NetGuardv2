#!/usr/bin/env python3
"""
NetworkPro Probe — measures real network performance and
sends results to the Flask backend every INTERVAL_SECONDS.
"""

import os, time, datetime, socket, logging
import requests, schedule
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL   = os.getenv('BACKEND_URL',   'http://localhost:5001/probe/submit')
API_KEY        = os.getenv('PROBE_API_KEY',  'changeme')
DEVICE_ID      = os.getenv('DEVICE_ID',      'home-probe-01')
INTERVAL       = int(os.getenv('INTERVAL_SECONDS', 30))
PING_TARGET    = os.getenv('PING_TARGET',    '8.8.8.8')
PING_COUNT     = int(os.getenv('PING_COUNT',  10))

logging.basicConfig(level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# MEASUREMENT FUNCTIONS
# ─────────────────────────────────────────────────────────────

def measure_latency_and_loss():
    """Send PING_COUNT pings, return (avg_ms, loss_pct)."""
    try:
        from icmplib import ping as icmp_ping
        host = icmp_ping(PING_TARGET, count=PING_COUNT, interval=0.2, timeout=2)
        avg  = round(host.avg_rtt, 2)
        loss = round(host.packet_loss * 100, 2)
        return avg, loss
    except Exception as e:
        log.warning(f'ICMP ping failed: {e} — falling back to TCP')
        # TCP fallback (no root required)
        times = []
        for _ in range(PING_COUNT):
            try:
                t0 = time.time()
                s  = socket.create_connection((PING_TARGET, 80), timeout=2)
                s.close()
                times.append((time.time() - t0) * 1000)
            except: times.append(None)
        good = [t for t in times if t is not None]
        if not good: return None, 100.0
        return round(sum(good)/len(good),2), round((1-len(good)/len(times))*100,2)

def measure_bandwidth():
    """Download a 5 MB test file and measure speed in Mbps."""
    try:
        import speedtest
        st = speedtest.Speedtest(secure=True)
        st.get_best_server()
        dl = round(st.download() / 1_000_000, 2)
        ul = round(st.upload()   / 1_000_000, 2)
        return dl, ul
    except Exception as e:
        log.warning(f'speedtest failed: {e} — using HTTP fallback')
        # HTTP fallback: time a 5 MB download
        try:
            url = 'https://speed.cloudflare.com/__down?bytes=5000000'
            t0  = time.time()
            r   = requests.get(url, timeout=10)
            elapsed = time.time() - t0
            size_mb = len(r.content) / 1_000_000
            dl = round((size_mb * 8) / elapsed, 2)
            return dl, 0.0   # upload not measured in fallback
        except: return None, None

def measure_uptime():
    """Check if internet is reachable."""
    try:
        socket.create_connection(('8.8.8.8', 53), timeout=3).close()
        return 'online'
    except: return 'offline'

# ─────────────────────────────────────────────────────────────
# MAIN MEASUREMENT + SEND CYCLE
# ─────────────────────────────────────────────────────────────

def run_measurement():
    log.info('--- Running measurement ---')

    latency_ms, packet_loss = measure_latency_and_loss()
    download_mbps, upload_mbps = measure_bandwidth()
    uptime = measure_uptime()

    payload = {
        'deviceId':     DEVICE_ID,
        'timestamp':    datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'latencyMs':    latency_ms    or 0,
        'packetLoss':   packet_loss   or 0,
        'downloadMbps': download_mbps or 0,
        'uploadMbps':   upload_mbps   or 0,
        'uptimeStatus': uptime,
    }

    log.info(f'Latency: {payload["latencyMs"]} ms  |  '
             f'Loss: {payload["packetLoss"]}%  |  '
             f'DL: {payload["downloadMbps"]} Mbps')

    # Send to Flask backend — retry up to 3 times
    for attempt in range(1, 4):
        try:
            r = requests.post(
                BACKEND_URL,
                json    = payload,
                headers = {'x-api-key': API_KEY, 'Content-Type': 'application/json'},
                timeout = 10
            )
            if r.status_code == 201:
                log.info(f'Sent OK (attempt {attempt})')
                return
            else:
                log.warning(f'Backend returned {r.status_code}: {r.text}')
        except requests.RequestException as e:
            log.warning(f'Send attempt {attempt} failed: {e}')
            time.sleep(2)

    log.error('All 3 send attempts failed — measurement dropped')

# ─────────────────────────────────────────────────────────────
# SCHEDULER ENTRY POINT
# ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    log.info(f'Probe starting — device: {DEVICE_ID}, interval: {INTERVAL}s')
    run_measurement()                          # run immediately on start
    schedule.every(INTERVAL).seconds.do(run_measurement)
    while True:
        schedule.run_pending()
        time.sleep(1)
