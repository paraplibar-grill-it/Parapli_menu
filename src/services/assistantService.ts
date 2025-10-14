import { supabase } from '../lib/supabase';
import type { MenuItem, Category } from '../types';

export type Language = 'fr' | 'en' | 'ht';

interface ConversationContext {
  menuItems: MenuItem[];
  categories: Category[];
  language: Language;
}

interface AssistantResponse {
  message: string;
  suggestions?: MenuItem[];
  metadata?: Record<string, unknown>;
}

const greetingVariations = {
  fr: [
    "Bonjour ! Bienvenue au Parapli Bar ! Je suis ravi de vous servir aujourd'hui. Qu'est-ce qui vous ferait plaisir ?",
    "Salut ! Content de vous voir ! Installez-vous bien, je suis là pour vous conseiller. Une petite soif ? Une envie particulière ?",
    "Hey ! Bienvenue chez nous ! Vous savez déjà ce que vous voulez ou je peux vous faire quelques suggestions ?",
  ],
  en: [
    "Hello! Welcome to Parapli Bar! I'm happy to serve you today. What can I get for you?",
    "Hey there! Good to see you! Make yourself comfortable, I'm here to help. Thirsty? Any cravings?",
    "Hi! Welcome! Do you know what you'd like or should I suggest something?",
  ],
  ht: [
    "Bonjou! Byenveni nan Parapli Bar! Mwen kontan sèvi w jodi a. Kisa w ta renmen?",
    "Salut! Kontan wè w! Enstale w byen, mwen la pou konsèy ou. Yon ti swaf? Yon anvi patikilye?",
    "Hey! Byenveni lakay nou! Èske w konnen sa w vle oswa mwen ka ba w kèk sijesyon?",
  ]
};

export async function createConversation(language: Language = 'fr'): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      session_id: sessionId,
      language
    })
    .select()
    .single();

  if (error) throw error;

  const greetings = greetingVariations[language];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  await saveMessage(data.id, 'assistant', greeting, language);

  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  language: Language,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      language,
      metadata: metadata || {}
    });

  if (error) throw error;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

function analyzeUserIntent(message: string, language: Language): {
  intent: string;
  keywords: string[];
  preferences?: string[];
  sentiment?: string;
} {
  const lowerMessage = message.toLowerCase();

  const socialPatterns = {
    fr: {
      greeting: ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir'],
      thanks: ['merci', 'thank', 'cool', 'super', 'génial', 'top', 'parfait', 'excellent'],
      compliment: ['sympa', 'gentil', 'adorable', 'serviable', 'aimable', 'bien'],
      smallTalk: ['comment', 'ça va', 'tu vas', 'comment tu', 'qui es-tu', 'tu es qui', 't\'es qui'],
      hesitation: ['sais pas', 'hésite', 'je sais pas quoi', 'pas sûr', 'indécis']
    },
    en: {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      thanks: ['thanks', 'thank you', 'cool', 'great', 'awesome', 'perfect', 'excellent'],
      compliment: ['nice', 'kind', 'helpful', 'sweet', 'friendly'],
      smallTalk: ['how are', 'you doing', 'who are you', 'what are you'],
      hesitation: ['not sure', 'don\'t know', 'hesitate', 'undecided', 'can\'t decide']
    },
    ht: {
      greeting: ['bonjou', 'bonswa', 'salut', 'alo'],
      thanks: ['mèsi', 'thank', 'gwo mèsi', 'bon', 'ekselan'],
      compliment: ['senpa', 'janti', 'bon moun'],
      smallTalk: ['kijan w ye', 'ou byen', 'ki moun ou ye'],
      hesitation: ['pa konnen', 'pa si', 'ezite']
    }
  };

  const langPatterns = socialPatterns[language] || socialPatterns.fr;

  for (const [category, patterns] of Object.entries(langPatterns)) {
    if (patterns.some((pattern: string) => lowerMessage.includes(pattern))) {
      if (category === 'greeting' || category === 'thanks' || category === 'compliment' || category === 'smallTalk') {
        return { intent: 'social', keywords: [category], sentiment: category };
      }
      if (category === 'hesitation') {
        return { intent: 'hesitation', keywords: [], sentiment: 'uncertain' };
      }
    }
  }

  const intentPatterns = {
    recommendation: {
      fr: ['recommand', 'suggér', 'conseil', 'proposer', 'bon', 'meilleur', 'populaire', 'spécial', 'envie', 'préfère'],
      en: ['recommend', 'suggest', 'advice', 'what should', 'best', 'popular', 'special', 'good', 'prefer', 'like'],
      ht: ['rekòmande', 'sijere', 'bon', 'pi bon', 'popilè', 'espesyal', 'vle', 'prefere']
    },
    order: {
      fr: ['commande', 'prend', 'veux', 'voudrais', 'j\'achète', 'je prends', 'commander', 'acheter', 'servir'],
      en: ['order', 'take', 'want', 'would like', 'buy', 'get', 'i\'ll have', 'give me'],
      ht: ['kòmande', 'pran', 'vle', 'achte', 'ban mwen']
    },
    browse: {
      fr: ['menu', 'carte', 'voir', 'montrer', 'liste', 'catégorie', 'affich', 'quel', 'qu\'avez-vous', 'disponible', 'avez', 'proposez'],
      en: ['menu', 'show', 'list', 'see', 'category', 'browse', 'what do you have', 'available', 'display'],
      ht: ['meni', 'lis', 'wè', 'montre', 'kategori', 'ki sa ou genyen', 'disponib']
    },
    info: {
      fr: ['ingrédient', 'contient', 'c\'est quoi', 'qu\'est-ce', 'alcool', 'prix', 'coût', 'combien', 'composition', 'fait'],
      en: ['ingredient', 'contain', 'what is', 'alcohol', 'price', 'cost', 'how much', 'made', 'composition'],
      ht: ['engredyan', 'gen', 'ki sa', 'alkòl', 'pri', 'konbyen', 'fèt', 'konpoze']
    }
  };

  const preferencePatterns = {
    fr: {
      sweet: ['sucré', 'doux', 'fruité', 'fruit'],
      strong: ['fort', 'corsé', 'intense', 'puissant'],
      fresh: ['frais', 'fraîche', 'léger', 'rafraîch'],
      alcoholic: ['alcool', 'alcoolisé', 'spiritueux', 'rhum', 'vodka', 'whisky'],
      nonAlcoholic: ['sans alcool', 'virgin', 'soft', 'jus', 'soda'],
      hot: ['chaud', 'chaude'],
      cold: ['froid', 'froide', 'glacé', 'frappé']
    },
    en: {
      sweet: ['sweet', 'fruity', 'fruit'],
      strong: ['strong', 'powerful', 'intense'],
      fresh: ['fresh', 'light', 'refreshing'],
      alcoholic: ['alcohol', 'alcoholic', 'spirit', 'rum', 'vodka', 'whisky'],
      nonAlcoholic: ['non-alcoholic', 'virgin', 'soft', 'juice', 'soda'],
      hot: ['hot', 'warm'],
      cold: ['cold', 'iced', 'frozen']
    },
    ht: {
      sweet: ['dous', 'fwi', 'fwite'],
      strong: ['fò', 'pwisan'],
      fresh: ['frè', 'lejè'],
      alcoholic: ['alkòl', 'ron', 'vodka', 'wiski'],
      nonAlcoholic: ['san alkòl', 'ji', 'soda'],
      hot: ['cho'],
      cold: ['frèt', 'glase']
    }
  };

  const detectedPreferences: string[] = [];
  const langPrefs = preferencePatterns[language] || preferencePatterns.en;

  for (const [pref, patterns] of Object.entries(langPrefs)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      detectedPreferences.push(pref);
    }
  }

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const langPatterns = patterns[language] || patterns.en;
    if (langPatterns.some(pattern => lowerMessage.includes(pattern))) {
      const keywords = lowerMessage.split(/\s+/).filter(word => word.length > 2);
      return { intent, keywords, preferences: detectedPreferences };
    }
  }

  return { intent: 'general', keywords: lowerMessage.split(/\s+/).filter(word => word.length > 2), preferences: detectedPreferences };
}

function findRelevantItems(
  keywords: string[],
  menuItems: MenuItem[],
  categories: Category[],
  preferences?: string[]
): MenuItem[] {
  const scoredItems = menuItems.map(item => {
    let score = 0;
    const itemText = `${item.name} ${item.description} ${item.tags?.join(' ')} ${item.sub_category || ''}`.toLowerCase();

    keywords.forEach(keyword => {
      const cleanKeyword = keyword.toLowerCase().trim();
      if (cleanKeyword.length < 3) return;

      if (item.name.toLowerCase().includes(cleanKeyword)) {
        score += 5;
      }
      if (item.description.toLowerCase().includes(cleanKeyword)) {
        score += 3;
      }
      if (item.tags?.some(tag => tag.toLowerCase().includes(cleanKeyword))) {
        score += 4;
      }
      if (item.sub_category?.toLowerCase().includes(cleanKeyword)) {
        score += 3;
      }
    });

    if (preferences && preferences.length > 0) {
      preferences.forEach(pref => {
        if (itemText.includes(pref)) {
          score += 2;
        }
      });
    }

    const category = categories.find(c => c.id === item.category_id);
    if (category) {
      const categoryText = category.name.toLowerCase();
      keywords.forEach(keyword => {
        if (categoryText.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
    }

    if (item.is_special_offer) {
      score += 1;
    }

    return { item, score };
  });

  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => item);
}

function getRandomItems(menuItems: MenuItem[], count: number = 2): MenuItem[] {
  const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateSocialResponse(sentiment: string, language: Language, menuItems: MenuItem[]): AssistantResponse {
  const responses = {
    fr: {
      greeting: [
        "Salut ! Super content de te voir ! Qu'est-ce qui te ferait plaisir aujourd'hui ?",
        "Hey ! Bienvenue ! Tu as déjà une idée ou tu veux que je te conseille quelque chose ?",
        "Bonjour ! Installe-toi bien, je suis là pour toi. Une envie particulière ?"
      ],
      thanks: [
        "Avec plaisir ! C'est toujours un plaisir de vous servir. Autre chose qui vous tente ?",
        "De rien, c'est normal ! Je suis là pour ça. Besoin d'autre chose ?",
        "Ravi de t'aider ! N'hésite pas si tu as besoin de quoi que ce soit d'autre."
      ],
      compliment: [
        "Oh merci, c'est gentil ! J'adore mon travail ici au Parapli Bar. Bon, on se prend quelque chose de bon ?",
        "Tu es adorable ! Ça me fait super plaisir. Alors, qu'est-ce qui te ferait envie ?",
        "Merci beaucoup ! C'est un vrai plaisir de discuter avec toi. Je peux te proposer quelque chose ?"
      ],
      smallTalk: [
        "Je vais très bien, merci de demander ! Je suis ton serveur virtuel, et j'adore ce que je fais. Et toi, comment tu te sens ? Une petite soif ?",
        "Moi ? Je suis ton assistant personnel ici au Parapli Bar, et je suis toujours de bonne humeur ! Et toi, ça roule ? Qu'est-ce qui te ferait plaisir ?",
        "Tout va super bien ! Je suis là pour rendre ton expérience géniale. Alors, on se fait plaisir avec quoi aujourd'hui ?"
      ]
    },
    en: {
      greeting: [
        "Hey! So happy to see you! What would you like today?",
        "Hi there! Welcome! Got something in mind or want some suggestions?",
        "Hello! Make yourself comfortable, I'm here for you. Any particular cravings?"
      ],
      thanks: [
        "My pleasure! It's always a joy to serve you. Anything else catching your eye?",
        "You're welcome! That's what I'm here for. Need anything else?",
        "Happy to help! Don't hesitate if you need anything else."
      ],
      compliment: [
        "Oh thank you, that's so nice! I love my job here at Parapli Bar. So, shall we get you something good?",
        "You're sweet! That really makes my day. So, what sounds good to you?",
        "Thank you so much! It's a real pleasure chatting with you. Can I suggest something?"
      ],
      smallTalk: [
        "I'm doing great, thanks for asking! I'm your virtual server, and I love what I do. How about you? Thirsty?",
        "Me? I'm your personal assistant here at Parapli Bar, and I'm always in a good mood! How are you doing? What can I get you?",
        "Everything's fantastic! I'm here to make your experience amazing. So, what are we having today?"
      ]
    },
    ht: {
      greeting: [
        "Salut! Kontan wè w! Kisa w ta renmen jodi a?",
        "Hey! Byenveni! Èske w gen yon lide oswa w vle sijesyon?",
        "Bonjou! Enstale w byen, mwen la pou ou. Yon anvി patikilye?"
      ],
      thanks: [
        "Ak plezi! Se toujou yon plezi pou sèvi w. Lòt bagay ki tante w?",
        "Pa gen pwoblèm! Se pou sa mwen la. Bezwen lòt bagay?",
        "Kontan ede w! Pa ezite si w bezwen nenpòt lòt bagay."
      ],
      compliment: [
        "Oh mèsi, sa janti! Mwen renmen travay mwen isit la nan Parapli Bar. Bon, nou pran yon bagay bon?",
        "Ou janti! Sa fè m plezi. Alò, kisa w ta renmen?",
        "Mèsi anpil! Se yon vre plezi pale avèk ou. Èske mwen ka pwopoze w yon bagay?"
      ],
      smallTalk: [
        "Mwen byen nèt, mèsi pou ou mande! Mwen se sèvè vityèl ou, e mwen renmen sa m ap fè. E ou menm, kijan w santi w? Yon ti swaf?",
        "Mwen? Mwen se asistan pèsonèl ou isit la nan Parapli Bar, e mwen toujou gen bon imè! E ou menm, tout bagay anfòm? Kisa w ta renmen?",
        "Tout bagay anfòm! Mwen la pou fè eksperyans ou bèl. Alò, kisa n ap pran jodi a?"
      ]
    }
  };

  const langResponses = responses[language];
  const responseArray = langResponses[sentiment] || langResponses['greeting'];
  const message = responseArray[Math.floor(Math.random() * responseArray.length)];

  return {
    message,
    metadata: { intent: 'social', sentiment }
  };
}

function generateHesitationResponse(language: Language, menuItems: MenuItem[], categories: Category[]): AssistantResponse {
  const suggestions = getRandomItems(menuItems, 2);

  const responses = {
    fr: [
      `Pas de stress, je suis là pour t'aider ! Laisse-moi te proposer deux petites pépites qu'on adore ici :`,
      `Je comprends, c'est dur de choisir avec tout ce qu'on a ! Tiens, regarde ces deux-là, ils sont super populaires :`,
      `Aucun souci ! Tu veux que je te guide ? Voilà deux suggestions qui marchent toujours bien :`
    ],
    en: [
      `No worries, I'm here to help! Let me suggest two gems we love here:`,
      `I understand, it's tough to choose with everything we have! Check out these two, they're super popular:`,
      `No problem! Want me to guide you? Here are two suggestions that always work:`
    ],
    ht: [
      `Pa gen pwoblèm, mwen la pou ede w! Kite m pwopoze w de bagay nou renmen isit la:`,
      `Mwen konprann, li difisil pou chwazi ak tout sa nou genyen! Gade de sa yo, yo trè popilè:`,
      `Okenn pwoblèm! Èske w vle m gide w? Men de sijesyon ki toujou mache byen:`
    ]
  };

  const intro = responses[language][Math.floor(Math.random() * responses[language].length)];

  const itemsList = suggestions.map((item, i) => {
    const category = categories.find(c => c.id === item.category_id);
    return `\n${i + 1}. ${item.name} (${item.price} HTG) - ${item.description}`;
  }).join('');

  const followUp = language === 'fr'
    ? '\n\nL\'un des deux te tente ? Ou tu préfères que je te montre autre chose ?'
    : language === 'en'
    ? '\n\nDo either of these sound good? Or would you like to see something else?'
    : '\n\nYoun nan de sa yo tante w? Oswa w pito mwen montre w lòt bagay?';

  return {
    message: `${intro}${itemsList}${followUp}`,
    suggestions,
    metadata: { intent: 'hesitation' }
  };
}

function formatNaturalResponse(
  items: MenuItem[],
  intent: string,
  language: Language,
  categories: Category[],
  preferences?: string[]
): string {
  if (items.length === 0) {
    const fallbackSuggestions = {
      fr: "Hmm, je n'ai pas trouvé exactement ce que tu cherches dans notre menu actuel... Mais dis-moi, tu as plutôt envie de quelque chose de sucré, salé, ou rafraîchissant ? Je vais te dénicher quelque chose de sympa !",
      en: "Hmm, I didn't find exactly what you're looking for in our current menu... But tell me, are you more in the mood for something sweet, savory, or refreshing? I'll find you something nice!",
      ht: "Hmm, mwen pa jwenn egzakteman sa w ap chèche nan meni aktyèl nou an... Men di m, èske w pito gen anvי pou yon bagay dous, sale, oswa rafrechisan? M ap jwenn yon bagay bon pou ou!"
    };
    return fallbackSuggestions[language];
  }

  const intros = {
    fr: [
      `Ah, j'ai ce qu'il te faut ! Regarde ${items.length === 1 ? 'ça' : 'ces petites merveilles'} :`,
      `Parfait ! J'ai exactement ce qu'il te faut. ${items.length === 1 ? 'Voilà' : 'Voici'} ${items.length === 1 ? 'ma suggestion' : 'mes suggestions'} :`,
      `Super ! Je te recommande ${items.length === 1 ? 'ce produit' : 'ces produits'} les yeux fermés :`,
      `Alors là, tu vas adorer ! ${items.length === 1 ? 'Regarde ce petit bijou' : 'Check ces petits bijoux'} :`,
    ],
    en: [
      `Ah, I've got just what you need! Check ${items.length === 1 ? 'this out' : 'these beauties out'}:`,
      `Perfect! I have exactly what you need. ${items.length === 1 ? 'Here\'s' : 'Here are'} ${items.length === 1 ? 'my suggestion' : 'my suggestions'}:`,
      `Great! I recommend ${items.length === 1 ? 'this' : 'these'} with my eyes closed:`,
      `Oh, you're gonna love ${items.length === 1 ? 'this' : 'these'}! ${items.length === 1 ? 'Check out this gem' : 'Check out these gems'}:`,
    ],
    ht: [
      `Ah, mwen gen sa w bezwen! Gade ${items.length === 1 ? 'sa' : 'bèl bagay sa yo'}:`,
      `Pafè! Mwen gen egzakteman sa w bezwen. ${items.length === 1 ? 'Men' : 'Men'} sijesyon ${items.length === 1 ? 'mwen' : 'yo'}:`,
      `Bon! Mwen rekòmande ${items.length === 1 ? 'pwodui sa a' : 'pwodui sa yo'} san ezitasyon:`,
      `Alò la, w ap renmen! ${items.length === 1 ? 'Gade bijou sa' : 'Gade bijou sa yo'}:`,
    ]
  };

  const intro = intros[language][Math.floor(Math.random() * intros[language].length)];

  const itemsList = items.map((item, i) => {
    const category = categories.find(c => c.id === item.category_id);
    const specialNote = item.is_special_offer ? ` - PROMO !` : '';
    return `\n${i + 1}. ${item.name} (${item.price} HTG)${specialNote}\n   ${item.description}`;
  }).join('\n');

  const followUps = {
    fr: [
      '\n\nÇa te tente ? Je peux t\'en dire plus si tu veux !',
      '\n\nQu\'est-ce que tu en penses ? Ça pourrait te plaire ?',
      '\n\nTu veux essayer un de ceux-là ? Ou je te montre autre chose ?',
      '\n\nAlors, ça te dit ? N\'hésite pas si tu veux plus de détails !'
    ],
    en: [
      '\n\nSound good? I can tell you more if you want!',
      '\n\nWhat do you think? Could this work for you?',
      '\n\nWant to try one of these? Or should I show you something else?',
      '\n\nSo, interested? Don\'t hesitate if you want more details!'
    ],
    ht: [
      '\n\nSa tante w? Mwen ka di w plis si w vle!',
      '\n\nKisa w panse? Èske sa ka bon pou ou?',
      '\n\nÈske w vle eseye youn nan sa yo? Oswa mwen montre w lòt bagay?',
      '\n\nAlò, sa enterese w? Pa ezite si w vle plis detay!'
    ]
  };

  const followUp = followUps[language][Math.floor(Math.random() * followUps[language].length)];

  return `${intro}${itemsList}${followUp}`;
}

function formatOrderResponse(items: MenuItem[], language: Language, categories: Category[]): string {
  if (items.length === 0) {
    const responses = {
      fr: "Avec plaisir ! Dis-moi juste ce que tu veux exactement, et je note tout. Tu peux me donner le nom du produit ou me décrire ce que tu cherches !",
      en: "With pleasure! Just tell me exactly what you want, and I'll write it all down. You can give me the product name or describe what you're looking for!",
      ht: "Ak plezi! Jis di m egzakteman sa w vle, e m ap note tout. Ou ka ban mwen non pwodui a oswa dekri sa w ap chèche!"
    };
    return responses[language];
  }

  const itemsList = items.map((item, i) =>
    `  ${i + 1}. ${item.name} - ${item.price} HTG`
  ).join('\n');

  const total = items.reduce((sum, item) => sum + Number(item.price), 0);

  const responses = {
    fr: `Parfait ! Alors je note :\n\n${itemsList}\n\nTotal : ${total} HTG\n\nTa commande sera prête dans 10-15 minutes max. Je rajoute quelque chose avec ça ?`,
    en: `Perfect! So I'm noting:\n\n${itemsList}\n\nTotal: ${total} HTG\n\nYour order will be ready in 10-15 minutes max. Should I add anything else?`,
    ht: `Pafè! Alò m ap note:\n\n${itemsList}\n\nTotal: ${total} HTG\n\nKòmand ou ap pare nan 10-15 minit maksimòm. Èske m ajoute lòt bagay ak sa?`
  };

  return responses[language];
}

function formatInfoResponse(item: MenuItem, language: Language, category?: Category): string {
  const tagsText = item.tags && item.tags.length > 0
    ? item.tags.map(tag => `  • ${tag}`).join('\n')
    : '';

  const responses = {
    fr: `Ah oui, le ${item.name} ! Excellent choix.\n\n${item.description}\n\nPrix : ${item.price} HTG${item.original_price ? ` (avant ${item.original_price} HTG - belle promo !)` : ''}\nCatégorie : ${category?.name || 'Non spécifié'}${item.sub_category ? `\nType : ${item.sub_category}` : ''}${tagsText ? `\n\nCaractéristiques :\n${tagsText}` : ''}\n\nTu veux le commander ? Ou tu as d'autres questions ?`,
    en: `Ah yes, the ${item.name}! Excellent choice.\n\n${item.description}\n\nPrice: ${item.price} HTG${item.original_price ? ` (was ${item.original_price} HTG - great deal!)` : ''}\nCategory: ${category?.name || 'Not specified'}${item.sub_category ? `\nType: ${item.sub_category}` : ''}${tagsText ? `\n\nFeatures:\n${tagsText}` : ''}\n\nWant to order it? Or do you have other questions?`,
    ht: `Ah wi, ${item.name} la! Bon chwa.\n\n${item.description}\n\nPri: ${item.price} HTG${item.original_price ? ` (te ${item.original_price} HTG - bon pwomosyon!)` : ''}\nKategori: ${category?.name || 'Pa presize'}${item.sub_category ? `\nTip: ${item.sub_category}` : ''}${tagsText ? `\n\nKarakteristik:\n${tagsText}` : ''}\n\nÈske w vle kòmande l? Oswa w gen lòt kesyon?`
  };

  return responses[language];
}

export async function processUserMessage(
  conversationId: string,
  message: string,
  context: ConversationContext
): Promise<AssistantResponse> {
  const { menuItems, categories, language } = context;

  await saveMessage(conversationId, 'user', message, language);

  const analyzeResult = analyzeUserIntent(message, language);
  const { intent, keywords, sentiment } = analyzeResult;

  let response: AssistantResponse;

  switch (intent) {
    case 'social': {
      response = generateSocialResponse(sentiment || 'greeting', language, menuItems);
      break;
    }

    case 'hesitation': {
      response = generateHesitationResponse(language, menuItems, categories);
      break;
    }

    case 'recommendation':
    case 'browse':
    case 'general': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories, analyzeResult.preferences);
      const responseMessage = formatNaturalResponse(relevantItems, intent, language, categories, analyzeResult.preferences);

      response = {
        message: responseMessage,
        suggestions: relevantItems.length > 0 ? relevantItems : getRandomItems(menuItems, 2),
        metadata: { intent, keywords, preferences: analyzeResult.preferences }
      };
      break;
    }

    case 'order': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories, analyzeResult.preferences);
      const responseMessage = formatOrderResponse(relevantItems, language, categories);

      response = {
        message: responseMessage,
        suggestions: relevantItems,
        metadata: { intent: 'order', items: relevantItems.map(i => ({ id: i.id, name: i.name, price: i.price })) }
      };
      break;
    }

    case 'info': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories, analyzeResult.preferences);

      if (relevantItems.length > 0) {
        const item = relevantItems[0];
        const category = categories.find(c => c.id === item.category_id);
        const responseMessage = formatInfoResponse(item, language, category);

        response = {
          message: responseMessage,
          suggestions: [item],
          metadata: { intent: 'info', itemId: item.id }
        };
      } else {
        const fallback = {
          fr: "Hmm, je ne suis pas sûr de quel produit tu parles... Tu peux me donner plus de détails ? Le nom exact ou me dire ce que tu cherches ?",
          en: "Hmm, I'm not sure which product you're talking about... Can you give me more details? The exact name or tell me what you're looking for?",
          ht: "Hmm, mwen pa si ki pwodui w ap pale... Èske w ka ban m plis detay? Non egzak la oswa di m sa w ap chèche?"
        };

        response = {
          message: fallback[language],
          suggestions: getRandomItems(menuItems, 2),
          metadata: { intent: 'info' }
        };
      }
      break;
    }

    default: {
      const fallback = {
        fr: "Désolé, je n'ai pas bien compris ce que tu cherches... Tu veux voir le menu ? Ou je peux te faire des suggestions si tu me dis ce qui te ferait plaisir !",
        en: "Sorry, I didn't quite understand what you're looking for... Want to see the menu? Or I can make suggestions if you tell me what you'd like!",
        ht: "Padon, mwen pa byen konprann sa w ap chèche... Èske w vle wè meni an? Oswa mwen ka fè sijesyon si w di m sa w ta renmen!"
      };

      response = {
        message: fallback[language],
        suggestions: getRandomItems(menuItems, 2),
        metadata: { intent: 'unknown' }
      };
    }
  }

  await saveMessage(conversationId, 'assistant', response.message, language, response.metadata);

  return response;
}
