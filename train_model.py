"""
AI Automated Forensic Tool - Training Script
Trains a machine learning model on forensic log data to detect cyber attacks and malicious activity.
"""

import os
import sys

def check_requirements():
    try:
        import pandas as pd
        import sklearn
        return True
    except ImportError:
        print("[!] Missing required libraries (pandas, scikit-learn).")
        print("    Install them using: pip install pandas scikit-learn numpy")
        return False

def train_forensic_classifier():
    if not check_requirements():
        return

    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import classification_report, confusion_matrix
    from sklearn.pipeline import Pipeline

    dataset_path = os.path.join(os.path.dirname(__file__), "forensic_training_dataset.csv")
    if not os.path.exists(dataset_path):
        print(f"[x] Error: Dataset not found at {dataset_path}")
        return

    print(f"[*] Loading forensic dataset from: {dataset_path}...")
    df = pd.read_csv(dataset_path)
    print(f"[+] Loaded {len(df)} records.")
    print(f"    - Malicious events: {df['is_malicious'].sum()}")
    print(f"    - Benign events: {len(df) - df['is_malicious'].sum()}")
    print("\n[*] Sample Attack Categories:")
    print(df['attack_type'].value_counts())

    # Combine text features for NLP-based log analysis
    df['combined_features'] = (
        df['event_type'] + " " +
        df['severity'] + " " +
        df['process'] + " " +
        df['description']
    )

    X = df['combined_features']
    y = df['is_malicious']

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"\n[*] Training Random Forest Classifier on {len(X_train)} samples...")
    model = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=500, ngram_range=(1, 2))),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    print("\n================ Classification Report ================")
    print(classification_report(y_test, y_pred, target_names=["Benign", "Malicious"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Test on a few real forensic strings
    test_cases = [
        "DAEMON INFO systemd Service 'authd' started successfully.",
        "AUDIT CRITICAL sudo pam_unix: Privilege escalation: UID 1001 modified SUID bit on /bin/bash",
        "AUTH WARNING sshd Failed password for root from 104.22.15.9 port 48217 ssh2",
        "DATABASE INFO postgres checkpoint complete: wrote 845 buffers"
    ]

    print("\n================ Testing New Forensic Events ================")
    predictions = model.predict(test_cases)
    probabilities = model.predict_proba(test_cases)

    for text, pred, prob in zip(test_cases, predictions, probabilities):
        verdict = "MALICIOUS (ALERT)" if pred == 1 else "BENIGN"
        confidence = max(prob) * 100
        print(f"Log: '{text}'")
        print(f" -> Predicted: {verdict} ({confidence:.1f}% confidence)\n")

if __name__ == "__main__":
    train_forensic_classifier()
