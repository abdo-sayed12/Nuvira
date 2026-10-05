import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../models/chat_models.dart';
import '../services/api_service.dart';
import '../theme/app_localization.dart';
import '../theme/app_theme.dart';
import '../widgets/aurora_background.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/emergency_modal.dart';
import 'auth_view.dart';
import 'sub_views.dart';

class ChatScreen extends StatefulWidget {
  final String lang;
  final ValueChanged<String> onLanguageChanged;

  const ChatScreen({
    super.key,
    required this.lang,
    required this.onLanguageChanged,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  // 0: Home, 1: Sources, 2: Safety, 3: Services, 4: Chat (Requires Auth), 5: Auth
  int _activePage = 0;
  bool _isAuthenticated = false;
  String _userName = '';
  String _userEmail = '';

  final List<ChatSession> _sessions = [];
  String? _currentSessionId;
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  bool _isLoading = false;

  // حالة الملف أو الصوت المرفق
  String? _attachedFileName;
  String? _attachedFileBase64;
  String? _extractedFileText;
  int? _attachedFileSizeKb;

  final FlutterTts _tts = FlutterTts();
  String? _speakingMsgId;
  final stt.SpeechToText _stt = stt.SpeechToText();
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _initApp();
  }

  // مفتاح تخزين خاص ومستقل لكل حساب مستخدم لمنع تداخل الشاتات نهائياً
  String get _storageKey =>
      _userEmail.isNotEmpty ? 'chat_sessions_${_userEmail.toLowerCase()}' : 'chat_sessions_guest';

  Future<void> _initApp() async {
    final prefs = await SharedPreferences.getInstance();
    final activeUserRaw = prefs.getString('nuvira_active_user');
    if (activeUserRaw != null) {
      try {
        final u = jsonDecode(activeUserRaw);
        _isAuthenticated = true;
        _userName = (u['name'] ?? '').toString();
        _userEmail = (u['email'] ?? '').toString().toLowerCase();
      } catch (_) {}
    }

    await _loadSessionsFromDisk();

    _tts.setCompletionHandler(() {
      if (mounted) setState(() => _speakingMsgId = null);
    });

    if (mounted) setState(() {});
  }

  Future<void> _loadSessionsFromDisk() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_storageKey);
    _sessions.clear();
    if (saved != null) {
      try {
        final List list = jsonDecode(saved);
        _sessions.addAll(list.map((e) => ChatSession.fromJson(Map<String, dynamic>.from(e))));
      } catch (_) {}
    }
    if (_sessions.isEmpty) {
      final initial = ChatSession(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: AppLocalization.tr(widget.lang, 'new_chat'),
        messages: [],
        updatedAt: DateTime.now(),
      );
      _sessions.add(initial);
    }
    _currentSessionId = _sessions.first.id;
  }

  ChatSession get _currentSession {
    return _sessions.firstWhere(
      (s) => s.id == _currentSessionId,
      orElse: () {
        final s = ChatSession(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: AppLocalization.tr(widget.lang, 'new_chat'),
          messages: [],
          updatedAt: DateTime.now(),
        );
        _sessions.insert(0, s);
        _currentSessionId = s.id;
        return s;
      },
    );
  }

  void _openChatProtected() {
    if (!_isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.emerald,
          content: Text(
            widget.lang == 'ar'
                ? '🔒 يرجى تسجيل الدخول أولاً للوصول لمحادثاتك وذكرياتك الطبية'
                : '🔒 Please sign in first to access your medical chats & memories',
          ),
        ),
      );
      setState(() => _activePage = 5);
      return;
    }
    setState(() => _activePage = 4);
  }

  void _createNewSession({bool save = true}) {
    if (!_isAuthenticated) {
      _openChatProtected();
      return;
    }
    final s = ChatSession(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: AppLocalization.tr(widget.lang, 'new_chat'),
      messages: [],
      updatedAt: DateTime.now(),
    );
    setState(() {
      _sessions.insert(0, s);
      _currentSessionId = s.id;
      _activePage = 4;
    });
    if (save) _saveSessions();
  }

  Future<void> _saveSessions() async {
    if (!_isAuthenticated || _userEmail.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_sessions.map((s) => s.toJson()).toList());
    await prefs.setString(_storageKey, encoded);
    // مزامنة سحابية فورية مع حساب المستخدم في Supabase
    await ApiService.syncSessionsToCloud(_userEmail, _sessions);
  }

  // إرفاق ملف حقيقي (PDF, صورة، نص، تحليل طبي) أو ملف صوتي وقراءته فعلياً
  Future<void> _pickAttachment({required bool audioOnly}) async {
    if (!_isAuthenticated) {
      _openChatProtected();
      return;
    }
    try {
      final result = await FilePicker.platform.pickFiles(
        type: audioOnly ? FileType.audio : FileType.any,
        withData: true,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        final bytes = file.bytes;
        if (bytes == null) return;

        final ext = (file.extension ?? '').toLowerCase();
        String mime = 'application/octet-stream';
        if (['png', 'jpg', 'jpeg', 'webp'].contains(ext)) {
          mime = 'image/${ext == "jpg" ? "jpeg" : ext}';
        } else if (ext == 'pdf') {
          mime = 'application/pdf';
        } else if (['mp3', 'wav', 'm4a', 'ogg'].contains(ext)) {
          mime = 'audio/$ext';
        } else if (['txt', 'md', 'csv', 'json'].contains(ext)) {
          mime = 'text/plain';
        }

        String? decodedText;
        if (['txt', 'md', 'csv', 'json', 'log', 'xml'].contains(ext)) {
          try {
            decodedText = utf8.decode(bytes, allowMalformed: true);
          } catch (_) {}
        }

        final b64 = 'data:$mime;base64,${base64Encode(bytes)}';

        setState(() {
          _attachedFileName = file.name;
          _attachedFileBase64 = b64;
          _extractedFileText = decodedText;
          _attachedFileSizeKb = (file.size / 1024).ceil();
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.emerald,
              content: Text(
                widget.lang == 'ar'
                    ? '📎 تم إرفاق وقراءة الملف بنجاح: ${file.name}'
                    : '📎 File attached & read successfully: ${file.name}',
              ),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.dangerRed,
            content: Text('تعذر قراءة الملف: $e'),
          ),
        );
      }
    }
  }

  Future<void> _sendMessage([String? preset]) async {
    if (!_isAuthenticated) {
      _openChatProtected();
      return;
    }

    String text = (preset ?? _inputCtrl.text).trim();
    if (text.isEmpty && _attachedFileName != null) {
      text = widget.lang == 'ar'
          ? 'يرجى قراءة وتحليل هذا المرفق الطبي بالتفصيل: $_attachedFileName'
          : 'Please analyze and explain this attached medical file in detail: $_attachedFileName';
    }
    if (text.isEmpty || _isLoading) return;

    if (_isListening) {
      await _stt.stop();
      setState(() => _isListening = false);
    }

    final currentFileName = _attachedFileName;
    final currentFileB64 = _attachedFileBase64;
    final currentFileText = _extractedFileText;

    _inputCtrl.clear();
    final session = _currentSession;
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      content: text,
      timestamp: DateTime.now(),
      attachmentName: currentFileName,
    );

    setState(() {
      _activePage = 4;
      _attachedFileName = null;
      _attachedFileBase64 = null;
      _extractedFileText = null;
      _attachedFileSizeKb = null;
      session.messages.add(userMsg);
      if (session.messages.length == 1) {
        session.title = text.length > 30 ? '${text.substring(0, 30)}...' : text;
      }
      session.updatedAt = DateTime.now();
      _isLoading = true;
    });
    _scrollToBottom();
    await _saveSessions();

    try {
      final memoryHistory = ApiService.buildUserMemoryHistory(_sessions, session);

      final result = await ApiService.sendMessage(
        message: text,
        historyPayload: memoryHistory,
        lang: widget.lang,
        fileBase64: currentFileB64,
        extractedFileText: currentFileText,
        fileName: currentFileName,
      );

      final aiMsg = ChatMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_ai',
        role: 'assistant',
        content: result['answer'] ?? '',
        timestamp: DateTime.now(),
        sources: List<String>.from(result['sources'] ?? []),
        animateTypewriter: true,
      );

      if (mounted) {
        setState(() {
          session.messages.add(aiMsg);
          _isLoading = false;
        });
        _scrollToBottom();
        await _saveSessions();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.dangerRed,
            content: Text('خطأ في الاتصال بالسيرفر: $e'),
          ),
        );
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 120), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _toggleSpeak(ChatMessage msg) async {
    if (_speakingMsgId == msg.id) {
      await _tts.stop();
      setState(() => _speakingMsgId = null);
    } else {
      await _tts.stop();
      final isArMsg = RegExp(r'[\u0600-\u06FF]').hasMatch(msg.content);
      final locale = isArMsg
          ? 'ar-EG'
          : AppLocalization.supportedLanguages
              .firstWhere(
                (l) => l.code == widget.lang,
                orElse: () => AppLocalization.supportedLanguages[1],
              )
              .ttsLocale;
      await _tts.setLanguage(locale);
      setState(() => _speakingMsgId = msg.id);
      await _tts.speak(msg.content);
    }
  }

  // تفعيل الإدخال الصوتي الحقيقي مع التعرّف على اللغة والتحديث الحي
  Future<void> _toggleMic() async {
    if (!_isAuthenticated) {
      _openChatProtected();
      return;
    }
    if (_isListening) {
      await _stt.stop();
      setState(() => _isListening = false);
      return;
    }

    try {
      final available = await _stt.initialize(
        onStatus: (status) {
          if ((status == 'done' || status == 'notListening') && mounted) {
            setState(() => _isListening = false);
          }
        },
        onError: (err) {
          if (mounted) {
            setState(() => _isListening = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: AppTheme.dangerRed,
                content: Text(
                  widget.lang == 'ar'
                      ? '🎙️ تأكد من السماح بصلاحية الميكروفون في المتصفح أو الهاتف (${err.errorMsg})'
                      : '🎙️ Please allow microphone permission (${err.errorMsg})',
                ),
              ),
            );
          }
        },
      );

      if (available) {
        final opt = AppLocalization.supportedLanguages.firstWhere(
          (l) => l.code == widget.lang,
          orElse: () => AppLocalization.supportedLanguages.first,
        );
        setState(() => _isListening = true);
        await _stt.listen(
          localeId: opt.ttsLocale,
          partialResults: true,
          listenMode: stt.ListenMode.dictation,
          onResult: (res) {
            if (mounted) {
              setState(() {
                _inputCtrl.text = res.recognizedWords;
                _inputCtrl.selection = TextSelection.fromPosition(
                  TextPosition(offset: _inputCtrl.text.length),
                );
              });
            }
          },
        );
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.dangerRed,
              content: Text(
                widget.lang == 'ar'
                    ? '🎙️ خدمة التعرف الصوتي غير مفعلة أو تحتاج صلاحية الميكروفون'
                    : '🎙️ Speech recognition unavailable or permission denied',
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isListening = false);
      }
    }
  }

  Future<void> _showServerDialog() async {
    final current = await ApiService.getBaseUrl();
    final ctrl = TextEditingController(text: current);
    if (!mounted) return;
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: Text(t('server_settings'), style: const TextStyle(fontSize: 15)),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'http://127.0.0.1:8000'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(t('cancel'))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
            onPressed: () async {
              await ApiService.setBaseUrl(ctrl.text);
              if (mounted) Navigator.pop(context);
            },
            child: Text(t('save')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(widget.lang, k);

    return Scaffold(
      key: _scaffoldKey,
      drawer: _buildSmartDrawer(t),
      appBar: AppBar(
        backgroundColor: AppTheme.spaceNavy.withOpacity(0.94),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        titleSpacing: 0,
        title: GestureDetector(
          onTap: () => setState(() => _activePage = 0),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 28,
                  height: 28,
                  errorBuilder: (_, __, ___) => const Icon(Icons.health_and_safety, color: AppTheme.turquoise),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  t('appName'),
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18.5),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        actions: [
          PopupMenuButton<String>(
            color: AppTheme.glassDark,
            onSelected: widget.onLanguageChanged,
            itemBuilder: (_) => AppLocalization.supportedLanguages
                .map((l) => PopupMenuItem(
                      value: l.code,
                      child: Text(
                        '🌐 ${l.name} (${l.code.toUpperCase()})',
                        style: TextStyle(
                          color: l.code == widget.lang ? AppTheme.turquoise : Colors.white,
                          fontWeight: l.code == widget.lang ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ))
                .toList(),
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 11),
              decoration: BoxDecoration(
                color: const Color(0xFF0B192C),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.12)),
              ),
              alignment: Alignment.center,
              child: Text(
                '🌐 ${widget.lang.toUpperCase()}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
              ),
            ),
          ),
          IconButton(
            tooltip: _isAuthenticated ? _userName : t('sign_in'),
            icon: Icon(
              _isAuthenticated ? Icons.verified_user_rounded : Icons.lock_outline_rounded,
              color: _isAuthenticated ? AppTheme.turquoise : Colors.white70,
              size: 21,
            ),
            onPressed: () => setState(() => _activePage = 5),
          ),
          IconButton(
            tooltip: t('emergency'),
            icon: const Icon(Icons.emergency_rounded, color: AppTheme.dangerRed),
            onPressed: () => EmergencyModal.show(context, widget.lang),
          ),
        ],
      ),
      body: AnimatedAuroraBackground(
        child: SafeArea(
          child: _buildBody(t),
        ),
      ),
    );
  }

  Widget _buildBody(String Function(String) t) {
    switch (_activePage) {
      case 0:
        return HomeView(
          lang: widget.lang,
          onStartChat: _openChatProtected,
          onExploreServices: () => setState(() => _activePage = 3),
        );
      case 1:
        return SourcesView(lang: widget.lang);
      case 2:
        return SafetyView(lang: widget.lang);
      case 3:
        return MedicalServicesView(lang: widget.lang);
      case 5:
        return _buildAuthGate();
      case 4:
      default:
        if (!_isAuthenticated) {
          return _buildAuthGate();
        }
        return _buildChatView(t);
    }
  }

  Widget _buildAuthGate() {
    return AuthView(
      lang: widget.lang,
      onAuthenticated: (name, email) async {
        setState(() {
          _isAuthenticated = true;
          _userName = name;
          _userEmail = email.toLowerCase();
          _activePage = 4;
        });
        await _loadSessionsFromDisk();
        if (mounted) setState(() {});
      },
    );
  }

  Widget _buildChatView(String Function(String) t) {
    final session = _currentSession;
    return Column(
      children: [
        Expanded(
          child: session.messages.isEmpty
              ? SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          gradient: AppTheme.webCardGradient,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(color: Colors.white.withOpacity(0.09)),
                        ),
                        child: Column(
                          children: [
                            Image.asset(
                              'assets/images/logo.png',
                              width: 46,
                              height: 46,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.auto_awesome,
                                color: AppTheme.turquoise,
                                size: 42,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              t('welcome_chat'),
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 14.5, height: 1.55),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: ['q1', 'q2', 'q3'].map((k) {
                          final q = t(k);
                          return ActionChip(
                            backgroundColor: AppTheme.cardBg,
                            side: BorderSide(color: AppTheme.turquoise.withOpacity(0.3)),
                            label: Text(q, style: const TextStyle(fontSize: 12.5, color: Colors.white)),
                            onPressed: () => _sendMessage(q),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  itemCount: session.messages.length + (_isLoading ? 1 : 0),
                  itemBuilder: (context, idx) {
                    if (idx == session.messages.length) {
                      return Container(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: AppTheme.webCardGradient,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.turquoise.withOpacity(0.35)),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                color: AppTheme.turquoise,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                t('thinking'),
                                style: const TextStyle(color: AppTheme.turquoise, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    final msg = session.messages[idx];
                    return ChatBubble(
                      key: ValueKey(msg.id),
                      message: msg,
                      lang: widget.lang,
                      isSpeaking: _speakingMsgId == msg.id,
                      onToggleSpeak: () => _toggleSpeak(msg),
                      onFeedbackChanged: (val) {
                        setState(() => msg.feedback = val);
                        _saveSessions();
                      },
                      onEditPrompt: msg.role == 'user'
                          ? () => setState(() => _inputCtrl.text = msg.content)
                          : null,
                    );
                  },
                ),
        ),
        // شريط حالة التسجيل الصوتي الحي
        if (_isListening)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppTheme.dangerRed.withOpacity(0.18),
            child: Row(
              children: [
                const Icon(Icons.graphic_eq_rounded, color: AppTheme.dangerRed, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.lang == 'ar'
                        ? '🎙️ جاري الاستماع لصوتك الآن... تحدث بوضوح'
                        : '🎙️ Listening to your voice... Speak clearly',
                    style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.bold),
                  ),
                ),
                TextButton(
                  onPressed: _toggleMic,
                  child: Text(
                    widget.lang == 'ar' ? 'إيقاف' : 'Stop',
                    style: const TextStyle(color: AppTheme.turquoise, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        // شريط معاينة الملف أو الصوت المرفق قبل الإرسال
        if (_attachedFileName != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              border: Border(top: BorderSide(color: AppTheme.turquoise.withOpacity(0.3))),
            ),
            child: Row(
              children: [
                const Icon(Icons.insert_drive_file_rounded, color: AppTheme.turquoise, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '$_attachedFileName (${_attachedFileSizeKb ?? 1} KB)',
                    style: const TextStyle(fontSize: 12.5, color: Colors.white, fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.close_rounded, size: 18, color: Colors.white70),
                  onPressed: () => setState(() {
                    _attachedFileName = null;
                    _attachedFileBase64 = null;
                    _extractedFileText = null;
                    _attachedFileSizeKb = null;
                  }),
                ),
              ],
            ),
          ),
        // شريط الإدخال السفلي مع أزرار: إرفاق ملف + إرفاق صوت + الميكروفون + الإرسال
        Container(
          padding: const EdgeInsets.fromLTRB(8, 8, 10, 10),
          decoration: BoxDecoration(
            color: AppTheme.darkNavy.withOpacity(0.96),
            border: const Border(top: BorderSide(color: Colors.white10)),
          ),
          child: Row(
            children: [
              IconButton(
                tooltip: widget.lang == 'ar' ? 'إرفاق ملف أو تقرير طبي (PDF / صورة / نص)' : 'Attach File (PDF / Image / Doc)',
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.attach_file_rounded, color: AppTheme.turquoise, size: 21),
                onPressed: () => _pickAttachment(audioOnly: false),
              ),
              IconButton(
                tooltip: widget.lang == 'ar' ? 'إرفاق ملف صوتي' : 'Attach Audio File',
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.audio_file_outlined, color: AppTheme.turquoise, size: 21),
                onPressed: () => _pickAttachment(audioOnly: true),
              ),
              IconButton(
                tooltip: widget.lang == 'ar' ? 'التحدث بالصوت' : 'Voice Input',
                visualDensity: VisualDensity.compact,
                icon: Icon(
                  _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                  color: _isListening ? AppTheme.dangerRed : Colors.white70,
                  size: 22,
                ),
                onPressed: _toggleMic,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: TextField(
                  controller: _inputCtrl,
                  minLines: 1,
                  maxLines: 3,
                  onSubmitted: (_) => _sendMessage(),
                  decoration: InputDecoration(
                    hintText: t('input_hint'),
                    filled: true,
                    fillColor: AppTheme.cardBg,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: AppTheme.turquoise.withOpacity(0.22)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: AppTheme.turquoise.withOpacity(0.22)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.emeraldButtonGradient,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.send_rounded, color: Colors.white, size: 19),
                  onPressed: () => _sendMessage(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSmartDrawer(String Function(String) t) {
    final pinnedSessions = _sessions.where((s) => s.isPinned).toList();
    final recentSessions = _sessions.where((s) => !s.isPinned).toList();

    return Drawer(
      backgroundColor: AppTheme.darkNavy,
      child: SafeArea(
        child: Column(
          children: [
            InkWell(
              onTap: () {
                Navigator.pop(context);
                setState(() => _activePage = 5);
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  gradient: AppTheme.webCardGradient,
                  border: Border(bottom: BorderSide(color: Colors.white12)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.emerald,
                      child: Text(
                        _isAuthenticated && _userName.isNotEmpty
                            ? _userName[0].toUpperCase()
                            : 'N',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isAuthenticated ? _userName : t('sign_in'),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
                          ),
                          Text(
                            _isAuthenticated ? _userEmail : t('tagline'),
                            style: const TextStyle(color: Colors.white60, fontSize: 11.5),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings_outlined, color: AppTheme.turquoise, size: 20),
                      onPressed: _showServerDialog,
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                    _createNewSession();
                  },
                  icon: const Icon(Icons.add_comment_outlined, size: 18),
                  label: Text(t('new_chat'), style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ),
            _drawerNavTile(0, Icons.home_rounded, t('nav_home')),
            _drawerNavTile(1, Icons.public_rounded, t('nav_sources')),
            _drawerNavTile(2, Icons.shield_rounded, t('nav_safety')),
            _drawerNavTile(3, Icons.medical_services_rounded, t('nav_services')),
            _drawerNavTile(4, _isAuthenticated ? Icons.chat_bubble_rounded : Icons.lock_person_rounded, t('nav_chat')),
            const Divider(color: Colors.white12),
            if (_isAuthenticated)
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    if (pinnedSessions.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: Text(
                          t('pinned'),
                          style: const TextStyle(color: AppTheme.turquoise, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                      ...pinnedSessions.map((s) => _sessionTile(s)),
                    ],
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: Text(
                        t('recent'),
                        style: const TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    ...recentSessions.map((s) => _sessionTile(s)),
                  ],
                ),
              )
            else
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      widget.lang == 'ar'
                          ? '🔒 سجل دخولك لعرض ومزامنة سجل محادثاتك وذكرياتك الطبية'
                          : '🔒 Sign in to sync & view your medical chat history',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white54, fontSize: 12.5),
                    ),
                  ),
                ),
              ),
            const Divider(color: Colors.white12, height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.dangerRed,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        EmergencyModal.show(context, widget.lang);
                      },
                      icon: const Icon(Icons.warning_amber_rounded, size: 17),
                      label: Text(t('emergency')),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: _isAuthenticated ? t('sign_out') : t('sign_in'),
                    icon: Icon(
                      _isAuthenticated ? Icons.logout : Icons.login,
                      color: AppTheme.turquoise,
                    ),
                    onPressed: () async {
                      if (_isAuthenticated) {
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.remove('nuvira_active_user');
                        setState(() {
                          _isAuthenticated = false;
                          _userName = '';
                          _userEmail = '';
                          _sessions.clear();
                          _activePage = 0;
                        });
                        if (mounted) Navigator.pop(context);
                      } else {
                        Navigator.pop(context);
                        setState(() => _activePage = 5);
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sessionTile(ChatSession s) {
    final selected = s.id == _currentSessionId && _activePage == 4;
    return ListTile(
      dense: true,
      selected: selected,
      selectedTileColor: AppTheme.turquoise.withOpacity(0.14),
      leading: Icon(
        s.isPinned ? Icons.push_pin : Icons.chat_outlined,
        size: 16,
        color: selected ? AppTheme.turquoise : Colors.white54,
      ),
      title: Text(
        s.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 13),
      ),
      onTap: () {
        setState(() {
          _currentSessionId = s.id;
          _activePage = 4;
        });
        Navigator.pop(context);
      },
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: Icon(
              s.isPinned ? Icons.push_pin : Icons.push_pin_outlined,
              size: 16,
              color: s.isPinned ? AppTheme.turquoise : Colors.white38,
            ),
            onPressed: () {
              setState(() => s.isPinned = !s.isPinned);
              _saveSessions();
            },
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: const Icon(Icons.delete_outline, size: 16, color: Colors.white38),
            onPressed: () {
              setState(() {
                _sessions.removeWhere((item) => item.id == s.id);
                if (_sessions.isEmpty) {
                  _sessions.add(ChatSession(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    title: AppLocalization.tr(widget.lang, 'new_chat'),
                    messages: [],
                    updatedAt: DateTime.now(),
                  ));
                }
                _currentSessionId = _sessions.first.id;
              });
              _saveSessions();
            },
          ),
        ],
      ),
    );
  }

  Widget _drawerNavTile(int pageIdx, IconData icon, String title) {
    final active = _activePage == pageIdx;
    return ListTile(
      dense: true,
      selected: active,
      selectedTileColor: AppTheme.turquoise.withOpacity(0.14),
      leading: Icon(icon, color: active ? AppTheme.turquoise : Colors.white70, size: 20),
      title: Text(
        title,
        style: TextStyle(
          color: active ? AppTheme.turquoise : Colors.white,
          fontWeight: active ? FontWeight.bold : FontWeight.normal,
          fontSize: 13.5,
        ),
      ),
      onTap: () {
        Navigator.pop(context);
        if (pageIdx == 4 && !_isAuthenticated) {
          _openChatProtected();
        } else {
          setState(() => _activePage = pageIdx);
        }
      },
    );
  }
}
