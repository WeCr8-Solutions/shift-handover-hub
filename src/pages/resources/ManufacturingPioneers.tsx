import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Star,
  Factory,
  Lightbulb,
  Target,
  BarChart3,
  Wrench,
  Users,
  Cpu,
  Gauge,
  Award,
  TrendingUp,
  BookOpen,
  Cog,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

const STORAGE_KEY = "manufacturing-pioneers-progress";

const categories = ["All", "Scientific Management", "Mass Production", "Quality", "Lean/TPS", "Systems Thinking", "Industrial Engineering", "Innovation", "Modern", "Industrialists", "Oil & Energy", "Space & Aerospace", "Science & Engineering"] as const;

const sections = [
  {
    id: "frederick-taylor",
    title: "Frederick Winslow Taylor (1856–1915)",
    icon: BarChart3,
    category: "Scientific Management",
    wikipedia: "https://en.wikipedia.org/wiki/Frederick_Winslow_Taylor",
    body: "Known as the 'Father of Scientific Management,' Taylor pioneered time studies, standardized tools and methods, and the systematic analysis of work. His 1911 book 'The Principles of Scientific Management' argued that work should be studied scientifically to find the 'one best way.' Key contributions: time-and-motion studies, functional foremanship, differential piece-rate system, and the separation of planning from execution. He also co-developed high-speed steel with Maunsel White, revolutionizing metal cutting speeds. While controversial for dehumanizing work, Taylor's methods laid the foundation for industrial engineering and modern process optimization.",
    legacy: "Time studies, standardized work, industrial engineering as a discipline",
  },
  {
    id: "henry-ford",
    title: "Henry Ford (1863–1947)",
    icon: Factory,
    category: "Mass Production",
    wikipedia: "https://en.wikipedia.org/wiki/Henry_Ford",
    body: "Ford didn't invent the automobile or the assembly line, but he perfected both. His Highland Park plant (1913) introduced the moving assembly line, reducing Model T chassis assembly from 12+ hours to 93 minutes. Ford's innovations: interchangeable parts (building on Eli Whitney's concept), continuous flow production, the $5 workday (doubling wages to reduce turnover), vertical integration (controlling everything from rubber plantations to steel mills), and the concept that workers should be able to afford what they produce. The Rouge River Complex became the world's largest integrated factory. Ford's mass production system dominated manufacturing until Toyota's lean methods emerged in the 1970s.",
    legacy: "Moving assembly line, mass production, vertical integration",
  },
  {
    id: "taiichi-ohno",
    title: "Taiichi Ohno (1912–1990)",
    icon: Target,
    category: "Lean/TPS",
    wikipedia: "https://en.wikipedia.org/wiki/Taiichi_Ohno",
    body: "Ohno is the architect of the Toyota Production System (TPS), the foundation of lean manufacturing. Starting as a machine shop manager at Toyota, he developed revolutionary concepts: Just-in-Time (JIT) production, kanban pull systems (inspired by American supermarkets), the seven wastes (muda), autonomation (jidoka — machines that detect defects and stop automatically), and multi-process handling (one operator running multiple machines). His 1988 book 'Toyota Production System: Beyond Large-Scale Production' became the lean manufacturing bible. Ohno's philosophy: 'Costs do not exist to be calculated. Costs exist to be reduced.' He personally trained generations of Toyota engineers through genchi genbutsu (go and see) at the gemba.",
    legacy: "Toyota Production System, Just-in-Time, kanban, seven wastes, jidoka",
  },
  {
    id: "w-edwards-deming",
    title: "W. Edwards Deming (1900–1993)",
    icon: TrendingUp,
    category: "Quality",
    wikipedia: "https://en.wikipedia.org/wiki/W._Edwards_Deming",
    body: "Deming transformed Japanese manufacturing after WWII and later sparked the American quality revolution. His teachings: the System of Profound Knowledge (appreciation for a system, knowledge of variation, theory of knowledge, psychology), the 14 Points for Management, the PDCA cycle (Plan-Do-Check-Act, adapted from Shewhart), and the distinction between common cause and special cause variation. Deming argued that 94% of problems are caused by the system, not the workers. Japan's highest quality award — the Deming Prize — bears his name. His 1986 book 'Out of the Crisis' challenged Western management to adopt systems thinking and continuous improvement. Famous quote: 'In God we trust; all others must bring data.'",
    legacy: "PDCA cycle, 14 Points, systems thinking, statistical quality control",
  },
  {
    id: "joseph-juran",
    title: "Joseph Juran (1904–2008)",
    icon: Award,
    category: "Quality",
    wikipedia: "https://en.wikipedia.org/wiki/Joseph_M._Juran",
    body: "Juran, along with Deming, taught quality methods to Japanese industry in the 1950s. His contributions: the Juran Trilogy (Quality Planning, Quality Control, Quality Improvement), the Pareto Principle applied to quality ('the vital few and the useful many' — 80% of defects come from 20% of causes), the concept of Cost of Poor Quality (COPQ), and 'fitness for use' as the definition of quality. His 'Quality Control Handbook' (first published 1951) remains the definitive reference. Juran emphasized that quality is a management responsibility, not just a technical function. He founded the Juran Institute and consulted worldwide until his 90s, advocating for quality as a strategic business advantage.",
    legacy: "Juran Trilogy, Pareto principle in quality, Cost of Poor Quality, fitness for use",
  },
  {
    id: "shigeo-shingo",
    title: "Shigeo Shingo (1909–1990)",
    icon: Wrench,
    category: "Lean/TPS",
    wikipedia: "https://en.wikipedia.org/wiki/Shigeo_Shingo",
    body: "Shingo was an industrial engineer who made foundational contributions to the Toyota Production System alongside Taiichi Ohno. His breakthrough innovations: SMED (Single-Minute Exchange of Die) — reducing setup times from hours to minutes, enabling small-batch production; poka-yoke (mistake-proofing) — designing processes so errors cannot occur or are immediately detected; and source inspection — checking conditions at the source rather than inspecting finished products. Shingo distinguished between 'errors' (inevitable human mistakes) and 'defects' (errors reaching the customer), arguing that poka-yoke bridges the gap. The Shingo Prize for Operational Excellence, awarded by Utah State University, is often called the 'Nobel Prize of Manufacturing.'",
    legacy: "SMED, poka-yoke (mistake-proofing), source inspection, zero quality control",
  },
  {
    id: "walter-shewhart",
    title: "Walter A. Shewhart (1891–1967)",
    icon: Gauge,
    category: "Quality",
    wikipedia: "https://en.wikipedia.org/wiki/Walter_A._Shewhart",
    body: "Shewhart is the 'Father of Statistical Quality Control.' Working at Bell Labs in the 1920s, he invented the control chart — the foundational tool of SPC (Statistical Process Control). His insight: variation in manufacturing is either 'controlled' (common cause — inherent to the process) or 'uncontrolled' (special cause — assignable to specific factors). The Shewhart cycle (Plan-Do-Study-Act) was later popularized by his student Deming as PDCA. His 1931 book 'Economic Control of Quality of Manufactured Product' established quality control as a scientific discipline. Shewhart also pioneered acceptance sampling plans. His work proved that quality could be managed statistically rather than through 100% inspection.",
    legacy: "Control charts, SPC, common/special cause variation, PDSA cycle",
  },
  {
    id: "eli-whitney",
    title: "Eli Whitney (1765–1825)",
    icon: Cog,
    category: "Mass Production",
    wikipedia: "https://en.wikipedia.org/wiki/Eli_Whitney",
    body: "Whitney is best known for the cotton gin (1794), but his greater contribution to manufacturing was the concept of interchangeable parts. In 1798, he contracted with the U.S. government to produce 10,000 muskets using standardized, interchangeable components — a radical departure from individual craftsmanship where each part was hand-fitted. Though historians debate how fully he achieved true interchangeability, Whitney demonstrated the concept by assembling muskets from randomly selected parts before Congress. This principle — that any part should fit any assembly without hand-fitting — became the foundation of mass production. Combined with specialized machine tools and division of labor, interchangeable parts enabled the 'American System of Manufacturing.'",
    legacy: "Interchangeable parts, American System of Manufacturing, cotton gin",
  },
  {
    id: "sakichi-toyoda",
    title: "Sakichi Toyoda (1867–1930)",
    icon: Lightbulb,
    category: "Lean/TPS",
    wikipedia: "https://en.wikipedia.org/wiki/Sakichi_Toyoda",
    body: "Known as the 'King of Japanese Inventors,' Sakichi Toyoda founded what would become the Toyota Group. His most important contribution to manufacturing: the concept of jidoka (autonomation) — 'automation with a human touch.' His Type G automatic loom (1924) could detect a broken thread and stop automatically, preventing defective fabric. This principle — machines that detect abnormalities and stop — became a pillar of the Toyota Production System. Sakichi also developed the '5 Whys' problem-solving technique: asking 'why?' five times to reach the root cause. His son Kiichiro Toyoda founded Toyota Motor Corporation and introduced Just-in-Time concepts. The Toyoda family's philosophy: 'Before building cars, we build people.'",
    legacy: "Jidoka (autonomation), 5 Whys, automatic loom, Toyota founding philosophy",
  },
  {
    id: "kaoru-ishikawa",
    title: "Kaoru Ishikawa (1915–1989)",
    icon: Users,
    category: "Quality",
    wikipedia: "https://en.wikipedia.org/wiki/Kaoru_Ishikawa",
    body: "Ishikawa democratized quality by bringing it from the engineering department to every worker on the shop floor. His contributions: the cause-and-effect diagram (fishbone/Ishikawa diagram) for root cause analysis, Quality Circles (small groups of workers who voluntarily meet to solve quality problems), and the concept of 'company-wide quality control' (CWQC). He promoted the use of the '7 Basic Quality Tools': check sheets, histograms, Pareto charts, cause-and-effect diagrams, scatter diagrams, control charts, and flow charts. Ishikawa believed that 95% of quality problems could be solved with these seven tools. His philosophy: quality is not just conformance to specifications — it's about understanding and satisfying customer needs at every level of the organization.",
    legacy: "Fishbone diagram, Quality Circles, 7 Basic Quality Tools, CWQC",
  },
  {
    id: "eliyahu-goldratt",
    title: "Eliyahu M. Goldratt (1947–2011)",
    icon: Cpu,
    category: "Systems Thinking",
    wikipedia: "https://en.wikipedia.org/wiki/Eliyahu_M._Goldratt",
    body: "Goldratt developed the Theory of Constraints (TOC), presented through his 1984 business novel 'The Goal' — one of the most influential manufacturing books ever written. TOC's five focusing steps: (1) Identify the constraint (bottleneck). (2) Exploit it (maximize its output). (3) Subordinate everything else to it (don't overproduce elsewhere). (4) Elevate the constraint (add capacity). (5) Repeat (find the new constraint). Goldratt also developed Drum-Buffer-Rope scheduling, Throughput Accounting (challenging traditional cost accounting), and the Thinking Processes (systematic problem-solving tools). His key insight: optimizing individual processes does NOT optimize the whole system. A chain is only as strong as its weakest link. 'The Goal' has sold over 6 million copies and is required reading in many MBA programs.",
    legacy: "Theory of Constraints, Drum-Buffer-Rope, 'The Goal', Throughput Accounting",
  },
  {
    id: "james-womack",
    title: "James P. Womack (1948–present)",
    icon: BookOpen,
    category: "Lean/TPS",
    wikipedia: "https://en.wikipedia.org/wiki/James_P._Womack",
    body: "Womack, along with Daniel T. Jones and Daniel Roos, authored 'The Machine That Changed the World' (1990) — the book that introduced 'lean production' to the Western world. Based on MIT's five-year International Motor Vehicle Program (IMVP) study, the book documented how Toyota's production system outperformed Western mass production in quality, productivity, and flexibility. Womack and Jones followed with 'Lean Thinking' (1996), which codified the five lean principles: Value, Value Stream, Flow, Pull, and Perfection. Womack founded the Lean Enterprise Institute (LEI) to promote lean practices globally. His work translated Toyota's internal practices into a universal framework applicable to any industry — from healthcare to software development.",
    legacy: "Coined 'lean production,' 5 lean principles, Lean Enterprise Institute",
  },
  {
    id: "genichi-taguchi",
    title: "Genichi Taguchi (1924–2012)",
    icon: Star,
    category: "Quality",
    wikipedia: "https://en.wikipedia.org/wiki/Genichi_Taguchi",
    body: "Taguchi revolutionized quality engineering by shifting focus from inspection to robust design. His key concepts: the Taguchi Loss Function — quality loss increases as a quadratic function of deviation from the target value (even within specification limits); Robust Design — making products insensitive to variation in materials, manufacturing, and environment through parameter design and tolerance design; and Design of Experiments (DOE) using orthogonal arrays — enabling efficient testing of multiple factors simultaneously. Taguchi argued that the cost of poor quality extends beyond scrap and rework to include customer dissatisfaction, warranty claims, and market share loss. His methods are widely used in automotive, electronics, and aerospace for process optimization. Four-time Deming Prize recipient.",
    legacy: "Taguchi Loss Function, Robust Design, orthogonal arrays, signal-to-noise ratio",
  },
  {
    id: "andrew-carnegie",
    title: "Andrew Carnegie (1835–1919)",
    icon: Factory,
    category: "Industrialists",
    wikipedia: "https://en.wikipedia.org/wiki/Andrew_Carnegie",
    body: "Carnegie built the American steel industry into the world's most powerful, making the United States the leading steel producer by 1900. A Scottish immigrant who started as a bobbin boy in a cotton mill, Carnegie rose through railroads and bridge-building before founding Carnegie Steel Company. His innovations: vertical integration (owning iron ore mines, coke ovens, railroads, and steel mills), the adoption of the Bessemer process and later the open-hearth process for mass steel production, and relentless cost reduction through efficiency and scale. Carnegie Steel produced more steel than all of Great Britain. He sold to J.P. Morgan in 1901 for $480 million (creating U.S. Steel), then devoted his fortune to philanthropy — funding 2,509 libraries, Carnegie Mellon University, and Carnegie Hall. His 1889 essay 'The Gospel of Wealth' argued the rich have a moral obligation to distribute their fortunes for public benefit.",
    legacy: "American steel industry, vertical integration, Bessemer process adoption, industrial philanthropy",
  },
  {
    id: "john-d-rockefeller",
    title: "John D. Rockefeller (1839–1937)",
    icon: TrendingUp,
    category: "Oil & Energy",
    wikipedia: "https://en.wikipedia.org/wiki/John_D._Rockefeller",
    body: "Rockefeller founded Standard Oil in 1870 and built it into the world's first great industrial monopoly, controlling approximately 90% of American oil refining by 1880. His manufacturing innovations: standardization of refining processes for consistent kerosene quality, horizontal integration (acquiring competitors), economies of scale in barrel-making and transportation, pipeline networks replacing expensive railroad shipping, and waste elimination — Standard Oil found uses for petroleum byproducts that competitors discarded (paraffin wax, lubricants, petroleum jelly/Vaseline). His efficiency obsession drove the price of kerosene from 58¢ to 8¢ per gallon, making illumination affordable for average Americans. The 1911 Supreme Court breakup of Standard Oil created 34 companies including ExxonMobil, Chevron, and ConocoPhillips. Rockefeller became the world's richest person and pioneered modern corporate philanthropy.",
    legacy: "Oil refining standardization, horizontal integration, economies of scale, petroleum industry",
  },
  {
    id: "wernher-von-braun",
    title: "Wernher von Braun (1912–1977)",
    icon: Star,
    category: "Space & Aerospace",
    wikipedia: "https://en.wikipedia.org/wiki/Wernher_von_Braun",
    body: "Von Braun was the chief architect of the Saturn V rocket that carried humans to the Moon. His manufacturing contributions were immense: the Saturn V was the most complex manufacturing project in history — 3 million parts from 20,000 contractors, requiring unprecedented quality standards, systems integration, and configuration management. Von Braun pioneered systems engineering approaches to rocket manufacturing, including stage testing (test each component and stage independently before integration), redundancy design, and failure mode analysis. At NASA's Marshall Space Flight Center, he insisted on 'dirty hands' engineering — managers had to understand manufacturing processes firsthand. The Saturn V achieved a perfect flight record (13/13 launches successful), a testament to manufacturing discipline. His legacy extends to modern aerospace manufacturing standards, traceability requirements, and quality management systems.",
    legacy: "Saturn V manufacturing, systems engineering, aerospace quality standards, rocket propulsion",
  },
  {
    id: "nikola-tesla",
    title: "Nikola Tesla (1856–1943)",
    icon: Lightbulb,
    category: "Science & Engineering",
    wikipedia: "https://en.wikipedia.org/wiki/Nikola_Tesla",
    body: "Tesla's inventions electrified manufacturing — literally. His alternating current (AC) motor and polyphase AC power system made it possible to transmit electricity over long distances, freeing factories from steam engines and water wheels. Before Tesla's AC system, factories needed to be near power sources; after, they could locate anywhere on the electrical grid. His AC induction motor — simple, rugged, and requiring no commutator — became the workhorse of industrial manufacturing and remains so today. Tesla held over 300 patents covering AC power generation and transmission, rotating magnetic fields, radio, wireless energy transfer, and fluorescent lighting. His work at Westinghouse directly competed with Edison's DC system in the 'War of Currents,' and AC won — powering the Niagara Falls hydroelectric plant (1896) and eventually every factory in the world.",
    legacy: "AC power system, induction motor, electrification of manufacturing, polyphase current",
  },
  {
    id: "thomas-edison",
    title: "Thomas Edison (1847–1931)",
    icon: Lightbulb,
    category: "Science & Engineering",
    wikipedia: "https://en.wikipedia.org/wiki/Thomas_Edison",
    body: "Edison invented the modern research laboratory and pioneered industrial R&D at Menlo Park and later West Orange, New Jersey. Beyond the light bulb (which required manufacturing a reliable filament at scale), Edison created the first electrical power distribution system, the phonograph, and motion pictures. His greatest manufacturing contribution: the concept of the 'invention factory' — systematic, team-based innovation with the goal of producing 'a minor invention every ten days and a big thing every six months.' Edison held 1,093 patents. He also built manufacturing operations to produce his inventions at scale — Edison General Electric (later GE) manufactured generators, wiring, switches, and bulbs. His Pearl Street Station (1882) was the first commercial electrical power plant, creating the infrastructure that enabled electrified manufacturing.",
    legacy: "Industrial R&D laboratory, electrical power infrastructure, systematic innovation, GE founding",
  },
  {
    id: "robert-goddard",
    title: "Robert H. Goddard (1882–1945)",
    icon: Star,
    category: "Space & Aerospace",
    wikipedia: "https://en.wikipedia.org/wiki/Robert_H._Goddard",
    body: "Goddard is the 'Father of Modern Rocketry.' On March 16, 1926, he launched the world's first liquid-fueled rocket in Auburn, Massachusetts. Working largely alone with limited funding, Goddard solved fundamental manufacturing challenges: building lightweight combustion chambers that could withstand extreme temperatures, developing fuel pumps and injectors for liquid oxygen and gasoline, creating gyroscopic stabilization systems, and designing multi-stage rocket concepts. He built and tested 35 rockets, achieving altitudes up to 2.6 km. His 214 patents covered rocket apparatus, propellant feeding, and stabilization — technologies later used by both American and German rocket programs. NASA's Goddard Space Flight Center is named in his honor. His work proved that rockets could function in a vacuum, contradicting the New York Times' infamous 1920 editorial mocking the idea.",
    legacy: "Liquid-fueled rocket, rocket propulsion manufacturing, gyroscopic stabilization, 214 patents",
  },
  {
    id: "katherine-johnson",
    title: "Katherine Johnson (1918–2020)",
    icon: Award,
    category: "Space & Aerospace",
    wikipedia: "https://en.wikipedia.org/wiki/Katherine_Johnson",
    body: "Katherine Johnson was a NASA mathematician whose orbital trajectory calculations were critical to the success of the first U.S. crewed spaceflights. Her work directly influenced manufacturing specifications for spacecraft — trajectory calculations determined heat shield requirements, structural loads, reentry angles, and landing precision, all of which drove manufacturing tolerances and material selection for Mercury, Gemini, and Apollo spacecraft. When NASA began using electronic computers, John Glenn personally requested that Johnson verify the computer's calculations before his orbital flight (Friendship 7, 1962). She co-authored 26 scientific papers and contributed to the Space Shuttle and Earth Resources Satellite programs. Her story, told in the book and film 'Hidden Figures,' highlighted the contributions of African-American women to aerospace engineering and manufacturing.",
    legacy: "Orbital mechanics calculations, spacecraft manufacturing specifications, pioneering STEM diversity",
  },
  {
    id: "elon-musk",
    title: "Elon Musk (1971–present)",
    icon: Cpu,
    category: "Modern",
    wikipedia: "https://en.wikipedia.org/wiki/Elon_Musk",
    body: "Musk has disrupted manufacturing across multiple industries. At SpaceX: vertical integration of rocket manufacturing (building ~80% of components in-house vs. traditional aerospace outsourcing), reusable rocket boosters (Falcon 9 has landed 200+ times), 3D-printed rocket engine components (SuperDraco engines), and the Starship — the largest rocket ever built using stainless steel instead of traditional carbon fiber composites. At Tesla: the Gigafactory concept (massive scale battery and vehicle manufacturing), mega casting (replacing 70+ parts with a single aluminum casting using 6,000-ton presses), structural battery packs, and highly automated production lines. His manufacturing philosophy challenges aerospace and automotive conventions: iterate rapidly, accept failure as data, vertically integrate to control quality and cost, and question every specification.",
    legacy: "Reusable rockets, mega casting, Gigafactory, vertical integration in aerospace and automotive",
  },
  {
    id: "grace-hopper",
    title: "Grace Hopper (1906–1992)",
    icon: Cpu,
    category: "Science & Engineering",
    wikipedia: "https://en.wikipedia.org/wiki/Grace_Hopper",
    body: "Rear Admiral Grace Hopper was a computer science pioneer whose work enabled the digital transformation of manufacturing. She developed the first compiler (A-0, 1952), translating human-readable code into machine language — a breakthrough that made computer programming accessible to non-specialists. She championed COBOL, one of the first high-level programming languages, which became the backbone of business and manufacturing computing for decades. Hopper's contributions enabled CNC programming, ERP systems, MES platforms, and every digital manufacturing tool used today. Her famous debugging story — finding an actual moth in the Harvard Mark II computer — popularized the term 'debugging.' She served in the U.S. Navy until age 79, advocating for standardization in computing. Her philosophy: 'The most dangerous phrase in the language is, We've always done it this way.'",
    legacy: "First compiler, COBOL language, digital manufacturing foundation, computer standardization",
  },
  {
    id: "j-p-morgan",
    title: "J.P. Morgan (1837–1913)",
    icon: TrendingUp,
    category: "Industrialists",
    wikipedia: "https://en.wikipedia.org/wiki/J._P._Morgan",
    body: "John Pierpont Morgan was the most powerful financier of the industrial age, whose consolidation of industries created the manufacturing giants that built modern America. His most significant industrial act: merging Carnegie Steel with Federal Steel and National Tube to form United States Steel Corporation in 1901 — the world's first billion-dollar company and the largest manufacturer on Earth. Morgan also consolidated Edison General Electric and Thomson-Houston into General Electric (1892), financed railroads that enabled continental-scale manufacturing distribution, and reorganized struggling companies through 'Morganization' — bringing professional management, cost controls, and strategic planning to chaotic industries. His banking house financed AT&T, International Harvester, and Western Electric. Morgan proved that financial engineering could be as transformative as mechanical engineering in building manufacturing capacity.",
    legacy: "U.S. Steel creation, GE formation, industrial consolidation, manufacturing finance",
  },
  {
    id: "henry-kaiser",
    title: "Henry J. Kaiser (1882–1967)",
    icon: Factory,
    category: "Mass Production",
    wikipedia: "https://en.wikipedia.org/wiki/Henry_J._Kaiser",
    body: "Kaiser revolutionized shipbuilding during WWII, applying mass production techniques from the automotive industry to build Liberty ships faster than German U-boats could sink them. His Richmond, California shipyards reduced Liberty ship construction from 230 days to an average of 45 days, with the SS Robert E. Peary built in just 4 days, 15 hours as a demonstration. Kaiser's innovations: prefabrication of ship sections in inland factories, welding instead of riveting (faster but requiring new quality controls), assembly-line techniques applied to shipbuilding, three-shift continuous operations, and training unskilled workers (including women — 'Rosie the Riveter') through standardized work instructions. His yards produced 1,490 ships during the war. Post-war, Kaiser founded Kaiser Permanente (originally healthcare for his shipyard workers), Kaiser Aluminum, and Jeep.",
    legacy: "Mass production shipbuilding, prefabrication, wartime manufacturing, Kaiser Permanente",
  },
];


function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
function saveProgress(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function ManufacturingPioneers() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [completed, setCompleted] = useState<Set<string>>(() => loadProgress());

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setCompleted(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sections.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.legacy.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const progressPercent = Math.round((completed.size / sections.length) * 100);
  const usedCategories = useMemo(() => {
    const cats = new Set(sections.map((s) => s.category));
    return ["All", ...Array.from(cats)] as string[];
  }, []);

  return (
    <>
      <SEOHead
        title="Manufacturing Pioneers — Key Figures Who Shaped Industry | JobLine.ai"
        description="Explore the pioneers of modern manufacturing: Henry Ford, Taiichi Ohno, W. Edwards Deming, Shigeo Shingo, Eli Whitney, and more. Learn their contributions to lean, quality, and mass production."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">History & Influence</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Manufacturing Pioneers</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The visionaries who shaped modern manufacturing — from scientific management and mass production to lean thinking and total quality. Explore their contributions and legacy.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{completed.size} of {sections.length} pioneers explored</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
                  {completed.size > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={resetProgress}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search pioneers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {usedCategories.map((cat) => (
              <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setActiveCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          <AdPlacement format="horizontal" className="mb-6" />

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No pioneers match your search.</p>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {filtered.map((section) => {
                const Icon = section.icon;
                const isDone = completed.has(section.id);
                return (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4 gap-3">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{section.title}</span>
                            <Badge variant="outline" className="text-[10px]">{section.category}</Badge>
                            {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed text-sm mb-3">{section.body}</p>
                      <div className="bg-muted/50 rounded-md p-3 mb-3">
                        <p className="text-xs font-medium text-foreground mb-1">Key Legacy</p>
                        <p className="text-xs text-muted-foreground">{section.legacy}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Checkbox id={`check-${section.id}`} checked={isDone} onCheckedChange={() => toggleComplete(section.id)} />
                          <label htmlFor={`check-${section.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">Mark as explored</label>
                        </div>
                        <a href={section.wikipedia} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          Wikipedia <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          <AdPlacement format="rectangle" className="mt-12" />
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}
