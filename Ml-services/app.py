from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
import random
from transformers import pipeline
import torch
from typing import List, Optional

app = FastAPI(
    title="AgroAgent ML Service",
    description="Plant Disease Detection API using Hugging Face Vision Transformer",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PlantVillage Dataset Classes (38 classes)
PLANT_DISEASE_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot", "Corn_(maize)___Common_rust", "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy", "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight",
    "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight", "Potato___Late_blight",
    "Potato___healthy", "Raspberry___healthy", "Rice___Brown_Spot", "Rice___Leaf_Blast", "Rice___Neck_Blast",
    "Rice___healthy", "Soybean___healthy", "Squash___Powdery_mildew", "Strawberry___Leaf_scorch",
    "Strawberry___healthy", "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
    "Wheat___Brown_Rust", "Wheat___Yellow_Rust", "Wheat___healthy"
]

# Disease Database
DISEASE_DATABASE = {
    # Apple
    "apple_scab": {
        "description": "Apple scab is a fungal disease caused by Venturia inaequalis.",
        "symptoms": ["Dark scabby lesions on leaves", "Deformed fruit with spots", "Premature leaf drop"],
        "precautions": ["Remove fallen leaves", "Prune for air circulation", "Avoid overhead irrigation"],
        "recommendations": ["Apply fungicides in spring", "Use resistant varieties", "Maintain proper spacing"],
        "severity": "Moderate to High"
    },
    "black_rot": {
        "description": "Black rot is a fungal disease affecting apples and grapes.",
        "symptoms": ["Brown spots with purple margins", "Rotting fruit", "Branch cankers"],
        "precautions": ["Remove mummified fruits", "Prune infected branches", "Good sanitation"],
        "recommendations": ["Apply captan or mancozeb", "Remove wild vines", "Spray during bloom"],
        "severity": "High"
    },
    "cedar_apple_rust": {
        "description": "Fungal disease requiring Juniper as an alternate host.",
        "symptoms": ["Yellow-orange spots on leaves", "Small pustules on fruit", "Premature defoliation"],
        "precautions": ["Remove nearby juniper trees", "Use resistant varieties", "Prune galls from junipers"],
        "recommendations": ["Apply fungicides (Myclobutanil)", "Monitor regularly in spring", "Remove infected leaves"],
        "treatment_plan": [
             {"action": "Prune visible galls depending on season", "days_later": 0},
             {"action": "Apply Systemic Fungicide (Myclobutanil)", "days_later": 2},
             {"action": "Inspect nearby Juniper trees (alternate host)", "days_later": 7},
             {"action": "Re-apply fungicide after rain", "days_later": 14}
        ],
        "severity": "Moderate"
    },
    
    # Corn
    "cercospora_leaf_spot": {
        "description": "Gray leaf spot caused by Cercospora zeae-maydis.",
        "symptoms": ["Rectangular gray to brown lesions", "Lesions run parallel to veins", "Leaf blighting"],
        "precautions": ["Crop rotation (2 years)", "Tillage to bury residue", "Resistant hybrids"],
        "recommendations": ["Apply fungicides at tasseling", "Monitor humidity levels", "Avoid corn-on-corn planting"],
        "severity": "Moderate"
    },
    "common_rust": {
        "description": "Fungal disease caused by Puccinia sorghi.",
        "symptoms": ["Reddish-brown pustules on both leaf surfaces", "Chlorotic halos around spots", "Stunted growth"],
        "precautions": ["Plant resistant hybrids", "Early planting", "Monitor cool/moist weather"],
        "recommendations": ["Foliar fungicides if severe", "Manage nitrogen levels", "Scout weekly"],
        "treatment_plan": [
            {"action": "Scout field to assess infection level", "days_later": 0},
            {"action": "Apply Foliar Fungicide if pustules cover >5%", "days_later": 2},
            {"action": "Check Nitrogen levels (avoid excess)", "days_later": 5},
            {"action": "Re-scout for spread", "days_later": 10}
        ],
        "severity": "Low to Moderate"
    },
    "northern_leaf_blight": {
        "description": "Fungal disease causing cigar-shaped lesions.",
        "symptoms": ["Large cigar-shaped gray lesions", "Necrosis of leaf tissue", "Reduced photosynthesis"],
        "precautions": ["Resistant hybrids", "Crop rotation", "Residue management"],
        "recommendations": ["Fungicides (Azoxystrobin)", "Control weeds", "Harvest early if severe"],
        "severity": "High"
    },

    # Grape
    "esca": {
        "description": "Esca (Black Measles) is a complex fungal trunk disease.",
        "symptoms": ["Tiger-stripe leaf pattern", "Dark spots on berries", "Sudden wilting"],
        "precautions": ["Remove infected vines", "Protect pruning wounds", "Sanitize tools"],
        "recommendations": ["No cure; prevention is key", "Apply wound sealants", "Replant in clean soil"],
        "severity": "Critical"
    },
    "leaf_blight": {
        "description": "Leaf blight (Isariopsis Spot) causes premature defoliation.",
        "symptoms": ["Irregular red-brown spots", "Yellow halos", "Fungal growth on underside"],
        "precautions": ["Prune for airflow", "Remove fallen leaves", "Avoid overhead watering"],
        "recommendations": ["Copper-based fungicides", "Mancozeb sprays", "Destruction of debris"],
        "severity": "Moderate"
    },

    # Strawberry
    "leaf_scorch": {
        "description": "Fungal infection caused by Diplocarpon earliana.",
        "symptoms": ["Irregular purple blotches", "Centers turn brown/scorched", "Curling leaves"],
        "precautions": ["Plant resistant varieties", "Remove infected leaves", "Ensure good drainage"],
        "recommendations": ["Fungicides (Captan/Thiram)", "Renew beds every 3-4 years", "Clean cultivation"],
        "treatment_plan": [
            {"action": "Remove and destroy all infected leaves", "days_later": 0},
            {"action": "Apply Fungicide (Captan/Thiram)", "days_later": 1},
            {"action": "Re-apply Fungicide if symptoms persist", "days_later": 14},
            {"action": "Monitor for new lesions", "days_later": 21}
        ],
        "severity": "Moderate"
    },

    # Tomato
    "spider_mites": {
        "description": "Two-spotted spider mites causing stippling damage.",
        "symptoms": ["Yellow speckles (stippling)", "Fine webbing on leaves", "Leaves turning bronze"],
        "precautions": ["Avoid dusty conditions", "Introduce predatory mites", "Remove weeds"],
        "recommendations": ["Neem oil or insecticidal soap", "Increase humidity", "Remove heavily infested leaves"],
        "severity": "High"
    },
    "septoria_leaf_spot": {
        "description": "Fungal disease caused by Septoria lycopersici.",
        "symptoms": ["Circular spots with dark borders", "Gray centers", "Lower leaves affected first"],
        "precautions": ["Mulch to reduce splashing", "Stake plants", "Water at base"],
        "recommendations": ["Chlorothalonil fungicides", "Remove infected lower leaves", "Crop rotation"],
        "severity": "Moderate"
    },
    "target_spot": {
        "description": "Fungal disease caused by Corynespora cassiicola.",
        "symptoms": ["Brown lesions with concentric rings", "Fruit lesions", "Leaf drop"],
        "precautions": ["Good airflow", "Avoid overhead irrigation", "Remove debris"],
        "recommendations": ["Fungicide application", "Sanitize tools", "Weed control"],
        "severity": "High"
    },
    "tomato_mosaic_virus": {
        "description": "Viral disease causing mottled leaves.",
        "symptoms": ["Mottled light/dark green leaves", "Stunted growth", "Distorted fruit"],
        "precautions": ["Wash hands (tobacco users)", "Sanitize tools", "Remove infected plants"],
        "recommendations": ["No cure; remove and destroy", "Control aphids", "Use resistant varieties"],
        "severity": "Critical"
    },
    "yellow_leaf_curl_virus": {
        "description": "Viral disease transmitted by whiteflies.",
        "symptoms": ["Upward curling leaves", "Yellowing margins", "Stunted plants"],
        "precautions": ["Control whiteflies", "Reflective mulches", "Remove weeds"],
        "recommendations": ["Remove infected plants", "Imidacloprid for vectors", "Use resistant varieties"],
        "severity": "High"
    },

    # General / Other
    "early_blight": {
        "description": "Fungal disease caused by Alternaria affecting potatoes and tomatoes.",
        "symptoms": ["Dark concentric ring lesions", "Target board appearance", "Lower leaves affected first"],
        "precautions": ["Rotate crops 2-3 years", "Remove debris", "Adequate spacing"],
        "recommendations": ["Apply chlorothalonil", "Mulch to prevent splash", "Water at base"],
        "severity": "Moderate"
    },
    "late_blight": {
        "description": "Devastating disease (Phytophthora infestans).",
        "symptoms": ["Water-soaked lesions", "White fuzzy growth", "Rapid plant death"],
        "precautions": ["Use certified seeds", "Destroy volunteers", "Monitor weather"],
        "recommendations": ["Preventive fungicides", "Harvest before rain", "Destroy infected material"],
        "severity": "Critical"
    },
    "powdery_mildew": {
        "description": "Fungal disease creating white powdery coating.",
        "symptoms": ["White powdery patches", "Stunted growth", "Leaf curling"],
        "precautions": ["Avoid overcrowding", "Water at base", "Good air circulation"],
        "recommendations": ["Apply sulfur fungicides", "Use neem oil", "Remove infected parts"],
        "severity": "Moderate"
    },
    "bacterial_spot": {
        "description": "Bacterial disease affecting peppers and tomatoes.",
        "symptoms": ["Water-soaked spots", "Brown spots with yellow halos", "Fruit lesions"],
        "precautions": ["Use disease-free seeds", "Avoid overhead irrigation", "Crop rotation"],
        "recommendations": ["Copper bactericides", "Remove infected plants", "Hot water seed treatment"],
        "severity": "Moderate to High"
    },
    "healthy": {
        "description": "Plant appears healthy with no disease symptoms.",
        "symptoms": ["No disease symptoms detected"],
        "precautions": ["Continue monitoring", "Maintain good practices", "Scout weekly"],
        "recommendations": ["Keep current management", "Balanced nutrition", "Proper watering"],
        "severity": "None"
    }
}

# Load Model
print("Loading Hugging Face Plant Disease Model...")
print(f"📚 Loaded {len(DISEASE_DATABASE)} disease entries from database.")
print(f"Keys: {list(DISEASE_DATABASE.keys())}")
classifier = None
MODEL_NAME = "Not loaded"

try:
    classifier = pipeline(
        "image-classification",
        model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
        device=-1
    )
    MODEL_NAME = "PlantVillage MobileNet (38 classes)"
    print(f"✅ Model loaded: {MODEL_NAME}")
except Exception as e:
    print(f"⚠️ Primary model failed: {e}")
    try:
        classifier = pipeline("image-classification", model="google/vit-base-patch16-224", device=-1)
        MODEL_NAME = "Google ViT Base"
        print(f"✅ Fallback: {MODEL_NAME}")
    except Exception as e2:
        print(f"❌ All models failed: {e2}")

# Pydantic Models
class Prediction(BaseModel):
    rank: int
    plant: str
    disease: str
    confidence: float

class TreatmentPlan(BaseModel):
    action: str
    days_later: int

class DiagnosisResponse(BaseModel):
    success: bool
    plant: str
    disease: str
    confidence: float
    status: str
    severity: str
    description: str
    symptoms: List[str]
    precautions: List[str]
    recommendations: List[str]
    treatment_plan: List[TreatmentPlan] = []
    top5_predictions: List[Prediction]
    model: str

class MarketRequest(BaseModel):
    crop: str = "wheat"
    location: str = "India"

class MarketPrice(BaseModel):
    market_name: str
    price: int
    distance_km: int

class MarketResponse(BaseModel):
    crop: str
    location: str
    current_price: int
    unit: str
    trend: str
    trend_description: str
    forecast: List[dict]
    nearby_markets: List[MarketPrice] = []
    last_updated: str

class HealthResponse(BaseModel):
    status: str
    ml_model: str
    is_model_loaded: bool
    disease_classes: int

def parse_disease_label(label):
    """Parse PlantVillage format label (Plant___Disease) or fallback formats"""
    # 1. Standard PlantVillage format
    if "___" in label:
        plant_raw, disease_raw = label.split("___")
        plant = plant_raw.replace("_", " ").replace("(", "").replace(")", "").strip()
        disease = disease_raw.replace("_", " ").replace("(", "").replace(")", "").strip()
        if disease.lower() == "healthy":
            return plant, "Healthy"
        return plant, disease.title()

    # 2. Fallback: Check if label starts with a known plant name
    # Common plants in our DB
    KNOWN_PLANTS = ["Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange", "Peach", "Pepper", "Potato", "Raspberry", "Rice", "Soybean", "Squash", "Strawberry", "Tomato", "Wheat"]
    
    clean_label = label.replace("_", " ").strip()
    
    for plant in KNOWN_PLANTS:
        if clean_label.lower().startswith(plant.lower()):
            # Extract logic: "Strawberry with Leaf Scorch" -> Plant: Strawberry, Disease: Leaf Scorch
            disease_part = clean_label[len(plant):].strip()
            
            # Remove connecting words like "with", "leaf", "disease" if they start the string
            # (Simple heuristic)
            if disease_part.lower().startswith("with "):
                disease_part = disease_part[5:].strip()
            
            if not disease_part:
                return plant, "Healthy" if "healthy" in label.lower() else "Unknown Issue"
                
            return plant, disease_part.title()

    return "Unknown", label.title()

def get_disease_info(disease_name):
    """Get disease details with debug logging"""
    disease_key = disease_name.lower().replace(" ", "_").replace("-", "_")
    print(f"🔍 DEBUG: Lookup '{disease_name}' -> key '{disease_key}'")
    
    # Direct match first (faster/safer)
    if disease_key in DISEASE_DATABASE:
        print(f"✅ Exact match found for '{disease_key}'")
        return DISEASE_DATABASE[disease_key]

    for key in DISEASE_DATABASE:
        if key in disease_key or disease_key in key:
            print(f"✅ Partial match found: '{key}' matching '{disease_key}'")
            return DISEASE_DATABASE[key]
            
    print(f"❌ NO MATCH found for '{disease_key}'. Using fallback.")
    return {
        "description": f"Disease: {disease_name}. Consult an expert.",
        "symptoms": ["Visible plant stress"],
        "precautions": ["Isolate affected plants"],
        "recommendations": ["Take samples for lab analysis"],
        "treatment_plan": [],
        "severity": "Unknown"
    }


@app.post("/predict-disease", response_model=DiagnosisResponse, tags=["Disease Detection"])
async def predict_disease(files: List[UploadFile] = File(..., description="List of plant leaf images (JPG/PNG)")):
    """
    Upload multiple plant leaf images (max 3) for enhanced disease detection.
    Returns aggregated diagnosis based on majority vote or confidence averaging.
    """
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
    
    all_predictions = []
    
    try:
        # 1. Analyze each image
        for file in files:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            results = classifier(image, top_k=3)
            all_predictions.append(results)
            
        # 2. Aggregation Logic
        # We will sum the scores for each class across all images
        class_scores = {}
        
        for preds in all_predictions:
            for p in preds:
                label = p['label']
                score = p['score']
                if label not in class_scores:
                    class_scores[label] = 0.0
                class_scores[label] += score
                
        # 3. Find highest score average
        best_label = max(class_scores, key=class_scores.get)
        avg_confidence = (class_scores[best_label] / len(files)) * 100
        
        # 4. Parse Final Result
        plant_name, disease_name = parse_disease_label(best_label)
        disease_info = get_disease_info(disease_name)
        
        status = "Healthy" if "healthy" in disease_name.lower() else (
            "Disease Detected" if avg_confidence > 50 else "Analysis Complete"
        )
        
        # 5. Top 5 for the final aggregated result (based on summed scores)
        sorted_labels = sorted(class_scores.items(), key=lambda x: x[1], reverse=True)[:5]
        top5 = []
        for i, (label, score) in enumerate(sorted_labels):
            p, d = parse_disease_label(label)
            # Normalize score by dividing by num files
            top5.append(Prediction(rank=i+1, plant=p, disease=d, confidence=round((score/len(files))*100, 2)))
        
        return DiagnosisResponse(
            success=True,
            plant=plant_name,
            disease=disease_name,
            confidence=round(avg_confidence, 2),
            status=status,
            severity=disease_info["severity"],
            description=disease_info["description"],
            symptoms=disease_info["symptoms"],
            precautions=disease_info["precautions"],
            recommendations=disease_info["recommendations"],
            treatment_plan=disease_info.get("treatment_plan", []),
            top5_predictions=top5,
            model=MODEL_NAME
        )
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/market-analysis", response_model=MarketResponse, tags=["Market Analysis"])
async def market_analysis(request: MarketRequest):
    """Get market price analysis for a crop."""
    base_prices = {
        "wheat": 2200, "rice": 2800, "cotton": 6500, "sugarcane": 350,
        "soybean": 4200, "maize": 2100, "potato": 1500, "tomato": 2500, "onion": 1800
    }
    base = base_prices.get(request.crop.lower(), 2500)
    var = random.uniform(-0.1, 0.15)
    price = int(base * (1 + var))
    
    forecast = []
    p = price
    for i in range(7):
        c = random.uniform(-0.03, 0.05)
        p = int(p * (1 + c))
        forecast.append({"day": i+1, "predicted_price": p, "trend": "up" if c > 0 else "down"})
    
    # Simulate Nearby Markets (Compare prices)
    nearby_markets = [
        {"market_name": f"{request.location} APMC", "price": price, "distance_km": 5},
        {"market_name": "Major City Mandi", "price": int(price * (1 + random.uniform(0.02, 0.08))), "distance_km": 25},
        {"market_name": "Export Zone", "price": int(price * (1 + random.uniform(0.10, 0.15))), "distance_km": 60}
    ]



    trend_desc = "Prices rising due to high demand" if var > 0 else "Prices dropping due to supply surplus"

    return MarketResponse(
        crop=request.crop.title(),
        location=request.location,
        current_price=price,
        unit="₹/quintal",
        trend="Bullish" if var > 0 else "Bearish",
        trend_description=trend_desc,
        forecast=forecast,
        nearby_markets=nearby_markets,
        last_updated="Just now"
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check service health and model status."""
    return HealthResponse(
        status="healthy",
        ml_model=MODEL_NAME,
        is_model_loaded=classifier is not None,
        disease_classes=len(PLANT_DISEASE_CLASSES)
    )



# --------------------
# Model Analytics
# --------------------

class TrainingMetric(BaseModel):
    epoch: int
    accuracy: float
    loss: float
    val_accuracy: float
    val_loss: float

class ConfusionMatrixEntry(BaseModel):
    actual: str
    predicted: str
    count: int

class ModelStatsResponse(BaseModel):
    model_name: str
    total_epochs: int
    final_accuracy: float
    training_history: List[TrainingMetric]
    confusion_matrix: List[ConfusionMatrixEntry]
    learning_rate: float
    architecture_description: str


@app.get("/model-stats", response_model=ModelStatsResponse, tags=["Analytics"])
async def get_model_stats():
    """Get educational model training statistics (Simulated for demo)."""
    
    # Simulate realistic training curve (MobileNetV2 style)
    # Seed for stability so user sees consistent "Training" history
    random.seed(42) 
    
    history = []
    acc = 0.55
    loss = 1.8
    val_acc = 0.50
    val_loss = 1.9
    
    for i in range(1, 26): # 25 Epochs
        # Improve metrics logarithmically/randomly
        acc += random.uniform(0.01, 0.03) * (1 - acc) # Slows as it nears 1.0
        loss *= random.uniform(0.85, 0.95)
        
        val_acc = acc - random.uniform(0.02, 0.05) # Val slightly lower (overfitting check)
        val_loss = loss + random.uniform(0.05, 0.1)
        
        history.append(TrainingMetric(
            epoch=i,
            accuracy=round(acc, 4),
            loss=round(loss, 4),
            val_accuracy=round(val_acc, 4),
            val_loss=round(val_loss, 4)
        ))
        
    # Top confusion pairs (Common look-alikes)
    confusion = [
        {"actual": "Tomato_Early_Blight", "predicted": "Tomato_Late_Blight", "count": 12},
        {"actual": "Potato_Early_Blight", "predicted": "Potato_Late_Blight", "count": 8},
        {"actual": "Corn_Common_Rust", "predicted": "Corn_Northern_Leaf_Blight", "count": 5},
        {"actual": "Apple_Scab", "predicted": "Apple_Black_Rot", "count": 15},
        {"actual": "Grape_Black_Rot", "predicted": "Grape_Esca", "count": 7},
    ]

    return ModelStatsResponse(
        model_name="MobileNetV2 (Transfer Learning)",
        total_epochs=25,
        final_accuracy=round(acc, 4),
        training_history=history,
        confusion_matrix=confusion,
        learning_rate=0.0001,
        architecture_description="CNN with Depthwise Separable Convolutions"
    )


if __name__ == "__main__":
    import uvicorn
    print("🌿 AgroAgent ML Service (FastAPI)")
    print(f"📦 Model: {MODEL_NAME}")
    print("📚 Swagger UI: http://localhost:5001/docs")
    print("📘 ReDoc: http://localhost:5001/redoc")
    uvicorn.run(app, host="0.0.0.0", port=5001)
