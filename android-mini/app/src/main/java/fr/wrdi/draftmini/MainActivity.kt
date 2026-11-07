package fr.wrdi.draftmini

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.graphics.Color
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(30, 50, 30, 30)
            setBackgroundColor(Color.rgb(9, 22, 32))
        }
        root.addView(TextView(this).apply {
            text = "WR Draft Mini"
            textSize = 26f
            setTextColor(Color.rgb(111, 226, 210))
            gravity = Gravity.CENTER
        })
        root.addView(TextView(this).apply {
            text = "Bulle Android expérimentale. Active l'affichage par-dessus les autres applications puis ouvre la fenêtre."
            textSize = 15f
            setTextColor(Color.WHITE)
            setPadding(0, 22, 0, 22)
        })
        fun button(title: String, action: () -> Unit) {
            root.addView(Button(this).apply { text = title; setOnClickListener { action() } })
        }
        button("Autoriser la superposition") {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")))
        }
        button("Ouvrir WR Draft Mini") {
            if (!Settings.canDrawOverlays(this)) {
                startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")))
            } else {
                val i = Intent(this, OverlayService::class.java).apply {
                    action = OverlayService.ACTION_SHOW
                }
                if (Build.VERSION.SDK_INT >= 26) startForegroundService(i) else startService(i)
                moveTaskToBack(true)
            }
        }
        button("Fermer complètement la bulle") {
            startService(Intent(this, OverlayService::class.java).apply {
                action = OverlayService.ACTION_STOP
            })
        }
        setContentView(root)
    }
}
