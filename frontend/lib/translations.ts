/**
 * lib/translations.ts
 * 
 * Dicionário centralizado de traduções para Vants App.
 */

export type Language = "en" | "pt" | "es";

export const translations = {
  en: {
    // Onboarding
    skip: "Skip",
    getStarted: "Get Started",
    continue: "Continue",
    growMoneyTag: "GROW YOUR MONEY",
    growMoneyTitle: "Earn up to\n12% a year",
    growMoneyDesc: "High-yield accounts that outperform your bank — without the complexity.",
    alwaysOnTag: "ALWAYS ON",
    alwaysOnTitle: "Your money\nnever sleeps",
    alwaysOnDesc: "Your money grows every second, day and night. Available anytime, no waiting.",
    paySmarterTag: "PAY SMARTER",
    paySmarterTitle: "Pay any bill\nin seconds",
    paySmarterDesc: "Convert just enough to cover it. The rest keeps earning.",
    
    // Login
    createAccount: "Create your account",
    startEarning: "Start earning in under a minute.",
    signInWithEmail: "Sign in with Email",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    or: "or",
    emailPlaceholder: "you@example.com",
    checkEmail: "Check your email",
    sentCode: "We sent a secure login code to",
    verifyCode: "Verify Code",
    loginCode: "Login Code",
    termsNotice: "By continuing you agree to our",
    terms: "Terms",
    and: "and",
    privacyPolicy: "Privacy Policy",

    // Dashboard
    totalBalance: "Total Balance",
    invested: "INVESTED",
    account: "ACCOUNT",
    thisMonth: "this month",
    syncing: "Syncing...",
    recentActivity: "Recent activity",
    all: "All",
    noTransactions: "No transactions yet",
    transactionsAppearHere: "Your movements will appear here.",
    
    // Bottom Nav
    home: "Home",
    invest: "Invest",
    wallet: "Wallet",
    activity: "Activity",
    profile: "Profile",

    // Profile
    settings: "Settings",
    security: "Security",
    help: "Help",
    logout: "Log out",
    invalidSession: "Invalid session. Please login again.",
    serverError: "Server error",
    unexpectedError: "Unexpected error",
    accountSecure: "Account Secure!",
    activateBiometrics: "Activate Biometrics",
    passkeySuccess: "Passkey configured perfectly.",
    protectVants: "Protect your Vants app with your face or fingerprint.",
    registerDevice: "Register Device",
    preparingWallet: "Preparing your wallet...",
    somethingWentWrong: "Something went wrong",

    // Setup / Onboarding Steps
    activatingWallet: "Activating Wallet",
    activatingWalletDesc: "Setting up your secure wallet on the blockchain.",
    signingTrustline: "Signing Trustline",
    signingTrustlineDesc: "Authorizing USDC asset for your account.",
    receivingPix: "Receiving Deposit",
    receivingPixDesc: "Simulating your first PIX deposit of 10,000 USDC.",
    success: "Success!",
    walletReady: "Your wallet is ready and 10,000 USDC has been deposited.",
    tryAgain: "Try Again",
    redirecting: "Redirecting to your dashboard...",
    startSetup: "Start Setup →",
    setupSteps: [
      "Activate blockchain account",
      "Sign USDC Trustline",
      "Receive 10,000 USDC deposit"
    ]
  },
  pt: {
    // Onboarding
    skip: "Pular",
    getStarted: "Começar",
    continue: "Continuar",
    growMoneyTag: "AUMENTE SEU DINHEIRO",
    growMoneyTitle: "Renda até\n12% ao ano",
    growMoneyDesc: "Contas de alto rendimento que superam seu banco — sem complexidade.",
    alwaysOnTag: "SEMPRE ATIVO",
    alwaysOnTitle: "Seu dinheiro\nnunca dorme",
    alwaysOnDesc: "Seu dinheiro cresce a cada segundo, dia e noite. Disponível a qualquer momento.",
    paySmarterTag: "PAGUE MELHOR",
    paySmarterTitle: "Pague boletos\nem segundos",
    paySmarterDesc: "Converta apenas o necessário para pagar. O resto continua rendendo.",

    // Login
    createAccount: "Crie sua conta",
    startEarning: "Comece a render em menos de um minuto.",
    signInWithEmail: "Entrar com E-mail",
    continueWithGoogle: "Continuar com Google",
    continueWithApple: "Continuar com Apple",
    or: "ou",
    emailPlaceholder: "voce@exemplo.com",
    checkEmail: "Verifique seu e-mail",
    sentCode: "Enviamos um código de login seguro para",
    verifyCode: "Verificar Código",
    loginCode: "Código de Login",
    termsNotice: "Ao continuar você concorda com nossos",
    terms: "Termos",
    and: "e",
    privacyPolicy: "Política de Privacidade",

    // Dashboard
    totalBalance: "Saldo Total",
    invested: "INVESTIDO",
    account: "CONTA",
    thisMonth: "este mês",
    syncing: "Sincronizando...",
    recentActivity: "Atividade recente",
    all: "Ver Tudo",
    noTransactions: "Nenhuma transação ainda",
    transactionsAppearHere: "Suas movimentações aparecerão aqui.",

    // Bottom Nav
    home: "Início",
    invest: "Investir",
    wallet: "Carteira",
    activity: "Atividade",
    profile: "Perfil",

    // Profile
    settings: "Configurações",
    security: "Segurança",
    help: "Ajuda",
    logout: "Sair",
    invalidSession: "Sessão inválida. Faça login novamente.",
    serverError: "Erro do servidor",
    unexpectedError: "Erro inesperado",
    accountSecure: "Conta Segura!",
    activateBiometrics: "Ativar Biometria",
    passkeySuccess: "Passkey configurado perfeitamente.",
    protectVants: "Proteja seu aplicativo Vants com sua face ou digital.",
    registerDevice: "Registrar Dispositivo",
    preparingWallet: "Preparando sua carteira...",
    somethingWentWrong: "Algo deu errado",

    // Setup
    activatingWallet: "Ativando Carteira",
    activatingWalletDesc: "Configurando sua carteira segura na blockchain.",
    signingTrustline: "Assinando Trustline",
    signingTrustlineDesc: "Autorizando o ativo USDC para sua conta.",
    receivingPix: "Recebendo Depósito",
    receivingPixDesc: "Simulando seu primeiro depósito PIX de 10.000 USDC.",
    success: "Sucesso!",
    walletReady: "Sua carteira está pronta e 10.000 USDC foram depositados.",
    tryAgain: "Tentar Novamente",
    redirecting: "Redirecionando para o painel...",
    startSetup: "Começar Configuração →",
    setupSteps: [
      "Ativar conta na blockchain",
      "Assinar Trustline USDC",
      "Receber depósito de 10.000 USDC"
    ]
  },
  es: {
    // Onboarding
    skip: "Saltar",
    getStarted: "Empezar",
    continue: "Continuar",
    growMoneyTag: "CRECE TU DINERO",
    growMoneyTitle: "Gana hasta\n12% al año",
    growMoneyDesc: "Cuentas de alto rendimiento que superan a tu banco, sin complicaciones.",
    alwaysOnTag: "SIEMPRE ACTIVO",
    alwaysOnTitle: "Tu dinero\nnunca duerme",
    alwaysOnDesc: "Tu dinero crece cada segundo, día y noche. Disponible en cualquier momento.",
    paySmarterTag: "PAGA MEJOR",
    paySmarterTitle: "Paga facturas\nen segundos",
    paySmarterDesc: "Convierte solo lo necesario para pagar. El resto sigue rindiendo.",

    // Login
    createAccount: "Crea tu cuenta",
    startEarning: "Comienza a ganar en menos de un minuto.",
    signInWithEmail: "Entrar con Email",
    continueWithGoogle: "Continuar con Google",
    continueWithApple: "Continuar con Apple",
    or: "o",
    emailPlaceholder: "tu@ejemplo.com",
    checkEmail: "Revisa tu email",
    sentCode: "Enviamos un código de inicio de sesión seguro a",
    verifyCode: "Verificar Código",
    loginCode: "Código de Inicio",
    termsNotice: "Al continuar aceptas nuestros",
    terms: "Términos",
    and: "y",
    privacyPolicy: "Política de Privacidad",

    // Dashboard
    totalBalance: "Saldo Total",
    invested: "INVERTIDO",
    account: "CUENTA",
    thisMonth: "este mes",
    syncing: "Sincronizando...",
    recentActivity: "Actividad reciente",
    all: "Ver Todo",
    noTransactions: "Aún no hay transacciones",
    transactionsAppearHere: "Tus movimientos aparecerán aquí.",

    // Bottom Nav
    home: "Inicio",
    invest: "Invertir",
    wallet: "Billetera",
    activity: "Actividade",
    profile: "Perfil",

    // Profile
    settings: "Ajustes",
    security: "Seguridad",
    help: "Ayuda",
    logout: "Cerrar sesión",
    invalidSession: "Sesión inválida. Inicie sesión de nuevo.",
    serverError: "Error del servidor",
    unexpectedError: "Error inesperado",
    accountSecure: "¡Cuenta Segura!",
    activateBiometrics: "Activar Biometría",
    passkeySuccess: "Passkey configurado perfectamente.",
    protectVants: "Protege tu aplicación Vants con tu cara o huella.",
    registerDevice: "Registrar Dispositivo",
    preparingWallet: "Preparando su billetera...",
    somethingWentWrong: "Algo salió mal",

    // Setup
    activatingWallet: "Activando Billetera",
    activatingWalletDesc: "Configurando tu billetera segura en la blockchain.",
    signingTrustline: "Firmando Trustline",
    signingTrustlineDesc: "Autorizando el activo USDC para tu cuenta.",
    receivingPix: "Recibiendo Depósito",
    receivingPixDesc: "Simulando tu primer depósito de 10.000 USDC.",
    success: "¡Éxito!",
    walletReady: "Tu billetera está lista y se han depositado 10.000 USDC.",
    tryAgain: "Intentar de nuevo",
    redirecting: "Redirigiendo al panel...",
    startSetup: "Comenzar Configuración →",
    setupSteps: [
      "Activar cuenta en blockchain",
      "Firmar Trustline USDC",
      "Recibir depósito de 10.000 USDC"
    ]
  }
};
