package com.masrofy.app

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.widget.ScrollView
import android.widget.TextView

class CrashActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val error = intent.getStringExtra("error") ?: "حدث خطأ غير متوقع"
        val tv = TextView(this).apply {
            text = "تفاصيل الخطأ أثناء التشغيل:\n\n$error"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#1E293B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            setPadding(40, 60, 40, 60)
            setTextIsSelectable(true)
        }
        val scroll = ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#0F172A"))
            addView(tv)
        }
        setContentView(scroll)
    }
}
