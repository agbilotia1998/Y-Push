import subprocess
from flask import Flask
from flask import request
from flask import jsonify

app = Flask(__name__)


@app.route('/api/clients')
def clients():
    cmd = "arp -a"
    # all_clients = subprocess.call(cmd)  # returns the exit code in unix
    # print('returned value:', all_clients)
    all_clients = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    all_clients, err = all_clients.communicate()
    all_clients = all_clients.split('\n')
    client_ips = []
    for client in all_clients[:-1]:
        if 'wlp3s0' in client and 'incomplete' not in client:
            ip_string = client.split(' ')
            client_ips.append(ip_string[1])
        # print(ip_string[1])
        # print('\n')
    # print(result)
    # print(request.remote_addr)
    # print(request.headers['X_REAL_IP'])
    # print(request.environ)
    # if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
    #     print(request.environ['REMOTE_ADDR'])
    # else:
    #     print(request.environ['HTTP_X_FORWARDED_FOR'])  # if behind a proxy
    return jsonify(client_ips)


if __name__ == "__main__":
    app.run()