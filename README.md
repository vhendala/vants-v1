# Vants

**Your investments. Your payments. One global account.**

Vants is a mobile financial app for Latin America. It gives people a single place to invest in high-yield products and pay real-world bills — electricity, internet, phone, rent — directly from those investments.

## ⚠️ The Problem

People in Latin America face a daily financial dilemma:
- **Traditional Banks** offer great UX but terrible yields (< 2%), failing to protect money against inflation.
- **Investment & Crypto Apps** offer better yields but terrible friction. Your money is locked. To spend it, you have to withdraw, wait, and transfer. Friction kills the experience.

The key insight: instead of cashing out large sums in advance and guessing how much to keep and how much to spend, Vants lets you keep everything invested and earning. When it’s time to pay a bill, the app intelligently converts just enough to cover the payment and settles the bill instantly via local rails (SPEI in Mexico, Pix in Brazil, CBU in Argentina). Your money stays invested and earning until the second you need it.

## 🔄 The Core Loop

The entire product is built around three words:

**Invest → Earn → Pay**

Users deposit into yield-bearing products. Those products earn returns continuously. When a bill arrives, the app intelligently converts just enough to cover the payment and settles it. The rest keeps compounding. No manual steps, no guessing, no wasted time.

## 🚫 What Vants is NOT

- **Not a crypto exchange:** Users don’t come here to trade.
- **Not a DeFi dashboard:** There are no protocol names, no wallet addresses, no gas fees visible.
- **Not a crypto wallet:** No seed phrases, no blockchain jargon.

Vants is a financial app. It competes with Nubank, Revolut, and Mercado Pago — not with Binance or MetaMask. The technology is invisible.

## 🧠 Brand Personality

- **Confident, not arrogant:** We know our product is powerful but we don’t show off. Clean, understated elegance.
- **Warm, not cold:** Financial apps can feel clinical. Vants should feel welcoming and human — like a trusted friend who’s great with money.
- **Smart, not complicated:** The intelligence is in the system, not in the interface. The UI should be so simple it feels obvious.
- **Latin American, not generic:** We’re building for Mexico, Brazil, Argentina. The design should resonate culturally — not be a Silicon Valley clone.

## 🎯 The Market & The User

Built for 25–40 year old urban professionals in Latin America. They already use Nubank, Mercado Pago, or Revolut daily. They’re financially aware — they want better returns than banks offer — but they don’t want to become finance experts. They want their money to grow **AND** be usable without friction.

## 🎨 Visual Direction

- **Design Style:** Commercial. Financial. Modern. Premium.
- **Mood:** Trust, Growth, and Simplicity.
- No dashboard overload. We're not TradingView.
- No crypto clichés (no blockchain cubes, neon glow, circuit patterns, or coin illustrations).

> *"The goal is not to design a crypto app. The goal is to design the best financial app in Latin America — one where your money never stops working for you."*

## ⚙️ Invisible Technology (The Stack)

The intelligence is in the system, not in the interface. We rely on a modern, robust, and fast architecture to ensure instant settlements and secure compounding, keeping the complexity completely hidden from the user.

- **Frontend (Web/Mobile):** Built with **Next.js 15** and **React 19**, styled elegantly with **Tailwind CSS v4** and accessible components via **Radix UI**. The interface is responsive, snappy, and clutter-free.
- **Backend:** A highly reliable **Node.js** and **Express** service, using **Prisma** as the ORM to communicate with a **PostgreSQL** database. It handles the heavy lifting of user portfolios and logic.
- **Authentication:** Powered by **Privy**, enabling seamless, non-custodial onboarding without the friction of seed phrases or complicated wallet setups.
- **Financial Rails:** The engine running the "Invest → Earn → Pay" loop is built on the **Stellar Network**. It provides the speed and low costs necessary for instant settlement, while keeping the blockchain jargon completely out of sight.

## 🚀 Local Setup & Testing (For Hackathon Judges)

To review and run the project locally:

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd vants-app
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Configure your .env based on .env.example
   npx prisma generate
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Configure your .env.local
   npm run dev
   ```

4. **Run:** Access the web application at `http://localhost:3000`.

## 👥 The Team

- **Pedro** — Founder
- **Vhêndala** — Engineering

---

*Questions? hello@vants.xyz*