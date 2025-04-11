import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import openai
from anthropic import Anthropic
import google.generativeai as genai
import requests
import time

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')

# Initialize API clients
openai_client = None
anthropic_client = None
genai_client = None
# Initialize Mistral and Grok clients as None
mistral_client = None
grok_client = None

# Configure API clients if keys are available
if os.getenv('OPENAI_API_KEY'):
    openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

if os.getenv('ANTHROPIC_API_KEY'):
    anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

if os.getenv('GOOGLE_API_KEY'):
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    genai_client = genai

# Initialize Mistral client if key is available
if os.getenv('MISTRAL_API_KEY'):
    from mistralai import Mistral
    mistral_client = Mistral(api_key=os.getenv('MISTRAL_API_KEY'))

def get_openai_models():
    """Fetch available OpenAI models."""
    if not openai_client:
        return []
    try:
        response = openai_client.models.list()
        return [model.id for model in response.data if "gpt" in model.id]
    except Exception as e:
        print(f"Error fetching OpenAI models: {e}")
        return []

def get_anthropic_models():
    """Fetch available Anthropic models."""
    if not anthropic_client:
        return []
    try:
        response = anthropic_client.models.list()
        return [model.id for model in response.data]
    except Exception as e:
        print(f"Error fetching Anthropic models: {e}")
        return []

def get_gemini_models():
    """Fetch available Gemini models."""
    if not genai_client:
        return []
    try:
        response = genai_client.list_models()
        return [model.name for model in response if "gemini" in model.name.lower()]
    except Exception as e:
        print(f"Error fetching Gemini models: {e}")
        return []

def get_deepseek_models():
    """Fetch available DeepSeek models."""
    if not os.getenv('DEEPSEEK_API_KEY'):
        return []
    try:
        headers = {
            "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
            "Content-Type": "application/json"
        }
        response = requests.get("https://api.deepseek.com/models", headers=headers)
        response.raise_for_status()
        return [model['id'] for model in response.json()['data']]
    except Exception as e:
        print(f"Error fetching DeepSeek models: {e}")
        return []

def get_mistral_models():
    """Fetch available Mistral models."""
    if not mistral_client:
        return []
    try:
        response = mistral_client.models.list()
        return [model.id for model in response.data]
    except Exception as e:
        print(f"Error fetching Mistral models: {e}")
        return []

def get_grok_models():
    """Fetch available Grok models."""
    if not os.getenv('GROK_API_KEY'):
        return []
    try:
        headers = {
            "Authorization": f"Bearer {os.getenv('GROK_API_KEY')}",
            "Content-Type": "application/json"
        }
        response = requests.get("https://api.x.ai/v1/models", headers=headers)
        response.raise_for_status()
        return [model['id'] for model in response.json()['data']]
    except Exception as e:
        print(f"Error fetching Grok models: {e}")
        return []

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/api/models', methods=['GET'])
def get_available_models():
    """Return available models for each provider based on API keys."""
    available_models = {
        'openai': [],
        'anthropic': [],
        'gemini': [],
        'deepseek': [],
        'mistral': [],
        'grok': []
    }
    
    # Usar try/except para cada provedor para que um erro em um não afete os outros
    try:
        available_models['openai'] = get_openai_models()
    except Exception as e:
        print(f"Error fetching OpenAI models: {e}")
    
    try:
        available_models['anthropic'] = get_anthropic_models()
    except Exception as e:
        print(f"Error fetching Anthropic models: {e}")
    
    try:
        available_models['gemini'] = get_gemini_models()
    except Exception as e:
        print(f"Error fetching Gemini models: {e}")
    
    try:
        available_models['deepseek'] = get_deepseek_models()
    except Exception as e:
        print(f"Error fetching DeepSeek models: {e}")
    
    try:
        available_models['mistral'] = get_mistral_models()
    except Exception as e:
        print(f"Error fetching Mistral models: {e}")
    
    try:
        available_models['grok'] = get_grok_models()
    except Exception as e:
        print(f"Error fetching Grok models: {e}")
    
    return jsonify(available_models)

@app.route('/api/query', methods=['POST'])
def query_llms():
    """Send a query to all configured LLMs and return their responses."""
    data = request.get_json()
    query = data.get('query', '')
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    responses = {}
    
    # Process the query with OpenAI
    if data.get('openai_model') and openai_client:
        try:
            model = data.get('openai_model')
            # Validate if the model is available
            available_models = get_openai_models()
            if model not in available_models:
                responses['openai'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                response = openai_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": query}],
                    temperature=0.7,
                    max_tokens=1000
                )
                end_time = time.time()
                responses['openai'] = {
                    'text': response.choices[0].message.content,
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            responses['openai'] = {'error': str(e)}
    
    # Process the query with Anthropic
    if data.get('anthropic_model') and anthropic_client:
        try:
            model = data.get('anthropic_model')
            # Validate if the model is available
            available_models = get_anthropic_models()
            if model not in available_models:
                responses['anthropic'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                response = anthropic_client.messages.create(
                    model=model,
                    max_tokens=1000,
                    temperature=0.7,
                    messages=[
                        {"role": "user", "content": query}
                    ]
                )
                end_time = time.time()
                responses['anthropic'] = {
                    'text': response.content[0].text,
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            responses['anthropic'] = {'error': str(e)}
    
    # Process the query with Gemini
    if data.get('gemini_model') and genai_client:
        try:
            model = data.get('gemini_model')
            # Validate if the model is available
            available_models = get_gemini_models()
            if model not in available_models:
                responses['gemini'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                
                generation_config = {
                    "temperature": 0.7,
                    "max_output_tokens": 1000,
                }
                
                gemini_model = genai_client.GenerativeModel(model_name=model, 
                                                       generation_config=generation_config)
                response = gemini_model.generate_content(query)
                end_time = time.time()
                
                responses['gemini'] = {
                    'text': response.text,
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            responses['gemini'] = {'error': str(e)}
    
    # Process the query with DeepSeek
    if data.get('deepseek_model') and os.getenv('DEEPSEEK_API_KEY'):
        try:
            model = data.get('deepseek_model')
            # Validate if the model is available
            available_models = get_deepseek_models()
            if model not in available_models:
                responses['deepseek'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                
                headers = {
                    "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": query}],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
                
                api_url = "https://api.deepseek.com/chat/completions"
                response = requests.post(api_url, headers=headers, json=payload)
                response.raise_for_status()
                response_data = response.json()
                
                end_time = time.time()
                responses['deepseek'] = {
                    'text': response_data['choices'][0]['message']['content'],
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            print(f"Error with DeepSeek: {e}")
            responses['deepseek'] = {'error': str(e)}
    
    # Process the query with Mistral
    if data.get('mistral_model') and mistral_client:
        try:
            model = data.get('mistral_model')
            # Validate if the model is available
            available_models = get_mistral_models()
            if model not in available_models:
                responses['mistral'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                
                response = mistral_client.chat.complete(
                    model=model,
                    messages=[{"role": "user", "content": query}],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                end_time = time.time()
                responses['mistral'] = {
                    'text': response.choices[0].message.content,
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            responses['mistral'] = {'error': str(e)}
    
    # Process the query with Grok
    if data.get('grok_model') and os.getenv('GROK_API_KEY'):
        try:
            model = data.get('grok_model')
            # Validate if the model is available
            available_models = get_grok_models()
            if model not in available_models:
                responses['grok'] = {'error': f'Model {model} is not available'}
            else:
                start_time = time.time()
                
                headers = {
                    "Authorization": f"Bearer {os.getenv('GROK_API_KEY')}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": query}],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
                
                api_url = "https://api.x.ai/v1/chat/completions"
                response = requests.post(api_url, headers=headers, json=payload)
                response.raise_for_status()
                response_data = response.json()
                
                end_time = time.time()
                responses['grok'] = {
                    'text': response_data['choices'][0]['message']['content'],
                    'model': model,
                    'time': round(end_time - start_time, 2)
                }
        except Exception as e:
            print(f"Error with Grok: {e}")
            responses['grok'] = {'error': str(e)}
    
    return jsonify(responses)

if __name__ == '__main__':
    app.run(debug=True) 