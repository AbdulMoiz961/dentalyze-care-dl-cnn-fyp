# Model Training Guide — Dentalyze Care

This directory contains the scripts and configurations to train and evaluate the Faster R-CNN (ResNet50-FPN) dental disease detection model.

---

## 1. Option A: Google Colab CLI (Terminal)

The Google Colab CLI (`google-colab-cli`) is installed and pre-configured for Windows with launchers:
- Batch script: `colab.bat`
- PowerShell script: `colab.ps1`

### Step 1: Authenticate
Authenticate using your Google account:
```powershell
# In PowerShell:
.\colab.ps1 --auth=oauth2 new -s dentex --gpu T4
```
*(A browser window will open requesting Google Colab access permissions.)*

### Step 2: Install remote dependencies
```powershell
.\colab.ps1 install -s dentex torch torchvision opencv-python-headless tqdm scikit-learn
```

### Step 3: Run the training script remotely
```powershell
.\colab.ps1 exec -s dentex -f train_dentex.py
```

### Step 4: Download the trained checkpoint
```powershell
.\colab.ps1 download -s dentex /content/dentex_frcnn_best.pth ../trained_models/dentex_frcnn_best.pth
```

### Step 5: Stop the session
```powershell
.\colab.ps1 stop -s dentex
```

---

## 2. Option B: Google Colab Web Notebook (GUI)

If you prefer using the browser interface:
1. Open [Google Colab](https://colab.research.google.com/).
2. Upload and open [Train_Dentalyze_Colab.ipynb](file:///d:/CS/fyp/Dentalyze%20Care/backend/training/Train_Dentalyze_Colab.ipynb).
3. Select **Runtime > Change runtime type > T4 GPU** (available on free tier).
4. Run the notebook cells sequentially to train the model.
5. The notebook will automatically trigger a browser download for `dentex_frcnn_best.pth`.
6. Place `dentex_frcnn_best.pth` inside `backend/trained_models/`.

---

## 3. Local Evaluation

After placing `dentex_frcnn_best.pth` into `backend/trained_models/`, run evaluation:
```bash
python evaluate.py --model_path ../trained_models/dentex_frcnn_best.pth --data_dir ../../Dental_Dataset_1104
```
To test on a single image and save color-coded bounding box visualizations:
```bash
python evaluate.py --model_path ../trained_models/dentex_frcnn_best.pth --image_path sample_xray.png --output_dir ./eval_output
```
