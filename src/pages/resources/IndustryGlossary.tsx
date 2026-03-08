import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { BookA, Search } from "lucide-react";

const glossaryTerms = [
  // A
  { term: "5S", definition: "A workplace organization methodology consisting of five steps: Sort, Set in Order, Shine, Standardize, and Sustain. Originated from Toyota Production System (TPS). The goal is to create a clean, efficient workspace that reduces waste, prevents errors, and improves safety." },
  { term: "Andon", definition: "A visual signaling system used on the production floor to indicate the status of a process or machine. Typically uses colored lights — green (running normally), yellow (attention needed), red (stopped/fault). Operators can trigger an Andon signal to request help without leaving their station." },
  { term: "Anodizing", definition: "An electrochemical process that converts a metal surface (usually aluminum) into a durable, corrosion-resistant oxide finish. Common in aerospace and medical manufacturing. Types include Type I (chromic acid), Type II (sulfuric acid, most common), and Type III (hard coat)." },
  { term: "AS9100", definition: "The quality management system standard specifically for the aerospace, space, and defense industries. Built on ISO 9001 with additional requirements for configuration management, risk management, product safety, and traceability. Required by most aerospace OEMs and their supply chains." },
  { term: "Automatic Tool Changer (ATC)", definition: "A mechanism on CNC machining centers that automatically swaps cutting tools from a tool magazine into the spindle. Enables uninterrupted multi-operation machining. Common configurations include carousel, arm-type, and chain-type magazines holding 20 to 120+ tools." },

  // B
  { term: "Backlash", definition: "The small amount of lost motion or play that occurs when a machine axis reverses direction, caused by clearance between gears, lead screws, or ball screws. Compensation values are typically stored in the CNC control parameters to maintain positional accuracy." },
  { term: "Ball Screw", definition: "A precision linear actuator that converts rotational motion into linear motion using recirculating ball bearings in a helical raceway. Preferred over lead screws in CNC machines for higher efficiency (90%+ vs 40%), lower friction, and virtually zero backlash." },
  { term: "Bill of Materials (BOM)", definition: "A structured list of all raw materials, components, sub-assemblies, and quantities needed to manufacture a finished product. BOMs can be single-level (flat list) or multi-level (indented, showing parent-child relationships). Critical for MRP calculations and purchasing." },
  { term: "Boring", definition: "A machining operation that enlarges an existing hole to achieve precise diameter, roundness, and surface finish. Performed on mills (boring bars), lathes, or dedicated boring machines. Differs from drilling in that boring refines an existing hole rather than creating one." },
  { term: "Broaching", definition: "A machining process using a toothed tool (broach) that is pushed or pulled through a workpiece to cut material in a single pass. Commonly used for keyways, splines, and internal profiles. Each tooth removes a specific chip load, making it highly efficient for production runs." },
  { term: "Burr", definition: "A raised edge or small piece of material remaining on a workpiece after machining, cutting, or drilling. Deburring is the process of removing burrs and is critical for part fit, safety, and meeting drawing specifications. Methods include hand deburring, tumbling, and thermal energy deburring." },

  // C
  { term: "CAD (Computer-Aided Design)", definition: "Software used to create 2D drawings and 3D solid models of parts and assemblies. Common platforms include SolidWorks, Autodesk Inventor, CATIA, and Fusion 360. CAD models are the starting point for CAM programming, inspection, and documentation." },
  { term: "CAM (Computer-Aided Manufacturing)", definition: "Software that generates CNC tool paths from CAD models. The programmer selects operations (roughing, finishing, drilling), tools, speeds, and feeds, and the CAM system outputs G-code. Popular platforms include Mastercam, Fusion 360, GibbsCAM, and Esprit." },
  { term: "Capacity Planning", definition: "The process of determining how much production output a facility can achieve in a given period. Considers available machine hours, labor, shifts, setup times, and planned maintenance. Used to identify bottlenecks, plan overtime, and decide whether to outsource work." },
  { term: "Carbide", definition: "A class of extremely hard cutting tool materials made from tungsten carbide (WC) particles bonded with cobalt. Carbide tools maintain hardness at high temperatures, allowing faster cutting speeds than high-speed steel. Available as solid carbide tools or indexable carbide inserts." },
  { term: "Chamfer", definition: "A beveled edge connecting two surfaces, typically cut at 45 degrees. Used to remove sharp edges, ease assembly of mating parts, and provide a lead-in for threads. Specified on engineering drawings as dimension × angle (e.g., 0.020 × 45°)." },
  { term: "Chip Load", definition: "The thickness of material removed by each cutting edge per revolution (milling) or per tooth. Calculated as feed rate ÷ (RPM × number of flutes). Correct chip load is critical for tool life, surface finish, and preventing tool breakage." },
  { term: "CMM (Coordinate Measuring Machine)", definition: "A precision inspection device that measures the geometry of physical objects by probing points on the surface. Types include bridge, cantilever, gantry, and portable arm CMMs. Accuracy ranges from 1–5 microns. Used for first article inspection, in-process checks, and final acceptance." },
  { term: "CNC (Computer Numerical Control)", definition: "Technology in which a computer controls machine tool movements by reading programmed instructions (G-code). CNC machines include mills, lathes, routers, grinders, EDMs, and laser cutters. Replaced manual machining for most production work due to repeatability and speed." },
  { term: "Collet", definition: "A precision work-holding device that grips cylindrical workpieces or tool shanks using radial clamping force. Available in standard sizes (ER collets) from 1mm to 34mm. Provides better concentricity than a drill chuck — typically 0.0005\" TIR (total indicator reading) or better." },
  { term: "Continuous Improvement", definition: "An ongoing effort to improve products, processes, or services incrementally over time. Rooted in the Japanese concept of Kaizen. Methodologies include PDCA (Plan-Do-Check-Act), Lean, Six Sigma, and Total Quality Management (TQM)." },
  { term: "Coolant", definition: "Fluid applied during machining to reduce heat, lubricate the cutting zone, and flush chips. Types include water-soluble (emulsions, semi-synthetics, synthetics) and neat oils. Proper coolant management affects tool life, surface finish, and operator health." },
  { term: "Corrective Action", definition: "A systematic process to identify and eliminate the root cause of a detected nonconformity to prevent recurrence. Typically follows the 8D or CAPA (Corrective and Preventive Action) methodology. Required by ISO 9001, AS9100, and IATF 16949 quality systems." },
  { term: "Cycle Time", definition: "The total elapsed time to complete one unit of production, measured from start to finish of the operation. Includes cutting time, rapid moves, tool changes, and any programmed dwells. Cycle time is a key input for scheduling, costing, and capacity planning." },

  // D
  { term: "Datum", definition: "A theoretically exact geometric reference (point, line, or plane) from which measurements are made on an engineering drawing. Datums are identified by letters (A, B, C) and establish the coordinate system for GD&T (Geometric Dimensioning and Tolerancing) specifications." },
  { term: "Deburring", definition: "The process of removing burrs, sharp edges, and unwanted material from machined parts. Methods include manual (hand tools, files), mechanical (tumbling, vibratory finishing), thermal energy (TEM), and electrochemical deburring. Critical for safety, assembly, and meeting drawing requirements." },
  { term: "DNC (Direct Numerical Control)", definition: "A system that connects CNC machines to a central computer or server for transferring part programs. Eliminates manual program loading via USB or memory cards. Modern DNC systems support two-way communication, program management, revision control, and remote diagnostics." },
  { term: "Downtime", definition: "Any period when a machine or production process is not producing parts. Planned downtime includes scheduled maintenance, tooling changes, and shift breaks. Unplanned downtime includes breakdowns, material shortages, and quality holds. Tracking downtime by reason code enables root cause analysis." },
  { term: "Drawing (Engineering Drawing)", definition: "A technical document that fully defines a part's geometry, dimensions, tolerances, material, finish, and special requirements. Follows ASME Y14.5 or ISO standards. Includes orthographic views, section views, GD&T callouts, revision history, and a title block with part number and approval signatures." },

  // E
  { term: "ECN (Engineering Change Notice)", definition: "A formal document that authorizes and describes a change to a product's design, materials, or manufacturing process. Tracks what changed, why, who approved it, and the effective date. Critical for configuration management and maintaining traceability in regulated industries." },
  { term: "EDM (Electrical Discharge Machining)", definition: "A non-traditional machining process that removes material using controlled electrical sparks between an electrode and the workpiece, submerged in dielectric fluid. Types include wire EDM (uses a thin brass wire) and sinker/plunge EDM (uses a shaped electrode). Ideal for hard materials and complex geometries." },
  { term: "End Mill", definition: "A cutting tool used in CNC milling with cutting edges on the end face and periphery. Types include flat (square), ball nose, bull nose (corner radius), roughing, and finishing end mills. Available in 2, 3, 4, or more flutes. Material options include HSS, cobalt, solid carbide, and ceramic." },
  { term: "ERP (Enterprise Resource Planning)", definition: "Integrated software that manages core business processes — purchasing, inventory, production scheduling, shipping, accounting, and HR. In manufacturing, ERP systems track work orders, material consumption, labor hours, and costs. Common platforms include SAP, Oracle, Epicor, and JobBOSS." },

  // F
  { term: "Feed Rate", definition: "The speed at which the cutting tool advances through the workpiece. In milling, measured in inches per minute (IPM) or mm/min. In turning, measured in inches per revolution (IPR) or mm/rev. Feed rate directly affects surface finish, chip load, tool life, and cycle time." },
  { term: "Fillet", definition: "A rounded interior corner or edge on a part, specified by radius. Created by the natural radius of the end mill in CNC milling, or intentionally designed for stress relief and to prevent crack initiation. Distinct from a chamfer, which is a flat angled cut." },
  { term: "First Article Inspection (FAI)", definition: "A thorough, documented inspection of the first production part(s) to verify that the manufacturing process produces parts conforming to all drawing and specification requirements. Required by AS9102 in aerospace. Includes dimensional measurements, material certifications, and process verification." },
  { term: "Fixture", definition: "A custom work-holding device designed to locate, support, and clamp a specific workpiece during machining. Unlike a vise (general purpose), fixtures are built for a particular part and operation. They ensure repeatable positioning, reduce setup time, and may include features like locating pins, toggle clamps, and datum surfaces." },
  { term: "Flatness", definition: "A GD&T (Geometric Dimensioning and Tolerancing) control that specifies how much a surface can deviate from a theoretically perfect plane. Measured by the distance between two parallel planes within which the entire surface must lie. Expressed as a tolerance value in thousandths of an inch or micrometers." },

  // G
  { term: "G-Code", definition: "The standardized programming language (ISO 6983) used to control CNC machine tools. G-codes command tool movements (G00 rapid, G01 linear feed, G02/G03 arcs), set modes (G90 absolute, G91 incremental), and activate cycles (G81 drill, G83 peck drill). Supplemented by M-codes for machine functions." },
  { term: "Gage / Gauge", definition: "A device used to measure or verify a specific dimension, form, or feature of a part. Types include pin gages, ring gages, thread gages (go/no-go), bore gages, height gages, and snap gages. Gages must be calibrated on a regular schedule traceable to NIST standards." },
  { term: "GD&T (Geometric Dimensioning and Tolerancing)", definition: "A symbolic language (ASME Y14.5 / ISO 1101) for defining and communicating engineering tolerances on drawings. Specifies form (flatness, straightness, circularity, cylindricity), orientation (perpendicularity, angularity, parallelism), location (position, concentricity), and runout relative to datums." },
  { term: "Grinding", definition: "An abrasive machining process that uses a rotating grinding wheel to remove small amounts of material, achieving tight tolerances and fine surface finishes. Types include surface grinding, cylindrical grinding (OD and ID), centerless grinding, and creep-feed grinding. Typical tolerances: ±0.0001\" to ±0.0005\"." },

  // H
  { term: "Hardness", definition: "A material property indicating resistance to indentation or deformation. Measured by scales including Rockwell (HRC, HRB), Brinell (HBW), Vickers (HV), and Knoop (HK). Heat treatment processes (quenching, tempering, case hardening) alter hardness. Machinability generally decreases as hardness increases." },
  { term: "Heat Treatment", definition: "Controlled heating and cooling of metals to alter mechanical properties such as hardness, strength, ductility, and toughness. Common processes include annealing (softening), quenching and tempering (hardening), normalizing, stress relieving, and case hardening (carburizing, nitriding). Specifications are called out on engineering drawings." },

  // I
  { term: "Indexable Insert", definition: "A replaceable cutting tip clamped into a tool holder, used in turning, milling, and drilling. When one cutting edge wears, the insert is rotated (indexed) to expose a fresh edge. Made from carbide, ceramic, cermet, or CBN. Identified by ISO/ANSI designation codes that specify shape, clearance, tolerance, and size." },
  { term: "ISO 9001", definition: "The international standard for quality management systems (QMS), published by the International Organization for Standardization. Provides a framework of requirements for consistently delivering products and services that meet customer and regulatory requirements. Certified organizations undergo periodic third-party audits." },
  { term: "ITAR (International Traffic in Arms Regulations)", definition: "U.S. federal regulations controlling the export and import of defense-related articles, services, and technical data on the United States Munitions List (USML). Manufacturers handling ITAR-controlled work must be registered with the Directorate of Defense Trade Controls (DDTC) and restrict access to U.S. persons only." },

  // J
  { term: "Jig", definition: "A work-holding device that both locates and guides the cutting tool (unlike a fixture, which only locates and clamps). Drill jigs with hardened bushings guide the drill bit to the correct hole location, ensuring accuracy without requiring CNC positioning. Less common in modern CNC shops but still used in manual operations." },
  { term: "Job Shop", definition: "A manufacturing facility organized around process (lathes in one area, mills in another) that produces small-to-medium batches of custom parts. Characterized by high product variety, low volume per order, and frequent setups. Scheduling and job tracking are inherently complex due to variable routings and priorities." },
  { term: "Just-in-Time (JIT)", definition: "A production strategy that produces and delivers goods only as needed, minimizing inventory and work-in-process. Originated at Toyota. Requires reliable suppliers, short setup times, consistent quality, and flexible workforce. Reduces carrying costs but increases vulnerability to supply chain disruptions." },

  // K
  { term: "Kaizen", definition: "A Japanese philosophy meaning 'change for better' — continuous, incremental improvement involving everyone from operators to management. Kaizen events (also called blitzes) are focused, short-duration improvement projects (typically 3–5 days) targeting a specific process, cell, or value stream." },
  { term: "Kanban", definition: "A visual scheduling system for lean manufacturing that controls the flow of materials and work. Uses physical cards, bins, or electronic signals to trigger production or replenishment only when downstream processes consume materials. Two common types: production kanban and withdrawal (transport) kanban." },
  { term: "Kerf", definition: "The width of material removed by a cutting process — the slot left behind by a saw blade, laser beam, waterjet stream, or wire EDM. Must be accounted for when programming cuts to maintain accurate finished dimensions. Varies by process: wire EDM ~0.010\", laser ~0.005\"–0.015\", bandsaw ~0.035\"." },

  // L
  { term: "Lead Time", definition: "The total elapsed time from when a customer places an order to when the finished product is delivered. Includes order processing, material procurement, queue time, manufacturing, inspection, and shipping. Reducing lead time is a primary goal of lean manufacturing and a key competitive differentiator for job shops." },
  { term: "Lean Manufacturing", definition: "A production methodology focused on eliminating waste (muda) while delivering value to the customer. Identifies eight types of waste: defects, overproduction, waiting, non-utilized talent, transportation, inventory, motion, and extra-processing (DOWNTIME). Core tools include 5S, value stream mapping, kanban, standardized work, and kaizen." },
  { term: "Live Tooling", definition: "Powered rotary tools (drills, end mills, taps) mounted on a CNC lathe turret that can perform milling, drilling, and tapping operations while the part is still in the chuck. Eliminates the need for a secondary milling operation, reducing handling, setup, and lead time." },

  // M
  { term: "Machine Time", definition: "The actual time a CNC machine spends cutting material (spindle running, axes moving under feed). Distinct from cycle time, which also includes rapid moves, tool changes, and dwells. Machine time is the basis for shop rate calculations and capacity planning." },
  { term: "Maintenance (Preventive)", definition: "Scheduled maintenance activities performed on equipment at regular intervals to prevent unexpected breakdowns. Includes tasks like lubrication, filter changes, way cleaning, spindle warm-up, and checking alignment. Tracked by hours run or calendar intervals. Distinct from reactive (breakdown) maintenance." },
  { term: "Material Certification (Mill Cert)", definition: "A document provided by the material supplier certifying the chemical composition, mechanical properties, and heat/lot number of a specific batch of material. Required for traceability in aerospace (per AS9100) and medical manufacturing. Typically references standards like AMS, ASTM, or SAE specifications." },
  { term: "MES (Manufacturing Execution System)", definition: "Software that monitors, tracks, documents, and controls manufacturing operations on the shop floor in real-time. Bridges the gap between ERP (business planning) and the actual machines/operators. Provides functions like dispatching, labor tracking, quality management, and performance analysis." },
  { term: "Micrometer", definition: "A precision measuring instrument capable of measuring external, internal, or depth dimensions to 0.0001\" (0.001mm) resolution. Types include outside micrometer, inside micrometer, depth micrometer, and bore micrometer. Must be calibrated regularly with gage blocks traceable to NIST." },
  { term: "Milling", definition: "A machining process where a rotating multi-edge cutting tool removes material from a stationary workpiece. Types include face milling (flat surfaces), peripheral milling (sides), pocket milling (enclosed cavities), slot milling, and contour milling (3D shapes). Performed on vertical and horizontal machining centers." },

  // N
  { term: "NADCAP", definition: "The National Aerospace and Defense Contractors Accreditation Program — an industry-managed accreditation for special processes (heat treating, welding, NDT, chemical processing, coatings). Aerospace primes like Boeing and Lockheed Martin require NADCAP accreditation for suppliers performing these processes." },
  { term: "NCR (Non-Conformance Report)", definition: "A formal document recording a product, process, or material that does not meet specified requirements. Triggers investigation, disposition (use-as-is, rework, scrap, return to vendor), and corrective action. NCR tracking is required by ISO 9001 and AS9100 quality management systems." },
  { term: "NDT (Non-Destructive Testing)", definition: "Inspection methods that evaluate material properties or detect defects without damaging the part. Common methods include visual inspection (VT), dye penetrant (PT), magnetic particle (MT), ultrasonic (UT), radiographic (RT), and eddy current (ET). Required for critical aerospace and defense components." },

  // O
  { term: "OEE (Overall Equipment Effectiveness)", definition: "A manufacturing metric measuring the percentage of planned production time that is truly productive. Calculated as Availability × Performance × Quality. Example: 90% availability × 95% performance × 99% quality = 84.6% OEE. World-class OEE is generally considered to be 85% or above." },
  { term: "Offsets (Tool Offsets)", definition: "Stored values in the CNC control that compensate for variations in tool length, diameter, and wear. Tool length offsets (H) adjust Z-axis position. Cutter radius offsets (D) adjust the tool path for tool diameter. Work offsets (G54–G59) define the relationship between machine coordinates and part zero." },
  { term: "Outside Processing", definition: "Operations sent to an external vendor because they require specialized equipment or certifications not available in-house. Common examples include heat treating, plating, anodizing, NDT, and grinding. Requires careful scheduling to account for shipping time and vendor lead times." },

  // P
  { term: "Pallet Changer", definition: "An automated system on a machining center that swaps pallets (fixture plates with workpieces) in and out of the work zone. Allows operators to load/unload parts on one pallet while the machine cuts on another, dramatically reducing non-cutting time and increasing spindle utilization." },
  { term: "Part Number", definition: "A unique alphanumeric identifier assigned to a specific part or assembly, forming the primary key in the ERP and quality systems. Part numbering schemes can be significant (encoding information like material or product line) or non-significant (sequential). Revision levels track design changes." },
  { term: "Part Traveler", definition: "A physical or digital document that accompanies a part or lot through every step of the manufacturing process. Records each operation completed, operator name/initials, date, inspection results, and any deviations. Provides real-time production status and full traceability for quality audits." },
  { term: "Passivation", definition: "A chemical treatment (typically nitric acid or citric acid bath per ASTM A967 or AMS 2700) that removes free iron and contaminants from stainless steel surfaces, enhancing corrosion resistance by promoting a uniform chromium oxide layer. Required for medical devices and many aerospace stainless steel parts." },
  { term: "Poka-Yoke", definition: "A Japanese term meaning 'mistake-proofing.' Physical or process design features that prevent errors or make them immediately obvious. Examples include asymmetric fixture pins that prevent loading a part backwards, presence sensors that verify operations are complete, and color-coded tooling." },

  // Q
  { term: "Quality Assurance (QA)", definition: "The systematic activities and processes designed to ensure that quality requirements will be fulfilled. QA is proactive and process-focused — it aims to prevent defects. Includes process audits, procedure development, training, and management review. Distinct from Quality Control (QC), which inspects products." },
  { term: "Quality Control (QC)", definition: "The inspection and testing activities used to verify that products meet specified requirements. QC is reactive and product-focused — it detects defects after they occur. Includes incoming material inspection, in-process checks, final inspection, and statistical sampling plans." },
  { term: "Queue Time", definition: "The time a job spends waiting before being processed at a work center. Often the largest component of total lead time — in many job shops, parts spend 80–90% of their time waiting, not being machined. Reducing queue time through better scheduling and flow is a major lean improvement target." },

  // R
  { term: "Reaming", definition: "A precision hole-finishing operation using a multi-flute reamer to enlarge a drilled hole to an exact diameter with a smooth surface finish. Typical tolerances: ±0.0002\" to ±0.0005\". Reamers remove very little material (0.005\"–0.015\" on diameter) and require a pre-drilled pilot hole." },
  { term: "Roughing", definition: "The initial machining pass(es) that rapidly remove the bulk of material from a workpiece, leaving a small amount of stock for the finishing pass. Roughing uses aggressive feeds and speeds, larger depths of cut, and prioritizes material removal rate (MRR) over surface finish." },
  { term: "Routing", definition: "The defined sequence of operations (and the specific work centers) that a part must pass through during manufacturing. Example: Saw → Lathe → Mill → Deburr → Inspect → Anodize → Final Inspect → Ship. Routings are the foundation of production scheduling and work order tracking." },
  { term: "RPM (Revolutions Per Minute)", definition: "The rotational speed of the spindle or workpiece. In milling, calculated as: RPM = (SFM × 3.82) ÷ tool diameter (inches). In turning, calculated from surface footage and workpiece diameter. Maximum RPM is limited by the machine, tooling, and workpiece material." },
  { term: "Runout", definition: "The total variation in the position of a surface as the part (or tool) is rotated 360°, measured with a dial indicator. Total Indicator Reading (TIR) is the difference between the highest and lowest readings. Excessive runout in a tool holder reduces tool life and degrades surface finish." },

  // S
  { term: "SFM (Surface Feet per Minute)", definition: "The speed at which the cutting edge moves across the workpiece surface, expressed in linear feet per minute. Recommended SFM values are published by tool manufacturers for specific material/tool combinations. Higher SFM means faster cutting but generates more heat. Also called cutting speed or surface speed." },
  { term: "Setup Time", definition: "The total time required to prepare a machine for a new job: loading the program, installing fixtures, setting tool offsets, loading tools, running a first piece, and verifying dimensions. Reducing setup time (SMED — Single Minute Exchange of Dies) is a core lean manufacturing objective." },
  { term: "Shift Handoff", definition: "The structured transfer of critical information between outgoing and incoming operators at shift change. Effective handoffs communicate current job status, parts completed, quality issues, machine conditions, tool wear status, and any deviations from the plan. Poor handoffs are a leading cause of production errors and scrap." },
  { term: "Six Sigma", definition: "A data-driven quality methodology that aims to reduce process variation and defects to fewer than 3.4 per million opportunities. Uses the DMAIC framework (Define, Measure, Analyze, Improve, Control) for existing processes and DMADV for new process design. Practitioners are certified at Green Belt, Black Belt, and Master Black Belt levels." },
  { term: "SPC (Statistical Process Control)", definition: "The use of statistical methods (control charts, capability studies) to monitor and control a manufacturing process. By plotting measurements over time, SPC identifies trends and out-of-control conditions before they produce defective parts. Common chart types include X-bar/R, X-bar/S, p-chart, and individual/moving range." },
  { term: "Spindle", definition: "The rotating component of a machine tool that holds and drives the cutting tool (milling) or workpiece (turning). Key specifications include maximum RPM, horsepower, torque curve, taper type (CAT40, BT40, HSK), and bearing type. Spindle condition directly affects machining accuracy and surface finish." },
  { term: "Surface Finish", definition: "The texture and smoothness of a machined surface, measured in microinches (Ra — arithmetic average roughness) or micrometers. Common specifications: 125 Ra (general machining), 63 Ra (good finish), 32 Ra (fine finish), 16 Ra (grinding/lapping). Measured with a profilometer. Specified on drawings with surface finish symbols." },

  // T
  { term: "Takt Time", definition: "The rate at which products must be completed to meet customer demand. Calculated as: available production time ÷ customer demand. Example: 480 minutes per shift ÷ 60 units required = 8 minutes takt time. Used to balance workloads and design production cells in lean manufacturing." },
  { term: "Tapping", definition: "The process of cutting internal threads in a hole using a tap. Methods include hand tapping, machine tapping (floating tap holder), and rigid tapping (synchronized spindle and feed on CNC). Thread types include UNC (coarse), UNF (fine), metric, and pipe threads (NPT, BSPT)." },
  { term: "Tolerance", definition: "The permissible range of variation in a dimension. Specified as bilateral (±0.005\") or unilateral (+0.000/−0.010\"). Tighter tolerances require slower machining, more precise equipment, and additional inspection — all increasing cost. Standard machining tolerance is typically ±0.005\"; precision work may require ±0.0002\" or tighter." },
  { term: "Tool Life", definition: "The expected useful life of a cutting tool before it must be replaced or re-sharpened, measured in minutes of cutting time, number of parts, or linear feet of material cut. Influenced by cutting speed, feed rate, depth of cut, material hardness, coolant, and tool coating." },
  { term: "Turning", definition: "A machining process where the workpiece rotates while a stationary single-point cutting tool removes material. Performed on CNC lathes and turning centers. Operations include OD turning, facing, boring, grooving, threading, and parting (cut-off). Turning centers with live tooling can also mill, drill, and tap." },

  // V
  { term: "Value Stream Mapping (VSM)", definition: "A lean manufacturing tool that visually maps the flow of materials and information through a production process, from raw material to customer delivery. Identifies value-added vs. non-value-added steps, wait times, inventory levels, and information flows. Used to design a future-state process with reduced waste." },
  { term: "Vise", definition: "A general-purpose work-holding device with two jaws that clamp a workpiece. CNC milling vises (like Kurt D675) are precision-ground for accuracy and repeatability. Multi-station vises hold multiple parts simultaneously to increase throughput. Soft jaws can be machined to match part geometry." },

  // W
  { term: "WIP (Work in Process)", definition: "Partially completed goods that are somewhere in the manufacturing process — not yet finished but past raw material stage. High WIP indicates long lead times, bottlenecks, or overproduction. Lean manufacturing aims to minimize WIP through flow, pull systems, and constraint management." },
  { term: "Wire EDM", definition: "An electrical discharge machining process that uses a thin electrically charged wire (typically brass, 0.004\"–0.012\" diameter) to cut through conductive materials. Capable of extremely tight tolerances (±0.0001\") and fine surface finishes. Ideal for cutting hardened materials, complex profiles, and precision tooling components." },
  { term: "Work Center", definition: "A logical grouping of machines or workstations that perform similar types of operations. Used for production scheduling, capacity planning, and cost accounting. Examples: '5-Axis Mill Center,' 'CNC Lathe Department,' 'Grinding Cell.' Each work center has defined capacity, labor rates, and overhead rates." },
  { term: "Work Holding", definition: "The general term for any device or method used to securely hold a workpiece during machining. Categories include vises, chucks, collets, fixtures, jigs, vacuum tables, magnetic chucks, and clamp sets. Proper work holding is essential for accuracy, repeatability, and operator safety." },
  { term: "Work Order", definition: "A formal authorization to manufacture a specific quantity of a specific part number. Contains the part number, quantity, routing (operation sequence), material requirements, due date, customer information, and any special instructions. The central tracking document for production scheduling and shop floor execution." },
];

export default function IndustryGlossary() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return glossaryTerms;
    const q = search.toLowerCase();
    return glossaryTerms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [search]);

  const letters = useMemo(() => {
    const set = new Set(filtered.map((t) => t.term[0].toUpperCase()));
    return [...set].sort();
  }, [filtered]);

  return (
    <>
      <SEOHead
        title="Manufacturing & CNC Glossary — 90+ Terms Explained | JobLine.ai Resources"
        description="Comprehensive glossary of manufacturing terms, CNC machining definitions, quality management concepts, lean manufacturing, GD&T, and production planning terminology for machinists and engineers."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <BookA className="w-3 h-3 mr-1" />
              Glossary
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing & CNC Glossary
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {glossaryTerms.length} terms and definitions covering CNC machining, quality management,
              lean manufacturing, GD&T, tooling, materials, and production planning — written for machinists, engineers, and shop floor leaders.
            </p>
          </div>

          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms (e.g. tolerance, kanban, SPC)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Letter quick-nav */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="mb-6 scroll-mt-20">
              <h2 className="text-2xl font-bold text-primary mb-3 border-b border-border pb-1">{letter}</h2>
              <dl className="space-y-4">
                {filtered
                  .filter((t) => t.term[0].toUpperCase() === letter)
                  .map((t) => (
                    <div key={t.term} className="pl-4">
                      <dt className="font-semibold text-foreground">{t.term}</dt>
                      <dd className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t.definition}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No terms found matching "{search}"
            </p>
          )}

          <AdPlacement format="rectangle" className="mt-8" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
