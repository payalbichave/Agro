import requests
import os

# Use one of the user's uploaded images correctly
IMAGE_PATH = r"C:\Users\Hp\.gemini\antigravity\brain\2aeb9f4a-9b05-4d11-9f64-b175eeff2849\uploaded_media_1770232592089.png"
URL = "http://localhost:5001/predict-disease"

def test_prediction():
    if not os.path.exists(IMAGE_PATH):
        print(f"❌ Image not found at {IMAGE_PATH}")
        return

    try:
        files = [('files', ('test_image.png', open(IMAGE_PATH, 'rb'), 'image/png'))]
        print(f"🚀 Sending request to {URL}...")
        
        response = requests.post(URL, files=files)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Prediction Success!")
            print(f"Plant: {data.get('plant')}")
            print(f"Disease: {data.get('disease')}")
            print(f"Severity: {data.get('severity')}")
            print(f"Recommendations: {data.get('recommendations')}")
            
            if data.get('severity') == "Unknown":
                print("\n⚠️ FAIL: Severity is still Unknown!")
            else:
                print("\n🎉 SUCCESS: Database lookup worked!")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_prediction()
