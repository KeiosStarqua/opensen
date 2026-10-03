import type { PracticeDeck, TopicProgress } from "./model";

export type StudioSentence = {
  id: string;
  text: string;
  meaning: string;
};

export type StudioStep = {
  id: string;
  title: string;
  art: "counter" | "help" | "bag" | "security" | "gate" | "table" | "menu" | "pay" | "shop" | "town" | "class";
  sentences: StudioSentence[];
};

export type StudioTopic = {
  id: string;
  name: string;
  icon: "plane" | "bowl" | "bag" | "house" | "school";
  tileClass: string;
  barClass: string;
  blurb: string;
  lesson: {
    title: string;
    subtitle: string;
    highlightStepId: string;
    steps: StudioStep[];
  };
};

export type LibraryItem = {
  id: string;
  text: string;
  meaning: string;
  topicId: string;
  topicName: string;
  lessonTitle: string;
  stepTitle: string;
};

function line(id: string, text: string, meaning: string): StudioSentence {
  return { id, text, meaning };
}

function step(
  id: string,
  title: string,
  art: StudioStep["art"],
  sentences: StudioSentence[],
): StudioStep {
  return { id, title, art, sentences };
}

export const topics: StudioTopic[] = [
  {
    id: "travel",
    name: "Travel",
    icon: "plane",
    tileClass: "bg-[#e5f3ff] text-[#3d93e8]",
    barClass: "bg-[#3d93e8]",
    blurb: "Check in, ask for help, and get to the gate.",
    lesson: {
      title: "At the Airport",
      subtitle: "Ask for help, check in, and more!",
      highlightStepId: "ask-for-help",
      steps: [
        step("check-in", "Check in", "counter", [
          line("travel-passport", "May I see your passport?", "A polite way to ask for someone's passport."),
          line("travel-check-in", "I'd like to check in, please.", "Say this when you arrive at the counter."),
          line("travel-booking", "Here is my booking.", "Offer your reservation."),
          line("travel-window", "Can I have a window seat?", "Ask for a seat by the window."),
          line("travel-bags", "How many bags can I take?", "Ask about the luggage limit."),
          line("travel-carry-on", "This bag is my carry-on.", "Name the bag you will take on the plane."),
          line("travel-boarding-time", "What time does boarding start?", "Ask when you can get on the plane."),
          line("travel-thanks", "Thank you for your help.", "Close the conversation politely."),
        ]),
        step("ask-for-help", "Ask for help", "help", [
          line("travel-station", "Could you help me find the station?", "Ask someone to help you find a place."),
          line("travel-counter", "Where is the check-in counter?", "Ask for the counter location."),
          line("travel-gate", "Which way is gate 12?", "Ask for directions to your gate."),
          line("travel-slowly", "Can you speak more slowly?", "Ask the other person to slow down."),
          line("travel-understand", "I don't understand.", "Say this when you miss the meaning."),
          line("travel-repeat", "Could you repeat that, please?", "Ask to hear it again."),
          line("travel-charge", "Where can I charge my phone?", "Ask for a charging spot."),
          line("travel-line", "Is this the right line?", "Check that you are waiting in the correct queue."),
        ]),
        step("baggage", "Baggage", "bag", [
          line("travel-check-bag", "I'd like to check this bag.", "Hand a bag over at the counter."),
          line("travel-heavy", "Is this bag too heavy?", "Ask about the weight limit."),
          line("travel-cabin", "Can I take this on the plane?", "Ask if a bag can go in the cabin."),
          line("travel-claim", "Where is baggage claim?", "Ask where to pick up your luggage."),
          line("travel-missing", "My bag hasn't arrived.", "Report a missing bag."),
          line("travel-belt", "Which belt is for this flight?", "Ask which carousel to use."),
        ]),
        step("security", "Security", "security", [
          line("travel-shoes", "Do I need to take off my shoes?", "Ask what to remove at security."),
          line("travel-water", "Can I bring this water bottle?", "Ask if a drink is allowed."),
          line("travel-laptop", "Please put your laptop in the tray.", "A line you will hear at security."),
          line("travel-shorter", "Is there a shorter line?", "Ask about a faster queue."),
          line("travel-stand", "Where should I stand?", "Ask where to wait."),
          line("travel-take-out", "I'll take that out.", "Respond when asked to show an item."),
        ]),
        step("boarding", "Boarding", "gate", [
          line("travel-board-line", "Is this the line for boarding?", "Check you are in the right queue."),
          line("travel-pass", "Here is my boarding pass.", "Show your pass at the gate."),
          line("travel-when-board", "When do we start boarding?", "Ask for the boarding time."),
          line("travel-board-now", "Can I board now?", "Ask if it is your turn."),
          line("travel-seat", "Where is seat 14A?", "Ask for help finding your seat."),
          line("travel-my-seat", "Excuse me, that's my seat.", "Politely claim your seat."),
        ]),
      ],
    },
  },
  {
    id: "restaurant",
    name: "Restaurant",
    icon: "bowl",
    tileClass: "bg-[#fff1e0] text-[#f09a3a]",
    barClass: "bg-[#f09a3a]",
    blurb: "Get a table, order, and ask for the check.",
    lesson: {
      title: "At the Restaurant",
      subtitle: "Order food and talk to the server.",
      highlightStepId: "ordering",
      steps: [
        step("a-table", "A table", "table", [
          line("restaurant-table", "Do you have a table for two?", "Ask for a table when you arrive."),
          line("restaurant-window", "Could we sit by the window?", "Ask for a specific seat."),
        ]),
        step("ordering", "Ordering", "menu", [
          line("restaurant-chicken", "I'll have the chicken, please.", "Place a simple order."),
          line("restaurant-recommend", "What do you recommend?", "Ask the server for a suggestion."),
        ]),
        step("the-menu", "The menu", "menu", [
          line("restaurant-menu", "Could I see the menu?", "Ask to look at the menu."),
          line("restaurant-spicy", "Is this dish spicy?", "Ask about the flavor."),
        ]),
        step("dietary", "Dietary needs", "menu", [
          line("restaurant-peanuts", "I'm allergic to peanuts.", "Tell the server about an allergy."),
          line("restaurant-dairy", "Does this have dairy?", "Ask what is in the dish."),
        ]),
        step("paying", "Paying", "pay", [
          line("restaurant-check", "Could I get the check, please?", "Ask to pay."),
          line("restaurant-card", "Can I pay by card?", "Ask which payment they take."),
        ]),
        step("takeaway", "Takeaway", "pay", [
          line("restaurant-here", "Is this for here or to go?", "A question you may hear at the counter."),
          line("restaurant-togo", "Can I get this to go?", "Ask to take the food with you."),
        ]),
      ],
    },
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "bag",
    tileClass: "bg-[#fde8f0] text-[#e86b98]",
    barClass: "bg-[#e86b98]",
    blurb: "Ask the price, the size, and the way back.",
    lesson: {
      title: "At the Shop",
      subtitle: "Find a size, ask the price, and pay.",
      highlightStepId: "price",
      steps: [
        step("price", "Price", "shop", [
          line("shopping-price", "How much is this?", "Ask the price of something you are holding."),
          line("shopping-sale", "Is this on sale?", "Ask if the price is reduced."),
        ]),
        step("size", "Size", "shop", [
          line("shopping-medium", "Do you have this in a medium?", "Ask for another size."),
          line("shopping-small", "This is too small.", "Say the size does not fit."),
        ]),
        step("trying-on", "Trying on", "shop", [
          line("shopping-try", "Can I try this on?", "Ask to use the fitting room."),
          line("shopping-room", "Where is the fitting room?", "Ask where to try clothes."),
        ]),
        step("shop-pay", "Paying", "pay", [
          line("shopping-take", "I'll take this one.", "Say you want to buy it."),
          line("shopping-card", "Can I pay by card?", "Ask to pay with a card."),
        ]),
        step("returns", "Returns", "shop", [
          line("shopping-return", "Can I return this?", "Ask about bringing an item back."),
          line("shopping-receipt", "I have the receipt.", "Show that you can prove the purchase."),
        ]),
        step("a-bag", "A bag", "bag", [
          line("shopping-bag", "Could I have a bag?", "Ask for a bag."),
          line("shopping-need-bag", "I don't need a bag.", "Decline a bag."),
        ]),
      ],
    },
  },
  {
    id: "daily",
    name: "Daily Life",
    icon: "house",
    tileClass: "bg-[#e7f8ec] text-[#3aaa62]",
    barClass: "bg-[#3aaa62]",
    blurb: "Greet people, ask the time, and find the restroom.",
    lesson: {
      title: "Around Town",
      subtitle: "Small sentences for everyday moments.",
      highlightStepId: "restroom",
      steps: [
        step("greetings", "Greetings", "town", [
          line("daily-hi", "Hi, how are you?", "A simple greeting."),
          line("daily-well", "I'm doing well, thanks.", "Answer a greeting."),
        ]),
        step("directions", "Directions", "town", [
          line("daily-station", "How do I get to the station?", "Ask for directions."),
          line("daily-far", "Is it far from here?", "Ask about the distance."),
        ]),
        step("restroom", "The restroom", "town", [
          line("daily-restroom", "Where is the restroom?", "Ask where the restroom is."),
          line("daily-nearby", "Is there a restroom nearby?", "Ask if one is close."),
        ]),
        step("time", "Time", "town", [
          line("daily-time", "What time is it?", "Ask for the time."),
          line("daily-open", "What time does it open?", "Ask when a place opens."),
        ]),
        step("weather", "Weather", "town", [
          line("daily-warm", "It's really warm today.", "Comment on the weather."),
          line("daily-jacket", "Do I need a jacket?", "Ask what to wear."),
        ]),
        step("goodbye", "Goodbye", "town", [
          line("daily-day", "Have a good day.", "A warm goodbye."),
          line("daily-later", "See you later.", "Say you will meet again."),
        ]),
      ],
    },
  },
  {
    id: "school",
    name: "School",
    icon: "school",
    tileClass: "bg-[#e8f0ff] text-[#6d90e8]",
    barClass: "bg-[#6d90e8]",
    blurb: "Talk to a teacher, a classmate, and the schedule.",
    lesson: {
      title: "At School",
      subtitle: "Sentences for class, homework, and lunch.",
      highlightStepId: "teacher",
      steps: [
        step("classroom", "Classroom", "class", [
          line("school-come", "May I come in?", "Ask to enter the room."),
          line("school-sit", "Where should I sit?", "Ask for your seat."),
        ]),
        step("teacher", "The teacher", "class", [
          line("school-again", "Could you say that again?", "Ask the teacher to repeat."),
          line("school-question", "I have a question.", "Signal that you want to ask something."),
        ]),
        step("homework", "Homework", "class", [
          line("school-due", "When is this due?", "Ask the deadline."),
          line("school-tomorrow", "Can I turn it in tomorrow?", "Ask for a later hand-in."),
        ]),
        step("classmates", "Classmates", "class", [
          line("school-work", "Can I work with you?", "Ask to pair up."),
          line("school-page", "What page are we on?", "Ask where the class is in the book."),
        ]),
        step("schedule", "Schedule", "class", [
          line("school-next", "What time is the next class?", "Ask about the schedule."),
          line("school-room", "Where is room 12?", "Ask for a classroom."),
        ]),
        step("lunch", "Lunch", "table", [
          line("school-cafe", "Where is the cafeteria?", "Ask where to eat."),
          line("school-eat", "Do you want to eat together?", "Invite someone to lunch."),
        ]),
      ],
    },
  },
];

export const defaultPractice: PracticeDeck = {
  index: 2,
  items: [
    {
      kind: "order",
      text: "I'd like to check in, please.",
      meaning: "Say this when you arrive at the counter.",
    },
    {
      kind: "order",
      text: "Where is the check-in counter?",
      meaning: "Ask where to check in.",
    },
    {
      kind: "order",
      text: "May I see your passport?",
      meaning: "A polite way to ask for someone's passport.",
    },
    {
      kind: "speak",
      text: "Could you help me find the station?",
      meaning: "Ask someone to help you find a place.",
    },
    {
      kind: "speak",
      text: "Which way is gate 12?",
      meaning: "Ask for directions to your gate.",
    },
  ],
};

export const initialTopicProgress: Record<string, TopicProgress> = {
  travel: { done: 2, total: 8 },
  restaurant: { done: 1, total: 6 },
  shopping: { done: 0, total: 6 },
  daily: { done: 0, total: 6 },
  school: { done: 0, total: 6 },
};

export const libraryFilters = [
  { id: "saved", label: "Saved" },
  { id: "travel", label: "Travel" },
  { id: "restaurant", label: "Restaurant" },
  { id: "shopping", label: "Shopping" },
] as const;

export type LibraryFilter = (typeof libraryFilters)[number]["id"];

export function getTopic(id: string): StudioTopic | null {
  return topics.find((topic) => topic.id === id) ?? null;
}

export function getStep(topicId: string, stepId: string) {
  const topic = getTopic(topicId);
  const found = topic?.lesson.steps.find((item) => item.id === stepId) ?? null;
  if (!topic || !found) return null;
  return { topic, step: found };
}

export function listLibraryItems(): LibraryItem[] {
  return topics.flatMap((topic) =>
    topic.lesson.steps.flatMap((lessonStep) =>
      lessonStep.sentences.map((sentence) => ({
        id: sentence.id,
        text: sentence.text,
        meaning: sentence.meaning,
        topicId: topic.id,
        topicName: topic.name,
        lessonTitle: topic.lesson.title,
        stepTitle: lessonStep.title,
      })),
    ),
  );
}
