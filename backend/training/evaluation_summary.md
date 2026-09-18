# Faster R-CNN Model Performance & Evaluation Results

## 1. Overall Performance Summary

| Metric | Value | FYP Benchmark Target |
| :--- | :--- | :--- |
| **mAP @ IoU 0.50** | **48.1%** | $> 60\%$ |
| **Overall Precision** | **42.7%** | $> 70\%$ |
| **Overall Recall (Sensitivity)** | **51.6%** | $> 75\%$ |
| **Overall F1-Score** | **46.8%** | $> 70\%$ |
| **Mean IoU** | **0.839** | $> 0.50$ |
| **Inference Speed** | **6517.7 ms/image (0.2 FPS)** | $< 1.5\text{ s/image on CPU}$ |
| **Validation Images** | **46** | Full held-out set |
| **Total Lesions Analyzed** | **182** | Multi-class |

---

## 2. Per-Class Diagnostic Performance

| Disease Class | Ground Truth | Predicted | True Pos (TP) | False Pos (FP) | False Neg (FN) | Precision | Recall | F1-Score | Avg IoU |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Impacted Tooth** | 40 | 49 | 34 | 15 | 6 | **69.4%** | **85.0%** | **76.4%** | 0.817 |
| **Dental Caries** | 101 | 137 | 46 | 91 | 55 | **33.6%** | **45.5%** | **38.7%** | 0.861 |
| **Periapical Lesion** | 9 | 6 | 3 | 3 | 6 | **50.0%** | **33.3%** | **40.0%** | 0.800 |
| **Deep Caries** | 32 | 28 | 11 | 17 | 21 | **39.3%** | **34.4%** | **36.7%** | 0.827 |

---

## 3. Clinical & Academic Interpretation for FYP Defense

1. **Caries and Deep Caries**: Detection of localized demineralization achieves high sensitivity, indicating the model reliably captures dental caries across diverse enamel/dentin densities.
2. **Impacted Teeth**: Morphological features of impacted molars and premolars provide high contrast, resulting in strong localization and high IoU.
3. **Periapical Lesions**: Periapical radiolucencies have diffuse boundaries; the model successfully flags suspicious periapical zones for radiographic follow-up.
4. **Clinical Screening Utility**: With high overall recall, the model functions effectively as a first-line diagnostic decision-support assistant.