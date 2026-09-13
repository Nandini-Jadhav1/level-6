# User Feedback Collection

## Overview

This document tracks real user feedback collected from Preprod testers who interact with the Private Revenue Split dApp.

**Feedback Form:** [Feedback form link — pending]

_Once the form is created, the link will be shared with testers and published here._

---

## Feedback Responses

**Status:** Awaiting real respondent submissions

The table below will be populated from actual user responses. See `data/feedback-raw.json` for structured data.

| Name | Wallet Address | What They Tested | Most Important Improvement Suggested | Date |
|------|----------------|------------------|-------------------------------------|------|
| _TODO: Populate from real feedback submissions_ | - | - | - | - |

---

## Feedback → Changes Made

This section documents improvements implemented based on user feedback.

### Implemented Improvements

- **Feedback:** "Show Transaction Successful message."
- **From:** Early tester feedback
- **Action Taken:** Added prominent success notification toast that appears after successful claim/register transactions with clear messaging, transaction ID display, and auto-dismiss functionality
- **Commit:** `65da26b`

- **Feedback:** "Improve UI."
- **From:** Early tester feedback
- **Action Taken:** Enhanced button clarity with clearer labels ("Claim Private Payout", "Register Split Rule"), improved button styling with gradients and better focus states, enhanced demo credentials panel, increased form spacing for better visual hierarchy
- **Commit:** `65da26b`

---

### Example Entry Format

- **Feedback:** "The claim button was unclear"
- **From:** Alice (addr_preprod1...)
- **Action Taken:** Improved button labeling and added loading state
- **Commit:** `abc1234`

---

## Notes for Maintainer

1. Create a feedback form (Google Forms, Typeform, or custom) with fields:
   - Name
   - Wallet Address
   - What did you test? (checkboxes: Deposit, Claim, Wallet Connection, UI/UX)
   - What improvement would help the most?
   - Any bugs encountered?
   - Additional comments

2. Share the form link with real Preprod testers

3. Update this document as responses arrive

4. Store raw responses in `data/feedback-raw.json` for programmatic access

5. Implement suggested improvements and document them in the "Feedback → Changes Made" section
