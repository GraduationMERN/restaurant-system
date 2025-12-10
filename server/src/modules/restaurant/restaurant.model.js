import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
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
    },

    notifications: {
      newOrder: { type: Boolean, default: true },
      review: { type: Boolean, default: true },
      dailySales: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: false },
    },


    about: {
      title: { type: String, default: "About Us" },
      content: { type: String, default: "" },
    },

    support: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    // FAQs for Support page
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [
        {
          question: "How do I place an order?",
          answer: "Browse the menu, add items to your cart, and proceed to checkout. You can choose dine‑in, pickup, or delivery depending on availability.",
        },
        {
          question: "What payment methods are accepted?",
          answer: "We accept major cards and online payments. Cash is accepted for in‑store orders.",
        },
        {
          question: "Can I modify or cancel my order?",
          answer: "You can modify or cancel before the kitchen starts preparing. Contact support for assistance.",
        },
        {
          question: "Do you offer rewards?",
          answer: "Earn points on eligible purchases and redeem them in the Rewards section.",
        },
      ],
    },

    // Policies: Terms & Privacy
    policies: {
      terms: { type: String, default: "By using our service, you agree to our terms including ordering policies, payment, cancellations, and responsible use of the platform." },
      privacy: { type: String, default: "We respect your privacy. We collect only necessary information to provide service, do not sell personal data, and use industry-standard security. You can request data access or deletion anytime." },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
