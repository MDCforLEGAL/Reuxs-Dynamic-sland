package com.reuxs.capsule

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

data class UpdateInfo(
    val available: Boolean = false,
    val currentVersion: String = BuildConfig.VERSION_NAME,
    val latestVersion: String? = null,
    val downloadUrl: String = "",
    val checked: Boolean = false,
    val error: String? = null
)

/**
 * Reads `https://api.github.com/repos/<OWNER>/<REPO>/releases/latest` (public,
 * no token, no secret) and compares the tag with the installed version.
 */
object UpdateChecker {

    private const val TAG = "ReuXsUpdate"

    suspend fun check(context: Context): UpdateInfo = withContext(Dispatchers.IO) {
        val owner = context.getString(R.string.reuxs_repo_owner)
        val repo = context.getString(R.string.reuxs_repo_name)
        val fallbackPage = "https://github.com/$owner/$repo/releases/latest"
        val apiUrl = "https://api.github.com/repos/$owner/$repo/releases/latest"

        var connection: HttpURLConnection? = null
        try {
            connection = (URL(apiUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("Accept", "application/vnd.github+json")
                setRequestProperty("User-Agent", "ReuXs-Android")
            }

            val code = connection.responseCode
            if (code != HttpURLConnection.HTTP_OK) {
                Log.w(TAG, "GitHub releases responded with HTTP $code")
                return@withContext UpdateInfo(checked = true, error = "HTTP $code", downloadUrl = fallbackPage)
            }

            val payload = connection.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(payload)
            val tag = json.optString("tag_name").removePrefix("v")
            val url = json.optString("html_url").ifBlank { fallbackPage }

            UpdateInfo(
                available = isNewer(tag, BuildConfig.VERSION_NAME),
                currentVersion = BuildConfig.VERSION_NAME,
                latestVersion = tag.ifBlank { null },
                downloadUrl = url,
                checked = true
            )
        } catch (error: IOException) {
            Log.w(TAG, "Update check failed: ${error.message}")
            UpdateInfo(checked = true, error = error.message, downloadUrl = fallbackPage)
        } catch (error: org.json.JSONException) {
            Log.w(TAG, "Update payload was not valid JSON: ${error.message}")
            UpdateInfo(checked = true, error = error.message, downloadUrl = fallbackPage)
        } finally {
            connection?.disconnect()
        }
    }

    /** Semver-ish comparison: returns true when `latest` is newer than `current`. */
    fun isNewer(latest: String, current: String): Boolean {
        if (latest.isBlank()) return false
        val left = latest.trim().removePrefix("v").split('.', '-', '+')
        val right = current.trim().removePrefix("v").split('.', '-', '+')
        for (index in 0 until maxOf(left.size, right.size)) {
            val leftNumber = left.getOrNull(index)?.toIntOrNull()
            val rightNumber = right.getOrNull(index)?.toIntOrNull()
            if (leftNumber != null && rightNumber != null) {
                if (leftNumber != rightNumber) return leftNumber > rightNumber
                continue
            }
            val order = (left.getOrNull(index) ?: "0").compareTo(right.getOrNull(index) ?: "0")
            if (order != 0) return order > 0
        }
        return false
    }
}
