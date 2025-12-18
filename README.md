# Lexicology: Personal Vocabulary Platform

---

## About the project

Lexicology is a sophisticated vocabulary-building platform designed to transform passive reading into active learning. Unlike traditional dictionaries, Lexicology emphasizes uncommonly used words, allowing users to create personalized dictionaries, add custom examples, and organize their learning journey across the entire Apple ecosystem.

---

### Project Goal

To help learners *retain* vocabulary by prioritizing contextual understanding of uncommonly used words. Lexicology transforms vocabulary acquisition into a personalized, example-driven process that fits naturally into everyday reading and learning habits.

---

### Core Objectives

- **Contextual Mastery:** Example-based learning to ensure words are understood in natural usage.
- **Personalization:** Interest-based categorization (15+ categories) and demographic profiling.
- **Availability:** Offline-first experience using SwiftData for uninterrupted learning.
- **Data Integrity:** Seamless synchronization between local storage and a centralized backend.

---

### Technical Stack

#### Frontend (Mobile & Desktop)

- **Framework:** SwiftUI (iOS / iPadOS / macOS)
- **State Management:** Combine and `@Observable`
- **Local Persistence:** SwiftData
- **Networking:** `URLSession` with async/await concurrency

#### Backend (Service Layer)

- **Runtime:** Node.js
- **Framework:** Express.js
- **Security:** JWT for authentication and Bcrypt for password hashing
- **Database:** SQLite3 (users, interests, vocabulary entries)
- **Development Tools:** Nodemon (hot reload), Postman (API testing)

---

### System Architecture & Workflow

1. **Learner Profiling:**  
   Users complete a multi-step onboarding flow, selecting interest categories and passing age validation (13+).

2. **Entry Creation:**  
   Users log new words with definitions and example sentences showing real-world usage.

3. **Local-First Persistence:**  
   Entries are immediately saved to SwiftData for instant UI feedback and offline access.

4. **Background Sync:**  
   When network connectivity is available, local changes are reconciled with the Express backend.

5. **Review & Mastery:**  
   Users search, filter, and sort (A–Z, newest) their vocabulary while tracking progress and statistics.

---

### API Documentation

The Lexicology API is a RESTful service that returns JSON.

#### 1. Authentication

- `POST /auth/register`  
  Registers a new learner profile with demo data and selected interests.

- `POST /auth/login`  
  Verifies user credentials.

---

#### 2. Vocabulary Management  
Requires token passed in the header `Authorization: Bearer <token>`

- `GET /words`  
  Fetches the user’s entire personal dictionary.

- `POST /words`  
  Creates a new word entry with definition, context, and category.

- `PATCH /words/:id`  
  Updates word definitions or usage examples.

- `DELETE /words/:id`  
  Removes a word from the collection.

---

#### 3. Profile & Statistics  

- `GET /profile`  
  Retrieves user statistics, mastery levels, and interest categories.

- `PATCH /profile`  
  Updates demographic data or interest-based preferences.

---

### Example Word Payload

**`POST /words`**

```

{
"word": "Ephemeral",
"definition": "Lasting for a very short time.",
"example": "The autumnal colors are beautiful but ephemeral.",
"categoryId": 4
"created_at": "12/12/2025"
}

```

---

### Project Roadmap

#### Phase 1: Foundation (Current)

- ✅ RESTful Express backend with SQLite persistence
- ✅ SwiftData models for offline-first storage
- ✅ Core SwiftUI components for word creation and search

#### Phase 2: Engagement & Mastery

- ⏳ Word of the Day (push notifications)
- ⏳ Pronunciation guides using native text-to-speech
- ⏳ Visual progress tracking and learning streaks

#### Phase 3: Advanced Personalization

- ⏳ Adaptive word suggestions based on interests
- ⏳ Bulk export to CSV / PDF
- ⏳ Automated cloud backup and cross-device sync

---

### How to Run

Install backend dependencies:
- `cd server`
- `npm install`


Run server:
- `nodemon index.js`  

Run client:
- Open the `.xcodeproj` in **Xcode 15+**
- Build and run for iOS or macOS

---
