---
id: mm_rag_audio
title: Multi-Modal RAG Audio
tier: expert
difficulty: expert
estimated_minutes: 30
module: multi-modal-rag
prerequisites: [mm_rag_images]
tags: [audio, whisper, clap, transcription, podcast, meeting-intelligence]
---

## Concept Introduction
Audio RAG makes spoken content searchable and queryable — meeting recordings, podcasts, customer calls, lecture archives. The pipeline bridges two modalities: raw audio waveforms must be converted to text for semantic retrieval, but audio-native embeddings (CLAP) can capture paralinguistic features that text alone misses — tone, emotion, speaker identity, background context. The frontier is hybrid retrieval that combines transcript-based semantic search with audio-native similarity.

## How It Works
**Transcription layer** — Whisper (OpenAI) converts speech to text with word-level timestamps. For RAG, you need more than raw transcripts: speaker diarization (who said what), chapter segmentation, and non-verbal event detection (applause, laughter, silence). The transcription output is a structured document: `[{speaker, start_time, end_time, text, confidence}]`.

**Audio embeddings (CLAP)** — Contrastive Language-Audio Pretraining learns a joint embedding space for audio and text. Unlike transcription-first approaches, CLAP captures acoustic properties: a query like "urgent-sounding customer call" retrieves calls with distressed vocal patterns even if the words are mundane. CLAP embeddings are complementary to text embeddings, not replacements.

**Chunking strategies for audio** differ fundamentally from text chunking. Audio has a temporal dimension: you cannot split mid-sentence without losing context. Effective strategies include: (a) speaker-turn boundaries — chunk at speaker changes, (b) semantic segmentation — use an LLM to detect topic shifts in the transcript, (c) fixed-duration windows (30-120 seconds) with overlap, (d) hybrid — chunk at speaker turns but merge chunks shorter than 20 seconds.

**Podcast search** combines transcript retrieval with metadata filtering (episode title, guest name, publication date). The retrieval index stores transcript chunks alongside CLAP embeddings and metadata vectors in a unified hybrid index.

**Meeting intelligence** adds action item extraction, decision tracking, and cross-meeting reference resolution. The RAG system must answer "What did Alice say about the Q3 budget in last month's planning meeting?" — a temporal+entity query that requires both transcript retrieval and entity linking.

## Code Examples

```python
import whisper
import numpy as np
from dataclasses import dataclass

@dataclass
class AudioSegment:
    speaker: str
    start: float
    end: float
    text: str
    confidence: float

def transcribe_with_diarization(audio_path: str) -> list[AudioSegment]:
    """Transcribe audio with speaker labels using Whisper + pyannote."""
    model = whisper.load_model("large-v3")
    result = model.transcribe(audio_path, word_timestamps=True)
    # In production: use pyannote.audio for speaker diarization
    # and align diarization segments with whisper word timestamps
    segments = []
    for seg in result["segments"]:
        segments.append(AudioSegment(
            speaker="UNKNOWN",  # populated by diarization
            start=seg["start"],
            end=seg["end"],
            text=seg["text"].strip(),
            confidence=seg.get("confidence", 0.0)
        ))
    return segments

def audio_chunk_by_speaker_turn(segments: list[AudioSegment],
                                min_chunk_seconds: float = 20.0) -> list[dict]:
    """Chunk transcript at speaker boundaries, merging small chunks."""
    chunks = []
    buffer = []
    buffer_duration = 0.0
    for seg in segments:
        if buffer and seg.speaker != buffer[-1]["speaker"] and buffer_duration >= min_chunk_seconds:
            chunks.append({
                "text": " ".join(s["text"] for s in buffer),
                "speaker": buffer[0]["speaker"],
                "start": buffer[0]["start"],
                "end": buffer[-1]["end"],
                "duration": buffer_duration
            })
            buffer, buffer_duration = [], 0.0
        buffer.append({"speaker": seg.speaker, "text": seg.text,
                       "start": seg.start, "end": seg.end})
        buffer_duration += seg.end - seg.start
    if buffer:
        chunks.append({
            "text": " ".join(s["text"] for s in buffer),
            "speaker": buffer[0]["speaker"],
            "start": buffer[0]["start"],
            "end": buffer[-1]["end"],
            "duration": buffer_duration
        })
    return chunks

# CLAP embedding for audio-native retrieval (conceptual)
def get_clap_embedding(audio_path: str) -> np.ndarray:
    """Encode audio directly using CLAP model."""
    import torch
    from transformers import ClapModel, ClapProcessor
    model = ClapModel.from_pretrained("laion/clap-htsat-unfused")
    processor = ClapProcessor.from_pretrained("laion/clap-htsat-unfused")
    import librosa
    audio, sr = librosa.load(audio_path, sr=48000)
    inputs = processor(audios=audio, sampling_rate=sr, return_tensors="pt")
    with torch.no_grad():
        emb = model.get_audio_features(**inputs)
    return emb.numpy().flatten()
```

## Try It Yourself
Build a meeting intelligence RAG system using a real meeting recording (or a podcast episode). Implement: (a) Whisper transcription with speaker diarization, (b) semantic chunking using an LLM to detect topic boundaries, (c) dual retrieval — dense vector search over transcript chunks and CLAP similarity for tone-aware queries, (d) a fusion re-ranker that combines both scores. Query it with: "Find moments where a speaker disagrees with the proposal and propose a summary of their objection." Evaluate whether the CLAP signal surfaces moments that text-only retrieval misses.

## Real-World RAG Connection
Otter.ai and Fireflies.ai use audio RAG for meeting search. Spotify's podcast search combines acoustic and textual features. OpenAI's Whisper API plus embeddings powers a growing number of audio archival products. The open challenge is real-time audio RAG — indexing and retrieving from live audio streams with sub-second latency — where the streaming transcription and incremental indexing pipeline is the bottleneck.

## Common Pitfalls
**Pitfall:** Transcription errors compound into retrieval failures — a misheard keyword becomes an indexing gap. **Fix:** Store multiple ASR hypotheses (Whisper beam search top-3) and index all of them. At query time, the correct transcription has a much higher chance of being in the index even if the 1-best hypothesis is wrong.

**Pitfall:** Speaker diarization fails on overlapping speech, common in heated discussions. **Fix:** Post-process overlapping segments with a targeted ASR model that separates speakers by voice embedding (speaker separation, not just diarization). Use ECAPA-TDNN speaker embeddings to label segments even when speakers overlap.

**Pitfall:** Audio chunking at fixed time intervals cuts sentences in half, destroying semantic meaning. **Fix:** Always align chunk boundaries to sentence boundaries detected in the transcript. Use the word-level timestamps from Whisper to find the nearest sentence end within a window of each fixed boundary.

## Next Steps
Read the CLAP paper (Elizalde et al., 2023). Study WhisperX for word-level alignment and diarization. Take mm_rag_video to extend multi-modal RAG to video content.
