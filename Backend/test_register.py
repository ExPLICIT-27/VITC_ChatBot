import urllib.request
import json

req = urllib.request.Request(
    'http://127.0.0.1:8000/user/register', 
    data=json.dumps({'email': 'test_script@test.com', 'password': 'pass'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    res = urllib.request.urlopen(req)
    print('Success!', res.read().decode())
except Exception as e:
    print('Error:', e)
    if hasattr(e, 'read'):
        print('Response:', e.read().decode())
