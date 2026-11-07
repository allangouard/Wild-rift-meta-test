package fr.wrdi.draftmini

import android.app.*
import android.content.*
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.*
import android.webkit.*
import android.widget.*
import kotlin.math.abs
import kotlin.math.min

/**
 * Prototype Android overlay, started explicitly from MainActivity.
 * The existing website and decision engine remain unchanged.
 */
class OverlayService : Service() {
    companion object {
        const val ACTION_SHOW = "fr.wrdi.draftmini.SHOW"
        const val ACTION_STOP = "fr.wrdi.draftmini.STOP"
        private const val CHANNEL = "wrdi_overlay"
        // Same-origin HTTPS website; all analysis continues to use the existing engine.
        private const val APP_URL = "https://raw.githack.com/allangouard/Wild-rift-meta-test/main/index.html"
    }

    private lateinit var manager: WindowManager
    private var window: View? = null
    private var params: WindowManager.LayoutParams? = null
    private var webView: WebView? = null
    private var expanded = false
    private var panelLarge = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        manager = getSystemService(WINDOW_SERVICE) as WindowManager
        val channel = NotificationChannel(CHANNEL, "Fenêtre WR Draft Mini", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        if (!Settings.canDrawOverlays(this)) {
            stopSelf()
            return START_NOT_STICKY
        }
        val stop = Intent(this, OverlayService::class.java).apply { action = ACTION_STOP }
        val pendingStop = PendingIntent.getService(
            this, 11, stop, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = Notification.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setContentTitle("WR Draft Mini actif")
            .setContentText("Fenêtre flottante — fermer via la bulle ou cette notification")
            .setOngoing(true)
            .addAction(Notification.Action.Builder(null, "Fermer", pendingStop).build())
            .build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(101, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(101, notification)
        }
        if (window == null) showBubble()
        return START_NOT_STICKY
    }

    private fun dp(n: Int) = (n * resources.displayMetrics.density).toInt()

    private fun rounded(color: Int, radius: Int = 18, border: Int = 0): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radius).toFloat()
            if (border != 0) setStroke(dp(1), border)
        }

    private fun text(value: String, size: Float = 14f, color: Int = Color.WHITE) =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            gravity = Gravity.CENTER_VERTICAL
        }

    private fun removeWindow(keepBrowser: Boolean = false) {
        val old = window
        window = null
        params = null
        if (old != null) runCatching { manager.removeView(old) }
        if (!keepBrowser) {
            webView?.apply {
                stopLoading()
                loadUrl("about:blank")
                destroy()
            }
            webView = null
        }
    }

    private fun addWindow(view: View, width: Int, height: Int, focusable: Boolean) {
        val flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            (if (focusable) 0 else WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE)
        val layout = WindowManager.LayoutParams(
            width, height, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            flags, PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dp(12)
            y = dp(150)
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
        manager.addView(view, layout)
        window = view
        params = layout
    }

    private fun draggable(view: View, onTap: (() -> Unit)? = null) {
        view.setOnTouchListener(object : View.OnTouchListener {
            var originX = 0
            var originY = 0
            var downX = 0f
            var downY = 0f
            var moved = false
            override fun onTouch(v: View, event: MotionEvent): Boolean {
                val p = params ?: return false
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        originX = p.x; originY = p.y
                        downX = event.rawX; downY = event.rawY
                        moved = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - downX
                        val dy = event.rawY - downY
                        if (abs(dx) > dp(8) || abs(dy) > dp(8)) moved = true
                        if (moved) {
                            p.x = (originX + dx.toInt()).coerceAtLeast(0)
                            p.y = (originY + dy.toInt()).coerceAtLeast(0)
                            window?.let { current -> runCatching { manager.updateViewLayout(current, p) } }
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!moved) onTap?.invoke()
                        return true
                    }
                }
                return true
            }
        })
    }

    private fun showBubble() {
        webView?.let { browser -> (browser.parent as? android.view.ViewGroup)?.removeView(browser) }
        removeWindow(keepBrowser = true)
        expanded = false
        panelLarge = false
        val bubble = TextView(this).apply {
            text = "⚔"
            textSize = 27f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(216, 185, 120))
            background = rounded(Color.rgb(18, 52, 64), 29, Color.rgb(111, 226, 210))
            contentDescription = "Ouvrir WR Draft Mini"
        }
        addWindow(bubble, dp(58), dp(58), false)
        draggable(bubble) { showPanel() }
    }

    private fun showPanel() {
        removeWindow(keepBrowser = true)
        expanded = true
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(Color.rgb(9, 27, 38), 19, Color.rgb(76, 121, 129))
            clipToOutline = true
        }
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(6), dp(7), dp(6))
            setBackgroundColor(Color.rgb(20, 51, 64))
        }
        val title = text("WR Draft Mini", 16f, Color.rgb(111, 226, 210))
        header.addView(title, LinearLayout.LayoutParams(0, dp(43), 1f))
        fun action(symbol: String, label: String, callback: () -> Unit): Button =
            Button(this).apply {
                text = symbol
                contentDescription = label
                textSize = 15f
                setTextColor(Color.WHITE)
                isAllCaps = false
                minWidth = 0; minimumWidth = 0; minHeight = 0; minimumHeight = 0
                background = rounded(Color.rgb(38, 74, 85), 10)
                setOnClickListener { callback() }
            }
        header.addView(action("□", "Agrandir ou réduire la fenêtre") {
            panelLarge = !panelLarge
            val layout = params
            val panel = window
            if (layout != null && panel != null) {
                layout.width = min(dp(if (panelLarge) 355 else 310), resources.displayMetrics.widthPixels - dp(20))
                layout.height = min(dp(if (panelLarge) 585 else 355), resources.displayMetrics.heightPixels - dp(90))
                // Do not let enlarged window start outside the device screen.
                layout.x = layout.x.coerceIn(0, (resources.displayMetrics.widthPixels - layout.width).coerceAtLeast(0))
                layout.y = layout.y.coerceIn(0, (resources.displayMetrics.heightPixels - layout.height).coerceAtLeast(0))
                manager.updateViewLayout(panel, layout)
            }
        }, LinearLayout.LayoutParams(dp(39), dp(41)))
        header.addView(View(this), LinearLayout.LayoutParams(dp(5), dp(1)))
        header.addView(action("−", "Réduire en bulle") { showBubble() },
            LinearLayout.LayoutParams(dp(43), dp(41)))
        val spacer = View(this)
        header.addView(spacer, LinearLayout.LayoutParams(dp(6), dp(1)))
        header.addView(action("×", "Fermer complètement") { stopSelf() },
            LinearLayout.LayoutParams(dp(43), dp(41)))
        root.addView(header)

        val browser = webView ?: WebView(this).apply {
            setBackgroundColor(Color.rgb(9, 27, 38))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // Presentation-only CSS. The full website scripts remain untouched.
                    view?.evaluateJavascript(
                        """
                        (function() {
                          if (document.getElementById('wrdi-mini-android-style')) return;
                          const style = document.createElement('style');
                          style.id = 'wrdi-mini-android-style';
                          style.textContent = `
                            html,body{width:100%;max-width:100%;overflow-x:hidden!important}
                            body{background:#091b26!important;font-size:12px!important}
                            header,footer{display:none!important}
                            main{padding:7px!important;max-width:100%!important}
                            .card{padding:9px!important;margin-bottom:10px!important;border-radius:12px!important}
                            .card h2{font-size:16px!important;margin:2px 0 7px!important}
                            section[aria-label="Saisie de la draft"]>p.muted{display:none!important}
                            .draft-grid{grid-template-columns:1fr!important;gap:6px!important}
                            .team{min-width:0}
                            .team h3{font-size:12px!important;margin:5px 0 7px!important}
                            #wrdi-allies,#wrdi-enemies{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
                            .wrdi-slot{position:relative!important;width:100%!important;min-width:0!important;
                              padding:3px!important;min-height:54px!important;margin:0!important;
                              flex-direction:column!important;justify-content:center!important;gap:2px!important}
                            .wrdi-slot-text{display:none!important}
                            .wrdi-slot-plus,.slot-portrait{width:38px!important;height:38px!important}
                            .wrdi-slot::after{font-size:8px!important;color:#bfd4da!important}
                            .wrdi-slot:nth-child(1)::after{content:"TOP"}
                            .wrdi-slot:nth-child(2)::after{content:"JGL"}
                            .wrdi-slot:nth-child(3)::after{content:"MID"}
                            .wrdi-slot:nth-child(4)::after{content:"ADC"}
                            .wrdi-slot:nth-child(5)::after{content:"SUP"}
                            .actions{margin:9px 0 3px!important;gap:5px!important}
                            .actions button{min-height:43px!important;font-size:13px!important;padding:8px!important}
                            #wrdi-message{font-size:10px!important;line-height:1.35!important}
                            #wrdi-result{padding:9px!important}
                            .ep-result-layout{gap:7px!important}
                            .ep-result-hero,.ep-summary-section{padding:9px!important;border-radius:11px!important}
                            .ep-result-hero h2{font-size:17px!important}
                            .ep-hero-caption{display:none!important}
                            .ep-summary-section h3{font-size:14px!important;margin:0 0 7px!important}
                            .ep-item-grid{gap:3px!important}
                            .ep-build-name{font-size:9px!important}
                            .ep-build-media{max-width:51px!important}
                            .ep-full-report{margin-top:5px!important}
                            .wrdi-picker-sheet{height:90dvh!important;width:100%!important}
                            .wrdi-picker-scroll{padding:10px!important}
                            .wrdi-picker-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
                          `;
                          document.head.appendChild(style);
                        })();
                        """.trimIndent(),
                        null
                    )
                    // Mini presentation is an asset: no changes to existing analysis code.
                    val miniJs = assets.open("wrdi-mini-ui.js").bufferedReader(Charsets.UTF_8).use { it.readText() }
                    view?.evaluateJavascript(miniJs, null)
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return true
                    return uri.scheme != "https" ||
                        (uri.host != "raw.githack.com" &&
                         uri.host != "raw.githubusercontent.com")
                }
            }
            loadUrl(APP_URL)
        }
        webView = browser
        (browser.parent as? android.view.ViewGroup)?.removeView(browser)
        root.addView(browser, LinearLayout.LayoutParams(-1, 0, 1f))
        val width = min(dp(if (panelLarge) 355 else 310), resources.displayMetrics.widthPixels - dp(20))
        val height = min(dp(if (panelLarge) 585 else 355), resources.displayMetrics.heightPixels - dp(90))
        addWindow(root, width, height, true)
        draggable(title)
    }

    override fun onDestroy() {
        removeWindow()
        super.onDestroy()
    }
}
