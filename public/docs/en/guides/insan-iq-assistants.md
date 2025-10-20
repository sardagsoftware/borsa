# İnsan IQ Assistants Guide

Complete guide to building, configuring, and managing AI assistants with the İnsan IQ platform.

## Table of Contents

- [Overview](#overview)
- [Creating Assistants](#creating-assistants)
- [Assistant Capabilities](#assistant-capabilities)
- [Tool Integration](#tool-integration)
- [Function Calling](#function-calling)
- [Multi-Turn Conversations](#multi-turn-conversations)
- [Context Management](#context-management)
- [File Attachments](#file-attachments)
- [Code Interpreter](#code-interpreter)
- [Knowledge Retrieval](#knowledge-retrieval)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

## Overview

İnsan IQ Assistants enable you to create purpose-built AI agents with specific instructions, tools, and knowledge bases.

### Key Features

- **Custom Instructions**: Define assistant behavior and expertise
- **Tool Integration**: Connect external APIs and services
- **Function Calling**: Execute code on behalf of users
- **File Processing**: Analyze documents, images, and data
- **Code Interpreter**: Run Python code in sandboxed environment
- **Knowledge Retrieval**: Search uploaded files and documents
- **Multi-Turn Conversations**: Maintain context across messages
- **Streaming Responses**: Real-time token streaming

### Use Cases

- Customer Support Bots
- Data Analysis Assistants
- Code Review Helpers
- Research Assistants
- Educational Tutors
- Content Writers

## Creating Assistants

### Basic Assistant

```typescript
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY
});

const assistant = await client.assistants.create({
  name: 'Customer Support Assistant',
  instructions: `You are a helpful customer support agent for TechCo.
  Be professional, empathetic, and solution-oriented.
  Always verify customer identity before discussing account details.`,
  model: 'gpt-4-turbo',
  tools: []
});

console.log('Assistant created:', assistant.id);
```

```python
from lydian import InsanIQClient

client = InsanIQClient(api_key=os.environ['INSAN_IQ_API_KEY'])

assistant = client.assistants.create(
    name='Customer Support Assistant',
    instructions='''You are a helpful customer support agent for TechCo.
    Be professional, empathetic, and solution-oriented.
    Always verify customer identity before discussing account details.''',
    model='gpt-4-turbo',
    tools=[]
)

print(f'Assistant created: {assistant.id}')
```

### Domain-Specific Assistant

```typescript
// Financial advisor assistant
const financialAdvisor = await client.assistants.create({
  name: 'Personal Finance Advisor',
  instructions: `You are a certified financial advisor specializing in:
  - Retirement planning (401k, IRA, pension strategies)
  - Investment portfolio optimization
  - Tax-efficient strategies
  - Risk assessment and management

  Always provide disclaimers that you are not providing legal advice.
  Encourage users to consult with licensed professionals for specific situations.`,
  model: 'gpt-4-turbo',
  tools: [
    { type: 'code_interpreter' }
  ],
  metadata: {
    specialty: 'finance',
    certifications: ['CFP', 'CFA'],
    riskLevel: 'conservative'
  }
});
```

```go
package main

import (
    "context"
    "github.com/lydian/insan-iq-go"
)

func main() {
    client := insaniq.NewClient(os.Getenv("INSAN_IQ_API_KEY"))

    assistant, err := client.Assistants.Create(context.Background(), &insaniq.AssistantCreate{
        Name: "Personal Finance Advisor",
        Instructions: `You are a certified financial advisor specializing in:
        - Retirement planning (401k, IRA, pension strategies)
        - Investment portfolio optimization
        - Tax-efficient strategies
        - Risk assessment and management`,
        Model: "gpt-4-turbo",
        Tools: []insaniq.Tool{
            {Type: "code_interpreter"},
        },
        Metadata: map[string]string{
            "specialty": "finance",
            "certifications": "CFP,CFA",
        },
    })
}
```

## Assistant Capabilities

### Temperature and Creativity Control

```typescript
// Creative writing assistant (higher temperature)
const creativeWriter = await client.assistants.create({
  name: 'Creative Writing Coach',
  instructions: 'Help users craft compelling narratives and creative content.',
  model: 'gpt-4-turbo',
  temperature: 0.9, // More creative and varied
  top_p: 0.95
});

// Technical documentation assistant (lower temperature)
const technicalWriter = await client.assistants.create({
  name: 'Technical Documentation Writer',
  instructions: 'Generate precise, accurate technical documentation.',
  model: 'gpt-4-turbo',
  temperature: 0.2, // More deterministic and focused
  top_p: 0.85
});
```

### Response Format

```typescript
// JSON mode for structured output
const dataExtractor = await client.assistants.create({
  name: 'Data Extraction Assistant',
  instructions: 'Extract structured data from unstructured text.',
  model: 'gpt-4-turbo',
  response_format: { type: 'json_object' }
});

// Example usage
const thread = await client.threads.create();
await client.messages.create(thread.id, {
  role: 'user',
  content: 'Extract contact info: John Doe, john@example.com, (555) 123-4567'
});

const run = await client.runs.create(thread.id, {
  assistant_id: dataExtractor.id
});

// Output: {"name": "John Doe", "email": "john@example.com", "phone": "(555) 123-4567"}
```

## Tool Integration

### Function Tools

```typescript
// Define custom functions
const weatherAssistant = await client.assistants.create({
  name: 'Weather Assistant',
  instructions: 'Provide weather information and forecasts.',
  model: 'gpt-4-turbo',
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name, e.g. San Francisco'
            },
            units: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit'
            }
          },
          required: ['location']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_forecast',
        description: 'Get weather forecast for next N days',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            days: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Number of days to forecast'
            }
          },
          required: ['location', 'days']
        }
      }
    }
  ]
});
```

### E-Commerce Assistant with Tools

```typescript
const ecommerceAssistant = await client.assistants.create({
  name: 'E-Commerce Shopping Assistant',
  instructions: 'Help customers find products, check inventory, and place orders.',
  model: 'gpt-4-turbo',
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: 'Search for products in catalog',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            category: { type: 'string' },
            price_min: { type: 'number' },
            price_max: { type: 'number' },
            in_stock: { type: 'boolean' }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'check_inventory',
        description: 'Check product availability',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            warehouse: { type: 'string' }
          },
          required: ['product_id']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_order',
        description: 'Create a new order',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'string' },
                  quantity: { type: 'integer' }
                }
              }
            },
            customer_id: { type: 'string' },
            shipping_address: { type: 'object' }
          },
          required: ['items', 'customer_id']
        }
      }
    }
  ]
});
```

## Function Calling

### Handling Function Calls

```typescript
// Create thread and send message
const thread = await client.threads.create();
await client.messages.create(thread.id, {
  role: 'user',
  content: 'What\'s the weather in San Francisco?'
});

// Start run
const run = await client.runs.create(thread.id, {
  assistant_id: weatherAssistant.id
});

// Poll for completion
let runStatus = await client.runs.retrieve(thread.id, run.id);

while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
  await new Promise(resolve => setTimeout(resolve, 1000));
  runStatus = await client.runs.retrieve(thread.id, run.id);
}

// Handle function calls
if (runStatus.status === 'requires_action') {
  const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;

  const toolOutputs = await Promise.all(
    toolCalls.map(async (toolCall) => {
      if (toolCall.function.name === 'get_weather') {
        const args = JSON.parse(toolCall.function.arguments);
        const weather = await fetchWeather(args.location, args.units);

        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(weather)
        };
      }
    })
  );

  // Submit outputs
  await client.runs.submitToolOutputs(thread.id, run.id, {
    tool_outputs: toolOutputs
  });
}
```

```python
# Function execution handler
def execute_function(function_name, arguments):
    if function_name == 'get_weather':
        location = arguments.get('location')
        units = arguments.get('units', 'celsius')
        return fetch_weather_api(location, units)
    elif function_name == 'get_forecast':
        location = arguments['location']
        days = arguments['days']
        return fetch_forecast_api(location, days)
    else:
        raise ValueError(f'Unknown function: {function_name}')

# Handle run
run = client.runs.create(
    thread_id=thread.id,
    assistant_id=weather_assistant.id
)

while run.status in ['queued', 'in_progress']:
    time.sleep(1)
    run = client.runs.retrieve(thread_id=thread.id, run_id=run.id)

if run.status == 'requires_action':
    tool_calls = run.required_action.submit_tool_outputs.tool_calls
    tool_outputs = []

    for tool_call in tool_calls:
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments)

        result = execute_function(function_name, arguments)

        tool_outputs.append({
            'tool_call_id': tool_call.id,
            'output': json.dumps(result)
        })

    # Submit outputs
    client.runs.submit_tool_outputs(
        thread_id=thread.id,
        run_id=run.id,
        tool_outputs=tool_outputs
    )
```

## Multi-Turn Conversations

### Thread Management

```typescript
// Create persistent conversation thread
const thread = await client.threads.create({
  metadata: {
    customer_id: 'cust_12345',
    session_start: new Date().toISOString()
  }
});

// Add messages over time
await client.messages.create(thread.id, {
  role: 'user',
  content: 'I need help with my account'
});

const run1 = await client.runs.createAndWait(thread.id, {
  assistant_id: supportAssistant.id
});

// Continue conversation
await client.messages.create(thread.id, {
  role: 'user',
  content: 'Can you check my recent orders?'
});

const run2 = await client.runs.createAndWait(thread.id, {
  assistant_id: supportAssistant.id
});

// Retrieve conversation history
const messages = await client.messages.list(thread.id, {
  order: 'asc'
});

console.log('Conversation history:', messages.data);
```

### Context Window Management

```typescript
// Truncate conversation to fit context window
const conversation = await client.threads.retrieve(thread.id);
const allMessages = await client.messages.list(thread.id, { limit: 100 });

// Keep only recent messages that fit in context
const recentMessages = allMessages.data.slice(-20); // Last 20 messages

// Create new thread with recent context
const newThread = await client.threads.create({
  messages: recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content[0].text.value
  }))
});
```

## Code Interpreter

### Data Analysis Assistant

```typescript
const dataAnalyst = await client.assistants.create({
  name: 'Data Analysis Assistant',
  instructions: `You are a data scientist assistant.
  Analyze data, create visualizations, and provide insights.
  Use pandas, matplotlib, and numpy for analysis.`,
  model: 'gpt-4-turbo',
  tools: [{ type: 'code_interpreter' }]
});

// Upload dataset
const file = await client.files.create({
  file: fs.createReadStream('./sales_data.csv'),
  purpose: 'assistants'
});

// Create thread with file
const thread = await client.threads.create({
  messages: [
    {
      role: 'user',
      content: 'Analyze this sales data and create a monthly revenue chart',
      file_ids: [file.id]
    }
  ]
});

const run = await client.runs.createAndWait(thread.id, {
  assistant_id: dataAnalyst.id
});

// Retrieve generated charts
const messages = await client.messages.list(thread.id);
const lastMessage = messages.data[0];

// Download generated images
for (const content of lastMessage.content) {
  if (content.type === 'image_file') {
    const imageData = await client.files.content(content.image_file.file_id);
    fs.writeFileSync(`chart_${content.image_file.file_id}.png`, imageData);
  }
}
```

```python
# Scientific computing assistant
data_scientist = client.assistants.create(
    name='Scientific Computing Assistant',
    instructions='''You are a scientific computing expert.
    Use scipy, numpy, and matplotlib for numerical analysis.
    Explain your methodology and results clearly.''',
    model='gpt-4-turbo',
    tools=[{'type': 'code_interpreter'}]
)

# Upload experimental data
file = client.files.create(
    file=open('./experiment_results.csv', 'rb'),
    purpose='assistants'
)

# Request analysis
thread = client.threads.create()
client.messages.create(
    thread_id=thread.id,
    role='user',
    content='Perform statistical analysis on this experimental data. Calculate mean, std, and run t-test.',
    file_ids=[file.id]
)

run = client.runs.create_and_wait(
    thread_id=thread.id,
    assistant_id=data_scientist.id
)

# Code interpreter will execute:
# import pandas as pd
# import scipy.stats as stats
# df = pd.read_csv('experiment_results.csv')
# mean = df['value'].mean()
# std = df['value'].std()
# ...
```

## Knowledge Retrieval

### Document Search Assistant

```typescript
const researchAssistant = await client.assistants.create({
  name: 'Research Document Assistant',
  instructions: 'Help users find information in uploaded research papers.',
  model: 'gpt-4-turbo',
  tools: [{ type: 'retrieval' }]
});

// Upload research papers
const papers = [
  './papers/machine_learning_2023.pdf',
  './papers/neural_networks.pdf',
  './papers/deep_learning_survey.pdf'
];

const fileIds = await Promise.all(
  papers.map(async (path) => {
    const file = await client.files.create({
      file: fs.createReadStream(path),
      purpose: 'assistants'
    });
    return file.id;
  })
);

// Create thread with files
const thread = await client.threads.create({
  messages: [
    {
      role: 'user',
      content: 'What are the main techniques for training large language models?',
      file_ids: fileIds
    }
  ]
});

const run = await client.runs.createAndWait(thread.id, {
  assistant_id: researchAssistant.id
});

// Assistant will search through PDFs and cite sources
```

### Knowledge Base Assistant

```typescript
// Legal document assistant
const legalAssistant = await client.assistants.create({
  name: 'Legal Research Assistant',
  instructions: `You are a legal research assistant.
  Search contract documents and provide accurate citations.
  Always include document name and page number in references.`,
  model: 'gpt-4-turbo',
  tools: [{ type: 'retrieval' }]
});

// Upload legal documents
const contracts = await client.files.createBatch([
  { file: './contracts/service_agreement.pdf', purpose: 'assistants' },
  { file: './contracts/nda.pdf', purpose: 'assistants' },
  { file: './contracts/employment.pdf', purpose: 'assistants' }
]);

// Query with retrieval
const thread = await client.threads.create();
await client.messages.create(thread.id, {
  role: 'user',
  content: 'What are the termination conditions in our service agreements?',
  file_ids: contracts.map(c => c.id)
});
```

## Performance Optimization

### Streaming Responses

```typescript
// Stream assistant responses
const stream = await client.runs.createAndStream(thread.id, {
  assistant_id: assistant.id
});

stream
  .on('textCreated', (text) => {
    process.stdout.write('\nassistant > ');
  })
  .on('textDelta', (textDelta, snapshot) => {
    process.stdout.write(textDelta.value);
  })
  .on('toolCallCreated', (toolCall) => {
    console.log(`\nassistant > ${toolCall.type}\n`);
  })
  .on('toolCallDelta', (toolCallDelta, snapshot) => {
    if (toolCallDelta.type === 'code_interpreter') {
      if (toolCallDelta.code_interpreter.input) {
        process.stdout.write(toolCallDelta.code_interpreter.input);
      }
      if (toolCallDelta.code_interpreter.outputs) {
        console.log('\noutput >', toolCallDelta.code_interpreter.outputs);
      }
    }
  });
```

```python
# Stream with event handlers
with client.runs.create_and_stream(
    thread_id=thread.id,
    assistant_id=assistant.id
) as stream:
    for event in stream:
        if event.event == 'thread.message.delta':
            for delta in event.data.delta.content:
                if delta.type == 'text':
                    print(delta.text.value, end='', flush=True)
```

### Parallel Tool Execution

```typescript
// Enable parallel function calling
const multitoolAssistant = await client.assistants.create({
  name: 'Multi-Tool Assistant',
  instructions: 'Execute multiple tools concurrently when possible.',
  model: 'gpt-4-turbo',
  tools: [
    { type: 'function', function: { name: 'get_weather', /* ... */ } },
    { type: 'function', function: { name: 'get_stock_price', /* ... */ } },
    { type: 'function', function: { name: 'get_news', /* ... */ } }
  ],
  tool_resources: {
    parallel_tool_calls: true // Enable parallel execution
  }
});

// Assistant can call multiple functions simultaneously:
// - get_weather('New York')
// - get_stock_price('AAPL')
// - get_news('technology')
```

## Best Practices

### 1. Clear Instructions

```typescript
// ❌ Vague instructions
const badAssistant = await client.assistants.create({
  name: 'Helper',
  instructions: 'Be helpful'
});

// ✅ Specific instructions
const goodAssistant = await client.assistants.create({
  name: 'Customer Support Specialist',
  instructions: `You are a Tier 1 customer support agent for SaaS products.

RESPONSIBILITIES:
- Answer billing questions (refer to pricing documentation)
- Troubleshoot common technical issues (check status page first)
- Escalate complex issues to engineering team

TONE:
- Professional and empathetic
- Patient with non-technical users
- Proactive in offering solutions

CONSTRAINTS:
- Do not share internal system details
- Do not make promises about future features
- Always verify customer identity before account changes`
});
```

### 2. Error Handling

```typescript
async function runAssistant(threadId: string, assistantId: string) {
  try {
    const run = await client.runs.create(threadId, {
      assistant_id: assistantId
    });

    // Wait with timeout
    const maxWait = 60000; // 60 seconds
    const startTime = Date.now();

    let runStatus = await client.runs.retrieve(threadId, run.id);

    while (
      runStatus.status === 'in_progress' ||
      runStatus.status === 'queued'
    ) {
      if (Date.now() - startTime > maxWait) {
        // Cancel long-running job
        await client.runs.cancel(threadId, run.id);
        throw new Error('Run timeout exceeded');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === 'failed') {
      console.error('Run failed:', runStatus.last_error);
      throw new Error(runStatus.last_error.message);
    }

    return runStatus;

  } catch (error) {
    console.error('Assistant error:', error);
    throw error;
  }
}
```

### 3. File Management

```typescript
// Clean up old files periodically
async function cleanupFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  const files = await client.files.list({ purpose: 'assistants' });
  const now = Date.now();

  for (const file of files.data) {
    const fileAge = now - file.created_at * 1000;

    if (fileAge > maxAge) {
      await client.files.delete(file.id);
      console.log(`Deleted old file: ${file.filename}`);
    }
  }
}
```

### 4. Cost Optimization

```typescript
// Monitor token usage
const run = await client.runs.retrieve(threadId, runId);
console.log('Token usage:', {
  prompt_tokens: run.usage.prompt_tokens,
  completion_tokens: run.usage.completion_tokens,
  total_tokens: run.usage.total_tokens
});

// Use smaller models for simple tasks
const simpleAssistant = await client.assistants.create({
  name: 'FAQ Bot',
  instructions: 'Answer frequently asked questions',
  model: 'gpt-3.5-turbo', // Cheaper model for simple tasks
  tools: []
});
```

## Related Documentation

- [İnsan IQ Personas](./insan-iq-personas.md)
- [İnsan IQ Reasoning](./insan-iq-reasoning.md)
- [İnsan IQ Assessments](./insan-iq-assessments.md)
- [Assistants API Reference](/docs/api/insan-iq/assistants)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
