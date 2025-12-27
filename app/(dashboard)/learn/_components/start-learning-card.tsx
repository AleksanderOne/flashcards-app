"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Keyboard, ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface CategoryProgress {
  total: number;
  learned: number;
}

interface StartLearningCardProps {
  categoriesByLevel: Record<string, Record<string, CategoryProgress>>;
}

const LEARNING_MODES = [
  {
    id: "pl_to_en_text",
    label: "Pisanie (PL -> EN)",
    icon: Keyboard,
    description: "Przetłumacz na angielski",
  },
  {
    id: "en_to_pl_text",
    label: "Pisanie (EN -> PL)",
    icon: Keyboard,
    description: "Przetłumacz na polski",
  },
  {
    id: "pl_to_en_quiz",
    label: "Quiz (Obrazki)",
    icon: ImageIcon,
    description: "Wybierz poprawną odpowiedź",
  },
  // W planach: obsługa trybu mowy
];

export function StartLearningCard({
  categoriesByLevel,
}: StartLearningCardProps) {
  const router = useRouter();
  const [level, setLevel] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [mode, setMode] = useState<string>("pl_to_en_text");

  const levels = Object.keys(categoriesByLevel);

  // Memoizacja categories dla stabilnych zależności w useMemo poniżej
  const categories = useMemo(() => {
    return level ? categoriesByLevel[level] : {};
  }, [level, categoriesByLevel]);

  // Obliczenie statystyk nauki dla aktualnie wybranego poziomu
  const levelStats = useMemo(() => {
    if (!level) return null;
    const cats = categoriesByLevel[level];
    const total = Object.values(cats).reduce((sum, cat) => sum + cat.total, 0);
    const learned = Object.values(cats).reduce(
      (sum, cat) => sum + cat.learned,
      0,
    );
    return { total, learned };
  }, [level, categoriesByLevel]);

  const handleStart = () => {
    if (!level) return;

    const params = new URLSearchParams({
      level,
      mode,
    });

    if (category !== "all") {
      params.append("category", category);
    }

    router.push(`/learn/session?${params.toString()}`);
  };

  // Obliczenie ile nowych słówek pozostało do nauki dla wybranej kategorii
  const newWordsRemaining = useMemo(() => {
    if (!level) return null;
    if (category === "all") {
      const cats = categoriesByLevel[level];
      const total = Object.values(cats).reduce(
        (sum, cat) => sum + cat.total,
        0,
      );
      const learned = Object.values(cats).reduce(
        (sum, cat) => sum + cat.learned,
        0,
      );
      return total - learned;
    } else {
      const cat = categories[category];
      return cat ? cat.total - cat.learned : 0;
    }
  }, [level, category, categoriesByLevel, categories]);

  return (
    <Card className="shadow-lg border-2 border-violet-100 dark:border-violet-900/50">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <Brain className="w-6 h-6 text-violet-600" />
          Nauka nowych słówek
        </CardTitle>
        <CardDescription className="text-center">
          Wybierz poziom i kategorię, aby uczyć się nowych słówek
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wybór poziomu zaawansowania */}
        <div className="space-y-3">
          <Label>Wybierz poziom</Label>
          <div className="flex flex-wrap gap-2">
            {levels.map((lvl) => {
              const cats = categoriesByLevel[lvl];
              const total = Object.values(cats).reduce(
                (sum, cat) => sum + cat.total,
                0,
              );
              const learned = Object.values(cats).reduce(
                (sum, cat) => sum + cat.learned,
                0,
              );
              const _percentage =
                total > 0 ? Math.round((learned / total) * 100) : 0;
              const isComplete = learned === total && total > 0;

              return (
                <Button
                  key={lvl}
                  variant={level === lvl ? "default" : "outline"}
                  onClick={() => {
                    setLevel(lvl);
                    setCategory("all");
                  }}
                  className={cn(
                    "flex-1 min-w-[80px] flex flex-col h-auto py-2 px-3 relative",
                    level === lvl && "bg-violet-600 hover:bg-violet-700",
                    isComplete &&
                      level !== lvl &&
                      "border-green-500 bg-green-50 dark:bg-green-950/20",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{lvl}</span>
                    {isComplete && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <span className="text-xs opacity-80 mt-0.5">
                    {learned}/{total}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Pasek postępu dla wybranego poziomu */}
          {levelStats && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Postęp dla {level}
                </span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {Math.round((levelStats.learned / levelStats.total) * 100)}%
                </span>
              </div>
              <Progress
                value={(levelStats.learned / levelStats.total) * 100}
                className="h-2"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {levelStats.learned} z {levelStats.total} słówek nauczonych
              </div>
            </div>
          )}
        </div>

        {/* Wybór kategorii */}
        <div className="space-y-3">
          <Label>Kategoria</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={!level}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  level ? "Wszystkie kategorie" : "Najpierw wybierz poziom"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center justify-between w-full">
                  <span>Wszystkie kategorie</span>
                  {levelStats && (
                    <span className="ml-4 text-xs text-slate-500">
                      ({levelStats.learned}/{levelStats.total})
                    </span>
                  )}
                </div>
              </SelectItem>
              {Object.entries(categories).map(([cat, stats]) => {
                const percentage =
                  stats.total > 0
                    ? Math.round((stats.learned / stats.total) * 100)
                    : 0;
                const isComplete =
                  stats.learned === stats.total && stats.total > 0;

                return (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        <span>{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {stats.learned}/{stats.total}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded",
                            isComplete
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : percentage >= 50
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                          )}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Wybór trybu nauki */}
        <div className="space-y-3">
          <Label>Tryb nauki</Label>
          <div className="grid grid-cols-1 gap-3">
            {LEARNING_MODES.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                  mode === m.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                    : "border-slate-200 dark:border-slate-800",
                )}
                onClick={() => setMode(m.id)}
              >
                <div
                  className={cn(
                    "p-2 rounded-full mr-4",
                    mode === m.id
                      ? "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800",
                  )}
                >
                  <m.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Podsumowanie przed rozpoczęciem */}
        {level && newWordsRemaining !== null && (
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 text-center border border-violet-200 dark:border-violet-800">
            <p className="text-sm text-muted-foreground mb-1">
              Nowe słówka do nauki:
            </p>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {newWordsRemaining > 0 ? newWordsRemaining : "0"}
            </p>
            {newWordsRemaining === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                ✓ Wszystkie słówka w tej kategorii nauczone!
              </p>
            )}
          </div>
        )}

        <Button
          className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25"
          onClick={handleStart}
          disabled={!level || newWordsRemaining === 0}
        >
          {newWordsRemaining === 0 ? "Brak nowych słówek" : "Rozpocznij naukę"}
        </Button>
      </CardContent>
    </Card>
  );
}
