package app.vocabulando.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import androidx.glance.text.Text
import org.json.JSONArray

data class CachedWidgetWord(
    val word: String,
    val phoneticIpa: String,
    val shortDefinition: String
)

/**
 * Widget Android (Jetpack Glance) alimentado por pré-cache local de 14 dias.
 * Garante funcionamento 100% offline e zero tela preta mesmo no primeiro boot.
 */
class VocabulandoGlanceWidget : GlanceAppWidget() {
    private val fallback = CachedWidgetWord(
        word = "eloquência",
        phoneticIpa = "/e.loˈkwẽ.sjɐ/",
        shortDefinition = "Capacidade de se expressar com clareza, fluência e persuasão."
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val word = loadWordForToday(context) ?: fallback
        provideContent {
            WordWidgetContent(word)
        }
    }

    private fun loadWordForToday(context: Context): CachedWidgetWord? {
        val prefs = context.getSharedPreferences("vocabulando_widget_cache", Context.MODE_PRIVATE)
        val raw = prefs.getString("widget_words_14d", null) ?: return null
        return try {
            val arr = JSONArray(raw)
            if (arr.length() == 0) return null
            val item = arr.getJSONObject(0)
            CachedWidgetWord(
                word = item.getString("word"),
                phoneticIpa = item.getString("phoneticIpa"),
                shortDefinition = item.getString("shortDefinition")
            )
        } catch (_: Exception) {
            null
        }
    }
}

@Composable
private fun WordWidgetContent(entry: CachedWidgetWord) {
    Column(modifier = GlanceModifier.padding(14.dp)) {
        Text(text = entry.word)
        Text(text = entry.phoneticIpa)
        Text(text = entry.shortDefinition)
    }
}
