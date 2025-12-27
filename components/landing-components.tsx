"use client";

import {
  motion,
  useInView,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { useRef, useEffect, useState, useActionState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  submitContactForm,
  type ContactFormState,
} from "@/app/actions/contact-actions";
import { cn } from "@/lib/utils";

// Nawigacja przyklejona do góry strony
export function FloatingNav({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Pokaż wzmocniony efekt tła po przewinięciu 50px
    setIsScrolled(latest > 50);
  });

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-lg shadow-violet-500/5 border-b border-border/50"
          : "bg-background/80 backdrop-blur-md border-b border-border/40",
        className,
      )}
    >
      <div
        className={cn(
          "transition-all duration-300",
          isScrolled ? "py-3" : "py-4",
        )}
      >
        {children}
      </div>
    </nav>
  );
}

// Animowana sekcja z efektem wejścia
export function AnimatedSection({
  children,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directionVariants = {
    up: { y: 60, opacity: 0 },
    down: { y: -60, opacity: 0 },
    left: { x: -60, opacity: 0 },
    right: { x: 60, opacity: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={
        isInView ? { x: 0, y: 0, opacity: 1 } : directionVariants[direction]
      }
      transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animowany licznik
export function AnimatedCounter({
  end,
  suffix = "",
  label,
  icon,
}: {
  end: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, end]);

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-center gap-2 text-white/80">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-bold">
        {count}
        {suffix}
      </div>
      <div className="text-sm text-white/80">{label}</div>
    </motion.div>
  );
}

// Animowana karta funkcji
export function AnimatedFeatureCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 40, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Animowany hero section
export function AnimatedHero({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Pływający element dekoracyjny
export function FloatingElement({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: [0, -10, 0],
        opacity: 1,
      }}
      transition={{
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
        opacity: {
          duration: 0.8,
          delay,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Animowane tło z cząsteczkami (renderowane tylko na kliencie aby uniknąć błędu hydratacji)
export function ParallaxBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Renderuj placeholder na serwerze, pełne animacje na kliencie
  if (!isMounted) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Animowane koła gradientowe */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-fuchsia-400/15 to-pink-400/15 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animowane cząsteczki */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-violet-400/30 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Animowana opinia
export function AnimatedTestimonial({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 50, opacity: 0, rotateX: 10 }}
      animate={
        isInView
          ? { y: 0, opacity: 1, rotateX: 0 }
          : { y: 50, opacity: 0, rotateX: 10 }
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

// Interaktywny akordeon FAQ
const faqItems = [
  {
    question: "Czy aplikacja jest naprawdę darmowa?",
    answer:
      "Tak! Flashcards jest całkowicie darmową platformą. Nie ma żadnych ukrytych opłat, subskrypcji ani reklam. Wszystkie funkcje są dostępne dla każdego użytkownika bezpłatnie.",
  },
  {
    question: "Jak działa algorytm Spaced Repetition?",
    answer:
      "Algorytm SM-2 automatycznie planuje powtórki słówek w optymalnych odstępach czasowych. Po pierwszym spotkaniu ze słówkiem, system zaplanuje powtórkę na następny dzień. Każda poprawna odpowiedź wydłuża przerwę (1 dzień → 3 dni → tydzień → miesiąc itd.), dzięki czemu słówka przechodzą do pamięci długotrwałej.",
  },
  {
    question: "Ile czasu dziennie powinienem poświęcić na naukę?",
    answer:
      "Zalecamy 15-30 minut dziennie. Regularność jest ważniejsza niż długość sesji. Krótkie, codzienne sesje są bardziej efektywne niż rzadkie, wielogodzinne maratony nauki.",
  },
  {
    question: "Jakie poziomy trudności są dostępne?",
    answer:
      "Oferujemy słówka na wszystkich poziomach CEFR: od A1 (Beginner) do C1 (Advanced). Możesz wybrać poziom odpowiadający Twojemu aktualnemu zaawansowaniu i stopniowo przechodzić na wyższe.",
  },
  {
    question: "Czy mogę dodawać własne słówka?",
    answer:
      "Tak! Możesz tworzyć i zarządzać własnymi zestawami słówek. Dodawaj słowa, które chcesz się nauczyć, a system Spaced Repetition będzie je automatycznie planować do powtórek.",
  },
  {
    question: "Na jakich urządzeniach działa aplikacja?",
    answer:
      "Flashcards jest aplikacją webową, która działa na wszystkich urządzeniach z dostępem do internetu - komputerach, tabletach i smartfonach. Nie musisz instalować żadnej aplikacji.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqItems.map((item, index) => (
        <AnimatedFeatureCard key={index} delay={index * 0.1}>
          <motion.div
            className="border rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden"
            initial={false}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
            >
              <span className="font-semibold text-lg">{item.question}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-violet-500" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                >
                  <div className="px-6 pt-2 pb-6 text-muted-foreground">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatedFeatureCard>
      ))}
    </div>
  );
}

// Formularz kontaktowy
export function ContactForm() {
  const [state, formAction, isPending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactForm, {});

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <form
        action={formAction}
        className="p-8 rounded-3xl bg-card/80 backdrop-blur-sm border-2 border-violet-200 dark:border-violet-800 shadow-xl"
      >
        {state.success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
              Wiadomość wysłana!
            </h3>
            <p className="text-muted-foreground">{state.message}</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Imię */}
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-violet-500" />
                  Imię *
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Jan"
                  required
                  className="h-12"
                />
                {state.errors?.firstName && (
                  <p className="text-sm text-red-500">
                    {state.errors.firstName[0]}
                  </p>
                )}
              </div>

              {/* Nazwisko */}
              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-violet-500" />
                  Nazwisko *
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Kowalski"
                  required
                  className="h-12"
                />
                {state.errors?.lastName && (
                  <p className="text-sm text-red-500">
                    {state.errors.lastName[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-violet-500" />
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jan.kowalski@email.com"
                  required
                  className="h-12"
                />
                {state.errors?.email && (
                  <p className="text-sm text-red-500">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-violet-500" />
                  Telefon (opcjonalnie)
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+48 123 456 789"
                  className="h-12"
                />
                {state.errors?.phone && (
                  <p className="text-sm text-red-500">
                    {state.errors.phone[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Wiadomość */}
            <div className="space-y-2">
              <label
                htmlFor="message"
                className="text-sm font-medium flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-violet-500" />
                Treść wiadomości *
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Opisz swoje pytanie lub sugestię..."
                required
                rows={5}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              {state.errors?.message && (
                <p className="text-sm text-red-500">
                  {state.errors.message[0]}
                </p>
              )}
            </div>

            {/* Przycisk wysyłania */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-xl shadow-violet-500/30 group"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Wyślij wiadomość
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Odpowiadamy na wiadomości w ciągu 24-48 godzin roboczych.
            </p>
          </div>
        )}
      </form>
    </motion.div>
  );
}

// Przycisk przewijania na górę strony
export function ScrollToTop() {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Pokaż przycisk po przewinięciu 400px
    setIsVisible(latest > 400);
  });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-violet-500/40 hover:scale-110 transition-all duration-300 group"
          aria-label="Przewiń na górę"
        >
          <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Definicja sekcji dla wskaźnika
const sections = [
  { id: "hero", label: "Start" },
  { id: "features", label: "Funkcje" },
  { id: "how-it-works", label: "Jak działa?" },
  { id: "testimonials", label: "Opinie" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Kontakt" },
];

// Wskaźnik sekcji po prawej stronie
export function SectionIndicator() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    // Pokaż wskaźnik po przewinięciu 200px
    setIsVisible(window.scrollY > 200);

    // Znajdź aktualną sekcję
    const scrollPosition = window.scrollY + window.innerHeight / 3;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const element =
        section.id === "hero"
          ? document.querySelector("section")
          : document.getElementById(section.id);

      if (element) {
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;

        if (scrollPosition >= top) {
          setActiveSection(section.id);
          break;
        }
      }
    }
  });

  const scrollToSection = (sectionId: string) => {
    if (sectionId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const top = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-3"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group flex items-center gap-3"
              aria-label={`Przejdź do sekcji ${section.label}`}
            >
              {/* Etykieta - pojawia się przy hoverze */}
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50"
              >
                {section.label}
              </motion.span>

              {/* Kropka */}
              <motion.div
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  activeSection === section.id
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 scale-125 shadow-md shadow-violet-500/40"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-110",
                )}
                animate={{
                  scale: activeSection === section.id ? 1.25 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            </button>
          ))}

          {/* Linia łącząca kropki */}
          <div className="absolute right-[4.5px] top-1 bottom-1 w-[1px] bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent -z-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
