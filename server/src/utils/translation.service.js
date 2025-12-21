import axios from "axios";

/**
 * Simple language detection based on character analysis
 * @param {string} text - Text to analyze
 * @returns {"ar" | "en"} - Detected language
 */
function detectLanguage(text) {
  if (!text || typeof text !== "string") return "en";
  
  // Arabic Unicode range: \u0600-\u06FF
  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = (text.match(/[a-zA-Z\u0600-\u06FF]/g) || []).length;
  
  if (totalLetters === 0) return "en";
  
  // If more than 30% Arabic characters, consider it Arabic
  return (arabicCount / totalLetters) > 0.3 ? "ar" : "en";
}

/**
 * Translate text using Google Translate (free, unofficial API)
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language (ar/en)
 * @param {string} targetLang - Target language (ar/en)
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, sourceLang, targetLang) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    return "";
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    // Google returns nested arrays, extract translated text
    const data = response.data;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map(item => item[0]).join("");
    }
    
    return text; // Fallback to original
  } catch (error) {
    console.error("Translation error:", error.message);
    return text; // Return original on error
  }
}

/**
 * Auto-translate restaurant settings
 * Detects input language and translates to the other language
 * @param {Object} data - Restaurant update data
 * @returns {Promise<Object>} - Data with translated fields added
 */
export async function translateRestaurantSettings(data) {
  const result = { ...data };

  try {
    // Translate description
    if (data.description) {
      const lang = detectLanguage(data.description);
      if (lang === "ar") {
        result.descriptionAr = data.description;
        result.description = await translateText(data.description, "ar", "en");
      } else {
        result.description = data.description;
        result.descriptionAr = await translateText(data.description, "en", "ar");
      }
    }

    // Translate address
    if (data.address) {
      const lang = detectLanguage(data.address);
      if (lang === "ar") {
        result.addressAr = data.address;
        result.address = await translateText(data.address, "ar", "en");
      } else {
        result.address = data.address;
        result.addressAr = await translateText(data.address, "en", "ar");
      }
    }

    // Translate about section
    if (data.about) {
      const about = { ...data.about };
      
      if (about.title) {
        const lang = detectLanguage(about.title);
        if (lang === "ar") {
          about.titleAr = about.title;
          about.title = await translateText(about.title, "ar", "en");
        } else {
          about.titleAr = await translateText(about.title, "en", "ar");
        }
      }
      
      if (about.content) {
        const lang = detectLanguage(about.content);
        if (lang === "ar") {
          about.contentAr = about.content;
          about.content = await translateText(about.content, "ar", "en");
        } else {
          about.contentAr = await translateText(about.content, "en", "ar");
        }
      }
      
      result.about = about;
    }

    // Translate policies
    if (data.policies) {
      const policies = { ...data.policies };
      
      if (policies.terms) {
        const lang = detectLanguage(policies.terms);
        if (lang === "ar") {
          policies.termsAr = policies.terms;
          policies.terms = await translateText(policies.terms, "ar", "en");
        } else {
          policies.termsAr = await translateText(policies.terms, "en", "ar");
        }
      }
      
      if (policies.privacy) {
        const lang = detectLanguage(policies.privacy);
        if (lang === "ar") {
          policies.privacyAr = policies.privacy;
          policies.privacy = await translateText(policies.privacy, "ar", "en");
        } else {
          policies.privacyAr = await translateText(policies.privacy, "en", "ar");
        }
      }
      
      result.policies = policies;
    }

    // Translate FAQs
    if (Array.isArray(data.faqs)) {
      const translatedFaqs = [];
      
      for (const faq of data.faqs) {
        const translatedFaq = { ...faq };
        
        if (faq.question) {
          const lang = detectLanguage(faq.question);
          if (lang === "ar") {
            translatedFaq.questionAr = faq.question;
            translatedFaq.question = await translateText(faq.question, "ar", "en");
          } else {
            translatedFaq.questionAr = await translateText(faq.question, "en", "ar");
          }
        }
        
        if (faq.answer) {
          const lang = detectLanguage(faq.answer);
          if (lang === "ar") {
            translatedFaq.answerAr = faq.answer;
            translatedFaq.answer = await translateText(faq.answer, "ar", "en");
          } else {
            translatedFaq.answerAr = await translateText(faq.answer, "en", "ar");
          }
        }
        
        translatedFaqs.push(translatedFaq);
      }
      
      result.faqs = translatedFaqs;
    }

  } catch (error) {
    console.error("Translation service error:", error);
    // Return original data on failure
    return data;
  }

  return result;
}
