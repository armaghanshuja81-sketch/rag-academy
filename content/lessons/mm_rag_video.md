---
id: mm_rag_video
title: Multi-Modal RAG Video
tier: expert
difficulty: expert
estimated_minutes: 30
module: multi-modal-rag
prerequisites: [mm_rag_images, mm_rag_audio]
tags: [video, frame-extraction, temporal-chunking, multi-modal-fusion, scene-retrieval]
---

## Concept Introduction
Video RAG retrieves and reasons over the richest medium — synchronized visual frames, audio tracks, and on-screen text. The challenge is temporal: a 10-minute video contains ~18,000 frames, and the answer to "when does the presenter demonstrate the bug fix?" requires aligning what is shown (visual), what is said (audio), and when it happens (timestamp). Video RAG fuses all three modalities into a temporally indexed retrieval structure.

## How It Works
**Frame extraction** is the first decision point. Uniform sampling (1 fps) is simple but misses fast action and oversamples static slides. Keyframe detection (shot boundary detection using color histogram differences) extracts representative frames at scene transitions. For tutorial videos, slide-change detection using SSIM (Structural Similarity Index) differences captures content boundaries more reliably than color-based methods.

**Temporal chunking** divides video into semantically coherent segments — "scenes" or "chapters." Each chunk is a data structure containing: start/end timestamps, keyframe images, transcribed audio, extracted OCR text, and optionally detected objects/actions. Chunk boundaries are determined by combining signals: audio speaker changes, visual scene cuts, and detected topic shifts in the transcript.

**Multi-modal fusion for retrieval** can happen at three levels. Early fusion concatenates all modality embeddings into one vector per chunk — simple but loses modality-specific signals. Late fusion retrieves each modality independently and merges result lists using reciprocal rank fusion (RRF). Score-level fusion computes per-modality similarity scores and learns a weighted combination: `score = alpha * visual_score + beta * audio_score + gamma * text_score`.

**Scene-level retrieval** treats each scene chunk as a structured document with typed fields: `{visual_context, spoken_content, on_screen_text, temporal_position, scene_type}`. The query is decomposed into sub-queries targeting specific fields — "show me the architecture diagram" targets `on_screen_text` and `visual_context`, while "what does she say about latency?" targets `spoken_content`.

**Video+audio+text fusion at answer time** sends the top-K scene chunks to a VLM capable of video understanding (Gemini 1.5 Pro with native video input, or GPT-4V with extracted keyframes). The VLM receives the keyframes, the transcript excerpt, and the OCR text for each scene, producing a temporally grounded answer with timestamps.

## Code Examples

```python
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from dataclasses import dataclass, field

@dataclass
class VideoChunk:
    chunk_id: str
    start_time: float
    end_time: float
    keyframes: list[np.ndarray]
    transcript: str
    ocr_text: str
    scene_type: str = "unknown"

def detect_shot_boundaries(video_path: str, threshold: float = 30.0) -> list[float]:
    """Detect scene cuts using color histogram differences."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    boundaries = []
    prev_hist = None
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        hist = cv2.calcHist([frame], [0, 1, 2], None, [8, 8, 8],
                            [0, 256, 0, 256, 0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        if prev_hist is not None:
            diff = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CHISQR)
            if diff > threshold:
                boundaries.append(frame_idx / fps)
        prev_hist = hist
        frame_idx += 1
    cap.release()
    return boundaries

def detect_slide_changes(video_path: str, sample_interval: int = 30) -> list[float]:
    """Detect slide changes using SSIM — better for tutorial videos."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    changes = []
    prev_frame = None
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, (320, 240))
            if prev_frame is not None:
                score = ssim(prev_frame, gray, data_range=255)
                if score < 0.85:  # SSIM drop = slide change
                    changes.append(frame_idx / fps)
            prev_frame = gray
        frame_idx += 1
    cap.release()
    return changes

def reciprocal_rank_fusion(result_lists: list[list[str]], k: int = 60) -> list[str]:
    """Fuse ranked lists from multiple modalities using RRF."""
    scores = {}
    for results in result_lists:
        for rank, doc_id in enumerate(results):
            scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)
```

## Try It Yourself
Download a technical conference talk (~30 minutes). Build a video RAG pipeline: (a) frame extraction with slide-change detection, (b) Whisper transcription aligned to timestamps, (c) OCR text extraction from keyframes using Tesseract, (d) multi-modal embedding and indexing (CLIP for frames, text embeddings for transcript+OCR), (e) RRF-based fusion retrieval. Query with: "Show me the performance comparison slide and summarize what the speaker says about it." Evaluate retrieval accuracy by manually annotating ground-truth timestamps for 10 queries.

## Real-World RAG Connection
Google's Gemini 1.5 Pro with 1M+ token context windows can ingest entire videos natively, raising the question of whether video RAG indexing is even necessary versus direct video ingestion. In practice, retrieval-augmented video search is the cost-effective solution — indexing 10,000 hours of video costs a fraction of processing each query through a long-context model. Twelve Labs builds video understanding APIs used in production for content moderation and media search. The open problem is video moment retrieval — pinpointing a 5-second clip within a 2-hour video — which requires fine-grained temporal alignment beyond current capabilities.

## Common Pitfalls
**Pitfall:** Keyframe extraction misses critical content that appears between detected boundaries — a diagram that flashes for 2 seconds between scene cuts. **Fix:** Use an anomaly-based keyframe detector that identifies frames with unusually high information density (text density, object count) in addition to boundary-based sampling.

**Pitfall:** OCR on video frames produces noisy text because of compression artifacts, motion blur, and low contrast. **Fix:** Apply super-resolution preprocessing to keyframes using ESRGAN or similar before OCR, and aggregate OCR text across consecutive frames near each keyframe to vote on the correct characters.

**Pitfall:** The fusion re-ranker overweights one modality (usually transcript) because its similarity scores have a different dynamic range than visual scores. **Fix:** Normalize each modality's scores to a standard distribution (z-score normalization) before fusion. Calibrate fusion weights on a held-out query set with ground-truth relevance judgments.

## Next Steps
Read the Twelve Labs video understanding API documentation. Study Gemini 1.5 Pro's native video understanding. Take mm_rag_tables to learn table extraction from documents.
