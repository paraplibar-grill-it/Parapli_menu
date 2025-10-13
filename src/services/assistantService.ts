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

const translations = {
  greeting: {
    fr: "Bonjour ! Je suis votre assistant virtuel du Parapli Bar. Comment puis-je vous aider aujourd'hui ? Je peux vous recommander des boissons, expliquer notre menu, ou prendre votre commande.",
    en: "Hello! I'm your virtual assistant at Parapli Bar. How can I help you today? I can recommend drinks, explain our menu, or take your order.",
    ht: "Bonjou! Mwen se asistan vityèl ou nan Parapli Bar. Ki jan mwen ka ede w jodi a? Mwen ka rekòmande bwason, eksplike meni nou an, oswa pran kòmand ou."
  },
  error: {
    fr: "Désolé, je n'ai pas bien compris. Pouvez-vous reformuler votre question ?",
    en: "Sorry, I didn't quite understand. Could you rephrase your question?",
    ht: "Padon, mwen pa t byen konprann. Èske w ka repete kesyon w lan?"
  },
  noItems: {
    fr: "Désolé, nous n'avons pas de produits correspondant à votre recherche en ce moment.",
    en: "Sorry, we don't have any items matching your search at the moment.",
    ht: "Padon, nou pa gen okenn pwodui ki koresponn ak rechèch ou a pou kounye a."
  },
  orderConfirm: {
    fr: "Excellente sélection ! Votre commande sera prête dans environ 10-15 minutes. Y a-t-il autre chose que je puisse faire pour vous ?",
    en: "Excellent choice! Your order will be ready in about 10-15 minutes. Is there anything else I can do for you?",
    ht: "Ekselan chwa! Kòmand ou a ap pare nan anviwon 10-15 minit. Èske gen lòt bagay mwen ka fè pou ou?"
  }
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

  const greeting = translations.greeting[language];
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
} {
  const lowerMessage = message.toLowerCase();

  const intentPatterns = {
    recommendation: {
      fr: ['recommand', 'suggest', 'conseil', 'proposer', 'bon', 'meilleur', 'populaire', 'spécial'],
      en: ['recommend', 'suggest', 'advice', 'what', 'best', 'popular', 'special', 'good'],
      ht: ['rekòmande', 'sijere', 'bon', 'pi bon', 'popilè', 'espesyal']
    },
    order: {
      fr: ['commande', 'prend', 'veux', 'voudrais', 'commander', 'acheter'],
      en: ['order', 'take', 'want', 'would like', 'buy', 'get'],
      ht: ['kòmande', 'pran', 'vle', 'achte']
    },
    browse: {
      fr: ['menu', 'carte', 'voir', 'montrer', 'liste', 'catégorie'],
      en: ['menu', 'show', 'list', 'see', 'category', 'browse'],
      ht: ['meni', 'lis', 'wè', 'montre', 'kategori']
    },
    info: {
      fr: ['ingrédient', 'contient', 'c\'est quoi', 'qu\'est-ce', 'alcool', 'prix'],
      en: ['ingredient', 'contain', 'what is', 'alcohol', 'price', 'info'],
      ht: ['engredyan', 'gen', 'ki sa', 'alkòl', 'pri']
    }
  };

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const langPatterns = patterns[language] || patterns.en;
    if (langPatterns.some(pattern => lowerMessage.includes(pattern))) {
      const keywords = lowerMessage.split(/\s+/).filter(word => word.length > 3);
      return { intent, keywords };
    }
  }

  return { intent: 'general', keywords: lowerMessage.split(/\s+/) };
}

function findRelevantItems(
  keywords: string[],
  menuItems: MenuItem[],
  categories: Category[]
): MenuItem[] {
  const scoredItems = menuItems.map(item => {
    let score = 0;
    const itemText = `${item.name} ${item.description} ${item.tags?.join(' ')} ${item.sub_category || ''}`.toLowerCase();

    keywords.forEach(keyword => {
      if (itemText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });

    const category = categories.find(c => c.id === item.category_id);
    if (category) {
      const categoryText = category.name.toLowerCase();
      keywords.forEach(keyword => {
        if (categoryText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
    }

    return { item, score };
  });

  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => item);
}

function formatItemsResponse(
  items: MenuItem[],
  intent: string,
  language: Language,
  categories: Category[]
): string {
  if (items.length === 0) {
    return translations.noItems[language];
  }

  const responses = {
    recommendation: {
      fr: (count: number) => `Je vous recommande ${count === 1 ? 'ce produit' : 'ces produits'} :`,
      en: (count: number) => `I recommend ${count === 1 ? 'this item' : 'these items'}:`,
      ht: (count: number) => `Mwen rekòmande ${count === 1 ? 'pwodui sa a' : 'pwodui sa yo'}:`
    },
    browse: {
      fr: (count: number) => `Voici ${count === 1 ? 'le produit trouvé' : `${count} produits trouvés`} :`,
      en: (count: number) => `Here ${count === 1 ? 'is the item found' : `are ${count} items found`}:`,
      ht: (count: number) => `Men ${count === 1 ? 'pwodui a' : `${count} pwodui`} jwenn:`
    },
    general: {
      fr: (count: number) => `J'ai trouvé ${count === 1 ? 'ce produit' : `${count} produits`} pour vous :`,
      en: (count: number) => `I found ${count === 1 ? 'this item' : `${count} items`} for you:`,
      ht: (count: number) => `Mwen jwenn ${count === 1 ? 'pwodui sa a' : `${count} pwodui`} pou ou:`
    }
  };

  const responseKey = intent === 'recommendation' || intent === 'browse' ? intent : 'general';
  const intro = responses[responseKey][language](items.length);

  const itemsList = items.map(item => {
    const category = categories.find(c => c.id === item.category_id);
    return `\n• ${item.name} - ${item.price} HTG${category ? ` (${category.name})` : ''}\n  ${item.description}`;
  }).join('\n');

  return `${intro}\n${itemsList}`;
}

export async function processUserMessage(
  conversationId: string,
  message: string,
  context: ConversationContext
): Promise<AssistantResponse> {
  const { menuItems, categories, language } = context;

  await saveMessage(conversationId, 'user', message, language);

  const { intent, keywords } = analyzeUserIntent(message, language);

  let response: AssistantResponse;

  switch (intent) {
    case 'recommendation':
    case 'browse':
    case 'general': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories);
      const responseMessage = formatItemsResponse(relevantItems, intent, language, categories);

      response = {
        message: responseMessage,
        suggestions: relevantItems,
        metadata: { intent, keywords }
      };
      break;
    }

    case 'order': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories);
      let responseMessage = '';

      if (relevantItems.length > 0) {
        responseMessage = translations.orderConfirm[language];
      } else {
        const clarification = {
          fr: "Je serais ravi de prendre votre commande ! Pouvez-vous me dire précisément ce que vous souhaitez commander ?",
          en: "I'd be happy to take your order! Can you tell me exactly what you'd like to order?",
          ht: "Mwen ta kontan pran kòmand ou! Èske w ka di m egzakteman sa w vle kòmande?"
        };
        responseMessage = clarification[language];
      }

      response = {
        message: responseMessage,
        suggestions: relevantItems,
        metadata: { intent: 'order', items: relevantItems.map(i => i.id) }
      };
      break;
    }

    case 'info': {
      const relevantItems = findRelevantItems(keywords, menuItems, categories);

      if (relevantItems.length > 0) {
        const item = relevantItems[0];
        const category = categories.find(c => c.id === item.category_id);

        const infoResponse = {
          fr: `${item.name} : ${item.description}\nPrix : ${item.price} HTG${category ? `\nCatégorie : ${category.name}` : ''}${item.tags?.length ? `\nTags : ${item.tags.join(', ')}` : ''}`,
          en: `${item.name}: ${item.description}\nPrice: ${item.price} HTG${category ? `\nCategory: ${category.name}` : ''}${item.tags?.length ? `\nTags: ${item.tags.join(', ')}` : ''}`,
          ht: `${item.name}: ${item.description}\nPri: ${item.price} HTG${category ? `\nKategori: ${category.name}` : ''}${item.tags?.length ? `\nTags: ${item.tags.join(', ')}` : ''}`
        };

        response = {
          message: infoResponse[language],
          suggestions: [item],
          metadata: { intent: 'info', itemId: item.id }
        };
      } else {
        response = {
          message: translations.noItems[language],
          metadata: { intent: 'info' }
        };
      }
      break;
    }

    default: {
      response = {
        message: translations.error[language],
        metadata: { intent: 'unknown' }
      };
    }
  }

  await saveMessage(conversationId, 'assistant', response.message, language, response.metadata);

  return response;
}
