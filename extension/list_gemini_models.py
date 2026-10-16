import urllib.request
import json

API_KEY = input("Please paste your Gemini API Key here and hit Enter: ").strip()

if not API_KEY:
    print("Error: API key cannot be empty.")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        
        print("\nAvailable models:")
        for model in result.get('models', []):
            name = model.get('name')
            methods = model.get('supportedGenerationMethods', [])
            
            if 'generateContent' in methods:
                 print(f" - {name} (supports generateContent)")
                 
except Exception as e:
    print(f"Error querying API: {e}")
