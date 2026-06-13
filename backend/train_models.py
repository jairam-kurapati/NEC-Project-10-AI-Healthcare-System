import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
import joblib

def generate_synthetic_data(num_samples=2500):
    np.random.seed(42)
    
    # Generate random basic features
    age = np.random.randint(18, 85, size=num_samples)
    bp_systolic = np.random.randint(90, 180, size=num_samples)
    glucose = np.random.randint(70, 220, size=num_samples)
    cholesterol = np.random.randint(120, 310, size=num_samples)
    bmi = np.random.uniform(16.0, 42.0, size=num_samples)
    
    # Binary symptom features (0 or 1)
    # ['chest_pain', 'shortness_breath', 'frequent_urination', 'excessive_thirst', 'swelling_legs', 'fatigue', 'fever']
    symptoms = np.random.binomial(1, 0.25, size=(num_samples, 7))
    
    # Create DataFrame
    columns = [
        'age', 'bp_systolic', 'glucose', 'cholesterol', 'bmi',
        'chest_pain', 'shortness_breath', 'frequent_urination', 
        'excessive_thirst', 'swelling_legs', 'fatigue', 'fever'
    ]
    df = pd.DataFrame(np.column_stack([age, bp_systolic, glucose, cholesterol, bmi, symptoms]), columns=columns)
    
    # Rules to assign target label (0: Low Risk, 1: Diabetes, 2: Heart Disease, 3: CKD)
    labels = []
    for idx, row in df.iterrows():
        # Score calculation for each class
        diabetes_score = 0
        heart_score = 0
        kidney_score = 0
        
        # Base criteria
        if row['age'] > 45:
            diabetes_score += 10
            heart_score += 15
            kidney_score += 10
            
        if row['bp_systolic'] > 135:
            heart_score += 25
            kidney_score += 20
            
        if row['glucose'] > 110:
            diabetes_score += 35
            kidney_score += 15
            
        if row['cholesterol'] > 210:
            heart_score += 30
            
        if row['bmi'] > 25:
            diabetes_score += 20
            heart_score += 15
            
        # Symptoms
        if row['chest_pain'] == 1:
            heart_score += 40
        if row['shortness_breath'] == 1:
            heart_score += 40
            
        if row['frequent_urination'] == 1:
            diabetes_score += 45
        if row['excessive_thirst'] == 1:
            diabetes_score += 45
            
        if row['swelling_legs'] == 1:
            kidney_score += 40
            
        if row['fatigue'] == 1:
            diabetes_score += 10
            heart_score += 10
            kidney_score += 10
            
        # Add random noise to make ML model work hard
        diabetes_score += np.random.randint(-10, 10)
        heart_score += np.random.randint(-10, 10)
        kidney_score += np.random.randint(-10, 10)
        
        scores = [15, diabetes_score, heart_score, kidney_score]
        best_class = np.argmax(scores)
        
        # If highest score is low, mark as Low Risk
        if scores[best_class] < 30:
            labels.append(0)
        else:
            labels.append(best_class)
            
    df['disease_label'] = labels
    return df

def train_and_save_models():
    print("Generating synthetic clinical dataset...")
    df = generate_synthetic_data()
    
    X = df.drop(columns=['disease_label'])
    y = df['disease_label']
    
    # Ensure models folder exists
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Define models to train
    models = {
        'rf_model.joblib': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        'gb_model.joblib': GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
        'dt_model.joblib': DecisionTreeClassifier(max_depth=6, random_state=42),
        'lr_model.joblib': LogisticRegression(max_iter=1000, solver='lbfgs', random_state=42)
    }
    
    print("Training ML Classifiers...")
    for filename, model in models.items():
        print(f"Training {filename.split('_')[0].upper()} Classifier...")
        model.fit(X, y)
        filepath = os.path.join(models_dir, filename)
        joblib.dump(model, filepath)
        print(f"Model saved successfully to: {filepath}")
        
    print("All ML models successfully trained and serialized.")

if __name__ == '__main__':
    train_and_save_models()
