# Email Automation Platform — Frontend

A modern event-driven email automation platform frontend built with Next.js and React.

This platform allows non-technical teams to manage:

* Reusable email templates
* Trigger-based email automation
* Conditional email logic
* Event-driven workflows
* AI-assisted content generation

The goal is to make email automation configurable instead of hardcoded.

---

## Live Demo

Frontend:

https://automation.wealthifyx.com/

Backend API:

https://email-automation-api-569786805521.us-central1.run.app/api

---

## What It Does

The platform enables users to:

### Reusable Email Templates

Create and manage email templates with dynamic placeholders such as:

```html
Hello {{user.name}}
```

Variables are automatically extracted and validated against event payloads.

### Trigger-Based Automation

Configure when emails should be sent.

Example:

> Send welcome email when a user signs up, but only if their email contains `@gmail.com`.

Triggers support:

* Event selection
* Conditional rules
* Recipient mapping
* Send once logic
* Cooldown controls

### Event-Driven Processing

Applications emit events like:

```txt
user.created
user.updated
billing.invoice.failed
```

The system evaluates triggers and decides whether an email should be sent.

### AI-Assisted Content Helper

Built-in AI assistance helps users:

* Generate email body content
* Improve subject lines
* Validate template variables
* Improve writing quality

---

## High-Level Flow

```txt
Event
   ↓
Trigger Match
   ↓
Condition Evaluation
   ↓
Template Render
   ↓
Email Delivery
```

Example:

```txt
user.created
    ↓
Welcome Trigger
    ↓
user.email contains @gmail.com
    ↓
Welcome Template Rendered
    ↓
Email Sent
```

---

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Shadcn UI
* TanStack Query
* Zustand
* Supabase Auth
* AI Model Integration

---

## Run Locally

### 1. Clone Repository

```bash
git clone https://github.com/finovian/MailFlow-fe.git
cd MailFlow-fe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create:

```txt
.env
```

Copy values from:

```txt
.env.example
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=key
NEXT_PUBLIC_API_URL=https://email-automation-api-569786805521.us-central1.run.app/api/
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/


GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxx
MODEL_BASE_URL=https://models.inference.ai.azure.com

```

### 4. Start Development Server

```bash
npm run dev
```

App runs at:

```txt
http://localhost:3000
```

---

## Backend Requirement

This frontend depends on the backend API.

Run backend locally or point to deployed API.

Backend Repository:

https://github.com/finovian/MailFlow-be

---

## What I Focused On

* Simple but scalable trigger architecture
* Reusable template system
* Event-driven automation flow
* Explainable automation execution
* AI-assisted productivity for non-technical users
* Clean UX for marketers and future engineers

---

## Future Improvements

If extended further:

* Multi-tenant workspaces
* API-key based external integrations
* Better automation analytics
* Stronger deduplication controls
* Template versioning
* Advanced delivery observability

---

## Notes

This project was built as part of a Senior Software Engineer technical assessment and intentionally prioritizes:

* working end-to-end functionality
* explainable automation flow
* scalable foundations over excessive complexity
