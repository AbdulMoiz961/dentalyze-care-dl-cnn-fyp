# Trained Models Directory

Place trained model `.pth` files here.

## Expected files:
- `dentex_frcnn_best.pth` — Best model checkpoint (used by the backend)
- `dentex_frcnn_initial.pth` — Initial training checkpoint
- `dentex_frcnn_finetuned.pth` — Fine-tuned model

## How to train:
```bash
cd backend
python training/prepare_annotations.py --data_dir ../Dental_Dataset_1104
python training/train_dentex.py --data_dir ../Dental_Dataset_1104 --epochs 30 --output_dir ./trained_models
```

The backend will automatically load `dentex_frcnn_best.pth` on startup.
If the model file is not found, it will fall back to Gemini API (if configured).
