package com.reuxs.capsule

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * ReuXs Kontrol Paneli — the settings application. Deliberately separate from
 * the capsule overlay: the overlay only shows information, everything that can
 * be customised lives here.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        SettingsStore.init(applicationContext)
        super.onCreate(savedInstanceState)
        setContent {
            ReuXsTheme {
                ControlPanel()
            }
        }
    }

    private fun startCapsule() {
        ContextCompat.startForegroundService(
            this,
            Intent(this, CapsuleOverlayService::class.java)
        )
    }

    private fun stopCapsule() {
        stopService(Intent(this, CapsuleOverlayService::class.java))
    }

    private fun openOverlaySettings() {
        runCatching {
            startActivity(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
            )
        }
    }

    private fun openListenerSettings() {
        runCatching { startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)) }
    }

    private fun openExternal(url: String) {
        if (url.isBlank()) return
        runCatching {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }

    /** Pins a launcher shortcut that opens this control panel directly. */
    private fun addShortcut() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(ShortcutManager::class.java) ?: return
        if (!manager.isRequestPinShortcutSupported) return
        val shortcut = ShortcutInfo.Builder(this, "reuxs-panel")
            .setShortLabel("ReuXs")
            .setLongLabel("ReuXs Kontrol Paneli")
            .setIcon(Icon.createWithResource(this, R.mipmap.ic_launcher))
            .setIntent(Intent(this, MainActivity::class.java).setAction(Intent.ACTION_MAIN))
            .build()
        runCatching { manager.requestPinShortcut(shortcut, null) }
    }

    /* --------------------------------------------------------------- panel */

    @Composable
    private fun ControlPanel() {
        val context = LocalContext.current
        val scope = rememberCoroutineScope()
        val settings by SettingsStore.settings.collectAsState()
        val snapshot by CapsuleRuntime.snapshot.collectAsState()
        val lifecycleOwner = LocalLifecycleOwner.current

        var overlayGranted by remember { mutableStateOf(Settings.canDrawOverlays(context)) }
        var listenerGranted by remember {
            mutableStateOf(
                NotificationManagerCompat.getEnabledListenerPackages(context)
                    .contains(context.packageName)
            )
        }
        var capsuleRunning by remember { mutableStateOf(false) }
        var checkingUpdate by remember { mutableStateOf(false) }
        var askUpdate by remember { mutableStateOf(false) }

        DisposableEffect(lifecycleOwner) {
            val observer = LifecycleEventObserver { _, event ->
                if (event == Lifecycle.Event.ON_RESUME) {
                    overlayGranted = Settings.canDrawOverlays(context)
                    listenerGranted = NotificationManagerCompat.getEnabledListenerPackages(context)
                        .contains(context.packageName)
                }
            }
            lifecycleOwner.lifecycle.addObserver(observer)
            onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
        }

        // "İzin verilince otomatik başlat": no second tap after the permission
        // dialog, the capsule is already on screen when the panel returns.
        LaunchedEffect(overlayGranted, settings.startOnPermission) {
            if (overlayGranted && settings.startOnPermission && !capsuleRunning) {
                startCapsule()
                capsuleRunning = true
            }
        }

        LaunchedEffect(Unit) {
            if (!snapshot.update.checked) {
                CapsuleRuntime.setUpdate(UpdateChecker.check(context))
            }
        }

        // Auto-detected update: ask once instead of jumping to a browser.
        LaunchedEffect(snapshot.update.available, snapshot.update.latestVersion) {
            if (snapshot.update.available) askUpdate = true
        }

        if (askUpdate) {
            AlertDialog(
                onDismissRequest = { askUpdate = false },
                title = { Text("Yeni sürüm hazır") },
                text = {
                    Text(
                        "ReuXs v${snapshot.update.latestVersion} yayınlandı " +
                            "(kurulu: v${BuildConfig.VERSION_NAME}). Şimdi indirmek ister misin?"
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        askUpdate = false
                        openExternal(snapshot.update.apkUrl ?: snapshot.update.downloadUrl)
                    }) { Text("İndir", color = ReuXsColors.Crimson) }
                },
                dismissButton = {
                    TextButton(onClick = { askUpdate = false }) {
                        Text("Sonra", color = ReuXsColors.TextSecondary)
                    }
                },
                containerColor = Color(0xFF0B0707)
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(reuXsBackgroundBrush())
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 22.dp)
        ) {
            Text(
                text = "ReuXs",
                color = ReuXsColors.TextPrimary,
                fontSize = 32.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "KONTROL PANELİ",
                color = ReuXsColors.Crimson,
                fontSize = 10.sp,
                letterSpacing = 3.sp
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Kapsül yalnızca gösterir; her şey buradan ayarlanır. " +
                    "Değişiklikler anında kapsüle yansır ve cihazda saklanır.",
                color = ReuXsColors.TextSecondary,
                fontSize = 12.sp,
                lineHeight = 17.sp
            )

            Spacer(Modifier.height(16.dp))

            // Live preview of the real overlay component.
            CapsuleOverlay(
                snapshot = snapshot,
                settings = settings,
                onEvent = CapsuleRuntime::dispatch,
                onToggleTimer = CapsuleRuntime::toggleTimer,
                onResetTimer = CapsuleRuntime::resetTimer,
                onSetDuration = CapsuleRuntime::setTimerDuration,
                onSplit = { CapsuleRuntime.dispatch(CapsuleEvent.Split) },
                onOpenPanel = { },
                onTogglePlay = { MediaMonitor.togglePlay() }
            )

            Spacer(Modifier.height(14.dp))

            SettingsCard(
                title = "Kapsül",
                subtitle = "Ekran üstü kapsülü başlat, durdur veya geçici olarak gizle."
            ) {
                ToggleRow(
                    label = "Kapsülü geçici olarak gizle",
                    description = "Uygulama açık kalır, kapsül ekrandan kalkar.",
                    checked = settings.capsuleHidden,
                    onChange = { hidden -> SettingsStore.update { it.copy(capsuleHidden = hidden) } }
                )
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = {
                        when {
                            !overlayGranted -> openOverlaySettings()
                            capsuleRunning -> {
                                stopCapsule()
                                capsuleRunning = false
                            }

                            else -> {
                                startCapsule()
                                capsuleRunning = true
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (capsuleRunning) ReuXsColors.Blood else ReuXsColors.Crimson,
                        contentColor = if (capsuleRunning) ReuXsColors.TextPrimary else Color.Black
                    )
                ) {
                    Text(
                        text = when {
                            !overlayGranted -> "Önce ekran üstü iznini ver"
                            capsuleRunning -> "Kapsülü durdur"
                            else -> "Kapsülü başlat"
                        },
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                }
            }

            SettingsCard(
                title = "Kapsül içeriği",
                subtitle = "Kapsüle dokununca hangi kartlar açılsın? Kapsül sade kalır."
            ) {
                ToggleRow(
                    label = "Müzik kartı",
                    description = "Kapak, şarkı adı, ilerleme ve oynat/duraklat.",
                    checked = settings.capsulePanels.music,
                    onChange = { value ->
                        SettingsStore.update {
                            it.copy(capsulePanels = it.capsulePanels.copy(music = value))
                        }
                    }
                )
                ToggleRow(
                    label = "Zamanlayıcı kartı",
                    description = "Geri sayım, hazır süreler ve sıfırlama.",
                    checked = settings.capsulePanels.timer,
                    onChange = { value ->
                        SettingsStore.update {
                            it.copy(capsulePanels = it.capsulePanels.copy(timer = value))
                        }
                    }
                )
                ToggleRow(
                    label = "Hızlı eylemler",
                    description = "Böl, Odak 25 ve Panel düğmeleri.",
                    checked = settings.capsulePanels.actions,
                    onChange = { value ->
                        SettingsStore.update {
                            it.copy(capsulePanels = it.capsulePanels.copy(actions = value))
                        }
                    }
                )
            }

            SettingsCard(
                title = "Konum ve Boyut",
                subtitle = "Kapsülü kameranın etrafına piksel piksel hizala."
            ) {
                PanelSlider(
                    label = "Yatay konum (X)",
                    value = settings.offsetX.toFloat(),
                    valueText = "${settings.offsetX} px",
                    range = -400f..400f,
                    onChange = { value ->
                        SettingsStore.update { it.copy(offsetX = value.toInt()) }
                    }
                )
                PanelSlider(
                    label = "Dikey konum (Y)",
                    value = settings.offsetY.toFloat(),
                    valueText = "${settings.offsetY} px",
                    range = 0f..400f,
                    onChange = { value ->
                        SettingsStore.update { it.copy(offsetY = value.toInt()) }
                    }
                )
                PanelSlider(
                    label = "Ölçek",
                    value = settings.scale,
                    valueText = "${Math.round(settings.scale * 100)}%",
                    range = 0.75f..1.35f,
                    onChange = { value -> SettingsStore.update { it.copy(scale = value) } }
                )

                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PanelButton("Varsayılana sıfırla", primary = true) {
                        SettingsStore.update { it.copy(offsetX = 0, offsetY = 0, scale = 1f) }
                    }
                    PanelButton("Kamera hizası", primary = false) {
                        SettingsStore.update { it.copy(offsetX = 0, offsetY = 0) }
                    }
                }
            }

            SettingsCard(
                title = "Görünüm ve Renk",
                subtitle = "Opaklık, tema ve kenarlık parlaması."
            ) {
                PanelSlider(
                    label = "Arka plan opaklığı",
                    value = settings.opacity,
                    valueText = "${Math.round(settings.opacity * 100)}%",
                    range = 0.35f..1f,
                    onChange = { value -> SettingsStore.update { it.copy(opacity = value) } }
                )
                PanelSlider(
                    label = "Yumuşaklık (blur)",
                    value = settings.blur,
                    valueText = "${settings.blur.toInt()} px",
                    range = 0f..28f,
                    onChange = { value -> SettingsStore.update { it.copy(blur = value) } }
                )
                PanelSlider(
                    label = "Köşe yuvarlaklığı",
                    value = settings.radius.toFloat(),
                    valueText = "${settings.radius} px",
                    range = 8f..34f,
                    onChange = { value -> SettingsStore.update { it.copy(radius = value.toInt()) } }
                )
                PanelSlider(
                    label = "Kenarlık parlaması",
                    value = settings.glow.toFloat(),
                    valueText = "${settings.glow}%",
                    range = 0f..100f,
                    onChange = { value -> SettingsStore.update { it.copy(glow = value.toInt()) } }
                )

                Spacer(Modifier.height(4.dp))
                Text(
                    text = "TEMA",
                    color = ReuXsColors.TextMuted,
                    fontSize = 8.sp,
                    letterSpacing = 1.6.sp
                )
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        ThemeMode.CRIMSON to "Koyu Kırmızı",
                        ThemeMode.OLED to "Saf OLED",
                        ThemeMode.ALBUM to "Albüm"
                    ).forEach { (mode, label) ->
                        ChoiceChip(
                            label = label,
                            selected = settings.themeMode == mode,
                            modifier = Modifier.weight(1f)
                        ) { SettingsStore.update { it.copy(themeMode = mode) } }
                    }
                }
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ChoiceChip(
                        label = "Özel Renk",
                        selected = settings.themeMode == ThemeMode.CUSTOM,
                        modifier = Modifier.weight(1f)
                    ) { SettingsStore.update { it.copy(themeMode = ThemeMode.CUSTOM) } }
                }

                if (settings.themeMode == ThemeMode.CUSTOM) {
                    Spacer(Modifier.height(10.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        PRESET_ACCENTS.forEach { color ->
                            Box(
                                modifier = Modifier
                                    .size(26.dp)
                                    .clip(CircleShape)
                                    .background(Color(color))
                                    .border(
                                        width = if (settings.customAccent == color) 2.dp else 1.dp,
                                        color = if (settings.customAccent == color) {
                                            ReuXsColors.TextPrimary
                                        } else {
                                            Color(0x33FFFFFF)
                                        },
                                        shape = CircleShape
                                    )
                                    .clickable {
                                        SettingsStore.update { it.copy(customAccent = color) }
                                    }
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    var hex by remember(settings.customAccent) {
                        mutableStateOf(
                            String.format(Locale.US, "#%06X", settings.customAccent and 0xFFFFFFL)
                        )
                    }
                    OutlinedTextField(
                        value = hex,
                        onValueChange = { value ->
                            hex = value
                            val parsed = value.removePrefix("#").toLongOrNull(16)
                            if (parsed != null && value.length >= 7) {
                                SettingsStore.update {
                                    it.copy(customAccent = 0xFF000000L or (parsed and 0xFFFFFFL))
                                }
                            }
                        },
                        label = { Text("Vurgu rengi (hex)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            color = ReuXsColors.TextPrimary
                        )
                    )
                }
            }

            SettingsCard(
                title = "Müzik ve Visualizer",
                subtitle = "Sistemin medya oturumu dinlenir; hesap veya API anahtarı gerekmez."
            ) {
                ToggleRow(
                    label = "Müzik modülü",
                    description = "Şarkı adı, sanatçı, kapak ve oynatma durumu kapsülde görünür.",
                    checked = settings.musicEnabled,
                    onChange = { enabled ->
                        SettingsStore.update { it.copy(musicEnabled = enabled) }
                        if (enabled) MediaMonitor.start(context) else MediaMonitor.stop()
                    }
                )
                ToggleRow(
                    label = "Albüm kapağı rengine bürün",
                    description = "Kapsül gradyanı kapağın baskın rengine yumuşak geçişle uyar.",
                    checked = settings.adaptivePalette,
                    enabled = settings.musicEnabled,
                    onChange = { value ->
                        SettingsStore.update { it.copy(adaptivePalette = value) }
                    }
                )
                ToggleRow(
                    label = "Visualizer'ı göster",
                    description = "Çalarken ritmik çubuklar veya dalga animasyonu.",
                    checked = settings.visualizer,
                    enabled = settings.musicEnabled,
                    onChange = { value ->
                        SettingsStore.update { it.copy(visualizer = value) }
                    }
                )
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ChoiceChip(
                        label = "Çubuklar",
                        selected = settings.visualizerStyle == VisualizerStyle.BARS,
                        modifier = Modifier.weight(1f)
                    ) {
                        SettingsStore.update { it.copy(visualizerStyle = VisualizerStyle.BARS) }
                    }
                    ChoiceChip(
                        label = "Dalga",
                        selected = settings.visualizerStyle == VisualizerStyle.WAVE,
                        modifier = Modifier.weight(1f)
                    ) {
                        SettingsStore.update { it.copy(visualizerStyle = VisualizerStyle.WAVE) }
                    }
                }

                val track = snapshot.nowPlaying?.takeIf { it.hasTrack }
                if (track != null) {
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0x22FFFFFF))
                        ) {
                            track.art?.let { art ->
                                androidx.compose.foundation.Image(
                                    bitmap = art.asImageBitmap(),
                                    contentDescription = null,
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = track.title,
                                color = ReuXsColors.TextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = track.artist.ifBlank { "Bilinmeyen sanatçı" },
                                color = ReuXsColors.TextSecondary,
                                fontSize = 10.sp
                            )
                        }
                        MusicVisualizer(
                            active = track.playing,
                            style = settings.visualizerStyle,
                            color = ReuXsColors.Crimson,
                            bars = 5
                        )
                        Spacer(Modifier.width(8.dp))
                        PanelButton(
                            if (track.playing) "Duraklat" else "Oynat",
                            primary = true
                        ) { MediaMonitor.togglePlay() }
                    }
                } else {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Şu an aktif medya oturumu yok. Herhangi bir oynatıcıda şarkı " +
                            "başlat; burada ve kapsülde anında görünür.",
                        color = ReuXsColors.TextMuted,
                        fontSize = 10.5.sp,
                        lineHeight = 15.sp
                    )
                }
            }

            SettingsCard(
                title = "Genel ve Güncelleme",
                subtitle = "Başlangıç davranışı, izinler ve sürüm."
            ) {
                ToggleRow(
                    label = "Başlangıçta otomatik çalıştır",
                    description = "Telefon açıldığında kapsül kendiliğinden başlar.",
                    checked = settings.autostart,
                    onChange = { value ->
                        SettingsStore.update { it.copy(autostart = value) }
                    }
                )
                ToggleRow(
                    label = "İzin verilince otomatik başlat",
                    description = "Ekran üstü izni açıldığında kapsül kendiliğinden başlar; " +
                        "düğmeye basman gerekmez.",
                    checked = settings.startOnPermission,
                    onChange = { value ->
                        SettingsStore.update { it.copy(startOnPermission = value) }
                    }
                )

                Spacer(Modifier.height(8.dp))
                PanelButton("Ana ekrana kısayol ekle", primary = false) {
                    addShortcut()
                }

                Spacer(Modifier.height(6.dp))
                PermissionRow(
                    title = "Ekran üstü kapsül",
                    granted = overlayGranted,
                    onAction = { openOverlaySettings() }
                )
                Spacer(Modifier.height(6.dp))
                PermissionRow(
                    title = "Bildirim erişimi (bildirim sayısı + müzik)",
                    granted = listenerGranted,
                    onAction = { openListenerSettings() }
                )

                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ReuXs v${BuildConfig.VERSION_NAME}",
                            color = ReuXsColors.TextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = when {
                                snapshot.update.error != null -> "Denetim hatası: ${snapshot.update.error}"
                                snapshot.update.available ->
                                    "Yeni sürüm: v${snapshot.update.latestVersion}"

                                snapshot.update.checked -> "En güncel sürüm"
                                else -> "Henüz denetlenmedi"
                            },
                            color = ReuXsColors.TextMuted,
                            fontSize = 9.5.sp
                        )
                    }
                    PanelButton(
                        if (checkingUpdate) "Denetleniyor…" else "Güncellemeleri Kontrol Et",
                        primary = false
                    ) {
                        checkingUpdate = true
                        scope.launch {
                            CapsuleRuntime.setUpdate(UpdateChecker.check(context))
                            checkingUpdate = false
                        }
                    }
                }

                if (snapshot.update.available) {
                    Spacer(Modifier.height(8.dp))
                    PanelButton("v${snapshot.update.latestVersion} APK indir", primary = true) {
                        openExternal(snapshot.update.apkUrl ?: snapshot.update.downloadUrl)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            Text(
                text = "v${BuildConfig.VERSION_NAME} · MIT lisanslı · veri toplamaz · " +
                    "ayarlar cihazda saklanır",
                color = ReuXsColors.TextMuted,
                fontSize = 9.sp,
                letterSpacing = 0.6.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.height(24.dp))
        }
    }

    /* ---------------------------------------------------------- primitives */

    @Composable
    private fun SettingsCard(
        title: String,
        subtitle: String? = null,
        content: @Composable ColumnScope.() -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0x59140505))
                .border(1.dp, ReuXsColors.Border.copy(alpha = 0.45f), RoundedCornerShape(18.dp))
                .padding(14.dp)
        ) {
            Text(
                text = title,
                color = ReuXsColors.TextPrimary,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.SemiBold
            )
            if (subtitle != null) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    color = ReuXsColors.TextMuted,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
            Spacer(Modifier.height(10.dp))
            content()
        }
    }

    @Composable
    private fun PanelSlider(
        label: String,
        value: Float,
        valueText: String,
        range: ClosedFloatingPointRange<Float>,
        onChange: (Float) -> Unit
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = label,
                    color = ReuXsColors.TextSecondary,
                    fontSize = 11.5.sp,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = valueText,
                    color = ReuXsColors.CrimsonSoft,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            Slider(
                value = value.coerceIn(range.start, range.endInclusive),
                onValueChange = onChange,
                valueRange = range,
                colors = SliderDefaults.colors(
                    thumbColor = ReuXsColors.Crimson,
                    activeTrackColor = ReuXsColors.Crimson,
                    inactiveTrackColor = Color(0x33FFFFFF)
                )
            )
        }
    }

    @Composable
    private fun ToggleRow(
        label: String,
        description: String,
        checked: Boolean,
        enabled: Boolean = true,
        onChange: (Boolean) -> Unit
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 3.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    color = if (enabled) ReuXsColors.TextPrimary else ReuXsColors.TextMuted,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = description,
                    color = ReuXsColors.TextMuted,
                    fontSize = 9.5.sp,
                    lineHeight = 13.sp
                )
            }
            Spacer(Modifier.width(10.dp))
            Switch(
                checked = checked,
                onCheckedChange = onChange,
                enabled = enabled,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.Black,
                    checkedTrackColor = ReuXsColors.Crimson,
                    uncheckedThumbColor = ReuXsColors.TextMuted,
                    uncheckedTrackColor = Color(0x33FFFFFF)
                )
            )
        }
    }

    @Composable
    private fun ChoiceChip(
        label: String,
        selected: Boolean,
        modifier: Modifier = Modifier,
        onClick: () -> Unit
    ) {
        Text(
            text = label,
            color = if (selected) Color.Black else ReuXsColors.TextSecondary,
            fontSize = 10.5.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = modifier
                .clip(CircleShape)
                .background(if (selected) ReuXsColors.Crimson else Color(0x14FFFFFF))
                .border(
                    1.dp,
                    if (selected) Color.Transparent else Color(0x1FFFFFFF),
                    CircleShape
                )
                .clickable { onClick() }
                .padding(horizontal = 10.dp, vertical = 8.dp)
        )
    }

    @Composable
    private fun PanelButton(label: String, primary: Boolean, onClick: () -> Unit) {
        Text(
            text = label,
            color = if (primary) Color.Black else ReuXsColors.TextSecondary,
            fontSize = 10.5.sp,
            fontWeight = if (primary) FontWeight.SemiBold else FontWeight.Normal,
            modifier = Modifier
                .clip(CircleShape)
                .background(if (primary) ReuXsColors.Crimson else Color(0x14FFFFFF))
                .border(
                    1.dp,
                    if (primary) Color.Transparent else Color(0x1FFFFFFF),
                    CircleShape
                )
                .clickable { onClick() }
                .padding(horizontal = 12.dp, vertical = 8.dp)
        )
    }

    @Composable
    private fun PermissionRow(title: String, granted: Boolean, onAction: () -> Unit) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0x33000000))
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            Text(
                text = title,
                color = ReuXsColors.TextSecondary,
                fontSize = 10.5.sp,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = if (granted) "AKTİF" else "İZİN VER",
                color = if (granted) ReuXsColors.CrimsonSoft else ReuXsColors.Crimson,
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.sp,
                modifier = Modifier
                    .clip(CircleShape)
                    .clickable { onAction() }
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }

    companion object {
        private val PRESET_ACCENTS = listOf(
            0xFFEF4444L,
            0xFFF97316L,
            0xFFFACC15L,
            0xFF22C55EL,
            0xFF22D3EEL,
            0xFFA855F7L,
            0xFFF43F5EL
        )
    }
}
