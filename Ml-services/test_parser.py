def parse_disease_label(label):
    """Parse PlantVillage format label (Plant___Disease)"""
    if "___" not in label:
        return "Unknown", label
        
    plant_raw, disease_raw = label.split("___")
    
    # Clean Plant Name
    plant = plant_raw.replace("_", " ").replace("(", "").replace(")", "").strip()
    
    # Clean Disease Name
    disease = disease_raw.replace("_", " ").replace("(", "").replace(")", "").strip()
    
    # Special case: "healthy"
    if disease.lower() == "healthy":
        return plant, "Healthy"
        
    return plant, disease.title()

label = "Apple___Cedar_apple_rust"
plant, disease = parse_disease_label(label)
print(f"Original: {label}")
print(f"Parsed: Plant='{plant}', Disease='{disease}'")

key = disease.lower().replace(" ", "_").replace("-", "_")
print(f"Generated Key: '{key}'")

expected_key = "cedar_apple_rust"
if key == expected_key:
    print("✅ SUCCESS: Key matches database!")
else:
    print(f"❌ FAIL: Expected '{expected_key}', got '{key}'")
