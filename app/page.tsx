import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Brain,
  Trophy,
  TrendingUp,
  Keyboard,
  Image as ImageIcon,
  Volume2,
  Flame,
  Target,
  CheckCircle,
  Zap,
  BookOpen,
  Sparkles,
  Clock,
  Users,
  Star,
  ArrowRight,
  Play,
  ChevronDown,
  Mail,
  MessageSquare,
  Shield,
  Globe,
  Heart,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import {
  AnimatedSection,
  AnimatedCounter,
  AnimatedFeatureCard,
  AnimatedHero,
  FloatingElement,
  ParallaxBackground,
  AnimatedTestimonial,
  FAQAccordion,
  ContactForm,
  FloatingNav,
  ScrollToTop,
  SectionIndicator,
} from "@/components/landing-components";
import { getPublicAppSettings } from "@/app/(dashboard)/admin/settings/actions";
import { getSSOConfig } from "@/lib/sso-client";

export default async function HomePage() {
  const session = await auth();

  // Przekierowanie zalogowanego użytkownika do panelu nauki
  if (session) {
    redirect("/learn");
  }

  // [BOOTSTRAP] Sprawdź czy aplikacja jest skonfigurowana
  const config = await getSSOConfig();
  const isConfigured = !!(
    config.apiKey &&
    config.projectSlug &&
    config.centerUrl
  );

  if (!isConfigured) {
    redirect("/setup");
  }

  // Pobierz email kontaktowy z ustawień admina
  const settings = await getPublicAppSettings();
  const contactEmail = settings?.contactEmail || "kontakt@flashcards.pl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-purple-950 dark:to-violet-950 overflow-x-hidden">
      {/* Animowane tło z cząsteczkami */}
      <ParallaxBackground />

      {/* Pływająca nawigacja */}
      <FloatingNav>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 animate-pulse">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Flashcards
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Funkcje
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Jak działa?
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Opinie
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Kontakt
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Zaloguj się</Button>
            </Link>
          </div>
        </div>
      </FloatingNav>

      {/* Spacer dla fixed navigation */}
      <div className="h-[73px]" />

      {/* Hero Section z animacjami */}
      <AnimatedHero>
        <section className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Floating elements */}
            <FloatingElement
              className="absolute -left-20 top-20 hidden lg:block"
              delay={0}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 backdrop-blur-sm border border-violet-200/30 dark:border-violet-700/30 flex items-center justify-center">
                <Brain className="w-8 h-8 text-violet-500" />
              </div>
            </FloatingElement>
            <FloatingElement
              className="absolute -right-16 top-40 hidden lg:block"
              delay={0.5}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 backdrop-blur-sm border border-fuchsia-200/30 dark:border-fuchsia-700/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-fuchsia-500" />
              </div>
            </FloatingElement>
            <FloatingElement
              className="absolute right-10 bottom-20 hidden lg:block"
              delay={1}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400/20 to-rose-400/20 backdrop-blur-sm border border-pink-200/30 dark:border-pink-700/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-pink-500" />
              </div>
            </FloatingElement>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/60 backdrop-blur-sm text-sm font-medium shadow-sm animate-bounce-slow">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Darmowa platforma</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="text-violet-600 dark:text-violet-400 font-semibold">
                Poziomy A1 - C1
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
              Naucz się angielskiego
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient">
                w sposób, który działa
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Zaawansowana platforma do nauki słówek wykorzystująca algorytm{" "}
              <strong className="text-foreground">Spaced Repetition</strong>.
              Różnorodne tryby nauki, statystyki postępów i system osiągnięć —
              wszystko{" "}
              <strong className="text-foreground">całkowicie za darmo</strong>!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white h-14 px-10 text-lg shadow-xl shadow-violet-500/30 dark:shadow-violet-900/40 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Zacznij naukę za darmo
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg group"
                >
                  Zobacz jak działa
                  <ChevronDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
                </Button>
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 border-2 border-background flex items-center justify-center text-xs text-white font-bold">
                    A
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 border-2 border-background flex items-center justify-center text-xs text-white font-bold">
                    M
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 border-2 border-background flex items-center justify-center text-xs text-white font-bold">
                    K
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-400 border-2 border-background flex items-center justify-center text-xs text-white font-bold">
                    +
                  </div>
                </div>
                <span>Dołącz do społeczności</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1">Wysoka skuteczność</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-violet-500/50" />
          </div>
        </section>
      </AnimatedHero>

      {/* Animated Stats Counter */}
      <AnimatedSection className="py-12 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            <AnimatedCounter
              end={2500}
              suffix="+"
              label="Słówek w bazie"
              icon={<BookOpen className="w-6 h-6" />}
            />
            <AnimatedCounter
              end={95}
              suffix="%"
              label="Skuteczność metody"
              icon={<Target className="w-6 h-6" />}
            />
            <AnimatedCounter
              end={15}
              suffix=" min"
              label="Dziennie wystarczy"
              icon={<Clock className="w-6 h-6" />}
            />
            <AnimatedCounter
              end={100}
              suffix="%"
              label="Za darmo"
              icon={<Heart className="w-6 h-6" />}
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Features Overview */}
      <section id="features" className="container mx-auto px-4 py-20">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Dlaczego my?
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Wszystko czego potrzebujesz do{" "}
              <span className="text-violet-600 dark:text-violet-400">
                efektywnej nauki
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nasza platforma łączy sprawdzone metody naukowe z nowoczesną
              technologią, aby maksymalizować Twoje postępy.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <AnimatedFeatureCard delay={0}>
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Algorytm SM-2"
              description="Inteligentne powtórki w optymalnych odstępach czasowych bazowane na nauce"
              color="violet"
            />
          </AnimatedFeatureCard>
          <AnimatedFeatureCard delay={0.1}>
            <FeatureCard
              icon={<Keyboard className="w-6 h-6" />}
              title="Wiele Trybów Nauki"
              description="Pisanie, quiz obrazkowy i wymowa - wybierz swój styl"
              color="fuchsia"
            />
          </AnimatedFeatureCard>
          <AnimatedFeatureCard delay={0.2}>
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Statystyki w czasie rzeczywistym"
              description="Szczegółowe wykresy i analiza postępów każdego dnia"
              color="purple"
            />
          </AnimatedFeatureCard>
          <AnimatedFeatureCard delay={0.3}>
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              title="System Osiągnięć"
              description="Zdobywaj odznaki i buduj daily streak dla motywacji"
              color="pink"
            />
          </AnimatedFeatureCard>
        </div>

        {/* Dodatkowe korzyści */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <AnimatedFeatureCard delay={0.4}>
            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Bez reklam</h3>
              <p className="text-sm text-muted-foreground">
                Czysta nauka bez rozpraszających elementów
              </p>
            </div>
          </AnimatedFeatureCard>
          <AnimatedFeatureCard delay={0.5}>
            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Dostęp online</h3>
              <p className="text-sm text-muted-foreground">
                Ucz się z dowolnego urządzenia, gdziekolwiek jesteś
              </p>
            </div>
          </AnimatedFeatureCard>
          <AnimatedFeatureCard delay={0.6}>
            <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm text-center group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Ciągły rozwój</h3>
              <p className="text-sm text-muted-foreground">
                Regularnie dodajemy nowe funkcje i słówka
              </p>
            </div>
          </AnimatedFeatureCard>
        </div>
      </section>

      {/* Learning Modes Section */}
      <section className="py-20 bg-gradient-to-b from-transparent via-violet-100/50 to-transparent dark:via-violet-950/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Tryby nauki dopasowane do{" "}
                  <span className="text-violet-600 dark:text-violet-400">
                    Twoich potrzeb
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Wybierz sposób nauki, który najbardziej Ci odpowiada. Każdy
                  tryb angażuje inny typ pamięci.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              <AnimatedFeatureCard delay={0}>
                <LearningModeCard
                  icon={<Keyboard className="w-8 h-8" />}
                  title="Tryb Pisania"
                  description="Ćwicz pisownię w dwóch kierunkach: z polskiego na angielski i z angielskiego na polski. Aktywne pisanie pomaga zapamiętać ortografię."
                  features={["PL → EN", "EN → PL", "Automatyczna walidacja"]}
                  color="from-violet-500 to-purple-600"
                />
              </AnimatedFeatureCard>
              <AnimatedFeatureCard delay={0.15}>
                <LearningModeCard
                  icon={<ImageIcon className="w-8 h-8" />}
                  title="Quiz Obrazkowy"
                  description="Ucz się z pomocą obrazów! Wizualne skojarzenia znacząco przyspieszają zapamiętywanie nowych słów."
                  features={[
                    "Obrazy z Pixabay",
                    "Wizualne skojarzenia",
                    "Quiz wyboru",
                  ]}
                  color="from-fuchsia-500 to-pink-600"
                />
              </AnimatedFeatureCard>
              <AnimatedFeatureCard delay={0.3}>
                <LearningModeCard
                  icon={<Volume2 className="w-8 h-8" />}
                  title="Wymowa"
                  description="Słuchaj poprawnej wymowy każdego słowa. Rozwijaj umiejętność rozumienia i mówienia po angielsku."
                  features={[
                    "Web Speech API",
                    "Naturalna wymowa",
                    "Powtarzanie audio",
                  ]}
                  color="from-purple-500 to-violet-600"
                />
              </AnimatedFeatureCard>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Spaced Repetition */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold">
                <Lightbulb className="w-4 h-4" />
                Naukowo udowodniona metoda
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mt-4">
                Co to jest{" "}
                <span className="text-violet-600 dark:text-violet-400">
                  Spaced Repetition
                </span>
                ?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mt-4">
                Spaced Repetition (powtórki w odstępach) to naukowo udowodniona
                metoda nauki, która optymalizuje proces zapamiętywania. System
                automatycznie planuje powtórki słówek tuż przed momentem, gdy
                miałbyś je zapomnieć.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <AnimatedFeatureCard delay={0}>
                <div className="p-6 bg-card/80 backdrop-blur-sm border rounded-2xl group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="font-bold text-lg mb-2">Pierwsze spotkanie</h3>
                  <p className="text-sm text-muted-foreground">
                    Uczysz się nowego słówka. System zaplanuje powtórkę na
                    jutro.
                  </p>
                </div>
              </AnimatedFeatureCard>
              <AnimatedFeatureCard delay={0.15}>
                <div className="p-6 bg-card/80 backdrop-blur-sm border rounded-2xl group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="font-bold text-lg mb-2">Powtórki rosną</h3>
                  <p className="text-sm text-muted-foreground">
                    Każda poprawna odpowiedź wydłuża przerwę: 1 dzień → 3 dni →
                    tydzień → miesiąc.
                  </p>
                </div>
              </AnimatedFeatureCard>
              <AnimatedFeatureCard delay={0.3}>
                <div className="p-6 bg-card/80 backdrop-blur-sm border rounded-2xl group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h3 className="font-bold text-lg mb-2">Długotrwała pamięć</h3>
                  <p className="text-sm text-muted-foreground">
                    Słówka przechodzą do pamięci długotrwałej. Pamiętasz je na
                    zawsze!
                  </p>
                </div>
              </AnimatedFeatureCard>
            </div>

            {/* Krzywa zapominania */}
            <AnimatedSection className="mt-16">
              <div className="p-8 bg-card/80 backdrop-blur-sm border-2 border-violet-200 dark:border-violet-800 rounded-3xl max-w-2xl mx-auto">
                <h3 className="font-bold text-xl mb-4 flex items-center justify-center gap-2">
                  <Brain className="w-6 h-6 text-violet-500" />
                  Krzywa Zapominania Ebbinghausa
                </h3>
                <div className="aspect-[16/9] bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-xl relative overflow-hidden">
                  {/* Symulacja wykresu */}
                  <div className="absolute inset-4 flex items-end">
                    <div className="w-full h-full relative">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 400 200"
                        preserveAspectRatio="none"
                      >
                        {/* Krzywa zapominania bez powtórek */}
                        <path
                          d="M 0 20 Q 100 80, 200 160 T 400 180"
                          fill="none"
                          stroke="rgb(239 68 68)"
                          strokeWidth="3"
                          strokeDasharray="8 4"
                          opacity="0.7"
                        />
                        {/* Krzywa z powtórkami - optymalna */}
                        <path
                          d="M 0 20 L 50 40 L 51 20 L 120 50 L 121 25 L 220 60 L 221 30 L 350 50 L 400 55"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="rgb(139 92 246)" />
                            <stop offset="100%" stopColor="rgb(217 70 239)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  {/* Legenda */}
                  <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-0.5 bg-red-500 opacity-70"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to right, rgb(239 68 68), rgb(239 68 68) 4px, transparent 4px, transparent 8px)",
                        }}
                      />
                      <span className="text-muted-foreground">
                        Bez powtórek
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                      <span className="text-muted-foreground">
                        Z algorytmem SM-2
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Regularne, rozłożone w czasie powtórki sprawiają, że wiedza
                  zostaje z Tobą na zawsze.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CEFR Levels Section */}
      <section className="py-20 bg-gradient-to-b from-transparent via-fuchsia-100/50 to-transparent dark:via-fuchsia-950/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection direction="left">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-5xl font-bold">
                    Poziomy{" "}
                    <span className="text-violet-600 dark:text-violet-400">
                      CEFR
                    </span>{" "}
                    od A1 do C1
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Nasze słówka są podzielone według międzynarodowego standardu
                    CEFR (Common European Framework of Reference). Rozpocznij od
                    podstaw i stopniowo przechodź do zaawansowanych poziomów.
                  </p>
                  <ul className="space-y-3">
                    <CEFRLevel
                      level="A1"
                      name="Beginner"
                      description="Podstawowe słownictwo codzienne"
                    />
                    <CEFRLevel
                      level="A2"
                      name="Elementary"
                      description="Proste rozmowy i opisy"
                    />
                    <CEFRLevel
                      level="B1"
                      name="Intermediate"
                      description="Tematy ogólne i podróże"
                    />
                    <CEFRLevel
                      level="B2"
                      name="Upper-Intermediate"
                      description="Złożone tematy i opinie"
                    />
                    <CEFRLevel
                      level="C1"
                      name="Advanced"
                      description="Zaawansowane słownictwo akademickie"
                    />
                  </ul>
                </div>
              </AnimatedSection>
              <AnimatedSection direction="right">
                <div className="relative">
                  <div className="aspect-square max-w-md mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl animate-pulse" />
                    <div className="relative bg-card/80 backdrop-blur-sm border-2 border-violet-200 dark:border-violet-800 rounded-3xl p-8 shadow-2xl hover:shadow-violet-500/10 transition-shadow duration-500">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-xl">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                            B2
                          </div>
                          <div>
                            <div className="font-bold">
                              Twój aktualny poziom
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Upper-Intermediate
                            </div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <StatBox
                            icon={<BookOpen className="w-5 h-5" />}
                            value="847"
                            label="Słówek"
                          />
                          <StatBox
                            icon={<Flame className="w-5 h-5" />}
                            value="12"
                            label="Dni streak"
                          />
                          <StatBox
                            icon={<Target className="w-5 h-5" />}
                            value="94%"
                            label="Dokładność"
                          />
                          <StatBox
                            icon={<Trophy className="w-5 h-5" />}
                            value="8"
                            label="Osiągnięć"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements & Gamification */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection direction="left" className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <AchievementCard
                    icon={<BookOpen className="w-6 h-6" />}
                    title="Pierwsze Kroki"
                    description="Naucz się 10 słówek"
                    unlocked
                  />
                  <AchievementCard
                    icon={<Trophy className="w-6 h-6" />}
                    title="Mistrz Słów"
                    description="Naucz się 100 słówek"
                    unlocked
                  />
                  <AchievementCard
                    icon={<Flame className="w-6 h-6" />}
                    title="Systematyczność"
                    description="3 dni streak"
                    unlocked
                  />
                  <AchievementCard
                    icon={<Zap className="w-6 h-6" />}
                    title="Tydzień Nauki"
                    description="7 dni streak"
                  />
                </div>
              </AnimatedSection>
              <AnimatedSection
                direction="right"
                className="order-1 lg:order-2 space-y-6"
              >
                <h2 className="text-3xl md:text-5xl font-bold">
                  Zdobywaj{" "}
                  <span className="text-violet-600 dark:text-violet-400">
                    osiągnięcia
                  </span>{" "}
                  i motywuj się
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Utrzymuj daily streak, zdobywaj odznaki i śledź swoje postępy.
                  System gamifikacji sprawia, że nauka staje się wciągającą grą!
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground group">
                    <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span>Daily streak motywuje do codziennej nauki</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground group">
                    <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span>Odznaki za osiągnięcie kamieni milowych</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground group">
                    <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span>Szczegółowe statystyki i wykresy postępów</span>
                  </li>
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-b from-transparent via-violet-100/50 to-transparent dark:via-violet-950/30"
      >
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
                <Users className="w-4 h-4" />
                Opinie użytkowników
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Co mówią nasi{" "}
                <span className="text-violet-600 dark:text-violet-400">
                  użytkownicy
                </span>
                ?
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <AnimatedTestimonial delay={0}>
              <TestimonialCard
                name="Anna K."
                role="Studentka"
                content="Dzięki tej aplikacji zdałam FCE z wynikiem A! Spaced Repetition naprawdę działa - słówka wchodzą do głowy jak nigdy wcześniej."
                avatar="A"
              />
            </AnimatedTestimonial>
            <AnimatedTestimonial delay={0.15}>
              <TestimonialCard
                name="Marek W."
                role="Programista"
                content="Codzienne 15 minut z aplikacją znacząco poprawiło moje umiejętności. Mogę teraz swobodnie czytać dokumentację techniczną."
                avatar="M"
              />
            </AnimatedTestimonial>
            <AnimatedTestimonial delay={0.3}>
              <TestimonialCard
                name="Kasia P."
                role="Nauczycielka"
                content="Polecam tę aplikację moim uczniom. System osiągnięć świetnie motywuje młodzież do regularnej nauki!"
                avatar="K"
              />
            </AnimatedTestimonial>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
                <MessageSquare className="w-4 h-4" />
                Najczęściej zadawane pytania
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Masz{" "}
                <span className="text-violet-600 dark:text-violet-400">
                  pytania
                </span>
                ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Znajdź odpowiedzi na najczęściej zadawane pytania dotyczące
                naszej platformy.
              </p>
            </div>
          </AnimatedSection>

          <FAQAccordion />
        </div>
      </section>

      {/* Contact Form Section */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-b from-transparent via-fuchsia-100/50 to-transparent dark:via-fuchsia-950/30"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
                  <Mail className="w-4 h-4" />
                  Formularz kontaktowy
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Masz pytanie?{" "}
                  <span className="text-violet-600 dark:text-violet-400">
                    Napisz do nas!
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Chętnie odpowiemy na Twoje pytania, przyjmiemy sugestie i
                  pomożemy z problemami.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <ContactForm />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-8 md:p-16 text-center text-white shadow-2xl group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="relative space-y-6">
                  <div className="text-6xl animate-bounce-slow">🚀</div>
                  <h2 className="text-3xl md:text-5xl font-bold">
                    Gotowy, żeby zacząć?
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                    Dołącz do platformy już teraz i zacznij efektywnie uczyć się
                    angielskiego. Rejestracja jest szybka i całkowicie darmowa!
                  </p>
                  <div className="pt-4">
                    <Link href="/login">
                      <Button
                        size="lg"
                        className="bg-white text-violet-700 hover:bg-white/90 h-14 px-10 text-lg font-bold shadow-xl group/btn"
                      >
                        Rozpocznij naukę
                        <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎓</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  Flashcards
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Darmowa platforma do efektywnej nauki angielskiego z
                wykorzystaniem algorytmu Spaced Repetition.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Funkcje
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-foreground transition-colors"
                  >
                    Jak działa
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="hover:text-foreground transition-colors"
                  >
                    Opinie
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Nauka</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="text-foreground">Poziomy A1-C1</span>
                </li>
                <li>
                  <span className="text-foreground">Tryby nauki</span>
                </li>
                <li>
                  <span className="text-foreground">Statystyki</span>
                </li>
                <li>
                  <span className="text-foreground">Osiągnięcia</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#contact"
                    className="hover:text-foreground transition-colors"
                  >
                    Formularz kontaktowy
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {contactEmail}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© 2025 Flashcards. Wszystkie prawa zastrzeżone.</span>
            <span>Wykonano z pasją przez AleksanderOne ❤️</span>
          </div>
        </div>
      </footer>

      {/* Wskaźnik sekcji po prawej stronie */}
      <SectionIndicator />

      {/* Przycisk przewijania na górę */}
      <ScrollToTop />
    </div>
  );
}

// Komponenty pomocnicze

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    violet:
      "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    fuchsia:
      "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  };

  return (
    <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group h-full">
      <div
        className={`w-12 h-12 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LearningModeCard({
  icon,
  title,
  description,
  features,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}) {
  return (
    <div className="relative group h-full">
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"
        style={{
          backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
        }}
      />
      <div className="p-8 rounded-2xl border-2 border-transparent bg-card/80 backdrop-blur-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 h-full group-hover:shadow-xl group-hover:-translate-y-2">
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-xl mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CEFRLevel({
  level,
  name,
  description,
}: {
  level: string;
  name: string;
  description: string;
}) {
  return (
    <li className="flex items-center gap-4 p-3 rounded-xl bg-card/60 border hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow">
        {level}
      </div>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </li>
  );
}

function StatBox({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-xl text-center hover:bg-muted transition-colors">
      <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
        {icon}
        <span className="font-bold text-lg">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function AchievementCard({
  icon,
  title,
  description,
  unlocked = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${unlocked ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30 hover:shadow-lg" : "border-muted bg-muted/30 opacity-60 hover:opacity-80"}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${unlocked ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white" : "bg-muted text-muted-foreground"}`}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
      {unlocked && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Odblokowane
        </div>
      )}
    </div>
  );
}

function TestimonialCard({
  name,
  role,
  content,
  avatar,
}: {
  name: string;
  role: string;
  content: string;
  avatar: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border hover:shadow-xl transition-all duration-300 h-full group">
      <div className="flex items-center gap-1.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        &ldquo;{content}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}
