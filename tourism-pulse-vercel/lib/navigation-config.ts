export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '🏠',
    description: 'Overview and analytics'
  },
  {
    id: 'ai-models',
    label: 'AI Models',
    href: '/models',
    icon: '🤖',
    description: 'AI model selection and management',
    children: [
      {
        id: 'gpt-4-turbo',
        label: 'GPT-4 Turbo',
        href: '/models/gpt-4-turbo',
        icon: '🧠',
        description: 'OpenAI GPT-4 Turbo model'
      },
      {
        id: 'claude-3-5-sonnet',
        label: 'Claude 3.5 Sonnet',
        href: '/models/claude-3-5-sonnet',
        icon: '🎭',
        description: 'Anthropic Claude 3.5 Sonnet'
      },
      {
        id: 'gemini-2-0-flash',
        label: 'Gemini 2.0 Flash',
        href: '/models/gemini-2-0-flash',
        icon: '💎',
        description: 'Google Gemini 2.0 Flash'
      },
      {
        id: 'mistral-large-2',
        label: 'Mistral Large 2',
        href: '/models/mistral-large-2',
        icon: '🌪️',
        description: 'Mistral Large 2 model'
      },
      {
        id: 'llama-3-70b',
        label: 'Llama 3 70B',
        href: '/models/llama-3-70b',
        icon: '🦙',
        description: 'Meta Llama 3 70B model'
      }
    ]
  },
  {
    id: 'ai-search',
    label: 'AI Search',
    href: '/search',
    icon: '🚀',
    description: 'Unified AI platform for search and content generation'
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    href: '/knowledge',
    icon: '📚',
    description: 'AI knowledge base and documentation'
  },
  {
    id: 'futures',
    label: 'Futures',
    href: '/futures',
    icon: '📈',
    description: 'AI futures trading and analysis'
  },
  {
    id: 'workflows',
    label: 'Workflows',
    href: '/workflows',
    icon: '⚡',
    description: 'Automated AI workflows'
  },
  {
    id: 'studio',
    label: 'Studio',
    href: '/studio',
    icon: '🎬',
    description: 'AI content creation studio',
    children: [
      {
        id: 'video',
        label: 'Video',
        href: '/studio/video',
        icon: '🎥',
        description: 'AI video generation'
      },
      {
        id: 'music',
        label: 'Music',
        href: '/music',
        icon: '🎵',
        description: 'AI music generation'
      },
      {
        id: 'speech',
        label: 'Speech',
        href: '/speech',
        icon: '🗣️',
        description: 'AI speech synthesis'
      }
    ]
  },
  {
    id: 'research',
    label: 'Research',
    href: '/research',
    icon: '🔬',
    description: 'AI research and insights'
  },
  {
    id: 'edit',
    label: 'Edit',
    href: '/edit',
    icon: '✂️',
    description: 'AI content editing'
  },
  {
    id: 'compliance',
    label: 'Compliance',
    href: '/compliance',
    icon: '🛡️',
    description: 'AI compliance monitoring'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: '📊',
    description: 'AI analytics and insights'
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/billing',
    icon: '💳',
    description: 'Usage and billing information'
  }
];