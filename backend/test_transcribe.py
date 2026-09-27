import requests
dummy_wav = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
try:
    res = requests.post('http://127.0.0.1:8000/api/transcribe', files={'file': ('test.wav', dummy_wav, 'audio/wav')})
    print(res.status_code, res.text)
except Exception as e:
    print('Error:', e)
