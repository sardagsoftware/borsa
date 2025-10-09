/**
 * LOCALE PACKS
 *
 * Cultural and linguistic data for each supported locale
 */

import { LocalePack, Locale } from './types';

/**
 * Turkish locale pack
 */
const TR_PACK: LocalePack = {
  locale: 'tr',
  display_name: 'Türkçe',
  text_direction: 'ltr',
  greetings: {
    formal: ['Merhaba', 'İyi günler', 'Günaydın', 'İyi akşamlar'],
    informal: ['Selam', 'Merhaba', 'Nasılsın'],
  },
  farewells: {
    formal: ['Hoşça kalın', 'İyi günler', 'Güle güle'],
    informal: ['Görüşürüz', 'Hoşça kal', 'Güle güle'],
  },
  affirmatives: ['Evet', 'Tabii', 'Elbette', 'Kesinlikle'],
  negatives: ['Hayır', 'Maalesef', 'Olmaz'],
  apologies: ['Özür dilerim', 'Affedersiniz', 'Kusura bakmayın'],
  gratitude: ['Teşekkür ederim', 'Teşekkürler', 'Sağ olun'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true, // Siz vs. sen
    gender_neutral_preferred: false,
    date_format: 'DD.MM.YYYY',
    currency_symbol: '₺',
    number_format: 'comma', // 1.234,56
  },
};

/**
 * Azerbaijani locale pack
 */
const AZ_PACK: LocalePack = {
  locale: 'az',
  display_name: 'Azərbaycanca',
  text_direction: 'ltr',
  greetings: {
    formal: ['Salam', 'Sabahınız xeyir', 'Axşamınız xeyir'],
    informal: ['Salam', 'Necəsən'],
  },
  farewells: {
    formal: ['Sağ olun', 'Xudahafiz'],
    informal: ['Görüşənədək', 'Sağ ol'],
  },
  affirmatives: ['Bəli', 'Əlbəttə', 'Hə'],
  negatives: ['Xeyr', 'Yox'],
  apologies: ['Bağışlayın', 'Üzr istəyirəm'],
  gratitude: ['Təşəkkür edirəm', 'Sağ olun'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true,
    gender_neutral_preferred: false,
    date_format: 'DD.MM.YYYY',
    currency_symbol: '₼',
    number_format: 'comma',
  },
};

/**
 * Arabic (Qatar) locale pack
 */
const AR_QA_PACK: LocalePack = {
  locale: 'ar-qa',
  display_name: 'العربية (قطر)',
  text_direction: 'rtl',
  greetings: {
    formal: ['السلام عليكم', 'صباح الخير', 'مساء الخير', 'أهلاً وسهلاً'],
    informal: ['مرحبا', 'أهلا', 'هلا'],
  },
  farewells: {
    formal: ['مع السلامة', 'في أمان الله'],
    informal: ['باي', 'يلا باي'],
  },
  affirmatives: ['نعم', 'أكيد', 'طبعاً', 'إي والله'],
  negatives: ['لا', 'للأسف', 'ما ينفع'],
  apologies: ['آسف', 'عذراً', 'معذرة'],
  gratitude: ['شكراً', 'مشكور', 'يعطيك العافية'],
  cultural_rules: {
    formality_default: 'formal',
    use_honorifics: true,
    gender_neutral_preferred: true,
    date_format: 'DD/MM/YYYY',
    currency_symbol: 'ر.ق',
    number_format: 'dot', // Arabic numerals with dot separator
  },
};

/**
 * Arabic (Saudi Arabia) locale pack
 */
const AR_SA_PACK: LocalePack = {
  locale: 'ar-sa',
  display_name: 'العربية (السعودية)',
  text_direction: 'rtl',
  greetings: {
    formal: ['السلام عليكم ورحمة الله', 'صباح الخير', 'مساء الخير'],
    informal: ['مرحبا', 'هلا', 'هلا والله'],
  },
  farewells: {
    formal: ['في أمان الله', 'بالتوفيق'],
    informal: ['يلا باي', 'مع السلامة'],
  },
  affirmatives: ['نعم', 'طبعاً', 'أكيد', 'إي والله'],
  negatives: ['لا', 'للأسف', 'أبداً'],
  apologies: ['آسف', 'أعتذر', 'عفواً'],
  gratitude: ['شكراً', 'جزاك الله خيراً', 'مشكور'],
  cultural_rules: {
    formality_default: 'formal',
    use_honorifics: true,
    gender_neutral_preferred: true,
    date_format: 'DD/MM/YYYY',
    currency_symbol: 'ر.س',
    number_format: 'dot',
  },
};

/**
 * Greek locale pack
 */
const EL_PACK: LocalePack = {
  locale: 'el',
  display_name: 'Ελληνικά',
  text_direction: 'ltr',
  greetings: {
    formal: ['Γεια σας', 'Καλημέρα', 'Καλησπέρα'],
    informal: ['Γεια', 'Γεια σου', 'Τι κάνεις'],
  },
  farewells: {
    formal: ['Αντίο', 'Χαίρετε'],
    informal: ['Γεια', 'Αντίο', 'Τα λέμε'],
  },
  affirmatives: ['Ναι', 'Βεβαίως', 'Σίγουρα'],
  negatives: ['Όχι', 'Δυστυχώς'],
  apologies: ['Συγγνώμη', 'Λυπάμαι'],
  gratitude: ['Ευχαριστώ', 'Ευχαριστώ πολύ'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true,
    gender_neutral_preferred: false,
    date_format: 'DD/MM/YYYY',
    currency_symbol: '€',
    number_format: 'comma',
  },
};

/**
 * Russian locale pack
 */
const RU_PACK: LocalePack = {
  locale: 'ru',
  display_name: 'Русский',
  text_direction: 'ltr',
  greetings: {
    formal: ['Здравствуйте', 'Доброе утро', 'Добрый день', 'Добрый вечер'],
    informal: ['Привет', 'Здравствуй', 'Как дела'],
  },
  farewells: {
    formal: ['До свидания', 'Всего доброго'],
    informal: ['Пока', 'Увидимся'],
  },
  affirmatives: ['Да', 'Конечно', 'Разумеется'],
  negatives: ['Нет', 'К сожалению'],
  apologies: ['Извините', 'Простите', 'Прошу прощения'],
  gratitude: ['Спасибо', 'Большое спасибо', 'Благодарю'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true, // ты vs вы
    gender_neutral_preferred: false,
    date_format: 'DD.MM.YYYY',
    currency_symbol: '₽',
    number_format: 'space', // 1 234,56
  },
};

/**
 * German locale pack
 */
const DE_PACK: LocalePack = {
  locale: 'de',
  display_name: 'Deutsch',
  text_direction: 'ltr',
  greetings: {
    formal: ['Guten Tag', 'Guten Morgen', 'Guten Abend'],
    informal: ['Hallo', 'Hi', 'Grüß dich'],
  },
  farewells: {
    formal: ['Auf Wiedersehen', 'Guten Tag'],
    informal: ['Tschüss', 'Bis dann', 'Ciao'],
  },
  affirmatives: ['Ja', 'Natürlich', 'Selbstverständlich'],
  negatives: ['Nein', 'Leider nicht'],
  apologies: ['Entschuldigung', 'Es tut mir leid', 'Verzeihung'],
  gratitude: ['Danke', 'Vielen Dank', 'Danke schön'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true, // Sie vs du
    gender_neutral_preferred: true,
    date_format: 'DD.MM.YYYY',
    currency_symbol: '€',
    number_format: 'comma',
  },
};

/**
 * Dutch locale pack
 */
const NL_PACK: LocalePack = {
  locale: 'nl',
  display_name: 'Nederlands',
  text_direction: 'ltr',
  greetings: {
    formal: ['Goedendag', 'Goedemorgen', 'Goedenavond'],
    informal: ['Hallo', 'Hoi', 'Hey'],
  },
  farewells: {
    formal: ['Tot ziens', 'Prettige dag'],
    informal: ['Doei', 'Tot later', 'Dag'],
  },
  affirmatives: ['Ja', 'Natuurlijk', 'Zeker'],
  negatives: ['Nee', 'Helaas niet'],
  apologies: ['Sorry', 'Excuses', 'Het spijt me'],
  gratitude: ['Dank je', 'Bedankt', 'Dank u wel'],
  cultural_rules: {
    formality_default: 'friendly',
    use_honorifics: true, // u vs jij
    gender_neutral_preferred: true,
    date_format: 'DD-MM-YYYY',
    currency_symbol: '€',
    number_format: 'comma',
  },
};

/**
 * Bulgarian locale pack
 */
const BG_PACK: LocalePack = {
  locale: 'bg',
  display_name: 'Български',
  text_direction: 'ltr',
  greetings: {
    formal: ['Здравейте', 'Добър ден', 'Добро утро'],
    informal: ['Здрасти', 'Здравей', 'Как си'],
  },
  farewells: {
    formal: ['Довиждане', 'Приятен ден'],
    informal: ['Чао', 'До скоро'],
  },
  affirmatives: ['Да', 'Разбира се', 'Естествено'],
  negatives: ['Не', 'За съжаление'],
  apologies: ['Извинете', 'Съжалявам', 'Извинявайте'],
  gratitude: ['Благодаря', 'Мерси', 'Благодаря ви'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: true,
    gender_neutral_preferred: false,
    date_format: 'DD.MM.YYYY',
    currency_symbol: 'лв',
    number_format: 'comma',
  },
};

/**
 * English locale pack
 */
const EN_PACK: LocalePack = {
  locale: 'en',
  display_name: 'English',
  text_direction: 'ltr',
  greetings: {
    formal: ['Hello', 'Good morning', 'Good afternoon', 'Good evening'],
    informal: ['Hi', 'Hey', 'Hello there'],
  },
  farewells: {
    formal: ['Goodbye', 'Have a nice day', 'Take care'],
    informal: ['Bye', 'See you', 'Later'],
  },
  affirmatives: ['Yes', 'Certainly', 'Of course', 'Sure'],
  negatives: ['No', 'Unfortunately not', 'I\'m afraid not'],
  apologies: ['I\'m sorry', 'My apologies', 'Excuse me'],
  gratitude: ['Thank you', 'Thanks', 'Much appreciated'],
  cultural_rules: {
    formality_default: 'professional',
    use_honorifics: false,
    gender_neutral_preferred: true,
    date_format: 'MM/DD/YYYY',
    currency_symbol: '$',
    number_format: 'dot', // 1,234.56
  },
};

/**
 * Locale pack registry
 */
export const LOCALE_PACKS: Record<Locale, LocalePack> = {
  tr: TR_PACK,
  az: AZ_PACK,
  'ar-qa': AR_QA_PACK,
  'ar-sa': AR_SA_PACK,
  el: EL_PACK,
  ru: RU_PACK,
  de: DE_PACK,
  nl: NL_PACK,
  bg: BG_PACK,
  en: EN_PACK,
};

/**
 * Get locale pack by locale code
 */
export function getLocalePack(locale: Locale): LocalePack {
  return LOCALE_PACKS[locale];
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): Locale[] {
  return Object.keys(LOCALE_PACKS) as Locale[];
}
