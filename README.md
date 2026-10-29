# 🚀 NEXUS: Autonomous Multi-Trial AI Referee & Evidence Engine

> **Abu Dhabi University — 6th Annual COE STEM Programming with AI Competition (Advanced Track)**  
> **Team:** 260 | **Code:** NULWO

---

## 📌 Repository Overview

Welcome to the official source code for **NEXUS**—an enterprise-grade, client-side web application designed to act as an autonomous, transparent AI referee for multi-trial family game days. 

Unlike black-box AI applications that output unverified scores, NEXUS is engineered around an **Evidence-First AI Architecture**. Every point awarded, goal spotted, rhythm checked, or height estimated is tied directly to a verifiable evidence trail consisting of raw visual/audio timestamps, bounding coordinates, confidence metrics, and deterministic rule mappings.

---

## 🛠️ Technological Stack & Architecture

Built with a high-performance **zero-server, client-side architecture** ensuring absolute data privacy and instantaneous execution:

* **Core Runtime:** HTML5, Modern CSS3 (Dark Athletic UI with Electric Cyan & Gold Accents), Vanilla JavaScript (ES6+).
* **Perception Engine (`ai-judge.js`):** 
  * Browser-native `MediaDevices API` and `<canvas>` pipelines for real-time video frame-differencing.
  * `Web Audio API` digital signal processing (DSP) for transient onset peak detection (rhythm/clap precision).
* **Rules Engine (`app.js`):** Decoupled deterministic scoring matrix guaranteeing reproducible outputs.
* **Storage & State Management:** LocalStorage API for offline-first persistent family session management and dynamic team configurations.

---

## ✨ Key Technical Features & Capabilities

* **Multi-Modal Ingestion:** Supports live web camera/microphone feeds or pre-recorded high-frame-rate media uploads.
* **Explainable AI (XAI) Dashboard:** Every logged event features a granular status classification system:
  * `VERIFIED` ($\ge 85\%$ Confidence) $\rightarrow$ Automatically pushed to scoreboard.
  * `UNCERTAIN` ($50\%\text{--}84\%$ Confidence) $\rightarrow$ Flagged for manual review in the interactive Evidence Inspector.
  * `REJECTED` ($< 50\%$ Confidence) $\rightarrow$ Discarded to prevent false positives.
* **5 Interactive Game Modules:**
  1. *Orbital Football* (Required): Computer-vision-based ball tracking, player positioning, and goal collision detection.
  2. *Heritage Memory*: Timed Emirati cultural artifact observation coupled with text/audio matching keys.
  3. *Titan Engineers*: Pixel-to-metric geometric height estimation combined with structural stability timeouts.
  4. *Echo Rhythm*: Millisecond offset waveform precision timing analysis.
  5. *The Final Protocol*: Cooperative multi-player stage unlocked via cross-game verified keys.
* **100% On-Device Privacy:** Zero cloud upload dependencies. All computer vision and audio logic execute locally on the client machine.

---

## 📂 Project Structure

```text
ADU Hackathon/
├── index.html        # Single-page application shell & dynamic view router
├── style.css         # High-contrast, dark-mode athletic-tech UI theme
├── app.js            # Core application state, UI bindings, and game loops
├── ai-judge.js       # Computer vision perception, audio DSP, and evidence pipeline
└── README.md         # Technical documentation and project overview
