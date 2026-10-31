# ============================================================================
# ProGuard / R8 rules — MDTA Admin TWA
# ============================================================================
# Minification is disabled in app/build.gradle (minifyEnabled = false) because
# the app is a thin TWA wrapper with no app-side Java/Kotlin code: all runtime
# behaviour comes from the androidbrowserhelper library and the manifest.
# These rules are kept for completeness / future-proofing if minification is
# ever enabled.
# ============================================================================

# Keep the Trusted Web Activity helper classes intact (they are referenced by
# name from the AndroidManifest).
-keep class com.google.androidbrowserhelper.** { *; }

# Keep AndroidX browser / customtabs / core classes used at runtime.
-keep class androidx.browser.** { *; }
-keep class androidx.core.** { *; }

# Keep the launcher activities referenced from the manifest.
-keep class com.google.androidbrowserhelper.trusted.LauncherActivity { *; }
-keep class com.google.androidbrowserhelper.trusted.FocusActivity { *; }
