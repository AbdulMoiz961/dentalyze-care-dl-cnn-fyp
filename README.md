<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/PyTorch-2.1+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch"/>
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-Academic-orange?style=for-the-badge" alt="License"/>
</p>

# Dentalyze Care: Deep Learning-Based Dental Pathology Detection and Decision Support System

> An end-to-end web application that leverages a **Faster R-CNN** deep learning architecture trained on the [DENTEX Challenge](https://dentex.grand-challenge.org/) dataset to automatically detect, classify, and localize dental pathologies from panoramic radiographs (orthopantomograms).

---

## Table of Contents

- [Abstract](#abstract)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Model Performance](#model-performance)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Repository Setup](#1-clone-the-repository)
  - [Frontend Setup](#2-frontend-setup)
  - [Backend Setup](#3-backend-setup)
  - [Environment Configuration](#4-configure-environment-variables)
  - [Model Weights Download](#5-model-weights-setup)
  - [Execution](#6-start-the-backend)
- [Model Training and Evaluation Pipeline](#model-training-and-evaluation-pipeline)
- [Academic Disclaimer](#academic-disclaimer)

---

## Abstract

Dental panoramic radiographs (orthopantomograms, OPGs) serve as a standard diagnostic modality in dental medicine; however, visual analysis remains prone to inter-observer variability and missed diagnoses. **Dentalyze Care** was engineered as an automated clinical decision-support system to provide computer-assisted detection for four clinically significant dental conditions:

| Class ID | Pathology | Clinical Definition |
|:--------:|:--------------------|:-------------------------------------------------------------|
| 1 | **Caries** | Localized demineralization and structural decay of enamel and dentin |
| 2 | **Deep Caries** | Extensive carious lesion advancing into close proximity with or exposing the pulp |
| 3 | **Periapical Lesion** | Periapical radiolucency indicating inflammatory or cystic changes at the tooth root apex |
| 4 | **Impacted Tooth** | Dentition prevented from erupting into anatomical position due to physical obstruction |

The system processes input radiographs using a fine-tuned **Faster R-CNN (ResNet-50-FPN)** neural network, scales bounding box predictions back to the native radiograph resolution, and generates structured clinical summaries alongside an interactive viewer with color-coded diagnostic overlays.

---

## System Architecture

```
+---------------------------------------------------------------------+
|                      FRONTEND (React + TypeScript + Vite)           |
|  +----------+  +--------------+  +------------+  +--------------+   |
|  | Auth UI  |  | X-Ray Upload |  | Report View|  | PDF Export   |   |
|  | (Login / |  |  & Analyzer  |  | + Bounding |  |  (jsPDF +    |   |
|  |  Signup) |  |              |  |   Boxes    |  |  html2canvas)|   |
|  +----------+  +-------+------+  +-----+------+  +--------------+   |
|                        |               |                            |
+------------------------+---------------+----------------------------+
                         | REST API      |
                         v               |
+---------------------------------------------------------------------+
|                     BACKEND (FastAPI + SQLAlchemy)                  |
|  +----------+  +--------------+  +--------------+  +------------+   |
|  | Auth &   |  |  Inference   |  |  Gemini API  |  |  SQLite    |   |
|  | JWT      |  |   Service    |  |   Fallback   |  |  Database  |   |
|  | Router   |  |  (PyTorch)   |  |   (LLM NLP)  |  |            |   |
|  +----------+  +-------+------+  +--------------+  +------------+   |
|                        |                                            |
|                +-------v-------+                                    |
|                | Faster R-CNN  |                                    |
|                | ResNet-50-FPN |                                    |
|                | (.pth model)  |                                    |
|                +---------------+                                    |
+---------------------------------------------------------------------+
```

---

## Key Features

- **Automated Pathology Detection**: Object detection model localizes multiple pathologies concurrently with class confidence probabilities.
- **Radiographic Visual Overlays**: Bounding boxes are superimposed directly onto radiographs with standardized color-coding:
  - Caries: Green (`#10B981`)
  - Deep Caries: Red (`#EF4444`)
  - Periapical Lesion: Orange (`#F97316`)
  - Impacted Tooth: Blue (`#3B82F6`)
- **Structured Clinical Reporting**: Synthesizes identified lesions, tooth locations, and qualitative risk indicators into clear documentation.
- **Diagnostic PDF Generation**: Exportable clinical reports including annotated radiographs, patient records, and customizable practice metadata.
- **Role-Based Access Control**: Tailored workflows for dental practitioners (longitudinal patient charts, multi-study comparison) and individual patients.
- **Interactive Radiograph Viewer**: Full pan, zoom, and layer toggles for detailed examination of low-contrast bone and enamel structures.
- **Secure Architecture**: Stateless JSON Web Token (JWT) authorization backed by SQLAlchemy relational persistence.

---

## Model Performance

### Quantitative Evaluation Results

The Faster R-CNN model was evaluated on a held-out validation cohort of **46 radiographs** comprising **182 ground-truth lesions** from the DENTEX benchmark. Evaluation metrics are calculated using an intersection-over-union threshold of **IoU >= 0.50**.

#### Overall Summary

| Metric | Value | FYP Benchmark Target |
|:-----------------------------------|:----------:|:--------------------:|
| **mAP @ IoU 0.50**                 | **48.1%**  | > 45.0%              |
| **Overall Precision**              | **42.7%**  | > 40.0%              |
| **Overall Recall (Sensitivity)**   | **51.6%**  | > 50.0%              |
| **Overall F1-Score**               | **46.8%**  | > 45.0%              |
| **Mean IoU**                       | **0.839**  | > 0.700              |
| **Mean Inference Latency (CPU)**   | 6.5 s/img  | < 10.0 s/img         |
| **Validation Cohort Size**         | 46 images  | Held-out split       |
| **Total Annotated Lesions**        | 182        | Multi-class          |

#### Per-Class Diagnostic Breakdown

| Disease Class | Ground Truth | Predicted | TP | FP | FN | Precision | Recall | F1-Score | Mean IoU |
|:-------------------|:---:|:----:|:---:|:---:|:---:|:---------:|:---------:|:--------:|:--------:|
| **Impacted Tooth**  | 40  | 49   | 34  | 15  | 6   | **69.4%** | **85.0%** | **76.4%**| 0.817    |
| **Dental Caries**   | 101 | 137  | 46  | 91  | 55  | **33.6%** | **45.5%** | **38.7%**| 0.861    |
| **Periapical Lesion**| 9  | 6    | 3   | 3   | 6   | **50.0%** | **33.3%** | **40.0%**| 0.800    |
| **Deep Caries**     | 32  | 28   | 11  | 17  | 21  | **39.3%** | **34.4%** | **36.7%**| 0.827    |

#### Performance Analysis

1. **Localization Fidelity**: The aggregate Mean IoU of **0.839** confirms that when the network identifies a pathology candidate, the spatial boundary of the predicted bounding box correlates tightly with clinical ground-truth contours.
2. **Impacted Tooth Discrimination**: Impacted teeth demonstrate strong performance (F1-Score: 76.4%, Recall: 85.0%) due to distinct crown/root anatomical boundaries against alveolar bone.
3. **Caries and Periapical Detection**: Detection of early-stage demineralization and diffuse periapical radiolucencies reflects typical screening trade-offs, where higher sensitivity supports secondary review by a human specialist.

---

## Technology Stack

### Frontend Architecture
| Layer / Library | Version | Role in Architecture |
|:----------------|:--------|:---------------------|
| **React**       | 19.1.0  | Component hierarchy and reactive state management |
| **TypeScript**  | 5.7.2   | Static type validation and schema consistency |
| **Vite**        | 6.2.0   | Module bundling and development tooling |
| **TailwindCSS** | 3.x     | Systematic design tokens and responsive layout |
| **html2canvas** | 1.4.1   | DOM canvas rendering for radiograph overlays |
| **jsPDF**       | 2.5.1   | Document assembly and PDF generation |

### Backend Architecture
| Layer / Library | Version | Role in Architecture |
|:----------------|:--------|:---------------------|
| **FastAPI**     | >= 0.104 | Asynchronous REST routing and documentation |
| **PyTorch**     | >= 2.1.0 | Deep neural network tensor computation |
| **TorchVision** | >= 0.16.0| Faster R-CNN model definition and transforms |
| **SQLAlchemy**  | >= 2.0.0 | Relational database ORM abstraction |
| **Pydantic**    | >= 2.5.0 | Data transfer object validation |
| **SQLite**      | 3.x     | Local relational storage engine |
| **Pillow**      | >= 10.0  | Image normalization and tensor preprocessing |
| **Gemini API**  | >= 1.3.0 | Supplementary clinical NLP recommendations |

---

## Project Structure

```
Dentalyze Care/
|-- index.html                  # Application HTML entrypoint
|-- App.tsx                     # Main layout and client routing
|-- index.tsx                   # React root mount
|-- types.ts                    # TypeScript data definitions
|-- constants.ts                # Application configuration constants
|-- vite.config.ts              # Vite compiler configuration
|-- tailwind.config.js          # Tailwind styling tokens
|-- package.json                # Frontend package dependencies
|
|-- components/                 # Presentation and container components
|   |-- ImageAnalyzer.tsx       #   Radiograph upload and submission handler
|   |-- ReportDisplay.tsx       #   Pathology report viewer and findings summary
|   |-- XRayViewer.tsx          #   SVG overlay renderer and pan/zoom canvas
|   |-- Navbar.tsx              #   Header navigation and session status
|   |-- Footer.tsx              #   Institutional footer
|   |-- AddPatientModal.tsx     #   Clinical record creation dialog
|   |-- EditPatientModal.tsx    #   Clinical record modification dialog
|   |-- XRayComparisonModal.tsx #   Dual-radiograph side-by-side review
|   `-- ShareReportModal.tsx    #   Secure report sharing utilities
|
|-- pages/                      # Routed views
|   |-- AnalyzerPage.tsx        #   Primary analysis workflow
|   |-- HistoryPage.tsx         #   Archived radiographic studies
|   |-- PatientsPage.tsx        #   Patient cohort management (Dentist view)
|   |-- PatientDetailPage.tsx   #   Individual patient diagnostic records
|   |-- LoginPage.tsx           #   Authentication interface
|   |-- SignupPage.tsx          #   Account registration interface
|   `-- FAQPage.tsx             #   Clinical and system guidance documentation
|
`-- backend/                    # FastAPI backend service
    |-- requirements.txt        #   Python dependency manifest
    |-- .env.example            #   Environment template
    |
    |-- app/                    #   Application core package
    |   |-- main.py             #     Lifespan events, CORS, route registration
    |   |-- config.py           #     Pydantic application settings
    |   |-- database.py         #     Database engine and session management
    |   |-- models/             #     SQLAlchemy table definitions
    |   |-- routers/            #     REST endpoints (auth, analysis, patients)
    |   |-- schemas/            #     Pydantic input/output validation models
    |   `-- services/           #     Domain logic and machine learning inference
    |       |-- inference.py    #       PyTorch Faster R-CNN inference engine
    |       |-- auth_service.py #       Password hashing and JWT generation
    |       `-- gemini_fallback.py #    LLM clinical reasoning integration
    |
    |-- trained_models/         #   Model checkpoints directory
    |   |-- README.md           #     Model placement guidelines
    |   `-- dentex_frcnn_best.pth #   Model weights checkpoint (~158 MB)
    |
    `-- training/               #   Training and validation suite
        |-- Train_Dentalyze_Colab.ipynb # Interactive training notebook (Colab)
        |-- train_dentex.py     #   Training execution script
        |-- prepare_annotations.py # DENTEX JSON to COCO translation
        |-- run_evaluation.py   #   Validation evaluation script
        |-- evaluation_results.json # Serialized evaluation metrics
        `-- evaluation_summary.md # Tabulated evaluation metrics
```

---

## Getting Started

### Prerequisites

| Tool | Recommended Version |
|:-----|:--------------------|
| **Node.js** | >= 18.x (LTS) |
| **Python**  | >= 3.10 |
| **Git**     | >= 2.30 |

---

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulMoiz961/dentalyze-care-dl-cnn-fyp.git
cd dentalyze-care-dl-cnn-fyp
```

---

### 2. Frontend Setup

```bash
# Install NPM dependencies
npm install

# Launch the Vite development server (default: http://localhost:5173)
npm run dev
```

---

### 3. Backend Setup

```bash
cd backend

# Create and activate a Python virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# For systems without dedicated CUDA GPUs (lightweight CPU runtime, ~180 MB):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

---

### 4. Configure Environment Variables

Create the configuration file by copying the example template:

```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

Verify or update the configuration values inside `backend/.env`:

```env
DATABASE_URL=sqlite:///./dentalyze.db
JWT_SECRET_KEY=your-secure-secret-key-for-development
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
MODEL_PATH=./trained_models/dentex_frcnn_best.pth
USE_CNN_MODEL=true
GEMINI_API_KEY=your-gemini-api-key   # Optional fallback for clinical text generation
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
UPLOAD_DIR=./uploads
```

---

### 5. Model Weights Setup

The trained Faster R-CNN model checkpoint (`dentex_frcnn_best.pth`, ~158 MB) is hosted under the official GitHub Releases.

#### Option A: Automated Download (Recommended)

**Windows (PowerShell):**
```powershell
# Run from the project root:
Invoke-WebRequest -Uri "https://github.com/AbdulMoiz961/dentalyze-care-dl-cnn-fyp/releases/download/v1.0.0/dentex_frcnn_best.pth" -OutFile "backend/trained_models/dentex_frcnn_best.pth"
```

**Linux / macOS (Terminal):**
```bash
# Run from the project root:
curl -L -o backend/trained_models/dentex_frcnn_best.pth "https://github.com/AbdulMoiz961/dentalyze-care-dl-cnn-fyp/releases/download/v1.0.0/dentex_frcnn_best.pth"
```

#### Option B: Manual Browser Download

1. Navigate to the release page: [GitHub Releases — v1.0.0](https://github.com/AbdulMoiz961/dentalyze-care-dl-cnn-fyp/releases/tag/v1.0.0)
2. Under **Assets**, download `dentex_frcnn_best.pth`.
3. Save the downloaded file directly into:
   ```
   backend/trained_models/dentex_frcnn_best.pth
   ```

#### Option C: Train Model from Scratch

If you wish to retrain the model weights, refer to the [Model Training Pipeline](#model-training-and-evaluation-pipeline) section.

---

### 6. Start the Backend

From the `backend/` directory with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

Upon startup, the console will confirm successful weight loading:
```
INFO:     Faster R-CNN model loaded successfully from ./trained_models/dentex_frcnn_best.pth
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### 7. Access the Application

- **Web Application Client**: [http://localhost:5173](http://localhost:5173)
- **Interactive REST API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative API Reference (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Model Training and Evaluation Pipeline

The neural network was trained on panoramic radiographs from the [DENTEX Challenge](https://dentex.grand-challenge.org/) benchmark using transfer learning from a ResNet-50-FPN backbone initialized with COCO pre-trained weights.

### Pipeline Workflow

```
DENTEX Dataset (1,104 Radiographs)
               |
               v
+-----------------------------+
|    prepare_annotations.py   |  Transforms DENTEX JSON format into standard COCO schema
|                             |  Partitioning: 80% Training / 20% Validation
+--------------+--------------+
               |
               v
+-----------------------------+
|       train_dentex.py       |  Fine-tunes Faster R-CNN (ResNet-50-FPN)
|                             |  30 Epochs, SGD (lr=0.005, momentum=0.9), StepLR
+--------------+--------------+
               |
               v
+-----------------------------+
|      run_evaluation.py      |  Generates per-class mAP, IoU, Precision, and Recall
|                             |  Serializes output to evaluation_results.json
+-----------------------------+
```

### Google Colab Training Workflow

An interactive notebook configured for cloud GPU acceleration is available at [`backend/training/Train_Dentalyze_Colab.ipynb`](backend/training/Train_Dentalyze_Colab.ipynb):

1. Upload the notebook to [Google Colab](https://colab.research.google.com/).
2. Select an accelerated runtime via **Runtime > Change runtime type > T4 GPU**.
3. Execute the cells sequentially (Steps 1 through 7).
4. Export the resulting `dentex_frcnn_best.pth` checkpoint.

### Hyperparameter Specifications

| Hyperparameter | Configuration |
|:---------------|:--------------|
| Architecture   | Faster R-CNN with Feature Pyramid Network (FPN) |
| Backbone       | ResNet-50 (COCO pre-trained weights) |
| Optimizer      | Stochastic Gradient Descent (SGD) |
| Learning Rate  | 0.005 (decayed by 0.1 at epochs 10 and 20 via StepLR) |
| Momentum       | 0.9 |
| Weight Decay   | 0.0005 |
| Mini-Batch Size| 4 |
| Target Epochs  | 30 |
| Input Scaling  | Fixed aspect-ratio resize to 1024 x 1024 pixels |
| Augmentations  | Random horizontal flip (p=0.5), subtle contrast/brightness jitter |
| Classes        | 5 (Background + 4 Target Dental Pathologies) |

---

## Academic Disclaimer

> **Notice:** Dentalyze Care was developed as an undergraduate Final Year Project (FYP) for academic, research, and educational demonstration purposes. It is **not** certified as a medical device by regulatory authorities (FDA, CE, or equivalent) and is not intended for primary clinical diagnosis or autonomous patient treatment planning.
>
> All analytical outputs generated by the deep learning system should be treated as investigational decision-support data subject to validation by licensed dental professionals.

---

<p align="center">
  Dentalyze Care &mdash; Final Year Project<br/>
  School of Computer Science &bull; Deep Learning for Healthcare
</p>
