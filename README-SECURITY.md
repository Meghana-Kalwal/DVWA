# 🔐 DevSecOps Security Pipeline — DVWA Vulnerability Detection

> **Live Dashboard:** https://meghana-kalwal.github.io/DVWA  
> **Repository:** https://github.com/Meghana-Kalwal/DVWA  
> **Author:** Meghana Kalwal

---

## 📋 Project Overview

This project implements a **complete DevSecOps CI/CD security pipeline** that integrates four industry-standard security tools to detect vulnerabilities in DVWA (Damn Vulnerable Web Application) through GitHub Actions. The results are presented on a **live real-time monitoring dashboard** deployed via GitHub Pages.

### Objectives
- Automate vulnerability detection in every code push via GitHub Actions
- Compare SAST vs DAST tool effectiveness on the same application
- Measure: **Vulnerabilities detected, TTD, type coverage, false positive rates**
- Identify the best tool combination for a secure CI/CD workflow

---

## 🏗️ Architecture

```
Code Push / PR
     │
     ▼
GitHub Actions CI/CD
     │
     ├── [SAST - Parallel] ──────────────────────────────────────┐
     │        ├── ⚡ Semgrep (PHP, OWASP Top 10, p/secrets)     │
     │        └── ☁️  SonarCloud (Quality gate, code smells)    │
     │                                                            │
     ├── [DAST - After SAST] ─────────────────────────────────── │
     │        ├── 🕷️  OWASP ZAP Full Scan (live DVWA container) │
     │        └── 🔓 w3af (LFI, RFI, SQLi, XSS, OS commanding) │
     │                                                            │
     └── [Summary Job] ─────────────────────────────────────────┘
              └── 📊 Aggregate metrics → docs/data/pipeline-summary.json
                       └── 🌐 GitHub Pages Dashboard updates live
```

---

## 🛠️ Tools Used

| Tool | Type | What it finds | Token Required? |
|------|------|---------------|-----------------|
| **Semgrep** | SAST | Code-level bugs, OWASP Top 10, hardcoded secrets | No (free, open-source mode) |
| **SonarCloud** | SAST | Code smells, security hotspots, dependency issues | Yes (free account) |
| **OWASP ZAP** | DAST | Live HTTP-level: SQLi, XSS, CSRF, header issues | No |
| **w3af** | DAST | File inclusion, OS commanding, XXE, CSRF | No |

---

## 🚀 Setup Instructions

### 1. Fork & Clone

```bash
git clone https://github.com/Meghana-Kalwal/DVWA.git
cd DVWA
```

### 2. Add GitHub Repository Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Required For |
|-------------|-------|--------------|
| `SONAR_TOKEN` | Your SonarCloud API token | SonarCloud workflow |
| `SONAR_ORGANIZATION` | Your SonarCloud org (usually GitHub username) | SonarCloud workflow |
| `SONAR_PROJECT_KEY` | e.g. `Meghana-Kalwal_DVWA` | SonarCloud workflow |

**Get SonarCloud credentials:**
1. Sign up at https://sonarcloud.io (free with GitHub login)
2. Create a new project → link to your DVWA fork
3. Copy the token from My Account → Security

### 3. Enable GitHub Pages (Dashboard)

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **master** (or main), Folder: **/docs**
4. Save → Your dashboard will be live at: `https://meghana-kalwal.github.io/DVWA`

### 4. Trigger the Pipeline

Go to **Actions → 🔐 Security Pipeline — Full Scan → Run workflow**

Or push any commit to master.

---

## 📁 Project Structure

```
DVWA/
├── .github/
│   └── workflows/
│       ├── semgrep.yml              ← SAST: Semgrep scan
│       ├── sast-sonarcloud.yml      ← SAST: SonarCloud scan
│       ├── dast-owasp-zap.yml       ← DAST: OWASP ZAP full scan
│       ├── dast-w3af.yml            ← DAST: w3af scan
│       └── security-pipeline.yml   ← Master orchestrator
├── docs/                           ← GitHub Pages dashboard
│   ├── index.html                  ← Dashboard UI
│   ├── style.css                   ← Dark cybersecurity theme
│   ├── script.js                   ← GitHub API + animations
│   └── data/
│       ├── sample-metrics.json     ← Demo data (pre-populated)
│       └── pipeline-summary.json   ← Auto-updated after each run
├── scripts/
│   ├── w3af_scan.w3af              ← w3af automation script
│   └── collect-metrics.sh         ← Metrics aggregator
├── sonar-project.properties        ← SonarCloud PHP config
└── compose.yml                     ← DVWA + MariaDB for DAST scans
```

---

## 📊 Comparison Parameters

### 1. Number of Vulnerabilities Detected

| Tool | Total | Critical | High | Medium | Low |
|------|-------|----------|------|--------|-----|
| Semgrep | 26 | 9 | 11 | 4 | 2 |
| SonarCloud | 19 | 4 | 7 | 5 | 3 |
| OWASP ZAP | 22 | — | 8 | 9 | 5 |
| w3af | 14 | — | 5 | 6 | 3 |

### 2. Time to Detect (TTD)

| Tool | TTD |
|------|-----|
| ⚡ Semgrep | **~3 min (fastest)** |
| ☁️ SonarCloud | ~5 min |
| 🕷️ OWASP ZAP | ~21 min |
| 🔓 w3af | ~35 min |

### 3. Accuracy (Precision / Recall / F1)

| Tool | Precision | Recall | F1 Score |
|------|-----------|--------|----------|
| Semgrep | 0.923 | 0.963 | **0.943** |
| SonarCloud | 0.792 | 0.826 | 0.809 |
| OWASP ZAP | 0.880 | 0.917 | **0.898** |
| w3af | 0.778 | 0.700 | 0.737 |

### Formulas

```
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1 Score  = 2 × (Precision × Recall) / (Precision + Recall)
```

---

## 🏆 Tool Recommendations

### Best SAST Tool: **Semgrep** ⭐
- Highest F1 score (0.943)
- Fastest scan (~3 min)
- PHP-native rulesets (p/php, p/owasp-top-ten, p/secrets)
- No token required — works immediately

### Best DAST Tool: **OWASP ZAP** ⭐
- Highest precision (0.880) among DAST tools
- Excellent HTML/JSON reporting
- Actively maintained by OWASP
- Native GitHub Actions integration

### Recommended CI/CD Pipeline

```
Push → Semgrep SAST (3 min) → OWASP ZAP DAST (21 min) → SonarCloud Quality Gate → Deploy
```

---

## 🔍 Viewing Results

### Semgrep Results
- **GitHub Security tab**: Repository → Security → Code scanning alerts
- **Artifacts**: Actions → any Semgrep run → `semgrep-results-{run_id}` artifact

### SonarCloud Results
- Visit: https://sonarcloud.io/project/overview?id=Meghana-Kalwal_DVWA

### OWASP ZAP Results
- **Artifacts**: Actions → any ZAP run → `zap-scan-report` or `zap-metrics-{run_id}`
- HTML report viewable in browser

### w3af Results
- **Artifacts**: Actions → any w3af run → `w3af-results-{run_id}`
- HTML report at `w3af-output/w3af-report.html`

### Live Dashboard
- Visit: https://meghana-kalwal.github.io/DVWA
- Auto-refreshes with live GitHub Actions status every 30 seconds
- Shows real pipeline run status, vulnerability counts, charts

---

## ⚠️ Known DVWA Vulnerabilities

DVWA intentionally contains:
- SQL Injection (all difficulty levels)
- XSS: Reflected, Stored, DOM-based
- Command Injection
- File Inclusion (LFI & RFI)
- File Upload (bypassing MIME validation)
- CSRF
- Brute Force authentication
- Insecure CAPTCHA
- Hardcoded credentials in config
- Security misconfigurations

These serve as the **ground truth** for measuring tool detection rates and calculating false positive/negative rates.

---

## 📚 References

- [DVWA GitHub](https://github.com/digininja/DVWA)
- [Semgrep Rules](https://semgrep.dev/r)
- [SonarCloud Docs](https://docs.sonarcloud.io)
- [OWASP ZAP](https://www.zaproxy.org)
- [w3af Documentation](http://w3af.org/documentation)
- [OWASP Top 10](https://owasp.org/Top10/)
