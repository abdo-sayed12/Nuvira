import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/chat_models.dart';
import '../services/api_service.dart';
import '../theme/app_localization.dart';
import '../theme/app_theme.dart';

class ChatBubble extends StatefulWidget {
  final ChatMessage message;
  final String lang;
  final bool isSpeaking;
  final VoidCallback onToggleSpeak;
  final ValueChanged<String> onFeedbackChanged;
  final VoidCallback? onEditPrompt;

  const ChatBubble({
    super.key,
    required this.message,
    required this.lang,
    required this.isSpeaking,
    required this.onToggleSpeak,
    required this.onFeedbackChanged,
    this.onEditPrompt,
  });

  @override
  State<ChatBubble> createState() => _ChatBubbleState();
}

class _ChatBubbleState extends State<ChatBubble> {
  String _displayedText = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.message.role == 'assistant' && widget.message.animateTypewriter) {
      _startTypewriter();
    } else {
      _displayedText = widget.message.content;
    }
  }

  void _startTypewriter() {
    final full = widget.message.content;
    int index = 0;
    final step = (full.length / 80).ceil().clamp(3, 14);
    _timer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      index += step;
      if (index >= full.length) {
        setState(() {
          _displayedText = full;
          widget.message.animateTypewriter = false;
        });
        timer.cancel();
      } else {
        setState(() {
          _displayedText = full.substring(0, index);
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  List<TextSpan> _parseFormattedSpans(String text, bool isUser) {
    final List<TextSpan> spans = [];
    final regex = RegExp(r'\*\*(.+?)\*\*');
    int lastEnd = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }
      final boldContent = match.group(1) ?? '';
      final isHeader = boldContent.contains(':') && boldContent.length > 12;
      spans.add(
        TextSpan(
          text: boldContent,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: (!isUser && isHeader) ? AppTheme.turquoise : Colors.white,
            fontSize: (!isUser && isHeader) ? 14.8 : 14,
          ),
        ),
      );
      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }
    return spans;
  }

  @override
  Widget build(BuildContext context) {
    final isUser = widget.message.role == 'user';
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    final isMsgRtl = RegExp(r'[\u0600-\u06FF]').hasMatch(_displayedText);

    return Align(
      alignment: isUser ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 7),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * (isUser ? 0.82 : 0.94),
        ),
        decoration: BoxDecoration(
          gradient: isUser
              ? AppTheme.emeraldButtonGradient
              : AppTheme.webCardGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isUser
                ? Colors.transparent
                : AppTheme.turquoise.withOpacity(0.22),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.asset(
                        'assets/images/logo.png',
                        width: 20,
                        height: 20,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.verified_user,
                          color: AppTheme.turquoise,
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Nuvira Clinical AI',
                      style: TextStyle(
                        color: AppTheme.turquoise,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                ),
              ),
            if (widget.message.attachmentName != null && widget.message.attachmentName!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.attach_file_rounded, size: 15, color: AppTheme.turquoise),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        widget.message.attachmentName!,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            Directionality(
              textDirection: isMsgRtl ? TextDirection.rtl : TextDirection.ltr,
              child: SelectableText.rich(
                TextSpan(
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    height: 1.6,
                  ),
                  children: _parseFormattedSpans(_displayedText, isUser),
                ),
              ),
            ),
            if (!isUser && widget.message.sources.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(color: Colors.white12),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.message.sources.map((rawSrc) {
                  final formatted = rawSrc.contains('|||')
                      ? rawSrc
                      : ApiService.formatSourceEntry(rawTitle: rawSrc);
                  final parts = formatted.split('|||');
                  final label = parts.first;
                  final targetUrl = parts.length > 1 ? parts.last : 'https://www.who.int';

                  return ActionChip(
                    backgroundColor: const Color(0xFF092226),
                    side: BorderSide(color: AppTheme.turquoise.withOpacity(0.38)),
                    avatar: const Icon(Icons.open_in_new_rounded, size: 14, color: AppTheme.turquoise),
                    label: Text(
                      label,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.turquoise,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    onPressed: () async {
                      final uri = Uri.tryParse(targetUrl);
                      if (uri != null) {
                        await launchUrl(
                          uri,
                          mode: LaunchMode.externalApplication,
                          webOnlyWindowName: '_blank',
                        );
                      }
                    },
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isUser && widget.onEditPrompt != null)
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.edit_outlined, size: 16, color: Colors.white70),
                    onPressed: widget.onEditPrompt,
                  ),
                if (!isUser) ...[
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Read Aloud',
                    icon: Icon(
                      widget.isSpeaking ? Icons.stop_circle_outlined : Icons.volume_up_outlined,
                      size: 18,
                      color: widget.isSpeaking ? AppTheme.turquoise : Colors.white60,
                    ),
                    onPressed: widget.onToggleSpeak,
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Copy',
                    icon: const Icon(Icons.copy_rounded, size: 16, color: Colors.white60),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: widget.message.content));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(t('copied')),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
                  const Spacer(),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: Icon(
                      widget.message.feedback == 'like'
                          ? Icons.thumb_up_alt
                          : Icons.thumb_up_alt_outlined,
                      size: 17,
                      color: widget.message.feedback == 'like'
                          ? AppTheme.turquoise
                          : Colors.white54,
                    ),
                    onPressed: () {
                      widget.onFeedbackChanged('like');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(t('feedback_thanks')),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: Icon(
                      widget.message.feedback == 'dislike'
                          ? Icons.thumb_down_alt
                          : Icons.thumb_down_alt_outlined,
                      size: 17,
                      color: widget.message.feedback == 'dislike'
                          ? AppTheme.dangerRed
                          : Colors.white54,
                    ),
                    onPressed: () {
                      widget.onFeedbackChanged('dislike');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(t('feedback_thanks')),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
