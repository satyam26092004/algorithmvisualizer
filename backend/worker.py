import os
from rq import Worker, Queue
from app import valkey_conn

listen = ['default']

if __name__ == '__main__':
    print("🚀 Starting Valkey RQ Background Worker...")
    queues = [Queue(name, connection=valkey_conn) for name in listen]
    worker = Worker(queues, connection=valkey_conn)
    worker.work()
