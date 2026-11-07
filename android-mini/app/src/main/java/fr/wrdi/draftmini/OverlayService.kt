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

    private fun removeWindow() {
        val old = window
        window = null
        params = null
        if (old != null) runCatching { manager.removeView(old) }
        webView?.apply {
            stopLoading()
            loadUrl("about:blank")
            destroy()
        }
        webView = null
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
                            runCatching { manager.updateViewLayout(window, p) }
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
        removeWindow()
        expanded = false
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
        removeWindow()
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
        header.addView(action("−", "Réduire en bulle") { showBubble() },
            LinearLayout.LayoutParams(dp(43), dp(41)))
        val spacer = View(this)
        header.addView(spacer, LinearLayout.LayoutParams(dp(6), dp(1)))
        header.addView(action("×", "Fermer complètement") { stopSelf() },
            LinearLayout.LayoutParams(dp(43), dp(41)))
        root.addView(header)

        val browser = WebView(this).apply {
            setBackgroundColor(Color.rgb(9, 27, 38))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            webViewClient = object : WebViewClient() {
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
        root.addView(browser, LinearLayout.LayoutParams(-1, 0, 1f))
        val width = min(dp(355), resources.displayMetrics.widthPixels - dp(20))
        val height = min(dp(590), resources.displayMetrics.heightPixels - dp(90))
        addWindow(root, width, height, true)
        draggable(title)
    }

    override fun onDestroy() {
        removeWindow()
        super.onDestroy()
    }
}
