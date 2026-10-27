# Grupo Palmas MDM — Reglas ProGuard
-dontoptimize

-keep class com.palmas.mdm.** { *; }
-keep class * extends android.app.admin.DeviceAdminReceiver { *; }
-keep class androidx.security.crypto.** { *; }
-keep class android.app.admin.** { *; }
-keep class android.os.UserManager { *; }

# Paho MQTT — proteger de R8
-keep class org.eclipse.paho.** { *; }
-keep interface org.eclipse.paho.** { *; }
-keepclassmembers class org.eclipse.paho.client.mqttv3.** { *; }
-dontwarn org.eclipse.paho.**

-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
    public static int i(...);
}

-dontwarn javax.annotation.**
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.concurrent.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**