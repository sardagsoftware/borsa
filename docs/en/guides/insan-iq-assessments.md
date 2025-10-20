# İnsan IQ Assessments Guide

Complete guide to creating, managing, and analyzing skill assessments with the İnsan IQ platform.

## Table of Contents

- [Overview](#overview)
- [Creating Assessments](#creating-assessments)
- [Question Types](#question-types)
- [Scoring Systems](#scoring-systems)
- [Adaptive Testing](#adaptive-testing)
- [Result Analysis](#result-analysis)
- [Assessment Templates](#assessment-templates)
- [Multi-Tenant Management](#multi-tenant-management)
- [Best Practices](#best-practices)

## Overview

İnsan IQ Assessments enable you to measure skills, knowledge, and competencies across various domains. The platform supports multiple question formats, adaptive testing, real-time scoring, and comprehensive analytics.

### Key Features

- **Multiple Question Types**: Multiple choice, coding challenges, essay, practical tasks
- **Adaptive Testing**: Dynamic difficulty adjustment based on performance
- **Real-Time Scoring**: Instant evaluation with detailed feedback
- **Skill Mapping**: Map questions to specific skills and competencies
- **Analytics Dashboard**: Comprehensive insights into assessment performance
- **Multi-Language Support**: Create assessments in multiple languages
- **Version Control**: Track assessment changes and maintain historical records

### Use Cases

- **Technical Interviews**: Evaluate coding skills and problem-solving abilities
- **Employee Training**: Measure learning outcomes and skill development
- **Certification Programs**: Validate competency against industry standards
- **Educational Institutions**: Test student knowledge and understanding
- **Recruitment**: Screen candidates efficiently at scale

## Creating Assessments

### Basic Assessment Creation

Create a simple assessment with multiple-choice questions:

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY,
  environment: 'production'
});

// Create a basic technical assessment
const assessment = await client.assessments.create({
  title: 'JavaScript Developer Assessment',
  description: 'Evaluate JavaScript fundamentals and best practices',
  duration: 45, // minutes
  passingScore: 70, // percentage
  category: 'technical',
  difficulty: 'intermediate',
  tags: ['javascript', 'web-development', 'frontend'],
  settings: {
    shuffleQuestions: true,
    shuffleAnswers: true,
    showResults: 'immediate',
    allowReview: true,
    attemptsAllowed: 1
  }
});

console.log('Assessment created:', assessment.id);
```

### Adding Questions

Add different question types to your assessment:

```typescript
// Multiple Choice Question
await client.assessments.addQuestion(assessment.id, {
  type: 'multiple_choice',
  question: 'Which method is used to add elements to the end of an array?',
  points: 10,
  options: [
    { text: 'array.push()', correct: true },
    { text: 'array.pop()', correct: false },
    { text: 'array.shift()', correct: false },
    { text: 'array.unshift()', correct: false }
  ],
  explanation: 'push() adds elements to the end of an array and returns the new length.',
  skills: ['javascript', 'arrays'],
  difficulty: 'easy'
});

// Multiple Select Question
await client.assessments.addQuestion(assessment.id, {
  type: 'multiple_select',
  question: 'Which of the following are JavaScript data types? (Select all that apply)',
  points: 15,
  options: [
    { text: 'String', correct: true },
    { text: 'Number', correct: true },
    { text: 'Character', correct: false },
    { text: 'Boolean', correct: true },
    { text: 'Integer', correct: false }
  ],
  partialCredit: true,
  skills: ['javascript', 'data-types'],
  difficulty: 'easy'
});

// Code Writing Question
await client.assessments.addQuestion(assessment.id, {
  type: 'code_writing',
  question: 'Write a function that reverses a string without using built-in reverse methods.',
  points: 25,
  starterCode: `function reverseString(str) {
  // Your code here
}`,
  testCases: [
    { input: '"hello"', expected: '"olleh"' },
    { input: '"JavaScript"', expected: '"tpircSavaJ"' },
    { input: '""', expected: '""' }
  ],
  timeLimit: 300, // seconds
  language: 'javascript',
  skills: ['javascript', 'algorithms', 'strings'],
  difficulty: 'medium'
});
```

### Domain-Specific Assessments

Create assessments for specialized domains:

```typescript
// Medical Knowledge Assessment
const medicalAssessment = await client.assessments.create({
  title: 'Internal Medicine Diagnostic Assessment',
  description: 'Evaluate diagnostic reasoning and clinical decision-making',
  duration: 60,
  passingScore: 75,
  category: 'medical',
  difficulty: 'advanced',
  domain: 'internal_medicine',
  settings: {
    requiresProctoring: true,
    randomizeQuestions: true,
    showResults: 'after_review',
    certificateOnPass: true
  }
});

// Case-Based Clinical Question
await client.assessments.addQuestion(medicalAssessment.id, {
  type: 'case_study',
  scenario: `A 45-year-old male presents with chest pain, shortness of breath,
             and sweating. Blood pressure: 160/95 mmHg, Heart rate: 110 bpm.
             ECG shows ST-segment elevation in leads II, III, and aVF.`,
  question: 'What is the most likely diagnosis?',
  points: 30,
  options: [
    { text: 'Inferior wall myocardial infarction', correct: true },
    { text: 'Anterior wall myocardial infarction', correct: false },
    { text: 'Pulmonary embolism', correct: false },
    { text: 'Aortic dissection', correct: false }
  ],
  followUpQuestions: [
    {
      question: 'What is the immediate management priority?',
      options: [
        { text: 'Aspirin + Clopidogrel + Heparin + PCI', correct: true },
        { text: 'Observation only', correct: false }
      ]
    }
  ],
  skills: ['cardiology', 'diagnostic_reasoning', 'emergency_medicine'],
  difficulty: 'advanced'
});
```

## Question Types

### Multiple Choice

Standard single-answer questions:

```typescript
const mcqQuestion = {
  type: 'multiple_choice',
  question: 'What is the time complexity of binary search?',
  points: 10,
  options: [
    { text: 'O(1)', correct: false },
    { text: 'O(log n)', correct: true },
    { text: 'O(n)', correct: false },
    { text: 'O(n log n)', correct: false }
  ],
  explanation: 'Binary search divides the search space in half with each iteration.',
  hints: [
    { text: 'Consider how the search space changes with each step', cost: 2 }
  ],
  skills: ['algorithms', 'complexity_analysis'],
  difficulty: 'medium'
};
```

### Coding Challenges

Interactive code execution with test cases:

```typescript
const codingChallenge = {
  type: 'code_execution',
  question: 'Implement a function to find the longest palindromic substring.',
  description: `Given a string s, return the longest palindromic substring in s.

                Example:
                Input: "babad"
                Output: "bab" or "aba"`,
  points: 50,
  starterCode: {
    javascript: `function longestPalindrome(s) {
  // Your code here
}`,
    python: `def longest_palindrome(s: str) -> str:
    # Your code here
    pass`,
    go: `func longestPalindrome(s string) string {
  // Your code here
}`
  },
  testCases: [
    {
      input: { s: 'babad' },
      expected: 'bab',
      alternateExpected: ['aba'],
      points: 10
    },
    {
      input: { s: 'cbbd' },
      expected: 'bb',
      points: 10
    },
    {
      input: { s: 'a' },
      expected: 'a',
      points: 5
    },
    {
      input: { s: 'racecar' },
      expected: 'racecar',
      points: 15
    },
    {
      hidden: true,
      input: { s: 'abcdefghijklmnopqrstuvwxyz' },
      expected: 'a',
      points: 10
    }
  ],
  constraints: [
    '1 <= s.length <= 1000',
    's consists of only lowercase letters'
  ],
  timeLimit: 600,
  memoryLimit: 128, // MB
  skills: ['algorithms', 'dynamic_programming', 'strings'],
  difficulty: 'hard'
};
```

### Essay Questions

Free-form text responses with AI-assisted grading:

```typescript
const essayQuestion = {
  type: 'essay',
  question: 'Explain the SOLID principles in object-oriented programming and provide examples.',
  points: 40,
  minWords: 300,
  maxWords: 800,
  rubric: {
    criteria: [
      {
        name: 'Understanding',
        description: 'Demonstrates clear understanding of all 5 SOLID principles',
        points: 15
      },
      {
        name: 'Examples',
        description: 'Provides relevant code examples for each principle',
        points: 15
      },
      {
        name: 'Clarity',
        description: 'Clear, well-organized writing',
        points: 5
      },
      {
        name: 'Technical Accuracy',
        description: 'No technical errors or misconceptions',
        points: 5
      }
    ]
  },
  autoGrading: {
    enabled: true,
    model: 'gpt-4',
    prompt: 'Evaluate the response based on the rubric criteria. Provide scores and constructive feedback.',
    requiresReview: true
  },
  skills: ['software_design', 'oop', 'best_practices'],
  difficulty: 'advanced'
};
```

### Practical Tasks

Real-world scenario-based assessments:

```typescript
const practicalTask = {
  type: 'practical_task',
  title: 'Build a REST API Endpoint',
  description: `Create a RESTful API endpoint that:
                1. Accepts POST requests with user data
                2. Validates input (email, password strength)
                3. Stores data in a database
                4. Returns appropriate HTTP status codes`,
  points: 100,
  environment: {
    type: 'cloud_sandbox',
    framework: 'express',
    database: 'postgresql',
    runtime: 'node:18'
  },
  starterTemplate: 'api-boilerplate-v2',
  requirements: [
    { id: 'req1', description: 'Endpoint accepts POST /api/users', points: 20 },
    { id: 'req2', description: 'Email validation implemented', points: 15 },
    { id: 'req3', description: 'Password strength check (min 8 chars, special char)', points: 15 },
    { id: 'req4', description: 'User stored in database', points: 25 },
    { id: 'req5', description: 'Proper HTTP status codes (201, 400, 500)', points: 15 },
    { id: 'req6', description: 'Error handling implemented', points: 10 }
  ],
  automatedTests: [
    {
      name: 'Valid user creation',
      request: {
        method: 'POST',
        endpoint: '/api/users',
        body: { email: 'test@example.com', password: 'SecureP@ss123' }
      },
      expectedStatus: 201,
      points: 20
    },
    {
      name: 'Invalid email rejection',
      request: {
        method: 'POST',
        endpoint: '/api/users',
        body: { email: 'invalid-email', password: 'SecureP@ss123' }
      },
      expectedStatus: 400,
      points: 15
    }
  ],
  timeLimit: 3600, // 1 hour
  skills: ['rest_api', 'validation', 'database', 'error_handling'],
  difficulty: 'advanced'
};
```

## Scoring Systems

### Point-Based Scoring

Traditional point accumulation:

```typescript
const assessment = await client.assessments.create({
  title: 'Python Developer Assessment',
  scoringType: 'points',
  totalPoints: 100,
  passingScore: 70,
  scoringBreakdown: {
    'python_basics': 30,
    'data_structures': 25,
    'algorithms': 25,
    'best_practices': 20
  }
});

// Calculate final score
const result = await client.assessments.submit(assessmentId, {
  answers: candidateAnswers
});

console.log('Score:', result.score); // e.g., 85/100
console.log('Percentage:', result.percentage); // e.g., 85%
console.log('Passed:', result.passed); // true
console.log('Breakdown:', result.breakdown);
// {
//   python_basics: 28/30,
//   data_structures: 20/25,
//   algorithms: 22/25,
//   best_practices: 15/20
// }
```

### Weighted Scoring

Assign different weights to question categories:

```typescript
const weightedAssessment = await client.assessments.create({
  title: 'Full Stack Developer Assessment',
  scoringType: 'weighted',
  categories: [
    { name: 'frontend', weight: 0.35, questions: frontendQuestions },
    { name: 'backend', weight: 0.35, questions: backendQuestions },
    { name: 'database', weight: 0.20, questions: databaseQuestions },
    { name: 'devops', weight: 0.10, questions: devopsQuestions }
  ],
  passingScore: 75
});

// Score calculation
const calculateWeightedScore = (categoryScores: CategoryScore[]) => {
  return categoryScores.reduce((total, category) => {
    const categoryPercentage = (category.score / category.maxScore) * 100;
    return total + (categoryPercentage * category.weight);
  }, 0);
};
```

### Skill-Based Scoring

Measure specific competencies:

```typescript
const skillBasedAssessment = await client.assessments.create({
  title: 'Software Engineer Competency Assessment',
  scoringType: 'skill_based',
  skillLevels: {
    'algorithms': { target: 'advanced', weight: 0.25 },
    'system_design': { target: 'intermediate', weight: 0.25 },
    'code_quality': { target: 'advanced', weight: 0.20 },
    'problem_solving': { target: 'advanced', weight: 0.20 },
    'communication': { target: 'intermediate', weight: 0.10 }
  },
  passingCriteria: {
    minimumSkillLevel: 'intermediate',
    requiredSkills: ['algorithms', 'system_design'],
    overallScore: 70
  }
});

// Skill assessment result
const skillResult = await client.assessments.getSkillAnalysis(resultId);
console.log(skillResult);
// {
//   algorithms: { level: 'advanced', score: 88, target: 'advanced', met: true },
//   system_design: { level: 'intermediate', score: 72, target: 'intermediate', met: true },
//   code_quality: { level: 'advanced', score: 85, target: 'advanced', met: true },
//   problem_solving: { level: 'advanced', score: 78, target: 'advanced', met: true },
//   communication: { level: 'intermediate', score: 70, target: 'intermediate', met: true }
// }
```

## Adaptive Testing

### CAT (Computerized Adaptive Testing)

Adjust difficulty based on performance:

```typescript
const adaptiveAssessment = await client.assessments.create({
  title: 'Adaptive Programming Assessment',
  type: 'adaptive',
  adaptiveSettings: {
    algorithm: 'IRT', // Item Response Theory
    startingDifficulty: 'medium',
    minQuestions: 15,
    maxQuestions: 40,
    terminationCriteria: {
      standardError: 0.3,
      confidenceLevel: 0.95
    },
    difficultyAdjustment: {
      correctAnswer: 'increase',
      incorrectAnswer: 'decrease',
      stepSize: 1
    }
  },
  questionPool: {
    easy: easyQuestionIds,
    medium: mediumQuestionIds,
    hard: hardQuestionIds,
    expert: expertQuestionIds
  }
});

// Adaptive algorithm implementation
class AdaptiveTestEngine {
  async selectNextQuestion(
    candidateAbility: number,
    previousQuestions: string[]
  ): Promise<Question> {
    // Use IRT to select optimal question
    const availableQuestions = await this.getAvailableQuestions(previousQuestions);

    const questionScores = availableQuestions.map(q => ({
      question: q,
      informationValue: this.calculateInformation(q.difficulty, candidateAbility)
    }));

    // Select question with maximum information value
    return questionScores.sort((a, b) => b.informationValue - a.informationValue)[0].question;
  }

  calculateInformation(difficulty: number, ability: number): number {
    // Fisher Information function
    const probability = 1 / (1 + Math.exp(-(ability - difficulty)));
    return probability * (1 - probability);
  }

  updateAbilityEstimate(
    currentAbility: number,
    questionDifficulty: number,
    correct: boolean
  ): number {
    // Maximum Likelihood Estimation
    const learningRate = 0.3;
    const expected = 1 / (1 + Math.exp(-(currentAbility - questionDifficulty)));
    const actual = correct ? 1 : 0;
    return currentAbility + learningRate * (actual - expected);
  }
}
```

### Branching Logic

Create conditional question paths:

```typescript
const branchingAssessment = await client.assessments.create({
  title: 'Medical Triage Assessment',
  type: 'branching',
  rootQuestion: 'q1',
  questionFlow: {
    q1: {
      question: 'What is the chief complaint?',
      type: 'multiple_choice',
      options: [
        { text: 'Chest pain', nextQuestion: 'q2_cardiac' },
        { text: 'Difficulty breathing', nextQuestion: 'q2_respiratory' },
        { text: 'Abdominal pain', nextQuestion: 'q2_abdominal' },
        { text: 'Trauma', nextQuestion: 'q2_trauma' }
      ]
    },
    q2_cardiac: {
      question: 'Rate the pain severity (1-10)',
      type: 'scale',
      branches: [
        { condition: 'value >= 7', nextQuestion: 'q3_cardiac_severe' },
        { condition: 'value < 7', nextQuestion: 'q3_cardiac_moderate' }
      ]
    },
    q2_respiratory: {
      question: 'Can you speak in full sentences?',
      type: 'yes_no',
      branches: [
        { condition: 'answer === "no"', nextQuestion: 'q3_respiratory_critical' },
        { condition: 'answer === "yes"', nextQuestion: 'q3_respiratory_stable' }
      ]
    }
  }
});
```

## Result Analysis

### Individual Results

Retrieve detailed candidate results:

```typescript
const result = await client.assessments.getResult(resultId);

console.log('Candidate Performance:');
console.log('Score:', result.score, '/', result.maxScore);
console.log('Percentage:', result.percentage, '%');
console.log('Time Taken:', result.duration, 'minutes');
console.log('Passed:', result.passed);

// Question-by-question analysis
result.questions.forEach((q, index) => {
  console.log(`\nQuestion ${index + 1}: ${q.correct ? '✓' : '✗'}`);
  console.log('Points:', q.pointsEarned, '/', q.maxPoints);
  console.log('Time:', q.timeSpent, 'seconds');

  if (!q.correct && q.explanation) {
    console.log('Explanation:', q.explanation);
  }
});

// Skill analysis
console.log('\nSkill Breakdown:');
Object.entries(result.skillAnalysis).forEach(([skill, data]) => {
  console.log(`${skill}: ${data.level} (${data.score}%)`);
});
```

### Comparative Analytics

Compare candidates and identify patterns:

```typescript
// Get cohort statistics
const cohortStats = await client.assessments.getCohortStats(assessmentId, {
  dateRange: { start: '2025-01-01', end: '2025-12-31' },
  groupBy: 'month'
});

console.log('Cohort Statistics:');
console.log('Average Score:', cohortStats.averageScore);
console.log('Median Score:', cohortStats.medianScore);
console.log('Pass Rate:', cohortStats.passRate, '%');
console.log('Average Duration:', cohortStats.averageDuration, 'minutes');

// Distribution analysis
console.log('\nScore Distribution:');
console.log('0-50%:', cohortStats.distribution['0-50'], 'candidates');
console.log('51-70%:', cohortStats.distribution['51-70'], 'candidates');
console.log('71-85%:', cohortStats.distribution['71-85'], 'candidates');
console.log('86-100%:', cohortStats.distribution['86-100'], 'candidates');

// Question difficulty analysis
const questionStats = await client.assessments.getQuestionStats(assessmentId);

questionStats.questions.forEach(q => {
  console.log(`\nQuestion ${q.id}:`);
  console.log('Correct Rate:', q.correctRate, '%');
  console.log('Average Time:', q.averageTime, 'seconds');
  console.log('Discrimination Index:', q.discriminationIndex);

  if (q.discriminationIndex < 0.2) {
    console.log('⚠️ Low discrimination - consider revising');
  }
});
```

### AI-Powered Insights

Get automated recommendations:

```python
from lydian import InsanIQClient

client = InsanIQClient(api_key=os.environ['INSAN_IQ_API_KEY'])

# Get AI-powered insights
insights = client.assessments.get_insights(
    assessment_id=assessment_id,
    analysis_type='comprehensive'
)

print("Assessment Insights:")
print(f"Overall Quality Score: {insights.quality_score}/100")

# Question recommendations
for recommendation in insights.question_recommendations:
    print(f"\nQuestion {recommendation.question_id}:")
    print(f"Issue: {recommendation.issue}")
    print(f"Suggestion: {recommendation.suggestion}")
    print(f"Priority: {recommendation.priority}")

# Difficulty calibration
print("\nDifficulty Calibration:")
for question in insights.difficulty_analysis:
    if question.perceived_difficulty != question.actual_difficulty:
        print(f"Question {question.id}:")
        print(f"  Expected: {question.perceived_difficulty}")
        print(f"  Actual: {question.actual_difficulty}")
        print(f"  Recommendation: {question.recommendation}")

# Skill gap analysis
print("\nSkill Gaps Identified:")
for gap in insights.skill_gaps:
    print(f"{gap.skill}: {gap.average_score}% (Target: {gap.target}%)")
    print(f"  Recommendation: {gap.recommendation}")
```

## Assessment Templates

### Quick Start Templates

Use pre-built templates for common assessments:

```typescript
// Technical interview template
const technicalInterview = await client.assessments.createFromTemplate({
  templateId: 'technical-interview-fullstack',
  customization: {
    title: 'Senior Full Stack Developer Interview',
    difficulty: 'senior',
    duration: 90,
    technologies: ['react', 'node', 'postgresql', 'aws'],
    includeSystemDesign: true,
    includeLiveCoding: true
  }
});

// Certification exam template
const certification = await client.assessments.createFromTemplate({
  templateId: 'certification-exam',
  customization: {
    title: 'AWS Solutions Architect Certification',
    domain: 'cloud_computing',
    vendor: 'AWS',
    certificationLevel: 'associate',
    numberOfQuestions: 65,
    passingScore: 72
  }
});

// Employee onboarding template
const onboarding = await client.assessments.createFromTemplate({
  templateId: 'employee-onboarding',
  customization: {
    title: 'New Developer Onboarding Assessment',
    company: 'Acme Corp',
    department: 'Engineering',
    topics: ['company_culture', 'dev_tools', 'processes', 'security'],
    mandatory: true
  }
});
```

### Custom Template Creation

Build reusable templates:

```go
package main

import (
    "github.com/lydian/insan-iq-go"
)

func createCustomTemplate() {
    client := insaniq.NewClient(os.Getenv("INSAN_IQ_API_KEY"))

    // Create template
    template, err := client.Assessments.CreateTemplate(&insaniq.AssessmentTemplate{
        Name: "Backend Developer Standard Interview",
        Description: "Standard technical interview for backend positions",
        Category: "technical_interview",
        Sections: []insaniq.TemplateSection{
            {
                Name: "Data Structures & Algorithms",
                Weight: 0.30,
                QuestionCount: 10,
                Difficulty: "medium",
                QuestionTypes: []string{"multiple_choice", "code_writing"},
            },
            {
                Name: "Database Design",
                Weight: 0.25,
                QuestionCount: 8,
                Difficulty: "medium",
                QuestionTypes: []string{"multiple_choice", "sql_query"},
            },
            {
                Name: "API Design",
                Weight: 0.25,
                QuestionCount: 6,
                Difficulty: "hard",
                QuestionTypes: []string{"practical_task", "case_study"},
            },
            {
                Name: "System Design",
                Weight: 0.20,
                QuestionCount: 3,
                Difficulty: "hard",
                QuestionTypes: []string{"whiteboard", "architecture_diagram"},
            },
        },
        DefaultSettings: insaniq.AssessmentSettings{
            Duration: 120,
            PassingScore: 70,
            ShuffleQuestions: true,
            AllowReview: false,
        },
        Tags: []string{"backend", "interview", "technical"},
    })

    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Template created: %s\n", template.ID)
}
```

## Multi-Tenant Management

### Organization-Level Assessments

Manage assessments across organizations:

```typescript
// Create organization-wide assessment library
const orgLibrary = await client.organizations.createAssessmentLibrary({
  organizationId: 'org_abc123',
  name: 'Engineering Assessment Library',
  assessments: [
    {
      id: 'frontend-dev-l1',
      title: 'Frontend Developer - Entry Level',
      access: 'all_departments',
      mandatory: false
    },
    {
      id: 'security-awareness',
      title: 'Security Awareness Training',
      access: 'all_employees',
      mandatory: true,
      expiryDays: 365
    }
  ]
});

// Department-specific assessments
await client.departments.assignAssessment({
  departmentId: 'dept_engineering',
  assessmentId: 'frontend-dev-l1',
  settings: {
    required: true,
    deadline: '2025-12-31',
    retakesAllowed: 2
  }
});

// Track completion across organization
const compliance = await client.organizations.getComplianceReport({
  organizationId: 'org_abc123',
  assessmentId: 'security-awareness',
  groupBy: 'department'
});

console.log('Compliance Status:');
compliance.departments.forEach(dept => {
  console.log(`${dept.name}: ${dept.completionRate}% complete`);
});
```

### User Role-Based Access

Control assessment access and visibility:

```python
# Admin: Full access to all assessments
admin_client = InsanIQClient(
    api_key=os.environ['ADMIN_API_KEY'],
    role='admin'
)

# Create assessment with access controls
assessment = admin_client.assessments.create(
    title='Senior Engineer Evaluation',
    access_control={
        'visibility': 'private',
        'allowed_roles': ['hiring_manager', 'tech_lead', 'admin'],
        'allowed_users': ['user_123', 'user_456'],
        'department_restriction': 'engineering'
    }
)

# Hiring Manager: Can view and assign assessments
manager_client = InsanIQClient(
    api_key=os.environ['MANAGER_API_KEY'],
    role='hiring_manager'
)

# Assign assessment to candidate
assignment = manager_client.assessments.assign(
    assessment_id=assessment.id,
    candidate_id='candidate_789',
    deadline='2025-11-01',
    notification=True
)

# Candidate: Can only take assigned assessments
candidate_client = InsanIQClient(
    api_key=os.environ['CANDIDATE_API_KEY'],
    role='candidate'
)

# Get assigned assessments
my_assessments = candidate_client.assessments.get_assigned()
```

## Best Practices

### Assessment Design

**1. Question Quality**

```typescript
// ✅ Good: Clear, unambiguous question
{
  question: 'Which HTTP method is idempotent and typically used to update resources?',
  options: [
    { text: 'PUT', correct: true },
    { text: 'POST', correct: false },
    { text: 'PATCH', correct: false },
    { text: 'DELETE', correct: false }
  ]
}

// ❌ Bad: Ambiguous, poorly worded
{
  question: 'What do you use for updating?',
  options: [
    { text: 'PUT or PATCH maybe', correct: true },
    { text: 'Other methods', correct: false }
  ]
}

// ✅ Good: Realistic code challenge
{
  type: 'code_writing',
  question: 'Implement rate limiting middleware for an Express.js API',
  description: 'Create middleware that limits requests to 100 per hour per IP address',
  // Clear requirements, realistic scenario
}

// ❌ Bad: Trivial or unrealistic
{
  type: 'code_writing',
  question: 'Write a hello world program',
  // Too simple for assessment purposes
}
```

**2. Progressive Difficulty**

```typescript
const wellStructuredAssessment = {
  sections: [
    {
      name: 'Warm-up',
      difficulty: 'easy',
      questions: warmupQuestions, // 25% of total
      purpose: 'Build confidence, establish baseline'
    },
    {
      name: 'Core Competency',
      difficulty: 'medium',
      questions: coreQuestions, // 50% of total
      purpose: 'Evaluate primary skills'
    },
    {
      name: 'Advanced Challenges',
      difficulty: 'hard',
      questions: advancedQuestions, // 25% of total
      purpose: 'Identify exceptional candidates'
    }
  ]
};
```

**3. Fair Evaluation**

```typescript
// Provide partial credit where appropriate
const partialCreditQuestion = {
  type: 'multiple_select',
  question: 'Select all valid CSS positioning values',
  options: [
    { text: 'static', correct: true },
    { text: 'relative', correct: true },
    { text: 'absolute', correct: true },
    { text: 'centered', correct: false }
  ],
  scoring: {
    allCorrect: 10,
    partialCredit: true,
    perCorrectAnswer: 3,
    penaltyPerWrong: -2
  }
};

// Allow reasonable time limits
const reasonableTimeLimits = {
  multipleChoice: 60, // 1 minute
  shortAnswer: 180, // 3 minutes
  codingChallenge: 600, // 10 minutes
  practicalTask: 3600 // 1 hour
};
```

### Performance Optimization

**1. Question Bank Management**

```typescript
// Use question banks for reusability
const questionBank = await client.questionBanks.create({
  name: 'JavaScript Fundamentals',
  category: 'technical',
  tags: ['javascript', 'programming'],
  questions: questions
});

// Sample randomly from bank
const assessment = await client.assessments.create({
  title: 'JavaScript Quiz',
  questionSources: [
    {
      bankId: questionBank.id,
      sampleSize: 20,
      sampling: 'random',
      balanceDifficulty: true
    }
  ]
});
```

**2. Caching Results**

```typescript
// Cache assessment results for analytics
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedResult(resultId: string) {
  const cached = await redis.get(`result:${resultId}`);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await client.assessments.getResult(resultId);
  await redis.setex(`result:${resultId}`, 3600, JSON.stringify(result));

  return result;
}
```

### Security Considerations

**1. Prevent Cheating**

```typescript
const secureAssessment = await client.assessments.create({
  title: 'Secure Certification Exam',
  securitySettings: {
    requireProctoring: true,
    browserLockdown: true,
    preventCopyPaste: true,
    randomizeQuestions: true,
    randomizeAnswers: true,
    blockExternalResources: true,
    takeScreenshots: true,
    screenshotInterval: 60, // seconds
    detectTabSwitch: true,
    maxTabSwitches: 3,
    requireWebcam: true,
    faceVerification: true
  }
});
```

**2. Data Privacy**

```typescript
// Anonymize candidate data for analytics
const anonymizedResults = await client.assessments.getResults(assessmentId, {
  anonymize: true,
  includeFields: ['score', 'duration', 'skills'],
  excludeFields: ['name', 'email', 'ip_address']
});

// GDPR-compliant data deletion
await client.candidates.deleteData(candidateId, {
  reason: 'user_request',
  deleteAssessments: true,
  deleteFeedback: true,
  retentionOverride: false
});
```

## Related Documentation

- [İnsan IQ Getting Started](./insan-iq-getting-started.md)
- [İnsan IQ Personas Guide](./insan-iq-personas.md)
- [İnsan IQ API Reference](/docs/api/insan-iq/assessments)
- [Assessment Best Practices](/docs/en/concepts/assessment-design.md)

## Support

- **Documentation**: https://docs.lydian.com
- **API Status**: https://status.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
