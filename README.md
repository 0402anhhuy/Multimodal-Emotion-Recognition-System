# Multimodal Emotion Recognition

🌐 **Demo:** [Emotion Recognition App](https://multimodal-emotion-recognition-syst.vercel.app/)


## Liên kết dự án

|                                | Link                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🎨 **Frontend (Vercel)**       | [Emotion Recognition App](https://multimodal-emotion-recognition-syst.vercel.app/)                                                                   |
| ⚙️ **Backend (HF Spaces)**     | [huggingface.co/spaces/anhhuy0402/Multimodal_Emotion_Recognition_BE](https://huggingface.co/spaces/anhhuy0402/Multimodal_Emotion_Recognition_BE) |
| 📓 **Notebook — Text Model**   | [kaggle.com/code/trananhhuy0402/mvsa-ml-model-text-hf](https://www.kaggle.com/code/trananhhuy0402/mvsa-ml-model-text-hf)                               |
| 📓 **Notebook — Image Model**  | [kaggle.com/code/trananhhuy0402/mvsa-ml-model-image-hf](https://www.kaggle.com/code/trananhhuy0402/mvsa-ml-model-image-hf)                             |
| 📓 **Notebook — Fusion Model** | [kaggle.com/code/trananhhuy0402/mvsa-ml-model-fusion-hf](https://www.kaggle.com/code/trananhhuy0402/mvsa-ml-model-fusion-hf)                           |

## Tính năng

- Hiển thị **breakdown xác suất** (Positive / Neutral / Negative) cho từng model
- Hiển thị **chỉ số đánh giá** (Accuracy, F1, Precision, Recall) của 3 model

## Kiến trúc hệ thống

```
┌─────────────────────┐         ┌──────────────────────────────┐
│                     │  POST   │                              │
│   Frontend (Vercel) │ ──────► │  Backend (HuggingFace Space) │
│   index.html        │         │  FastAPI + scikit-learn      │
│   style.css         │ ◄────── │                              │
│   script.js         │  JSON   │  /predict                    │
└─────────────────────┘         |                              |
                                └──────────────────────────────┘
                                              │
                                ┌──────────────────────────────┐
                                │     Kaggle Notebook Output   │
                                │  text_model.pkl   (5.2 MB)   │
                                │  text_tfidf.pkl   (0.3 MB)   │
                                │  image_model.pkl (176.5 MB)  │
                                │  image_scaler.pkl (0.0 MB)   │
                                │  image_pca.pkl    (8.6 MB)   │
                                │  fusion_model.pkl (48.9 MB)  │
                                └──────────────────────────────┘
```

## Cấu trúc thư mục

```
/Multimodal_Emotion_Recognition_UI
├── index.html
├── style.css
├── app.js
└── README.md
```

## Models

| Model      | Thuật toán                                     | Accuracy | F1    |
| ---------- | ---------------------------------------------- | -------- | ----- |
| **Text**   | TF-IDF + VotingClassifier (SVM + LR + NB)      | 87.3%    | 0.864 |
| **Image**  | HOG + LBP + Ensemble (Random Forest)           | 79.1%    | 0.783 |
| **Fusion** | Meta-stacking (Text proba + Image proba → SVM) | 91.7%    | 0.912 |

## Sử dụng

1. Mở web app
2. Bấm **Ping** để kiểm tra kết nối — chờ badge chuyển `API online · Models loaded`
3. Nhập text và upload ảnh
4. Bấm **Phân tích ngay** để xem kết quả
