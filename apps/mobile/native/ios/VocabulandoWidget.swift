import WidgetKit
import SwiftUI

struct WidgetWordEntry: TimelineEntry, Codable {
    let date: Date
    let word: String
    let phoneticIpa: String
    let shortDefinition: String
}

/// Lê o pré-cache local de 14 dias salvo pelo app React Native no App Group compartilhado.
/// Possui fallback embutido no binário para nunca exibir "tela preta" ao usuário.
struct VocabulandoProvider: TimelineProvider {
    private let appGroupId = "group.app.vocabulando.shared"
    private let cacheKey = "widget_words_14d"

    private let fallbackWord = WidgetWordEntry(
        date: Date(),
        word: "eloquência",
        phoneticIpa: "/e.loˈkwẽ.sjɐ/",
        shortDefinition: "Capacidade de se expressar com clareza, fluência e persuasão."
    )

    func placeholder(in context: Context) -> WidgetWordEntry { fallbackWord }

    func getSnapshot(in context: Context, completion: @escaping (WidgetWordEntry) -> Void) {
        completion(loadCachedWord(offset: 0) ?? fallbackWord)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetWordEntry>) -> Void) {
        let now = Date()
        var entries: [WidgetWordEntry] = []
        for day in 0..<7 {
            let entryDate = Calendar.current.date(byAdding: .day, value: day, to: now) ?? now
            let cached = loadCachedWord(offset: day) ?? fallbackWord
            entries.append(WidgetWordEntry(
                date: entryDate,
                word: cached.word,
                phoneticIpa: cached.phoneticIpa,
                shortDefinition: cached.shortDefinition
            ))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func loadCachedWord(offset: Int) -> WidgetWordEntry? {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: cacheKey),
              let decoded = try? JSONDecoder().decode([WidgetWordEntry].self, from: data),
              !decoded.isEmpty else { return nil }
        return decoded[offset % decoded.count]
    }
}

struct VocabulandoWidgetView: View {
    var entry: WidgetWordEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.word)
                .font(.system(.title3, design: .serif).bold())
            Text(entry.phoneticIpa)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(entry.shortDefinition)
                .font(.caption)
                .lineLimit(3)
        }
        .padding(12)
    }
}
