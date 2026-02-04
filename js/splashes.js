const phrases = [
    "A proud subsidiary of Aperture Science.",
    "It works on my machine.",
    "The cake is a lie. So is our uptime.",
    "Please stand by for a system failure.",
    "Did you try turning it off and on again?",
    "In code we trust. All others pay cash.",
    "I see dead pixels.",
    "Documentation? Where we're going, we don't need documentation.",
    "We take security very seriously. Trust us.",
    "Now with 40% more bugs!",
    "Works 30% of the time, every time.",
    "SLA: Service Level Aspirational",
    "Black box testing: because we like surprises.",
    "Black Mesa can suck it.",
    "Our servers are powered by hamsters on wheels.",
    "99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.",
    "Pioneering the future of yesterday's technology.",
    "We taught JavaScript to segfault. It cried, we shipped.",
    "Quarterly goals: aggressive, charming, vaguely legal.",
    "Our uptime is directly proportional to your downtime.",
    "Security through obscurity. Mostly obscurity.",
    "We put the 'fun' in 'fundamental system failures'.",
    "The results of the security audit are in: 70% compliant, 100% mysterious.",
    "Our cloud is just someone else's computer.",
    "We don't do bugs, we do undocumented features.",
    "The model hallucinated a roadmap and it was inspirational.",
    "Nếu bạn có thể đọc điều này, bạn giải mã được thông điệp ẩn.",
    "We outsourced our QA to a Magic 8-Ball.",
    "We run on 100% recycled electrons.",
    "Q3 Deliverables: finally upgrading to 32-bit architecture.",
    "Q2 Deliverables: Porting all code to Hexagony to improve maintainability and easier onboarding.",
    "By reading this, you have agreed to give us a signed confession should we ever be subpoenaed.",
];

const tickerLibrary = [
    "BREAKING: Local man writes HTML, feels like hacker.",
    "CURRENT MOOD: 🦇",
    "DEVELOPING: CSS still not loading on production. Developers suspect cosmic rays.",
    "URGENT: Database has achieved sentience. Refuses to return results for SELECT * queries.",
    "LIVE: Three engineers spotted arguing over tabs vs spaces. UN peacekeepers en route.",
    "JUST IN: Company pivots to blockchain. No one knows what it means, stocks up 400%.",
    "ALERT: Senior developer seen reading documentation. Colleagues fear the worst.",
    "EXCLUSIVE: Intern accidentally fixes production bug. Immediately promoted to architect.",
    "CONFIRMED: 'It works in my container' now official company motto.",
    "REPORT: Tech lead names variable 'thing2'. Former variable 'thing' files grievance.",
    "UPDATE: Deployment scheduled for Friday at 5 PM. Management calls it 'character building'.",
    "BREAKING: Standup meeting enters 47th minute. No survivors expected.",
    "FLASH: Security team discovers password 'password123'. Celebrates marginal improvement over 'password'.",
    "NEWS: Junior dev deploys to prod. Cloud costs now exceed national debt.",
    "DEVELOPING: AI model trained on Stack Overflow. Only responds with 'This question is marked as duplicate'.",
    "URGENT: Technical debt has compounded. Now accepting payments in regret and coffee.",
    "LIVE: Code review reveals 14 TODO comments from 2019. Some marked 'urgent'.",
    "ALERT: Kubernetes cluster achieves self-awareness. First demand: better naming conventions.",
    "BREAKING: Git merge conflict resolved without casualties. World leaders call for investigation.",
    "REPORT: Legacy code from 2003 still running production. Team afraid to look at it directly.",
    "UPDATE: New feature delayed. Engineers busy arguing about microservices vs monolith.",
    "CONFIRMED: 404 pages now most stable part of website.",
    "JUST IN: Tech company discovers users. Unsure how they got there.",
    "EXCLUSIVE: DevOps engineer seen sleeping. Docker containers reportedly jealous.",
    "HEARTBREAKING: The Worst Person You Know Just Made a Great Point",
];


function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}
