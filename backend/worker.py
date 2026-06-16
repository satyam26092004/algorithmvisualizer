import os
from rq import Worker, Queue
from redis import Redis as Valkey

redis_url = os.getenv("REDIS_URL")
if redis_url:
    redis_url = redis_url.strip()
    valkey_conn = Valkey.from_url(redis_url)
    print("🔌 Worker connected to Valkey via connection URL string.")
else:
    redis_host = os.getenv("REDIS_HOST", "127.0.0.1")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    valkey_conn = Valkey(host=redis_host, port=redis_port)
    print(f"🔌 Worker connected to Valkey at {redis_host}:{redis_port}.")

listen = ['default']

if __name__ == '__main__':
    print("🚀 Starting Valkey RQ Background Worker...")
    queues = [Queue(name, connection=valkey_conn) for name in listen]
    worker = Worker(queues, connection=valkey_conn)
    worker.work()
