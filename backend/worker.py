import os
from rq import Worker, Queue, Connection
from app import valkey_conn

listen = ['default']

if __name__ == '__main__':
    print("🚀 Starting Valkey RQ Background Worker...")
    with Connection(valkey_conn):
        worker = Worker(map(Queue, listen))
        worker.work()
