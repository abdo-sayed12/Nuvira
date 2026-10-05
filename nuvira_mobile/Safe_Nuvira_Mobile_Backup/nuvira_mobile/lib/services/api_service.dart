import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chat_models.dart';

class ApiService {
  static const String _prefKeyUrl = 'nuvira_backend_url';
  static const String supabaseUrl = 'https://your-project.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3YmxmZXdpbnRqdmhnZGhkYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTEzMTAsImV4cCI6MjEwMzUyNzMxMH0.-Li2hjYySDeNDHOpMEhGX7dF0ISapR5AJjgjwW01pGI';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKeyUrl);
    if (saved != null && saved.trim().isNotEmpty) {
      return saved.trim().replaceAll(RegExp(r'/$'), '');
    }
    if (kIsWeb) return 'http://127.0.0.1:8000';
    return 'http://10.0.2.2:8000';
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKeyUrl, url.trim().replaceAll(RegExp(r'/$'), ''));
  }

  // تسجيل الدخول الحقيقي ومزامنة بيانات المستخدم من Supabase
  static Future<Map<String, String>> authenticateUser({
    required bool isLogin,
    required String email,
    required String password,
    String? fullName,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final rawUsers = prefs.getString('nuvira_users_db') ?? '{}';
    final Map<String, dynamic> localUsers = jsonDecode(rawUsers);

    if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
      final endpoint = isLogin
          ? '$supabaseUrl/auth/v1/token?grant_type=password'
          : '$supabaseUrl/auth/v1/signup';
      final res = await http
          .post(
            Uri.parse(endpoint),
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': 'Bearer $supabaseAnonKey',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'email': email,
              'password': password,
              if (!isLogin && fullName != null) 'data': {'full_name': fullName},
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        final token = (data['access_token'] ?? '').toString();
        final userObj = data['user'] ?? data;
        final userId = (userObj['id'] ?? email).toString();
        final meta = userObj['user_metadata'] ?? {};
        final resolvedName = (meta['full_name'] ?? fullName ?? email.split('@').first).toString();

        // استرجاع الشاتات المحفوظة سحابياً لهذا الحساب تحديداً
        if (meta['nuvira_cloud_sessions'] != null) {
          try {
            final cloudJson = jsonEncode(meta['nuvira_cloud_sessions']);
            await prefs.setString('chat_sessions_$email', cloudJson);
          } catch (_) {}
        }

        // محاولة جلب المحادثات من جداول Supabase (conversations / chat_sessions) إن وجدت
        if (token.isNotEmpty) {
          await _pullSupabaseTableChats(userId, email, token, prefs);
        }

        final userMap = {
          'id': userId,
          'name': resolvedName,
          'email': email,
          'token': token,
        };
        localUsers[email] = {'name': resolvedName, 'password': password, 'id': userId};
        await prefs.setString('nuvira_users_db', jsonEncode(localUsers));
        await prefs.setString('nuvira_active_user', jsonEncode(userMap));
        return userMap;
      } else {
        final errBody = jsonDecode(res.body);
        final msg = (errBody['error_description'] ?? errBody['msg'] ?? errBody['message'] ?? 'Invalid credentials').toString();
        throw Exception(msg);
      }
    }

    // التحقق الصارم في حالة العمل المحلي بدون Supabase
    if (isLogin) {
      if (!localUsers.containsKey(email) || localUsers[email]['password'] != password) {
        throw Exception('INVALID_CREDENTIALS');
      }
      final savedName = (localUsers[email]['name'] ?? email.split('@').first).toString();
      final userMap = {'id': email, 'name': savedName, 'email': email, 'token': ''};
      await prefs.setString('nuvira_active_user', jsonEncode(userMap));
      return userMap;
    } else {
      if (localUsers.containsKey(email)) {
        throw Exception('EMAIL_EXISTS');
      }
      final resolvedName = (fullName != null && fullName.isNotEmpty) ? fullName : email.split('@').first;
      localUsers[email] = {'name': resolvedName, 'password': password, 'id': email};
      final userMap = {'id': email, 'name': resolvedName, 'email': email, 'token': ''};
      await prefs.setString('nuvira_users_db', jsonEncode(localUsers));
      await prefs.setString('nuvira_active_user', jsonEncode(userMap));
      return userMap;
    }
  }

  static Future<void> _pullSupabaseTableChats(
    String userId,
    String email,
    String token,
    SharedPreferences prefs,
  ) async {
    try {
      final convRes = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/conversations?user_id=eq.$userId&select=*&order=updated_at.desc'),
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 5));

      if (convRes.statusCode == 200) {
        final List convs = jsonDecode(convRes.body);
        if (convs.isNotEmpty) {
          final List<ChatSession> loaded = [];
          for (final c in convs) {
            final cid = c['id'].toString();
            final title = (c['title'] ?? 'Medical Consultation').toString();
            final msgRes = await http.get(
              Uri.parse('$supabaseUrl/rest/v1/messages?conversation_id=eq.$cid&select=*&order=created_at.asc'),
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': 'Bearer $token',
              },
            );
            final List<ChatMessage> msgs = [];
            if (msgRes.statusCode == 200) {
              final List rawMsgs = jsonDecode(msgRes.body);
              for (final m in rawMsgs) {
                msgs.add(ChatMessage(
                  id: m['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
                  role: (m['role'] ?? 'assistant').toString(),
                  content: (m['content'] ?? '').toString(),
                  timestamp: DateTime.tryParse(m['created_at']?.toString() ?? '') ?? DateTime.now(),
                ));
              }
            }
            loaded.add(ChatSession(
              id: cid,
              title: title,
              messages: msgs,
              updatedAt: DateTime.tryParse(c['updated_at']?.toString() ?? '') ?? DateTime.now(),
            ));
          }
          if (loaded.isNotEmpty) {
            await prefs.setString(
              'chat_sessions_$email',
              jsonEncode(loaded.map((s) => s.toJson()).toList()),
            );
          }
        }
      }
    } catch (_) {}
  }

  // مزامنة وحفظ الشاتات والذكريات سحابياً في حساب المستخدم على Supabase
  static Future<void> syncSessionsToCloud(String email, List<ChatSession> sessions) async {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final activeRaw = prefs.getString('nuvira_active_user');
      if (activeRaw == null) return;
      final active = jsonDecode(activeRaw);
      final token = (active['token'] ?? '').toString();
      if (token.isEmpty) return;

      // حفظ آخر 15 محادثة كاملة داخل user_metadata في Supabase لضمان استرجاعها على أي جهاز فوراً
      final compactSessions = sessions.take(15).map((s) => s.toJson()).toList();
      await http.put(
        Uri.parse('$supabaseUrl/auth/v1/user'),
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'data': {
            'nuvira_cloud_sessions': compactSessions,
          }
        }),
      );
    } catch (_) {}
  }

  // بناء ذاكرة المستخدم الشاملة من جميع محادثاته السابقة (Cross-Session Memory)
  static List<Map<String, String>> buildUserMemoryHistory(
    List<ChatSession> allSessions,
    ChatSession currentSession,
  ) {
    final List<Map<String, String>> fullHistory = [];

    // 1. استخلاص أهم الحقائق الطبية والأسئلة السابقة من محادثات المستخدم الأخرى كذاكرة مستمرة
    final otherSessions = allSessions.where((s) => s.id != currentSession.id && s.messages.isNotEmpty).take(5);
    final List<String> memoryNotes = [];
    for (final s in otherSessions) {
      final userQuestions = s.messages.where((m) => m.role == 'user').map((m) => m.content).take(3).join(' | ');
      if (userQuestions.isNotEmpty) {
        memoryNotes.add('Previous consultation (${s.title}): $userQuestions');
      }
    }

    if (memoryNotes.isNotEmpty) {
      fullHistory.add({
        'role': 'user',
        'content': '[USER MEDICAL MEMORY FROM PREVIOUS CHATS: ${memoryNotes.join(" ; ")}]',
      });
      fullHistory.add({
        'role': 'assistant',
        'content': 'I have loaded your previous medical consultations and personal health context.',
      });
    }

    // 2. إضافة رسائل المحادثة الحالية
    for (int i = 0; i < currentSession.messages.length - 1; i++) {
      final m = currentSession.messages[i];
      fullHistory.add({'role': m.role, 'content': m.content});
    }

    return fullHistory;
  }

  static String detectQueryLanguage(String text, String fallbackUiLang) {
    if (RegExp(r'[\u0600-\u06FF]').hasMatch(text)) return 'ar';
    if (RegExp(r'[\u0400-\u04FF]').hasMatch(text)) return 'ru';
    if (RegExp(r'[\u4E00-\u9FFF]').hasMatch(text)) return 'zh';
    if (RegExp(r'[\u3040-\u30FF]').hasMatch(text)) return 'ja';
    if (RegExp(r'[\uAC00-\uD7AF]').hasMatch(text)) return 'ko';
    if (RegExp(r'[\u0900-\u097F]').hasMatch(text)) return 'hi';
    if (fallbackUiLang != 'ar') return fallbackUiLang;
    return 'en';
  }

  static String _languageName(String code) {
    switch (code.toLowerCase()) {
      case 'ar': return 'Arabic (العربية)';
      case 'fr': return 'French (Français)';
      case 'de': return 'German (Deutsch)';
      case 'es': return 'Spanish (Español)';
      case 'it': return 'Italian (Italiano)';
      case 'ru': return 'Russian (Русский)';
      case 'zh': return 'Chinese (中文)';
      case 'ja': return 'Japanese (日本語)';
      case 'ko': return 'Korean (한국어)';
      case 'hi': return 'Hindi (हिन्दी)';
      case 'tr': return 'Turkish (Türkçe)';
      default: return 'English';
    }
  }

  static String _normalizeAnswerLanguage(String answer, String targetLang) {
    if (targetLang == 'ar') return answer;
    final Map<String, Map<String, String>> headerTranslations = {
      'en': {
        'أولاً: إيه اللي بيحصل جوه جسمك؟': 'First: What is happening inside your body?',
        'ثانياً: الأسباب والاحتمالات الطبية': 'Second: Medical Causes & Possibilities',
        'ثالثاً: خطوات عملية فورية تريحك دلوقتي': 'Third: Immediate Practical Steps',
        'رابعاً: علامات تحذيرية تستدعي الكشف الطبي الفوري': 'Fourth: Red Flags Requiring Immediate Medical Care',
        'خامساً: سؤالين تشخيصيين عشان نمسك الخيط بالظبط': 'Fifth: Follow-up Diagnostic Questions',
      },
    };
    final map = headerTranslations[targetLang] ?? headerTranslations['en']!;
    String cleaned = answer;
    map.forEach((arHeader, translatedHeader) {
      cleaned = cleaned.replaceAll(arHeader, translatedHeader);
    });
    return cleaned;
  }

  static String formatSourceEntry({String? rawTitle, String? rawUrl}) {
    String title = (rawTitle ?? '').trim();
    String url = (rawUrl ?? '').trim();

    final urlMatch = RegExp(r'https?://[^\s\)\]]+').firstMatch('$url $title');
    if (urlMatch != null) {
      url = urlMatch.group(0)!;
    }

    String cleanLabel = title
        .replaceAll(RegExp(r'https?://[^\s]+'), '')
        .replaceAll('•', '')
        .replaceAll('📄', '')
        .replaceAll('Reference:', '')
        .replaceAll('مرجع:', '')
        .trim();

    if (cleanLabel.isEmpty && url.isNotEmpty) {
      cleanLabel = Uri.tryParse(url)?.host.replaceFirst('www.', '') ?? 'Medical Reference';
    }
    if (cleanLabel.length > 42) {
      cleanLabel = '${cleanLabel.substring(0, 42)}...';
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') || url.contains('localhost') || url.contains('127.0.0.1')) {
      final lower = title.toLowerCase();
      final query = Uri.encodeComponent(title.replaceAll(RegExp(r'[•📄]'), '').trim());

      if (lower.contains('aha') || lower.contains('american heart') || lower.contains('stroke association')) {
        url = 'https://www.ahajournals.org/action/doSearch?AllField=$query';
      } else if (lower.contains('nice') || lower.contains('health and care excellence')) {
        url = 'https://www.nice.org.uk/search?q=$query';
      } else if (lower.contains('who') || lower.contains('world health organization') || lower.contains('منظمة الصحة')) {
        url = 'https://www.who.int';
      } else if (lower.contains('mayo')) {
        url = 'https://www.mayoclinic.org';
      } else if (lower.contains('cdc') || lower.contains('disease control')) {
        url = 'https://www.cdc.gov';
      } else if (lower.contains('nih') || lower.contains('national institutes')) {
        url = 'https://www.nih.gov';
      } else if (lower.contains('cleveland')) {
        url = 'https://my.clevelandclinic.org';
      } else if (lower.contains('hopkins')) {
        url = 'https://www.hopkinsmedicine.org';
      } else if (lower.contains('cochrane')) {
        url = 'https://www.cochranelibrary.com';
      } else if (lower.contains('nhs')) {
        url = 'https://www.nhs.uk';
      } else if (lower.contains('medline')) {
        url = 'https://medlineplus.gov';
      } else if (lower.contains('ichd') || lower.contains('headache society')) {
        url = 'https://ichd-3.org';
      } else {
        url = 'https://pubmed.ncbi.nlm.nih.gov/?term=$query';
      }
    }

    return '${cleanLabel.isEmpty ? "Medical Source" : cleanLabel}|||$url';
  }

  static Future<Map<String, dynamic>> sendMessage({
    required String message,
    required List<Map<String, String>> historyPayload,
    required String lang,
    String? fileBase64,
    String? extractedFileText,
    String? fileName,
  }) async {
    final baseUrl = await getBaseUrl();
    final uri = Uri.parse('$baseUrl/api/chat');

    final targetLang = detectQueryLanguage(message, lang);
    final langName = _languageName(targetLang);

    String combinedMessage = message;
    if (extractedFileText != null && extractedFileText.trim().isNotEmpty) {
      combinedMessage = '$message\n\n[محتوى الملف المرفق ($fileName):\n$extractedFileText]';
    } else if (fileName != null && fileName.isNotEmpty) {
      combinedMessage = '$message\n\n[تم إرفاق ملف للتحليل الطبي: $fileName]';
    }

    final String enforcedMessage = targetLang == 'ar'
        ? '$combinedMessage\n\n[تعليمات صارمة: أجب بالكامل باللغة العربية الواضحة فقط (100% Arabic) في جميع الفقرات والعناوين والمراجع.]'
        : '$combinedMessage\n\n[STRICT INSTRUCTION: Write your ENTIRE response 100% in $langName ONLY. Translate all section headings into $langName.]';

    var response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'message': enforcedMessage,
            'conversation_id': null,
            'history': historyPayload,
            'file_base64': fileBase64,
          }),
        )
        .timeout(const Duration(seconds: 60));

    if (response.statusCode == 200) {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      String answer = (decoded['answer'] ?? decoded['response'] ?? decoded['reply'] ?? '').toString();
      answer = _normalizeAnswerLanguage(answer, targetLang);

      final List<String> extractedSources = [];
      if (decoded['sources'] is List) {
        for (final item in decoded['sources']) {
          if (item is Map) {
            final rawUrl = (item['url'] ?? item['link'] ?? item['href'] ?? '').toString();
            final rawTitle = (item['title'] ?? item['text'] ?? item['source'] ?? item['name'] ?? '').toString();
            if (rawUrl.isNotEmpty || rawTitle.isNotEmpty) {
              extractedSources.add(formatSourceEntry(rawTitle: rawTitle, rawUrl: rawUrl));
            }
          } else if (item is String && item.trim().isNotEmpty) {
            extractedSources.add(formatSourceEntry(rawTitle: item));
          }
        }
      }

      if (extractedSources.isEmpty) {
        final refLines = answer.split('\n').where((l) => l.contains('Reference:') || l.contains('📄'));
        for (final line in refLines) {
          extractedSources.add(formatSourceEntry(rawTitle: line));
        }
      }

      return {'answer': answer, 'sources': extractedSources};
    } else {
      throw Exception('HTTP ${response.statusCode}');
    }
  }

  static Future<Map<String, String>> detectEmergencyInfo() async {
    try {
      final res = await http
          .get(Uri.parse('http://ip-api.com/json/'))
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final country = (data['country'] ?? 'Egypt').toString();
        final code = (data['countryCode'] ?? 'EG').toString().toUpperCase();
        return {'country': country, 'number': _mapCountryToNumber(code, country)};
      }
    } catch (_) {}
    return {'country': 'Egypt', 'number': '123'};
  }

  static String _mapCountryToNumber(String code, String country) {
    switch (code) {
      case 'EG': return '123';
      case 'SA': return '997';
      case 'AE': return '998';
      case 'US':
      case 'CA': return '911';
      case 'GB':
      case 'UK': return '999';
      default:
        if (country.toLowerCase().contains('egypt')) return '123';
        return '112';
    }
  }
}
