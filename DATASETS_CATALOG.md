# Forensic Training Datasets Catalog

This catalog outlines both the **local training datasets** created directly inside this project and **top external digital forensics benchmark datasets** you can download and plug in.

---

## 1. Local Datasets (Ready in Your Workspace)

These files are located in your project root and can be viewed directly in your file explorer:

### 📄 `forensic_training_dataset.csv`
- **Format**: Structured CSV with 400 labeled events.
- **Columns**:
  - `timestamp`: Incident timeline.
  - `source_ip`: Originating IP (Internal vs. Threat Actor).
  - `user`: Account involved (`root`, `admin`, `svc_backup`, etc.).
  - `process`: System binary/daemon (`kernel`, `sshd`, `nginx`, `systemd`, `auditd`, `sudo`, `curl`).
  - `event_type`: Category (`AUTH`, `NETWORK`, `FILE_ACCESS`, `AUDIT`, `CRON`, `DATABASE`, `DEFENSE_EVASION`, `SYSTEM`).
  - `severity`: `INFO`, `WARNING`, `CRITICAL`.
  - `description`: Forensic log text narrative.
  - `mitre_technique`: MITRE ATT&CK reference ID (e.g., `T1110.001` Brute Force, `T1548.001` Privilege Escalation, `T1048` Exfiltration, `T1486` Ransomware).
  - `attack_type`: Granular classification (e.g., `Port_Scanning`, `Brute_Force`, `Privilege_Escalation`, `Ransomware_Impact`, `Exfiltration`, `Benign`).
  - `is_malicious`: Binary target label (`0` = Benign, `1` = Malicious).
- **Use Case**: Train Supervised Machine Learning models (Random Forest, XGBoost, Logistic Regression, or BERT/NLP).

### 📄 `system_logs_extended.csv`
- **Format**: Raw sequential text log format identical to your original [`system_log.csv`](file:///Users/adityasrivastava/Downloads/AI-Automated-Forensic-Tool--main/system_log.csv).
- **Contents**: Full simulated multi-phase attack narrative:
  1. System boot & normal service operations
  2. External port scan & web reconnaissance (SQLi & Path Traversal)
  3. SSH Brute force attack & unauthorized root breach
  4. SUID privilege escalation & root persistence
  5. Shadow file theft & data exfiltration
  6. Anti-forensics (log wiping & command history deletion)
  7. Post-boot secondary ransomware infection & shadow copies deletion
- **Use Case**: Testing your UI parser, timeline analysis, and rule-based or regex forensic engines.

### 🐍 `train_model.py`
- Baseline Python script using `scikit-learn` to train an NLP-based Random Forest classifier on `forensic_training_dataset.csv`.
- Run with:
  ```bash
  pip install pandas scikit-learn
  python3 train_model.py
  ```

---

## 2. External Digital Forensics & Incident Response (DFIR) Datasets

To train deeper neural networks or test large-scale storage, download these public forensic benchmarks:

### 🔍 Log Analysis & Host Intrusion
1. **Loghub (LogPAI)**
   - **Link**: [https://github.com/logpai/loghub](https://github.com/logpai/loghub)
   - **Details**: 77+ million log lines across Linux Syslog, Windows, Apache, HDFS, BGL, and OpenStack.
   - **Recommended For**: Log parsing (Drain), unsupervised anomaly detection (DeepLog, LogAnomaly).

2. **BETH Dataset**
   - **Link**: [https://www.kaggle.com/datasets/katehighnam/beth-dataset](https://www.kaggle.com/datasets/katehighnam/beth-dataset)
   - **Details**: Real Linux kernel `auditd` event logs collected from honeypots with labeled anomalies and compromised sessions.
   - **Recommended For**: Host intrusion detection and kernel trace anomaly classification.

3. **EVTX-ATT&CK (Windows Event Logs)**
   - **Link**: [https://github.com/SB-Users/EVTX-ATTACK-SAMPLES](https://github.com/SB-Users/EVTX-ATTACK-SAMPLES)
   - **Details**: Curated `.evtx` Windows Event log samples triggering specific MITRE ATT&CK techniques.

---

### 💾 File Carving & Hex/Byte Inspection
1. **Govdocs1 (Digital Corpora)**
   - **Link**: [https://digitalcorpora.org/corpora/file-systems/govdocs1](https://digitalcorpora.org/corpora/file-systems/govdocs1)
   - **Details**: ~1,000,000 files in 1,000 directories (PDF, JPG, DOC, HTML, ZIP, etc.).
   - **Recommended For**: Training models to detect file types and carve fragmented files from raw sectors (matching your tool's Carver and Hex viewer).

2. **NIST Computer Forensic Reference Data Sets (CFReDS)**
   - **Link**: [https://www.cfreds.nist.gov/](https://www.cfreds.nist.gov/)
   - **Details**: Raw disk images (`.dd`, `.raw`) with known deleted files, steganography, and partition structures.

---

### 🧠 Memory & Malware Analysis
1. **CIC-MalMem-2022**
   - **Link**: [https://www.unb.ca/cic/datasets/malmem-2022.html](https://www.unb.ca/cic/datasets/malmem-2022.html)
   - **Details**: Features extracted from Volatility memory dumps covering obfuscated Ransomware, Spyware, and Trojans in memory.
