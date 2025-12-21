import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Arabic translation
    restaurantNameAr: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },
    
    // Arabic translation
    descriptionAr: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
    
    // Arabic translation
    addressAr: {
      type: String,
      default: "",
    },

    branding: {
      primaryColor: {
        type: String,
        default: "#2563eb", // fallback
      },
      secondaryColor: {
        type: String,
        default: "#e27e36",
      },
      logoUrl: {
        type: String,
        default: "",
      },
      menuImage: {
        type: String,
        default: "",
      },
    },

    notifications: {
      newOrder: { type: Boolean, default: true },
      review: { type: Boolean, default: true },
      dailySales: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: false },
    },


    about: {
      title: { type: String, default: "About Us" },
      titleAr: { type: String, default: "من نحن" },  // Arabic translation
      content: { type: String, default: "" },
      contentAr: { type: String, default: "" },      // Arabic translation
    },

    support: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    // FAQs for Support page with Arabic translations
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          questionAr: { type: String, default: "" },  // Arabic translation
          answer: { type: String, required: true },
          answerAr: { type: String, default: "" },    // Arabic translation
        },
      ],
      default: [
        {
          question: "How do I place an order?",
          questionAr: "كيف أقوم بتقديم طلب؟",
          answer: "Browse the menu, add items to your cart, and proceed to checkout. You can choose dine‑in, pickup, or delivery depending on availability.",
          answerAr: "تصفح القائمة، أضف العناصر إلى سلة التسوق، ثم انتقل إلى الدفع. يمكنك اختيار تناول الطعام في المطعم أو الاستلام أو التوصيل حسب التوفر.",
        },
        {
          question: "What payment methods are accepted?",
          questionAr: "ما هي طرق الدفع المقبولة؟",
          answer: "We accept major cards and online payments. Cash is accepted for in‑store orders.",
          answerAr: "نقبل البطاقات الرئيسية والدفع الإلكتروني. النقد مقبول للطلبات داخل المطعم.",
        },
        {
          question: "Can I modify or cancel my order?",
          questionAr: "هل يمكنني تعديل أو إلغاء طلبي؟",
          answer: "You can modify or cancel before the kitchen starts preparing. Contact support for assistance.",
          answerAr: "يمكنك التعديل أو الإلغاء قبل أن يبدأ المطبخ بالتحضير. تواصل مع الدعم للمساعدة.",
        },
        {
          question: "Do you offer rewards?",
          questionAr: "هل تقدمون برنامج مكافآت؟",
          answer: "Earn points on eligible purchases and redeem them in the Rewards section.",
          answerAr: "اكسب نقاطًا على المشتريات المؤهلة واستبدلها في قسم المكافآت.",
        },
      ],
    },

    // Policies: Terms & Privacy with Arabic translations
    policies: {
      terms: { type: String, default: "By using our service, you agree to our terms including ordering policies, payment, cancellations, and responsible use of the platform." },
      termsAr: { type: String, default: "باستخدامك لخدمتنا، فإنك توافق على شروطنا بما في ذلك سياسات الطلب والدفع والإلغاء والاستخدام المسؤول للمنصة." },
      privacy: { type: String, default: "We respect your privacy. We collect only necessary information to provide service, do not sell personal data, and use industry-standard security. You can request data access or deletion anytime." },
      privacyAr: { type: String, default: "نحن نحترم خصوصيتك. نجمع فقط المعلومات الضرورية لتقديم الخدمة، ولا نبيع البيانات الشخصية، ونستخدم أمانًا بمعايير الصناعة. يمكنك طلب الوصول إلى البيانات أو حذفها في أي وقت." },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
