<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/PyTorch-2.1+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch"/>
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-Academic-orange?style=for-the-badge" alt="License"/>
</p>

# 🦷 Dentalyze Care — AI-Powered Dental Pathology Detection System

> An end-to-end web application that leverages a **Faster R-CNN** deep learning model trained on the [DENTEX Challenge](https://dentex.grand-challenge.org/) dataset to automatically detect and localize dental pathologies from panoramic radiographs (OPGs).

---

## 📋 Table of Contents

- [Abstract](#abstract)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Model Performance](#model-performance)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Model Training](#model-training)
- [Disclaimer](#disclaimer)

---

## Abstract

Dental panoramic radiographs are a primary diagnostic tool used by dentists worldwide, yet their interpretation is highly subjective and depends on clinician experience. **Dentalyze Care** addresses this gap by providing an AI-powered clinical decision-support system that automatically detects and localizes four categories of dental pathologies:

| Class ID | Pathology | Description |
|:--------:|:--------------------|:----------------------------------------------|
| 1 | **Caries** | Tooth decay / dental cavities |
| 2 | **Deep Caries** | Advanced decay near or involving the pulp |
| 3 | **Periapical Lesion** | Infection at the root tip of a tooth |
| 4 | **Impacted Tooth** | Tooth that has failed to emerge properly |

The system processes uploaded dental X-ray images through a fine-tuned **Faster R-CNN (ResNet-50-FPN)** object detection model, generates color-coded bounding box annotations overlaid on the radiograph, and produces comprehensive diagnostic reports with AI-generated clinical recommendations.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript + Vite)         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Auth UI  │  │ X-Ray Upload │  │ Report View│  │ PDF Export   │  │
│  │  (Login/  │  │ & Analyzer   │  │ + Bounding │  │ (jsPDF +     │  │
│  │  Signup)  │  │              │  │   Boxes    │  │  html2canvas) │  │
│  └──────────┘  └──────┬───────┘  └─────┬──────┘  └──────────────┘  │
│                       │                │                            │
└───────────────────────┼────────────────┼────────────────────────────┘
                        │  REST API      │
                        ▼                │
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + SQLAlchemy)                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Auth &   │  │  Inference   │  │  Gemini API  │  │  SQLite    │  │
│  │ JWT      │  │  Service     │  │  Fallback    │  │  Database  │  │
│  │ Router   │  │  (PyTorch)   │  │  (LLM NLP)   │  │            │  │
│  └──────────┘  └──────┬───────┘  └──────────────┘  └────────────┘  │
│                       │                                             │
│               ┌───────▼───────┐                                     │
│               │ Faster R-CNN  │                                     │
│               │ ResNet-50-FPN │                                     │
│               │ (.pth model)  │                                     │
│               └───────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

- **🔬 AI-Powered Detection** — Faster R-CNN model identifies and localizes 4 dental pathologies with color-coded bounding boxes directly on the radiograph
- **📊 Comprehensive Reports** — Generates detailed clinical reports with detected conditions, severity levels, confidence scores, and actionable recommendations
- **🎨 Visual Annotations** — Color-coded overlays on X-rays: 🟢 Caries, 🔴 Deep Caries, 🟠 Periapical Lesions, 🔵 Impacted Teeth
- **📄 PDF Export** — One-click PDF generation with bounding box annotations, clinical findings, and branding support
- **👨‍⚕️ Dual User Roles** — Separate workflows for Patients and Dentists with patient management capabilities
- **📁 Analysis History** — Persistent storage of all past analyses with comparison features
- **🔍 Zoom & Pan** — Interactive X-ray viewer with zoom, pan, and annotation toggle
- **📱 Responsive Design** — Fully responsive UI optimized for desktop and mobile
- **🔒 Secure Auth** — JWT-based authentication with SQLAlchemy ORM

---

## Model Performance

### Quantitative Evaluation Results

The Faster R-CNN model was evaluated on a held-out validation set of **46 images** (containing **182 annotated lesions**) from the DENTEX dataset. All metrics are computed at **IoU ≥ 0.50**.

#### Overall Performance

| Metric | Value |
|:-------------------------------|:----------:|
| **mAP @ IoU 0.50** | **48.1%** |
| **Overall Precision** | **42.7%** |
| **Overall Recall (Sensitivity)** | **51.6%** |
| **Overall F1-Score** | **46.8%** |
| **Mean IoU** | **0.839** |
| **Inference Speed (CPU)** | 6.5 s/img |
| **Total Validation Lesions** | 182 |

#### Per-Class Diagnostic Breakdown

| Disease Class | GT | Pred | TP | FP | FN | Precision | Recall | F1 | Avg IoU |
|:-------------------|:---:|:----:|:---:|:---:|:---:|:---------:|:------:|:-----:|:-------:|
| **Impacted Tooth** | 40 | 49 | 34 | 15 | 6 | 69.4% | 85.0% | 76.4% | 0.817 |
| **Dental Caries** | 101 | 137 | 46 | 91 | 55 | 33.6% | 45.5% | 38.7% | 0.861 |
| **Periapical Lesion** | 9 | 6 | 3 | 3 | 6 | 50.0% | 33.3% | 40.0% | 0.800 |
| **Deep Caries** | 32 | 28 | 11 | 17 | 21 | 39.3% | 34.4% | 36.7% | 0.827 |

> **Key Takeaways:**
> - **Excellent localization** — Mean IoU of **0.839** demonstrates the model's bounding boxes are highly accurate when a detection is made
> - **Strong Impacted Tooth detection** — F1 of **76.4%** with 85% recall, indicating reliable identification of morphologically distinct pathologies
> - **Clinical screening utility** — High recall ensures most pathologies are flagged for radiographic follow-up, minimizing missed diagnoses

#### Abbreviations

| Symbol | Meaning |
|:-------|:--------|
| GT | Ground Truth annotations |
| Pred | Model predictions |
| TP | True Positives (correct detections) |
| FP | False Positives (incorrect detections) |
| FN | False Negatives (missed detections) |
| IoU | Intersection over Union (localization quality) |
| mAP | Mean Average Precision |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **React 19** | UI component framework |
| **TypeScript 5.7** | Type-safe development |
| **Vite 6** | Build tool & dev server |
| **TailwindCSS** | Utility-first styling |
| **jsPDF + html2canvas** | Client-side PDF generation |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **FastAPI** | Async REST API framework |
| **PyTorch 2.1+** | Deep learning inference |
| **TorchVision** | Faster R-CNN implementation |
| **SQLAlchemy 2.0** | ORM & database management |
| **SQLite** | Lightweight relational database |
| **Pillow** | Image preprocessing |
| **Google Gemini API** | LLM-generated clinical recommendations |

### ML / Training
| Technology | Purpose |
|:-----------|:--------|
| **Faster R-CNN (ResNet-50-FPN)** | Object detection architecture |
| **DENTEX Dataset** | Training data (1,104 panoramic X-rays) |
| **Google Colab** | GPU-accelerated training environment |

---

## Project Structure

```
Dentalyze Care/
├── 📄 index.html                  # Entry HTML
├── 📄 App.tsx                     # Main app with routing
├── 📄 index.tsx                   # React entry point
├── 📄 types.ts                    # TypeScript interfaces
├── 📄 constants.ts                # App constants
├── 📄 vite.config.ts              # Vite configuration
├── 📄 tailwind.config.js          # TailwindCSS config
├── 📄 package.json                # Frontend dependencies
│
├── 📂 components/                 # Reusable UI components
│   ├── ImageAnalyzer.tsx          #   X-ray upload & analysis trigger
│   ├── ReportDisplay.tsx          #   Clinical report rendering
│   ├── XRayViewer.tsx             #   Interactive viewer + bounding boxes
│   ├── Navbar.tsx                 #   Navigation bar
│   ├── Footer.tsx                 #   Footer section
│   └── ...                        #   Modals, sections, alerts
│
├── 📂 pages/                      # Page-level components
│   ├── AnalyzerPage.tsx           #   Main analysis workflow
│   ├── HistoryPage.tsx            #   Analysis history
│   ├── PatientsPage.tsx           #   Patient management (Dentist)
│   ├── LoginPage.tsx              #   Authentication
│   └── ...                        #   Signup, FAQ, Profile
│
├── 📂 contexts/                   # React Context providers
├── 📂 services/                   # API service layer
├── 📂 models/                     # Frontend data models
│
└── 📂 backend/                    # Python FastAPI backend
    ├── 📄 requirements.txt        #   Python dependencies
    ├── 📄 .env.example            #   Environment template
    │
    ├── 📂 app/                    #   FastAPI application
    │   ├── main.py                #     App entry + CORS + lifespan
    │   ├── config.py              #     Settings & configuration
    │   ├── database.py            #     SQLAlchemy setup
    │   ├── 📂 models/             #     SQLAlchemy ORM models
    │   ├── 📂 routers/            #     API route handlers
    │   ├── 📂 schemas/            #     Pydantic request/response schemas
    │   └── 📂 services/           #     Business logic & inference
    │       └── inference.py       #       Faster R-CNN model loading & inference
    │
    ├── 📂 trained_models/         #   Model weights directory
    │   ├── README.md              #     Setup instructions
    │   └── dentex_frcnn_best.pth  #     Best model checkpoint (~158 MB, git-ignored)
    │
    └── 📂 training/               #   Training & evaluation scripts
        ├── Train_Dentalyze_Colab.ipynb  # Google Colab training notebook
        ├── train_dentex.py        #     Local training script
        ├── prepare_annotations.py #     DENTEX → COCO annotation converter
        ├── run_evaluation.py      #     Quantitative evaluation script
        ├── evaluate.py            #     Evaluation utilities
        ├── evaluation_results.json#     Cached evaluation metrics
        └── evaluation_summary.md  #     Formatted results table
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| **Node.js** | ≥ 18.x |
| **Python** | ≥ 3.10 |
| **pip** or **uv** | Latest |
| **Git** | Latest |

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Dentalyze-Care.git
cd Dentalyze-Care
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

### 3. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# For CPU-only PyTorch (smaller download, ~180 MB):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

### 4. Configure Environment Variables

```bash
# Copy the example env file
cp backend/.env.example backend/.env

# Edit backend/.env and set:
#   JWT_SECRET_KEY=<your-secret-key>
#   GEMINI_API_KEY=<your-gemini-api-key>   (optional, for AI recommendations)
#   USE_CNN_MODEL=true                     (to use the trained Faster R-CNN)
```

### 5. Model Weights

The trained model file (`dentex_frcnn_best.pth`, ~158 MB) is **not included** in the repository due to its size. You have two options:

**Option A — Train from scratch** (requires GPU):
```bash
# See the "Model Training" section below
```

**Option B — Download pre-trained weights**:
> Contact the repository maintainer or check the [Releases](https://github.com/YOUR_USERNAME/Dentalyze-Care/releases) page for the model checkpoint.

Place the `.pth` file in:
```
backend/trained_models/dentex_frcnn_best.pth
```

### 6. Start the Backend

```bash
cd backend

# Activate the virtual environment
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # macOS/Linux

# Start the FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 7. Open the Application

With both servers running:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

Create an account, upload a dental panoramic X-ray, and view the analysis report with bounding box annotations.

---

## Model Training

The Faster R-CNN model is trained on the [DENTEX Challenge](https://dentex.grand-challenge.org/) dataset using Google Colab for GPU acceleration.

### Training Pipeline

```
DENTEX Dataset (1,104 OPGs)
        │
        ▼
┌─────────────────────┐
│ prepare_annotations  │  Convert DENTEX JSON → COCO format
│        .py           │  Split: 80% train / 20% validation
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   train_dentex.py   │  Fine-tune Faster R-CNN (ResNet-50-FPN)
│                     │  Pretrained on COCO → Transfer Learning
│                     │  30 epochs, lr=0.005, SGD + momentum
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  run_evaluation.py  │  Compute mAP, Precision, Recall, F1, IoU
│                     │  Generate evaluation_results.json
└─────────────────────┘
```

### Quick Start (Google Colab)

1. Open [`backend/training/Train_Dentalyze_Colab.ipynb`](backend/training/Train_Dentalyze_Colab.ipynb) in Google Colab
2. Enable GPU runtime: `Runtime → Change runtime type → T4 GPU`
3. Run all cells sequentially (Steps 1–7)
4. Download the trained `dentex_frcnn_best.pth` from the output

### Training Hyperparameters

| Parameter | Value |
|:----------|:------|
| Base Model | Faster R-CNN (ResNet-50-FPN) |
| Pre-training | COCO 2017 |
| Optimizer | SGD (lr=0.005, momentum=0.9, weight_decay=0.0005) |
| Scheduler | StepLR (step=10, gamma=0.1) |
| Epochs | 30 |
| Batch Size | 4 |
| Image Size | 1024 × 1024 (aspect-ratio preserved) |
| Augmentation | Horizontal flip, color jitter, Gaussian blur |
| Num Classes | 5 (4 pathologies + background) |

---

## Disclaimer

> **⚠️ Dentalyze Care is an academic/research project developed as a Final Year Project (FYP). It is NOT a certified medical device and should NOT be used for clinical diagnosis.**
>
> The AI analysis provided is for **educational and research purposes only**. It may produce inaccurate results and is not a substitute for professional dental evaluation. Always consult a qualified dental professional for diagnosis and treatment recommendations.
>
> The model's performance metrics (mAP: 48.1%, Recall: 51.6%) indicate it is suitable as a **screening aid** to assist — not replace — clinical decision-making.

---

<p align="center">
  <strong>Dentalyze Care</strong> — Final Year Project<br/>
  Built with ❤️ using PyTorch, FastAPI, and React
</p>
