# Admin Live Monitor Implementation Plan

**Component**: `AdminLiveUsers.tsx`
**Route**: `/admin/live`

## Purpose
Real-time view of what's happening on the system right now.

## Features
*   [ ] **Active Sessions**: Who is online?
*   [ ] **Current Jobs**: How many traffic bots are running?
*   [ ] **Error Rate**: Any spikes in failed requests?

## Planned Improvements
*   [ ] **Traffic Map**: Visual world map of active bot locations.
*   [ ] **Kill Switch**: Emergency stop button for all bot activity.
*   [ ] **Log Stream**: Live tail of backend server logs.
*   [ ] **Memory Usage Graph**: Backend RAM usage over time.
*   [ ] **Bot Version**: Show distribution of bot versions active in the wild.
*   [ ] **Node Health**: "Worker-1: OK, Worker-2: HIGH LOAD".
*   [ ] **Bot Screenshot**: Randomly capture a screenshot from a running bot for QA.
*   [ ] **Latency**: "Average time to first byte" for bots.
*   [ ] **Active URLs**: List of which URLs are currently receiving the most traffic.
*   [ ] **Queue Depth**: "5000 jobs waiting in Redis queue".
*   [ ] **Worker Restart**: Trigger restart of worker process.
*   [ ] **CPU Temperature**: If available from hardware sensors.
*   [ ] **Disk Space**: "% Free on /var/log" warning.
*   [ ] **Database Connections**: Number of active Postgres connections.
*   [ ] **Failed Login Feed**: Stream of failed login attempts.
*   [ ] **New User Feed**: Stream of new signups.
*   [ ] **Payment Feed**: Stream of incoming payments.
*   [ ] **Bandwidth**: "Current network usage: 50 Mbps".
*   [ ] **Bot Success Rate**: Percentage of successful vs failed hits.
*   [ ] **Thread Count**: Number of active Python threads/processes.
*   [ ] **Uptime**: "System up for 14 days".
*   [ ] **Cache Hit Rate**: Redis hit/miss ratio percentage.
*   [ ] **Api Response Time**: Avg/P95/P99 latency histogram.
*   [ ] **Slow Queries**: List of SQL queries taking > 1 sec.
*   [ ] **Locked Rows**: Number of deadlocks or row locks in DB.
*   [ ] **Worker Threads**: Breakdown of what each thread is doing.
*   [ ] **Job Throughput**: "Processed 500 jobs/sec".
*   [ ] **Error Distribution**: Pie chart of 500 vs 502 vs 504 errors.
*   [ ] **Mobile vs Desktop**: Live ratio of user-agent types.
*   [ ] **Realtime Visitors**: "15 users on dashboard right now".
*   [ ] **Alert History**: Log of recent system alerts fired.
*   [ ] **Email Queue**: "50 emails waiting to send".
*   [ ] **Webhook Queue**: "10 webhooks failing".
*   [ ] **Cron History**: Result of last 5 cron job runs.
*   [ ] **S3 Usage**: Storage used in S3 bucket.
*   [ ] **Bot IP**: "Most used proxy IP address" (check for bans).
*   [ ] **Open FDs**: Number of open file descriptors.
*   [ ] **GC Stats**: Garbage collection frequency/pause time.
*   [ ] **System Load**: 1m, 5m, 15m load averages.
*   [ ] **Geonode Balance**: "Proxy credit balance" (if using API).
*   [ ] **DDoS Attack**: "Unusual spike in request rate" warning.
*   [ ] **WAF Events**: Blocked malicious requests count.
*   [ ] **DNS Latency**: Time to resolve target domains.
*   [ ] **SSL Handshake**: Time to negotiate TLS.
*   [ ] **Proxy Latency**: Speed of upstream proxy providers.
*   [ ] **Bot CPU**: CPU usage of individual bot processes.
*   [ ] **Zombies**: Detect "stuck" processes that need killing.
*   [ ] **Heap Dump**: Button to trigger and download memory heap.

