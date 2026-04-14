import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

def main():
    print("Loading dataset...")
    df = pd.read_csv("Crop_recommendation.csv")
    
    # Our defined 9 features
    feature_cols = [
        'N', 'P', 'K', 'temperature', 'humidity', 'ph', 
        'rainfall', 'soil_moisture', 'soil_type'
    ]
    target_col = 'label'
    
    # Extract features and target
    X = df[feature_cols]
    y = df[target_col]
    
    print(f"Dataset shape: {X.shape}")
    print(f"Number of classes: {len(y.unique())}")
    
    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    # Save the model
    model_filename = "crop_model.pkl"
    joblib.dump(model, model_filename)
    print(f"Model successfully saved to {model_filename}")

if __name__ == "__main__":
    main()
