# AGENTS.md — TeachConnect

## 1. Project Overview

**Project Name:** TeachConnect

**Project Type:** Teacher–School Recruitment Marketplace Prototype

**Core Concept:**

TeachConnect is a web platform that connects teachers with schools.

Teachers create a free professional **Teacher Profile Card** containing their teaching information. Schools can search and filter Teacher Cards according to their requirements and send contact requests to suitable teachers.

TeachConnect V1 is a validation prototype.

The primary purpose is to test whether:

1. Teachers are willing to create Teacher Cards.
2. Schools are willing to search Teacher Cards.
3. Schools actually contact suitable teachers.

### Core Marketplace Flow

Teacher:

Register → Create Teacher Card → Publish Card → School Finds Card → School Sends Contact Request → Teacher Responds → Interview/Hiring

School:

Register → Search Teachers → Apply Filters → View Teacher Card → Send Contact Request → Interview/Hiring

Admin:

Manage Teachers → Manage Schools → Moderate Profiles/Reports → Monitor Platform

---

# 2. Critical Development Rule — ONE PAGE AT A TIME

This is extremely important.

## DO NOT build the entire application at once.

Development must happen incrementally.

### What counts as one page?

A **page means one distinct user-facing route/screen**.

Examples:

```text
/                      → Homepage
/teachers              → Find Teachers
/teacher/[slug]        → Teacher Profile
/teacher/dashboard     → Teacher Dashboard
/school/dashboard      → School Dashboard
```

A modal, dropdown, reusable component, or small state change inside a page does not normally count as a separate page.

### Multi-step forms

A multi-step form is one feature, but if each step is presented as a distinct screen with its own route/state and meaningful UI, implement and review the steps incrementally.

For example:

```text
Create Teacher Card
    ↓
Step 1: Basic Information
    ↓
Step 2: Education
    ↓
Step 3: Teaching Details
    ↓
Step 4: Location & Availability
    ↓
Step 5: Salary
    ↓
Step 6: Review
    ↓
Step 7: Publish
```

Do not implement all seven steps without review.

Prefer:

**Step → Review → Feedback → Next Step**

unless the user explicitly approves implementing the entire flow at once.

### Required workflow

1. Inspect the existing project.
2. Understand the current folder structure.
3. Read this `AGENTS.md`.
4. Inspect the reference image when implementing UI.
5. Plan the current page.
6. Implement ONLY the current page/approved unit.
7. Run the application.
8. Check:

   * TypeScript errors
   * ESLint errors
   * Build errors
   * Responsive issues
   * Accessibility issues
   * UI inconsistencies
   * Performance problems
9. Explain what was completed.
10. **STOP.**
11. Ask the user for feedback/approval before starting another page.

### Mandatory stopping behavior

After completing one page, do NOT automatically continue.

Say:

> "The [page name] is complete. Please review it and give me your feedback. I will wait for your approval before starting the next page."

Then STOP.

Do not implement additional pages unless the user explicitly asks you to continue.

---

# 3. Technology Stack

## Frontend

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Next.js App Router
* Server Components by default
* Client Components only when interaction/state requires them
* ESLint
* Prettier if already configured
* Lucide React or another lightweight icon library when required

Do not introduce another frontend framework without explicit approval.

---

## Backend

Use:

* Supabase
* Supabase PostgreSQL
* Supabase Auth
* Supabase Storage
* Row Level Security (RLS)
* Supabase-generated TypeScript types where practical
* Supabase Edge Functions only when server-side logic/rate limiting cannot reasonably be handled elsewhere

Supabase is the backend/database/auth/storage layer.

---

## Architecture

Keep frontend and backend clearly separated.

Recommended root structure:

```text
teachconnect/
│
├── front/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── public/
│   ├── styles/
│   ├── tests/
│   ├── .env.local
│   ├── next.config.ts
│   ├── package.json
│   └── ...
│
├── back/
│   ├── supabase/
│   │   ├── migrations/
│   │   ├── seed.sql
│   │   ├── functions/
│   │   └── config.toml
│   │
│   ├── docs/
│   └── README.md
│
├── reference/
│   └── reference.png
│
├── AGENTS.md
└── README.md
```

If the user provides an existing structure, preserve it unless there is a strong technical reason to change it.

Do not restructure the entire project unnecessarily.

---

# 4. Reference Image

The user will provide a reference image inside the project.

Expected location:

```text
reference/reference.png
```

The exact location may change if the user provides another path.

## Before implementing a UI page

Always inspect the reference image first.

Use it to understand:

* Layout
* Spacing
* Card design
* Typography
* Visual hierarchy
* Colors
* Buttons
* Navigation
* Form structure
* Responsive behavior
* Overall visual language

Do NOT blindly copy every visual detail.

Use the reference as the design direction while improving:

* Accessibility
* Responsiveness
* UX
* Consistency
* Performance
* Maintainability

If the reference image conflicts with an existing approved design decision, ask the user before making a major change.

---

# 5. Product Philosophy

TeachConnect V1 is a **prototype for validating the marketplace idea**.

Keep V1 simple.

## V1 is completely FREE.

Do NOT implement:

* Payments
* Subscriptions
* Paid contact credits
* Recruitment commissions
* Premium memberships
* Complicated verification systems
* CV generation
* PDF CV downloads
* In-platform messaging
* AI matching
* Advanced recruitment services

The primary goal is to validate:

> Will teachers create Teacher Cards?

and:

> Will schools search Teacher Cards and contact teachers?

---

# 6. Core Product Terminology

Use consistent terminology throughout the application.

### Preferred terminology

**Teacher Profile Card**

or simply:

**Teacher Card**

Avoid presenting the product as a traditional CV/job portal.

### Teacher

* Create Teacher Card
* Edit Teacher Card
* Publish Teacher Card
* Unpublish Teacher Card
* My Teacher Card

### School

* Find Teachers
* Search Teachers
* View Teacher Card
* Contact Teacher
* Shortlist Teacher

### Admin

* Manage Teachers
* Manage Schools
* Manage Profiles
* Manage Reports

### Visibility terminology

Use these terms consistently:

**Published**

Means the Teacher Card is visible to authenticated schools on the TeachConnect platform.

**Search-indexable**

Means the Teacher Profile is eligible to appear in external search engines such as Google.

These are separate settings.

Never use the word "public" ambiguously when describing these two scopes.

---

# 7. User Roles

There are exactly three roles in V1:

1. Teacher
2. School
3. Admin

This is intentional.

Do NOT introduce a separate moderator role in V1.

If moderation workload increases in a future version, a moderator role can be considered separately.

## Teacher

Teachers can:

* Register
* Create Teacher Card
* Edit their card
* Publish/unpublish their card
* View their profile
* Receive contact requests
* Respond to contact requests
* Manage account settings

## School

Schools can:

* Register
* Create school profile
* Search teachers
* Filter teachers
* View Teacher Cards
* Shortlist teachers
* Send contact requests
* Manage their profile
* View contact-request history

## Admin

Admins can:

* View teachers
* View schools
* Moderate profiles
* Suspend profiles
* Soft-remove profiles
* Restore profiles
* Permanently delete data when required by the retention/deletion policy
* Review reports
* Manage subjects
* Manage classes
* Manage locations
* View audit logs
* Monitor platform activity
* View basic platform statistics

---

# 8. Teacher Card Data

The Teacher Card should contain the minimum useful information required by schools.

## Basic Information

Stored:

* Full Name
* Father's Name
* Gender
* Profile Photo
* Phone Number
* WhatsApp Number

### Privacy rule

**Father's Name and Gender are internal/private fields in V1.**

They are collected for account/profile records but are NOT displayed on the searchable Teacher Card or public Teacher Profile.

Phone/WhatsApp details are also not automatically exposed.

---

## Education

* Highest Education
* Institution/University
* Additional Qualifications

---

## Teaching Information

* Subjects
* Classes
* Teaching Experience
* Previous School/Institution
* Teaching Skills

### Teaching Skills

Teaching Skills are **structured tags**, not uncontrolled free text.

Use a relational/tag model similar to Subjects.

Example:

```text
Classroom Management
Lesson Planning
Student Assessment
Board Exam Preparation
Activity-Based Learning
```

Subjects, classes, and skills should use controlled values where possible.

---

## Availability

Allowed values:

```text
Morning
Evening
Both
```

---

## Location

* Town/Area
* District
* City

Do not collect exact residential address.

---

## Salary

* Expected Salary

Store as a numeric amount in PKR.

Do not store salary as arbitrary text.

---

## Availability Date

Optional.

Use a proper PostgreSQL `date` field.

Example:

```text
available_from DATE NULL
```

Do not use free text such as:

```text
"Next month"
"After Eid"
"Soon"
```

The UI may display the date in a human-friendly format.

---

# 9. Teacher Card UI

Teacher Cards should be visually attractive but compact.

The card should display:

```text
[Profile Photo]

Teacher Name
Highest Education

Subjects
Classes

Experience

Location
Availability
Expected Salary

[View Profile]
[Contact Teacher]
```

Do NOT display:

* Father's Name
* Gender
* Phone number
* WhatsApp number
* Private email
* Private documents

The **Contact Teacher** button always triggers the V1 **contact-request flow** defined in Section 15.

It does NOT directly reveal the teacher's phone number.

The card should clearly communicate that contacting a teacher means sending a request.

Example button label:

```text
Contact Teacher
```

Optional supporting text:

```text
Send Contact Request
```

---

# 10. Teacher Registration

Initial registration should be simple.

Do not put every Teacher Card field into the registration form.

Recommended:

```text
Create Account

Full Name
Email
Phone
Password
Confirm Password

[Create Account]
```

Then redirect the teacher to:

```text
Create Your Teacher Card
```

Use a multi-step form if the amount of information becomes large.

Recommended steps:

```text
Basic Information
      ↓
Education
      ↓
Teaching Details
      ↓
Location & Availability
      ↓
Expected Salary
      ↓
Review
      ↓
Publish
```

Each meaningful step/screen must be implemented and reviewed incrementally according to Section 2.

---

# 11. School Registration

Keep school registration simple.

Recommended:

```text
School Name
Contact Person
Email
Phone
Password
Confirm Password
City
Area
School Type
```

## School Type

V1 allowed values:

```text
Private
Public
International
Other
```

If `Other` is selected, allow a short custom value.

The list must be implemented as a controlled enum/select, not arbitrary uncontrolled text.

Additional school information can be completed from the dashboard.

---

# 12. Teacher Search

This is one of the most important pages.

Schools should be able to search using:

* Subject
* Class
* Area/Town
* District
* Availability
* Experience
* Expected Salary

Example:

```text
Find Teachers

Search by subject or keyword

Subject       [ Mathematics ]
Class         [ 9–10 ]
Area          [ Malir ]
District      [ Karachi ]
Availability  [ Morning ]
Experience    [ 2+ Years ]
Salary        [ 30,000 – 50,000 ]

[Search]
```

Results display Teacher Cards.

Only cards with:

```text
published = true
moderation_status = active
```

are eligible for school search results.

---

# 13. Search UX

The search page should support:

* Desktop filter sidebar
* Mobile filter drawer
* Search input
* Dropdown filters
* Salary range
* Experience filter
* Reset filters
* Results count
* Loading state
* Empty state
* Error state
* Pagination

Do not load thousands of Teacher Cards into the browser at once.

Use server-side filtering and pagination.

## Default sorting

V1 default sort order is:

**Relevance → stable secondary ordering**

For searches with active filters, relevance is based on the number/quality of matching search criteria.

When relevance scores are equal, use:

```text
published_at DESC
id ASC
```

This prevents random ordering and provides deterministic results.

Do not use random ordering because it makes discovery unpredictable and difficult to test.

Avoid systematically favoring only the newest teachers.

Future ranking algorithms can be considered later.

---

# 14. Teacher Profile Page

When a school selects:

**View Profile**

show a larger Teacher Profile.

Recommended sections:

```text
Profile Header
    ↓
About
    ↓
Education
    ↓
Teaching Experience
    ↓
Subjects
    ↓
Classes
    ↓
Teaching Skills
    ↓
Availability
    ↓
Location
    ↓
Expected Salary
    ↓
Contact Teacher
```

Do not expose:

* Father's Name
* Gender
* Phone number
* WhatsApp number
* Exact home address
* Private documents

Only published and active Teacher Profiles can be viewed by authenticated schools.

A Teacher Profile may separately be marked `search_indexable = true` for external search engines, but search-engine visibility is independent of school-platform visibility.

---

# 15. Contact Flow

## V1 Contact Model — FINAL DECISION

TeachConnect V1 uses an **in-platform contact request model**.

A school does NOT automatically receive the teacher's phone number or WhatsApp number.

The flow is:

```text
School
  ↓
View Teacher Card/Profile
  ↓
Contact Teacher
  ↓
Contact Request Form
  ↓
Submit Request
  ↓
Teacher receives notification
  ↓
Teacher reviews request
  ↓
Teacher accepts / declines
  ↓
If accepted, the teacher can choose to share contact details
```

Direct phone/WhatsApp exposure is therefore **opt-in by the teacher**.

### Contact Request fields

Recommended:

* School name
* Contact person
* Optional short introduction
* Optional hiring requirement
* Created timestamp

Do not build a chat/messaging system in V1.

### Contact request lifecycle

Allowed statuses:

```text
pending
accepted
declined
closed
```

Definitions:

**pending:** Teacher has not responded.

**accepted:** Teacher accepted the request and may share contact details.

**declined:** Teacher declined the request.

**closed:** The contact opportunity has ended.

### Duplicate requests

A school may have only **one active contact request per teacher**.

If a request already exists with status:

```text
pending
accepted
```

the school cannot create another active request.

If a previous request is:

```text
declined
closed
```

the school may send a new request only after a cooldown of **7 days**.

This prevents spam and accidental duplicates.

### Contact rate limit

For V1:

**Maximum 20 new contact requests per school per 24-hour rolling period.**

Additional protection:

**Maximum 3 contact requests to the same teacher within 30 days**, regardless of status.

These limits must be enforced server-side.

---

# 16. Dashboards

## Teacher Dashboard

Show:

* My Teacher Card
* Profile status
* Profile views
* Contact requests
* Recent activity
* Edit profile
* Publish/unpublish

Example:

```text
Teacher Dashboard

[My Teacher Card]

Profile Status: Published

Profile Views     Contact Requests
     24                  5

Recent Activity
- School viewed your card
- You received a contact request
```

### Teacher dashboard profile views

A profile view means an authenticated school successfully opens the teacher's profile page.

Do not count:

* Teacher viewing their own profile
* Admin views
* Automated requests/bots where identifiable
* Repeated refreshes from the same school within a short deduplication window

Use a reasonable deduplication window of **one view per school per teacher per 24 hours**.

---

## School Dashboard

Show:

* Search Teachers
* Shortlisted Teachers
* Contact Requests
* Recent Activity
* My School Profile

### Shortlist privacy

Shortlisting is **private to the school**.

A teacher is NOT notified when a school shortlists them.

Only a contact request creates a teacher notification.

---

## Admin Dashboard

Show basic statistics:

```text
Total Teachers
Total Schools
Published Teacher Cards
Contact Requests
Recent Registrations
Open Reports
```

Keep analytics lightweight in V1.

---

# 17. Authentication

Use Supabase Auth.

Support:

* Email/password
* Secure session handling
* Logout
* Password reset
* Protected routes
* Role-based access

## Password policy

V1 requires a minimum password length of:

**8 characters**

Complexity requirements should not be unnecessarily strict.

Supabase Auth is responsible for password hashing and secure credential handling.

Never store passwords manually.

Never store plaintext passwords.

## Session expiry

Use Supabase Auth's secure session management.

V1 should use:

* Access token expiry: **1 hour**
* Refresh-token based session renewal
* Automatic refresh while the session remains valid
* Logout must invalidate the local session
* Re-authentication may be required after refresh/session failure

Do not implement custom token storage or custom authentication logic unless required.

---

# 18. Database Design

Use PostgreSQL through Supabase.

Suggested core tables:

```text
profiles
teachers
schools
subjects
classes
skills
teacher_subjects
teacher_classes
teacher_skills
locations
teacher_contact_requests
school_shortlists
profile_views
activity_log
notifications
reports
admin_audit_log
```

Potential relationship:

```text
auth.users
     │
     ↓
profiles
     │
 ┌───┴────┐
 ↓        ↓
teacher  school
```

Use UUIDs for primary keys.

Use foreign keys.

Use timestamps:

```text
created_at
updated_at
```

Use appropriate indexes for frequently searched columns.

---

# 19. Supabase Row Level Security

RLS is mandatory.

Never assume frontend restrictions are security.

## Teacher visibility

A Teacher Card is visible to authenticated schools only when:

```text
published = true
moderation_status = active
```

`published` means visible inside the TeachConnect platform.

`search_indexable` is separate and controls eligibility for external search engine indexing.

### Teacher

A teacher can:

* Read their own private data
* Update their own profile
* Publish/unpublish their own card
* Read their own contact requests
* Respond to their own contact requests

A teacher cannot:

* Modify another teacher's profile
* Modify school data
* Access admin data
* View another teacher's private contact requests

### School

A school can:

* Read eligible Teacher Cards
* Manage its own school profile
* Manage its own shortlist
* Create contact requests
* Read its own contact requests

A school cannot:

* Modify teacher profiles
* Access another school's private data
* Access teacher private fields
* Access admin data

### Admin

Admin permissions must be handled securely.

Do not trust a client-side role check as the only authorization layer.

Admin actions must be authorized server-side.

---

# 20. Privacy

Do not publicly expose:

* CNIC
* B-Form
* Password
* Private documents
* Private email unless intentionally shared
* Private phone number
* Exact home address

Use:

```text
Town / Area
District
City
```

instead of exact residential address.

### Contact privacy

Teacher phone/WhatsApp information is private by default.

It can only be shared after the teacher accepts a contact request and explicitly chooses to share it.

### Visibility fields

Teacher profiles must include:

```text
published BOOLEAN NOT NULL DEFAULT false
search_indexable BOOLEAN NOT NULL DEFAULT false
```

`published`:

* Controls visibility to authenticated schools on the platform.

`search_indexable`:

* Controls whether the profile is eligible for external search engine indexing.
* Defaults to `false`.
* Can only be enabled by the teacher for their own profile.
* Does not make an unpublished profile visible to schools.

A profile must satisfy:

```text
published = true
moderation_status = active
```

before it can be viewed by schools.

---

# 21. Image Handling

Teacher profile photos must be optimized.

## Upload limits

Accepted formats:

```text
JPG
JPEG
PNG
WEBP
```

Maximum original upload size:

**5 MB**

Recommended display dimensions:

* Maximum processing width: 1200px
* Generate/use an appropriately sized thumbnail for Teacher Cards.

## Optimization responsibility

Use a combination of:

1. **Client-side validation/compression** where practical.
2. **Supabase Storage** for storage.
3. **Next.js image optimization** for frontend delivery.

Do not require a custom Edge Function solely for basic image resizing unless testing demonstrates a need.

If the original image is unnecessarily large, compress it client-side before upload.

Never trust the file extension alone; validate MIME type and upload constraints.

---

# 22. Performance — VERY IMPORTANT

The website may eventually have many users and many Teacher Cards.

Build for scalability from the beginning.

## Frontend

Use:

* Server Components by default
* Minimal Client Components
* Dynamic imports when useful
* Next.js Image optimization
* Proper caching
* Efficient data fetching
* Avoid unnecessary API calls
* Avoid unnecessary global state
* Avoid huge JavaScript bundles

Do not make every component `"use client"`.

Only use Client Components when necessary.

## Initial performance targets

For important public pages on a reasonable mobile connection:

* **LCP:** ≤ 2.5 seconds target
* **CLS:** ≤ 0.1 target
* **INP:** ≤ 200 ms target
* Avoid layout shifts caused by images or dynamically loaded content.

These are targets, not excuses to over-engineer the prototype.

---

# 23. Database Performance

For searchable Teacher Cards:

Use indexes on frequently queried fields.

Potential indexes:

```text
subject
district
town
availability
experience
expected_salary
published
moderation_status
created_at
```

For many-to-many fields such as subjects/classes/skills, use relationship tables instead of uncontrolled comma-separated strings.

Avoid inefficient queries.

Never retrieve all teachers and filter them in React.

Filtering should happen at the database/query level.

Use database indexes and pagination.

---

# 24. Pagination

Never load the entire teacher database at once.

Use:

* Server-side pagination
* Cursor-based pagination when appropriate
* Server-side filtering

Recommended V1:

**20 Teacher Cards per page**

This can be adjusted after performance testing.

---

# 25. Loading States

Every asynchronous page should have proper loading UI.

Examples:

* Skeleton cards
* Loading button state
* Search loading state
* Form submission state

Never leave the user wondering whether an action worked.

---

# 26. Empty States

Design meaningful empty states.

Example:

```text
No teachers found

Try changing your subject, location,
salary or availability filters.

[Clear Filters]
```

Do not simply show a blank page.

---

# 27. Error Handling

Handle:

* Network failures
* Supabase errors
* Authentication errors
* Validation errors
* Upload errors
* Empty results
* Unauthorized access
* Database errors
* Rate-limit errors

Show user-friendly messages.

Do not expose technical stack traces to users.

---

# 28. Forms

Use strong form practices.

Every form should have:

* Labels
* Validation
* Helpful placeholders
* Error messages
* Required/optional indicators
* Keyboard accessibility
* Submit/loading state
* Success feedback

Do not rely only on placeholder text as labels.

---

# 29. TypeScript

Use TypeScript throughout the frontend.

Avoid:

```text
any
```

unless there is a legitimate technical reason.

Prefer:

* Interfaces
* Types
* Type-safe Supabase queries
* Reusable types
* Typed props
* Typed API responses

Keep types organized.

---

# 30. Component Architecture

Do not create one huge component.

Prefer reusable components such as:

```text
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   └── Badge.tsx
│
├── teacher/
│   ├── TeacherCard.tsx
│   ├── TeacherCardSkeleton.tsx
│   ├── TeacherFilters.tsx
│   └── TeacherProfile.tsx
│
├── school/
│   ├── SchoolCard.tsx
│   └── SchoolProfile.tsx
│
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── MobileNavigation.tsx
```

Avoid premature abstraction.

Only create reusable components when reuse or clear separation justifies them.

---

# 31. Feature-Based Organization

For larger features, prefer feature organization.

```text
features/
├── auth/
├── teachers/
├── schools/
├── search/
├── contact/
├── shortlist/
└── admin/
```

Keep related logic together.

---

# 32. API/Data Layer

Do not scatter Supabase queries throughout UI components.

Prefer:

```text
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
│
services/
├── teacherService.ts
├── schoolService.ts
├── contactService.ts
├── shortlistService.ts
└── adminService.ts
```

UI components should not contain large database queries.

---

# 33. Environment Variables

Never hardcode secrets.

Use:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

Server-only secrets must remain server-side.

Do not commit `.env.local`.

---

# 34. SEO

SEO is important because schools may search Google for teachers and recruitment services.

Use Next.js metadata properly.

Every **public/indexable page** should have:

* Unique title
* Meta description
* Canonical URL
* Open Graph metadata
* Twitter/X metadata where appropriate
* Semantic HTML
* Proper heading hierarchy
* Descriptive URLs

Private/authenticated pages are excluded from this requirement.

Do NOT add SEO indexing metadata to:

```text
/dashboard
/admin
/login
/register
/private pages
```

Teacher profiles only receive indexable SEO treatment when:

```text
published = true
search_indexable = true
moderation_status = active
```

---

# 35. SEO Keyword Strategy

Naturally target relevant keywords such as:

* teacher jobs
* teaching jobs
* teachers in Karachi
* school teacher jobs
* find teachers
* hire teachers
* teacher recruitment
* teaching jobs in Karachi
* school teacher recruitment
* qualified teachers
* experienced teachers
* mathematics teacher
* science teacher
* computer teacher
* English teacher

Do not keyword-stuff.

Content should remain natural and useful.

---

# 36. Public SEO Pages

Potential public pages:

```text
/
/teachers
/teachers/[subject]
/teachers/[city]
/teacher/[slug]
/about
/contact
```

Only carefully selected combinations should be indexable.

### Recommended indexable search pages

Initially allow indexing for:

```text
/teachers
/teachers/[subject]
/teachers/[city]
/teachers/[subject]/[city]
```

Examples:

```text
/teachers/mathematics
/teachers/karachi
/teachers/mathematics/karachi
```

Do NOT index arbitrary combinations involving:

* Salary
* Experience ranges
* Availability
* Multiple filter parameters
* Temporary sorting
* Pagination URLs where unnecessary
* User-specific searches

Use canonical URLs and `noindex` where appropriate.

Teacher profile indexing remains opt-in through `search_indexable`.

---

# 37. Structured Data

Where appropriate, use schema.org structured data.

Possible schema types may include:

* Person
* EducationalOrganization
* JobPosting only if a future approved job-posting feature exists
* WebSite
* BreadcrumbList

Only use structured data that accurately represents the page.

Do not create misleading structured data.

---

# 38. Sitemap and Robots

Implement:

```text
sitemap.xml
robots.txt
```

Use Next.js built-in metadata/sitemap capabilities where appropriate.

Exclude:

```text
/dashboard
/admin
/login
/register
/private routes
```

from indexing.

Only include Teacher Profiles in the sitemap when:

```text
published = true
search_indexable = true
moderation_status = active
```

---

# 39. Accessibility

Target:

### WCAG 2.1 AA

Build accessible UI from the beginning.

Requirements:

* Semantic HTML
* Proper labels
* Keyboard navigation
* Visible focus states
* Accessible buttons
* Accessible form errors
* Sufficient contrast
* Alt text for meaningful images
* Decorative images should not have unnecessary alt text
* Do not rely only on color to communicate status

Use ARIA only when necessary.

Prefer native semantic HTML.

Test keyboard navigation and common screen-reader semantics for important flows.

---

# 40. Responsive Design

The entire website must work properly on:

* Small mobile phones
* Large mobile phones
* Tablets
* Laptops
* Desktop monitors
* Large desktop screens

Design responsively from the beginning.

### Mobile

Teacher Cards become single-column.

Search filters become a drawer/modal.

Navigation becomes mobile-friendly.

Buttons have comfortable touch targets.

### Tablet

Use appropriate two-column layouts where space permits.

### Desktop

Use multi-column Teacher Card grids.

Suggested starting point:

```text
Desktop:
3–4 cards per row

Tablet:
2 cards per row

Mobile:
1 card per row
```

Adjust based on actual content and testing.

---

# 41. Design System

Maintain consistency.

Define reusable:

* Colors
* Typography
* Spacing
* Border radius
* Shadows
* Buttons
* Inputs
* Cards
* Badges
* Status indicators

Do not randomly introduce new colors or styles on every page.

The Teacher Card should look consistent everywhere.

---

# 42. Visual Design Direction

The design should feel:

* Professional
* Modern
* Trustworthy
* Educational
* Clean
* Friendly
* Simple
* Fast

Avoid:

* Excessive animations
* Huge gradients everywhere
* Clutter
* Excessive shadows
* Too many colors
* Unnecessary decorative elements

The primary focus should remain on teachers and schools.

---

# 43. Animations

Use animation sparingly.

Good uses:

* Card hover
* Button feedback
* Modal transitions
* Page transitions when useful
* Loading indicators

Avoid heavy animations that slow down the website.

Respect:

```text
prefers-reduced-motion
```

---

# 44. Security

Follow secure development practices.

Never:

* Expose service-role keys
* Trust client-side authorization
* Store passwords manually
* Expose private teacher information
* Build SQL strings from raw user input
* Disable RLS for convenience
* Put secrets in Git
* Trust uploaded files blindly

Validate input on both client and server where appropriate.

Use server-side authorization for sensitive actions.

---

# 45. Abuse Prevention

Even though V1 is free, design with abuse prevention in mind.

Potential issues:

* Fake teacher accounts
* Fake school accounts
* Spam contact requests
* Offensive profile information
* Fake profiles
* Scraping
* Automated registration

## V1 rate limits

### Contact requests

Maximum:

**20 new contact requests per school per rolling 24 hours.**

### Same teacher

Maximum:

**3 contact requests from the same school to the same teacher within 30 days.**

### Registration

Maximum:

**5 account creation attempts per IP per hour**, subject to legitimate shared-network scenarios.

### Contact endpoint

Server-side endpoint/function should additionally enforce the contact-request limits.

Use:

* Supabase Edge Functions where server-side enforcement is needed
* Database constraints where appropriate
* Vercel/platform-level protection where available

Do not rely only on frontend controls.

More advanced anti-abuse features can be added later.

---

# 46. Contact Privacy

The V1 contact model is defined completely in **Section 15**.

Do not create an alternative direct-contact model.

Rules:

* School sends a contact request.
* Teacher receives the request.
* Teacher accepts or declines.
* Teacher's phone/WhatsApp remains private unless the teacher explicitly chooses to share it after accepting.
* No in-platform chat/messaging is implemented in V1.

### Unpublishing

If a teacher unpublishes their card:

* The card disappears from new school search results.
* Existing school shortlists remain visible.
* Existing contact-request history remains visible to the relevant parties.
* New contact requests cannot be created while unpublished.

### Admin removal/suspension

If a teacher is suspended or removed:

* Their card is removed from school search.
* Existing shortlists remain as historical records but the profile cannot be opened normally.
* New contact requests are blocked.
* Existing pending contact requests are automatically transitioned to `closed`.
* Historical contact records remain for audit/abuse purposes according to the retention policy.

Do not orphan relational references.

Use foreign keys and controlled soft-delete/status behavior.

---

# 47. Performance Budget Mindset

Every page should be evaluated for:

* JavaScript size
* Image size
* Number of requests
* Database queries
* Rendering strategy
* Largest Contentful Paint
* Cumulative Layout Shift
* Interaction responsiveness

## Targets

For important public pages:

```text
LCP  ≤ 2.5s
CLS  ≤ 0.1
INP  ≤ 200ms
```

Also aim for:

* Minimal unnecessary JavaScript
* Optimized images
* No major render-blocking resources
* Fast server/database queries
* Efficient pagination

Measure using Lighthouse and/or PageSpeed Insights during QA.

Do not optimize prematurely at the expense of maintainability.

---

# 48. Caching

Use Next.js caching/revalidation appropriately for public data.

Potentially cache:

* Subjects
* Classes
* Skills
* Districts
* Areas
* Public Teacher Cards where appropriate

Do not incorrectly cache private user-specific data.

Always consider data freshness before caching.

When a Teacher Card is unpublished, suspended, or removed, ensure cached public results are invalidated/revalidated appropriately.

---

# 49. SEO + Performance Together

Public pages should be:

* Server-rendered where appropriate
* Fast
* Crawlable
* Semantic
* Mobile-friendly
* Lightweight

Avoid making public pages dependent on client-side JavaScript just to display basic content.

---

# 50. Testing

At minimum, test:

## Authentication

* Register
* Login
* Logout
* Invalid login
* Password reset
* Session expiry/refresh

## Teacher

* Create profile
* Edit profile
* Publish profile
* Unpublish profile
* Enable/disable search indexing
* Upload valid photo
* Reject oversized/invalid photo
* View own dashboard

## School

* Search
* Filters
* View teacher
* Shortlist teacher
* Shortlist same teacher twice
* Send contact request
* Attempt duplicate contact request
* Respect contact rate limits

## Contact edge cases

Test:

* Contacting an unpublished Teacher Card
* Contacting a suspended Teacher Card
* Contacting a removed Teacher Card
* Contacting after teacher account removal
* Contacting a teacher with an existing pending request
* Contacting a teacher after a previous request is closed
* Teacher accepting a request
* Teacher declining a request
* Teacher sharing contact details only after acceptance
* School exceeding contact-request limits

## Shortlist edge cases

Test:

* Shortlisting the same teacher twice
* Removing a teacher from shortlist
* Teacher unpublishes after being shortlisted
* Teacher is removed after being shortlisted

Existing shortlist records should remain consistent and should not create broken references.

## Admin

* Review reports
* Suspend profile
* Soft-remove profile
* Restore profile
* Review audit log
* Manage subjects/classes/locations

## Responsive

Test:

* Mobile
* Tablet
* Desktop

---

# 51. Browser Testing

Check the application in modern:

* Chrome
* Edge
* Firefox
* Safari where practical

Pay particular attention to mobile Safari if applicable.

---

# 52. Code Quality

Before considering a page complete:

Run appropriate checks:

```bash
npm run lint
npm run build
```

If tests exist:

```bash
npm test
```

Do not ignore errors simply to make the page appear complete.

Fix root causes.

---

# 53. Git Practices

Use meaningful commits.

Examples:

```text
feat: add teacher registration page
feat: add teacher card component
feat: add teacher search filters
fix: improve mobile teacher card layout
fix: handle empty teacher search results
refactor: extract teacher card component
```

Do not create giant commits containing unrelated changes.

---

# 54. Do Not Over-Engineer

This is a prototype.

Do not introduce:

* Microservices
* Redis
* Kubernetes
* Complex state management
* Complex event architecture
* Unnecessary third-party APIs
* Complex recommendation engines
* Payment infrastructure

unless the user explicitly requests them or there is a clear technical requirement.

Use the simplest architecture that can scale sensibly.

---

# 55. No Silent Major Decisions

The AI agent may use professional judgment for **small implementation decisions**, but must ask the user before making a **major product or architecture decision**.

## Small technical decisions

The agent may decide without asking when the decision:

* Does not change the user workflow
* Does not change collected data
* Does not change privacy/security behavior
* Does not change database relationships
* Does not introduce a new dependency with meaningful architectural impact
* Does not change the approved visual direction
* Is reversible
* Is an implementation detail

Examples:

* Extracting a reusable Button component
* Choosing between two equivalent Tailwind utility arrangements
* Naming an internal helper function
* Choosing a reasonable loading skeleton
* Refactoring duplicate code without changing behavior

## Major decisions requiring user approval

Stop and ask before changing:

* User roles
* Authentication model
* Contact/privacy model
* Database schema affecting product behavior
* RLS/security model
* Teacher Card fields
* School fields
* Search/filter behavior
* Visibility/indexing rules
* Admin moderation behavior
* New product features
* New external services
* New paid functionality
* Major navigation changes
* Major design direction
* Removing an approved feature
* Introducing a substantial dependency
* Changing the frontend/backend architecture

When uncertain whether a decision is major:

**Ask the user.**

Do not guess.

---

# 56. Existing Code First

Before creating anything:

1. Inspect the repository.
2. Check existing components.
3. Check existing routes.
4. Check installed packages.
5. Check existing Supabase configuration.
6. Check current styling.
7. Check existing database migrations.
8. Reuse existing components when appropriate.

Do not recreate functionality that already exists.

Do not overwrite working code unnecessarily.

---

# 57. Page Development Order

Unless the user specifies another order, use this suggested sequence.

## Phase 1 — Frontend Foundation

1. Global layout
2. Header
3. Footer
4. Design system
5. Homepage

STOP and wait for approval.

## Phase 2 — Teacher

6. Teacher registration
7. Create Teacher Card — Step 1
8. Create Teacher Card — Step 2
9. Create Teacher Card — Step 3
10. Create Teacher Card — Step 4
11. Create Teacher Card — Step 5
12. Review/Publish
13. Teacher Profile
14. Teacher Dashboard

After each meaningful page/step:

**STOP and wait for approval.**

## Phase 3 — School

15. School registration
16. Find Teachers
17. Search/filter interface
18. Teacher detail view
19. School dashboard
20. Shortlist/contact flow

Again:

**ONE PAGE → REVIEW → APPROVAL → NEXT PAGE.**

## Phase 4 — Backend Integration

After the frontend structure is approved:

21. Supabase Auth
22. Database schema
23. RLS
24. Teacher data
25. School data
26. Search
27. Contact requests
28. Shortlisting
29. Notifications
30. Admin moderation

Integrate carefully rather than rewriting the frontend unnecessarily.

---

# 58. Important: Frontend First

The user specifically wants to start from the frontend.

Therefore:

```text
front/
```

is the starting point.

Build and review the frontend page by page.

Do not start implementing the entire Supabase backend before the relevant frontend requirements are understood.

Backend work can be introduced when the corresponding feature/page is approved.

---

# 59. First Development Task

When beginning this project:

1. Inspect the repository.
2. Inspect the reference image.
3. Confirm Next.js configuration.
4. Confirm Tailwind setup.
5. Confirm TypeScript/ESLint setup.
6. Create/confirm global design system.
7. Build ONLY the first approved page.

If no page has been specified yet, propose:

### Homepage

Do not automatically implement every page.

---

# 60. Homepage Requirements

The homepage should clearly explain the marketplace in a few seconds.

Suggested structure:

```text
HEADER
   ↓
HERO
   "Find the Right Teacher for Your School"
   "Create your free Teacher Card and let schools discover you."

   [I'm a Teacher]
   [I'm a School]

   ↓

HOW IT WORKS

Teacher:
Create Card → Publish → Get Discovered

School:
Search → View Card → Contact

   ↓

FEATURED / SAMPLE TEACHER CARDS

   ↓

WHY TEACHCONNECT

   ↓

CALL TO ACTION

   ↓

FOOTER
```

Do not add unnecessary sections.

---

# 61. Homepage SEO

Suggested primary intent:

```text
Teacher recruitment platform
Find teachers
Hire teachers
Teaching jobs
```

Example title:

```text
TeachConnect — Find Teachers & Teaching Opportunities
```

Example description:

```text
Connect schools with teachers. Create a free Teacher Card or find qualified teachers by subject, location, experience and availability.
```

Adjust wording after the final brand/domain strategy is decided.

---

# 62. UX Principle

Every page must answer:

> What should the user do next?

Examples:

Teacher homepage:

```text
Create Your Teacher Card
```

School homepage:

```text
Find a Teacher
```

Search page:

```text
View Teacher Card
```

Teacher profile:

```text
Contact Teacher
```

Avoid pages where the user has no obvious next action.

---

# 63. Mobile-First Interaction

Important actions should remain easily accessible on mobile.

For Teacher Cards:

```text
[View Profile]
[Contact]
```

should not become tiny buttons.

Search filters should be easy to open and close.

Forms should avoid unnecessarily long scrolling where possible.

---

# 64. Data Validation

Examples:

### Name

* Required
* Reasonable length
* Trim whitespace

### Phone

* Validate format
* Normalize where appropriate

### Salary

* Numeric
* Positive
* Stored as integer PKR amount

### Experience

* Numeric
* Non-negative

### Email

* Valid email format

### Date

* Valid PostgreSQL date

Never rely solely on frontend validation.

---

# 65. Slugs

Public teacher profiles should use clean URLs.

Recommended pattern:

```text
/teacher/firstname-lastname-4char-suffix
```

Example:

```text
/teacher/muhammad-danish-a7k2
```

The suffix must be generated from a secure/random or collision-resistant short identifier.

Do not derive it from sensitive information.

### Collision strategy

If two teachers have the same name:

```text
muhammad-danish-a7k2
muhammad-danish-x4p9
```

The suffix guarantees uniqueness.

Never silently overwrite or merge profiles because of identical names.

---

# 66. Search URL State

Where practical, search filters should be represented in URL query parameters.

Example:

```text
/teachers?subject=mathematics&district=malir&availability=morning
```

Benefits:

* Shareable searches
* Better UX
* Browser back/forward support
* Potential SEO opportunities for carefully selected public search pages

Do not index arbitrary filter combinations.

Use canonical URLs for indexable landing pages.

---

# 67. Accessibility of Teacher Cards

Teacher Cards must be keyboard accessible.

The entire card should not necessarily be one giant clickable element.

Use proper:

```html
<article>
```

and accessible buttons/links.

Images require meaningful alt text.

Contact buttons must clearly communicate their action.

---

# 68. No Fake Data in Production

During UI development, mock data may be used temporarily.

Clearly separate:

```text
mock data
```

from:

```text
real Supabase data
```

Do not accidentally ship demo accounts or fake production statistics.

---

# 69. Seed Data

If seed data is required for development, clearly label it.

Example:

```text
back/supabase/seed.sql
```

Use fictional data.

Never use real people's personal information for development.

---

# 70. Documentation

Maintain:

```text
README.md
```

with:

* Project overview
* Tech stack
* Setup instructions
* Environment variables
* Development commands
* Database setup
* Deployment instructions
* Folder structure
* Authentication setup
* Supabase setup

Update documentation when architecture changes significantly.

---

# 71. Deployment Readiness

The architecture should be compatible with modern deployment platforms such as Vercel for Next.js and Supabase for backend services.

Before deployment check:

* Environment variables
* Build
* Authentication
* RLS
* Image configuration
* SEO metadata
* Sitemap
* Robots
* Error handling
* Mobile responsiveness
* Production database policies
* Rate limiting
* Security headers where appropriate

---

# 72. Important V1 Scope

The first prototype should prove only this:

```text
TEACHER
Create Teacher Card
       ↓
Publish
       ↓
SCHOOL
Search Teacher Cards
       ↓
View
       ↓
Contact Request
       ↓
Teacher Responds
```

If this works well, the prototype has achieved its primary objective.

---

# 73. Future Features — DO NOT BUILD YET

Keep these as future possibilities:

* Paid subscriptions
* Contact credits
* Featured teachers
* Featured schools
* Verified teachers
* Teacher reviews
* School reviews
* Recruitment service
* Interview scheduling
* In-platform messaging
* WhatsApp integration
* Notifications beyond V1 contact-request notifications
* AI teacher matching
* AI-powered search
* Teacher availability calendar
* School job board
* Advanced analytics
* Premium profiles

Do not implement these unless the user explicitly requests them.

V1 remains free and focused on Teacher Cards, school discovery, shortlisting, and contact requests.

---

# 74. Vibe Coding Rules

The user will use AI-assisted/vibe coding.

Therefore, before changing code:

### Inspect first.

Never blindly generate large amounts of code.

For every task:

```text
Understand
   ↓
Inspect
   ↓
Plan
   ↓
Implement
   ↓
Run
   ↓
Test
   ↓
Review
   ↓
STOP
```

Do not make large speculative changes.

---

# 75. AI Coding Safety

AI-generated code must still be reviewed.

Never assume generated code is correct.

Check:

* Security
* RLS
* Authentication
* Data exposure
* Performance
* TypeScript
* Accessibility
* SEO
* Responsive behavior
* Error handling
* Rate limiting

When AI-generated code introduces a major architectural decision, stop and ask the user according to Section 55.

---

# 76. Final Rule — User Feedback Controls Progress

This rule overrides the temptation to continue building.

### After every completed page/approved unit:

1. Show what was implemented.
2. Mention important decisions.
3. Tell the user how to review it.
4. Ask for feedback.
5. **STOP.**

Do not proceed automatically.

Example:

> **Homepage completed.**
>
> Implemented the responsive homepage based on the reference design, including the hero, teacher/school CTAs, workflow section, Teacher Card preview, and footer.
>
> Please review it on desktop and mobile. Tell me what you want changed. I will wait for your feedback before starting the next page.

---

# 77. Definition of Done

A page is NOT complete simply because it renders.

A page is complete when:

* UI is implemented
* Reference design has been considered
* Responsive behavior works
* Accessibility has been considered against WCAG 2.1 AA
* Loading states exist where needed
* Empty/error states exist where needed
* TypeScript has no errors
* ESLint has no errors
* Build passes where appropriate
* No obvious performance issues exist
* SEO metadata exists **only where the page is public/indexable**
* Components are reasonably organized
* No unnecessary dependencies were introduced
* User flow is clear
* Security/privacy behavior is correct
* The user has an opportunity to review it

Then:

**STOP AND WAIT FOR USER FEEDBACK.**

---

# 78. Final Product Principle

TeachConnect should feel like:

> **A simple, fast and trustworthy marketplace where schools can discover teachers through professional Teacher Cards.**

The Teacher Card is the heart of the product.

The platform should make the journey:

```text
Create Card
      ↓
Get Discovered
      ↓
Get Contact Request
      ↓
Respond
      ↓
Interview
      ↓
Get Hired
```

For schools:

```text
Need a Teacher
      ↓
Search
      ↓
Filter
      ↓
Compare Cards
      ↓
View Profile
      ↓
Contact
      ↓
Interview
      ↓
Hire
```

Build the smallest high-quality version of this experience first.

**Do not overbuild. Do not skip review steps. Do not move to the next page until the user approves the current one.**
