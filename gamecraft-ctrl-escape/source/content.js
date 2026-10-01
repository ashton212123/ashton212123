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
    id: "s1", num: "01", name: "THE SCIENCE LAB", short: "SCIENCE LAB",
    accent: "2DE2E6", icon: "FaFlask", master: "S1", fragment: "3",
    topic: "Science and Nature",
    intro: "NULL scrambled the computer's science files! The Lab only opens for players who know how the world works. Answer 3 questions to earn the first Code Fragment!",
    questions: [
      {
        id: "s1q1", type: "mc",
        q: "Which planet is known as the 'Red Planet'?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1,
        explain: "Mars looks red because its soil is full of iron oxide, the same stuff that makes rust. Venus is the hottest planet, while Jupiter and Saturn are giant gas planets.",
        hint: "It's the fourth planet from the Sun, and robot rovers drive around on it.",
      },
      {
        id: "s1q2", type: "tf",
        q: "BYTE found this claim in a corrupted science file. Is it a FACT or a MYTH?",
        claim: "Lightning never strikes the same place twice.", file: "science_facts.txt",
        options: ["FACT", "MYTH"], sub: ["It's true!", "Not true!"], answer: 1,
        explain: "It's a myth! Lightning can strike the same place again and again, especially tall buildings, towers, and trees. Some skyscrapers are hit by lightning many times every year.",
        hint: "Think about what happens to very tall buildings during big thunderstorms.",
      },
      {
        id: "s1q3", type: "mc",
        q: "Plants make their own food using sunlight. Which gas do they take in from the air to do it?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], answer: 2,
        explain: "In photosynthesis, plants use sunlight, water, and carbon dioxide to make sugar for food. They release oxygen, the gas we need to breathe.",
        hint: "It's the same gas that we breathe OUT.",
      },
    ],
  },
  {
    id: "s2", num: "02", name: "THE TIME VAULT", short: "TIME VAULT",
    accent: "FF7A45", icon: "FaHourglassHalf", master: "S2", fragment: "8",
    topic: "Philippine History",
    intro: "NULL is erasing the computer's history files! The Time Vault only opens for players who remember the past. Answer 3 questions to earn the second Code Fragment!",
    questions: [
      {
        id: "s2q1", type: "mc",
        q: "Which Filipino hero wrote the famous novels Noli Me Tangere and El Filibusterismo?",
        options: ["Andres Bonifacio", "Emilio Aguinaldo", "Apolinario Mabini", "Jose Rizal"], answer: 3,
        explain: "Dr. Jose Rizal wrote Noli Me Tangere (1887) and El Filibusterismo (1891). His novels showed the abuses of Spanish rule and inspired Filipinos to fight for change.",
        hint: "His monument stands in Rizal Park (Luneta) in Manila.",
      },
      {
        id: "s2q2", type: "tf",
        q: "This history file might be corrupted. Is the statement below a FACT or a MYTH?",
        claim: "Ferdinand Magellan was killed in the Battle of Mactan in 1521.", file: "history_notes.txt",
        options: ["FACT", "MYTH"], sub: ["It's true!", "Not true!"], answer: 0,
        explain: "It's a fact! On April 27, 1521, Magellan was killed in the Battle of Mactan by the warriors of Lapulapu, who is honored as one of the first Filipinos to resist foreign rule.",
        hint: "Remember Lapulapu, the brave chieftain of Mactan.",
      },
      {
        id: "s2q3", type: "mc",
        q: "On what date does the Philippines celebrate its Independence Day?",
        options: ["December 30", "June 12", "August 21", "November 30"], answer: 1,
        explain: "On June 12, 1898, Emilio Aguinaldo declared the independence of the Philippines from Spain in Kawit, Cavite. December 30 is Rizal Day and November 30 is Bonifacio Day.",
        hint: "It's in the month when the rainy season usually begins.",
      },
    ],
  },
  {
    id: "s3", num: "03", name: "THE FUN ZONE", short: "FUN ZONE",
    accent: "A98BFF", icon: "FaGamepad", master: "S3", fragment: "1",
    topic: "Everyday Life: Food, Sports, and Money",
    intro: "NULL hijacked the Fun Zone, where the computer keeps its games, food photos, and sports clips! Prove you know everyday life to earn the third Code Fragment!",
    questions: [
      {
        id: "s3q1", type: "mc",
        q: "In basketball, how many players from ONE team are on the court at the same time?",
        options: ["5", "6", "7", "11"], answer: 0,
        explain: "Each basketball team has 5 players on the court: usually 2 guards, 2 forwards, and a center. Volleyball has 6 players per team, and football (soccer) has 11.",
        hint: "Count the fingers on one hand.",
      },
      {
        id: "s3q2", type: "table",
        q: "Kai buys merienda at the sari-sari store. The vault opens with the TOTAL. How much is it?",
        sheet: [["ITEM", "PRICE (PHP)"], ["Pandesal (10 pcs)", "50"], ["Banana cue", "25"], ["Softdrink", "20"], ["Chips", "15"], ["Candy", "5"], ["TOTAL", "?"]],
        options: ["PHP 105", "PHP 120", "PHP 115", "PHP 125"], answer: 2, mono: true,
        explain: "50 + 25 + 20 + 15 + 5 = 115, so the total is PHP 115. Tip: add the big numbers first (50 + 25 = 75), then add the rest (75 + 20 + 15 + 5 = 115).",
        hint: "Add the prices two at a time, then double-check your answer.",
      },
      {
        id: "s3q3", type: "mc",
        q: "What ingredient is most commonly used to give the Filipino dish sinigang its sour taste?",
        options: ["Coconut milk", "Soy sauce", "Sugar", "Tamarind (sampalok)"], answer: 3,
        explain: "Sinigang gets its famous sour taste from tamarind (sampalok). Some versions use guava, kamias, or green mango instead. Coconut milk is used in dishes like ginataan.",
        hint: "It grows in brown, curved pods, and kids love it as candy too!",
      },
    ],
  },
  {
    id: "s4", num: "04", name: "THE WORLD MAP", short: "WORLD MAP",
    accent: "9BE564", icon: "FaGlobeAsia", master: "S4", fragment: "6",
    topic: "Geography of the Philippines and the World",
    intro: "NULL tore the computer's world map into pieces! Only a true explorer can find the way. Choose your doors wisely to earn the final Code Fragment!",
    questions: [
      {
        id: "s4q1", type: "doors",
        q: "Kai must travel to the capital city of Japan. Which door leads there?",
        options: ["Kyoto", "Tokyo", "Osaka", "Seoul"], answer: 1,
        explain: "Tokyo is the capital of Japan and one of the biggest cities in the world. Kyoto is Japan's old capital, Osaka is another big Japanese city, and Seoul is the capital of South Korea.",
        hint: "This city hosted the 2020 Summer Olympics.",
      },
      {
        id: "s4q2", type: "mc",
        q: "What is the largest ocean on Earth?",
        options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], answer: 0,
        explain: "The Pacific Ocean is the largest and deepest ocean, covering about one-third of Earth's surface. The Philippines sits on its western side.",
        hint: "It's the ocean right next to the Philippines.",
      },
      {
        id: "s4q3", type: "mc",
        q: "Which is the highest mountain in the Philippines?",
        options: ["Mount Mayon", "Mount Pulag", "Mount Apo", "Mount Pinatubo"], answer: 2,
        explain: "Mount Apo in Mindanao is the highest peak in the Philippines, at about 2,950 meters above sea level. Mount Pulag is the highest in Luzon, and Mayon is famous for its perfect cone shape.",
        hint: "It's on the island of Mindanao, near Davao City.",
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
      options: ["Click it fast before it disappears", "Share it so your friends can win too", "Close it without clicking and run an antivirus scan", "Type your name and address to claim it"], answer: 2,
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
  2: { stars: 2, title: "GLITCH BUSTER", line: "A strong escape with only one broken shield!" },
  1: { stars: 1, title: "LUCKY ESCAPER", line: "You made it out... with just one shield left!" },
};

module.exports = { GAME, COLORS, SECTORS, CORE, TAUNTS, RANKS };
