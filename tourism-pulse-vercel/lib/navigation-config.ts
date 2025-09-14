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