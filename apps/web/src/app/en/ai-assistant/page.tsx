import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: 'AI Assistant | Ailydian - Intelligent Multi-Engine AI Assistant',
  description:
    'Ailydian AI Assistant: Intelligent multi-engine AI assistant supporting 41+ languages. Advanced voice synthesis, code generation, document analysis, and multilingual translation. Enterprise-grade AI assistant for business productivity, creative work, technical development, and professional research with GDPR and KVKK compliance.',
  keywords: [
    'ai assistant',
    'ai chat',
    'intelligent assistant',
    'enterprise ai assistant',
    'multilingual ai',
    'voice ai assistant',
    'ai chatbot',
    'business ai assistant',
    'coding assistant',
    'ai helper',
    'virtual assistant ai',
    'smart assistant',
    'ai for productivity',
    'ai for business',
    'conversational ai',
    'ai translation',
    'ai code generation',
    'ai analysis tool',
    'professional ai assistant',
    'advanced ai chat',
  ],
  alternates: {
    canonical: 'https://www.ailydian.com/en/ai-assistant',
    languages: {
      en: 'https://www.ailydian.com/en/ai-assistant',
      tr: 'https://www.ailydian.com/yapay-zeka-asistani',
    },
  },
  openGraph: {
    title: 'AI Assistant | Ailydian - Intelligent Multi-Engine AI Assistant',
    description:
      'Intelligent AI assistant with voice, code, analysis, and translation. 41+ language support with enterprise-grade security.',
    url: 'https://www.ailydian.com/en/ai-assistant',
    siteName: 'Ailydian',
    locale: 'en_US',
    type: 'article',
    images: [
      {
        url: 'https://www.ailydian.com/og-ai-assistant.png',
        width: 1200,
        height: 630,
        alt: 'Ailydian AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Assistant | Ailydian',
    description:
      'Intelligent multi-engine AI assistant with voice, code, and multilingual support.',
    images: ['https://www.ailydian.com/og-ai-assistant.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.ailydian.com/en/ai-assistant#software',
      name: 'Ailydian AI Assistant',
      applicationCategory: 'ProductivityApplication',
      applicationSubCategory: 'Artificial Intelligence Assistant',
      operatingSystem: 'Web',
      description:
        'Intelligent multi-engine AI assistant supporting 41+ languages with advanced capabilities for voice interaction, code generation, document analysis, and professional translation.',
      featureList: [
        'Multi-Engine AI Intelligence',
        'Voice Synthesis and Recognition',
        'Code Generation and Analysis',
        'Document Processing',
        '41+ Language Translation',
        'Real-Time Conversation',
        'Context-Aware Responses',
        'Image Generation and Analysis',
        'Enterprise Security',
        'API Integration',
        'Custom Workflows',
        'Team Collaboration',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with premium features available',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ailydian.com/en/ai-assistant#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is an AI assistant?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An AI assistant is an intelligent software application that uses artificial intelligence to understand natural language, perform tasks, answer questions, and assist users with various activities. Ailydian\'s AI assistant leverages multiple AI engines to provide superior performance across coding, research, writing, analysis, and multilingual communication.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Ailydian AI assistant differ from other assistants?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Unlike single-model assistants, Ailydian uses a multi-AI architecture that automatically selects the best AI engine for each task. This provides superior coding assistance, better multilingual support across 41+ languages, more accurate research capabilities, and specialized expertise for different domains like healthcare, finance, legal, and education.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can Ailydian AI assistant help with coding?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Ailydian excels at coding assistance. It can write code in multiple programming languages, debug existing code, explain complex algorithms, suggest optimizations, generate documentation, review code for best practices, and help with software architecture decisions. The multi-AI approach ensures access to specialized coding models.',
          },
        },
        {
          '@type': 'Question',
          name: 'What languages does the AI assistant support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian AI assistant supports 41+ languages including English, Turkish, German, French, Spanish, Italian, Portuguese, Dutch, Russian, Polish, Ukrainian, Arabic, Hebrew, Hindi, Chinese (Simplified and Traditional), Japanese, Korean, Thai, Vietnamese, Indonesian, and many more. The multi-AI architecture routes each language to optimized models.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Ailydian AI assistant suitable for business use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Ailydian is designed for enterprise deployment with GDPR and KVKK compliance, enterprise-grade security, role-based access control, audit logging, team collaboration features, usage analytics, and industry-specific optimizations. It serves businesses in healthcare, finance, legal, education, technology, and other sectors.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can the AI assistant analyze data and create reports?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Ailydian can analyze data, identify patterns, generate insights, create visualizations, and produce comprehensive reports. It handles numerical analysis, statistical computations, trend identification, and data interpretation across various formats including spreadsheets, databases, and text documents.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Ailydian maintain conversation context?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian maintains conversation history and context across interactions, enabling coherent multi-turn dialogues. Even when switching between different AI engines for optimal task performance, the platform preserves context, ensuring seamless conversations without repetition or loss of information.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my data secure when using Ailydian AI assistant?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Ailydian implements enterprise-grade security including end-to-end encryption, GDPR and KVKK compliance, secure data storage, privacy-preserving processing, and comprehensive audit logging. Enterprise users can opt for on-premise deployment, private model hosting, and custom data retention policies.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.ailydian.com/en/ai-assistant#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.ailydian.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'English',
          item: 'https://www.ailydian.com/en',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'AI Assistant',
          item: 'https://www.ailydian.com/en/ai-assistant',
        },
      ],
    },
  ],
};

export default function AIAssistantPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Intelligent AI Assistant
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Experience the power of multiple AI engines working together. Natural language
              understanding, multi-language support, coding help, research, and creative
              assistance—all in one intelligent companion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Try AI Assistant Free
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">What is an AI Assistant?</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 mb-6">
                An AI assistant is an intelligent software application that leverages artificial
                intelligence to understand human language, interpret complex requests, and perform
                a wide range of tasks autonomously. Unlike traditional software that requires
                precise commands, AI assistants understand natural language, maintain conversation
                context, and adapt to individual communication styles.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Ailydian takes the AI assistant concept further by integrating multiple specialized
                AI engines into a unified platform. When you ask a coding question, Ailydian routes
                it to coding-specialized models. Medical queries go to healthcare-trained AI,
                creative writing to generative specialists, and data analysis to analytical engines.
                This multi-AI architecture ensures you always receive expert-level assistance
                regardless of task complexity or domain.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Modern AI assistants serve as productivity multipliers across professional and
                personal contexts. They draft emails, generate reports, debug code, translate
                documents, analyze data, research topics, brainstorm ideas, and automate repetitive
                tasks. Ailydian supports 41+ languages with native-quality understanding, making it
                a truly global assistant capable of serving multilingual teams and international
                organizations.
              </p>
              <p className="text-lg text-gray-300">
                The intelligence behind Ailydian continuously learns and improves. As you interact
                with the assistant, the platform refines its understanding of your preferences,
                communication style, and common tasks, becoming more personalized and effective over
                time while maintaining strict privacy and security standards.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Powerful Features of Ailydian AI Assistant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-3">Natural Language Understanding</h3>
              <p className="text-gray-300">
                Communicate naturally without learning special commands. Ailydian understands
                context, intent, ambiguity, and nuance across conversational interactions. Ask
                follow-up questions, reference previous topics, and interact as you would with a
                human colleague.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Multi-Language Support</h3>
              <p className="text-gray-300">
                Communicate in 41+ languages with native-quality understanding. Switch languages
                mid-conversation, translate documents, localize content, and collaborate across
                international teams. The multi-AI architecture routes each language to optimized
                models.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-semibold mb-3">Code Writing and Debugging</h3>
              <p className="text-gray-300">
                Write, debug, optimize, and review code across multiple programming languages.
                Generate complete applications, fix bugs, explain complex algorithms, suggest
                architectural improvements, create documentation, and learn best practices from
                expert AI.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-3">Research and Information Retrieval</h3>
              <p className="text-gray-300">
                Conduct comprehensive research across topics, industries, and domains. Synthesize
                information from multiple sources, identify key insights, verify facts, compare
                perspectives, and generate detailed reports with cited references and analysis.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold mb-3">Creative Content Writing</h3>
              <p className="text-gray-300">
                Create engaging content across formats including articles, blog posts, marketing
                copy, social media, emails, presentations, and stories. Adapt tone, style, and
                voice to match brand guidelines or personal preferences with creative AI models.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Data Analysis and Insights</h3>
              <p className="text-gray-300">
                Analyze complex datasets, identify patterns, generate statistical insights, create
                visualizations, and produce actionable recommendations. Process numerical data,
                text, time series, and mixed-format information with analytical AI engines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">
              How Ailydian AI Assistant Works
            </h2>
            <div className="space-y-8">
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  1. Natural Language Understanding
                </h3>
                <p className="text-gray-300 mb-4">
                  When you communicate with Ailydian, advanced natural language processing analyzes
                  your message to understand intent, context, sentiment, and requirements. The
                  system identifies the task type (coding, writing, analysis, translation), detects
                  the language, assesses complexity, and extracts key entities and relationships.
                </p>
                <p className="text-gray-300">
                  This understanding process happens instantly, enabling the AI to comprehend not
                  just what you said, but what you mean. Context from previous messages is
                  maintained across the conversation, allowing for natural follow-up questions and
                  topic continuity.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">
                  2. Intelligent AI Engine Selection
                </h3>
                <p className="text-gray-300 mb-4">
                  Based on task analysis, Ailydian automatically selects the optimal AI engine from
                  its multi-model architecture. Coding questions route to specialized programming
                  models, creative writing to generative engines, data analysis to analytical AI,
                  and multilingual tasks to language-optimized models.
                </p>
                <p className="text-gray-300">
                  This intelligent routing ensures you always receive expert-level assistance. The
                  system considers performance benchmarks, current load, response time requirements,
                  and cost optimization when selecting engines, transparently delivering the best
                  possible result.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-pink-400">
                  3. Response Generation and Delivery
                </h3>
                <p className="text-gray-300 mb-4">
                  The selected AI engine processes your request and generates a comprehensive
                  response. For code, this includes working implementations with explanations. For
                  research, synthesized information with sources. For creative tasks, original
                  content matching your specifications.
                </p>
                <p className="text-gray-300">
                  Responses undergo quality validation before delivery, ensuring accuracy,
                  relevance, and appropriateness. The conversation context is updated, enabling
                  seamless continuation across multiple interactions while maintaining coherence and
                  eliminating redundancy.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            AI Assistant Use Cases Across Industries
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">💼</div>
                <h3 className="text-2xl font-semibold">Business and Enterprise</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Accelerate business operations with AI-powered assistance for email drafting,
                report generation, market research, competitive analysis, meeting summarization,
                presentation creation, and strategic planning. Enterprise features include team
                collaboration, usage analytics, and compliance controls.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Automated business correspondence and documentation</li>
                <li>• Market research and competitive intelligence</li>
                <li>• Financial analysis and forecasting reports</li>
                <li>• Sales content and proposal generation</li>
                <li>• Customer service response automation</li>
                <li>• Strategic planning and decision support</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">🎓</div>
                <h3 className="text-2xl font-semibold">Education and Learning</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Enhance learning and teaching with personalized tutoring, homework assistance,
                concept explanation, study guide creation, practice problem generation, essay
                feedback, research help, and educational content development across all subjects and
                grade levels.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Personalized tutoring and concept explanation</li>
                <li>• Homework help and problem-solving guidance</li>
                <li>• Essay writing assistance and feedback</li>
                <li>• Study material and flashcard generation</li>
                <li>• Research project support and citation help</li>
                <li>• Language learning and practice</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">👨‍💻</div>
                <h3 className="text-2xl font-semibold">Software Development</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Boost development productivity with code generation, bug fixing, architecture
                design, code review, documentation writing, test creation, performance optimization,
                and technical explanation across all major programming languages and frameworks.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Full-stack application development</li>
                <li>• Debugging and error resolution</li>
                <li>• Code review and optimization suggestions</li>
                <li>• API design and integration</li>
                <li>• Technical documentation generation</li>
                <li>• Algorithm explanation and implementation</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">🏠</div>
                <h3 className="text-2xl font-semibold">Personal Productivity</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Streamline daily tasks with email writing, calendar management, travel planning,
                recipe creation, home project guidance, creative writing, language learning,
                personal finance advice, and general knowledge assistance for everyday needs.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Personal correspondence and communication</li>
                <li>• Travel itinerary planning and recommendations</li>
                <li>• Cooking recipes and meal planning</li>
                <li>• Home improvement project guidance</li>
                <li>• Creative writing and storytelling</li>
                <li>• General knowledge and trivia</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Advanced AI Assistant Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-semibold mb-4">Context-Aware Conversations</h3>
              <p className="text-gray-300 mb-4">
                Ailydian maintains comprehensive conversation history, enabling natural multi-turn
                dialogues. Reference previous topics, ask follow-up questions, and build complex
                interactions without repetition.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Persistent conversation memory</li>
                <li>• Cross-session context preservation</li>
                <li>• Automatic topic threading</li>
                <li>• Reference resolution and clarification</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-semibold mb-4">Task Automation</h3>
              <p className="text-gray-300 mb-4">
                Automate repetitive workflows by combining multiple AI capabilities. Generate
                reports, process data, create content, and perform complex multi-step operations
                through simple natural language instructions.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Multi-step workflow execution</li>
                <li>• Batch processing automation</li>
                <li>• Scheduled task management</li>
                <li>• Template-based generation</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-semibold mb-4">Adaptive Learning</h3>
              <p className="text-gray-300 mb-4">
                The AI assistant learns from interactions to better understand your preferences,
                communication style, and common tasks. Personalization improves over time while
                maintaining privacy and security.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Preference learning and adaptation</li>
                <li>• Communication style matching</li>
                <li>• Common task recognition</li>
                <li>• Performance optimization over time</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-semibold mb-4">Enterprise Integration</h3>
              <p className="text-gray-300 mb-4">
                Integrate Ailydian with existing enterprise systems through APIs, webhooks, and SSO.
                Connect to databases, CRM, ERP, and other business tools for seamless workflow
                integration.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• RESTful API access</li>
                <li>• Webhook automation triggers</li>
                <li>• SSO and identity management</li>
                <li>• Custom integration development</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security and Privacy Section */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">
              Security, Privacy, and Compliance
            </h2>
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-lg text-gray-300 mb-6">
                Ailydian implements enterprise-grade security to protect your data and ensure
                compliance with international regulations. All communications are encrypted
                end-to-end, data is processed securely, and privacy controls give you complete
                ownership of your information.
              </p>
              <p className="text-lg text-gray-300">
                For enterprise deployments, Ailydian offers on-premise hosting, private model
                deployment, custom data retention policies, comprehensive audit logging, and
                compliance certifications including GDPR, KVKK, and SOC 2 Type II (in progress).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-green-400">Data Protection</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• End-to-end encryption for all data</li>
                  <li>• Secure storage with access controls</li>
                  <li>• Privacy-preserving AI processing</li>
                  <li>• Automatic data anonymization options</li>
                  <li>• User-controlled data deletion</li>
                </ul>
              </div>
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">Compliance</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• GDPR compliant data processing</li>
                  <li>• KVKK compliance for Turkish operations</li>
                  <li>• SOC 2 Type II certification pending</li>
                  <li>• Comprehensive audit logging</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Frequently Asked Questions About AI Assistants
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {jsonLd['@graph'][1].mainEntity.map((faq: any, index: number) => (
              <div key={index} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">{faq.name}</h3>
                <p className="text-gray-300">{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Start Using Your AI Assistant Today
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Experience intelligent assistance powered by multiple AI engines. Free to start, with
              premium features for power users and enterprise teams. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Try Free Now
              </Link>
              <Link
                href="/en/multi-ai-platform"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all"
              >
                Learn About Multi-AI
              </Link>
            </div>
            <p className="text-gray-400 mt-6">
              Also available:{' '}
              <Link href="/yapay-zeka-asistani" className="text-blue-400 hover:underline">
                Turkish version (Yapay Zeka Asistanı)
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
