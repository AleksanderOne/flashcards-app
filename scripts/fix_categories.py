#!/usr/bin/env python3
"""
Skrypt do naprawy kategorii słówek z 'General' na właściwe kategorie
na podstawie WORD_DATABASE z data/seed-data.ts
"""

import json
import sys

# Mapowanie słówek do kategorii (z data/seed-data.ts)
WORD_DATABASE = {
    'A1': {
        'Rodzina': ['mother', 'father', 'sister', 'brother', 'baby', 'family', 'parent', 'child', 'son', 'daughter'],
        'Jedzenie': ['apple', 'bread', 'water', 'milk', 'egg', 'cheese', 'chicken', 'rice', 'coffee', 'tea', 'food', 'fish', 'meat', 'fruit', 'vegetable'],
        'Kolory': ['red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'pink', 'brown', 'grey'],
        'Zwierzęta': ['cat', 'dog', 'bird', 'horse', 'cow', 'pig', 'sheep', 'rabbit', 'mouse', 'animal'],
        'Dom': ['house', 'door', 'window', 'bed', 'table', 'chair', 'kitchen', 'bathroom', 'room', 'garden', 'home'],
        'Liczby': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
        'Ciało': ['head', 'hand', 'eye', 'ear', 'nose', 'mouth', 'hair', 'arm', 'leg', 'foot'],
        'Czas': ['day', 'week', 'month', 'year', 'today', 'tomorrow', 'morning', 'evening', 'night', 'hour'],
    },
    'A2': {
        'Ubrania': ['shirt', 'dress', 'jacket', 'trousers', 'shoes', 'hat', 'coat', 'sweater', 'skirt', 'boots'],
        'Pogoda': ['sunny', 'rainy', 'cloudy', 'windy', 'snow', 'storm', 'weather', 'hot', 'cold', 'warm'],
        'Transport': ['car', 'bus', 'train', 'bicycle', 'airplane', 'boat', 'taxi', 'motorcycle', 'truck', 'station'],
        'Zawody': ['doctor', 'teacher', 'police', 'nurse', 'driver', 'cook', 'farmer', 'worker', 'manager', 'student'],
        'Miasto': ['street', 'shop', 'restaurant', 'hotel', 'hospital', 'school', 'bank', 'library', 'museum', 'park'],
        'Sport': ['football', 'basketball', 'tennis', 'swimming', 'running', 'game', 'team', 'player', 'ball', 'match'],
        'Uczucia': ['happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty', 'scared', 'surprised', 'excited', 'worried'],
        'Zakupy': ['money', 'price', 'cheap', 'expensive', 'buy', 'sell', 'pay', 'cost', 'shop', 'market'],
    },
    'B1': {
        'Technologia': ['computer', 'phone', 'internet', 'website', 'email', 'software', 'screen', 'keyboard', 'device', 'digital'],
        'Zdrowie': ['medicine', 'hospital', 'symptom', 'treatment', 'exercise', 'diet', 'illness', 'pain', 'healthy', 'sick'],
        'Podróże': ['passport', 'luggage', 'reservation', 'destination', 'departure', 'arrival', 'tourist', 'journey', 'vacation', 'abroad'],
        'Praca': ['meeting', 'salary', 'deadline', 'colleague', 'interview', 'promotion', 'contract', 'office', 'career', 'employee'],
        'Edukacja': ['university', 'degree', 'exam', 'course', 'lecture', 'research', 'knowledge', 'subject', 'skill', 'certificate'],
        'Media': ['news', 'newspaper', 'magazine', 'article', 'reporter', 'television', 'broadcast', 'channel', 'program', 'media'],
        'Środowisko': ['environment', 'pollution', 'nature', 'climate', 'forest', 'ocean', 'energy', 'recycle', 'protect', 'planet'],
        'Społeczeństwo': ['community', 'government', 'population', 'culture', 'tradition', 'society', 'citizen', 'election', 'law', 'policy'],
    },
    'B2': {
        'Biznes': ['entrepreneur', 'investment', 'competitor', 'negotiation', 'revenue', 'profit', 'budget', 'strategy', 'marketing', 'corporation'],
        'Nauka': ['hypothesis', 'experiment', 'phenomenon', 'molecule', 'theory', 'research', 'analysis', 'evidence', 'conclusion', 'discovery'],
        'Prawo': ['legislation', 'defendant', 'verdict', 'lawsuit', 'attorney', 'testimony', 'court', 'judge', 'trial', 'justice'],
        'Psychologia': ['consciousness', 'perception', 'behavior', 'motivation', 'personality', 'emotion', 'therapy', 'anxiety', 'depression', ''],
        'Ekonomia': ['inflation', 'recession', 'unemployment', 'exports', 'import', 'currency', 'stock', 'debt', 'economy', 'trade'],
        'Polityka': ['democracy', 'parliament', 'constitution', 'campaign', 'opposition', 'reform', 'diplomacy', 'treaty', 'alliance', 'vote'],
        'Sztuka': ['exhibition', 'gallery', 'sculpture', 'contemporary', 'masterpiece', 'portrait', 'abstract', 'creative', 'artistic', 'performance'],
        'Literatura': ['novel', 'poetry', 'fiction', 'narrative', 'metaphor', 'protagonist', 'plot', 'chapter', 'author', 'genre'],
    },
    'C1': {
        'Abstrakcja': ['ambiguity', 'complexity', 'concept', 'context', 'dimension', 'element', 'framework', 'implication', 'insight', 'perspective'],
        'Emocje': ['apprehension', 'astounded', 'devastated', 'elated', 'indifferent', 'livid', 'petrified', 'startled', 'tense', 'wary'],
        'Osobowość': ['conscientious', 'cynical', 'diligent', 'gregarious', 'impetuous', 'meticulous', 'obstinate', 'perceptive', 'unassuming', 'witty'],
        'Język': ['articulate', 'coherent', 'eloquent', 'fluent', 'inhibited', 'persuasive', 'rambling', 'responsive', 'succinct', 'tangibly'],
        'Społeczeństwo': ['marginalise', 'assimilation', 'segregation', 'integration', 'diversity', 'prejudice', 'discrimination', 'stereotype', 'tolerance', 'xenophobia'],
        'Nauka_Adv': ['empirical', 'theoretical', 'quantitative', 'qualitative', 'genetic', 'hereditary', 'evolutionary', 'metabolic', 'neurological', 'cognitive']
    }
}

def build_category_map():
    """Buduj mapę słówko -> (kategoria, poziom)"""
    category_map = {}
    for level, categories in WORD_DATABASE.items():
        for category, words in categories.items():
            for word in words:
                category_map[word.lower()] = (category, level)
    return category_map

def fix_categories():
    """Główna funkcja naprawy kategorii"""
    # Wczytaj słówka z pliku JSON
    print("📖 Wczytywanie words.json...")
    with open('wsad/words.json', 'r', encoding='utf-8') as f:
        words = json.load(f)
    
    print(f"✅ Wczytano {len(words)} słówek")
    
    # Zbuduj mapę kategorii
    print("🗺️  Budowanie mapy kategorii...")
    category_map = build_category_map()
    print(f"✅ Mapa zawiera {len(category_map)} słówek")
    
    # Statystyki
    stats_before = {}
    stats_after = {}
    fixed = 0
    not_found = 0
    not_found_words = []
    
    # Policz kategorie przed
    for word in words:
        cat = word.get('category', 'Unknown')
        stats_before[cat] = stats_before.get(cat, 0) + 1
    
    print(f"\n📊 Stan PRZED naprawą:")
    for cat, count in sorted(stats_before.items()):
        print(f"  {cat}: {count} słówek")
    
    # Napraw kategorie
    print(f"\n🔧 Naprawiam kategorie...")
    for word in words:
        if word.get('category', '').lower() == 'general':
            english_lower = word['english'].lower()
            if english_lower in category_map:
                new_category, new_level = category_map[english_lower]
                word['category'] = new_category
                word['level'] = new_level
                fixed += 1
            else:
                not_found += 1
                not_found_words.append(word['english'])
    
    # Policz kategorie po
    for word in words:
        cat = word.get('category', 'Unknown')
        stats_after[cat] = stats_after.get(cat, 0) + 1
    
    print(f"\n✅ Naprawiono: {fixed} słówek")
    print(f"❌ Nie znaleziono: {not_found} słówek")
    
    if not_found_words:
        print(f"\n📝 Przykładowe słówka nie znalezione (max 20):")
        for w in not_found_words[:20]:
            print(f"  - {w}")
    
    print(f"\n📊 Stan PO naprawie:")
    for cat, count in sorted(stats_after.items()):
        print(f"  {cat}: {count} słówek")
    
    # Zapisz poprawione słówka
    print(f"\n💾 Zapisywanie do words.json...")
    with open('wsad/words.json', 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=None)
    
    print(f"✅ Gotowe!")
    return fixed, not_found

if __name__ == '__main__':
    try:
        fixed, not_found = fix_categories()
        sys.exit(0 if not_found == 0 else 1)
    except Exception as e:
        print(f"❌ Błąd: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
