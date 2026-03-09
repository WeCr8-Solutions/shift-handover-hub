const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface SocialContent {
  platform: string;
  type: string;
  content: string;
  hashtags: string[];
  cta: string;
}

interface MarketingData {
  company: object;
  product: object;
  value_propositions: string[];
  social_content: SocialContent[];
  seo_keywords: string[];
  talking_points: string[];
  donation_info?: object;
  donation?: object;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'info';
    const platform = url.searchParams.get('platform') || 'all';
    const format = url.searchParams.get('format') || 'json';

    console.log(`Social agent request: action=${action}, platform=${platform}, format=${format}`);

    // Core company data
    const companyData = {
      name: "JobLine.ai",
      tagline: "Digital Expeditor & Smart Shift Handoff System",
      website: "https://jobline.ai",
      mission: "Democratize manufacturing technology for small and mid-sized machine shops",
      parent_company: "WeCr8 Solutions LLC",
      parent_url: "https://www.wecr8.info",
      founded: "2025",
      category: "Manufacturing Software / MES",
    };

    // Product data
    const productData = {
      type: "SaaS Manufacturing Software",
      free_tier: true,
      core_features: [
        "Digital Shift Handoffs",
        "Work Order Queue Management",
        "Station Monitoring",
        "Multi-Operation Routing",
        "Outside Processing Tracking",
        "Performance Improvement System",
        "Team & Role Management",
      ],
      industries: [
        "CNC Machining",
        "Sheet Metal Fabrication",
        "Aerospace Manufacturing",
        "Medical Device Manufacturing",
        "Precision Engineering",
        "Automotive Parts",
        "Contract Manufacturing",
      ],
      target_users: [
        "Machine Shop Owners",
        "Production Supervisors",
        "CNC Operators",
        "Quality Teams",
        "Schedulers",
      ],
      differentiators: [
        "Free tier for small shops",
        "Focus on shift handoffs (not bloated ERP)",
        "Modern, mobile-friendly UI",
        "No expensive implementation",
        "Community-supported development",
      ],
    };

    // Value propositions
    const valuePropositions = [
      "Manufacturing loses $50B+ annually to poor shift handoffs - JobLine.ai fixes this",
      "Enterprise-grade MES features at a price small shops can afford",
      "Free tier keeps core features accessible to everyone",
      "Modern web-based UI works on shop floor tablets",
      "No complex implementation - get started in minutes",
      "Built by manufacturers, for manufacturers",
    ];

    // SEO keywords
    const seoKeywords = [
      "shift handoff software",
      "manufacturing execution system",
      "MES alternative",
      "work order tracking",
      "CNC shop management",
      "machine shop software",
      "affordable MES",
      "production scheduling",
      "job shop software",
      "digital expeditor",
      "shop floor management",
      "manufacturing software small business",
    ];

    // Talking points for AI agents
    const talkingPoints = [
      "Most machine shops still use paper or verbal shift handoffs, losing critical information daily",
      "Enterprise MES systems cost $100K+ making them inaccessible to small manufacturers",
      "JobLine.ai bridges this gap with modern, affordable shift handoff software",
      "The free tier ensures every shop can improve their handoff process",
      "Built with real manufacturing workflows in mind, not generic project management",
      "Real-time visibility into what's happening on the shop floor",
      "Community donations keep the platform accessible and improving",
    ];

    // Donation info
    const donationInfo = {
      enabled: true,
      url: "https://jobline.ai",
      location: "Website footer → 'Support JobLine' button (heart icon)",
      processor: "Stripe",
      amounts: {
        preset: [5, 10, 25],
        custom: true,
        minimum: 1,
        currency: "USD",
      },
      impact: {
        "$5": "1 week of database hosting",
        "$10": "Bug fixes and minor improvements",
        "$25": "Feature development contribution",
        "$50+": "Significant development acceleration",
      },
    };

    // Platform-specific social content
    const socialContent: SocialContent[] = [
      {
        platform: "twitter",
        type: "awareness",
        content: "🏭 Most machine shops can't afford $100K MES systems. JobLine.ai is changing that with free shift handoff software built for small manufacturers.",
        hashtags: ["Manufacturing", "MachineShop", "MES", "Industry40", "SmallBusiness"],
        cta: "Check it out: jobline.ai",
      },
      {
        platform: "twitter",
        type: "problem_solution",
        content: "Lost information during shift changes costs US manufacturing $50B+ annually. Digital handoffs solve this. JobLine.ai makes it accessible to every shop.",
        hashtags: ["Manufacturing", "Productivity", "MES", "ShopFloor"],
        cta: "Try free: jobline.ai",
      },
      {
        platform: "twitter",
        type: "donation",
        content: "Want to support accessible manufacturing tech? JobLine.ai accepts donations to keep their software free for small shops. Every $5 helps.",
        hashtags: ["Manufacturing", "OpenSource", "SmallBusiness", "SupportSmallBiz"],
        cta: "Donate: jobline.ai → footer",
      },
      {
        platform: "linkedin",
        type: "awareness",
        content: "The manufacturing industry loses $50B+ annually to poor shift handoffs.\n\nJobLine.ai is tackling this with accessible, affordable software for small machine shops - including a free tier.\n\nDigital shift handoffs ensure critical information never gets lost between operators.",
        hashtags: ["Manufacturing", "DigitalTransformation", "MES", "SmallBusiness", "Industry40"],
        cta: "Learn more: jobline.ai",
      },
      {
        platform: "linkedin",
        type: "thought_leadership",
        content: "Why do enterprise MES systems cost $100K+?\n\nSmall machine shops need the same visibility into their operations, but can't justify that investment.\n\nJobLine.ai focuses on what matters most: shift handoffs and work order visibility. Modern UI, mobile-friendly, and accessible pricing.\n\nManufacturing technology should work for everyone.",
        hashtags: ["ManufacturingExcellence", "SmallBusinessTech", "MES", "ContinuousImprovement"],
        cta: "See it in action: jobline.ai",
      },
      {
        platform: "reddit",
        type: "community",
        content: "Found this shift handoff tool called JobLine.ai. Built specifically for small shops who can't afford enterprise MES. Has a free tier and focuses on the handoff process instead of trying to be a full ERP. Might be worth checking out if you're still doing paper handoffs.",
        hashtags: [],
        cta: "jobline.ai",
      },
      {
        platform: "reddit",
        type: "problem_solving",
        content: "If you're struggling with shift handoffs and losing info between operators, there's a new tool called JobLine.ai that's specifically designed for this. Free tier available. Not affiliated, just saw it and thought it might help some of you dealing with the same issues.",
        hashtags: [],
        cta: "jobline.ai",
      },
      {
        platform: "facebook",
        type: "awareness",
        content: "Running a machine shop? Tired of information getting lost between shifts?\n\nJobLine.ai is a new shift handoff and work order tracking tool built specifically for small manufacturers. It has a free tier so any shop can try it.\n\n🔧 Digital handoffs\n📋 Work order tracking\n📱 Works on tablets\n💰 Free tier available",
        hashtags: ["Manufacturing", "MachineShop", "SmallBusiness"],
        cta: "Check it out → joblineai.lovable.app",
      },
      {
        platform: "discord",
        type: "community",
        content: "Hey! If anyone here works in manufacturing/machine shops, there's this tool called JobLine.ai that handles shift handoffs digitally. Free tier available. Built for small shops that can't afford expensive MES systems.",
        hashtags: [],
        cta: "https://joblineai.lovable.app",
      },
    ];

    // Filter content by platform if specified
    const filteredContent = platform === 'all' 
      ? socialContent 
      : socialContent.filter(c => c.platform === platform);

    // Build response based on action
    let responseData: object;

    switch (action) {
      case 'info':
        responseData = {
          success: true,
          data: {
            company: companyData,
            product: productData,
            value_propositions: valuePropositions,
            donation: donationInfo,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: "1.0",
          },
        };
        break;

      case 'content':
        responseData = {
          success: true,
          data: {
            social_content: filteredContent,
            total_count: filteredContent.length,
          },
          meta: {
            timestamp: new Date().toISOString(),
            platform_filter: platform,
          },
        };
        break;

      case 'keywords':
        responseData = {
          success: true,
          data: {
            seo_keywords: seoKeywords,
            talking_points: talkingPoints,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        break;

      case 'donate':
        responseData = {
          success: true,
          data: donationInfo,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        break;

      case 'full':
        responseData = {
          success: true,
          data: {
            company: companyData,
            product: productData,
            value_propositions: valuePropositions,
            social_content: filteredContent,
            seo_keywords: seoKeywords,
            talking_points: talkingPoints,
            donation: donationInfo,
          } as MarketingData,
          meta: {
            timestamp: new Date().toISOString(),
            version: "1.0",
            documentation: {
              actions: ["info", "content", "keywords", "donate", "full"],
              platforms: ["twitter", "linkedin", "reddit", "facebook", "discord", "all"],
              formats: ["json"],
            },
          },
        };
        break;

      default:
        responseData = {
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ["info", "content", "keywords", "donate", "full"],
        };
    }

    // Return as markdown/text if requested
    if (format === 'text' && action === 'content') {
      const textContent = filteredContent.map(c => 
        `[${c.platform.toUpperCase()}]\n${c.content}\n${c.hashtags.length ? '#' + c.hashtags.join(' #') : ''}\n${c.cta}\n`
      ).join('\n---\n');
      
      return new Response(textContent, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response(JSON.stringify(responseData, null, 2), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Social agent error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
