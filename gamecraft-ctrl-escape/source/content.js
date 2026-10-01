// All game content for CTRL + ESCAPE — shared by the PowerPoint and Word builders.

const GAME = {
  title: "CTRL + ESCAPE",
  subtitle: "The Glitch Within",
  genre: "Escape Room + Story Adventure + Quiz",
  docFile: "CTRL-ESCAPE_Game_Documentation.docx",
  pptFile: "CTRL-ESCAPE_Game.pptx",
  code: "6183", // fragments 3-8-1-6 entered in REVERSE order
};

const COLORS = {
  bg: "0A0F24",
  panel: "121A3F",
  panel2: "1A2353",
  line: "3A4370",
  text: "EAF2FF",
  muted: "9AA6D9",
  cyan: "2DE2E6",
  magenta: "F72585",
  mint: "4BF0A0",
  amber: "FFC233",
  locked: "5A6494",
};

const SECTORS = [
  {
    id: "s1", num: "01", name: "THE WEB GATEWAY", short: "WEB GATEWAY",
    accent: "2DE2E6", icon: "FaGlobeAsia", master: "S1", fragment: "3",
    topic: "ICT and the World Wide Web",
    intro: "This is where all internet traffic enters the computer. The Gatekeeper only opens for players who know how the Web works. Answer 3 questions to earn the first Code Fragment!",
    questions: [
      {
        id: "s1q1", type: "mc",
        q: "Which version of the Web lets users CREATE and SHARE content, like posting videos, commenting, and writing blogs?",
        options: ["Web 1.0", "Web 2.0", "Web 3.0", "The Dark Web"], answer: 1,
        explain: "Web 2.0 is the dynamic, participatory web. Users don't just read pages: they post, comment, and share. Web 1.0 was static and read-only, while Web 3.0 is the 'semantic web' that understands and personalizes data.",
        hint: "Think of social media. Which version of the Web turned readers into creators?",
      },
      {
        id: "s1q2", type: "mc",
        q: "Kai's phone can call, chat, take photos, play music, and pay bills, all in ONE device. Which trend in ICT does this show?",
        options: ["Assistive Media", "Technological Convergence", "Web 1.0", "Static Website"], answer: 1,
        explain: "Technological convergence is when different technologies merge to work together on one device or platform. A smartphone combines a phone, a camera, a music player, and a wallet.",
        hint: "To 'converge' means to come together in one place.",
      },
      {
        id: "s1q3", type: "mc",
        q: "Users label posts with tags like #EmpowermentTech so content can be grouped and found. What is this Web 2.0 feature called?",
        options: ["Folksonomy", "Long Tail", "Mass Participation", "Software as a Service"], answer: 0,
        explain: "Folksonomy lets users categorize and classify information using freely chosen keywords, like hashtags. 'Folk' (people) + 'taxonomy' (classification) = classification made by the people.",
        hint: "It is classification made by the 'folks', the people themselves.",
      },
    ],
  },
  {
    id: "s2", num: "02", name: "THE FIREWALL FORTRESS", short: "FIREWALL FORTRESS",
    accent: "FF7A45", icon: "FaFire", master: "S2", fragment: "8",
    topic: "Online Safety, Security, and Netiquette",
    intro: "Walls of fire protect the system from attacks, but NULL's spies hide here disguised as friendly messages. Spot the traps to earn the second Code Fragment!",
    questions: [
      {
        id: "s2q1", type: "phish",
        q: "BYTE intercepted this message in Kai's inbox. Is it LEGIT or PHISHING?",
        email: {
          from: "admin@sch00l-portal-login.net",
          subject: "URGENT!!! Your account will be DELETED in 1 hour",
          body: "Dear Student, your school account will be deleted. Click the link below and type your password to verify your account:",
          link: "http://sch00l-portal-login.net/verify",
        },
        options: ["LEGIT", "PHISHING"], sub: ["Safe to open", "It's a trap!"], answer: 1,
        explain: "Red flags: an urgent threat, a fake address that uses zeros ('sch00l'), and a request for your password. Real school admins never ask for your password by email. Report it and delete it.",
        hint: "Look closely at the sender's address, and at what the message asks you to type.",
      },
      {
        id: "s2q2", type: "mc",
        q: "To lock the Fortress gate, Kai must choose a password. Which one is the STRONGEST?",
        options: ["juan2008", "password123", "Bl@ckC4t!Rides#Jeep9", "12345678"], answer: 2, mono: true,
        explain: "A strong password is long and mixes UPPERCASE and lowercase letters, numbers, and symbols. It also avoids names, birthdays, and common words that hackers guess first.",
        hint: "Longer + more kinds of characters = much harder to crack.",
      },
      {
        id: "s2q3", type: "mc",
        q: "A 'FREE Game Hack' download looks useful, but it secretly opens a backdoor for hackers. What type of malware is it?",
        options: ["Worm", "Spyware", "Trojan", "Adware"], answer: 2,
        explain: "A Trojan pretends to be useful software but hides something harmful, just like the wooden horse in the Greek legend. Worms spread by themselves, spyware secretly watches you, and adware floods you with ads.",
        hint: "Remember the legend of the giant wooden horse at the gates of Troy.",
      },
    ],
  },
  {
    id: "s3", num: "03", name: "THE OFFICE ARCHIVES", short: "OFFICE ARCHIVES",
    accent: "A98BFF", icon: "FaFolderOpen", master: "S3", fragment: "1",
    topic: "Productivity Tools (Word, Excel, PowerPoint)",
    intro: "Endless shelves of documents, spreadsheets, and slides. The Archivist only opens the vault for true productivity masters. Prove your skills to earn the third Code Fragment!",
    questions: [
      {
        id: "s3q1", type: "mc",
        q: "The principal needs 300 invitation letters, each with a different parent's name and address. Which MS Word feature creates them all automatically?",
        options: ["Track Changes", "WordArt", "Mail Merge", "Page Break"], answer: 2,
        explain: "Mail Merge combines one main document with a data source (like an Excel list of names) to produce personalized copies of letters, envelopes, labels, or certificates in seconds.",
        hint: "You MERGE one letter with a whole list of names.",
      },
      {
        id: "s3q2", type: "excel",
        q: "The vault opens with the TOTAL of cells B2 to B6. Which Excel formula is correct?",
        sheet: [["ITEM", "AMOUNT"], ["Mouse", "350"], ["Keyboard", "500"], ["Headset", "900"], ["USB Drive", "250"], ["Webcam", "1,200"], ["TOTAL", "?"]],
        options: ["=SUM(B2:B6)", "=ADD(B2-B6)", "SUM(B2,B6)", "=TOTAL(B2:B6)"], answer: 0, mono: true,
        explain: "Every formula starts with '=', SUM adds numbers, and the colon (:) means 'from B2 to B6'. The total is 3,200. Option C has no '=' and only adds two cells.",
        hint: "Every formula begins with the same symbol, and a range uses a colon.",
      },
      {
        id: "s3q3", type: "mc",
        q: "This very game jumps to different slides when you click a button. Which PowerPoint feature makes that possible?",
        options: ["Slide Master", "Hyperlinks and Action Settings", "Spell Check", "Slide Sorter"], answer: 1,
        explain: "Hyperlinks (Insert > Link) and Action Settings (Insert > Action) let any shape or picture jump to a slide, a file, or a website. They are the secret behind every PowerPoint game.",
        hint: "It's the same feature that makes clickable links on websites.",
      },
    ],
  },
  {
    id: "s4", num: "04", name: "THE SEARCH MAZE", short: "SEARCH MAZE",
    accent: "9BE564", icon: "FaSearch", master: "S4", fragment: "6",
    topic: "Online Search, Research, and Intellectual Property",
    intro: "A maze of a million search results. Only smart searchers find the right path, so choose your doors wisely. Clear the maze to earn the final Code Fragment!",
    questions: [
      {
        id: "s4q1", type: "doors",
        q: "Kai needs scholarship info ONLY from Philippine government websites. Which door (search query) leads the right way?",
        options: ["scholarship site:gov.ph", "scholarship -gov.ph", "\"scholarship\" gov", "scholarship OR gov.ph"], answer: 0,
        explain: "The site: operator limits results to one domain, so site:gov.ph shows only government pages. A minus sign (-) EXCLUDES a word, and quotation marks search for an exact phrase.",
        hint: "One search operator tells the engine which SITE to look inside.",
      },
      {
        id: "s4q2", type: "mc",
        q: "For a research paper on typhoon safety, which source is the MOST reliable?",
        options: ["A meme page with 1 million followers", "An anonymous comment on a forum", "The national weather bureau's official .gov.ph website", "A site titled 'SHOCKING typhoon secrets!!!'"], answer: 2,
        explain: "Check a source's authority, accuracy, and purpose. Official government and academic websites are written by experts who are accountable for the information. Clickbait and anonymous posts are not.",
        hint: "Who is the real expert, and who is accountable for the information?",
      },
      {
        id: "s4q3", type: "mc",
        q: "Kai finds a cool image online for the group's game. What is the RIGHT way to use it?",
        options: ["Download it, because everything online is free", "Crop out the watermark first", "Use a free or Creative Commons image and credit the creator", "Say that you drew it yourself"], answer: 2,
        explain: "Images are intellectual property. Use royalty-free or Creative Commons images (or ask permission), and always credit the creator. Removing watermarks or claiming someone's work is plagiarism.",
        hint: "Respect the creator's rights, and always give credit.",
      },
    ],
  },
];

const CORE = {
  id: "core", num: "05", name: "NULL'S CORE", short: "NULL'S CORE",
  accent: "F72585", icon: "FaBug", master: "CORE",
  topic: "Final Challenge: Think Before You Click",
  intro: "You made it to the heart of the system! NULL guards the ESC Gate here. Beat NULL's final question, then use your 4 Code Fragments to unlock the gate. Don't lose your shields now!",
  questions: [
    {
      id: "boss", type: "mc", speaker: "null",
      q: "NULL: \"Before you leave, answer THIS! When my 'FREE PHONE' pop-up appeared, what SHOULD you have done?\"",
      options: ["Click it fast before it disappears", "Close it without clicking and run an antivirus scan", "Share it so your friends can win too", "Type your name and address to claim it"], answer: 1,
      explain: "Never click suspicious pop-ups or 'You won!' offers. Close them safely, never enter personal information, and scan your device. THINK before you click!",
      hint: "What would BYTE, the antivirus, tell you to do?",
    },
    {
      id: "lock", type: "lock", speaker: "null",
      q: "NULL: \"Fine! But I SCRAMBLED the ESC Gate! The code is your 4 fragments in REVERSE order. Hehehe!\"",
      options: ["3816", "6183", "1638", "8361"], answer: 1,
      explain: "Your fragments were 3 - 8 - 1 - 6. Read backwards, the code is 6 - 1 - 8 - 3. The ESC Gate is open!",
      hint: "Write your fragments from Sector 1 to Sector 4, then read them from right to left.",
    },
  ],
};

const TAUNTS = [
  "Hehehe! Wrong answer. Say goodbye to a shield!",
  "ERROR 404: Correct answer not found! Hahaha!",
  "Your shield just crashed. Want to try again?",
  "Click, click, CRASH! I love wrong answers!",
  "That shield is now MY shield. Hehehe!",
  "Did you even read the question? Hahaha!",
];

const RANKS = {
  3: { stars: 3, title: "CYBER GUARDIAN", line: "A flawless escape. NULL never stood a chance!" },
  2: { stars: 2, title: "FIREWALL HERO", line: "A strong escape with only one broken shield!" },
  1: { stars: 1, title: "LUCKY ESCAPER", line: "You made it out... with just one shield left!" },
};

module.exports = { GAME, COLORS, SECTORS, CORE, TAUNTS, RANKS };
