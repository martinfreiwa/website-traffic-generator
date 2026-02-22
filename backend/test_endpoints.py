import urllib.request, json, urllib.parse
req = urllib.request.Request('https://traffic-creator.com/auth/token', data=urllib.parse.urlencode({'username': 'support@traffic-creator.com', 'password': 'TrafficAdmin2025!'}).encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
token = json.loads(urllib.request.urlopen(req).read())['access_token']

endpoints = [
    '/projects', '/transactions', '/settings', '/admin/users',
    '/admin/transactions', '/tickets', '/notifications', '/admin/broadcasts',
    '/admin/projects', '/admin/fraud-alerts', '/admin/users/stats',
    '/users/me/invoices'
]

for endpoint in endpoints:
    url = f"https://traffic-creator.com{endpoint}"
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        content = response.read()
        try:
            json.loads(content)
            print(f"{endpoint}: OK")
        except:
            print(f"{endpoint}: NOT JSON, content begins with: {content[:100]}")
    except Exception as e:
        try:
            err_content = e.read()
            print(f"{endpoint}: ERROR {e} - {err_content}")
        except:
            print(f"{endpoint}: ERROR {e}")
