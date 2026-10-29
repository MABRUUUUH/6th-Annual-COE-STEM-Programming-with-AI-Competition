import json, urllib.request, urllib.error
base='http://127.0.0.1:8765/api/sessions'
def call(url, data=None, fail=False):
    payload=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(url,data=payload,headers={'Content-Type':'application/json'},method='GET' if data is None else 'POST')
    try:
        with urllib.request.urlopen(req,timeout=5) as r: result=json.load(r)
    except urllib.error.HTTPError as e:
        if not fail: raise
        return json.load(e)
    assert not fail,result
    assert result['ok'],result
    return result['data']
s=call(base,{})
id=s['id'];url=base+'/'+id
assert call(url)['id']==id
s=call(url+'/setup',{'teams':{'A':'Team Alpha','B':'Team Bravo'},'players':[{'name':'Alice','team':'A'},{'name':'Bob','team':'B'}]})
assert s['teams']['A']=='Team Alpha'
assert not call(url+'/setup',{'teams':{'A':'Same','B':'Same'},'players':s['players']},True)['ok']
def event(game,description,team='A',player='Alice',details={}):return {'game':game,'description':description,'team':team,'player':player,'details':details}
assert not call(url+'/events',event('protocol','Cooperative Final Protocol completed',player='Family team'),True)['ok']
s=call(url+'/events',event('football','Referee-confirmed goal'));assert s['scores']['A']==5
s=call(url+'/events',event('football','Potential goal — requires review'));assert s['scores']['A']==5
s=call(url+'/events',event('memory','Heritage question 1: correct answer',details={'answer':'Dallah coffee pot'}));assert s['scores']['A']==15
assert not call(url+'/events',event('memory','Heritage question 1: correct answer',details={'answer':'Dallah coffee pot'}),True)['ok']
s=call(url+'/events',event('engineers','tower',team='B',player='Bob',details={'heightCm':30,'stable':True}));assert s['scores']['B']==40
s=call(url+'/events',event('rhythm','taps',team='B',player='Bob',details={'intervalsMs':[510,520]}));assert s['scores']['B']==50
s=call(url+'/events',event('protocol','Cooperative Final Protocol completed',player='Family team'));assert s['scores']['A']==30
assert not call(url+'/events',event('protocol','Cooperative Final Protocol completed',player='Family team'),True)['ok']
assert call(url)['scores']==s['scores']
s=call(url+'/reset',{});assert s['scores']=={'A':0,'B':0} and not s['events'] and s['round']==2 and s['teams']['A']=='Team Alpha'
print('PASS: 13 functional checks — session, persistence, setup, scoring, tamper-resistant points, rejected duplicates, finale, reset')
