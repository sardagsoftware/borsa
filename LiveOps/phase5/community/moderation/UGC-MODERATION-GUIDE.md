# UGC Moderation Guidelines

**Project**: Ailydian Ultra Pro
**Scope**: PhotoMode, User Content, Community
**Last Updated**: October 12, 2025

---

## Moderation Principles

1. **Human Review First**: No automated censorship
2. **Context Matters**: Consider intent and cultural context
3. **Transparency**: Clear communication of actions taken
4. **Appeal Process**: 48h turnaround for appeals
5. **Privacy**: Protect user data during review

---

## PhotoMode Contest Moderation (Season 1, Week 3)

### Content Guidelines

#### ✅ Allowed
- Original in-game screenshots
- Creative compositions
- Use of filters and photo mode tools
- Humorous or artistic interpretations

#### ❌ Prohibited
- Offensive imagery or text
- Copyrighted material (without permission)
- Personal information (names, addresses, etc.)
- Exploits or glitches
- External image editing (Photoshop, etc.)

### Review Process

1. **Initial Submission**
   - Auto-check for image dimensions and file size
   - Queue for manual review

2. **Manual Review** (24h SLA)
   - Moderator reviews submission
   - Check against guidelines
   - Approve / Reject / Request Changes

3. **Rejection Reasons**
   - Violation of guidelines (specify which)
   - Technical issues (resolution, corruption)
   - Off-topic

4. **Appeal Process**
   - User can appeal within 48h
   - Senior moderator reviews
   - Final decision communicated

### Moderation Tiers

| Violation | Action | Duration | Appeal |
|-----------|--------|----------|--------|
| Minor (first offense) | Warning | N/A | Yes |
| Moderate | Remove content | N/A | Yes |
| Severe | Remove + contest ban | 7 days | Yes |
| Repeat offender | Permanent contest ban | Permanent | Yes |

---

## Support SLA Targets

| Priority | Response Time | Resolution Time | Channel |
|----------|---------------|-----------------|---------|
| Critical | 2h | 24h | Email, Live Chat |
| High | 4h | 48h | Email, Ticket |
| Standard | 24h | 7d | Email, Forum |
| Low | 72h | 30d | Forum |

### Critical Issues
- Account access problems
- Payment/refund issues
- Security concerns
- Data deletion requests (GDPR)

### High Issues
- Game-breaking bugs
- Missing purchases
- Ban appeals

### Standard Issues
- Gameplay questions
- Feature requests
- General feedback

---

## Community Guidelines

### Behavioral Standards

#### ✅ Encouraged
- Respectful discussion
- Constructive feedback
- Helping other players
- Sharing gameplay tips
- Reporting bugs

#### ❌ Prohibited
- Harassment or bullying
- Hate speech or discrimination
- Spam or advertising
- Cheating or exploit discussion
- Sharing personal information
- Impersonation

### Enforcement Actions

| Violation | First | Second | Third | Fourth |
|-----------|-------|--------|-------|--------|
| Minor (spam) | Warning | 24h mute | 7d mute | 30d mute |
| Moderate (harassment) | 7d ban | 30d ban | Permanent | - |
| Severe (hate speech) | 30d ban | Permanent | - | - |
| Critical (doxxing) | Permanent + legal | - | - | - |

---

## Communication Templates

### Content Removal Notification
```
Subject: Content Removal - PhotoMode Contest

Hello [USERNAME],

Your PhotoMode submission "[TITLE]" has been removed for the following reason:

[REASON]

You can appeal this decision by responding to this email within 48 hours.

For questions, please review our Community Guidelines: https://ailydian.com/guidelines

Best regards,
Ailydian Moderation Team
```

### Ban Notification
```
Subject: Account Suspension

Hello [USERNAME],

Your account has been suspended for [DURATION] due to:

[VIOLATION DESCRIPTION]

Suspension Period: [START DATE] - [END DATE]

You may appeal this decision by emailing appeal@ailydian.com within 48 hours.

Best regards,
Ailydian Moderation Team
```

### Appeal Approval
```
Subject: Appeal Approved

Hello [USERNAME],

After reviewing your appeal, we have decided to:

[ACTION: reinstate content / reduce ban duration / etc.]

Reason: [EXPLANATION]

Thank you for your patience.

Best regards,
Ailydian Moderation Team
```

---

## Escalation Process

1. **Tier 1**: Community moderators (volunteers)
   - Handle standard violations
   - Warnings and minor mutes

2. **Tier 2**: Senior moderators (staff)
   - Appeals
   - Bans (7-30 days)
   - Complex cases

3. **Tier 3**: Community Manager
   - Permanent bans
   - Legal concerns
   - Policy exceptions

---

## Reporting System

### In-Game Reporting
```javascript
// Report button in UI
{
  reportType: 'player_behavior' | 'bug' | 'content',
  targetUserId: 'user-123',
  reason: 'harassment',
  description: 'User sent threatening messages',
  evidence: ['screenshot-url-1', 'screenshot-url-2']
}
```

### Report Queue
- Auto-prioritized by severity
- Moderators claim reports
- 24h SLA for first response

---

## Moderation Metrics

### Track Weekly
- Total reports received
- Reports resolved (%)
- Average resolution time
- Appeals filed
- Appeals approved (%)
- User satisfaction (survey)

### Quality Assurance
- Random sample review (10%)
- Inter-moderator agreement (>90%)
- User feedback analysis

---

**Document Version**: 1.0.0
**Owner**: Community Manager
**Next Review**: Bi-weekly during Season 1
