const fs = require("node:fs");
const path = require("node:path");
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withMainApplication,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

const WIDGET_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="220dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`;

const GLANCE_WIDGET_KT = `package app.vocabulando.widget

import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import app.vocabulando.MainActivity
import org.json.JSONArray
import java.util.Calendar

data class CachedWidgetWord(
    val word: String,
    val phoneticIpa: String,
    val shortDefinition: String
)

class VocabulandoGlanceWidget : GlanceAppWidget() {
    private val fallback = CachedWidgetWord(
        word = "eloquência",
        phoneticIpa = "/e.loˈkwẽ.sjɐ/",
        shortDefinition = "Capacidade de se expressar com clareza, fluência e poder de persuasão."
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("vocabulando_widget_cache", Context.MODE_PRIVATE)
        val savedTheme = prefs.getString("widget_theme_mode", "system")
        val systemDark = (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val isDark = if (savedTheme == "night") true else if (savedTheme == "day") systemDark else systemDark
        val word = loadWordForToday(prefs) ?: fallback
        val studiedCount = prefs.getInt("widget_studied_today", 0)
        provideContent {
            WordWidgetContent(word, isDark, studiedCount)
        }
    }

    private fun loadWordForToday(prefs: android.content.SharedPreferences): CachedWidgetWord? {
        val raw = prefs.getString("widget_words_14d", null) ?: return null
        return try {
            val arr = JSONArray(raw)
            if (arr.length() == 0) return null
            val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
            val offset = prefs.getInt("widget_word_offset", 0)
            val item = arr.getJSONObject((dayOfYear + offset) % arr.length())
            CachedWidgetWord(
                word = item.getString("word"),
                phoneticIpa = item.optString("phoneticIpa", ""),
                shortDefinition = item.getString("shortDefinition")
            )
        } catch (_: Exception) {
            null
        }
    }
}

class NextWidgetWordAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val prefs = context.getSharedPreferences("vocabulando_widget_cache", Context.MODE_PRIVATE)
        val next = prefs.getInt("widget_word_offset", 0) + 1
        prefs.edit().putInt("widget_word_offset", next).apply()
        VocabulandoGlanceWidget().updateAll(context)
    }
}

class MarkWidgetWordAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val prefs = context.getSharedPreferences("vocabulando_widget_cache", Context.MODE_PRIVATE)
        val studied = prefs.getInt("widget_studied_today", 0) + 1
        val next = prefs.getInt("widget_word_offset", 0) + 1
        prefs.edit().putInt("widget_studied_today", studied).putInt("widget_word_offset", next).apply()
        VocabulandoGlanceWidget().updateAll(context)
    }
}

@Composable
private fun WordWidgetContent(entry: CachedWidgetWord, isDark: Boolean, studiedCount: Int) {
    val bg = if (isDark) Color(0xFF13161C) else Color(0xFFF6F3EC)
    val accent = if (isDark) Color(0xFF67B897) else Color(0xFF246A52)
    val titleColor = if (isDark) Color(0xFFEFEDE8) else Color(0xFF1C1B18)
    val mutedColor = if (isDark) Color(0xFF9EA5B3) else Color(0xFF656056)
    val chipBg = if (isDark) Color(0xFF1E242E) else Color(0xFFE9E4D8)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(bg))
            .cornerRadius(20.dp)
            .padding(16.dp)
            .clickable(actionStartActivity<MainActivity>())
    ) {
        Text(
            text = "VOCABULANDO • PALAVRA DO DIA",
            style = TextStyle(
                color = ColorProvider(accent),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        Text(
            text = entry.word,
            style = TextStyle(
                color = ColorProvider(titleColor),
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
        )
        if (entry.phoneticIpa.isNotEmpty()) {
            Text(
                text = entry.phoneticIpa,
                style = TextStyle(
                    color = ColorProvider(accent),
                    fontSize = 11.sp
                )
            )
        }
        Spacer(modifier = GlanceModifier.height(6.dp))
        Text(
            text = entry.shortDefinition,
            maxLines = 2,
            style = TextStyle(
                color = ColorProvider(mutedColor),
                fontSize = 12.sp
            )
        )
        Spacer(modifier = GlanceModifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (studiedCount > 0) "Já sei ✓ ($studiedCount)" else "Já sei ✓",
                modifier = GlanceModifier
                    .background(ColorProvider(accent))
                    .cornerRadius(10.dp)
                    .padding(horizontal = 10.dp, vertical = 5.dp)
                    .clickable(actionRunCallback<MarkWidgetWordAction>()),
                style = TextStyle(
                    color = ColorProvider(bg),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(modifier = GlanceModifier.width(8.dp))
            Text(
                text = "Outra ↻",
                modifier = GlanceModifier
                    .background(ColorProvider(chipBg))
                    .cornerRadius(10.dp)
                    .padding(horizontal = 10.dp, vertical = 5.dp)
                    .clickable(actionRunCallback<NextWidgetWordAction>()),
                style = TextStyle(
                    color = ColorProvider(titleColor),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}
`;

const WIDGET_RECEIVER_KT = `package app.vocabulando.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

class VocabulandoWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = VocabulandoGlanceWidget()
}
`;

const WIDGET_MODULE_KT = `package app.vocabulando.widget

import android.content.Context
import androidx.glance.appwidget.updateAll
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class VocabulandoWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "VocabulandoWidget"

    @ReactMethod
    fun saveWidgetCache(jsonArrayString: String, themeMode: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                "vocabulando_widget_cache",
                Context.MODE_PRIVATE
            )
            prefs.edit()
                .putString("widget_words_14d", jsonArrayString)
                .putString("widget_theme_mode", themeMode)
                .apply()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    VocabulandoGlanceWidget().updateAll(reactContext)
                } catch (_: Exception) {
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
`;

const WIDGET_PACKAGE_KT = `package app.vocabulando.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class VocabulandoWidgetPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(VocabulandoWidgetModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`;

function withVocabulandoWidget(config) {
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    if (!props.some((p) => p.type === "property" && p.key === "android.overridePathCheck")) {
      props.push({ type: "property", key: "android.overridePathCheck", value: "true" });
    }
    const jvm = props.find((p) => p.type === "property" && p.key === "org.gradle.jvmargs");
    if (jvm && !jvm.value.includes("-Dfile.encoding=UTF-8")) {
      jvm.value = `${jvm.value} -Dfile.encoding=UTF-8`;
    }
    return cfg;
  });

  config = withProjectBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes("org.jetbrains.kotlin.plugin.compose")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n        classpath("org.jetbrains.kotlin.plugin.compose:org.jetbrains.kotlin.plugin.compose.gradle.plugin:2.2.10")`,
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes("org.jetbrains.kotlin.plugin.compose")) {
      contents = contents.replace(
        'apply plugin: "org.jetbrains.kotlin.android"',
        'apply plugin: "org.jetbrains.kotlin.android"\napply plugin: "org.jetbrains.kotlin.plugin.compose"',
      );
    }
    if (!contents.includes("buildFeatures")) {
      contents = contents.replace(
        /android\s*\{/,
        `android {\n    buildFeatures {\n        compose true\n    }\n    externalNativeBuild {\n        cmake {\n            buildStagingDirectory file("C:/Temp/vcxx")\n        }\n    }`,
      );
    }
    if (!contents.includes("CMAKE_OBJECT_PATH_MAX")) {
      contents = contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {\n        externalNativeBuild {\n            cmake {\n                arguments "-DCMAKE_OBJECT_PATH_MAX=100"\n            }\n        }`,
      );
    }
    if (!contents.includes("androidx.glance:glance-appwidget")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation("androidx.glance:glance-appwidget:1.1.1")\n    implementation("androidx.glance:glance-material3:1.1.1")\n    implementation("androidx.compose.runtime:runtime:1.7.8")`,
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app.receiver = app.receiver || [];
    const receiverName = ".widget.VocabulandoWidgetReceiver";
    const exists = app.receiver.some((r) => r.$ && r.$["android:name"] === receiverName);
    if (!exists) {
      app.receiver.push({
        $: {
          "android:name": receiverName,
          "android:exported": "true",
          "android:label": "Vocabulando • Palavra do Dia",
        },
        "intent-filter": [
          {
            action: [
              {
                $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": "@xml/vocabulando_widget_info",
            },
          },
        ],
      });
    }
    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes("VocabulandoWidgetPackage")) {
      contents = contents.replace(
        "import expo.modules.ApplicationLifecycleDispatcher",
        "import app.vocabulando.widget.VocabulandoWidgetPackage\nimport expo.modules.ApplicationLifecycleDispatcher",
      );
      contents = contents.replace(
        "PackageList(this).packages.apply {",
        "PackageList(this).packages.apply {\n              add(VocabulandoWidgetPackage())",
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const xmlDir = path.join(root, "app/src/main/res/xml");
      const widgetDir = path.join(root, "app/src/main/java/app/vocabulando/widget");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.mkdirSync(widgetDir, { recursive: true });

      fs.writeFileSync(path.join(xmlDir, "vocabulando_widget_info.xml"), WIDGET_XML, "utf8");
      fs.writeFileSync(path.join(widgetDir, "VocabulandoGlanceWidget.kt"), GLANCE_WIDGET_KT, "utf8");
      fs.writeFileSync(path.join(widgetDir, "VocabulandoWidgetReceiver.kt"), WIDGET_RECEIVER_KT, "utf8");
      fs.writeFileSync(path.join(widgetDir, "VocabulandoWidgetModule.kt"), WIDGET_MODULE_KT, "utf8");
      fs.writeFileSync(path.join(widgetDir, "VocabulandoWidgetPackage.kt"), WIDGET_PACKAGE_KT, "utf8");
      return cfg;
    },
  ]);

  return config;
}

module.exports = withVocabulandoWidget;
