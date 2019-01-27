import netifaces
import nmap
from flask import jsonify, make_response
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/clients')
def clients():
    # cmd = "arp -a"
    # all_clients = subprocess.call(cmd)  # returns the exit code in unix
    # print('returned value:', all_clients)
    # all_clients = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    # all_clients, err = all_clients.communicate()
    # all_clients = all_clients.split('\n')
    client_ips = []
    # for client in all_clients[:-1]:
    #     if 'wlp3s0' in client and 'incomplete' not in client:
    #         ip_string = client.split(' ')
    #         client_ips.append(ip_string[1])
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
    # return jsonify(client_ips)

    ip = netifaces.ifaddresses('wlp3s0')[netifaces.AF_INET][0]['addr']
    mask = netifaces.ifaddresses('wlp3s0')[2][0]['netmask']
    binary_mask = ''.join(list(map(lambda x: bin(int(x))[2:], mask.split('.'))))
    bits = binary_mask.count('1')

    nm = nmap.PortScanner()
    nm.scan(hosts=ip+'/'+str(bits), arguments='-sn')

    hosts_list  = [(x, nm[x]['status']['state']) for x in nm.all_hosts()]

    for host, status in hosts_list:
        print(host, status)
        client_ips.append(host)

    client_ips.remove(ip)

    return make_response(jsonify(client_ips)), 200


if __name__ == "__main__":
    app.run(debug=True)