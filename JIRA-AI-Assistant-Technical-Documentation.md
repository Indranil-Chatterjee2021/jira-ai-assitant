# JIRA AI Assistant - Technical Documentation with Diagrams

## Document Information
- **Project**: JIRA AI Assistant  
- **Version**: 1.0.0
- **Date**: August 2025
- **Author**: Development Team

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Application Flow Diagrams](#application-flow-diagrams)
3. [Sequence Diagrams](#sequence-diagrams)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Component Interaction Diagrams](#component-interaction-diagrams)
6. [Database Schema](#database-schema)
7. [API Flow Charts](#api-flow-charts)

---

## 1. System Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            JIRA AI ASSISTANT SYSTEM                             │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              PRESENTATION LAYER                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
│  │     React Frontend      │  │     Material-UI         │  │  Framer Motion  │ │
│  │   (TypeScript + TSX)    │  │     Components          │  │   Animations    │ │
│  │                         │  │                         │  │                 │ │
│  │ • Smart Search UI       │  │ • Issue List Display    │  │ • Smooth Trans │ │
│  │ • Token Usage Display   │  │ • Worklog Tables        │  │ • Loading States│ │
│  │ • Connection Status     │  │ • Form Components       │  │ • Page Transit │ │
│  │ • Sprint Visualization  │  │ • Dialog Boxes          │  │ • Micro Inter   │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                               APPLICATION LAYER                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
│  │     Express.js API      │  │    Security Middleware  │  │  Rate Limiting  │ │
│  │       Gateway           │  │                         │  │   & Validation  │ │
│  │                         │  │ • CORS Configuration    │  │                 │ │
│  │ • RESTful Endpoints     │  │ • Helmet Security       │  │ • Request Limit │ │
│  │ • Error Handling        │  │ • Input Sanitization    │  │ • Input Valid   │ │
│  │ • Response Formatting   │  │ • Authentication        │  │ • Schema Check  │ │
│  │ • Logging & Monitoring  │  │ • Authorization         │  │ • Error Handle  │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                               BUSINESS LOGIC LAYER                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
│  │   JQL Generation        │  │   Worklog Analytics     │  │ Token Management│ │
│  │     Service             │  │      Service            │  │    Service      │ │
│  │                         │  │                         │  │                 │ │
│  │ • Natural Language      │  │ • Time Parsing Logic    │  │ • Usage Tracking│ │
│  │   Processing            │  │ • Hour Calculation      │  │ • Cost Monitor  │ │
│  │ • LLM Integration       │  │ • User Aggregation      │  │ • Statistics    │ │
│  │ • Fallback Generation   │  │ • Excel Export          │  │ • Optimization  │ │
│  │ • Query Optimization    │  │ • Date Range Filter     │  │ • API Throttle  │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                               DATA ACCESS LAYER                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
│  │     JIRA API Client     │  │   Google AI Client      │  │  Generic HTTP   │ │
│  │                         │  │                         │  │     Client      │ │
│  │                         │  │                         │  │                 │ │
│  │ • Issue Management      │  │ • Text Generation       │  │ • Error Handling│ │
│  │ • Search Operations     │  │ • Token Consumption     │  │ • Retry Logic   │ │
│  │ • Worklog Retrieval     │  │ • Response Processing   │  │ • Timeout Mgmt  │ │
│  │ • Sprint Information    │  │ • Fallback Handling     │  │ • Connection    │ │
│  │ • Project Data          │  │ • Rate Limit Respect    │  │   Pooling       │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES LAYER                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
│  │     Atlassian JIRA      │  │    Google AI (Gemini)   │  │   File System   │ │
│  │       Cloud API         │  │       1.5 Flash         │  │    Services     │ │
│  │                         │  │                         │  │                 │ │
│  │ • Issue CRUD Ops        │  │ • Natural Language      │  │ • Excel Export  │ │
│  │ • JQL Query Execution   │  │   Understanding         │  │ • Log Files     │ │
│  │ • Worklog Data          │  │ • JQL Generation        │  │ • Config Files  │ │
│  │ • Sprint Information    │  │ • Context Processing    │  │ • Temp Storage  │ │
│  │ • User Management       │  │ • Response Generation   │  │ • Cache Storage │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Application Flow Diagrams

### Main Application User Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          JIRA AI ASSISTANT USER FLOW                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   START     │
                                    │  (User)     │
                                    └──────┬──────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  Load Frontend  │
                                  │  Application    │
                                  └────────┬────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │  Check System Health    │
                              │  • JIRA Connection      │
                              │  • AI Service Status    │
                              │  • Token Statistics     │
                              └───────────┬─────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────────────┐
                           │      Display Main Interface     │
                           │  ┌────────────────────────────┐  │
                           │  │     Header Section         │  │
                           │  │  🤖 JIRA AI Assistant      │  │
                           │  │  Token: Queries: X | Total │  │
                           │  │  Status: JIRA✓ | AI✓       │  │
                           │  └────────────────────────────┘  │
                           │  ┌────────────────────────────┐  │
                           │  │     Search Interface       │  │
                           │  │  [Natural Language Input]  │  │
                           │  │  [      Search Issues     ] │  │
                           │  └────────────────────────────┘  │
                           └─────────────┬────────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────────┐
                          │        User Input Event         │
                          │  "Show bugs assigned to John"   │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                       ┌─────────────────────────────────────────┐
                       │         Query Processing Flow           │
                       │                                         │
                       │  ┌─────────────────────────────────┐    │
                       │  │     1. Input Validation         │    │
                       │  │     • Check empty query         │    │
                       │  │     • Sanitize input            │    │
                       │  │     • Rate limit check          │    │
                       │  └─────────────┬───────────────────┘    │
                       │                │                        │
                       │                ▼                        │
                       │  ┌─────────────────────────────────┐    │
                       │  │     2. Query Classification     │    │
                       │  │     • Worklog query?            │    │
                       │  │     • Standard search?          │    │
                       │  │     • Complex query?            │    │
                       │  └─────────────┬───────────────────┘    │
                       │                │                        │
                       │                ▼                        │
                       │         ┌─────────────┐                 │
                       │         │  Worklog?   │                 │
                       │         └──────┬──────┘                 │
                       │                │                        │
                       │        ┌───────┴───────┐                │
                       │        │ YES           │ NO             │
                       │        ▼               ▼                │
                       │  ┌─────────────┐ ┌─────────────────┐    │
                       │  │   Worklog   │ │   Standard      │    │
                       │  │ Processing  │ │   JQL Gen       │    │
                       │  └─────────────┘ └─────────────────┘    │
                       └─────────────────────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │       JQL Generation Phase       │
                          │                                  │
                          │  ┌────────────────────────────┐  │
                          │  │      LLM Processing        │  │
                          │  │  ┌──────────────────────┐  │  │
                          │  │  │   Google AI Call     │  │  │
                          │  │  │  • Send user query   │  │  │
                          │  │  │  • Get JQL response  │  │  │
                          │  │  │  • Track tokens      │  │  │
                          │  │  └──────────────────────┘  │  │
                          │  └──────────┬─────────────────┘  │
                          │             │                    │
                          │             ▼                    │
                          │  ┌────────────────────────────┐  │
                          │  │    Fallback Generation     │  │
                          │  │  • Pattern matching        │  │
                          │  │  • Deterministic rules     │  │
                          │  │  • Error handling          │  │
                          │  └────────────────────────────┘  │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │        JIRA API Execution        │
                          │                                  │
                          │  ┌────────────────────────────┐  │
                          │  │    Execute JQL Query       │  │
                          │  │  • Send to JIRA REST API  │  │
                          │  │  • Handle authentication  │  │
                          │  │  • Process response        │  │
                          │  │  • Extract issue data      │  │
                          │  └────────────────────────────┘  │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │       Data Transformation        │
                          │                                  │
                          │  ┌────────────────────────────┐  │
                          │  │     Process JIRA Data      │  │
                          │  │  • Extract sprint info     │  │
                          │  │  • Parse worklog data      │  │
                          │  │  • Calculate totals        │  │
                          │  │  • Format for display      │  │
                          │  └────────────────────────────┘  │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │        Frontend Display          │
                          │                                  │
                          │  ┌────────────────────────────┐  │
                          │  │      Update UI State       │  │
                          │  │  • Show search results     │  │
                          │  │  • Display issue list      │  │
                          │  │  • Update token counter    │  │
                          │  │  • Show worklog summary    │  │
                          │  └────────────────────────────┘  │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                                  ┌─────────────┐
                                  │   SUCCESS   │
                                  │    END      │
                                  └─────────────┘
```

---

## 3. Sequence Diagrams

### Natural Language to JQL Query Sequence

```
User          Frontend       Backend        LLM Service      JIRA API       Database
 │               │              │              │              │              │
 │  Enter Query  │              │              │              │              │
 ├──────────────►│              │              │              │              │
 │               │              │              │              │              │
 │               │ POST /query  │              │              │              │
 │               ├─────────────►│              │              │              │
 │               │              │              │              │              │
 │               │              │ Validate &   │              │              │
 │               │              │ Classify     │              │              │
 │               │              │ Query        │              │              │
 │               │              │              │              │              │
 │               │              │ Generate JQL │              │              │
 │               │              ├─────────────►│              │              │
 │               │              │              │              │              │
 │               │              │   LLM API    │              │              │
 │               │              │◄─────────────┤              │              │
 │               │              │              │              │              │
 │               │              │ Track Tokens │              │              │
 │               │              ├─────────────────────────────────────────────►│
 │               │              │              │              │              │
 │               │              │ Execute JQL  │              │              │
 │               │              ├─────────────────────────────►│              │
 │               │              │              │              │              │
 │               │              │         JIRA Response       │              │
 │               │              │◄─────────────────────────────┤              │
 │               │              │              │              │              │
 │               │              │ Transform &  │              │              │
 │               │              │ Format Data  │              │              │
 │               │              │              │              │              │
 │               │   Response   │              │              │              │
 │               │◄─────────────┤              │              │              │
 │               │              │              │              │              │
 │  Display      │              │              │              │              │
 │  Results      │              │              │              │              │
 │◄──────────────┤              │              │              │              │
 │               │              │              │              │              │
```

### Worklog Analytics Processing Sequence

```
User          Frontend       Backend      Time Parser     JIRA API      Excel Export
 │               │              │              │              │              │
 │ Worklog Query │              │              │              │              │
 ├──────────────►│              │              │              │              │
 │               │              │              │              │              │
 │               │ POST /query  │              │              │              │
 │               ├─────────────►│              │              │              │
 │               │              │              │              │              │
 │               │              │ Detect       │              │              │
 │               │              │ Worklog      │              │              │
 │               │              │ Query        │              │              │
 │               │              │              │              │              │
 │               │              │ Extract      │              │              │
 │               │              │ Users &      │              │              │
 │               │              │ Date Range   │              │              │
 │               │              │              │              │              │
 │               │              │ Generate     │              │              │
 │               │              │ Worklog JQL  │              │              │
 │               │              │              │              │              │
 │               │              │ Fetch Issues │              │              │
 │               │              │ with Worklogs│              │              │
 │               │              ├─────────────────────────────►│              │
 │               │              │              │              │              │
 │               │              │ Worklog Data │              │              │
 │               │              │◄─────────────────────────────┤              │
 │               │              │              │              │              │
 │               │              │ Parse Time   │              │              │
 │               │              │ Strings      │              │              │
 │               │              ├─────────────►│              │              │
 │               │              │              │              │              │
 │               │              │ Hours Values │              │              │
 │               │              │◄─────────────┤              │              │
 │               │              │              │              │              │
 │               │              │ Aggregate    │              │              │
 │               │              │ by User      │              │              │
 │               │              │              │              │              │
 │               │              │ Calculate    │              │              │
 │               │              │ Totals       │              │              │
 │               │              │              │              │              │
 │               │   Worklog    │              │              │              │
 │               │   Summary    │              │              │              │
 │               │◄─────────────┤              │              │              │
 │               │              │              │              │              │
 │  Display      │              │              │              │              │
 │  Table        │              │              │              │              │
 │◄──────────────┤              │              │              │              │
 │               │              │              │              │              │
 │ Click Export  │              │              │              │              │
 ├──────────────►│              │              │              │              │
 │               │              │              │              │              │
 │               │ Generate     │              │              │              │
 │               │ Excel File   │              │              │              │
 │               ├─────────────────────────────────────────────────────────►│
 │               │              │              │              │              │
 │               │                      Excel File                          │
 │               │◄─────────────────────────────────────────────────────────┤
 │               │              │              │              │              │
 │  Download     │              │              │              │              │
 │  File         │              │              │              │              │
 │◄──────────────┤              │              │              │              │
 │               │              │              │              │              │
```

---

## 4. Data Flow Diagrams

### Level 0 - Context Diagram

```
                                ┌─────────────────────────────┐
                                │                             │
                    ┌──────────►│      JIRA AI ASSISTANT      │◄──────────┐
                    │           │         SYSTEM              │           │
                    │           │                             │           │
                    │           └─────────────────────────────┘           │
                    │                          │                          │
                    │                          │                          │
                    │                          ▼                          │
         ┌─────────────────┐          ┌─────────────────┐         ┌─────────────────┐
         │                 │          │                 │         │                 │
         │     END USER    │          │   ADMIN USER    │         │  JIRA PLATFORM  │
         │                 │          │                 │         │                 │
         │ • Search Issues │          │ • Monitor Token │         │ • Issue Data    │
         │ • View Results  │          │ • System Health │         │ • User Data     │
         │ • Export Data   │          │ • Configuration │         │ • Project Data  │
         │                 │          │                 │         │ • Worklog Data  │
         └─────────────────┘          └─────────────────┘         └─────────────────┘
                                               │
                                               ▼
                                     ┌─────────────────┐
                                     │                 │
                                     │  GOOGLE AI API  │
                                     │                 │
                                     │ • Text Analysis │
                                     │ • JQL Generation│
                                     │ • Token Tracking│
                                     │                 │
                                     └─────────────────┘
```

### Level 1 - System Overview Data Flow

```
                    ┌─────────────────────────────────────────────────────┐
                    │                USER INTERFACE                       │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
                    │  │   Search    │  │   Results   │  │   Export    │ │
                    │  │ Component   │  │ Component   │  │ Component   │ │
                    │  └─────────────┘  └─────────────┘  └─────────────┘ │
                    └─────────────┬───────────────────────────────────────┘
                                  │ User Interactions
                                  │ (Search Queries, Clicks, Exports)
                                  ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                           API GATEWAY                                       │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
    │  │    Request      │  │   Response      │  │     Error       │            │
    │  │   Validation    │  │   Formatting    │  │   Handling      │            │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
    └─────────────┬───────────────────────────────────────────────────────────────┘
                  │ Validated Requests
                  │ (Query, Parameters, Headers)
                  ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                       BUSINESS LOGIC LAYER                                  │
    │                                                                             │
    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
    │  │    Query    │    │    JQL      │    │  Worklog    │    │   Token     │ │
    │  │ Processing  │───►│ Generation  │───►│ Analytics   │───►│  Tracking   │ │
    │  │             │    │             │    │             │    │             │ │
    │  │ • Classify  │    │ • LLM Call  │    │ • Time Calc │    │ • Usage Log │ │
    │  │ • Validate  │    │ • Fallback  │    │ • User Agg  │    │ • Cost Mon  │ │
    │  │ • Route     │    │ • Optimize  │    │ • Export    │    │ • Optimize  │ │
    │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
    └─────────────┬───────────────────────────────────────────────────────────────┘
                  │ Processed Data & JQL
                  │ (Query String, Parameters, Metadata)
                  ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        DATA ACCESS LAYER                                    │
    │                                                                             │
    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
    │  │    JIRA     │    │  Google AI  │    │ File System │    │   Cache     │ │
    │  │   Client    │    │   Client    │    │   Client    │    │   Client    │ │
    │  │             │    │             │    │             │    │             │ │
    │  │ • Auth      │    │ • API Call  │    │ • Excel     │    │ • Session   │ │
    │  │ • Query     │    │ • Token     │    │ • Config    │    │ • Response  │ │
    │  │ • Transform │    │ • Response  │    │ • Logs      │    │ • Temp Data │ │
    │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
    └─────────────┬───────────────────────────────────────────────────────────────┘
                  │ Raw Data & API Responses
                  │ (Issues, Tokens, Files, Status)
                  ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        EXTERNAL SERVICES                                    │
    │                                                                             │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
    │  │   Atlassian     │  │   Google AI     │  │   File System   │            │
    │  │   JIRA Cloud    │  │   (Gemini)      │  │   Services      │            │
    │  │                 │  │                 │  │                 │            │
    │  │ • REST API      │  │ • Generation    │  │ • Local Storage │            │
    │  │ • Issue Data    │  │ • Token Usage   │  │ • Export Files  │            │
    │  │ • User Data     │  │ • Rate Limits   │  │ • Configuration │            │
    │  │ • Project Data  │  │ • Response Time │  │ • Logs & Cache  │            │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Interaction Diagrams

### Frontend Component Architecture

```
                              ┌─────────────────────────────┐
                              │         App.tsx             │
                              │      (Main Container)       │
                              │                             │
                              │ • State Management          │
                              │ • Router Configuration      │
                              │ • Theme Provider           │
                              │ • Global Error Boundary    │
                              └─────────────┬───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
        │     Header          │ │    Search           │ │    Results          │
        │   Component         │ │  Component          │ │  Component          │
        │                     │ │                     │ │                     │
        │ • App Title         │ │ • Input Field       │ │ • Issue List        │
        │ • Status Display    │ │ • Search Button     │ │ • Detail View       │
        │ • Token Counter     │ │ • Loading State     │ │ • Worklog Table     │
        │ • Connection        │ │ • Error Handling    │ │ • Export Button     │
        │   Indicators        │ │ • Auto-complete     │ │ • Pagination        │
        └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                    │                       │                       │
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      Shared Services        │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │      API Service        │ │
                              │ │ • HTTP Client           │ │
                              │ │ • Error Handling        │ │
                              │ │ • Response Transform    │ │
                              │ └─────────────────────────┘ │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │     State Manager       │ │
                              │ │ • Global State          │ │
                              │ │ • Local Storage         │ │
                              │ │ • Session Management    │ │
                              │ └─────────────────────────┘ │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │      Utility Helpers    │ │
                              │ │ • Date Formatting       │ │
                              │ │ • Data Transformation   │ │
                              │ │ • Validation Functions  │ │
                              │ └─────────────────────────┘ │
                              └─────────────────────────────┘
```

### Backend Service Architecture

```
                              ┌─────────────────────────────┐
                              │        index.ts             │
                              │      (Express App)          │
                              │                             │
                              │ • Route Configuration       │
                              │ • Middleware Setup          │
                              │ • Error Handling           │
                              │ • Server Initialization     │
                              └─────────────┬───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
        │      Routes         │ │     Services        │ │     Utilities       │
        │                     │ │                     │ │                     │
        │ • /query            │ │ • jiraService.ts    │ │ • tokenTracker.ts   │
        │ • /health           │ │ • aiService.ts      │ │ • timeParser.ts     │
        │ • /stats/tokens     │ │ • authService.ts    │ │ • apiHelpers.ts     │
        │ • /api/jira/*       │ │ • cacheService.ts   │ │ • validators.ts     │
        │                     │ │                     │ │ • errorHandlers.ts  │
        └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                    │                       │                       │
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │        LLM Layer            │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │   generateJQL.ts        │ │
                              │ │ • Natural Language      │ │
                              │ │ • LLM Integration       │ │
                              │ │ • Fallback Generation   │ │
                              │ │ • Token Tracking        │ │
                              │ └─────────────────────────┘ │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │    AI Service           │ │
                              │ │ • Chat Responses        │ │
                              │ │ • JQL Explanation       │ │
                              │ │ • Context Processing    │ │
                              │ │ • Error Recovery        │ │
                              │ └─────────────────────────┘ │
                              └─────────────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      External Clients       │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │     JIRA Client         │ │
                              │ │ • Authentication        │ │
                              │ │ • API Communication     │ │
                              │ │ • Response Processing   │ │
                              │ │ • Error Handling        │ │
                              │ └─────────────────────────┘ │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │    Google AI Client     │ │
                              │ │ • API Key Management    │ │
                              │ │ • Request Formatting    │ │
                              │ │ • Response Parsing      │ │
                              │ │ • Rate Limit Handling   │ │
                              │ └─────────────────────────┘ │
                              └─────────────────────────────┘
```

---

## 6. Database Schema

### Token Usage Statistics Schema

```sql
-- Token Statistics Table
CREATE TABLE token_stats (
    id              SERIAL PRIMARY KEY,
    session_id      VARCHAR(255) NOT NULL,
    query_count     INTEGER DEFAULT 0,
    input_tokens    INTEGER DEFAULT 0,
    output_tokens   INTEGER DEFAULT 0,
    total_tokens    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query Log Table  
CREATE TABLE query_log (
    id              SERIAL PRIMARY KEY,
    session_id      VARCHAR(255) NOT NULL,
    user_query      TEXT NOT NULL,
    generated_jql   TEXT,
    llm_used        BOOLEAN DEFAULT FALSE,
    processing_time INTEGER, -- in milliseconds
    result_count    INTEGER,
    error_message   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics Table
CREATE TABLE performance_metrics (
    id              SERIAL PRIMARY KEY,
    endpoint        VARCHAR(255) NOT NULL,
    response_time   INTEGER NOT NULL, -- in milliseconds
    status_code     INTEGER NOT NULL,
    error_message   TEXT,
    user_agent      TEXT,
    ip_address      INET,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration Schema

```sql
-- System Configuration Table
CREATE TABLE system_config (
    id              SERIAL PRIMARY KEY,
    config_key      VARCHAR(255) UNIQUE NOT NULL,
    config_value    TEXT,
    config_type     VARCHAR(50) DEFAULT 'string',
    description     TEXT,
    is_encrypted    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limiting Table
CREATE TABLE rate_limits (
    id              SERIAL PRIMARY KEY,
    ip_address      INET NOT NULL,
    endpoint        VARCHAR(255) NOT NULL,
    request_count   INTEGER DEFAULT 0,
    window_start    TIMESTAMP NOT NULL,
    window_end      TIMESTAMP NOT NULL,
    is_blocked      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. API Flow Charts

### RESTful API Endpoint Flow

```
                              ┌─────────────────────────────┐
                              │      Client Request         │
                              │                             │
                              │ Method: POST                │
                              │ Endpoint: /query            │
                              │ Body: { query: "..." }      │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      Middleware Stack       │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │     CORS Headers        │ │
                              │ │ • Origin Validation     │ │
                              │ │ • Method Authorization  │ │
                              │ │ • Header Processing     │ │
                              │ └─────────────────────────┘ │
                              │             │               │
                              │             ▼               │
                              │ ┌─────────────────────────┐ │
                              │ │    Security Headers     │ │
                              │ │ • Helmet Protection     │ │
                              │ │ • XSS Prevention        │ │
                              │ │ • CSRF Protection       │ │
                              │ └─────────────────────────┘ │
                              │             │               │
                              │             ▼               │
                              │ ┌─────────────────────────┐ │
                              │ │    Rate Limiting        │ │
                              │ │ • IP-based Limits       │ │
                              │ │ • Endpoint Limits       │ │
                              │ │ • Token Bucket Algo     │ │
                              │ └─────────────────────────┘ │
                              │             │               │
                              │             ▼               │
                              │ ┌─────────────────────────┐ │
                              │ │   Request Validation    │ │
                              │ │ • Schema Validation     │ │
                              │ │ • Input Sanitization    │ │
                              │ │ • Type Checking         │ │
                              │ └─────────────────────────┘ │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      Route Handler          │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │   Query Classification  │ │
                              │ │                         │ │
                              │ │ if (isWorklogQuery) {   │ │
                              │ │   └─► Worklog Flow      │ │
                              │ │ } else {                │ │
                              │ │   └─► Standard Flow     │ │
                              │ │ }                       │ │
                              │ └─────────────────────────┘ │
                              └─────────────┬───────────────┘
                                            │
                                  ┌─────────┴─────────┐
                                  │                   │
                                  ▼                   ▼
                    ┌─────────────────────┐ ┌─────────────────────┐
                    │   Worklog Flow      │ │   Standard Flow     │
                    │                     │ │                     │
                    │ 1. Extract Users    │ │ 1. Generate JQL     │
                    │ 2. Extract Dates    │ │ 2. Execute Query    │
                    │ 3. Generate JQL     │ │ 3. Transform Data   │
                    │ 4. Fetch Issues     │ │ 4. Format Response  │
                    │ 5. Parse Worklogs   │ │                     │
                    │ 6. Calculate Hours  │ │                     │
                    │ 7. Aggregate Data   │ │                     │
                    │ 8. Format Summary   │ │                     │
                    └─────────────────────┘ └─────────────────────┘
                                  │                   │
                                  └─────────┬─────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      Response Builder       │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │   Standard Response     │ │
                              │ │                         │ │
                              │ │ {                       │ │
                              │ │   "jql": "...",         │ │
                              │ │   "issues": [...],      │ │
                              │ │   "total": 42,          │ │
                              │ │   "metadata": {         │ │
                              │ │     "processingTimeMs": │ │
                              │ │     "timestamp": "...", │ │
                              │ │     "isWorklogQuery":   │ │
                              │ │   },                    │ │
                              │ │   "worklogSummary": [...│ │
                              │ │ }                       │ │
                              │ └─────────────────────────┘ │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      HTTP Response          │
                              │                             │
                              │ Status: 200 OK              │
                              │ Headers:                    │
                              │   Content-Type: application │
                              │   X-Response-Time: 1250ms   │
                              │   X-Request-ID: uuid        │
                              │                             │
                              │ Body: JSON Response         │
                              └─────────────────────────────┘
```

### Error Handling Flow Chart

```
                              ┌─────────────────────────────┐
                              │        Error Occurs         │
                              │                             │
                              │ • Validation Error          │
                              │ • Network Error             │
                              │ • Service Error             │
                              │ • Authentication Error      │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │     Error Classification    │
                              └─────────────┬───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
        │   Client Error      │ │   Server Error      │ │   External Error    │
        │     (4xx)           │ │     (5xx)           │ │                     │
        │                     │ │                     │ │ • JIRA API Down     │
        │ • 400 Bad Request   │ │ • 500 Internal      │ │ • Google AI Limit   │
        │ • 401 Unauthorized  │ │ • 502 Bad Gateway   │ │ • Network Timeout   │
        │ • 403 Forbidden     │ │ • 503 Unavailable   │ │ • Rate Limit Hit    │
        │ • 404 Not Found     │ │ • 504 Timeout       │ │                     │
        │ • 429 Rate Limit    │ │                     │ │                     │
        └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                    │                       │                       │
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │      Error Processing       │
                              │                             │
                              │ ┌─────────────────────────┐ │
                              │ │     Log Error           │ │
                              │ │ • Error Level           │ │
                              │ │ • Stack Trace           │ │
                              │ │ • Context Data          │ │
                              │ │ • User Information      │ │
                              │ └─────────────────────────┘ │
                              │             │               │
                              │             ▼               │
                              │ ┌─────────────────────────┐ │
                              │ │    Generate Response    │ │
                              │ │ • Error Message         │ │
                              │ │ • Status Code           │ │
                              │ │ • Timestamp             │ │
                              │ │ • Request ID            │ │
                              │ └─────────────────────────┘ │
                              │             │               │
                              │             ▼               │
                              │ ┌─────────────────────────┐ │
                              │ │   Fallback Handling     │ │
                              │ │ • Retry Logic           │ │
                              │ │ • Circuit Breaker       │ │
                              │ │ • Graceful Degradation  │ │
                              │ │ • Default Responses     │ │
                              │ └─────────────────────────┘ │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │     Error Response          │
                              │                             │
                              │ {                           │
                              │   "error": "Error message", │
                              │   "code": "ERROR_CODE",     │
                              │   "timestamp": "...",       │
                              │   "requestId": "uuid",      │
                              │   "details": {              │
                              │     "suggestion": "...",    │
                              │     "documentation": "..."  │
                              │   }                         │
                              │ }                           │
                              └─────────────────────────────┘
```

---

## Summary

This technical documentation provides a comprehensive view of the JIRA AI Assistant system architecture, including:

1. **System Architecture**: Multi-layered architecture with clear separation of concerns
2. **Flow Diagrams**: Complete user journey from input to output
3. **Sequence Diagrams**: Detailed interaction patterns between components
4. **Data Flow**: Information movement through the system
5. **Component Interactions**: Frontend and backend architectural relationships
6. **Database Design**: Schema for metrics and configuration
7. **API Flows**: RESTful endpoint processing and error handling

The system demonstrates modern software engineering practices with:
- **Microservice-oriented design**
- **Robust error handling**
- **Security-first approach**
- **Scalable architecture**
- **Comprehensive monitoring**

This documentation serves as a blueprint for understanding, maintaining, and extending the JIRA AI Assistant system.

---

**Document Version**: 1.0.0  
**Last Updated**: August 2025  
**Review Date**: Quarterly

*Generated by JIRA AI Assistant Development Team*