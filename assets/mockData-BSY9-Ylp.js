const a=new Date,e=t=>new Date(a.getTime()-t*864e5),r=t=>new Date(a.getTime()-t*36e5),o=t=>new Date(a.getTime()-t*6e4),n=[{id:"1",from:"Sarah Chen",fromEmail:"sarah.chen@acmecorp.com",subject:"Q1 Project Update — Action Required",preview:"Hi team, please review the attached Q1 deliverables and provide feedback by Friday...",body:`Hi team,

Please review the attached Q1 deliverables and provide feedback by Friday. The client has requested a status update and we need to align on the final numbers before the presentation.

Key items:
- Revenue projections need updating
- Marketing spend analysis is pending your review
- Customer acquisition costs look promising

Let me know if you have any questions.

Best,
Sarah`,time:"10:32 AM",date:o(45),category:"work",priority:"high",read:!1,starred:!0,hasAttachment:!0,labels:["project","urgent"]},{id:"2",from:"GitHub",fromEmail:"notifications@github.com",subject:"New pull request on revvel-email-organizer",preview:"MIDNGHTSAPPHIRE opened a new pull request: feat: add AI categorization engine...",body:`MIDNGHTSAPPHIRE opened a new pull request #42:

feat: add AI categorization engine

This PR adds the OpenRouter-based email categorization system with support for 9 categories and confidence scoring.

Changes:
- Added aiCategorizer.ts
- Added ruleEngine.ts
- Updated routers.ts with new endpoints
- Added tests for categorization logic`,time:"9:15 AM",date:r(2),category:"updates",priority:"medium",read:!1,starred:!1,hasAttachment:!1,labels:["github"]},{id:"3",from:"TechCrunch Daily",fromEmail:"newsletter@techcrunch.com",subject:"This Week in AI: Email Assistants Are Booming",preview:"The latest roundup of AI productivity tools shows a 340% increase in adoption...",body:`This Week in AI

Email Assistants Are Booming

The latest roundup of AI productivity tools shows a 340% increase in adoption of email management tools. Key players include Superhuman, SaneBox, and newcomer Revvel.

Other highlights:
- OpenAI announces GPT-5 release date
- Google Gemini gets email integration
- Microsoft Copilot expands to Outlook`,time:"8:00 AM",date:r(4),category:"newsletters",priority:"low",read:!0,starred:!1,hasAttachment:!1,labels:["tech","newsletter"],unsubscribeLink:"https://techcrunch.com/unsubscribe"},{id:"4",from:"Stripe",fromEmail:"receipts@stripe.com",subject:"Payment receipt for February 2026",preview:"Your Stripe invoice for February 2026 is now available. Total: $49.99...",body:`Payment Receipt

Invoice #INV-2026-0216
Date: February 16, 2026
Amount: $49.99

Description: Revvel Pro Plan - Monthly
Payment method: Visa ending in 4242

Thank you for your payment.`,time:"Yesterday",date:e(1),category:"receipts",priority:"low",read:!0,starred:!1,hasAttachment:!0,labels:["receipt","stripe"]},{id:"5",from:"LinkedIn",fromEmail:"notifications@linkedin.com",subject:"5 people viewed your profile this week",preview:"Your profile was viewed by recruiters at Google, Microsoft, and Anthropic...",body:`Your Weekly Profile Views

5 people viewed your profile this week:

1. Recruiter at Google - Senior Software Engineer
2. Hiring Manager at Microsoft - Full Stack Developer
3. Talent Acquisition at Anthropic - AI Engineer
4. CTO at StartupXYZ
5. Anonymous viewer

Update your profile to attract more views.`,time:"Yesterday",date:e(1),category:"job-search",priority:"medium",read:!0,starred:!1,hasAttachment:!1,labels:["linkedin","career"]},{id:"6",from:"Alex Rivera",fromEmail:"alex.rivera@company.com",subject:"Meeting notes from standup",preview:"Here are the key takeaways from today's standup: 1. Backend API is 90% complete...",body:`Team Standup Notes - Feb 16, 2026

Key Takeaways:
1. Backend API is 90% complete
2. Frontend dashboard needs accessibility review
3. AI categorization accuracy improved to 94%
4. Deploy to staging by Wednesday

Action Items:
- @sarah: Finalize API docs
- @alex: Fix the TypeScript errors in routers
- @team: Code review by EOD Thursday`,time:"2 days ago",date:e(2),category:"work",priority:"medium",read:!0,starred:!1,hasAttachment:!1,labels:["meeting","standup"]},{id:"7",from:"Amazon",fromEmail:"order-update@amazon.com",subject:"Your order has shipped!",preview:"Your package with Rode NT1 Microphone is on its way. Expected delivery: Feb 18...",body:`Your Order Has Shipped!

Order #112-3456789-0123456

Item: Rode NT1 5th Generation Microphone
Quantity: 1
Price: $249.00

Shipping: Free Prime Delivery
Expected: February 18, 2026

Track your package: [tracking link]`,time:"2 days ago",date:e(2),category:"receipts",priority:"low",read:!0,starred:!1,hasAttachment:!1,labels:["amazon","shipping"]},{id:"8",from:"DocuSign",fromEmail:"dse@docusign.net",subject:"Please sign: Freelancer Agreement - Acme Corp",preview:"Acme Corp has sent you a document to review and sign. Please complete by Feb 20...",body:`Document Ready for Signature

From: Acme Corp Legal Department
Document: Freelancer Agreement 2026
Deadline: February 20, 2026

Please review and sign this document at your earliest convenience.

[Review Document]`,time:"3 days ago",date:e(3),category:"legal",priority:"high",read:!1,starred:!0,hasAttachment:!0,labels:["legal","signature"]},{id:"9",from:"Mom",fromEmail:"mom@gmail.com",subject:"Sunday dinner this week?",preview:"Hey sweetie, are you free this Sunday for dinner? Dad is making his famous...",body:`Hey sweetie,

Are you free this Sunday for dinner? Dad is making his famous pot roast and your brother is coming too.

Let me know by Thursday so I can plan!

Love,
Mom`,time:"3 days ago",date:e(3),category:"personal",priority:"medium",read:!0,starred:!0,hasAttachment:!1,labels:["family"]},{id:"10",from:"Product Hunt",fromEmail:"hello@producthunt.com",subject:"Trending: Top 10 AI Tools This Week",preview:"Discover the hottest AI tools launched this week on Product Hunt...",body:`Top 10 AI Tools This Week

1. Revvel Email Organizer - AI-powered inbox management
2. CodeBuddy - AI pair programming
3. DesignMind - AI design assistant
4. DataFlow - Automated data pipelines
5. WriteCraft - AI content generation
...`,time:"4 days ago",date:e(4),category:"newsletters",priority:"low",read:!0,starred:!1,hasAttachment:!1,labels:["newsletter"],unsubscribeLink:"https://producthunt.com/unsubscribe"},{id:"11",from:"Indeed",fromEmail:"alerts@indeed.com",subject:"3 new jobs match your search: Full Stack Developer",preview:"New job listings matching your saved search for Full Stack Developer in remote...",body:`New Job Matches

1. Full Stack Developer - Remote
   Company: TechStartup Inc.
   Salary: $120K-$160K

2. Senior React Developer - Remote
   Company: BigCorp
   Salary: $140K-$180K

3. Full Stack Engineer - Hybrid
   Company: InnovateCo
   Salary: $130K-$170K`,time:"4 days ago",date:e(4),category:"job-search",priority:"medium",read:!0,starred:!1,hasAttachment:!1,labels:["jobs","career"],unsubscribeLink:"https://indeed.com/unsubscribe"},{id:"12",from:"Spotify",fromEmail:"no-reply@spotify.com",subject:"Your 2026 music taste is evolving!",preview:"You've discovered 47 new artists this month. Here's your personalized playlist...",body:`Your Music in Numbers

This month you:
- Discovered 47 new artists
- Listened to 312 songs
- Top genre: Lo-fi Hip Hop
- Most played: 'Midnight Drive' by Chillwave

Check out your personalized playlist: Discover Weekly`,time:"5 days ago",date:e(5),category:"social",priority:"low",read:!0,starred:!1,hasAttachment:!1,labels:["spotify"],unsubscribeLink:"https://spotify.com/unsubscribe"},{id:"13",from:"Grammarly",fromEmail:"weekly@grammarly.com",subject:"Your weekly writing stats are in!",preview:"You were more productive than 89% of Grammarly users this week...",body:`Weekly Writing Stats

Words checked: 12,450
Productivity score: 89th percentile
Top suggestion: Clarity improvements
Streak: 14 weeks

Keep up the great work!`,time:"5 days ago",date:e(5),category:"promotions",priority:"low",read:!0,starred:!1,hasAttachment:!1,labels:["grammarly"],unsubscribeLink:"https://grammarly.com/unsubscribe"},{id:"14",from:"Bank of America",fromEmail:"alerts@bankofamerica.com",subject:"Account alert: Direct deposit received",preview:"A direct deposit of $3,245.67 has been posted to your checking account...",body:`Account Alert

Direct deposit received
Amount: $3,245.67
Account: Checking ****1234
Date: February 14, 2026
From: Acme Corp Payroll

Current balance: $8,912.45`,time:"6 days ago",date:e(6),category:"receipts",priority:"medium",read:!0,starred:!1,hasAttachment:!1,labels:["banking","finance"]},{id:"15",from:"Anthropic",fromEmail:"careers@anthropic.com",subject:"Application Update: AI Safety Researcher",preview:"Thank you for your application. We'd like to schedule a phone screen...",body:`Dear Applicant,

Thank you for your application for the AI Safety Researcher position at Anthropic.

We were impressed by your background and would like to schedule a phone screen. Please use the link below to select a time that works for you.

[Schedule Interview]

Best regards,
Anthopic Recruiting Team`,time:"1 week ago",date:e(7),category:"job-search",priority:"high",read:!1,starred:!0,hasAttachment:!1,labels:["career","interview"]}],i={totalEmails:1247,unreadCount:23,categoryCounts:{work:312,personal:89,newsletters:234,receipts:178,"job-search":67,legal:34,social:156,promotions:123,updates:54},topSenders:[{name:"GitHub",count:89},{name:"LinkedIn",count:67},{name:"Amazon",count:45},{name:"Sarah Chen",count:34},{name:"Stripe",count:28}],volumeByDay:[{date:"Mon",count:34},{date:"Tue",count:28},{date:"Wed",count:45},{date:"Thu",count:38},{date:"Fri",count:52},{date:"Sat",count:12},{date:"Sun",count:8}],avgResponseTime:"2.4 hours"},s={work:{label:"Work",color:"text-amber-glow",cssClass:"cat-work"},personal:{label:"Personal",color:"text-burnished-gold",cssClass:"cat-personal"},newsletters:{label:"Newsletters",color:"text-warm-sage",cssClass:"cat-newsletters"},receipts:{label:"Receipts",color:"text-burnished-gold",cssClass:"cat-receipts"},"job-search":{label:"Job Search",color:"text-sky-400",cssClass:"cat-job-search"},legal:{label:"Legal",color:"text-terracotta",cssClass:"cat-legal"},social:{label:"Social",color:"text-pink-400",cssClass:"cat-social"},promotions:{label:"Promotions",color:"text-deep-red",cssClass:"cat-promotions"},updates:{label:"Updates",color:"text-warm-sage",cssClass:"cat-updates"}};export{s as C,n as M,i as a};
