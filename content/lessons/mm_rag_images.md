---
id: mm_rag_images
title: Multi-Modal RAG Images
tier: expert
difficulty: expert
estimated_minutes: 30
module: multi-modal-rag
prerequisites: [advanced_retrieval]
tags: [clip, colpali, colbert, vision-language, multi-modal, late-interaction]
---

## Concept Introduction
Multi-modal RAG for images retrieves and reasons over visual content — photographs, diagrams, charts, screenshots — not just the text that happens to appear near them. The core challenge is the modality gap: text embeddings and image embeddings live in different vector spaces, so naive approaches that embed everything with a text model miss visual semantics entirely. CLIP embeddings and ColPali-style late interaction are the two dominant paradigms for closing this gap.

## How It Works
**CLIP embeddings** (Radford et al., 2021) train a dual-encoder model on 400M image-text pairs to produce aligned vector representations. A text query "diagram of a transformer attention head" and an image of that diagram map to nearby points in a shared embedding space. For RAG, you pre-encode all images in your corpus with the CLIP vision encoder, store the vectors, and at query time encode the user's text with the CLIP text encoder and perform ANN search. This is fast and scalable but loses fine-grained alignment — CLIP can tell you an image is "about" a topic but cannot localize which region of the image matches which part of the query.

**ColPali / ColBERT late interaction** represents a different tradeoff. Instead of encoding the entire image into one vector, ColPali uses a vision-language model (PaliGemma) to produce a grid of patch-level embeddings — one vector per image region. A text query is also encoded into multiple token-level vectors. Retrieval computes the sum of maximum cosine similarities between each query token and its best-matching image patch. This "late interaction" (also called MaxSim in ColBERT) is more expensive at query time but captures spatial alignment: "the red circle in the top-left corner" actually finds images with a red circle in the top-left corner.

**Vision-language models (VLMs)** for answer generation — GPT-4V, Claude Vision, LLaVA — read the retrieved images and produce a textual answer. The RAG pipeline retrieves top-K images, sends them alongside the text query to a VLM, and the VLM synthesizes a response grounded in visual evidence. The VLM can also generate follow-up questions if the retrieved images are insufficient, enabling an agentic loop.

## Code Examples

```python
import numpy as np
from openai import OpenAI
import torch
from transformers import CLIPProcessor, CLIPModel

# CLIP-based image retrieval
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def encode_images(image_paths: list[str]) -> np.ndarray:
    """Encode a corpus of images into CLIP embedding vectors."""
    from PIL import Image
    images = [Image.open(p) for p in image_paths]
    inputs = clip_processor(images=images, return_tensors="pt", padding=True)
    with torch.no_grad():
        embeddings = clip_model.get_image_features(**inputs)
    embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)
    return embeddings.numpy()

def retrieve_images(query: str, image_embeddings: np.ndarray,
                    image_paths: list[str], top_k: int = 5) -> list[dict]:
    """Retrieve top-k images for a text query using CLIP."""
    inputs = clip_processor(text=[query], return_tensors="pt", padding=True)
    with torch.no_grad():
        text_emb = clip_model.get_text_features(**inputs)
    text_emb = text_emb / text_emb.norm(dim=-1, keepdim=True)
    text_emb = text_emb.numpy()
    scores = np.dot(image_embeddings, text_emb.T).flatten()
    top_indices = np.argsort(scores)[-top_k:][::-1]
    return [{"path": image_paths[i], "score": float(scores[i])} for i in top_indices]

# ColPali-style late interaction (simplified)
def late_interaction_score(query_embeddings: np.ndarray,
                           image_patch_embeddings: np.ndarray) -> float:
    """MaxSim: for each query token, find the best-matching image patch."""
    # query_embeddings: (n_tokens, dim)
    # image_patch_embeddings: (n_patches, dim)
    similarities = np.dot(query_embeddings, image_patch_embeddings.T)  # (n_tokens, n_patches)
    max_per_token = similarities.max(axis=1)  # best patch per query token
    return float(max_per_token.sum())
```

## Try It Yourself
Build a dual retrieval system: CLIP for initial candidate generation (top-100 from 100K images) and simulated ColPali late interaction for re-ranking (top-5 from the 100). Use a VLM (GPT-4V or Claude Vision) for answer generation. Test on a dataset of technical diagrams with questions like "Which component connects the encoder output to the decoder cross-attention?" Measure: (a) recall@5 of CLIP-only vs CLIP+ColPali, (b) VLM answer accuracy with and without the retrieved images, (c) end-to-end latency breakdown.

## Real-World RAG Connection
CLIP powers image search in production at companies like Canva and Pinterest. ColPali (Faysse et al., 2024) pushes state-of-the-art on document retrieval benchmarks like ViDoRe by combining late interaction with a vision-language backbone. The Vidore benchmark evaluates retrieval across visually rich documents — PDFs, infographics, scanned forms — and is the current standard for measuring image-aware retrieval quality.

## Common Pitfalls
**Pitfall:** CLIP embeddings collapse visual details — two charts with different data but similar layout get near-identical embeddings. **Fix:** Use ColPali late interaction for the final retrieval stage. The patch-level matching captures spatial layout differences that single-vector approaches miss.

**Pitfall:** VLMs hallucinate content from images, especially when the image resolution is low or text within the image is small. **Fix:** Preprocess retrieved images with OCR (e.g., Tesseract, AWS Textract) and include extracted text as a text chunk sent alongside the image to the VLM. This gives the model both the visual and textual representation.

**Pitfall:** Image retrieval latency exceeds user tolerance because encoding every image patch for ColPali is expensive. **Fix:** Use CLIP for fast candidate generation (sub-10ms on FAISS) and restrict ColPali re-ranking to the top-50 candidates. Pre-compute ColPali patch embeddings and store them alongside the CLIP embeddings.

## Next Steps
Read the ColPali paper (Faysse et al., 2024). Study the ViDoRe benchmark leaderboard. Take mm_rag_audio to extend multi-modal retrieval to audio content.
